import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Logger } from '@/lib/logging/Logger';
import type { UserProfile } from '@/types/auth';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle missing profiles

      if (error) {
        Logger.getInstance().error('Error fetching profile', { error, userId });
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (error) {
      Logger.getInstance().error('Error fetching profile', { error, userId });
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const updateApplicationStatusOnLogin = async (userId: string) => {
    try {
      // First get the profile ID from the user ID
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (profileError || !profileData) {
        console.log('No profile found for user:', userId);
        return;
      }

      // Check if user has a student application with registration_initiated status
      const { data: applicationData, error: applicationError } = await supabase
        .from('student_applications')
        .select('id, status')
        .eq('profile_id', profileData.id)
        .eq('status', 'registration_initiated')
        .maybeSingle();

      if (applicationData && !applicationError) {
        // Update status to registration_complete
        const { error: updateError } = await supabase
          .from('student_applications')
          .update({
            status: 'registration_complete',
            registration_completed: true,
          })
          .eq('id', applicationData.id);

        if (updateError) {
          Logger.getInstance().error(
            'Failed to update application status on login',
            {
              error: updateError,
            }
          );
        } else {
          Logger.getInstance().info(
            'Updated application status to registration_complete',
            {
              applicationId: applicationData.id,
              userId,
            }
          );
        }
      } else if (applicationError) {
        Logger.getInstance().error(
          'Error checking application status on login',
          {
            error: applicationError,
            userId,
          }
        );
      } else {
        // No application with registration_initiated status found - this is normal for users who are already past that stage
        Logger.getInstance().debug(
          'No application with registration_initiated status found',
          {
            userId,
            profileId: profileData.id,
          }
        );
      }
    } catch (error) {
      Logger.getInstance().error('Error updating application status on login', {
        error,
        userId,
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Defer profile fetching to avoid deadlocks
        setTimeout(() => {
          if (mounted) {
            fetchProfile(session.user.id);
            // Also check and update application status
            updateApplicationStatusOnLogin(session.user.id);
          }
        }, 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        // Also check and update application status
        updateApplicationStatusOnLogin(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      toast.success('You have been signed out successfully.');
      // Redirect to auth page after successful logout
      window.location.href = '/auth';
    } catch (error) {
      Logger.getInstance().error('Error signing out', {
        error,
        userId: user?.id,
      });
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const contextValue: AuthContextType = {
    user,
    session,
    profile,
    loading,
    profileLoading,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During development, provide a fallback to prevent crashes during hot reloads
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        'useAuth called outside AuthProvider - this may be due to hot reload'
      );
      return {
        user: null,
        session: null,
        profile: null,
        loading: true,
        profileLoading: false,
        signOut: async () => {},
        refreshProfile: async () => {},
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
