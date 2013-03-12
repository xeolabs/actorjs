ActorJS
=======

ActorJS is a JavaScript framework that structures apps as actors that communicate via asynchronous JSON-RPC and publish-subscribe messaging.

With ActorJS, you define actor types then fire calls to instantiate them, invoke their methods,
subscribe to their publications, delete them, and so forth.

ActorJS is being developed in the context of [xeoEngine](https://github.com/xeolabs/xeoEngine), a WebGL-based engine which lets us
assemble and drive 3D worlds over a network.

Features:
--------------------------------------------------------------------------------

* [Actor hierarchies](#example-2-actor-hierarchies)
* Declarative JSON syntax
* JSON-RPC + publish/subscribe API (completely message-driven)
* [Custom actor types](#example-1-hello-world)
* [Load actor types on demand (eg. from RequireJS modules)](#example-3-using-requirejs)
* Multiple actor stages (containers for actors)
* [Use 'includes' to compose actor hierarchies from JSON libraries](#example-4-json-includes)
* [Client/server on HTML5 Web Message API](#example-5-clientserver-on-html5-web-messaging-api)
* [Inject resources for actors](#example-6-injecting-resources)

## Documentation

 * Consult the [API docs](http://xeolabs.github.com/actorjs/docs/) (work in progress!)
 * Peruse the [wiki](https://github.com/xeolabs/actorjs/wiki) for documentation and examples
 * Browse the [xeoEngine](https://github.com/xeolabs/xeoEngine) source code for an example of what you can build

## Example 1: Hello, World

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

Now create a stage and add an instance of the actor type:

```javascript
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

# Example 2: Actor Hierarchies

Typically you would compose actors into hierarchies, then use paths into the hierarchies to resolve actor methods and topics.
As before, define the "person" actor type:

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

Then define a "group" actor type, which creates and manages two "person" actors:

```javascript
ActorJS.addActorType("group",
    function (cfg) {

        var myName = cfg.myName;

        this.addActor({
            id:"foo",
            type:"person",
            myName:"Foo"
        });

        this.addActor({
            id:"bar",
            type:"person",
            myName:"Bar"
        });

        this.saySomething = function (params) {

            this.call("foo.saySomething", params);
            this.call("bar.saySomething", params);

            this.publish("saidSomething", {
                message:myName + " says: " + params.message
            });
        };
    });
```
Create a stage and add the "group" actor:

```javascript
var stage = ActorJS.createStage();

stage.call("addActor", {
    id:"group",
    type:"group",
    myName:"Group"
});
```
Subscribe to the message the 'group' actor will publish on behalf of either of its child 'person' actors:
```javascript
stage.subscribe("group.saidSomething",
     function (params) {
         alert(params.message);
     });
```
Subscribe to the message the 'group' actor's first child 'person' actor will publish
```javascript
stage.subscribe("group.foo.saidSomething",
     function (params) {
         alert(params.message);
     });
```
Subscribe to the message the 'group' actor's second child 'person' actor will publish
```javascript
stage.subscribe("group.bar.saidSomething",
    function (params) {
        alert(params.message);
    });
```
Call the 'group' actor's 'saySomething' method, which calls that method in turn on both of its child 'person'actors
```javascript
stage.call("group.saySomething", {
     message:"Hello, World!"
});
```

[Run it here](http://xeolabs.github.com/actorjs/examples/actorHierarchies.html)

# Example 3: Using RequireJS

ActorJS encourages you create libraries of reusable actor types, to instantiate as required for each application.
Lets do a variation on [Example 1](#example-1-hello-world), this time providing the "person" actor type as an AMD module (in [actors/people/person.js](examples/actors/people/person.js)):

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
Point RequireJS at the base directory where the actor type lives:
```javascript
requirejs.config({
    baseUrl:"actors/"
});
```
Configure ActorJS with a loader that wraps RequireJS:
```javascript
ActorJS.configure({
    typeLoader:function (path, ok, error) {
        require([path], ok, error);
    }
});
```
Now create a stage and add an instance of our actor type. See how the ```type``` property resolves to our AMD
module. You can configure ActorJS to use slashes to delimit paths, but I found that dots just look nicer and have a more
 objecty-feel.
```javascript
var stage = ActorJS.createStage();

stage.call("addActor", {
    id:"foo",
    type:"people.person",
    myName:"Foo"
});
```
Subscribe to the message the actor will publish:
```javascript
stage.subscribe("foo.saidSomething",
    function (params) {
        alert(params.message);
    });
```
And finally, fire a call at the actor to make it say hello:
```javascript
stage.call("foo.saySomething", {
    message:"Hello, World!"
});
```
[Run it here](http://xeolabs.github.com/actorjs/examples/actorModules.html)

## Example 4: JSON Includes
For a higher level of reuse, we can create libraries of JSON components then pull them into our actor graphs as **includes**.


Lets create a hierarchy of three "person" actor types, as a JSON component (in [includes/people/pointyHairedBoss.json](examples/includes/people/pointyHairedBoss.json)):

```json
{
    "type":"person",
    "myName":"Pointy Haired Boss",

    "actors":[
        {
            "id":"dilbert",
            "type":"person",
            "myName":"Dilbert"
        },
        {
            "id":"phil",
            "type":"person",
            "myName":"Phil"
        }
    ]
}
```
Note that the root actor has no ID - each time we include one of these components, we're creating a separate instance of it,
which will get its own ID.

Next, configure ActorJS with the base directory where our JSON components live:
```javascript
ActorJS.configure({
    includePath:"includes/"
});
```
Now create a stage and include the component. See how the ```include``` property resolves to our JSON file:
 objecty-feel.
```javascript
var stage = ActorJS.createStage();

stage.call("addActor", {
    id:"boss",
    include:"people.pointyHairedBoss",
    myName:"Boss"
});
```
Subscribe to the message the actor will publish:
```javascript
stage.subscribe("foo.saidSomething",
    function (params) {
        alert(params.message);
    });
```
And finally, fire a call at the actor to make it say hello:
```javascript
stage.call("foo.saySomething", {
    message:"Hello, World!"
});
```
[Run it here](http://xeolabs.github.com/actorjs/examples/actorIncludes.html)

## Example 5: Client/server on HTML5 Web Messaging API

ActorJS's API allows (encourages) us to drive everything remotely via messages.

Let's create an example on the HTML5 Web Messaging API, building on concepts introduced in the previous examples.

First, whip up a page that exposes an ActorJS stage to Web Message clients:

```html
<html>
<head>
    <script src="../build/actorjs.js"></script>
    <script src="lib/require.js"></script>
</head>
<body>
<script>

    // We'll use RequireJS to hot-load actor types.
    // Tell it where to find them:
    requirejs.config({
        baseUrl:"actors/"
    });

    // Plug a loader into ActorJS:
    ActorJS.configure({
        typeLoader:function (path, ok, error) {
            require([path], ok, error);
        }
    });

    // Create a stage to contain actors:
    var stage = ActorJS.createStage();

    // Serve the stage to Web Message clients:
    var server = new ActorJS.WebMessageServer(stage);

</script>
</body>
</html>
```
Then we'll make a client page which will embed our server page in an iframe and drive it remotely, just as if
if the ActorJS environment was actually in the client page. We'll make [Example 1](#example-1-hello-world) again
(but this time remotely via messages!):
```html
<html>
<head>
    <script src="../build/actorjs-webMessageClient.js"></script>
</head>
<body>
    <iframe id="myIFrame" src="server.html"></iframe>
    <script>

        var client = new ActorJSWebMessageClient({
            iframe:"myIFrame"
        });

        client.call("addActor", {
            id:"dilbert",
            type:"person",
            myName:"Dilbert"
        });

        client.subscribe("dilbert.saidSomething",
            function (params) {
                alert(params.message);
            });

        client.call("dilbert.saySomething", {
            message:"Hello, World!"
        });

    </script>
</body>
</html>
```
What's cool here is that the client page only depends on the ActorJS [client library](https://github.com/xeolabs/actorjs/blob/master/build/actorjs-webMessageClient.js),
meaning that the client bits can be embedded in blogs and code sharing sites like [CodePen](http://codepen.io), without having
to upload all your actor's dependencies there (image files etc).

[Run it here](http://xeolabs.github.com/actorjs/examples/client.html)

## Example 6: Injecting resources
Actors can manage JavaScript objects for their children to use. We'll build on [example 2](#example-2-actor-hierarchies),
this time with a resource object that the children will send messages through.

Define a "person" actor type like before, but this time it's going to say something its thing via a resource:
```javascript
ActorJS.addActorType("person",
    function (cfg) {

        var myName = cfg.myName;

        var myResource = this.getResource("myResource");

        this.saySomething = function (params) {
            myResource.saySomething(myName + " says: " + params.message);
        };
});
```
Next, define a "group" actor which injects the resource where the children can get it.
The resource is just a simple JavaScript object with a ```saySomething``` method:
```javascript
ActorJS.addActorType("group",
    function (cfg) {

        var myName = cfg.myName;

        this.setResource("myResource", {
            saySomething:function (sayWhat) {
                alert(sayWhat);
            }
        });

        this.addActor({
            id:"foo",
            type:"person",
            myName:"Foo"
        });

        this.addActor({
            id:"bar",
            type:"person",
            myName:"Bar"
        });

        this.saySomething = function (params) {

            this.call("foo.saySomething", params);
            this.call("bar.saySomething", params);

            this.publish("saidSomething", { message: myName + " says: " + params.message });
        };
    });
```
And finally, just like before, create the "group" actor, do the subscriptions and call:
```javascript
var stage = ActorJS.createStage();

stage.call("addActor", {
    id:"group",
    type:"group",
    myName:"Group"
});
```
```javascript
stage.subscribe("group.saidSomething",
     function (params) {
         alert(params.message);
     });

stage.subscribe("group.foo.saidSomething",
     function (params) {
         alert(params.message);
     });

stage.subscribe("group.bar.saidSomething",
    function (params) {
        alert(params.message);
    });

stage.call("group.saySomething", {
     message:"Hello, World!"
});
```

[Run it here](http://xeolabs.github.com/actorjs/examples/actorResources.html)

## License
ActorJS is licensed under both the [GPL](https://github.com/xeolabs/actorjs/blob/master/licenses/GPL_LICENSE.txt)
and [MIT](https://github.com/xeolabs/actorjs/blob/master/licenses/MIT_LICENSE.txt) licenses.
Pick whichever of those fits your needs.

## Inspirations
 * The JSON-based actor hierarchy is inspired in part by [Unveil.js](https://github.com/michael/unveil)
