

export const LiveScanModel = {   
  clinton: {lat: 41.857202, lng:-90.184084},
  qc:      {lat:  41.5350474, lng:-90.4997822},
  interval: 20000,
  fetchUrl: "https://us-central1-mdm-qcrt-demo-1.cloudfunctions.net/livescans/json",
  tock: 0,
  minute: 0,
  labelIndex:0,
  lab:"_ABCDEFGHIJKLMNOPQRSTUVWXYZ*#@&~1234567890abcdefghijklmnopqrstuvwxyz",
  red:"#ff0000",
  region: null,
  focusPosition:null,
  map1ZoomLevel: 12,
  passagesCollection: null,
  alertpublishCollection: null,
  voicepublishCollection: null,
  announcementsCollection: null,
  map1: {},
  map2: {},
  polylines: {},
  mileMarkersList1:[],
  mileMarkerLabels1:[],
  mileMarkersList2:[],
  mileMarkerLabels2:[],
  rotatingKey: 0,
  numVessels: 0,
  passagesList: [{type:"default"}],
  alertsPassenger: [
    {apubVesselName: "loading", apubID:"loading", date: new Date()},
    {apubVesselName: "loading", apubID:"loading", date: new Date()},
    {apubVesselName: "loading", apubID:"loading", date: new Date()},
    {apubVesselName: "loading", apubID:"loading", date: new Date()},
    {apubVesselName: "loading", apubID:"loading", date: new Date()},
  ],
  alertsAll: [
    {apubVesselName: "loading", apubID:"loading", date: new Date()},
    {apubVesselName: "loading", apubID:"loading", date: new Date()},
    {apubVesselName: "loading", apubID:"loading", date: new Date()},
    {apubVesselName: "loading", apubID:"loading", date: new Date()},
    {apubVesselName: "loading", apubID:"loading", date: new Date()},
  ],
  announcement: {},
  waypoint: {},
  prevWaypoint: {},
  prevVpubID: 0,
  prevApubID: 0,
  isReload: true,
  news: [ 
    {key: "f00", text: "Clinton's Riverview Park is a great place to view Mississippi River boat traffic."},
    {key: "f01", text: "Welcome to the <em>dashboard</em> page. It's optimized for HD wide screens."}
  ],
  newsKey: 0,
  transponder: {
    step: 0,
    stepMax: 7,
    viewList: []
  },

  //Method to set region data in environment
  initRegion() {
    console.log("initRegion()");
    //Is dependant on env obj being set on window
    this.region = env.region
    switch(env.region) {
      case "clinton": {
        this.focusPosition = this.clinton; 
        this.map1ZoomLevel = 12;
        this.passagesCollection = "Passages";
        this.alertpublishCollection = "Alertpublish";
        this.voicepublishCollection = "Voicepublish";
        this.announcementsCollection = "Announcements";
        break;
      }
      case "qc": {
        this.focusPosition = this.qc;
        this.map1ZoomLevel = 11;
        this.passagesCollection = "PassagesQC";
        this.alertpublishCollection = "AlertpublishQC";
        this.voicepublishCollection = "VoicepublishQC";
        this.announcementsCollection = "AnnouncementsQC";
        break;
      }
    }
    console.log("this.region is", this.region)
  },

  //Method used by mapper()
  getShipSpriteCoords(course) {
    if(course >=   0 && course <=  15) return [  0,   0];
    if(course >=  16 && course <=  30) return [ 55,   0];
    if(course >=  31 && course <=  45) return [110,   0];
    if(course >=  46 && course <=  60) return [165,   0];
    if(course >=  61 && course <=  75) return [220,   0];
    if(course >=  76 && course <=  90) return [275,   0];
    if(course >=  91 && course <= 105) return [  0,  55];
    if(course >= 106 && course <= 120) return [ 55,  55];
    if(course >= 121 && course <= 135) return [110,  55];
    if(course >= 136 && course <= 150) return [165,  55];
    if(course >= 151 && course <= 165) return [220,  55];
    if(course >= 166 && course <= 180) return [275,  55];
    if(course >= 181 && course <= 195) return [  0, 110];
    if(course >= 196 && course <= 210) return [ 55, 110];
    if(course >= 211 && course <= 225) return [110, 110];
    if(course >= 226 && course <= 240) return [165, 110];
    if(course >= 241 && course <= 255) return [220, 110];
    if(course >= 256 && course <= 270) return [275, 110];
    if(course >= 271 && course <= 285) return [  0, 165];
    if(course >= 286 && course <= 300) return [ 55, 165];
    if(course >= 301 && course <= 315) return [110, 165];
    if(course >= 316 && course <= 330) return [165, 165];
    if(course >= 331 && course <= 345) return [220, 165];
    if(course >= 346)                  return [275, 165];
    else                               return [  0,   0];
  },

  //Assigns data to map objects
  mapper(o, dat, isNew) {
    const m1 = this.map1
    const m2 = this.map2
    o.transponderTS  = parseInt(dat.transponderTS);
    o.position = new google.maps.LatLng(dat.liveLastLat, dat.liveLastLon);
    o.lat  = parseFloat(dat.liveLastLat);
    o.lng  = parseFloat(dat.liveLastLon);
    o.id   = parseInt(dat.liveVesselID);
    o.name = dat.liveName;
    o.liveLocation = dat.liveLocation || "Not Calculated";
    o.dir   = dat.liveDirection;
    o.dirImg = o.setDirImg();
    o.speed  = dat.liveSpeed;
    o.course = dat.liveCourse;
    o.imageUrl = dat.imageUrl;
    o.type   = dat.type;
    o.otherDataLabel = "od"+dat.liveVesselID;
        
    //FOR SHIP ICON MOVEMENT
    let coords = this.getShipSpriteCoords(o.course), icon;
    if(dat.type=="Passenger") {
      icon = {
        url: "https://storage.googleapis.com/www.clintonrivertraffic.com/images/ship-icon-sprite-yellow.png",
        origin: { x: coords[0], y: coords[1] }, 
        size: {width: 55, height: 55 }
      };
    } else {
      icon = {
        url: "https://storage.googleapis.com/www.clintonrivertraffic.com/images/ship-icon-sprite-cyan.png",
        origin: { x: coords[0], y: coords[1] }, 
        size: {width: 55, height: 55 }
      };
    }


    if(isNew) {
      o.mapLabel = this.lab[++this.labelIndex];
      //o.map1marker.setMap(null)
      o.map1marker = new google.maps.Marker({
        position: new google.maps.LatLng(43.116055, -94.679274),
        title: o.name, 
        label: o.mapLabel, 
        icon: icon,
        map: m1
      });
      //o.map2marker.setMap(null)
      o.map2marker = new google.maps.Marker({
        position: new google.maps.LatLng(43.116055, -94.679274),
        title: o.name, 
        label: o.mapLabel, 
        icon: icon,
        map: m2
      });
      o.map1marker.setPosition(o.position)
      o.map2marker.setPosition(o.position); 
      o.lastMovementTS = new Date();
      o.liveLastScanTS = new Date(dat.liveLastTS*1000);
      o.lastPassageTS = new Date(parseInt(dat.liveLastTS)*1000);
     } else {
      //If this is update
      o.map1marker.setPosition(o.position)
      o.map2marker.setPosition(o.position);
      o.map1marker.setIcon(icon);
      o.map2marker.setIcon(icon);
      //o.map1marker.setMap(m1)
      //o.map2marker.setMap(m2)

      if(o.speed>1.9) { //If transponder reported movement...
        if((o.lng != o.prevLng) || (o.lat != o.prevLat)) { //...did its location change?           
          //Yes means the transponder report is current. Update time value.
          let now = Date.now()          
          o.lastMovementTS.setTime(now)
          o.isMoving = true
          //Reported speed with no position change means stale data. Don't update time value.
        } else {
          o.isMoving = false
        }
      } //0 speed & 0 movement is ok. Just means vessel is idle
      o.prevLat = o.lat
      o.prevLng = o.lng
    }
    return new Promise( (resolve, reject)=>{
      //console.log("mapped obj:", o)
      resolve(o)
    })
    
  },

  initalizeMap() {
    //create maps
    this.map1 = new google.maps.Map(
      document.getElementById("map1"), 
      {
        zoom: this.map1ZoomLevel, 
        center: {lat: 41.85002, lng:-90.184084}, 
        mapTypeId: "hybrid",
        disableDefaultUI: true
      }
    );
    this.map2 = new google.maps.Map(
      document.getElementById("map2"), 
      {
        zoom: 14, 
        center: {lat: 41.841202, lng:-90.179084}, 
        mapTypeId: "hybrid",
        disableDefaultUI: true
      }
    )
    //Add waypoint lines
    this.polylines = {
        alphaLine1: new google.maps.Polyline({
          path: [{lat: 41.938785, lng: -90.173893}, {lat: 41.938785, lng: -90.108296}],
          strokeColor: this.red,
          strokeWeight: 2
        }), 
        bravoLine1:  new google.maps.Polyline({
          path: [{lat: 41.897258, lng: -90.174}, {lat: 41.897258, lng: -90.154058}],
          strokeColor: this.red,
          strokeWeight: 2
        }), 
        charlieLine1: new google.maps.Polyline({
          path: [{lat: 41.836353, lng: -90.186610}, {lat: 41.836353, lng: -90.169705}],
          strokeColor: this.red,
          strokeWeight: 2
        }), 
        deltaLine1: new google.maps.Polyline({
          path: [{lat: 41.800704, lng: -90.212768}, {lat: 41.800704, lng: -90.188677}],
          strokeColor: this.red,
          strokeWeight: 2
        }),
        alphaLine2: new google.maps.Polyline({
          path: [{lat: 41.938785, lng: -90.173893}, {lat: 41.938785, lng: -90.108296}],
          strokeColor: this.red,
          strokeWeight: 2
        }), 
          bravoLine2:  new google.maps.Polyline({
          path: [{lat: 41.897258, lng: -90.174}, {lat: 41.897258, lng: -90.154058}],
          strokeColor: this.red,
          strokeWeight: 2
        }), 
          charlieLine2: new google.maps.Polyline({
          path: [{lat: 41.836353, lng: -90.186610}, {lat: 41.836353, lng: -90.169705}],
          strokeColor: this.red,
          strokeWeight: 2
        }), 
          deltaLine2: new google.maps.Polyline({
          path: [{lat: 41.800704, lng: -90.212768}, {lat: 41.800704, lng: -90.188677}],
          strokeColor: this.red,
          strokeWeight: 2
        }),
        echoLine1: new google.maps.Polyline({
          path: [{lat: 41.58310275323378, lng: -90.36677353590355}, {lat: 41.57629641814284, lng:-90.36254991982065}],
          strokeColor: this.red,
          strokeWeight: 2
        }),
        foxtrotLine1: new google.maps.Polyline({
          path: [{lat: 41.57492966222924, lng: -90.40039721024752}, {lat: 41.56850859244365, lng: -90.39515284223624}],
          strokeColor: this.red,
          strokeWeight: 2
        }),
        golfLine1: new google.maps.Polyline({
          path: [{lat: 41.52074085192975, lng: -90.56802136170397}, {lat: 41.51703649263295, lng:-90.56551022558392}],
          strokeColor: this.red,
          strokeWeight: 2
        }),
        hotelLine1: new google.maps.Polyline({
          path: [{lat: 41.48119810486006, lng: -90.63505053819344}, {lat: 41.47654281869356, lng: -90.62901461235137}],
          strokeColor: this.red,
          strokeWeight: 2
        }),
        echoLine2: new google.maps.Polyline({
          path: [{lat: 41.58310275323378, lng: -90.36677353590355}, {lat: 41.57629641814284, lng:-90.36254991982065}],
          strokeColor: this.red,
          strokeWeight: 2
        }),
        foxtrotLine2: new google.maps.Polyline({
          path: [{lat: 41.57492966222924, lng: -90.40039721024752}, {lat: 41.56850859244365, lng: -90.39515284223624}],
          strokeColor: this.red,
          strokeWeight: 2
        }),
        golfLine2: new google.maps.Polyline({
          path: [{lat: 41.52074085192975, lng: -90.56802136170397}, {lat: 41.51703649263295, lng:-90.56551022558392}],
          strokeColor: this.red,
          strokeWeight: 2
        }),
        hotelLine2: new google.maps.Polyline({
          path: [{lat: 41.48119810486006, lng: -90.63505053819344}, {lat: 41.47654281869356, lng: -90.62901461235137}],
          strokeColor: this.red,
          strokeWeight: 2
        })                          
    };
    this.polylines.alphaLine1.setMap(this.map1);
    this.polylines.bravoLine1.setMap(this.map1);
    this.polylines.charlieLine1.setMap(this.map1);
    this.polylines.deltaLine1.setMap(this.map1);
    this.polylines.echoLine1.setMap(this.map1);
    this.polylines.foxtrotLine1.setMap(this.map1);
    this.polylines.golfLine1.setMap(this.map1);
    this.polylines.hotelLine1.setMap(this.map1);
    this.polylines.alphaLine2.setMap(this.map2);
    this.polylines.bravoLine2.setMap(this.map2);
    this.polylines.charlieLine2.setMap(this.map2);
    this.polylines.deltaLine2.setMap(this.map2);
    this.polylines.echoLine2.setMap(this.map2); 
    this.polylines.foxtrotLine2.setMap(this.map2); 
    this.polylines.golfLine2.setMap(this.map2); 
    this.polylines.hotelLine2.setMap(this.map2); 
    this.map1.setCenter(this.focusPosition);     
  
    //Add mile marker lines
    const dat = [
      {id:465,lngA:-90.87394086670139,latA:41.44768419634712,lngB:-90.86125193962113,latB:41.43255666090475},
      {id:466,lngA:-90.85686544012165,latA:41.45571761713665,lngB:-90.85296756533776,latB:41.43482091056742},
      {id:467,lngA:-90.83612580206753,latA:41.45842029555808,lngB:-90.83850707891371,latB:41.43775316892549},
      {id:468,lngA:-90.81579578160753,latA:41.45812364409113,lngB:-90.81910778473805,latB:41.44023906213188},
      {id:469,lngA:-90.79677900949125,latA:41.45821571235599,lngB:-90.79970003179358,latB:41.44135211519289},
      {id:470,lngA:-90.77923021773982,latA:41.45480028536314,lngB:-90.78295723318516,latB:41.43937988586635},
      {id:471,lngA:-90.75857797069449,latA:41.45526673208312,lngB:-90.76228125151724,latB:41.43848056222637},
      {id:472,lngA:-90.74129986697304,latA:41.45392873207133,lngB:-90.74155812873529,latB:41.43841293014096},
      {id:473,lngA:-90.72410622464567,latA:41.45527364822565,lngB:-90.72160661849664,latB:41.44463759905712},
      {id:474,lngA:-90.7041274333198,latA:41.45786933125446,lngB:-90.70364472745545,latB:41.446415668045},
      {id:475,lngA:-90.68759802242619,latA:41.46032658481339,lngB:-90.68031730188827,latB:41.44567946835805},
      {id:476,lngA:-90.66702910960484,latA:41.46514508917074,lngB:-90.66699979606632,latB:41.45681519842793},
      {id:477,lngA:-90.65657718563965,latA:41.46949488984797,lngB:-90.63344843995473,latB:41.45221935165051},
      {id:478,lngA:-90.64034645199828,latA:41.4774154619168,lngB:-90.63509744573608,latB:41.47303945911423},
      {id:479,lngA:-90.62425550599895,latA:41.48662487870652,lngB:-90.617486830184,latB:41.48088370542879},
      {id:480,lngA:-90.61073943780512,latA:41.49459057955315,lngB:-90.60404311701011,latB:41.49180558200741},
      {id:481,lngA:-90.60571003154891,latA:41.51055979390778,lngB:-90.59755934315619,latB:41.50443881426396},
      {id:482,lngA:-90.58403075588232,latA:41.51763670388024,lngB:-90.58113556831556,latB:41.51200304813109},
      {id:483,lngA:-90.56692264476122,latA:41.52129897352564,lngB:-90.55951551882352,latB:41.51032618297966},
      {id:484,lngA:-90.54808920603612,latA:41.52939278853504,lngB:-90.54552841799722,latB:41.50964503103194},
      {id:485,lngA:-90.52892484428197,latA:41.52601736034169,lngB:-90.53372071448936,latB:41.51035784153727},
      {id:486,lngA:-90.50971806363766,latA:41.52215220467504,lngB:-90.5092203536731,latB:41.51372097487243}, 
      {id:487, lngA:-90.48875678287305, latA:41.521402024002950, lngB:-90.48856266269104, latB:41.5145424556308},
      {id:488, lngA:-90.47251555885472, latA:41.52437816051497, lngB:-90.47036467716465, latB:41.51537456609466},
      {id:489, lngA:-90.45698288389242, latA:41.53057735758976, lngB:-90.45000250745086, latB:41.52480546208061},
      {id:490, lngA:-90.4461928429114, latA:41.54182560886835, lngB:-90.43804967962095, latB:41.53668343008653},
      {id:491, lngA:-90.43225148614556, latA:41.55492191671779, lngB:-90.42465891516093, latB:41.54714647168962},
      {id:492, lngA:-90.42215634673808, latA:41.56423876538352, lngB:-90.41359632007243, latB:41.55879211219473},
      {id:493, lngA:-90.40755589318907, latA:41.57200066107595, lngB:-90.40121765684347, latB:41.56578132917156},
      {id:494, lngA:-90.39384285792221, latA:41.57842796885789, lngB:-90.38766103940617, latB:41.57132529050489},
      {id:495, lngA:-90.37455561078977, latA:41.58171517893158, lngB:-90.37097459099577, latB:41.57455780093269},
      {id:496, lngA:-90.35418070340366, latA:41.5875726488084, lngB:-90.34989801453619, latB:41.58193114855811},
      {id:497, lngA:-90.34328730016247, latA:41.59576427084198, lngB:-90.33608085417411, latB:41.59502112101575},
      {id:498, lngA:-90.34404272829823, latA:41.61119012348694, lngB:-90.33646143861851, latB:41.6111032102589},
      {id:499, lngA:-90.3472745860646, latA:41.62454773858045, lngB:-90.33663122233754, latB:41.62387063319586},
      {id:500, lngA:-90.3480736269221, latA:41.63971945269969, lngB:-90.33817941381621, latB:41.63955239006518},
      {id:501, lngA:-90.34380831321272, latA:41.65683003496228, lngB:-90.33649979303949, latB:41.65484790099703},
      {id:502, lngA:-90.33988256792307, latA:41.66828476005874, lngB:-90.3286147300638, latB:41.66790001449647},
      {id:503, lngA:-90.33882199131011, latA:41.68036827724283, lngB:-90.32843393740198, latB:41.6798418644646},
      {id:504, lngA:-90.32382303252616, latA:41.69122269168967, lngB:-90.31540075610307, latB:41.68607027095535},
      {id:505, lngA:-90.31560815565506, latA:41.70162133249737, lngB:-90.31077421309571, latB:41.70093421981962},
      {id:506, lngA:-90.32324160813617, latA:41.71865527148766, lngB:-90.3144828164786, latB:41.71893714129034},
      {id:507, lngA:-90.32043157100178, latA:41.73305742526379, lngB:-90.31219715829357, latB:41.73209034176453},
      {id:508, lngA:-90.30911551889101, latA:41.74805205206862, lngB:-90.30381674016407, latB:41.74473810650169},
      {id:509, lngA:-90.29387889379554, latA:41.75940105234584, lngB:-90.29012440316585, latB:41.7570342469618},
      {id:510, lngA:-90.28216840054604, latA:41.76853414046849, lngB:-90.27848788377898, latB:41.76498972749543},
      {id:511, lngA:-90.2654809443937, latA:41.77464017600214, lngB:-90.26200151315392, latB:41.770651247585950},
      {id:512, lngA:-90.24800719074986, latA:41.7843434632554, lngB:-90.24263626100766, latB:41.77880910965498},
      {id:513, lngA:-90.23473410036074, latA:41.79168622191222, lngB:-90.2284317808665, latB:41.78595112826723},
      {id:514, lngA:-90.2156953508097, latA:41.7973419581181, lngB:-90.21337944364016, latB:41.79404084443492},
      {id:515, lngA:-90.19822143802581, latA:41.8025198609788, lngB:-90.19581674354208, latB:41.79898355228364},
      {id:516, lngA:-90.18352536643455, latA:41.80932693789443, lngB:-90.17633565144088, latB:41.80648691881999},
      {id:517, lngA:-90.18485994749022, latA:41.8234823269278, lngB:-90.18032482162711, latB:41.82393548957531},
      {id:518, lngA:-90.18522602598576, latA:41.83743971204904, lngB:-90.18253482993897, latB:41.83749106584514},
      {id:519, lngA:-90.17908346056349, latA:41.8513020234478, lngB:-90.17295527825956, latB:41.850379130804},
      {id:521, lngA:-90.17297767304423, latA:41.87737306056449, lngB:-90.16660198044828, latB:41.8760873927711},
      {id:522, lngA:-90.16238975538499, latA:41.89065244219969, lngB:-90.15871961546813, latB:41.88892630366035},

      {id:523, lngA:-90.167240, latA:41.903965, lngB:-90.151909, latB:41.903010},
      {id:524, lngA:-90.164227, latA:41.916904, lngB:-90.147937, latB:41.916824},
      {id:525, lngA:-90.178143, latA:41.928487, lngB:-90.150351, latB:41.928544},
      {id:526, lngA:-90.170325, latA:41.941093, lngB:-90.154714, latB:41.940933},
      {id:527, lngA:-90.169716, latA:41.956191, lngB:-90.154570, latB:41.955656},
      {id:528, lngA:-90.165536, latA:41.971451, lngB:-90.150207, latB:41.966624},
      {id:529, lngA:-90.160597, latA:41.983653, lngB:-90.128595, latB:41.983866},
      {id:530, lngA:-90.159155, latA:41.998832, lngB:-90.129745, latB:41.998937},
      {id:531, lngA:-90.160529, latA:42.010256, lngB:-90.126528, latB:42.012881},
      {id:532, lngA:-90.162878, latA:42.025086, lngB:-90.136450, latB:42.027552},

      {id:533, lngA:-90.16063756667363, latA:42.03651491321578, lngB:-90.15151752534508, latB:42.03730169372241},
      {id:534, lngA:-90.16890457045166, latA:42.04885717910146, lngB:-90.16066649304122, latB:42.04930465441836},
      {id:535, lngA:-90.16873927252988, latA:42.06458933574678, lngB:-90.16266001168944, latB:42.06507225175709},
      {id:536, lngA:-90.16914609409496, latA:42.0804515612181, lngB:-90.16249823994366, latB:42.07970814767357},
      {id:537, lngA:-90.16729803875997, latA:42.09221812981502, lngB:-90.1579947493362, latB:42.09136054497117},
      {id:538, lngA:-90.16382083849952, latA:42.10622273166468, lngB:-90.15894760458957, latB:42.10600456364353},
      {id:539, lngA:-90.16773051913361, latA:42.11833177709393, lngB:-90.16024166340684, latB:42.12179322620005},
      {id:540, lngA:-90.18197341024099, latA:42.12474496670414, lngB:-90.18304430150994, latB:42.12795599576975},
      {id:520, lngA:-90.17610039282224, latA:41.86515500754595, lngB:-90.17058699252856, latB:41.86429560522607}  
    ];
  
    if(this.mileMarkersList1.length == 0) {
      for(let i=0, len=dat.length; i<len; i++) {
        this.mileMarkersList1.push(new google.maps.Polyline({
            name: "Mile "+dat[i].id,            
            path: [
                {lat: dat[i].latA, lng: dat[i].lngA},
                {lat: dat[i].latB, lng: dat[i].lngB}
            ],
            strokeColor: "#34A16B",
            strokeWeight: 2,
            map: this.map1
        }))
        this.mileMarkersList2.push(new google.maps.Polyline({
          name: "Mile "+dat[i].id,            
          path: [
              {lat: dat[i].latA, lng: dat[i].lngA},
              {lat: dat[i].latB, lng: dat[i].lngB}
          ],
          strokeColor: "#34A16B",
          strokeWeight: 2,
          map: this.map2
        }))
        /* Mile Labels Disabled on Map 1
        this.mileMarkerLabels1.push(new google.maps.Marker({
            position: {lat: dat[i].latA, lng: dat[i].lngA },
            title: "Mile "+dat[i].id, 
            label: String(dat[i].id),
            icon: {
              url: "https://storage.googleapis.com/www.clintonrivertraffic.com/imagendow.s/green.png" ,
              labelOrigin: {x: 24, y: 15},
              scaledSize: {width: 50, height: 50}
            },
            map: this.map1
        }))
        */
        this.mileMarkerLabels2.push(new google.maps.Marker({
          position: {lat: dat[i].latA, lng: dat[i].lngA },
          title: "Mile "+dat[i].id, 
          label: String(dat[i].id),
          icon: {
            url: "https://storage.googleapis.com/www.clintonrivertraffic.com/images/green.png" ,
            labelOrigin: {x: 24, y: 15},
            scaledSize: {width: 50, height: 50}
          },
          map: this.map2
        }))
           
      }
    }
    //After building maps, init the db
    initLiveScan();
    
  }
}

