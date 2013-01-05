/*

 Web Worker which wraps an ActorJS instance

 */
importScripts('../libs/require.js');


/* Configure RequireJS
 */
requirejs.config({
    baseUrl:"."
});


require([
    './actorjs.js'
],
    function () {

        var handleMap = {};

        var self = this;

        /* Tell ActorJS where to find actor types
         */
        ActorJS.configure({
            actorClassPath:"actors/"
        });


        self.onmessage = function (event) {

            var call = event.data;

            switch (call.action) {

                case "call":

                    ActorJS[call.method].call(self, call.params);

                    break;

                case "publish":

                    ActorJS.publish(call.topic, call.params);

                    break;

                case "subscribe":

                    handleMap[call.handle] = ActorJS.subscribe(
                        call.topic,
                        function (pub) {
                            self.postMessage({ published:pub, topic:call.topic, handle:call.handle });
                        });

                    break;

                case "unsubscribe":

                    ActorJS.unsubscribe(handleMap[call.handle]);

                    delete handleMap[call.handle];

                    break;
            }
        };
    }
);





