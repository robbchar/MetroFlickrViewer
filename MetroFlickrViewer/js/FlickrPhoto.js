var MetroFlickrViewer = MetroFlickrViewer || {};

MetroFlickrViewer.FlickrPhoto = function (initPhoto) {
    var flickrPhoto = initPhoto;
    this.getFlickrPhoto = function () {
        return flickrPhoto;
    }
    this.setFlickrPhoto = function (photo) {
        flickrPhoto = photo;
        this.setBindingProperties();
    }

    var flickrPhotoSizes;
    this.getFlickrPhotoSizes = function () {
        return flickrPhotoSizes;
    }
    this.setFlickrPhotoSizes = function (photoSizes) {
        flickrPhotoSizes = photoSizes;
        this.setSizeBindingProperties();
    }

    var flickrInfo;
    this.setFlickrInfo = function (info) {
        flickrInfo = info;
        this.setBindingProperties();
    }
    this.getFlickrInfo = function () {
        return flickrInfo;
    }

    this.setBindingProperties = function () {
        this.setTitle();
        this.setSubTitle();
        this.setBackgroundImage();
        this.setBackgroundImageLarge();
        this.setContent();
        this.setDescription();
        this.setGroup();
    }

    // these methods are used if specific sizes are needed
    this.setSizeBindingProperties = function () {
        this.setImageSmallHeight();
        this.setImageSmallWidth()
    }

    this.imageSmallHeight = undefined;
    this.setImageSmallHeight = function () {
        var sizes = flickrPhotoSizes.size;

        sizes.forEach(function (item) {
            if (item.label == 'Small') {
                this.imageSmallHeight = item.height;
            }
        });
    }

    this.imageSmallWidth = undefined;
    this.setImageSmallWidth = function () {
        var sizes = flickrPhotoSizes.size;

        sizes.forEach(function (item) {
            if (item.label == 'Small') {
                this.imageSmallWidth = item.width;
            }
        });
    }

    // these next methods are used for data binding
    this.group = undefined;
    this.setGroup = function () {
        // key: "group1", 
        //title: "Group Title: 1", 
        //subtitle: "Group Subtitle: 1",
        //backgroundImage: darkGray, 
        //description: groupDescription

        var photoTakenDate = this.getPhotoTakenDate();
        var groupObject = {};
        var day = photoTakenDate.getDate();
        if (day < 10) {
            day = '0' + day;
        }

        var month = photoTakenDate.getMonth();
        if (month < 10) {
            month = '0' + month;
        }

        groupObject.key = '' + month + photoTakenDate.getFullYear();
        groupObject.title = this.getMonthTaken() + ' ' + photoTakenDate.getFullYear();
        groupObject.subtitle = '';
        groupObject.description = '';

        this.group = groupObject;

        this.group.backgroundImage = MetroFlickrViewer.FlickrHandler.getGroupBackgroundImage(groupObject.key);
    }

    this.title = undefined;
    this.setTitle = function () {
        this.title = this.getFormattedPhotoDate();
    }

    this.subtitle = undefined;
    this.setSubTitle = function () {
        this.subtitle = flickrInfo.title._content;
    }

    this.description = undefined;
    this.setDescription = function () {
        this.description = flickrInfo.description._content;
    }

    this.content = undefined;
    this.setContent = function () {
        this.content = flickrInfo.description._content;
    }

    this.backgroundImage = undefined;
    this.setBackgroundImage = function () {
        var sizes = new Array('m', 's', 't', 'z');
        // http://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}.jpg
        var size = sizes[Math.floor(Math.random() * sizes.length)]
        console.log(size);
        this.backgroundImage = 'http://farm' + flickrPhoto.farm + '.staticflickr.com/' + flickrPhoto.server + '/' + flickrPhoto.id + '_' + flickrPhoto.secret + '_' + size + '.jpg';
    }

    this.backgroundImageLarge = undefined;
    this.setBackgroundImageLarge = function () {
        var size = 'b';
        // http://farm{farm-id}.staticflickr.com/{server-id}/{id}_{secret}.jpg

        this.backgroundImageLarge = 'http://farm' + flickrPhoto.farm + '.staticflickr.com/' + flickrPhoto.server + '/' + flickrPhoto.id + '_' + flickrPhoto.secret + '_' + size + '.jpg';
    }

    // utility functions
    this.getPhotoTakenDate = function () {
        var dateParts = flickrInfo.dates.taken.split(' ');
        var yearMonthDay = dateParts[0].split('-');
        var hoursMinutesSeconds = dateParts[1].split(':');
        var date = new Date(yearMonthDay[0],
                                    yearMonthDay[1],
                                    yearMonthDay[2],
                                    hoursMinutesSeconds[0],
                                    hoursMinutesSeconds[1],
                                    hoursMinutesSeconds[2]);

        return date;
    }

    this.getFormattedPhotoDate = function () {
        var date = this.getPhotoTakenDate();

        var day = date.getDate();
        var sup = '';
        if (day == 1 || day == 21 || day == 31) {
            sup = "st";
        }
        else if (day == 2 || day == 22) {
            sup = "nd";
        }
        else if (day == 3 || day == 23) {
            sup = "rd";
        }
        else {
            sup = "th";
        }

        return this.getMonthTaken() + ' ' + day + sup + ", " + date.getFullYear();
    },

    this.getMonthTaken = function () {
        var date = this.getPhotoTakenDate();

        var m_names = new Array("January", "February", "March",
            "April", "May", "June", "July", "August", "September",
            "October", "November", "December");

        return m_names[date.getMonth()]
    }
}