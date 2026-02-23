import React, { useState, useEffect } from 'react'
import {
  Users,
  Shield,
  ShieldOff,
  Mail,
  Calendar
} from 'lucide-react'
import { supabase } from '../../lib/supabase.ts'

interface UserProfile {
  id: string
  email: string
  display_name: string | null
  is_admin: boolean
  created_at: string
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data ?? [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const toggleAdmin = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: !currentState })
        .eq('id', id)

      if (error) throw error

      setUsers(users.map(u =>
        u.id === id ? { ...u, is_admin: !currentState } : u
      ))
    } catch (error) {
      console.error('Error toggling admin:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-stone-200 rounded"></div>
          <div className="h-4 w-64 bg-stone-200 rounded"></div>
          <div className="space-y-3 mt-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-stone-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const adminCount = users.filter(u => u.is_admin).length
  const totalCount = users.length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-stone-800">Users</h1>
        </div>
        <p className="text-stone-600">
          {totalCount} users total, {adminCount} admin{adminCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-stone-600">User</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-stone-600">Joined</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-stone-600">Role</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-stone-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-stone-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center">
                      <span className="text-stone-600 font-medium">
                        {user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-stone-800">
                        {user.display_name || 'No name'}
                      </div>
                      <div className="text-sm text-stone-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-stone-600 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-stone-400" />
                    {formatDate(user.created_at)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.is_admin ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                      <Shield className="w-3 h-3" />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-sm font-medium">
                      User
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => toggleAdmin(user.id, user.is_admin)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      user.is_admin
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {user.is_admin ? (
                      <span className="flex items-center gap-1">
                        <ShieldOff className="w-4 h-4" />
                        Remove Admin
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        Make Admin
                      </span>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Warning */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <p className="text-sm text-yellow-700">
          <strong>Warning:</strong> Be careful when modifying admin privileges.
          Admins have full access to the admin console and can modify critical app configurations.
        </p>
      </div>
    </div>
  )
}

export default AdminUsers
