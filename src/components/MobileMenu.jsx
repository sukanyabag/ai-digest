import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, PenLine } from 'lucide-react';

export default function MobileMenu({ isAdmin }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/blog', label: 'Articles' },
  ];

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary text-foreground border border-border"
        aria-label="Toggle menu"
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border shadow-lg z-50 px-4 py-4 flex flex-col gap-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 mt-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
            >
              <PenLine className="w-4 h-4" />
              Dashboard
            </Link>
          )}
        </div>
      )}
    </div>
  );
}