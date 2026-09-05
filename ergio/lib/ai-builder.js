// ============================================================
// ERGIO AI BUILDER v6.0
// AI-powered HTML generation using design tokens + system prompt
// Replaces template-based assembly with LLM-generated HTML
// Inspired by Lovable, Bolt.new, v0 architecture
// ============================================================

import { generateDesignTokens, generateFontLinks } from './design-tokens.js';
import { BUILDER_SYSTEM_PROMPT, BUILDER_USER_TEMPLATE } from './builder-prompt.js';
import { lintWebsite, autoFixHtml } from './design-linter.js';

/**
 * Generate a complete website using AI + design tokens
 * Falls back to null on failure (caller should use template approach)
 */
export async function generateWithDesignSystem(plan, content, brand, images, styleName, callAI, send) {
  const step = (msg) => { if (send) send('status', { task: msg, step: 5, total: 8 }); };
  
  try {
    step('🎨 Generating design tokens...');
    
    // 1. Generate design tokens
    const customColors = brand?.colors || plan?.brandColors || {};
    const tokensCSS = generateDesignTokens(styleName, customColors);
    const fontLink = generateFontLinks(styleName);
    
    // 2. Build the AI prompt
    const userPrompt = BUILDER_USER_TEMPLATE(plan, tokensCSS, images, styleName);
    
    // 3. Inject design tokens and fonts into the prompt
    const fullPrompt = userPrompt + 
      `\n\nINJECT THIS IN THE <head>:\n` +
      `<link href="${fontLink}" rel="stylesheet">\n` +
      `\nINJECT THIS IN THE <style> BLOCK (after any custom styles):\n${tokensCSS}\n` +
      `\nGenerate the COMPLETE HTML document now. Start with <!DOCTYPE html> and end with </html>. No markdown fences.`;
    
    step('🧠 AI generating premium HTML...');
    
    // 4. Call Mistral API to generate the complete HTML
    // Using Mistral directly — fast, OpenAI-compatible, supports large output
    const mistralKey = process.env.MISTRAL_API_KEY;
    let html = '';
    
    if (mistralKey) {
      try {
        const mistralResp = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${mistralKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'mistral-medium-latest',
            messages: [
              { role: 'system', content: BUILDER_SYSTEM_PROMPT },
              { role: 'user', content: fullPrompt }
            ],
            temperature: 0.4,
            max_tokens: 12000,
          }),
          signal: AbortSignal.timeout(25000),
        });
        
        if (mistralResp.ok) {
          const data = await mistralResp.json();
          html = data.choices?.[0]?.message?.content || '';
        } else {
          // Key invalid/expired/rate-limited — fall through to the multi-provider chain
          step('⚠️ Mistral unavailable, trying provider chain...');
        }
      } catch (e) {
        // Network/timeout error — fall through to the multi-provider chain
        step('⚠️ Mistral timed out, trying provider chain...');
      }
    }
    
    if (!html) {
      // Fallback: use callAI (OpenRouter/Groq chain)
      html = await callAI(
        [
          { role: 'system', content: BUILDER_SYSTEM_PROMPT },
          { role: 'user', content: fullPrompt }
        ],
        { maxTokens: 12000, temperature: 0.4, timeout: 25000 }
      );
    }
    
    if (!html || html.length < 500) {
      throw new Error('AI returned insufficient HTML (' + (html?.length || 0) + ' bytes)');
    }
    
    // 5. Clean up the HTML (remove markdown fences if present)
    html = cleanHtmlResponse(html);
    
    // 6. Validate the HTML
    step('🔍 Validating HTML quality...');
    const lintResult = lintWebsite(html);
    
    if (lintResult.issues && lintResult.issues.length > 0) {
      step(`🔧 Auto-fixing ${lintResult.issues.length} issues...`);
      html = autoFixHtml(html);
    }
    
    // 7. Post-process: add onerror fallbacks to all images
    html = addImageFallbacks(html, plan);
    
    // 8. Verify the HTML is valid
    if (!html.includes('<!DOCTYPE') && !html.includes('<!doctype')) {
      throw new Error('AI output missing DOCTYPE');
    }
    if (!html.includes('</html>')) {
      // Try to close it
      html += '\n</body>\n</html>';
    }
    
    step('✅ AI-generated website complete');
    return html;
    
  } catch(err) {
    console.error('AI builder error:', err.message);
    return null; // Signal fallback to template approach
  }
}

/**
 * Clean AI response — remove markdown fences, leading/trailing whitespace
 */
function cleanHtmlResponse(html) {
  let cleaned = html.trim();
  
  // Remove markdown code fences
  cleaned = cleaned.replace(/^```(?:html|HTML)?\s*\n?/, '');
  cleaned = cleaned.replace(/\s*```\s*$/, '');
  
  // Find the first <!DOCTYPE or <html tag
  const doctypeIdx = cleaned.toLowerCase().indexOf('<!doctype');
  const htmlIdx = cleaned.toLowerCase().indexOf('<html');
  const startIdx = Math.min(
    doctypeIdx >= 0 ? doctypeIdx : Infinity,
    htmlIdx >= 0 ? htmlIdx : Infinity
  );
  
  if (startIdx !== Infinity && startIdx > 0) {
    cleaned = cleaned.substring(startIdx);
  }
  
  // Find the last </html> tag
  const endIdx = cleaned.toLowerCase().lastIndexOf('</html>');
  if (endIdx >= 0) {
    cleaned = cleaned.substring(0, endIdx + 7);
  }
  
  return cleaned.trim();
}

/**
 * Add onerror fallbacks to all img tags that don't have them
 */
function addImageFallbacks(html, plan) {
  const businessType = plan?.type || 'business';
  const fallbackQuery = encodeURIComponent(businessType + ' professional Nigeria high quality photography');
  const fallbackUrl = `https://image.pollinations.ai/prompt/${fallbackQuery}&width=1200&height=800&nologo=true&model=flux`;
  
  // Match img tags without onerror
  return html.replace(/<img\s+([^>]*?)>/gi, (match, attrs) => {
    if (attrs.includes('onerror')) return match; // Already has onerror
    
    // Add onerror fallback
    const newAttrs = attrs + ` onerror="this.onerror=null;this.src='${fallbackUrl}'"`;
    return `<img ${newAttrs}>`;
  });
}
