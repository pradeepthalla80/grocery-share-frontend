const PlatformSettings = require('../models/PlatformSettings');
const planService = require('../services/planService');

exports.getSettings = async (req, res) => {
  try {
    const settings = await planService.getSettings();
    res.json({
      testMode: settings.testMode,
      testModeUpdatedAt: settings.testModeUpdatedAt,
      plans: settings.plans.sort((a, b) => a.sortOrder - b.sortOrder)
    });
  } catch (err) {
    console.error('Get platform settings error:', err);
    res.status(500).json({ error: 'Failed to get platform settings' });
  }
};

exports.toggleTestMode = async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    const settings = await PlatformSettings.getSettings();
    settings.testMode = enabled;
    settings.testModeUpdatedAt = new Date();
    settings.testModeUpdatedBy = req.user._id;
    await settings.save();
    planService.invalidateCache();

    console.log(`Test mode ${enabled ? 'ENABLED' : 'DISABLED'} by admin ${req.user._id}`);

    res.json({
      testMode: settings.testMode,
      testModeUpdatedAt: settings.testModeUpdatedAt,
      message: `Test mode ${enabled ? 'enabled' : 'disabled'}. ${enabled ? 'All users now have access to all features.' : 'Features are now restricted by subscription plan.'}`
    });
  } catch (err) {
    console.error('Toggle test mode error:', err);
    res.status(500).json({ error: 'Failed to toggle test mode' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { name, price, commissionRate, features, active, yearlyPrice } = req.body;

    const settings = await PlatformSettings.getSettings();
    const planIndex = settings.plans.findIndex(p => p.planId === planId);

    if (planIndex === -1) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (planId === 'free' && price > 0) {
      return res.status(400).json({ error: 'Free plan cannot have a price' });
    }

    if (name !== undefined) settings.plans[planIndex].name = name;
    if (price !== undefined) settings.plans[planIndex].price = price;
    if (commissionRate !== undefined) settings.plans[planIndex].commissionRate = commissionRate;
    if (features !== undefined) settings.plans[planIndex].features = features;
    if (yearlyPrice !== undefined) settings.plans[planIndex].yearlyPrice = yearlyPrice;
    if (active !== undefined) {
      if (planId === 'free' && !active) {
        return res.status(400).json({ error: 'Free plan cannot be deactivated' });
      }
      settings.plans[planIndex].active = active;
    }

    await settings.save();
    planService.invalidateCache();

    console.log(`Plan "${planId}" updated by admin ${req.user._id}:`, { name, price, commissionRate });

    res.json({
      plan: settings.plans[planIndex],
      message: `Plan "${settings.plans[planIndex].name}" updated successfully`
    });
  } catch (err) {
    console.error('Update plan error:', err);
    res.status(500).json({ error: 'Failed to update plan' });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { planId, name, price, commissionRate, features, yearlyPrice } = req.body;

    if (!planId || !name) {
      return res.status(400).json({ error: 'Plan ID and name are required' });
    }

    if (!/^[a-z][a-z0-9_]*$/.test(planId)) {
      return res.status(400).json({ error: 'Plan ID must be lowercase letters, numbers, and underscores only' });
    }

    const settings = await PlatformSettings.getSettings();
    const exists = settings.plans.find(p => p.planId === planId);
    if (exists) {
      return res.status(400).json({ error: 'A plan with this ID already exists' });
    }

    const maxSort = Math.max(...settings.plans.map(p => p.sortOrder), 0);

    settings.plans.push({
      planId,
      name,
      price: price || 0,
      yearlyPrice: yearlyPrice || null,
      commissionRate: commissionRate || 0.05,
      features: features || [],
      active: true,
      sortOrder: maxSort + 1
    });

    await settings.save();
    planService.invalidateCache();

    console.log(`New plan "${planId}" created by admin ${req.user._id}`);

    res.json({
      plan: settings.plans.find(p => p.planId === planId),
      message: `Plan "${name}" created successfully`
    });
  } catch (err) {
    console.error('Create plan error:', err);
    res.status(500).json({ error: 'Failed to create plan' });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    if (planId === 'free') {
      return res.status(400).json({ error: 'Cannot delete the Free plan' });
    }

    const settings = await PlatformSettings.getSettings();
    const planIndex = settings.plans.findIndex(p => p.planId === planId);

    if (planIndex === -1) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const mongoose = require('mongoose');
    const User = require('../models/User');
    const usersOnPlan = await User.countDocuments({ plan: planId });

    if (usersOnPlan > 0) {
      return res.status(400).json({
        error: `Cannot delete this plan. ${usersOnPlan} user(s) are currently subscribed to it. Deactivate it instead.`
      });
    }

    const planName = settings.plans[planIndex].name;
    settings.plans.splice(planIndex, 1);
    await settings.save();
    planService.invalidateCache();

    console.log(`Plan "${planId}" deleted by admin ${req.user._id}`);

    res.json({ message: `Plan "${planName}" deleted successfully` });
  } catch (err) {
    console.error('Delete plan error:', err);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
};

exports.getTestModeStatus = async (req, res) => {
  try {
    const testMode = await planService.isTestMode();
    res.json({ testMode });
  } catch (err) {
    console.error('Get test mode status error:', err);
    res.status(500).json({ error: 'Failed to get test mode status' });
  }
};
