const electron = require('electron')
const {app, BrowserWindow, ipcMain, desktopCapturer} = electron
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
  
  // get html
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
  mousemove: $.NSLeftMouseDragged,
  wheel: $.NSScrollWheel
}

var dragged = false

ipcMain.on('createMouseEvent',(self,body)=>{
  createLeftMouseEvent(body.event,body.domSize,body.windowId)
})

ipcMain.on('createKeyEvent',(self,body)=>{
  createKeyEvent(body.event,body.windowId)
})

function createKeyEvent(event,windowId){
  const windowListInfo = $.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly,$.kCGNullWindowID)
  const windowList = $.CFBridgingRelease(windowListInfo)

  var processId = null
  var windowNumber = null
  for(var i=0;i<windowList('count');i++){
    var appWindow = windowList('objectAtIndex',i)
    if('window:'+appWindow('objectForKey',$.kCGWindowNumber)==windowId){
      processId = appWindow('objectForKey', $.kCGWindowOwnerPID)
      windowNumber = appWindow('objectForKey',$.kCGWindowNumber)
      break
    }
  }

  if(!processId){
    return
  }

  const type = event.type == 'keydown' ? $.NSKeyDown : $.NSKeyUp
  if(event.key.length>1){
    var characters = null
    switch(event.key){
      case 'Enter':
      characters = $('\n')
      break
      case 'Backspace':
      characters = $('\b')
      break
      case 'Tab':
      characters = $('\t')
      break
      default:
      console.log(event.key)
      return
    }
    const nsEvent1 = $.NSEvent(
     'keyEventWithType', $.NSKeyDown,
     'location', $.NSMakePoint(0,0),
     'modifierFlags', 0,
     'timestamp', $.NSProcessInfo('processInfo')('systemUptime'),
     'windowNumber', $.NSNumber('numberWithInt',windowNumber)('unsignedLongLongValue'),
     'context', $.NSGraphicsContext('currentContext'),
     'characters', characters,
     'charactersIgnoringModifiers', null,
     'isARepeat', false,
     'keyCode', null
     )
    const cgEvent1 = nsEvent1('CGEvent');
    $.CGEventPostToPid(processId,cgEvent1);
    // $.CFRelease(cgEvent1);
    return
  }
  const nsEvent = $.NSEvent(
   'keyEventWithType', $.NSKeyDown,
   'location', $.NSMakePoint(0,0),
   'modifierFlags', 0,
   'timestamp', $.NSProcessInfo('processInfo')('systemUptime'),
   'windowNumber', $.NSNumber('numberWithInt',windowNumber)('unsignedLongLongValue'),
   'context', $.NSGraphicsContext('currentContext'),
   'characters', $(event.key),
   'charactersIgnoringModifiers', $(''),
   'isARepeat', false,
   'keyCode', null
   )
  const cgEvent = nsEvent('CGEvent');
  $.CGEventPostToPid(processId,cgEvent);
  // $.CFRelease(cgEvent);
}

function createLeftMouseEvent(event,domSize,windowId){
  const {width,height} = electron.screen.getPrimaryDisplay().workAreaSize

  const windowListInfo = $.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly,$.kCGNullWindowID)
  const windowList = $.CFBridgingRelease(windowListInfo)

  var processId = null
  var windowWidth = null
  var windowHeight = null
  var windowNumber = null
  var bottom = 0
  var left = 0
  for(var i=0;i<windowList('count');i++){
    var appWindow = windowList('objectAtIndex',i)
    if('window:'+appWindow('objectForKey',$.kCGWindowNumber)==windowId){
      processId = appWindow('objectForKey', $.kCGWindowOwnerPID)
      const bounds = appWindow('objectForKey', $.kCGWindowBounds)
      windowWidth = parseInt(bounds('objectForKey',$('Width')))
      windowHeight = parseInt(bounds('objectForKey',$('Height')))
      bottom = (height+22)-(parseInt(bounds('objectForKey',$('Y')))+windowHeight)
      bottom = bottom < 0 ? 0 : bottom
      left = parseInt(bounds('objectForKey',$('X')))
      left = left < 0 ? 0 : left
      windowNumber = appWindow('objectForKey',$.kCGWindowNumber)
      break
    }
  }

  if(!processId){
    return
  }

  // get aspect rate
  const screenV = height/width
  const windowV = windowHeight/windowWidth

  const rate = screenV > windowV ? windowWidth/domSize.width : windowHeight/domSize.height
  const radius = event.radius*rate
  const radian = event.radian

  const dx = radius*Math.cos(radian)
  const dy = radius*Math.sin(radian)
  var x = windowWidth/2+dx
  var y = windowHeight/2+dy
  switch(event.type){
    case 'mousedown': case 'mouseup':
    // y += (height-windowHeight+22)
    x += left
    y += bottom
    break
    case 'mousemove':
    x += left
    y += bottom
    break
  }
  if(event.type=='wheel'){
    const deltaX = event.deltaX/10
    const deltaY = event.deltaY/10
    const point = electron.screen.getCursorScreenPoint()
    const mouseMoveEvent1 = $.CGEventCreateMouseEvent(null,$.kCGEventMouseMoved,$.CGPointMake(x,y),null);
    $.CGEventPost($.kCGHIDEventTap,mouseMoveEvent1);
    const cgEventRef = $.CGEventCreateScrollWheelEvent(null, $.kCGScrollEventUnitLine, 5, deltaY, deltaX)
    $.CGEventPost($.kCGHIDEventTap,cgEventRef);
    const mouseMoveEvent = $.CGEventCreateMouseEvent(null,$.kCGEventMouseMoved,$.CGPointMake(point.x,point.y),null);
    $.CGEventPost($.kCGHIDEventTap,mouseMoveEvent);
    return
  }
  const type = NSEventType[event.type]
  const nsEvent = $.NSEvent(
      'mouseEventWithType', type,
      'location', $.NSMakePoint(x,y),
      'modifierFlags', 0,
      'timestamp', $.NSProcessInfo('processInfo')('systemUptime'),
      'windowNumber', $.NSNumber('numberWithInt', windowNumber)('unsignedLongLongValue'),
      'context', $.NSGraphicsContext('currentContext'),
      'eventNumber', 0,
      'clickCount', 1,
      'pressure', 0
    );
  const cgEvent = nsEvent('CGEvent');
  // $.CGEventPostToPid(processId,cgEvent);
  $.CGEventPost($.kCGHIDEventTap,cgEvent);
  // $.CFRelease(cgEvent);
}

function startApplication(){
  if(ready){
    createWindow()
  }else{
    ready = true
  }
}