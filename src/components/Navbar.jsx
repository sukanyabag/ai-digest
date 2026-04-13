import { Link, useLocation } from 'react-router-dom';
import { PenLine, Feather } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import MobileMenu from './MobileMenu';

export default function Navbar({ isAdmin }) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/70 backdrop-blur-2xl shadow-[0_4px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.35)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg shadow-primary/30">
            <Feather className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
            AIDigest
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {[
            { to: '/', label: 'Home' },
            { to: '/blog', label: 'Articles' },
          ].map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <PenLine className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          )}
          <MobileMenu isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}