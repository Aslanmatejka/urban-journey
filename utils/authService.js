import supabase from './supabaseClient.js'
import { reportError } from './helpers.js'

class AuthService {
  constructor() {
    this.currentUser = null
    this.isAuthenticated = false
    this.isAdmin = false
    this.listeners = []
    
    // Initialize auth state
    this.init()
  }

  async init() {
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await this.setUser(session.user)
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await this.setUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          this.clearUser()
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      reportError(error)
    }
  }

  async setUser(user) {
    try {
      // Get user profile from database
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" - this is expected for new users
        console.error('Error fetching user profile:', error)
        return
      }

      // If no profile exists, create one manually (in case the trigger didn't fire)
      if (!profile) {
        console.log('No profile found, creating user profile...')
        
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email,
              account_type: user.user_metadata?.account_type || 'individual',
              avatar_url: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.name || user.email)}&background=random`,
              role: 'user',
              status: 'active'
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating user profile:', createError)
            // Use auth data only if profile creation fails
            this.currentUser = {
              ...user,
              name: user.user_metadata?.name || user.email,
              account_type: user.user_metadata?.account_type || 'individual',
              role: 'user',
              status: 'active'
            }
          } else {
            console.log('User profile created successfully')
            this.currentUser = {
              ...user,
              ...newProfile
            }

            // Also create initial user stats
            try {
              await supabase
                .from('user_stats')
                .insert({
                  user_id: user.id,
                  total_donations: 0,
                  total_trades: 0,
                  total_food_saved: 0.0,
                  total_impact_score: 0
                })
            } catch (statsError) {
              console.warn('Error creating user stats:', statsError)
            }
          }
        } catch (createError) {
          console.error('Error creating user profile:', createError)
          // Use auth data only if profile creation fails
          this.currentUser = {
            ...user,
            name: user.user_metadata?.name || user.email,
            account_type: user.user_metadata?.account_type || 'individual',
            role: 'user',
            status: 'active'
          }
        }
      } else {
        this.currentUser = {
          ...user,
          ...profile
        }
      }

      this.isAuthenticated = true
      this.isAdmin = this.currentUser.role === 'admin'
      
      // Store in localStorage for persistence
      localStorage.setItem('userAuthenticated', 'true')
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
      if (this.isAdmin) {
        localStorage.setItem('adminAuthenticated', 'true')
        localStorage.setItem('adminUser', JSON.stringify(this.currentUser))
      }

      this.notifyListeners()
    } catch (error) {
      console.error('Error setting user:', error)
      reportError(error)
    }
  }

  clearUser() {
    this.currentUser = null
    this.isAuthenticated = false
    this.isAdmin = false
    
    localStorage.removeItem('userAuthenticated')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('adminAuthenticated')
    localStorage.removeItem('adminUser')
    
    this.notifyListeners()
  }

  async signUp(userData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            account_type: userData.accountType
          }
        }
      })

      if (error) throw error

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Sign up error:', error)
      reportError(error)
      throw error
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Sign in error:', error)
      reportError(error)
      throw error
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      this.clearUser()
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      reportError(error)
      throw error
    }
  }

  async updateProfile(updates) {
    try {
      if (!this.currentUser) throw new Error('No user logged in')

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', this.currentUser.id)

      if (error) throw error

      // Update local user data
      this.currentUser = { ...this.currentUser, ...updates }
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser))
      
      this.notifyListeners()
      return { success: true }
    } catch (error) {
      console.error('Profile update error:', error)
      reportError(error)
      throw error
    }
  }

  async uploadAvatar(file) {
    try {
      if (!this.currentUser) throw new Error('No user logged in')

      const fileExt = file.name.split('.').pop()
      const fileName = `${this.currentUser.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user profile with new avatar URL
      await this.updateProfile({ avatar_url: publicUrl })

      return { success: true, avatarUrl: publicUrl }
    } catch (error) {
      console.error('Avatar upload error:', error)
      reportError(error)
      throw error
    }
  }

  async refreshAuthState() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await this.setUser(session.user)
      } else {
        this.clearUser()
      }
    } catch (error) {
      console.error('Auth refresh error:', error)
      reportError(error)
    }
  }

  getCurrentUser() {
    return this.currentUser
  }

  isUserAuthenticated() {
    return this.isAuthenticated
  }

  isUserAdmin() {
    return this.isAdmin
  }

  addListener(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          user: this.currentUser,
          isAuthenticated: this.isAuthenticated,
          isAdmin: this.isAdmin
        })
      } catch (error) {
        console.error('Auth listener error:', error)
      }
    })
  }

  // Password reset functionality
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      reportError(error)
      throw error
    }
  }

  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Password update error:', error)
      reportError(error)
      throw error
    }
  }
}

// Create singleton instance
const authService = new AuthService()

export default authService 