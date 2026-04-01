document.addEventListener("DOMContentLoaded", init);

let socket;
let map

const state = {
    users: {},
    markers: {}
}

function init() {
    setUpMap();
    setUpSocket();
    trackLocation();
}

