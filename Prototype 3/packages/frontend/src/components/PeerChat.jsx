import React, { useState, useEffect, useRef } from 'react';

export default function PeerChat({ currentUser, initialActivePeer, onClose }) {
  // Available student peers list
  const studentPeers = ['Kunal', 'Ripunjay', 'Krish', 'Dhruv', 'Abhinav', 'Ashmit', 'Sanya'];
  
  // Sender name determination
  const senderName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Sanya';

  const [activePeer, setActivePeer] = useState(initialActivePeer || 'Kunal');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchChatHistory = async (peerName) => {
    try {
      const res = await fetch(`/api/messages?userA=${encodeURIComponent(senderName)}&userB=${encodeURIComponent(peerName)}`);
      if (!res.ok) throw new Error('Failed to load chat history');
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      // Fail silently for interval updates
    }
  };

  // Fetch initial chat logs on component load and peer change
  useEffect(() => {
    if (!activePeer) return;

    setLoading(true);
    fetchChatHistory(activePeer).then(() => setLoading(false));

    // Poll message logs every 4 seconds to mock socket real-time streams
    const pollingInterval = setInterval(() => {
      fetchChatHistory(activePeer);
    }, 4000);

    return () => clearInterval(pollingInterval);
  }, [activePeer, senderName]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText(''); // Reset input immediately for visual responsiveness

    try {
      // Optimistic local state update to make interface feel instantaneous
      const tempMessage = {
        SenderName: senderName,
        ReceiverName: activePeer,
        Content: messageText,
        Timestamp: new Date(),
        _id: 'temp-' + Date.now(),
      };
      setMessages((prev) => [...prev, tempMessage]);

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SenderName: senderName,
          ReceiverName: activePeer,
          Content: messageText,
        }),
      });

      if (!res.ok) throw new Error('Failed to deliver message');
      
      // Refresh chat from DB to sync correct timestamps and IDs
      fetchChatHistory(activePeer);
    } catch (err) {
      alert(err.message);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="peer-chat-container">
      {/* Sidebar - Available Conversations */}
      <div className="peer-chat-sidebar">
        <div className="sidebar-header">
          <h4>💬 Chat Directory</h4>
        </div>
        <div className="peer-list">
          {studentPeers
            .filter((p) => p !== senderName) // Don't chat with yourself
            .map((peer) => (
              <div
                key={peer}
                className={`peer-list-row ${activePeer === peer ? 'active' : ''}`}
                onClick={() => setActivePeer(peer)}
              >
                <div className="peer-avatar">
                  {peer.charAt(0).toUpperCase()}
                </div>
                <div className="peer-info">
                  <span className="name">{peer}</span>
                  <span className="subtitle font-mono">Active Student</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Main chat log window */}
      <div className="peer-chat-window">
        {/* Chat window top header */}
        <div className="chat-window-header">
          <div className="active-peer-profile">
            <div className="active-avatar">
              {activePeer.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4>{activePeer}</h4>
              <span className="active-status">🟢 Online</span>
            </div>
          </div>
          {onClose && (
            <button className="chat-close-btn" onClick={onClose} title="Close Chat Area">
              ✕
            </button>
          )}
        </div>

        {/* Message bubbles body */}
        <div className="chat-messages-body">
          {loading ? (
            <div className="chat-loading font-mono text-center">
              Syncing messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty text-center">
              <span className="emoji">🤝</span>
              <h4>Start a conversation with {activePeer}!</h4>
              <p>Say hello to begin sharing peer skills on CampOS.</p>
            </div>
          ) : (
            <div className="messages-scroller">
              {messages.map((msg) => {
                const isSentByMe = msg.SenderName === senderName;
                return (
                  <div
                    key={msg._id}
                    className={`message-balloon-row ${isSentByMe ? 'sent-by-me' : 'received-from-peer'}`}
                  >
                    <div className="message-content-balloon">
                      {!isSentByMe && <span className="sender-lbl">{msg.SenderName}</span>}
                      <p className="message-text">{msg.Content}</p>
                      <span className="message-time font-mono">
                        {formatTime(msg.Timestamp || msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message send form */}
        <form onSubmit={handleSendMessage} className="chat-send-form">
          <input
            type="text"
            className="chat-input-field"
            placeholder={`Message ${activePeer}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-accent btn-chat-send">
            Send ⚡
          </button>
        </form>
      </div>
    </div>
  );
}
