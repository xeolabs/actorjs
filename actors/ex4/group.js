define(function () {

    return function (cfg) {

        var myName = cfg.myName;

        this.addActor({
            type:"ex4/person",
            actorId:"foo",
            myName:"Foo",
            worker: true
        });

        this.addActor({
            type:"ex4/person",
            actorId:"bar",
            myName:"Bar",
            worker: false
        });

        this.saySomething = function (params) {

            this.call("foo/saySomething", params);
            this.call("bar/saySomething", params);

            this.publish("saidSomething", { message:myName + " says: " + params.message });
        };
    };
});