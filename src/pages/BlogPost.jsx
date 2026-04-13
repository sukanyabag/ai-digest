import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Clock, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { parseFrontmatter, extractHeadings } from '../lib/markdown';
import MarkdownRenderer from '../components/MarkdownRenderer';
import TableOfContents from '../components/TableOfContents';
import SEOHead from '../components/SEOHead';
import GoToTop from '../components/GoToTop';
import Comments from '../components/Comments';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      setPost(data || null);
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Article not found</h1>
        <Link to="/blog" className="text-primary hover:underline">← Back to articles</Link>
      </div>
    );
  }

  const { content: markdownBody } = parseFrontmatter(post.content);
  const headings = extractHeadings(markdownBody);
  const date = post.published_date ? format(new Date(post.published_date), 'MMMM d, yyyy') : '';

  return (
    <>
      <GoToTop />
      <SEOHead
        title={post.title}
        description={post.description}
        author={post.author}
        tags={post.tags}
        image={post.cover_image}
        type="article"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to articles
        </Link>
        <div className="flex gap-12">
          <aside className="hidden xl:block w-64 flex-shrink-0">
            <TableOfContents headings={headings} />
          </aside>
          <div className="flex-1 min-w-0 max-w-3xl">
            <header className="mb-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {post.category && (
                  <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
                    {post.category}
                  </span>
                )}
                {date && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />{date}
                  </span>
                )}
                {post.reading_time && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />{post.reading_time} min read
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight mb-4">
                {post.title}
              </h1>
              {post.description && (
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">{post.description}</p>
              )}
              {post.author && (
                <div className="flex items-center gap-3 pb-6 border-b border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {post.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{post.author}</p>
                    <p className="text-xs text-muted-foreground">Author</p>
                  </div>
                </div>
              )}
              {post.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {post.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-secondary text-muted-foreground rounded-md">
                      <Tag className="w-3 h-3" />{tag}
                    </span>
                  ))}
                </div>
              )}
            </header>
            {post.cover_image && (
              <div className="rounded-2xl overflow-hidden mb-10 border border-border/50">
                <img src={post.cover_image} alt={post.title} className="w-full" />
              </div>
            )}
            {headings.length > 0 && (
              <div className="xl:hidden mb-8 p-4 rounded-xl border border-border/50 bg-secondary/30">
                <TableOfContents headings={headings} collapsible />
              </div>
            )}
            <MarkdownRenderer content={markdownBody} />
            <Comments postSlug={post.slug} />
          </div>
        </div>
      </div>
    </>
  );
}