var MetroFlickrViewer = MetroFlickrViewer || {};

MetroFlickrViewer.FlickrHandler = {
    api_key: 'e672ac2d357f585caf7becc855930c6e',
    api_secret: 'e7280dd2de699681',
    flickr_service_url: 'http://api.flickr.com/services/rest/?format=json&nojsoncallback=1&api_key=',

    CurrentStatus: 'none',
    PhotoHash: {},
    PhotoReadyCallback: undefined, // args FlickrPhoto
    CurrentPage: 0,
    CurrentRequests: [],
    ErrorCallback: undefined, // error callback

    startGettingPhotos: function (userName) {
        if (this.setCurrentUserName(userName) || this.CurrentPage == 0) {
            // start at the first page
            this.CurrentPage = 1;

            // init the photos
            this.PhotoHash = {};

            this.cancelRequests();

            this.CurrentStatus = 'none';

            // when the user name is gotten get the associated id
            this.getUserId();
        }
    },

    resumeGettingPhotos: function () {
        this.cancelRequests();

        MetroFlickrViewer.FlickrHandler.getPhotos();
    },

    cancelRequests: function () {
        // cancel any requests
        this.CurrentRequests.forEach(function (xhrRequest) {
            if (xhrRequest.state != 'success') {
                xhrRequest.cancel();
            }
        });

        this.CurrentRequests = [];
    },
    setCurrentUserName: function (userName) {
        if (userName != MetroFlickrViewer.FlickrUser.userName) {
            MetroFlickrViewer.FlickrUser.userName = userName;

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
                        MetroFlickrViewer.FlickrUser.userId = response.user.id;
                        MetroFlickrViewer.FlickrHandler.getPhotos();
                    } else {
                        MetroFlickrViewer.FlickrUser.userId = undefined;

                        if (MetroFlickrViewer.FlickrHandler.ErrorCallback) {
                            MetroFlickrViewer.FlickrHandler.ErrorCallback(response.message);
                        }
                    }
                });
        }
    },

    getPhotos: function () {
        if (this.CurrentStatus == 'none' && MetroFlickrViewer.FlickrUser.userId) {

            this.CurrentStatus = 'gettingPhotos';

            this.CurrentRequests.push(WinJS.xhr({ url: this.getSearchUrl() }).then(
                function (result) {
                    MetroFlickrViewer.FlickrHandler.CurrentStatus = 'none';

                    var response = JSON.parse(result.responseText);

                    if (response.stat == 'ok') {
                        if (MetroFlickrViewer.FlickrHandler.getCurrentNumberOfPhotos() >= response.photos.total) {
                            if (response.photos.total == 0) {
                                GroupedItems.FlickError('No photos to get');
                            } else {
                                GroupedItems.FlickError('Finished getting photos');
                            }
                        } else {
                            response.photos.photo.forEach(function (item) {
                                if (!MetroFlickrViewer.FlickrHandler.PhotoHash[item.id]) {
                                    MetroFlickrViewer.FlickrHandler.PhotoHash[item.id] = new MetroFlickrViewer.FlickrPhoto(item);
                                    MetroFlickrViewer.FlickrHandler.CurrentRequests.push(WinJS.xhr({ url: MetroFlickrViewer.FlickrHandler.getPhotoDetailUrl(item.id) })
                                        .then(function complete(result) {
                                            var response = JSON.parse(result.responseText);

                                            if (response.stat == 'ok') {
                                                MetroFlickrViewer.FlickrHandler.PhotoHash[response.photo.id].flickrPhoto = response.photo;
                                                MetroFlickrViewer.FlickrHandler.PhotoHash[response.photo.id].setBindingProperties();

                                                MetroFlickrViewer.FlickrHandler.CurrentRequests.push(WinJS.xhr({ url: MetroFlickrViewer.FlickrHandler.getPhotoSizesUrl(item.id) })
                                                    .then(function complete(result) {
                                                        var response = JSON.parse(result.responseText);

                                                        if (response.stat == 'ok') {
                                                            var urlParts = response.sizes.size[0].source.split('_');
                                                            urlParts = urlParts[0].split('/');
                                                            var photoId = urlParts[urlParts.length - 1];

                                                            MetroFlickrViewer.FlickrHandler.PhotoHash[photoId].setFlickrPhotoSizes(response.sizes);
                                                            MetroFlickrViewer.FlickrHandler.PhotoHash[photoId].setSizeBindingProperties();

                                                            if (MetroFlickrViewer.FlickrHandler.PhotoReadyCallback) {
                                                                MetroFlickrViewer.FlickrHandler.PhotoReadyCallback(MetroFlickrViewer.FlickrHandler.PhotoHash[photoId]);
                                                            }
                                                        } else {
                                                            if (MetroFlickrViewer.FlickrHandler.ErrorCallback) {
                                                                MetroFlickrViewer.FlickrHandler.ErrorCallback(response.message);
                                                            }
                                                        }
                                                    }));

                                                if (MetroFlickrViewer.FlickrHandler.PhotoHash[response.photo.id]) {
                                                    MetroFlickrViewer.FlickrHandler.PhotoHash[response.photo.id].setFlickrInfo(response.photo);
                                                }

                                                //if (MetroFlickrViewer.FlickrHandler.PhotoReadyCallback) {
                                                //    MetroFlickrViewer.FlickrHandler.PhotoReadyCallback(MetroFlickrViewer.FlickrHandler.PhotoHash[response.photo.id]);
                                                //}
                                            } else {
                                                if (MetroFlickrViewer.FlickrHandler.ErrorCallback) {
                                                    MetroFlickrViewer.FlickrHandler.ErrorCallback(response.message);
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

                            if (MetroFlickrViewer.FlickrHandler.CurrentPage < 5) {
                                setInterval(MetroFlickrViewer.FlickrHandler.getPhotos(), 1000);
                            }
                        }
                    } else {
                        if (MetroFlickrViewer.FlickrHandler.ErrorCallback) {
                            MetroFlickrViewer.FlickrHandler.ErrorCallback(response.message);
                        }
                    }
                },
                function (xmlHttpRequest) {
                    // fail
                },
                function (xmlHttpRequest) {
                    // progress
                }
            ));
        }
    },

    // method to help in getting flickr urls
    getSearchUrl: function () {
        return this.flickr_service_url + this.api_key + '&method=flickr.photos.search&user_id=' + MetroFlickrViewer.FlickrUser.userId + '&page=' + this.CurrentPage;
    },

    getUserIdUrl: function () {
        return this.flickr_service_url + this.api_key + '&method=flickr.people.findByUsername&username=' + MetroFlickrViewer.FlickrUser.userName;
    },

    getPhotoDetailUrl: function (photoId) {
        return this.flickr_service_url + this.api_key + '&method=flickr.photos.getInfo&photo_id=' + photoId;
    },

    getPhotoSizesUrl: function (photoId) {
        return this.flickr_service_url + this.api_key + '&method=flickr.photos.getSizes&photo_id=' + photoId;
    },

    // utility methods
    getCurrentNumberOfPhotos: function () {
        var returnArray = [], p;
        for (var property in this.PhotoHash) {
            if (Object.prototype.hasOwnProperty.call(this.PhotoHash, property)) {
                returnArray.push(property);
            }
        }

        return returnArray.length;
    },

    getGroupBackgroundImage: function (groupKey) {
        var groupPhotos = [];

        for (property in this.PhotoHash) {
            if (this.PhotoHash[property] &&
                this.PhotoHash[property].group &&
                this.PhotoHash[property].group.key == groupKey) {
                groupPhotos.push(this.PhotoHash[property].backgroundImage);
            }
        }

        return groupPhotos[Math.floor(Math.random() * groupPhotos.length)];
    },

    isConnected: function () {
        var profile = Windows.Networking.Connectivity.NetworkInformation.getInternetConnectionProfile();
        if (profile) {
            return (profile.getNetworkConnectivityLevel() != Windows.Networking.Connectivity.NetworkConnectivityLevel.none);
        }
        else {
            return false;
        }
    }
};
