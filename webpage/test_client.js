const io = require('socket.io-client');

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected to server (test client)');

  // Send a sample chatMessage
  socket.emit('chatMessage', {
    participantId: 'participant1',
    suspectId: 'suspectA',
    message: 'Hello suspect, where were you last night?'
  });
});

socket.on('chatResponse', (data) => {
  console.log('chatResponse received:', data);
  socket.disconnect();
});

socket.on('disconnect', () => {
  console.log('Test client disconnected');
});
