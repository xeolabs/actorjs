/**
 *
 */
define([
    "./actor"
],
    function (Actor) {

        return new (function () {

            /**
             * Context shared among all actors
             */
            var ctx = new (function () {

                /**
                 * Loads an actor type
                 */
                this.loadType = function (type, ok, error) {

                    var claz = this._typeCache[type];

                    if (claz) {
                        ok(claz);
                        return;
                    }

                    var path = (this.typePath + type);

                    if (this.pathSeparator == ".") {
                        path = path.replace(/\./g, "/");
                    }

                    var self = this;

                    require([path],
                        function (claz) {
                            self._typeCache[type] = claz;
                            ok(claz);
                        },
                        error);
                };


                /**
                 * Loads an actor JSON include
                 */
                this.loadInclude = function (include, ok, error) {

                    var json = this._includeCache[include];

                    if (json) { // Cache hit
                        ok(json);
                        return;
                    }

                    var path = (this.includePath + include);

                    if (this.pathSeparator == ".") {
                        path = path.replace(/\./g, "/");
                    }

                    var self = this;

                    var jsonFile = new XMLHttpRequest();
                    jsonFile.overrideMimeType("application/json");
                    jsonFile.open("GET", path + ".json", true);
                    jsonFile.onreadystatechange = function () {
                        if (jsonFile.readyState == 4) {
                        //    if (jsonFile.status == 200) {
                                var json = JSON.parse(jsonFile.responseText);
                                self._includeCache[include] = json; // Cache write
                                ok(json);
                      //      }
                        }
                    };
                    jsonFile.send(null);
                };


                /** Caches Actor constructors
                 */
                this._typeCache = {};


                /** Caches included JSON scriptlets
                 */
                this._includeCache = {};

                /**
                 * Base path to actor types
                 */
                this.typePath = "";

                /**
                 * Base path to actor JSON includes
                 */
                this.includePath = "";

                /**
                 * Char we use as delimiter on all paths (type, include, method, topic etc.)
                 */
                this.pathSeparator = ".";
            })();

            this._actor = new Actor({ // Making root actor a property helps with debugging the actor hierarchy
                id:"",
                ctx:ctx,
                inNewThread:false,
                loaded:true
            });

            /**
             * Configures ActorJS
             * @param params
             * @param {String} params.pathSeparator Delimiter char for paths to actor types, instances, methods and topics: '.' (default) or '/'
             * @param {String} params.typePath
             */
            this.configure = function (params) {

                var pathSeparator = params.pathSeparator;

                if (pathSeparator) {
                    if (pathSeparator != "/" && pathSeparator != ".") {
                        throw "Only '.' and '/' pathSeparator chars are currently supported";  // TODO - generalise
                    }
                    ctx.pathSeparator = pathSeparator;
                }

                ctx.typePath = params.typePath || ctx.typePath;
                ctx.includePath = params.includePath || ctx.includePath;
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