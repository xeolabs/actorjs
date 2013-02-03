/* A person actor type, providing a "saySomething" method which makes it publish to a "saidSomething" topic
 */
define(function () {

    return function (cfg) {

        var myName = cfg.myName;

        this.saySomething = function (params) {
            this.publish("saidSomething", { message:myName + " says: " + params.message });
        };
    };
});