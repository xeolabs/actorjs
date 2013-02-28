define(function () {

    return function (cfg) {

        var myName = cfg.myName;

        this.addActor({
            type:"ex2/person",
            actorId:"foo",
            myName:"Foo"
        });

        this.addActor({
            type:"ex2/person",
            actorId:"bar",
            myName:"Bar"
        });

        this.saySomething = function (params) {

            this.call("foo.saySomething", params);
            this.call("bar.saySomething", params);

            this.publish("saidSomething", { message:myName + " says: " + params.message });
        };
    };
});