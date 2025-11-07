import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import { formatDateTime } from '../utils/formatters';
import styles from './Messages.module.css';

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
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedUser) return;

    setSending(true);
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

      await api.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setNewMessage('');
      setSelectedFiles([]);
      setPreviewFiles([]);
      fetchMessages(selectedUser._id);
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
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
    <div className={styles.messages}>
      <div className={styles.container}>
        {/* Conversations List */}
        <div className={styles.conversationsList}>
          <div className={styles.conversationsHeader}>
            <h2>Messages</h2>
            <Button
              variant="primary"
              size="small"
              onClick={handleNewMessageClick}
            >
              + New
            </Button>
          </div>
          
          {error && <Alert type="error" message={error} onClose={() => setError('')} />}
          
          {conversations.length === 0 ? (
            <div className={styles.emptyConversations}>
              <p>No conversations yet</p>
            </div>
          ) : (
            <div className={styles.conversations}>
              {conversations.map((conv) => (
                <div
                  key={conv.user._id}
                  className={`${styles.conversationItem} ${selectedUser?._id === conv.user._id ? styles.active : ''}`}
                  onClick={() => setSelectedUser(conv.user)}
                >
                  <div className={styles.avatar}>
                    {conv.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.conversationInfo}>
                    <div className={styles.conversationTop}>
                      <h4>{conv.user.name}</h4>
                      {conv.unreadCount > 0 && (
                        <span className={styles.unreadBadge}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className={styles.lastMessage}>
                      {conv.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className={styles.chatArea}>
          {selectedUser ? (
            <>
              <div className={styles.chatHeader}>
                <div className={styles.avatar}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedUser.name}</h3>
                  <p className={styles.userRole}>{selectedUser.role}</p>
                </div>
              </div>

              <div className={styles.chatMessages}>
                {messages.length === 0 ? (
                  <div className={styles.emptyChat}>
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const readStatus = getReadStatus(message);
                    return (
                      <div
                        key={message._id}
                        className={`${styles.message} ${message.sender._id === user.id ? styles.sent : styles.received}`}
                      >
                        <div className={styles.messageContent}>
                          {message.sender._id !== user.id && (
                            <span className={styles.senderName}>
                              {message.sender.name}
                            </span>
                          )}
                          
                          {/* Message Text */}
                          {message.content && <p>{message.content}</p>}
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className={styles.attachments}>
                              {message.attachments.map((file, idx) => (
                                <div key={idx} className={styles.attachment}>
                                  {file.mimeType?.startsWith('image/') ? (
                                    <img 
                                      src={file.url} 
                                      alt={file.filename}
                                      className={styles.attachmentImage}
                                      onClick={() => window.open(file.url, '_blank')}
                                    />
                                  ) : (
                                    <a 
                                      href={file.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className={styles.attachmentFile}
                                    >
                                      <span className={styles.fileIcon}>📄</span>
                                      <span className={styles.fileName}>{file.filename}</span>
                                      <span className={styles.fileSize}>
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
                            <div className={styles.reactions}>
                              {message.reactions.map((reaction, idx) => (
                                <span key={idx} className={styles.reaction}>
                                  {reaction.emoji}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className={styles.messageFooter}>
                            <span className={styles.messageTime}>
                              {formatDateTime(message.createdAt)}
                            </span>
                            
                            {/* Read receipts for sent messages */}
                            {readStatus && (
                              <span className={styles.readReceipt}>
                                {readStatus === 'read' ? (
                                  <span className={styles.doubleTick}>✓✓</span>
                                ) : (
                                  <span className={styles.singleTick}>✓</span>
                                )}
                              </span>
                            )}
                          </div>
                          
                          {/* Reaction button */}
                          <button
                            className={styles.reactionButton}
                            onClick={() => setShowReactions(showReactions === message._id ? null : message._id)}
                          >
                            😊
                          </button>
                          
                          {/* Reaction picker */}
                          {showReactions === message._id && (
                            <div className={styles.reactionPicker}>
                              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => addReaction(message._id, emoji)}
                                  className={styles.emojiButton}
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
                <div className={styles.filePreview}>
                  {previewFiles.map((file, idx) => (
                    <div key={idx} className={styles.previewItem}>
                      {file.preview ? (
                        <img src={file.preview} alt={file.name} className={styles.previewImage} />
                      ) : (
                        <div className={styles.previewFile}>
                          <span className={styles.fileIcon}>📄</span>
                          <span className={styles.previewFileName}>{file.name}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        className={styles.removeFile}
                        onClick={() => removeFile(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={sendMessage} className={styles.chatInput}>
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
                  className={styles.attachButton}
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
                />
                <Button type="submit" disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}>
                  {sending ? 'Sending...' : 'Send'}
                </Button>
              </form>
            </>
          ) : (
            <div className={styles.noSelection}>
              <div className={styles.noSelectionIcon}>💬</div>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className={styles.modalOverlay} onClick={() => setShowNewMessageModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>New Message</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowNewMessageModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <div className={styles.usersList}>
                {filteredUsers.length === 0 ? (
                  <p className={styles.noUsers}>No users found</p>
                ) : (
                  filteredUsers.map((u) => (
                    <div
                      key={u._id}
                      className={styles.userItem}
                      onClick={() => handleStartConversation(u)}
                    >
                      <div className={styles.avatar}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className={styles.userInfo}>
                        <h4>{u.name}</h4>
                        <p>{u.email}</p>
                        <span className={styles.userRole}>{u.role}</span>
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
