/**
 * @class Serves a {@link ActorJS.Stage} via the HTML5 Cross-Document Messaging API
 * @param stage
 * @constructor
 */
ActorJS.WebMessageServer = function (stage) {

    var client;
    var clientOrigin;
    var sendBuf = [];
    var handleMap = {};

    if (window.addEventListener) {

        addEventListener("message",
            function (event) {

                try {
                    var call = JSON.parse(event.data);

                    if (call.action) {

                        switch (call.action) {
                            case "connect" :
                                send({ message:"connected" });
                                client = event.source;
                                clientOrigin = event.origin;
                                break;

                            case "call":
                                stage.call(call.method, call.params);
                                break;

                            case "publish":
                                stage.publish(call.topic, call.params);
                                break;

                            case "subscribe":
                                handleMap[call.handle] = stage.subscribe(
                                    call.topic,
                                    function (pub) {
                                        send({ message:"published", topic:call.topic, published:pub, handle:call.handle });
                                    });
                                break;

                            case "unsubscribe":
                                stage.unsubscribe(handleMap[call.handle]);
                                delete handleMap[call.handle];
                                break;
                        }
                    }

                } catch (e) {
                    send({
                        message:"error",
                        exception:e
                    });
                }

            }, false);


        // TODO: stage ID in errors, so we are able to report only for this stage

//        ActorJS.configure({
//            onError:function (err) {
//                send({
//                    message:"error",
//                    exception:err
//                });
//            }
//        });

//        requirejs.onError = function (err) {
//            sendRequireJSError(err);
//        };
//
//        function sendRequireJSError(err) {
//            send({
//                message:"error",
//                exception:{
//                    requireType:err.requireType,
//                    requireModules:err.requireModules
//                }
//            });
//        }

    } else {
        console.error("browser does not support Web Message API");
    }

    /**
     * @private
     */
    function send(message) {
        if (!client) {
            sendBuf.push(message);
        } else {
            client.postMessage(JSON.stringify(message), clientOrigin);
        }
    }
};