/*

 Wraps an ActorJS instance and exposes its methods via the HTML Cross-Document Messaging API

 http://en.wikipedia.org/wiki/Cross-document_messaging

 */
define([
    'lib/actorjs/actorjs'
],
    function (actorjs) {

        return function () {

            var client;
            var clientOrigin;

            var sendBuf = [];
            var handleMap = {};

            /* Tell ActorJS where to find actor types
             */
            actorjs.configure({
                typePath:"actors/"
            });

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

                                        actorjs.call(call.method, call.params);

                                        break;

                                    case "publish":

                                        actorjs.publish(call.topic, call.params);

                                        break;

                                    case "subscribe":

                                        handleMap[call.handle] = actorjs.subscribe(
                                            call.topic,
                                            function (pub) {
                                                send({ message:"published", topic:call.topic, published:pub, handle:call.handle });
                                            });

                                        break;

                                    case "unsubscribe":

                                        actorjs.unsubscribe(handleMap[call.handle]);

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


                actorjs.configure({
                    onError:function (err) {
                        send({
                            message:"error",
                            exception:err
                        });
                    }
                });

                requirejs.onError = function (err) {
                    sendRequireJSError(err);
                };

                function sendRequireJSError(err) {
                    send({
                        message:"error",
                        exception:{
                            requireType: err.requireType,
                            requireModules: err.requireModules
                        }
                    });
                }

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
        };
    });