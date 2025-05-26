export const DataModel = {
    cameras: {},
    camerasArr: [],
    webcamSites: {},
    init: true,
    siteList: ["clinton", "qc", "regional"],
    selectedSite: "",
    selectedCamera: "",
    previousCamera: "",
    channelIsEnabled: true,
    alternates: {},
    liveCams: {},
    nextPromo: {},
    idTimes: [
        { min: 59, sec: 45, videoIsFull: false }
    ],
    refreshTimes: [],
    inBuffer: [],
    inCurrent: [],
    newCams: [],
    newsObj: {},
    newsArr: [],
    newsKey: 0,
    tock: 0,
    minute: 0, 
    idPlus15: {
      min: 0,
      sec: 0
    }

}