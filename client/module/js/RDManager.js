/*
  RDManager
  |-RDHostManager
  |-RDRemoteManager

  RDConnector

  RDManager
    コネクションの処理

  RDHostManager
    UniqueIDの発行
    id=image_container,stream_containerを持つdiv要素が必要

  RDRemoteManager
    入力されたUniqueIDを探索させる
*/

class RDManager{

  constructor(){
    this.elementCount = 0
    this.rowCount = 0
  }

  createUniqueId(){
    return Math.random().toString(36).slice(-8)
  }

  appendWindowImageElement(winId, winName,winImageUrl){

    const frame_div = document.createElement("div")
    const panel_div = document.createElement("div")
    const panel_head_div = document.createElement("div")
    const panel_body_div = document.createElement("div")
    const thumbnail_img = document.createElement("img")
    const name_h3 = document.createElement("h4")

    frame_div.className = "col-sm-3"
    panel_div.className = "panel panel-default"
    panel_head_div.className = "panel-head"
    panel_body_div.className = "panel-body"

    frame_div.id = winId

    panel_head_div.appendChild(name_h3)
    panel_body_div.appendChild(thumbnail_img)
    panel_div.appendChild(panel_head_div)
    panel_div.appendChild(panel_body_div)
    frame_div.appendChild(panel_div)

    thumbnail_img.onload = ()=>{
      //document.body.appendChild(thumbnail_img)
      //console.log(winName)
      name_h3.innerHTML = winName
      thumbnail_img.style.width = "100%"
      thumbnail_img.style.height = "100%"
      if((this.elementCount % 4) == 0){
        this.rowCount = this.rowCount + 1
        this.appendWindowImageElementRow()
      }
      this.elementCount = this.elementCount+1
      document.getElementById("row"+String(this.rowCount)).appendChild(frame_div)
      this.setClickEventListener(frame_div)
    }
    thumbnail_img.src = winImageUrl

  }


  appendWindowImageElementRow(){
    const row_div = document.createElement("div")
    row_div.className = "row"
    row_div.id = "row"+String(this.rowCount)
    document.getElementById("image_container").appendChild(row_div)
  }


  appendWindowStreamElement(mediaStream){
      const container_row_div = document.createElement("div")
      const container_col_div = document.createElement("div")
      const panel_body_div = document.createElement("div")
      const panel_head_div = document.createElement("div")
      const window_video = document.createElement("video")
      const name_h3 = document.createElement("h3")

      container_row_div.className = "row"
      container_col_div.className = "col-sm-12 panel panel-default"
      panel_body_div.className = "panel-body"
      panel_head_div.className = "panel-head"

      window_video.src = URL.createObjectURL(mediaStream);
      window_video.style.width = "100%"
      window_video.style.height = "100%"
      name_h3.innerHTML = "Capture"

      panel_head_div.appendChild(name_h3)
      panel_body_div.appendChild(window_video)

      container_col_div.appendChild(panel_head_div)
      container_col_div.appendChild(panel_body_div)

      container_row_div.appendChild(container_col_div)

      document.getElementById("stream_container").appendChild(container_row_div)
  }

  displayWindowList(windowList){
    const self = this
    this.clearDisplayWindowList()
    windowList.forEach((elm,ind,arr)=>{
      self.appendWindowImageElement(elm.windowId, elm.windowName, elm.imageURL)
    })
  }

  clearDisplayWindowList(){
    document.getElementById("image_container").innerHTML = ""
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

  setRDConnector(apikey, url){

  }

  setClickEventListener(dom_elm){

  }

}

class RDHostManager extends RDManager{
  constructor(screen, desktopCapturer){
      super()
      this.screenWidth = screen.getPrimaryDisplay().size.width
      this.screenHeight = screen.getPrimaryDisplay().size.height
      this.desktopCapturer = desktopCapturer
      this.getWindowList()
  }

  getWindowList(callback=function(){}){
    const self = this
    this.desktopCapturer.getSources({types:['window','screen'],thumbnailSize:{width:300,height:300}},(error,sources)=>{
			if(error){
				console.error(error)
			}

      self.windowList = sources.map((elm,ind,arr)=>{
        //console.log(elm)
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
    console.log(option)
    navigator.webkitGetUserMedia({
						audio: false,
						video : {
							mandatory: {
								chromeMediaSource: 'desktop',
								chromeMediaSourceId: option.windowId,
                maxWidth: option.width,
                 maxHeight: option.height,
                 minWidth:option.width,
                 minHeight:option.height
							}
						}
					},function(stream){
            callback(stream)
					},function(error){
						console.log('error on getStream')
						console.log(error)
					});
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


  setClickEventListener(dom_elm){

  }

}

class RDRemoteManager extends RDManager{
  constructor(){
    super()
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
    document.getElementById("stream_container").innerHTML = ""
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
        width : window.innerWidth,
        height : window.innerHeight
      })
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
