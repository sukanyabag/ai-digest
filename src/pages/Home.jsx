import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import SEOHead from '../components/SEOHead';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_date', { ascending: false })
        .limit(7);
      setPosts(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const featured = posts[0];
  const recent = posts.slice(1, 7);

  return (
    <>
      <SEOHead
        title="Home"
        description="Discover thoughtful articles on technology, design, and creativity."
        type="website"
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-sm text-muted-foreground mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Fresh perspectives, delivered weekly
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              <span className="text-foreground">Stories that shape</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">how we think.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mb-8">
              A curated collection of articles exploring technology, design, and the art of building meaningful things.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              <BookOpen className="w-4 h-4" />
              Browse all articles
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured + Recent */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No articles published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-12">
            {featured && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">Featured</h2>
                <BlogCard post={featured} featured />
              </div>
            )}
            {recent.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent Articles</h2>
                  <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    View all <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recent.map(post => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}