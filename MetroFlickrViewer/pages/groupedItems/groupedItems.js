(function () {
    "use strict";

    var app = WinJS.Application;
    var appView = Windows.UI.ViewManagement.ApplicationView;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;
    var Notifications = Windows.UI.Notifications;
    var configFileName = 'config.json';

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
                    FlickError: this.flickError,
                    SendTile: this.sendTileWebImageNotificationWithXml,
                    RotateTile: this.rotateTileWebImageNotificationWithXml,
                    CreateTile: this.createTile
                });

                app.onsettings = function (e) {
                    e.detail.applicationcommands = {
                        "setUser": { title: "Set User", href: "/pages/SetUserFlyout.html" }
                    };
                    ui.SettingsFlyout.populateSettings(e);
                };

                // this happens when the app is shutting down
                app.oncheckpoint = function (eventInfo) {
                    eventInfo.setPromise(MetroFlickrViewer.FlickrUser.saveData());

                    // save the current config
                    var previousData = {
                        lastUser: MetroFlickrViewer.FlickrUser.userName
                    }

                    app.local.writeText(configFileName, JSON.stringify(previousData));
                };

                // define a page for the setting page
                ui.Pages.define("/pages/SetUserFlyout.html", {

                    // This function is called whenever a user navigates to this page. It
                    // populates the page elements with the app's data.
                    ready: function (element, options) {
                        var userName = MetroFlickrViewer.FlickrUser.userName;
                        if(userName == undefined){
                            userName ='';
                        }

                        element.querySelector('.usernameInput').value = userName;
                        element.querySelector('.usernameInput').focus();
                    }
                });

                var that = this;
                app.local.exists(configFileName).then(
                    function (result) {
                        if (result) {
                            app.local.readText(configFileName).then(
                                function (result) {
                                    if (result) {
                                        var lastUser = JSON.parse(result).lastUser;
                                        if (lastUser != '') {
                                            that.initUI(lastUser);
                                        } else {
                                            WinJS.UI.SettingsFlyout.showSettings("setUser", "/pages/SetUserFlyout.html");
                                        }
                                    } else {
                                        WinJS.UI.SettingsFlyout.showSettings("setUser", "/pages/SetUserFlyout.html");
                                    }
                                },
                                function (errorMessage) {
                                    WinJS.UI.SettingsFlyout.showSettings("setUser", "/pages/SetUserFlyout.html");
                                }
                            )
                        } else {
                            WinJS.UI.SettingsFlyout.showSettings("setUser", "/pages/SetUserFlyout.html");
                        }
                    },
                    function (errorMessage) {
                        WinJS.UI.SettingsFlyout.showSettings("setUser", "/pages/SetUserFlyout.html");
                    }
                );

                var tileUpdateManager = Notifications.TileUpdateManager,
                    tileUpdater = tileUpdateManager.createTileUpdaterForApplication();
                tileUpdater.enableNotificationQueue(true);
                tileUpdater.clear();
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
            //GroupedItems.SendTile(flickrPhoto);
        },

        flickError: function (message) {
            GroupedItems.ShowPopUp('Flickr Api Error', message);
        },

        initUI: function (newUserName) {
            if (MetroFlickrViewer.FlickrUser.userName != newUserName) {
                Data.clearItems();

                var isConnected = MetroFlickrViewer.FlickrHandler.startGettingPhotos(newUserName);

                if (isConnected == true) {
                    MetroFlickrViewer.FlickrHandler.PhotoReadyCallback = this.photoReady;
                    MetroFlickrViewer.FlickrHandler.ErrorCallback = GroupedItems.FlickError;
                } else {
                    GroupedItems.ShowPopUp('No Connectivity!', 'You must be connected to the Internet for this application to work');
                }
            }
        },

        showPopUp: function (title, content) {
            // Creating message dialog box
            var messagedialogpopup = new Windows.UI.Popups.MessageDialog(content, title);

            messagedialogpopup.showAsync();
        },

        sendTileWebImageNotificationWithXml: function (flickrPhoto) {
            // get a XML DOM version of a specific template by using getTemplateContent
            //var tileXml = Notifications.TileUpdateManager.getTemplateContent(Notifications.TileTemplateType.TileWideSmallImageAndText01);
            var tileXml = Notifications.TileUpdateManager.getTemplateContent(30);

            // get the text attributes for this template and fill them in
            // <tile>
            //<visual>
            //<binding template=\"TileSquareImage\"><image id=\"1\" src=\"\"/>
            //</binding>
            //</visual>
            //</tile>
            var tileTextAttributes = tileXml.getElementsByTagName("text");
            tileTextAttributes[0].appendChild(tileXml.createTextNode(flickrPhoto.subtitle));

            // get the image attributes for this template and fill them in
            var tileImageAttributes = tileXml.getElementsByTagName("image");
            tileImageAttributes[0].setAttribute("src", flickrPhoto.backgroundImageSmall);

            // fill in a version of the square template returned by GetTemplateContent
            var squareTileXml = Notifications.TileUpdateManager.getTemplateContent(Notifications.TileTemplateType.tileSquareImage);
            var squareTileImageAttributes = squareTileXml.getElementsByTagName("image");
            squareTileImageAttributes[0].setAttribute("src", flickrPhoto.backgroundImageSmall);

            // include the square template into the notification
            var node = tileXml.importNode(squareTileXml.getElementsByTagName("binding").item(0), true);
            tileXml.getElementsByTagName("visual").item(0).appendChild(node);

            // create the notification from the XML
            var tileNotification = new Notifications.TileNotification(tileXml);

            // send the notification to the app's application tile
            Notifications.TileUpdateManager.createTileUpdaterForApplication().update(tileNotification);
        },

        rotateTileWebImageNotificationWithXml: function (number) {
            // send the notification to the app's application tile
            var currentTime = new Date();
            var dueTime = new Date(currentTime.getTime() + 5 * 1000);

            // Create the notification object
            //var futureTile = new Notifications.ScheduledTileNotification(this.CreateTile(i + 1), dueTime);
            var tileXml = this.CreateTile(number);
            var futureTile = new Notifications.TileNotification(tileXml);
            futureTile.tag = "Tile" + number;

            Notifications.TileUpdateManager.createTileUpdaterForApplication().update(futureTile);
            console.log(tileXml.getXml());
        },

        createTile: function (number) {
            // get a XML DOM version of a specific template by using getTemplateContent
            var tileXml = Notifications.TileUpdateManager.getTemplateContent(30);
            var numberImage = 'http://www.allkidsnetwork.com/coloring-pages/images/Numbers/small/numbers-' + number + '.jpg';

            var tileTextAttributes = tileXml.getElementsByTagName("text");
            tileTextAttributes[0].appendChild(tileXml.createTextNode('This is number ' + number));

            // get the image attributes for this template and fill them in
            var tileImageAttributes = tileXml.getElementsByTagName("image");
            tileImageAttributes[0].setAttribute("src", numberImage);

            // fill in a version of the square template returned by GetTemplateContent
            var squareTileXml = Notifications.TileUpdateManager.getTemplateContent(Notifications.TileTemplateType.tileSquareImage);
            var squareTileImageAttributes = squareTileXml.getElementsByTagName("image");
            squareTileImageAttributes[0].setAttribute("src", numberImage);

            // include the square template into the notification
            var node = tileXml.importNode(squareTileXml.getElementsByTagName("binding").item(0), true);
            tileXml.getElementsByTagName("visual").item(0).appendChild(node);

            return tileXml;
        }
    });
})();
