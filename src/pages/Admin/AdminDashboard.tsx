import React, { useState, useEffect } from 'react'
import {
  MessageSquareText,
  Bot,
  Users,
  Activity
} from 'lucide-react'
import { supabase } from '../../lib/supabase.ts'

interface Stats {
  totalPrompts: number
  activePrompts: number
  totalModels: number
  enabledModels: number
  totalUsers: number
  adminUsers: number
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalPrompts: 0,
    activePrompts: 0,
    totalModels: 0,
    enabledModels: 0,
    totalUsers: 0,
    adminUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch prompts stats
        const { data: prompts } = await supabase
          .from('app_prompts')
          .select('is_active')

        // Fetch models stats
        const { data: models } = await supabase
          .from('app_models')
          .select('is_enabled')

        // Fetch users stats
        const { data: users } = await supabase
          .from('user_profiles')
          .select('is_admin')

        setStats({
          totalPrompts: prompts?.length ?? 0,
          activePrompts: prompts?.filter(p => p.is_active).length ?? 0,
          totalModels: models?.length ?? 0,
          enabledModels: models?.filter(m => m.is_enabled).length ?? 0,
          totalUsers: users?.length ?? 0,
          adminUsers: users?.filter(u => u.is_admin).length ?? 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'Prompts',
      value: stats.totalPrompts,
      subtitle: `${stats.activePrompts} active`,
      icon: MessageSquareText,
      color: 'bg-blue-500',
    },
    {
      title: 'Models',
      value: stats.totalModels,
      subtitle: `${stats.enabledModels} enabled`,
      icon: Bot,
      color: 'bg-purple-500',
    },
    {
      title: 'Users',
      value: stats.totalUsers,
      subtitle: `${stats.adminUsers} admin${stats.adminUsers !== 1 ? 's' : ''}`,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: 'System Status',
      value: 'Online',
      subtitle: 'All systems operational',
      icon: Activity,
      color: 'bg-[#FF8811]',
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800">Dashboard</h1>
        <p className="text-stone-600 mt-1">
          Overview of your MUMBAAI configuration
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-12 w-12 bg-stone-200 rounded-xl mb-4"></div>
              <div className="h-8 w-16 bg-stone-200 rounded mb-2"></div>
              <div className="h-4 w-24 bg-stone-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center mb-4`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-stone-800 mb-1">
                {card.value}
              </div>
              <div className="text-sm text-stone-500">{card.subtitle}</div>
              <div className="text-xs text-stone-400 mt-2">{card.title}</div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-stone-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/prompts"
            className="bg-white rounded-xl p-4 hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <MessageSquareText className="w-5 h-5 text-blue-500 group-hover:text-white" />
            </div>
            <div>
              <div className="font-medium text-stone-800">Manage Prompts</div>
              <div className="text-sm text-stone-500">Edit system prompts</div>
            </div>
          </a>

          <a
            href="/admin/models"
            className="bg-white rounded-xl p-4 hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors">
              <Bot className="w-5 h-5 text-purple-500 group-hover:text-white" />
            </div>
            <div>
              <div className="font-medium text-stone-800">Manage Models</div>
              <div className="text-sm text-stone-500">Configure LLM models</div>
            </div>
          </a>

          <a
            href="/admin/users"
            className="bg-white rounded-xl p-4 hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-colors">
              <Users className="w-5 h-5 text-green-500 group-hover:text-white" />
            </div>
            <div>
              <div className="font-medium text-stone-800">Manage Users</div>
              <div className="text-sm text-stone-500">View and edit users</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
