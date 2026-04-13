import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import { initTheme } from '../lib/theme';

export default function Layout() {
  const { user } = useAuth();

  useEffect(() => {
    initTheme();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Navbar isAdmin={!!user} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}