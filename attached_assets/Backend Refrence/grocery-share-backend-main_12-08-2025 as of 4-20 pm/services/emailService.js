const nodemailer = require('nodemailer');

// Create transporter (using Gmail SMTP)
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️ Email service not configured. Set EMAIL_USER and EMAIL_PASS environment variables.');
    return null;
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send expiry alert email
const sendExpiryAlert = async (userEmail, userName, items) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('Email service unavailable - skipping expiry alert');
    return false;
  }
  
  const itemsList = items.map(item => 
    `• ${item.name} (expires ${new Date(item.expiryDate).toLocaleDateString()})`
  ).join('\n');
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: '⏰ Your Items Are Expiring Soon - Grocery Share',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Hi ${userName}! 👋</h2>
        <p>Your grocery items are expiring within the next 24 hours:</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <pre style="margin: 0; font-family: Arial;">${itemsList}</pre>
        </div>
        <p>Consider sharing them on <strong>Grocery Share</strong> before they expire!</p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
          You're receiving this because you enabled email notifications in your preferences.
        </p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Expiry alert sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

// Send nearby item notification email
const sendNearbyItemEmail = async (userEmail, userName, item, notificationType) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('Email service unavailable - skipping nearby item notification');
    return false;
  }
  
  const typeLabels = {
    'nearby_free': '🆓 Free Item Nearby',
    'nearby_discounted': '💰 Discounted Item Nearby',
    'new_match': '✨ New Match Based on Your Preferences'
  };
  
  const subject = typeLabels[notificationType] || 'New Item Available - Grocery Share';
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Hi ${userName}! 👋</h2>
        <p>We found a ${item.isFree ? 'free' : 'discounted'} item near you:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${item.imageURL ? `<img src="${item.imageURL}" alt="${item.name}" style="width: 100%; max-width: 300px; border-radius: 8px; margin-bottom: 15px;">` : ''}
          <h3 style="margin: 10px 0; color: #111827;">${item.name}</h3>
          <p style="font-size: 18px; font-weight: bold; color: #10b981;">
            ${item.isFree ? '🆓 FREE' : `$${item.price}`}
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            Expires: ${new Date(item.expiryDate).toLocaleDateString()}
          </p>
        </div>
        <p>Log in to Grocery Share to claim this item!</p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 12px;">
          You're receiving this because you enabled email notifications in your preferences.
        </p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Nearby item notification sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

module.exports = {
  sendExpiryAlert,
  sendNearbyItemEmail
};
