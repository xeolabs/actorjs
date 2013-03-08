define(function () {

    return function (cfg) {

        var myName = cfg.myName;

        this.addActor({
            id:"foo",
            type:"ex4.person",
            myName:"Foo",
            worker:true
        });

        this.addActor({
            id:"bar",
            type:"ex4.person",
            myName:"Bar",
            worker:false
        });

        this.saySomething = function (params) {

            this.call("foo.saySomething", params);
            this.call("bar.saySomething", params);

            this.publish("saidSomething", { message:myName + " says: " + params.message });
        };
    };
});