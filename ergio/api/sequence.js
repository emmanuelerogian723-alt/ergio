// ========================================
// ERGIO — Autonomous Sales Sequence Engine
// Turns leads into customers with multi-touch,
// multi-channel, AI-driven follow-up sequences.
//
// Actions: create, enroll, tick, status, reply, stop, pause, resume, convert
// Storage: platform_analytics (event_type='sales_sequence' / 'seq_enrollment')
// Channels: email (Resend), sms (Termii), whatsapp (logged)
// AI: Groq (primary) → OpenRouter (fallback)
// ========================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://owcxfzlanlrulflsyvlr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';

function sb() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
}

// ── AI call (Groq → OpenRouter fallback) ──
async function callAI(prompt, systemMsg) {
  const groqKey = process.env.GROQ_API_KEY;
  const orKey = process.env.OPENROUTER_API_KEY;

  if (groqKey) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + groqKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: systemMsg || 'You are ERGIO, an AI sales assistant for African businesses.' }, { role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 800
        })
      });
      if (r.ok) {
        const d = await r.json();
        return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
      }
    } catch (e) { /* fall through */ }
  }

  if (orKey) {
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + orKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct',
          messages: [{ role: 'system', content: systemMsg || 'You are ERGIO, an AI sales assistant for African businesses.' }, { role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 800
        })
      });
      if (r.ok) {
        const d = await r.json();
        return (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || '';
      }
    } catch (e) { /* fall through */ }
  }

  throw new Error('No AI provider available (Groq + OpenRouter both failed)');
}

// ── Default cadences ──
const CADENCES = {
  // Email-only (default, free)
  email: [
    { step: 0, day: 0, channel: 'email', angle: 'value',        label: 'Cold email — value pitch' },
    { step: 1, day: 3, channel: 'email', angle: 'social_proof', label: 'Follow-up — social proof' },
    { step: 2, day: 7, channel: 'email', angle: 'breakup',      label: 'Final email — breakup' }
  ],
  // Multi-channel (SMS is premium — requires explicit opt-in)
  multi: [
    { step: 0, day: 0,  channel: 'email',    angle: 'value',        label: 'Cold email — value pitch' },
    { step: 1, day: 2,  channel: 'email',    angle: 'social_proof', label: 'Follow-up — social proof' },
    { step: 2, day: 4,  channel: 'whatsapp', angle: 'check_in',     label: 'WhatsApp — casual check-in' },
    { step: 3, day: 7,  channel: 'sms',      angle: 'offer',        label: 'SMS — special offer (₦4/segment)' },
    { step: 4, day: 10, channel: 'email',    angle: 'breakup',      label: 'Final email — breakup' }
  ]
};

// ── AI message generation per angle ──
async function generateTouchMessage(touchpoint, business, lead) {
  const channel = touchpoint.channel;
  const angle = touchpoint.angle;
  const bizName = business.business_name || business.name || business.businessName || 'our business';
  const service = business.service || business.services || business.industry || 'our services';
  const city = business.city || 'Nigeria';

  const channelGuide = channel === 'email'
    ? 'Write a short email (max 150 words). Include a subject line on the first line starting with "Subject:". Professional but warm tone.'
    : channel === 'sms'
    ? 'Write a SHORT SMS (max 140 characters including spaces). No subject line. Casual, direct.'
    : channel === 'whatsapp'
    ? 'Write a short WhatsApp message (max 200 characters). Casual, friendly, conversational. No subject line.'
    : 'Write a short message.';

  const angleGuide = {
    value: 'You are reaching out cold. The recipient does not know you. Lead with a genuine observation about their business, then explain how ' + bizName + ' can help. Do not be salesy — be helpful.',
    social_proof: 'Follow up on your previous email. Share a brief result or testimonial from a similar business. Keep it short and curiosity-driven.',
    check_in: 'Casual check-in. Just asking if they saw your previous message and if they are interested. Very short, very casual.',
    offer: 'Make a time-limited special offer (e.g. 10% off first service, free consultation). Create urgency but stay honest.',
    breakup: 'This is the last touch. Acknowledge you have reached out a few times with no response. Say you will stop reaching out but leave the door open. Warm, not guilt-trippy.'
  }[angle] || 'Write a personalized outreach message.';

  const prompt = 'Write a ' + channel + ' outreach message.\n\n' +
    'Business sending: ' + bizName + '\n' +
    'Service: ' + service + '\n' +
    'Location: ' + city + '\n' +
    'Recipient name: ' + (lead.lead_name || lead.name || 'there') + '\n' +
    'Recipient business: ' + (lead.lead_business || lead.business || '') + '\n\n' +
    channelGuide + '\n' + angleGuide + '\n\n' +
    'Nigerian context. Make it feel personal and human, not automated.';

  return await callAI(prompt, 'You are ERGIO, an AI sales assistant writing personalized outreach for African businesses. Write naturally, like a real person would write. Never use placeholders like [Your Name] — always use the actual names provided.');
}

// ── Send via channel ──
async function sendViaChannel(channel, to, subject, body, business) {
  if (channel === 'email') {
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_KEY) return { ok: false, error: 'RESEND_API_KEY not set' };
    const fromAddr = business.business_email ? (business.business_name || 'Business') + ' <' + business.business_email + '>' : 'ERGIO <onboarding@resend.dev>';
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromAddr, to: [to], subject: subject || 'A quick note', html: (body || '').replace(/\n/g, '<br>') })
      });
      const d = await r.json().catch(() => ({}));
      return { ok: r.ok, id: d.id || null, error: r.ok ? null : (d.message || ('HTTP ' + r.status)) };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  if (channel === 'sms') {
    const TERMII_KEY = process.env.TERMII_API_KEY;
    if (!TERMII_KEY) return { ok: false, error: 'TERMII_API_KEY not set' };
    let phone = String(to).replace(/\s/g, '');
    if (phone.startsWith('0')) phone = '234' + phone.slice(1);
    if (!phone.startsWith('234')) phone = '234' + phone;
    try {
      const r = await fetch('https://api.ng.termii.com/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: TERMII_KEY, to: phone, sms: body, from: 'Ergio', type: 'plain', channel: 'generic' })
      });
      const d = await r.json().catch(() => ({}));
      return { ok: r.ok && (d.message_id || d.status === 'Sent'), id: d.message_id || null, error: r.ok ? null : (d.message || ('HTTP ' + r.status)) };
    } catch (e) { return { ok: false, error: e.message }; }
  }

  if (channel === 'whatsapp') {
    // WhatsApp Business API not yet configured — log for manual send
    return { ok: true, logged: true, note: 'WhatsApp not auto-sent (API not configured) — message drafted for manual send' };
  }

  return { ok: false, error: 'Unknown channel: ' + channel };
}

// ── Reply intent parser ──
async function parseReplyIntent(replyText, business, lead) {
  const prompt = 'A lead replied to an outreach email. Analyze their reply and classify the intent.\n\n' +
    'Lead name: ' + (lead.lead_name || lead.name || '') + '\n' +
    'Business: ' + (business.business_name || '') + '\n' +
    'Service: ' + (business.service || business.industry || '') + '\n\n' +
    'Lead reply: "' + replyText + '"\n\n' +
    'Return JSON ONLY (no markdown, no code fences):\n' +
    '{"intent": "interested" | "question" | "objection" | "maybe" | "not_interested" | "unsubscribe", ' +
    '"summary": "one-line summary of what they said", ' +
    '"key_concern": "their main concern or question if any, else null", ' +
    '"suggested_response": "a short natural reply to send back (max 100 words, Nigerian context, addresses their specific point)"}';

  const raw = await callAI(prompt, 'You are ERGIO, an AI sales assistant analyzing lead replies. Return valid JSON only, no markdown fences.');
  try {
    let clean = raw.trim();
    if (clean.startsWith('```')) clean = clean.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(clean);
    // Validate intent value
    const valid = ['interested', 'question', 'objection', 'maybe', 'not_interested', 'unsubscribe'];
    if (!valid.includes(parsed.intent)) parsed.intent = 'maybe';
    return parsed;
  } catch (e) {
    return { intent: 'maybe', summary: String(replyText).slice(0, 100), key_concern: null, suggested_response: raw.slice(0, 200) };
  }
}

// ── platform_analytics helpers ──
async function paInsert(event_type, event_data, metric_value) {
  const supabase = sb();
  const { data, error } = await supabase.from('platform_analytics')
    .insert({ event_type, event_data: event_data || {}, metric_value: metric_value !== undefined ? metric_value : 1 })
    .select();
  if (error) throw new Error('paInsert failed: ' + error.message);
  return data;
}

async function paUpdate(id, event_data, metric_value) {
  const supabase = sb();
  const payload = { event_data };
  if (metric_value !== undefined) payload.metric_value = metric_value;
  const { error } = await supabase.from('platform_analytics').update(payload).eq('id', id);
  if (error) throw new Error('paUpdate failed: ' + error.message);
}

async function paGetById(id) {
  const supabase = sb();
  const { data } = await supabase.from('platform_analytics').select('*').eq('id', id).limit(1);
  return data && data[0] ? data[0] : null;
}

async function paQuery(event_type, filters) {
  const supabase = sb();
  const { data, error } = await supabase.from('platform_analytics')
    .select('*').eq('event_type', event_type)
    .order('recorded_at', { ascending: false }).limit(500);
  if (error) return [];
  return (data || []).filter(row => {
    const ed = row.event_data || {};
    for (const k in (filters || {})) {
      if (ed[k] !== filters[k]) return false;
    }
    return true;
  });
}

// ── Main handler ──
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = req.method === 'GET' ? (req.query || {}) : (req.body || {});
  const action = body.action || (req.method === 'GET' ? 'status' : 'create');

  try {
    switch (action) {

      // ── CREATE ──
      case 'create': {
        const business_id = body.business_id || null;
        const business_name = body.business_name || body.name || '';
        const industry = body.industry || '';
        const service = body.service || industry || '';
        const city = body.city || '';
        const cadence_type = body.cadence_type || 'email';
        const cadence = body.custom_cadence || CADENCES[cadence_type] || CADENCES.email;

        const hasSms = cadence.some(t => t.channel === 'sms');
        if (hasSms && body.sms_opt_in !== true) {
          return res.json({
            success: false,
            error: 'SMS touchpoint detected but sms_opt_in is not true',
            hint: 'SMS costs approximately ₦4/segment on Termii. Set sms_opt_in: true to confirm, or use cadence_type "email" for free email-only sequences.'
          });
        }

        const row = await paInsert('sales_sequence', {
          business_id, business_name, industry, service, city,
          cadence, cadence_type,
          status: 'active',
          created_at: new Date().toISOString()
        }, cadence.length);

        return res.json({
          success: true,
          sequence_id: row[0].id,
          cadence: cadence,
          message: 'Sequence created: ' + cadence.length + ' touchpoints over ' + cadence[cadence.length - 1].day + ' days',
          cost_estimate: hasSms ? '₦4 per SMS per lead (Termii)' : 'Free (email only)'
        });
      }

      // ── ENROLL ──
      case 'enroll': {
        const sequence_id = body.sequence_id;
        const lead = body.lead;
        if (!sequence_id || !lead) return res.json({ success: false, error: 'sequence_id and lead are required' });

        const seqRow = await paGetById(sequence_id);
        if (!seqRow || seqRow.event_type !== 'sales_sequence') return res.json({ success: false, error: 'Sequence not found' });
        const sequence = seqRow.event_data;

        // Duplicate check (active or paused enrollment for same lead in same sequence)
        const existing = await paQuery('seq_enrollment', { sequence_id: sequence_id, lead_id: lead.id || lead.email || lead.phone || '' });
        const dupe = existing.find(e => e.event_data.status === 'active' || e.event_data.status === 'paused');
        if (dupe) return res.json({ success: false, error: 'Lead already enrolled in this sequence', enrollment_id: dupe.id });

        const firstTouch = sequence.cadence[0];
        const enrolledAt = new Date();
        const nextTouchAt = new Date(enrolledAt.getTime() + firstTouch.day * 86400000);

        const row = await paInsert('seq_enrollment', {
          sequence_id: sequence_id,
          business_id: sequence.business_id,
          business_name: sequence.business_name,
          lead_id: lead.id || lead.email || lead.phone || '',
          lead_name: lead.name || '',
          lead_email: lead.email || '',
          lead_phone: lead.phone || '',
          lead_business: lead.business || lead.leadBusiness || lead.name || '',
          current_step: 0,
          status: 'active',
          enrolled_at: enrolledAt.toISOString(),
          next_touch_at: nextTouchAt.toISOString(),
          touches: [],
          reply_intent: null,
          last_reply: null
        }, 0);

        // Update lead status in the leads table when it has a real id
        if (lead.id && String(lead.id).length > 10) {
          const supabase = sb();
          await supabase.from('leads').update({ status: 'contacted', contacted: true }).eq('id', lead.id);
        }

        return res.json({
          success: true,
          enrollment_id: row[0].id,
          next_touch_at: nextTouchAt.toISOString(),
          message: (lead.name || 'Lead') + ' enrolled. First touch (' + firstTouch.channel + ') due ' + (firstTouch.day === 0 ? 'now (next tick)' : 'in ' + firstTouch.day + ' day(s)').toString() + '.'
        });
      }

      // ── TICK: process all due touchpoints (cron-driven) ──
      case 'tick': {
        const now = new Date();
        const enrollments = await paQuery('seq_enrollment', { status: 'active' });
        const due = enrollments.filter(e => e.event_data.next_touch_at && new Date(e.event_data.next_touch_at) <= now);

        if (due.length === 0) return res.json({ success: true, processed: 0, sent: 0, failed: 0, message: 'No due touchpoints' });

        // Load sequences for cadence lookup
        const sequences = await paQuery('sales_sequence', {});
        const seqMap = {};
        for (const s of sequences) seqMap[s.id] = s.event_data;

        const results = [];
        let sentCount = 0, failCount = 0;

        for (const enrollment of due) {
          const ed = enrollment.event_data;
          const sequence = seqMap[ed.sequence_id];
          if (!sequence) {
            results.push({ enrollment_id: enrollment.id, lead: ed.lead_name, error: 'Sequence missing', skipped: true });
            continue;
          }

          const step = ed.current_step;
          const touchpoint = sequence.cadence[step];
          if (!touchpoint) {
            await paUpdate(enrollment.id, { ...ed, status: 'completed', next_touch_at: null }, step);
            results.push({ enrollment_id: enrollment.id, lead: ed.lead_name, status: 'completed' });
            continue;
          }

          try {
            // Generate the message with AI
            const message = await generateTouchMessage(touchpoint, sequence, ed);

            let subject = null;
            let body_text = message;
            if (touchpoint.channel === 'email') {
              const lines = message.split('\n');
              subject = lines[0].replace(/^Subject:\s*/i, '').trim();
              body_text = lines.slice(1).join('\n').trim();
              if (!subject || subject.length < 3) subject = 'A quick note';
            }

            const to = touchpoint.channel === 'email' ? ed.lead_email : ed.lead_phone;
            if (!to) {
              // No address for this channel — skip step and advance
              const nextStep = step + 1;
              const nextTp = sequence.cadence[nextStep];
              const nextAt = nextTp ? new Date(now.getTime() + (nextTp.day - touchpoint.day) * 86400000).toISOString() : null;
              await paUpdate(enrollment.id, {
                ...ed, current_step: nextStep,
                status: nextTp ? 'active' : 'completed',
                next_touch_at: nextAt,
                touches: [...(ed.touches || []), { step, channel: touchpoint.channel, attempted_at: now.toISOString(), status: 'skipped', reason: 'no_address' }]
              }, nextStep);
              results.push({ enrollment_id: enrollment.id, lead: ed.lead_name, step, skipped: 'no ' + touchpoint.channel + ' address' });
              continue;
            }

            const sendResult = await sendViaChannel(touchpoint.channel, to, subject, body_text, sequence);

            const touchLog = {
              step, channel: touchpoint.channel, angle: touchpoint.angle,
              sent_at: now.toISOString(),
              status: sendResult.ok ? 'sent' : 'failed',
              message_id: sendResult.id || null,
              error: sendResult.error || null
            };

            const nextStep = step + 1;
            const nextTp = sequence.cadence[nextStep];
            const nextAt = nextTp ? new Date(now.getTime() + (nextTp.day - touchpoint.day) * 86400000).toISOString() : null;

            await paUpdate(enrollment.id, {
              ...ed,
              current_step: nextStep,
              status: nextTp ? 'active' : 'completed',
              next_touch_at: nextAt,
              touches: [...(ed.touches || []), touchLog]
            }, nextStep);

            if (sendResult.ok) sentCount++; else failCount++;
            results.push({ enrollment_id: enrollment.id, lead: ed.lead_name, step, channel: touchpoint.channel, sent: sendResult.ok, error: sendResult.error, next_touch_at: nextAt });

          } catch (err) {
            failCount++;
            results.push({ enrollment_id: enrollment.id, lead: ed.lead_name, step, error: err.message, failed: true });
          }
        }

        return res.json({
          success: true,
          processed: results.length,
          sent: sentCount,
          failed: failCount,
          results
        });
      }

      // ── STATUS ──
      case 'status': {
        const business_id = body.business_id;
        let sequences = await paQuery('sales_sequence', {});
        let enrollments = await paQuery('seq_enrollment', {});
        if (business_id) {
          sequences = sequences.filter(s => (s.event_data || {}).business_id === business_id);
          enrollments = enrollments.filter(e => (e.event_data || {}).business_id === business_id);
        }

        const stats = {
          total_sequences: sequences.length,
          total_enrollments: enrollments.length,
          active: enrollments.filter(e => e.event_data.status === 'active').length,
          completed: enrollments.filter(e => e.event_data.status === 'completed').length,
          replied: enrollments.filter(e => e.event_data.status === 'replied').length,
          converted: enrollments.filter(e => e.event_data.status === 'converted').length,
          stopped: enrollments.filter(e => e.event_data.status === 'stopped').length,
          total_touches_sent: enrollments.reduce((s, e) => s + ((e.event_data.touches || []).filter(t => t.status === 'sent').length), 0)
        };

        return res.json({
          success: true,
          sequences: sequences.map(s => ({ id: s.id, ...s.event_data })),
          enrollments: enrollments.map(e => ({ id: e.id, ...e.event_data })),
          stats
        });
      }

      // ── REPLY: parse a lead reply, decide action, auto-respond ──
      case 'reply': {
        const enrollment_id = body.enrollment_id;
        const reply_text = body.reply_text;
        if (!enrollment_id || !reply_text) return res.json({ success: false, error: 'enrollment_id and reply_text required' });

        const row = await paGetById(enrollment_id);
        if (!row || row.event_type !== 'seq_enrollment') return res.json({ success: false, error: 'Enrollment not found' });
        const ed = row.event_data;

        const seqRow = await paGetById(ed.sequence_id);
        const sequence = (seqRow && seqRow.event_data) || {};

        const analysis = await parseReplyIntent(reply_text, sequence, ed);

        let newStatus = ed.status;
        let action = 'continue';
        if (analysis.intent === 'interested') { newStatus = 'replied'; action = 'hot_lead'; }
        else if (analysis.intent === 'not_interested' || analysis.intent === 'unsubscribe') { newStatus = 'stopped'; action = 'stop'; }
        else if (analysis.intent === 'question' || analysis.intent === 'objection' || analysis.intent === 'maybe') { newStatus = 'replied'; action = 'respond'; }

        await paUpdate(enrollment_id, {
          ...ed,
          status: newStatus,
          reply_intent: analysis.intent,
          last_reply: { text: reply_text, at: new Date().toISOString(), analysis: { intent: analysis.intent, summary: analysis.summary } },
          touches: [...(ed.touches || []), {
            step: ed.current_step, channel: 'reply',
            received_at: new Date().toISOString(), status: 'received',
            intent: analysis.intent, summary: analysis.summary
          }]
        });

        // Auto-respond for question / objection / maybe (and interested, with a warm reply)
        let sendResult = null;
        if ((action === 'respond' || action === 'hot_lead') && analysis.suggested_response && ed.lead_email) {
          sendResult = await sendViaChannel('email', ed.lead_email, 'Re: your message', analysis.suggested_response, sequence);
        }

        return res.json({
          success: true,
          enrollment_id,
          intent: analysis.intent,
          summary: analysis.summary,
          key_concern: analysis.key_concern,
          suggested_response: analysis.suggested_response,
          action,
          auto_responded: !!(sendResult && sendResult.ok),
          send_error: sendResult ? sendResult.error : null,
          message: action === 'hot_lead' ? '🔥 HOT LEAD — follow up personally now'
                 : action === 'stop' ? 'Sequence stopped — lead opted out'
                 : 'Reply analyzed' + (sendResult && sendResult.ok ? ' + auto-responded' : '')
        });
      }

      // ── STOP / PAUSE / RESUME / CONVERT ──
      case 'stop': {
        const row = await paGetById(body.enrollment_id);
        if (!row || row.event_type !== 'seq_enrollment') return res.json({ success: false, error: 'Enrollment not found' });
        await paUpdate(row.id, { ...row.event_data, status: 'stopped', next_touch_at: null });
        return res.json({ success: true, message: 'Enrollment stopped' });
      }

      case 'pause': {
        const row = await paGetById(body.enrollment_id);
        if (!row || row.event_type !== 'seq_enrollment') return res.json({ success: false, error: 'Enrollment not found' });
        await paUpdate(row.id, { ...row.event_data, status: 'paused' });
        return res.json({ success: true, message: 'Enrollment paused' });
      }

      case 'resume': {
        const row = await paGetById(body.enrollment_id);
        if (!row || row.event_type !== 'seq_enrollment') return res.json({ success: false, error: 'Enrollment not found' });
        await paUpdate(row.id, { ...row.event_data, status: 'active', next_touch_at: new Date().toISOString() });
        return res.json({ success: true, message: 'Enrollment resumed — next touch will process on next tick' });
      }

      case 'convert': {
        const row = await paGetById(body.enrollment_id);
        if (!row || row.event_type !== 'seq_enrollment') return res.json({ success: false, error: 'Enrollment not found' });
        const ed = row.event_data;
        await paUpdate(row.id, { ...ed, status: 'converted', next_touch_at: null, converted_at: new Date().toISOString(), deal_amount: body.deal_amount || null });
        if (ed.lead_id && String(ed.lead_id).length > 10) {
          const supabase = sb();
          await supabase.from('leads').update({ status: 'converted', converted: true }).eq('id', ed.lead_id);
        }
        return res.json({ success: true, message: '🎉 Lead converted — marked as won' });
      }

      default:
        return res.json({ success: false, error: 'Unknown action: ' + action, actions: ['create', 'enroll', 'tick', 'status', 'reply', 'stop', 'pause', 'resume', 'convert'] });
    }

  } catch (err) {
    console.error('[sequence] error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
