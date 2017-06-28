const {app, BrowserWindow, ipcMain, desktopCapturer} = require('electron')
const path = require('path')
const url = require('url')
const $ = require('NodObjC')
$.import('Cocoa');
$.import('Foundation');

var ready = false
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 650, height: 600, resizable: false, titleBarStyle: 'hidden'})

  // and load the index.html of the app.
  // win.loadURL(url.format({
  //   pathname: path.join(__dirname, './client/host/html/index.html'),
  //   protocol: 'file:',
  //   slashes: true
  // }))

  // win.loadURL(url.format({
  //   pathname:("localhost:53000/host/index"),
  //   protocol:"http:",
  //   slashes: true
  // }))
  
  win.loadURL(url.format({
    pathname:("localhost:53000/host/index"),
    protocol:"https:",
    slashes: true
  }))

  // Open the DevTools.
  // win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Avoid Error on SSL/TLS
app.on('certificate-error', (event, webContents, url, error, cetificate, callback) => {

  event.preventDefault()
  callback(true)
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    startApplication()
  }
})

const NSEventType = {
  mousedown: $.NSLeftMouseDown,
  mouseup: $.NSLeftMouseUp,
  mousedragged: $.NSLeftMouseDragged
}

var dragged = false

ipcMain.on('createEvent',(self,data)=>{
  createLeftMouseEvent(data.type,{x:data.x,y:data.y},{width:data.width,height:data.height},data.windowId)
})

function createLeftMouseEvent(eventtype,coordinate,size,windowId){
  var fileManager = $.NSFileManager('defaultManager')
  var windowList = $.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly,$.kCGNullWindowID)
  windowList = $.CFBridgingRelease(windowList);

  var processId = null
  var width = null
  var height = null
  for(var i=0;i<windowList('count');i++){
    var appWindow = windowList('objectAtIndex', i)
    if("window:"+appWindow('objectForKey', $.kCGWindowNumber) == windowId){
      processId = appWindow('objectForKey', $.kCGWindowOwnerPID)
      windowId = appWindow('objectForKey', $.kCGWindowNumber)
      const bounds = appWindow('objectForKey', $.kCGWindowBounds)
      width = bounds('objectForKey', $('Width'))
      height = bounds('objectForKey', $('Height'))
    }
  }

  if(!(processId && width && height)){
    return
  }

  const hostAspect = width/height
  const remoteAspect = size.width/size.height
  var dx = coordinate.x
  var dy = coordinate.y

  if(hostAspect >= remoteAspect){ // 縦にはみ出る
    dx *= width/size.width
    dy -= (size.height/2-size.width/hostAspect/2)
    dy *= height/size.height
    dy = height-dy
  } else { // 横にはみ出る
    dx -= (size.width/2-size.height*hostAspect/2)
    dx *= width/size.width
    dy *= height/size.height
    dy = height-dy
  }

  switch(eventtype){
    case 'mousedown' :
    dragged = true
    break
    case 'mouseup' :
    dragged = false
    break
    default :
    if(!dragged){
      return
    } else {
      return
    }
    break
  }

  var event = $.NSEvent(
      'mouseEventWithType', NSEventType[eventtype],
      'location', $.NSMakePoint(dx,dy),
      'modifierFlags', 0,
      'timestamp', $.NSProcessInfo('processInfo')('systemUptime'),
      'windowNumber', $.NSNumber('numberWithInt', windowId)('unsignedLongLongValue'),
      'context', $.NSGraphicsContext('currentContext'),
      'eventNumber', 0,
      'clickCount', 1,
      'pressure', 0
    );
  var event = event('CGEvent');
  $.CGEventPostToPid(processId,event);
}

function startApplication(){
  if(ready){
    createWindow()
  }else{
    ready = true
  }
}