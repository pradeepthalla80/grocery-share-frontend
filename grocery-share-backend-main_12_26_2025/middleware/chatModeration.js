const { moderateText } = require('../services/aiService');

const SCAM_PATTERNS = [
  /\b(venmo|cashapp|cash\s*app|zelle|paypal|wire\s*transfer)\b/i,
  /\b(send\s*money|western\s*union|bitcoin|crypto)\b/i,
  /\b(gift\s*card|prepaid\s*card)\b/i,
  /\b(click\s*(this|here)|bit\.ly|tinyurl)\b/i,
  /\b(ssn|social\s*security|bank\s*account|routing\s*number)\b/i,
  /\b(nigerian|prince|lottery|winner|congratulations\s*you\s*won)\b/i,
];

const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Moderation timeout')), ms))
  ]);
};

const moderateMessage = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return next();
    }

    for (const pattern of SCAM_PATTERNS) {
      if (pattern.test(message)) {
        console.log(`[ChatModeration] Scam pattern detected: ${pattern}`);
        return res.status(400).json({
          error: 'Message flagged',
          reason: 'This message contains content that appears to be a potential scam or requests payment outside the platform. Please use BaskMate\'s built-in payment system for transactions.',
          flagged: true,
        });
      }
    }

    if (message.length > 10) {
      try {
        const modResult = await withTimeout(moderateText(message), 8000);

        if (modResult.flagged) {
          console.log(`[ChatModeration] AI flagged message: ${modResult.dominantLabel} (${modResult.dominantScore}%)`);
          return res.status(400).json({
            error: 'Message flagged',
            reason: 'This message was flagged for potentially inappropriate content. Please keep conversations respectful.',
            flagged: true,
            category: modResult.dominantLabel,
          });
        }
      } catch (aiError) {
        console.error('[ChatModeration] AI moderation failed, allowing message:', aiError.message);
      }
    }

    next();
  } catch (error) {
    console.error('[ChatModeration] Middleware error:', error.message);
    next();
  }
};

module.exports = { moderateMessage };
