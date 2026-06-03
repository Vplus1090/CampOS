import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, Video, MoreVertical, Smile, Paperclip, 
  Mic, Send, CheckCheck, Search, X 
} from 'lucide-react';
import { API_BASE } from '../config/api';

export default function PeerChat({ currentUser, initialActivePeer, onClose }) {
  // Available student peers list
  const studentPeers = ['Kunal', 'Ripunjay', 'Krish', 'Student', 'Abhinav', 'Ashmit', 'Sanya'];
  
  // Sender name determination
  const senderName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Sanya';

  const [activePeer, setActivePeer] = useState(initialActivePeer || 'Kunal');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Helper to color circles dynamically
  const getAvatarBg = (name) => {
    const letter = name.charAt(0).toUpperCase();
    if (letter === 'V' || letter === 'S') return 'bg-white/30';
    if (letter === 'K' || letter === 'R') return 'bg-white/25';
    if (letter === 'D' || letter === 'A') return 'bg-white/20';
    return 'bg-white/15';
  };

  const fetchChatHistory = async (peerName) => {
    try {
      const res = await fetch(`${API_BASE}/api/messages?userA=${encodeURIComponent(senderName)}&userB=${encodeURIComponent(peerName)}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load chat history');
      const data = await res.json();
      setMessages(data);
    } catch (e) {
      // Fail silently for interval updates
    }
  };

  const [peerGigId, setPeerGigId] = useState(null);

  const fetchPeerGig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/skillgigs`, { credentials: 'include' });
      if (res.ok) {
        const gigs = await res.json();
        // Find the active peer's active listing
        const peerGig = gigs.find(g => g.StudentName.toLowerCase() === activePeer.toLowerCase() && g.Status === 'Active');
        if (peerGig) {
          setPeerGigId(peerGig.id || peerGig._id);
        } else {
          setPeerGigId(null);
        }
      }
    } catch (e) {
      // Fail silently
    }
  };

  useEffect(() => {
    if (activePeer) {
      fetchPeerGig();
    }
  }, [activePeer]);

  const handleRemoveListing = async () => {
    if (!peerGigId) return;
    if (!window.confirm(`Are you sure you want to remove ${activePeer}'s skill swap listing for everyone else? This will mark it as matched and take it offline.`)) return;

    try {
      const res = await fetch(`${API_BASE}/api/skillgigs/${peerGigId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to remove listing');
      }

      alert('Listing successfully removed for everyone else!');
      setPeerGigId(null);
      if (onClose) onClose();
    } catch (err) {
      alert(err.message);
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
    if (e) e.preventDefault();
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

      const res = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SenderName: senderName,
          ReceiverName: activePeer,
          Content: messageText,
        }),
        credentials: 'include',
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
    <div className="flex flex-col gap-4 text-white font-sans h-full w-full select-none pb-24 relative min-h-screen">
      {/* ─── Compact Dividerless Unified Page Header ─── */}
      <header className="flex items-center w-full mt-6 pb-2 shrink-0 justify-between select-none">
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="w-11 h-11 bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white rounded-full transition-all duration-300 active:scale-95 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] backdrop-blur-md cursor-pointer shrink-0"
            type="button"
          >
            <span className="text-xl font-bold">&larr;</span>
          </button>
          <h2 className="flex items-center pl-3.5 text-left translate-y-[2.5px] text-[22px] italic font-bold text-white leading-none tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Peer Chat
          </h2>
        </div>
      </header>

      {/* ─── Frosted Glassmorphic WhatsApp Web Panel ─── */}
      <div 
        className="peer-chat-container flex flex-col h-[460px] w-full text-white font-sans overflow-hidden select-none bg-white/[0.02] border border-white/10 rounded-[32px] p-0 relative z-[999] shadow-2xl backdrop-blur-md"
      >
        {/* Main chat log window */}
        <div className="peer-chat-window flex-1 bg-transparent flex flex-col justify-between overflow-hidden relative h-full min-h-0 p-0">
          {/* Chat window top header */}
          <div className="chat-window-header flex justify-between items-center w-full border-b border-white/10 py-3 px-4 shrink-0 bg-white/[0.04] backdrop-blur-md">
            <div className="active-peer-profile flex items-center gap-3">
              <div className={`active-avatar w-9 h-9 rounded-full text-white font-extrabold text-xs flex items-center justify-center shadow-inner shrink-0 ${getAvatarBg(activePeer)}`}>
                {activePeer.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold text-[#e9edef] font-sans leading-none">{activePeer}</h4>
                <span className="text-[10px] text-slate-400 font-normal mt-1 block">online</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-slate-300">
              {peerGigId && (
                <>
                  <button
                    onClick={handleRemoveListing}
                    className="bg-red-500/10 border border-red-500/35 hover:bg-red-500/20 active:scale-95 text-red-400 hover:text-red-300 font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-sm shrink-0"
                  >
                    Remove Listing ✕
                  </button>
                  <div className="w-[1px] h-4 bg-white/10 mx-0.5"></div>
                </>
              )}
              <button type="button" className="hover:text-white transition-colors p-1 cursor-pointer">
                <Video size={16} />
              </button>
              <button type="button" className="hover:text-white transition-colors p-1 cursor-pointer">
                <Phone size={15} />
              </button>
              <div className="w-[1px] h-4 bg-white/10 mx-0.5"></div>
              <button type="button" className="hover:text-white transition-colors p-1 cursor-pointer">
                <Search size={15} />
              </button>
              <button type="button" className="hover:text-white transition-colors p-1 cursor-pointer">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Message bubbles body */}
          <div 
            className="chat-messages-body flex-1 overflow-y-auto scrollbar-none p-4 min-h-0 bg-transparent"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          >
            {loading ? (
              <div className="chat-loading font-mono text-xs text-slate-400 mt-4 text-center">
                Syncing messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-empty flex flex-col items-center justify-center gap-2 h-full select-none opacity-80 py-8 text-center">
                <span className="text-4xl filter drop-shadow-md">🤝</span>
                <h4 className="text-sm font-extrabold text-[#e9edef] font-sans mt-2">Start a conversation with {activePeer}!</h4>
                <p className="text-[11px] font-semibold text-slate-400 font-sans max-w-xs px-4">Say hello to begin sharing peer skills on CampOS.</p>
              </div>
            ) : (
              <div className="messages-scroller flex flex-col gap-1.5">
                <div className="flex justify-center my-2.5">
                  <span className="bg-white/[0.05] border border-white/10 text-slate-300 text-[10px] px-3 py-1 rounded-lg uppercase tracking-wide font-sans shadow-sm select-none">
                    TODAY
                  </span>
                </div>
                
                {messages.map((msg) => {
                  const isSentByMe = msg.SenderName === senderName;
                  return (
                    <div
                      key={msg._id}
                      className={`flex w-full ${isSentByMe ? 'justify-end' : 'justify-start'} my-0.5`}
                    >
                      {isSentByMe ? (
                        <div className="max-w-[75%] bg-white/10 border border-white/20 text-[#e9edef] rounded-2xl rounded-tr-none px-3.5 py-2 text-left flex flex-col shadow-md backdrop-blur-md relative font-sans">
                          <p className="text-xs leading-relaxed break-words font-sans font-normal pr-12">{msg.Content}</p>
                          <div className="flex items-center justify-end gap-1 text-[9px] text-[#e9edef]/60 select-none self-end absolute bottom-1 right-2">
                            <span>{formatTime(msg.Timestamp || msg.createdAt)}</span>
                            <CheckCheck size={13} className="text-white/60" />
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-[75%] bg-white/[0.04] border border-white/10 text-[#e9edef] rounded-2xl rounded-tl-none px-3.5 py-2 text-left flex flex-col shadow-md backdrop-blur-md relative font-sans">
                          <p className="text-xs leading-relaxed break-words font-sans font-normal pr-8">{msg.Content}</p>
                          <span className="text-[9px] text-slate-400 font-sans text-right select-none self-end absolute bottom-1 right-2">
                            {formatTime(msg.Timestamp || msg.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Message send form */}
          <form onSubmit={handleSendMessage} className="chat-send-form flex items-center gap-2.5 py-3 px-4 shrink-0 bg-white/[0.03] border-t border-white/10">
            <button type="button" className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer shrink-0">
              <Smile size={20} />
            </button>
            <button type="button" className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer shrink-0">
              <Paperclip size={18} />
            </button>
            
            <input
              type="text"
              className="flex-1 bg-white/[0.04] border border-white/10 text-white placeholder-slate-500 focus:ring-1 focus:ring-white/20 focus:border-white/30 focus:outline-none rounded-xl px-4 py-2 text-xs font-normal transition-all shadow-inner"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              required
            />
            
            <button 
              type="submit" 
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0"
            >
              {inputText.trim() ? (
                <Send size={16} className="translate-x-[1px] text-white" />
              ) : (
                <Mic size={16} className="text-white" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

