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
  const [showReactions, setShowReactions] = useState(null);
  const [previewFiles, setPreviewFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const pollingInterval = useRef(null);
  const fileInputRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get('/messages/conversations');
      
      // Transform conversations to include user info
      const convs = (response.data.conversations || []).map(conv => {
        const latestMsg = conv.latestMessage;
        // Get the other user in the conversation
        const otherUser = latestMsg.sender._id === user.id 
          ? latestMsg.recipients[0] 
          : latestMsg.sender;
        
        return {
          user: otherUser,
          lastMessage: latestMsg,
          unreadCount: conv.unreadCount || 0,
          conversationId: conv.conversationId
        };
      });
      
      setConversations(convs);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const fetchMessages = useCallback(async (userId, silent = false) => {
    try {
      // Generate conversation ID from user IDs
      const userIds = [user.id, userId].sort();
      const conversationId = userIds.join('-');
      
      const response = await api.get(`/messages?conversationId=${conversationId}&limit=50`);
      const msgs = response.data.messages || [];
      
      setMessages(msgs);
      
      // Mark messages as read
      const unreadMessages = msgs.filter(
        m => m.sender._id !== user.id && !m.isRead.some(read => read.user === user.id)
      );
      
      for (const msg of unreadMessages) {
        await api.put(`/messages/${msg._id}/read`);
      }
      
      if (!silent) {
        fetchConversations();
      }
    } catch (error) {
      if (!silent) {
        console.error('Error fetching messages:', error);
        setError('Failed to load messages');
      }
    }
  }, [user.id, fetchConversations]);

  useEffect(() => {
    fetchConversations();
    
    // Cleanup polling on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);
      
      // Start polling for new messages every 3 seconds
      pollingInterval.current = setInterval(() => {
        fetchMessages(selectedUser._id, true);
      }, 3000);
    } else {
      // Stop polling when no conversation selected
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    }
    
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [selectedUser, fetchMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!selectedUser) {
      setError('Please select a user to send a message');
      return;
    }
    
    if (!newMessage.trim() && selectedFiles.length === 0) {
      setError('Please enter a message or attach a file');
      return;
    }

    setSending(true);
    setError(''); // Clear previous errors
    
    try {
      const formData = new FormData();
      formData.append('recipientIds', JSON.stringify([selectedUser._id]));
      if (newMessage.trim()) {
        formData.append('content', newMessage);
      }
      
      // Add files
      selectedFiles.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await api.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setNewMessage('');
        setSelectedFiles([]);
        setPreviewFiles([]);
        fetchMessages(selectedUser._id);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = error.response?.data?.message || 'Failed to send message. Please try again.';
      setError(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 3) {
      setError('Maximum 3 files allowed');
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);
    
    // Create preview URLs
    const newPreviews = files.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    
    setPreviewFiles([...previewFiles, ...newPreviews]);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previewFiles];
    
    // Revoke preview URL if it exists
    if (newPreviews[index].preview) {
      URL.revokeObjectURL(newPreviews[index].preview);
    }
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setSelectedFiles(newFiles);
    setPreviewFiles(newPreviews);
  };

  const addReaction = async (messageId, emoji) => {
    try {
      await api.post(`/messages/${messageId}/reaction`, { emoji });
      fetchMessages(selectedUser._id, true);
      setShowReactions(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
      setError('Failed to add reaction');
    }
  };

  const getReadStatus = (message) => {
    if (message.sender._id !== user.id) return null;
    
    const isRead = message.isRead.some(read => 
      read.user === selectedUser._id || read.user._id === selectedUser._id
    );
    
    return isRead ? 'read' : 'sent';
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      // Filter out current user
      const users = (response.data.users || []).filter(u => u._id !== user.id);
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    }
  };

  const handleNewMessageClick = () => {
    setShowNewMessageModal(true);
    fetchAvailableUsers();
  };

  const handleStartConversation = (selectedUser) => {
    setSelectedUser(selectedUser);
    setShowNewMessageModal(false);
    setSearchTerm('');
  };

  const filteredUsers = availableUsers.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader fullScreen />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-screen flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
            <button
              className="px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              onClick={handleNewMessageClick}
            >
              + New
            </button>
          </div>
          
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}
          
          {conversations.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="text-5xl mb-3">💬</div>
              <p className="text-gray-600 font-medium">No conversations yet</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <div
                  key={conv.user._id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 ${
                    selectedUser?._id === conv.user._id ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => setSelectedUser(conv.user)}
                >
                  <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                    {conv.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">{conv.user.name}</h4>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {selectedUser ? (
            <>
              <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{selectedUser.role}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const readStatus = getReadStatus(message);
                    const isOwn = message.sender._id === user.id;
                    return (
                      <div
                        key={message._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwn ? 'bg-primary-600 text-white' : 'bg-white text-gray-900'} rounded-xl px-4 py-2 shadow-sm relative group`}>
                          {message.sender._id !== user.id && (
                            <span className="text-xs font-medium text-gray-700 mb-1 block">
                              {message.sender.name}
                            </span>
                          )}
                          
                          {/* Message Text */}
                          {message.content && <p className="break-words">{message.content}</p>}
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((file, idx) => (
                                <div key={idx}>
                                  {file.mimeType?.startsWith('image/') ? (
                                    <img 
                                      src={file.url} 
                                      alt={file.filename}
                                      className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(file.url, '_blank')}
                                    />
                                  ) : (
                                    <a 
                                      href={file.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg p-2 hover:bg-opacity-20 transition-colors"
                                    >
                                      <span className="text-xl">📄</span>
                                      <span className="text-sm truncate max-w-[150px]">{file.filename}</span>
                                      <span className="text-xs opacity-75">
                                        {(file.size / 1024).toFixed(1)} KB
                                      </span>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Reactions */}
                          {message.reactions && message.reactions.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {message.reactions.map((reaction, idx) => (
                                <span key={idx} className="text-sm bg-white bg-opacity-20 px-2 py-0.5 rounded-full">
                                  {reaction.emoji}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className={`flex items-center gap-2 mt-1 text-xs ${isOwn ? 'text-white text-opacity-75' : 'text-gray-500'}`}>
                            <span>
                              {formatDateTime(message.createdAt)}
                            </span>
                            
                            {/* Read receipts for sent messages */}
                            {readStatus && (
                              <span className="ml-1">
                                {readStatus === 'read' ? (
                                  <span className="font-bold">✓✓</span>
                                ) : (
                                  <span>✓</span>
                                )}
                              </span>
                            )}
                          </div>
                          
                          {/* Reaction button */}
                          <button
                            className="absolute -bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1 shadow-md hover:scale-110 transform"
                            onClick={() => setShowReactions(showReactions === message._id ? null : message._id)}
                          >
                            😊
                          </button>
                          
                          {/* Reaction picker */}
                          {showReactions === message._id && (
                            <div className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-lg p-2 flex gap-1 z-10">
                              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => addReaction(message._id, emoji)}
                                  className="text-xl hover:scale-125 transform transition-transform p-1"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* File Preview */}
              {previewFiles.length > 0 && (
                <div className="px-4 py-2 bg-white border-t border-gray-200 flex gap-2 overflow-x-auto">
                  {previewFiles.map((file, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      {file.preview ? (
                        <img src={file.preview} alt={file.name} className="h-16 w-16 object-cover rounded-lg border-2 border-gray-200" />
                      ) : (
                        <div className="h-16 w-16 bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-gray-200">
                          <span className="text-2xl">📄</span>
                          <span className="text-xs text-gray-600 truncate max-w-full px-1">{file.name}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-sm font-bold hover:bg-red-600"
                        onClick={() => removeFile(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="text-2xl hover:scale-110 transform transition-transform disabled:opacity-50"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  📎
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
                />
                <button 
                  type="submit" 
                  disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
                  className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="text-7xl mb-4">💬</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowNewMessageModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">New Message</h3>
              <button 
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                onClick={() => setShowNewMessageModal(false)}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-4">
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No users found</p>
                ) : (
                  filteredUsers.map((u) => (
                    <div
                      key={u._id}
                      className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3"
                      onClick={() => handleStartConversation(u)}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900">{u.name}</h4>
                        <p className="text-sm text-gray-600 truncate">{u.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">{u.role}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
