import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase.ts'
import type { User } from '@supabase/supabase-js'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check admin status from user_profiles table
  const checkAdminStatus = useCallback(async (userId: string) => {
    try {
      console.log('Checking admin status for user:', userId)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()

      console.log('Admin check result:', { data, error })

      if (error) {
        // If no profile exists, create one
        if (error.code === 'PGRST116') {
          console.log('No profile found, creating one...')
          await supabase
            .from('user_profiles')
            .insert({ id: userId, is_admin: false })
          setIsAdmin(false)
        } else {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
        }
      } else {
        console.log('Setting isAdmin to:', data?.is_admin)
        setIsAdmin(data?.is_admin ?? false)
      }
    } catch (err) {
      console.error('Error checking admin status:', err)
      setIsAdmin(false)
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        await checkAdminStatus(currentUser.id)
      } else {
        setIsAdmin(false)
      }

      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          await checkAdminStatus(currentUser.id)
        } else {
          setIsAdmin(false)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [checkAdminStatus])

  return { user, isAdmin, loading }
}