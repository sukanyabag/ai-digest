import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react';
import BlogCard from '../components/BlogCard';
import CategoryFilter from '../components/CategoryFilter';
import SEOHead from '../components/SEOHead';

export default function BlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_date', { ascending: false })
        .limit(100);
      setPosts(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(posts.map(p => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    let result = posts;
    if (selectedCategory) result = result.filter(p => p.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [posts, selectedCategory, search]);

  return (
    <>
      <SEOHead title="Articles" description="Browse all articles on technology, design, and more." type="website" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">Articles</h1>
          <p className="text-muted-foreground">{posts.length} article{posts.length !== 1 ? 's' : ''} published</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
            />
          </div>
        </div>
        {categories.length > 0 && (
          <div className="mb-8">
            <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              {search || selectedCategory ? 'No articles match your filter.' : 'No articles published yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(post => (<BlogCard key={post.id} post={post} />))}
          </div>
        )}
      </div>
    </>
  );
}