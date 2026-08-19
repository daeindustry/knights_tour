(() => {
  const MIN_N = 5, MAX_N = 12, DEFAULT_N = 6;
  const SIZE_KEY = 'kt_last_size';
  const THEME_KEY = 'kt-theme';
  const MOVES = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];

  const boardEl   = document.getElementById('board');
  const moveNumEl = document.getElementById('moveNum');
  const totalLbl  = document.getElementById('totalLbl');
  const sizeLbl   = document.getElementById('sizeLbl');
  const timerEl   = document.getElementById('timer');
  const bestEl    = document.getElementById('best');
  const modeSel   = document.getElementById('mode');
  const sizeSel   = document.getElementById('size');
  const toast     = document.getElementById('toast');
  const themeBtn  = document.getElementById('themeBtn');

  let N, TOTAL, cells, visited, history, knight, startTs, timerId, finished;
  let focusIdx = 0;

  const inBounds = (r,c) => r>=0&&r<N&&c>=0&&c<N;
  const idx = (r,c) => r*N+c;
  const bestKey = () => `kt_best_${N}`;
  const squareName = (r,c) => String.fromCharCode(97+c) + (r+1);

  function initTheme(){
    let saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch(_) {}
    const root = document.documentElement;
    if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) root.dataset.theme = 'light';
    updateThemeBtn();
  }
  function updateThemeBtn(){
    if(!themeBtn) return;
    const dark = document.documentElement.dataset.theme !== 'light';
    themeBtn.textContent = dark ? '☀️ Light' : '🌙 Dark';
  }
  function toggleTheme(){
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(THEME_KEY, root.dataset.theme); } catch(_) {}
    updateThemeBtn();
  }

  function loadSavedSize(){
    try {
      const raw = localStorage.getItem(SIZE_KEY);
      const n = parseInt(raw, 10);
      if (Number.isFinite(n) && n >= MIN_N && n <= MAX_N) return n;
    } catch(_) { /* localStorage may be disabled */ }
    return DEFAULT_N;
  }
  function saveSize(n){
    try { localStorage.setItem(SIZE_KEY, String(n)); } catch(_) {}
  }

  function build(){
    boardEl.innerHTML='';
    boardEl.style.gridTemplateColumns = `repeat(${N},1fr)`;
    boardEl.style.gridTemplateRows    = `repeat(${N},1fr)`;
    cells=[];
    for(let r=0;r<N;r++)for(let c=0;c<N;c++){
      const d=document.createElement('div');
      d.className='cell '+((r+c)%2?'dark':'light');
      d.dataset.r=r; d.dataset.c=c;
      d.setAttribute('role','button');
      d.tabIndex = (r===0&&c===0)?0:-1;
      d.addEventListener('click',()=>onClick(r,c));
      boardEl.appendChild(d);
      cells.push(d);
    }
    focusIdx = 0;
    if(cells.length) {
      for(const el of cells) el.tabIndex=-1;
      cells[0].tabIndex=0;
    }
    boardEl.style.setProperty('--pieceSize', `clamp(18px, ${(44/N).toFixed(2)}vw, 52px)`);
    boardEl.style.setProperty('--numSize',   `clamp(9px,  ${(14/N).toFixed(2)}vw, 16px)`);
    if(!document.getElementById('dynStyle')){
      const s=document.createElement('style'); s.id='dynStyle';
      s.textContent = `
        .cell .pc{font-size:var(--pieceSize)}
        .cell.visited .num{font-size:var(--numSize)}
      `;
      document.head.appendChild(s);
    }
  }

  function legalFrom(r,c){
    const out=[];
    for(const [dr,dc] of MOVES){
      const nr=r+dr,nc=c+dc;
      if(inBounds(nr,nc)&&!visited[idx(nr,nc)]) out.push([nr,nc]);
    }
    return out;
  }

  function labelFor(i, hinted){
    const r=Math.floor(i/N), c=i%N;
    let label=squareName(r,c);
    if(knight && knight[0]===r && knight[1]===c) label+=', current';
    if(visited[i]) label+=', visited, move '+visited[i];
    else if(hinted) label+=', valid move';
    return label;
  }

  function render(){
    const hinted=new Set();
    if(knight){
      const [kr,kc]=knight;
      if(modeSel.value!=='none' && !finished){
        const moves=legalFrom(kr,kc);
        if(modeSel.value==='warnsdorff'){
          let min=Infinity, best=[];
          for(const [nr,nc] of moves){
            const k=legalFrom(nr,nc).length;
            if(k<min){min=k;best=[[nr,nc]];}
            else if(k===min) best.push([nr,nc]);
          }
          for(const [nr,nc] of best) hinted.add(idx(nr,nc));
        } else {
          for(const [nr,nc] of moves) hinted.add(idx(nr,nc));
        }
      }
    }
    for(let i=0;i<TOTAL;i++){
      const el=cells[i];
      el.classList.remove('hint','knight');
      el.innerHTML='';
      if(visited[i]){
        el.classList.add('visited');
        const n=document.createElement('span');
        n.className='num'; n.setAttribute('aria-hidden','true'); n.textContent=visited[i];
        el.appendChild(n);
      } else {
        el.classList.remove('visited');
      }
      if(knight && knight[0]===Math.floor(i/N) && knight[1]===i%N){
        el.classList.add('knight');
        const p=document.createElement('span');
        p.className='pc'; p.setAttribute('aria-hidden','true'); p.textContent='♞';
        el.innerHTML='';
        el.appendChild(p);
      }
      if(hinted.has(i)) el.classList.add('hint');
      el.setAttribute('aria-label', labelFor(i, hinted.has(i)));
    }
    moveNumEl.textContent = history.length;
  }

  function onClick(r,c){
    if(finished) return;
    const i=idx(r,c);
    if(focusIdx!==i){
      if(cells[focusIdx]) cells[focusIdx].tabIndex=-1;
      focusIdx=i;
      cells[i].tabIndex=0;
    }
    if(!knight){ placeKnight(r,c); startTimer(); return; }
    const [kr,kc]=knight;
    const ok=legalFrom(kr,kc).some(([a,b])=>a===r&&b===c);
    if(!ok){ flash("Illegal move — knights move in an L."); return; }
    placeKnight(r,c);
    checkEnd();
  }

  function placeKnight(r,c){
    knight=[r,c];
    history.push([r,c]);
    visited[idx(r,c)]=history.length;
    render();
  }

  function checkEnd(){
    if(history.length===TOTAL){ win(); return; }
    const [r,c]=knight;
    if(legalFrom(r,c).length===0){ lose(); }
  }

  function win(){
    finished=true; stopTimer();
    const secs=Math.floor((Date.now()-startTs)/1000);
    const prev=parseInt(localStorage.getItem(bestKey())||'0',10);
    if(!prev||secs<prev){ localStorage.setItem(bestKey(),secs); loadBest(); }
    flash(`🏆 Complete ${N}×${N} tour in ${fmt(secs)}!`,'win');
  }
  function lose(){
    finished=true; stopTimer();
    flash(`Stuck at move ${history.length}/${TOTAL}. Try again!`,'lose');
  }

  function undo(){
    if(finished||history.length===0) return;
    const [r,c]=history.pop();
    visited[idx(r,c)]=0;
    knight = history.length? history[history.length-1]: null;
    if(history.length===0){ stopTimer(); startTs=null; timerEl.textContent='0:00'; }
    render();
  }

  function newGame(){
    N = parseInt(sizeSel.value,10);
    if(!Number.isFinite(N) || N<MIN_N || N>MAX_N) N = DEFAULT_N;
    saveSize(N);
    TOTAL = N*N;
    sizeLbl.textContent = `${N}×${N}`;
    totalLbl.textContent = TOTAL;
    visited=new Array(TOTAL).fill(0);
    history=[]; knight=null; finished=false;
    stopTimer(); startTs=null; timerEl.textContent='0:00';
    build(); render(); loadBest();
  }

  function autoSolve(){
    if(finished) return;
    if(!knight){ flash("Place the knight first."); return; }
    const v=visited.slice();
    const path=history.slice();
    const maxNodes = 5_000_000;
    let nodes = 0;
    function dfs(r,c){
      if(++nodes > maxNodes) return false;
      if(path.length===TOTAL) return true;
      const opts=[];
      for(const [dr,dc] of MOVES){
        const nr=r+dr,nc=c+dc;
        if(inBounds(nr,nc)&&!v[idx(nr,nc)]){
          let deg=0;
          for(const [er,ec] of MOVES){
            const ar=nr+er,ac=nc+ec;
            if(inBounds(ar,ac)&&!v[idx(ar,ac)]) deg++;
          }
          opts.push([deg,nr,nc]);
        }
      }
      opts.sort((a,b)=>a[0]-b[0]);
      for(const [,nr,nc] of opts){
        v[idx(nr,nc)]=path.length+1;
        path.push([nr,nc]);
        if(dfs(nr,nc)) return true;
        path.pop();
        v[idx(nr,nc)]=0;
      }
      return false;
    }
    const [r,c]=knight;
    const t0=performance.now();
    const ok = dfs(r,c);
    const ms = (performance.now()-t0).toFixed(0);
    if(ok){
      const remainder=path.slice(history.length);
      let i=0;
      finished=true;
      const delay = Math.max(35, 110 - N*8);
      const tick=()=>{
        if(i>=remainder.length){ finished=false; checkEnd(); return; }
        const [nr,nc]=remainder[i++];
        knight=[nr,nc]; history.push([nr,nc]); visited[idx(nr,nc)]=history.length;
        render();
        setTimeout(tick,delay);
      };
      flash(`Solver found a tour (${ms} ms). Animating…`);
      tick();
    } else {
      flash("No completing tour from this position.",'lose');
    }
  }

  function startTimer(){
    if(timerId) return;
    startTs=Date.now();
    timerId=setInterval(()=>{
      timerEl.textContent=fmt(Math.floor((Date.now()-startTs)/1000));
    },500);
  }
  function stopTimer(){ if(timerId){clearInterval(timerId); timerId=null;} }
  function fmt(s){ return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
  function loadBest(){
    const b=parseInt(localStorage.getItem(bestKey())||'0',10);
    bestEl.textContent = b? fmt(b) : '—';
  }
  function flash(msg,kind=''){
    toast.textContent=msg;
    toast.className='toast show '+kind;
    clearTimeout(flash._t);
    flash._t=setTimeout(()=>toast.className='toast',2400);
  }

  document.getElementById('newBtn').onclick=newGame;
  document.getElementById('undoBtn').onclick=undo;
  document.getElementById('solveBtn').onclick=autoSolve;
  document.getElementById('resetBest').onclick=()=>{
    localStorage.removeItem(bestKey()); loadBest(); flash(`Best for ${N}×${N} cleared.`);
  };
  if(themeBtn) themeBtn.onclick=toggleTheme;
  sizeSel.onchange=newGame;
  modeSel.onchange=render;
  boardEl.addEventListener('keydown',e=>{
    const t=e.target;
    if(!t || !t.classList || !t.classList.contains('cell')) return;
    const r=Number(t.dataset.r), c=Number(t.dataset.c);
    let nr=null, nc=null;
    if(e.key==='ArrowUp') nr=Math.max(0,r-1);
    else if(e.key==='ArrowDown') nr=Math.min(N-1,r+1);
    else if(e.key==='ArrowLeft') nc=Math.max(0,c-1);
    else if(e.key==='ArrowRight') nc=Math.min(N-1,c+1);
    if(nr!==null){
      e.preventDefault();
      cells[focusIdx].tabIndex=-1;
      focusIdx=nr*N+nc;
      cells[focusIdx].tabIndex=0;
      cells[focusIdx].focus();
      return;
    }
    if(e.key==='Enter'||e.key===' '){
      e.preventDefault();
      t.click();
    }
  });
  window.addEventListener('keydown',e=>{
    if(e.key==='z'||e.key==='Z') undo();
    if(e.key==='n'||e.key==='N') newGame();
  });

  initTheme();
  sizeSel.value = String(loadSavedSize());
  newGame();
})();
