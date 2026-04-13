import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Eye, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { parseFrontmatter, extractHeadings, calculateReadingTime, generateSlug } from '../lib/markdown';
import MarkdownRenderer from '../components/MarkdownRenderer';
import TableOfContents from '../components/TableOfContents';

export default function AdminEditor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  const [form, setForm] = useState({
    title: '', slug: '', description: '', category: '',
    author: '', tags: '', content: '', cover_image: '', status: 'draft',
  });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editId) {
      const load = async () => {
        const { data } = await supabase.from('blog_posts').select('*').eq('id', editId).single();
        if (data) {
          setForm({
            title: data.title || '',
            slug: data.slug || '',
            description: data.description || '',
            category: data.category || '',
            author: data.author || '',
            tags: (data.tags || []).join(', '),
            content: data.content || '',
            cover_image: data.cover_image || '',
            status: data.status || 'draft',
          });
        }
      };
      load();
    }
  }, [editId]);

  const updateField = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'title' && !editId) next.slug = generateSlug(value);
      return next;
    });
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `covers/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('blog-images').upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(data.path);
      setForm(prev => ({ ...prev, cover_image: publicUrl }));
    }
    setUploading(false);
  };

  const buildFrontmatter = () => {
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    let fm = '---\n';
    fm += `title: "${form.title}"\n`;
    if (form.description) fm += `description: "${form.description}"\n`;
    if (form.category) fm += `category: "${form.category}"\n`;
    if (form.author) fm += `author: "${form.author}"\n`;
    if (tags.length) fm += `taxonomies:\n  tags: ${JSON.stringify(tags)}\n`;
    fm += '---\n\n';
    return fm;
  };

  const getContentBody = () => parseFrontmatter(form.content).content;

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: 'Title is required', variant: 'destructive' }); return; }
    if (!form.content.trim()) { toast({ title: 'Content is required', variant: 'destructive' }); return; }

    setSaving(true);
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const contentBody = getContentBody();
    const readingTime = calculateReadingTime(contentBody);

    const payload = {
      title: form.title,
      slug: form.slug || generateSlug(form.title),
      description: form.description,
      category: form.category,
      author: form.author,
      tags,
      content: form.content,
      cover_image: form.cover_image,
      status: form.status,
      reading_time: readingTime,
    };

    if (form.status === 'published') payload.published_date = new Date().toISOString();

    if (editId) {
      await supabase.from('blog_posts').update(payload).eq('id', editId);
    } else {
      await supabase.from('blog_posts').insert(payload);
    }

    toast({ title: editId ? 'Post updated!' : 'Post created!' });
    setSaving(false);
    navigate('/admin');
  };

  const previewContent = getContentBody();
  const headings = extractHeadings(previewContent);

  if (preview) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-foreground">Preview</h2>
          <Button variant="outline" onClick={() => setPreview(false)}>Back to Editor</Button>
        </div>
        <div className="flex gap-12">
          <aside className="hidden xl:block w-64 flex-shrink-0">
            <TableOfContents headings={headings} />
          </aside>
          <div className="flex-1 max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">{form.title}</h1>
            {form.description && <p className="text-lg text-muted-foreground mb-8">{form.description}</p>}
            <MarkdownRenderer content={previewContent} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSplitView(v => !v)} className="gap-2">
            <Eye className="w-4 h-4" />{splitView ? 'Hide Preview' : 'Split Preview'}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Your blog post title" className="mt-1.5 text-lg" />
        </div>
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input id="slug" value={form.slug} onChange={e => updateField('slug', e.target.value)} placeholder="url-friendly-slug" className="mt-1.5 font-mono text-sm" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label htmlFor="desc">Description</Label>
            <Input id="desc" value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Short description for SEO" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={form.category} onChange={e => updateField('category', e.target.value)} placeholder="e.g. programming" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="author">Author</Label>
            <Input id="author" value={form.author} onChange={e => updateField('author', e.target.value)} placeholder="Author name" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" value={form.tags} onChange={e => updateField('tags', e.target.value)} placeholder="react, javascript, design" className="mt-1.5" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => updateField('status', v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Cover Image</Label>
          <div className="mt-1.5 flex items-center gap-3">
            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Image'}
              <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            </label>
            {form.cover_image && (
              <img src={form.cover_image} alt="Cover" className="h-10 w-16 object-cover rounded-md border border-border" />
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="content">Content (Markdown)</Label>
            <button
              onClick={() => { if (!form.content.startsWith('---')) updateField('content', buildFrontmatter() + form.content); }}
              className="text-xs text-primary hover:underline"
            >
              Insert frontmatter template
            </button>
          </div>
          <div className={splitView ? 'grid grid-cols-2 gap-4' : ''}>
            <Textarea
              id="content"
              value={form.content}
              onChange={e => updateField('content', e.target.value)}
              placeholder={`---\ntitle: "Your title"\n---\n\n# Your content here...`}
              className="font-mono text-sm min-h-[400px] resize-y"
            />
            {splitView && (
              <div className="min-h-[400px] border border-border rounded-xl p-4 overflow-y-auto bg-background">
                {previewContent ? <MarkdownRenderer content={previewContent} /> : <p className="text-muted-foreground text-sm">Start typing to see the preview...</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}