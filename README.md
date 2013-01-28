ActorJS
=======

ActorJS is a JavaScript framework which structures your code as actors that communicate via asynchronous JSON-RPC and publish-subscribe messaging.
With ActorJS, you define actor types as RequireJS modules, then fire JSON-RPC calls to instantiate them, call their methods,
subscribe to their publications, kill them, and so forth. You can distribute your actors across Web Workers, or among multiple browser windows.

ActorJS was originally created for building APIs on top of SceneJS, through which you could quickly throw together 3D
 worlds and drive all their bits and pieces:


```javascript
ActorJS.addActor({
    type: "objects/prims/teapot",
    actorId: "myTeapot"
});

ActorJS.addActor({
    type: "scene/camera",
    actorId: "myCamera"
});

ActorJS.call("myTeapot/startSpinning");

ActorJS.call("myCamera/setEye", {
    x: -30,
    y: 0,
    z: 50
});
```

## Documentation
Take a look at our [https://github.com/xeolabs/actorjs/wiki] for documentation and examples.

## License
ActorJS is licensed under both the [GPL](https://github.com/xeolabs/actorjs/blob/master/licenses/GPL_LICENSE.txt)
and [MIT](https://github.com/xeolabs/actorjs/blob/master/licenses/MIT_LICENSE.txt) licenses. Pick whichever of those fits your needs.
