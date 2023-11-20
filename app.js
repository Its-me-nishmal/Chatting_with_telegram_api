const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;
const TELEGRAM_BOT_TOKEN = '1946326672:AAEwXYJ0QjXFKcpKMmlYD0V7-3TcFs_tcSA'; // Replace with your Telegram bot token
const TELEGRAM_CHAT_ID = '@chatting_by_nextronize'; // Replace with your Telegram chat ID (group or channel)

let users = [];
let messages = [];

app.use(bodyParser.json());

app.post('/users', (req, res) => {
  const { name } = req.body;
  const userId = uuidv4();
  const username = `${name}-${userId.substring(0, 4)}`;
  const newUser = { userId, name, username };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.get('/users', (req, res) => {
  res.json(users);
});

app.post('/messages', async (req, res) => {
  const { userId, text } = req.body;
  const timestamp = new Date().toISOString();
  const newMessage = { userId, text, timestamp };
  messages.push(newMessage);

  // Send the message to Telegram
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: `${newMessage.text} - from ${newMessage.userId}`,
      }),
    });

    const telegramResponse = await response.json();
    console.log('Telegram API response:', telegramResponse);
  } catch (error) {
    console.error('Error sending message to Telegram:', error.message);
  }

  res.status(201).json(newMessage);
});

app.get('/all-messages', async (req, res) => {
    try {
      // Fetch all updates from Telegram
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
      const telegramUpdates = await response.json();
  
      // Log the updates for debugging
      console.log('Telegram Updates:', telegramUpdates);
  
      // Extract text messages from updates
      const allMessages = telegramUpdates.result
        .filter(update => update.message && update.message.text)
        .map(update => ({
          text: update.message.text,
          userId: update.message.from.id.toString(),
        }));
  
      res.json(allMessages);
    } catch (error) {
      console.error('Error fetching all messages from Telegram:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

app.get('/messages/:userId', async (req, res) => {
  const { userId } = req.params;
  const user = users.find((u) => u.userId === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Fetch messages from Telegram using the getUpdates method
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
    const telegramUpdates = await response.json();

    // Filter updates for messages from the specific user
    const userMessages = telegramUpdates.result.filter((update) => {
      return update.message && update.message.from.id.toString() === userId;
    }).map((update) => update.message.text);

    res.json(userMessages);
  } catch (error) {
    console.error('Error fetching messages from Telegram:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Chat App API listening at http://localhost:${port}`);
});
