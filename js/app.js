var map

angular
  .module("feedme",[
    "ngResource",
    "ui.router"
  ])
  .config([
    "$stateProvider",
    Router
  ])
  .factory("FoodFactory", [
    "$resource",
    FoodFactory
  ])
  .factory("VisitFactory", [
    "$resource",
    VisitFactory
  ])
  .controller("FeedMeNewCtrl",[
    "FoodFactory",
    "$state",
    FeedMeNew
  ])
  .controller("FeedMeShowCtrl",[
    "FoodFactory",
    "VisitFactory",
    "$state",
    FeedMeShow
  ])


  function mapFunction(long, lat,img_url,address,name,phone){
    mapboxgl.accessToken = 'pk.eyJ1IjoibWFya3M4MjgiLCJhIjoiY2l1dTZ0eG9vMDJhMzJ5b2VwdWpjbHJmeSJ9.pI-acZvMrbtOHhfSaui34Q';
    map = new mapboxgl.Map({
        container: 'map', // container id
        style: 'mapbox://styles/mapbox/streets-v9', //stylesheet location
        center: [long, lat], // starting position
        zoom: 14 // starting zoom
    });
    // Define Marker geolocation
    var geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "message": "foo",
                    "iconSize": [30, 30]
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        long,
                        lat
                    ]
                }
            }
        ]
    };
    geojson.features.forEach(function(marker) {
    // create a DOM element for the marker
    var el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = 'url('+img_url+')';
    var popup = new mapboxgl.Popup({offset:[0, -30]})
    .setHTML(`<p>${name}</p><p>${address}</p><p>${phone}</p>`);
    el.style.width = marker.properties.iconSize[0] + 'px';
    el.style.height = marker.properties.iconSize[1] + 'px';

    // add marker to map
    new mapboxgl.Marker(el, {offset: [-marker.properties.iconSize[0] / 2, -marker.properties.iconSize[1] / 2]})
        .setLngLat(marker.geometry.coordinates)
        .setPopup(popup)
        .addTo(map);
});
}


  function FeedMeNew(FoodFactory, $state){
    this.food = new FoodFactory()
    this.create = function(){
      this.food.$save().then(function(food){
        $state.go("show",{id: food.id})
      })
    }
  }

  function FeedMeShow(FoodFactory,VisitFactory, $state){
    var vm = this
    //Dont Mind Me, I'm just a bunch of references
    this.setBizVars = function (biz) {
      vm.business = vm.businessArr[biz]
      vm.name = vm.business.name
      vm.addressArr = vm.business.location.display_address
      vm.addressJoin = vm.addressArr.join(' ')
      vm.phone = vm.business.phone
      vm.lat = vm.business.location.coordinate.latitude
      vm.long = vm.business.location.coordinate.longitude
      vm.url = vm.business.url
      vm.img_url = vm.business.image_url
      vm.yelp_id = vm.business.id
      mapFunction(vm.long, vm.lat, vm.img_url, vm.addressArr,vm.name, vm.phone)

    }

    //yes button function (logs the current business into our visits database)
    this.visit = new VisitFactory()
    this.sendVisit = function(){
      this.visit.$save({name: vm.name, address:vm.addressJoin, phone: vm.phone, yelp_id: vm.yelp_id }).then(function(){
        $state.go("new")
      })
    }

    // no button function (reiterates through different array for businesses)
    this.getNextBiz = function() {
      vm.currentBiz++;
      if (vm.currentBiz === vm.maxBiz) {
        console.log( "Max Business Length Reached")
        return true;
      }
      else {
        vm.setBizVars(vm.currentBiz)
        return false
      }

    }
    //Initialize the retrieval of the Yelp businesses array from our API
    this.food = FoodFactory.get({id: $state.params.id}, function(food){
      vm.businessArr = food.businesses
      vm.maxBiz=vm.businessArr.length
      vm.currentBiz = 0
      vm.setBizVars(vm.currentBiz)
    })
  }
  //initial ajax call to our api for yelp data
  function FoodFactory($resource){
      return $resource("http://localhost:3000/foods/:id", {}, {
        update: {method: "PUT"}
      })
    }
  //send yes information to visits table in our api
  function VisitFactory($resource){
      return $resource("http://localhost:3000/visits/:id", {}, {
        update: {method: "PUT"}
      })
    }

  function Router($stateProvider){
    $stateProvider
    .state("new",{
      url: "/feedme",
      templateUrl: "js/ng-views/new.html",
      controller: "FeedMeNewCtrl",
      controllerAs: "vm"
    })
    .state("show",{
      url: "/feeded/:id",
      templateUrl: "js/ng-views/show.html",
      controller: "FeedMeShowCtrl",
      controllerAs: "vm"
    })
  }
