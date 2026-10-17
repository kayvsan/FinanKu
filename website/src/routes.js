// One URL per page; the page ids are what the views and nav components already use
export const PAGE_PATHS = {
  dashboard: '/',
  transactions: '/transactions',
  wallets: '/wallets',
  budgets: '/budgets',
  analytics: '/analytics',
  goals: '/goals',
  categories: '/categories',
  settings: '/settings'
};

export function pageFromPath(pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return Object.keys(PAGE_PATHS).find(page => PAGE_PATHS[page] === clean) || 'dashboard';
}
