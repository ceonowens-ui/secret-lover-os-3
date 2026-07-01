'use strict';

/* ── CONFIG & DATA ──────────────────────────────────────────────────────────── */
const CONFIG = {
  STRIPE_LINK_299:  'https://buy.stripe.com/test_5kQ6oGdP8dny2H1atU1RC02',
  STRIPE_LINK_599:  'https://buy.stripe.com/test_aFa14mdP85V66XhcC21RC01',
  WORKER_API_BASE:  'https://secret-lover-ost-api.anthonywen0693.workers.dev',
  WAV_DRIVE_LINK:   'https://drive.google.com/drive/folders/1bY2lX5nAVNlB9pA6ZXeoE7FTTkuCtEOn?usp=drive_link'
};

const TRACKS = [
  {n:1,  title:'我們之間的祕密',              file:'01.mp3',      free:true},
  {n:2,  title:'真的喜歡是藏不住的',           file:'02.mp3',      free:true},
  {n:3,  title:'假裝教你戀愛',                file:'os3/03.mp3',  free:false},
  {n:4,  title:'越界以後',                    file:'os3/04.mp3',  free:false},
  {n:5,  title:'Sometimes, I See You',       file:'os3/05.mp3',  free:false},
  {n:6,  title:'藍色的暗戀',                  file:'os3/06.mp3',  free:false},
  {n:7,  title:'晴天裡擁抱你',                file:'os3/07.mp3',  free:false},
  {n:8,  title:'心跳先說了祕密',              file:'os3/08.mp3',  free:false},
  {n:9,  title:'喜歡你的回音',                file:'os3/09.mp3',  free:false},
  {n:10, title:'電影院沒有第三個人',           file:'os3/10.mp3',  free:false},
  {n:11, title:'如果你也害怕',                file:'os3/11.mp3',  free:false},
  {n:12, title:'把喜歡藏進音樂盒',            file:'os3/12.mp3',  free:false},
  {n:13, title:'戀愛練習題',                  file:'os3/13.mp3',  free:false},
  {n:14, title:'幼稚鬼決鬥',                  file:'os3/14.mp3',  free:false},
  {n:15, title:'喜歡你這件小事',              file:'os3/15.mp3',  free:false},
  {n:16, title:'靠近你的安全距離',            file:'os3/16.mp3',  free:false},
  {n:17, title:'晴天裡，我終於懂了',          file:'os3/17.mp3',  free:false},
  {n:18, title:'不能被發現的心意',            file:'os3/18.mp3',  free:false},
  {n:19, title:'拓晞爭吵，你為什麼不懂',      file:'os3/19.mp3',  free:false},
  {n:20, title:'等待阿拓',                    file:'os3/20.mp3',  free:false},
  {n:21, title:'最終的告白，我喜歡的一直是你', file:'os3/21.mp3',  free:false}
];

const SUBS = {
  1:'拓把距離靠近的那一秒', 2:'晞沒有說出口的心跳', 3:'借練習之名的靠近',
  4:'那一步跨過去了',       5:'餘光裡都是你',        6:'藏在制服裡的心事',
  7:'陽光剛好你也剛好',     8:'還沒開口就被聽見',    9:'你的名字在心裡迴響',
  10:'黑暗裡偷牽的手',     11:'我們都怕弄丟彼此',   12:'一打開全是你',
  13:'沒有標準答案的心動', 14:'吵架也想黏著你',     15:'一點都不小的事',
  16:'想再近一點點',       17:'原來一直都是你',     18:'只敢在夜裡承認',
  19:'越在乎越說不清',     20:'燈為你留著',         21:'這次不再藏了'
};

const MOODS = ['想他','心動','捨不得','偷偷嘖到','夜車聽歌','哭了','好甜','回不去了'];

const DEFAULT_MOODS = [
  {id:1, name:'匿名聽眾',  mood:'夜車聽歌', text:'坐在車上聽到這首，突然覺得他們好像真的存在。', time:'剛剛'},
  {id:2, name:'小秘密',    mood:'偷偷嘖到', text:'明明只是 OST，為什麼我腦中都是他們靠近的畫面。', time:'3 分鐘前'},
  {id:3, name:'不想睡',    mood:'想他',     text:'那句旋律一出來，就像回到他們沒說出口的那一晚。', time:'8 分鐘前'},
  {id:4, name:'今天也暈船', mood:'心動',    text:'真的喜歡是藏不住的，連歌都藏不住。', time:'12 分鐘前'},
  {id:5, name:'第21首等我', mood:'捨不得',  text:'希望完整 21 首快點解鎖，想把他們的故事聽完。', time:'18 分鐘前'}
];

/* ── STATE ──────────────────────────────────────────────────────────────────── */
const $   = id => document.getElementById(id);
const audio = $('audio');
const UKEY  = 'slo-unlock-v1';
const MKEY  = 'secretLoverMoodWallComments';
const NAV_ORDER = ['player','purchase','unlock','profile'];

let cur          = 0;
let seeking      = false;
let selectedPlan = '299';
let moodComments = [];
let selectedMood = '';
let newMoodId    = null;
let durFixing    = false;
let resumeAt     = 0;
let rafId        = null;

/* ── STORAGE ────────────────────────────────────────────────────────────────── */
function isUnlocked() {
  try { return !!(JSON.parse(localStorage.getItem(UKEY) || 'null') || {}).unlocked; }
  catch(e) { return false; }
}
function getUnlockData() {
  try { return JSON.parse(localStorage.getItem(UKEY) || 'null') || {}; }
  catch(e) { return {}; }
}
function setUnlocked(d) {
  try { localStorage.setItem(UKEY, JSON.stringify(Object.assign({unlocked:true}, d))); }
  catch(e) {}
}

/* ── SCREENS / NAV ──────────────────────────────────────────────────────────── */
function go(s) {
  NAV_ORDER.forEach(sc => {
    $('screen-' + sc).style.display = sc === s ? 'block' : 'none';
  });
  closeSheet();
  if (s === 'unlock') syncUnlock();
}
function navTo(s) { go(s); updateNav(s); popTabIcon(NAV_ORDER.indexOf(s)); }

function updateNav(s) {
  const el = $('nav-inner');
  if (!el) return;
  const ci  = NAV_ORDER.indexOf(s);
  const ind = el.querySelector('.navind');
  if (ind) ind.style.transform = `translateX(${ci * 64}px)`;
  el.querySelectorAll('.navbtn').forEach((b, i) => {
    const active = i === ci;
    b.style.color = active ? '#fbd6e6' : '#8f8a9c';
    b.setAttribute('aria-current', active ? 'page' : 'false');
    const ic = b.querySelector('.navico'), lb = b.querySelector('.navlbl');
    if (ic) ic.style.filter = active ? 'drop-shadow(0 0 12px rgba(255,105,180,.35))' : 'none';
    if (lb) lb.style.opacity = active ? '1' : '.62';
  });
}
function popTabIcon(i) {
  const el = $('nav-inner');
  if (!el) return;
  const b  = el.querySelectorAll('.navbtn')[i];
  const sp = b && b.querySelector('.navico');
  if (!sp) return;
  sp.style.animation = 'none';
  void sp.offsetWidth;
  sp.style.animation = 'tabPop .26s cubic-bezier(.34,1.3,.4,1)';
}

/* ── SVG ICON HELPERS ───────────────────────────────────────────────────────── */
function lockSVG() {
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6f6680" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
}
function playSVG() {
  return '<svg width="14" height="14" viewBox="0 0 24 24" fill="#f3a0c4"><path d="M8 5v14l11-7z"/></svg>';
}
function dlSVG(tk) {
  const u    = getUnlockData();
  const pad  = String(tk.n).padStart(2, '0');
  const fname = pad + ' ' + tk.title;
  const ico  = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
  if (tk.free) {
    return `<a href="songs/${encodeURIComponent(tk.file)}" download="${fname}.mp3" onclick="event.stopPropagation()" style="color:inherit" aria-label="下載 ${fname}">${ico}</a>`;
  }
  if (u.product === '599') {
    const num   = tk.file.replace(/^os3[/]/, '').replace('.mp3', '');
    const dlUrl = CONFIG.WORKER_API_BASE + '/download'
      + '?file='  + encodeURIComponent('os3/wav/' + num + '.wav')
      + '&title=' + encodeURIComponent(fname)
      + '&email=' + encodeURIComponent(u.email || '')
      + '&code='  + encodeURIComponent(u.code  || '');
    return `<a href="${dlUrl}" download="${fname}.wav" onclick="event.stopPropagation()" style="color:inherit" aria-label="下載 ${fname} WAV">${ico}</a>`;
  }
  return playSVG();
}

/* ── TRACK LOCKED HELPER ─────────────────────────────────────────────────────── */
function trackLocked(t) { return !t.free && !isUnlocked(); }

/* ── TRACK LIST — build once, update state only ─────────────────────────────── */
// Each entry: { div, numSpan, titleDiv, iconSpan }
let trackEls = [];

function initTrackList() {
  const container = $('track-list');
  container.innerHTML = '';
  trackEls = [];
  TRACKS.forEach((tk, i) => {
    const lk     = trackLocked(tk);
    const active = i === cur;

    const div = document.createElement('div');
    div.className = 'track-item' + (lk ? ' locked' : '') + (active ? ' active' : '');
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', lk ? 'Secret Track（鎖定）' : `播放 ${tk.title}`);
    div.addEventListener('click',   () => onTrackClick(i));
    div.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTrackClick(i); } });

    const numSpan = document.createElement('span');
    numSpan.className = 'track-num' + (active ? ' active' : '') + (lk ? ' locked' : '');
    numSpan.textContent = String(tk.n).padStart(2, '0');

    const titleDiv = document.createElement('div');
    titleDiv.className = 'track-title';
    titleDiv.textContent = lk ? 'Secret Track' : tk.title;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'track-icon';
    iconSpan.innerHTML = lk ? lockSVG() : dlSVG(tk);

    div.appendChild(numSpan);
    div.appendChild(titleDiv);
    div.appendChild(iconSpan);
    container.appendChild(div);
    trackEls.push({ div, numSpan, titleDiv, iconSpan });
  });
}

// Called on track change — only touches the two affected rows
function updateTrackActive(prevIdx, nextIdx) {
  [prevIdx, nextIdx].forEach(i => {
    if (i < 0 || i >= TRACKS.length) return;
    const { div, numSpan } = trackEls[i];
    const active = i === nextIdx;
    div.classList.toggle('active', active);
    numSpan.classList.toggle('active', active);
  });
  // Scroll new active into view
  const el = trackEls[nextIdx];
  if (el) el.div.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// Full refresh — called after unlock state changes
function refreshTrackListState(anim) {
  trackEls.forEach(({ div, numSpan, titleDiv, iconSpan }, i) => {
    const tk     = TRACKS[i];
    const lk     = trackLocked(tk);
    const active = i === cur;
    div.className     = 'track-item' + (lk ? ' locked' : '') + (active ? ' active' : '');
    numSpan.className = 'track-num'  + (active ? ' active' : '') + (lk ? ' locked' : '');
    if (anim && !tk.free) div.style.animation = `reveal .5s ease ${((i - 2) * 0.05).toFixed(2)}s both`;
    titleDiv.textContent = lk ? 'Secret Track' : tk.title;
    iconSpan.innerHTML   = lk ? lockSVG() : dlSVG(tk);
    div.setAttribute('aria-label', lk ? 'Secret Track（鎖定）' : `播放 ${tk.title}`);
  });
}

/* ── BOTTOM SHEET ────────────────────────────────────────────────────────────── */
function buildSheet() {
  $('sheet-list').innerHTML = TRACKS.map((tk, i) => {
    const lk  = trackLocked(tk), active = i === cur;
    const nc  = active ? '#f29bc2' : (lk ? '#5f5870' : 'rgba(255,255,255,.5)');
    const tc  = active ? '#fff'    : (lk ? '#7a7388' : 'rgba(255,255,255,.7)');
    const ts  = lk ? 'font-style:italic;letter-spacing:1px' : '';
    const rb  = active ? 'background:rgba(243,160,196,.10);' : '';
    const lbl = lk ? 'Secret Track（鎖定）' : tk.title;
    return `<div onclick="onTrackClick(${i});closeSheet();" style="display:flex;align-items:center;gap:13px;padding:13px 14px;border-radius:14px;cursor:pointer;${rb}" role="button" aria-label="播放 ${lbl}">
      <span style="font-family:'Bodoni Moda',serif;font-size:13px;width:24px;text-align:center;color:${nc}">${String(tk.n).padStart(2,'0')}</span>
      <div style="flex:1;min-width:0;font-family:'Noto Serif TC',serif;font-size:17px;color:${tc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${ts}">${lk ? 'Secret Track' : tk.title}</div>
      <span style="flex-shrink:0">${lk ? lockSVG() : dlSVG(tk)}</span>
    </div>`;
  }).join('');
}

function openSheet() {
  $('sheet-overlay').style.display = 'block';
  const s = $('sheet');
  s.style.display    = 'flex';
  s.style.transform  = 'translateY(0)';
  s.style.transition = '';
  buildSheet();
}
function closeSheet() {
  $('sheet-overlay').style.display = 'none';
  $('sheet').style.display = 'none';
}

function initSheetDrag() {
  const sheet = $('sheet');
  let startY = 0, dragging = false;

  const header = sheet.querySelector('.sheet-header');
  const handle = sheet.querySelector('.sheet-handle');
  const dragZone = [header, handle].filter(Boolean);

  // Allow drag from handle / header; scrolling inside list is normal
  sheet.addEventListener('pointerdown', e => {
    const inList = e.target.closest('#sheet-list');
    if (inList) return;
    startY   = e.clientY;
    dragging = true;
    sheet.style.transition = 'none';
    sheet.setPointerCapture(e.pointerId);
  });

  sheet.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dy = Math.max(0, e.clientY - startY);
    sheet.style.transform = `translateY(${dy}px)`;
  });

  const endDrag = e => {
    if (!dragging) return;
    dragging = false;
    const dy = e.clientY - startY;
    sheet.style.transition = 'transform .32s cubic-bezier(.22,.9,.3,1)';
    if (dy > 100) {
      sheet.style.transform = 'translateY(105%)';
      setTimeout(closeSheet, 340);
    } else {
      sheet.style.transform = 'translateY(0)';
    }
  };
  sheet.addEventListener('pointerup',     endDrag);
  sheet.addEventListener('pointercancel', endDrag);
}

/* ── NOW PLAYING ─────────────────────────────────────────────────────────────── */
function updateNP() {
  const t   = TRACKS[cur];
  const lk  = trackLocked(t);
  const odd = t.n % 2 === 1;
  $('now-title').textContent = lk ? 'Secret Track' : t.title;
  $('now-sub').textContent   = 'track ' + String(t.n).padStart(2, '0') + (SUBS[t.n] ? ' · ' + SUBS[t.n] : '');
  const dBg = odd ? 'linear-gradient(135deg,#cdbcf2,#b59cf0)' : 'linear-gradient(135deg,#f7b8d2,#f3a0c4)';
  const dG  = odd ? 'rgba(176,156,228,.9)'                     : 'rgba(243,160,196,.9)';
  const pF  = odd ? 'linear-gradient(90deg,#c9b0ec,#b59cf0 60%,#cdbcf2)' : 'linear-gradient(90deg,#f7b8d2,#f3a0c4 60%,#f29bc2)';
  $('prog-dot').textContent           = odd ? '拓' : '晞';
  $('prog-dot').style.background      = dBg;
  $('prog-dot').style.boxShadow       = '0 2px 10px rgba(0,0,0,.4),0 0 12px ' + dG;
  $('prog-fill').style.background     = pF;
  $('prog-glow').style.background     = dG;
  updateMediaSession();
}

/* ── MEDIA SESSION API ───────────────────────────────────────────────────────── */
function updateMediaSession() {
  if (!('mediaSession' in navigator)) return;
  const t = TRACKS[cur];
  navigator.mediaSession.metadata = new MediaMetadata({
    title:   t.title,
    artist:  'Secret Lover OST',
    album:   '秘密關係',
    artwork: [{ src: 'image/cover.png', sizes: '512x512', type: 'image/png' }]
  });
}
function initMediaSession() {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.setActionHandler('play',          () => audio.play());
  navigator.mediaSession.setActionHandler('pause',         () => audio.pause());
  navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
  navigator.mediaSession.setActionHandler('nexttrack',     nextTrack);
}

/* ── AUDIO SOURCE ────────────────────────────────────────────────────────────── */
function srcFor(t) {
  if (t.free) return 'songs/' + encodeURIComponent(t.file);
  const u = getUnlockData();
  return CONFIG.WORKER_API_BASE + '/track'
    + '?file='  + encodeURIComponent(t.file)
    + '&email=' + encodeURIComponent(u.email || '')
    + '&code='  + encodeURIComponent(u.code  || '');
}

/* ── RAF PROGRESS BAR ────────────────────────────────────────────────────────── */
const fmt = s => (!s || !isFinite(s)) ? '0:00'
  : Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

function paintProgress() {
  const d = audio.duration;
  if (!isFinite(d) || d <= 0) { $('t-cur').textContent = fmt(audio.currentTime); return; }
  const p  = (audio.currentTime / d) * 100;
  const ps = Math.max(0, Math.min(100, p)).toFixed(2) + '%';
  $('prog-fill').style.width = ps;
  $('prog-dot').style.left   = ps;
  $('prog-glow').style.left  = ps;
  $('t-cur').textContent = fmt(audio.currentTime);
  $('t-tot').textContent = fmt(d);
}

function startRAF() {
  if (rafId) return;
  const loop = () => { if (!seeking) paintProgress(); rafId = requestAnimationFrame(loop); };
  rafId = requestAnimationFrame(loop);
}
function stopRAF() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}

/* ── PLAYBACK CONTROLS ───────────────────────────────────────────────────────── */
function playIdx(i) {
  const prev = cur;
  cur = i;
  const t = TRACKS[i];
  durFixing = false; resumeAt = 0;
  $('prog-fill').style.width = '0%';
  $('prog-dot').style.left   = '0%';
  $('prog-glow').style.left  = '0%';
  $('t-cur').textContent = '0:00';
  $('t-tot').textContent = '0:00';
  audio.src = srcFor(t);
  audio.play().catch(() => {});
  updateNP();
  updateTrackActive(prev, cur);
}
function onTrackClick(i) {
  if (trackLocked(TRACKS[i])) { showToast('需解鎖完整專輯才能播放'); go('purchase'); return; }
  playIdx(i);
}
function togglePlay() {
  if (!audio.src) { playIdx(cur); return; }
  audio.paused ? audio.play().catch(() => {}) : audio.pause();
}
function nextTrack() {
  let i = cur;
  do { i = (i + 1) % TRACKS.length; } while (trackLocked(TRACKS[i]) && i !== cur);
  if (trackLocked(TRACKS[i])) { showToast('其餘曲目需解鎖完整專輯'); return; }
  playIdx(i);
}
function prevTrack() {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  let i = cur;
  do { i = (i - 1 + TRACKS.length) % TRACKS.length; } while (trackLocked(TRACKS[i]) && i !== cur);
  if (!trackLocked(TRACKS[i])) playIdx(i);
}

/* ── AUDIO EVENT LISTENERS ───────────────────────────────────────────────────── */
audio.addEventListener('play', () => {
  $('play-path').setAttribute('d', 'M6 5h4v14H6zM14 5h4v14h-4z');
  $('cover-img').style.animationPlayState = 'running';
  startRAF();
});
audio.addEventListener('pause', () => {
  $('play-path').setAttribute('d', 'M8 5v14l11-7z');
  $('cover-img').style.animationPlayState = 'paused';
  stopRAF();
});
audio.addEventListener('ended', () => { stopRAF(); nextTrack(); });

function resolveDur() {
  const d = audio.duration;
  if (isFinite(d) && d > 0) { $('t-tot').textContent = fmt(d); return; }
  if (durFixing) return;
  durFixing = true;
  const onSeek = () => {
    audio.removeEventListener('timeupdate', onSeek);
    const real = audio.duration;
    try { audio.currentTime = resumeAt || 0; } catch(e) {}
    resumeAt = 0; durFixing = false;
    if (isFinite(real) && real > 0) $('t-tot').textContent = fmt(real);
  };
  resumeAt = audio.currentTime || 0;
  audio.addEventListener('timeupdate', onSeek);
  try { audio.currentTime = 1e7; } catch(e) { durFixing = false; }
}
audio.addEventListener('loadedmetadata', resolveDur);
audio.addEventListener('durationchange', () => {
  const d = audio.duration;
  if (isFinite(d) && d > 0) $('t-tot').textContent = fmt(d);
});

/* ── PROGRESS SEEK ───────────────────────────────────────────────────────────── */
function onProgDown(e) {
  seeking = true; seekAt(e);
  const el = $('prog-el');
  el.setPointerCapture(e.pointerId);
  el.addEventListener('pointermove', seekAt);
  el.addEventListener('pointerup', () => { seeking = false; el.removeEventListener('pointermove', seekAt); }, { once: true });
}
function seekAt(e) {
  const r  = $('prog-el').getBoundingClientRect();
  const p  = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  const ad = audio.duration;
  const d  = (isFinite(ad) && ad > 0) ? ad : 0;
  if (d > 0) { try { audio.currentTime = p * d; } catch(err) {} }
  const ps = (p * 100).toFixed(2) + '%';
  $('prog-fill').style.width = ps;
  $('prog-dot').style.left   = ps;
  $('prog-glow').style.left  = ps;
  $('t-cur').textContent = fmt(p * d);
}

/* ── UNLOCK ──────────────────────────────────────────────────────────────────── */
function syncUnlock() {
  const u   = isUnlocked();
  $('unlock-locked-state').style.display  = u ? 'none'  : 'block';
  $('unlock-success-state').style.display = u ? 'block' : 'none';
  const is599 = u && getUnlockData().product === '599' && !!CONFIG.WAV_DRIVE_LINK;
  const wl = $('wav-dl-link');
  if (wl) { wl.style.display = is599 ? 'inline-flex' : 'none'; wl.href = CONFIG.WAV_DRIVE_LINK || '#'; }
  const wr = $('wav-dl-row');
  if (wr) wr.style.display = is599 ? 'block' : 'none';
}

// NOTE: 'LOVE' and 'SECRET' codes are DEMO-only — they bypass server verification.
// Production: remove this shortcut and rely solely on /verify endpoint.
async function redeem() {
  const email = $('in-email').value.trim();
  const code  = $('in-code').value.trim().toUpperCase();
  if (!email || !code) { showToast('請輸入 email 和兌換碼'); return; }
  if (code === 'LOVE' || code === 'SECRET') {
    unlockNow({ email, code, product: selectedPlan });
    return;
  }
  if (!CONFIG.WORKER_API_BASE) { showToast('後端尚未設定 · 試試兌換碼 LOVE'); return; }
  try {
    const res = await fetch(CONFIG.WORKER_API_BASE + '/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({ email, code })
    });
    const d = await res.json();
    if (d.ok) unlockNow({ email, code, product: d.product || selectedPlan });
    else       showToast(d.message || '兌換碼或 email 不正確');
  } catch(e) {
    showToast('連線失敗 · 後端未回應（可先用兌換碼 LOVE）');
  }
}

function unlockNow(data) {
  setUnlocked(data);
  refreshTrackListState(true);
  syncUnlock();
  navTo('player');
  const ov    = $('unlock-burst-overlay');
  const parts = $('unlock-particles');
  ov.style.display = 'block';
  const cols = ['#f29bc2','#f7b8d2','#c9b0ec'];
  parts.innerHTML = Array.from({length: 8}, () => {
    const l   = (10 + Math.random() * 78).toFixed(0);
    const sz  = (13 + Math.random() * 13).toFixed(0);
    const d   = (0.95 + Math.random() * 0.45).toFixed(2);
    const dl  = (Math.random() * 0.3).toFixed(2);
    const col = cols[Math.floor(Math.random() * cols.length)];
    return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="${col}" style="position:absolute;bottom:35%;left:${l}%;animation:floatUp ${d}s ease-out ${dl}s both"><path d="M12 21s-7.5-4.6-10-9.3C.3 8.3 1.9 4.8 5.2 4.8c2 0 3.3 1.2 3.9 2.2.6-1 1.9-2.2 3.9-2.2 3.3 0 4.9 3.5 3.2 6.9C19.5 16.4 12 21 12 21z"/></svg>`;
  }).join('');
  showToast('解鎖成功 · 21 首全部屬於你了 ♡');
  setTimeout(() => { ov.style.display = 'none'; }, 1800);
}

function resetUnlock() {
  try { localStorage.removeItem(UKEY); localStorage.removeItem('slo-plan'); } catch(e) {}
  selectedPlan = '299';
  refreshTrackListState();
  syncUnlock();
  showToast('已重設 · 回到未解鎖狀態');
}

/* ── PURCHASE ────────────────────────────────────────────────────────────────── */
function selectPlan(p) {
  selectedPlan = p;
  try { localStorage.setItem('slo-plan', p); } catch(e) {}
  $('plan299').style.borderColor = p === '299' ? '#f29bc2' : 'rgba(255,255,255,.12)';
  $('plan599').style.borderColor = p === '599' ? '#f29bc2' : 'rgba(242,155,194,.45)';
  $('checkout-btn').textContent  = '前往結帳 · NT$' + (p === '599' ? '599' : '299');
}
function goCheckout() {
  const l = selectedPlan === '599' ? CONFIG.STRIPE_LINK_599 : CONFIG.STRIPE_LINK_299;
  if (!l) { showToast('尚未設定付款連結'); return; }
  window.open(l, '_blank');
}

/* ── HEART ANIMATION ─────────────────────────────────────────────────────────── */
function captureHeart(e) {
  const hi = $('heart-icon'), hb = $('heart-btn'), ov = $('heart-burst-overlay');
  ov.style.display = 'block';
  hi.setAttribute('fill', '#f3a0c4'); hi.setAttribute('stroke', 'none');
  hi.style.animation = 'bounce .5s ease'; hb.style.animation = 'bounce .5s ease';
  const sr  = $('stage').getBoundingClientRect(), br = hb.getBoundingClientRect();
  const ox  = ((br.left + br.width  / 2 - sr.left) / sr.width  * 100).toFixed(1);
  const oy  = ((br.top  + br.height / 2 - sr.top)  / sr.height * 100).toFixed(1);
  const cols = ['#f29bc2','#f7b8d2','#c9b0ec','#cdbcf2','#f3a0c4'];
  let h = `<div style="position:absolute;left:${ox}%;top:${oy}%;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(243,160,196,.55),transparent 72%);transform:translate(-50%,-50%);animation:glowFade 1.1s ease-out both"></div>`;
  h += `<div style="position:absolute;left:${ox}%;top:${oy}%;width:64px;height:64px;border-radius:50%;border:1.5px solid rgba(243,160,196,.8);transform:translate(-50%,-50%);animation:ringPulse .9s cubic-bezier(.2,.7,.3,1) both"></div>`;
  h += `<svg width="60" height="60" viewBox="0 0 24 24" fill="#f3a0c4" style="position:absolute;left:${ox}%;top:${oy}%;transform:translate(-50%,-50%);filter:drop-shadow(0 4px 14px rgba(243,160,196,.6));animation:bloomHeart 1s cubic-bezier(.3,1.3,.5,1) both"><path d="M12 21s-7.5-4.6-10-9.3C.3 8.3 1.9 4.8 5.2 4.8c2 0 3.3 1.2 3.9 2.2.6-1 1.9-2.2 3.9-2.2 3.3 0 4.9 3.5 3.2 6.9C19.5 16.4 12 21 12 21z"/></svg>`;
  for (let k = 0; k < 16; k++) {
    const dx   = ((Math.random() * 2 - 1) * 72).toFixed(0);
    const rise = (120 + Math.random() * 150).toFixed(0);
    const sc   = (0.65 + Math.random() * .85).toFixed(2);
    const r2   = ((Math.random() * 2 - 1) * 45).toFixed(0);
    const d    = (1.1 + Math.random() * .9).toFixed(2);
    const dl   = (Math.random() * .4).toFixed(2);
    const sz   = (13 + Math.random() * 15).toFixed(0);
    const col  = cols[Math.floor(Math.random() * cols.length)];
    h += `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="${col}" style="position:absolute;left:${ox}%;top:${oy}%;transform:translate(-50%,-50%);--dx:${dx}px;--rise:${rise}px;--s:${sc};--r2:${r2}deg;animation:floatHeart ${d}s cubic-bezier(.4,.7,.5,1) ${dl}s both"><path d="M12 21s-7.5-4.6-10-9.3C.3 8.3 1.9 4.8 5.2 4.8c2 0 3.3 1.2 3.9 2.2.6-1 1.9-2.2 3.9-2.2 3.3 0 4.9 3.5 3.2 6.9C19.5 16.4 12 21 12 21z"/></svg>`;
  }
  ov.innerHTML = h;
  showToast('已收藏這一刻', 1000);
  setTimeout(() => { hi.setAttribute('fill','none'); hi.setAttribute('stroke','#f3a0c4'); hi.style.animation = 'heartbeat 2.6s ease-in-out infinite'; hb.style.animation = 'none'; }, 1200);
  setTimeout(() => { ov.style.display = 'none'; ov.innerHTML = ''; }, 1700);
}

/* ── TOAST ───────────────────────────────────────────────────────────────────── */
let _tt;
function showToast(m, d) {
  const e = $('toast');
  e.textContent   = m;
  e.style.display = 'block';
  clearTimeout(_tt);
  _tt = setTimeout(() => e.style.display = 'none', d || 2200);
}

/* ── MOOD WALL ───────────────────────────────────────────────────────────────── */
function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])
  );
}
function loadMoods() {
  try {
    const s = localStorage.getItem(MKEY);
    moodComments = s ? JSON.parse(s) : DEFAULT_MOODS.slice();
  } catch(e) { moodComments = DEFAULT_MOODS.slice(); }
}
function saveMoods() {
  try { localStorage.setItem(MKEY, JSON.stringify(moodComments)); } catch(e) {}
}
function buildMoodTags() {
  $('mood-tags').innerHTML = MOODS.map(m => {
    const sel = selectedMood === m;
    const st  = sel
      ? 'background:linear-gradient(135deg,#f29bc2,#c9b0ec 52%,#afc7f6);color:#fff;border:1px solid transparent;box-shadow:0 5px 14px rgba(242,155,194,.3)'
      : 'background:rgba(255,255,255,.05);color:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.16)';
    return `<button type="button" onclick="selMood('${m}')" aria-pressed="${sel}" style="padding:7px 14px;border-radius:20px;font-size:12px;font-family:'Noto Serif TC',serif;cursor:pointer;${st}">${m}</button>`;
  }).join('');
}
function selMood(m) { selectedMood = selectedMood === m ? '' : m; buildMoodTags(); }
function onMoodInput(e) { $('mood-chars').textContent = e.target.value.length; $('mood-err').style.display = 'none'; }
function renderMoods() {
  $('mood-num').textContent = moodComments.length;
  $('mood-list').innerHTML  = moodComments.map(c =>
    `<div class="mood-card${c.id === newMoodId ? ' mood-new' : ''}">
      <div class="mood-header">
        <span class="mood-name">${esc(c.name)}</span>
        <span class="mood-tag">♡ ${esc(c.mood)}</span>
      </div>
      <div class="mood-text">${esc(c.text)}</div>
      <div class="mood-time">${esc(c.time)}</div>
    </div>`
  ).join('');
}
function submitMood() {
  const text = $('mood-text').value.trim();
  if (!text) { $('mood-err').style.display = 'block'; return; }
  $('mood-err').style.display = 'none';
  const c = {
    id:   Date.now(),
    name: $('mood-name').value.trim() || '匿名聽眾',
    mood: selectedMood || '聽歌中',
    text: text.slice(0, 80),
    time: '剛剛'
  };
  moodComments.unshift(c);
  newMoodId = c.id;
  saveMoods(); renderMoods();
  $('mood-name').value = ''; $('mood-text').value = ''; $('mood-chars').textContent = '0';
  selectedMood = ''; buildMoodTags();
  const btn = $('mood-submit');
  btn.textContent = '已收藏這個瞬間 ♡';
  setTimeout(() => { btn.textContent = '留下心情'; newMoodId = null; }, 1100);
}

/* ── INIT ────────────────────────────────────────────────────────────────────── */
loadMoods();
buildMoodTags();
renderMoods();
updateNP();
initTrackList();
syncUnlock();
updateNav('player');
initSheetDrag();
initMediaSession();
