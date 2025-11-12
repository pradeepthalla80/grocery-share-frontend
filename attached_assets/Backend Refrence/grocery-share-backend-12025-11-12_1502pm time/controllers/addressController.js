const Conversation = require('../models/Conversation');
const Item = require('../models/Item');

exports.revealAddress = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const isParticipant = conversation.participants.some(
      p => p.toString() === req.user.userId
    );

    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not part of this conversation' });
    }

    const alreadyRevealed = conversation.revealedBy.some(
      r => r.user.toString() === req.user.userId
    );

    if (alreadyRevealed) {
      return res.status(400).json({ error: 'You have already agreed to reveal the address' });
    }

    conversation.revealedBy.push({
      user: req.user.userId,
      revealedAt: new Date()
    });

    if (conversation.revealedBy.length === conversation.participants.length) {
      conversation.addressRevealed = true;
    }

    await conversation.save();

    let fullAddress = null;
    if (conversation.addressRevealed && conversation.item) {
      const item = await Item.findById(conversation.item);
      if (item) {
        fullAddress = item.address;
      }
    }

    res.json({
      message: conversation.addressRevealed 
        ? 'Address revealed to both parties' 
        : 'Waiting for other party to agree',
      addressRevealed: conversation.addressRevealed,
      address: fullAddress,
      revealedBy: conversation.revealedBy.length,
      totalParticipants: conversation.participants.length
    });
  } catch (error) {
    console.error('Reveal address error:', error);
    res.status(500).json({ error: 'Failed to reveal address' });
  }
};
