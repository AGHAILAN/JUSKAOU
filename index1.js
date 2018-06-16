	
   
/********************************************************
* Déclaration des variables                                      
********************************************************/
// pour le dessin du svg
var finalpaths = [];

// Pour l affichage multiple des directions
var requestArray = [], renderArray = [], renderArray2 = [];
var cur = 0, cur2 = 0;
// tableau de points temporaires à vider à l'intérieur de la fonction
var temp_Points = [];
////////////////////////////////
   var renderArray3;
   var pointsPrises=0;

    var drivePolygons = [];
	
	var circlePoints = [];
	
	var drivePolyPoints = []

	var searchPolygon, drivePolygon = null;
	
	var travel_distance_km ;

	var travel_time_sec;
	
	var pointInterval = 20;
	
	var startpoint;
	
	var searchPointsmax;
	
	var directionsService = null;

    var directionsService2 = new google.maps.DirectionsService();

	var markers = {};
    var starters = {};

	var selectedMode = google.maps.TravelMode.DRIVING;

	//Sans affichage (pas de directions)
    //var directionsDisplay = new google.maps.DirectionsRenderer();

	var requestDelay = 100;

	var reset = function()
	{
		 circlePoints = [];
		
		 drivePolyPoints = [];

		 markers = {};
        starters = {};
        //Sans affichage (pas de directions)
		//directionsDisplay.setMap(null);
	}; 


/*************************************************************
* Etape principale : Deux fonctions pour dessiner les chemins                                     
**************************************************************/
var drawIsochrones = function(posi,ds,distance,time,mode) {
	
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

    
};




function getDirections() {
	
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
        //drivePolygon.getPaths().forEach(function (x) { finalpaths.push(x.getArray()); }); 
        
//console.log("****************************" + finalpaths + "****************************");
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
		
		//Calcul du pourcentage fait
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
		avoidHighways: true,
        //avoidTolls: true,
        //avoidFerries: true

	};

	directionsService.route(request, directionsearch)
};

/********************* Fin Etape principale *******************************/


/**************************************************************************************
* Etape 2 : interaction avec le directionService                
* Input   : une requête définissant le départ et la destination de recherche                     
* Output  : Une réponse avec les valeurs de legs.steps, legs.duration et legs.distance                                        
***************************************************************************************/
function directionsearch(response, status) {
	if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
		setTimeout(function() {
			getDirections(true)
		}, 4000)
	} else {
		if (status == google.maps.DirectionsStatus.OK) {
            //Sans affichage (pas de directions)
			//directionsDisplay.setDirections(response);
           
            // Pour l affichage multiple des directions
           /*  renderArray[cur] = new google.maps.DirectionsRenderer();
            renderArray[cur].setMap(map);
            renderArray[cur].setDirections(response);
            cur++; */
            
            
			// var distance = parseInt(response.routes[0].legs[0].distance.value / 1609);
            var distance = parseInt(response.routes[0].legs[0].distance.value);
			var duration = parseFloat(response.routes[0].legs[0].duration.value / 3600).toFixed(2);
			//console.log("duration:" + duration + " distance:" + distance);
            console.log("Nombre de steps recus : " + response.routes[0].legs[0].steps.length);
			isochrone_Step(response.routes[0].legs[0].steps);
            // en essayant les paths svg directions
            //finalpaths.push(response.routes[0].legs[0].steps[0].path);
           
		} else {
			console.log(status);
			setTimeout(function() {
				getDirections(false)
			}, 100)
		}
	}
};

/************************************* Fin Etape 2 *****************************************/


/**************************************************************************************
* Etape 3 : Comparaison de la distance et du temps avec la distance et le temps fournis                
* Input   : legs.steps qui sont les étapes de recherche vers le point du cercle                     
* Output  : Le point final (ou ensemble des points finaux qui représentent les sommets du polygone)                                        
***************************************************************************************/
function isochrone_Step(steps) {
	
	
	var unit = 0;
	var limitediff1=false;
    var limitediff2=false;
    var hash;
    var lastPoint;
    var p;
    var dejamarque = false;
	temp_Points = [];
    
	var comparator = travel_distance_km;
	
	if(ISOCHRONE)
	{
		comparator = travel_time_sec;
	}

	  for (var n = 0; n < steps.length; n++) {
        
          if(starters[steps[n].end_location.toString()])
              {
              dejamarque = true;
              break;
              }
          
		if(ISOCHRONE)
			unit += steps[n].duration.value;
		else
			unit += steps[n].distance.value;
		
		if (unit < comparator) {
			temp_Points.push(steps[n].end_location)
		}
		 else {
            p=n; // nombre de steps moyen
            console.log("****************************yes " + p + " yes****************************");
			break;
		}
          
	}
    
    if(!dejamarque)
{
    var valred;
    if (travel_distance_km/1000 <= 30)
        valred=3;
    else
        valred=4;
    //if(steps[p-divi])
      //  {
          firstnext = steps[n-valred].end_location.toString();
     //   }
    if(steps[n])
        {
         console.log("*********** (unit-comparator) *****************" + (unit-comparator) + "****************************");
         console.log("**** comparator - (unit-steps[n].distance.value ****" + (comparator - (unit-steps[n].distance.value)) + "****************************");
         console.log("**** comparator - (unit-steps[n].duration.value ****" + (comparator - (unit-steps[n].duration.value)) + "****************************");
        //This point becomes the Drivetime polygon marker.
	    limitediff1 = (unit - comparator) <= 3000;
        limitediff2 = (comparator - (unit-steps[n].distance.value - steps[n-1].distance.value)) <= 3000;
	
	  if(ISOCHRONE)
	  {
		limitediff1 = (unit - comparator) <= 240; 
        limitediff2 = (comparator - (unit-steps[n].duration.value)) < 240; 
	  }
    
    
    
    console.log("temp_Points[temp_Points.length-1] : " + temp_Points[temp_Points.length-1]);
    console.log("temp_Points[temp_Points.length-2] : " + temp_Points[temp_Points.length-1]);
    console.log("temp_Points[temp_Points.length-3] : " + temp_Points[temp_Points.length-1]);
    console.log("steps[n].end_location : " + steps[n].end_location);
    console.log("steps[n-1].end_location : " + steps[n-1].end_location);
    console.log("steps[n-2].end_location : " + steps[n-2].end_location);
     
     lastPoint = steps[n-1].end_location;
     // Pour le svg
     var k=n;
     if (limitediff2){
        lastPoint = steps[n-2].end_location;
        // Pour le svg
        k=n-1;
       }
    
       hash = lastPoint.toString();
 }
    
	if((!markers[hash]) && (limitediff1 || limitediff2) && (!starters[firstnext]))
	{
        // pour remplir la table svg
        for (var j = 0; j < k; ++j) {
              finalpaths.push(steps[j].path);
             }
        // fin chargement table svg
		markers[hash] = hash;
        starters[firstnext] = firstnext;
		console.log(hash);
        pointsPrises++;
		//drivePolyPoints.push(lastPoint);
        
	
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
        
		//if (drivePolygon){
        drivePolygon.setMap(map);
		drivePolygons.push(drivePolygon)   
        //}
		
	}
 
	//sortPoints2Polygon();
	
	
    //console.log("****************************" + drivePolyPoints + "****************************");
    // Si on veut placer des marqueurs dans les points trouvés
	//placeMarker(lastPoint, false);
        
////// Dessin des points finaux ///////////////////////
    
   
     routeLimite = {
      origin: startpoint,
      destination: lastPoint,
      travelMode: google.maps.TravelMode.DRIVING,
      avoidHighways: true,
      //avoidTolls: true,
      //avoidFerries: true
    }
        
    
    directionsService2.route(routeLimite, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      renderArray2[cur2] = new google.maps.DirectionsRenderer({
      polylineOptions: {
      strokeColor: "blue"
    }
  });
      renderArray2[cur2].setMap(map);
      renderArray2[cur2].setDirections(result);
      cur2++;
       
      //App.map.fitBounds(App.bounds.union(result.routes[0].bounds));
      drivePolyPoints.push(lastPoint);
      sortPoints2Polygon();
      // if (drivePolygon){
      drivePolygon.setPaths(drivePolyPoints);
      //}
      
    } else {
      //document.getElementById('status').innerHTML += "routeLimite:" + status + "<br>";
    }
  });    




        

//////////////////////// Fin dessin des points finaux /////////////////


	}

 else {
     console.log(hash+" Point déjà visité donc pas pris en compte");
 }
}
	setTimeout("getDirections()", requestDelay);
};

/****************** Fin Etape 3 **************************************/

/********************************************************
* Etape 4 : Tri des points               
* Input   :                          
* Output  :                                        
********************************************************/
function sortPoints2Polygon() {
	
	points = [];
	
	var bounds = new google.maps.LatLngBounds();
	
	for (var i = 0; i < drivePolyPoints.length; i++) {
		
		points.push(drivePolyPoints[i]);
		
		bounds.extend(drivePolyPoints[i]);
	}

	var center = bounds.getCenter();
	
	var bearing = [];
	
	for (var i = 0; i < points.length; i++) {
		
		points[i].bearing = google.maps.geometry.spherical.computeHeading(center, points[i]);
	}

	points.sort(sortByBearing);

	drivePolyPoints = points;
}


function sortByBearing(a, b) {
	
	return (a.bearing - b.bearing)
};


/********************** Fin Etape 4 *******************************/

/********************************************************
* Etape 1 : Dessin du cercle                
* Input   : La position comme centre et la distance comme rayon                         
* Output  : Points de recherche à partir du cercle                                        
********************************************************/
function getCirclePoints(center, radius) {

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
};
/********************* Fin Etape 1 *******************************/

/********************************************************
* Etape obtionnelle : Placer un marqueur                                      
********************************************************/
function placeMarker(location,isstartpoint) {
	
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
/************* Fin Etape optionnelle ****************/


/********************************************************
* Etape 5 : Dessin du svg              
* Input   :                          
* Output  :                                         
********************************************************/

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

//************************** Fin Etape 5 ******************************/

/********************************************************
* Etape 6 : Sauvegarde du svg              
* Input   :                          
* Output  :                                         
********************************************************/
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

/******************** Fin Etape 6 **********************************/



//*****************************************************************************
//***********************Préparation et lancement de recherche*****************
//*****************************************************************************
var c_marker;
function initialize() {

			// =============================================================
			// En cas d'un style personnalisé
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


		var launchSearching = function(){

			//var tdist = document.getElementById("ddlTravelDistance");
			//var dist = Number(tdist.options[tdist.selectedIndex].value);
            var dist = document.getElementById("distance-input").value;
            //console.log(window.ISOCHRONE);
          
            
			//var tdur = document.getElementById("ddlTravelDuration");
			//var duration = Number(tdur.options[tdur.selectedIndex].value);
            var duration = document.getElementById("duration-input").value;
            console.log(duration);
			var travelMode =  google.maps.TravelMode[selectedMode];
            //console.log(selectedMode);
			if(window.ISOCHRONE)
			{
				if(duration > -1){
					var posi = c_marker.getPosition(); 
					//c_marker.setVisible(false);
					drawIsochrones(posi,directionsService,(3*duration)/5,duration,travelMode);
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
		window.is_time = function(val)
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
        
	}

google.maps.event.addDomListener(window, 'load', initialize);
