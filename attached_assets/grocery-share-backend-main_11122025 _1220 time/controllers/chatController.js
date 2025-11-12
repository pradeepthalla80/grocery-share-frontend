const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// Get user conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.userId
    })
    .populate('participants', 'name email')
    .populate('item', 'name imageURL')
    .sort({ lastMessageAt: -1 });
    
    res.json({
      count: conversations.length,
      conversations: conversations.map(conv => ({
        id: conv._id,
        participants: conv.participants.map(p => ({
          id: p._id,
          name: p.name,
          email: p.email
        })),
        item: conv.item ? {
          id: conv.item._id,
          name: conv.item.name,
          imageURL: conv.item.imageURL
        } : null,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt
      }))
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// Get messages in a conversation
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;
    
    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.userId
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const query = { conversation: conversationId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }
    
    const messages = await Message.find(query)
      .populate('sender', 'name')
      .populate('receiver', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      count: messages.length,
      messages: messages.reverse().map(msg => ({
        id: msg._id,
        sender: {
          id: msg.sender._id,
          name: msg.sender.name
        },
        receiver: {
          id: msg.receiver._id,
          name: msg.receiver.name
        },
        message: msg.message,
        read: msg.read,
        createdAt: msg.createdAt
      }))
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, itemId, message } = req.body;
    
    if (!receiverId || !message) {
      return res.status(400).json({ error: 'Receiver and message are required' });
    }
    
    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.userId, receiverId] },
      item: itemId || null
    });
    
    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user.userId, receiverId],
        item: itemId || null,
        lastMessage: message,
        lastMessageAt: new Date()
      });
      await conversation.save();
    } else {
      conversation.lastMessage = message;
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }
    
    // Create message
    const newMessage = new Message({
      conversation: conversation._id,
      sender: req.user.userId,
      receiver: receiverId,
      message
    });
    
    await newMessage.save();
    await newMessage.populate('sender', 'name');
    await newMessage.populate('receiver', 'name');
    
    res.status(201).json({
      message: 'Message sent successfully',
      data: {
        id: newMessage._id,
        conversationId: conversation._id,
        sender: {
          id: newMessage.sender._id,
          name: newMessage.sender.name
        },
        receiver: {
          id: newMessage.receiver._id,
          name: newMessage.receiver.name
        },
        message: newMessage.message,
        read: newMessage.read,
        createdAt: newMessage.createdAt
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    await Message.updateMany(
      { 
        conversation: conversationId,
        receiver: req.user.userId,
        read: false
      },
      { read: true }
    );
    
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Failed to update messages' });
  }
};

// Confirm pickup
const confirmPickup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Check if user already confirmed
    const alreadyConfirmed = conversation.confirmedBy.some(
      c => c.user.toString() === userId.toString()
    );
    
    if (alreadyConfirmed) {
      return res.status(400).json({ error: 'You have already confirmed this pickup' });
    }
    
    // Add user to confirmedBy array
    conversation.confirmedBy.push({
      user: userId,
      confirmedAt: new Date()
    });
    
    // If both participants have confirmed, mark as completed
    if (conversation.confirmedBy.length === conversation.participants.length) {
      conversation.pickupConfirmed = true;
      conversation.pickupCompletedAt = new Date();
      
      // Update item status if exists
      if (conversation.item) {
        const Item = require('../models/Item');
        await Item.findByIdAndUpdate(conversation.item, {
          status: 'picked_up',
          isActive: false
        });
      }
    }
    
    await conversation.save();
    
    res.json({
      message: 'Pickup confirmed',
      pickupConfirmed: conversation.pickupConfirmed,
      confirmedBy: conversation.confirmedBy.length,
      totalParticipants: conversation.participants.length
    });
  } catch (error) {
    console.error('Confirm pickup error:', error);
    res.status(500).json({ error: 'Failed to confirm pickup' });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  confirmPickup
};
