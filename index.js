
var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
osmAttrib = '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
osm = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib }),
map = new L.Map('map', { center: new L.LatLng(43.601385246178566, -79.6414861515353), zoom: 13 });

var indicMarkerFeatures = L.featureGroup();
map.addLayer(indicMarkerFeatures);

L.control.layers({
'osm': osm.addTo(map),
"google": L.tileLayer('http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}', {
  attribution: 'google'
})
}).addTo(map);


map.on(L.Draw.Event.CREATED, function (e) {
var layer = e.layer;
indicMarkerFeatures.addLayer(layer);
});

let env = "dev";
let tripId = null;

window.onload = function() {
    try {
      var url_string = (window.location.href);
      var url = new URL(url_string);
      tripId = url.searchParams.get("trip_id");
      env = url.searchParams.get("env");
      getTripData(tripId, env);   
    }catch (err) {
        console.log("Issues with Parsing URL Parameter's - " + err);
    }
}

function getTripData(tripId, env){
  if(tripId != null){

    const url = 'https://y3kjjhpgu3.execute-api.us-east-1.amazonaws.com/prod/dashboard/trips/get_trip';
    var bodyMap = JSON.stringify({ "env": env, "trip_id": tripId })
    console.log(`Body Map: ${bodyMap}`);
    var h = {
    headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
    },
    body: bodyMap,
    method: "POST"
    }

    fetch(url, h).then(response => response.json()).then(data => {
        console.log(`${JSON.stringify(data.Payload)}`)
        let trip = data.Payload;
        viewTripMap(trip);
    });
 }
}

function viewTripMap(trip){
    indicMarkerFeatures.clearLayers();
    indicMarkerFeatures = addMapLayers(trip, indicMarkerFeatures);
    var firstLayer;
    for (t in indicMarkerFeatures._layers) {
      firstLayer = indicMarkerFeatures._layers[t];
    }
    try {
      map.fitBounds(firstLayer.getBounds());
    } catch (error) {
      map.panTo(new L.LatLng(43.601385246178566, -79.6414861515353))
    }
}

function addMapLayers(trip, fg) {
    let points = [];
    let tripRoute = trip.route;
    
    if (tripRoute.length == 0)
      return fg;
      tripRoute.forEach(rm => {
        let point = new L.LatLng(rm.lat, rm.lng);
        points.push(point);
        //Shows end to end polygon with all marker events
        if (rm.hasOwnProperty('events') && rm.events.length != 0) {
          let marker = [rm.lat, rm.lng];
          let mapMarker = new L.Marker(marker);
          
          let time = new Date(0);
          time.setUTCSeconds(rm.time_epoch);
          mapMarker.bindPopup(`${marker[0]}, ${marker[1]} </br> <b>Type: </b> ${rm.events[0].type} </br> <b>time:</b> ${time.toISOString()} </br> <b>Content:</b> ${rm.events[0].content}`);
          fg.addLayer(mapMarker);
        }
        
    });
    console.log(`Points ${points}`);
    var firstpolyline = new L.Polyline(points, {
    color: 'black',
    weight: 4,
    opacity: 1,
    smoothFactor: 1
    });
    fg.addLayer(firstpolyline);
    return fg;
}