define(function () {

    return function (cfg) {

        var myName = cfg.myName;

        this.addActor({
            id:"foo",
            type:"people/person",
            myName:"Foo"
        });

        this.addActor({
            id:"bar",
            type:"people/person",
            myName:"Bar"
        });

        this.saySomething = function (params) {

            this.call("foo.saySomething", params);
            this.call("bar.saySomething", params);

            this.publish("saidSomething", { message:myName + " says: " + params.message });
        };
    };
});