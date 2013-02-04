ActorJS
=======

ActorJS is a JavaScript framework/boilerplate which structures our code as actors that communicate via asynchronous JSON-RPC and publish-subscribe messaging.
With ActorJS, you define actor types as RequireJS modules, then fire JSON-RPC calls to instantiate them, call their methods,
subscribe to their publications, kill them, and so forth.

ActorJS is used for the backbone of [xeoEngine](https://github.com/xeolabs/xeoEngine), another xeoLabs project that lets us
assemble WebGL-based 3D worlds from actor libraries and drive them over a network.

## Hello, World!

First, let's an actor type. In file [actors/ex1/person.js](actors/ex1/person.js), we'll define a simple actor
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

Now lets create our application in [ex1.html](ex1.html):

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

ActorJS is provided as a production-ready boilerplate, with the ActorJS files in the [lib/actorjs](lib/actorjs) directory, and the
 example apps as HTML pages at the top level. Just drop additional 3rd party libs you need alongside the ActorJS and RequireJS libs.

Coolnesses to note in the example above:
 * We're instantiating actor types that are defined in AMD modules
 * We call methods on those instances asynchronously, some of which are built in to ActorJS, like 'addActor'
 * We can subscribe to publications that the actors make
 * Calls and subscriptions can be made immediately (i.e. asynchronously) because ActorJS buffers those until the actor exists.

## Documentation and Examples
Take a look at the [wiki](https://github.com/xeolabs/actorjs/wiki) for documentation and examples.

## License
ActorJS is licensed under both the [GPL](https://github.com/xeolabs/actorjs/blob/master/licenses/GPL_LICENSE.txt)
and [MIT](https://github.com/xeolabs/actorjs/blob/master/licenses/MIT_LICENSE.txt) licenses. Pick whichever of those fits your needs.
