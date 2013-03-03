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

            this._actor = new Actor({ // Making root actor a property helps with debugging the actor hierarchy
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
                this._actor.addActor(params);
            };

            this.removeActor = function (params) {
                this._actor.removeActor(params);
            };

            this.call = function (method, params) {
                return this._actor.call(method, params);
            };

            this.subscribe = function (topic, handler) {
                return this._actor.subscribe(topic, handler);
            };

            this.publish = function (topic, params) {
                return this._actor.publish(topic, params);
            };

            this.unsubscribe = function (handle) {
                return this._actor.unsubscribe(handle);
            };

            this.setResource = function (resourceId, resource) {
                return this._actor.setResource(resourceId, resource);
            };

            this.getResource = function (resourceId) {
                return this._actor.getResource(resourceId);
            };
        })();
    });