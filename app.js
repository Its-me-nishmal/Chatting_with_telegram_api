const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Keep track of connected users and their identifiers
const connectedUsers = {};

// Keep track of ongoing conversations
const ongoingConversations = {};

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

    // Remove the user from ongoing conversations
    if (ongoingConversations[userId]) {
      const otherUserId = ongoingConversations[userId];
      delete ongoingConversations[userId];
      if (connectedUsers[otherUserId]) {
        // Notify the other user that the conversation has ended
        io.to(otherUserId).emit('chat message', { from: 'System', message: 'The conversation has ended.' });
        
        // Pair the users randomly again
        const newRandomUserId = getRandomUserId(otherUserId);
        if (newRandomUserId) {
          ongoingConversations[userId] = newRandomUserId;
          ongoingConversations[newRandomUserId] = userId;
        }
      }
    }

    console.log(`User ${userId} disconnected`);
  });

  socket.on('chat message', (data) => {
    const { message } = data;
    const from = userId;

    // Check if the user is already in a conversation
    if (ongoingConversations[userId]) {
      const otherUserId = ongoingConversations[userId];
      io.to(otherUserId).emit('chat message', { from, message });
    } else {
      // Get a random user ID from the connected users (excluding the sender and those in ongoing conversations)
      const randomUserId = getRandomUserId(userId);

      if (randomUserId) {
        // Start a new conversation
        ongoingConversations[userId] = randomUserId;
        ongoingConversations[randomUserId] = userId;

        // Send the message to the randomly selected user
        io.to(randomUserId).emit('chat message', { from, message });
      } else {
        // If there are no other connected users, notify the sender
        io.to(userId).emit('chat message', { from: 'System', message: 'No other users available for chat.' });
      }
    }
  });
});

function getRandomUserId(excludeUserId) {
  // Get an array of user IDs excluding the specified user and those in ongoing conversations
  const availableUsers = Object.keys(connectedUsers).filter(id => id !== excludeUserId && !ongoingConversations[id]);

  if (availableUsers.length > 0) {
    // Select a random user ID from the available users
    const randomIndex = Math.floor(Math.random() * availableUsers.length);
    return availableUsers[randomIndex];
  } else {
    // If there are no other connected users, return null or handle accordingly
    return null;
  }
}

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});
