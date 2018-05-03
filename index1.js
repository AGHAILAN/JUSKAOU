	
   
// pour le dessin du svg
var finalpaths = []; 

// Pour l affichage multiple des directions
var requestArray = [], renderArray = [];
var cur = 0;
////////////////////////////////
   var pointsPrises=0;

    var drivePolygons = [];
	
	var circlePoints = [];
	
	var drivePolyPoints = []

	var searchPolygon, drivePolygon = null;
	
	var travel_distance_km ;

	var travel_time_sec;
	
	var pointInterval = 30;
	
	var startpoint;
	
	var searchPointsmax;
	
	var directionsService = null;

	var markers = {};

	var selectedMode = google.maps.TravelMode.DRIVING;

	//Sans affichage (pas de directions)
    //var directionsDisplay = new google.maps.DirectionsRenderer();

	var requestDelay = 100;

	var reset = function()
	{
		 circlePoints = [];
		
		 //drivePolyPoints = [];

		 markers = {};
        //Sans affichage (pas de directions)
		//directionsDisplay.setMap(null);
	}



; var drawIsochrones = function(posi,ds,distance,time,mode) {
	
	ISOCHRONE = time ? true:false;

	startpoint = posi;

	directionsService = ds;
	
	travel_distance_km = (distance * 1000) || 1000;
    //travel_distance_km = (distance) || 1000;
    
    //travel_distance_km = distance;

	travel_time_sec = (time * 60 ) || 60;

    selectedMode = mode || google.maps.TravelMode.DRIVING;
	
	centerMarker = placeMarker(startpoint, true);
	
    //searchPoints = getCirclePoints(startpoint, distance);
	searchPoints = getCirclePoints(startpoint, distance);
	
	searchPointsmax = searchPoints.length;
	
	drivePolyPoints = [];
	
	//Sans affichage (pas de directions)
    //directionsDisplay.setMap(window.map);directionsDisplay.setOptions( { suppressMarkers: true } );

	getDirections();
    

    
};function getDirections() {
	
	if (!searchPoints.length) {
		
		//If Searchpoints are all completed, then we are done
		document.getElementById("progress").innerHTML = "<p>100%</p>";
		console.log("nombre de points prises en compte : " + pointsPrises);
		//Fit Map to Drive time polygon created
		map.fitBounds(drivePolygon.getBounds());
		
		//Remove Search Circle
		//searchPolygon.setMap(null);
        
        // Dessin du SVG
        /// pour le svg
        drivePolygon.getPaths().forEach(function (x) { finalpaths.push(x.getArray()); });
console.log("****************************" + finalpaths + "****************************");
 svgProps = poly_gm2svg(finalpaths, function (latLng) {
        return {
            lat: latLng.lat(),
            lng: latLng.lng()
        }
    });
    drawPoly(document.getElementById('mySVG'), svgProps);

  // save svg
 //exportSVG(document.getElementById('mySVG'));
        
// Fin dessin du SVG

		reset();

		//Process is finished.
		return;

	} else {
		
		//Calculate Percetage done.
		var percent = Math.round(100 - ((searchPoints.length / searchPointsmax) * 100));
		
		document.getElementById("progress").innerHTML = "<p>" + percent + "%</p>"
	}

	var from = startpoint.lat() + ' ' + startpoint.lng();
	var to = searchPoints[0].lat() + ' ' + searchPoints[0].lng();
	
	//Removed processed Point. 
	searchPoints.shift();
	
	//directionsDisplay.setMap(map);
	
	
	
	var request = {
		origin: from,
		destination: to,
		travelMode: google.maps.TravelMode[selectedMode],
		avoidHighways: false
	};

	directionsService.route(request, directionsearch)
};function directionsearch(response, status) {
	if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
		setTimeout(function() {
			getDirections(true)
		}, 4000)
	} else {
		if (status == google.maps.DirectionsStatus.OK) {
            //Sans affichage (pas de directions)
			//directionsDisplay.setDirections(response);
           
            // Pour l affichage multiple des directions
            renderArray[cur] = new google.maps.DirectionsRenderer();
            renderArray[cur].setMap(map);
            renderArray[cur].setDirections(response);
            cur++;
            
            
			// var distance = parseInt(response.routes[0].legs[0].distance.value / 1609);
            var distance = parseInt(response.routes[0].legs[0].distance.value);
			var duration = parseFloat(response.routes[0].legs[0].duration.value / 3600).toFixed(2);
			//console.log("duration:" + duration + " distance:" + distance);
            console.log("Nombre de steps recus : " + response.routes[0].legs[0].steps.length);
			isochrone_Step(response.routes[0].legs[0].steps);
		} else {
			console.log(status);
			setTimeout(function() {
				getDirections(false)
			}, 100)
		}
	}
};function isochrone_Step(steps) {
	
	
	var unit = 0;
	
	var temp_Points = [];

	var comparator = travel_distance_km;
	
	if(ISOCHRONE)
	{
		comparator = travel_time_sec;
	}

	for (var n = 0; n < steps.length; n++) {
		
		if(ISOCHRONE)
			unit += steps[n].duration.value;
		else
			unit += steps[n].distance.value;
		
		if (unit < comparator) {
			temp_Points.push(steps[n].end_location)
		}
		 else {
			break;
		}
	}

    //This point becomes the Drivetime polygon marker.
	var lastPoint = temp_Points[temp_Points.length - 1];

	var hash = lastPoint.toString();
	
	if(!markers[hash])
	{
		markers[hash] = hash;
		console.log(hash);
        pointsPrises++;
		drivePolyPoints.push(lastPoint);
	    
	
	if (drivePolyPoints.length == 1) {

		drivePolygon = new google.maps.Polygon({
			paths: drivePolyPoints,
			strokeColor: '#FF0000',
			strokeOpacity: 0.8,
			strokeWeight: 1,
			fillColor: '#FF0000',
			fillOpacity: 0.35,
			clickable: false,
			map: map
		});
		
		drivePolygon.setMap(map);
		
		drivePolygons.push(drivePolygon)
	}
 
	sortPoints2Polygon();
	
	drivePolygon.setPaths(drivePolyPoints);
    
    // Si on veut placer des marqueurs dans les points trouvés
	//placeMarker(lastPoint, false);

	}
 else {
     console.log(hash+" Point déjà visité donc pas pris en compte");
 }

	setTimeout("getDirections()", requestDelay);
};function sortPoints2Polygon() {
	
	points = [];
	
	var bounds = new google.maps.LatLngBounds();
	
	for (var i = 0; i < drivePolyPoints.length; i++) {
		
		points.push(drivePolyPoints[i]);
		
		bounds.extend(drivePolyPoints[i])
	}

	var center = bounds.getCenter();
	
	var bearing = [];
	
	for (var i = 0; i < points.length; i++) {
		
		points[i].bearing = google.maps.geometry.spherical.computeHeading(center, points[i]);
	}

	points.sort(sortByBearing);

	drivePolyPoints = points
}


function sortByBearing(a, b) {
	
	return (a.bearing - b.bearing)
}
;function getCirclePoints(center, radius) {

	var circlePoints = [];
	var searchPoints = [];
	with(Math) {
        var numbPoints=0;
		var rLat = (radius / 6378.135) * (180 / PI);
		var rLng = rLat / cos(center.lat() * (PI / 180));
		for (var a = 0; a < 361; a++) {
			var aRad = a * (PI / 180);
			var x = center.lng() + (rLng * cos(aRad));
			var y = center.lat() + (rLat * sin(aRad));
			var point = new google.maps.LatLng(parseFloat(y), parseFloat(x));
			circlePoints.push(point);
			if (a % pointInterval == 0) {
				searchPoints.push(point)
                numbPoints++;
			}
		}
        console.log("Nombre de points qui seront traités : " + numbPoints);
	}
    
	searchPolygon = new google.maps.Polygon({
		paths: circlePoints,
		strokeColor: '#000000',
		strokeOpacity: 1,
		strokeWeight: 1,
		fillColor: '#ffffff',
		geodesic: true,
		fillOpacity: 0.5,
		clickable: false
	});
	searchPolygon.setMap(map);
	map.fitBounds(searchPolygon.getBounds());
	return searchPoints
};function placeMarker(location,isstartpoint) {
	
	var marker;

	var center = {
		url: 'center.png',
		size: new google.maps.Size(32, 32),
		origin: new google.maps.Point(0,0),
		anchor: new google.maps.Point(16, 32)
	};

	var point = {
		url: 'point.png',
		size: new google.maps.Size(32, 32),
		origin: new google.maps.Point(0,0),
		anchor: new google.maps.Point(16, 32)
	};

	if(isstartpoint)
	{
		marker = new google.maps.Marker({
			position: location,
			map: map,
			icon :center,
			animation: google.maps.Animation.DROP
		});

	}
	else
	{
		marker = new google.maps.Marker({
			position: location,
			map: map,
			icon :point
		});
	}

	return marker
}
//************************
// Dessin du SVG
//**********************
function latLng2point(latLng) {

    return {
        x: (latLng.lng + 180) * (256 / 360),
        y: (256 / 2) - (256 * Math.log(Math.tan((Math.PI / 4) + ((latLng.lat * Math.PI / 180) / 2))) / (2 * Math.PI))
    };
}

function poly_gm2svg(gmPaths, fx) {

    var point,
    gmPath,
    svgPath,
    svgPaths = [],
        minX = 256,
        minY = 256,
        maxX = 0,
        maxY = 0;

    for (var pp = 0; pp < gmPaths.length; ++pp) {
        gmPath = gmPaths[pp], svgPath = [];
        for (var p = 0; p < gmPath.length; ++p) {
            point = latLng2point(fx(gmPath[p]));
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
            svgPath.push([point.x, point.y].join(','));
        }


        svgPaths.push(svgPath.join(' '))


    }
    return {
        path: 'M' + svgPaths.join('z M') + 'z',
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };

}

function drawPoly(node, props) {

    var svg = node.cloneNode(false),
        g = document.createElementNS("http://www.w3.org/2000/svg", 'g'),
        path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
    node.parentNode.replaceChild(svg, node);
    path.setAttribute('d', props.path);
    g.appendChild(path);
    svg.appendChild(g);
    svg.setAttribute('viewBox', [props.x, props.y, props.width, props.height].join(' '));


}
//**************************
// FIN DESSIN DU SVG
//**************************

//**************************
// sauvegarde du svg
//**************************
var exportSVG = function(svg) {
  // first create a clone of our svg node so we don't mess the original one
  var clone = svg.cloneNode(true);
  // parse the styles
  parseStyles(clone);

  // create a doctype
  var svgDocType = document.implementation.createDocumentType('svg', "-//W3C//DTD SVG 1.1//EN", "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd");
  // a fresh svg document
  var svgDoc = document.implementation.createDocument('http://www.w3.org/2000/svg', 'svg', svgDocType);
  // replace the documentElement with our clone 
  svgDoc.replaceChild(clone, svgDoc.documentElement);
  // get the data
  var svgData = (new XMLSerializer()).serializeToString(svgDoc);

  // now you've got your svg data, the following will depend on how you want to download it
  // here I'll use FileSaver.js (https://github.com/yrezgui/FileSaver.js)
  
  var blob = new Blob([svgData.replace(/></g, '>\n\r<')]);
  saveAs(blob, 'myAwesomeSVG.svg');
  
};

var parseStyles = function(svg) {
  var styleSheets = [];
  var i;
  // get the stylesheets of the document (ownerDocument in case svg is in <iframe> or <object>)
  var docStyles = svg.ownerDocument.styleSheets;

  // transform the live StyleSheetList to an array to avoid endless loop
  for (i = 0; i < docStyles.length; i++) {
    styleSheets.push(docStyles[i]);
  }

  if (!styleSheets.length) {
    return;
  }

  var defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  if (!defs.parentNode) {
    svg.insertBefore(defs, svg.firstElementChild);
  }
  svg.matches = svg.matches || svg.webkitMatchesSelector || svg.mozMatchesSelector || svg.msMatchesSelector || svg.oMatchesSelector;


  // iterate through all document's stylesheets
  for (i = 0; i < styleSheets.length; i++) {
    var currentStyle = styleSheets[i]

    var rules;
    try {
      rules = currentStyle.cssRules;
    } catch (e) {
      continue;
    }
    // create a new style element
    var style = document.createElement('style');
    // some stylesheets can't be accessed and will throw a security error
    var l = rules && rules.length;
    // iterate through each cssRules of this stylesheet
    for (var j = 0; j < l; j++) {
      // get the selector of this cssRules
      var selector = rules[j].selectorText;
      // probably an external stylesheet we can't access
      if (!selector) {
        continue;
      }

      // is it our svg node or one of its children ?
      if ((svg.matches && svg.matches(selector)) || svg.querySelector(selector)) {

        var cssText = rules[j].cssText;
        // append it to our <style> node
        style.innerHTML += cssText + '\n';
      }
    }
    // if we got some rules
    if (style.innerHTML) {
      // append the style node to the clone's defs
      defs.appendChild(style);
    }
  }

};



//***************************************************************
//***********************TRAITEMENT ET RECHERCHE*****************
//***************************************************************
var c_marker;
function initialize() {

			// =============================================================
			// Some styling fun.
			// =============================================================

			var styles = [
			
			];

			var styledMap = new google.maps.StyledMapType(styles, {
				name: "Isochrone Map"
			});




			var directionsService = new google.maps.DirectionsService();

			var london = new google.maps.LatLng(51.49059839706688, -0.09384436035156707);

			var mapOptions = {
				center: london,
				zoom: 15
			};

			window.map = new google.maps.Map(document.getElementById('map-top'), mapOptions);

			map.mapTypes.set('Isochrone Map', styledMap);
			map.setMapTypeId('Isochrone Map');




		// =============================================================
		// google removed getBounds from Polygon so had to improvise.
		// =============================================================
		if (!google.maps.Polygon.prototype.getBounds) {

			google.maps.Polygon.prototype.getBounds = function() {
				var bounds = new google.maps.LatLngBounds()
				this.getPath().forEach(function(element, index) {
					bounds.extend(element)
				})
				return bounds
			}
		}

       // =============================================================
	   // Autocomplete.
	   // =============================================================


	   var input =  document.getElementById('location-input');

	   
	   //map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
	   

	   var autocomplete = new google.maps.places.Autocomplete(input);
		//autocomplete.bindTo('bounds', map);
		c_marker = new google.maps.Marker({
			map: map,
			anchorPoint: new google.maps.Point(0, -29),
			draggable:true,
			animation: google.maps.Animation.DROP
		});

		c_marker.setPosition(london);

		google.maps.event.addListener(autocomplete, 'place_changed', function() {

			c_marker.setVisible(false);
			var place = autocomplete.getPlace();
			if (!place.geometry) {
				return;
			}

	    // If the place has a geometry, then present it on a map.
	    if (place.geometry.viewport) {
	    	map.fitBounds(place.geometry.viewport);
	    } else {
	    	map.setCenter(place.geometry.location);
	      map.setZoom(17);  // Why 17? Because it looks good.
	  }
	  c_marker.setIcon(/** @type {google.maps.Icon} */({
	  	url: place.icon,
	  	size: new google.maps.Size(71, 71),
	  	origin: new google.maps.Point(0, 0),
	  	anchor: new google.maps.Point(17, 34),
	  	scaledSize: new google.maps.Size(35, 35)
	  }));

	  c_marker.setPosition(place.geometry.location);
	  c_marker.setVisible(true);

	});


		// =============================================================
		// This is where the fun begins.
		// =============================================================
		var launchSearching = function(){

			//var tdist = document.getElementById("ddlTravelDistance");
			//var dist = Number(tdist.options[tdist.selectedIndex].value);
            var dist = document.getElementById("distance-input").value;
            //console.log(window.ISOCHRONE);
          
            
			//var tdur = document.getElementById("ddlTravelDuration");
			//var duration = Number(tdur.options[tdur.selectedIndex].value);
            var duration = document.getElementById("duration-input").value;
            
			var travelMode =  google.maps.TravelMode[selectedMode];
            //console.log(selectedMode);
			if(window.ISOCHRONE)
			{
				if(duration > -1){
					var posi = c_marker.getPosition(); 
					//c_marker.setVisible(false);
					drawIsochrones(posi,directionsService,3,duration,travelMode);
				}
				else
					alert("Choose a duration.")
			}
			else
			{
				if(dist > -1){
					var posi = c_marker.getPosition(); 
					//c_marker.setVisible(false);
					drawIsochrones(posi,directionsService,dist,null,travelMode);
				}
				else
					alert("Choose a distance.")
			}
            



		}

		window.launchSearching = launchSearching;
		window.ISOCHRONE = false;
		window.isc_changed = function(val)
		{
			if(val == 0)
			{   
			 window.ISOCHRONE = false;
			}
			else
			{
             window.ISOCHRONE = true;
			}
		}
        
    
//
        
        
    /////////// Je me suis arrete ici, en essayant de mettre des infos bulles personnalises////////////////////////////////
//////////////////////////////////////////
/////////////////////////////////////////
/*
        //Defining map as a global variable to access from other functions
        //var map;    
        
        //Enabling new cartography and themes
            google.maps.visualRefresh = true;


            //Getting map DOM element
            //var mapElement = document.getElementById("map-top");

            //Creating a map with DOM element which is just obtained
            //map = new google.maps.Map(mapElement, mapOptions);

            //Creating the contents for info box
            var boxText = document.createElement('div');
            boxText.className = 'infoContent';
            boxText.innerHTML = '<b>Marker Info Box</b> <br> Gives information about marker';

            //Creating the info box options.
            var customInfoBoxOptions = {
                content: boxText,
                pixelOffset: new google.maps.Size(-100, 0),
                boxStyle: {
                    background: "url('img/tipbox2.gif') no-repeat",
                    opacity: 0.75,
                    width: '200px'
                },
                closeBoxMargin: '10px 2px 2px 2px',
                closeBoxURL: 'img/close.gif',
                pane: "floatPane"
            };

            //Initializing the info box
            var customInfoBox = new InfoBox(customInfoBoxOptions);

            //Creating the map label options.
            var customMapLabelOptions = {
                content: 'Custom Map Label',
                closeBoxURL: "",
                boxStyle: {
                    border: '1px solid black',
                    width: '110px'
                },
                position: new google.maps.LatLng(50.8504500, 4.3487800),
                pane: 'mapPane',
                enableEventPropagation: true
            };

            //Initializing the map label
            var customMapLabel = new InfoBox(customMapLabelOptions);

            //Showing the map label
            customMapLabel.open(map);

            //Initializing the marker for showing info box
             var marker = new google.maps.Marker({
                map: map,
                draggable: true,
                position: new google.maps.LatLng(50.8504500, 4.3487800),
                visible: true
            }); 

            //Opening the info box attached to marker
            /* customInfoBox.open(map, marker); */
/*
            //Listening marker to open info box again with contents related to marker
            google.maps.event.addListener(marker, 'click', function (e) {
                boxText.innerHTML = '<b>Marker Info Box</b> <br> Gives information about marker';
                customInfoBox.open(map, this);
            });

            //Listening map click to open info box again with contents related to map coordinates
            google.maps.event.addListener(map,'click', function (e) {
                boxText.innerHTML = '<b>Map Info Box</b> <br> Gives information about coordinates <br> Lat: ' + e.latLng.lat().toFixed(6) + ' - Lng: ' + e.latLng.lng().toFixed(6);
                customInfoBox.setPosition(e.latLng);
                customInfoBox.open(map);
            });

            //Listening info box for clicking close button
            google.maps.event.addListener(customInfoBox, 'closeclick', function () {
                console.log('Info Box Closed!!!');
            });
    
    */
    ///////////////////////////////////////////////////
    //////////////////////////////////////////////////
    
    
	}

    



	google.maps.event.addDomListener(window, 'load', initialize);
