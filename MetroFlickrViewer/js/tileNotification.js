(function () {
    "use strict";

    var Notifications = Windows.UI.Notifications;

    function initialize() {
        var tileUpdateManager = Notifications.TileUpdateManager,
            tileUpdater = tileUpdateManager.createTileUpdaterForApplication();
        tileUpdater.enableNotificationQueue(true);
        tileUpdater.clear();
    }

    function AddTile(flickrPhoto) {
        if (flickrPhoto.backgroundImageSmall != undefined) {
            var notificationTile = new Notifications.TileNotification(createTile(flickrPhoto));
            Notifications.TileUpdateManager.createTileUpdaterForApplication().update(notificationTile);
        }
    }

    function createTile(flickrPhoto) {
        // Windows.UI.Notifications.TileTemplateType.TileSquareImage
        var wideTileXml = '<tile>';
        wideTileXml += '<visual>';
        wideTileXml += '<binding template="TileWideImage" branding="none">';
        wideTileXml += '<image id="1" src="' + flickrPhoto.backgroundImageSmall + '" alt="' + flickrPhoto.getFormattedPhotoDate() + '"/>';
        wideTileXml += '</binding>';
        wideTileXml += '<binding template="TileSquareImage" branding="none">';
        wideTileXml += '<image id="1" src="' + flickrPhoto.backgroundImageSmall + '" alt="' + flickrPhoto.getFormattedPhotoDate() + '"/>';
        wideTileXml += '</binding>';
        wideTileXml += '</visual>';
        wideTileXml += '</tile>';

        var wideXmlDocument = new Windows.Data.Xml.Dom.XmlDocument();
        wideXmlDocument.loadXml(wideTileXml);

        return wideXmlDocument;
    }

    WinJS.Namespace.define("TileNotification", {
        AddTile: AddTile,
        Initialize: initialize
    });
})();
