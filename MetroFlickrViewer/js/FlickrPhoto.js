var MetroFlickrViewer = MetroFlickrViewer || {};

MetroFlickrViewer.FlickrPhoto = function (initPhoto) {
    var flickrPhoto;

    this.getFlickrPhoto = function () {
        return flickrPhoto;
    }
    this.setFlickrPhoto = function (photo) {
        flickrPhoto = photo;
    }

    var takenDate;

    this.getTakenDate = function () {
        return takenDate;
    }
    this.setTakenDate = function (date) {
        takenDate = takenDate;
    }
}