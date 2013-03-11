/**
 * @namespace The ActorJS framework namespace
 */
var ActorJS = {};

/*
 * Caches Actor constructors
 */
ActorJS._actorTypes = {};

/* Caches included JSON scriptlets
 */
ActorJS._includesCache = {};

/* Path on which inbuilt includes loader finds targets
 */
ActorJS._includePath = "";

/* Actor type loading strategy
 */
ActorJS._typeLoader = function (type, ok, error) {
    throw "no typeLoader configured";
};

/* Actor include loading strategy
 */
ActorJS._includeLoader = function (path, ok, error) {
    var jsonFile = new XMLHttpRequest();
    jsonFile.overrideMimeType("application/json");
    jsonFile.open("GET", ActorJS._includePath + path, true);
    jsonFile.onreadystatechange = function () {
        if (jsonFile.readyState == 4) {
            //    if (jsonFile.status == 200) {
            var json = JSON.parse(jsonFile.responseText);
            ok(json);
            //      }
        }
    };
    jsonFile.send(null);
};

/**
 * Context shared among all actors
 */
ActorJS._ctx = new (function () {

    /**
     * Loads an actor type
     */
    this.loadType = function (type, ok, error) {

        var claz = ActorJS._actorTypes[type];

        if (claz) {
            ok(claz);
            return;
        }

        var path = type;

        if (this.pathSeparator == ".") {
            path = path.replace(/\./g, "/");
        }

        ActorJS._typeLoader(path,
            function (claz) {
                ActorJS._actorTypes[type] = claz;
                ok(claz);
            },
            function (err) {
                error(err);
            });
    };

    /**
     * Loads an actor JSON include
     */
    this.loadInclude = function (include, ok, error) {

        var json = ActorJS._includesCache[include];

        if (json) { // Cache hit
            ok(json);
            return;
        }

        if (this.pathSeparator == ".") {
            include = include.replace(/\./g, "/");
        }

        ActorJS._includeLoader(include + ".json",
            function (json) {
                ActorJS._includesCache[include] = json; // Cache the include
                ok(json);
            },
            function (err) {
                error(err);
            });
    };

    /**
     * Char we use as delimiter on all paths (type, include, method, topic etc.)
     */
    this.pathSeparator = ".";

})();

/**
 * @function Configures ActorJS
 * @param {Object} params
 * @param {String} params.pathSeparator Char used to delimit paths to actor types, methods, topics, includes etc
 * @param {Function} params.typeLoader Callback to load actor types
 * @param {Function} params.includeLoader Callback to load actor includes
 */
ActorJS.configure = function (params) {

    if (params.includePath) {
        ActorJS._includePath = params.includePath;
    }

    if (params.pathSeparator) {
        var pathSeparator = params.pathSeparator;
        if (pathSeparator != "/" && pathSeparator != ".") {
            throw "Only '.' and '/' pathSeparator chars are currently supported";  // TODO - generalise
        }
        ActorJS._ctx.pathSeparator = pathSeparator;
    }

    if (params.typeLoader) {
        ActorJS._typeLoader = params.typeLoader;
    }

    if (params.includeLoader) {
        ActorJS._includeLoader = params.includeLoader;
    }
};

/**
 * Defines an actor type within ActorJS. To replace a type that has already been added,
 * undefine it first using #removeActorType.
 *
 * @param {String} type Unique type name
 * @param constructor Initialisation function that will be construct the actor
 * @throws exception If type already added
 */
ActorJS.addActorType = function (type, constructor) {
    if (ActorJS._actorTypes[type]) {
        throw "Actor type already added: " + type;
    }
    ActorJS._actorTypes[type] = constructor;
};

/**
 * Undefines an actor type that was defined previously with #addActorType. Does nothing if the actor type
 * is not currently defined. Does not disrupt existing instances of the actor type.
 *
 * @param {String} type Actor type name
 */
ActorJS.removeActorType = function (type) {
    delete ActorJS._actorTypes[type];
};

/**
 * Creates a new stage on which you can create {@link ActorJS.Actor}s
 * @param cfg
 * @return {ActorJS.Stage}
 */
ActorJS.createStage = function (cfg) {
    return new ActorJS.Stage(ActorJS._ctx);
};

