import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { post_slug, author_name, content, parent_id } = req.body;

    if (!post_slug || !author_name || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (author_name.length > 100 || content.length > 5000 || post_slug.length > 200) {
      return res.status(400).json({ error: 'Input too long' });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);

    if (adminEmails.length === 0) {
      return res.status(200).json({ message: 'No admin emails configured' });
    }

    const { data: post } = await supabase
      .from('blog_posts')
      .select('title')
      .eq('slug', post_slug)
      .single();

    const postTitle = post?.title || post_slug;
    const siteUrl = process.env.SITE_URL || '';
    const postUrl = `${siteUrl}/blog/${post_slug}`;
    const commentType = parent_id ? 'reply' : 'comment';
    const fromAddress = process.env.EMAIL_FROM || 'AI Digest <onboarding@resend.dev>';

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0;">
          <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 18px;">
            New ${commentType} on &ldquo;${escapeHtml(postTitle)}&rdquo;
          </h2>
          <div style="background: white; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
            <p style="margin: 0 0 8px; font-weight: 600; color: #334155;">
              ${escapeHtml(author_name)}
            </p>
            <p style="margin: 0; color: #64748b; white-space: pre-wrap; line-height: 1.6;">
              ${escapeHtml(content)}
            </p>
          </div>
          <a href="${postUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500;">
            View on blog
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 16px; text-align: center;">
          AI Digest &mdash; Comment Notification
        </p>
      </div>
    `;

    const { error: sendError } = await resend.emails.send({
      from: fromAddress,
      to: adminEmails,
      subject: `New ${commentType} on "${postTitle}" by ${author_name}`,
      html: emailHtml,
    });

    if (sendError) {
      console.error('Resend error:', sendError);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ message: 'Notification sent' });
  } catch (err) {
    console.error('Notification error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
