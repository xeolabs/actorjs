ActorJS
=======

ActorJS is a JavaScript framework which structures your code as actors that communicate via asynchronous JSON-RPC and publish-subscribe messaging.
With ActorJS, you define actor types as RequireJS modules, then fire JSON-RPC calls to instantiate them, call their methods,
subscribe to their publications, kill them, and so forth.

## Concept
ActorJS was originally created for building APIs on top of [SceneJS](http://scenejs.org), through which you could quickly throw together 3D
 worlds and drive all their bits and pieces.

Without going into too much detail, see if you can intuit the general concept of ActorJS from this example:

```javascript

/* Get an ActorJS instance to manage our 3D world
 */
require([
    '../js/actorjs'
    ],
    function (world) { // We'll call the instance "world"

        /* Tell our ActorJS instance where to find the AMD modules
         * that define our actor types
         */
        world.configure({
            actorClassPath:"actors/"
        });

        /* Add a root actor that provides a SceneJS scene graph to its child
         * actors, complete with lookat node and lights.
         */
        world.call("addActor", {
            type: "scene",
            actorId: "myScene"
        });

        /* Add a child teapot actor to the root actor. This will create
         * a teapot in the scene graph.
         */
        world.call("myScene/addActor", {
            type: "objects/teapot",
            actorId: "myTeapot"
        });

        /* Add a child actor to the root actor. This will control the
         * scene graph's lookat node.
         */
        world.call("myScene/addActor", {
            type: "scene/camera",
            actorId: "myCamera"
        });

        /* Call a method on the teapot actor to start it spinning.
         * See how we specify a path that drills down through the
         * actor hierarchy to the method on the teapot actor.
         */
        world.call("myScene/myTeapot/startSpinning");

        /* Call a method on the camera actor to set the eye position
         */
        world.call("myScene/myCamera/setEye", {
            x: -30,
            y: 0,
            z: 50
        });

        /* Subscribe to the "update" topic that is published to by
         * the camera actor whenever its position changes.
         * See how we specify a path down through the hierarchy
         * to the camera actor's topic.
         */
        world.subscribe("myScene/myCamera/update",
            function(update) {

                var eye = update.eye;
                var look = update.look;
                var up = update.up;

                //..
            });
    });

```

Coolnesses to note here:
 * We're instantiating actor types that are defined in AMD modules
 * We call methods on those instances asynchronously, some of which are built in to ActorJS, like 'addActor'
 * We can subscribe to publications that the actors make
 * Calls and subscriptions can be made immediately (i.e. asynchronously) because ActorJS buffers those until the actor exists.

Major plug-and-play going on here - all doable across a network.

## Documentation and Examples
Take a look at the [wiki](https://github.com/xeolabs/actorjs/wiki) for documentation and examples.

## License
ActorJS is licensed under both the [GPL](https://github.com/xeolabs/actorjs/blob/master/licenses/GPL_LICENSE.txt)
and [MIT](https://github.com/xeolabs/actorjs/blob/master/licenses/MIT_LICENSE.txt) licenses. Pick whichever of those fits your needs.
