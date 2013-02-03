/**
 * RequireJS module which returns ActorJS instances
 */
define([
    "./actor"
],
    function (Actor) {

        return new (function () {

            var actorClassPath = "";

            var actorClassLoader = {

                load:function (type, ok, error) {
                    require([actorClassPath + type], ok, error);
                },

                getActorClassPath:function () {
                    return actorClassPath;
                }
            };

            var actor = new Actor({
                actorId:"",
                actorClassLoader:actorClassLoader,
                inNewThread:false,
                scenes:{},
                loaded:true
            });

            this.configure = function (params) {
                actorClassPath = params.actorClassPath || "";
            };

            this.addActor = function (params) {
                actor.addActor(params);
            };

            this.removeActor = function (params) {
                actor.removeActor(params);
            };

            this.call = function (method, params) {
                return actor.call(method, params);
            };

            this.subscribe = function (topic, handler) {
                return actor.subscribe(topic, handler);
            };

            this.publish = function (topic, params) {
                return actor.publish(topic, params);
            };

            this.unsubscribe = function (handle) {
                return actor.unsubscribe(handle);
            };

            this.setObject = function (resourceId, resource) {
                return actor.setObject(resourceId, resource);
            };

            this.getObject = function (resourceId) {
                return actor.getObject(resourceId);
            };
        })();
    });