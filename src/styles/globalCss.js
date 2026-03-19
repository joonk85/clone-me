// clone.me 글로벌 스타일 — STYLE_GUIDE.md 토큰 (:root), 키프레임, 모바일(≤767px) 보조
// App.jsx 에 <style>{GLOBAL_CSS}</style> 로 주입

export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;500&display=swap');
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  /* ── Surfaces ── */
  --bg:#050508;
  --sf:#0d0d14;
  --sf2:#13131e;
  --sf3:#1a1a28;

  /* ── Borders ── */
  --br:rgba(255,255,255,0.07);
  --br2:rgba(99,217,255,0.25);

  /* ── Brand & semantic ── */
  --cy:#63d9ff;
  --cyd:rgba(99,217,255,0.12);
  --cyg:rgba(99,217,255,0.05);
  --gn:#4fffb0;
  --am:#ffb347;
  --rd:#ff4f6d;
  --pu:#b794ff;
  --go:#ffc832;

  /* ── Text ── */
  --tx:#e8e8f0;
  --tx2:rgba(232,232,240,0.55);
  --tx3:rgba(232,232,240,0.22);

  /* ── Typography (STYLE_GUIDE: 12/14/16/18/24/32/48, line-height 1.5) ── */
  --fn:'Pretendard Variable',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  --fn-title:'Syne',system-ui,sans-serif;
  --mo:'Space Mono',ui-monospace,monospace;
  --fs-xs:12px;
  --fs-sm:12px;
  --fs-caption:12px;
  --fs-body:14px;
  --fs-lead:14px;
  --fs-h3:18px;
  --fs-h2:24px;
  --fs-h1:32px;
  --fs-h1-mobile:24px;
  --fs-input-mobile:16px;
  --lh:1.5;

  /* ── Radius ── */
  --r-sm:6px;
  --r-md:8px;
  --r-lg:12px;
  --r-xl:16px;

  /* ── Page spacing ── */
  --page-pad-x:24px;
  --page-pad-y:24px;
  --page-pad-x-mobile:16px;
  --page-pad-y-mobile:16px;
  --auth-max-w:440px;

  /* ── Nav & touch ── */
  --nav-h:52px;
  --nav-h-mobile:48px;
  --touch-min:44px;
  --z-nav:100;
  --z-nav-tabbar:98;
  --nav-tabbar-h:54px;
  --z-nav-backdrop:199;
  --z-nav-drawer:200;

  /* ── Safe area (iOS) ── */
  --safe-top:env(safe-area-inset-top,0px);
  --safe-bottom:env(safe-area-inset-bottom,0px);
  --safe-left:env(safe-area-inset-left,0px);
  --safe-right:env(safe-area-inset-right,0px);

  /* ── Nav scrim & overlay ── */
  --nav-scrim:rgba(5,5,8,0.94);
  --overlay-dim:rgba(5,5,8,0.72);

  /* ── Surfaces (tag / error / amber) ── */
  --am-surface:rgba(255,179,71,0.12);
  --am-muted:rgba(255,179,71,0.08);
  --am-line:rgba(255,179,71,0.3);
  --err-surface:rgba(255,79,109,0.08);
  --err-border:rgba(255,79,109,0.35);
  --tg-gn-bg:rgba(79,255,176,0.1);
  --tg-am-bg:rgba(255,179,71,0.1);
  --tg-rd-bg:rgba(255,79,109,0.1);
  --tg-go-bg:rgba(255,200,50,0.12);
  --tg-pu-bg:rgba(183,148,255,0.1);

  /* ── Text on primary / danger button ── */
  --on-cy:#000;
  --on-rd:#fff;
}

@media (max-width:767px){
  :root{
    --page-pad-x:var(--page-pad-x-mobile);
    --page-pad-y:var(--page-pad-y-mobile);
  }
}

html,body{
  background:var(--bg);
  color:var(--tx);
  font-family:var(--fn);
  font-size:var(--fs-body);
  line-height:var(--lh);
  overflow-x:hidden;
  -webkit-tap-highlight-color:transparent;
}
h1,h2,h3,h4,.font-title{font-family:var(--fn-title);}

::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-thumb{background:var(--br2);border-radius:2px}

.nav-scroll{
  -webkit-overflow-scrolling:touch;
  scrollbar-width:none;
  -ms-overflow-style:none;
}
.nav-scroll::-webkit-scrollbar{display:none}

/* 홈 비로그인 히어로 — 섹션 스코프 (Home.jsx .home-hero), 전역 토큰만 사용 */
.home-hero{}

/* 홈 히어로 — white→cyan 그라디언트 타이틀 (토큰만) */
.home-hero-gradient-title{
  font-family:var(--fn-title);
  font-weight:800;
  letter-spacing:-0.04em;
  line-height:1.06;
  font-size:clamp(1.7rem,6.2vw,2.35rem);
  background:linear-gradient(102deg,#fff 0%,rgba(255,255,255,0.85) 25%,var(--cy) 70%,var(--cy) 100%);
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;
  color:transparent;
}
@media (min-width:768px){
  .home-hero-gradient-title{font-size:clamp(2.4rem,4.2vw,3.25rem);}
}

@keyframes fu{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes sp{to{transform:rotate(360deg)}}
@keyframes wv{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}
@keyframes d3{0%,60%,100%{opacity:1}30%{opacity:0}}
@keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
`;
