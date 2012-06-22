(function () {
    "use strict";

    var appView = Windows.UI.ViewManagement.ApplicationView;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;

    // by specifying the smallest common denomenator of all the possible sizes, the engine takes care 
    // of the positioning
    function groupInfo() {
        return {
            enableCellSpanning: true,
            cellWidth: 120,
            cellHeight: 80
        };
    }

    function multisizeItemTemplateRenderer(itemPromise) {
        return itemPromise.then(function (currentItem) {
            var content;
            // Grab the default item template used on the groupeditems page.
            content = document.getElementsByClassName("itemtemplate-n")[0];
            var result = content.cloneNode(true);

            // Change the CSS class of the item depending on the size od the image used, then set the size in CSS.
            switch (currentItem.data.currentSize) {
                case "t":
                    {
                        result.className = "itemtemplate-t";
                        break;
                    }
                case "m":
                    {
                        result.className = "itemtemplate-m";
                        break;
                    }
                case "n":
                    {
                        result.className = "itemtemplate-n";
                        break;
                    }
                default:
                    {
                        result.className = "itemtemplate-n";
                        break;
                    }
            }

            // Because we used a WinJS template, we need to strip off some attributes 
            // for it to render.
            result.attributes.removeNamedItem("data-win-control");
            result.attributes.removeNamedItem("style");
            result.style.overflow = "hidden";

            // Because we're doing the rendering, we need to put the data into the item.
            // We can't use databinding.
            result.getElementsByClassName("item-image")[0].src = currentItem.data.backgroundImage;
            result.getElementsByClassName("item-title")[0].textContent = currentItem.data.title;
            result.getElementsByClassName("item-subtitle")[0].textContent = currentItem.data.subtitle;
            return result;
        });
    }

    ui.Pages.define("/pages/groupedItems/groupedItems.html", {

        // This function updates the ListView with new layouts
        initializeLayout: function (listView, viewState) {
            /// <param name="listView" value="WinJS.UI.ListView.prototype" />

            if (viewState === appViewState.snapped) {
                listView.itemDataSource = Data.groups.dataSource;
                listView.groupDataSource = null;
                listView.layout = new ui.ListLayout();
            } else {
                listView.itemDataSource = Data.items.dataSource;
                listView.groupDataSource = Data.groups.dataSource;

                // Add the following two lines of code.
                listView.itemTemplate = multisizeItemTemplateRenderer;
                listView.layout = new ui.GridLayout({ groupInfo: groupInfo, groupHeaderPosition: "top" });
            }
        },

        itemInvoked: function (args) {
            if (appView.value === appViewState.snapped) {
                // If the page is snapped, the user invoked a group.
                var group = Data.groups.getAt(args.detail.itemIndex);
                nav.navigate("/pages/groupDetail/groupDetail.html", { groupKey: group.key });
            } else {
                // If the page is not snapped, the user invoked an item.
                var item = Data.items.getAt(args.detail.itemIndex);
                nav.navigate("/pages/itemDetail/itemDetail.html", { item: Data.getItemReference(item) });
            }
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            if (!(typeof GroupedItems != 'undefined')) { // only fo this if GroupedItems does not exist
                WinJS.Namespace.define("GroupedItems", {
                    initUI: this.initUI,
                    itemInvoked: this.itemInvoked,
                    initializeLayout: this.initializeLayout,
                    photoReady: this.photoReady,
                    ShowPopUp: this.showPopUp,
                    FlickError: this.flickError
                });

                WinJS.Application.onsettings = function (e) {
                    e.detail.applicationcommands = {
                        "setUser": { title: "Set User", href: "/pages/SetUserFlyout.html" }
                    };
                    WinJS.UI.SettingsFlyout.populateSettings(e);
                };

                // define a page for the setting page
                ui.Pages.define("/pages/SetUserFlyout.html", {

                    // This function is called whenever a user navigates to this page. It
                    // populates the page elements with the app's data.
                    ready: function (element, options) {
                        element.querySelector('.usernameInput').value = MetroFlickrViewer.FlickrHandler.CurrentUserName;
                        element.querySelector('.usernameInput').focus();
                    }
                });

                this.initUI();
            }

            //var groupeditemslist = document.querySelector(".groupeditemslist");
            //groupeditemslist.innerHTML = '';
            var listView = document.querySelector(".groupeditemslist").winControl;
            listView.groupHeaderTemplate = document.querySelector(".headerTemplate");
            listView.itemTemplate = document.querySelector(".itemtemplate");
            listView.oniteminvoked = GroupedItems.itemInvoked.bind(GroupedItems);

            GroupedItems.initializeLayout(listView, appView.value);

            Data.popuplateList(MetroFlickrViewer.FlickrHandler.PhotoHash);
            listView.element.focus();
        },

        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />
            /// <param name="viewState" value="Windows.UI.ViewManagement.ApplicationViewState" />
            /// <param name="lastViewState" value="Windows.UI.ViewManagement.ApplicationViewState" />

            var listView = element.querySelector(".groupeditemslist").winControl;
            if (lastViewState !== viewState) {
                if (lastViewState === appViewState.snapped || viewState === appViewState.snapped) {
                    var handler = function (e) {
                        listView.removeEventListener("contentanimating", handler, false);
                        e.preventDefault();
                    }
                    listView.addEventListener("contentanimating", handler, false);
                    this.initializeLayout(listView, viewState);
                }
            }
        },

        photoReady: function (flickrPhoto) {
            Data.addItem(flickrPhoto);
        },

        flickError: function (message) {
            GroupedItems.ShowPopUp('Flickr Api Error', message);
        },

        initUI: function (newUserName) {
            if (MetroFlickrViewer.FlickrHandler.CurrentUserName != newUserName) {
                Data.clearItems();

                MetroFlickrViewer.FlickrHandler.startGettingPhotos(newUserName);
                MetroFlickrViewer.FlickrHandler.PhotoReadyCallback = this.photoReady;
                MetroFlickrViewer.FlickrHandler.ErrorCallback = GroupedItems.FlickError;
            }
        },

        showPopUp: function (title, content) {
            // Creating message dialog box
            var messagedialogpopup = new Windows.UI.Popups.MessageDialog(content, title);

            messagedialogpopup.showAsync();
        }
    });
})();
