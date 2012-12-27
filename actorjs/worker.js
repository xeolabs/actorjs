/*

 Web Worker which wraps a ActorJS

 Via the Worker, the ActorJS can be called, subscribed and unsubscribed

 */
importScripts('../lib/require.js');

requirejs.config({
    baseUrl:".",
    paths:{
        app:"../app"
    }
});

require([
    'app/actorjs'
],
    function () {

        var self = this;

        /* Tell ActorJS where to find RequireJS modules for actor classes
         */
        ActorJS.configure({
            actorClassPath:"../../content/actors/",
            inWorker:true
        });

        /* Handle message from owner thread
         */
        self.onmessage = function (event) {

            var data = event.data;

            switch (data.type) {

                /* Method call
                 */

                case "call":

                    var method = data.method;
                    var params = data.params;

                    ActorJS.call(method, params);

                    if (method == "addActor") {

                        /* Adding an actor
                         */
                        if (params.actorId) {

                            var actorId = params.actorId;

                            /* Notify owner thread of all publications by the actor
                             */
                            ActorJS.subscribe(actorId + "/*",
                                function (params, topic) {
                                    self.postMessage({
                                        type:"publish",
                                        actorId:actorId,
                                        topic:topic,
                                        params:params
                                    });
                                });
                        }
                    }

                    break;
            }
        };
    }
);





