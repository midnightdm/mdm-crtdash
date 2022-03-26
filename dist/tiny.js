/*   *   *   *   *   *   *   *   *   *
 
Contains all code for static page tiny.html which customizes CRT data for KiOS or other really small screen.

 *   *   *   *   *   *   *   *   *   *



-- Begin class definitions --
*/

//LiveScanModel holds view data
function LiveScanModel() {
  let self = this;

  //Config values
  self.fetchUrl  = "https://storage.googleapis.com/www.clintonrivertraffic.com/livescan.json";
  self.tock      = 0;

  //Loaded data store
  self.liveScans = [];

  //Status vars
  self.numVessels    = 0;
  prevWaypoint       = {};
  self.selectedView  = {view: "list", idx: null };
  self.nowPage       = "list";
  self.lastPage      = "list";

  //Page elements
  self.pageInsert    = document.getElementById("page-insert");
  self.vessList      = document.getElementById("vess-list");
  self.allVessels    = document.getElementById("all-vessels");
  self.totVessels    = document.getElementById("total-vessels");
  //self.mapDiv        = document.getElementById("map");
  
  //Method assigns data to Livescan objects
  self.mapper = function(o, dat, isNew) {
    o.transponderTS  = parseInt(dat.transponderTS);
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
    return o;
  };


  self.initalizeMap = function() {
    initLiveScan();  
  };

  self.goToPage = function(name="list", index) {
    //console.log("goToPage()", name, index);
    let lastView;
    switch(name) {
      case "detail": {
        // lastView = self.nowPage;
        self.selectedView = {view: 'detail', idx: index};
        //self.map.setCenter(self.liveScans[index].position);
        //self.map.setZoom(14);
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
    //self.mapDiv.classList.add("active");
    self.vessList.classList.remove("active");
    let obj = self.liveScans[index];
    //console.log("detail index:", index);
    let detailOutput = 
      
    `<ul>
        <li>
        <div class="list-wrap">
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
              <li class="dataPoint"><span class="th">COORDINATES:</span> <span class="td dir">${obj.lat.toFixed(7)}, ${obj.lng.toFixed(7)}</span>  
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
    //self.mapDiv.classList.remove("active");
    self.vessList.classList.add("active");
    let allVesselsOutput = "", i;
    //Order vessels by river segment
    let segments = {s0:[], s1:[], s2:[], s3:[], s4:[]};
    for(let vessel in self.liveScans) {
      let obj = self.liveScans[vessel];
      obj.spd = "";
      if(obj.dir !=="undetermined") {
        obj.spd = Math.round(obj.speed);
      }
      switch(obj.segment) {
        case 0: { segments.s0.push(obj); break; }
        case 1: { segments.s1.push(obj); break; }
        case 2: { segments.s2.push(obj); break; }
        case 3: { segments.s3.push(obj); break; }
        case 4: { segments.s4.push(obj); break; }
      }
    }
    //Build output string for each segment
    
    if(segments.s4.length) {
      segments.s4 = segments.s4.sort(compareSeg)
      for(i=0; i<segments.s4.length; i++) {
        obj = segments.s4[i];
        allVesselsOutput+= 
        `<li>
          <div class="list-wrap">
            <button onClick="liveScanModel.goToPage('detail',${obj.key})">DATA</button> 
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
    allVesselsOutput+=`<li><span class="waypoint">3 NORTH</span></li>`;
    if(segments.s3.length) {
      segments.s3 = segments.s3.sort(compareSeg)
      for(i=0; i<segments.s3.length; i++) {
        obj = segments.s3[i];
        allVesselsOutput+= 
        `<li>
          <div class="list-wrap">
            <button onClick="liveScanModel.goToPage('detail',${obj.key})">DATA</button> 
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
    allVesselsOutput+=`<li><span class="waypoint">LOCK 13</span></li>`;
    if(segments.s2.length) {
      segments.s2 = segments.s2.sort(compareSeg)
      for(i=0; i<segments.s2.length; i++) {
        obj = segments.s2[i];
        allVesselsOutput+= 
        `<li>
          <div class="list-wrap">
            <button onClick="liveScanModel.goToPage('detail',${obj.key})">DATA</button> 
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
    allVesselsOutput+=`<li><span class="waypoint">RR  BRIDGE</span></li>`;
    if(segments.s1.length) {
      segments.s1 = segments.s1.sort(compareSeg)
      for(i=0; i<segments.s1.length; i++) {
        obj = segments.s1[i];
        allVesselsOutput+= 
        `<li>
          <div class="list-wrap">
            <button onClick="liveScanModel.goToPage('detail',${obj.key})">DATA</button> 
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
    allVesselsOutput+=`<li><span class="waypoint">3 SOUTH</span></li>`;
    if(segments.s0.length) {
      segments.s0 = segments.s0.sort(compareSeg)
      for(i=0; i<segments.s0.length; i++) {
        obj = segments.s0[i];
        allVesselsOutput+= 
        `<li>
          <div class="list-wrap">
            <button onClick="liveScanModel.goToPage('detail',${obj.key})">DATA</button> 
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
    this.alphaTime = () => {
      if(this.liveMarkerAlphaTS===null) {
        return "Not Yet Reached";
      } else {
      return formatTime(this.liveMarkerAlphaTS);
      }
    } 
    this.bravoTime = ()=> {
      if(this.liveMarkerBravoTS===null) {
        return "Not Yet Reached";
      } else {
        return formatTime(this.liveMarkerBravoTS);
      }       
    } 
    this.charlieTime = ()=> {
      if(this.liveMarkerCharlieTS===null) {
        return "Not Yet Reached";
      } else {
        return formatTime(this.liveMarkerCharlieTS);
      }      
    } 
    this.deltaTime = ()=> {
      if(this.liveMarkerDeltaTS===null) {
        return "Not Yet Reached";
      } else {
        return formatTime(this.liveMarkerDeltaTS);
      }     
    } 
  }
}


/* * * * * * * * *
* Functions  
*/
async function initLiveScan(rotateTransponders=true) {  
  /*   *   *   *   *   *   *   *   *   *   *  *  *   *
   * Begin a 60 sec master clock for loop control    */
  setInterval( async ()=> {
    //Advance clock every 1 sec
    liveScanModel.tock++
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
        if(liveScanModel.selectedView.view=="list") {
          liveScanModel.outputAllVessels();
        } else {
          liveScanModel.outputDetail(liveScanModel.selectedView.idx);
        }

      } 
    }
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
//window.initMap = initMap;
window.initLiveScan = initLiveScan;





/* *
 *  ACTIONS SECTION 
 */
initLiveScan();
