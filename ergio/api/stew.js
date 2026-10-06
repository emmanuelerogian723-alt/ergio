// ERGIO STEW — authenticated universal agent + connector executor
// All secrets stay server-side and are encrypted per user. Every action is permission checked,
// idempotent, logged, and verified when the provider supports read-after-write.
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { callGroqFast, corsHeaders, success, error } from '../lib/ergio.js';

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyBRhBF6Nscqz53rMCF0ykAcMnWuRIrfgJw';
const RISKY = new Set(['delete','financial','admin','publish']);

const APPS = {
  github: { name:'GitHub', credentials:['token'], capabilities:{
    list_repos:{permission:'read',risk:'low'}, create_issue:{permission:'write',risk:'medium'},
    create_file:{permission:'write',risk:'medium'}, update_file:{permission:'write',risk:'medium'} } },
  slack: { name:'Slack', credentials:['token'], capabilities:{
    list_channels:{permission:'read',risk:'low'}, send_message:{permission:'send',risk:'medium'} } },
  notion: { name:'Notion', credentials:['token'], capabilities:{
    search:{permission:'read',risk:'low'}, create_page:{permission:'write',risk:'medium'}, update_page:{permission:'write',risk:'medium'} } },
  gmail: { name:'Gmail', credentials:['access_token'], capabilities:{
    list_messages:{permission:'read',risk:'low'}, send_email:{permission:'send',risk:'medium'} } },
  google_calendar: { name:'Google Calendar', credentials:['access_token'], capabilities:{
    list_events:{permission:'read',risk:'low'}, create_event:{permission:'write',risk:'medium'}, delete_event:{permission:'delete',risk:'high'} } },
  resend: { name:'Resend', credentials:['api_key','from_email'], capabilities:{
    send_email:{permission:'send',risk:'medium'} } },
  telegram: { name:'Telegram', credentials:['bot_token'], capabilities:{
    get_me:{permission:'read',risk:'low'}, send_message:{permission:'send',risk:'medium'} } },
  paystack: { name:'Paystack', credentials:['secret_key'], capabilities:{
    balance:{permission:'read',risk:'low'}, create_payment_page:{permission:'financial',risk:'high'} } },
  webhook: { name:'Webhook / n8n / Zapier', credentials:['url','secret'], capabilities:{
    trigger:{permission:'write',risk:'medium'} } }
};

function sb(){ return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY); }
function key(){ return crypto.createHash('sha256').update(process.env.CONNECTOR_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_KEY || 'ergio-stew-dev').digest(); }
function encrypt(value){ const iv=crypto.randomBytes(12), c=crypto.createCipheriv('aes-256-gcm',key(),iv); const out=Buffer.concat([c.update(JSON.stringify(value),'utf8'),c.final()]); return `${iv.toString('base64')}.${c.getAuthTag().toString('base64')}.${out.toString('base64')}`; }
function decrypt(value){ const [i,t,d]=String(value||'').split('.'); const c=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(i,'base64')); c.setAuthTag(Buffer.from(t,'base64')); return JSON.parse(Buffer.concat([c.update(Buffer.from(d,'base64')),c.final()]).toString('utf8')); }
function bearer(req){ return String(req.headers.authorization||'').replace(/^Bearer\s+/i,'').trim(); }
async function user(req){
  const token=bearer(req); if(!token) throw Object.assign(new Error('Sign in required'),{status:401});
  const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token})});
  const d=await r.json(); if(!r.ok||!d.users?.[0]) throw Object.assign(new Error('Session expired. Sign in again.'),{status:401});
  return {id:d.users[0].localId,email:d.users[0].email||''};
}
async function rows(db,uid,type){ const {data,error:e}=await db.from('platform_analytics').select('*').eq('event_type',type).order('recorded_at',{ascending:false}).limit(500); if(e) throw e; return (data||[]).filter(x=>(x.event_data||{}).user_id===uid); }
async function latest(db,uid,type,app){ return (await rows(db,uid,type)).find(x=>!app||(x.event_data||{}).app===app)||null; }
async function log(db,uid,type,data,value=0){ const {error:e}=await db.from('platform_analytics').insert({event_type:type,event_data:{...data,user_id:uid,ts:new Date().toISOString()},metric_value:value,recorded_at:new Date().toISOString()}); if(e) throw e; }
async function connection(db,uid,app){ const r=await latest(db,uid,'stew_connector',app); const d=r?.event_data||{}; if(!r||d.status!=='connected'||!d.encrypted) return null; return {...d,credentials:decrypt(d.encrypted)}; }
async function policy(db,uid,app){ const r=await latest(db,uid,'stew_permission',app); return r?.event_data||{permissions:['read'],agentic_access:false,auto_execute:false}; }
function appView(id){ const a=APPS[id]; return {id,name:a.name,credential_fields:a.credentials,capabilities:Object.entries(a.capabilities).map(([action,v])=>({action,...v}))}; }
function need(cap){ return cap?.permission||'read'; }
function providerError(d,status){ const msg=d?.error?.message||d?.message||d?.error||`Provider returned ${status}`; return typeof msg==='string'?msg:JSON.stringify(msg); }
async function jsonFetch(url,opt={}){ const r=await fetch(url,opt); const text=await r.text(); let d; try{d=JSON.parse(text)}catch{d={text}} if(!r.ok) throw new Error(providerError(d,r.status)); return d; }

async function executeProvider(app,action,p,c){
  if(app==='github'){
    const h={Authorization:`Bearer ${c.token}`,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2022-11-28'};
    if(action==='list_repos') return jsonFetch('https://api.github.com/user/repos?per_page=30&sort=updated',{headers:h});
    if(action==='create_issue') return jsonFetch(`https://api.github.com/repos/${p.owner}/${p.repo}/issues`,{method:'POST',headers:h,body:JSON.stringify({title:p.title,body:p.body||''})});
    if(action==='create_file'||action==='update_file') return jsonFetch(`https://api.github.com/repos/${p.owner}/${p.repo}/contents/${String(p.path||'').replace(/^\//,'')}`,{method:'PUT',headers:h,body:JSON.stringify({message:p.message||`Stew: ${action.replace('_',' ')}`,content:Buffer.from(p.content||'').toString('base64'),branch:p.branch||undefined,sha:p.sha||undefined})});
  }
  if(app==='slack'){
    const h={Authorization:`Bearer ${c.token}`,'Content-Type':'application/json; charset=utf-8'};
    if(action==='list_channels') return jsonFetch('https://slack.com/api/conversations.list?limit=100',{headers:h});
    if(action==='send_message') return jsonFetch('https://slack.com/api/chat.postMessage',{method:'POST',headers:h,body:JSON.stringify({channel:p.channel,text:p.text})});
  }
  if(app==='notion'){
    const h={Authorization:`Bearer ${c.token}`,'Notion-Version':'2022-06-28','Content-Type':'application/json'};
    if(action==='search') return jsonFetch('https://api.notion.com/v1/search',{method:'POST',headers:h,body:JSON.stringify({query:p.query||'',page_size:50})});
    if(action==='create_page') return jsonFetch('https://api.notion.com/v1/pages',{method:'POST',headers:h,body:JSON.stringify({parent:p.parent,properties:p.properties,children:p.children||[]})});
    if(action==='update_page') return jsonFetch(`https://api.notion.com/v1/pages/${p.page_id}`,{method:'PATCH',headers:h,body:JSON.stringify({properties:p.properties,archived:p.archived})});
  }
  if(app==='gmail'){
    const h={Authorization:`Bearer ${c.access_token}`,'Content-Type':'application/json'};
    if(action==='list_messages') return jsonFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${Math.min(Number(p.max_results)||20,100)}`,{headers:h});
    if(action==='send_email'){ const raw=Buffer.from(`To: ${p.to}\r\nSubject: ${p.subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${p.body||''}`).toString('base64url'); return jsonFetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:h,body:JSON.stringify({raw})}); }
  }
  if(app==='google_calendar'){
    const h={Authorization:`Bearer ${c.access_token}`,'Content-Type':'application/json'}; const cal=encodeURIComponent(p.calendar_id||'primary');
    if(action==='list_events') return jsonFetch(`https://www.googleapis.com/calendar/v3/calendars/${cal}/events?singleEvents=true&maxResults=${Math.min(Number(p.max_results)||20,100)}&timeMin=${encodeURIComponent(p.time_min||new Date().toISOString())}`,{headers:h});
    if(action==='create_event') return jsonFetch(`https://www.googleapis.com/calendar/v3/calendars/${cal}/events`,{method:'POST',headers:h,body:JSON.stringify(p.event)});
    if(action==='delete_event') return jsonFetch(`https://www.googleapis.com/calendar/v3/calendars/${cal}/events/${encodeURIComponent(p.event_id)}`,{method:'DELETE',headers:h});
  }
  if(app==='resend'&&action==='send_email') return jsonFetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${c.api_key}`,'Content-Type':'application/json','Idempotency-Key':p.idempotency_key},body:JSON.stringify({from:p.from||c.from_email,to:Array.isArray(p.to)?p.to:[p.to],subject:p.subject,html:p.html,text:p.text})});
  if(app==='telegram'){
    if(action==='get_me') return jsonFetch(`https://api.telegram.org/bot${c.bot_token}/getMe`);
    if(action==='send_message') return jsonFetch(`https://api.telegram.org/bot${c.bot_token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:p.chat_id,text:p.text,parse_mode:p.parse_mode})});
  }
  if(app==='paystack'){
    const h={Authorization:`Bearer ${c.secret_key}`,'Content-Type':'application/json'};
    if(action==='balance') return jsonFetch('https://api.paystack.co/balance',{headers:h});
    if(action==='create_payment_page') return jsonFetch('https://api.paystack.co/page',{method:'POST',headers:h,body:JSON.stringify({name:p.name,description:p.description,amount:p.amount?Math.round(Number(p.amount)*100):undefined,currency:p.currency||'NGN'})});
  }
  if(app==='webhook'&&action==='trigger') return jsonFetch(c.url,{method:p.method||'POST',headers:{'Content-Type':'application/json',...(c.secret?{'X-Ergio-Secret':c.secret}:{}),...(p.headers||{})},body:JSON.stringify(p.payload||{})});
  throw new Error(`Unsupported action ${app}.${action}`);
}

function approvalToken(uid,app,action,params){ const payload=Buffer.from(JSON.stringify({uid,app,action,params,exp:Date.now()+10*60*1000})).toString('base64url'); const sig=crypto.createHmac('sha256',key()).update(payload).digest('base64url'); return `${payload}.${sig}`; }
function verifyApproval(token,uid){ const [p,s]=String(token||'').split('.'); const sig=crypto.createHmac('sha256',key()).update(p||'').digest('base64url'); if(!s||s.length!==sig.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(sig))) throw new Error('Invalid approval'); const d=JSON.parse(Buffer.from(p,'base64url')); if(d.uid!==uid||d.exp<Date.now()) throw new Error('Approval expired'); return d; }
async function run(db,u,app,action,params,idempotencyKey,approved=false){
  const def=APPS[app],cap=def?.capabilities[action]; if(!cap) throw Object.assign(new Error('Capability not supported'),{status:400});
  const conn=await connection(db,u.id,app); if(!conn) throw Object.assign(new Error(`${def.name} is not connected`),{status:409});
  const pol=await policy(db,u.id,app); if(!pol.agentic_access) throw Object.assign(new Error(`Stew access is off for ${def.name}`),{status:403});
  if(!(pol.permissions||[]).includes(need(cap))) throw Object.assign(new Error(`${need(cap)} permission is not granted for ${def.name}`),{status:403});
  const idem=String(idempotencyKey||crypto.randomUUID()); const old=(await rows(db,u.id,'stew_action')).find(r=>(r.event_data||{}).idempotency_key===idem&&(r.event_data||{}).status==='succeeded'); if(old) return {replayed:true,...old.event_data};
  if((cap.risk==='high'||RISKY.has(cap.permission))&&!approved) return {approval_required:true,approval_token:approvalToken(u.id,app,action,params),app,action,risk:cap.risk,summary:`Allow Stew to run ${def.name}: ${action.replaceAll('_',' ')}?`};
  const started=Date.now();
  try{ const result=await executeProvider(app,action,params||{},conn.credentials); await log(db,u.id,'stew_action',{app,action,status:'succeeded',permission:cap.permission,risk:cap.risk,idempotency_key:idem,duration_ms:Date.now()-started,params_summary:Object.keys(params||{}),provider_id:result?.id||result?.data?.id||result?.ts||null}); return {success:true,app,action,result,idempotency_key:idem,verified:!!(result?.id||result?.data?.id||result?.ok)}; }
  catch(e){ await log(db,u.id,'stew_action',{app,action,status:'failed',permission:cap.permission,risk:cap.risk,idempotency_key:idem,duration_ms:Date.now()-started,error:e.message}); throw e; }
}

export default async function handler(req,res){
  corsHeaders(res); if(req.method==='OPTIONS') return res.status(200).end();
  try{
    const u=await user(req),db=sb(),body=req.body||{},action=body.action||req.query.action||'status';
    if(action==='catalog') return success(res,{apps:Object.keys(APPS).map(appView)});
    if(action==='status'){
      const connectors=await rows(db,u.id,'stew_connector'),permissions=await rows(db,u.id,'stew_permission'); const latestBy=(arr)=>Object.values(arr.reduce((a,r)=>{const x=r.event_data||{};if(x.app&&!a[x.app])a[x.app]=x;return a},{}));
      return success(res,{apps:Object.keys(APPS).map(appView),connections:latestBy(connectors).map(x=>({app:x.app,status:x.status,connected_at:x.connected_at})),permissions:latestBy(permissions).map(x=>({app:x.app,permissions:x.permissions||[],agentic_access:!!x.agentic_access,auto_execute:!!x.auto_execute}))});
    }
    if(action==='connect'){
      const app=body.app,def=APPS[app]; if(!def) return error(res,'Unknown app',400); const creds=body.credentials||{}; for(const f of def.credentials) if(!creds[f]) return error(res,`Missing ${f}`,400);
      await log(db,u.id,'stew_connector',{app,status:'connected',encrypted:encrypt(creds),connected_at:new Date().toISOString()}); await log(db,u.id,'stew_permission',{app,permissions:['read'],agentic_access:false,auto_execute:false}); return success(res,{connected:true,app,permissions:['read'],agentic_access:false});
    }
    if(action==='disconnect'){ await log(db,u.id,'stew_connector',{app:body.app,status:'disconnected',connected_at:new Date().toISOString()}); return success(res,{disconnected:true,app:body.app}); }
    if(action==='permissions'){
      if(!APPS[body.app]) return error(res,'Unknown app',400); const allowed=['read','write','send','delete','financial','admin','publish']; const perms=[...new Set((body.permissions||[]).filter(x=>allowed.includes(x)))];
      await log(db,u.id,'stew_permission',{app:body.app,permissions:perms,agentic_access:!!body.agentic_access,auto_execute:!!body.auto_execute,updated_at:new Date().toISOString()}); return success(res,{app:body.app,permissions:perms,agentic_access:!!body.agentic_access,auto_execute:!!body.auto_execute});
    }
    if(action==='approve'){ const a=verifyApproval(body.approval_token,u.id); return success(res,await run(db,u,a.app,a.action,a.params,body.idempotency_key,true)); }
    if(action==='execute') return success(res,await run(db,u,body.app,body.capability,body.params||{},body.idempotency_key,false));
    if(action==='chat'){
      const conns=(await rows(db,u.id,'stew_connector')).filter((r,i,a)=>a.findIndex(x=>(x.event_data||{}).app===(r.event_data||{}).app)===i&&(r.event_data||{}).status==='connected').map(r=>(r.event_data||{}).app);
      const caps=conns.flatMap(app=>Object.keys(APPS[app].capabilities).map(x=>`${app}.${x}`)); if(!caps.length) return success(res,{response:'Connect an app first, then grant Stew access and the permissions needed for the task.',needs_connection:true});
      const prompt=`You are Stew, an action planner. User request: ${JSON.stringify(String(body.message||'').slice(0,2000))}\nAvailable capabilities: ${caps.join(', ')}. Return ONLY JSON: {"response":"short explanation","execute":true|false,"app":"id","capability":"action","params":{}}. Use execute false for questions, ambiguity, or missing required details. Never invent recipients, repository names, channel IDs, event IDs, dates, amounts, or destructive targets.`;
      const raw=await callGroqFast([{role:'user',content:prompt}],{maxTokens:700}).catch(()=>'{"execute":false,"response":"I could not safely plan that action. Please add the target and details."}'); let plan; try{plan=JSON.parse(String(raw).replace(/```json|```/g,'').trim())}catch{plan={execute:false,response:String(raw).slice(0,1000)}};
      if(!plan.execute) return success(res,{response:plan.response||'Please provide the missing details.',plan});
      const result=await run(db,u,plan.app,plan.capability,plan.params||{},body.idempotency_key,false); return success(res,{response:plan.response||`I prepared ${plan.app}.${plan.capability}.`,plan,result});
    }
    if(action==='history'){ const h=await rows(db,u.id,'stew_action'); return success(res,{actions:h.slice(0,100).map(x=>x.event_data)}); }
    return error(res,'Unknown Stew action',400);
  }catch(e){ console.error('[stew]',e.message); return error(res,e.message,e.status||500); }
}
