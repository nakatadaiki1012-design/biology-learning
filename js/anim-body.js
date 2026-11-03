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
    var bPlay = BL.ui.btn(r1, '❚❚ 一時停止', function () { if (st.done) { restart(); return; } setPlay(!st.play); }, 'main');
    BL.ui.btn(r1, '◀ 1コマもどる', function () { var i = phaseAt(st.t); var to = (st.t - starts[i] < 0.6 && i > 0) ? i - 1 : i; jump(to, true); });
    BL.ui.btn(r1, '1コマすすむ ▶', function () { var i = phaseAt(st.t); jump(Math.min(ph.length - 1, i + 1), true); o.onStep && o.onStep(); });
    BL.ui.btn(r1, '⟲ はじめから', function () { restart(); });
    var cap = BL.ui.box(ctl, 'info', '');
    var segPh = BL.ui.seg(ctl, '場面', ph.map(function (p, i) { return [i, String(i + 1)]; }), 0, function (v) { jump(v, true); });
    BL.ui.seg(ctl, '速さ', [[0.5, '×0.5'], [1, '×1'], [2, '×2']], 1, function (v) { st.sp = v; });
    var api2 = { jump: jump, redraw: function () { g0.innerHTML = o.stat ? o.stat(K) : ''; g2.innerHTML = o.top ? o.top(K) : ''; lastI = -1; render(); }, K: K, st: st, starts: starts };
    if (o.extra) o.extra(ctl, api2);
    function phaseAt(t) { for (var i = ph.length - 1; i > 0; i--) if (t >= starts[i] - 1e-6) return i; return 0; }
    function setPlay(v) { st.play = v; st.done = false; bPlay.innerHTML = v ? '❚❚ 一時停止' : '▶ 再生'; bPlay.setAttribute('aria-pressed', String(!v)); }
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
    var f = K.fs(o.fs || 12), w = (o.wd || s.replace(/<[^>]+>/g, '').length * 0.62 + 1) * f, h = f * 1.5;
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
        var g = (K.t * 0.5) % 1;
        s += gas(K, 250, 74, 'O<tspan font-size="70%" dy="3">2</tspan>', 1, g) + gas(K, 372, 74, 'CO<tspan font-size="70%" dy="3">2</tspan>', -1, g);
        s += gas(K, 270, 512, 'O<tspan font-size="70%" dy="3">2</tspan>', 1, g) + gas(K, 400, 512, 'CO<tspan font-size="70%" dy="3">2</tspan>', -1, g);
        return s;
      }
      function gas(K, x, y, t, dir, g) {
        var dy = dir * (g * 22 - 11), op = Math.sin(Math.PI * g);
        return '<text x="' + x + '" y="' + f1(y + dy) + '" font-size="' + K.fs(11) + '" font-weight="700" text-anchor="middle" fill="var(--ask)" opacity="' + f1(op) + '">' + t + (dir > 0 ? '↓' : '↑') + '</text>';
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
})();
