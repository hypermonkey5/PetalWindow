// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

//express applications

var fs = require('fs');
const path = require('path')
const url = require('url')
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
  // startApplication()
}

var windowRooms = new Map()

io.on('connection',(socket)=>{
  console.log("socket connected")
  socket.on("requestPeer",(message)=>{
    socket.broadcast.emit("requestPeer",{socketId:socket.id})
  })
  socket.on("responsePeer",(message)=>{
    socket.to(message.socketId).emit("responsePeer",message)
  })
  socket.on("addWindowRoom",(message)=>{
    windowRooms.set(socket.id,{thumbnailImageURL: message.imageURL})
  })
  socket.on("requestWindowRooms",(message)=>{
    socket.emit("responseWindowRooms",{windowRooms:JSON.stringify(Array.from(windowRooms))})
  })
})