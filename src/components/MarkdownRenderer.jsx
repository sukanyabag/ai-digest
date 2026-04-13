import ReactMarkdown from 'react-markdown';

export default function MarkdownRenderer({ content }) {
  return (
    <div className="markdown-body text-foreground">
      <ReactMarkdown
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
          code: ({ inline, children }) =>
            inline
              ? <code className="text-sm bg-secondary text-foreground px-1.5 py-0.5 rounded font-mono before:content-none after:content-none">{children}</code>
              : <code className="font-mono text-sm text-foreground">{children}</code>,
          pre: ({ children }) => (
            <pre className="bg-secondary border border-border/50 rounded-xl p-4 my-6 overflow-x-auto text-sm font-mono text-foreground">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/40 pl-4 py-2 my-6 bg-secondary/40 rounded-r-lg text-muted-foreground italic">
              {children}
            </blockquote>
          ),
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