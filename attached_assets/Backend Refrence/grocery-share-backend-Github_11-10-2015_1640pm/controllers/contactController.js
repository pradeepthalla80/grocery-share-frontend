const ContactMessage = require('../models/ContactMessage');

exports.submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const contactMessage = new ContactMessage({
      name,
      email,
      subject,
      message,
      user: req.userId || null
    });

    await contactMessage.save();

    res.status(201).json({ 
      message: 'Your message has been sent successfully! We will get back to you soon.',
      contactMessage
    });
  } catch (error) {
    console.error('Submit contact form error:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
};

exports.getContactMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ messages });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ error: 'Failed to fetch contact messages' });
  }
};
