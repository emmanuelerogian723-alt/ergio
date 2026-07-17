// ========================================
// ERGIO API — /api/advisor (AI Business Advisor Engine)
// The crown jewel — analyzes ALL business data and gives smart recommendations
// ========================================

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.SUPABASE_DB_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
  const GROQ_KEY = process.env.GROQ_API_KEY || '';

  const AI_URL = GROQ_KEY
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions';
  const AI_KEY = GROQ_KEY || OPENROUTER_KEY;
  const AI_MODEL = GROQ_KEY ? 'llama-3.3-70b-versatile' : 'meta-llama/llama-3.3-70b-instruct';

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const action = url.searchParams.get('action') || (req.method === 'GET' ? 'analyze' : 'recommend');

    // ── GET: Full business analysis ──
    if (req.method === 'GET' && action === 'analyze') {
      const userId = url.searchParams.get('userId');
      const businessId = url.searchParams.get('businessId');

      if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(200).json(generateDemoAnalysis());
      }

      // Fetch all business data from multiple tables
      const headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      };

      const queries = [
        { table: 'businesses', filter: businessId ? `id=eq.${businessId}` : (userId ? `user_id=eq.${userId}` : '') },
        { table: 'leads', filter: userId ? `user_id=eq.${userId}` : '' },
        { table: 'payments', filter: userId ? `user_id=eq.${userId}` : '' },
        { table: 'bookings', filter: userId ? `user_id=eq.${userId}` : '' },
        { table: 'reviews', filter: userId ? `user_id=eq.${userId}` : '' },
      ];

      const results = {};
      for (const q of queries) {
        if (!q.filter) continue;
        try {
          const r = await fetch(`${SUPABASE_URL}/rest/v1/${q.table}?${q.filter}&limit=50`, {
            headers
          });
          if (r.ok) {
            results[q.table] = await r.json();
          }
        } catch (e) {
          results[q.table] = [];
        }
      }

      // Build analysis from data
      const analysis = buildAnalysis(results);

      // If AI available, get smart recommendations
      if (AI_KEY) {
        try {
          analysis.recommendations = await getAIRecommendations(analysis, AI_URL, AI_KEY, AI_MODEL);
        } catch (e) {
          analysis.recommendations = generateRuleBasedRecommendations(analysis);
        }
      } else {
        analysis.recommendations = generateRuleBasedRecommendations(analysis);
      }

      return res.status(200).json(analysis);
    }

    // ── POST: Ask the advisor a specific question ──
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { question, businessData, businessName, industry, location } = body;

      if (!question) {
        return res.status(400).json({ success: false, error: 'Question is required' });
      }

      if (!AI_KEY) {
        return res.status(200).json({
          success: true,
          answer: generateGenericAdvice(question, businessName, industry, location),
          source: 'rule-based'
        });
      }

      const systemPrompt = `You are ERGIO's AI Business Advisor — a world-class business consultant for African businesses. 
You analyze business data and give actionable, specific, practical advice.
You understand the African market — Nigeria, Ghana, Kenya, South Africa, etc.
You consider local factors: payment systems (Paystack, Flutterwave), mobile money, WhatsApp business culture, social media commerce.
Be direct, practical, and specific. Use numbers. Give step-by-step actions.
If asked about the business, use the provided data: ${JSON.stringify(businessData || {})}
Business: ${businessName || 'Unknown'}, Industry: ${industry || 'General'}, Location: ${location || 'Nigeria'}`;

      const response = await fetch(AI_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_KEY}`
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        return res.status(200).json({
          success: true,
          answer: generateGenericAdvice(question, businessName, industry, location),
          source: 'fallback'
        });
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || 'No advice available right now.';

      return res.status(200).json({
        success: true,
        answer,
        source: 'ai'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Advisor error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// ── Build analysis from business data ──
function buildAnalysis(data) {
  const businesses = data.businesses || [];
  const leads = data.leads || [];
  const payments = data.payments || [];
  const bookings = data.bookings || [];
  const reviews = data.reviews || [];

  const business = businesses[0] || { name: 'Your Business' };

  // Revenue calculation
  const totalRevenue = payments
    .filter(p => p.status === 'success' || p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingRevenue = payments
    .filter(p => p.status === 'pending' || p.status === 'initiated')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Lead stats
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter(l => l.score && l.score > 50).length;
  const leadConversionRate = totalLeads > 0 ? ((bookings.length / totalLeads) * 100).toFixed(1) : 0;

  // Review stats
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : 0;

  // Health Score calculation (0-100)
  const revenueScore = Math.min(totalRevenue / 100000 * 25, 25);
  const leadScore = Math.min(totalLeads / 20 * 20, 20);
  const conversionScore = Math.min(parseFloat(leadConversionRate) / 20 * 20, 20);
  const ratingScore = Math.min(parseFloat(avgRating) / 5 * 15, 15);
  const bookingScore = Math.min(bookings.length / 10 * 20, 20);
  const healthScore = Math.round(revenueScore + leadScore + conversionScore + ratingScore + bookingScore);

  // Determine health status
  let healthStatus = 'Critical';
  if (healthScore >= 75) healthStatus = 'Excellent';
  else if (healthScore >= 50) healthStatus = 'Good';
  else if (healthScore >= 30) healthStatus = 'Needs Attention';

  return {
    success: true,
    business: {
      name: business.name || 'Your Business',
      industry: business.business_type || business.industry || 'General',
      location: business.city || business.location || 'Nigeria'
    },
    healthScore,
    healthStatus,
    metrics: {
      totalRevenue,
      pendingRevenue,
      totalLeads,
      qualifiedLeads,
      leadConversionRate: parseFloat(leadConversionRate),
      totalBookings: bookings.length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      pendingBookings: bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length,
      totalReviews: reviews.length,
      avgRating: parseFloat(avgRating)
    },
    breakdown: {
      revenue: { score: Math.round(revenueScore), max: 25, label: 'Revenue Performance' },
      leads: { score: Math.round(leadScore), max: 20, label: 'Lead Generation' },
      conversion: { score: Math.round(conversionScore), max: 20, label: 'Conversion Rate' },
      reputation: { score: Math.round(ratingScore), max: 15, label: 'Customer Reputation' },
      bookings: { score: Math.round(bookingScore), max: 20, label: 'Booking Activity' }
    },
    insights: generateInsights(healthScore, totalRevenue, totalLeads, parseFloat(leadConversionRate), parseFloat(avgRating), bookings.length),
    generatedAt: new Date().toISOString()
  };
}

// ── Generate insights from metrics ──
function generateInsights(health, revenue, leads, conversion, rating, bookings) {
  const insights = [];

  if (revenue === 0) insights.push({ type: 'warning', icon: '💰', text: 'No revenue recorded yet. Focus on converting leads to paying customers.' });
  else if (revenue < 50000) insights.push({ type: 'info', icon: '💰', text: `₦${revenue.toLocaleString()} in revenue. Set a target of ₦100,000 to hit your first milestone.` });
  else insights.push({ type: 'success', icon: '💰', text: `₦${revenue.toLocaleString()} in revenue. You're building momentum — consider raising prices or adding premium tiers.` });

  if (leads === 0) insights.push({ type: 'warning', icon: '🎯', text: 'No leads yet. Run the Lead Scanner to find potential customers in your area.' });
  else if (leads < 10) insights.push({ type: 'info', icon: '🎯', text: `${leads} leads found. Run the scanner daily to build a pipeline of 50+ leads.` });
  else insights.push({ type: 'success', icon: '🎯', text: `${leads} leads in your pipeline. Focus on follow-ups — the money is in the follow-up.` });

  if (conversion === 0 && leads > 0) insights.push({ type: 'warning', icon: '🔄', text: '0% conversion rate. Improve your proposals and follow-up speed to convert leads.' });
  else if (conversion > 0 && conversion < 5) insights.push({ type: 'info', icon: '🔄', text: `${conversion}% conversion. Target 10%+ — the industry average for service businesses.` });

  if (rating > 0 && rating < 3) insights.push({ type: 'warning', icon: '⭐', text: `${rating}★ average rating. Address negative reviews immediately to protect your reputation.` });
  else if (rating >= 4) insights.push({ type: 'success', icon: '⭐', text: `${rating}★ average rating. Use this as a selling point — add testimonials to your website.` });

  if (bookings === 0) insights.push({ type: 'warning', icon: '📅', text: 'No bookings yet. Add a booking widget to your website and share it on WhatsApp.' });

  return insights;
}

// ── Get AI recommendations ──
async function getAIRecommendations(analysis, aiUrl, aiKey, model) {
  const systemPrompt = `You are ERGIO's AI Business Advisor for African businesses.
Analyze the business metrics and give 5 specific, actionable recommendations.
Format as JSON array: [{"priority": "high|medium|low", "title": "Short title", "description": "2-3 sentence specific advice", "action": "Concrete next step", "expectedImpact": "What this will achieve"}]
Be specific to the African market. Use Naira (₦) for amounts. Consider Paystack, WhatsApp, Instagram for business.`;

  const userPrompt = `Business: ${analysis.business.name}, Industry: ${analysis.business.industry}, Location: ${analysis.business.location}
Health Score: ${analysis.healthScore}/100 (${analysis.healthStatus})
Revenue: ₦${analysis.metrics.totalRevenue}
Leads: ${analysis.metrics.totalLeads} (${analysis.metrics.qualifiedLeads} qualified)
Conversion Rate: ${analysis.metrics.leadConversionRate}%
Bookings: ${analysis.metrics.totalBookings}
Reviews: ${analysis.metrics.totalReviews} (avg ${analysis.metrics.avgRating}★)

Give 5 specific recommendations to grow this business:`;

  const response = await fetch(aiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) throw new Error('AI request failed');

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(content);
    return parsed.recommendations || parsed.recommend || parsed;
  } catch (e) {
    // If not JSON, return as single recommendation
    return [{
      priority: 'medium',
      title: 'AI Recommendation',
      description: content,
      action: 'Review and implement',
      expectedImpact: 'Business growth'
    }];
  }
}

// ── Rule-based recommendations (fallback when no AI key) ──
function generateRuleBasedRecommendations(analysis) {
  const recs = [];
  const m = analysis.metrics;

  if (m.totalLeads < 10) {
    recs.push({
      priority: 'high',
      title: 'Build Your Lead Pipeline',
      description: 'You have fewer than 10 leads. Use the Lead Scanner to find potential customers searching for your service in your area.',
      action: 'Run Lead Scanner with your business type and city, then export results',
      expectedImpact: '20-50 new leads within a week'
    });
  }

  if (m.leadConversionRate < 5 && m.totalLeads > 0) {
    recs.push({
      priority: 'high',
      title: 'Improve Your Conversion Rate',
      description: `Your conversion rate is ${m.leadConversionRate}%. The industry average is 10-15%. Send personalized proposals within 24 hours of lead contact.`,
      action: 'Use the Proposals engine to generate professional proposals, then follow up via WhatsApp',
      expectedImpact: '2-3x more paying customers'
    });
  }

  if (m.totalRevenue < 100000) {
    recs.push({
      priority: 'high',
      title: 'Set Revenue Milestones',
      description: 'You\'re under ₦100,000 in revenue. Break this down: set a ₦50,000/month target, then scale. Consider adding a premium service tier.',
      action: 'Add 3 pricing tiers (Basic, Pro, Premium) to your website and promote the premium tier',
      expectedImpact: '₦50,000-₦100,000/month within 60 days'
    });
  }

  if (m.avgRating > 0 && m.avgRating < 4) {
    recs.push({
      priority: 'high',
      title: 'Fix Your Reputation',
      description: `Your average rating is ${m.avgRating}★. This drives customers away. Contact recent unhappy customers, resolve issues, and ask happy customers for reviews.`,
      action: 'Send WhatsApp message to 5 happy customers asking for Google reviews',
      expectedImpact: 'Rating improvement to 4.5+ within 30 days'
    });
  }

  if (m.totalBookings < 5) {
    recs.push({
      priority: 'medium',
      title: 'Add Online Booking',
      description: 'Few bookings means customers can\'t easily schedule with you. Add a booking widget to your website and share the link on WhatsApp and Instagram.',
      action: 'Enable the Booking engine and add the widget to your website footer',
      expectedImpact: '10+ bookings/month passively'
    });
  }

  recs.push({
    priority: 'medium',
    title: 'Automate Your Follow-ups',
    description: '80% of sales require 5+ follow-ups. Most businesses give up after 2. Set up WhatsApp auto-follow-up for leads who haven\'t responded.',
    action: 'Enable the WhatsApp engine with follow-up templates',
    expectedImpact: '30% more responses from cold leads'
  });

  recs.push({
    priority: 'low',
    title: 'Track Every Naira',
    description: 'You can\'t improve what you don\'t measure. Track all income and expenses to see your real profit margin.',
    action: 'Log every transaction in the Expenses tracker daily',
    expectedImpact: 'Clear profit visibility and better pricing decisions'
  });

  return recs.slice(0, 7);
}

// ── Generic advice for questions ──
function generateGenericAdvice(question, businessName, industry, location) {
  const q = question.toLowerCase();

  if (q.includes('price') || q.includes('pricing') || q.includes('charge')) {
    return `For ${industry || 'your business'} in ${location || 'Nigeria'}, research what competitors charge on Instagram and Google. Start at the mid-range, then add 20% for premium positioning. Most service businesses undercharge — don't be afraid to price for value, not time. Consider 3 tiers: Basic (entry), Pro (most popular), Premium (high-ticket).`;
  }

  if (q.includes('client') || q.includes('customer') || q.includes('lead')) {
    return `To get more clients for ${businessName || 'your business'}: 1) Run the Lead Scanner to find people actively searching for your service. 2) Send personalized WhatsApp messages (not broadcasts). 3) Follow up 5+ times — most sales happen after the 3rd contact. 4) Ask existing clients for referrals — offer a 10% discount for successful referrals.`;
  }

  if (q.includes('grow') || q.includes('scale') || q.includes('expand')) {
    return `To grow ${businessName || 'your business'}: 1) Niche down — dominate one specific service before expanding. 2) Build systems — document your process so you can hire help. 3) Increase prices once you have 10+ happy clients. 4) Add recurring revenue (monthly retainers, subscriptions). 5) Expand to a new city only after you're fully booked in your current one.`;
  }

  if (q.includes('market') || q.includes('advert') || q.includes('promote')) {
    return `Marketing for ${industry || 'your business'} in ${location || 'Nigeria'}: 1) Instagram is king — post daily with before/after photos. 2) Join local Facebook groups and provide value, not ads. 3) Partner with complementary businesses (e.g., if you're a caterer, partner with event planners). 4) Use WhatsApp Status to share offers. 5) Run ₦5,000/day Facebook ads targeting your city.`;
  }

  return `Great question! For ${businessName || 'your business'} in ${industry || 'your industry'}, focus on: 1) Finding and converting leads using ERGIO's Lead Scanner. 2) Building a professional online presence with ERGIO's website builder. 3) Following up with every lead via WhatsApp within 2 hours. 4) Tracking your revenue and expenses to know your numbers. 5) Asking happy customers for reviews and referrals. What specific area would you like to dive deeper into?`;
}

// ── Demo analysis (when Supabase not configured) ──
function generateDemoAnalysis() {
  return {
    success: true,
    business: { name: 'Demo Business', industry: 'General', location: 'Nigeria' },
    healthScore: 0,
    healthStatus: 'Setup Required',
    metrics: {
      totalRevenue: 0, pendingRevenue: 0, totalLeads: 0, qualifiedLeads: 0,
      leadConversionRate: 0, totalBookings: 0, completedBookings: 0,
      pendingBookings: 0, totalReviews: 0, avgRating: 0
    },
    breakdown: {
      revenue: { score: 0, max: 25, label: 'Revenue Performance' },
      leads: { score: 0, max: 20, label: 'Lead Generation' },
      conversion: { score: 0, max: 20, label: 'Conversion Rate' },
      reputation: { score: 0, max: 15, label: 'Customer Reputation' },
      bookings: { score: 0, max: 20, label: 'Booking Activity' }
    },
    insights: [
      { type: 'warning', icon: '🚀', text: 'Connect your Supabase database to get personalized business analysis.' }
    ],
    recommendations: generateRuleBasedRecommendations({
      metrics: { totalLeads: 0, leadConversionRate: 0, totalRevenue: 0, totalBookings: 0, avgRating: 0 }
    }),
    generatedAt: new Date().toISOString()
  };
}
