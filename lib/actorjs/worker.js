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
    function (ActorJS) {

        var handleMap = {};

        var self = this;

        self.onmessage = function (event) {

            var call = event.data;

            switch (call.action) {

                case "configure":

                    ActorJS.configure(call.configs);

                    break;

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





