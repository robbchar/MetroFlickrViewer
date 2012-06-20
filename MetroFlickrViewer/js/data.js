(function () {
    "use strict";

    // Get a reference for an item, using the subTitle and item title as a
    // unique reference to the item that can be easily serialized.
    function getItemReference(item) {
        return [item.subtitle, item.title];
    }

    function resolveGroupReference(key) {
        for (var i = 0; i < groupedItems.groups.length; i++) {
            if (groupedItems.groups.getAt(i).key === key) {
                return groupedItems.groups.getAt(i);
            }
        }
    }

    function resolveItemReference(reference) {
        for (var i = 0; i < groupedItems.length; i++) {
            var item = groupedItems.getAt(i);
            if (item.subtitle === reference[0] && item.title === reference[1]) {
                return item;
            }
        }
    }

    // This function returns a WinJS.Binding.List containing only the items
    // that belong to the provided group.
    function getItemsFromGroup(group) {
        return list.createFiltered(function (item) { return item.group.key === group.key; });
    }

    var list = new WinJS.Binding.List();
    var groupedItems = list.createGrouped(
        function groupKeySelector(item) {
            if (item.group != undefined) {
                return item.group.key;
            }
        },

        function groupDataSelector(item) { return item.group; },

        // sort from most recently taken
        function compareGroups(left, right) {
            if (right == undefined) {
                return -1;
            }

            if (left == undefined) {
                return 1;
            }

            var leftMonth = left.slice(0, 2);
            var leftYear = left.slice(2);

            var rightMonth = right.slice(0, 2);
            var rightYear = right.slice(2);

            if (leftYear < rightYear) {
                return 1;
            } else if (leftYear == rightYear) {
                if (leftMonth < rightMonth) {
                    return 1;
                } else if (leftMonth == rightMonth) {
                    return 0;
                }

                return -1;
            }

            return -1;
        }
    );

    function addItem(flickrPhoto) {
        list.push(flickrPhoto);
    }

    function clearItems(flickrPhoto) {
        list.splice(0, list.length);
        list._initializeKeys();
    }

    function popuplateList(itemsHash) {
        clearItems();
        for (var key in itemsHash) {
            if (itemsHash[key] != undefined) {
                list.push(itemsHash[key]);
            }
        }
    }

    WinJS.Namespace.define("Data", {
        items: groupedItems,
        groups: groupedItems.groups,
        getItemsFromGroup: getItemsFromGroup,
        getItemReference: getItemReference,
        resolveGroupReference: resolveGroupReference,
        resolveItemReference: resolveItemReference,
        addItem: addItem,
        clearItems: clearItems,
        popuplateList: popuplateList
    });
})();
