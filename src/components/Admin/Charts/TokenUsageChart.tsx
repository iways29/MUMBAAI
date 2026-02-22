import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AdminService, UserTokenUsage } from '../../../services/adminService.ts';

const TokenUsageChart: React.FC = () => {
  const [data, setData] = useState<UserTokenUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usageData = await AdminService.getTokenUsagePerUser();
        // Take top 10 users
        setData(usageData.slice(0, 10));
      } catch (error) {
        console.error('Error fetching token usage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No token usage data available yet
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((item, index) => ({
    name: `User ${index + 1}`,
    totalTokens: item.totalTokens,
    messages: item.messageCount,
    avgTokens: item.avgTokensPerMessage,
    userId: item.userId.slice(0, 8) + '...',
  }));

  const formatTokens = (value: number) => {
    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
    return value.toString();
  };

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 60, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={{ stroke: '#E5E7EB' }}
            tickFormatter={formatTokens}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'totalTokens') return [formatTokens(value), 'Total Tokens'];
              return [value, name];
            }}
            labelFormatter={(label) => `${label}`}
          />
          <Bar
            dataKey="totalTokens"
            fill="#06B6D4"
            radius={[0, 4, 4, 0]}
            name="totalTokens"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TokenUsageChart;
