const PLANS = {
  free: {
    id: 'free',
    name: 'Free Membership',
    price: 0,
    commissionRate: 0.05,
    features: ['List items locally', 'Browse & purchase nearby', 'Messaging & pickup coordination']
  },
  plus: {
    id: 'plus',
    name: 'BaskMate Plus',
    price: 4.99,
    commissionRate: 0.03,
    features: ['Reduced transaction fees', 'Priority listing visibility', 'Seller insights & analytics', 'Trust badge']
  },
  mini_store: {
    id: 'mini_store',
    name: 'Mini Store',
    price: 19.99,
    commissionRate: 0.02,
    features: ['Lowest transaction fees', 'Dedicated store page', 'Inventory management', 'Advanced analytics', 'Priority support']
  }
};

function getCommissionRate(planId) {
  const plan = PLANS[planId];
  return plan ? plan.commissionRate : PLANS.free.commissionRate;
}

function getPlanById(planId) {
  return PLANS[planId] || PLANS.free;
}

let planServiceRef = null;
function getPlanService() {
  if (!planServiceRef) {
    try {
      planServiceRef = require('../services/planService');
    } catch (e) {
      console.warn('planService not available, using static config');
    }
  }
  return planServiceRef;
}

async function getDynamicCommissionRate(planId) {
  const svc = getPlanService();
  if (svc) {
    try {
      return await svc.getEffectiveCommissionRate(planId);
    } catch (e) {
      console.warn('Dynamic commission rate failed, using static:', e.message);
    }
  }
  return getCommissionRate(planId);
}

async function getDynamicPlans() {
  const svc = getPlanService();
  if (svc) {
    try {
      const plans = await svc.getPlans();
      return plans.map(p => ({
        id: p.planId,
        name: p.name,
        price: p.price,
        yearlyPrice: p.yearlyPrice || null,
        commissionRate: p.commissionRate,
        features: p.features
      }));
    } catch (e) {
      console.warn('Dynamic plans failed, using static:', e.message);
    }
  }
  return Object.values(PLANS);
}

async function isTestMode() {
  const svc = getPlanService();
  if (svc) {
    try {
      return await svc.isTestMode();
    } catch (e) {
      return false;
    }
  }
  return false;
}

module.exports = { PLANS, getCommissionRate, getPlanById, getDynamicCommissionRate, getDynamicPlans, isTestMode };
