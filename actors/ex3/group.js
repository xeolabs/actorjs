/* An actor which
 */
define(function () {

    return function (cfg) {

        var myName = cfg.myName;

        this.setResource("myFirstResource", {
            saySomething: function(sayWhat) {
                alert(sayWhat);
            }
        });

        this.addActor({
            type:"ex3.person",
            actorId:"foo",
            myName:"Foo"
        });

        this.addActor({
            type:"ex3.person",
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