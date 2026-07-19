/**
 * ERGIO Command Center
 * Unified interface between Vercel frontend and Render Python backend.
 * The Conductor (AI brain) receives any request and orchestrates all 10 engines.
 */
window.ErgioCommand = (function () {
  const engines = window.ErgioEngines;
  const config = window.ERGIO_CONFIG || {};
  const SUPABASE_URL = config.supabaseUrl;
  const SUPABASE_KEY = config.supabaseAnonKey;

  // ── Supabase helper (inline, no SDK needed) ──
  async function sbFetch(table, method, body, query) {
    const url = `${SUPABASE_URL}/rest/v1/${table}${query || ''}`;
    const headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    };
    if (method === 'POST' || method === 'PATCH') headers['Prefer'] = 'return=representation';
    const resp = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (!resp.ok) throw new Error(`Supabase ${resp.status}: ${await resp.text()}`);
    return resp.json();
  }

  // ── The main command function ──
  async function command(text, businessId, userId) {
    // Route through the Render Conductor
    try {
      const result = await engines.conductor(text, businessId, userId);
      return result;
    } catch (e) {
      console.warn('[ErgioCommand] Conductor failed, using local fallback:', e.message);
      return localFallback(text, businessId);
    }
  }

  // ── Local fallback (if Render is sleeping/cold-starting) ──
  async function localFallback(text, businessId) {
    const lower = text.toLowerCase();
    
    if (lower.includes('lead') || lower.includes('client') || lower.includes('customer')) {
      return { summary: 'Lead Engine activated locally. Searching for leads...', engines_used: ['lead_engine'] };
    }
    if (lower.includes('website') || lower.includes('build')) {
      return { summary: 'Website Engine activated. Use the build flow above to generate your website.', engines_used: ['website_engine'] };
    }
    if (lower.includes('invoice') || lower.includes('bill')) {
      return { summary: 'Invoice Engine ready. Generate invoices from the dashboard.', engines_used: ['invoice_engine'] };
    }
    if (lower.includes('payment') || lower.includes('pay')) {
      return { summary: 'Payment Engine ready. Accept payments via Paystack, Flutterwave, or Stripe.', engines_used: ['payment_engine'] };
    }
    return { summary: 'ERGIO is waking up on Render (cold start). Try again in a few seconds.', engines_used: [] };
  }

  // ── Lead Engine ──
  async function findLeads(businessType, city, businessId) {
    try {
      return await engines.discovery({ business_type: businessType, city: city, business_id: businessId });
    } catch (e) {
      console.warn('[ErgioCommand] Lead discovery failed, trying local:', e.message);
      return null;
    }
  }

  // ── Demand Matching ──
  async function matchDemand(businessType, city, services, businessId) {
    try {
      return await engines.matching({ business_type: businessType, city: city, services: services, business_id: businessId });
    } catch (e) {
      return { error: e.message };
    }
  }

  // ── Outreach ──
  async function sendOutreach(businessId, businessName, businessType, city, leadIds, maxOutreach) {
    try {
      return await engines.outreach({
        business_id: businessId, business_name: businessName,
        business_type: businessType, city: city,
        lead_ids: leadIds, max_outreach: maxOutreach || 10,
      });
    } catch (e) {
      return { error: e.message };
    }
  }

  // ── Content Generation ──
  async function generateContent(businessName, businessType, city, services) {
    try {
      return await engines.socialContent({ business_name: businessName, business_type: businessType, city: city, services: services });
    } catch (e) {
      return { error: e.message };
    }
  }

  // ── Search ──
  async function search(query, count) {
    try {
      return await engines.search(query, count || 10, 'general');
    } catch (e) {
      return { results: [] };
    }
  }

  // ── Scrape ──
  async function scrape(url, useBrowser) {
    try {
      return await engines.scrape(url, useBrowser);
    } catch (e) {
      return { error: e.message };
    }
  }

  // ── AI Direct ──
  async function ai(prompt, system, jsonMode) {
    try {
      return await engines.ai(prompt, system, jsonMode);
    } catch (e) {
      return { error: e.message };
    }
  }

  // ── Approvals ──
  async function getApprovals(businessId) {
    try {
      return await engines.getApprovals(businessId);
    } catch (e) {
      return { pending: [], count: 0 };
    }
  }

  async function approve(approvalId, userId) {
    return engines.approve(approvalId, userId);
  }

  async function reject(approvalId, reason, userId) {
    return engines.reject(approvalId, reason, userId);
  }

  // ── Memory ──
  async function remember(fact, category, businessId) {
    return engines.memoryRemember(fact, category || 'general', businessId);
  }

  async function recall(query, businessId) {
    return engines.memoryRecall(query, businessId);
  }

  // ── Business CRUD via Supabase ──
  async function saveBusiness(businessData) {
    return sbFetch('businesses', 'POST', businessData);
  }

  async function getBusinesses(ownerId) {
    const q = ownerId ? `?owner_id=eq.${ownerId}&order=created_at.desc` : '?order=created_at.desc&limit=50';
    return sbFetch('businesses', 'GET', null, q);
  }

  async function saveLead(leadData) {
    return sbFetch('leads', 'POST', leadData);
  }

  async function getLeads(businessId) {
    return sbFetch('leads', 'GET', null, `?business_id=eq.${businessId}&order=created_at.desc&limit=100`);
  }

  async function saveBooking(bookingData) {
    return sbFetch('bookings', 'POST', bookingData);
  }

  async function getBookings(businessId) {
    return sbFetch('bookings', 'GET', null, `?business_id=eq.${businessId}&order=start_time.desc&limit=100`);
  }

  async function saveInvoice(invoiceData) {
    return sbFetch('invoices', 'POST', invoiceData);
  }

  async function getInvoices(businessId) {
    return sbFetch('invoices', 'GET', null, `?business_id=eq.${businessId}&order=created_at.desc&limit=100`);
  }

  async function savePayment(paymentData) {
    return sbFetch('payments', 'POST', paymentData);
  }

  async function getPayments(businessId) {
    return sbFetch('payments', 'GET', null, `?business_id=eq.${businessId}&order=created_at.desc&limit=100`);
  }

  async function getClients(businessId) {
    return sbFetch('clients', 'GET', null, `?business_id=eq.${businessId}&order=created_at.desc&limit=100`);
  }

  async function getReviews(businessId) {
    return sbFetch('reviews', 'GET', null, `?business_id=eq.${businessId}&order=created_at.desc&limit=100`);
  }

  async function getTransactions(businessId) {
    return sbFetch('transactions', 'GET', null, `?business_id=eq.${businessId}&order=created_at.desc&limit=100`);
  }

  async function getWorkflows(businessId) {
    return sbFetch('workflows', 'GET', null, `?business_id=eq.${businessId}&order=created_at.desc`);
  }

  async function saveWorkflow(workflowData) {
    return sbFetch('workflows', 'POST', workflowData);
  }

  // ── Engine Status ──
  async function getEngineStatus(businessId) {
    return sbFetch('engine_status', 'GET', null, `?business_id=eq.${businessId}&order=updated_at.desc`);
  }

  // ── Health Check ──
  async function checkHealth() {
    try {
      return await engines.health();
    } catch (e) {
      return { status: 'offline', error: e.message };
    }
  }

  // ── System Status ──
  async function getSystemStatus() {
    try {
      return await engines.status();
    } catch (e) {
      return { status: 'offline', error: e.message };
    }
  }

  return {
    command,
    findLeads,
    matchDemand,
    sendOutreach,
    generateContent,
    search,
    scrape,
    ai,
    getApprovals,
    approve,
    reject,
    remember,
    recall,
    // Supabase CRUD
    saveBusiness,
    getBusinesses,
    saveLead,
    getLeads,
    saveBooking,
    getBookings,
    saveInvoice,
    getInvoices,
    savePayment,
    getPayments,
    getClients,
    getReviews,
    getTransactions,
    getWorkflows,
    saveWorkflow,
    getEngineStatus,
    checkHealth,
    getSystemStatus,
  };
})();
