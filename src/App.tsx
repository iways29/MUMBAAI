import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Pages
import {
  HomePage,
  AuthPage,
  MainApp,
  AdminLayout,
  AdminDashboard,
  AdminPrompts,
  AdminModels,
  AdminUsers
} from './pages/index.ts';

// Components
import { ErrorBoundary } from './components/UI/ErrorBoundary.tsx';

// Authentication
import { useAuth } from './hooks/useAuth.ts';

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8811] mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Auth Route wrapper - redirects to app if already logged in
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

// Public Route wrapper - shows different content based on auth
const PublicRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="h-screen overflow-y-auto">
      <HomePage onGetStarted={() => window.location.href = '/auth'} />
    </div>
  );
};

// Main App Route
const AppRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <MainApp user={user} />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicRoute />} />

      {/* Auth Route */}
      <Route
        path="/auth"
        element={
          <AuthRoute>
            <AuthPage onBack={() => window.location.href = '/'} />
          </AuthRoute>
        }
      />

      {/* Main App Route */}
      <Route path="/app" element={<AppRoute />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="prompts" element={<AdminPrompts />} />
        <Route path="models" element={<AdminModels />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  );
};

export default App;
