import { useState, useEffect, useRef } from "react";

const YT_API = "https://www.googleapis.com/youtube/v3";
const SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

function SetupScreen({ clientId, setClientId, onLogin, gsiLoaded }) {
  const steps = [
    { num: "١", text: "اذهب إلى", link: "https://console.cloud.google.com", label: "Google Cloud Console" },
    { num: "٢", text: "أنشئ مشروعاً جديداً أو اختر مشروعاً قائماً" },
    { num: "٣", text: 'فعّل "YouTube Data API v3" من قسم APIs & Services' },
    { num: "٤", text: 'أنشئ بيانات OAuth 2.0 → نوع "Web Application"' },
    { num: "٥", text: "أضف", code: "https://<username>.github.io", suffix: "ضمن Authorized JavaScript origins" },
  ];

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <div className="setup-logo">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="12" fill="#FF0000"/>
            <path d="M16 13L28 20L16 27V13Z" fill="white"/>
          </svg>
          <span className="setup-title">مشخال</span>
        </div>
        <p className="setup-subtitle">راجع تعليقات القناة وافق أو احذف أو احظر بنقرة واحدة</p>

        <div className="steps">
          <p className="steps-label">الإعداد مرة واحدة فقط</p>
          {steps.map((s, i) => (
            <div key={i} className="step-row">
              <span className="step-num">{s.num}</span>
              <span className="step-text">
                {s.text}{" "}
                {s.link && <a href={s.link} target="_blank" rel="noreferrer" className="step-link">{s.label}</a>}
                {s.code && <code className="step-code">{s.code}</code>}
                {s.suffix && " " + s.suffix}
              </span>
            </div>
          ))}
        </div>

        <div className="input-group">
          <label className="input-label">OAuth Client ID</label>
          <input
            className="client-input"
            type="text"
            placeholder="123456789-abc...apps.googleusercontent.com"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            dir="ltr"
          />
        </div>

        <button
          className={`login-btn ${(!clientId.trim() || !gsiLoaded) ? "disabled" : ""}`}
          onClick={onLogin}
          disabled={!clientId.trim() || !gsiLoaded}
        >
          {!gsiLoaded ? "جاري التحضير..." : "تسجيل الدخول بـ Google"}
        </button>
      </div>
    </div>
  );
}

function CommentCard({ comment, onAction, videoTitle }) {
  const c = comment.snippet?.topLevelComment?.snippet || {};
  const threadId = comment.id;
  const commentId = comment.snippet?.topLevelComment?.id || threadId;
  const avatar = c.authorProfileImageUrl;
  const author = c.authorDisplayName || "مجهول";
  const text = c.textDisplay || "";
  const date = c.publishedAt;
  const likes = c.likeCount || 0;
  const videoId = comment.snippet?.videoId;

  const [actioned, setActioned] = useState(null);

  const handle = (action) => {
    setActioned(action);
    onAction(threadId, commentId, action);
  };

  if (actioned) {
    const labels = {
      approve: { text: "تمت الموافقة", color: "#22c55e", icon: "✓" },
      delete: { text: "تم الحذف", color: "#ef4444", icon: "✕" },
      block: { text: "تم الحظر", color: "#f97316", icon: "⊘" },
    };
    const l = labels[actioned];
    return (
      <div className="card card-done" style={{ borderColor: l.color + "44" }}>
        <span style={{ color: l.color, fontSize: "1.1rem" }}>{l.icon} {l.text}</span>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="author-row">
          {avatar
            ? <img src={avatar} alt="" className="avatar" />
            : <div className="avatar avatar-placeholder">{author[0]}</div>
          }
          <div>
            <p className="author-name">{author}</p>
            <p className="comment-time">{date ? timeAgo(date) : ""}</p>
          </div>
        </div>
        {videoId && (
          <a href={`https://youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer" className="video-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
            الفيديو
          </a>
        )}
      </div>

      {videoTitle && (
        <p className="video-title-label">🎬 {videoTitle}</p>
      )}

      <p className="comment-text" dangerouslySetInnerHTML={{ __html: text }} />

      {likes > 0 && <p className="comment-likes">👍 {likes}</p>}

      <div className="actions">
        <button className="btn btn-approve" onClick={() => handle("approve")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          موافقة
        </button>
        <button className="btn btn-delete" onClick={() => handle("delete")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6l-1 14H6L5 6M9 6V4h6v2"/></svg>
          حذف
        </button>
        <button className="btn btn-block" onClick={() => handle("block")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          حظر
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [clientId, setClientId] = useState(() => localStorage.getItem("yt_client_id") || "");
  const [token, setToken] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [toast, setToast] = useState(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [videoTitles, setVideoTitles] = useState({});
  const tokenRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => setGsiLoaded(true);
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const login = () => {
    if (!window.google?.accounts?.oauth2) return;
    localStorage.setItem("yt_client_id", clientId.trim());
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: SCOPE,
      callback: (res) => {
        if (res.access_token) {
          setToken(res.access_token);
          tokenRef.current = res.access_token;
          fetchComments(res.access_token, null, true);
        } else {
          showToast("فشل تسجيل الدخول", "error");
        }
      },
      error_callback: (err) => showToast(err?.message || "خطأ في المصادقة", "error"),
    });
    client.requestAccessToken();
  };

  const fetchComments = async (accessToken, pageToken = null, reset = false) => {
    setLoading(true);
    try {
      const chRes = await fetch(`${YT_API}/channels?part=id&mine=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const chData = await chRes.json();
      const channelId = chData.items?.[0]?.id;
      if (!channelId) {
        showToast("ما قدرنا نجيب الـ channel ID", "error");
        setLoading(false);
        return;
      }
      const params = new URLSearchParams({
        part: "snippet",
        moderationStatus: "heldForReview",
        maxResults: "20",
        allThreadsRelatedToChannelId: channelId,
        ...(pageToken && { pageToken }),
      });
      const res = await fetch(`${YT_API}/commentThreads?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.error) {
        showToast(data.error.message, "error");
        if (data.error.code === 401) setToken(null);
        return;
      }
      const items = data.items || [];
      setComments(prev => reset ? items : [...prev, ...items]);
      setNextPage(data.nextPageToken || null);
      // Fetch video titles
      const videoIds = [...new Set(items.map(i => i.snippet?.videoId).filter(Boolean))];
      if (videoIds.length > 0) {
        const vRes = await fetch(`${YT_API}/videos?part=snippet&id=${videoIds.join(",")}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const vData = await vRes.json();
        const titles = {};
        (vData.items || []).forEach(v => { titles[v.id] = v.snippet?.title || ""; });
        setVideoTitles(prev => ({ ...prev, ...titles }));
      }
    } catch (e) {
      showToast("خطأ في الاتصال بـ YouTube", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (threadId, commentId, action) => {
    const t = tokenRef.current || token;
    try {
      const status = action === "approve" ? "published" : "rejected";
      const banAuthor = action === "block" ? "true" : "false";
      const params = new URLSearchParams({ id: threadId, moderationStatus: status, banAuthor });
      const res = await fetch(`${YT_API}/comments/setModerationStatus?${params}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      const msgs = {
        approve: "✓ تمت الموافقة على التعليق",
        delete: "✕ تم حذف التعليق",
        block: "⊘ تم حظر المستخدم",
      };
      showToast(msgs[action], action === "approve" ? "success" : action === "delete" ? "delete" : "block");
      setTimeout(() => setComments(prev => prev.filter(c => c.id !== threadId)), 800);
    } catch (e) {
      showToast("فشلت العملية: " + e.message, "error");
    }
  };

  if (!token) {
    return (
      <>
        <style>{css}</style>
        <SetupScreen clientId={clientId} setClientId={setClientId} onLogin={login} gsiLoaded={gsiLoaded} />
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="app" dir="rtl">
        <header className="header">
          <div className="header-inner">
            <div className="header-brand">
              <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="10" fill="#FF0000"/>
                <path d="M16 13L28 20L16 27V13Z" fill="white"/>
              </svg>
              <span className="header-title">مشخال</span>
            </div>
            <div className="header-stats">
              {comments.length > 0 && <span className="badge-count">{comments.length} معلّق</span>}
              <button className="refresh-btn" onClick={() => fetchComments(token, null, true)} disabled={loading}>
                <svg className={loading ? "spin" : ""} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16"/>
                </svg>
                تحديث
              </button>
              <button className="logout-btn" onClick={() => { setToken(null); tokenRef.current = null; setComments([]); }}>خروج</button>
            </div>
          </div>
        </header>

        <main className="main">
          {loading && comments.length === 0 ? (
            <div className="empty-state"><div className="spinner" /><p>جاري تحميل التعليقات...</p></div>
          ) : comments.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              <p className="empty-title">لا توجد تعليقات معلّقة</p>
              <p className="empty-sub">كل شيء نظيف 👌</p>
            </div>
          ) : (
            <div className="cards-grid">
              {comments.map(c => (
                <CommentCard key={c.id} comment={c} onAction={handleAction} videoTitle={videoTitles[c.snippet?.videoId]} />
              ))}
            </div>
          )}

          {nextPage && !loading && (
            <div className="load-more">
              <button className="load-more-btn" onClick={() => fetchComments(token, nextPage)}>تحميل المزيد</button>
            </div>
          )}
          {loading && comments.length > 0 && <div className="load-more"><div className="spinner" /></div>}
        </main>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.text}</div>}
      </div>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f0f0f; --surface: #1a1a1a; --surface2: #222;
    --border: #2a2a2a; --text: #e8e8e8; --text-muted: #777;
    --red: #ff0000; --green: #22c55e; --orange: #f97316; --blue: #3b82f6;
  }
  body { font-family: 'IBM Plex Sans Arabic', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

  .setup-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 24px; }
  .setup-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 40px; width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 24px; direction: rtl; }
  .setup-logo { display: flex; align-items: center; gap: 12px; }
  .setup-title { font-size: 1.4rem; font-weight: 600; }
  .setup-subtitle { color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; }
  .steps { background: var(--surface2); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
  .steps-label { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; }
  .step-row { display: flex; align-items: flex-start; gap: 12px; font-size: 0.85rem; line-height: 1.5; }
  .step-num { background: var(--red); color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; flex-shrink: 0; margin-top: 1px; }
  .step-text { color: #bbb; }
  .step-link { color: var(--blue); text-decoration: none; }
  .step-link:hover { text-decoration: underline; }
  .step-code { background: #111; border: 1px solid var(--border); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.8rem; color: #7dd3fc; direction: ltr; display: inline-block; }
  .input-group { display: flex; flex-direction: column; gap: 8px; }
  .input-label { font-size: 0.85rem; color: var(--text-muted); }
  .client-input { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 12px 16px; color: var(--text); font-size: 0.85rem; width: 100%; font-family: monospace; transition: border-color 0.2s; }
  .client-input:focus { outline: none; border-color: var(--red); }
  .login-btn { background: var(--red); color: white; border: none; border-radius: 10px; padding: 14px; font-size: 0.95rem; font-weight: 600; font-family: inherit; cursor: pointer; transition: opacity 0.2s, transform 0.1s; }
  .login-btn:hover:not(.disabled) { opacity: 0.9; transform: translateY(-1px); }
  .login-btn.disabled { opacity: 0.4; cursor: not-allowed; }

  .app { min-height: 100vh; display: flex; flex-direction: column; }
  .header { position: sticky; top: 0; z-index: 10; background: rgba(15,15,15,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); }
  .header-inner { max-width: 900px; margin: 0 auto; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; }
  .header-brand { display: flex; align-items: center; gap: 10px; }
  .header-title { font-size: 1.1rem; font-weight: 600; }
  .header-stats { display: flex; align-items: center; gap: 10px; }
  .badge-count { background: var(--red); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
  .refresh-btn, .logout-btn { display: flex; align-items: center; gap: 6px; background: var(--surface); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 7px 12px; font-size: 0.82rem; font-family: inherit; cursor: pointer; transition: background 0.2s; }
  .refresh-btn:hover, .logout-btn:hover { background: var(--surface2); }
  .refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .logout-btn { color: var(--text-muted); }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .main { max-width: 900px; margin: 0 auto; padding: 24px 20px; width: 100%; flex: 1; }
  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 14px; direction: rtl; animation: fadeIn 0.3s ease; transition: border-color 0.2s; }
  .card:hover { border-color: #333; }
  .card-done { justify-content: center; align-items: center; min-height: 80px; border-style: dashed; opacity: 0.6; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  .card-header { display: flex; align-items: center; justify-content: space-between; }
  .author-row { display: flex; align-items: center; gap: 10px; }
  .avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); }
  .avatar-placeholder { display: flex; align-items: center; justify-content: center; background: #333; color: var(--text); font-size: 0.9rem; font-weight: 600; }
  .author-name { font-size: 0.88rem; font-weight: 600; }
  .comment-time { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
  .video-link { display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: var(--text-muted); text-decoration: none; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); transition: color 0.2s; }
  .video-link:hover { color: var(--blue); border-color: var(--blue); }
  .video-title-label { font-size: 0.75rem; color: var(--text-muted); margin-top: -6px; }
  .comment-text { font-size: 0.9rem; line-height: 1.7; color: #ccc; word-break: break-word; }
  .comment-likes { font-size: 0.78rem; color: var(--text-muted); }
  .actions { display: flex; gap: 8px; margin-top: 4px; }
  .btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 0; border-radius: 9px; border: 1px solid; font-family: inherit; font-size: 0.83rem; font-weight: 500; cursor: pointer; transition: all 0.15s; }
  .btn-approve { background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.25); color: var(--green); }
  .btn-approve:hover { background: rgba(34,197,94,0.18); }
  .btn-delete { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.25); color: #ef4444; }
  .btn-delete:hover { background: rgba(239,68,68,0.18); }
  .btn-block { background: rgba(249,115,22,0.08); border-color: rgba(249,115,22,0.25); color: var(--orange); }
  .btn-block:hover { background: rgba(249,115,22,0.18); }

  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; min-height: 300px; color: var(--text-muted); }
  .empty-title { font-size: 1.1rem; font-weight: 500; }
  .empty-sub { font-size: 0.9rem; }
  .spinner { width: 28px; height: 28px; border: 2px solid var(--border); border-top-color: var(--red); border-radius: 50%; animation: spin 0.7s linear infinite; }
  .load-more { display: flex; justify-content: center; padding: 24px 0; }
  .load-more-btn { background: var(--surface); border: 1px solid var(--border); color: var(--text); border-radius: 10px; padding: 10px 28px; font-family: inherit; font-size: 0.9rem; cursor: pointer; transition: background 0.2s; }
  .load-more-btn:hover { background: var(--surface2); }
  .toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 12px; font-size: 0.9rem; font-weight: 500; animation: slideUp 0.3s ease; z-index: 100; white-space: nowrap; border: 1px solid; }
  .toast-success { background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.3); color: var(--green); }
  .toast-delete { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; }
  .toast-block { background: rgba(249,115,22,0.15); border-color: rgba(249,115,22,0.3); color: var(--orange); }
  .toast-error { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #ef4444; }
  @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 10px); } to { opacity: 1; transform: translate(-50%, 0); } }
  @media (max-width: 600px) { .cards-grid { grid-template-columns: 1fr; } .header-inner { padding: 12px 16px; } .actions { flex-direction: row; } .btn { padding: 8px 0; font-size: 0.78rem; } }
`;
