ActorJS
=======

ActorJS is a JavaScript framework that structures apps as actors that communicate via asynchronous JSON-RPC and publish-subscribe messaging.

With ActorJS, you define actor types then fire JSON-RPC calls to instantiate them, invoke their methods,
subscribe to their publications, delete them, and so forth.

ActorJS is being developed in the context of [xeoEngine](https://github.com/xeolabs/xeoEngine), a WebGL-based engine from xeoLabs which lets us
assemble and drive 3D worlds over a network.

## Hello, World!

Check out this super basic example - we'll define a simple actor type
which will publish whatever we tell it to say:

```javascript
ActorJS.addActorType("person",
    function (cfg) {

        var myName = cfg.myName;

        this.saySomething = function (params) {
            this.publish("saidSomething", {
                message:myName + " says: " + params.message
            });
        };
    });
```

Create an instance of the type:

```javascript

/* Create a stage
 */
var stage = ActorJS.createStage();

stage.call("addActor", {
    id:"dilbert",
    type:"person",
    myName:"Dilbert"
});
```

Subscribe to the message the actor will publish:

```javascript
stage.subscribe("dilbert.saidSomething",
   function (params) {
       alert(params.message);
});
```

Call the actor's 'saySomething' method, which publishes that message back at us:

```javascript
stage.call("dilbert.saySomething", {
    message:"Hello, World!"
});
```

[Run it here](http://xeolabs.github.com/actorjs/helloWorld.html)

Coolnesses to note in this example:
 * We're instantiating actors and calling methods and subscribing to subscriptions on them asynchronously.
 * Actor types can also be dynamically loaded on demand, such as from AMD modules.
 * Those calls and subscriptions can be made immediately (i.e. asynchronously) because ActorJS buffers those until the actor exists.
 * We're using a dot for the delimiter on paths to actor types, instances, methods and topics - that can be configured to be "/" if preferred, but a dot is default because it seems more readible.

### What else can I do?

 * [Actor trees](http://xeolabs.github.com/actorjs/examples/actorHierarchy.html)
 * [Inject resources](http://xeolabs.github.com/actorjs/examples/actorResources.html)
 * [Distribute actors across multiple documents using Web Messaging](http://xeolabs.github.com/actorjs/examples/client.html)
 * [Load actor types from AMD modules](http://xeolabs.github.com/actorjs/examples/actorModules.html)
 * [Compose actor trees using JSON includes](http://xeolabs.github.com/actorjs/examples/actorIncludes.html)

## Documentation
 * Peruse the [wiki](https://github.com/xeolabs/actorjs/wiki) for documentation and examples
 * Browse the [xeoEngine](https://github.com/xeolabs/xeoEngine) source code for an example of what you can build

## License
ActorJS is licensed under both the [GPL](https://github.com/xeolabs/actorjs/blob/master/licenses/GPL_LICENSE.txt)
and [MIT](https://github.com/xeolabs/actorjs/blob/master/licenses/MIT_LICENSE.txt) licenses.
Pick whichever of those fits your needs.

## Inspirations
 * The JSON-based actor hierarchy is inspired in part by [Unveil.js](https://github.com/michael/unveil)
