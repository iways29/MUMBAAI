import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import {
  ArrowLeft,
  Users,
  MessageSquare,
  Activity,
  Zap,
  GitBranch,
  Clock,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { AdminService, AdminOverviewMetrics } from '../services/adminService.ts';
import MetricCard from '../components/Admin/Dashboard/MetricCard.tsx';
import DAUChart from '../components/Admin/Charts/DAUChart.tsx';
import UserGrowthChart from '../components/Admin/Charts/UserGrowthChart.tsx';
import ModelUsageChart from '../components/Admin/Charts/ModelUsageChart.tsx';
import TokenUsageChart from '../components/Admin/Charts/TokenUsageChart.tsx';
import GA4 from '../services/ga4Service.ts';

interface AdminPageProps {
  user: User;
  onBack: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ user, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<AdminOverviewMetrics | null>(null);
  const [branchData, setBranchData] = useState<{ totalSplits: number; totalMerges: number; avgSplitsPerConversation: number; avgMergesPerConversation: number } | null>(null);
  const [tokenData, setTokenData] = useState<{ avgTokensPerConversation: number; totalTokens: number; totalConversations: number } | null>(null);

  const fetchData = async () => {
    try {
      const [overviewData, branches, tokens] = await Promise.all([
        AdminService.getOverviewMetrics(),
        AdminService.getSplitsAndCombines(),
        AdminService.getTokensPerConversation(),
      ]);

      setOverview(overviewData);
      setBranchData(branches);
      setTokenData(tokens);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    GA4.viewDashboard();
    GA4.pageView('/admin', 'Admin Dashboard');
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
                <p className="text-sm text-gray-500">Analytics & Metrics Dashboard</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Metrics Grid */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Users"
              value={overview?.totalUsers || 0}
              icon={<Users className="w-5 h-5" />}
              color="blue"
            />
            <MetricCard
              title="Daily Active Users"
              value={overview?.dailyActiveUsers || 0}
              subtitle="Today"
              icon={<Activity className="w-5 h-5" />}
              color="green"
            />
            <MetricCard
              title="Weekly Active Users"
              value={overview?.weeklyActiveUsers || 0}
              subtitle="Last 7 days"
              icon={<TrendingUp className="w-5 h-5" />}
              color="purple"
            />
            <MetricCard
              title="Monthly Active Users"
              value={overview?.monthlyActiveUsers || 0}
              subtitle="Last 30 days"
              icon={<TrendingUp className="w-5 h-5" />}
              color="indigo"
            />
          </div>
        </section>

        {/* Conversations & Messages */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Conversations"
              value={overview?.totalConversations || 0}
              icon={<MessageSquare className="w-5 h-5" />}
              color="cyan"
            />
            <MetricCard
              title="Total Messages"
              value={overview?.totalMessages || 0}
              icon={<MessageSquare className="w-5 h-5" />}
              color="teal"
            />
            <MetricCard
              title="Total Tokens Used"
              value={formatNumber(overview?.totalTokensUsed || 0)}
              icon={<Zap className="w-5 h-5" />}
              color="amber"
            />
            <MetricCard
              title="Avg Days Active"
              value={overview?.avgDaysActive || 0}
              subtitle="Per user"
              icon={<Clock className="w-5 h-5" />}
              color="rose"
            />
          </div>
        </section>

        {/* Branch Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Branching & Merging</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Splits"
              value={branchData?.totalSplits || 0}
              subtitle="Conversation branches"
              icon={<GitBranch className="w-5 h-5" />}
              color="violet"
            />
            <MetricCard
              title="Total Merges"
              value={branchData?.totalMerges || 0}
              subtitle="Branch combines"
              icon={<GitBranch className="w-5 h-5" />}
              color="fuchsia"
            />
            <MetricCard
              title="Avg Splits/Conv"
              value={branchData?.avgSplitsPerConversation || 0}
              icon={<GitBranch className="w-5 h-5" />}
              color="pink"
            />
            <MetricCard
              title="Avg Tokens/Conv"
              value={formatNumber(tokenData?.avgTokensPerConversation || 0)}
              icon={<Zap className="w-5 h-5" />}
              color="orange"
            />
          </div>
        </section>

        {/* Charts Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trends</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Daily Active Users</h3>
              <DAUChart />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">User Growth (Week over Week)</h3>
              <UserGrowthChart />
            </div>
          </div>
        </section>

        {/* Model & Token Usage */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">LLM Usage Distribution</h3>
              <ModelUsageChart />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">Token Usage by User</h3>
              <TokenUsageChart />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

// Helper function to format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default AdminPage;
