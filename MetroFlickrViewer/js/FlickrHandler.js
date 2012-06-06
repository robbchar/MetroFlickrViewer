var MetroFlickrViewer = MetroFlickrViewer || {};

MetroFlickrViewer.FlickrHandler = {
    api_key: 'e672ac2d357f585caf7becc855930c6e',
    api_secret: 'e7280dd2de699681',
    flickr_service_url: 'http://api.flickr.com/services/rest/?format=json&nojsoncallback=1&api_key=',
    CurrentUserName: 'robbchar',
    CurrentUserId: '',
    CurrentStatus: 'none',
    PhotoHash: {},

    setCurrentUserName: function (userName) {
        this.CurrentUserName = userName;

        // when the user name is gotten get the associated id
        this.getUserId();
    },

    getUserId: function () {
        if (this.CurrentStatus == 'none') {
            this.CurrentStatus = 'gettingUserId';

            WinJS.xhr({ url: this.getUserIdUrl() })
                .done(function complete(result) {
                    MetroFlickrViewer.FlickrHandler.CurrentStatus = 'none';

                    var response = JSON.parse(result.responseText);

                    if (response.stat == 'ok') {
                        MetroFlickrViewer.FlickrHandler.CurrentUserId = response.user.id;
                        MetroFlickrViewer.FlickrHandler.getPhotos();
                    }
                });
        }
    },

    getPhotos: function () {
        if (this.CurrentStatus == 'none' && this.CurrentUserId) {
            this.CurrentStatus = 'gettongPhotos';

            WinJS.xhr({ url: this.getSearchUrl() })
                .done(function complete(result) {
                    MetroFlickrViewer.FlickrHandler.CurrentStatus = 'none';

                    var response = JSON.parse(result.responseText);

                    if (response.stat == 'ok') {
                        response.photos.photo.forEach(function (item) {
                            if (!MetroFlickrViewer.FlickrHandler.PhotoHash[item.id]) {
                                MetroFlickrViewer.FlickrHandler.PhotoHash[item.id] = new MetroFlickrViewer.FlickrPhoto(item);
                                WinJS.xhr({ url: MetroFlickrViewer.FlickrHandler.getPhotoDetailUrl(item.id) })
                                    .done(function complete(result) {
                                        var response = JSON.parse(result.responseText);

                                        if (response.stat == 'ok') {
                                            MetroFlickrViewer.FlickrHandler.PhotoHash[response.photo.id].setFlickrPhoto(response.photo);

                                        }
                                    });
                            }
                        });
                    }
                });
        }
    },

    // method to help in getting flickr urls
    getSearchUrl: function () {
        return this.flickr_service_url + this.api_key + '&method=flickr.photos.search&user_id=' + this.CurrentUserId;
    },

    getUserIdUrl: function () {
        return this.flickr_service_url + this.api_key + '&method=flickr.people.findByUsername&username=' + this.CurrentUserName;
    },

    getPhotoDetailUrl: function (photoId) {
        return this.flickr_service_url + this.api_key + '&method=flickr.photos.getInfo&photo_id=' + photoId;
    },
};
