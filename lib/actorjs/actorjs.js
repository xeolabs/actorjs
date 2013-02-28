/**
 *
 */
define([
    "./actor"
],
    function (Actor) {

        return new (function () {

            var ctx = new (function () {

                this.load = function (type, ok, error) {

                    var path = (this.actorClassPath + type);

                    if (this.pathSeparator == ".") {
                        path = path.replace(/\./g, "/");
                    }

                    require([path], ok, error);
                };

                this.actorClassPath = "";
                this.pathSeparator = ".";
            })();

            var actor = new Actor({
                actorId:"",
                ctx:ctx,
                inNewThread:false,
                scenes:{},
                loaded:true
            });

            /**
             * Configures ActorJS
             * @param params
             * @param {String} params.pathSeparator Delimiter char for paths to actor types, instances, methods and topics: '.' (default) or '/'
             * @param {String} params.actorClassPath
             */
            this.configure = function (params) {

                var pathSeparator = params.pathSeparator;

                if (pathSeparator) {
                    if (pathSeparator != "/" && pathSeparator != ".") {
                        throw "Only '.' and '/' pathSeparator chars are currently supported";  // TODO - generalise
                    }
                    ctx.pathSeparator = pathSeparator;
                }

                ctx.actorClassPath = params.actorClassPath || ctx.actorClassPath;
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

            this.setResource = function (resourceId, resource) {
                return actor.setResource(resourceId, resource);
            };

            this.getResource = function (resourceId) {
                return actor.getResource(resourceId);
            };
        })();
    });