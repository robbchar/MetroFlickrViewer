var MetroFlickrViewer = MetroFlickrViewer || {};

MetroFlickrViewer.FlickrUser = new (function () {
    var local = WinJS.Application.local;

    var userName = '';
    Object.defineProperty(this, "userName", {
        get: function () {
            return userName;
        },
        set: function (name) {
            userName = name;
        }
    });

    var userId = '';
    Object.defineProperty(this, "userId", {
        get: function () {
            return userId;
        },
        set: function (id) {
            userId = id;
        }
    });

    var data = {
        userName: '',
        photoData: '',
        userId: ''
    };
    Object.defineProperty(this, "data", {
        get: function () {
            return data;
        },
        set: function (d) {
            data = d;
        }
    });

    var fileName = '';
    Object.defineProperty(this, "fileName", {
        get: function () {
            return fileName + '.json';
        }
    });

    this.saveData = function () {
        data.photoData = JSON.stringify(MetroFlickrViewer.FlickrHandler.PhotoHash);
        data.userName = this.userName;
        data.userId = this.userId;

        local.writeText(this.fileName, JSON.stringify(this.data)).then(
            function (result) {
            },
            function (errorMessage) {
                console.log(errorMessage);
                return false;
            }
        );
    };

    this.loadData = function () {
        local.readText(this.fileName).then(
            function (result) {

            },
            function(errorMessage){
                console.log(errorMessage);
            }
        );
    };

    this.dataFileExists = function () {
        local.exists(this.fileName).then(
            function (result) {
                return result;
            },
            function(errorMessage){
                console.log(errorMessage);
            }
        );

        // the file was not found for some reason
        return false;
    }


})