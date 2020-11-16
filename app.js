var app = require('express')()
var http = require('http').createServer(app)
var io = require('socket.io')(http)
const util = require('util')

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

io.on('connection', function (socket) {
  console.log('a user connected ')
  io.emit('rooms', getRooms('connected'))
  socket.on('disconnect', function () {
    console.log('user disconnected')
  })
  socket.on('new room', function (room) {
    console.log(`A new room is created ${room}`)
    socket.room = room
    socket.join(room)
    io.emit('rooms', getRooms('new room'))
  })
  socket.on('join room', function (room) {
    console.log(`A new user joined room ${room}`)
    socket.room = room
    socket.join(room)
    io.emit('rooms', getRooms('joined room'))
  })
  socket.on('chat message', function (data) {
    io.in(data.room).emit('chat message', `${data.name}: ${data.msg}`)
  })
  socket.on('set username', function (name) {
    console.log(`username set to ${name}(${socket.id})`)
    socket.username = name
  })
})

http.listen(3000, () => {
  console.log('listening on *:3000')
})

function getRooms(msg) {
  const nsp = io.of('/')
  const rooms = nsp.adapter.rooms

  const list = {}

  for (let roomId in rooms) {
    const room = rooms[roomId]
    if (room === undefined) continue
    const sockets = []
    let roomName = ''
    //console.log('getRooms room>>' + util.inspect(room));
    for (let socketId in room.sockets) {
      const socket = nsp.connected[socketId]
      if (
        socket === undefined ||
        socket.username === undefined ||
        socket.room === undefined
      )
        continue
      //console.log(`getRooms socket(${socketId})>>${socket.username}:${socket.room}`);
      sockets.push(socket.username)
      if (roomName == '') roomName = socket.room
    }
    if (roomName != '') list[roomName] = sockets
  }

  console.log(`getRooms: ${msg} >>` + util.inspect(list))

  return list
}
