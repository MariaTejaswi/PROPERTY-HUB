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
  const messagesEndRef = useRef(null);
  const pollingInterval = useRef(null);

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
    if (!newMessage.trim() || !selectedUser) return;

    setSending(true);
    try {
      await api.post('/messages', {
        recipientIds: [selectedUser._id],
        content: newMessage
      });
      
      setNewMessage('');
      fetchMessages(selectedUser._id);
      fetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
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
                  messages.map((message) => (
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
                        <p>{message.content}</p>
                        <span className={styles.messageTime}>
                          {formatDateTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className={styles.chatInput}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                />
                <Button type="submit" disabled={!newMessage.trim() || sending}>
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
