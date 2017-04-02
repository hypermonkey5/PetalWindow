const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')

var ready = false
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600})

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
    protocol:"http:",
    slashes: true
  }))

  // Open the DevTools.
  win.webContents.openDevTools()

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

function startApplication(){
  if(ready){
    createWindow()
  }else{
    ready = true
  }
}

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

//express applications

var fs = require('fs');
var express = require('express')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var debug = require('debug')('winrd:server')
var http = require('http')
// var https = require('https')
// var key = './client/host/pem/server_key.pem'
// var cert = './client/host/pem/server_crt.pem'
var port = 53000;

var exapp = express()
var router = express.Router()

exapp.use(express.static(path.join(__dirname, 'client')))
exapp.use(logger('dev'))
exapp.use(bodyParser.json())
exapp.use(bodyParser.urlencoded({extended:false}))
exapp.use(cookieParser())

router.get('/host/index', (req, res, next)=>{
  //res.render('index', { title: 'Express' });
  res.sendfile("./client/host/html/host_index.html")
})

router.get('/remote/index', (req,res,next)=>{
  res.sendfile("./client/remote/html/remote_index.html")
})

exapp.use('/', router)
exapp.set('port',port)

// var options = {
//   key: fs.readFileSync(key),
//   cert: fs.readFileSync(cert)
// }

var server = http.createServer(exapp)
// var server = https.createServer(options,exapp)
var io = require('socket.io')(server)

server.listen(port)
server.on('listening',onListening)

function onListening(){
  const addr = server.address()
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
  debug('Listening on ' + bind)
  startApplication()
}

io.on('connection',(socket)=>{
  console.log("socket connected")
  socket.on("requestPeer",(message)=>{
    socket.broadcast.emit("requestPeer",{socketId:socket.id})
  })
  socket.on("responsePeer",(message)=>{
    socket.to(message.socketId).emit("responsePeer",message)
  })
})