/* LiveScan class  */
//LiveScan Object class
export default class LiveScan {
  constructor() {
    this.liveLastScanTS = null
    this.transponderTS  = null
    this.plotTS         = null
    this.position       = null
    this.lat            = null
    this.lng            = null
    this.id             = null
    this.name           = null
    this.liveLocation   = null
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
    this.map3marker     = null
    this.hasImage       = null
    this.imageUrl       = null
    this.type           = null
    this.liveIsLocal    = false
    this.inCameraRange  = false
    this.isInCameraRange = {"A": false, "B":false, "C":false, "D":false}
    this.typeIsPassenger = false
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
    this.lastPassageTS             = null
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
