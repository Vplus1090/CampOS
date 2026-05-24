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
    <div className="peer-chat-container flex flex-col md:flex-row gap-4 h-full w-full text-white font-sans overflow-hidden select-none bg-[#141a27]/95 backdrop-blur-3xl border border-white/10 rounded-[32px] p-4 relative z-[99999]">
      {/* Sidebar - Available Conversations */}
      <div className="peer-chat-sidebar w-full md:w-1/3 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-4 flex flex-col gap-4 overflow-y-auto max-h-[180px] md:max-h-none">
        <div className="sidebar-header border-b border-white/5 pb-2.5 flex items-center justify-between text-left shrink-0">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">💬 Chat Directory</h4>
        </div>
        <div className="peer-list flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible shrink-0 pb-1.5 md:pb-0">
          {studentPeers
            .filter((p) => p !== senderName) // Don't chat with yourself
            .map((peer) => (
              <div
                key={peer}
                className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all duration-300 border-2 select-none min-w-[130px] md:min-w-0 ${activePeer === peer ? 'bg-purple-500/10 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.06)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'}`}
                onClick={() => setActivePeer(peer)}
              >
                <div className="peer-avatar w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-black text-xs flex items-center justify-center shadow-inner">
                  {peer.charAt(0).toUpperCase()}
                </div>
                <div className="peer-info flex flex-col text-left justify-center">
                  <span className="text-xs font-extrabold text-white leading-tight font-sans">{peer}</span>
                  <span className="text-[8px] font-bold text-slate-500 font-mono tracking-wide uppercase mt-0.5">Active Student</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Main chat log window */}
      <div className="peer-chat-window flex-1 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-4 flex flex-col justify-between overflow-hidden relative shadow-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] h-full min-h-0">
        {/* Chat window top header */}
        <div className="chat-window-header flex justify-between items-center w-full border-b border-white/5 pb-3.5 shrink-0">
          <div className="active-peer-profile flex items-center gap-3">
            <div className="active-avatar w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-black text-sm flex items-center justify-center shadow-inner">
              {activePeer.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <h4 className="text-sm font-extrabold text-white font-sans leading-none">{activePeer}</h4>
              <span className="text-[9px] font-black text-emerald-400 font-mono tracking-widest uppercase block mt-1">🟢 Online</span>
            </div>
          </div>
          {onClose && (
            <button 
              className="w-9 h-9 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center backdrop-blur-md cursor-pointer shrink-0" 
              onClick={onClose} 
              title="Close Chat Area"
            >
              ✕
            </button>
          )}
        </div>

        {/* Message bubbles body */}
        <div className="chat-messages-body flex-1 overflow-y-auto scrollbar-none py-4 min-h-0">
          {loading ? (
            <div className="chat-loading font-mono text-xs text-slate-400 mt-4 text-center">
              Syncing messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty flex flex-col items-center justify-center gap-2 h-full select-none opacity-80 py-8 text-center">
              <span className="text-4xl filter drop-shadow-md animate-bounce">🤝</span>
              <h4 className="text-sm font-extrabold text-white font-sans mt-2">Start a conversation with {activePeer}!</h4>
              <p className="text-[11px] font-semibold text-slate-400 font-sans max-w-xs px-4">Say hello to begin sharing peer skills on CampOS.</p>
            </div>
          ) : (
            <div className="messages-scroller flex flex-col gap-3">
              {messages.map((msg) => {
                const isSentByMe = msg.SenderName === senderName;
                return (
                  <div
                    key={msg._id}
                    className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-3.5 text-left flex flex-col gap-1 shadow-md relative ${isSentByMe ? 'bg-purple-600 text-white rounded-tr-none border border-purple-500/35' : 'bg-white/[0.05] text-slate-100 rounded-tl-none border border-white/10'}`}>
                      {!isSentByMe && <span className="text-[8px] font-black text-purple-300 font-mono tracking-wider uppercase block">{msg.SenderName}</span>}
                      <p className="text-xs font-semibold leading-relaxed break-words font-sans">{msg.Content}</p>
                      <span className="text-[8px] font-bold text-slate-400/80 font-mono text-right mt-1 select-none">
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
        <form onSubmit={handleSendMessage} className="chat-send-form flex items-center gap-2 mt-2 shrink-0 border-t border-white/5 pt-3.5">
          <input
            type="text"
            className="flex-1 bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 rounded-2xl px-4 py-3 text-xs font-semibold transition-all"
            placeholder={`Message ${activePeer}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            required
          />
          <button 
            type="submit" 
            className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-2xl px-5 py-3 text-xs uppercase tracking-wider shadow-lg shadow-purple-500/10 cursor-pointer shrink-0 transition-all duration-300"
          >
            Send ⚡
          </button>
        </form>
      </div>
    </div>
  );
}

