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

module.exports = { PLANS, getCommissionRate, getPlanById };
