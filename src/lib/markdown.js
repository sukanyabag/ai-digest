export function parseFrontmatter(markdown) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);
  
  if (!match) return { metadata: {}, content: markdown };
  
  const rawMeta = match[1];
  const content = match[2];
  const metadata = {};
  
  const lines = rawMeta.split('\n');
  let currentKey = null;
  let inTaxonomies = false;
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    if (line.match(/^taxonomies:\s*$/)) {
      inTaxonomies = true;
      continue;
    }
    
    if (inTaxonomies && line.match(/^\s+(\w+):\s*(.+)$/)) {
      const [, key, value] = line.match(/^\s+(\w+):\s*(.+)$/);
      try {
        metadata[key] = JSON.parse(value);
      } catch {
        metadata[key] = value.replace(/^["']|["']$/g, '');
      }
      continue;
    }
    
    if (inTaxonomies && !line.startsWith(' ')) {
      inTaxonomies = false;
    }
    
    const keyValueMatch = line.match(/^(\w+):\s*(.+)$/);
    if (keyValueMatch) {
      const [, key, value] = keyValueMatch;
      try {
        metadata[key] = JSON.parse(value);
      } catch {
        metadata[key] = value.replace(/^["']|["']$/g, '');
      }
      currentKey = key;
    }
  }
  
  return { metadata, content };
}

export function extractHeadings(markdown) {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings = [];
  let match;
  
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    headings.push({ level, text, id });
  }
  
  return headings;
}

export function calculateReadingTime(text) {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}