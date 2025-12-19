import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { formatDateTime } from '../utils/formatters';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewFiles, setPreviewFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollingInterval = useRef(null);
  const fileInputRef = useRef(null);
  const shouldAutoScrollRef = useRef(false);
  const isAtBottomRef = useRef(true);

  // ---------------- FETCH CONVERSATIONS ----------------
  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/messages/conversations');

      const convs = (response.data.conversations || []).map(conv => {
        const latest = conv.latestMessage;
        const otherUser =
          latest.sender._id === user.id ? latest.recipients[0] : latest.sender;

        return {
          user: otherUser,
          lastMessage: latest,
          unreadCount: conv.unreadCount || 0,
          conversationId: conv.conversationId,
        };
      });

      setConversations(convs);
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  // ---------------- FETCH MESSAGES ----------------
  const fetchMessages = useCallback(
    async (userId, silent = false) => {
      try {
        const convId = [user.id, userId].sort().join('-');
        const response = await api.get(`/messages?conversationId=${convId}&limit=50`);

        const msgs = response.data.messages || [];
        setMessages(msgs);

        // Mark unread messages as read
        const unread = msgs.filter(
          m => m.sender._id !== user.id && !m.isRead.some(r => r.user === user.id)
        );

        for (const msg of unread) {
          await api.put(`/messages/${msg._id}/read`);
        }

        if (!silent) fetchConversations();
      } catch (err) {
        if (!silent) setError('Failed to load messages');
      }
    },
    [user.id, fetchConversations]
  );

  useEffect(() => {
    fetchConversations();
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [fetchConversations]);

  // Poll messages while a user is selected
  useEffect(() => {
    if (selectedUser) {
      // When opening a conversation, jump to bottom once.
      shouldAutoScrollRef.current = true;
      fetchMessages(selectedUser._id);

      pollingInterval.current = setInterval(() => {
        fetchMessages(selectedUser._id, true);
      }, 3000);
    } else {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    }
  }, [selectedUser, fetchMessages]);

  // Track whether the user is near the bottom of the message list.
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      // Consider "at bottom" if within 80px.
      const thresholdPx = 80;
      const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
      isAtBottomRef.current = distanceFromBottom <= thresholdPx;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [selectedUser]);

  // Only auto-scroll when user is already at bottom, or after an intentional action.
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const shouldScroll = shouldAutoScrollRef.current || isAtBottomRef.current;
    if (!shouldScroll) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: shouldAutoScrollRef.current ? 'smooth' : 'auto',
    });

    shouldAutoScrollRef.current = false;
  }, [messages]);

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = async e => {
    e.preventDefault();

    if (!newMessage.trim() && selectedFiles.length === 0) {
      setError('Message cannot be empty');
      return;
    }

    setSending(true);
    try {
      // User intentionally sent a message; scroll to bottom after it appears.
      shouldAutoScrollRef.current = true;
      const formData = new FormData();
      formData.append('recipientIds', JSON.stringify([selectedUser._id]));
      if (newMessage.trim()) formData.append('content', newMessage);

      selectedFiles.forEach(f => formData.append('attachments', f));

      await api.post('/messages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setNewMessage('');
      setSelectedFiles([]);
      setPreviewFiles([]);
      fetchMessages(selectedUser._id);
      fetchConversations();
    } catch (err) {
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // ---------------- FILE PREVIEW ----------------
  const handleFileSelect = e => {
    const files = Array.from(e.target.files);
    setSelectedFiles([...selectedFiles, ...files]);

    const previews = files.map(f => ({
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      name: f.name,
    }));

    setPreviewFiles([...previewFiles, ...previews]);
  };

  const removeFile = index => {
    const newFiles = [...selectedFiles];
    const newPreview = [...previewFiles];

    if (newPreview[index].preview) URL.revokeObjectURL(newPreview[index].preview);

    newFiles.splice(index, 1);
    newPreview.splice(index, 1);

    setSelectedFiles(newFiles);
    setPreviewFiles(newPreview);
  };

  // ---------------- START CONVERSATION ----------------
  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setAvailableUsers(response.data.users.filter(u => u._id !== user.id));
    } catch (err) {
      setError('Failed to load users');
    }
  };

  const startConversation = u => {
    setSelectedUser(u);
    setShowNewMessageModal(false);
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-hidden bg-black text-white flex">
      {/* ---------------- LEFT SIDEBAR ---------------- */}
      <div className="w-80 bg-[#0f0f0f] border-r border-gray-800 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Messages</h2>
          <button
            onClick={() => {
              setShowNewMessageModal(true);
              fetchAvailableUsers();
            }}
            className="px-3 py-1 bg-[#1f1f1f] text-white rounded-lg hover:bg-[#2a2a2a]"
          >
            + New
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scroll">
          {conversations.map(conv => (
            <div
              key={conv.user._id}
              onClick={() => setSelectedUser(conv.user)}
              className={`p-4 border-b border-gray-800 cursor-pointer flex gap-3 hover:bg-[#1a1a1a] transition ${
                selectedUser?._id === conv.user._id ? 'bg-[#1a1a1a]' : ''
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-lg">
                {conv.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="font-semibold truncate">{conv.user.name}</h4>
                <p className="text-sm text-gray-400 truncate">
                  {conv.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- CHAT AREA ---------------- */}
      <div className="flex-1 flex flex-col bg-[#0d0d0d] h-full overflow-hidden">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 flex items-center gap-3 border-b border-gray-800 bg-[#0f0f0f]">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center font-semibold">
                {selectedUser.name[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold">{selectedUser.name}</h3>
                <p className="text-xs text-gray-400 capitalize">{selectedUser.role}</p>
              </div>
            </div>

            {/* Messages List */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4"
            >
              {messages.map(msg => {
                const isOwn = msg.sender._id === user.id;

                return (
                  <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] px-4 py-2 rounded-xl shadow-md ${
                        isOwn ? 'bg-primary-600 text-white' : 'bg-[#1a1a1a] text-gray-200'
                      }`}
                    >
                      {msg.content && <p>{msg.content}</p>}

                      {msg.attachments &&
                        msg.attachments.map((file, i) => (
                          <img
                            key={i}
                            src={file.url}
                            alt=""
                            className="mt-2 rounded-lg max-w-xs cursor-pointer"
                            onClick={() => window.open(file.url)}
                          />
                        ))}

                      <p className="text-xs mt-1 opacity-70">{formatDateTime(msg.createdAt)}</p>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* File Preview */}
            {previewFiles.length > 0 && (
              <div className="px-4 py-2 flex gap-2 overflow-x-auto bg-[#111] border-t border-gray-800">
                {previewFiles.map((file, i) => (
                  <div key={i} className="relative">
                    <img
                      src={file.preview}
                      alt=""
                      className="h-16 w-16 object-cover rounded-lg border border-gray-700"
                    />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute -top-2 -right-2 bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Chat Input */}
            <form
              onSubmit={sendMessage}
              className="p-4 flex items-center gap-3 bg-[#0f0f0f] border-t border-gray-800 shrink-0"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <button type="button" onClick={() => fileInputRef.current.click()} className="text-2xl">
                📎
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-600"
              />

              <button
                type="submit"
                className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="text-7xl mb-4">💬</div>
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* ---------------- NEW MESSAGE MODAL ---------------- */}
      {showNewMessageModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowNewMessageModal(false)}
        >
          <div
            className="bg-[#0f0f0f] w-full max-w-md rounded-xl p-6 border border-gray-800"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-4 text-white">Start New Conversation</h3>

            <input
              className="w-full px-4 py-2 rounded-lg bg-[#1a1a1a] border border-gray-700 text-white"
              placeholder="Search user..."
              onChange={e => setSearchTerm(e.target.value)}
            />

            <div className="mt-4 h-64 overflow-y-auto custom-scroll">
              {availableUsers
                .filter(
                  u =>
                    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(u => (
                  <div
                    key={u._id}
                    onClick={() => startConversation(u)}
                    className="p-3 border-b border-gray-800 flex items-center gap-3 hover:bg-[#1a1a1a] cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{u.name}</p>
                      <p className="text-sm text-gray-400">{u.email}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
