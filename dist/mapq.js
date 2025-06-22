/*   *   *   *   *   *   *   *   *   *
 
Contains all code for static page small.html which customizes CRT data for KiOS or other really small screen.

 *   *   *   *   *   *   *   *   *   *



-- Begin class definitions --
*/

//import { setupLoggers } from "firebase-tools/lib/utils";

//LiveScanModel holds view data
function LiveScanModel() {
  let self = this;

  //Config values
  self.fetchUrl  = "https://mongorest.riverboattracker.com/live/json"; 
  //"https://storage.googleapis.com/www.clintonrivertraffic.com/livescan.json";
  self.clinton   =  {lat: 41.857202,   lng:-90.184084};
  self.qc        =  {lat:  41.5350474, lng:-90.4997822},
  self.red       = "#ff0000";
  self.green     = "#34A16B";
  self.tock      = 0;
  self.labelIndex = 0;
  self.lab       = "_ABCDEFGHIJKLMNOPQRSTUVWXYZ*#@&~1234567890abcdefghijklmnopqrstuvwxyz";
  self.passSpriteUrl = "https://storage.googleapis.com/www.clintonrivertraffic.com/images/ship-icon-sprite-yellow.png";
  self.allSpriteUrl  = "https://storage.googleapis.com/www.clintonrivertraffic.com/images/ship-icon-sprite-cyan.png";
  self.mileMarkerIconUrl = "https://storage.googleapis.com/www.clintonrivertraffic.com/images/green.png";

  //Loaded data store
  self.liveScans = [];
  self.map       = {};
  self.polylines = {};
  self.announcement      = {};
  self.waypoint          = {};
  self.mileMarkersList   = [];
  self.mileMarkersLabels = [];
  self.alertsPass = [
    {apubVesselName: "loading", apubID:"loading", date: new Date()}
  ];
  self.alertsAll = [
    {apubVesselName: "loading", apubID:"loading", date: new Date()}
  ];

  //Status vars
  self.numVessels    = 0;
  prevWaypoint       = {};
  prevVpubID         = 0;
  self.selectedView  = {view: "list", idx: null };
  self.focusPosition = {lat: 41.857202, lng:-90.184084};
  self.nowPage       = "list";
  self.lastPage      = "list";
  self.mapZoom       = 12;
  self.markersOn     = false;
  self.voiceOn       = false;  

  //Page elements
  self.pageInsert    = document.getElementById("page-insert");
  self.vessList      = document.getElementById("vess-list");
  self.allVessels    = document.getElementById("all-vessels");
  self.totVessels    = document.getElementById("total-vessels");
  self.mapDiv        = document.getElementById("map");
  
  //Method assigns data to Livescan objects
  self.mapper = function(o, dat, isNew) {
    const m1 = self.map
    //const m2 = this.map2
    o.transponderTS  = parseInt(dat.transponderTS);
    o.position = new google.maps.LatLng(dat.liveLastLat, dat.liveLastLon);
    o.lat  = dat.liveLastLat;
    o.lng  = dat.liveLastLon;
    o.id   = parseInt(dat.liveVesselID);
    o.name = dat.liveName;
    o.liveLocation = dat.liveLocation || "Not Calculated";
    o.dir   = dat.liveDirection;
    o.dirImg = o.setDirImg();
    o.speed  = dat.liveSpeed;
    o.course = dat.liveCourse;
    o.segment = dat.liveSegment;
    o.imageUrl = dat.imageUrl;
    o.type   = dat.type;
    //o.otherDataLabel = "od"+dat.liveVesselID;
        
    //FOR SHIP ICON MOVEMENT
    let coords = self.getShipSpriteCoords(o.course), icon;
    if(dat.type=="Passenger") {
      icon = {
        url: self.passSpriteUrl,
        origin: { x: coords[0], y: coords[1] }, 
        size: {width: 55, height: 55 }
      };
    } else {
      icon = {
        url: self.allSpriteUrl,
        origin: { x: coords[0], y: coords[1] }, 
        size: {width: 55, height: 55 }
      };
    }


    if(isNew) {
      o.lat = dat.liveInitLat;
      o.lng = dat.liveInitLon;
      o.mapLabel = self.lab[++self.labelIndex];
      o.mapMarker = new google.maps.Marker({
        position: new google.maps.LatLng(43.116055, -94.679274),
        title: o.name, 
        label: o.mapLabel, 
        icon: icon,
        map: m1
      });
      o.mapMarker.setPosition(o.position)
      o.lastMovementTS = new Date();
      o.liveLastScanTS = new Date(dat.liveLastTS*1000);
     } else {
      //If this is update
      o.mapMarker.setPosition(o.position) 
      o.mapMarker.setIcon(icon);
      

      if(o.speed>0.9) { //If transponder reported movement...
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
    return o;
    // return new Promise( (resolve, reject)=>{
    //   //console.log("mapped obj:", o)
    //   resolve(o)
    // })
    
  };

  //Method used by mapper()
  self.getShipSpriteCoords= function(course) {
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
  };

  self.initalizeMap = function() {
    //create maps
    self.map = new google.maps.Map(
      self.mapDiv, 
      {
        zoom: 12, 
        center: self.qc, 
        mapTypeId: "hybrid",
        disableDefaultUI: true
      }
    );

    //Add waypoint lines
    self.polylines = {
      alphaLine: new google.maps.Polyline({
        path: [{lat: 41.938785, lng: -90.173893}, {lat: 41.938785, lng: -90.108296}],
        strokeColor: self.red,
        strokeWeight: 2
      }), 
      bravoLine:  new google.maps.Polyline({
        path: [{lat: 41.897258, lng: -90.174}, {lat: 41.897258, lng: -90.154058}],
        strokeColor: self.red,
        strokeWeight: 2
      }), 
      charlieLine: new google.maps.Polyline({
        path: [{lat: 41.836353, lng: -90.186610}, {lat: 41.836353, lng: -90.169705}],
        strokeColor: self.red,
        strokeWeight: 2
      }), 
      deltaLine: new google.maps.Polyline({
        path: [{lat: 41.800704, lng: -90.212768}, {lat: 41.800704, lng: -90.188677}],
        strokeColor: self.red,
        strokeWeight: 2
      }),
      echoLine: new google.maps.Polyline({
        path: [{lat: 41.58310275323378, lng: -90.36677353590355}, {lat: 41.57629641814284, lng:-90.36254991982065}],
        strokeColor: this.red,
        strokeWeight: 2
      }),
      foxtrotLine: new google.maps.Polyline({
        path: [{lat: 41.57492966222924, lng: -90.40039721024752}, {lat: 41.56850859244365, lng: -90.39515284223624}],
        strokeColor: this.red,
        strokeWeight: 2
      }),
      golfLine: new google.maps.Polyline({
        path: [{lat: 41.52074085192975, lng: -90.56802136170397}, {lat: 41.51703649263295, lng:-90.56551022558392}],
        strokeColor: this.red,
        strokeWeight: 2
      }),
      hotelLine: new google.maps.Polyline({
        path: [{lat: 41.48119810486006, lng: -90.63505053819344}, {lat: 41.47654281869356, lng: -90.62901461235137}],
        strokeColor: this.red,
        strokeWeight: 2
      }),


      bravoWindow: new google.maps.InfoWindow({
        position: {lat: 41.897258, lng: -90.174},
        content: "Lock 13 Fulton", 
        map: self.map
      }),
      charlieWindow: new google.maps.InfoWindow({
        position: {lat: 41.836353, lng: -90.186610},
        content: "Clinton Railroad Drawbridge", 
        map: self.map
      }),
      deltaWindow: new google.maps.InfoWindow({
        position: {lat: 41.800704, lng: -90.212768},
        content: "3 Miles S of Drawbridge", 
        map: self.map
      }),
      echoWindow: new google.maps.InfoWindow({
        position: {lat: 41.58310275323378, lng: -90.36677353590355},
        content: "I-80 Bridge", 
        map: self.map
      }),
      foxtrotWindow: new google.maps.InfoWindow({
        position: {lat: 41.57492966222924, lng: -90.40039721024752},
        content: "Lock 14 LeClaire", 
        map: self.map
      }),
      golfWindow: new google.maps.InfoWindow({
        position: {lat: 41.52074085192975, lng: -90.56802136170397},
        content: "Lock 15 Davenport", 
        map: self.map
      }),
      hotelWindow: new google.maps.InfoWindow({
        position: {lat: 41.48119810486006, lng: -90.63505053819344},
        content: "I-280 Bridge", 
        map: self.map
      }),
      alphaWindow: new google.maps.InfoWindow({
        position: {lat: 41.938785, lng: -90.173893},
        content: "3 Miles N of Lock 13", 
        map: self.map
      }),            
    };
    ;
    self.polylines.alphaLine.addListener("mouseover", () => {
      self.polylines.alphaWindow.open(self.map);
    });
    self.polylines.alphaWindow.close();




    self.polylines.bravoLine.addListener("mouseover", () => {
      self.polylines.bravoWindow.open(self.map);
    });
    self.polylines.bravoWindow.close();

    self.polylines.charlieLine.addListener("mouseover", () => {
      self.polylines.charlieWindow.open(self.map);
    });
    self.polylines.charlieWindow.close();

    self.polylines.deltaLine.addListener("mouseover", () => {
      self.polylines.deltaWindow.open(self.map);
    });
    self.polylines.deltaWindow.close();

    self.polylines.echoLine.addListener("mouseover", () => {
      self.polylines.echoWindow.open(self.map);
    });
    self.polylines.echoWindow.close();
    
    self.polylines.foxtrotLine.addListener("mouseover", () => {
      self.polylines.foxtrotWindow.open(self.map);
    });
    self.polylines.foxtrotWindow.close();
    self.polylines.golfLine.addListener("mouseover", () => {
      self.polylines.golfWindow.open(self.map);
    });
    self.polylines.golfWindow.close();
    self.polylines.hotelLine.addListener("mouseover", () => {
      self.polylines.hotelWindow.open(self.map);
    });
    self.polylines.hotelWindow.close();

    self.polylines.alphaLine.setMap(self.map)
    self.polylines.bravoLine.setMap(self.map);
    self.polylines.charlieLine.setMap(self.map);
    self.polylines.deltaLine.setMap(self.map);
    self.polylines.echoLine.setMap(self.map);
    self.polylines.foxtrotLine.setMap(self.map);
    self.polylines.golfLine.setMap(self.map);
    self.polylines.hotelLine.setMap(self.map);
   
    // self.polylines.bravoWindow.setMap(self.map);
    // self.polylines.charlieWindow.setMap(self.map);
    // self.polylines.deltaWindow.setMap(self.map);
    // self.polylines.echoWindow.setMap(self.map);
    // self.polylines.foxtrotWindow.setMap(self.map);
    // self.polylines.golfWindow.setMap(self.map);
    // self.polylines.hotelWindow.setMap(self.map);
         
    //Add mile marker lines
    const dat = [

      {id:360,lngA:-91.4459288116236,latA:40.37099081497603,lngB:-91.43488386527973,latB:40.36300844972092},
      {id:361,lngA:-91.43499399688842,latA:40.3873731991855,lngB:-91.41711557624201,latB:40.36693390266821},
      {id:362,lngA:-91.41154952057872,latA:40.38682792489156,lngB:-91.40420051009731,latB:40.3717112160588},
      {id:363,lngA:-91.39444026512147,latA:40.3918389310806,lngB:-91.38733328739583,latB:40.37527860518409},
      {id:364,lngA:-91.37825145533446,latA:40.39274879911763,lngB:-91.35814237000325,latB:40.38874370765545},
      {id:365,lngA:-91.3767624614461,latA:40.40517606501739,lngB:-91.35537415411507,latB:40.41094511147108},
      {id:366,lngA:-91.3840941177845,latA:40.41781606574328,lngB:-91.36211897774818,latB:40.42422934738423},
      {id:367,lngA:-91.39246860215052,latA:40.43378149948098,lngB:-91.36884571684543,latB:40.43554933192856},
      {id:369,lngA:-91.38580152759047,latA:40.46636956546656,lngB:-91.36074755108754,latB:40.46278786932928},
      {id:368,lngA:-91.39049486381882,latA:40.45096393738126,lngB:-91.36852837065811,latB:40.44908610691719},
      {id:370,lngA:-91.37811309622477,latA:40.47973529556068,lngB:-91.35586084136547,latB:40.47685985148898},
      {id:371,lngA:-91.37481250551004,latA:40.49305515091331,lngB:-91.35227956473639,latB:40.49257954261637},
      {id:372,lngA:-91.37724238065508,latA:40.50535956815101,lngB:-91.34974934824609,latB:40.51085876000518},
      {id:373,lngA:-91.38590087091876,latA:40.51554640768165,lngB:-91.36618654875721,latB:40.52558915439432},
      {id:374,lngA:-91.39430444425523,latA:40.52314363401523,lngB:-91.38459385967833,latB:40.53946928104329},
      {id:375,lngA:-91.43373788495475,latA:40.53405084250929,lngB:-91.3970623876968,latB:40.54221309570166},
      {id:376,lngA:-91.429076337168,latA:40.55785461115822,lngB:-91.39541601459894,latB:40.55376022060289},
      {id:377,lngA:-91.41791553688331,latA:40.57969012394841,lngB:-91.38524353222243,latB:40.56285411554297},
      {id:378,lngA:-91.40957094532342,latA:40.59730308055073,lngB:-91.37120425213621,latB:40.57194717298203},
      {id:398,lngA:-91.12199412356098,latA:40.72726232485513,lngB:-91.08377052902479,latB:40.72557899610607},
      {id:397,lngA:-91.12138015480579,latA:40.71328172413125,lngB:-91.0845278384906,latB:40.71356671141272},
      {id:396,lngA:-91.11964664044632,latA:40.69894351699991,lngB:-91.08323087920178,latB:40.69811076610788},
      {id:395,lngA:-91.12460000323647,latA:40.68820045646742,lngB:-91.09876586471357,latB:40.67412939164184},
      {id:394,lngA:-91.13222862055505,latA:40.67695422536141,lngB:-91.11233483511343,latB:40.66270370993414},
      {id:393,lngA:-91.14532500909088,latA:40.66958847149292,lngB:-91.12884402925467,latB:40.64791608347565},
      {id:392,lngA:-91.16212516612507,latA:40.66373827217783,lngB:-91.1461380069682,latB:40.64175683800381},
      {id:391,lngA:-91.1792578594051,latA:40.65998897354515,lngB:-91.16206840977118,latB:40.63707210332565},
      {id:390,lngA:-91.19043898996912,latA:40.64794214497102,lngB:-91.17909125540938,latB:40.63050635024376},
      {id:389,lngA:-91.20289998737539,latA:40.64401738998291,lngB:-91.20048464497016,latB:40.62743434735182},
      {id:388,lngA:-91.22022726966301,latA:40.64626567739748,lngB:-91.22041340834852,latB:40.63194536501991},
      {id:387,lngA:-91.24073837441713,latA:40.6478118996264,lngB:-91.23797343432622,latB:40.62677260256465},
      {id:386,lngA:-91.26017768583756,latA:40.64675200629384,lngB:-91.25681328397528,latB:40.62708232520131},
      {id:385,lngA:-91.28047119786082,latA:40.63813252748157,lngB:-91.27187059625199,latB:40.62623355437002},
      {id:384,lngA:-91.29707319952509,latA:40.63107831034466,lngB:-91.28624740978996,latB:40.61969823869867},
      {id:383,lngA:-91.31597357070216,latA:40.62996847068304,lngB:-91.30760362853403,latB:40.61291547031313},
      {id:382,lngA:-91.33419744150133,latA:40.62352920735297,lngB:-91.3212916760618,latB:40.60500933295604},
      {id:381,lngA:-91.35482987821091,latA:40.6209406407424,lngB:-91.33757315151651,latB:40.59903094019166},
      {id:380,lngA:-91.37499864999297,latA:40.61590399497198,lngB:-91.34878183089562,latB:40.59056206274902},
      {id:379,lngA:-91.39070056627035,latA:40.6034648102497,lngB:-91.35842400373855,latB:40.582599719883},
      {id:399,lngA:-91.12067219429741,latA:40.74219432609279,lngB:-91.0867865786864,latB:40.7361824678627},
      {id:400,lngA:-91.10899148847221,latA:40.75681359243708,lngB:-91.08221057220837,latB:40.74248451321368},
      {id:401,lngA:-91.1019645173725,latA:40.76850409734178,lngB:-91.06012857458053,latB:40.75821593841954},
      {id:402,lngA:-91.09730712934845,latA:40.78111487249328,lngB:-91.06554808448644,latB:40.78149330773091},
      {id:403,lngA:-91.09647365520543,latA:40.79608002174889,lngB:-91.06912976244084,latB:40.79726338703072},
      {id:404,lngA:-91.101165224757,latA:40.81019417305557,lngB:-91.07603503275085,latB:40.80818660034473},
      {id:405,lngA:-91.10075579942655,latA:40.82493501334616,lngB:-91.08153737289437,latB:40.82205268077494},
      {id:406,lngA:-91.10049171382515,latA:40.84394794086074,lngB:-91.0651962587978,latB:40.82691330519312},
      {id:407,lngA:-91.0902711510027,latA:40.86153306527834,lngB:-91.05304160069869,latB:40.8345852557791},
      {id:408,lngA:-91.06845604528604,latA:40.8651296432478,lngB:-91.04525384815673,latB:40.85045367587635},
      {id:409,lngA:-91.05655499129665,latA:40.87873116383629,lngB:-91.04127385640398,latB:40.86565602893574},
      {id:410,lngA:-91.04078379129794,latA:40.88625229618901,lngB:-91.02498520706804,latB:40.87339658563739},
      {id:411,lngA:-91.02514539751323,latA:40.89853330915333,lngB:-91.01085487562095,latB:40.87728763570471},
      {id:412,lngA:-91.01325969220412,latA:40.90719952181306,lngB:-90.99775866600535,latB:40.88295128770526},
      {id:413,lngA:-91.00010591350276,latA:40.92132723697627,lngB:-90.98188962772478,latB:40.88498594006604},
      {id:414,lngA:-90.98993490677103,latA:40.92770481271337,lngB:-90.96409887484441,latB:40.90358632336599},
      {id:415,lngA:-90.98235015785697,latA:40.93171482772981,lngB:-90.95755714781623,latB:40.92248877110439},
      {id:416,lngA:-90.97078730431456,latA:40.94153383321059,lngB:-90.95444810860346,latB:40.93723008743513},
      {id:417,lngA:-90.96390957166788,latA:40.95425513787649,lngB:-90.94509704729539,latB:40.95039116460471},
      {id:418,lngA:-90.96110782971725,latA:40.96616656945769,lngB:-90.93819434636855,latB:40.96639232930313},
      {id:419,lngA:-90.96786096722266,latA:40.9799764607527,lngB:-90.93443865289512,latB:40.98010074390081},
      {id:420,lngA:-90.96845495214865,latA:40.99331414502754,lngB:-90.93380918394504,latB:40.99309502122177},
      {id:423,lngA:-90.97729384214298,latA:41.03478445272111,lngB:-90.9282442580571,latB:41.03635289470017},
      {id:421,lngA:-90.96681678357966,latA:41.00678426898517,lngB:-90.92909618261864,latB:41.00702150176386},
      {id:422,lngA:-90.97258177744821,latA:41.02070578288729,lngB:-90.92788787035586,latB:41.0218448502922},
      {id:424,lngA:-90.97758951047388,latA:41.04970589019371,lngB:-90.93161589488885,latB:41.05018398999236},
      {id:425,lngA:-90.97052884379737,latA:41.06381381317543,lngB:-90.93692142453519,latB:41.06418858767692},
      {id:426,lngA:-90.95947145761583,latA:41.07798065169445,lngB:-90.93381260470424,latB:41.07940355393613},
      {id:427,lngA:-90.96656768437737,latA:41.0920411343211,lngB:-90.93510557240401,latB:41.09340783562909},
      {id:428,lngA:-90.97512281345088,latA:41.10225217484254,lngB:-90.94238511434475,latB:41.10817292218832},
      {id:429,lngA:-90.97885910839648,latA:41.11481679319834,lngB:-90.94546382254211,latB:41.12190774488611},
      {id:430,lngA:-90.98394807496693,latA:41.12817604164752,lngB:-90.95080535938479,latB:41.13763825679212},
      {id:431,lngA:-90.99281290296938,latA:41.13925928634308,lngB:-90.96663922952227,latB:41.15079085822694},
      {id:432,lngA:-91.00098416471499,latA:41.1466918437728,lngB:-90.98285803185973,latB:41.16377656104464},
      {id:433,lngA:-91.00874181997847,latA:41.14852667173421,lngB:-91.00082487041465,latB:41.17527774577093},
      {id:434,lngA:-91.01937755783804,latA:41.15003712497671,lngB:-91.02218752986931,latB:41.18137700536072},
      {id:435,lngA:-91.03412455295673,latA:41.17234450527518,lngB:-91.06238118059738,latB:41.13586224471959},
      {id:436,lngA:-91.08241245809685,latA:41.16169964917339,lngB:-91.04470431294922,latB:41.18006484051204},
      {id:437,lngA:-91.0962156876613,latA:41.17481411516416,lngB:-91.0551948707209,latB:41.19192642056181},
      {id:438,lngA:-91.1063325541788,latA:41.18706517306583,lngB:-91.06373117344114,latB:41.20363080588014},
      {id:439,lngA:-91.1167558924856,latA:41.19865689752199,lngB:-91.07357917521982,latB:41.2155067023471},
      {id:440,lngA:-91.12826041169319,latA:41.21469897239507,lngB:-91.08121666912639,latB:41.2263900252518},
      {id:441,lngA:-91.12534687156611,latA:41.23016954248944,lngB:-91.0876159897913,latB:41.2364942549445},
      {id:442,lngA:-91.12175421052046,latA:41.24638496590708,lngB:-91.08899059976444,latB:41.24573076491066},
      {id:443,lngA:-91.12089990249552,latA:41.26306903716551,lngB:-91.08808201576059,latB:41.25350130219731},
      {id:444,lngA:-91.11692211259424,latA:41.27798254820844,lngB:-91.08277608013859,latB:41.26690987501802},
      {id:445,lngA:-91.1113678377305,latA:41.29003214742696,lngB:-91.07374723345673,latB:41.28081143528519},
      {id:446,lngA:-91.09242521125014,latA:41.29851499375959,lngB:-91.06879146740522,latB:41.29553767621021},
      {id:447,lngA:-91.08823482780497,latA:41.30792971287418,lngB:-91.06602849276952,latB:41.3052644383144},
      {id:448,lngA:-91.08064463456175,latA:41.3217909103926,lngB:-91.06020199623809,latB:41.32022124973811},
      {id:449,lngA:-91.07641264221913,latA:41.33823128184845,lngB:-91.05512842267778,latB:41.33720429827794},
      {id:450,lngA:-91.0739379171814,latA:41.35142678292879,lngB:-91.05366106100841,latB:41.35032500251171},
      {id:451,lngA:-91.07040231105579,latA:41.36645416154255,lngB:-91.05275901986937,latB:41.36244245302245},
      {id:452,lngA:-91.06085419250688,latA:41.37958901343887,lngB:-91.0436784049907,latB:41.37564417234471},
      {id:453,lngA:-91.05720835866617,latA:41.39067251918827,lngB:-91.04220221501632,latB:41.39365361753089},
      {id:454,lngA:-91.0633018735401,latA:41.40691203377219,lngB:-91.04406431749503,latB:41.40538601699326},
      {id:455,lngA:-91.05163423952251,latA:41.41699234144112,lngB:-91.04373379606905,latB:41.41052720742071},
      {id:456,lngA:-91.0328572546009,latA:41.42608278975555,lngB:-91.02931976572545,latB:41.41855503971725},
      {id:457,lngA:-91.01912048826134,latA:41.43277857428149,lngB:-91.014491582918,latB:41.422979028461},
      {id:458,lngA:-90.99925686045346,latA:41.43990366369776,lngB:-90.99714464342026,latB:41.42487060501958},
      {id:459,lngA:-90.97227213580146,latA:41.44325459718064,lngB:-90.98269458802373,latB:41.42309110050365},
      {id:460,lngA:-90.95582673055722,latA:41.43686185481421,lngB:-90.96216260830191,latB:41.42009623500729},
      {id:461,lngA:-90.94115238946358,latA:41.43410411251093,lngB:-90.9401945482633,latB:41.4180285140198},
      {id:462,lngA:-90.92302590625016,latA:41.43233609565068,lngB:-90.92070573674803,latB:41.41820292739373},
      {id:463,lngA:-90.90720337983412,latA:41.43441068289069,lngB:-90.90281757445666,latB:41.42181635473762},
      {id:464,lngA:-90.89151553492151,latA:41.43976158330943,lngB:-90.8804169489161,latB:41.42556224627045},
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
      {id:520, lngA:-90.17610039282224, latA:41.86515500754595, lngB:-90.17058699252856, latB:41.86429560522607},
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
      {id:540, lngA:-90.18072233173214, latA:42.12134833833771, lngB:-90.18304430150994, latB:42.12795599576975},
      {id:541, lngA:-90.20521555330315, latA:42.12227668945038, lngB:-90.19645802930619, latB:42.13138138502153},
      {id:542, lngA:-90.21761847653428, latA:42.13887557152060, lngB:-90.19626296893350, latB:42.14450847116228},
      {id:543, lngA:-90.22062978816405, latA:42.15098708916295, lngB:-90.20235150278525, latB:42.15761424628353},
      {id:544, lngA:-90.23271973921307, latA:42.15646395865959, lngB:-90.22273756143507, latB:42.16847045213160},
      {id:545, lngA:-90.24803508604180, latA:42.16392077574721, lngB:-90.24105026785845, latB:42.17550788257662},
      {id:546, lngA:-90.26434198064129, latA:42.16728490549481, lngB:-90.25924673944463, latB:42.18125490290713},
      {id:547, lngA:-90.28391473556665, latA:42.17243420264212, lngB:-90.27828253146464, latB:42.18568003647120},
      {id:548, lngA:-90.30206262337461, latA:42.18109039706414, lngB:-90.29346853871149, latB:42.19231892903666},
      {id:549, lngA:-90.31741432400432, latA:42.18812089196933, lngB:-90.31017076692822, latB:42.19677184336619},
      {id:550, lngA:-90.33306646758962, latA:42.19557453626149, lngB:-90.32632375095100, latB:42.20588201957045},
      {id:551, lngA:-90.35257239658488, latA:42.19948705665485, lngB:-90.34156596426730, latB:42.21768994092384},
      {id:552, lngA:-90.36920107811380, latA:42.20487880828650, lngB:-90.36032385531085, latB:42.22203989211862},
      {id:553, lngA:-90.38543894968876, latA:42.21291372872307, lngB:-90.37509934505240, latB:42.22365806070458},
      {id:554, lngA:-90.40042187251275, latA:42.22360654637048, lngB:-90.38824615662774, latB:42.23387492338389},
      {id:555, lngA:-90.41117169670085, latA:42.23760406161571, lngB:-90.40019743364833, latB:42.24365202199954},
      {id:556, lngA:-90.42256570755437, latA:42.24969666940589, lngB:-90.40602282310066, latB:42.25542235867358},
      {id:557, lngA:-90.42726018691387, latA:42.26429140495284, lngB:-90.41153907297101, latB:42.26799085422678},
      {id:558, lngA:-90.43179962165705, latA:42.27786927289465, lngB:-90.40324229022508, latB:42.28092049494015},
      {id:559, lngA:-90.43408398149786, latA:42.29315103311721, lngB:-90.40628994528976, latB:42.29237224400381},
      {id:560, lngA:-90.43398062550945, latA:42.30715099334995, lngB:-90.40341580341470, latB:42.30556598838324},
      {id:561, lngA:-90.43218205178940, latA:42.32012182733066, lngB:-90.40202390677898, latB:42.31961007388099},
      {id:562, lngA:-90.43144592054718, latA:42.33090746368829, lngB:-90.40228612384961, latB:42.33568289175953},
      {id:563, lngA:-90.43838258819002, latA:42.34211810409654, lngB:-90.42115064617572, latB:42.35347868724634},
      {id:564, lngA:-90.44891589082231, latA:42.35144491044382, lngB:-90.43222518656329, latB:42.36224871022389},
      {id:565, lngA:-90.46169366850577, latA:42.36428467835993, lngB:-90.44615033245869, latB:42.37521948306144},
      {id:566, lngA:-90.47343915242021, latA:42.37224284770302, lngB:-90.45917650250760, latB:42.38460475889262},
      {id:567, lngA:-90.48977015538519, latA:42.38316509452433, lngB:-90.47415580710189, latB:42.39469571763775},
      {id:568, lngA:-90.50205463858384, latA:42.39198447275029, lngB:-90.48874789507349, latB:42.40483018745399},
      {id:569, lngA:-90.51962544522260, latA:42.40127174140468, lngB:-90.50912272226023, latB:42.41582778954614},
      {id:570, lngA:-90.53408698279736, latA:42.40718628646119, lngB:-90.52535334577914, latB:42.42199393220037},
      {id:571, lngA:-90.55141778445802, latA:42.41263839375144, lngB:-90.54493141888224, latB:42.42774516716232},
      {id:572, lngA:-90.57101143567522, latA:42.42055440742370, lngB:-90.54763994538814, latB:42.42962140336216},
      {id:573, lngA:-90.58273721223038, latA:42.42980757939554, lngB:-90.56131550433221, latB:42.44051831322754},
      {id:574, lngA:-90.59097296836788, latA:42.43695362214855, lngB:-90.57884414483848, latB:42.45044632362330},
      {id:575, lngA:-90.60593165611589, latA:42.44702038973981, lngB:-90.59594192639597, latB:42.46166608643688},
      {id:576, lngA:-90.62172652751784, latA:42.45417303869883, lngB:-90.61151416087836, latB:42.46844925102864},
      {id:577, lngA:-90.63654393748268, latA:42.46124440154581, lngB:-90.62600880152826, latB:42.47682454436409},
      {id:578, lngA:-90.65275994566505, latA:42.47177806713515, lngB:-90.63833392730551, latB:42.48494585602646} 
    ];
  
  
    if(self.mileMarkersList.length == 0) {
      for(let i=0, len=dat.length; i<len; i++) {
        let mName = "Mile "+dat[i].id;
        //Append miles with land marks
        
        if(dat[i].id===486) { mName += " I-74 Bridge"; }
        if(dat[i].id===482) { mName += " Centennial Bridge"; }
        if(dat[i].id===475) { mName += " I-74 Bridge"; }
        if(dat[i].id===520) { mName += " Route 136 Bridge"; }
        
        self.mileMarkersList.push(new google.maps.Polyline({
            name: "Mile "+dat[i].id,            
            path: [
                {lat: dat[i].latA, lng: dat[i].lngA},
                {lat: dat[i].latB, lng: dat[i].lngB}
            ],
            strokeColor: self.green,
            strokeWeight: 2,
            map: self.map
        }));
        self.mileMarkersLabels.push(new google.maps.Marker({
            position: {lat: dat[i].latA, lng: dat[i].lngA },
            title: mName, 
            label: String(dat[i].id),
            icon: {
              url: self.mileMarkerIconUrl,
              labelOrigin: {x: 24, y: 15},
              scaledSize: {width: 50, height: 50}
            },
            map: self.map
        })); 
      }
    }
    //After building maps, init the db
    initLiveScan();  
  };

  self.goToPage = function(name="list", index) {
    //console.log("goToPage()", name, index);
    let lastView;
    switch(name) {
      case "detail": {
        // lastView = self.nowPage;
        self.selectedView = {view: 'detail', idx: index};
        self.map.setCenter(self.liveScans[index].position);
        self.map.setZoom(14);
        self.outputDetail(index);
        break;
      }
      case "list": {
        // lastView = self.nowPage;
        self.selectedView = {view: 'list', idx: index} ;
        // self.nowPage = 'list';
        self.outputAllVessels();
        break;
      }
    }
  };

  self.outputDetail = function(index) {
    self.mapDiv.classList.add("active");
    self.vessList.classList.remove("active");
    let obj = self.liveScans[index];
    obj.spd = "";
    if(obj.dir !=="undetermined") {
      obj.spd = Math.round(obj.speed);
    }
    //Contingency for null lat/lng
    let lat = obj?.lat.toFixed(7) || ""
    let lng = obj?.lng.toFixed(7) || ""
    
    //let lat = obj.lat ==="" ? "" : obj.lat.toFixed(7);
    //let lng = obj.lng ==="" ? "" : obj.lng.toFixed(7);
    let detailOutput =     
    `<ul>
        <li>
        <div class="list-wrap">
          <h4 class="map-label">${obj.mapLabel}</h4>
          <button onClick="liveScanModel.goToPage('list')">LIST</button>
          <h4 class="tile-title">${obj.name}</h4> 
          <div class="dir-container">
            <img class="dir-img" src="${obj.dirImg}"/>
            <span class="speed">${obj.spd}</span>
          </div>               
        </div>
        <div class="data-cont grid2-container">
          <div id="data-table">
            <ul id="selected-vessel">
              <li class="dataPoint"><span class="th">TYPE:</span> <span class="td">${obj.type}</span></li>
              <li class="dataPoint"><span class="th">MMSI #:</span> <span class="td">${obj.id}</span></li>
              <li class="dataPoint"><span class="th">COURSE:</span> <span class="td">${obj.course}°</span></li>
              <li class=dataPoint><span class=th>SPEED:</span> <span class=td>${obj.speed} Knots</span></li>
              <li class="dataPoint"><span class="th">DIRECTION:</span> <span class="td dir">${obj.dir}</span>  </li>
              <li class="dataPoint"><span class="th">COORDINATES:</span> <span class="td dir">${lat}, ${lng}</span>  
              </li>
            </ul>
          </div>
          <div id="img-frame"><img id="data-image" src="${obj.imageUrl}"></div><br>
        </div>
        <h5>${obj.liveLocation}</h5>
        </li>
    </ul>`;
    self.pageInsert.innerHTML = detailOutput;
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  };

  self.outputAllVessels = async function() {
    self.mapDiv.classList.remove("active");
    self.vessList.classList.add("active");
    let allVesselsOutput = "", i, j;
    //Order vessels by river segment
    let segments = [ [], [], [], [], [] ];
    for(let vessel in self.liveScans) {
      let obj = self.liveScans[vessel];
      obj.spd = "";
      if(obj.dir !=="undetermined") {
        obj.spd = Math.round(obj.speed);
      }
      switch(obj.segment) {
        case 0: { segments[0].push(obj); break; }
        case 1: { segments[1].push(obj); break; }
        case 2: { segments[2].push(obj); break; }
        case 3: { segments[3].push(obj); break; }
        case 4: { segments[4].push(obj); break; }
      }
    }
    //Build output string for each segment
    const maplines = [
      ``,
      `<li><span class="waypoint">3 SOUTH</span></li>`,
      `<li><span class="waypoint">RR  BRIDGE</span></li>`,
      `<li><span class="waypoint">LOCK 13</span></li>`,
      `<li><span class="waypoint">3 NORTH</span></li>`
    ];
    for(i=4; i>-1; i--) {
      if(segments[i].length) {
        segments[i] = segments[i].sort(compareSeg);
        for(j=0; j<segments[i].length; j++) {
          obj = segments[i][j];
          allVesselsOutput+= 
          `<li>
            <div class="list-wrap">
              <h4 class="map-label">${obj.mapLabel}</h4>
              <button onClick="liveScanModel.goToPage('detail',${obj.key})">MAP</button> 
              <h4 class="tile-title">${obj.name}</h4> 
              <div class="dir-container">
                <img class="dir-img" src="${obj.dirImg}"/>
                <span class="speed">${obj.spd}</span>
              </div>               
            </div>
            <h5>${obj.liveLocation}</h5>
          </li>`;
        }
      }
      allVesselsOutput+= maplines[i];
    }       
    self.totVessels.innerHTML = liveScanModel.liveScans.length+" Vessels"; //Total Vessels Title
    self.allVessels.innerHTML = allVesselsOutput;     //List of All transponders in range
    self.pageInsert.innerHTML = "";
  }
}





//LiveScan class defintion
class LiveScan {
  constructor() {
    //this.state          = state //callback
    this.liveLastScanTS = null
    this.transponderTS  = null
    this.plotTS         = null
    this.position       = null
    this.lat            = null
    this.lng            = null
    this.id             = null
    this.name           = null
    this.liveLocation   = null
    this.segment        = null
    this.mapLabel       = null
    this.btnText        = "+"
    this.dir            = "undetermined"
    this.dirImg         = null
    this.callsign       = null
    this.timerOutput    = null
    this.speed          = null
    this.course         = null
    this.length         = null
    this.width          = null
    this.draft          = null
    this.map1marker     = null
    this.map2marker     = null
    this.hasImage       = null
    this.imageUrl       = null
    this.type           = null
    this.liveIsLocal    = false
    this.liveMarkerAlphaWasReached = false
    this.liveMarkerAlphaTS         = null
    this.liveMarkerBravoWasReached = false
    this.liveMarkerBravoTS         = null
    this.liveMarkerCharlieWasReached = false
    this.liveMarkerCharlieTS         = null
    this.liveMarkerDeltaWasReached = false
    this.liveMarkerDeltaTS         = null
    this.expandedViewOn            = false
    this.lastMovementTS            = new Date()
    this.dataAge                   = "age-green"
    this.prevLat                   = null
    this.prevLng                   = null
    this.isMoving                  = false
    this.localVesselText           = () => {
      if(this.liveIsLocal==1) {
        return "Passages are not logged for this local operations vessel as it doesn't cross all four monitored waypoints.";
      } else if(this.liveIsLocal==0) {
        return "";
      }
    }
    this.toggleExpanded = () => {
      this.expandedViewOn = !this.expandedViewOn
    }

    this.lastMovementAgo           = () => {
      var now  = Date.now();
      var diff = Math.floor((now - this.lastMovementTS.getTime())/60000)
      //return "now: "+now +"last: " + this.lastMovementTS().getTime() + "now - diff = "+diff;
      return diff>1 ? diff + " Minutes Ago" : "Current";
    }
    
    this.url = () => {
      return "../logs/history/" + this.id;
    }
    this.setDirImg = ()=> {
      switch(this.dir) {
        case "undetermined": return "https://storage.googleapis.com/www.clintonrivertraffic.com/images/qmark.png"; break;
        case "upriver"     : return "https://storage.googleapis.com/www.clintonrivertraffic.com/images/uparr.png"; break;
        case "downriver"   : return "https://storage.googleapis.com/www.clintonrivertraffic.com/images/dwnarr.png"; break;
      }
    }
    
  }
}


/* * * * * * * * *
* Functions  
*/
function initLiveScan() {  
  /*   *   *   *   *   *   *   *   *   *   *  *  *   *
   * Begin a 60 sec master clock for loop control    */
  setInterval( async ()=> {

    //Reset clock to 0 every 1 min (& increment minute)
    if(liveScanModel.tock==60) {
      liveScanModel.tock = 0
    }
    //Events below to fire on specific intervals (Modulas % determines multiples)

    //Get livescan transponders every 20 sec
    if(liveScanModel.tock%20==0) {
      const myHeaders = new Headers({
        'Content-Type': 'application/json'
      });
      
      let response = await fetch(liveScanModel.fetchUrl,  {
        headers: myHeaders
      });
      if(response.status===200) {
        let data = await response.json();
        let key, obj, len;
        
       
        data.forEach( (dat) => {
          if(!liveScanModel.liveScans.length){
            key = -1;
          } else {
            key = getKeyOfId(liveScanModel.liveScans, dat.liveVesselID);
          }
          
          //Create & push
          if(key==-1) {
            obj = liveScanModel.mapper(new LiveScan(), dat, true);
            obj.key = liveScanModel.liveScans.length;
            liveScanModel.liveScans.push(obj);
            //len = await fetchPassagesList()
            //outputSelVessel(); // LET CLOCK DO ALL UPDATES
          }
          //Find & Update
          else {
            liveScanModel.liveScans[key] = liveScanModel.mapper(liveScanModel.liveScans[key], dat, false)
            //Has num of vessels changed?
            if(liveScanModel.liveScans.length != liveScanModel.numVessels) {
              //Store new vessels quantity
              liveScanModel.numVessels = liveScanModel.liveScans.length;              
            }
          }  
        });
        
        //Write to page if viewList is active
        // if(liveScanModel.selectedView.view=="list") {
        //   liveScanModel.outputAllVessels();
        // } else {
        //  liveScanModel.outputDetail(liveScanModel.selectedView.idx);
        //}

      } else {
         console.error("Error fetching live scans: ", response.status, response.statusText);
      }
    }
    //Advance clock every 1 sec
    liveScanModel.tock++
  }, 1000);
  /*  END OF CLOCK LOOP   */
 
}




function getKeyOfId(arr, id) {
  let key = -1;
  arr.forEach(function (currentVal, idx) {
    if(id == currentVal.id) {
      key = idx;
    }
  });
  return key;  
}



//Function used in initLiveScan()
function formatTime(ts) {
  var d, day, days, dh, h, m, merd, str;
  if(ts=="Not Yet Reached") { return ts; }
  ts = new Date(ts);
  h = ts.getHours();
  m = ts.getMinutes();
  if(m < 10) { m = "0" + m; }
  d = ts.getDay();
  days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  day  = days[d];
  merd = h>=12 ? 'pm':'am';
  if(h>12) { 
    dh = h-12; 
  } else if(h==0) {
    dh = 12;
  } else {
    dh = h;
  }
  str = dh +":"+m+merd+" "+day;
  return str;
}

function compareSeg(a, b) {
  return b.lat - a.lat;
}

function initMap() {
  liveScanModel.initalizeMap();
}


/*  *  *
 *   Constants for DOM references
 */
const liveScanModel = new LiveScanModel();
window.liveScanModel = liveScanModel;
window.initMap = initMap;
window.initLiveScan = initLiveScan;





/* *
 *  ACTIONS SECTION 
 */

