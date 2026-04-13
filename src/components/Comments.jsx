import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MessageCircle, Reply, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// ─── Anonymous fingerprint (persisted per browser) ───────────────────────────
function getFingerprint() {
  const KEY = 'aidigest-fp';
  let fp = localStorage.getItem(KEY);
  if (!fp) {
    fp = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, fp);
  }
  return fp;
}

// ─── Avatar colour derived from author name ───────────────────────────────────
const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500',
  'bg-pink-500', 'bg-teal-500', 'bg-rose-500', 'bg-amber-500',
];
function avatarColor(name) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ─── Flat list → nested tree ──────────────────────────────────────────────────
function buildTree(flat) {
  const map = {};
  const roots = [];
  flat.forEach(c => { map[c.id] = { ...c, replies: [] }; });
  flat.forEach(c => {
    if (c.parent_id && map[c.parent_id]) map[c.parent_id].replies.push(map[c.id]);
    else if (!c.parent_id) roots.push(map[c.id]);
  });
  return roots;
}

// ─── Reaction config ──────────────────────────────────────────────────────────
const REACTIONS = [
  { key: 'like',       emoji: '👍', label: 'Like'       },
  { key: 'heart',      emoji: '❤️', label: 'Love'       },
  { key: 'fire',       emoji: '🔥', label: 'Fire'       },
  { key: 'mind_blown', emoji: '🤯', label: 'Mind-blown' },
];

// ─── Post-level emoji reactions ───────────────────────────────────────────────
function PostReactions({ postSlug }) {
  const [counts, setCounts]       = useState({});
  const [myReactions, setMyReactions] = useState(new Set());
  const fp = getFingerprint();

  useEffect(() => { loadReactions(); }, [postSlug]);

  const loadReactions = async () => {
    const { data } = await supabase
      .from('post_reactions')
      .select('reaction, fingerprint')
      .eq('post_slug', postSlug);
    if (!data) return;
    const countMap = {};
    const mine = new Set();
    data.forEach(r => {
      countMap[r.reaction] = (countMap[r.reaction] || 0) + 1;
      if (r.fingerprint === fp) mine.add(r.reaction);
    });
    setCounts(countMap);
    setMyReactions(mine);
  };

  const toggle = async (key) => {
    if (myReactions.has(key)) {
      await supabase
        .from('post_reactions')
        .delete()
        .eq('post_slug', postSlug)
        .eq('reaction', key)
        .eq('fingerprint', fp);
      setMyReactions(prev => { const s = new Set(prev); s.delete(key); return s; });
      setCounts(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 1) - 1) }));
    } else {
      await supabase
        .from('post_reactions')
        .insert({ post_slug: postSlug, reaction: key, fingerprint: fp });
      setMyReactions(prev => new Set([...prev, key]));
      setCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {REACTIONS.map(({ key, emoji, label }) => (
        <button
          key={key}
          onClick={() => toggle(key)}
          title={label}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 select-none ${
            myReactions.has(key)
              ? 'bg-primary/10 border-primary/50 text-primary shadow-sm scale-105'
              : 'bg-secondary/60 border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground hover:scale-105'
          }`}
        >
          <span className="text-base leading-none">{emoji}</span>
          {counts[key] > 0 && (
            <span className="tabular-nums">{counts[key]}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Comment / reply form ─────────────────────────────────────────────────────
function CommentForm({ postSlug, parentId = null, onSubmitted, onCancel }) {
  const [name,    setName]    = useState('');
  const [content, setContent] = useState('');
  const [busy,    setBusy]    = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setBusy(true);
    await supabase.from('post_comments').insert({
      post_slug:   postSlug,
      parent_id:   parentId,
      author_name: name.trim(),
      content:     content.trim(),
    });
    setName('');
    setContent('');
    setBusy(false);
    onSubmitted();
  };

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Your name"
        required
        className="text-sm"
      />
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={parentId ? 'Write a reply…' : 'Share your thoughts…'}
        required
        rows={3}
        className="text-sm resize-none"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={busy} size="sm" className="gap-1.5">
          <Send className="w-3.5 h-3.5" />
          {busy ? 'Posting…' : parentId ? 'Reply' : 'Post comment'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

// ─── Single comment node (recursive) ─────────────────────────────────────────
function CommentNode({ comment, depth, postSlug, onRefresh }) {
  const [replying, setReplying] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
  const initial = comment.author_name.charAt(0).toUpperCase();
  const color   = avatarColor(comment.author_name);

  return (
    <div className={depth > 0 ? 'mt-4 pl-4 border-l-2 border-border/40' : ''}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 ${color}`}>
          {initial}
        </div>

        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-baseline gap-2 flex-wrap mb-1">
            <span className="text-sm font-semibold text-foreground">{comment.author_name}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>

          {/* Body */}
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Reply trigger */}
          {depth < 5 && (
            <button
              onClick={() => setReplying(v => !v)}
              className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              {replying ? 'Cancel' : 'Reply'}
            </button>
          )}

          {/* Inline reply form */}
          {replying && (
            <div className="mt-3 p-3 rounded-lg bg-secondary/30 border border-border/40">
              <CommentForm
                postSlug={postSlug}
                parentId={comment.id}
                onSubmitted={() => { setReplying(false); onRefresh(); }}
                onCancel={() => setReplying(false)}
              />
            </div>
          )}

          {/* Nested replies */}
          {comment.replies?.map(reply => (
            <CommentNode
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              postSlug={postSlug}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function Comments({ postSlug }) {
  const [tree,    setTree]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);

  useEffect(() => { load(); }, [postSlug]);

  const load = async () => {
    const { data } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_slug', postSlug)
      .order('created_at', { ascending: true });
    const comments = data || [];
    setTotal(comments.length);
    setTree(buildTree(comments));
    setLoading(false);
  };

  return (
    <section className="mt-16 pt-10 border-t border-border/50">

      {/* ── Emoji reactions ── */}
      <div className="mb-10 p-5 rounded-2xl bg-secondary/30 border border-border/50">
        <p className="text-sm font-semibold text-foreground mb-3">
          What did you think of this article?
        </p>
        <PostReactions postSlug={postSlug} />
      </div>

      {/* ── Comments header ── */}
      <div className="flex items-center gap-2 mb-5">
        <MessageCircle className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-lg font-bold text-foreground">
          {total === 0 ? 'Comments' : `${total} Comment${total !== 1 ? 's' : ''}`}
        </h2>
      </div>

      {/* ── New comment form ── */}
      <div className="mb-8 p-4 rounded-xl border border-border/50 bg-secondary/20">
        <p className="text-sm font-medium text-foreground mb-3">Leave a comment</p>
        <CommentForm postSlug={postSlug} onSubmitted={load} />
      </div>

      {/* ── Comment tree ── */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : tree.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">
          No comments yet — be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-6">
          {tree.map(comment => (
            <CommentNode
              key={comment.id}
              comment={comment}
              depth={0}
              postSlug={postSlug}
              onRefresh={load}
            />
          ))}
        </div>
      )}
    </section>
  );
}
