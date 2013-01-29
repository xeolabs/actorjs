ActorJS
=======

ActorJS is a JavaScript framework which structures your code as actors that communicate via asynchronous JSON-RPC and publish-subscribe messaging.
With ActorJS, you define actor types as RequireJS modules, then fire JSON-RPC calls to instantiate them, call their methods,
subscribe to their publications, kill them, and so forth.

## Concept
ActorJS was originally created for building APIs on top of SceneJS, through which you could quickly throw together 3D
 worlds and drive all their bits and pieces, like this:


```javascript

ActorJS.call("addActor", {
    type: "scene",
    actorId: "myScene"
});

ActorJS.call("myScene/addActor", {
    type: "objects/prims/teapot",
    actorId: "myTeapot"
});

ActorJS.call("myScene/addActor", {
    type: "scene/camera",
    actorId: "myCamera"
});

ActorJS.call("myScene/myTeapot/startSpinning");

ActorJS.call("myScene/myCamera/setEye", {
    x: -30,
    y: 0,
    z: 50
});

ActorJS.subscribe("myScene/myCamera/update",
    function(update) {
        alert("Camera updated: " + JSON.stringify(update));
    });

```

Coolnesses to note here:

 * It all happens via RPC. Using WebSockets, ActorJS can distribute our actors across Web Workers, and via the Web Messaging API,
 can run actors in different browser windows.
 * After adding an actor instance, see how we can make calls and subscriptions on it immediately because ActorJS buffers
 those until the actor exists.

## Documentation and Examples
Take a look at our [wiki](https://github.com/xeolabs/actorjs/wiki) for documentation and examples.

## License
ActorJS is licensed under both the [GPL](https://github.com/xeolabs/actorjs/blob/master/licenses/GPL_LICENSE.txt)
and [MIT](https://github.com/xeolabs/actorjs/blob/master/licenses/MIT_LICENSE.txt) licenses. Pick whichever of those fits your needs.
