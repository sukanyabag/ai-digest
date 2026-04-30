import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';

const ListDepthCtx = createContext(0);
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import {
  Info, Flame, AlertTriangle, Zap, Pencil, CheckCircle2,
  HelpCircle, Bug, List, Quote, FileText, Star, BookOpen, Lightbulb, X,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Obsidian-style callout definitions
// ---------------------------------------------------------------------------
const CALLOUTS = {
  info:      { icon: <Info className="w-4 h-4 shrink-0" />,          label: 'Info',      border: 'border-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/40',     title: 'text-blue-600 dark:text-blue-400' },
  note:      { icon: <Pencil className="w-4 h-4 shrink-0" />,        label: 'Note',      border: 'border-slate-400',  bg: 'bg-slate-50 dark:bg-slate-800/40',   title: 'text-slate-600 dark:text-slate-300' },
  tip:       { icon: <Flame className="w-4 h-4 shrink-0" />,         label: 'Tip',       border: 'border-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40', title: 'text-orange-600 dark:text-orange-400' },
  hint:      { icon: <Lightbulb className="w-4 h-4 shrink-0" />,     label: 'Hint',      border: 'border-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/40', title: 'text-yellow-600 dark:text-yellow-400' },
  hot:       { icon: <Flame className="w-4 h-4 shrink-0" />,         label: 'Hot',       border: 'border-red-400',    bg: 'bg-red-50 dark:bg-red-950/40',       title: 'text-red-600 dark:text-red-400' },
  important: { icon: <Star className="w-4 h-4 shrink-0" />,          label: 'Important', border: 'border-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40', title: 'text-orange-600 dark:text-orange-400' },
  warning:   { icon: <AlertTriangle className="w-4 h-4 shrink-0" />, label: 'Warning',   border: 'border-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/40', title: 'text-yellow-600 dark:text-yellow-400' },
  caution:   { icon: <AlertTriangle className="w-4 h-4 shrink-0" />, label: 'Caution',   border: 'border-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/40', title: 'text-yellow-600 dark:text-yellow-400' },
  attention: { icon: <AlertTriangle className="w-4 h-4 shrink-0" />, label: 'Attention', border: 'border-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/40', title: 'text-yellow-600 dark:text-yellow-400' },
  danger:    { icon: <Zap className="w-4 h-4 shrink-0" />,           label: 'Danger',    border: 'border-red-500',    bg: 'bg-red-50 dark:bg-red-950/40',       title: 'text-red-600 dark:text-red-400' },
  error:     { icon: <Zap className="w-4 h-4 shrink-0" />,           label: 'Error',     border: 'border-red-500',    bg: 'bg-red-50 dark:bg-red-950/40',       title: 'text-red-600 dark:text-red-400' },
  success:   { icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,  label: 'Success',   border: 'border-green-400',  bg: 'bg-green-50 dark:bg-green-950/40',   title: 'text-green-600 dark:text-green-400' },
  check:     { icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,  label: 'Check',     border: 'border-green-400',  bg: 'bg-green-50 dark:bg-green-950/40',   title: 'text-green-600 dark:text-green-400' },
  done:      { icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,  label: 'Done',      border: 'border-green-400',  bg: 'bg-green-50 dark:bg-green-950/40',   title: 'text-green-600 dark:text-green-400' },
  question:  { icon: <HelpCircle className="w-4 h-4 shrink-0" />,    label: 'Question',  border: 'border-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40', title: 'text-purple-600 dark:text-purple-400' },
  faq:       { icon: <HelpCircle className="w-4 h-4 shrink-0" />,    label: 'FAQ',       border: 'border-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40', title: 'text-purple-600 dark:text-purple-400' },
  help:      { icon: <HelpCircle className="w-4 h-4 shrink-0" />,    label: 'Help',      border: 'border-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40', title: 'text-purple-600 dark:text-purple-400' },
  bug:       { icon: <Bug className="w-4 h-4 shrink-0" />,           label: 'Bug',       border: 'border-red-400',    bg: 'bg-red-50 dark:bg-red-950/40',       title: 'text-red-600 dark:text-red-400' },
  example:   { icon: <List className="w-4 h-4 shrink-0" />,          label: 'Example',   border: 'border-slate-400',  bg: 'bg-slate-50 dark:bg-slate-800/40',   title: 'text-slate-600 dark:text-slate-300' },
  quote:     { icon: <Quote className="w-4 h-4 shrink-0" />,         label: 'Quote',     border: 'border-slate-400',  bg: 'bg-slate-50 dark:bg-slate-800/40',   title: 'text-slate-600 dark:text-slate-300' },
  abstract:  { icon: <FileText className="w-4 h-4 shrink-0" />,      label: 'Abstract',  border: 'border-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/40',     title: 'text-blue-600 dark:text-blue-400' },
  summary:   { icon: <FileText className="w-4 h-4 shrink-0" />,      label: 'Summary',   border: 'border-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/40',     title: 'text-blue-600 dark:text-blue-400' },
  tldr:      { icon: <FileText className="w-4 h-4 shrink-0" />,      label: 'TL;DR',     border: 'border-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/40',     title: 'text-blue-600 dark:text-blue-400' },
  read:      { icon: <BookOpen className="w-4 h-4 shrink-0" />,      label: 'Read',      border: 'border-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/40',     title: 'text-blue-600 dark:text-blue-400' },
};

// ---------------------------------------------------------------------------
// Remark plugin — processes [!type] callouts at the MDAST level.
// Stamps data-callout on the blockquote's hProperties so the attribute
// survives into the HAST → React pipeline, and strips the [!type] prefix
// from the title text so the React component receives a clean title.
// Must run before remarkGfm to prevent remark-gfm from intercepting the
// GitHub-standard types (NOTE, TIP, IMPORTANT, WARNING, CAUTION).
// ---------------------------------------------------------------------------
function remarkCallouts() {
  return (tree) => {
    function walk(node) {
      if (node.type === 'blockquote') {
        const firstPara = node.children?.[0];
        if (firstPara?.type === 'paragraph') {
          const firstText = firstPara.children?.[0];
          if (firstText?.type === 'text') {
            const match = /^\[!(\w+)\]\s*/.exec(firstText.value);
            if (match) {
              // Tag the blockquote with the callout type
              node.data = node.data ?? {};
              node.data.hProperties = {
                ...(node.data.hProperties ?? {}),
                'data-callout': match[1].toLowerCase(),
              };
              // Strip "[!type] " from the leading text node
              firstText.value = firstText.value.slice(match[0].length);
              // Remove the node entirely if it became empty
              if (!firstText.value) {
                firstPara.children.splice(0, 1);
              }
            }
          }
        }
      }
      node.children?.forEach(walk);
    }
    walk(tree);
  };
}

// ---------------------------------------------------------------------------
// Theme helper
// ---------------------------------------------------------------------------
function useIsDark() {
  const [dark, setDark] = useState(
    () => document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);
  return dark;
}

// ---------------------------------------------------------------------------
// Lightbox overlay for enlarged images / diagrams
// ---------------------------------------------------------------------------
function Lightbox({ open, onClose, children, caption }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/20 hover:bg-background/40 text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      <div
        className="relative max-w-[94vw] max-h-[92vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        {caption && (
          <p className="mt-3 text-center text-sm text-white/80 italic max-w-2xl">{caption}</p>
        )}
      </div>
    </div>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Mermaid diagram component
// ---------------------------------------------------------------------------
function MermaidDiagram({ chart, isDark, onClick }) {
  const containerRef = useRef(null);
  const renderCount = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const current = ++renderCount.current;
    const id = `mermaid-${Date.now()}-${current}`;

    mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default' });

    mermaid
      .render(id, chart)
      .then(({ svg }) => {
        if (containerRef.current && renderCount.current === current)
          containerRef.current.innerHTML = svg;
      })
      .catch(() => {
        if (containerRef.current && renderCount.current === current)
          containerRef.current.innerHTML =
            `<pre class="text-sm text-muted-foreground p-4 bg-secondary rounded-xl overflow-x-auto">${chart}</pre>`;
      });
  }, [chart, isDark]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      className="my-6 overflow-x-auto flex justify-center cursor-pointer hover:opacity-80 transition-opacity"
      title="Click to enlarge"
    />
  );
}

// ---------------------------------------------------------------------------
// Enlarged mermaid inside lightbox — re-renders at full viewport size
// ---------------------------------------------------------------------------
function MermaidLightboxContent({ chart, isDark }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const id = `mermaid-lb-${Date.now()}`;
    mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default' });
    mermaid
      .render(id, chart)
      .then(({ svg }) => { if (containerRef.current) containerRef.current.innerHTML = svg; })
      .catch(() => {
        if (containerRef.current)
          containerRef.current.innerHTML =
            `<pre class="text-sm text-white/80 p-4">${chart}</pre>`;
      });
  }, [chart, isDark]);

  return (
    <div
      ref={containerRef}
      className="w-[90vw] h-[85vh] overflow-auto bg-background rounded-xl p-6 shadow-2xl border border-border/50 flex items-center justify-center [&_svg]:w-full [&_svg]:h-auto [&_svg]:max-h-[80vh]"
    />
  );
}

// ---------------------------------------------------------------------------
// Depth-aware list components
// ---------------------------------------------------------------------------
function MdUl({ children }) {
  const depth = useContext(ListDepthCtx);
  const cls = depth === 0
    ? 'list-disc list-outside pl-6 mb-5 space-y-1.5 text-muted-foreground'
    : 'list-[circle] list-outside pl-5 mt-1.5 mb-0 ml-4 space-y-1 text-muted-foreground';
  return (
    <ListDepthCtx.Provider value={depth + 1}>
      <ul className={cls}>{children}</ul>
    </ListDepthCtx.Provider>
  );
}

function MdOl({ children }) {
  const depth = useContext(ListDepthCtx);
  const cls = depth === 0
    ? 'list-decimal list-outside pl-6 mb-5 space-y-1.5 text-muted-foreground'
    : 'list-decimal list-outside pl-5 mt-1.5 mb-0 ml-4 space-y-1 text-muted-foreground';
  return (
    <ListDepthCtx.Provider value={depth + 1}>
      <ol className={cls}>{children}</ol>
    </ListDepthCtx.Provider>
  );
}

function MdLi({ children }) {
  return <li className="leading-relaxed [&>p]:mb-0 [&>p]:inline">{children}</li>;
}

// ---------------------------------------------------------------------------
// Stable plugin arrays (created once, never new references)
// ---------------------------------------------------------------------------
const REMARK_PLUGINS = [remarkCallouts, remarkGfm, remarkMath];
const REHYPE_PLUGINS = [rehypeKatex];

// ---------------------------------------------------------------------------
// Pure markdown components (no closures — stable across renders)
// ---------------------------------------------------------------------------
function MdH1({ children }) {
  const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  return <h1 id={id} className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-8 mb-4 scroll-mt-24">{children}</h1>;
}
function MdH2({ children }) {
  const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  return <h2 id={id} className="text-2xl font-bold tracking-tight text-foreground mt-12 mb-4 pb-2 border-b border-border/50 scroll-mt-24">{children}</h2>;
}
function MdH3({ children }) {
  const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  return <h3 id={id} className="text-xl font-semibold text-foreground mt-8 mb-3 scroll-mt-24">{children}</h3>;
}
function MdH4({ children }) { return <h4 className="text-lg font-semibold text-foreground mt-6 mb-2">{children}</h4>; }
function MdP({ children }) { return <p className="text-muted-foreground leading-relaxed mb-5">{children}</p>; }
function MdA({ href, children }) { return <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">{children}</a>; }
function MdStrong({ children }) { return <strong className="font-semibold text-foreground">{children}</strong>; }
function MdEm({ children }) { return <em className="italic text-muted-foreground">{children}</em>; }
function MdPre({ children }) { return <>{children}</>; }
function MdHr() { return <hr className="border-border/50 my-8" />; }
function MdTable({ children }) { return <div className="overflow-x-auto my-6"><table className="w-full border border-border/50 rounded-lg overflow-hidden text-sm">{children}</table></div>; }
function MdThead({ children }) { return <thead className="bg-secondary text-foreground font-semibold">{children}</thead>; }
function MdTbody({ children }) { return <tbody className="text-muted-foreground">{children}</tbody>; }
function MdTr({ children }) { return <tr className="border-b border-border/50">{children}</tr>; }
function MdTh({ children }) { return <th className="px-4 py-2 text-left">{children}</th>; }
function MdTd({ children }) { return <td className="px-4 py-2">{children}</td>; }

function MdBlockquote({ node, children }) {
  const calloutType = node?.properties?.['data-callout'];
  if (!calloutType) {
    return (
      <blockquote className="border-l-4 border-primary/40 pl-4 py-2 my-6 bg-secondary/40 rounded-r-lg text-muted-foreground italic">
        {children}
      </blockquote>
    );
  }
  const cfg = CALLOUTS[calloutType] ?? CALLOUTS.note;
  const rawTitle = children[0]?.props?.children;
  const titleContent = rawTitle
    ? (Array.isArray(rawTitle) ? rawTitle : [rawTitle]).filter(Boolean)
    : null;
  const hasTitle = titleContent && titleContent.length > 0 &&
    !(titleContent.length === 1 && titleContent[0] === '');
  const body = children.slice(1);
  return (
    <div className={`my-6 rounded-xl border-l-4 ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <div className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm ${cfg.title}`}>
        {cfg.icon}
        <span>{hasTitle ? titleContent : cfg.label}</span>
      </div>
      {body.length > 0 && (
        <div className="px-4 pb-3 [&>p]:text-muted-foreground [&>p]:mb-2 [&>p:last-child]:mb-0 [&>p]:leading-relaxed [&>p]:text-sm">
          {body}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------
export default React.memo(function MarkdownRenderer({ content }) {
  const isDark = useIsDark();
  const [lightbox, setLightbox] = useState(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const components = useMemo(() => ({
    h1: MdH1, h2: MdH2, h3: MdH3, h4: MdH4,
    p: MdP, a: MdA, strong: MdStrong, em: MdEm,
    pre: MdPre, hr: MdHr,
    ul: MdUl, ol: MdOl, li: MdLi,
    blockquote: MdBlockquote,
    table: MdTable, thead: MdThead, tbody: MdTbody, tr: MdTr, th: MdTh, td: MdTd,
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : '';
      if (!className) {
        return <code className="text-sm bg-secondary text-foreground px-1.5 py-0.5 rounded font-mono before:content-none after:content-none">{children}</code>;
      }
      if (lang === 'mermaid') {
        const chart = String(children).trim();
        return <MermaidDiagram chart={chart} isDark={isDark} onClick={() => setLightbox({ type: 'mermaid', chart })} />;
      }
      return (
        <SyntaxHighlighter language={lang || 'text'} style={isDark ? vscDarkPlus : vs}
          customStyle={{ borderRadius: '0.75rem', margin: '1.5rem 0', fontSize: '0.875rem', border: '1px solid hsl(var(--border) / 0.5)' }}
          codeTagProps={{ style: {} }}>
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    },
    img({ src, alt }) {
      let caption = alt || '';
      const sizeStyle = {};
      const sizeMatch = /^(.*?)\|\|(\d+)(?:x(\d+))?$/.exec(caption);
      if (sizeMatch) {
        caption = sizeMatch[1].trim();
        sizeStyle.width = sizeMatch[2] + 'px';
        if (sizeMatch[3]) sizeStyle.height = sizeMatch[3] + 'px';
      }
      const hasCaption = caption && caption !== 'image';
      const sized = Object.keys(sizeStyle).length > 0;
      const imgCls = sized
        ? 'rounded-xl shadow-md border border-border/50 cursor-pointer hover:opacity-90 transition-opacity object-contain'
        : 'rounded-xl shadow-md w-full border border-border/50 cursor-pointer hover:opacity-90 transition-opacity';
      const openImage = () => setLightbox({ type: 'image', src, caption: hasCaption ? caption : null });
      if (hasCaption) {
        return (
          <figure className={`my-6${sized ? ' flex flex-col items-center' : ''}`}>
            <img src={src} alt={caption} onClick={openImage} style={sizeStyle} className={imgCls} title="Click to enlarge" />
            <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">{caption}</figcaption>
          </figure>
        );
      }
      if (sized) {
        return <div className="my-6 flex justify-center"><img src={src} alt="" onClick={openImage} style={sizeStyle} className={imgCls} title="Click to enlarge" /></div>;
      }
      return <img src={src} alt="" onClick={openImage} className={`${imgCls} my-6`} title="Click to enlarge" />;
    },
  }), [isDark]);

  return (
    <div className="markdown-body text-foreground">
      <Lightbox open={!!lightbox} onClose={closeLightbox} caption={lightbox?.caption}>
        {lightbox?.type === 'image' && (
          <img src={lightbox.src} alt={lightbox.caption || ''} className="max-w-[85vw] max-h-[85vh] object-contain rounded-xl shadow-2xl" />
        )}
        {lightbox?.type === 'mermaid' && (
          <MermaidLightboxContent chart={lightbox.chart} isDark={isDark} />
        )}
      </Lightbox>
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
