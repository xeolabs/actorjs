/**
 * @class Container for {@link ActorJS.Actor}s
 * @param ctx
 * @constructor
 */
ActorJS.Stage = function (ctx) {
    this._actor = new ActorJS.Actor({
        id:"",
        ctx:ctx,
        inNewThread:false,
        loaded:true
    });
};

ActorJS.Stage.prototype.addActor = function (params) {
    this._actor.addActor(params);
};

ActorJS.Stage.prototype.removeActor = function (params) {
    this._actor.removeActor(params);
};

ActorJS.Stage.prototype.call = function (method, params) {
    return this._actor.call(method, params);
};

ActorJS.Stage.prototype.subscribe = function (topic, handler) {
    return this._actor.subscribe(topic, handler);
};

ActorJS.Stage.prototype.publish = function (topic, params) {
    return this._actor.publish(topic, params);
};

ActorJS.Stage.prototype.unsubscribe = function (handle) {
    return this._actor.unsubscribe(handle);
};

ActorJS.Stage.prototype.setResource = function (resourceId, resource) {
    return this._actor.setResource(resourceId, resource);
};

ActorJS.Stage.prototype.getResource = function (resourceId) {
    return this._actor.getResource(resourceId);
};