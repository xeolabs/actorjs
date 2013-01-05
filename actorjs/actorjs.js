/**
 *
 */
define([
    "./actor"
],
    function (Actor) {

        window.ActorJS = new function () {

            var actorClassPath = "";

            var actorClassLoader = function (type, ok, error) {
                require([actorClassPath + type], ok, error);
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
                actor.addActor(params, true);
            };

            this.removeActor = function (params) {
                actor.removeActor(params, true);
            };

            this.call = function (method, params) {
                return actor.call(method, params, true);
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
        };
    });