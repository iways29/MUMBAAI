import React from 'react'
import { NavLink, Outlet, Navigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquareText,
  Bot,
  Users,
  ArrowLeft,
  Shield
} from 'lucide-react'
import { useAdmin } from '../../hooks/useAdmin.ts'

const AdminLayout: React.FC = () => {
  const { isAdmin, loading, user } = useAdmin()

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FFF8F0]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8811] mx-auto mb-4"></div>
          <p className="text-stone-600">Checking admin access...</p>
        </div>
      </div>
    )
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/" replace />
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FFF8F0]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Access Denied</h1>
          <p className="text-stone-600 mb-6">
            You don't have permission to access the admin console.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF8811] text-white rounded-xl hover:bg-[#e67a0f] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </a>
        </div>
      </div>
    )
  }

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/prompts', icon: MessageSquareText, label: 'Prompts' },
    { to: '/admin/models', icon: Bot, label: 'Models' },
    { to: '/admin/users', icon: Users, label: 'Users' },
  ]

  return (
    <div className="flex h-screen bg-[#FFF8F0]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF8811] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-stone-800">Admin Console</h1>
              <p className="text-xs text-stone-500">MUMBAAI</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#FF8811] text-white shadow-lg shadow-[#FF8811]/25'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200">
          <a
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-100 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to App</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
