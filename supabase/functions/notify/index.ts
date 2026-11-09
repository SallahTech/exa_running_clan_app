// Sends push alerts through Expo's push service. Called by the app right after a
// leader changes a run, or a member comments on a post. The caller's identity is
// checked here; the client's word is never taken for who may trigger what.
//
// Deploy: supabase functions deploy notify

import { createClient } from 'npm:@supabase/supabase-js@2';

type Lang = 'en' | 'tr';

const COPY = {
  cancelled: {
    en: (run: string) => ({ title: `${run} is cancelled`, body: 'Open the app for details.' }),
    tr: (run: string) => ({ title: `${run} iptal edildi`, body: 'Ayrıntılar için uygulamayı aç.' }),
  },
  changed: {
    en: (run: string) => ({ title: `${run} has changed`, body: 'Check the new details before you go.' }),
    tr: (run: string) => ({ title: `${run} değişti`, body: 'Gitmeden önce yeni bilgilere bak.' }),
  },
  comment: {
    en: (who: string) => ({ title: `${who} commented on your post`, body: '' }),
    tr: (who: string) => ({ title: `${who} gönderine yorum yaptı`, body: '' }),
  },
};

interface Row {
  token: string;
  locale: string;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function send(rows: Row[], copy: (typeof COPY)[keyof typeof COPY], arg: string, url: string) {
  const messages = rows.map((r) => {
    const lang: Lang = r.locale === 'tr' ? 'tr' : 'en';
    return { to: r.token, sound: 'default', ...copy[lang](arg), data: { url } };
  });

  // Expo accepts at most 100 messages per request.
  for (let i = 0; i < messages.length; i += 100) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
  }
  return messages.length;
}

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: auth } = await db.auth.getUser(jwt);
  const caller = auth.user?.id;
  if (!caller) return json(401, { error: 'not signed in' });

  const { type, occurrence_id: occurrenceId, post_id: postId } = await req.json();

  if (type === 'run_changed') {
    const { data: me } = await db.from('member').select('role').eq('id', caller).single();
    if (me?.role !== 'leader' && me?.role !== 'admin') return json(403, { error: 'leaders only' });

    const { data: occ } = await db
      .from('run_occurrence')
      .select('status, run_series(title)')
      .eq('id', occurrenceId)
      .single();
    if (!occ) return json(404, { error: 'no such run' });

    const { data: going } = await db
      .from('rsvp')
      .select('member_id, member!inner(notify_run_day)')
      .eq('occurrence_id', occurrenceId)
      .eq('state', 'going')
      .eq('member.notify_run_day', true);

    const ids = (going ?? []).map((g) => g.member_id);
    const { data: rows } = await db.from('push_token').select('token, locale').in('member_id', ids);

    const series = occ.run_series as unknown as { title: string };
    const copy = occ.status === 'cancelled' ? COPY.cancelled : COPY.changed;
    return json(200, { sent: await send(rows ?? [], copy, series.title, '/') });
  }

  if (type === 'new_comment') {
    const { data: post } = await db
      .from('post')
      .select('author_id, member!inner(notify_chat)')
      .eq('id', postId)
      .single();
    if (!post) return json(404, { error: 'no such post' });

    const owner = post.member as unknown as { notify_chat: boolean };
    if (post.author_id === caller || !owner.notify_chat) return json(200, { sent: 0 });

    // Only someone who really has just commented can trigger this.
    const { count } = await db
      .from('comment')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('author_id', caller);
    if (!count) return json(403, { error: 'no comment from this member' });

    const { data: who } = await db.from('member').select('full_name').eq('id', caller).single();
    const { data: rows } = await db
      .from('push_token')
      .select('token, locale')
      .eq('member_id', post.author_id);

    return json(200, { sent: await send(rows ?? [], COPY.comment, who?.full_name ?? '', `/post/${postId}`) });
  }

  return json(400, { error: 'unknown type' });
});
