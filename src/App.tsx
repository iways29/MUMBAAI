import React, { useState, useEffect } from 'react';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Pages
import { HomePage, AuthPage, MainApp } from './pages/index.ts';
import AdminPage from './pages/AdminPage.tsx';

// Components
import { ErrorBoundary } from './components/UI/ErrorBoundary.tsx';

// Authentication
import { useAuth } from './hooks/useAuth.ts';

// Analytics
import GA4 from './services/ga4Service.ts';

const MUMBAAI: React.FC = () => {
  const { user, isAdmin, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<'home' | 'auth' | 'app' | 'admin'>('home');

  // Initialize GA4 on mount
  useEffect(() => {
    GA4.init();
  }, []);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in and wants to see admin page
  if (user && isAdmin && currentPage === 'admin') {
    return (
      <div className="h-screen overflow-y-auto">
        <AdminPage user={user} onBack={() => setCurrentPage('app')} />
      </div>
    );
  }

  // If user is logged in, show the main app
  if (user) {
    return (
      <MainApp
        user={user}
        isAdmin={isAdmin}
        onNavigateAdmin={() => setCurrentPage('admin')}
      />
    );
  }

  // Handle navigation for non-authenticated users
  if (currentPage === 'auth') {
    return (
      <AuthPage onBack={() => setCurrentPage('home')} />
    );
  }

  // Show home page by default
  return (
    <div className="h-screen overflow-y-auto">
      <HomePage onGetStarted={() => setCurrentPage('auth')} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <MUMBAAI />
      <Analytics />
      <SpeedInsights />
    </ErrorBoundary>
  );
};

export default App;