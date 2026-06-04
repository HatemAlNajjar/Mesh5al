import { useState, useEffect, useRef } from "react";

const YT_API = "https://www.googleapis.com/youtube/v3";
const YT_ANALYTICS = "https://youtubeanalytics.googleapis.com/v2";
const SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/yt-analytics.readonly https://www.googleapis.com/auth/yt-analytics-monetary.readonly";

const TOKEN_KEY = 'yt_access_token';
const EXPIRY_KEY = 'yt_token_expiry';
const SCOPE_VERSION_KEY = 'yt_scope_version';
const CURRENT_SCOPE_VERSION = '2'; // bump when SCOPE changes to force re-login
function saveToken(tok) {
  localStorage.setItem(TOKEN_KEY, tok);
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + 604800 * 1000));
  localStorage.setItem(SCOPE_VERSION_KEY, CURRENT_SCOPE_VERSION);
}
function loadToken() {
  const tok = localStorage.getItem(TOKEN_KEY);
  const exp = Number(localStorage.getItem(EXPIRY_KEY) || '0');
  const scopeVer = localStorage.getItem(SCOPE_VERSION_KEY);
  if (scopeVer !== CURRENT_SCOPE_VERSION) { clearStoredToken(); return null; }
  return tok && Date.now() < exp ? tok : null;
}
function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  localStorage.removeItem(SCOPE_VERSION_KEY);
}


function AppIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="9" fill="#111111"/>
      <path d="M9.5 15.5L14.5 29H25.5L30.5 15.5Z" fill="#1e1e1e"/>
      <path d="M9.5 15.5L14.5 29H25.5L30.5 15.5" fill="none" stroke="#d0d0d0" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
      <line x1="14.5" y1="29" x2="25.5" y2="29" stroke="#d0d0d0" strokeWidth="1.6" strokeLinecap="round"/>
      <rect x="6" y="12" width="28" height="3.5" rx="1.75" fill="#FF0000"/>
      <circle cx="16" cy="19.5" r="1.4" fill="#FF0000"/>
      <circle cx="20" cy="19.5" r="1.4" fill="#FF0000"/>
      <circle cx="24" cy="19.5" r="1.4" fill="#FF0000"/>
      <circle cx="14.8" cy="24" r="1.3" fill="#FF0000"/>
      <circle cx="19.5" cy="24" r="1.3" fill="#FF0000"/>
      <circle cx="24.2" cy="24" r="1.3" fill="#FF0000"/>
      <circle cx="17" cy="27.8" r="1.1" fill="#FF0000"/>
      <circle cx="21" cy="27.8" r="1.1" fill="#FF0000"/>
    </svg>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

function DeltaBadge({ now, prev, label }) {
  if (!prev && !now) return null;
  const diff = now - prev;
  const pct = prev > 0 ? Math.round((diff / prev) * 100) : null;
  const isUp = diff >= 0;
  return (
    <div className={`delta-badge ${isUp ? "delta-up" : "delta-down"}`}>
      <span>{isUp ? "▲" : "▼"}</span>
      <span>{pct !== null ? `${Math.abs(pct)}%` : `${Math.abs(diff).toLocaleString("ar")}`}</span>
      <span className="delta-label">{label}</span>
    </div>
  );
}

function daysAgoAr(days) {
  if (days === 0) return "اليوم";
  if (days === 1) return "أمس";
  if (days === 2) return "منذ يومين";
  if (days >= 3 && days <= 10) {
    const words = ["","","","ثلاثة","أربعة","خمسة","ستة","سبعة","ثمانية","تسعة","عشرة"];
    return `منذ ${words[days]} أيام`;
  }
  if (days >= 11 && days <= 99) return `منذ ${days} يوماً`;
  return `منذ ${days} يوم`;
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
  const clientId = "931394071755-kkf5sd54udo748l2gnptjto5e41rf1t4.apps.googleusercontent.com";
  const [token, setToken] = useState(() => loadToken());
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(() => !!loadToken());
  const [nextPage, setNextPage] = useState(null);
  const [toast, setToast] = useState(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [loginPending, setLoginPending] = useState(false);
  const [videoTitles, setVideoTitles] = useState({});
  const [channelInfo, setChannelInfo] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [approveAllLoading, setApproveAllLoading] = useState(false);
  const [videoCommentsModal, setVideoCommentsModal] = useState(null);
  const [videoCommentsList, setVideoCommentsList] = useState([]);
  const [videoCommentsTotal, setVideoCommentsTotal] = useState(null);
  const [videoCommentsLoading, setVideoCommentsLoading] = useState(false);
  const [videoCommentsOrder, setVideoCommentsOrder] = useState("time");
  const [statsOpen, setStatsOpen] = useState(false);
  const [viewsPeriod, setViewsPeriod] = useState(30);
  const tokenRef = useRef(null);

  useEffect(() => {
    const stored = loadToken();
    if (stored) {
      tokenRef.current = stored;
      fetchComments(stored, null, true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => setGsiLoaded(true);
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []);

  // Auto-login silently when GSI loads and clientId is stored
  useEffect(() => {
    if (!gsiLoaded || !clientId.trim() || token) return;
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: SCOPE,
      prompt: "",
      callback: (res) => {
        if (res.access_token) {
          setToken(res.access_token);
          tokenRef.current = res.access_token;
          saveToken(res.access_token);
          fetchComments(res.access_token, null, true);
        }
      },
      error_callback: () => {},
    });
    client.requestAccessToken();
  }, [gsiLoaded]);

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchChannelData = async (accessToken, channelId) => {
    try {
      const today = new Date();
      const fmt = d => d.toISOString().split("T")[0];
      const todayStr = fmt(today);
      const days30ago = fmt(new Date(today - 30 * 86400000));
      const days60ago = fmt(new Date(today - 60 * 86400000));
      const days31ago = fmt(new Date(today - 31 * 86400000));
      const days7ago  = fmt(new Date(today - 7  * 86400000));
      const days14ago = fmt(new Date(today - 14 * 86400000));
      const days8ago  = fmt(new Date(today - 8  * 86400000));
      const days61ago  = fmt(new Date(today - 61  * 86400000));
      const days90ago  = fmt(new Date(today - 90  * 86400000));
      const days91ago  = fmt(new Date(today - 91  * 86400000));
      const days120ago = fmt(new Date(today - 120 * 86400000));
      const days180ago = fmt(new Date(today - 180 * 86400000));

      // Fetch last 10 videos
      const searchRes = await fetch(`${YT_API}/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=10`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const searchData = await searchRes.json();
      const videoIds = (searchData.items || []).map(v => v.id.videoId).join(",");

      // Fetch video stats + analytics + channel stats in parallel
      // estimatedRevenue is fetched separately as it requires yt-analytics-monetary.readonly scope
      const [vidStatsRes, views30Res, views30PrevRes, views7Res, views7PrevRes, vidWeekNowRes, vidWeekPrevRes, chStatsRes, views60Res, views60PrevRes, views90Res, views90PrevRes] = await Promise.all([
        fetch(`${YT_API}/videos?part=snippet,statistics&id=${videoIds}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days30ago}&endDate=${todayStr}&metrics=views,estimatedMinutesWatched,likes,comments,subscribersGained,subscribersLost`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days60ago}&endDate=${days31ago}&metrics=views`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days7ago}&endDate=${todayStr}&metrics=views,estimatedMinutesWatched,likes,comments,subscribersGained,subscribersLost`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days14ago}&endDate=${days8ago}&metrics=views`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days7ago}&endDate=${todayStr}&metrics=views&dimensions=video&sort=-views&maxResults=200`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days14ago}&endDate=${days8ago}&metrics=views&dimensions=video&sort=-views&maxResults=200`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${YT_API}/channels?part=statistics&id=${channelId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days60ago}&endDate=${todayStr}&metrics=views,estimatedMinutesWatched,likes,comments,subscribersGained,subscribersLost`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days120ago}&endDate=${days61ago}&metrics=views`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days90ago}&endDate=${todayStr}&metrics=views,estimatedMinutesWatched,likes,comments,subscribersGained,subscribersLost`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days180ago}&endDate=${days91ago}&metrics=views`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const [vidStatsData, views30, views30Prev, views7, views7Prev, weekNow, weekPrev, chStatsData, views60, views60Prev, views90, views90Prev] = await Promise.all([
        vidStatsRes.json(), views30Res.json(), views30PrevRes.json(), views7Res.json(), views7PrevRes.json(), vidWeekNowRes.json(), vidWeekPrevRes.json(), chStatsRes.json(),
        views60Res.json(), views60PrevRes.json(), views90Res.json(), views90PrevRes.json(),
      ]);

      // Fetch revenue separately — fails silently if scope is unavailable or channel is not monetized
      const revenueResults = await Promise.allSettled([
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days7ago}&endDate=${todayStr}&metrics=estimatedRevenue`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days30ago}&endDate=${todayStr}&metrics=estimatedRevenue`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days60ago}&endDate=${todayStr}&metrics=estimatedRevenue`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
        fetch(`${YT_ANALYTICS}/reports?ids=channel==${channelId}&startDate=${days90ago}&endDate=${todayStr}&metrics=estimatedRevenue`, { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
      ]);
      const getRevenue = (result) => result.status === "fulfilled" && !result.value?.error ? (result.value?.rows?.[0]?.[0] || 0) : 0;

      const views30Now = views30.rows?.[0]?.[0] || 0;
      const views30PrevVal = views30Prev.rows?.[0]?.[0] || 0;
      const views7Now = views7.rows?.[0]?.[0] || 0;
      const views7PrevVal = views7Prev.rows?.[0]?.[0] || 0;
      const views60Now = views60.rows?.[0]?.[0] || 0;
      const views60PrevVal = views60Prev.rows?.[0]?.[0] || 0;
      const views90Now = views90.rows?.[0]?.[0] || 0;
      const views90PrevVal = views90Prev.rows?.[0]?.[0] || 0;
      const minutesWatched30 = views30.rows?.[0]?.[1] || 0;
      const likes30 = views30.rows?.[0]?.[2] || 0;
      const comments30 = views30.rows?.[0]?.[3] || 0;
      const subsGained30 = views30.rows?.[0]?.[4] || 0;
      const subsLost30 = views30.rows?.[0]?.[5] || 0;
      const revenue30 = getRevenue(revenueResults[1]);
      const minutesWatched7 = views7.rows?.[0]?.[1] || 0;
      const likes7 = views7.rows?.[0]?.[2] || 0;
      const comments7 = views7.rows?.[0]?.[3] || 0;
      const subsGained7 = views7.rows?.[0]?.[4] || 0;
      const subsLost7 = views7.rows?.[0]?.[5] || 0;
      const revenue7 = getRevenue(revenueResults[0]);
      const minutesWatched60 = views60.rows?.[0]?.[1] || 0;
      const likes60 = views60.rows?.[0]?.[2] || 0;
      const comments60 = views60.rows?.[0]?.[3] || 0;
      const subsGained60 = views60.rows?.[0]?.[4] || 0;
      const subsLost60 = views60.rows?.[0]?.[5] || 0;
      const revenue60 = getRevenue(revenueResults[2]);
      const minutesWatched90 = views90.rows?.[0]?.[1] || 0;
      const likes90 = views90.rows?.[0]?.[2] || 0;
      const comments90 = views90.rows?.[0]?.[3] || 0;
      const subsGained90 = views90.rows?.[0]?.[4] || 0;
      const subsLost90 = views90.rows?.[0]?.[5] || 0;
      const revenue90 = getRevenue(revenueResults[3]);

      const chStats = chStatsData.items?.[0]?.statistics || {};
      const subscriberCount = parseInt(chStats.subscriberCount || 0);
      const totalChannelViews = parseInt(chStats.viewCount || 0);
      const videoCount = parseInt(chStats.videoCount || 0);

      // Per-video weekly views map
      const weekNowMap = {};
      const weekPrevMap = {};
      (weekNow.rows || []).forEach(r => { weekNowMap[r[0]] = r[1]; });
      (weekPrev.rows || []).forEach(r => { weekPrevMap[r[0]] = r[1]; });

      const videos = (vidStatsData.items || [])
        .filter(v => (Date.now() - new Date(v.snippet.publishedAt).getTime()) <= 1000 * 86400000)
        .map(v => ({
        id: v.id,
        title: v.snippet.title,
        thumbnail: v.snippet.thumbnails?.medium?.url,
        publishedAt: v.snippet.publishedAt,
        totalViews: parseInt(v.statistics?.viewCount || 0),
        likeCount: parseInt(v.statistics?.likeCount || 0),
        commentCount: parseInt(v.statistics?.commentCount || 0),
        weekViews: weekNowMap[v.id] || 0,
        weekPrevViews: weekPrevMap[v.id] || 0,
      }));

      setChannelInfo({ views30Now, views30PrevVal, views7Now, views7PrevVal, views60Now, views60PrevVal, views90Now, views90PrevVal, minutesWatched30, likes30, comments30, subsGained30, subsLost30, revenue30, minutesWatched7, likes7, comments7, subsGained7, subsLost7, revenue7, minutesWatched60, likes60, comments60, subsGained60, subsLost60, revenue60, minutesWatched90, likes90, comments90, subsGained90, subsLost90, revenue90, subscriberCount, totalChannelViews, videoCount });
      setRecentVideos(videos);
    } catch (e) { console.error(e); }
  };

  const fetchVideoComments = async (videoId, order = "time") => {
    setVideoCommentsLoading(true);
    setVideoCommentsList([]);
    setVideoCommentsTotal(null);
    try {
      const at = tokenRef.current || token;
      let allItems = [];
      let pageToken = null;
      do {
        const params = new URLSearchParams({ part: "snippet", videoId, order, maxResults: "100", ...(pageToken && { pageToken }) });
        const res = await fetch(`${YT_API}/commentThreads?${params}`, { headers: { Authorization: `Bearer ${at}` } });
        const data = await res.json();
        if (data.error) { showToast(data.error.message, "error"); return; }
        allItems = [...allItems, ...(data.items || [])];
        setVideoCommentsList([...allItems]);
        pageToken = data.nextPageToken || null;
      } while (pageToken);
      setVideoCommentsTotal(allItems.length);
    } catch (e) {
      showToast("خطأ في تحميل التعليقات", "error");
    } finally {
      setVideoCommentsLoading(false);
    }
  };

  const fetchComments = async (accessToken, pageToken = null, reset = false) => {
    setLoading(true);
    try {
      const chRes = await fetch(`${YT_API}/channels?part=id&mine=true`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const chData = await chRes.json();
      if (chData.error) {
        showToast(chData.error.message || "خطأ في YouTube API", "error");
        if (chData.error.code === 401) { clearStoredToken(); setToken(null); tokenRef.current = null; }
        setLoading(false);
        return;
      }
      const channelId = chData.items?.[0]?.id;
      if (!channelId) {
        showToast("ما قدرنا نجيب الـ channel ID", "error");
        setLoading(false);
        return;
      }
      if (reset) fetchChannelData(accessToken, channelId);
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
        if (data.error.code === 401) { clearStoredToken(); setToken(null); }
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

  const handleApproveAll = async () => {
    if (comments.length === 0 || approveAllLoading) return;
    setApproveAllLoading(true);
    const t = tokenRef.current || token;
    const toApprove = [...comments];
    let successCount = 0;
    await Promise.all(toApprove.map(async (comment) => {
      try {
        const params = new URLSearchParams({ id: comment.id, moderationStatus: "published", banAuthor: "false" });
        const res = await fetch(`${YT_API}/comments/setModerationStatus?${params}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${t}` },
        });
        if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
        successCount++;
      } catch {}
    }));
    setComments([]);
    setApproveAllLoading(false);
    showToast(`✓ تمت الموافقة على ${successCount} تعليق`, "success");
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

  const manualLogin = () => {
    if (!window.google?.accounts?.oauth2) return;
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (res) => {
        if (res.access_token) {
          setToken(res.access_token);
          tokenRef.current = res.access_token;
          saveToken(res.access_token);
          fetchComments(res.access_token, null, true);
        }
      },
      error_callback: (err) => showToast(err?.message || "خطأ في المصادقة", "error"),
    });
    client.requestAccessToken();
  };

  const periodStats = channelInfo ? (() => {
    const p = viewsPeriod;
    return {
      views:      p === 7 ? channelInfo.views7Now      : p === 60 ? channelInfo.views60Now      : p === 90 ? channelInfo.views90Now      : channelInfo.views30Now,
      viewsPrev:  p === 7 ? channelInfo.views7PrevVal  : p === 60 ? channelInfo.views60PrevVal  : p === 90 ? channelInfo.views90PrevVal  : channelInfo.views30PrevVal,
      minutes:    p === 7 ? channelInfo.minutesWatched7 : p === 60 ? channelInfo.minutesWatched60 : p === 90 ? channelInfo.minutesWatched90 : channelInfo.minutesWatched30,
      likes:      p === 7 ? channelInfo.likes7          : p === 60 ? channelInfo.likes60          : p === 90 ? channelInfo.likes90          : channelInfo.likes30,
      comments:   p === 7 ? channelInfo.comments7       : p === 60 ? channelInfo.comments60       : p === 90 ? channelInfo.comments90       : channelInfo.comments30,
      subsGained: p === 7 ? channelInfo.subsGained7     : p === 60 ? channelInfo.subsGained60     : p === 90 ? channelInfo.subsGained90     : channelInfo.subsGained30,
      subsLost:   p === 7 ? channelInfo.subsLost7       : p === 60 ? channelInfo.subsLost60       : p === 90 ? channelInfo.subsLost90       : channelInfo.subsLost30,
      revenue:    p === 7 ? channelInfo.revenue7        : p === 60 ? channelInfo.revenue60        : p === 90 ? channelInfo.revenue90        : channelInfo.revenue30,
    };
  })() : null;

  if (!token) {
    return (
      <>
        <style>{css}</style>
        <div className="setup-screen">
          <div className="setup-card" style={{gap: "20px", alignItems: "center", maxWidth: "320px"}}>
            <AppIcon size={48} />
            <p style={{fontWeight: 600, fontSize: "1.2rem"}}>مشخال</p>
            {loginPending
              ? <div className="spinner" />
              : <button className="login-btn" onClick={manualLogin} style={{width:"100%"}}>
                  تسجيل الدخول بـ Google
                </button>
            }
          </div>
        </div>
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
              <AppIcon size={28} />
              <span className="header-title">مشخال</span>
            </div>
            <div className="header-center">
              {recentVideos.length > 0 && (
                <span className="header-center-text">آخر مقطع {daysAgoAr(Math.floor((Date.now() - new Date(recentVideos[0].publishedAt)) / 86400000))}</span>
              )}
            </div>
            <div className="header-stats">
              {channelInfo && (
                <button className="icon-btn" onClick={() => setStatsOpen(true)} title="إحصائيات">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                </button>
              )}
              <button className="icon-btn" onClick={() => fetchComments(token, null, true)} disabled={loading} title="تحديث">
                <svg className={loading ? "spin" : ""} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2v6h-6M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6M21 12a9 9 0 01-15 6.7L3 16"/>
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="main">
          {channelInfo && (
            <div className="dashboard">

              {recentVideos.length > 0 && (
                <div className="recent-videos">
                  <p className="section-label">آخر المقاطع</p>
                  <div className="videos-row">
                    {recentVideos.map(v => (
                      <div key={v.id} className="video-card">
                        <a href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer">
                          <img src={v.thumbnail} alt="" className="video-thumb" />
                        </a>
                        <div className="video-card-body">
                          <div className="video-card-stats">
                            <button className="video-stat-num video-stat-link" onClick={() => { setVideoCommentsOrder("time"); setVideoCommentsModal({ videoId: v.id, title: v.title }); fetchVideoComments(v.id, "time"); }}>{Number(v.totalViews).toLocaleString("ar")}</button>
                            <span className="video-days-ago">{daysAgoAr(Math.floor((Date.now() - new Date(v.publishedAt)) / 86400000))}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {loading && comments.length === 0 ? (
            <div className="empty-state"><div className="spinner" /><p>جاري تحميل التعليقات...</p></div>
          ) : comments.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              <p className="empty-title">شخلت التعليقات بنجاح</p>
              <p className="empty-sub">👌</p>
            </div>
          ) : (
            <>
              <div className="toolbar">
                <button className="btn-approve-all" onClick={handleApproveAll} disabled={approveAllLoading}>
                  {approveAllLoading
                    ? <div className="spinner spinner-sm" />
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  }
                  الموافقة على الكل
                </button>
                <span className="toolbar-count">{comments.length} تعليق معلّق</span>
              </div>
              <div className="cards-grid">
                {comments.map(c => (
                  <CommentCard key={c.id} comment={c} onAction={handleAction} videoTitle={videoTitles[c.snippet?.videoId]} />
                ))}
              </div>
            </>
          )}

          {nextPage && !loading && (
            <div className="load-more">
              <button className="load-more-btn" onClick={() => fetchComments(token, nextPage)}>تحميل المزيد</button>
            </div>
          )}
          {loading && comments.length > 0 && <div className="load-more"><div className="spinner" /></div>}
        </main>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.text}</div>}

        {statsOpen && channelInfo && (
          <div className="stats-overlay" dir="rtl">
            <div className="stats-header">
              <span className="stats-title">الإحصائيات</span>
              <button className="vc-close" onClick={() => setStatsOpen(false)}>✕ إغلاق</button>
            </div>
            <div className="stats-body">

              <p className="stats-section-label">القناة</p>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">المشتركون</span>
                  <span className="stat-value">{channelInfo.subscriberCount ? channelInfo.subscriberCount.toLocaleString("ar") : "—"}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">إجمالي المشاهدات</span>
                  <span className="stat-value">{channelInfo.totalChannelViews ? channelInfo.totalChannelViews.toLocaleString("ar") : "—"}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">عدد المقاطع</span>
                  <span className="stat-value">{channelInfo.videoCount ? channelInfo.videoCount.toLocaleString("ar") : "—"}</span>
                </div>
              </div>

              <div className="stats-section-row">
                <p className="stats-section-label" style={{margin:0}}>الأداء</p>
                <select className="period-select period-select-lg" value={viewsPeriod} onChange={e => setViewsPeriod(Number(e.target.value))}>
                  <option value={7}>آخر 7 أيام</option>
                  <option value={30}>آخر 30 يوم</option>
                  <option value={60}>آخر 60 يوم</option>
                  <option value={90}>آخر 90 يوم</option>
                </select>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-label">المشاهدات</span>
                  <span className="stat-value">{periodStats.views.toLocaleString("ar")}</span>
                  <DeltaBadge now={periodStats.views} prev={periodStats.viewsPrev} label="vs السابق" />
                </div>
                <div className="stat-card">
                  <span className="stat-label">دقائق المشاهدة</span>
                  <span className="stat-value">{periodStats.minutes ? Math.round(periodStats.minutes).toLocaleString("ar") : "—"}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">الإعجابات</span>
                  <span className="stat-value">{periodStats.likes ? periodStats.likes.toLocaleString("ar") : "—"}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">التعليقات</span>
                  <span className="stat-value">{periodStats.comments ? periodStats.comments.toLocaleString("ar") : "—"}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">الإيرادات المقدرة</span>
                  <span className="stat-value">{periodStats.revenue != null ? `${(periodStats.revenue * 3.75).toFixed(2)} ر.س` : "—"}</span>
                </div>
                <div className="stat-card">
                  <span className="stat-label">مشتركون جدد</span>
                  <span className="stat-value stat-green">+{(periodStats.subsGained || 0).toLocaleString("ar")}</span>
                </div>

              </div>

              <p className="stats-section-label">آخر المقاطع</p>
              <div className="stats-videos">
                {recentVideos.map(v => {
                  const weekDiff = (v.weekViews || 0) - (v.weekPrevViews || 0);
                  return (
                    <div key={v.id} className="stats-video-row">
                      <a href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" className="stats-video-link">
                        <img src={v.thumbnail} alt="" className="stats-video-thumb" />
                      </a>
                      <div className="stats-video-info">
                        <p className="stats-video-title">{v.title}</p>
                        <p className="stats-video-date">{daysAgoAr(Math.floor((Date.now() - new Date(v.publishedAt)) / 86400000))}</p>
                      </div>
                      <div className="stats-video-nums">
                        <div className="stats-vid-stat">
                          <span className="stats-vid-num">{v.totalViews.toLocaleString("ar")}</span>
                          <span className="stats-vid-lbl">مشاهدة</span>
                        </div>
                        <div className="stats-vid-stat">
                          <span className="stats-vid-num">{v.likeCount ? v.likeCount.toLocaleString("ar") : "—"}</span>
                          <span className="stats-vid-lbl">إعجاب</span>
                        </div>
                        <div className="stats-vid-stat">
                          <span className="stats-vid-num">{v.commentCount ? v.commentCount.toLocaleString("ar") : "—"}</span>
                          <span className="stats-vid-lbl">تعليق</span>
                        </div>
                        <div className="stats-vid-stat">
                          <span className="stats-vid-num">{(v.weekViews || 0).toLocaleString("ar")}</span>
                          <span className="stats-vid-lbl">هذا الأسبوع</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        {videoCommentsModal && (
          <div className="vc-overlay" onClick={() => setVideoCommentsModal(null)}>
            <div className="vc-sheet" onClick={e => e.stopPropagation()}>
              <div className="vc-header">
                <div className="vc-header-info">
                  <span className="vc-title">{videoCommentsModal.title || "تعليقات المقطع"}</span>
                  {!videoCommentsLoading && videoCommentsTotal !== null && (
                    <span className="vc-count">{videoCommentsTotal.toLocaleString("ar")} تعليق</span>
                  )}
                  {videoCommentsLoading && videoCommentsList.length > 0 && (
                    <span className="vc-count">{videoCommentsList.length.toLocaleString("ar")} تعليق جاري التحميل...</span>
                  )}
                </div>
                <button className="vc-close" onClick={() => setVideoCommentsModal(null)}>✕ إغلاق</button>
              </div>
              <div className="vc-sort-bar">
                {[{ key: "time", label: "الأحدث" }, { key: "relevance", label: "الأكثر تفاعلاً" }].map(opt => (
                  <button
                    key={opt.key}
                    className={`vc-sort-btn${videoCommentsOrder === opt.key ? " vc-sort-active" : ""}`}
                    disabled={videoCommentsLoading}
                    onClick={() => { setVideoCommentsOrder(opt.key); fetchVideoComments(videoCommentsModal.videoId, opt.key); }}
                  >{opt.label}</button>
                ))}
              </div>
              <div className="vc-list">
                {videoCommentsLoading ? (
                  <div className="vc-loading"><div className="spinner" /></div>
                ) : videoCommentsList.length === 0 ? (
                  <p className="vc-empty">لا توجد تعليقات</p>
                ) : (
                  videoCommentsList.map(item => {
                    const s = item.snippet?.topLevelComment?.snippet || {};
                    return (
                      <div key={item.id} className="vc-comment">
                        <div className="vc-author-row">
                          {s.authorProfileImageUrl
                            ? <img src={s.authorProfileImageUrl} alt="" className="vc-avatar" />
                            : <div className="vc-avatar vc-avatar-ph">{(s.authorDisplayName || "؟")[0]}</div>
                          }
                          <div>
                            <p className="vc-author">{s.authorDisplayName || "مجهول"}</p>
                            <p className="vc-time">{s.publishedAt ? timeAgo(s.publishedAt) : ""}</p>
                          </div>
                        </div>
                        <p className="vc-text" dangerouslySetInnerHTML={{ __html: s.textDisplay || "" }} />
                        {s.likeCount > 0 && <p className="vc-likes">👍 {s.likeCount}</p>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
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
  .header-inner { max-width: 900px; margin: 0 auto; padding: 16px 20px; display: flex; align-items: center; }
  .header-brand { flex: 1; display: flex; align-items: center; gap: 10px; }
  .header-title { font-size: 1.1rem; font-weight: 600; }
  .header-center { flex: 0 1 auto; text-align: center; padding: 0 8px; overflow: hidden; }
  .header-center-text { font-size: 1.05rem; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .header-stats { flex: 1; display: flex; align-items: center; gap: 10px; justify-content: flex-end; }
  .badge-count { background: var(--red); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 600; }
  .refresh-btn, .logout-btn { display: flex; align-items: center; gap: 6px; background: var(--surface); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 7px 12px; font-size: 0.82rem; font-family: inherit; cursor: pointer; transition: background 0.2s; }
  .refresh-btn:hover, .logout-btn:hover { background: var(--surface2); }
  .refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .icon-btn { display: flex; align-items: center; justify-content: center; background: var(--surface); border: 1px solid var(--border); color: var(--text); border-radius: 8px; width: 34px; height: 34px; cursor: pointer; transition: background 0.2s; flex-shrink: 0; }
  .icon-btn:hover { background: var(--surface2); }
  .icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
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

  .toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .toolbar-count { font-size: 0.82rem; color: var(--text-muted); }
  .btn-approve-all { display: flex; align-items: center; gap: 7px; background: rgba(34,197,94,0.12); border: 1px solid rgba(34,197,94,0.35); color: var(--green); border-radius: 9px; padding: 8px 16px; font-family: inherit; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s; }
  .btn-approve-all:hover:not(:disabled) { background: rgba(34,197,94,0.22); border-color: rgba(34,197,94,0.55); }
  .btn-approve-all:disabled { opacity: 0.5; cursor: not-allowed; }
  .spinner-sm { width: 14px; height: 14px; border-width: 2px; }
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
  .dashboard { margin-bottom: 28px; display: flex; flex-direction: column; gap: 16px; }
  .stats-two-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
  .month-stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
  .month-stat-label { font-size: 0.78rem; color: var(--text-muted); margin-bottom: 4px; }
  .month-stat-num { font-size: 2rem; font-weight: 700; color: var(--text); }
  .delta-badge { display: flex; align-items: center; gap: 5px; font-size: 0.78rem; padding: 5px 10px; border-radius: 20px; white-space: nowrap; }
  .delta-up { background: rgba(34,197,94,0.12); color: var(--green); }
  .delta-down { background: rgba(239,68,68,0.12); color: #ef4444; }
  .delta-label { color: var(--text-muted); font-size: 0.72rem; }
  .recent-videos { display: flex; flex-direction: column; gap: 10px; }
  .section-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 500; }
  .videos-row { display: flex; flex-direction: row; gap: 10px; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; padding-bottom: 4px; }
  .videos-row::-webkit-scrollbar { display: none; }
  .video-card { flex: 0 0 calc(33.333% - 7px); min-width: 0; }
  .video-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; text-decoration: none; transition: border-color 0.2s; display: flex; flex-direction: column; }
  .video-card:hover { border-color: #444; }
  .video-thumb { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
  .vc-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 200; display: flex; align-items: flex-end; }
  .vc-sheet { background: var(--surface); border-top: 1px solid var(--border); border-radius: 20px 20px 0 0; width: 100%; max-height: 75vh; display: flex; flex-direction: column; direction: rtl; }
  .vc-header { padding: 14px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0; }
  .vc-header-info { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
  .vc-title { font-size: 0.85rem; font-weight: 600; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vc-count { font-size: 0.72rem; color: var(--text-muted); }
  .vc-close { background: var(--surface2); border: 1px solid var(--border); color: var(--text-muted); border-radius: 8px; padding: 5px 12px; cursor: pointer; font-size: 0.78rem; font-family: inherit; flex-shrink: 0; }
  .vc-sort-bar { display: flex; gap: 8px; padding: 10px 14px; border-bottom: 1px solid var(--border); flex-shrink: 0; direction: rtl; }
  .vc-sort-btn { background: var(--surface2); border: 1px solid var(--border); color: var(--text-muted); border-radius: 20px; padding: 5px 14px; font-size: 0.78rem; font-family: inherit; cursor: pointer; transition: all 0.15s; }
  .vc-sort-btn:hover:not(:disabled) { border-color: #555; color: var(--text); }
  .vc-sort-active { background: var(--red) !important; border-color: var(--red) !important; color: #fff !important; }
  .vc-sort-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .vc-list { overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
  .vc-loading { display: flex; justify-content: center; padding: 32px; }
  .vc-empty { text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 32px; }
  .vc-comment { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 11px 13px; display: flex; flex-direction: column; gap: 7px; }
  .vc-author-row { display: flex; align-items: center; gap: 9px; }
  .vc-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
  .vc-avatar-ph { background: var(--border); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: var(--text-muted); }
  .vc-author { font-size: 0.8rem; font-weight: 600; color: var(--text); }
  .vc-time { font-size: 0.68rem; color: var(--text-muted); }
  .vc-text { font-size: 0.82rem; color: #ccc; line-height: 1.55; }
  .vc-likes { font-size: 0.72rem; color: var(--text-muted); }
  .video-card-body { padding: 8px; display: flex; flex-direction: column; gap: 6px; width: 100%; }
  .video-card-title { font-size: 0.8rem; color: var(--text); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .video-card-stats { display: flex; flex-direction: column; gap: 4px; width: 100%; }
  .video-stat-num { font-size: 0.88rem; color: var(--text); font-weight: 600; display: block; width: 100%; text-align: center; }
  .video-stat-link { background: none; border: none; cursor: pointer; font-family: inherit; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(232,232,232,0.3); transition: color 0.15s, text-decoration-color 0.15s; }
  .video-stat-link:hover { color: #fff; text-decoration-color: rgba(232,232,232,0.8); }
  .video-days-ago { font-size: 0.72rem; color: var(--text-muted); display: block; width: 100%; text-align: center; }
  .last-video-row { display: flex; align-items: center; justify-content: space-between; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 18px; }
  .last-video-label { font-size: 0.82rem; color: var(--text-muted); }
  .last-video-days { font-size: 1.3rem; font-weight: 700; color: var(--text); }

  .stats-overlay { position: fixed; inset: 0; background: var(--bg); z-index: 300; display: flex; flex-direction: column; }
  .stats-header { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; background: rgba(15,15,15,0.96); backdrop-filter: blur(10px); }
  .stats-title { font-size: 1rem; font-weight: 600; }
  .stats-body { overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; max-width: 900px; width: 100%; margin: 0 auto; padding-bottom: 40px; }
  .stats-section-label { font-size: 0.72rem; color: var(--text-muted); font-weight: 500; margin-top: 10px; }
  .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
  .stat-label { font-size: 0.7rem; color: var(--text-muted); }
  .stat-value { font-size: 1.45rem; font-weight: 700; color: var(--text); }
  .stat-card-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .stats-section-row { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
  .period-select { background: var(--surface2); border: 1px solid var(--border); color: var(--text-muted); border-radius: 6px; padding: 3px 6px; font-size: 0.65rem; font-family: inherit; cursor: pointer; outline: none; direction: rtl; }
  .period-select:focus { border-color: var(--red); }
  .period-select-lg { font-size: 0.75rem; padding: 5px 10px; color: var(--text); }
  .stat-green { color: var(--green) !important; }
  .stat-red { color: #ef4444 !important; }
  .stats-videos { display: flex; flex-direction: column; gap: 10px; }
  .stats-video-row { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 12px; }
  .stats-video-link { flex-shrink: 0; }
  .stats-video-thumb { width: 88px; aspect-ratio: 16/9; object-fit: cover; border-radius: 7px; display: block; }
  .stats-video-info { flex: 1; min-width: 0; }
  .stats-video-title { font-size: 0.82rem; color: var(--text); line-height: 1.45; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .stats-video-date { font-size: 0.68rem; color: var(--text-muted); margin-top: 3px; }
  .stats-video-nums { display: flex; gap: 14px; flex-shrink: 0; }
  .stats-vid-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 36px; }
  .stats-vid-num { font-size: 0.8rem; font-weight: 600; color: var(--text); white-space: nowrap; }
  .stats-vid-lbl { font-size: 0.6rem; color: var(--text-muted); }

  @media (max-width: 600px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .stat-value { font-size: 1.1rem; }
    .stats-video-thumb { width: 64px; }
    .stats-video-nums { gap: 8px; }
    .stats-vid-num { font-size: 0.7rem; }
    .cards-grid { grid-template-columns: 1fr; }
    .header-inner { padding: 12px 16px; }
    .actions { flex-direction: row; }
    .btn { padding: 8px 0; font-size: 0.78rem; }
    .stats-two-col { grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .month-stat-card { padding: 12px 10px; flex-direction: column; align-items: flex-start; gap: 4px; }
    .month-stat-label { font-size: 0.65rem; }
    .month-stat-num { font-size: 1.2rem; }
    .videos-row { gap: 8px; }
    .video-card { flex: 0 0 calc(33.333% - 6px); }
    .video-stat-num { font-size: 0.75rem; }
    .video-days-ago { font-size: 0.65rem; }
    .video-card-body { padding: 6px; }
  }
`;
