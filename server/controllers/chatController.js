import Message from '../models/Message.js';
import User from '../models/User.js';

// @desc    Send a message
// @route   POST /api/chat/send
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const senderId = req.user._id;

    // Validate required fields
    if (!receiverId || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and message content are required'
      });
    }

    // Validate that sender and receiver are different
    if (senderId.toString() === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    // Find receiver
    const receiver = await User.findById(receiverId);
    if (!receiver || !receiver.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Validate chat permissions: Admin can chat with any customer, Customer can only chat with admins
    if (req.user.role === 'customer' && receiver.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Customers can only chat with admins'
      });
    }

    if (req.user.role === 'admin' && receiver.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Admins can only chat with customers'
      });
    }

    // Create message
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      message: message.trim()
    });

    await newMessage.save();

    // Populate sender and receiver details
    await newMessage.populate('sender', 'name username role');
    await newMessage.populate('receiver', 'name username role');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        _id: newMessage._id,
        sender: {
          _id: newMessage.sender._id,
          name: newMessage.sender.name,
          username: newMessage.sender.username,
          role: newMessage.sender.role
        },
        receiver: {
          _id: newMessage.receiver._id,
          name: newMessage.receiver.name,
          username: newMessage.receiver.username,
          role: newMessage.receiver.role
        },
        message: newMessage.message,
        isRead: newMessage.isRead,
        createdAt: newMessage.createdAt,
        updatedAt: newMessage.updatedAt
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid receiver ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while sending message',
      error: error.message
    });
  }
};

// @desc    Get messages between current user and another user
// @route   GET /api/chat/messages/:userId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();
    const otherUserId = userId;

    // Validate that the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser || !otherUser.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate chat permissions
    if (req.user.role === 'customer' && otherUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Customers can only chat with admins'
      });
    }

    if (req.user.role === 'admin' && otherUser.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Admins can only chat with customers'
      });
    }

    // Get messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'name username role')
    .populate('receiver', 'name username role')
    .sort({ createdAt: 1 }) // Oldest first
    .limit(100); // Limit to last 100 messages

    // Mark messages as read where current user is the receiver
    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: currentUserId,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'Messages fetched successfully',
      data: messages.map(msg => ({
        _id: msg._id,
        sender: {
          _id: msg.sender._id,
          name: msg.sender.name,
          username: msg.sender.username,
          role: msg.sender.role
        },
        receiver: {
          _id: msg.receiver._id,
          name: msg.receiver.name,
          username: msg.receiver.username,
          role: msg.receiver.role
        },
        message: msg.message,
        isRead: msg.isRead,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt
      })),
      otherUser: {
        _id: otherUser._id,
        name: otherUser.name,
        username: otherUser.username,
        role: otherUser.role
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages',
      error: error.message
    });
  }
};

// @desc    Get list of conversations for current user
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    if (req.user.role === 'admin') {
      // For admin: Get all customers they've chatted with
      // Use a simpler approach with find and group in JavaScript
      const messages = await Message.find({
        $or: [
          { sender: currentUserId },
          { receiver: currentUserId }
        ]
      })
      .populate('sender', 'name username role')
      .populate('receiver', 'name username role')
      .sort({ createdAt: -1 });

      // Group messages by conversation partner
      const conversationMap = new Map();
      
      messages.forEach(msg => {
        const otherUserId = msg.sender._id.toString() === currentUserId.toString() 
          ? msg.receiver._id.toString() 
          : msg.sender._id.toString();
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            userId: otherUserId,
            lastMessage: null,
            unreadCount: 0,
            user: null
          });
        }
        
        const conv = conversationMap.get(otherUserId);
        
        // Set last message if not set or if this is newer
        if (!conv.lastMessage || new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt)) {
          conv.lastMessage = {
            message: msg.message,
            createdAt: msg.createdAt,
            isFromMe: msg.sender._id.toString() === currentUserId.toString()
          };
        }
        
        // Count unread messages
        if (msg.receiver._id.toString() === currentUserId.toString() && !msg.isRead) {
          conv.unreadCount++;
        }
        
        // Store user info
        const otherUser = msg.sender._id.toString() === currentUserId.toString() ? msg.receiver : msg.sender;
        if (otherUser.role === 'customer') {
          conv.user = otherUser;
        }
      });

      // Convert map to array and filter
      const conversationList = Array.from(conversationMap.values())
        .filter(conv => conv.user && conv.user.role === 'customer')
        .map(conv => ({
          userId: conv.user._id,
          name: conv.user.name,
          username: conv.user.username,
          role: conv.user.role,
          mobile: conv.user.mobile,
          area: conv.user.area,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount
        }))
        .sort((a, b) => {
          if (!a.lastMessage && !b.lastMessage) return 0;
          if (!a.lastMessage) return 1;
          if (!b.lastMessage) return -1;
          return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

      res.json({
        success: true,
        message: 'Conversations fetched successfully',
        data: conversationList
      });

    } else {
      // For customer: Get all admins they've chatted with
      const messages = await Message.find({
        $or: [
          { sender: currentUserId },
          { receiver: currentUserId }
        ]
      })
      .populate('sender', 'name username role')
      .populate('receiver', 'name username role')
      .sort({ createdAt: -1 });

      // Group messages by conversation partner
      const conversationMap = new Map();
      
      messages.forEach(msg => {
        const otherUserId = msg.sender._id.toString() === currentUserId.toString() 
          ? msg.receiver._id.toString() 
          : msg.sender._id.toString();
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            userId: otherUserId,
            lastMessage: null,
            unreadCount: 0,
            user: null
          });
        }
        
        const conv = conversationMap.get(otherUserId);
        
        // Set last message if not set or if this is newer
        if (!conv.lastMessage || new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt)) {
          conv.lastMessage = {
            message: msg.message,
            createdAt: msg.createdAt,
            isFromMe: msg.sender._id.toString() === currentUserId.toString()
          };
        }
        
        // Count unread messages
        if (msg.receiver._id.toString() === currentUserId.toString() && !msg.isRead) {
          conv.unreadCount++;
        }
        
        // Store user info
        const otherUser = msg.sender._id.toString() === currentUserId.toString() ? msg.receiver : msg.sender;
        if (otherUser.role === 'admin') {
          conv.user = otherUser;
        }
      });

      // Convert map to array and filter
      const conversationList = Array.from(conversationMap.values())
        .filter(conv => conv.user && conv.user.role === 'admin')
        .map(conv => ({
          userId: conv.user._id,
          name: conv.user.name,
          username: conv.user.username,
          role: conv.user.role,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount
        }))
        .sort((a, b) => {
          if (!a.lastMessage && !b.lastMessage) return 0;
          if (!a.lastMessage) return 1;
          if (!b.lastMessage) return -1;
          return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });

      res.json({
        success: true,
        message: 'Conversations fetched successfully',
        data: conversationList
      });
    }

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversations',
      error: error.message
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/messages/:userId/read
// @access  Private
export const markMessagesAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;

    const result = await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'Messages marked as read',
      count: result.modifiedCount
    });

  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking messages as read',
      error: error.message
    });
  }
};

