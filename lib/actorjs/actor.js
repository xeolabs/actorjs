/**
 *
 */
define([
    "./map"
],

    function (Map) {

        /* Pool of reusable IDs for subscription handles
         */
        var subscriptionHandles = new Map();


        var Actor = function (configs) {

            configs = configs || {};

            this.actorId = configs.actorId || "";

            /* Path to this actor within the hierarchy
             */
            this.path = configs.parent && configs.parent.actorId != "" ? (configs.parent.path + configs.ctx.pathSeparator + this.actorId) : this.actorId;

            /* Parent actor
             */
            this._parent = configs.parent;

            /*
             */
            this._loading = false;

            /* Buffer incoming calls when set
             */
            this._locked = false;

            /*
             */
            this._loaded = !!configs.loaded;

            /* Calls buffered while this actor is loading
             */
            this._callBuffer = [];

            /* Subscriptions buffered while this actor is loading
             */
            this._subsBuffer = [];


            this._ctx = configs.ctx;

            /* Actor constructors
             */
            this._types = {};

            /* Child actors
             */
            this._actors = {};

            /* Internally managed actor IDs
             */
            this._defaultActorIds = new Map("__");

            /* Holds the most recent publication for each topic
             */
            this._publications = {};

            /* Map of subscriptions for each topic.
             */
            this._topicSubs = {};

            /* objects - objects of any type, put on the actor for use by child actors
             */
            this._objects = {};

            this.inNewThread = configs.inNewThread || configs.newThread;
        };

        /**
         * Grab lock, causing buffering of incoming calls while held
         */
        Actor.prototype.lock = function () {
            this._locked = true;
        };

        /**
         * Release lock, and if actor is loaded, execute buffered calls
         */
        Actor.prototype.unlock = function () {
            if (this._locked) {
                this._locked = false;
                if (this._loaded) { // Otherwise calls will un-buffer when load completes
                    this._doBufferedCalls();
                    this._doBufferedSubscriptions();
                }
            }
        };

        /**
         * Makes asynchronous call to a method on either the actor or a target actor
         *
         *
         * <p>Example - calling the actor's {@link #addActor} method:</p>
         *
         * <pre>
         * #call("addActor",{
                *      type: "myType",
                *      id: "myActorInstance",
                *      someActorConfig: "foo",
                *      otherActorConfig: "bar"
                * });
         * </pre>
         *
         * <p>Example - calling the actor's {@link #removeActor} method:</p>
         *
         * <pre>
         * #call("removeActor", {
                *      id: "myActorInstance"
                 * });
         * </pre>
         *
         * <p>Example - calling a method on an actor:</p>
         *
         * <pre>
         * #call("myActorInstance.someMethod", {
                *              someMethodParam: "foo",
                *              otherMethodParam: "bar"
                * });
         * </pre>
         *
         * @param {String} method Name of method on either the actor or one of its actors
         * @param {JSON} params Params for target method
         * @return {actor} This actor
         */
        Actor.prototype.call = function (method, params) {

            params = params || {};

            /*-----------------------------------------------------------------------------------
             * If actor locked or not yet loaded, then buffer the call until the actor is ready
             *---------------------------------------------------------------------------------*/

            if ((!this._loaded && !this._loading) || this._locked) {

                this._callBuffer.unshift({
                    method:method,
                    params:params
                });

                return this;
            }

            var slashIdx = method.indexOf(this._ctx.pathSeparator);

            if (slashIdx > 0) { // Calling child actor

                var actorId = method.substr(0, slashIdx);

                var actor = this._actors[actorId];

                /*----------------------------------------------------------------------------
                 * Call method on actor
                 *--------------------------------------------------------------------------*/

                if (actor) {


                    /* Actor in Worker
                     */
                    if (actor.worker) {

                        actor.worker.postMessage({
                            action:"call",
                            method:method,
                            params:params
                        });

                        return this;
                    }

                    var subPath = method.substr(slashIdx + 1);
                    var slashIdx2 = subPath.indexOf(this._ctx.pathSeparator);
                    var actorMethod = (slashIdx2 > 0) ? subPath.substr(slashIdx2 + 1) : subPath;

                    actor.call(subPath, params);

                } else {

                    if (this._parent) {

                        /* Actor not found - calling a parent actor
                         */
                        this._parent.call(method, params);

                    } else {

                        throw "method not found: " + method;
                    }
                }

            } else {


                /* No slash in method name - calling a method on this actor
                 */

                var fn = this[method];

                if (!fn) {

                    if (this._parent) {

                        /* Actor not found - calling a parent actor
                         */
                        this._parent.call(method, params);

                        return;

                    } else {

                        throw "method not found: " + method;
                    }

                    //throw "method not found on actor '" + this.actorId + "': " + method;

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
         * @param {String} params.type Actor type, which maps to a RequireJS module filename
         * @param {String} params.id ID for actor, unique among actors on this actor - falls back on the value of params.type when omitted
         * @param {String} params.existsOK When true and actor already exists, the call will be ignored without throwing an exception
         * @return {*} Proxy actor through which method calls may be made, deferred until the actor exists
         * @throws exception If actor already exists and existsOK not true
         */
        Actor.prototype.addActor = function (params) {

            var actorId = this._addActor(params);

            if (params.actors) {

                var actors = params.actors;

                for (var i = 0, len = actors.length; i < len; i++) {
                    this.call(actorId + ".addActor", actors[i]);
                }
            }
        };

        Actor.prototype._addActor = function (params) {

            if (!params) {
                throw "argument expected: params";
            }

            var type = params.type;

            if (!type) {
                throw "param expected: type";
            }

            var actorId = params.actorId;

            if (!actorId) {

                actorId = this._defaultActorIds.addItem({}); // Automatic actor ID

            } else {

                if (this._actors[actorId]) {
                    if (params.existsOK) {
                        return actorId;
                    }

                    throw "actor already exists: " + actorId;
                }
            }


            var taskId = actorId + ".create";

            this.publish("task.started", {
                taskId:taskId,
                description:"Creating actor '" + actorId + "'"
            });

            var actor = new Actor({
                actorId:actorId,
                parent:this,
                ctx:this._ctx,
                inNewThread:this.inNewThread
            });

            this._actors[actorId] = actor;

            /* Add a Worker actor
             */
            if (params.worker) {

                params.worker = false;

                actor.worker = new Worker("../js/worker.js");

                /* Configure the worker's ActorJS instance
                 */
                actor.worker.postMessage({
                    action:"configure",
                    configs:{
                        actorClassPath:this._ctx.actorClassPath
                    }
                });

                /* Create the actor in the worker's ActorJS instance
                 */

                var t = params.actorId; // Don't alter the params
                params.actorId = actorId;

                actor.worker.postMessage({
                    action:"call",
                    method:"addActor",
                    params:params
                });

                params.actorId = t;

                /* Distribute remote publications locally
                 */
                actor.worker.onmessage = function (event) {

                    var data = event.data;
                    var type = data.type;

                    switch (type) {
                        case "publish":
                            actor.publish(data.topic, data.params);
                            break;
                    }
                };

                this.publish("task.finished", {
                    taskId:taskId
                });

            } else {  // not in worker

                var self = this;

                this._loadActorClass(
                    type,
                    function (clazz) {

                        var cfg = {
                            actorId:actorId
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
                            actor._loading = true; // Don't buffer calls on actor made by its constructor

                            clazz.call(actor, cfg);

                            actor._loading = false;

                        } catch (err) {

                            self.publish("task.failed", {
                                taskId:taskId,
                                error:err
                            });

                            self.publish("error", {
                                error:err
                            });

                            return;

                        }

                        actor._loaded = true;

                        if (!actor._locked) {

                            actor._doBufferedCalls();
                            actor._doBufferedSubscriptions();
                        }

                        self.publish("task.finished", {
                            taskId:taskId
                        });
                    },
                    function (err) {

                        self.publish("task.failed", {
                            taskId:taskId,
                            error:err
                        });

                        self.publish("error", {
                            error:err
                        });
                    });
            }

            return actorId;
        };

        Actor.prototype._loadActorClass = function (type, ok, error) {

            var clazz = this._types[type];

            if (clazz) {
                ok(clazz);
                return;
            }

            var self = this;

            self._ctx.load(type,
                function (clazz) {

                    self._types[type] = clazz;

                    ok(clazz);
                },
                function (err) {
                    error("failed to add actor type " + type + ": " + err);
                })
        };


        Actor.prototype._doBufferedCalls = function () {
            var call;
            while (this._callBuffer.length > 0) {
                call = this._callBuffer.pop();
                this.call(call.method, call.params);
            }
        };


        Actor.prototype._doBufferedSubscriptions = function () {
            var sub;
            while (this._subsBuffer.length > 0) {
                sub = this._subsBuffer.pop();
                this._subscribe(sub.topic, sub.handler, sub.handle);
            }
        };


        /**
         * Deletes an actor. Silently ignores if actor does not exist.
         *
         * @param {String} actorId ID of target actor
         */
        Actor.prototype.removeActor = function (params) {

            var actorId = params.actorId;

            if (!actorId) {
                throw "param expected: actorId";
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
        Actor.prototype.subscribe = function (topic, handler) {

            var handle = subscriptionHandles.addItem({
                topic:topic
            });

            for (var actor = this; actor; actor = actor._parent) {
                actor._subscribe(topic, handler, handle);
            }

            return handle;
        };

        Actor.prototype._subscribe = function (topic, handler, handle) { // TODO: handle workers

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

                var publication = this._publications[topic];

                if (publication) {
                    handler(publication);
                }
            }

            return handle;
        };


        /**
         * Unsubscribe to an event on this actor
         * @param {String} handle Subscription handle
         */
        Actor.prototype.unsubscribe = function (handle) {

            var sub = subscriptionHandles.items[handle];

            if (sub) {

                subscriptionHandles.removeItem(handle);

                var topic = sub.topic;

                this._unsubscribe(topic, handle);
            }


            for (var actor = this; actor; actor = actor._parent) {
                actor._unsubscribe(topic, handle);
            }
        };


        Actor.prototype._unsubscribe = function (topic, handle) {

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
        Actor.prototype.publish = function (topic, params) {

            params = params || {};

            this._publications[topic] = params;

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

            /* Notify wildcard subscriptions
             */

            subs = this._topicSubs["*"];

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
        Actor.prototype.setResource = function (objectId, object) {

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
        Actor.prototype.getResource = function (objectId) {

            var object;

            for (var actor = this._parent; actor && !object; actor = actor._parent) {
                object = actor._objects[objectId];
            }

            return object;
        };


        /**
         * Deletes actors, subscriptions and child actors
         */
        Actor.prototype.clear = function () {

            this._types = {};

            for (var actorId in this._actors) {
                if (this._actors.hasOwnProperty(actorId)) {
                    this.removeActor({ actorId:actorId }); // Calls actor destructors
                }
            }

            this._topicSubs = {};

            subscriptionHandles.clear();

            for (var actorId in this._actors) {
                if (this._actors.hasOwnProperty(actorId)) {
                    this.removeActor({ actorId:actorId });
                }
            }
        };

        return Actor;

    });