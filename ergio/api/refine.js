// ========================================
// ERGIO API — /api/refine (v3.0 JSON)
// Surgical website editing — returns clean JSON
// Uses shared lib with multi-provider fallback (Groq → OpenRouter → Pollinations)
// Also handles Design Linter (mode: 'lint') and auto-fix (mode: 'fix-layout')
// ========================================

import { callGroq } from '../lib/ergio.js';
import { lintWebsite, autoFixHtml } from '../lib/design-linter.js';

const SURGICAL_SYSTEM_PROMPT = `You are ERGIO's surgical website editor. You make precise, targeted edits to HTML.

RULES:
1. Return ONLY the modified HTML. No explanations, no markdown fences.
2. Keep all existing sections intact unless told to remove one.
3. Preserve all CSS classes, IDs, and structure.
4. If the instruction is about layout, fix spacing, alignment, or visual issues.
5. If the instruction is about content, update text only.
6. If the instruction is about style, modify CSS values.
7. Always return complete valid HTML document.
8. Keep the "Powered by ERGIO" footer intact.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.json({ status: 'ok', service: 'Website Refine v3', mode: 'json' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const { instruction, currentHtml, businessName, mode, editRequest } = req.body;
  const editInstruction = instruction || editRequest;
  if (!editInstruction) return res.status(400).json({ error: 'Instruction is required' });
  if (!currentHtml) return res.status(400).json({ error: 'currentHtml is required' });

  try {
    // ── LINT MODE ──
    if (mode === 'lint') {
      const result = lintWebsite(currentHtml, { name: businessName });
      return res.json({ success: true, linter: result });
    }

    // ── FIX-LAYOUT MODE ──
    if (mode === 'fix-layout') {
      const fixedHtml = autoFixHtml(currentHtml, { name: businessName });
      const lintBefore = lintWebsite(currentHtml, { name: businessName });
      const lintAfter = lintWebsite(fixedHtml, { name: businessName });
      return res.json({
        success: true,
        html: fixedHtml,
        linter: lintAfter,
        linterBefore: lintBefore,
        instruction: 'Auto-fix layout issues',
        editType: 'fix-layout',
        message: `Score improved from ${lintBefore.score} to ${lintAfter.score}`
      });
    }

    // ── AI REFINEMENT ──
    const editType = mode || detectEditType(editInstruction);
    const messages = [
      { role: 'system', content: SURGICAL_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Business: ${businessName || 'My Business'}
Edit Type: ${editType}
Instruction: "${editInstruction}"

Current HTML:
${currentHtml.slice(0, 50000)}

Apply the requested change and return the complete updated HTML.`
      }
    ];

    const result = await callGroq(messages, { maxTokens: 16000, temperature: 0.4, timeout: 55000 });

    const cleanHtml = result
      .replace(/```html\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    if (!cleanHtml.includes('<') || !cleanHtml.includes('>')) {
      return res.status(500).json({ error: 'AI did not return valid HTML', raw: result.slice(0, 500) });
    }

    return res.json({
      success: true,
      html: cleanHtml,
      instruction: editInstruction,
      editType,
      message: 'Website refined successfully'
    });
  } catch (e) {
    console.error('Refine error:', e);
    return res.status(500).json({ error: e.message || 'Refine failed' });
  }
}

function detectEditType(instruction) {
  const i = instruction.toLowerCase();
  if (i.match(/layout|spacing|align|center|padding|margin|grid|flex|position/)) return 'layout';
  if (i.match(/color|font|size|background|style|theme/)) return 'style';
  if (i.match(/text|word|content|heading|title|paragraph|write|change.*to/)) return 'content';
  if (i.match(/add|new|insert|create|section/)) return 'add';
  if (i.match(/remove|delete|hide/)) return 'remove';
  return 'general';
}
