ActorJS
=======

ActorJS is a JavaScript framework which structures your code as actors that communicate via asynchronous JSON-RPC and publish-subscribe messaging.
With ActorJS, you define actor types as RequireJS modules, then fire JSON-RPC calls to instantiate them, call their methods,
subscribe to their publications, kill them, and so forth.

## Concept
ActorJS was originally created for building APIs on top of SceneJS, through which you could quickly throw together 3D
 worlds and drive all their bits and pieces, like this:


```javascript
require([
    '../js/actorjs'
    ],
    function (actorjs) {

        actorjs.call("addActor", {
            type: "scene",
            actorId: "myScene"
        });

        actorjs.call("myScene/addActor", {
            type: "objects/teapot",
            actorId: "myTeapot"
        });

        actorjs.call("myScene/addActor", {
            type: "scene/camera",
            actorId: "myCamera"
        });

        actorjs.call("myScene/myTeapot/startSpinning");

        actorjs.call("myScene/myCamera/setEye", {
            x: -30,
            y: 0,
            z: 50
        });

        actorjs.subscribe("myScene/myCamera/update",
            function(update) {
                alert("Camera updated: " + JSON.stringify(update));
            });
    });

```

Coolnesses to note here:
 * We're instantiating actor types that are defined in AMD modules
 * We call methods on those instances asynchronously, some of which are built in to ActorJS, like 'addActor'
 * We can subscribe to publications that the actors make
 * It all happens via RPC. Using WebSockets, ActorJS can distribute our actors across Web Workers, and via the Web Messaging API,
 can run actors in different browser windows.
 * Calls and subscriptions can be made immediately (i.e. asynchronously) because ActorJS buffers those until the actor exists.

Major plug-and-play going on here - all doable across a network.

## Documentation and Examples
Take a look at the [wiki](https://github.com/xeolabs/actorjs/wiki) for documentation and examples.

## License
ActorJS is licensed under both the [GPL](https://github.com/xeolabs/actorjs/blob/master/licenses/GPL_LICENSE.txt)
and [MIT](https://github.com/xeolabs/actorjs/blob/master/licenses/MIT_LICENSE.txt) licenses. Pick whichever of those fits your needs.
