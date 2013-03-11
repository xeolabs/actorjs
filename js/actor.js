/**
 * @class An actor within a {@link ActorJS.Stage}
 * @param configs
 * @constructor
 */
ActorJS.Actor = function (configs) {

    configs = configs || {};

    this.id = configs.id || "";

    /* Path to this actor within the hierarchy
     */
    this.path = configs.parent && configs.parent.id != "" ? (configs.parent.path + configs.ctx.pathSeparator + this.id) : this.id;

    /* Parent actor
     */
    this._parent = configs.parent;

    /* True while the actor is loading - incoming calls are buffered while set
     */
    this._loading = false;

    /* Buffer incoming calls when set
     */
    this._locked = false;

    /* True when the actor has loaded
     */
    this._loaded = !!configs.loaded;

    /* Calls buffered while this actor is loading and/or locked
     */
    this._callBuffer = [];

    /* Subscriptions buffered while this actor is loading and/or locked
     */
    this._subsBuffer = [];

    /* Context shared among all actors
     */
    this._ctx = configs.ctx;

    /* Child actors
     */
    this._actors = {};

    /* Internally managed actor IDs
     */
    this._defaultActorIds = new ActorJS._Map("__");

    /* Holds the most recent publication for each topic
     */
    this._pubs = {};

    /* Map of subscriptions for each topic.
     */
    this._topicSubs = {};

    /* objects - objects of any type, put on the actor for use by child actors
     */
    this._objects = {};
};

/* Pool of reusable IDs for subscription handles
 */
ActorJS.Actor._subHandles = new ActorJS._Map();

/**
 * Grab lock, causing incoming calls to this actor to be buffered. This is typically done within
 * an actor constructor to prevent outside interference while it sets itself up. The lock may then
 * be released gain with {#unlock}.
 */
ActorJS.Actor.prototype.lock = function () {
    this._locked = true;
};

/**
 * Release lock previously acquired with {#lock}, causing buffered incoming calls to be executed if the actor is now loaded.
 */
ActorJS.Actor.prototype.unlock = function () {
    if (this._locked) {
        this._locked = false;
        if (this._loaded) { // Otherwise calls will un-buffer when load completes
            this._doBufferedCalls();
            this._doBufferedSubscriptions();
        }
    }
};

/**
 * Makes asynchronous call to a method on either this actor or a child
 *
 *
 * <p>Example - calling the actor's {@link #addActor} method:</p>
 *
 * <pre>
 * #call("addActor",{
 *     id: "myActor",
 *     type: "myType",
 *     someActorConfig: "foo",
 *     otherActorConfig: "bar"
 * });
 * </pre>
 *
 * <p>Example - calling the actor's {@link #removeActor} method:</p>
 *
 * <pre>
 * #call("removeActor", {
 *     id: "myActor"
 * });
 * </pre>
 *
 * <p>Example - calling a method on a child actor:</p>
 *
 * <pre>
 * #call("myActor.someMethod", {
 *     someMethodParam: "foo",
 *     otherMethodParam: "bar"
 * });
 * </pre>
 *
 * @param {String} method Name of method on either the actor or one of its actors
 * @param {JSON} params Params for target method
 * @return {actor} This actor
 */
ActorJS.Actor.prototype.call = function (method, params) {

    params = params || {};

    /* If actor locked or not yet loaded, then buffer the call until the actor is ready
     */
    if ((!this._loaded && !this._loading) || this._locked) {
        this._callBuffer.unshift({
            method:method,
            params:params
        });
        return this;
    }

    var slashIdx = method.indexOf(this._ctx.pathSeparator);

    if (slashIdx > 0) { // Path has at least one delimiter

        /* Try to drill down to a method on a child actor
         */
        var actorId = method.substr(0, slashIdx);
        var actor = this._actors[actorId];
        if (actor) {
            var subPath = method.substr(slashIdx + 1); // Strip actor ID
            actor.call(subPath, params);
        } else {
            if (this._parent) {
                this._parent.call(method, params); // Try to call method on parent actor
            } else {
                throw "method not found: " + method; // No matching child actor, and no parent
            }
        }

    } else { // Path has no delimiters

        /* Try to call method on this actor
         */
        var fn = this[method];
        if (!fn) {
            if (this._parent) { // Method not found on this actor - try calling it on parent actor
                this._parent.call(method, params);
            } else {
                throw "method not found: " + method;
            }
        } else {
            fn.call(this, params);
        }
    }

    return this;
};


/**
 * Adds an actor to this actor
 *
 * @param params
 * @param {String} params.type Actor type
 * @param {String} params.include Actor JSON include, which maps to a JSON fragment
 * @param {String} params.id ID for actor, unique among actors on this actor - falls back on the value of params.type when omitted
 * @param {String} params.existsOK When true and actor already exists, the call will be ignored without throwing an exception
 * @return {*} Proxy actor through which method calls may be made, deferred until the actor exists
 * @throws exception If actor already added and existsOK not true
 */
ActorJS.Actor.prototype.addActor = function (params) {

    if (!params) {
        throw "argument expected: params";
    }

    var actorId = params.id;

    if (actorId) {
        if (this._actors[actorId]) { // Actor already exists
            if (params.existsOK) {
                return actorId;
            }
            throw "actor already added: " + actorId;
        }
    }

    if (!actorId) {
        actorId = this._defaultActorIds.addItem({}); // Automatic actor ID
    }

    if (!params.type && !params.include) {
        throw "param expected: type or include";
    }

    var taskId = actorId + ".create"; // Notify start of actor creation
    this.publish("task.started", {
        taskId:taskId,
        description:"Creating actor '" + actorId + "'"
    });

    var actor = new ActorJS.Actor({ // Create actor core, to augment with constructor when that's loaded
        id:actorId,
        parent:this,
        ctx:this._ctx
    });
    this._actors[actorId] = actor;

    var self = this;

    if (params.include) { // Load included JSON
        this._ctx.loadInclude(params.include,
            function (json) {
                var type = json.type; // Root of include cannot itself be an include - can only be a type
                if (!type) {
                    throw "param expected: type";
                }
                self._ctx.loadType(type,
                    function (clazz) {
                        actor._construct(clazz, json);
                    },
                    error); // Load actor class for JSON root node
            },
            function (err) {
                error("failed to include actor " + params.include + ": " + err);
            });
        return;

    } else {

        this._ctx.loadType(params.type, // Load type constructor
            function (clazz) {
                actor._construct(clazz, params);
            },
            function (err) {
                error("failed to add actor type " + params.type + ": " + err);
            });
    }

    function error(err) {
        self.publish("task.failed", {
            taskId:taskId,
            error:err
        });
        self.publish("error", {
            error:err
        });
    }

    return actorId;
};


ActorJS.Actor.prototype._construct = function (clazz, params) {

    var cfg = {
        id:this.id
    };

    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            cfg[key] = params[key]
        }
    }

    try {

        /* Call type constructor, which is more like an initialisation
         * method than a constructor, where it augments the new actor
         * instance with type-specific methods etc.
         */
        this._loading = true; // Don't buffer calls on actor made by its constructor

        clazz.call(this, cfg);

        /**
         * Add child actors
         */
        if (params.actors) {
            var actors = params.actors;
            for (var i = 0, len = actors.length; i < len; i++) {
                this.call("addActor", actors[i]);
            }
        }

        this._loading = false;

    } catch (err) {

        self.publish("task.failed", {
            taskId:this.path,
            error:err
        });

        self.publish("error", {
            error:err
        });

        return;
    }

    this._loaded = true;

    if (!this._locked) {
        this._doBufferedCalls();
        this._doBufferedSubscriptions();
    }

    this.publish("task.finished", {
        taskId:this.path
    });
};

/**
 * Execute calls on this actor that have been buffered while the actor was loading and/or locked
 * @private
 */
ActorJS.Actor.prototype._doBufferedCalls = function () {
    var call;
    while (this._callBuffer.length > 0) {
        call = this._callBuffer.pop();
        this.call(call.method, call.params);
    }
};

/**
 * Execute subscriptions on this actor that have been buffered while the actor was loading and/or locked
 * @private
 */
ActorJS.Actor.prototype._doBufferedSubscriptions = function () {
    var sub;
    while (this._subsBuffer.length > 0) {
        sub = this._subsBuffer.pop();
        this._subscribe(sub.topic, sub.handler, sub.handle);
    }
};

/**
 * Deletes a child actor. Fails silently if actor not found.
 *
 * @param {Object} params
 * @param {String} params.id ID of actor to remove
 */
ActorJS.Actor.prototype.removeActor = function (params) {
    var actorId = params.id;
    if (!actorId) {
        throw "param expected: id";
    }
    var actor = self._actors[actorId];
    if (!actor) {
        return;
    }
    if (actor._destroy) {
        actor._destroy();
    }
    delete this._actors[actorId];
    if (this._defaultActorIds.items[actorId]) {
        this._defaultActorIds.removeItem(actorId);
    }
};

/**
 * Subscribe to a topic on this actor and returns a handle to the subscription. Before the handle is
 * returned, the subscription is immediately notified of the most recent publication on the topic,
 * if one exists.
 *
 * @param {String} topic Topic name - "*" to subscribe to all topics on this actor
 * @param {Function} handler Topic handler
 * @return {String} Subscription handle
 */
ActorJS.Actor.prototype.subscribe = function (topic, handler) {
    var handle = ActorJS.Actor._subHandles.addItem({
        topic:topic
    });
    for (var actor = this; actor; actor = actor._parent) {
        actor._subscribe(topic, handler, handle);
    }
    return handle;
};

ActorJS.Actor.prototype._subscribe = function (topic, handler, handle) { // TODO: handle workers

    var slashIdx = topic.indexOf(this._ctx.pathSeparator);

    if (slashIdx > 0) {

        var actorId = topic.substr(0, slashIdx);
        var actor = this._actors[actorId];

        /* Buffer subscription if actor not yet existing
         */
        if (!actor) {
            this._subsBuffer.unshift({
                topic:topic,
                handler:handler,
                handle:handle
            });
        } else {
            actor._subscribe(topic.substr(slashIdx + 1), handler, handle);
        }

    } else {

        var subs = this._topicSubs[topic];
        if (!subs) {
            subs = {           // Subscriptions for this event topic
                handlers:{}, // Handler function for each subscriber
                numSubs:0                      // Count of subscribers for the event topic
            };
            this._topicSubs[topic] = subs;
        }

        subs.handlers[handle] = handler;
        subs.numSubs++;                     // Bump count of subscribers to the event

        var pub = this._pubs[topic];
        if (pub) {
            handler(pub);
        }
    }

    return handle;
};

/**
 * Unsubscribe to an event on this actor
 * @param {String} handle Subscription handle
 */
ActorJS.Actor.prototype.unsubscribe = function (handle) {
    var sub = ActorJS.Actor._subHandles.items[handle];
    if (sub) {
        ActorJS.Actor._subHandles.removeItem(handle);
        var topic = sub.topic;
        this._unsubscribe(topic, handle);
    }
    for (var actor = this; actor; actor = actor._parent) {
        actor._unsubscribe(topic, handle);
    }
};

ActorJS.Actor.prototype._unsubscribe = function (topic, handle) {
    var slashIdx = topic.indexOf(this._ctx.pathSeparator);
    if (slashIdx > 0) {
        var actorId = topic.substr(0, slashIdx);
        var actor = this._actors[actorId];
        if (actor) {
            actor._unsubscribe(topic.substr(slashIdx + 1), handle);
        }
    } else {
        var subs = this._topicSubs[topic];
        if (subs) {
            delete subs.handlers[handle];
            subs.numSubs--;
        }
    }
};

/**
 * Publishes a topic on the actor
 *
 * @param {String} method Name of topic
 * @param {Object} params Optional params for publication.
 */
ActorJS.Actor.prototype.publish = function (topic, params) {

    params = params || {};

    this._pubs[topic] = params;

    var subs = this._topicSubs[topic];

    if (subs) {
        if (subs.numSubs > 0) {             // Don't handle if no subscribers
            var handlers = subs.handlers;
            for (var handle in handlers) {
                if (handlers.hasOwnProperty(handle)) {
                    handlers[handle](params, topic);
                }
            }
        }
    }
};

/**
 * Adds a object for use by child actors
 * @param {String} objectId
 * @param {Object} object
 */
ActorJS.Actor.prototype.setResource = function (objectId, object) {
    if (this._objects[objectId]) {
        throw "object already exists: " + objectId;
    }
    if (object) {
        this._objects[objectId] = object;
    } else {
        delete this._objects[objectId];
    }
};

/**
 * Gets a resource provided via the parent actor
 * @param {String} objectId
 */
ActorJS.Actor.prototype.getResource = function (objectId) {
    var object;
    for (var actor = this._parent; actor && !object; actor = actor._parent) {
        object = actor._objects[objectId];
    }
    return object;
};

/**
 * Deletes actors, subscriptions and child actors
 */
ActorJS.Actor.prototype.clear = function () {
    for (var actorId in this._actors) {
        if (this._actors.hasOwnProperty(actorId)) {
            this.removeActor({ id:actorId }); // Calls actor destructors
        }
    }
    this._topicSubs = {};
    ActorJS.Actor._subHandles.clear();
    for (var actorId in this._actors) {
        if (this._actors.hasOwnProperty(actorId)) {
            this.removeActor({ id:actorId });
        }
    }
};