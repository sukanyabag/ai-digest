import { useState, useEffect } from 'react';
import { List, ChevronDown } from 'lucide-react';

export default function TableOfContents({ headings, collapsible = false }) {
  const [activeId, setActiveId] = useState('');
  const [open, setOpen] = useState(!collapsible);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (collapsible) setOpen(false);
  };

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
      <button
        onClick={() => collapsible && setOpen(v => !v)}
        className={`flex items-center gap-2 w-full mb-3 pb-3 border-b border-border/50 ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <List className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex-1 text-left">
          On this page
        </span>
        {collapsible && (
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        )}
      </button>
      {open && (
        <ul className="space-y-1">
          {headings.map(({ level, text, id }) => (
            <li key={id}>
              <button
                onClick={() => scrollTo(id)}
                className={`block w-full text-left text-sm py-1.5 transition-all duration-200 hover:text-foreground ${
                  activeId === id
                    ? 'text-foreground font-medium border-l-2 border-primary'
                    : 'text-muted-foreground border-l-2 border-transparent'
                }`}
                style={{ paddingLeft: `${(level - 1) * 12 + 12}px` }}
              >
                {text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}