import React from 'react'
import { NavLink, Outlet, Navigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquareText,
  Bot,
  Users,
  ArrowLeft,
  Shield,
  Layers,
  Activity
} from 'lucide-react'
import { useAdmin } from '../../hooks/useAdmin.ts'

const AdminLayout: React.FC = () => {
  const { isAdmin, loading, user } = useAdmin()

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-void">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-10 w-10 border-2 mx-auto mb-4"
            style={{ borderColor: 'var(--color-hairline)', borderTopColor: 'var(--color-plum)' }}
          ></div>
          <p className="text-ash text-sm">Checking admin access…</p>
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
      <div className="flex items-center justify-center h-screen bg-void">
        <div className="text-center p-8 border border-hairline rounded-node max-w-md">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full border border-hairline flex items-center justify-center">
            <Shield size={22} className="text-danger" />
          </div>
          <h1 className="text-[22px] font-extralight text-bone tracking-display mb-2">Access denied</h1>
          <p className="text-ash text-[14px] mb-6">
            You don't have permission to access the admin console.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-pill border border-hairline hover:border-hairline-strong text-bone text-[12px] font-semibold uppercase tracking-kicker transition-colors duration-fast"
          >
            <ArrowLeft size={14} />
            Back to App
          </a>
        </div>
      </div>
    )
  }

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/activation', icon: Activity, label: 'Activation' },
    { to: '/admin/prompts', icon: MessageSquareText, label: 'Prompts' },
    { to: '/admin/models', icon: Bot, label: 'Models' },
    { to: '/admin/tiers', icon: Layers, label: 'Tiers' },
    { to: '/admin/users', icon: Users, label: 'Users' },
  ]

  return (
    <div className="flex h-screen bg-void">
      {/* Sidebar */}
      <aside className="w-60 bg-void border-r border-hairline flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-hairline">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-hairline flex items-center justify-center">
              <Shield size={16} className="text-plum" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-bone tracking-body">Admin Console</h1>
              <p className="text-[11px] text-smoke uppercase tracking-kicker">MUMBAAI</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-node border transition-colors duration-fast text-[13px] ${
                      isActive
                        ? 'border-hairline text-bone'
                        : 'border-transparent text-smoke hover:text-bone hover:bg-panel'
                    }`
                  }
                  style={({ isActive }) =>
                    isActive ? { background: 'var(--color-plum-soft)' } : undefined
                  }
                >
                  <item.icon size={16} />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-hairline">
          <a
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-node text-smoke hover:text-bone hover:bg-panel transition-colors duration-fast text-[13px]"
          >
            <ArrowLeft size={16} />
            <span className="font-medium">Back to App</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-void">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
