/*



 */
require([
    './actorjs.js'
],
    function () {

        var client;
        var clientOrigin;

        var sendBuf = [];
        var handleMap = {};

        /* Tell ActorJS where to find actor types
         */
        ActorJS.configure({
            actorClassPath:"actors/"
        });

        if (window.addEventListener) {

            addEventListener("message",
                function (event) {

                    var call = JSON.parse(event.data);

                    if (call.action) {

                        switch (call.action) {

                            case "connect" :

                                send({ status:"connected" });

                                client = event.source;
                                clientOrigin = event.origin;

                                break;

                            case "call":

                                ActorJS.call(call.method, call.params);

                                break;

                            case "publish":

                                ActorJS.publish(call.topic, call.params);

                                break;

                            case "subscribe":

                                handleMap[call.handle] = ActorJS.subscribe(
                                    call.topic,
                                    function (pub) {
                                        send({ published:pub, topic:call.topic, handle:call.handle });
                                    });

                                break;

                            case "unsubscribe":

                                ActorJS.unsubscribe(handleMap[call.handle]);

                                delete handleMap[call.handle];

                                break;


                        }
                    }

                }, false);

        } else {
            console.error("browser does not support Web Message API");
        }

        function sendBuffered() {
            while (sendBuf.length > 0) {
                send(sendBuf.pop());
            }
        }

        function send(message) {
            if (!client) {
                sendBuf.push(message);
            } else {
                client.postMessage(JSON.stringify(message), clientOrigin);
            }
        }
    });