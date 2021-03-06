$(document).ready(function() {
    // materialize initializations
    $('.sidenav').sidenav();
    $(".dropdown-trigger").dropdown( {
        hover: true
    });
    $(".modal").modal();

});

// Initialize the google map.
let map, infoWindow;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 41.850033, lng: -87.6500523 },
        zoom: 4.5
    });
    infoWindow = new google.maps.InfoWindow;
    getLocations();

    // Use HTML5 geolocation to find the user when they navigate to the page and zoom in on their location.
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(function positionSuccess(position) {
            const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('You are here');
            infoWindow.open(map);
            map.setCenter(pos);
            map.setZoom(15);

            // Checks to see if the user is located in one of their saved locations and if so, displays
            // the information the user has saved for that location.
            $("#locationDetails").empty();
            $.get("/api/users/" + localStorage.getItem("userId"), function (data) {
                for (let i = 0; i < data.Locations.length; i++) {
                let latLng = { lat: Number(data.Locations[i].latitude), lng: Number(data.Locations[i].longitude) };

                // If user is within 100 units of saved location then the names of friends that are saved for
                // that area are displayed in the div 'locationDetails'
                if(checkDistance(pos, latLng)) {
                    $("#locationDetails").empty();
                    let foundData = $("<div class='foundData'>");
                    let savedLocation = $("<h6>");
                    let locationId = data.Locations[i].id;
                    for(let j = 0; j < data.People.length; j++) {
                        savedLocation.text(data.Locations[i].locationName);
                        if(data.People[j].LocationId === parseInt(locationId)) {
                            let personObj = data.People[j];
                            let info = $("<a class='waves-effect waves-light btn modal-trigger moreInfo' href='#personInfo'>").
                            text(personObj.firstName + " " + personObj.lastName + " - " + personObj.role);
                            info.data(personObj);
                            foundData.append(info);
                        }
                    }
                    foundData.prepend(savedLocation);
                    $("#locationDetails").append(foundData);

                    // Opens a modal with more information on the friend if the friend's name is clicked.
                    $(".moreInfo").on("click", function(){
                        $(".modal-content").empty();
                        const person = $(this).data();
                        const title = $("<h5>");
                        title.text(person.firstName + " " + person.lastName);
                        const nickName = $("<p>").text("Nickname: " + person.nickname);
                        const jobrole = $("<p>").text("Role: " + person.role);
                        const notesOnPerson = $("<p>").text("Notes: " + person.notes);
                        $(".modal-content").append(title).append(nickName).append(jobrole).append(notesOnPerson);
                        
                        $('#personInfo').modal();
                    });
                }
        }
    });
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

// Get all of the user's saved locations and place markers on the map for each location.
function getLocations() {
    $.get("/api/users/" + localStorage.getItem("userId"), function (data) {
        for (let i = 0; i < data.Locations.length; i++) {
            let latLng = { lat: Number(data.Locations[i].latitude), lng: Number(data.Locations[i].longitude) };
            placeMarker(latLng, map);
            let newRow = $("<tr>");
            newRow.text(data.Locations[i].locationName);
            let btn = $("<a class='btn-small waves-effect waves-light listFriends modal-trigger' href='#personInfo'><i class='material-icons'>group</i></a>");
            btn.data(data.Locations[i]);
            newRow.append(btn);
            $("#locationsTable > tbody").append(newRow);
        }
    });
}

// When user clicks on friend symbol next to locatin name, a list of friends saved in that location pops up.
$(document).on("click", ".listFriends", function () {
    $(".modal-content").empty();
    const location = $(this).data();
    const title = $("<h5>");
    title.text(location.locationName);
    $(".modal-content").append(title);
    $.get("/api/users/" + localStorage.getItem("userId"), function (data) {
        for(let i = 0; i < data.People.length; i++) {
            if(data.People[i].LocationId === parseInt(location.id)) {
            let info = $("<p>").text(data.People[i].firstName + " " + data.People[i].lastName + " - " + data.People[i].role);
            $(".modal-content").append(info);
            }
        }
    })
    $("#locationInfo").modal();
});

// The function that places a marker at the user's saved locations.
function placeMarker(latLng, map) {
    const marker = new google.maps.Marker({
        position: latLng,
        map: map
    });
    const circle = new google.maps.Circle({
        map: map,
        radius: 100,
        fillColor: '#AA0000'
    });
    circle.bindTo('center', marker, 'position');
}

// Computes to see if the user is located within 100 units of one of their saved locations.
function checkDistance(userLocation, markerLocation) {
    const userCoords = new google.maps.LatLng(userLocation.lat, userLocation.lng);
    const markerCoords = new google.maps.LatLng(markerLocation.lat, markerLocation.lng);
    if (google.maps.geometry.spherical.computeDistanceBetween(userCoords, markerCoords) <= 100) {
        return true;
    }
    
    return false;
}
