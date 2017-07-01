/*
  RDManager
  |-RDHostManager
  |-RDRemoteManager

  RDConnector

  RDManager
    コネクションの処理

  RDHostManager
    UniqueIDの発行
    id=thumnail-list,stream_containerを持つdiv要素が必要

  RDRemoteManager
    入力されたUniqueIDを探索させる
*/

class RDManager{

  constructor(){
    this.elements = {}
    this.elementCount = 0
    this.rowCount = 0
    this.SHAREDMOUSEEVENTTYPE = ["mousedown","mouseup","mousemove"]
    this.SHAREDKEYEVENTTYPE = ["keydown","keyup"]
  }

  createUniqueId(){
    return Math.random().toString(36).slice(-8)
  }

  appendWindowImageElement(winId, winName,winImageUrl){

    const frame_div = document.createElement("div")
    const thumbnail_img = document.createElement("img")

    frame_div.className = "thumbnail-cell mdl-cell mdl-cell--12-col"

    frame_div.id = winId
    frame_div.name = winName
    frame_div.sharable = {
      viewing: true,
      operating: false
    }

    frame_div.appendChild(thumbnail_img)

    thumbnail_img.onload = ()=>{
      document.body.appendChild(frame_div)
      // console.log(winName)
      thumbnail_img.style.width = "100%"
      thumbnail_img.style.height = "100%"
      if((this.elementCount % 4) == 0){
        this.rowCount = this.rowCount + 1
        this.appendWindowImageElementRow()
      }
      this.elementCount = this.elementCount+1
      this.elements[frame_div.id] = frame_div
      document.getElementById("row"+String(this.rowCount)).appendChild(frame_div)
      this.setClickEventListener(frame_div)
    }
    thumbnail_img.src = winImageUrl
  }


  appendWindowImageElementRow(){
    const row_div = document.createElement("div")
    row_div.className = "row"
    row_div.id = "row"+String(this.rowCount)
    document.getElementById("thumnail-list").appendChild(row_div)
  }

  displayWindowList(windowList){
    const self = this
    this.clearDisplayWindowList()
    windowList.forEach((elm,ind,arr)=>{
      self.appendWindowImageElement(elm.windowId, elm.windowName, elm.imageURL)
    })
  }

  clearDisplayWindowList(){
    document.getElementById("thumnail-list").innerHTML = ""
    this.elementCount = 0
    this.rowCount = 0
  }


  /*
    override method
  */
  onConnectorGetData(data){

  }

  onConnectorGetStream(mediaStream){

  }

  onConnectorGetMessage(data){

  }

  setRDConnector(apikey, url){

  }

  setClickEventListener(dom_elm){

  }
}

class RDHostManager extends RDManager{
  constructor(screen, desktopCapturer, ipcRenderer){
      super()
      this.screenWidth = screen.getPrimaryDisplay().size.width
      this.screenHeight = screen.getPrimaryDisplay().size.height
      this.desktopCapturer = desktopCapturer
      this.ipcRenderer = ipcRenderer
      this.getWindowList()
  }

  getWindowList(callback=function(){}){
    const self = this
    this.desktopCapturer.getSources({types:['window','screen'],thumbnailSize:{width:400,height:300}},(error,sources)=>{
			if(error){
				console.error(error)
			}

      self.windowList = sources.map((elm,ind,arr)=>{
        return {
          windowId : elm.id,
          windowName : elm.name,
          imageURL : elm.thumbnail.toDataURL()
        }
      })
      self.displayWindowList(self.windowList)
      callback()
		})
  }


  getWindowMediaStream(option,callback){
    navigator.webkitGetUserMedia({
						audio: false,
						video : {
							mandatory: {
								 chromeMediaSource: 'desktop',
								 chromeMediaSourceId: option.windowId,
                 maxWidth: option.width,
                 maxHeight: option.height,
                 minWidth: option.width,
                 minHeight: option.height
							}
						}
					},function(stream){
            callback(stream)
					},function(error){
						console.log('error on getStream')
						console.log(error)
					});
  }

  sendRequestCreateEventToMainProcess(event){
  	this.ipcRenderer.send("createEvent",event)
  }

  /*
    override method host
  */
  onConnectorGetData(data){
    const self = this
    switch(data.act){
      case "requestWindowStream" :
        //TODO mediastreamをひっぱってくる
        //TODO peer.call("id",mediastream)
        // act, peerId, windowId,
        self.getWindowMediaStream({windowId:data.windowId,width:data.width,height:data.height},(stream)=>{
          //送り返す
          self.connector.callMediaStream(data.peerId,stream)
        })
      break;
      case "requestWindowList" :
        //送り返す
        self.getWindowList(()=>{
          self.connector.sendMessage(data.peerId,{
            act : "responseWindowList",
            windowList : self.windowList
          })
        })
      break;
      case "createMouseEvent" :
        self.sendRequestCreateEventToMainProcess(data)
      break;
      default :
      break;
    }
  }

  onConnectorGetStream(mediaStream){
    // nothing to do
    // mediaStream = {}
  }

  setRDConnector(apikey, url){
    const self = this
    if(!this.connector){
      this.connector = new RDHostConnector(apikey,url)
      this.connector.setOnGetDataEvent((data)=>{
        self.onConnectorGetData(data)
      })
      this.connector.setOnGetStreamEvent((mediaStream)=>{
        self.onConnectorGetStream(mediaStream)
      })
    }
  }

  clearDisplayWindowPreview(){
    document.getElementById("thumnail-preview").innerHTML = ""
  }

  clearDisplaySettingView(){
    document.getElementById("setting-box").innerHTML = ""
  }

  setClickEventListener(dom_elm){
    dom_elm.addEventListener('click',(e)=>{
      this.clearDisplayWindowPreview()
      this.clearDisplaySettingView()
      const window_video = document.createElement("video")

      window_video.style.width = "100%"
      window_video.style.height = "100%"
      window_video.style.objectFit = "cover"

      document.getElementById("thumnail-preview").appendChild(window_video)

      this.getWindowMediaStream({windowId: dom_elm.id,width:400,height:300},(stream)=>{
        const url = URL.createObjectURL(stream)
        window_video.src = url
        window_video.play()
      })

      const window_name = dom_elm.name
      const sharable_viewing = dom_elm.sharable.viewing
      const sharable_operating = dom_elm.sharable.operating

      const name_h6 = document.createElement("h4")
      const toggle_label_viewing = document.createElement("span")
      const toggle_label_operating = document.createElement("span")
      const toggle_frame_viewing = document.createElement("div")
      const toggle_frame_operating = document.createElement("div")
      const toggle_frame = document.createElement("div")
      const label_viewing = document.createElement("label")
      const input_viewing = document.createElement("input")
      const span_viewing = document.createElement("span")
      const label_operating = document.createElement("label")
      const input_operating = document.createElement("input")
      const span_operating = document.createElement("span")

      name_h6.innerText = window_name.length > 30 ? window_name.slice(0,30)+"..." : window_name
      toggle_label_viewing.innerText = "sharable viewing"
      toggle_label_operating.innerText = "sharable operating"
      label_viewing.className = "mdl-switch mdl-js-switch mdl-js-ripple-effect"
      label_operating.className = "mdl-switch mdl-js-switch mdl-js-ripple-effect"
      input_viewing.className = "mdl-switch__input"
      input_operating.className = "mdl-switch__input"
      span_viewing.className = "mdl-switch__label"
      span_operating.className = "mdl-switch__label"
      input_viewing.type = "checkbox"
      input_operating.type = "checkbox"
      input_viewing.id = "viewing_toggle"
      input_operating.id = "operating_toggle"
      label_viewing.setAttribute("for", input_viewing.id)
      label_operating.setAttribute("for", input_operating.id)
      toggle_frame_viewing.className = "mdl-cell mdl-cell--4-col"
      toggle_frame_operating.className = "mdl-cell mdl-cell--4-col"
      toggle_frame.className = "mdl-grid"
      toggle_frame.style.width = "100%"
      if(sharable_viewing){
        input_viewing.checked = true
      }
      if(sharable_operating){
        input_operating.checked = true
      }
      label_viewing.style.marginLeft = "30px"
      label_operating.style.marginLeft = "30px"
      label_viewing.appendChild(input_viewing)
      label_viewing.appendChild(span_viewing)
      label_operating.appendChild(input_operating)
      label_operating.appendChild(span_operating)
      toggle_frame_viewing.appendChild(toggle_label_viewing)
      toggle_frame_viewing.appendChild(label_viewing)
      toggle_frame_operating.appendChild(toggle_label_operating)
      toggle_frame_operating.appendChild(label_operating)
      toggle_frame.appendChild(toggle_frame_viewing)
      toggle_frame.appendChild(toggle_frame_operating)
      document.getElementById("setting-box").appendChild(name_h6)
      document.getElementById("setting-box").appendChild(toggle_frame)

      input_viewing.onchange = ()=>{
        dom_elm.sharable.viewing = input_viewing.value
      }

      input_operating.onchange = ()=>{
        dom_elm.sharable.operating = input_operating.value
      }

      componentHandler.upgradeElements(label_viewing)
      componentHandler.upgradeElements(label_operating)
    })
  }

}

class RDRemoteManager extends RDManager{
  constructor(){
    super()
    this.displayedWindowId = null
  }

  appendWindowStreamElement(mediaStream){
    const window_video = document.createElement("video")

    window_video.style.width = "100%"
    window_video.style.height = "100%"
    window_video.style.objectFit = "contain"

    this.addSharedEventListener(window_video)
    document.getElementById("shared_window").appendChild(window_video)

    const url = URL.createObjectURL(mediaStream)
    window_video.src = url
    window_video.oncanplay = ()=>{
      window_video.play()
    }
  }

  addSharedEventListener(window_video){
  	window_video.addEventListener("click",(e)=>{
     const altKey = e.altKey
     const ctrlKey = e.ctrlKey
     const shiftKey = e.shiftKey
     const clientX = e.clientX
     const clientY = e.clientY
     const rect = window_video.getBoundingClientRect()
     const dx = (clientX-rect.left)-rect.width/2
     const dy = (clientY-rect.top)-rect.height/2
     var radius = Math.sqrt(dx*dx+dy*dy)
     if(radius == Infinity || Number.isNaN(radius)){
      radius = 1
     }
     const cos = dx/radius
     const radian = Math.acos(cos)
     console.log(radius,radian)
    })
  }

  /*
    override method remote
  */
  onConnectorGetData(data){
    const self = this
    switch(data.act){
      case "responseWindowList" :
        self.displayWindowList(data.windowList)
      break;
      default:
      break;
    }
  }

  onConnectorGetStream(mediaStream){
    document.getElementById("shared_window").innerHTML = ""
    this.appendWindowStreamElement(mediaStream)
  }

  setRDConnector(apikey, url){
    const self = this
    if(!this.connector){
      this.connector = new RDRemoteConnector(apikey,url)
      this.connector.setOnGetDataEvent((data)=>{
        self.onConnectorGetData(data)
      })
      this.connector.setOnGetStreamEvent((mediaStream)=>{
        self.onConnectorGetStream(mediaStream)
      })
    }
  }

  setClickEventListener(dom_elm){
    const self = this
    dom_elm.addEventListener("click",()=>{
      self.connector.sendMessage(self.connector.hostId, {
        act : "requestWindowStream",
        windowId : dom_elm.id,
        width : screen.width,
        height : screen.height
      })
      self.displayedWindowId = dom_elm.id
    })
  }

}


/*******************************************************************************************************************************************************
  host(one) to remote(multi) connection
  automatically make peer connection with socket.io
  requirement
    - socket.io-client.js
    - peer.js
  construction
    RDConnector
      - RDHostConnector
      - RDRemoteConnector
*******************************************************************************************************************************************************/


/**
  require socket.io-client.js, peer.js
**/
class RDConnector{
  constructor(apikey, url){
    this.SKYWAY_API_KEY = apikey
    this.SOCKET_URL = url

    this.onGetStream = ()=>{}
    this.onGetData = ()=>{}
    this.onConnected = ()=>{}
    this.onGetMessage = ()=>{}

    this.dataConnectionMap = new Map()
    this.streamConnectionMap = new Map()

    this.initSocket()
    this.initPeer()
  }


  initSocket(){
    const self = this
    this.socket = io(this.SOCKET_URL)
    this.socket.on("connect",()=>{
      console.log("socket connected")
    })
    this.onInitSocket()
  }


  initPeer(){
    const self = this
    this.peer = new Peer({key:self.SKYWAY_API_KEY})
    this.peer.on("open",(id)=>{
      self.peerId = id
      console.log("peer id : " + id)
    })
    this.peer.on("close",()=>{
      self.peer.destroy()
    })
    this.peer.on("error",(err)=>{
      console.error(err)
    })
    this.onInitPeer()
  }

  registDataConnection(dataConnection){
    const self = this
    dataConnection.on("open",()=>{
      console.log("opened data connection")
      dataConnection.on("data",(data)=>{
        self.onGetData(data)
      })
      dataConnection.on("close",()=>{
        dataConnection.close()
      })
      dataConnection.on("error",(err)=>{
        console.error(err)
      })
      self.onDataConnectionOpened(dataConnection)
      this.dataConnectionMap.set(dataConnection.peer, dataConnection)
    })
  }

  registStreamConnection(streamConnection){
    const self = this
    streamConnection.on("stream",(mediaStream)=>{
      self.onGetStream(mediaStream)
    })
    streamConnection.on("close",()=>{
      streamConnection.close()
    })
    streamConnection.on("error",(err)=>{
      console.error(err)
    })
    this.streamConnectionMap.set(streamConnection.peer, streamConnection)
  }

  /*
    message method
  */
  callMediaStream(peerId, mediaStream){
    var check = this.streamConnectionMap.get(peerId)
    if(check){
      check.close()
    }
    var call = this.peer.call(peerId, mediaStream)
    this.registStreamConnection(call)
  }

  sendMessage(peerId, dataObject){
    const conn = this.dataConnectionMap.get(peerId)
    if(conn){
      dataObject.peerId = this.peerId
      conn.send(dataObject)
    }
  }

  broadcastMessage(dataObject){
    const self = this
    dataObject.peerId = this.peerId
    this.dataConnectionMap.forEach((value,key,map)=>{
      value.send(dataObject)
    })
  }

  /*
    set event listener method
  */
  setOnGetStreamEvent(callback){
    this.onGetStream = (mediaStream)=>{
      callback(mediaStream)
    }
  }

  setOnGetDataEvent(callback){
    this.onGetData = (data)=>{
      callback(data)
    }
  }


  /*
    require override
  */
  onInitSocket(){

  }

  onInitPeer(){

  }

  onDataConnectionOpened(dataConnection){

  }

}


class RDHostConnector extends RDConnector{
  // TODO broadcast message method
  constructor(apikey, url){
    super(apikey, url)
  }

  /*
    override methods
  */

  onInitSocket(){
    const self = this
    this.socket.on("requestPeer",(data)=>{
      this.socket.emit("responsePeer",{peerId:self.peerId,socketId:data.socketId}) // socket serverで処理
    })
  }

  onInitPeer(){
    this.peer.on("connection",(dataConnection)=>{
      console.log("data connection")
      this.registDataConnection(dataConnection)
    })
    this.peer.on("call",(streamConnection)=>{
      console.log("call connection")
      this.registStreamConnection(streamConnection)
    })
  }

}


class RDRemoteConnector extends RDConnector{
  // TODO message method
  constructor(apikey, url){
    super(apikey, url)
    this.hostId = ""
  }

  /*
    override methods
  */
  onInitSocket(){
    const self = this
    this.socket.on("responsePeer",(data)=>{
      self.hostId = data.peerId
      const conn = self.peer.connect(data.peerId)
      self.registDataConnection(conn) // イベントが二重発火してたら消す
    })
    this.socket.emit("requestPeer",{})
  }

  onInitPeer(){
    this.peer.on("connection",(dataConnection)=>{
        console.log("data connection")
        this.registDataConnection(dataConnection)
    })
    this.peer.on("call",(streamConnection)=>{
        console.log("call connection")
        this.registStreamConnection(streamConnection)
        streamConnection.answer()
    })
  }

  onDataConnectionOpened(dataConnection){
    const self = this
    dataConnection.send({
      act : "requestWindowList",
      peerId : self.peerId
    })
  }

}

