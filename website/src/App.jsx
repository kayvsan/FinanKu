import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import AppLayout from './layout/AppLayout';
import LoginView from './features/auth/LoginView';
import DashboardView from './features/dashboard/DashboardView';
import TransactionsView from './features/transactions/TransactionsView';
import WalletsView from './features/wallets/WalletsView';
import BudgetsView from './features/budgets/BudgetsView';
import AnalyticsView from './features/analytics/AnalyticsView';
import GoalsView from './features/goals/GoalsView';
import CategoriesView from './features/categories/CategoriesView';
import SettingsView from './features/settings/SettingsView';
import LoadingScreen from './shared/components/LoadingScreen';
import NetworkProgress from './shared/components/NetworkProgress';
import { PAGE_PATHS } from './routes';

// App pages: not logged in -> /login, remembering where the user was heading
function RequireAuth() {
  const { status, currentUser } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <LoadingScreen message="Memeriksa sesi..." />;
  if (status !== 'authenticated') return <Navigate to="/login" replace state={{ from: location }} />;
  return (
    // Remount per user so one account's data never leaks into another's session
    <FinanceProvider key={currentUser}>
      <AppLayout />
    </FinanceProvider>
  );
}

// /login and /register: already logged in -> back to where the user came from
function GuestOnly() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <LoadingScreen message="Memeriksa sesi..." />;
  if (status === 'authenticated') {
    const from = location.state?.from;
    return <Navigate to={from ? `${from.pathname}${from.search}` : '/'} replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <NetworkProgress />
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginView mode="login" />} />
          <Route path="/register" element={<LoginView mode="register" />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route index element={<DashboardView />} />
          <Route path={PAGE_PATHS.transactions} element={<TransactionsView />} />
          <Route path={PAGE_PATHS.wallets} element={<WalletsView />} />
          <Route path={PAGE_PATHS.budgets} element={<BudgetsView />} />
          <Route path={PAGE_PATHS.analytics} element={<AnalyticsView />} />
          <Route path={PAGE_PATHS.goals} element={<GoalsView />} />
          <Route path={PAGE_PATHS.categories} element={<CategoriesView />} />
          <Route path={PAGE_PATHS.settings} element={<SettingsView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
