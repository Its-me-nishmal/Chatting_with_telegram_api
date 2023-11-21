const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Keep track of connected users and their identifiers
const connectedUsers = {};

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/user.html');
});

io.on('connection', (socket) => {
  // Generate a unique user identifier
  const userId = socket.id;
  connectedUsers[userId] = true;

  // Broadcast the list of connected users to all clients
  io.emit('connected users', Object.keys(connectedUsers));

  console.log(`User ${userId} connected`);

  socket.on('disconnect', () => {
    delete connectedUsers[userId];
    // Broadcast the updated list of connected users
    io.emit('connected users', Object.keys(connectedUsers));

    console.log(`User ${userId} disconnected`);
  });

  socket.on('chat message', (msg) => {
    console.log(`Message from user ${userId}: ${msg}`);
    io.emit('chat message', { userId, message: msg });
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
