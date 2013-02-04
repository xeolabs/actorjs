ActorJS
=======

ActorJS is a JavaScript framework/boilerplate that structures apps as actors that communicate via asynchronous JSON-RPC and publish-subscribe messaging.

With ActorJS, you define actor types as RequireJS modules, then send JSON-RPC calls to instantiate them, call their methods,
subscribe to their publications, delete them, and so forth.

ActorJS is used as the backbone of [xeoEngine](https://github.com/xeolabs/xeoEngine), a WebGL-based engine from xeoLabs which lets us
assemble 3D worlds from actor libraries and drive them over a network.

## Hello, World!

Check out this super basic example.
In file [actors/ex1/person.js](actors/ex1/person.js), we'll define a simple actor
which will publish whatever we tell it to say:

```javascript
define(function () {

    return function (cfg) {

        var myName = cfg.myName;

        this.saySomething = function (params) {
            this.publish("saidSomething", { message:myName + " says: " + params.message });
        };
    };
});
```

Then we create our application in [ex1.html](ex1.html):

```javascript

 /* Configure RequireJS
  */
 requirejs.config({
     baseUrl:"."
 });

 /* Get an ActorJS instance
  */
 require([
     '../lib/actorjs/actorjs'],

     function (actorjs) {

         /* Tell the ActorJS instance where to find our actor types
          */
         actorjs.configure({
             actorClassPath:"actors/"
         });

         /* Add an instance of our first example actor type
          */
         actorjs.call("addActor", {
             type:"ex1/person",
             actorId:"foo",
             myName:"Foo"
         });

         /* Subscribe to the message the actor will publish
          */
         actorjs.subscribe("foo/saidSomething", function (params) {
             alert(params.message);
         });

         /* Call the actor's 'saySomething' method, which
          * publishes that message back at us
          */
         actorjs.call("foo/saySomething", {
             message:"Hello, World!"
         });
     });
```

[Run it here](http://xeolabs.github.com/actorjs/ex1.html)

Coolnesses to note in this example:
 * We're instantiating actor types that are defined in AMD modules
 * We call methods on those instances asynchronously, some of which are built in to ActorJS, like 'addActor'
 * We can subscribe to publications that the actors make
 * Calls and subscriptions can be made immediately (i.e. asynchronously) because ActorJS buffers those until the actor exists.

### What else can I do?

 * Assemble actors into hierarchies
 * Inject resource objects into your actors
 * Drive ActorJS in an IFRAME using Cross-Domain Messaging
 * Put actors in Web Workers to multi-thread your app

## Documentation and Examples
 * Peruse the [wiki](https://github.com/xeolabs/actorjs/wiki) for documentation and examples
 * Browse the [xeoEngine](https://github.com/xeolabs/xeoEngine) source code for an example of what you can build

## License
ActorJS is licensed under both the [GPL](https://github.com/xeolabs/actorjs/blob/master/licenses/GPL_LICENSE.txt)
and [MIT](https://github.com/xeolabs/actorjs/blob/master/licenses/MIT_LICENSE.txt) licenses.
Pick whichever of those fits your needs.
