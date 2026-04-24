import { useEffect } from 'react';

export default function SEOHead({ title, description, author, tags, url, image, type = 'article' }) {
  useEffect(() => {
    document.title = title ? `${title} | The AI Brief` : 'The AI Brief';

    const setMeta = (name, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        if (name.startsWith('og:') || name.startsWith('article:')) {
          el.setAttribute('property', name);
        } else {
          el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('description', description);
    setMeta('author', author);
    if (tags?.length) setMeta('keywords', tags.join(', '));
    
    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:type', type);
    if (url) setMeta('og:url', url);
    if (image) setMeta('og:image', image);
    
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (image) setMeta('twitter:image', image);

    if (type === 'article') {
      if (author) setMeta('article:author', author);
      if (tags?.length) {
        tags.forEach(tag => setMeta('article:tag', tag));
      }
    }

    // JSON-LD structured data
    let scriptEl = document.querySelector('script[data-seo="blog"]');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.setAttribute('type', 'application/ld+json');
      scriptEl.setAttribute('data-seo', 'blog');
      document.head.appendChild(scriptEl);
    }
    
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': type === 'article' ? 'BlogPosting' : 'WebSite',
      headline: title,
      description: description,
      author: author ? { '@type': 'Person', name: author } : undefined,
      image: image,
      url: url || window.location.href,
    };
    scriptEl.textContent = JSON.stringify(jsonLd);

    return () => {
      const seoScript = document.querySelector('script[data-seo="blog"]');
      if (seoScript) seoScript.remove();
    };
  }, [title, description, author, tags, url, image, type]);

  return null;
}