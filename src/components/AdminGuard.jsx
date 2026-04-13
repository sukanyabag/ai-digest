import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AdminGuard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const validateSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session || error) {
        navigate('/admin/login');
        setChecking(false);
        return;
      }

      // Refresh session to validate token is still valid on Supabase
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (!data.session || refreshError) {
        // Session is invalid or user was deleted
        await supabase.auth.signOut();
        navigate('/admin/login');
      }
      
      setChecking(false);
    };

    validateSession();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <Outlet />;
}