/**
 * @class Generic map of IDs to items - can generate own IDs or accept given IDs. IDs should be strings in order to not
 * clash with internally generated IDs, which are numbers.
 * @private
 */
ActorJS._Map = function (prefix, items) {

    this.prefix = prefix || "";
    this.items = items || [];

    var lastUniqueIndex = 0;

    /**
     * Adds an item to the map and returns the ID of the item in the map. If an ID is given, the item is
     * mapped to that ID. Otherwise, the map automatically generates the ID and maps to that.
     *
     * id = myMap.addItem("foo") // ID internally generated
     *
     * id = myMap.addItem("foo", "bar") // ID is "foo"
     *
     */
    this.addItem = function () {
        var item;
        if (arguments.length == 2) {
            var id = arguments[0];
            item = arguments[1];
            if (this.items[id]) { // Won't happen if given ID is string
                throw "ID clash: '" + id + "'";
            }
            this.items[id] = item;
            return id;
        } else {
            var id;
            item = arguments[0];
            while (true) {
                id = this.prefix + lastUniqueIndex++;
                if (!this.items[id]) {
                    this.items[id] = item;
                    return id;
                }
            }
        }
    };

    /**
     * Removes the item of the given ID from the map
     */
    this.removeItem = function (id) {
        delete this.items[id];
    };

    /**
     * Removes all items
     */
    this.clear = function () {
        this.items = items || [];
        lastUniqueIndex = 0;
    }
};
