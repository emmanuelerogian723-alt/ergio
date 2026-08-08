// ========================================
// ERGIO API — /api/refine (v3.0 JSON)
// Self-contained — no heavy imports to avoid build failures
// Handles: surgical edits, Design Linter (mode:'lint'), auto-fix (mode:'fix-layout')
// ========================================

import { lintWebsite, autoFixHtml } from '../lib/design-linter.js';

// Inline callGroq with multi-provider fallback
async function callGroq(messages, options = {}) {
  const { maxTokens = 16000, temperature = 0.3, timeout = 55000 } = options;
  const groqKey = process.env.GROQ_API_KEY;
  const orKey = process.env.OPENROUTER_API_KEY;
  
  // Provider 1: Groq
  if (groqKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai/gpt-oss-120b', messages, max_tokens: maxTokens, temperature }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (resp.ok) {
        const data = await resp.json();
        return data.choices?.[0]?.message?.content || '';
      }
      console.error('Groq error:', resp.status);
    } catch (e) { console.error('Groq failed:', e.message); }
  }
  
  // Provider 2: OpenRouter
  if (orKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${orKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'meta-llama/llama-3.3-70b-instruct', messages, max_tokens: maxTokens, temperature }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (resp.ok) {
        const data = await resp.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } catch (e) { console.error('OpenRouter failed:', e.message); }
  }
  
  // Provider 3: Pollinations (free, no key)
  try {
    const resp = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai', messages, max_tokens: maxTokens, temperature })
    });
    if (resp.ok) {
      const data = await resp.json();
      return data.choices?.[0]?.message?.content || '';
    }
  } catch (e) { console.error('Pollinations failed:', e.message); }
  
  throw new Error('All AI providers failed');
}

const MASTER_PROMPT = `You are ERGIO Website Builder, a world-class AI web architect. Every website must feel premium, modern, professional, clean, elegant, fast, conversion-focused, mobile-first, accessible, and SEO-friendly. Use excellent spacing, strong typography hierarchy, beautiful gradients, professional color palettes, rounded corners, subtle shadows, smooth animations, and excellent whitespace. Every section should feel intentional. Never use placeholder text. Ensure proper color contrast and accessibility.`;

const SURGICAL_SYSTEM_PROMPT = `You are ERGIO's surgical website editor. You make precise, targeted edits to HTML.

DESIGN PHILOSOPHY: Every edit must maintain premium quality — modern, professional, clean, conversion-focused. Preserve excellent spacing, strong typography hierarchy, and smooth animations.

RULES:
1. Return ONLY the modified HTML. No explanations, no markdown fences.
2. Keep all existing sections intact unless told to remove one.
3. Preserve all CSS classes, IDs, and structure.
4. If the instruction is about layout, fix spacing, alignment, or visual issues. Maintain pixel-perfect alignment and excellent whitespace.
5. If the instruction is about content, update text only. Never use placeholder text — write persuasive, natural copy.
6. If the instruction is about style, modify CSS values. Maintain professional color palettes and subtle shadows.
7. Always return complete valid HTML document.
8. Preserve ALL <style> and <script> blocks exactly as they are.
9. Make ONLY the requested changes — do not rewrite sections the user didn't ask to change.
10. NEVER return partial HTML — always return a complete valid document from <!DOCTYPE html> to </html>.
11. Ensure all edits are responsive — test mobile and desktop mentally before returning.
12. Maintain accessibility — proper color contrast, semantic HTML, keyboard navigation.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method === 'GET') {
    return res.json({ status: 'ok', service: 'Website Refine v3', mode: 'json' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }
  
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  const { currentHtml, editRequest, instruction, businessName, uploadedImages, mode } = body;
  const editInstruction = instruction || editRequest;
  
  // ── LINT MODE ──
  if (mode === 'lint') {
    if (!currentHtml) return res.status(400).json({ error: 'currentHtml is required for lint mode' });
    const result = lintWebsite(currentHtml, { name: businessName });
    return res.json({ linter: result });
  }
  
  // ── FIX-LAYOUT MODE ──
  if (mode === 'fix-layout') {
    if (!currentHtml) return res.status(400).json({ error: 'currentHtml is required for fix-layout mode' });
    const fixedHtml = autoFixHtml(currentHtml, { name: businessName });
    const lintBefore = lintWebsite(currentHtml, { name: businessName });
    const lintAfter = lintWebsite(fixedHtml, { name: businessName });
    return res.json({
      html: fixedHtml,
      linter: lintAfter,
      linterBefore: lintBefore,
      instruction: 'Auto-fix layout issues',
      editType: 'fix-layout',
      message: 'Score improved from ' + lintBefore.score + ' to ' + lintAfter.score
    });
  }
  
  if (!currentHtml) return res.status(400).json({ error: 'currentHtml is required' });
  if (!editInstruction) return res.status(400).json({ error: 'Instruction (or editRequest) is required' });
  
  const htmlToSend = currentHtml.length > 50000 ? currentHtml.substring(0, 50000) : currentHtml;
  const wasTruncated = currentHtml.length > 50000;
  
  const userPrompt = `Business: "${businessName || 'business'}"

User's edit request: "${editInstruction}"

${uploadedImages && uploadedImages.length > 0 ? 'The user has uploaded ' + uploadedImages.length + ' photos. Use these photo data URLs to replace stock images. Photo data URLs: ' + uploadedImages.map((p, i) => '\n[Photo ' + (i+1) + ': ' + (p.name || 'photo' + (i+1)) + '] ' + (typeof p === 'string' ? p : p.dataUrl)).join('\n') + '\n' : ''}

Current HTML:
${htmlToSend}

Return the complete updated HTML with the requested changes applied. Make ONLY the requested changes — keep everything else exactly as is. If the user uploaded photos, replace stock image URLs with the provided data URLs.`;

  try {
    const result = await callGroq([
      { role: 'system', content: SURGICAL_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ], { temperature: 0.3, maxTokens: 16000, timeout: 55000 });
    
    let cleanHtml = result || '';
    cleanHtml = cleanHtml.replace(/^```html\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    
    const hasDoctype = cleanHtml.toLowerCase().includes('<!doctype') || cleanHtml.toLowerCase().includes('<html');
    const hasClosingHtml = cleanHtml.toLowerCase().includes('</html>') || cleanHtml.toLowerCase().includes('</body>');
    
    if (!hasDoctype || !hasClosingHtml || cleanHtml.length < 500) {
      return res.status(422).json({ 
        error: 'Edit produced invalid HTML — the AI may have returned a partial result. Try being more specific.' 
      });
    }
    
    return res.json({ 
      html: cleanHtml,
      summary: 'Website updated successfully.',
      instruction: editInstruction,
      message: 'Website refined successfully'
    });
  } catch (e) {
    console.error('Refine error:', e.message);
    return res.status(500).json({ error: e.message || 'Refine failed' });
  }
}
