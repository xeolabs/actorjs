/* A person actor type which sends messages via a resource object provided by a parent actor
 */
define(function () {

    return function (cfg) {

        var myName = cfg.myName;

        var myResource = this.getObject("myFirstResource");

        this.saySomething = function (params) {
            myResource.saySomething(myName + " says: " + params.message );
        };
    };
});