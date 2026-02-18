const PlatformSettings = require('../models/PlatformSettings');

let cachedSettings = null;
let cacheExpiry = 0;
const CACHE_TTL = 30000;

async function getSettings() {
  const now = Date.now();
  if (cachedSettings && now < cacheExpiry) {
    return cachedSettings;
  }
  cachedSettings = await PlatformSettings.getSettings();
  cacheExpiry = now + CACHE_TTL;
  return cachedSettings;
}

function invalidateCache() {
  cachedSettings = null;
  cacheExpiry = 0;
}

async function getPlans() {
  const settings = await getSettings();
  return settings.plans.filter(p => p.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

async function getAllPlans() {
  const settings = await getSettings();
  return settings.plans.sort((a, b) => a.sortOrder - b.sortOrder);
}

async function getPlanById(planId) {
  const settings = await getSettings();
  const plan = settings.plans.find(p => p.planId === planId);
  if (plan) return plan;
  return settings.plans.find(p => p.planId === 'free') || {
    planId: 'free', name: 'Free', price: 0, commissionRate: 0.05, features: []
  };
}

async function isTestMode() {
  const settings = await getSettings();
  return settings.testMode;
}

async function getEffectiveCommissionRate(userPlan) {
  const testMode = await isTestMode();
  if (testMode) {
    const plans = await getPlans();
    const lowestRate = Math.min(...plans.map(p => p.commissionRate));
    return lowestRate;
  }
  const plan = await getPlanById(userPlan || 'free');
  return plan.commissionRate;
}

async function getEffectivePlan(userPlan) {
  const testMode = await isTestMode();
  if (testMode) {
    return 'mini_store';
  }
  return userPlan || 'free';
}

module.exports = {
  getSettings,
  invalidateCache,
  getPlans,
  getAllPlans,
  getPlanById,
  isTestMode,
  getEffectiveCommissionRate,
  getEffectivePlan
};
