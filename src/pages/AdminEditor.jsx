import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Eye, Upload, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { parseFrontmatter, extractHeadings, calculateReadingTime, generateSlug } from '../lib/markdown';
import MarkdownRenderer from '../components/MarkdownRenderer';
import TableOfContents from '../components/TableOfContents';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export default function AdminEditor() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  const [form, setForm] = useState({
    title: '', slug: '', description: '', category: '',
    author: '', tags: '', content: '', cover_image: '', status: 'draft',
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const [preview, setPreview] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const [initialForm, setInitialForm] = useState(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const contentRef = useRef(null);
  const inlineFileRef = useRef(null);
  const skipGuardRef = useRef(false);
  const sentinelRef = useRef(false);

  const isDirty = useMemo(
    () => initialForm !== null && JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm]
  );

  useEffect(() => {
    if (editId) {
      const load = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('blog_posts').select('*').eq('id', editId).single();
        if (!data || error) {
          toast.error('Post not found or was deleted');
          navigate('/admin');
          return;
        }
        const loaded = {
          title: data.title || '',
          slug: data.slug || '',
          description: data.description || '',
          category: data.category || '',
          author: data.author || '',
          tags: (data.tags || []).join(', '),
          content: data.content || '',
          cover_image: data.cover_image || '',
          status: data.status || 'draft',
        };
        setForm(loaded);
        setInitialForm(loaded);
        setLoading(false);
      };
      load();
    } else {
      setInitialForm({ ...form });
    }
  }, [editId, navigate]);

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

  const uploadInlineImage = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setInlineUploading(true);
    const ext = file.name?.split('.').pop() || 'png';
    const path = `content/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { data, error } = await supabase.storage.from('blog-images').upload(path, file, { upsert: true });
    if (error) {
      toast.error('Image upload failed');
      setInlineUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('blog-images').getPublicUrl(data.path);
    const textarea = contentRef.current;
    const cursorPos = textarea?.selectionStart ?? form.content.length;
    const imageTag = `\n![Enter caption](${publicUrl})\n`;
    const before = form.content.slice(0, cursorPos);
    const after = form.content.slice(cursorPos);
    const newContent = before + imageTag + after;
    updateField('content', newContent);
    setInlineUploading(false);
    toast.success('Image inserted');
    requestAnimationFrame(() => {
      if (textarea) {
        const captionStart = cursorPos + 3;
        const captionEnd = captionStart + 'Enter caption'.length;
        textarea.focus();
        textarea.setSelectionRange(captionStart, captionEnd);
      }
    });
  }, [form.content]);

  const handleContentDrop = useCallback((e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      e.preventDefault();
      uploadInlineImage(file);
    }
  }, [uploadInlineImage]);

  const handleContentDragOver = useCallback((e) => {
    if (e.dataTransfer?.types?.includes('Files')) {
      e.preventDefault();
    }
  }, []);

  const handleContentPaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) uploadInlineImage(file);
        return;
      }
    }
  }, [uploadInlineImage]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      if (skipGuardRef.current) return;
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:')) return;
      e.preventDefault();
      setPendingNavigation({ type: 'link', path: href });
      setShowLeaveDialog(true);
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [isDirty]);

  useEffect(() => {
    if (!isDirty) {
      if (sentinelRef.current) {
        sentinelRef.current = false;
        window.history.back();
      }
      return;
    }
    if (!sentinelRef.current) {
      window.history.pushState(null, '', window.location.href);
      sentinelRef.current = true;
    }
    const handler = () => {
      if (skipGuardRef.current) return;
      window.history.pushState(null, '', window.location.href);
      setPendingNavigation({ type: 'back' });
      setShowLeaveDialog(true);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [isDirty]);

  const attemptLeave = (path) => {
    if (!isDirty) { navigate(path); return; }
    setPendingNavigation({ type: 'link', path });
    setShowLeaveDialog(true);
  };

  const savePost = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return false; }
    if (!form.content.trim()) { toast.error('Content is required'); return false; }
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
    toast.success(editId ? 'Post updated!' : 'Post created!');
    setSaving(false);
    return true;
  };

  const handleSaveAndLeave = async () => {
    setShowLeaveDialog(false);
    const ok = await savePost();
    if (!ok) return;
    skipGuardRef.current = true;
    if (pendingNavigation?.type === 'back') {
      window.history.go(sentinelRef.current ? -2 : -1);
    } else if (pendingNavigation?.path) {
      navigate(pendingNavigation.path);
    } else {
      navigate('/admin');
    }
  };

  const handleDiscard = () => {
    skipGuardRef.current = true;
    setShowLeaveDialog(false);
    if (pendingNavigation?.type === 'back') {
      window.history.go(sentinelRef.current ? -2 : -1);
    } else if (pendingNavigation?.path) {
      navigate(pendingNavigation.path);
    } else {
      navigate('/admin');
    }
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
    const ok = await savePost();
    if (ok) {
      skipGuardRef.current = true;
      navigate('/admin');
    }
  };

  const [debouncedContent, setDebouncedContent] = useState(() => getContentBody());

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedContent(getContentBody()), 300);
    return () => clearTimeout(timer);
  }, [form.content]);

  const previewContent = debouncedContent;
  const headings = useMemo(() => extractHeadings(previewContent), [previewContent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => attemptLeave('/admin')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
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
            <div className="flex items-center gap-3">
              <button
                onClick={() => inlineFileRef.current?.click()}
                disabled={inlineUploading}
                className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                {inlineUploading ? 'Uploading...' : 'Insert Image'}
              </button>
              <input
                ref={inlineFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { uploadInlineImage(e.target.files?.[0]); e.target.value = ''; }}
              />
              <button
                onClick={() => { if (!form.content.startsWith('---')) updateField('content', buildFrontmatter() + form.content); }}
                className="text-xs text-primary hover:underline"
              >
                Insert frontmatter template
              </button>
            </div>
          </div>
          {inlineUploading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <div className="w-3.5 h-3.5 border-2 border-border border-t-primary rounded-full animate-spin" />
              Uploading image...
            </div>
          )}
          <div className={splitView ? 'grid grid-cols-2 gap-4 items-start' : ''}>
            <Textarea
              ref={contentRef}
              id="content"
              value={form.content}
              onChange={e => updateField('content', e.target.value)}
              onDrop={handleContentDrop}
              onDragOver={handleContentDragOver}
              onPaste={handleContentPaste}
              placeholder={`---\ntitle: "Your title"\n---\n\n# Your content here...\n\nDrop or paste images here to insert them inline.`}
              className={splitView
                ? 'font-mono text-sm h-[calc(100vh-16rem)] resize-none overflow-y-auto'
                : 'font-mono text-sm min-h-[400px] resize-y'}
            />
            {splitView && (
              <div className="h-[calc(100vh-16rem)] overflow-y-auto border border-border rounded-xl bg-background flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  <div className="max-w-3xl mx-auto px-4 py-6">
                    <h2 className="text-4xl font-bold mb-4">{form.title || 'Preview'}</h2>
                    {form.description && <p className="text-lg text-muted-foreground mb-8">{form.description}</p>}
                    {previewContent ? <MarkdownRenderer content={previewContent} /> : <p className="text-muted-foreground text-sm">Start typing to see the preview...</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost if you leave this page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDiscard}>Discard</Button>
            <Button onClick={handleSaveAndLeave} disabled={saving}>
              <Save className="w-4 h-4 mr-1.5" />{saving ? 'Saving...' : 'Save'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}