/* 生物ラボ：アニメーション（からだ・細胞のはたらき）
   心臓と血液の循環 / 興奮の伝導とシナプス / 筋収縮 / 免疫 / 腎臓 / 光合成と呼吸 */
(function () {
  /* ---------- 共通の色（明るい画面・暗い画面） ---------- */
  var LIGHT = '--a-art:#e0322c;--a-ven:#6b2340;--a-mus:#f2b8ad;--a-musd:#b9574c;--a-lung:#f8dcd6;--a-alv:#fbe9e5;--a-tis:#f3e6cf;--a-valve:#fff8f2;' +
    '--a-mem:#c9a227;--a-memf:#f6e7b0;--a-chl:#9fd08a;--a-chld:#2f6b3a;--a-thy:#4f9a45;--a-str:#e6f3dc;--a-mit:#f7c9a6;--a-mitd:#a0522d;--a-mat:#fde8d6;' +
    '--a-na:#2f6fc0;--a-k:#7a4fa0;--a-ca:#d08a1e;--a-nt:#1f9e8a;--a-myl:#f1ead6;--a-ax:#fdf3df;--a-act:#2f8f5b;--a-myo:#b8502c;--a-sr:#bfe0f2;' +
    '--a-glu:#e09b1c;--a-wat:#3d8fd6;--a-urea:#3b9a52;--a-salt:#8a8f98;--a-prot:#8e5cc2;--a-tub:#fbf1d6;--a-tubd:#b59a52;--a-uri:#f3e08a;' +
    '--a-bac:#6fae3a;--a-vir:#c0392b;--a-ab:#2f5f9e;--a-sun:#f2b21b;--a-atp:#d4462a;--a-glow:rgba(255,200,40,.55)';
  var DARK = '--a-art:#ff5a4e;--a-ven:#a8456f;--a-mus:#7a3f3a;--a-musd:#e0897d;--a-lung:#4a3133;--a-alv:#5a3c3e;--a-tis:#3d3726;--a-valve:#ffe9dc;' +
    '--a-mem:#e0bd45;--a-memf:#4d4422;--a-chl:#3f7a39;--a-chld:#9bd88a;--a-thy:#79c46b;--a-str:#24361f;--a-mit:#6e4630;--a-mitd:#f0a878;--a-mat:#3b2c22;' +
    '--a-na:#6fb2ff;--a-k:#c9a2ea;--a-ca:#f0c060;--a-nt:#4fd6c0;--a-myl:#3d3a2c;--a-ax:#3a3424;--a-act:#7fd6a0;--a-myo:#f09a6e;--a-sr:#27445a;' +
    '--a-glu:#f0b84a;--a-wat:#6fb6f0;--a-urea:#7fd08a;--a-salt:#b3b8c0;--a-prot:#c49af0;--a-tub:#3b3524;--a-tubd:#d8bf74;--a-uri:#8a7a2a;' +
    '--a-bac:#9fd26a;--a-vir:#f07a6a;--a-ab:#8fb5e8;--a-sun:#f5c542;--a-atp:#ff7a5a;--a-glow:rgba(255,210,80,.35)';
  if (typeof document !== 'undefined' && !document.getElementById('anb-css')) {
    var css = document.createElement('style'); css.id = 'anb-css';
    css.textContent = '.anb,.anb-ctl{' + LIGHT + '}.anb{font-family:var(--font-body);user-select:none}' +
      '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .anb,:root:not([data-theme="light"]) .anb-ctl{' + DARK + '}}:root[data-theme="dark"] .anb,:root[data-theme="dark"] .anb-ctl{' + DARK + '}' +
      '.anb text{font-family:var(--font-body)}.anb .h{paint-order:stroke;stroke:var(--panel);stroke-width:4px;stroke-linejoin:round}' +
      '.anb-ctl .row .btn{min-width:0}.anb-ctl .info{min-height:5.6em}.anb-ctl .info h4 .n{display:inline-grid;place-items:center;width:1.5em;height:1.5em;border-radius:50%;background:var(--accent);color:var(--accent-ink);font-size:.8em;margin-right:6px;vertical-align:.1em;font-family:var(--font-body)}';
    document.head.appendChild(css);
  }

  /* ---------- 小さな道具 ---------- */
  var seq = 0;
  function cl(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function ease(u) { u = cl(u, 0, 1); return u * u * (3 - 2 * u); }
  function seg01(u, a, b) { return cl((u - a) / (b - a), 0, 1); }
  function f1(v) { return Math.round(v * 10) / 10; }
  function hash(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function mixc(a, b, p) { p = Math.round(cl(p, 0, 1) * 100); return p >= 100 ? a : p <= 0 ? b : 'color-mix(in srgb, ' + a + ' ' + p + '%, ' + b + ')'; }
  function tint(c, p) { return 'color-mix(in srgb, ' + c + ' ' + (p || 30) + '%, var(--panel))'; }

  /* 曲線にそった点（Catmull-Rom）。at(s) で 0〜1 の位置の座標 */
  function track(pts, closed) {
    var P = [], n = pts.length;
    function g(i) { return closed ? pts[(i + n) % n] : pts[cl(i, 0, n - 1)]; }
    var segs = closed ? n : n - 1;
    for (var i = 0; i < segs; i++) {
      var p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      for (var k = 0; k < 16; k++) {
        var t = k / 16, t2 = t * t, t3 = t2 * t;
        P.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    P.push(closed ? P[0] : pts[n - 1]);
    var L = [0];
    for (var j = 1; j < P.length; j++) L.push(L[j - 1] + Math.hypot(P[j][0] - P[j - 1][0], P[j][1] - P[j - 1][1]));
    var tot = L[L.length - 1];
    function at(s) {
      s = closed ? ((s % 1) + 1) % 1 : cl(s, 0, 1);
      var d = s * tot, lo = 0, hi = L.length - 1;
      while (hi - lo > 1) { var m = (lo + hi) >> 1; if (L[m] < d) lo = m; else hi = m; }
      var u = (d - L[lo]) / ((L[hi] - L[lo]) || 1);
      return [lerp(P[lo][0], P[hi][0], u), lerp(P[lo][1], P[hi][1], u), Math.atan2(P[hi][1] - P[lo][1], P[hi][0] - P[lo][0])];
    }
    /* 点 (x,y) にいちばん近い位置 s */
    function near(x, y) { var b = 0, bd = 1e9; for (var i = 0; i < P.length; i++) { var d = Math.hypot(P[i][0] - x, P[i][1] - y); if (d < bd) { bd = d; b = i; } } return L[b] / tot; }
    function d(a, b) {
      a = a == null ? 0 : a; b = b == null ? 1 : b;
      var s = '', N = Math.max(2, Math.ceil((b - a) * tot / 6));
      for (var i = 0; i <= N; i++) { var q = at(lerp(a, b, i / N)); s += (i ? 'L' : 'M') + f1(q[0]) + ' ' + f1(q[1]); }
      return s;
    }
    return { at: at, d: d, len: tot, near: near };
  }

  /* 共通のアニメーション枠：再生・1コマ・速さ・はじめから・場面・説明 */
  function kit(stage, ctl, api, o) {
    var N = BL.narrow(), uid = 'ab' + (++seq), ph = o.phases, starts = [], T = 0;
    ph.forEach(function (p) { starts.push(T); T += p.d; });
    var st = { t: 0, play: true, sp: 1, stopAt: -1, done: false };
    var K = { N: N, uid: uid, fs: function (n) { return f1(n * (N ? (o.big || 1.38) : 1)); } };
    stage.innerHTML = '<svg class="anb" viewBox="0 0 ' + o.w + ' ' + o.h + '" style="width:100%;height:100%;max-height:100%;display:block" role="img" aria-label="' + o.name + '"><g class="s0"></g><g class="s1"></g><g class="s2"></g></svg>';
    var svg = stage.firstChild, g0 = svg.children[0], g1 = svg.children[1], g2 = svg.children[2];
    ctl.classList.add('anb-ctl');
    var r1 = BL.el('div', { class: 'row' }); ctl.appendChild(r1);
    var L = N ? ['❚❚ 停止', '▶ 再生', '◀ 1コマ', '1コマ ▶', '⟲ 最初'] : ['❚❚ 一時停止', '▶ 再生', '◀ 1コマもどる', '1コマすすむ ▶', '⟲ はじめから'];
    var bPlay = BL.ui.btn(r1, L[0], function () { if (st.done) { restart(); return; } setPlay(!st.play); }, 'main');
    BL.ui.btn(r1, L[2], function () { var i = phaseAt(st.t); var to = (st.t - starts[i] < 0.6 && i > 0) ? i - 1 : i; jump(to, true); });
    BL.ui.btn(r1, L[3], function () { var i = phaseAt(st.t); jump(Math.min(ph.length - 1, i + 1), true); o.onStep && o.onStep(K); });
    BL.ui.btn(r1, L[4], function () { restart(); });
    [].forEach.call(r1.children, function (b, k) { b.title = ['再生 / 一時停止', '1コマもどる', '1コマすすむ', 'はじめから'][k]; });
    var cap = BL.ui.box(ctl, 'info', '');
    var segPh = BL.ui.seg(ctl, '場面', ph.map(function (p, i) { return [i, String(i + 1)]; }), 0, function (v) { jump(v, true); });
    BL.ui.seg(ctl, '速さ', [[0.5, '×0.5'], [1, '×1'], [2, '×2']], 1, function (v) { st.sp = v; });
    var api2 = { jump: jump, redraw: function () { g0.innerHTML = o.stat ? o.stat(K) : ''; g2.innerHTML = o.top ? o.top(K) : ''; lastI = -1; render(); }, K: K, st: st, starts: starts };
    if (o.extra) o.extra(ctl, api2);
    function phaseAt(t) { for (var i = ph.length - 1; i > 0; i--) if (t >= starts[i] - 1e-6) return i; return 0; }
    function setPlay(v) { st.play = v; st.done = false; bPlay.innerHTML = v ? L[0] : L[1]; bPlay.setAttribute('aria-pressed', String(!v)); }
    function jump(i, step) { st.t = starts[i] + 1e-4; st.done = false; if (step && !st.play) { st.stopAt = starts[i] + ph[i].d - 0.02; setPlay(true); } else st.stopAt = -1; render(); }
    function restart() { st.t = 0; st.stopAt = -1; setPlay(true); o.onRestart && o.onRestart(); render(); }
    var lastI = -1;
    function render() {
      var i = phaseAt(st.t);
      K.t = st.t; K.i = i; K.u = cl((st.t - starts[i]) / ph[i].d, 0, 1); K.T = T;
      g1.innerHTML = o.frame(K);
      if (o.topDyn) g2.innerHTML = o.top(K);
      var p = ph[i], html = '<h4><span class="n">' + (i + 1) + '</span>' + p.h + '</h4>' + p.p + (o.capExtra ? o.capExtra(K) : '');
      if (i !== lastI || cap._h !== html) { cap.innerHTML = html; cap._h = html; segPh.set(i); lastI = i; }
    }
    api2.redraw();
    var stop = BL.loop(function (dt) {
      if (st.play) {
        st.t += dt * st.sp;
        if (st.stopAt >= 0 && st.t >= st.stopAt) { st.t = st.stopAt; st.stopAt = -1; setPlay(false); }
        if (st.t >= T) {
          api.task(0);
          if (o.loop) st.t -= T;
          else { st.t = T - 1e-4; st.play = false; st.done = true; bPlay.innerHTML = '⟲ もう一度'; }
        }
      }
      if (o.tick) o.tick(dt * (st.play ? st.sp : 0), K);
      render();
    });
    return stop;
  }

  /* ラベル（文字）・引き出し線 */
  function tx(K, x, y, s, o) {
    o = o || {};
    return '<text x="' + f1(x) + '" y="' + f1(y) + '" font-size="' + K.fs(o.fs || 14) + '"' + (o.a ? ' text-anchor="' + o.a + '"' : '') + (o.w ? ' font-weight="' + o.w + '"' : '') +
      ' fill="' + (o.c || 'var(--ink)') + '"' + (o.halo === false ? '' : ' class="h"') + (o.op != null ? ' opacity="' + f1(o.op) + '"' : '') + '>' + s + '</text>';
  }
  function lead(K, x1, y1, x2, y2, s, o) {
    o = o || {};
    var a = o.a || (x2 < x1 ? 'end' : 'start'), dx = a === 'end' ? -3 : a === 'start' ? 3 : 0;
    return '<line x1="' + f1(x1) + '" y1="' + f1(y1) + '" x2="' + f1(x2) + '" y2="' + f1(y2) + '" stroke="var(--muted)" stroke-width="1"' + (o.op != null ? ' opacity="' + o.op + '"' : '') + '/><circle cx="' + f1(x1) + '" cy="' + f1(y1) + '" r="2.2" fill="var(--ink)"' + (o.op != null ? ' opacity="' + o.op + '"' : '') + '/>' +
      tx(K, x2 + dx, y2 + K.fs(o.fs || 14) * 0.35, s, { fs: o.fs, a: a, w: o.w || 700, c: o.c, op: o.op });
  }
  function arrowDef(id, c) { return '<marker id="' + id + '" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 1L9 5L0 9z" fill="' + c + '"/></marker>'; }
  /* 小さな分子の札（丸角） */
  function pill(K, x, y, s, c, o) {
    o = o || {};
    var f = K.fs(o.fs || 12), w = (o.wd || s.replace(/<[^>]+>/g, '').split('').reduce(function (a, ch) { return a + (ch.charCodeAt(0) > 0x2000 && !/[₀-₉⁰-⁹⁺⁻]/.test(ch) ? 1.02 : 0.62); }, 0) + 1) * f, h = f * 1.5;
    return '<g transform="translate(' + f1(x) + ' ' + f1(y) + ')"' + (o.op != null ? ' opacity="' + f1(o.op) + '"' : '') + '><rect x="' + f1(-w / 2) + '" y="' + f1(-h / 2) + '" width="' + f1(w) + '" height="' + f1(h) + '" rx="' + f1(h / 2) + '" fill="' + c + '" stroke="var(--panel)" stroke-width="1.2"/><text y="' + f1(f * 0.36) + '" text-anchor="middle" font-size="' + f + '" font-weight="700" fill="' + (o.tc || '#fff') + '">' + s + '</text></g>';
  }
  function sl(s) { return s.split(',').map(Number); }
  BL.animKit = { kit: kit, track: track, tx: tx, lead: lead, pill: pill, ease: ease, lerp: lerp, cl: cl, seg01: seg01, mixc: mixc, tint: tint, hash: hash, arrowDef: arrowDef };

  /* =====================================================================
     1. 心臓と血液の循環
     ===================================================================== */
  BL.addSim({
    id: 'a-heart', anim: true, name: '心臓と血液の循環', cat: 'アニメーション', subj: 'kiso', ic: '心',
    lead: '心房→心室の順に縮み、弁が開いたり閉じたりして、血液が肺循環と体循環をめぐるようすを見る',
    how: '<p>ヒトの心臓は<b class="key">2心房2心室</b>。心筋が自動的に縮んだりゆるんだりして血液を送り出すポンプである（拍動のリズムは右心房の<b class="key">洞房結節</b>（ペースメーカー）がつくる）。</p><div class="box"><b>肺循環</b>：右心室 → 肺動脈 → 肺 → 肺静脈 → 左心房<br><b>体循環</b>：左心室 → 大動脈 → 全身 → 大静脈 → 右心房</div><p>酸素を多くふくむ鮮やかな赤い血液を<b class="key">動脈血</b>、酸素が少ない暗い赤の血液を<b class="key">静脈血</b>という。<b>肺動脈には静脈血、肺静脈には動脈血</b>が流れる。</p><p>心房と心室の間の<b class="key">房室弁</b>、心室の出口の<b class="key">半月弁</b>が、血液の逆流を防ぐ。</p>',
    pts: [[1, '心房が縮んだあとに心室が縮む'], [1, '肺静脈には動脈血が流れる'], [0, '肺動脈には動脈血が流れる → ×（静脈血）'], [1, '心室が縮むとき房室弁は閉じ、半月弁は開く'], [0, '大動脈は右心室から出る → ×（左心室）']],
    tasks: ['拍動の1周期を最後まで見る', '「肺循環」だけを強調して見る', '「体循環」だけを強調して見る'],
    slides: [['k3-1', 3]],
    mount: function (stage, ctl, api) {
      var hl = 'all';
      /* 血液の通り道（1周） */
      var P = [
        [196, 520], [150, 512], [104, 480], [92, 420], [92, 320], [104, 258], [140, 238], [178, 236], [210, 248], // 大静脈 → 右心房
        [232, 282], [246, 322], [262, 340], [284, 318], [292, 282], [294, 236], [292, 196], [278, 168], [244, 150], [206, 140], [188, 124], // 右心室 → 肺動脈
        [214, 92], [246, 102], [278, 88], [312, 100], [346, 86], [380, 100], [414, 90], // 肺の毛細血管
        [440, 116], [442, 150], [430, 186], [408, 214], [384, 238], // 肺静脈 → 左心房
        [366, 280], [356, 322], [344, 346], [330, 318], [326, 280], [326, 236], [328, 196], [340, 160], [376, 140], [432, 134], [490, 140], [536, 166], [552, 214], [552, 300], [552, 420], [540, 480], [496, 514], // 左心室 → 大動脈
        [450, 504], [412, 520], [374, 506], [336, 520], [298, 506], [258, 520], [226, 506]]; // 全身の毛細血管
      var tr = track(P, true);
      var sL0 = tr.near(214, 92), sL1 = tr.near(414, 90), sB0 = tr.near(450, 504), sB1 = tr.near(226, 506);
      var sRA = tr.near(178, 236), sLV = tr.near(366, 280), sPA0 = tr.near(292, 282), sPV1 = tr.near(408, 214), sAo0 = tr.near(326, 280), sVC0 = tr.near(196, 520);
      function oxy(s) {
        if (s >= sL0 && s <= sL1) return ease((s - sL0) / (sL1 - sL0));
        if (s > sL1 && s < sB0) return 1;
        if (s >= sB0 && s <= sB1) return 1 - ease((s - sB0) / (sB1 - sB0));
        return 0;
      }
      function inPul(s) { return s >= sPA0 - 0.03 && s <= sPV1 + 0.04; }
      function inSys(s) { return s >= sAo0 - 0.03 || s <= sRA + 0.02; }
      /* 心周期：0 心房収縮、1 心室収縮、2 拡張 */
      var phases = [
        { d: 2.2, h: '心房が縮む（心房収縮）', p: '右心房・左心房が縮み、血液を心室へ送りこむ。心房と心室の間の<b class="key">房室弁</b>は開いている。心室の出口の<b class="key">半月弁</b>は閉じている。' },
        { d: 2.6, h: '心室が縮む（心室収縮）', p: '心室が強く縮む。<b class="key">房室弁</b>が閉じて心房への逆流を防ぎ、<b class="key">半月弁</b>が開く。右心室 → <b>肺動脈</b> → 肺へ（静脈血）、左心室 → <b>大動脈</b> → 全身へ（動脈血）。' },
        { d: 2.6, h: '心臓全体がゆるむ（拡張）', p: '半月弁が閉じる。<b>大静脈</b>から右心房へ静脈血、<b>肺静脈</b>から左心房へ動脈血がもどり、開いた房室弁を通って心室にも流れこむ。' }];
      var T = 7.4, off = 0, lastT = 0;
      function speed(t) { var i = t < 2.2 ? 0 : t < 4.8 ? 1 : 2; return i === 1 ? 0.085 : i === 0 ? 0.03 : 0.022; }
      function stat(K) {
        var s = '<defs>' + arrowDef(K.uid + 'm', 'var(--muted)') +
          '<radialGradient id="' + K.uid + 'g" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="var(--a-mus)"/><stop offset="1" stop-color="var(--a-musd)"/></radialGradient></defs>';
        /* 肺 */
        s += '<path d="M168 112 C150 60 186 22 236 30 C262 34 282 44 292 60 L292 112 Z" fill="var(--a-lung)" stroke="var(--a-musd)" stroke-width="1.2" opacity=".95"/>' +
          '<path d="M452 112 C470 60 434 22 384 30 C358 34 338 44 328 60 L328 112 Z" fill="var(--a-lung)" stroke="var(--a-musd)" stroke-width="1.2" opacity=".95"/>' +
          '<path d="M310 8 L310 46 M310 46 Q302 56 290 62 M310 46 Q318 56 330 62" fill="none" stroke="var(--a-musd)" stroke-width="7" stroke-linecap="round" opacity=".55"/>';
        for (var i = 0; i < 16; i++) { var ax = 190 + (i % 8) * 34 + (i % 8 > 3 ? 12 : 0), ay = 52 + Math.floor(i / 8) * 44; s += '<circle cx="' + ax + '" cy="' + ay + '" r="9" fill="var(--a-alv)" stroke="var(--a-musd)" stroke-width=".8" opacity=".8"/>'; }
        /* 全身の組織 */
        s += '<rect x="196" y="486" width="276" height="54" rx="16" fill="var(--a-tis)" stroke="var(--line)"/>';
        for (var j = 0; j < 9; j++) s += '<ellipse cx="' + (214 + j * 30) + '" cy="' + (j % 2 ? 530 : 496) + '" rx="12" ry="7" fill="var(--cyto)" stroke="var(--line)"/>';
        return s;
      }
      function vessel(a, b, c, w) { return '<path d="' + tr.d(a, b) + '" fill="none" stroke="var(--a-musd)" stroke-width="' + (w + 4) + '" stroke-linecap="round" opacity=".6"/><path d="' + tr.d(a, b) + '" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/>'; }
      function cav(cx, cy, d, k, fill) {
        return '<path transform="translate(' + cx + ' ' + cy + ') scale(' + f1(k * 100) / 100 + ')" d="' + d + '" fill="' + fill + '" stroke="var(--a-musd)" stroke-width="1.5" stroke-linejoin="round"/>';
      }
      function valve(x, y, ang, open, w) {
        /* 2枚の弁：open=1 で血液の流れる向きに開く */
        var a1 = ang + (open ? 72 : 4), a2 = ang + 180 - (open ? 72 : 4), r = w / 2;
        function leaf(sx, sy, a) { var rad = a * Math.PI / 180; return '<line x1="' + f1(sx) + '" y1="' + f1(sy) + '" x2="' + f1(sx + Math.cos(rad) * r) + '" y2="' + f1(sy + Math.sin(rad) * r) + '" stroke="var(--a-valve)" stroke-width="4" stroke-linecap="round"/>'; }
        var ra = ang * Math.PI / 180, ex = Math.cos(ra) * r, ey = Math.sin(ra) * r;
        return leaf(x - ex, y - ey, a1) + leaf(x + ex, y + ey, a2);
      }
      var HEART = 'M136 226 C134 196 170 184 206 192 C232 198 252 196 270 192 L352 188 C380 178 432 176 452 204 C468 228 456 262 420 282 C428 330 410 392 360 440 C350 450 342 448 330 438 C296 418 250 412 226 390 C206 370 200 330 206 290 C168 282 138 260 136 226Z';
      function frame(K) {
        var i = K.i, u = K.u;
        var aK = i === 0 ? 1 - 0.17 * Math.sin(Math.PI * u) : 1, vK = i === 1 ? 1 - 0.2 * Math.sin(Math.PI * Math.min(1, u * 1.2)) : 1;
        var hK = i === 1 ? 1 - 0.035 * Math.sin(Math.PI * Math.min(1, u * 1.2)) : 1;
        var avOpen = i !== 1, slOpen = i === 1 && u > 0.06 && u < 0.9;
        var ven = 'var(--a-ven)', art = 'var(--a-art)';
        var oP = hl === 'sys' ? 0.25 : 1, oS = hl === 'pul' ? 0.25 : 1;
        var sVCe = tr.near(140, 238), sPVe = tr.near(430, 190);
        var s = '';
        /* うしろの血管（大静脈・肺静脈・毛細血管） */
        s += '<g opacity="' + oS + '">' + vessel(sVC0, sVCe, tint(ven, 55), 20) + vessel(sB0, sB1, tint(art, 25), 7) + '</g>';
        s += '<g opacity="' + oP + '">' + vessel(sL0, sL1, tint(art, 25), 7) + vessel(sL1, sPVe, tint(art, 45), 17) + '</g>';
        /* 心臓（全体の形 → 4つの部屋） */
        s += '<g transform="translate(300 320) scale(' + f1(hK * 1000) / 1000 + ') translate(-300 -320)">';
        s += '<path d="' + HEART + '" fill="url(#' + K.uid + 'g)" stroke="var(--a-musd)" stroke-width="2"/>';
        s += '<path d="M222 278 L238 300" stroke="' + ven + '" stroke-width="' + (avOpen ? 16 : 10) + '" stroke-linecap="round"/><path d="M384 264 L370 292" stroke="' + art + '" stroke-width="' + (avOpen ? 16 : 10) + '" stroke-linecap="round"/>';
        s += cav(194, 236, 'M-40 -28 C-10 -42 30 -38 40 -14 C48 10 34 32 6 36 C-24 40 -46 22 -46 0 C-46 -12 -46 -22 -40 -28Z', aK, ven);
        s += cav(402, 226, 'M-38 -26 C-8 -40 30 -34 40 -10 C46 14 30 32 4 34 C-26 36 -44 20 -44 0 C-44 -12 -44 -20 -38 -26Z', aK, art);
        s += cav(260, 336, 'M-30 -40 C-6 -46 22 -42 32 -28 C38 -6 32 24 12 46 C0 56 -16 52 -26 34 C-38 12 -40 -22 -30 -40Z', vK, ven);
        s += cav(352, 338, 'M-26 -42 C0 -50 30 -42 38 -22 C44 6 36 46 6 74 C-4 82 -18 72 -24 50 C-30 22 -36 -22 -26 -42Z', vK, art);
        s += valve(229, 289, 52, avOpen, 22) + valve(377, 278, 118, avOpen, 22);
        s += '</g>';
        /* 前の血管（肺動脈・大動脈）：心室の出口から */
        s += '<g opacity="' + oP + '">' + vessel(sPA0, sL0, tint(ven, 55), 19) + '</g>';
        s += '<g opacity="' + oS + '">' + vessel(sAo0, sB0, tint(art, 45), 22) + '</g>';
        s += valve(292, 290, 0, slOpen, 17) + valve(326, 288, 180, slOpen, 19);
        /* 血球 */
        var n = 120;
        for (var k = 0; k < n; k++) {
          var sp = (k / n + off) % 1, q = tr.at(sp), o = oxy(sp), op = 1;
          if (hl !== 'all' && !(hl === 'pul' ? inPul(sp) : inSys(sp))) op = 0.15;
          var jx = (hash(k) - 0.5) * 7, jy = (hash(k + 50) - 0.5) * 7, X = f1(q[0] + jx), Y = f1(q[1] + jy);
          s += '<ellipse cx="' + X + '" cy="' + Y + '" rx="5" ry="3.6" transform="rotate(' + Math.round(q[2] * 57.3) + ' ' + X + ' ' + Y + ')" fill="' + mixc(art, ven, o) + '" stroke="var(--panel)" stroke-width=".8" opacity="' + op + '"/>';
        }
        /* ペースメーカー（洞房結節）の光 */
        if (i === 0 && u < 0.4) s += '<circle cx="214" cy="200" r="' + f1(5 + 16 * u) + '" fill="var(--a-glow)"/><circle cx="214" cy="200" r="4" fill="var(--a-sun)"/>';
        /* 肺・組織でのガス交換 */
        var g = (K.t * 0.5) % 1, O2 = 'O<tspan font-size="70%" dy="3">2</tspan>', CO2 = 'CO<tspan font-size="70%" dy="3">2</tspan>';
        s += gas(K, 250, 58, 92, O2, g) + gas(K, 372, 92, 58, CO2, g);
        s += gas(K, 282, 512, 540, O2, g) + gas(K, 410, 540, 512, CO2, g);
        return s;
      }
      function gas(K, x, y0, y1, t, g) {
        return '<text x="' + x + '" y="' + f1(lerp(y0, y1, g)) + '" font-size="' + K.fs(11.5) + '" font-weight="800" text-anchor="middle" fill="var(--ask)" class="h" opacity="' + f1(Math.sin(Math.PI * g)) + '">' + t + (y1 > y0 ? '↓' : '↑') + '</text>';
      }
      function top(K) {
        var s = '<g style="paint-order:stroke;stroke:rgba(0,0,0,.4);stroke-width:3px">';
        [[192, 241, '右心房'], [402, 231, '左心房'], [258, 342, '右心室'], [352, 352, '左心室']].forEach(function (c) { s += tx(K, c[0], c[1], c[2], { a: 'middle', w: 800, fs: 14, c: '#fff', halo: false }); });
        s += '</g>';
        s += lead(K, 92, 400, 114, 424, '大静脈', { a: 'start', fs: 13.5 });
        s += lead(K, 206, 141, 150, 168, '肺動脈', { a: 'end', fs: 13.5 });
        s += lead(K, 442, 150, 470, 192, '肺静脈', { a: 'start', fs: 13.5 });
        s += lead(K, 552, 384, 522, 410, '大動脈', { a: 'end', fs: 13.5 });
        s += tx(K, 236, 446, '心臓', { a: 'middle', w: 800, fs: 13, c: 'var(--muted)' });
        s += tx(K, 310, K.N ? 26 : 24, '肺', { a: 'middle', w: 800, fs: 15 });
        s += tx(K, 334, 562, '全身の組織', { a: 'middle', w: 800, fs: 14 });
        return s;
      }
      return kit(stage, ctl, api, {
        name: '心臓と血液の循環', w: 620, h: 568, phases: phases, loop: true, stat: stat, frame: frame, top: top,
        tick: function (dt, K) { off += dt * speed(K.t); },
        capExtra: function () { return '<div style="margin-top:4px;font-size:.92em"><span style="color:var(--a-art)">●</span> <b>動脈血</b>（酸素が多い・鮮紅色）　<span style="color:var(--a-ven)">●</span> <b>静脈血</b>（酸素が少ない・暗赤色）</div>'; },
        extra: function (ctl2, A) {
          BL.ui.seg(ctl2, '強調', [['all', 'すべて'], ['pul', '肺循環'], ['sys', '体循環']], hl, function (v) { hl = v; if (v === 'pul') api.task(1); if (v === 'sys') api.task(2); });
        }
      });
    }
  });

  /* =====================================================================
     2. 興奮の伝導とシナプス
     ===================================================================== */
  BL.addSim({
    id: 'a-impulse', anim: true, name: '興奮の伝導とシナプス', cat: 'アニメーション', subj: 'bio', ic: '伝',
    lead: 'Na⁺ が流れこんで興奮が軸索を伝わり、シナプスで神経伝達物質が次のニューロンへ情報をわたすようすを見る',
    how: '<p>静止状態では、軸索の内側は外側に対して負（約 −60〜−70 mV、<b class="key">静止電位</b>）。刺激を受けると <b class="key">電位依存性 Na⁺ チャネル</b>が開き、Na⁺ が流れこんで内側が一瞬正になる（<b class="key">活動電位</b>）。</p><p>興奮した部分ととなりの部分の間に<b class="key">活動電流</b>が流れ、となりが興奮する。こうして興奮が軸索を伝わる（<b class="key">伝導</b>）。興奮が終わった部分はしばらく興奮しない（<b class="key">不応期</b>）ので、逆もどりしない。</p><p><b class="key">有髄神経繊維</b>では、髄鞘が電気を通しにくいため、興奮は<b class="key">ランビエ絞輪</b>から絞輪へとびとびに伝わる（<b class="key">跳躍伝導</b>）。無髄神経繊維よりずっと速い。</p><div class="box"><b>シナプスでの伝達</b>：興奮が神経終末に届く → Ca²⁺ が流れこむ → <b class="key">シナプス小胞</b>から<b class="key">神経伝達物質</b>が放出 → 次の細胞の<b class="key">受容体</b>に結合 → イオンチャネルが開き Na⁺ が流入 → 膜電位が上がる。伝達物質は神経終末からしか出ないので、伝達は<b>一方向</b>。</div>',
    pts: [[1, '活動電位は Na⁺ の流入で生じる'], [1, '跳躍伝導はランビエ絞輪でとびとびに興奮が起こる'], [0, '興奮は不応期の部分にも逆もどりして伝わる → ×'], [1, '神経伝達物質はシナプス小胞から放出される'], [0, 'シナプスでは、次の細胞から前の細胞へも伝達される → ×（一方向）']],
    tasks: ['最後（次のニューロンの興奮）まで見る', '有髄と無髄を切りかえて見くらべる', '1コマずつ進めてシナプスの場面を見る'],
    slides: [['b4-1', 3], ['b4-1', 4], ['b4-2', 1]],
    mount: function (stage, ctl, api) {
      var my = true, sawMy = { true: 0, false: 0 };
      var phases = [
        { d: 3.2, h: '静止状態（静止電位）', p: '軸索の内側は<b>負（−）</b>、外側は<b>正（＋）</b>。外側には Na⁺ が多く、内側には K⁺ が多い。内外の電位差は約 −70 mV（<b class="key">静止電位</b>）。' },
        { d: 4.2, h: 'Na⁺ が流れこむ（活動電位）', p: '刺激を受けた部分で<b class="key">電位依存性 Na⁺ チャネル</b>が開き、Na⁺ が細胞の中へ流れこむ。内側が一瞬<b>正（＋）</b>に逆転する＝<b class="key">活動電位</b>（興奮）。' },
        { d: 4.2, h: '活動電流がとなりを刺激する', p: '興奮部ととなりの静止部の間に電流（<b class="key">活動電流</b>）が流れる。内側では興奮部 → となり、外側ではとなり → 興奮部へ流れ、となりが興奮する。' },
        { d: 6.5, h: '興奮が伝わる（伝導）', p: '興奮がつぎつぎと伝わっていく。興奮が終わったところは K⁺ が流れ出て負にもどり、しばらく興奮しない（<b class="key">不応期</b>）ので、興奮は逆もどりしない。' },
        { d: 5, h: '有髄と無髄の速さくらべ', p: '<b class="key">有髄神経繊維</b>は、髄鞘が電気を通しにくいので、<b class="key">ランビエ絞輪</b>だけがとびとびに興奮する（<b class="key">跳躍伝導</b>）。だから<b>無髄神経繊維よりずっと速い</b>。' },
        { d: 3.2, h: '興奮が神経終末に届く', p: '軸索を伝わってきた興奮が、軸索の末端（<b>神経終末</b>）に届く。神経終末と次のニューロンの間には、わずかなすき間（<b class="key">シナプス間隙</b>）がある。' },
        { d: 3.6, h: 'Ca²⁺ が流れこむ', p: '神経終末の<b class="key">電位依存性 Ca²⁺ チャネル</b>が開き、Ca²⁺ が神経終末の中へ流れこむ。' },
        { d: 4, h: '神経伝達物質の放出', p: 'Ca²⁺ が合図となり、<b class="key">シナプス小胞</b>が細胞膜と融合して、中の<b class="key">神経伝達物質</b>（アセチルコリンなど）をシナプス間隙へ放出する。' },
        { d: 3.6, h: '受容体に結合する', p: '神経伝達物質がシナプス間隙を拡散し、次のニューロンの細胞膜にある<b class="key">受容体</b>に結合する。' },
        { d: 5, h: '次のニューロンが興奮する', p: '受容体（イオンチャネル）が開いて Na⁺ が流れこみ、次のニューロンの膜電位が上がる → 興奮が伝わる。伝達物質はすぐに分解・回収される。伝達物質は神経終末からしか出ないので、<b>伝達は一方向</b>。' }];
      var yT = 104, yB = 214, NODES = [84, 234, 384, 534];
      /* 興奮のようす：x の位置の興奮度 e（0〜1）と不応期 r */
      function state(x, K) {
        var i = K.i, u = K.u, e = 0, r = 0;
        if (my) {
          var k = -1, ke = 0;
          if (i === 1) { k = 0; ke = ease(seg01(u, 0.15, 0.55)); }
          else if (i === 2) { k = 0; ke = 1; }
          else if (i === 3) { var p = u * 3.6; k = Math.floor(p); ke = 1; }
          for (var n = 0; n < NODES.length; n++) {
            if (Math.abs(x - NODES[n]) > 14) continue;
            if (n === k) e = ke; else if (k >= 0 && n < k && i === 3) r = 1;
            if (i === 2 && n === 1) e = ease(seg01(u, 0.75, 1)) * 0.6;
          }
        } else {
          var xf = -1;
          if (i === 1) { if (Math.abs(x - 84) < 26) e = ease(seg01(u, 0.15, 0.55)); }
          else if (i === 2) { if (Math.abs(x - 84) < 26) e = 1; if (x > 110 && x < 150) e = ease(seg01(u, 0.7, 1)) * 0.6; }
          else if (i === 3) { xf = lerp(110, 700, u); if (x < xf && x > xf - 56) e = 1; else if (x <= xf - 56 && x > 58) r = 1; }
        }
        return { e: e, r: r };
      }
      function excited(K) {
        var a = [];
        if (my) { NODES.forEach(function (x) { var q = state(x, K); if (q.e > 0.5) a.push(x); }); }
        else for (var x = 52; x < 620; x += 32) { var q = state(x, K); if (q.e > 0.5) a.push(x); }
        return a;
      }
      function ion(x, y, c, t, K) { return '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="7.5" fill="' + c + '" stroke="var(--panel)" stroke-width="1.2"/>' + (t ? '<text x="' + f1(x) + '" y="' + f1(y + 3.5) + '" text-anchor="middle" font-size="9" font-weight="800" fill="#fff">' + t + '</text>' : ''); }
      function axonScene(K) {
        var s = '', i = K.i, u = K.u, dim = i === 4 ? 0.35 : 1;
        s += '<g opacity="' + dim + '">';
        s += '<rect x="20" y="' + (yT + 4) + '" width="620" height="' + (yB - yT - 8) + '" fill="var(--a-ax)"/>';
        /* 不応期の帯 */
        for (var x = 40; x < 640; x += 16) { var q = state(x, K); if (q.r) s += '<rect x="' + (x - 8) + '" y="' + (yT + 4) + '" width="16.5" height="' + (yB - yT - 8) + '" fill="var(--muted)" opacity=".16"/>'; if (q.e > 0) s += '<rect x="' + (x - 8) + '" y="' + (yT + 4) + '" width="16.5" height="' + (yB - yT - 8) + '" fill="var(--a-glow)" opacity="' + f1(q.e) + '"/>'; }
        /* 細胞膜 */
        [yT, yB].forEach(function (y) { s += '<line x1="20" y1="' + y + '" x2="640" y2="' + y + '" stroke="var(--a-mem)" stroke-width="8"/><line x1="20" y1="' + y + '" x2="640" y2="' + y + '" stroke="var(--a-memf)" stroke-width="2.5"/>'; });
        /* 髄鞘 */
        if (my) {
          var segs = [[20, 74], [94, 224], [244, 374], [394, 524], [544, 640]];
          segs.forEach(function (g) { s += '<rect x="' + g[0] + '" y="' + (yT - 46) + '" width="' + (g[1] - g[0]) + '" height="40" rx="18" fill="var(--a-myl)" stroke="var(--a-tubd)" stroke-width="1.5"/><rect x="' + g[0] + '" y="' + (yB + 6) + '" width="' + (g[1] - g[0]) + '" height="40" rx="18" fill="var(--a-myl)" stroke="var(--a-tubd)" stroke-width="1.5"/>'; for (var k = 1; k < 4; k++) s += '<path d="M' + (g[0] + 10) + ' ' + (yT - 46 + k * 10) + ' H' + (g[1] - 10) + ' M' + (g[0] + 10) + ' ' + (yB + 6 + k * 10) + ' H' + (g[1] - 10) + '" stroke="var(--a-tubd)" stroke-width=".7" opacity=".6"/>'; });
        }
        /* 電荷 */
        for (var x2 = 52; x2 < 630; x2 += 32) {
          var q2 = state(x2, K), pos = q2.e > 0.5;
          var inS = pos ? '+' : '−', outS = pos ? '−' : '+', cin = pos ? 'var(--c1)' : 'var(--c3)', cout = pos ? 'var(--c3)' : 'var(--c1)';
          s += '<text x="' + x2 + '" y="' + (yT + 24) + '" text-anchor="middle" font-size="18" font-weight="800" fill="' + cin + '">' + inS + '</text><text x="' + x2 + '" y="' + (yB - 12) + '" text-anchor="middle" font-size="18" font-weight="800" fill="' + cin + '">' + inS + '</text>';
          var nearNode = NODES.some(function (n) { return Math.abs(n - x2) < 20; });
          if (!my || nearNode) s += '<text x="' + x2 + '" y="' + (yT - 10) + '" text-anchor="middle" font-size="18" font-weight="800" fill="' + cout + '">' + outS + '</text><text x="' + x2 + '" y="' + (yB + 24) + '" text-anchor="middle" font-size="18" font-weight="800" fill="' + cout + '">' + outS + '</text>';
        }
        /* 外の Na⁺ と 中の K⁺（ゆらゆら） */
        for (var k2 = 0; k2 < 8; k2++) {
          var nx = 94 + k2 * 68 + Math.sin(K.t * 1.3 + k2) * 5;
          if (!my || k2 % 2) s += ion(nx, my ? 42 : 58 + (k2 % 2) * 14, 'var(--a-na)', 'Na', K) + (k2 > 0 ? ion(nx + 30, my ? 276 : 262 - (k2 % 2) * 12, 'var(--a-na)', 'Na', K) : '');
          if (k2 < 7) s += ion(nx + 14, (yT + yB) / 2 + Math.sin(K.t + k2 * 2) * 6, 'var(--a-k)', 'K', K);
        }
        /* Na⁺ の流入（チャネルが開く） */
        excited(K).forEach(function (x, n) {
          s += '<rect x="' + (x - 7) + '" y="' + (yT - 7) + '" width="14" height="14" fill="var(--a-ax)"/><rect x="' + (x - 7) + '" y="' + (yB - 7) + '" width="14" height="14" fill="var(--a-ax)"/>';
          s += '<rect x="' + (x - 13) + '" y="' + (yT - 9) + '" width="6" height="18" rx="2" fill="var(--a-na)"/><rect x="' + (x + 7) + '" y="' + (yT - 9) + '" width="6" height="18" rx="2" fill="var(--a-na)"/><rect x="' + (x - 13) + '" y="' + (yB - 9) + '" width="6" height="18" rx="2" fill="var(--a-na)"/><rect x="' + (x + 7) + '" y="' + (yB - 9) + '" width="6" height="18" rx="2" fill="var(--a-na)"/>';
          for (var m = 0; m < 2; m++) { var g = (K.t * 0.9 + m * 0.5 + n * 0.3) % 1; s += ion(x, lerp(yT - 34, yT + 30, g), 'var(--a-na)', 'Na', K) + ion(x, lerp(yB + 34, yB - 30, g), 'var(--a-na)', 'Na', K); }
        });
        /* K⁺ の流出（不応期） */
        if (i === 3) { var kx = my ? null : lerp(110, 700, u) - 90; if (kx && kx > 60 && kx < 620) { var g2 = (K.t * 0.9) % 1; s += ion(kx, lerp(yT + 26, yT - 34, g2), 'var(--a-k)', 'K', K); } }
        /* 活動電流 */
        var cur = [];
        if (i === 2) cur.push([84, my ? 234 : 140, ease(seg01(u, 0, 0.4))]);
        if (i === 3) { if (my) { var p = u * 3.6, kk = Math.floor(p); if (kk < 3) cur.push([NODES[kk], NODES[kk + 1], ease(seg01(p - kk, 0.1, 0.5))]); } else { var xf = lerp(110, 700, u); if (xf < 620) cur.push([xf - 26, xf + 34, 1]); } }
        cur.forEach(function (c) { s += current(K, c[0], c[1], c[2]); });
        s += '</g>';
        return s;
      }
      function current(K, a, b, op) {
        var m = 'url(#' + K.uid + 'c)', yo = my ? yT - 62 : yT - 30, yo2 = my ? yB + 62 : yB + 30, dash = ' stroke-dasharray="8 6" stroke-dashoffset="' + f1(-K.t * 30) + '"';
        return '<g opacity="' + f1(op) + '" fill="none" stroke="var(--warm)" stroke-width="3"' + '>' +
          '<path d="M' + (a + 8) + ' ' + (yT + 40) + ' C' + (a + 20) + ' ' + (yT + 54) + ' ' + (b - 20) + ' ' + (yT + 54) + ' ' + (b - 6) + ' ' + (yT + 40) + '"' + dash + ' marker-end="' + m + '"/>' +
          '<path d="M' + (a + 8) + ' ' + (yB - 40) + ' C' + (a + 20) + ' ' + (yB - 54) + ' ' + (b - 20) + ' ' + (yB - 54) + ' ' + (b - 6) + ' ' + (yB - 40) + '"' + dash + ' marker-end="' + m + '"/>' +
          '<path d="M' + (b - 4) + ' ' + (yT - 18) + ' C' + (b - 8) + ' ' + yo + ' ' + (a + 10) + ' ' + yo + ' ' + (a + 4) + ' ' + (yT - 22) + '"' + dash + ' marker-end="' + m + '"/>' +
          '<path d="M' + (b - 4) + ' ' + (yB + 18) + ' C' + (b - 8) + ' ' + yo2 + ' ' + (a + 10) + ' ' + yo2 + ' ' + (a + 4) + ' ' + (yB + 22) + '"' + dash + ' marker-end="' + m + '"/></g>';
      }
      /* 膜電位のグラフ（刺激した場所） */
      function vAt(tt) {
        var ts = 3.2 + 0.8;
        if (tt < ts) return -70;
        var x = tt - ts;
        if (x < 0.9) return -70 + 110 * ease(x / 0.9);
        if (x < 2.2) return 40 - 120 * ease((x - 0.9) / 1.3);
        if (x < 3.6) return -80 + 10 * ease((x - 2.2) / 1.4);
        return -70;
      }
      function graph(K) {
        var X0 = 150, X1 = 610, Y0 = 326, Y1 = 420, t1 = 11.6;
        function fx(t) { return X0 + (X1 - X0) * t / t1; }
        function fy(v) { return Y1 - (Y1 - Y0) * (v + 90) / 140; }
        var s = '<rect x="' + X0 + '" y="' + Y0 + '" width="' + (X1 - X0) + '" height="' + (Y1 - Y0) + '" rx="6" fill="var(--chip)" opacity=".7"/>';
        [[40, '+40'], [0, '0'], [-70, '−70']].forEach(function (g) { s += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + f1(fy(g[0])) + '" y2="' + f1(fy(g[0])) + '" stroke="var(--line)" stroke-dasharray="3 3"/>' + tx(K, X0 - 6, fy(g[0]) + 4, g[1], { a: 'end', fs: 11, c: 'var(--muted)' }); });
        var d = '', te = Math.min(K.t, t1);
        for (var tt = 0; tt <= te; tt += 0.05) d += (d ? 'L' : 'M') + f1(fx(tt)) + ' ' + f1(fy(vAt(tt)));
        s += '<path d="' + d + '" fill="none" stroke="var(--warm)" stroke-width="3" stroke-linejoin="round"/>';
        s += tx(K, 20, Y0 - 8, '膜電位（mV）：刺激した場所', { fs: 12, w: 700, c: 'var(--muted)' });
        if (K.t > 4.9 && K.t < 11.6) s += tx(K, fx(5.0) + 8, fy(36), '活動電位', { fs: 12, w: 800, c: 'var(--warm)' });
        return s;
      }
      function race(K) {
        var s = '', on = K.i === 4 ? 1 : 0.85, tt = K.i === 4 ? K.u * 5 : (K.i === 3 ? K.u * 6.5 : 0);
        var X0 = 168, X1 = 610;
        s += '<g opacity="' + on + '">';
        s += tx(K, 20, 318, '速さくらべ（同じ時間で進むきょり）', { fs: 12.5, w: 800, c: 'var(--muted)' });
        /* 有髄 */
        s += '<line x1="' + X0 + '" x2="' + X1 + '" y1="350" y2="350" stroke="var(--a-mem)" stroke-width="5"/>';
        for (var k = 0; k < 8; k++) s += '<rect x="' + (X0 + 4 + k * 56) + '" y="341" width="48" height="18" rx="9" fill="var(--a-myl)" stroke="var(--a-tubd)"/>';
        var pm = (tt / 1.4) % 1, hop = X0 + Math.round(pm * 8) * 56;
        s += '<circle cx="' + f1(Math.min(hop, X1)) + '" cy="350" r="11" fill="var(--a-glow)"/><circle cx="' + f1(Math.min(hop, X1)) + '" cy="350" r="5" fill="var(--warm)"/>';
        s += tx(K, 20, 355, '有髄', { fs: 13.5, w: 800 }) + tx(K, X1, 332, '跳躍伝導：最大 約100 m/s', { a: 'end', fs: 11.5, c: 'var(--muted)' });
        /* 無髄 */
        s += '<line x1="' + X0 + '" x2="' + X1 + '" y1="398" y2="398" stroke="var(--a-mem)" stroke-width="5"/>';
        var pu = Math.min(1, tt / 7);
        s += '<circle cx="' + f1(X0 + pu * (X1 - X0)) + '" cy="398" r="11" fill="var(--a-glow)"/><circle cx="' + f1(X0 + pu * (X1 - X0)) + '" cy="398" r="5" fill="var(--warm)"/>';
        s += tx(K, 20, 403, '無髄', { fs: 13.5, w: 800 }) + tx(K, X1, 424, '約1〜数 m/s（実際の差はもっと大きい）', { a: 'end', fs: 11.5, c: 'var(--muted)' });
        return s + '</g>';
      }
      function axonLabels(K) {
        var s = '', N = K.N;
        s += tx(K, 630, 20, '細胞の外', { a: 'end', fs: 12.5, w: 700, c: 'var(--muted)' });
        s += tx(K, 630, yT + 60, '軸索の内側', { a: 'end', fs: 12.5, w: 700, c: 'var(--muted)' });
        if (my) {
          s += lead(K, 234, yT - 26, 290, 18, 'ランビエ絞輪', { a: 'start', fs: 13 });
          s += lead(K, 150, yT - 40, 120, 18, '髄鞘', { a: 'end', fs: 13 });
        } else s += lead(K, 330, yT - 3, 290, 18, '細胞膜', { a: 'end', fs: 13 });
        if (K.i >= 1 && K.i <= 3) s += lead(K, 92, yB + 30, 112, 284, 'Na⁺ の流入', { a: 'start', fs: 12.5, c: 'var(--a-na)' });
        return s;
      }
      /* ---- シナプス ---- */
      var VES = [[262, 170], [300, 186], [340, 184], [378, 170], [316, 146], [356, 140], [276, 140]];
      var REC = [236, 288, 352, 404];
      function synScene(K) {
        var i = K.i, u = K.u, s = '';
        /* 次のニューロン */
        s += '<path d="M120 262 C120 250 130 246 150 246 L490 246 C510 246 520 250 520 262 L520 430 L120 430Z" fill="var(--a-ax)" stroke="var(--a-mem)" stroke-width="6"/>';
        var post = i === 9 ? ease(seg01(u, 0.3, 0.8)) : 0;
        if (post) s += '<path d="M126 262 L514 262 L514 430 L126 430Z" fill="var(--a-glow)" opacity="' + f1(post * 0.8) + '"/>';
        /* 神経終末 */
        s += '<path d="M282 -4 L282 64 C282 92 200 104 200 158 C200 196 222 212 258 212 L382 212 C418 212 440 196 440 158 C440 104 358 92 358 64 L358 -4" fill="var(--a-ax)" stroke="var(--a-mem)" stroke-width="6" stroke-linejoin="round"/>';
        s += '<rect x="286" y="-4" width="68" height="40" fill="var(--a-myl)" opacity=".0"/>';
        /* ミトコンドリア */
        s += '<g transform="translate(404 120) rotate(-30)"><ellipse rx="22" ry="11" fill="var(--a-mit)" stroke="var(--a-mitd)" stroke-width="1.5"/><path d="M-14 0 q4 -8 8 0 q4 8 8 0 q4 -8 8 0" fill="none" stroke="var(--a-mitd)" stroke-width="1.2"/></g>';
        /* 興奮が下りてくる */
        if (i === 5) { var gy = lerp(-10, 150, ease(u)); s += '<ellipse cx="320" cy="' + f1(gy) + '" rx="' + f1(30 + u * 50) + '" ry="30" fill="var(--a-glow)"/>'; }
        if (i >= 6 && i <= 7) s += '<ellipse cx="320" cy="160" rx="110" ry="46" fill="var(--a-glow)" opacity="' + f1(i === 6 ? 0.8 : 0.8 * (1 - u)) + '"/>';
        /* Ca²⁺ チャネル と Ca²⁺ */
        [[207, 186, -62], [433, 186, 62]].forEach(function (c, n) {
          var open = i >= 6;
          s += '<g transform="translate(' + c[0] + ' ' + c[1] + ') rotate(' + c[2] + ')"><rect x="' + (open ? -15 : -11) + '" y="-11" width="8" height="22" rx="3" fill="var(--a-ca)"/><rect x="' + (open ? 7 : 3) + '" y="-11" width="8" height="22" rx="3" fill="var(--a-ca)"/></g>';
          for (var k = 0; k < 3; k++) {
            var dir = n ? 1 : -1, x0 = c[0] + dir * (34 + k * 16), y0 = c[1] + 22 + k * 6, x1 = c[0] - dir * (30 + k * 12), y1 = c[1] - 18 - k * 12;
            var g = i === 6 ? ease(seg01(u, k * 0.15, 0.55 + k * 0.15)) : i > 6 ? 1 : 0;
            if (i >= 8) continue;
            s += ion(lerp(x0, x1, g), lerp(y0, y1, g), 'var(--a-ca)', 'Ca', K);
          }
        });
        /* シナプス小胞と伝達物質 */
        VES.forEach(function (v, n) {
          var fuse = n < 4, g = 0;
          if (fuse) g = i === 7 ? ease(seg01(u, n * 0.08, 0.5 + n * 0.08)) : i > 7 ? 1 : 0;
          var x = v[0], y = lerp(v[1], 204, fuse ? g : 0);
          if (!fuse || g < 0.98) {
            s += '<circle cx="' + x + '" cy="' + f1(y) + '" r="14" fill="var(--panel)" stroke="var(--a-mem)" stroke-width="3"/>';
            for (var d = 0; d < 5; d++) { var a = d * 1.256 + n; s += '<circle cx="' + f1(x + Math.cos(a) * 6) + '" cy="' + f1(y + Math.sin(a) * 6) + '" r="2.8" fill="var(--a-nt)"/>'; }
          } else s += '<path d="M' + (x - 16) + ' 210 Q' + x + ' 196 ' + (x + 16) + ' 210" fill="none" stroke="var(--a-mem)" stroke-width="3"/>';
        });
        /* 放出された伝達物質 */
        if (i >= 7) {
          for (var k2 = 0; k2 < 16; k2++) {
            var src = VES[k2 % 4][0], rec = REC[k2 % 4] + (k2 % 2 ? 7 : -7);
            var gl = i === 7 ? ease(seg01(u, 0.45 + (k2 % 4) * 0.08, 1)) : 1;
            var gd = i === 8 ? ease(seg01(u, 0.05, 0.85)) : i > 8 ? 1 : 0;
            var wob = Math.sin(K.t * 3 + k2) * (1 - gd) * 6;
            var bx = lerp(src + (hash(k2) - 0.5) * 30, rec, gd) + wob, by = lerp(lerp(208, 222 + hash(k2 + 9) * 14, gl), 238, gd);
            if (gl <= 0) continue;
            if (i === 9 && u > 0.75) { var fade = 1 - seg01(u, 0.75, 1); s += '<circle cx="' + f1(bx) + '" cy="' + f1(by) + '" r="3.2" fill="var(--a-nt)" opacity="' + f1(fade) + '"/>'; continue; }
            s += '<circle cx="' + f1(bx) + '" cy="' + f1(by) + '" r="3.2" fill="var(--a-nt)"/>';
          }
        }
        /* 受容体 */
        var open = i === 9 ? ease(seg01(u, 0.05, 0.3)) * (1 - seg01(u, 0.8, 1)) : 0;
        REC.forEach(function (x) {
          s += '<path d="M' + f1(x - 14 - open * 3) + ' 242 l0 18 a3 3 0 0 0 3 3 l6 0 a3 3 0 0 0 3 -3 l0 -18 l-4 4 l-4 -4 z" fill="var(--c6)"/><path d="M' + f1(x + 2 + open * 3) + ' 242 l0 18 a3 3 0 0 0 3 3 l6 0 a3 3 0 0 0 3 -3 l0 -18 l-4 4 l-4 -4 z" fill="var(--c6)"/>';
          if (open > 0.3) for (var m = 0; m < 2; m++) { var g3 = (K.t * 0.8 + m * 0.5 + x * 0.01) % 1; s += ion(x, lerp(226, 300, g3), 'var(--a-na)', 'Na', K); }
          else if (i >= 6) s += ion(x + 26, 230, 'var(--a-na)', 'Na', K);
        });
        /* 次のニューロンの膜電位 */
        var X0 = 160, X1 = 470, Y0 = 330, Y1 = 410;
        s += '<rect x="' + X0 + '" y="' + Y0 + '" width="' + (X1 - X0) + '" height="' + (Y1 - Y0) + '" rx="6" fill="var(--panel)" opacity=".75"/>';
        var d = '', te = i < 9 ? 0 : u;
        for (var q = 0; q <= 1.0001; q += 0.02) { var v = q < 0.25 || q > te ? null : q; var yy = Y1 - 14 - 52 * Math.sin(Math.PI * cl((q - 0.25) / 0.6, 0, 1)) * (q < 0.25 ? 0 : 1); if (q <= Math.max(te, i >= 9 ? 0 : 1.1) || i < 9) d += (d ? 'L' : 'M') + f1(lerp(X0 + 8, X1 - 8, q)) + ' ' + f1(i < 9 ? Y1 - 14 : yy); }
        s += '<path d="' + d + '" fill="none" stroke="var(--warm)" stroke-width="3" stroke-linejoin="round"/>';
        s += tx(K, X0 + 8, Y0 + 18, '次のニューロンの膜電位', { fs: 12, w: 700, c: 'var(--muted)' });
        return s;
      }
      function synLabels(K) {
        var s = '', i = K.i;
        s += lead(K, 282, 40, 230, 30, '神経終末', { a: 'end', fs: 13.5 });
        s += lead(K, 368, 132, 470, 72, 'シナプス小胞', { a: 'start', fs: 13.5 });
        s += lead(K, 433, 186, 470, 120, '<tspan>Ca²⁺ チャネル</tspan>', { a: 'start', fs: 13.5 });
        s += lead(K, 186, 230, 112, 244, 'シナプス間隙', { a: 'end', fs: 13 });
        s += lead(K, 228, 256, 112, 290, '受容体', { a: 'end', fs: 13.5 });
        if (i >= 7) s += lead(K, 262, 222, 150, 196, '神経伝達物質', { a: 'end', fs: 13, c: 'var(--a-nt)' });
        s += tx(K, 506, 422, '次のニューロン', { a: 'end', fs: 13, w: 800, c: 'var(--muted)' });
        return s;
      }
      function frame(K) {
        var s = '<defs>' + arrowDef(K.uid + 'c', 'var(--warm)') + '</defs>';
        if (K.i <= 4) { s += axonScene(K) + axonLabels(K); s += K.i >= 3 ? race(K) : graph(K); }
        else s += synScene(K) + synLabels(K);
        return s;
      }
      return kit(stage, ctl, api, {
        name: '興奮の伝導とシナプス', w: 640, h: 430, phases: phases, frame: frame,
        onStep: function () { if (stageAt() >= 5) api.task(2); },
        extra: function (c2, A) {
          stageAt = function () { return A.st.t >= A.starts[5] ? 5 : 0; };
          BL.ui.seg(c2, '見る場所', [[0, '軸索（伝導）'], [5, 'シナプス（伝達）']], 0, function (v) { A.jump(v); });
          BL.ui.seg(c2, '神経繊維', [[true, '有髄（跳躍伝導）'], [false, '無髄']], my, function (v) { my = v; sawMy[v] = 1; if (sawMy.true && sawMy.false) api.task(1); A.jump(Math.min(3, Math.max(1, phaseIdx(A)))); });
          sawMy[my] = 1;
          function phaseIdx(A2) { for (var k = A2.starts.length - 1; k > 0; k--) if (A2.st.t >= A2.starts[k]) return k; return 0; }
        }
      });
      function stageAt() { return 0; }
    }
  });

  /* =====================================================================
     3. 筋収縮（滑り説）
     ===================================================================== */
  BL.addSim({
    id: 'a-muscle', anim: true, name: '筋収縮（滑り説）', cat: 'アニメーション', subj: 'bio', ic: '筋',
    lead: 'Ca²⁺ とATPのはたらきで、ミオシン頭部がアクチンフィラメントをたぐり寄せ、サルコメアが短くなるようすを見る',
    how: '<p>骨格筋の筋繊維の中には<b class="key">筋原繊維</b>があり、<b class="key">Z膜</b>からZ膜までの<b class="key">サルコメア</b>（筋節）がくり返している。</p><ul><li>細い<b class="key">アクチンフィラメント</b>：Z膜から伸びる</li><li>太い<b class="key">ミオシンフィラメント</b>：サルコメアの中央にある。ミオシンのある部分が<b class="key">暗帯（A帯）</b>、ない部分が<b class="key">明帯（I帯）</b>。暗帯の中のアクチンが重ならない部分が<b class="key">H帯</b></li></ul><div class="box">運動神経の興奮 → 筋繊維に活動電位 → <b class="key">筋小胞体</b>から Ca²⁺ が放出 → Ca²⁺ がトロポニンに結合し、アクチンの結合部位が現れる → <b class="key">ミオシン頭部</b>がアクチンと結合し、ATP のエネルギーで首をふってアクチンをたぐり寄せる</div><p>フィラメント自体の長さは変わらず、すべりこむだけ（<b class="key">滑り説</b>）。そのため<b>暗帯（A帯）の長さは変わらず、明帯（I帯）と H帯が短くなる</b>。</p>',
    pts: [[1, '筋収縮で暗帯（A帯）の長さは変わらない'], [1, '筋収縮で明帯（I帯）と H帯は短くなる'], [0, '筋収縮ではアクチンフィラメント自体が縮む → ×'], [1, 'Ca²⁺ は筋小胞体から放出される'], [1, 'ミオシン頭部は ATP を分解したエネルギーで動く']],
    tasks: ['収縮してゆるむまで最後まで見る', '1コマずつ進めて、頭部が結合する場面を見る', '×0.5 でゆっくり首ふりを見る'],
    slides: [['b4-2', 3]],
    mount: function (stage, ctl, api) {
      var phases = [
        { d: 3, h: 'ゆるんでいる（弛緩）', p: 'Ca²⁺ は<b class="key">筋小胞体</b>の中にしまわれている。アクチンの結合部位は<b>トロポミオシン</b>でかくれていて、<b class="key">ミオシン頭部</b>は結合できない。' },
        { d: 3.4, h: 'Ca²⁺ が放出される', p: '運動神経から興奮が伝わると、<b class="key">筋小胞体</b>から Ca²⁺ が放出される。Ca²⁺ がアクチン上の<b>トロポニン</b>に結合すると、結合部位が現れる。' },
        { d: 2.6, h: 'ミオシン頭部がアクチンに結合', p: '<b class="key">ミオシン頭部</b>がアクチンフィラメントに結合する（頭部はあらかじめ ATP を分解して、エネルギーをためている）。' },
        { d: 3, h: '首をふって、たぐり寄せる', p: '頭部が首をふるように動き、アクチンフィラメントを<b>サルコメアの中央へ</b>引き寄せる（ADP とリン酸がはなれる）。' },
        { d: 6, h: 'くり返して、サルコメアが縮む', p: '頭部に<b>ATP</b>が結合すると、頭部がアクチンからはなれる。ATP を分解して元の向きにもどり、また結合 → 首ふり…をくり返す。アクチンがすべりこみ、<b>明帯（I帯）と H帯が短くなる</b>。暗帯（A帯）は変わらない。' },
        { d: 4, h: 'Ca²⁺ が回収され、ゆるむ', p: '興奮がおさまると、Ca²⁺ は筋小胞体に回収され、頭部は結合できなくなる。筋肉はゆるみ、ほかの力で引きのばされてもとの長さにもどる。' }];
      var CX = 320, MH = 130, ACT = 170, ROWA = [128, 197, 266], ROWM = [162, 231];
      function contr(K) { var i = K.i, u = K.u; return i < 3 ? 0 : i === 3 ? 0.22 * ease(u) : i === 4 ? lerp(0.22, 1, u) : 1 - ease(seg01(u, 0.25, 1)); }
      function halfL(c) { return lerp(240, 182, c); }
      function headAt(j, K) {
        /* 0〜1 の周期：0-.15 結合, .15-.45 首ふり, .45-.6 ATPではなれる, .6-1 元の向きへ */
        var i = K.i, u = K.u, ph = -1;
        if (i === 2) ph = ease(seg01(u, 0.2, 0.8)) * 0.15;
        else if (i === 3) ph = 0.15 + ease(seg01(u, 0.1, 0.8)) * 0.3;
        else if (i === 4) ph = (0.45 + u * 3.2 + hash(j) * 0.9 * u) % 1;
        else if (i === 5) ph = u < 0.25 ? -1 : -1;
        return ph;
      }
      function head(K, x, y, dir, side, ph) {
        /* dir: -1 左半分（頭部は左向き）, side: -1 上の列へ, +1 下の列へ */
        var cocked = 40, stroke = -12, ang, reach, att = false;
        if (ph < 0) { ang = cocked; reach = 0.72; }
        else if (ph < 0.15) { ang = cocked; reach = lerp(0.72, 1, ph / 0.15); att = ph > 0.1; }
        else if (ph < 0.45) { ang = lerp(cocked, stroke, ease((ph - 0.15) / 0.3)); reach = 1; att = true; }
        else if (ph < 0.6) { ang = stroke; reach = lerp(1, 0.72, (ph - 0.45) / 0.15); }
        else { ang = lerp(stroke, cocked, ease((ph - 0.6) / 0.4)); reach = 0.72; }
        var r = ang * Math.PI / 180, L = 27 * reach;
        var tx2 = x + dir * Math.sin(r) * L, ty2 = y + side * Math.cos(r) * L;
        var bx = x, by = y + side * 6;
        var s = '<line x1="' + f1(bx) + '" y1="' + f1(by) + '" x2="' + f1(tx2) + '" y2="' + f1(ty2) + '" stroke="var(--a-myo)" stroke-width="3" stroke-linecap="round"/>';
        s += '<ellipse cx="' + f1(tx2) + '" cy="' + f1(ty2) + '" rx="7.5" ry="4.8" transform="rotate(' + f1(90 - dir * ang * side) + ' ' + f1(tx2) + ' ' + f1(ty2) + ')" fill="' + (att ? 'var(--a-myo)' : 'color-mix(in srgb, var(--a-myo) 55%, var(--panel))') + '" stroke="var(--a-myo)" stroke-width="1.2"/>';
        if (att) s += '<circle cx="' + f1(tx2) + '" cy="' + f1(ty2 + side * 3) + '" r="7" fill="var(--a-glow)"/>';
        return { s: s, x: tx2, y: ty2, ph: ph };
      }
      function actin(K, x0, x1, y, exposed, caOn) {
        var s = '', n = Math.floor(Math.abs(x1 - x0) / 9), dir = x1 > x0 ? 1 : -1;
        s += '<line x1="' + f1(x0) + '" y1="' + y + '" x2="' + f1(x1) + '" y2="' + y + '" stroke="var(--a-act)" stroke-width="2" opacity=".5"/>';
        for (var k = 0; k <= n; k++) { var xx = x0 + dir * k * 9; s += '<circle cx="' + f1(xx) + '" cy="' + f1(y + (k % 2 ? 2.6 : -2.6)) + '" r="4.3" fill="var(--a-act)"/>'; }
        /* トロポミオシン（かくす） */
        s += '<path d="M' + f1(x0) + ' ' + y + ' L' + f1(x1) + ' ' + y + '" stroke="var(--c5)" stroke-width="1.6" stroke-dasharray="' + (exposed ? '3 9' : '0') + '" opacity="' + (exposed ? 0.5 : 0.9) + '"/>';
        /* トロポニン + Ca */
        for (var k2 = 1; k2 * 36 < Math.abs(x1 - x0); k2++) { var tx3 = x0 + dir * k2 * 36; s += '<circle cx="' + f1(tx3) + '" cy="' + f1(y - 6) + '" r="3" fill="var(--c5)"/>'; if (caOn > 0) s += '<circle cx="' + f1(tx3) + '" cy="' + f1(y - 12) + '" r="3.6" fill="var(--a-ca)" opacity="' + f1(caOn) + '"/>'; }
        return s;
      }
      function bracket(K, x0, x1, y, label, c, ly) {
        c = c || 'var(--ink)';
        var s = '<path d="M' + f1(x0) + ' ' + (y - 6) + ' V' + y + ' H' + f1(x1) + ' V' + (y - 6) + '" fill="none" stroke="' + c + '" stroke-width="2"/>';
        if (label) s += tx(K, (x0 + x1) / 2, ly || y + 17, label, { a: 'middle', fs: 13, w: 800, c: c });
        return s;
      }
      function frame(K) {
        var i = K.i, u = K.u, c = contr(K), L = halfL(c), zL = CX - L, zR = CX + L, s = '';
        var caOut = i === 1 ? ease(seg01(u, 0.1, 0.8)) : i >= 2 && i <= 4 ? 1 : i === 5 ? 1 - ease(seg01(u, 0, 0.5)) : 0;
        var exposed = caOut > 0.6;
        /* 上：筋原繊維（くり返し） */
        var w = 2 * L * 0.22, ax = MH * 2 * 0.22, cx0 = CX;
        s += '<rect x="16" y="24" width="608" height="26" rx="13" fill="var(--a-tub)" stroke="var(--line)"/>';
        s += '<clipPath id="' + K.uid + 'mf"><rect x="16" y="24" width="608" height="26" rx="13"/></clipPath><g clip-path="url(#' + K.uid + 'mf)">';
        for (var k = -6; k <= 6; k++) { var sc = cx0 + k * w; s += '<rect x="' + f1(sc - ax / 2) + '" y="24" width="' + f1(ax) + '" height="26" fill="var(--a-myo)" opacity=".55"/><line x1="' + f1(sc + w / 2) + '" x2="' + f1(sc + w / 2) + '" y1="24" y2="50" stroke="var(--ink)" stroke-width="1.5"/>'; }
        s += '</g><rect x="' + f1(cx0 - w / 2) + '" y="20" width="' + f1(w) + '" height="34" rx="3" fill="none" stroke="var(--warm)" stroke-width="2.2"/>';
        s += '<path d="M' + f1(cx0 - w / 2) + ' 54 L' + f1(zL) + ' 108 M' + f1(cx0 + w / 2) + ' 54 L' + f1(zR) + ' 108" stroke="var(--warm)" stroke-dasharray="4 4" fill="none"/>';
        /* 筋小胞体 */
        s += '<rect x="16" y="66" width="608" height="22" rx="11" fill="var(--a-sr)" stroke="var(--c3)" stroke-width="1" opacity=".9"/>';
        for (var k1 = 0; k1 < 14; k1++) {
          var sx = 150 + k1 * 32 + (k1 % 2) * 6, sy = 77, row = ROWA[k1 % 3], txx = zL + 30 + ((k1 * 37) % (2 * L - 60));
          var g = caOut, cxp = lerp(sx, txx, g), cyp = lerp(sy, row - 12, g);
          if (i === 1) { var gg = ease(seg01(u, 0.05 + (k1 % 5) * 0.05, 0.7 + (k1 % 5) * 0.05)); cxp = lerp(sx, txx, gg); cyp = lerp(sy, row - 18, gg); if (gg >= 0.99) continue; }
          else if (i >= 2 && i <= 4) continue;
          else if (i === 5) { var gb = 1 - ease(seg01(u, 0, 0.5)); cxp = lerp(sx, txx, gb); cyp = lerp(sy, row - 18, gb); }
          s += '<circle cx="' + f1(cxp) + '" cy="' + f1(cyp) + '" r="4.2" fill="var(--a-ca)" stroke="var(--panel)" stroke-width=".8"/>';
        }
        /* サルコメアの背景 */
        s += '<rect x="' + f1(zL) + '" y="110" width="' + f1(2 * L) + '" height="174" fill="var(--cyto)" opacity=".6"/>';
        s += '<rect x="' + (CX - MH) + '" y="110" width="' + (2 * MH) + '" height="174" fill="var(--a-myo)" opacity=".08"/>';
        /* アクチン */
        ROWA.forEach(function (y) { s += actin(K, zL, zL + ACT, y, exposed, caOut) + actin(K, zR, zR - ACT, y, exposed, caOut); });
        /* となりのサルコメアのアクチン（うすく） */
        ROWA.forEach(function (y) { s += '<g opacity=".3">' + actin(K, zL, Math.max(16, zL - 60), y, false, 0) + actin(K, zR, Math.min(624, zR + 60), y, false, 0) + '</g>'; });
        /* Z膜 */
        [zL, zR].forEach(function (z) { var d = 'M' + f1(z) + ' 110'; for (var k3 = 0; k3 < 12; k3++) d += ' L' + f1(z + (k3 % 2 ? -5 : 5)) + ' ' + (110 + (k3 + 1) * 14.5); s += '<path d="' + d + '" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>'; });
        /* ミオシン */
        var atpS = '';
        ROWM.forEach(function (y, m) {
          s += '<rect x="' + (CX - MH) + '" y="' + (y - 6) + '" width="' + (2 * MH) + '" height="12" rx="6" fill="var(--a-myo)"/>';
          for (var k4 = 0; k4 < 4; k4++) [-1, 1].forEach(function (dir) {
            var hx = CX + dir * (36 + k4 * 26);
            [-1, 1].forEach(function (side) {
              var j = m * 40 + k4 * 4 + (dir + 1) + (side + 1) / 2;
              var h = head(K, hx, y, dir, side, headAt(j, K));
              s += h.s;
              if (i === 4 && h.ph > 0.42 && h.ph < 0.62 && side === -1 && m === 0) atpS += pill(K, h.x + dir * 4, h.y - 14, 'ATP', 'var(--a-atp)', { fs: 9.5 });
              if (i === 3 && side === -1 && m === 0 && k4 === 2 && u > 0.35) atpS += pill(K, h.x + dir * 6, h.y - 16, 'ADP+Pi', 'var(--muted)', { fs: 9, op: 1 - seg01(u, 0.6, 1) });
            });
          });
        });
        s += atpS;
        /* すべる向きの矢印 */
        if (i >= 3 && i <= 4) { var mk = 'url(#' + K.uid + 'a)'; s += '<line x1="' + f1(zL + 12) + '" y1="296" x2="' + f1(zL + 52) + '" y2="296" stroke="var(--warm)" stroke-width="3" marker-end="' + mk + '"/><line x1="' + f1(zR - 12) + '" y1="296" x2="' + f1(zR - 52) + '" y2="296" stroke="var(--warm)" stroke-width="3" marker-end="' + mk + '"/>'; }
        /* 帯の長さ */
        var tip = zL + ACT, hW = Math.max(0, (CX - tip) * 2);
        s += bracket(K, CX - MH, CX + MH, 318, 'A帯（暗帯）：変わらない', 'var(--warm)');
        s += bracket(K, zL, CX - MH, 352, '', 'var(--c3)') + bracket(K, CX + MH, zR, 352, '', 'var(--c3)');
        s += tx(K, Math.min((zL + CX - MH) / 2, 150), 370, 'I帯（明帯）', { a: 'middle', fs: 13, w: 800, c: 'var(--c3)' }) + tx(K, Math.max((zR + CX + MH) / 2, 490), 370, 'I帯（明帯）', { a: 'middle', fs: 13, w: 800, c: 'var(--c3)' });
        if (hW > 2) s += bracket(K, CX - hW / 2, CX + hW / 2, 352, '', 'var(--c6)');
        s += tx(K, CX, 370, 'H帯', { a: 'middle', fs: 13, w: 800, c: 'var(--c6)' });
        s += bracket(K, zL, zR, 392, '', 'var(--ink)');
        s += tx(K, CX, 410, 'サルコメア 約' + (2 * L * 2.5 / 480).toFixed(1) + ' μm', { a: 'middle', fs: 13, w: 800 });
        /* ラベル */
        s += tx(K, 20, 16, '筋原繊維（サルコメアのくり返し）', { fs: 12, w: 700, c: 'var(--muted)' });
        s += tx(K, 28, 82, '筋小胞体', { fs: 12.5, w: 800, c: 'var(--c3)' });
        s += tx(K, zL - 4, 106, 'Z膜', { a: 'end', fs: 12.5, w: 800 }) + tx(K, zR + 4, 106, 'Z膜', { fs: 12.5, w: 800 });
        /* 凡例 */
        var ly = 436, lx = 22;
        for (var lb = 0; lb < 5; lb++) s += '<circle cx="' + (lx + lb * 8) + '" cy="' + (ly - 5 + (lb % 2 ? 2.6 : -2.6)) + '" r="4.3" fill="var(--a-act)"/>';
        s += '' + tx(K, lx + 44, ly, 'アクチン（細い）', { fs: 12, w: 700 });
        var lx2 = K.N ? 250 : 200;
        s += '<rect x="' + lx2 + '" y="' + (ly - 10) + '" width="36" height="10" rx="5" fill="var(--a-myo)"/>' + tx(K, lx2 + 42, ly, 'ミオシン（太い）', { fs: 12, w: 700 });
        var lx3 = K.N ? 474 : 380;
        s += '<circle cx="' + (lx3 + 6) + '" cy="' + (ly - 5) + '" r="5" fill="var(--a-ca)"/>' + tx(K, lx3 + 16, ly, 'Ca²⁺', { fs: 12, w: 700 });
        if (!K.N) s += '<ellipse cx="' + 470 + '" cy="' + (ly - 5) + '" rx="7.5" ry="4.8" fill="var(--a-myo)"/>' + tx(K, 482, ly, 'ミオシン頭部', { fs: 12, w: 700 });
        return '<defs>' + arrowDef(K.uid + 'a', 'var(--warm)') + '</defs>' + s;
      }
      var slowSeen = false;
      return kit(stage, ctl, api, {
        name: '筋収縮（滑り説）', w: 640, h: 446, phases: phases, frame: frame,
        onStep: function () { api.task(1); },
        tick: function (dt, K) { if (K.i >= 3 && K.i <= 4 && ctl.querySelector('.seg button[aria-pressed="true"]') && slowCheck()) api.task(2); }
      });
      function slowCheck() { var b = [].filter.call(ctl.querySelectorAll('.seg button'), function (x) { return x.textContent === '×0.5'; })[0]; return b && b.getAttribute('aria-pressed') === 'true'; }
    }
  });

  /* =====================================================================
     4. 免疫のしくみ
     ===================================================================== */
  function kf(P, ks) {
    if (P <= ks[0][0]) return ks[0].slice(1);
    for (var j = 0; j < ks.length - 1; j++) if (P <= ks[j + 1][0]) { var e = ease((P - ks[j][0]) / (ks[j + 1][0] - ks[j][0])); return ks[j].slice(1).map(function (v, n) { return lerp(v, ks[j + 1][n + 1], e); }); }
    return ks[ks.length - 1].slice(1);
  }
  BL.addSim({
    id: 'a-immune', anim: true, name: '免疫のしくみ', cat: 'アニメーション', subj: 'kiso', ic: '免',
    lead: '病原体が入ってから、食作用・抗原提示・抗体・キラーT細胞・記憶細胞までの流れを見る',
    how: '<p><b>自然免疫</b>：<b class="key">好中球</b>・<b class="key">マクロファージ</b>・<b class="key">樹状細胞</b>などが、異物を<b class="key">食作用</b>で取りこんで分解する（NK細胞は感染細胞を直接こわす）。</p><p><b>獲得免疫</b>：樹状細胞がリンパ節へ移動し、<b class="key">抗原提示</b>を行う。その抗原に合う<b class="key">ヘルパーT細胞</b>が活性化して増える。</p><ul><li><b class="key">体液性免疫</b>：ヘルパーT細胞が B細胞を活性化 → B細胞が増えて<b class="key">形質細胞</b>（抗体産生細胞）になり<b class="key">抗体</b>を放出 → 抗原と結合（<b class="key">抗原抗体反応</b>）→ 無毒化され、食細胞に取りこまれる</li><li><b class="key">細胞性免疫</b>：<b class="key">キラーT細胞</b>が活性化して増え、感染細胞を直接攻撃する</li></ul><p>一部の T細胞・B細胞は<b class="key">記憶細胞</b>として残り、同じ抗原が再び入ると、すばやく強く反応する（<b>二次応答</b>）。</p>',
    pts: [[1, '樹状細胞は抗原提示を行い、T細胞に情報を伝える'], [1, '抗体をつくるのは、B細胞が分化した形質細胞'], [0, 'キラーT細胞は抗体をつくって感染細胞をこわす → ×（直接攻撃する）'], [1, '記憶細胞が残るので、二次応答はすばやく強い'], [0, '好中球は抗原提示の中心となる細胞である → ×（樹状細胞）']],
    tasks: ['記憶細胞が残るところまで見る', '1コマずつ進めて、抗原提示の場面を見る', '「体液性免疫」と「細胞性免疫」の場面を両方見る'],
    slides: [['k3-5', 2], ['k3-5', 3]],
    mount: function (stage, ctl, api) {
      var seen = {};
      var phases = [
        { d: 4, h: '病原体が入ってくる', p: 'きず口などから<b>病原体</b>（ここではウイルス）が体内に入る。一部は細胞に入りこんで<b>感染細胞</b>になる。' },
        { d: 5, h: '食作用（自然免疫）', p: '<b class="key">好中球</b>や<b class="key">マクロファージ</b>が病原体を取りこんで分解する（<b class="key">食作用</b>）。生まれつきそなわっていて、すぐにはたらく（<b>自然免疫</b>）。' },
        { d: 5, h: '樹状細胞がリンパ節へ', p: '<b class="key">樹状細胞</b>も食作用で病原体を取りこみ、その断片（<b>抗原</b>）を表面に出して、<b>リンパ管</b>を通って<b>リンパ節</b>へ移動する。' },
        { d: 5, h: '抗原提示 → ヘルパーT細胞', p: '樹状細胞が抗原を T細胞に見せる（<b class="key">抗原提示</b>）。その抗原に合う<b class="key">ヘルパーT細胞</b>だけが活性化して増える。ここから<b>獲得免疫</b>。' },
        { d: 5.5, h: 'B細胞 → 形質細胞（体液性免疫）', p: 'ヘルパーT細胞が、同じ抗原を認識した<b class="key">B細胞</b>を活性化する。B細胞は増えて<b class="key">形質細胞</b>（抗体産生細胞）になる。' },
        { d: 6, h: '抗体が抗原と結合（抗原抗体反応）', p: '形質細胞が Y字形の<b class="key">抗体</b>を放出する。抗体は血液で運ばれ、抗原と結合する（<b class="key">抗原抗体反応</b>）。病原体は無毒化されてかたまり、マクロファージに食べられる。' },
        { d: 6, h: 'キラーT細胞が感染細胞を攻撃（細胞性免疫）', p: 'ヘルパーT細胞が<b class="key">キラーT細胞</b>を活性化する。キラーT細胞は増えて感染した場所へ行き、<b>感染細胞を直接こわす</b>（<b>細胞性免疫</b>）。' },
        { d: 4.5, h: '記憶細胞が残る', p: '病原体がいなくなると、多くの細胞は死ぬが、一部の T細胞・B細胞が<b class="key">記憶細胞</b>として長く残る。次に同じ抗原が入ると、すばやく強く反応する（<b>二次応答</b>）。' }];
      var VT = [[120, 150], [214, 128], [170, 84], [92, 240], [184, 222], [250, 268]];
      function virus(x, y, op, sc) {
        sc = sc == null ? 1 : sc; var s = '<g transform="translate(' + f1(x) + ' ' + f1(y) + ') scale(' + f1(sc) + ')" opacity="' + f1(op) + '">';
        for (var k = 0; k < 8; k++) { var a = k * 0.785; s += '<line x1="0" y1="0" x2="' + f1(Math.cos(a) * 9.5) + '" y2="' + f1(Math.sin(a) * 9.5) + '" stroke="var(--a-vir)" stroke-width="2"/><circle cx="' + f1(Math.cos(a) * 9.5) + '" cy="' + f1(Math.sin(a) * 9.5) + '" r="1.8" fill="var(--a-vir)"/>'; }
        return s + '<circle r="6.5" fill="var(--a-vir)"/><circle r="3" fill="var(--panel)" opacity=".35"/></g>';
      }
      function ab(x, y, ang, op) { return '<path transform="translate(' + f1(x) + ' ' + f1(y) + ') rotate(' + f1(ang) + ')" d="M0 8 V0 L-5 -6 M0 0 L5 -6" fill="none" stroke="var(--a-ab)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity="' + f1(op == null ? 1 : op) + '"/>'; }
      function lym(x, y, c, letter, o) {
        o = o || {}; var r = o.r || 14, s = '';
        if (o.glow) s += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r + 9) + '" fill="var(--a-glow)" opacity="' + f1(o.glow) + '"/>';
        if (o.mem) s += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r + 6) + '" fill="none" stroke="var(--a-sun)" stroke-width="2.5" stroke-dasharray="4 3" opacity="' + f1(o.mem) + '"/>';
        s += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + r + '" style="fill:' + tint(c, 35) + '" stroke="' + c + '" stroke-width="2" opacity="' + f1(o.op == null ? 1 : o.op) + '"/>';
        if (o.plasma) s += '<path d="M' + f1(x - 10) + ' ' + f1(y + 2) + ' q5 -4 10 0 t10 0 M' + f1(x - 9) + ' ' + f1(y + 8) + ' q5 -4 10 0 t9 0" fill="none" stroke="' + c + '" stroke-width="1.3" opacity="' + f1(o.op == null ? 1 : o.op) + '"/>';
        s += '<text x="' + f1(x + (o.plasma ? 0 : 0)) + '" y="' + f1(y + (o.plasma ? -2 : 4.5)) + '" text-anchor="middle" font-size="12" font-weight="800" fill="' + c + '" opacity="' + f1(o.op == null ? 1 : o.op) + '">' + letter + '</text>';
        if (o.rec) for (var k = 0; k < 4; k++) { var a = k * 1.57 + 0.6; s += ab(x + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3), a * 57.3 + 90, o.op); }
        return s;
      }
      function neut(x, y, g) { return (g ? '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="24" fill="var(--a-glow)" opacity="' + f1(g) + '"/>' : '') + '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="16" style="fill:' + tint('var(--c2)', 40) + '" stroke="var(--c2)" stroke-width="2"/><circle cx="' + f1(x - 6) + '" cy="' + f1(y - 2) + '" r="4.5" fill="var(--c6)" opacity=".7"/><circle cx="' + f1(x + 1) + '" cy="' + f1(y + 4) + '" r="4.5" fill="var(--c6)" opacity=".7"/><circle cx="' + f1(x + 6) + '" cy="' + f1(y - 3) + '" r="4.5" fill="var(--c6)" opacity=".7"/>'; }
      function macro(x, y, t, g) {
        var d = '';
        for (var k = 0; k <= 12; k++) { var a = k / 12 * 6.283, r = 21 + 3.5 * Math.sin(a * 3 + t * 2); d += (k ? 'L' : 'M') + f1(x + Math.cos(a) * r) + ' ' + f1(y + Math.sin(a) * r * 0.85); }
        return (g ? '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="28" fill="var(--a-glow)" opacity="' + f1(g) + '"/>' : '') + '<path d="' + d + 'Z" style="fill:' + tint('var(--c5)', 40) + '" stroke="var(--c5)" stroke-width="2" stroke-linejoin="round"/><path d="M' + f1(x - 6) + ' ' + f1(y - 4) + ' a7 6 0 1 1 6 9 a4 3 0 0 0 -6 -9z" fill="var(--c6)" opacity=".6"/>';
      }
      function dend(x, y, ag, op) {
        var s = '<g opacity="' + f1(op == null ? 1 : op) + '">', d = '';
        for (var k = 0; k < 7; k++) { var a = k * 0.9 + 0.3, r1 = 12, r2 = 27; s += '<path d="M' + f1(x + Math.cos(a - 0.25) * r1) + ' ' + f1(y + Math.sin(a - 0.25) * r1) + ' L' + f1(x + Math.cos(a) * r2) + ' ' + f1(y + Math.sin(a) * r2) + ' L' + f1(x + Math.cos(a + 0.25) * r1) + ' ' + f1(y + Math.sin(a + 0.25) * r1) + 'Z" style="fill:' + tint('var(--c6)', 45) + '" stroke="var(--c6)" stroke-width="1.6" stroke-linejoin="round"/>'; if (ag && k % 2 === 0) s += '<circle cx="' + f1(x + Math.cos(a) * r2) + '" cy="' + f1(y + Math.sin(a) * r2) + '" r="3.2" fill="var(--a-vir)" opacity="' + f1(ag) + '"/>'; }
        return s + '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="14" style="fill:' + tint('var(--c6)', 45) + '" stroke="var(--c6)" stroke-width="1.6"/><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="6" fill="var(--c6)" opacity=".6"/></g>';
      }
      function tcell(x, y, r, inf, op, burst) {
        burst = burst || 0; if (burst >= 1) return '';
        var s = '<g opacity="' + f1((op == null ? 1 : op) * (1 - burst)) + '">';
        s += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * (1 + burst * 0.3)) + '" fill="var(--cyto)" stroke="' + (inf ? 'var(--a-vir)' : 'var(--line)') + '" stroke-width="' + (inf ? 2 : 1.5) + '"' + (burst ? ' stroke-dasharray="5 4"' : '') + '/><circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.38) + '" fill="var(--nuc)" stroke="var(--line)"/>';
        if (inf) for (var k = 0; k < 6; k++) { var a = k * 1.047; s += '<circle cx="' + f1(x + Math.cos(a) * r) + '" cy="' + f1(y + Math.sin(a) * r) + '" r="3" fill="var(--a-vir)" opacity="' + f1(inf) + '"/>'; }
        return s + '</g>';
      }
      function stat(K) {
        var s = '';
        /* からだの組織 */
        s += '<rect x="8" y="36" width="310" height="282" rx="10" fill="var(--cyto)" opacity=".55" stroke="var(--line)"/>';
        s += '<path d="M8 12 H64 L70 36 H8Z M104 12 H318 V36 H98Z" fill="var(--a-tis)" stroke="var(--c5)" stroke-width="1.2" opacity=".9"/>';
        /* リンパ節 */
        s += '<path d="M482 28 C570 28 626 80 624 160 C622 240 566 292 482 292 C420 292 380 260 378 230 C396 200 396 140 376 112 C392 60 430 28 482 28Z" fill="var(--a-alv)" stroke="var(--c6)" stroke-width="2" opacity=".75"/>';
        /* リンパ管・血管 */
        s += '<path d="M270 190 C300 190 330 188 384 172" fill="none" stroke="var(--c4)" stroke-width="14" stroke-linecap="round" opacity=".55"/>';
        s += '<path d="M482 288 V334" stroke="' + tint('var(--a-art)', 30) + '" stroke-width="14"/>';
        s += '<rect x="8" y="326" width="624" height="18" rx="9" style="fill:' + tint('var(--a-art)', 30) + '" stroke="' + tint('var(--a-art)', 70) + '"/>';
        s += tcell(48, 292, 18, 0) + tcell(150, 290, 18, 0);
        return s;
      }
      function frame(K) {
        var P = K.i + K.u, t = K.t, s = '', lb = '';
        /* 感染細胞 */
        var inf = cl((P - 0.95) / 0.1, 0, 1), burst = cl((P - 6.78) / 0.15, 0, 1);
        s += tcell(250, 268, 24, inf, 1, burst);
        if (burst > 0 && burst < 1) for (var k = 0; k < 7; k++) { var a = k * 0.9; s += '<circle cx="' + f1(250 + Math.cos(a) * (24 + burst * 22)) + '" cy="' + f1(268 + Math.sin(a) * (24 + burst * 22)) + '" r="3" fill="var(--a-vir)" opacity="' + f1(1 - burst) + '"/>'; }
        /* 食細胞 */
        var nP = kf(P, [[1.0, 44, 200], [1.5, 112, 168]]), mP = kf(P, [[1.0, 280, 78], [1.5, 222, 122], [5.6, 222, 122], [5.85, 150, 222], [7.2, 150, 222]]);
        var dP = kf(P, [[2.0, 70, 104], [2.3, 162, 88], [2.45, 162, 88], [2.65, 250, 176], [2.85, 320, 188], [3.0, 398, 170]]);
        s += neut(nP[0], nP[1], P > 1.5 && P < 2 ? 0.7 : 0) + macro(mP[0], mP[1], t, (P > 1.5 && P < 2) || (P > 5.85 && P < 6) ? 0.7 : 0);
        var dOp = P > 7 ? 1 - cl((P - 7) / 0.3, 0, 1) : 1;
        s += dend(dP[0], dP[1], cl((P - 2.4) / 0.1, 0, 1), dOp);
        /* ウイルス */
        VT.forEach(function (v, n) {
          var t0 = 0.05 + n * 0.1, q = kf(P, [[t0, 84, -6], [t0 + 0.12, 84, 30], [t0 + 0.45, v[0], v[1]]]), op = 1, sc = 1;
          var wob = Math.sin(t * 2 + n) * 3; q = [q[0] + (P > t0 + 0.45 ? wob : 0), q[1]];
          if (n === 0) { var e = cl((P - 1.5) / 0.25, 0, 1); q = [lerp(q[0], nP[0], e), lerp(q[1], nP[1], e)]; op = 1 - cl((P - 1.6) / 0.2, 0, 1); sc = 1 - e * 0.5; }
          if (n === 1) { var e1 = cl((P - 1.5) / 0.25, 0, 1); q = [lerp(q[0], mP[0], e1), lerp(q[1], mP[1], e1)]; op = 1 - cl((P - 1.6) / 0.2, 0, 1); sc = 1 - e1 * 0.5; }
          if (n === 2) { var e2 = cl((P - 2.3) / 0.12, 0, 1); q = [lerp(q[0], dP[0], e2), lerp(q[1], dP[1], e2)]; op = 1 - cl((P - 2.33) / 0.12, 0, 1); }
          if (n === 3 || n === 4) { var e3 = cl((P - 5.5) / 0.12, 0, 1); q = [lerp(q[0], n === 3 ? 140 : 156, e3), lerp(q[1], n === 3 ? 230 : 236, e3)]; var e4 = cl((P - 5.85) / 0.12, 0, 1); q = [lerp(q[0], mP[0], e4), lerp(q[1], mP[1], e4)]; op = 1 - cl((P - 5.9) / 0.12, 0, 1); }
          if (n === 5) { op = 1 - cl((P - 0.92) / 0.08, 0, 1); }
          if (op > 0.01 && P > t0) s += virus(q[0], q[1], op, sc);
        });
        /* リンパ節の中 */
        var thA = kf(P, [[3.0, 452, 96], [3.35, 424, 150], [7.0, 424, 150], [7.4, 450, 100]]);
        var thB = kf(P, [[3.6, 424, 150], [3.9, 470, 120], [4.0, 470, 120], [4.3, 548, 182], [5.0, 548, 182], [5.3, 520, 140]]);
        var thC = kf(P, [[3.62, 424, 150], [3.92, 440, 204], [6.0, 440, 204]]);
        var cpy = function (P0) { return P > P0 ? 1 : 0; };
        var fadeEnd = P > 7 ? 1 - cl((P - 7) / 0.35, 0, 1) : 1;
        s += lym(520, 64, 'var(--ask)', 'ヘ', { op: 0.45 }) + lym(566, 108, 'var(--ask)', 'ヘ', { op: 0.45 });
        s += lym(thA[0], thA[1], 'var(--ask)', 'ヘ', { glow: P > 3.35 && P < 3.7 ? 0.9 : 0, mem: cl((P - 7.3) / 0.2, 0, 1) });
        if (cpy(3.6)) s += lym(thB[0], thB[1], 'var(--ask)', 'ヘ', { op: fadeEnd, glow: P > 4.3 && P < 4.5 ? 0.9 : 0 });
        if (cpy(3.62)) s += lym(thC[0], thC[1], 'var(--ask)', 'ヘ', { op: fadeEnd, glow: P > 6.0 && P < 6.2 ? 0.9 : 0 });
        /* B細胞 → 形質細胞 */
        var bGrow = cl((P - 4.5) / 0.3, 0, 1), plOp = P > 6.9 ? 1 - cl((P - 6.9) / 0.4, 0, 1) : 1;
        s += lym(560, 246, 'var(--accent)', 'B', { op: 0.45, rec: 1 });
        var bm = kf(P, [[4.5, 584, 200], [4.8, 520, 236]]);
        if (P > 4.5) s += lym(bm[0], bm[1], 'var(--accent)', 'B', { rec: 1, mem: cl((P - 7.3) / 0.2, 0, 1) });
        var pls = [[584, 200], [600, 150], [598, 244]];
        pls.forEach(function (pp, n) {
          var q = n === 0 ? pp : kf(P, [[4.55, 584, 200], [4.85, pp[0], pp[1]]]);
          if (n > 0 && P < 4.55) return;
          var pl = n === 0 ? bGrow : 1;
          s += lym(q[0], q[1], 'var(--accent)', pl > 0.5 ? '形' : 'B', { r: 14 + 4 * pl, plasma: pl > 0.5, rec: pl < 0.5, glow: n === 0 && P > 4.3 && P < 4.55 ? 0.9 : 0, op: plOp });
        });
        /* 抗体 */
        if (P > 5) for (var k2 = 0; k2 < 12; k2++) {
          var src = pls[k2 % 3], tgt = k2 % 2 ? [140, 230] : [156, 236], st0 = 5.0 + (k2 % 6) * 0.03;
          var aq = kf(P, [[st0, src[0], src[1]], [st0 + 0.12, 482, 296], [st0 + 0.2, 482, 335], [st0 + 0.38, 190, 335], [st0 + 0.5, tgt[0] + Math.cos(k2) * 15, tgt[1] + Math.sin(k2) * 13]]);
          var e5 = cl((P - 5.85) / 0.12, 0, 1); aq = [lerp(aq[0], mP[0], e5), lerp(aq[1], mP[1], e5)];
          var abop = 1 - cl((P - 5.9) / 0.12, 0, 1);
          if (abop > 0) s += ab(aq[0], aq[1], k2 * 30 + (P < st0 + 0.5 ? t * 60 : 0), abop);
        }
        if (P > 6.92 && P < 7.0) {}
        /* キラーT細胞 */
        var tc1 = [430, 244], tcG = P > 6.0 && P < 6.22 ? 0.9 : 0;
        s += lym(tc1[0], tc1[1], 'var(--c1)', 'キ', { glow: tcG, mem: cl((P - 7.3) / 0.2, 0, 1) });
        if (P > 6.2) {
          [0, 1].forEach(function (n) {
            var st1 = 6.22 + n * 0.04;
            var q = kf(P, [[st1, 430, 244], [st1 + 0.1, 470, 300], [st1 + 0.18, 470, 335], [st1 + 0.36, 300, 335], [st1 + 0.5, n ? 282 : 218, 262]]);
            s += lym(q[0], q[1], 'var(--c1)', 'キ', { op: fadeEnd, glow: P > 6.72 && P < 6.9 ? 0.8 : 0 });
          });
        }
        /* ラベル（場面ごと） */
        var i = K.i;
        if (i === 0) lb += lead(K, 84, 30, 140, 58, 'きず口', { a: 'start', fs: 13 }) + (P > 0.5 ? lead(K, 214, 128, 236, 100, '病原体（ウイルス）', { a: 'start', fs: 13, c: 'var(--a-vir)' }) : '') + (P > 0.95 ? lead(K, 250, 244, 276, 222, '感染細胞', { a: 'start', fs: 13 }) : '');
        if (i === 1) lb += lead(K, nP[0], nP[1] + 16, 56, 236, '好中球', { a: 'middle', fs: 13.5 }) + lead(K, mP[0] + 6, mP[1] - 18, 252, 60, 'マクロファージ', { a: 'middle', fs: 13.5 }) + tx(K, 160, 196, '食作用', { a: 'middle', fs: 13, w: 800, c: 'var(--warm)' });
        if (i === 2) lb += lead(K, dP[0], dP[1] - 22, dP[0] - 20, Math.max(56, dP[1] - 50), '樹状細胞', { a: 'middle', fs: 13.5 }) + tx(K, 300, 212, 'リンパ管', { a: 'middle', fs: 12, w: 800, c: 'var(--c3)' });
        if (i === 3) lb += lead(K, 398, 196, 398, 268, '樹状細胞', { a: 'middle', fs: 12.5 }) + tx(K, 414, 110, '抗原提示', { a: 'middle', fs: 13, w: 800, c: 'var(--warm)' }) + tx(K, 446, 160, 'ヘルパーT細胞', { fs: 12.5, w: 800, c: 'var(--ask)' });
        if (i === 4) lb += tx(K, 540, 284, 'B細胞', { a: 'middle', fs: 12.5, w: 800, c: 'var(--accent)' }) + (P > 4.6 ? tx(K, 600, 128, '形質細胞', { a: 'middle', fs: 12.5, w: 800, c: 'var(--accent)' }) : '');
        if (i === 5) lb += tx(K, 520, 120, '抗体を放出', { a: 'middle', fs: 13, w: 800, c: 'var(--a-ab)' }) + (P > 5.45 ? tx(K, 150, 200, '抗原抗体反応', { a: 'middle', fs: 13, w: 800, c: 'var(--a-ab)' }) : tx(K, 300, 316, '抗体', { a: 'middle', fs: 12.5, w: 800, c: 'var(--a-ab)' }));
        if (i === 6) lb += tx(K, 430, 280, 'キラーT細胞', { a: 'middle', fs: 12.5, w: 800, c: 'var(--c1)' }) + (P > 6.7 ? tx(K, 250, 236, '感染細胞を攻撃', { a: 'middle', fs: 13, w: 800, c: 'var(--c1)' }) : '');
        if (i === 7) lb += tx(K, 486, 186, '記憶細胞', { a: 'middle', fs: 14, w: 800, c: 'var(--c5)' });
        return s + lb;
      }
      function top(K) {
        var s = '';
        s += tx(K, 16, 56, 'からだの組織', { fs: 12.5, w: 800, c: 'var(--muted)' });
        s += tx(K, 482, 20, 'リンパ節', { a: 'middle', fs: 13, w: 800, c: 'var(--c6)' });
        s += tx(K, 628, 359, '血管（血液）', { a: 'end', fs: 12, w: 700, c: 'var(--muted)' });
        /* 凡例 */
        var N = K.N, cols = [16, N ? 226 : 230, N ? 436 : 440], rows = [384, 414, 444];
        var L = [['v', '病原体'], ['n', '好中球'], ['m', 'マクロファージ'], ['d', '樹状細胞'], ['h', 'ヘルパーT細胞'], ['k', 'キラーT細胞'], ['b', 'B細胞'], ['p', '形質細胞'], ['a', '抗体']];
        L.forEach(function (l, n) {
          var x = cols[n % 3] + 12, y = rows[Math.floor(n / 3)] - 4, ic = '';
          if (l[0] === 'v') ic = virus(x, y, 1, 0.8);
          if (l[0] === 'n') ic = '<g transform="translate(' + x + ' ' + y + ') scale(.7) translate(' + (-x) + ' ' + (-y) + ')">' + neut(x, y) + '</g>';
          if (l[0] === 'm') ic = '<g transform="translate(' + x + ' ' + y + ') scale(.55) translate(' + (-x) + ' ' + (-y) + ')">' + macro(x, y, 0) + '</g>';
          if (l[0] === 'd') ic = '<g transform="translate(' + x + ' ' + y + ') scale(.5) translate(' + (-x) + ' ' + (-y) + ')">' + dend(x, y, 0) + '</g>';
          if (l[0] === 'h') ic = lym(x, y, 'var(--ask)', 'ヘ', { r: 11 });
          if (l[0] === 'k') ic = lym(x, y, 'var(--c1)', 'キ', { r: 11 });
          if (l[0] === 'b') ic = lym(x, y, 'var(--accent)', 'B', { r: 11 });
          if (l[0] === 'p') ic = lym(x, y, 'var(--accent)', '形', { r: 12, plasma: 1 });
          if (l[0] === 'a') ic = ab(x, y + 1, 0);
          s += ic + tx(K, x + 18, y + 5, l[1], { fs: 12, w: 700 });
        });
        return s;
      }
      return kit(stage, ctl, api, {
        name: '免疫のしくみ', w: 640, h: 456, phases: phases, stat: stat, frame: frame, top: top,
        onStep: function (K) { if (K.i === 3) api.task(1); },
        tick: function (dt, K) { if (K.i === 5) seen.h = 1; if (K.i === 6) seen.c = 1; if (seen.h && seen.c) api.task(2); }
      });
    }
  });

  /* =====================================================================
     5. 腎臓での尿の生成
     ===================================================================== */
  BL.addSim({
    id: 'a-kidney', anim: true, name: '腎臓での尿の生成', cat: 'アニメーション', subj: 'kiso', ic: '腎',
    lead: '糸球体でのろ過、細尿管・集合管での再吸収で、尿ができるようすを粒で見る',
    how: '<p>腎臓には、尿をつくる単位である<b class="key">ネフロン</b>（腎単位）が1つの腎臓に約100万個ある。ネフロンは<b class="key">腎小体</b>（<b class="key">糸球体</b>＋<b class="key">ボーマンのう</b>）と<b class="key">細尿管</b>（腎細管）からなる。</p><div class="box"><b>① ろ過</b>：糸球体の血液のうち、血球やタンパク質以外（水・グルコース・尿素・無機塩類など）がボーマンのうへこし出される → <b class="key">原尿</b><br><b>② 再吸収</b>：細尿管で、グルコースは<b>ふつう100%</b>、水や無機塩類の多くが毛細血管へもどる<br><b>③ 集合管</b>：さらに水が再吸収される。<b class="key">バソプレシン</b>（脳下垂体後葉）は、集合管での水の再吸収を促進する</div><p>原尿は1日に約170 L つくられるが、尿は約1.5 L。水の約99%が再吸収される。再吸収されにくい尿素は濃縮される。</p>',
    pts: [[1, '血球やタンパク質は、ふつうろ過されない'], [1, 'グルコースは、ふつう細尿管で100%再吸収される'], [0, 'バソプレシンは、集合管での水の再吸収をおさえる → ×（促進する）'], [1, '尿素は再吸収されにくく、尿中で濃縮される']],
    tasks: ['尿ができるまで最後まで見る', 'バソプレシン「多い」で、こい尿を見る', 'バソプレシン「少ない」で、うすい尿を見る'],
    slides: [['k3-4', 4]],
    mount: function (stage, ctl, api) {
      var adh = true;
      var phases = [
        { d: 4, h: 'ネフロン（腎単位）', p: '腎臓で尿をつくる単位が<b class="key">ネフロン</b>。<b class="key">糸球体</b>と<b class="key">ボーマンのう</b>（あわせて腎小体）と<b class="key">細尿管</b>からなる。1つの腎臓に約100万個ある。' },
        { d: 6, h: '糸球体でろ過される', p: '血液が<b class="key">糸球体</b>を通るとき、水・グルコース・尿素・無機塩類などが<b class="key">ボーマンのう</b>へこし出される（<b class="key">原尿</b>）。<b>血球とタンパク質</b>は大きいので、ろ過されず血管に残る。' },
        { d: 7, h: '細尿管で再吸収される', p: '原尿が<b class="key">細尿管</b>を流れる間に、必要な物質が毛細血管へもどる（<b class="key">再吸収</b>）。<b>グルコースはふつう100%</b>、水や無機塩類（Na⁺ など）も大部分が再吸収される。尿素はあまり再吸収されない。' },
        { d: 7, h: '集合管で水が再吸収される', p: '<b class="key">集合管</b>でさらに水が再吸収される。脳下垂体後葉から出る<b class="key">バソプレシン</b>が多いと、集合管の水の通り道がふえ、水の再吸収が<b>ふえる</b> → 尿が少なくこくなる。' },
        { d: 5, h: '尿ができる', p: '残ったものが<b>尿</b>になり、腎うへ送られる。原尿 約170 L/日 → 尿 約1.5 L/日（水の約99%を再吸収）。再吸収されにくい<b>尿素</b>は濃くなる（濃縮）。' }];
      var trA = track([[6, 70], [60, 74], [104, 92], [130, 116], [146, 138]]);
      var trE = track([[154, 138], [166, 110], [190, 86], [220, 76], [252, 100], [272, 150], [320, 168], [400, 178], [470, 180], [508, 166], [514, 104], [556, 70], [600, 56], [640, 50]]);
      var trB = track([[150, 156], [166, 178], [184, 192], [196, 196]]);
      var trT = track([[196, 196], [222, 216], [250, 202], [276, 220], [300, 206], [318, 228], [322, 290], [324, 350], [338, 378], [362, 382], [378, 356], [380, 290], [384, 238], [408, 216], [436, 228], [464, 214], [492, 228], [520, 216], [548, 210]]);
      var trD = track([[548, 210], [548, 330], [548, 426]]);
      var trC = track([[598, 446], [598, 100], [608, 70], [640, 54]]);
      var TYPES = ['rbc', 'prot', 'wat', 'wat', 'wat', 'glu', 'urea', 'urea', 'salt', 'rbc'];
      var INT = 0.24, PRE = 40;
      function particle(k, t) {
        var a = t - k * INT, ty = TYPES[Math.floor(hash(k) * TYPES.length)], h2 = hash(k + 3.7), h3 = hash(k + 8.1), h4 = hash(k + 12.9);
        if (a < 0) return null;
        if (a < 1.4) { var q = trA.at(a / 1.4); return [q[0], q[1], ty, 1]; }
        if (a < 2.2) { var ang = (a - 1.4) * 7 + k, r = 18 + 8 * h3; return [150 + Math.cos(ang) * r, 148 + Math.sin(ang) * r * 0.8, ty, 1]; }
        var filt = (ty !== 'rbc' && ty !== 'prot') && h2 < 0.8;
        var VE = trE.len / 6;
        if (!filt) { var sE = (a - 2.2) * VE / trE.len; if (sE > 1) return null; var q2 = trE.at(sE); return [q2[0], q2[1], ty, 1]; }
        if (a < 2.8) { var q3 = trB.at((a - 2.2) / 0.6); return [q3[0], q3[1], ty, 1]; }
        /* 細尿管：再吸収されるか */
        var reab = ty === 'glu' ? 1 : ty === 'wat' ? (h3 < 0.72) : ty === 'salt' ? (h3 < 0.8) : ty === 'urea' ? (h3 < 0.3) : 0;
        var f = ty === 'glu' ? 0.05 + h4 * 0.22 : (h4 < 0.55 ? 0.05 + h4 * 0.42 : 0.68 + (h4 - 0.55) * 0.6);
        var aT = 2.8, dT = 7;
        if (reab && a >= aT + dT * f) {
          var p0 = trT.at(f), sc = trE.near(p0[0], p0[1]), pc = trE.at(sc), ah = a - aT - dT * f;
          if (ah < 0.8) { var e = ease(ah / 0.8); return [lerp(p0[0], pc[0], e), lerp(p0[1], pc[1], e), ty, 1, 1]; }
          var s2 = sc + (ah - 0.8) * VE / trE.len; if (s2 > 1) return null; var q4 = trE.at(s2); return [q4[0], q4[1], ty, 1];
        }
        if (a < aT + dT) { var q5 = trT.at((a - aT) / dT); return [q5[0], q5[1], ty, 1]; }
        /* 集合管 */
        var aD = aT + dT, dD = 3.2, ad = a - aD, fd = 0.1 + h2 * 0.5;
        var reabD = ty === 'wat' && (adh ? h4 > 0.12 : h4 > 0.85);
        if (reabD && ad >= dD * fd) {
          var p1 = trD.at(fd), s3 = trC.near(598, p1[1]), pc2 = trC.at(s3), ah2 = ad - dD * fd;
          if (ah2 < 0.7) { var e2 = ease(ah2 / 0.7); return [lerp(p1[0], pc2[0], e2), lerp(p1[1], pc2[1], e2), ty, 1, 1]; }
          var s4 = s3 + (ah2 - 0.7) * 0.25; if (s4 > 1) return null; var q6 = trC.at(s4); return [q6[0], q6[1], ty, 1];
        }
        if (ad < dD) { var q7 = trD.at(ad / dD); return [q7[0], q7[1], ty, 1]; }
        return null;
      }
      function icon(ty, x, y, K) {
        x = f1(x); y = f1(y);
        if (ty === 'rbc') return '<ellipse cx="' + x + '" cy="' + y + '" rx="7" ry="5.5" fill="var(--a-art)" stroke="var(--panel)" stroke-width="1"/><ellipse cx="' + x + '" cy="' + y + '" rx="3" ry="2" fill="color-mix(in srgb, var(--a-art) 60%, #000)" opacity=".4"/>';
        if (ty === 'prot') return '<path transform="translate(' + x + ' ' + y + ')" d="M-7 -2 C-7 -7 -1 -8 2 -5 C6 -8 9 -3 6 1 C9 5 3 9 0 6 C-3 9 -9 5 -6 1Z" fill="var(--a-prot)" stroke="var(--panel)" stroke-width="1"/>';
        if (ty === 'glu') return '<path transform="translate(' + x + ' ' + y + ')" d="M-6 0 L-3 -5.2 L3 -5.2 L6 0 L3 5.2 L-3 5.2Z" fill="var(--a-glu)" stroke="var(--panel)" stroke-width="1"/>';
        if (ty === 'wat') return '<path transform="translate(' + x + ' ' + y + ')" d="M0 -6 C3 -2 5 1 5 3 A5 5 0 0 1 -5 3 C-5 1 -3 -2 0 -6Z" fill="var(--a-wat)" stroke="var(--panel)" stroke-width="1"/>';
        if (ty === 'urea') return '<rect x="' + f1(x - 4.5) + '" y="' + f1(y - 4.5) + '" width="9" height="9" rx="2" transform="rotate(45 ' + x + ' ' + y + ')" fill="var(--a-urea)" stroke="var(--panel)" stroke-width="1"/>';
        return '<circle cx="' + x + '" cy="' + y + '" r="4.5" fill="var(--a-salt)" stroke="var(--panel)" stroke-width="1"/>';
      }
      function tube(tr, w, fill, edge, a, b) { var d = tr.d(a, b); return '<path d="' + d + '" fill="none" stroke="' + edge + '" stroke-width="' + (w + 4) + '" stroke-linecap="round" stroke-linejoin="round"/><path d="' + d + '" fill="none" stroke="' + fill + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
      function stat(K) {
        var s = '';
        var cap = tint('var(--a-art)', 30), capE = tint('var(--a-art)', 70);
        s += tube(trC, 14, cap, capE) + tube(trE, 14, cap, capE) + tube(trA, 16, cap, capE);
        /* ボーマンのう */
        s += '<circle cx="150" cy="150" r="58" fill="var(--a-tub)" stroke="var(--a-tubd)" stroke-width="5"/>';
        s += '<path d="M126 96 Q150 88 174 96" stroke="var(--panel)" stroke-width="9" fill="none"/>';
        s += tube(trT, 18, 'var(--a-tub)', 'var(--a-tubd)') + tube(trD, 24, 'var(--a-tub)', 'var(--a-tubd)');
        /* 糸球体 */
        for (var k = 0; k < 8; k++) { var a = k * 0.785; s += '<circle cx="' + f1(150 + Math.cos(a) * 18) + '" cy="' + f1(148 + Math.sin(a) * 16) + '" r="13" fill="none" stroke="' + capE + '" stroke-width="7"/><circle cx="' + f1(150 + Math.cos(a) * 18) + '" cy="' + f1(148 + Math.sin(a) * 16) + '" r="13" fill="none" stroke="' + cap + '" stroke-width="4"/>'; }
        return s;
      }
      function frame(K) {
        var i = K.i, u = K.u, s = '', t = K.t + PRE;
        /* 強調 */
        var gl = 'var(--a-glow)', pulse = 0.55 + 0.35 * Math.sin(K.t * 4);
        if (i === 1) s += '<circle cx="150" cy="150" r="70" fill="none" stroke="' + gl + '" stroke-width="16" opacity="' + f1(pulse) + '"/>';
        if (i === 2) s += '<path d="' + trT.d() + '" fill="none" stroke="' + gl + '" stroke-width="40" stroke-linecap="round" stroke-linejoin="round" opacity="' + f1(pulse) + '"/>';
        if (i === 3) s += '<path d="M548 210 V424" stroke="' + gl + '" stroke-width="46" stroke-linecap="round" opacity="' + f1(pulse) + '"/>';
        if (i === 4) s += '<circle cx="548" cy="432" r="26" fill="' + gl + '" opacity="' + f1(pulse) + '"/>';
        /* 水の通り道（アクアポリン） */
        var nAq = adh ? 7 : 2;
        for (var k = 0; k < nAq; k++) s += '<rect x="558" y="' + (238 + k * 28) + '" width="9" height="14" rx="2" fill="var(--a-wat)" opacity=".85"/>';
        if (adh) for (var k2 = 0; k2 < 4; k2++) { var yy = 440 - ((K.t * 30 + k2 * 100) % 400); s += '<path transform="translate(598 ' + f1(yy) + ')" d="M-7 0 L-3.5 -6 L3.5 -6 L7 0 L3.5 6 L-3.5 6Z" fill="var(--c6)" opacity=".85"/>'; }
        /* 粒 */
        var k0 = Math.max(0, Math.floor((t - 16) / INT)), k1 = Math.floor(t / INT);
        for (var k3 = k0; k3 <= k1; k3++) { var p = particle(k3, t); if (p) s += icon(p[2], p[0], p[1], K); }
        /* 尿 */
        var deep = adh ? 'var(--a-uri)' : tint('var(--a-uri)', 35);
        s += '<path transform="translate(548 440)" d="M0 -12 C5 -5 9 0 9 5 A9 9 0 0 1 -9 5 C-9 0 -5 -5 0 -12Z" fill="' + deep + '" stroke="var(--a-tubd)" stroke-width="1.2"/>';
        return s;
      }
      function top(K) {
        var s = '';
        s += tx(K, 8, 56, '輸入細動脈', { fs: 12.5, w: 800 });
        s += tx(K, 208, 62, '輸出細動脈', { fs: 12.5, w: 800 });
        s += lead(K, 136, 150, 80, 150, '糸球体', { a: 'end', fs: 13 });
        s += lead(K, 112, 194, 72, 236, 'ボーマンのう', { a: 'middle', fs: 13 });
        s += lead(K, 250, 208, 230, 270, '細尿管（腎細管）', { a: 'middle', fs: 13 });
        s += tx(K, 410, 156, '毛細血管', { a: 'middle', fs: 12.5, w: 800, c: 'var(--a-art)' });
        s += lead(K, 538, 300, 470, 300, '集合管', { a: 'end', fs: 13 });
        s += tx(K, 636, 38, '腎静脈へ', { a: 'end', fs: 12, w: 700, c: 'var(--muted)' });
        s += tx(K, 562, 448, '尿', { a: 'start', fs: 13, w: 800 });
        s += tx(K, 618, 300, 'バソプレシン', { a: 'end', fs: 11.5, w: 800, c: 'var(--c6)', op: adh ? 1 : 0 }).replace('<text ', '<text transform="rotate(-90 618 300)" ').replace('x="618" y="300"', 'x="680" y="304"').replace('text-anchor="end"', 'text-anchor="middle"');
        /* 凡例 */
        var L = [['rbc', '血球'], ['prot', 'タンパク質'], ['glu', 'グルコース'], ['wat', '水'], ['urea', '尿素'], ['salt', '無機塩類']];
        var x = 14, y = 412, N = K.N;
        L.forEach(function (l, n) {
          if (n === 3) { x = 14; y = 440; }
          s += icon(l[0], x + 6, y - 5, K) + tx(K, x + 16, y, l[1], { fs: 12, w: 700 });
          x += (l[1].length * (N ? 16.6 : 12) + 34);
        });
        return s;
      }
      return kit(stage, ctl, api, {
        name: '腎臓での尿の生成', w: 640, h: 452, phases: phases, stat: stat, frame: frame, top: top, topDyn: true,
        capExtra: function (K) { return K.i >= 3 ? '<div style="margin-top:4px;font-size:.92em">いま：バソプレシン <b>' + (adh ? '多い → 尿は少なく、こい' : '少ない → 尿は多く、うすい') + '</b></div>' : ''; },
        tick: function (dt, K) { if (K.i >= 3) api.task(adh ? 1 : 2); },
        extra: function (c2) {
          BL.ui.seg(c2, 'バソプレシン', [[true, '多い（水分が不足）'], [false, '少ない（水を多く飲んだ）']], adh, function (v) { adh = v; });
        }
      });
    }
  });

  /* =====================================================================
     6. 光合成と呼吸（物質とエネルギー）
     ===================================================================== */
  BL.addSim({
    id: 'a-photoresp', anim: true, name: '光合成と呼吸（物質とエネルギー）', cat: 'アニメーション', subj: 'kiso', ic: '光',
    lead: '葉緑体で光のエネルギーから有機物ができ、ミトコンドリアでその有機物から ATP ができるまでを、物質の動きで見る',
    how: '<p><b class="key">光合成</b>（葉緑体）：光エネルギーを使って、CO<sub>2</sub> と H<sub>2</sub>O から有機物（グルコースなど）をつくる。</p><ul><li><b>チラコイド</b>：クロロフィルが光を吸収 → 水が分解されて O<sub>2</sub> が発生、ATP と NADPH ができる</li><li><b>ストロマ</b>：<b class="key">カルビン回路</b>で、ATP と NADPH を使って CO<sub>2</sub> から有機物をつくる</li></ul><p><b class="key">呼吸</b>：酸素を使って有機物を分解し、ATP をつくる。</p><ul><li><b class="key">解糖系</b>（細胞質基質）：グルコース → ピルビン酸 2 分子（2ATP）</li><li><b class="key">クエン酸回路</b>（ミトコンドリアのマトリックス）：CO<sub>2</sub> が出る。NADH などができる（2ATP）</li><li><b class="key">電子伝達系</b>（ミトコンドリアの内膜）：NADH などの電子で O<sub>2</sub> が H<sub>2</sub>O になり、多くの ATP（最大 34ATP）ができる</li></ul><div class="box">物質（C・O など）は光合成と呼吸の間を<b>循環</b>するが、エネルギーは 光 → 化学エネルギー → ATP → 熱 と<b>一方向</b>に流れる。</div>',
    pts: [[1, '光合成で発生する O₂ は、水の分解でできる'], [1, 'カルビン回路はストロマで行われる'], [0, '解糖系はミトコンドリアのマトリックスで行われる → ×（細胞質基質）'], [1, '電子伝達系で最も多くの ATP ができる'], [0, 'エネルギーも物質と同じように生態系を循環する → ×（一方向）']],
    tasks: ['まとめ（物質の循環）まで最後まで見る', '1コマずつ進めて、電子伝達系の場面を見る', '×2 で全体の流れをもう一度見る'],
    slides: [['k1-5', 2], ['k1-5', 3], ['b2-3', 1], ['b2-4', 1]],
    mount: function (stage, ctl, api) {
      var phases = [
        { d: 4, h: '光エネルギーの吸収（チラコイド）', p: '葉緑体の<b class="key">チラコイド</b>の膜にある<b>クロロフィル</b>などの色素が、光エネルギーを吸収する。' },
        { d: 6, h: '水の分解・ATP と NADPH（チラコイド）', p: '光のエネルギーで<b>水（H<sub>2</sub>O）が分解</b>され、<b>O<sub>2</sub> が発生</b>する。このとき<b>ATP</b> と <b>NADPH</b> ができ、ストロマへ送られる。' },
        { d: 6, h: 'カルビン回路で有機物をつくる（ストロマ）', p: '<b class="key">ストロマ</b>の<b class="key">カルビン回路</b>で、ATP と NADPH のエネルギーを使い、CO<sub>2</sub> から<b>有機物（グルコースなど）</b>をつくる。光エネルギー → 化学エネルギー。' },
        { d: 5, h: '解糖系（細胞質基質）', p: '呼吸の1段階め。<b class="key">細胞質基質</b>で、グルコース1分子が<b>ピルビン酸</b>2分子に分解される（<b class="key">解糖系</b>）。差し引き <b>2ATP</b> ができる。O<sub>2</sub> は使わない。' },
        { d: 6, h: 'クエン酸回路（マトリックス）', p: 'ピルビン酸はミトコンドリアの<b class="key">マトリックス</b>に入り、<b class="key">クエン酸回路</b>で分解される。<b>CO<sub>2</sub> が出る</b>。電子を運ぶ NADH などができ、<b>2ATP</b> ができる。' },
        { d: 6, h: '電子伝達系（内膜）', p: 'ミトコンドリアの<b class="key">内膜</b>の<b class="key">電子伝達系</b>で、NADH などの電子が受けわたされ、最後に <b>O<sub>2</sub> と結びついて H<sub>2</sub>O</b> になる。このとき<b>最も多くの ATP</b>（最大 34ATP）ができる。合計 最大 38ATP。' },
        { d: 6, h: 'まとめ：物質は循環、エネルギーは一方向', p: 'O<sub>2</sub>・CO<sub>2</sub>・H<sub>2</sub>O は光合成と呼吸の間を<b>循環</b>する。エネルギーは 光 → 有機物（化学エネルギー）→ ATP → 生命活動 → <b>熱</b>として出ていき、もどらない（<b>一方向</b>）。' }];
      var CH = [176, 206], MT = [494, 204], CAL = [252, 222], TCA = [466, 206], GLY = [330, 380], GR = [[92, 196], [160, 156], [150, 256]];
      var C = { h2o: 'var(--a-wat)', o2: 'var(--c3)', co2: 'var(--muted)', glu: 'var(--a-glu)', pyr: 'var(--c5)', atp: 'var(--a-atp)', nadph: 'var(--leaf2)', nadh: 'var(--c6)' };
      function M(K, x, y, s, c, op) { return pill(K, x, y, s, c, { fs: 10.5, op: op }); }
      function cyc(K, x, y, r, t, on, c, l1, l2) {
        var s = '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="none" stroke="' + c + '" stroke-width="3" stroke-dasharray="10 6" stroke-dashoffset="' + f1(on ? -t * 22 : 0) + '" opacity="' + (on ? 1 : 0.6) + '"/>';
        var a = on ? t * 1.6 : 0.8;
        s += '<path d="M' + f1(x + Math.cos(a) * r) + ' ' + f1(y + Math.sin(a) * r) + ' l' + f1(Math.cos(a + 1.9) * 9) + ' ' + f1(Math.sin(a + 1.9) * 9) + ' l' + f1(Math.cos(a - 0.3) * 9) + ' ' + f1(Math.sin(a - 0.3) * 9) + 'z" fill="' + c + '"/>';
        s += tx(K, x, y - 2, l1, { a: 'middle', fs: 11.5, w: 800, c: c }) + tx(K, x, y + K.fs(11.5) - 1, l2, { a: 'middle', fs: 11.5, w: 800, c: c });
        return s;
      }
      function stat(K) {
        var s = '';
        s += '<rect x="8" y="64" width="624" height="368" rx="28" fill="var(--cyto)" stroke="var(--a-mem)" stroke-width="3"/>';
        /* 葉緑体 */
        s += '<ellipse cx="' + CH[0] + '" cy="' + CH[1] + '" rx="150" ry="104" fill="var(--a-str)" stroke="var(--a-chld)" stroke-width="3"/><ellipse cx="' + CH[0] + '" cy="' + CH[1] + '" rx="143" ry="97" fill="none" stroke="var(--a-chld)" stroke-width="1.5"/>';
        s += '<path d="M92 196 L160 156 M92 196 L150 256 M160 156 L150 256" stroke="var(--a-thy)" stroke-width="3" opacity=".6"/>';
        GR.forEach(function (g) { for (var k = 0; k < 5; k++) s += '<rect x="' + (g[0] - 22) + '" y="' + (g[1] - 20 + k * 8) + '" width="44" height="7" rx="3.5" fill="var(--a-chl)" stroke="var(--a-chld)" stroke-width="1"/>'; });
        /* ミトコンドリア */
        s += '<ellipse cx="' + MT[0] + '" cy="' + MT[1] + '" rx="128" ry="88" fill="var(--a-mit)" stroke="var(--a-mitd)" stroke-width="3"/>';
        var d = 'M374 204';
        for (var k2 = 0; k2 <= 40; k2++) { var a = Math.PI - k2 / 40 * Math.PI * 2, rx = 116, ry = 76, x = MT[0] + Math.cos(a) * rx, y = MT[1] + Math.sin(a) * ry; d += ' L' + f1(x) + ' ' + f1(y); }
        s += '<path d="' + d + 'Z" fill="var(--a-mat)" stroke="var(--a-mitd)" stroke-width="2"/>';
        /* クリステ */
        [[410, 140, 1], [440, 130, 1], [530, 130, 1], [560, 140, 1], [410, 268, -1], [440, 278, -1], [530, 278, -1], [560, 268, -1]].forEach(function (c) { s += '<path d="M' + (c[0] - 7) + ' ' + c[1] + ' L' + (c[0] - 5) + ' ' + (c[1] + c[2] * 34) + ' Q' + c[0] + ' ' + (c[1] + c[2] * 42) + ' ' + (c[0] + 5) + ' ' + (c[1] + c[2] * 34) + ' L' + (c[0] + 7) + ' ' + c[1] + '" fill="var(--a-mit)" stroke="var(--a-mitd)" stroke-width="2" stroke-linejoin="round"/>'; });
        /* 太陽 */
        s += '<circle cx="40" cy="34" r="18" fill="var(--a-sun)"/>';
        for (var k3 = 0; k3 < 8; k3++) { var a3 = k3 * 0.785; s += '<line x1="' + f1(40 + Math.cos(a3) * 23) + '" y1="' + f1(34 + Math.sin(a3) * 23) + '" x2="' + f1(40 + Math.cos(a3) * 30) + '" y2="' + f1(34 + Math.sin(a3) * 30) + '" stroke="var(--a-sun)" stroke-width="3" stroke-linecap="round"/>'; }
        return s;
      }
      function frame(K) {
        var i = K.i, u = K.u, t = K.t, P = i + u, s = '';
        /* 光 */
        var lit = i <= 2 || i === 6;
        GR.forEach(function (g, n) {
          if (lit) s += '<line x1="56" y1="50" x2="' + g[0] + '" y2="' + (g[1] - 16) + '" stroke="var(--a-sun)" stroke-width="3" stroke-dasharray="8 7" stroke-dashoffset="' + f1(-t * 30) + '" opacity="' + (i === 0 ? 0.95 : 0.45) + '"/>';
          if (i === 0 || i === 1) s += '<ellipse cx="' + g[0] + '" cy="' + g[1] + '" rx="34" ry="28" fill="var(--a-glow)" opacity="' + f1(i === 0 ? ease(u) * 0.9 : 0.5) + '"/>';
        });
        /* 回路 */
        s += cyc(K, CAL[0], CAL[1], 36, t, i === 2, 'var(--a-chld)', 'カルビン', '回路');
        s += cyc(K, TCA[0], TCA[1], 34, t, i === 4, 'var(--a-mitd)', 'クエン酸', '回路');
        /* 電子伝達系（内膜上の複合体） */
        var etc = [[574, 150], [596, 190], [592, 236], [566, 270]];
        etc.forEach(function (e, n) { s += '<rect x="' + (e[0] - 7) + '" y="' + (e[1] - 9) + '" width="14" height="18" rx="4" fill="var(--c6)" opacity="' + (i === 5 ? 1 : 0.55) + '" transform="rotate(' + (n * 30 - 40) + ' ' + e[0] + ' ' + e[1] + ')"/>'; });
        if (i === 5) for (var k = 0; k < 4; k++) { var g = ((t * 0.7 + k * 0.25) % 1), idx = Math.floor(g * 3), e1 = etc[idx], e2 = etc[idx + 1], f = g * 3 - idx; s += '<circle cx="' + f1(lerp(e1[0], e2[0], f) - 14) + '" cy="' + f1(lerp(e1[1], e2[1], f)) + '" r="4" fill="var(--a-sun)" stroke="var(--panel)"/>'; }
        /* 解糖系 */
        if (i !== 6) s += '<path d="M282 ' + GLY[1] + ' H392" stroke="var(--warm)" stroke-width="2.5" stroke-dasharray="' + (i === 3 ? '6 5' : '0') + '" stroke-dashoffset="' + f1(-t * 20) + '" opacity="' + (i === 3 ? 1 : 0.4) + '" marker-end="url(#' + K.uid + 'p)"/>';
        /* 分子の動き（場面ごと） */
        if (i === 1) {
          var a = ease(seg01(u, 0, 0.3));
          s += M(K, lerp(30, GR[0][0] - 20, a), lerp(330, GR[0][1] + 30, a), 'H₂O', C.h2o, 1 - seg01(u, 0.32, 0.4));
          var b = ease(seg01(u, 0.35, 0.8));
          if (u > 0.33) s += M(K, lerp(GR[0][0], 300, b), lerp(GR[0][1] - 10, 96, b), 'O₂', C.o2);
          var c2 = ease(seg01(u, 0.45, 0.95));
          if (u > 0.42) s += M(K, lerp(GR[0][0] + 20, CAL[0] - 30, c2), lerp(GR[0][1] + 18, CAL[1] + 42, c2), 'ATP', C.atp) + M(K, lerp(GR[1][0] + 10, CAL[0] - 20, c2), lerp(GR[1][1] + 24, CAL[1] - 46, c2), 'NADPH', C.nadph);
        }
        if (i === 2) {
          var a2 = ease(seg01(u, 0, 0.4));
          s += M(K, lerp(256, CAL[0], a2), lerp(70, CAL[1] - 30, a2), 'CO₂', C.co2, 1 - seg01(u, 0.4, 0.48));
          s += M(K, CAL[0] - 30, CAL[1] + 42, 'ATP', C.atp, 1 - seg01(u, 0.2, 0.45)) + M(K, CAL[0] - 20, CAL[1] - 46, 'NADPH', C.nadph, 1 - seg01(u, 0.2, 0.45));
          var b2 = ease(seg01(u, 0.55, 1));
          if (u > 0.5) s += M(K, lerp(CAL[0] + 20, 296, b2), lerp(CAL[1] + 28, 318, b2), 'グルコース', C.glu);
        }
        if (i === 3) {
          var a3 = ease(seg01(u, 0, 0.3));
          if (u < 0.45) s += M(K, lerp(296, GLY[0] - 30, a3), lerp(318, GLY[1] - 18, a3), 'グルコース', C.glu, 1 - seg01(u, 0.38, 0.45));
          var b3 = ease(seg01(u, 0.45, 1));
          if (u > 0.4) { s += M(K, lerp(GLY[0], 420, b3), lerp(GLY[1] - 18, 300, b3), 'ピルビン酸', C.pyr) + M(K, lerp(GLY[0], 444, b3), lerp(GLY[1] + 16, 326, b3), 'ピルビン酸', C.pyr); }
          if (u > 0.5) s += M(K, GLY[0] - 10, lerp(GLY[1] + 22, GLY[1] + 8, seg01(u, 0.5, 1)), '2ATP', C.atp, 1 - seg01(u, 0.85, 1));
        }
        if (i === 4) {
          var a4 = ease(seg01(u, 0, 0.3));
          s += M(K, lerp(420, TCA[0] - 20, a4), lerp(300, TCA[1] + 30, a4), 'ピルビン酸', C.pyr, 1 - seg01(u, 0.3, 0.38));
          var b4 = ease(seg01(u, 0.4, 0.95));
          if (u > 0.38) { s += M(K, lerp(TCA[0], 380, b4), lerp(TCA[1] - 34, 84, b4), 'CO₂', C.co2) + M(K, lerp(TCA[0] + 30, 552, b4), lerp(TCA[1], TCA[1] - 40, b4), 'NADH', C.nadh) + M(K, lerp(TCA[0] + 20, 548, b4), lerp(TCA[1] + 20, TCA[1] + 42, b4), 'NADH', C.nadh); }
          if (u > 0.5) s += M(K, TCA[0], lerp(TCA[1] + 50, TCA[1] + 40, seg01(u, 0.5, 1)), '2ATP', C.atp, 1 - seg01(u, 0.85, 1));
        }
        if (i === 5) {
          s += M(K, 552, TCA[1] - 40, 'NADH', C.nadh, 1 - seg01(u, 0.1, 0.3)) + M(K, 548, TCA[1] + 42, 'NADH', C.nadh, 1 - seg01(u, 0.1, 0.3));
          var a5 = ease(seg01(u, 0, 0.5));
          s += M(K, lerp(300, 548, a5), lerp(96, 236, a5), 'O₂', C.o2, 1 - seg01(u, 0.5, 0.56));
          if (u > 0.52) s += M(K, lerp(548, 540, seg01(u, 0.52, 1)), lerp(236, 262, seg01(u, 0.52, 1)), 'H₂O', C.h2o);
          for (var k5 = 0; k5 < 6; k5++) { var st = 0.3 + k5 * 0.08, g5 = seg01(u, st, st + 0.3); if (g5 > 0 && g5 < 1) s += M(K, 588 - (k5 % 3) * 30 - g5 * 20, 262 + g5 * 50 + (k5 % 2) * 10, 'ATP', C.atp, 1 - seg01(g5, 0.7, 1)); }
          if (u > 0.4) s += tx(K, 500, 330, '最大 34ATP', { a: 'middle', fs: 13, w: 800, c: C.atp });
        }
        if (i === 6) {
          var mk = 'url(#' + K.uid + 'p)';
          s += '<path d="M300 128 C330 72 392 72 408 130" fill="none" stroke="' + C.o2 + '" stroke-width="3" marker-end="' + mk + '"/>';
          s += '<path d="M440 300 C400 338 350 342 296 286" fill="none" stroke="' + C.co2 + '" stroke-width="3" marker-end="' + mk + '"/>';
          var g6 = (t * 0.35) % 1;
          var q1 = [lerp(300, 408, g6), 129 - Math.sin(g6 * Math.PI) * 43], q2 = [lerp(440, 296, g6), 300 + Math.sin(g6 * Math.PI) * 36];
          var g7 = (g6 + 0.5) % 1;
          s += '<path d="M452 292 C420 380 320 380 290 300" fill="none" stroke="' + C.h2o + '" stroke-width="2.5" stroke-dasharray="6 5" marker-end="' + mk + '"/>';
          s += M(K, q1[0], q1[1], 'O₂', C.o2) + M(K, q2[0], q2[1], 'CO₂', C.co2) + M(K, lerp(446, 296, g7), 300 + Math.sin(g7 * Math.PI) * 62, 'H₂O', C.h2o);
          var y6 = 412, items = ['光', '有機物', 'ATP', '生命活動', '熱'], xs = K.N ? [40, 140, 268, 388, 560] : [60, 170, 290, 410, 560];
          items.forEach(function (it, n) { s += pill(K, xs[n], y6, it, n === 0 ? 'var(--a-sun)' : n === 4 ? 'var(--warm)' : n === 1 ? C.glu : n === 2 ? C.atp : 'var(--accent)', { fs: 11.5, tc: n === 0 ? '#5a3c00' : '#fff' }); if (n < 4) s += '<line x1="' + (xs[n] + (K.N ? 30 : 26)) + '" y1="' + y6 + '" x2="' + (xs[n + 1] - (K.N ? 44 : 36)) + '" y2="' + y6 + '" stroke="var(--warm)" stroke-width="2.5" marker-end="' + mk + '"/>'; });
        }
        return '<defs>' + arrowDef(K.uid + 'p', 'var(--warm)') + '</defs>' + s;
      }
      function top(K) {
        var s = '', i = K.i;
        s += tx(K, 66, 30, '光', { fs: 14, w: 800, c: 'var(--c5)' }).replace('x="66"', 'x="68"');
        s += tx(K, 176, 92, '葉緑体', { a: 'middle', fs: 14, w: 800, c: 'var(--a-chld)' });
        s += tx(K, 530, 106, 'ミトコンドリア', { a: 'middle', fs: 14, w: 800, c: 'var(--a-mitd)' });
        s += lead(K, 92, 214, 70, 280, 'チラコイド', { a: 'middle', fs: 12, c: 'var(--a-chld)' });
        s += tx(K, 216, 290, 'ストロマ', { a: 'middle', fs: 12, w: 800, c: 'var(--a-chld)' });
        s += tx(K, 466, 262, 'マトリックス', { a: 'middle', fs: 11.5, w: 800, c: 'var(--a-mitd)' });
        s += lead(K, 600, 214, 624, 362, '内膜（電子伝達系）', { a: 'end', fs: 12, c: 'var(--c6)' });
        s += tx(K, GLY[0] + 4, GLY[1] + 30, '解糖系', { a: 'middle', fs: 13, w: 800, c: 'var(--warm)', op: i === 6 ? 0 : 1 });
        s += tx(K, 24, 424, '細胞質基質', { fs: 12, w: 800, c: 'var(--muted)', op: i === 6 ? 0 : 1 });
        return s;
      }
      return kit(stage, ctl, api, {
        name: '光合成と呼吸', w: 640, h: 440, phases: phases, stat: stat, frame: frame, top: top, topDyn: true,
        onStep: function (K) { if (K.i === 5) api.task(1); },
        tick: function (dt, K) { if (K.i === 6 && dt > 0 && fast()) api.task(2); }
      });
      function fast() { var b = [].filter.call(ctl.querySelectorAll('.seg button'), function (x) { return x.textContent === '×2'; })[0]; return b && b.getAttribute('aria-pressed') === 'true'; }
    }
  });
})();
