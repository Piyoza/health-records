import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { Session } from '@supabase/supabase-js';

import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] =
    useState<Session | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    console.log('AUTH PROVIDER: started');

    // =========================================
    // INITIAL SESSION
    // =========================================

    const loadSession = async () => {
      console.log('AUTH: getting session...');

      try {
        const {
          data,
          error,
        } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (error) {
          console.error(
            'AUTH GET SESSION ERROR:',
            error.message
          );

          setSession(null);
        } else {
          console.log(
            'AUTH SESSION:',
            data.session
              ? 'USER IS LOGGED IN'
              : 'NO USER SESSION'
          );

          setSession(data.session);
        }
      } catch (error) {
        console.error(
          'AUTH SESSION EXCEPTION:',
          error
        );

        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          console.log(
            'AUTH: setting loading to FALSE'
          );

          setLoading(false);
        }
      }
    };

    loadSession();

    // =========================================
    // AUTH STATE LISTENER
    // =========================================

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log(
          'AUTH STATE CHANGE:',
          event
        );

        if (!mounted) {
          return;
        }

        // PASSWORD RECOVERY
        if (event === 'PASSWORD_RECOVERY') {
          console.log(
            'AUTH: password recovery session detected'
          );
        }

        setSession(newSession);
        setLoading(false);
      }
    );

    // =========================================
    // CLEANUP
    // =========================================

    return () => {
      console.log(
        'AUTH PROVIDER: cleanup'
      );

      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  // =========================================
  // SIGN OUT
  // =========================================

  const signOut = async () => {
    try {
      setLoading(true);

      console.log(
        'AUTH: signing out...'
      );

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          'SIGN OUT ERROR:',
          error.message
        );
      }

      setSession(null);
    } catch (error) {
      console.error(
        'SIGN OUT EXCEPTION:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}