// Plan limits — single source of truth
// To change any limit, change it here only

export const PLANS = {
  free: {
    name: 'Free',
    maxProjects: 2,
    canExportPDF: false,
    canExportCSV: true,
    historyDays: 30,
    canEditOldSessions: false,
  },
  pro: {
    name: 'Pro',
    maxProjects: Infinity,
    canExportPDF: true,
    canExportCSV: true,
    historyDays: Infinity,
    canEditOldSessions: true,
  },
};

export function getPlanLimits(planName) {
  return PLANS[planName] || PLANS.free;
}

// Get the active plan for a user from a subscription row
// A subscription is "Pro" if status is active or trialing
// AND current_period_end is in the future (or null for trialing)
export function getActivePlan(subscription) {
  if (!subscription) return 'free';
  const isActive = ['active', 'trialing'].includes(subscription.status);
  if (!isActive) return 'free';
  if (subscription.current_period_end) {
    const periodEnd = new Date(subscription.current_period_end);
    if (periodEnd < new Date()) return 'free';
  }
  return subscription.plan === 'pro' ? 'pro' : 'free';
}
