var MetroFlickrViewer = MetroFlickrViewer || {};

MetroFlickrViewer.FlickrHandler = {
    api_key: 'e672ac2d357f585caf7becc855930c6e',
    api_secret: 'e7280dd2de699681',
    flickr_service_url: 'http://api.flickr.com/services/rest/?format=json&nojsoncallback=1&api_key=',
    CurrentUserName: 'robbchar',
    CurrentUserId: undefined,
    CurrentStatus: 'none',
    PhotoHash: {},
    PhotoReadyCallback: undefined, // args FlickrPhoto
    CurrentPage: 0,
    CurrentRequests: [],

    startGettingPhotos: function (userName) {
        if (this.CurrentPage == 0 || this.setCurrentUserName(userName)) {
            // start at the first page
            this.CurrentPage = 1;

            // init the photos
            this.PhotoHash = {};

            // cancel any requests
            this.CurrentRequests.forEach(function (xhrRequest) {
                if (xhrRequest.state != 'success') {
                    xhrRequest.cancel();
                }
            });

            this.CurrentRequests = [];

            this.CurrentStatus = 'none';

            // when the user name is gotten get the associated id
            this.getUserId();
        }
    },

    setCurrentUserName: function (userName) {
        if (userName != this.CurrentUserName) {
            this.CurrentUserName = userName;

            // the username has changed, return true
            return true;
        }

        return false;
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
                    } else {
                        MetroFlickrViewer.FlickrHandler.CurrentUserId = undefined;
                    }
                });
        }
    },

    getPhotos: function () {
        if (this.CurrentStatus == 'none' && this.CurrentUserId) {
            this.CurrentStatus = 'gettingPhotos';

            this.CurrentRequests.push(WinJS.xhr({ url: this.getSearchUrl() }).then(
                function (result) {
                    MetroFlickrViewer.FlickrHandler.CurrentStatus = 'none';

                    var response = JSON.parse(result.responseText);

                    if (response.stat == 'ok') {
                        response.photos.photo.forEach(function (item) {
                            if (!MetroFlickrViewer.FlickrHandler.PhotoHash[item.id]) {
                                MetroFlickrViewer.FlickrHandler.PhotoHash[item.id] = new MetroFlickrViewer.FlickrPhoto(item);
                                MetroFlickrViewer.FlickrHandler.CurrentRequests.push(WinJS.xhr({ url: MetroFlickrViewer.FlickrHandler.getPhotoDetailUrl(item.id) })
                                    .then(function complete(result) {
                                        var response = JSON.parse(result.responseText);

                                        if (response.stat == 'ok') {
                                            if (MetroFlickrViewer.FlickrHandler.PhotoHash[response.photo.id]) {
                                                MetroFlickrViewer.FlickrHandler.PhotoHash[response.photo.id].setFlickrInfo(response.photo);

                                                if (MetroFlickrViewer.FlickrHandler.PhotoReadyCallback) {
                                                    MetroFlickrViewer.FlickrHandler.PhotoReadyCallback(MetroFlickrViewer.FlickrHandler.PhotoHash[response.photo.id]);
                                                }
                                            }
                                        }
                                    },
                                    function (xmlHttpRequest) {
                                        // fail
                                    },
                                    function (xmlHttpRequest) {
                                        // progress
                                    }));
                            }
                        });

                        MetroFlickrViewer.FlickrHandler.CurrentPage++;

                        //if (MetroFlickrViewer.FlickrHandler.CurrentPage < 4) {
                        MetroFlickrViewer.FlickrHandler.getPhotos();
                        //}
                    }
                },
                function (xmlHttpRequest) {
                    // fail
                },
                function (xmlHttpRequest) {
                    // progress
                }
            ));

            //.done(function complete(result) {
            //    MetroFlickrViewer.FlickrHandler.CurrentStatus = 'none';

            //    var response = JSON.parse(result.responseText);

            //    if (response.stat == 'ok') {
            //        response.photos.photo.forEach(function (item) {
            //            if (!MetroFlickrViewer.FlickrHandler.PhotoHash[item.id]) {
            //                MetroFlickrViewer.FlickrHandler.PhotoHash[item.id] = new MetroFlickrViewer.FlickrPhoto(item);
            //                WinJS.xhr({ url: MetroFlickrViewer.FlickrHandler.getPhotoDetailUrl(item.id) })
            //                    .done(function complete(result) {
            //                        var response = JSON.parse(result.responseText);

            //                        if (response.stat == 'ok') {
            //                            if (MetroFlickrViewer.FlickrHandler.PhotoHash[response.photo.id]) {
            //                                MetroFlickrViewer.FlickrHandler.PhotoHash[response.photo.id].setFlickrInfo(response.photo);

            //                                if (MetroFlickrViewer.FlickrHandler.PhotoReadyCallback) {
            //                                    MetroFlickrViewer.FlickrHandler.PhotoReadyCallback(MetroFlickrViewer.FlickrHandler.PhotoHash[response.photo.id]);
            //                                }
            //                            }
            //                        }
            //                    });
            //            }
            //        });

            //        MetroFlickrViewer.FlickrHandler.CurrentPage++;

            //        //if (MetroFlickrViewer.FlickrHandler.CurrentPage < 4) {
            //            MetroFlickrViewer.FlickrHandler.getPhotos();
            //        //}
            //    }
            //});
        }
    },

    // method to help in getting flickr urls
    getSearchUrl: function () {
        return this.flickr_service_url + this.api_key + '&method=flickr.photos.search&user_id=' + this.CurrentUserId + '&page=' + this.CurrentPage;
    },

    getUserIdUrl: function () {
        return this.flickr_service_url + this.api_key + '&method=flickr.people.findByUsername&username=' + this.CurrentUserName;
    },

    getPhotoDetailUrl: function (photoId) {
        return this.flickr_service_url + this.api_key + '&method=flickr.photos.getInfo&photo_id=' + photoId;
    },

    // utility methods
    getNumberOfPhotos: function () {
        var returnArray = [], p;
        for (property in this.PhotoHash) {
            if (Object.prototype.hasOwnProperty.call(this.PhotoHash, property)) {
                returnArray.push(property);
            }
        }

        return returnArray.length;
    }
};
