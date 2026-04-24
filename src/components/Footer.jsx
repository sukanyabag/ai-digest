import { Feather } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Feather className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} The AI Brief. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Articles</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}