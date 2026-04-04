document.addEventListener("DOMContentLoaded", init);

let socket;
let map

const state = {
    users: {},
    markers: {}
}

function init() {
    setMap();
    setUpSocket();
    trackLocation();
}

function setMap(){
    map = L.map("map", {
        zoomControl: false,
        attributionControl: false
    }).setView([0, 0], 2);

    L.littleLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {maxZoom: 19}
    ).addTo(map);

    map.options.zoomAnimation = true;
    map.options.fadeAnimation = true;

    L.control.zoom({ position: "bottomright"}).addTo(map);
    L.control.scale().addTo(map);

}

function setUpSocket() {
    socket = io()

    socket.on("location:broadcast", handleLocationUpdate);
    socket.on("user:joined", handleUserJoined);
    socket.on("user:left", handleUserLeft);
}

let lastLocation = null;

function trackLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    navigator.geolocation.watchPosition(
        (pos) =>{
            const { latitude, longitude } = pos.coords;


        }
    )
}
