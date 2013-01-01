/*

 Web Worker which wraps an ActorJS instance

 Via the Worker, the ActorJS can be called, subscribed and unsubscribed

 */
importScripts('../lib/require.js');

requirejs.config({
    baseUrl:"."
});

/* Load ActorJS
 */
require([
    'actorjs/actorjs'
],
    function () {

        var self = this;

        /* Tell ActorJS where to find actor types
         */
        ActorJS.configure({
            actorClassPath:"actors/"
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





