import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'Employee' | 'Manager' | 'Admin';

export interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: AppRole;
  status: string;
  org_id: string;
  employee_code: string | null;
  joining_date: string | null;
  manager_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  employee: Employee | null;
  role: AppRole | null;
  orgId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; redirectPath?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const getRedirectPath = (role: AppRole): string => {
  switch (role) {
    case 'Admin':
      return '/app/directory';
    case 'Manager':
      return '/app/team';
    case 'Employee':
    default:
      return '/app';
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployee = async (userId: string): Promise<Employee | null> => {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('*')
        .eq('user_id', userId)
        .single(); // Changed from maybeSingle to single

      if (error) {
        console.error('Error fetching employee:', error);
        return null;
      }

      return data as Employee | null;
    } catch (err) {
      console.error('Exception fetching employee:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initialize session on mount
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const emp = await fetchEmployee(session.user.id);
          
          if (!mounted) return;

          if (emp && emp.status === 'Active') {
            setEmployee(emp);
          } else {
            // Employee not found or inactive - sign out
            console.log('Employee not found or inactive, signing out');
            await supabase.auth.signOut();
            setEmployee(null);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          const emp = await fetchEmployee(session.user.id);
          
          if (!mounted) return;

          if (emp && emp.status === 'Active') {
            setEmployee(emp);
          } else {
            console.log('Employee not found or inactive after sign in');
            await supabase.auth.signOut();
            setEmployee(null);
          }
        } else if (event === 'SIGNED_OUT') {
          setEmployee(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: Error | null; redirectPath?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error as Error };
      }

      if (!data.user || !data.session) {
        return { error: new Error('Login failed') };
      }

      // Fetch employee record
      const emp = await fetchEmployee(data.user.id);
      
      if (!emp) {
        // No employee record - sign out and return error
        await supabase.auth.signOut();
        return { error: new Error('You are not onboarded. Please contact HR.') };
      }

      if (emp.status !== 'Active') {
        // Inactive employee - sign out and return error
        await supabase.auth.signOut();
        return { error: new Error('Your account is inactive. Please contact HR.') };
      }

      // Set employee state immediately
      setEmployee(emp);
      setUser(data.user);
      setSession(data.session);
      
      const redirectPath = getRedirectPath(emp.role as AppRole);
      
      return { error: null, redirectPath };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: new Error('An unexpected error occurred during login') };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setEmployee(null);
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    employee,
    role: employee?.role as AppRole | null,
    orgId: employee?.org_id ?? null,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
