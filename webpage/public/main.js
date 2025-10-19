(function(){
  const socket = io();

  const participantInput = document.getElementById('participantId');
  const suspectInput = document.getElementById('suspectId');
  const historyEl = document.getElementById('history');
  const messageInput = document.getElementById('message');
  const sendBtn = document.getElementById('send');
  const loadBtn = document.getElementById('load');

  function appendMessage(sender, text, ts) {
    const d = ts ? new Date(ts) : new Date();
    const el = document.createElement('div');
    el.className = 'msg';
    el.innerHTML = `<span class="sender">${sender}:</span> ${text} <small>(${d.toLocaleTimeString()})</small>`;
    historyEl.appendChild(el);
    historyEl.scrollTop = historyEl.scrollHeight;
  }

  async function loadSuspects(){
    const res = await fetch('/suspects');
    const list = await res.json();
    suspectInput.innerHTML = '';
    list.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      suspectInput.appendChild(opt);
    });
  }

  async function loadHistory() {
    historyEl.innerHTML = '';
    const participantId = participantInput.value.trim();
    const suspectId = suspectInput.value.trim();
    if (!participantId || !suspectId) return; // silent

    const res = await fetch(`/history?participantId=${encodeURIComponent(participantId)}&suspectId=${encodeURIComponent(suspectId)}`);
    const data = await res.json();
    const msgs = data.messages || [];
    msgs.forEach(m => appendMessage(m.sender, m.message, m.timestamp));
  }

  const errorEl = document.getElementById('error');
  function showError(text){
    errorEl.textContent = text;
    setTimeout(()=>{ if (errorEl.textContent === text) errorEl.textContent = '' }, 4000);
  }

  sendBtn.addEventListener('click', () => {
    const participantId = participantInput.value.trim();
    const suspectId = suspectInput.value.trim();
    const message = messageInput.value.trim();
    if (!participantId) return showError('Missing participantId');
    if (!suspectId) return showError('Select a suspect');
    if (!message) return showError('Type a message');

    appendMessage(participantId, message);

    socket.emit('chatMessage', { participantId, suspectId, message });
    messageInput.value = '';
  });

  socket.on('connect', async () => {
    appendMessage('system', 'Connected to server');
    await loadSuspects();
    // enable send now that suspects are loaded
    sendBtn.disabled = false;
  });

  socket.on('chatResponse', (data) => {
    // agentReply or fallback messages may include participantId; display suspect message
    const sender = data.suspectId || 'suspect';
    appendMessage(sender, data.message);
  });

  loadBtn.addEventListener('click', loadHistory);
  window.addEventListener('load', () => { loadSuspects(); loadHistory(); });
})();