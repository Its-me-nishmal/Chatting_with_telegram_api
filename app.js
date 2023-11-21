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
  const userId = socket.id;
  connectedUsers[userId] = true;

  io.emit('connected users', Object.keys(connectedUsers));

  console.log(`User ${userId} connected`);

  socket.on('disconnect', () => {
    delete connectedUsers[userId];
    io.emit('connected users', Object.keys(connectedUsers));
    console.log(`User ${userId} disconnected`);
  });

  socket.on('chat message', (data) => {
    const { to, message } = data;
    const from = userId;

    if (to && connectedUsers[to]) {
      // Send the private message to the selected user
      io.to(to).emit('chat message', { from, message });
    } else {
      // Broadcast the message to all users if no specific user is selected
      io.emit('chat message', { from, message });
    }
  });
});


server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
