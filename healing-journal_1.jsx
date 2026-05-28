import { useState, useCallback } from "react";

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

// ── Storage helpers ──────────────────────────────────────────────────────────
const storage = window.storage;
async function loadUsers() { try { const r = await storage.get("unchained:users"); return r ? JSON.parse(r.value) : {}; } catch { return {}; } }
async function saveUsers(u) { await storage.set("unchained:users", JSON.stringify(u)); }
async function loadUserEntries(un) { try { const r = await storage.get(`unchained:entries:${un}`); return r ? JSON.parse(r.value) : {}; } catch { return {}; } }
async function saveUserEntries(un, e) { await storage.set(`unchained:entries:${un}`, JSON.stringify(e)); }
async function loadUserMeta(un) { try { const r = await storage.get(`unchained:meta:${un}`); return r ? JSON.parse(r.value) : { lastSection: "welcome" }; } catch { return { lastSection: "welcome" }; } }
async function saveUserMeta(un, m) { await storage.set(`unchained:meta:${un}`, JSON.stringify(m)); }
function hashPw(p) { let h = 0; for (let i = 0; i < p.length; i++) { h = ((h << 5) - h) + p.charCodeAt(i); h |= 0; } return h.toString(36); }

// ── PDF Export ───────────────────────────────────────────────────────────────
function exportPDF(displayName, entries) {
  const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const allPrompts = sections.flatMap(s => s.prompts.map(p => ({ ...p, sectionTitle: s.title, sectionIcon: s.icon })));
  const filled = allPrompts.filter(p => entries[p.id]?.trim());

  const escHtml = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>");

  const sectionBlocks = sections.filter(s => s.prompts.length > 0 && s.prompts.some(p => entries[p.id]?.trim())).map(s => {
    const promptBlocks = s.prompts.filter(p => entries[p.id]?.trim()).map((p, i) => `
      <div class="prompt-block">
        <div class="prompt-q">${escHtml(p.question)}</div>
        <div class="prompt-a">${escHtml(entries[p.id])}</div>
      </div>`).join("");
    return `<div class="section"><div class="section-header"><span class="section-icon">${s.icon}</span><span class="section-title">${s.title}</span></div>${promptBlocks}</div>`;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Unchained — ${displayName}'s Journal</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Cinzel:wght@400;600&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'EB Garamond', Georgia, serif; background: #fff; color: #1a1a1a; padding: 60px; max-width: 780px; margin: 0 auto; }
    .cover { text-align: center; padding: 80px 0 60px; border-bottom: 2px solid #1a1a1a; margin-bottom: 60px; }
    .cover-label { font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 6px; color: #888; text-transform: uppercase; margin-bottom: 20px; }
    .cover-title { font-family: 'Cinzel', serif; font-size: 52px; font-weight: 600; color: #1a1a1a; letter-spacing: 6px; margin-bottom: 8px; }
    .cover-subtitle { font-size: 15px; color: #888; font-style: italic; margin-bottom: 40px; }
    .cover-name { font-size: 22px; font-weight: 600; }
    .cover-date { font-size: 13px; color: #aaa; letter-spacing: 2px; margin-top: 8px; text-transform: uppercase; }
    .cover-stats { display: inline-block; margin-top: 32px; border: 1px solid #ddd; padding: 16px 32px; font-size: 13px; color: #888; letter-spacing: 1px; }
    .section { margin-bottom: 56px; page-break-inside: avoid; }
    .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; padding-bottom: 14px; border-bottom: 1px solid #e0e0e0; }
    .section-icon { font-size: 20px; }
    .section-title { font-family: 'Cinzel', serif; font-size: 18px; font-weight: 600; letter-spacing: 2px; }
    .prompt-block { margin-bottom: 32px; }
    .prompt-q { font-size: 14px; font-weight: 600; color: #444; margin-bottom: 12px; line-height: 1.6; font-style: italic; }
    .prompt-a { font-size: 15px; line-height: 1.9; color: #1a1a1a; padding: 20px; background: #fafafa; border-left: 3px solid #ddd; }
    .footer { text-align: center; margin-top: 80px; padding-top: 32px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #bbb; letter-spacing: 2px; text-transform: uppercase; }
    @media print { body { padding: 40px; } }
  </style></head><body>
  <div class="cover">
    <div class="cover-label">A Healing Journal for Survivors</div>
    <div class="cover-title">UNCHAINED</div>
    <div class="cover-subtitle">Healing from Religious Trauma — Walking Forward Without Guilt</div>
    <div class="cover-name">${escHtml(displayName)}</div>
    <div class="cover-date">${date}</div>
    <div class="cover-stats">${filled.length} of ${allPrompts.length} journal entries completed</div>
  </div>
  ${sectionBlocks}
  <div class="footer">Unchained Healing Journal &nbsp;·&nbsp; ${date}</div>
  </body></html>`;

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
  const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [focusField, setFocusField] = useState(null);

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      const users = await loadUsers();
      if (mode === "signup") {
        if (!username.trim() || !password.trim() || !displayName.trim()) { setError("Please fill in all fields."); setLoading(false); return; }
        if (username.length < 3) { setError("Username must be at least 3 characters."); setLoading(false); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); setLoading(false); return; }
        if (users[username.toLowerCase()]) { setError("That username is already taken."); setLoading(false); return; }
        users[username.toLowerCase()] = { displayName, passwordHash: hashPw(password), createdAt: new Date().toISOString() };
        await saveUsers(users);
        await saveUserMeta(username.toLowerCase(), { lastSection: "welcome" });
        onLogin({ username: username.toLowerCase(), displayName, meta: { lastSection: "welcome" }, entries: {} });
      } else {
        const user = users[username.toLowerCase()];
        if (!user || user.passwordHash !== hashPw(password)) { setError("Incorrect username or password."); setLoading(false); return; }
        const entries = await loadUserEntries(username.toLowerCase());
        const meta = await loadUserMeta(username.toLowerCase());
        onLogin({ username: username.toLowerCase(), displayName: user.displayName, meta, entries });
      }
    } catch { setError("Something went wrong. Please try again."); }
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
            <label style={{ fontSize:"11px", letterSpacing:"3px", color:"#888", textTransform:"uppercase", display:"block", marginBottom:"8px" }}>Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} onFocus={()=>setFocusField("user")} onBlur={()=>setFocusField(null)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="Choose a private username" style={inputStyle(focusField==="user")} autoComplete="off" />
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
        {mode === "signup" && <p style={{ margin:"20px 0 0", fontSize:"12px", color:"#555", lineHeight:"1.7", textAlign:"center" }}>Your journal entries are private. They are never shared with anyone.</p>}
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

  const handleLogin = useCallback((userData) => { setUser(userData); setEntries(userData.entries || {}); setActiveSection(userData.meta?.lastSection || "welcome"); }, []);
  const handleLogout = () => { setUser(null); setEntries({}); setActiveSection("welcome"); };

  const handleSave = async (promptId) => {
    if (!user) return;
    setSavingId(promptId);
    await saveUserEntries(user.username, entries);
    setSavingId(null); setSavedId(promptId);
    setTimeout(() => setSavedId(null), 2000);
  };

  const handleEntry = (id, value) => {
    const updated = { ...entries, [id]: value };
    setEntries(updated);
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const t = setTimeout(() => { if (user) saveUserEntries(user.username, updated); }, 2000);
    setAutoSaveTimer(t);
  };

  const handleSectionChange = async (sectionId) => {
    setActiveSection(sectionId);
    if (user) { const meta = { ...user.meta, lastSection: sectionId }; await saveUserMeta(user.username, meta); setUser(prev => ({ ...prev, meta })); }
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
      {/* Header */}
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
          <button onClick={handleExport} disabled={exporting || completedPrompts === 0} title={completedPrompts === 0 ? "Write some entries first" : "Download your journal as a file"}
            style={{ ...btn("#1A1A1A","#E8C547","#E8C547",{ padding:"7px 16px", fontSize:"10px", opacity: completedPrompts===0?0.4:1, cursor: completedPrompts===0?"not-allowed":"pointer" }) }}>
            {exporting ? "..." : "⬇ Export PDF"}
          </button>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"13px", color:"#F0EAD6" }}>{user.displayName}</div>
            <div style={{ fontSize:"10px", color:"#444", letterSpacing:"1px" }}>@{user.username}</div>
          </div>
          <button onClick={handleLogout} style={{ ...btn("transparent","#2A2A2A","#555",{ padding:"6px 12px", fontSize:"10px" }) }}>Out</button>
        </div>
      </header>

      <div style={{ display:"flex", flex:1 }}>
        {/* Sidebar */}
        <nav style={{ width:"220px", borderRight:"1px solid #1A1A1A", padding:"20px 0", flexShrink:0, display:"flex", flexDirection:"column", gap:"2px" }}>
          {sections.map(s => {
            const done = s.prompts.length > 0 && s.prompts.every(p => entries[p.id]?.trim());
            const started = s.prompts.some(p => entries[p.id]?.trim());
            return (
              <button key={s.id} onClick={() => handleSectionChange(s.id)}
                style={{ display:"flex", alignItems:"center", gap:"10px", padding:"11px 18px", background:activeSection===s.id?"#141414":"transparent", border:"none", borderLeft:activeSection===s.id?`3px solid ${s.color}`:"3px solid transparent", color:activeSection===s.id?"#F0EAD6":"#555", cursor:"pointer", textAlign:"left", fontSize:"12px", transition:"all 0.15s", width:"100%" }}>
                <span style={{ color:s.color, fontSize:"13px", flexShrink:0 }}>{s.icon}</span>
                <span style={{ flex:1, lineHeight:"1.4" }}>{s.title}</span>
                {done && <span style={{ fontSize:"10px", color:s.color }}>✓</span>}
                {started && !done && <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:s.color, opacity:0.5, flexShrink:0 }} />}
              </button>
            );
          })}
        </nav>

        {/* Main */}
        <main style={{ flex:1, padding:"44px 52px", maxWidth:"720px" }}>
          <div style={{ marginBottom:"36px" }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
              <span style={{ fontSize:"24px", color:current.color }}>{current.icon}</span>
              <h1 style={{ fontSize:"28px", fontWeight:"bold", color:"#F0EAD6", margin:0 }}>{current.title}</h1>
            </div>
            {current.intro && (
              <div style={{ borderLeft:`3px solid ${current.color}`, paddingLeft:"18px" }}>
                {current.intro.split("\n\n").map((p,i) => <p key={i} style={{ fontSize:"15px", lineHeight:"1.8", color:"#8A8070", margin:"0 0 8px", fontStyle:"italic" }}>{p}</p>)}
              </div>
            )}
          </div>

          {/* Welcome */}
          {current.id === "welcome" && (
            <>
              <div style={{ background:"#111", border:`1px solid ${current.color}33`, borderRadius:"4px", padding:"26px", marginBottom:"24px" }}>
                <div style={{ fontSize:"10px", letterSpacing:"4px", color:"#555", textTransform:"uppercase", marginBottom:"14px" }}>Daily Affirmation</div>
                <p style={{ fontSize:"18px", lineHeight:"1.7", color:current.color, fontStyle:"italic", margin:"0 0 18px" }}>"{affirmations[affirmIdx]}"</p>
                <button onClick={() => setAffirmIdx(i => (i+1)%affirmations.length)} style={btn("transparent",current.color,current.color,{ padding:"6px 16px", fontSize:"10px" })}>Next →</button>
              </div>
              <div style={{ background:"#111", border:"1px solid #1E1E1E", borderRadius:"4px", padding:"22px", marginBottom:"20px" }}>
                <p style={{ margin:"0 0 6px", fontSize:"15px", color:"#F0EAD6" }}>Welcome back, <span style={{ color:current.color }}>{user.displayName}</span>.</p>
                <p style={{ margin:0, fontSize:"13px", color:"#555", lineHeight:"1.6" }}>{completedPrompts}/{totalPrompts} prompts completed. Entries auto-save as you write. Use the Export button to download your journal anytime.</p>
              </div>
              {[{ icon:"◈", text:"This journal belongs to you alone." },{ icon:"◇", text:"There is no right order. Go where you feel called." },{ icon:"▲", text:"If a prompt feels too big, one sentence is enough." },{ icon:"✦", text:"You are building something no one can take from you." }].map((item,i) => (
                <div key={i} style={{ display:"flex", gap:"12px", padding:"16px 18px", background:"#0F0F0F", border:"1px solid #1A1A1A", borderRadius:"4px", marginBottom:"8px" }}>
                  <span style={{ color:current.color, fontSize:"14px", flexShrink:0, marginTop:"2px" }}>{item.icon}</span>
                  <p style={{ margin:0, color:"#8A8070", lineHeight:"1.6", fontSize:"14px" }}>{item.text}</p>
                </div>
              ))}
            </>
          )}

          {/* Prompts */}
          {current.prompts.length > 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:"40px" }}>
              {current.prompts.map((prompt,i) => (
                <div key={prompt.id}>
                  <div style={{ display:"flex", alignItems:"flex-start", gap:"12px", marginBottom:"12px" }}>
                    <span style={{ fontSize:"10px", color:current.color, fontFamily:"monospace", paddingTop:"5px", flexShrink:0, letterSpacing:"2px" }}>0{i+1}</span>
                    <p style={{ margin:0, fontSize:"16px", lineHeight:"1.7", color:"#F0EAD6", fontWeight:"600" }}>{prompt.question}</p>
                  </div>
                  <textarea value={entries[prompt.id]||""} onChange={e=>handleEntry(prompt.id,e.target.value)} placeholder={prompt.placeholder} rows={6}
                    style={{ width:"100%", background:"#0F0F0F", border:`1px solid ${entries[prompt.id]?.trim()?current.color+"44":"#1E1E1E"}`, borderRadius:"4px", padding:"16px", color:"#D0C8B8", fontSize:"14px", lineHeight:"1.85", fontFamily:"'Georgia',serif", resize:"vertical", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }} />
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"8px" }}>
                    <span style={{ fontSize:"10px", color:"#333" }}>{entries[prompt.id]?.trim() ? `${entries[prompt.id].split(/\s+/).filter(Boolean).length} words · auto-saved` : "auto-saved as you write"}</span>
                    <button onClick={() => handleSave(prompt.id)} disabled={savingId===prompt.id}
                      style={{ ...btn(savedId===prompt.id?current.color:"transparent", current.color, savedId===prompt.id?"#0D0D0D":current.color, { padding:"5px 14px", fontSize:"10px" }) }}>
                      {savingId===prompt.id?"Saving...":savedId===prompt.id?"✓ Saved":"Save Entry"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nav */}
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
