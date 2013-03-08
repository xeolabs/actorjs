/* An actor which
 */
define(function () {

    return function (cfg) {

        var myName = cfg.myName;

        this.setResource("myFirstResource", {
            saySomething:function (sayWhat) {
                alert(sayWhat);
            }
        });

        this.addActor({
            id:"foo",
            type:"ex3.person",
            myName:"Foo"
        });

        this.addActor({
            id:"bar",
            type:"ex3.person",
            myName:"Bar"
        });

        this.saySomething = function (params) {

            this.call("foo.saySomething", params);
            this.call("bar.saySomething", params);

            this.publish("saidSomething", { message:myName + " says: " + params.message });
        };
    };
});