import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Navbar from './Navbar';
import Footer from './Footer';
import { initTheme } from '../lib/theme';

export default function Layout() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    initTheme();
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setIsAdmin(true);
    };
    checkAdmin();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar isAdmin={isAdmin} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}