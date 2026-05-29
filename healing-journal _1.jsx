import { useState, useEffect, useCallback } from "react";

// ── Supabase Config ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://kebwstdsswdfoppkozxy.supabase.co";
const SUPABASE_KEY = "sb_publishable_yjK742jX_QVb0z_Hc_vj_w_ADMGTBBO";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  return { data, error: res.ok ? null : data };
}

async function sbAuth(path, body) {
  return sbFetch(`/auth/v1${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "apikey": SUPABASE_KEY }
  });
}

async function sbDb(path, method = "GET", body = null, token = null) {
  return sbFetch(`/rest/v1${path}`, {
    method,
    body: body ? JSON.stringify(body) : null,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${token}`,
      "Prefer": method === "POST" ? "return=representation" : "return=representation",
      ...(method === "PATCH" ? { "Prefer": "return=representation" } : {})
    }
  });
}

// ── Data ────────────────────────────────────────────────────────────────────
const sections = [
  { id: "welcome", title: "You Are Not Alone", icon: "✦", color: "#E8C547", intro: `What happened to you was real. The pain, the confusion, the shame — all of it was real. And none of it was your fault.\n\nThis journal is a safe space to process what you've been through, reclaim your identity, and walk forward — without guilt, without shame, without permission from anyone.`, prompts: [] },
  { id: "acknowledge", title: "Name What Happened", icon: "◈", color: "#E8835A", intro: "Healing begins when we stop minimizing our pain. You don't have to call it 'a misunderstanding.' You are allowed to name it for what it was.", prompts: [
    { id: "a1", question: "Describe what happened to you, in your own words — without softening it for anyone else's comfort.", placeholder: "Write freely here. This is your space..." },
    { id: "a2", question: "What were you told about yourself that you now believe was untrue or weaponized against you?", placeholder: "Perhaps things like: you're rebellious, you lack faith..." },
    { id: "a3", question: "How did the mistreatment affect your daily life, relationships, and sense of self?", placeholder: "Think about sleep, trust, self-worth, relationships..." }
  ]},
  { id: "guilt", title: "Releasing the Guilt", icon: "◇", color: "#7EB5A6", intro: "Guilt is often the heaviest thing survivors carry — especially when it was deliberately placed on you. Spiritual abuse thrives on guilt.", prompts: [
    { id: "g1", question: "What guilt are you still carrying? Write it all out, no matter how irrational it might seem.", placeholder: "I feel guilty that I left... I feel guilty that I spoke up..." },
    { id: "g2", question: "For each guilt above — ask yourself: 'Did I create this, or was it handed to me?'", placeholder: "Be honest with yourself. Some guilt was manufactured by others to control you..." },
    { id: "g3", question: "Write a letter releasing the guilt that was never yours to carry. Address it to yourself.", placeholder: "Dear [your name], I am releasing you from the burden of..." }
  ]},
  { id: "identity", title: "Reclaiming Your Identity", icon: "◉", color: "#B47EB5", intro: "Spiritual abuse often strips people of their identity. This is about remembering who YOU actually are.", prompts: [
    { id: "i1", question: "Before the hurt began — who were you? What did you love, value, believe?", placeholder: "Think about your curiosity, your humor, your passions..." },
    { id: "i2", question: "What parts of yourself were suppressed, mocked, or punished in that environment?", placeholder: "Your questions, your opinions, your emotions, your ambitions..." },
    { id: "i3", question: "Write 10 true things about who you are that no institution can define or take away.", placeholder: "1. I am someone who...\n2. I believe...\n3. I value..." }
  ]},
  { id: "anger", title: "Your Anger is Valid", icon: "▲", color: "#E85A5A", intro: "You may have been taught that anger is a sin. It isn't. Anger is information. You are allowed to feel it fully.", prompts: [
    { id: "an1", question: "What are you angry about? Write it without apology. Let it be as big as it actually is.", placeholder: "I am angry that... I am furious that..." },
    { id: "an2", question: "Were you taught that expressing anger was sinful? How has that affected you?", placeholder: "Think about how you've suppressed yourself, what it cost you..." },
    { id: "an3", question: "What would you say to the people who hurt you, if there were zero consequences?", placeholder: "This is private. Be honest. You deserve to say what was never allowed..." }
  ]},
  { id: "boundaries", title: "Building New Boundaries", icon: "▣", color: "#5A8CE8", intro: "You get to decide what you let in from here. Your beliefs, your community — all of it is yours to define.", prompts: [
    { id: "b1", question: "What do you no longer accept from people, communities, or institutions?", placeholder: "I will no longer tolerate... I will walk away from any situation where..." },
    { id: "b2", question: "What does healthy community look like to you NOW — on your own terms?", placeholder: "This might look very different from what you were raised with, and that's okay..." },
    { id: "b3", question: "Who in your life currently respects these boundaries? Who doesn't?", placeholder: "Be honest — even if some of those answers are hard..." }
  ]},
  { id: "forward", title: "Walking Forward", icon: "→", color: "#5AE8A0", intro: "You survived something designed to break you. You're still here. That is extraordinary strength.", prompts: [
    { id: "f1", question: "What does healing mean to you personally — on your own terms?", placeholder: "Maybe it's peace, maybe it's joy, maybe it's feeling safe in your own skin..." },
    { id: "f2", question: "What is one courageous thing you can do this week to honor your healing?", placeholder: "It doesn't have to be huge. It just has to be yours..." },
    { id: "f3", question: "Write a message to a future version of yourself — one year from now.", placeholder: "One year from now, I hope you know that... I hope you've allowed yourself to..." }
  ]}
];

const affirmations = [
  "What was done to you was wrong. Full stop.",
  "You are allowed to heal at your own pace.",
  "Leaving was not betrayal. It was survival.",
  "Your questions were never the problem.",
  "You do not need their forgiveness to forgive yourself.",
  "Doubt is not weakness. It is honesty.",
  "You are allowed to be angry.",
  "Your pain was caused by people — not by God.",
  "You get to define what healing looks like for you.",
  "You are more than what was done to you."
];

// ── PDF Export ───────────────────────────────────────────────────────────────
function exportPDF(displayName, entries) {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const allPrompts = sections.flatMap(s => s.prompts.map(p => ({ ...p, sectionTitle: s.title })));
  const filled = allPrompts.filter(p => entries[p.id]?.trim());
  const escHtml = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>");
  const sectionBlocks = sections.filter(s => s.prompts.length > 0 && s.prompts.some(p => entries[p.id]?.trim())).map(s => {
    const promptBlocks = s.prompts.filter(p => entries[p.id]?.trim()).map((p,i) => `<div class="prompt-block"><div class="prompt-q">${escHtml(p.question)}</div><div class="prompt-a">${escHtml(entries[p.id])}</div></div>`).join("");
    return `<div class="section"><div class="section-header"><span>${s.icon}</span><span>${s.title}</span></div>${promptBlocks}</div>`;
  }).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unchained — ${displayName}'s Journal</title>
  <style>body{font-family:Georgia,serif;background:#fff;color:#1a1a1a;padding:60px;max-width:780px;margin:0 auto}.cover{text-align:center;padding:80px 0 60px;border-bottom:2px solid #1a1a1a;margin-bottom:60px}.cover-title{font-size:52px;font-weight:bold;letter-spacing:6px;margin-bottom:8px}.cover-name{font-size:22px;font-weight:600}.cover-date{font-size:13px;color:#aaa;margin-top:8px}.section{margin-bottom:56px}.section-header{display:flex;align-items:center;gap:12px;margin-bottom:28px;padding-bottom:14px;border-bottom:1px solid #e0e0e0;font-size:18px;font-weight:600}.prompt-block{margin-bottom:32px}.prompt-q{font-size:14px;font-weight:600;color:#444;margin-bottom:12px;font-style:italic}.prompt-a{font-size:15px;line-height:1.9;padding:20px;background:#fafafa;border-left:3px solid #ddd}.footer{text-align:center;margin-top:80px;padding-top:32px;border-top:1px solid #e0e0e0;font-size:12px;color:#bbb}</style>
  </head><body><div class="cover"><div class="cover-title">UNCHAINED</div><div style="font-style:italic;color:#888;margin:12px 0 32px">A Healing Journal for Survivors</div><div class="cover-name">${escHtml(displayName)}</div><div class="cover-date">${date} · ${filled.length} entries completed</div></div>${sectionBlocks}<div class="footer">Unchained Healing Journal · ${date}</div></body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `Unchained-Journal-${displayName.replace(/\s+/g,"-")}.html`;
  a.click(); URL.revokeObjectURL(url);
}

// ── Styles ───────────────────────────────────────────────────────────────────
const btn = (bg, border, color, extra = {}) => ({ background: bg, border: `1px solid ${border}`, color, padding: "10px 24px", cursor: "pointer", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", borderRadius: "2px", transition: "all 0.2s", fontFamily: "inherit", ...extra });
const inputStyle = (focus) => ({ width: "100%", background: "#111", border: `1px solid ${focus ? "#E8C547" : "#2A2A2A"}`, borderRadius: "4px", padding: "12px 16px", color: "#D8D0C0", fontSize: "15px", fontFamily: "'Georgia', serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" });

// ── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [focusField, setFocusField] = useState(null);

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        if (!email.trim() || !password.trim() || !displayName.trim()) { setError("Please fill in all fields."); setLoading(false); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); setLoading(false); return; }
        // Sign up
        const { data: authData, error: authErr } = await sbAuth("/signup", { email, password });
        if (authErr) { setError(authErr.msg || authErr.message || "Sign up failed."); setLoading(false); return; }
        const token = authData?.access_token;
        const userId = authData?.user?.id;
        if (!token || !userId) { setError("Sign up failed. Please try again."); setLoading(false); return; }
        // Save display name
        await sbDb("/profiles", "POST", { id: userId, display_name: displayName }, token);
        onLogin({ token, userId, displayName, entries: {}, lastSection: "welcome" });
      } else {
        const { data: authData, error: authErr } = await sbAuth("/token?grant_type=password", { email, password });
        if (authErr) { setError("Incorrect email or password."); setLoading(false); return; }
        const token = authData?.access_token;
        const userId = authData?.user?.id;
        if (!token) { setError("Login failed. Please try again."); setLoading(false); return; }
        // Load profile
        const { data: profileData } = await sbDb(`/profiles?id=eq.${userId}&select=display_name`, "GET", null, token);
        const displayName = profileData?.[0]?.display_name || "Friend";
        // Load entries
        const { data: entriesData } = await sbDb(`/journal_entries?user_id=eq.${userId}&select=prompt_id,content`, "GET", null, token);
        const entries = {};
        if (Array.isArray(entriesData)) entriesData.forEach(e => { entries[e.prompt_id] = e.content; });
        // Load meta
        const { data: metaData } = await sbDb(`/user_meta?user_id=eq.${userId}&select=last_section`, "GET", null, token);
        const lastSection = metaData?.[0]?.last_section || "welcome";
        onLogin({ token, userId, displayName, entries, lastSection });
      }
    } catch(e) { setError("Something went wrong. Please try again."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Georgia', serif" }}>
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <div style={{ fontSize: "11px", letterSpacing: "6px", color: "#555", textTransform: "uppercase", marginBottom: "12px" }}>A Healing Journal</div>
        <h1 style={{ fontSize: "48px", color: "#E8C547", margin: 0, letterSpacing: "4px", fontWeight: "bold" }}>UNCHAINED</h1>
        <div style={{ width: "60px", height: "1px", background: "#E8C547", margin: "16px auto 0" }} />
      </div>
      <div style={{ width: "100%", maxWidth: "420px", background: "#111", border: "1px solid #222", borderRadius: "6px", padding: "36px" }}>
        <div style={{ display: "flex", marginBottom: "32px", borderBottom: "1px solid #222" }}>
          {["login","signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex:1, background:"transparent", border:"none", borderBottom: mode===m?"2px solid #E8C547":"2px solid transparent", color: mode===m?"#E8C547":"#555", padding:"10px", cursor:"pointer", fontSize:"12px", letterSpacing:"3px", textTransform:"uppercase", fontFamily:"inherit", marginBottom:"-1px" }}>
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {mode === "signup" && (
            <div>
              <label style={{ fontSize:"11px", letterSpacing:"3px", color:"#888", textTransform:"uppercase", display:"block", marginBottom:"8px" }}>Your Name</label>
              <input value={displayName} onChange={e=>setDisplayName(e.target.value)} onFocus={()=>setFocusField("name")} onBlur={()=>setFocusField(null)} placeholder="How would you like to be addressed?" style={inputStyle(focusField==="name")} />
            </div>
          )}
          <div>
            <label style={{ fontSize:"11px", letterSpacing:"3px", color:"#888", textTransform:"uppercase", display:"block", marginBottom:"8px" }}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onFocus={()=>setFocusField("email")} onBlur={()=>setFocusField(null)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="Your email address" style={inputStyle(focusField==="email")} autoComplete="off" />
          </div>
          <div>
            <label style={{ fontSize:"11px", letterSpacing:"3px", color:"#888", textTransform:"uppercase", display:"block", marginBottom:"8px" }}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onFocus={()=>setFocusField("pass")} onBlur={()=>setFocusField(null)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder={mode==="signup"?"At least 6 characters":"Your password"} style={inputStyle(focusField==="pass")} />
          </div>
          {error && <p style={{ margin:0, color:"#E85A5A", fontSize:"13px", lineHeight:"1.5" }}>{error}</p>}
          <button onClick={handleSubmit} disabled={loading} style={{ ...btn("#E8C547","#E8C547","#0D0D0D",{ fontWeight:"bold", marginTop:"8px", opacity:loading?0.6:1 }) }}>
            {loading ? "Please wait..." : mode==="login" ? "Enter Your Journal →" : "Begin Your Journey →"}
          </button>
        </div>
        {mode === "signup" && <p style={{ margin:"20px 0 0", fontSize:"12px", color:"#555", lineHeight:"1.7", textAlign:"center" }}>Your journal entries are private and belong only to you.</p>}
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState("welcome");
  const [entries, setEntries] = useState({});
  const [savingId, setSavingId] = useState(null); const [savedId, setSavedId] = useState(null);
  const [affirmIdx, setAffirmIdx] = useState(0);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleLogin = useCallback((userData) => {
    setUser(userData);
    setEntries(userData.entries || {});
    setActiveSection(userData.lastSection || "welcome");
  }, []);

  const handleLogout = () => { setUser(null); setEntries({}); setActiveSection("welcome"); };

  const saveEntry = async (promptId, content, token, userId) => {
    // Upsert entry to Supabase
    await sbFetch(`/rest/v1/journal_entries`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, prompt_id: promptId, content, updated_at: new Date().toISOString() }),
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=minimal"
      }
    });
  };

  const handleSave = async (promptId) => {
    if (!user) return;
    setSavingId(promptId);
    await saveEntry(promptId, entries[promptId] || "", user.token, user.userId);
    setSavingId(null); setSavedId(promptId);
    setTimeout(() => setSavedId(null), 2000);
  };

  const handleEntry = (id, value) => {
    const updated = { ...entries, [id]: value };
    setEntries(updated);
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const t = setTimeout(() => {
      if (user) saveEntry(id, value, user.token, user.userId);
    }, 2000);
    setAutoSaveTimer(t);
  };

  const handleSectionChange = async (sectionId) => {
    setActiveSection(sectionId);
    if (user) {
      await sbFetch(`/rest/v1/user_meta`, {
        method: "POST",
        body: JSON.stringify({ user_id: user.userId, last_section: sectionId, updated_at: new Date().toISOString() }),
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${user.token}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates,return=minimal"
        }
      });
    }
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => { exportPDF(user.displayName, entries); setExporting(false); }, 200);
  };

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  const current = sections.find(s => s.id === activeSection);
  const sectionIndex = sections.findIndex(s => s.id === activeSection);
  const canGoNext = sectionIndex < sections.length - 1;
  const canGoPrev = sectionIndex > 0;
  const totalPrompts = sections.flatMap(s => s.prompts).length;
  const completedPrompts = sections.flatMap(s => s.prompts).filter(p => entries[p.id]?.trim()).length;
  const progressPct = Math.round((completedPrompts / totalPrompts) * 100);

  return (
    <div style={{ minHeight:"100vh", background:"#0D0D0D", fontFamily:"'Georgia','Times New Roman',serif", color:"#F0EAD6", display:"flex", flexDirection:"column" }}>
      <header style={{ borderBottom:"1px solid #1E1E1E", padding:"14px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#0D0D0D", position:"sticky", top:0, zIndex:100, gap:"20px" }}>
        <div style={{ flexShrink:0 }}>
          <div style={{ fontSize:"9px", letterSpacing:"4px", color:"#444", textTransform:"uppercase", marginBottom:"2px" }}>Healing Journal</div>
          <div style={{ fontSize:"18px", fontWeight:"bold", color:"#E8C547", letterSpacing:"3px" }}>UNCHAINED</div>
        </div>
        <div style={{ flex:1, maxWidth:"360px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
            <span style={{ fontSize:"10px", color:"#444", letterSpacing:"2px", textTransform:"uppercase" }}>Progress</span>
            <span style={{ fontSize:"10px", color:"#666" }}>{completedPrompts}/{totalPrompts}</span>
          </div>
          <div style={{ height:"2px", background:"#1E1E1E", borderRadius:"2px" }}>
            <div style={{ height:"100%", width:`${progressPct}%`, background:"#E8C547", borderRadius:"2px", transition:"width 0.4s" }} />
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
          <button onClick={handleExport} disabled={exporting || completedPrompts===0} style={{ ...btn("#1A1A1A","#E8C547","#E8C547",{ padding:"7px 16px", fontSize:"10px", opacity:completedPrompts===0?0.4:1, cursor:completedPrompts===0?"not-allowed":"pointer" }) }}>
            {exporting?"...":"⬇ Export"}
          </button>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"13px", color:"#C8BFA8" }}>{user.displayName}</div>
          </div>
          <button onClick={handleLogout} style={{ ...btn("transparent","#2A2A2A","#555",{ padding:"6px 12px", fontSize:"10px" }) }}>Out</button>
        </div>
      </header>

      <div style={{ display:"flex", flex:1 }}>
        <nav style={{ width:"220px", borderRight:"1px solid #1A1A1A", padding:"20px 0", flexShrink:0, display:"flex", flexDirection:"column", gap:"2px" }}>
          {sections.map(s => {
            const done = s.prompts.length > 0 && s.prompts.every(p => entries[p.id]?.trim());
            const started = s.prompts.some(p => entries[p.id]?.trim());
            return (
              <button key={s.id} onClick={() => handleSectionChange(s.id)}
                style={{ display:"flex", alignItems:"center", gap:"10px", padding:"11px 18px", background:activeSection===s.id?"#141414":"transparent", border:"none", borderLeft:activeSection===s.id?`3px solid ${s.color}`:"3px solid transparent", color:activeSection===s.id?"#C8BFA8":"#555", cursor:"pointer", textAlign:"left", fontSize:"12px", transition:"all 0.15s", width:"100%" }}>
                <span style={{ color:s.color, fontSize:"13px", flexShrink:0 }}>{s.icon}</span>
                <span style={{ flex:1, lineHeight:"1.4" }}>{s.title}</span>
                {done && <span style={{ fontSize:"10px", color:s.color }}>✓</span>}
                {started && !done && <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:s.color, opacity:0.5, flexShrink:0 }} />}
              </button>
            );
          })}
        </nav>

        <main style={{ flex:1, padding:"44px 52px", maxWidth:"720px" }}>
          <div style={{ marginBottom:"36px" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
              <span style={{ fontSize:"24px", color:current.color }}>{current.icon}</span>
              <h1 style={{ fontSize:"28px", fontWeight:"bold", color:"#C8BFA8", margin:0 }}>{current.title}</h1>
            </div>
            {current.intro && (
              <div style={{ borderLeft:`3px solid ${current.color}`, paddingLeft:"18px" }}>
                {current.intro.split("\n\n").map((p,i) => <p key={i} style={{ fontSize:"15px", lineHeight:"1.8", color:"#8A8070", margin:"0 0 8px", fontStyle:"italic" }}>{p}</p>)}
              </div>
            )}
          </div>

          {current.id === "welcome" && (
            <>
              <div style={{ background:"#111", border:`1px solid ${current.color}33`, borderRadius:"4px", padding:"26px", marginBottom:"24px" }}>
                <div style={{ fontSize:"10px", letterSpacing:"4px", color:"#555", textTransform:"uppercase", marginBottom:"14px" }}>Daily Affirmation</div>
                <p style={{ fontSize:"18px", lineHeight:"1.7", color:current.color, fontStyle:"italic", margin:"0 0 18px" }}>"{affirmations[affirmIdx]}"</p>
                <button onClick={() => setAffirmIdx(i => (i+1)%affirmations.length)} style={btn("transparent",current.color,current.color,{ padding:"6px 16px", fontSize:"10px" })}>Next →</button>
              </div>
              <div style={{ background:"#111", border:"1px solid #1E1E1E", borderRadius:"4px", padding:"22px", marginBottom:"20px" }}>
                <p style={{ margin:"0 0 6px", fontSize:"15px", color:"#C8BFA8" }}>Welcome back, <span style={{ color:current.color }}>{user.displayName}</span>.</p>
                <p style={{ margin:0, fontSize:"13px", color:"#555", lineHeight:"1.6" }}>{completedPrompts}/{totalPrompts} prompts completed. Entries are saved to your private account automatically.</p>
              </div>
              {[{ icon:"◈", text:"This journal belongs to you alone." },{ icon:"◇", text:"There is no right order. Go where you feel called." },{ icon:"▲", text:"If a prompt feels too big, one sentence is enough." },{ icon:"✦", text:"You are building something no one can take from you." }].map((item,i) => (
                <div key={i} style={{ display:"flex", gap:"12px", padding:"16px 18px", background:"#0F0F0F", border:"1px solid #1A1A1A", borderRadius:"4px", marginBottom:"8px" }}>
                  <span style={{ color:current.color, fontSize:"14px", flexShrink:0, marginTop:"2px" }}>{item.icon}</span>
                  <p style={{ margin:0, color:"#8A8070", lineHeight:"1.6", fontSize:"14px" }}>{item.text}</p>
                </div>
              ))}
            </>
          )}

          {current.prompts.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:"40px" }}>
              {current.prompts.map((prompt,i) => (
                <div key={prompt.id}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:"12px", marginBottom:"12px" }}>
                    <span style={{ fontSize:"10px", color:current.color, fontFamily:"monospace", paddingTop:"5px", flexShrink:0, letterSpacing:"2px" }}>0{i+1}</span>
                    <p style={{ margin:0, fontSize:"16px", lineHeight:"1.7", color:"#C8BFA8", fontWeight:"600" }}>{prompt.question}</p>
                  </div>
                  <textarea value={entries[prompt.id]||""} onChange={e=>handleEntry(prompt.id,e.target.value)} placeholder={prompt.placeholder} rows={6}
                    style={{ width:"100%", background:"#0F0F0F", border:`1px solid ${entries[prompt.id]?.trim()?current.color+"44":"#1E1E1E"}`, borderRadius:"4px", padding:"16px", color:"#D0C8B8", fontSize:"14px", lineHeight:"1.85", fontFamily:"'Georgia',serif", resize:"vertical", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }} />
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"8px" }}>
                    <span style={{ fontSize:"10px", color:"#333" }}>{entries[prompt.id]?.trim() ? `${entries[prompt.id].split(/\s+/).filter(Boolean).length} words · saved to your account` : "auto-saved as you write"}</span>
                    <button onClick={() => handleSave(prompt.id)} disabled={savingId===prompt.id}
                      style={{ ...btn(savedId===prompt.id?current.color:"transparent", current.color, savedId===prompt.id?"#0D0D0D":current.color, { padding:"5px 14px", fontSize:"10px" }) }}>
                      {savingId===prompt.id?"Saving...":savedId===prompt.id?"✓ Saved":"Save Entry"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:"56px", paddingTop:"24px", borderTop:"1px solid #1A1A1A" }}>
            <button onClick={() => canGoPrev && handleSectionChange(sections[sectionIndex-1].id)} disabled={!canGoPrev} style={btn("transparent",canGoPrev?"#2A2A2A":"#141414",canGoPrev?"#666":"#2A2A2A")}>← Previous</button>
            <button onClick={() => canGoNext && handleSectionChange(sections[sectionIndex+1].id)} disabled={!canGoNext} style={btn(canGoNext?current.color:"transparent",canGoNext?current.color:"#141414",canGoNext?"#0D0D0D":"#2A2A2A",{ fontWeight:"bold" })}>
              {canGoNext?`Next: ${sections[sectionIndex+1].title} →`:"✦ Journey Complete"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
