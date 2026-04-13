import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session || error) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Validate the session is still valid on Supabase
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (data.session && !refreshError) {
        setUser(data.session.user ?? null);
      } else {
        // Session invalid, clear it
        setUser(null);
        await supabase.auth.signOut();
      }
      setIsLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
