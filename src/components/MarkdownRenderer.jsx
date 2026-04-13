import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import {
  Info, Flame, AlertTriangle, Zap, Pencil, CheckCircle2,
  HelpCircle, Bug, List, Quote, FileText, Star, BookOpen, Lightbulb,
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
// Mermaid diagram component
// ---------------------------------------------------------------------------
function MermaidDiagram({ chart, isDark }) {
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

  return <div ref={containerRef} className="my-6 overflow-x-auto flex justify-center" />;
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------
export default function MarkdownRenderer({ content }) {
  const isDark = useIsDark();

  return (
    <div className="markdown-body text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkCallouts, remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => {
            const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return <h1 id={id} className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-8 mb-4 scroll-mt-24">{children}</h1>;
          },
          h2: ({ children }) => {
            const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return <h2 id={id} className="text-2xl font-bold tracking-tight text-foreground mt-12 mb-4 pb-2 border-b border-border/50 scroll-mt-24">{children}</h2>;
          },
          h3: ({ children }) => {
            const id = String(children).toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
            return <h3 id={id} className="text-xl font-semibold text-foreground mt-8 mb-3 scroll-mt-24">{children}</h3>;
          },
          h4: ({ children }) => <h4 className="text-lg font-semibold text-foreground mt-6 mb-2">{children}</h4>,
          p: ({ children }) => <p className="text-muted-foreground leading-relaxed mb-5">{children}</p>,
          a: ({ href, children }) => <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity" target="_blank" rel="noopener noreferrer">{children}</a>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
          pre: ({ children }) => <>{children}</>,
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            if (!className) {
              return (
                <code className="text-sm bg-secondary text-foreground px-1.5 py-0.5 rounded font-mono before:content-none after:content-none">
                  {children}
                </code>
              );
            }
            if (lang === 'mermaid') {
              return <MermaidDiagram chart={String(children).trim()} isDark={isDark} />;
            }
            return (
              <SyntaxHighlighter
                language={lang || 'text'}
                style={isDark ? vscDarkPlus : vs}
                customStyle={{
                  borderRadius: '0.75rem',
                  margin: '1.5rem 0',
                  fontSize: '0.875rem',
                  border: '1px solid hsl(var(--border) / 0.5)',
                }}
                codeTagProps={{ style: {} }}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            );
          },
          blockquote({ node, children }) {
            const calloutType = node?.properties?.['data-callout'];

            // Plain blockquote — no [!type] detected
            if (!calloutType) {
              return (
                <blockquote className="border-l-4 border-primary/40 pl-4 py-2 my-6 bg-secondary/40 rounded-r-lg text-muted-foreground italic">
                  {children}
                </blockquote>
              );
            }

            const cfg = CALLOUTS[calloutType] ?? CALLOUTS.note;

            // children[0] is the first <p> rendered by our `p` component.
            // Its props.children hold the title content (already stripped of [!type]).
            const rawTitle = children[0]?.props?.children;
            const titleContent = rawTitle
              ? (Array.isArray(rawTitle) ? rawTitle : [rawTitle]).filter(Boolean)
              : null;
            const hasTitle = titleContent && titleContent.length > 0 &&
              !(titleContent.length === 1 && titleContent[0] === '');

            const body = children.slice(1);

            return (
              <div className={`my-6 rounded-xl border-l-4 ${cfg.border} ${cfg.bg} overflow-hidden`}>
                {/* Callout header */}
                <div className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm ${cfg.title}`}>
                  {cfg.icon}
                  <span>{hasTitle ? titleContent : cfg.label}</span>
                </div>
                {/* Callout body */}
                {body.length > 0 && (
                  <div className="px-4 pb-3 [&>p]:text-muted-foreground [&>p]:mb-2 [&>p:last-child]:mb-0 [&>p]:leading-relaxed [&>p]:text-sm">
                    {body}
                  </div>
                )}
              </div>
            );
          },
          ul: ({ children }) => <ul className="list-disc list-inside mb-5 space-y-1.5 text-muted-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-5 space-y-1.5 text-muted-foreground">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          hr: () => <hr className="border-border/50 my-8" />,
          img: ({ src, alt }) => <img src={src} alt={alt} className="rounded-xl shadow-md my-6 w-full border border-border/50" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full border border-border/50 rounded-lg overflow-hidden text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-secondary text-foreground font-semibold">{children}</thead>,
          tbody: ({ children }) => <tbody className="text-muted-foreground">{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-border/50">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-2 text-left">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
