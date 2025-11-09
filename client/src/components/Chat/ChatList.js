import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../Layout/Sidebar';
import Header from '../Layout/Header';
import { useAuth } from '../../context/AuthContext';
import { ChatBubbleLeftRightIcon, UserIcon } from '@heroicons/react/24/outline';
import { playNotificationSound } from '../../utils/soundNotification';

const ChatList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const previousUnreadCountRef = useRef(0);

  useEffect(() => {
    fetchConversations();
    // Refresh conversations every 10 seconds
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/chat/conversations');
      const newConversations = response.data.data || [];
      
      // Calculate total unread count
      const totalUnread = newConversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      const previousUnread = previousUnreadCountRef.current;
      
      // Play sound if there are new unread messages
      if (previousUnread > 0 && totalUnread > previousUnread) {
        playNotificationSound();
      }
      
      setConversations(newConversations);
      previousUnreadCountRef.current = totalUnread;
      setError(null);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <div className="p-6 flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Chat</h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'admin' 
                ? 'Chat with your customers' 
                : 'Chat with admin'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            {conversations.length === 0 ? (
              <div className="p-12 text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {user?.role === 'admin' 
                    ? 'No conversations yet. Start chatting with customers!' 
                    : 'No conversations yet. Start chatting with admin!'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.userId}
                    onClick={() => navigate(`/chat/${conversation.userId}`)}
                    className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.name}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <div className="mt-1 flex items-center justify-between">
                              <p className={`text-sm truncate ${
                                conversation.unreadCount > 0 
                                  ? 'text-gray-900 font-medium' 
                                  : 'text-gray-500'
                              }`}>
                                {conversation.lastMessage.isFromMe && 'You: '}
                                {conversation.lastMessage.message}
                              </p>
                              <p className="text-xs text-gray-400 ml-2">
                                {formatTime(conversation.lastMessage.createdAt)}
                              </p>
                            </div>
                          )}
                          {user?.role === 'admin' && conversation.area && (
                            <p className="text-xs text-gray-400 mt-1">
                              {conversation.area}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatList;

