import { Link } from 'react-router-dom';
import { Clock, ArrowUpRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function BlogCard({ post, featured = false }) {
  const date = post.published_date ? format(new Date(post.published_date), 'MMM d, yyyy') : '';

  if (featured) {
    return (
      <Link to={`/blog/${post.slug}`} className="group block">
        <article className="relative overflow-hidden rounded-2xl border border-border/50 bg-card hover:border-border transition-all duration-500 hover:shadow-lg">
          {post.cover_image && (
            <div className="aspect-[21/9] overflow-hidden">
              <img
                src={post.cover_image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          )}
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              {post.category && (
                <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
                  {post.category}
                </span>
              )}
              {date && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {date}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 group-hover:text-primary/80 transition-colors line-clamp-2">
              {post.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-2">
              {post.description}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {post.author && (
                  <span className="text-sm font-medium text-foreground">{post.author}</span>
                )}
                {post.reading_time && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" /> {post.reading_time} min read
                  </span>
                )}
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/blog/${post.slug}`} className="group block">
      <article className="relative overflow-hidden rounded-xl border border-border/50 bg-card hover:border-border transition-all duration-500 hover:shadow-md h-full flex flex-col">
        {post.cover_image && (
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        )}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3">
            {post.category && (
              <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary rounded-full">
                {post.category}
              </span>
            )}
            {date && (
              <span className="text-[11px] text-muted-foreground">{date}</span>
            )}
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary/80 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1 line-clamp-3">
            {post.description}
          </p>
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <span className="text-xs font-medium text-foreground">{post.author}</span>
            {post.reading_time && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" /> {post.reading_time} min
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}