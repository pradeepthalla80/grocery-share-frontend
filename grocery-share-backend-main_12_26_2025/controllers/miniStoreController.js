const MiniStoreSettings = require('../models/MiniStoreSettings');
const MiniStoreRequest = require('../models/MiniStoreRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

const getOrCreateSettings = async () => {
  let settings = await MiniStoreSettings.findOne();
  if (!settings) {
    settings = await MiniStoreSettings.create({});
  }
  return settings;
};

exports.checkAvailability = async (req, res) => {
  try {
    const { zip } = req.query;
    if (!zip) {
      return res.status(400).json({ error: 'ZIP code is required' });
    }

    const settings = await getOrCreateSettings();

    if (!settings.enabled) {
      return res.json({ available: false, reason: 'globally_disabled', waitlistOpen: settings.waitlistEnabled });
    }

    const zipSetting = settings.zipSettings.find(z => z.zipCode === zip);

    if (zipSetting?.disabled) {
      return res.json({ available: false, reason: 'zip_blocked', waitlistOpen: false });
    }

    if (zipSetting?.paused) {
      return res.json({ available: false, reason: 'zip_paused', waitlistOpen: settings.waitlistEnabled || zipSetting.waitlistOnly });
    }

    if (zipSetting?.waitlistOnly) {
      return res.json({ available: false, reason: 'waitlist_only', waitlistOpen: true });
    }

    const maxStores = zipSetting?.maxStores || settings.defaultMaxStoresPerZip;
    const activeStoresInZip = await MiniStoreRequest.countDocuments({
      zipCode: zip,
      status: 'approved',
      type: 'store_request'
    });

    if (activeStoresInZip >= maxStores) {
      return res.json({
        available: false,
        reason: 'zip_full',
        waitlistOpen: settings.waitlistEnabled || zipSetting?.waitlistOnly || false,
        activeStores: activeStoresInZip,
        maxStores
      });
    }

    const existingRequest = await MiniStoreRequest.findOne({
      user: req.user._id,
      type: 'store_request',
      status: 'pending'
    });

    if (existingRequest) {
      return res.json({ available: false, reason: 'pending_approval', waitlistOpen: false });
    }

    if (zipSetting?.requireApproval || settings.requireApproval) {
      return res.json({ available: true, reason: 'approval_required', waitlistOpen: false });
    }

    return res.json({ available: true, reason: 'zip_allowed', waitlistOpen: false });
  } catch (err) {
    console.error('Mini Store availability check error:', err);
    res.status(500).json({ error: 'Failed to check availability' });
  }
};

exports.joinWaitlist = async (req, res) => {
  try {
    const { zipCode, email } = req.body;
    if (!zipCode) {
      return res.status(400).json({ error: 'ZIP code is required' });
    }

    const existing = await MiniStoreRequest.findOne({
      user: req.user._id,
      type: 'waitlist',
      status: 'pending'
    });

    if (existing) {
      return res.status(400).json({ error: 'You are already on the waitlist' });
    }

    const request = await MiniStoreRequest.create({
      user: req.user._id,
      email: email || req.user.email,
      zipCode,
      type: 'waitlist',
      status: 'pending'
    });

    try {
      const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }, '_id');
      const notifications = admins.map(admin => ({
        user: admin._id,
        type: 'waitlist_joined',
        message: `${req.user.name} joined the Mini Store waitlist for ZIP ${zipCode}`,
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error('Failed to send admin notifications:', notifErr);
    }

    res.status(201).json({ success: true, request });
  } catch (err) {
    console.error('Waitlist join error:', err);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
};

exports.submitStoreRequest = async (req, res) => {
  try {
    const { zipCode, storeName, email } = req.body;
    if (!zipCode) {
      return res.status(400).json({ error: 'ZIP code is required' });
    }

    const existing = await MiniStoreRequest.findOne({
      user: req.user._id,
      type: 'store_request',
      status: 'pending'
    });

    if (existing) {
      return res.status(400).json({ error: 'You already have a pending store request' });
    }

    const request = await MiniStoreRequest.create({
      user: req.user._id,
      email: email || req.user.email,
      zipCode,
      storeName: storeName || '',
      type: 'store_request',
      status: 'pending'
    });

    try {
      const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } }, '_id');
      const notifications = admins.map(admin => ({
        user: admin._id,
        type: 'store_request_new',
        message: `New store request from ${req.user.name} for ZIP ${zipCode}${storeName ? ` (${storeName})` : ''}`,
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifErr) {
      console.error('Failed to send admin notifications:', notifErr);
    }

    res.status(201).json({ success: true, request });
  } catch (err) {
    console.error('Store request error:', err);
    res.status(500).json({ error: 'Failed to submit store request' });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { enabled, waitlistEnabled, requireApproval, defaultMaxStoresPerZip } = req.body;
    const settings = await getOrCreateSettings();

    if (typeof enabled === 'boolean') settings.enabled = enabled;
    if (typeof waitlistEnabled === 'boolean') settings.waitlistEnabled = waitlistEnabled;
    if (typeof requireApproval === 'boolean') settings.requireApproval = requireApproval;
    if (typeof defaultMaxStoresPerZip === 'number') settings.defaultMaxStoresPerZip = defaultMaxStoresPerZip;
    settings.updatedBy = req.user._id;

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

exports.updateZipSettings = async (req, res) => {
  try {
    const { zipCode, maxStores, paused, disabled, waitlistOnly, requireApproval } = req.body;
    if (!zipCode || !/^\d{5}$/.test(zipCode)) {
      return res.status(400).json({ error: 'Valid 5-digit ZIP code is required' });
    }
    if (typeof maxStores === 'number' && (maxStores < 1 || maxStores > 100)) {
      return res.status(400).json({ error: 'Max stores must be between 1 and 100' });
    }

    const settings = await getOrCreateSettings();
    const existingIdx = settings.zipSettings.findIndex(z => z.zipCode === zipCode);

    const zipData = { zipCode };
    if (typeof maxStores === 'number') zipData.maxStores = maxStores;
    if (typeof paused === 'boolean') zipData.paused = paused;
    if (typeof disabled === 'boolean') zipData.disabled = disabled;
    if (typeof waitlistOnly === 'boolean') zipData.waitlistOnly = waitlistOnly;
    if (typeof requireApproval === 'boolean') zipData.requireApproval = requireApproval;

    if (existingIdx >= 0) {
      Object.assign(settings.zipSettings[existingIdx], zipData);
    } else {
      settings.zipSettings.push(zipData);
    }

    settings.updatedBy = req.user._id;
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ZIP settings' });
  }
};

exports.deleteZipSettings = async (req, res) => {
  try {
    const { zipCode } = req.params;
    const settings = await getOrCreateSettings();
    settings.zipSettings = settings.zipSettings.filter(z => z.zipCode !== zipCode);
    settings.updatedBy = req.user._id;
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete ZIP settings' });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const { status, type, zip } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (zip) filter.zipCode = zip;

    const requests = await MiniStoreRequest.find(filter)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get requests' });
  }
};

exports.reviewRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const request = await MiniStoreRequest.findByIdAndUpdate(id, {
      status,
      notes: notes || '',
      reviewedBy: req.user._id,
      reviewedAt: new Date()
    }, { new: true }).populate('user', 'name email');

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (status === 'approved' && request.type === 'store_request') {
      await User.findByIdAndUpdate(request.user._id, {
        isStoreOwner: true,
        storeMode: true,
        storeName: request.storeName || `${request.user.name}'s Store`,
        storeActivatedAt: new Date()
      });
    }

    try {
      let notifType, notifMessage;
      if (request.type === 'store_request') {
        notifType = status === 'approved' ? 'store_request_approved' : 'store_request_rejected';
        notifMessage = status === 'approved'
          ? `Your store request for ZIP ${request.zipCode} has been approved! You can now set up your store.`
          : `Your store request for ZIP ${request.zipCode} has been declined.${notes ? ` Reason: ${notes}` : ''}`;
      } else {
        notifType = status === 'approved' ? 'store_request_approved' : 'store_request_rejected';
        notifMessage = status === 'approved'
          ? `Your waitlist entry for ZIP ${request.zipCode} has been approved! You can now open a store.`
          : `Your waitlist entry for ZIP ${request.zipCode} has been declined.${notes ? ` Reason: ${notes}` : ''}`;
      }
      await Notification.create({
        user: request.user._id,
        type: notifType,
        message: notifMessage,
      });
    } catch (notifErr) {
      console.error('Failed to send user notification:', notifErr);
    }

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ error: 'Failed to review request' });
  }
};
