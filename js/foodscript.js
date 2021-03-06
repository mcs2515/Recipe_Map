(function(){
    "use strict";
    
    //url, id, search params
    var YUMMLY_URL = "https://api.yummly.com/v1/api/recipes?_app_id=fb72c077&_app_key=f6ef20b35813502c3869ff8b2341d09e";
    
    var GET_RECIPE_URL = "https://api.yummly.com/v1/api/recipe/";
    var GOOGLE_PLACES_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?";
    var GOOGLEPLACES_URL_KEY = "AIzaSyCaUxW3O4_A3uGXc-MXGcGWZf1HMdWQR9M";
    
    //checkbox bool variables
    var dairyCheck = false,
        eggCheck = false,
        glutenCheck = false,
        peanutCheck = false,
        seafoodCheck = false,
        soyCheck = false,
        treeNutCheck= false;
    
    var allergyUrl= "&allowedAllergy[]=";
    var dairyUrl = "396^Dairy-Free",
        eggUrl = "397^Egg-Free",
        glutenUrl = "393^Gluten-Free",
        peanutUrl = "394^Peanut-Free",
        seafoodUrl = "398^Seafood-Free",
        soyUrl = "400^Soy-Free",
        treeNutUrl = "395^Tree Nut-Free";
    
    //variables used with the maps api
    var map,
        infoWindow,
        markers=[],
        radius = 0,
        miles = 10,
        type = undefined,
        pos= {
            lat: undefined,
            lng: undefined
        };
    
    var firstSearch= false;
    var closed = false;

    function init(){
        //getting the allergies check box options by calling getCheckBox
        getCheckBox("#dairy", function(e) { dairyCheck = e; });
        getCheckBox("#gluten", function(e) { glutenCheck = e; });
        getCheckBox("#peanut", function(e) { peanutCheck = e; });
        getCheckBox("#seafood", function(e) { seafoodCheck = e; });
        getCheckBox("#soy", function(e) { soyCheck = e; });
        getCheckBox("#treeNut", function(e) { treeNutCheck = e; });
        
        //hide the map and lazy button
        document.querySelector('#mapDiv').style.display= 'none';
        document.querySelector('#mapPage').style.display= 'none';
        document.querySelector('#lazyButton').style.display= 'none';
        
        //call respective functions when buttons are pressed
        document.querySelector('#searchButton').onclick = function(){
            searchFoodURL(); 
        }
        document.querySelector('#lazyButton').onclick = function(){
            searchRestaurantURL(); 
        }
        
         $('.togglebtn').click(function(){
             $(this).toggleClass('open');
             $('.menu').toggleClass('open');
          });
        
        //checks if the user uses the enter key
        document.onkeydown = checkKey;
        
        //set up map stuff
        var mapOptions = {
          center: {lat: 39.828127, lng: -98.579404},
          zoom: 12
        };
        
        map= new google.maps.Map(document.getElementById('mapDiv'), mapOptions);
        infoWindow = new google.maps.InfoWindow({map: map});
        
        //get user's current loction with HTML5 geolocation
        getLocation();
        clearMarkers();
    }
    
    //==============method creates an URL FOR YUMMLY to load info based on user input=============================
    function searchFoodURL(){
        // build food URL
        var url = YUMMLY_URL;
        //get the values of each selection
        var searchItem = document.querySelector('#searchBar').value;
        var cuisineOption = document.querySelector('#cuisine').value;
        var courseOption = document.querySelector('#course').value;
        
        //check to see if user entered an item to search
        if(searchItem != null || searchItem != ""){
            url += "&q=";
            url += searchItem.trim().replace(" ", "+");
            url += "&requirePictures=true";
        }
        
        //Add to url for different select options
        if(cuisineOption != "null"){
            url += "&allowedCuisine[]=cuisine^cuisine-";
            url +=  cuisineOption;
        }
        if(courseOption != "null"){
            url += "&allowedCourse[]=course^course-";
            url += courseOption.replace(" ", "+");
        }
         
        //Add to url for diffferent allergens
        if(dairyCheck){
            url += allergyUrl + dairyUrl;
        }   
        if(eggCheck){
            url += allergyUrl + eggUrl;
        }
        if(glutenCheck){
            url += allergyUrl + glutenUrl;
        }
        if(peanutCheck){
            url += allergyUrl + peanutUrl;
        }
        if(seafoodCheck){
            url += allergyUrl + seafoodUrl;
        }
        if(soyCheck){
            url += allergyUrl + soyUrl;
        }
        if(treeNutCheck){
            url += allergyUrl + treeNutUrl;
        }
        
        //send the url and call the function with the info
        getData(url, foodJsonLoaded);     
    }
    
    //===========method creates an URL FOR RESTAURANTS to load info based on user input====================================
    function searchRestaurantURL(){
        // build food URL
        var url = GOOGLE_PLACES_URL;
        //get the values of each selection
        var cuisineOption = document.querySelector('#cuisine').value;
        //in meters --- milesx1609.344 = meter
        radius = miles*1609.344;
        type = 'restaurant';
        
        url += "location=" + pos.lat + "," +pos.lng;
        url += "&radius=" + radius;
        url += "&type=" + type;
        url += "&keyword=" + cuisineOption;
        url += "&key=" + GOOGLEPLACES_URL_KEY;
        
        var googleURL = encodeURIComponent(url);
                               
        var nodeURL = "https://recipe-map.herokuapp.com//?url=" + googleURL;
        
        // Add circle overlay and bind to marker
        var circle = new google.maps.Circle({
          map: map,
          radius: radius,    // metres
          fillColor: 'rgba(5,0,255, .5)',
          center: pos,
          strokeOpacity: 0.3,
          strokeWeight: 2,
        });
        
        //send the url and call the function with the info
        getData(nodeURL, mapsJsonLoaded);
    } 
    
    //===================LOADS THE JSON and functions based on the url sent to it==================================
    function getData(url, func) {

        $(".results").fadeOut(500);   //give animation
        $("#mapPage").fadeOut(500);   //give animation
        
        $.ajax({
          dataType: "json",
          url: url,
          data: null,
          success: func
        });
        
     }
    
    //======================CREATE BODY HTML based on the food obj's info==============================================
    function foodJsonLoaded(obj){
        
        // if there's an error, print a message and return
        if(obj.error){
          var status = obj.status;
          var description = obj.description;
          document.querySelector(".results").innerHTML = "<h3 class='issues'><b>Error!</b></h3>" + "<p class='issues'><i>" + status + "</i><p>" + "<p><i>" + description + "</i><p>";
          $(".results").fadeIn(500);
          return; // Bail out
        }

        // if there are no results, print a message and return
        if(obj.matches == 0){
          var status = "No results found";
          document.querySelector(".results").innerHTML = "<p class='issues'><i>" + status + "</i><p>" + "<p><i>";
          $(".results").fadeIn(500);
          return; // Bail out
        }
        
        if(obj.total_items == 1){
            var object = [obj.event]; 
            return object;
        }
        
        // If there is an array of results, loop through them
        var alldishes = obj.matches;

        unSlick();
        //clear the results section 
        document.querySelector(".results").innerHTML = "";
        
        // loop through recipe ids
        for(var i= 0 ; i <alldishes.length; i++){
            //skip long named recipes
            if(alldishes[i].recipeName.length <= 35){
                var recipeID = alldishes[i].id;
                var recipeUrl = GET_RECIPE_URL; 
                //add on new recipe id to url
                recipeUrl += recipeID + "?";
                //add my id and key
                recipeUrl += "_app_id=fb72c077&_app_key=f6ef20b35813502c3869ff8b2341d09e";  

                //call method to load the json for the recipe id
                getData(recipeUrl, recipeLoaded);    
            }
        }

        //hide the map and show the lazy button
        document.querySelector('#lazyButton').style.display= 'block';
        document.querySelector('#mapDiv').style.display= 'none';
        document.querySelector('#mapPage').style.display= 'none';
        $(".results").fadeIn(500);
    }
    
    //======================LOADS DETAILED DISH INFO==================================================================
    function recipeLoaded(obj){
        unSlick();
        
        //create a unique div box for each recipe id
        var divBox = document.createElement('div');
        divBox.className = "dish";
        
        //create a new set to check for duplicates
        var ingredientArray = Array.from(new Set(obj.ingredientLines));
        
        //console.log(div);
        var bigString= "<img class= 'bookmark' src=media/bookmark.png >"
        bigString += "<h4>" + obj.name + "</h4>";
       
        bigString += "<br>";
        bigString += "<div class='food_image'><img src=\"" + obj.images[0].hostedLargeUrl + "\" /></div>";
        bigString += "<div class= 'detail_div'>";
        
        if(obj.cookTime){
            bigString += "<h5><span class='bold'>Cook time:</span> " + obj.cookTime + "</h5>";
        }
       
        bigString += "<h5><span class='bold'>Ingredients:</span></h5>";
        bigString+= "<ul class='ingredients'>";
        
        for(var i=0; i<ingredientArray.length; i++){
            bigString += "<li>"+ingredientArray[i]+"</li>";
        }
        
        bigString+= "</ul>";
        bigString += "</div>";
        
        //add a link to the dish
        if(obj.attribution.url){
            bigString += "<div class='yummly_link'><p><a href=" + obj.attribution.url + " target= '_blank'>  More at Yummly Link </a></p></div>";
        }
        
        //add div to page
        divBox.innerHTML = bigString;
        document.querySelector(".results").appendChild(divBox);
        
        activateSlick();
    }
    
    function activateSlick(){
        if(!$(".results").hasClass('slick-initialized')){
            $(".results").slick({
                dots: true,
                arrows: false,
                infinite:false,
                variableWidth: true,
                centerMode: true,
                swipeToSlide: true,
                touchThreshold: 500,
            });
        }
    }
    
    function unSlick(){
        if($(".results").hasClass('slick-initialized')){
            $(".results").slick("destroy");
        }
    }
    
    function toggleMenu(){
        $(this).toggleClass('open');
         $('.menu').toggleClass('open');
    }
    
    //=======================CHECKS FOR FOOD ALLERGENS OPTIONS==========================================================
    function getCheckBox(id, food){
        document.querySelector(id).onchange = function(e) {
            food(e.target.checked);
        };
    }
    
    //=======================LOADS RESTAURANT LOCATIONS=================================================================
     function mapsJsonLoaded(obj){
         var allrestaurants = obj.results;

         clearMarkers();
         
         for(var i= 0 ; i <16/*allrestaurants.length*/; i++){
			 
			 var vicinity = allrestaurants[i].vicinity;
			 var address = vicinity.split(',');

			 if(address.length == 3){
				 address.splice(0, 1); //remove the first value in array
			 }
			 
             var name= allrestaurants[i].name;
             var latitude=Number(allrestaurants[i].geometry.location.lat);
             var longitude=Number(allrestaurants[i].geometry.location.lng);
             
             if(latitude&&longitude){
                 addMarker(latitude, longitude, name, address);
             }
         }
         
         document.querySelector('#lazyButton').style.display= 'none';
         document.querySelector('#mapPage').style.display= 'block';
         document.querySelector('#mapDiv').style.display= 'block';
         $("#mapPage").fadeIn(500);
         map.setZoom(11);
     }
    
    //======================HTML5 GEOLOCATION=========================================================================
    function getLocation(){
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                pos = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude};

                infoWindow.setPosition(pos);
                infoWindow.setContent('Your Location.');
                map.setCenter(pos);
              });
        }
        else {
            // Browser doesn't support Geolocation
            window.alert("Geolocation is not supported by this browser.");
        }
    }
    
    //===================CREATES MARKERS for each lat and lng you send to it==========================================
    function addMarker(latitude, longitude, name, address){
//      console.log(latitude + ", " + longitude + ", " + title + ", " + map);
        var position = {lat: latitude, lng: longitude};
        var marker = new google.maps.Marker({position: position, map:map});
        marker.setTitle(name);
        
        //add a listener for the click event
        google.maps.event.addListener(marker, 'click', function(e){
            //have an info window pop up
            makeInfoWindow(position, name, address);
        });
    
      //add the marker
      markers.push(marker);
    }
    
    //====================DISPLAY name and adress in the INFO WINDOW==========================================================
     function makeInfoWindow(position, name, address){
        //close old infowindow if it exists
        if(infoWindow)infoWindow.close();

        //make a new infowindow
        infoWindow=new google.maps.InfoWindow({
            map: map,
            position: position,
            content: "<b>" + name + "</b><br/><b>"+ address+ "</b>",
        });
    }
    
    function clearMarkers(){
        //console.log("erasing");
        //close info winow if it exists
        if(infoWindow)infoWindow.close();
        
        //loop through markers array
        for(var i=0; i< markers.length; i++){
        //call .setMap(null) on each marker to remove it from map
            markers[i].setMap(null);
        }
        //empty or re-initialize markers array
        markers = [];
     }
    
    //=================CHECKS FOR KEYBOARD INPUT and triggers an event===============================================
     function checkKey(e) {
        e = e || window.event;
         
        //ENTER key 
        if(event.keyCode == 13){
            $("#searchButton").click();
        }
    }
    
    window.addEventListener("load",init);
})();