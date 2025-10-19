const io = require('socket.io-client');

if (process.argv.length < 3) {
  console.error('Usage: node agent_simulator.js <suspectId>');
  process.exit(1);
}

const suspectId = process.argv[2];
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Agent connected, registering for', suspectId);
  socket.emit('registerAgent', { suspectId });
});

socket.on('participantMessage', (data) => {
  // data: { participantId, suspectId, message }
  console.log('Received participantMessage:', data);
  const reply = `Simulated ${suspectId} reply to: ${data.message}`;
  // simulate processing delay
  setTimeout(() => {
    socket.emit('agentReply', { suspectId: data.suspectId, participantId: data.participantId, message: reply });
    console.log('Sent agentReply:', reply);
  }, 1000);
});

socket.on('disconnect', () => {
  console.log('Agent disconnected');
});
