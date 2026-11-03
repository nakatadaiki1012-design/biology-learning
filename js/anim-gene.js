/* 見る：アニメーション（DNA の複製・転写と翻訳・体細胞分裂・減数分裂・膜輸送）
   どれも SVG を BL.loop で描きなおす。色は CSS 変数（明るい画面・暗い画面の両方で見える）。 */
(function () {
  /* ---------- 小さな道具 ---------- */
  function N(v) { return Math.round(v * 10) / 10; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function seg(u, a, b) { return clamp((u - a) / (b - a), 0, 1); }
  function es(u, a, b) { return ease(seg(u, a, b)); }
  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
  /* 点の列をなめらかな曲線に（Catmull-Rom） */
  function smooth(P, closed) {
    var n = P.length; if (n < 2) return '';
    var d = 'M' + N(P[0][0]) + ' ' + N(P[0][1]);
    var m = closed ? n : n - 1;
    function p(i) { return closed ? P[(i + n) % n] : P[clamp(i, 0, n - 1)]; }
    for (var i = 0; i < m; i++) {
      var p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
      d += 'C' + N(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + N(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + N(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + N(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + N(p2[0]) + ' ' + N(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }
  function poly(P) { return P.map(function (p, i) { return (i ? 'L' : 'M') + N(p[0]) + ' ' + N(p[1]); }).join(''); }

  var F = 1; /* 文字の倍率（スマホで大きく） */
  function tx(x, y, s, o) {
    o = o || {};
    if (o.op != null && o.op <= 0.01) return '';
    return '<text x="' + N(x) + '" y="' + N(y) + '" font-size="' + N((o.s || 14) * F) + '"' + (o.a ? ' text-anchor="' + o.a + '"' : '') + ' font-weight="' + (o.w || 700) + '" fill="' + (o.c || 'var(--ink)') + '"' +
      (o.h === false ? '' : ' paint-order="stroke" stroke="var(--panel)" stroke-width="' + N(4 * F) + '" stroke-linejoin="round"') + (o.op != null && o.op < 1 ? ' opacity="' + o.op.toFixed(2) + '"' : '') + '>' + s + '</text>';
  }
  /* 引き出し線つきのラベル：(px,py) を指し、(x,y) に文字。a は文字のそろえ方 */
  function lab(px, py, x, y, s, o) {
    o = o || {}; var op = o.op == null ? 1 : o.op; if (op <= 0.01) return '';
    var a = o.a || 'start', sz = (o.s || 14) * F, w = s.replace(/<[^>]*>/g, '').length * sz * 0.98;
    var lx = a === 'start' ? x - 3 : a === 'end' ? x + 3 : x, ly = y - sz * 0.35;
    if (a === 'middle') ly = py < y ? y - sz * 0.95 : y + sz * 0.3;
    var c = o.lc || 'var(--ink)';
    var bx = o.box ? '<rect x="' + N(a === 'start' ? x - 5 : a === 'end' ? x - w - 5 : x - w / 2 - 5) + '" y="' + N(y - sz * 1.05) + '" width="' + N(w + 10) + '" height="' + N(sz * 1.45) + '" rx="4" fill="var(--panel)" stroke="var(--line)"/>' : '';
    return '<g opacity="' + op.toFixed(2) + '"><line x1="' + N(px) + '" y1="' + N(py) + '" x2="' + N(lx) + '" y2="' + N(ly) + '" stroke="' + c + '" stroke-width="1.2"/><circle cx="' + N(px) + '" cy="' + N(py) + '" r="2.6" fill="' + c + '"/>' + bx + tx(x, y, s, { s: o.s, a: a, c: o.c }) + '</g>';
  }
  function arrowHead(x, y, ang, sz, c) {
    var a1 = ang + 2.6, a2 = ang - 2.6;
    return '<path d="M' + N(x) + ' ' + N(y) + 'L' + N(x + Math.cos(a1) * sz) + ' ' + N(y + Math.sin(a1) * sz) + 'L' + N(x + Math.cos(a2) * sz) + ' ' + N(y + Math.sin(a2) * sz) + 'Z" fill="' + c + '"/>';
  }
  function arrow(x1, y1, x2, y2, c, w, op) {
    var ang = Math.atan2(y2 - y1, x2 - x1), hs = 7 + w * 1.6;
    return '<g opacity="' + (op == null ? 1 : op).toFixed(2) + '"><line x1="' + N(x1) + '" y1="' + N(y1) + '" x2="' + N(x2 - Math.cos(ang) * hs * .7) + '" y2="' + N(y2 - Math.sin(ang) * hs * .7) + '" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round"/>' + arrowHead(x2, y2, ang, hs, c) + '</g>';
  }

  /* ---------- 再生のしくみ（共通） ----------
     o = { vb, title, phases:[{n, d, dur}], render(k, u, t, id) → SVG 文字列, defs(id), onPhase(k), onEnd() } */
  function player(stage, ctl, o) {
    var id = 'an' + Math.random().toString(36).slice(2, 7);
    var t = 0, playing = true, speed = 1, stopAt = null, dirty = true, lastK = -1, lastNar = null, ended = false;
    var phases, starts, total;
    stage.innerHTML = '';
    var svg = document.createElementNS(BL.svgNS, 'svg');
    svg.setAttribute('class', 'svgfig anim'); svg.setAttribute('role', 'img');
    svg.setAttribute('style', 'max-width:' + (o.maxw || 860) + 'px;user-select:none');
    stage.appendChild(svg);
    var defs = document.createElementNS(BL.svgNS, 'defs'), g = document.createElementNS(BL.svgNS, 'g');
    svg.appendChild(defs); svg.appendChild(g);

    var r1 = BL.el('div', { class: 'row' }); ctl.appendChild(r1);
    var bPrev = BL.ui.btn(r1, '◀ 1コマ', function () { var k = idx(), u = (t - starts[k]) / phases[k].dur; go(u > 0.25 || k === 0 ? k : k - 1, true); });
    bPrev.title = '1コマもどる'; bPrev.setAttribute('aria-label', '1コマもどる');
    var bPlay = BL.ui.btn(r1, '❚❚ 止める', function () {
      if (playing) { playing = false; stopAt = null; }
      else { if (ended || t >= total - 0.01) { t = 0; ended = false; } playing = true; stopAt = null; }
      btns(); dirty = true;
    }, 'main');
    bPlay.style.minWidth = '6.4em';
    var bNext = BL.ui.btn(r1, '1コマ ▶', function () { var k = idx(); go(Math.min(phases.length - 1, k + 1), true); });
    bNext.title = '1コマすすむ'; bNext.setAttribute('aria-label', '1コマすすむ');
    BL.ui.btn(r1, '↺ はじめから', function () { go(0, false); playing = true; btns(); });
    var spd = BL.ui.seg(ctl, '速さ', [[0.5, '×0.5'], [1, '×1'], [2, '×2']], 1, function (v) { speed = v; o.onSpeed && o.onSpeed(v); });
    var chips = BL.el('div', { class: 'row', style: 'gap:4px' }); ctl.appendChild(chips);
    var bar = BL.el('div', { style: 'height:5px;border-radius:3px;background:var(--chip);overflow:hidden' }, '<div style="height:100%;width:0;background:var(--accent)"></div>');
    ctl.appendChild(bar);
    var barIn = bar.firstChild;
    var info = BL.ui.box(ctl, 'info', '');
    info.setAttribute('aria-live', 'polite');

    function setPhases(list) {
      phases = list; starts = []; total = 0;
      list.forEach(function (p) { starts.push(total); total += p.dur; });
      chips.innerHTML = '';
      list.forEach(function (p, i) {
        var b = BL.el('button', { class: 'btn', style: 'font-size:12px;padding:2px 7px;font-weight:700', 'aria-pressed': 'false' }, (i + 1) + ' ' + (p.s || p.n));
        b.addEventListener('click', function () { go(i, true); });
        chips.appendChild(b);
      });
      t = 0; lastK = -1; ended = false; stopAt = null; dirty = true;
    }
    function idx() { for (var i = phases.length - 1; i > 0; i--) if (t >= starts[i]) return i; return 0; }
    /* k 番目のコマのはじめへ。once=true ならそのコマの終わりで止まる */
    function go(k, once) { t = starts[k]; ended = false; playing = true; stopAt = once ? starts[k] + phases[k].dur : null; btns(); dirty = true; }
    function btns() { bPlay.textContent = playing ? '❚❚ 止める' : (ended ? '↻ もう一度' : '▶ 再生'); }
    function draw() {
      var nar = BL.narrow(); F = nar ? 1.3 : 1;
      if (nar !== lastNar) { lastNar = nar; svg.setAttribute('viewBox', nar && o.vbN ? o.vbN : o.vb); }
      var k = idx(), u = clamp((t - starts[k]) / phases[k].dur, 0, 1);
      if (!defs.firstChild && o.defs) defs.innerHTML = o.defs(id);
      g.innerHTML = o.render(k, u, t, id, nar);
      if (k !== lastK) {
        lastK = k;
        info.innerHTML = '<h4>' + (k + 1) + '/' + phases.length + '　' + phases[k].n + '</h4>' + phases[k].d;
        svg.setAttribute('aria-label', phases[k].n);
        for (var i = 0; i < chips.children.length; i++) chips.children[i].setAttribute('aria-pressed', String(i === k));
        o.onPhase && o.onPhase(k);
      }
      barIn.style.width = (t / total * 100).toFixed(1) + '%';
    }
    setPhases(o.phases);
    var stop = BL.loop(function (dt) {
      if (!stage.isConnected) { stop(); return; }
      if (playing) {
        t += dt * speed; dirty = true;
        if (stopAt != null && t >= stopAt) { t = stopAt - 1e-4; playing = false; stopAt = null; btns(); }
        if (t >= total) { t = total - 1e-4; playing = false; ended = true; btns(); o.onEnd && o.onEnd(); }
      }
      if (BL.narrow() !== lastNar) dirty = true;
      if (dirty) { dirty = false; draw(); }
    });
    /* 確認用（自動テストから時刻を指定する） */
    stage._anim = { seek: function (k, u) { t = starts[k] + phases[k].dur * u - 1e-4; if (t < 0) t = 0; playing = false; stopAt = null; ended = false; btns(); dirty = true; }, n: function () { return phases.length; } };
    return {
      stop: stop, phases: o.phases, set: function (list) { setPhases(list); playing = true; btns(); },
      redraw: function () { dirty = true; }, retext: function () { lastK = -1; dirty = true; }, svg: svg, speed: function () { return speed; }, spd: spd
    };
  }

  /* 塩基の色（明るい画面・暗い画面のどちらでも見える中間の色） */
  var BC = { A: '#e8798a', T: '#e2b443', G: '#57b07f', C: '#6d9fe0', U: '#b48ae0' };
  var BCL = { A: '#f6c1c9', T: '#f5dc94', G: '#a9dcb9', C: '#b8d0f4', U: '#dcc6f4' };
  var BCD = { A: '#a33a4c', T: '#8a6510', G: '#23683f', C: '#2b5c9e', U: '#6a3fa0' };
  var MEM = '#c9a227';

  /* =====================================================================
     1. DNA の複製
     ===================================================================== */
  (function () {
    var X0 = 60, DX = 12, NB = 41, R = rng(7), SEQ = [], i;
    var PAIR = { A: 'T', T: 'A', G: 'C', C: 'G' };
    for (i = 0; i < NB; i++) SEQ.push('ATGC'[Math.floor(R() * 4)]);
    var OLD = 'var(--c3)', NEW = 'var(--warm)', PRI = 'var(--c6)';
    /* ラギング鎖の岡崎フラグメント（塩基の番号の範囲） */
    var FR = [[0, 8], [9, 17], [18, 25], [26, 29], [30, 40]];
    var PH = [
      { n: '二重らせんの DNA', s: 'DNA', dur: 3.5, d: '2本のヌクレオチド鎖が、塩基どうし（<b>A−T、G−C</b>）の水素結合で結びついている。2本の鎖は<b>逆向き</b>（5′→3′ の向きが反対）。' },
      { n: 'ヘリカーゼがほどく', s: 'ほどく', dur: 4, d: '<b class="key">ヘリカーゼ</b>（酵素）が塩基どうしの結合を切って、2本の鎖をほどいていく。ほどけた所を<b>複製フォーク</b>という。' },
      { n: 'リーディング鎖：連続して合成', s: 'リーディング鎖', dur: 5, d: '<b class="key">DNA ポリメラーゼ</b>が、もとの鎖を鋳型にして相補的なヌクレオチド（材料）をつないでいく。DNA ポリメラーゼは<b>5′→3′ の向きにしか伸ばせない</b>。ほどける向きと同じ向きに伸びる鎖は、<b>連続して</b>合成される（リーディング鎖）。合成のはじめには短い RNA の<b>プライマー</b>が必要。' },
      { n: 'ラギング鎖：岡崎フラグメント', s: 'ラギング鎖', dur: 7, d: 'もう一方の鎖は、ほどける向きと<b>逆向き</b>にしか伸ばせない。そこで、ほどけるたびに短い断片を少しずつ合成する。この断片を<b class="key">岡崎フラグメント</b>といい、こちらの鎖を<b>ラギング鎖</b>という。' },
      { n: 'DNA リガーゼがつなぐ', s: 'リガーゼ', dur: 6, d: 'プライマーは DNA に置きかえられ、断片どうしのすき間を <b class="key">DNA リガーゼ</b>がつないで、1本の鎖にする。' },
      { n: '半保存的複製', s: '半保存的', dur: 5, d: 'できた2つの DNA は、どちらも<b>もとの鎖1本＋新しい鎖1本</b>。これを<b class="key">半保存的複製</b>という（メセルソンとスタールの実験で証明）。2つの DNA の塩基配列はまったく同じ。' }
    ];
    /* 時刻 → フォークの位置・合成の進み具合 */
    function state(k, u) {
      var S = { F: 40, lead: -1, leadP: 0, frag: [], lig: [0, 0, 0, 0], prim: 0, sep: 0, hel: 1, polL: null, polG: null, ligX: null };
      var fr = function (j, a) { S.frag[j] = a; };
      if (k === 0) return S;
      if (k === 1) { S.F = lerp(40, 200, ease(u)); return S; }
      if (k === 2) { S.F = lerp(200, 340, u); S.leadP = es(u, 0, .15); S.lead = lerp(X0 + DX, 324, es(u, .15, 1)); S.polL = u > .12 ? S.lead : null; return S; }
      S.leadP = 1;
      if (k === 3) {
        S.F = lerp(340, 470, u); S.lead = S.F - 16; S.polL = S.lead;
        var st = [0, .22, .46, .72];
        for (var j = 0; j < 4; j++) { var a = seg(u, st[j], st[j] + .24); if (a > 0) { fr(j, a); if (a < 1) S.polG = j; } }
        return S;
      }
      fr(0, 1); fr(1, 1); fr(2, 1); fr(3, 1);
      if (k === 4) {
        S.F = lerp(470, 620, u); S.lead = Math.min(X0 + DX * (NB - 1), S.F - 16); S.polL = S.lead < X0 + DX * (NB - 1) - 1 ? S.lead : (u < .75 ? S.lead + (u - .66) * 300 : null);
        S.hel = 1 - es(u, .6, .8);
        var a5 = seg(u, .5, .76); if (a5 > 0) { fr(4, a5); if (a5 < 1) S.polG = 4; }
        S.lig = [es(u, .14, .24), es(u, .26, .36), es(u, .38, .48), es(u, .8, .92)];
        S.prim = es(u, .12, .9);
        var lj = u < .14 ? -1 : u < .5 ? Math.min(2, Math.floor((u - .14) / .12)) : (u > .78 && u < .95 ? 3 : -1);
        if (lj >= 0) S.ligX = lj;
        return S;
      }
      S.F = 700; S.lead = X0 + DX * (NB - 1); S.hel = 0; fr(4, 1); S.lig = [1, 1, 1, 1]; S.prim = 1; S.sep = es(u, 0, .5);
      return S;
    }
    function render(k, u, t) {
      var S = state(k, u), s = '', F2 = F;
      function open(x) { return x >= S.F ? 0 : ease((S.F - x) / 64); }
      var dy = 22 * S.sep;
      /* はじめは二重らせん → はしご状にのばしてかく */
      var hel = k === 0 ? 1 - es(u, .4, .85) : 0;
      function hc(x) { return hel ? Math.cos((x - X0) / 92 * Math.PI * 2 + t * .6) : 1; }
      function yT(x) { var o = open(x); return lerp(200 - 14 * lerp(1, hc(x), hel), 118, o) - dy; }
      function yB(x) { var o = open(x); return lerp(200 + 14 * lerp(1, hc(x), hel), 282, o) + dy; }
      function reP(x, y, dir) { var o = open(x), m = (yT(x) + yB(x)) / 2; return lerp(m + (m > y ? -1.5 : 1.5), y + dir * 13, o); }
      function bx(j) { return X0 + j * DX; }
      /* 鎖をかく：pts の x 列にそって y=f(x)、塩基の向き dir（+1 下向き、-1 上向き） */
      function strand(j0, j1, fy, dir, col, seq, segs, par) {
        var o = '', P = [], j, x;
        for (x = bx(j0) - 5; x <= bx(j1) + 5.01; x += 3) P.push([x, fy(x)]);
        for (j = j0; j <= j1; j++) {
          x = bx(j); var y = fy(x), c = BC[seq[j]], e = par ? reP(x, y, dir) : y + dir * 13, sg = e > y ? 1 : -1;
          if (Math.abs(e - y) > 4) o += '<line x1="' + x + '" y1="' + N(y + sg * 3) + '" x2="' + x + '" y2="' + N(e) + '" stroke="' + c + '" stroke-width="5.2" stroke-linecap="round"/>';
        }
        if (segs) segs.forEach(function (sg) { var Q = P.filter(function (p) { return p[0] >= sg[0] - .1 && p[0] <= sg[1] + .1; }); if (Q.length > 1) o += '<path d="' + poly(Q) + '" fill="none" stroke="' + sg[2] + '" stroke-width="5" stroke-linecap="round"/>'; });
        else o += '<path d="' + poly(P) + '" fill="none" stroke="' + col + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>';
        return o;
      }
      var COMP = SEQ.map(function (b) { return PAIR[b]; });
      /* もとの鎖（上：5′→3′、下：3′→5′） */
      s += strand(0, NB - 1, yT, 1, OLD, SEQ, null, 1);
      s += strand(0, NB - 1, yB, -1, OLD, COMP, null, 1);
      /* 新しい鎖：リーディング鎖（下の鋳型に対合、5′ 左 → 3′ 右へ伸びる） */
      function yLn(x) { return yB(x) - 28; }
      function yGn(x) { return yT(x) + 28; }
      if (S.lead >= X0) {
        var jl = Math.floor((S.lead - X0) / DX + 1e-6), pr = S.prim;
        var segs = [[bx(0) - 5, bx(Math.min(jl, 1)) + 5, pr > .5 ? NEW : PRI]];
        if (jl >= 2) segs.push([bx(1) + 5, bx(jl) + 5, NEW]);
        s += strand(0, jl, yLn, 1, NEW, SEQ, segs);
        if (jl >= 3 && S.polL != null) s += arrowHead(bx(jl) + 11, yLn(bx(jl)), 0, 9, NEW);
      } else if (S.leadP > 0) {
        s += '<g opacity="' + S.leadP.toFixed(2) + '">' + strand(0, 1, yLn, 1, PRI, SEQ) + '</g>';
      }
      /* ラギング鎖：岡崎フラグメント（5′ 右端のプライマーから左へ伸びる） */
      S.frag.forEach(function (a, j) {
        if (!a) return;
        var f = FR[j], len = f[1] - f[0], jp = f[1] - 1;
        var pa = Math.min(1, a / .2), ext = es(a, .2, 1);
        var jL = Math.round(lerp(jp, f[0], ext));
        var lj = j > 0 ? S.lig[j - 1] : 1, rj = j < 4 ? S.lig[j] : 0;
        var pc = S.prim > .5 && (j < 4 ? S.lig[j] > .3 : S.prim > .95) ? NEW : PRI;
        var x0 = bx(jL) - 5 - (lj > 0 ? lj * 2 : 0), xr = bx(f[1]) + 5 + (rj > 0 ? rj * 2 : 0);
        var sg = [[bx(jp) - 5, xr, pc]];
        if (jL < jp) sg.push([x0, bx(jp) - 5 + 0.1, NEW]);
        s += '<g opacity="' + pa.toFixed(2) + '">' + strand(jL, f[1], yGn, -1, NEW, COMP, sg) + '</g>';
        if (ext > 0 && ext < 1) s += arrowHead(bx(jL) - 11, yGn(bx(jL)), Math.PI, 9, NEW);
        void len;
      });
      /* つなぎ目（ニック）の印 */
      [0, 1, 2, 3].forEach(function (j) {
        if (S.frag[j] >= 1 && S.frag[j + 1] >= 1 && S.lig[j] < 1) {
          var xn = (bx(FR[j][1]) + bx(FR[j + 1][0])) / 2;
          s += '<circle cx="' + xn + '" cy="' + N(yGn(xn)) + '" r="' + N(4 * (1 - S.lig[j])) + '" fill="none" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="2 2"/>';
        }
      });
      /* 酵素 */
      function blob(x, y, rx, ry, fill, lbl) { return '<ellipse cx="' + N(x) + '" cy="' + N(y) + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '" fill-opacity=".82" stroke="var(--ink)" stroke-width="1.2"/>' + (lbl || ''); }
      /* 材料のヌクレオチド */
      function nucs(px, py, dir, seed) {
        var o = '';
        for (var q = 0; q < 3; q++) {
          var ph = (t * .9 + q / 3 + seed) % 1, e = ease(ph);
          var x = lerp(px - 46 - q * 14, px - 4, e), y = lerp(200 + (q - 1) * 9, py - dir * 9, e);
          var b = 'ATGC'[(q + Math.floor(seed * 10)) % 4];
          o += '<g opacity="' + (Math.min(1, ph * 5) * (1 - es(ph, .85, 1))).toFixed(2) + '"><circle cx="' + N(x) + '" cy="' + N(y) + '" r="4.2" fill="' + NEW + '"/><line x1="' + N(x) + '" y1="' + N(y + dir * 3) + '" x2="' + N(x) + '" y2="' + N(y + dir * 12) + '" stroke="' + BC[b] + '" stroke-width="5" stroke-linecap="round"/></g>';
        }
        return o;
      }
      if (S.polL != null && S.polL < 548) {
        var lx = S.polL + 8, ly = yLn(S.polL) - 6;
        if (lx > X0 + 60) s += nucs(lx, ly, 1, .37);
        s += blob(lx, ly, 22, 14, 'var(--accent)');
      }
      if (S.polG != null) {
        var f = FR[S.polG], a = S.frag[S.polG], jl2 = lerp(f[1] - 1, f[0], es(a, .2, 1)), gx = bx(jl2) - 8, gy = yGn(gx) + 6;
        s += nucs(gx, gy, -1, .71);
        s += blob(gx, gy, 22, 14, 'var(--accent)');
      }
      if (S.ligX != null) {
        var j = S.ligX, xn = (bx(FR[j][1]) + bx(FR[j + 1][0])) / 2;
        s += blob(xn, yGn(xn) + 6, 15, 11, 'var(--c6)');
      }
      if (S.hel > 0 && S.F > 50) {
        var hx = Math.min(S.F, 590), hp = '';
        for (var q = 0; q < 6; q++) { var an = q / 6 * Math.PI * 2 + t * 2; hp += (q ? 'L' : 'M') + N(hx + Math.cos(an) * 19) + ' ' + N(200 + Math.sin(an) * 27); }
        s += '<g opacity="' + S.hel.toFixed(2) + '"><path d="' + hp + 'Z" fill="var(--c5)" fill-opacity=".85" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round"/><ellipse cx="' + N(hx) + '" cy="200" rx="7" ry="11" fill="var(--panel)" opacity=".8"/></g>';
      }
      /* 5′・3′ の印 */
      var e5 = 'var(--muted)';
      if (hel < .3) {
      s += tx(X0 - 10, yT(X0) + 5, '5′', { a: 'end', s: 13, c: e5 }) + tx(X0 - 10, yB(X0) + 5, '3′', { a: 'end', s: 13, c: e5 });
      s += tx(bx(NB - 1) + 10, yT(bx(NB - 1)) + 5, '3′', { s: 13, c: e5 }) + tx(bx(NB - 1) + 10, yB(bx(NB - 1)) + 5, '5′', { s: 13, c: e5 });
      if (S.lead > X0 + 30) { s += tx(X0 - 10, yLn(X0) + 5, '5′', { a: 'end', s: 13, c: NEW }); if (k === 5) s += tx(bx(NB - 1) + 10, yLn(bx(NB - 1)) + 5, '3′', { s: 13, c: NEW }); }
      if (S.frag[0] >= 1) { s += tx(X0 - 10, yGn(X0) + 5, '3′', { a: 'end', s: 13, c: NEW }); if (k === 5) s += tx(bx(NB - 1) + 10, yGn(bx(NB - 1)) + 5, '5′', { s: 13, c: NEW }); }
      }

      /* ラベル */
      if (k === 0) {
        s += lab(300, 200, 300, 262, '塩基対（A−T、G−C）', { a: 'middle', op: es(u, .1, .3) });
        s += lab(180, 186, 180, 140, 'ヌクレオチド鎖', { a: 'middle', op: es(u, .3, .5) });
        s += lab(420, 214, 420, 262 + 0, '', { op: 0 });
      }
      if (k >= 1 && k <= 3) {
        var hx2 = Math.min(S.F, 590);
        s += lab(hx2 + 10, 224, hx2 + 24, 262, 'ヘリカーゼ', { op: k === 1 ? es(u, .1, .3) : 1 });
        if (k === 1) s += arrow(hx2 + 30, 200, hx2 + 62, 200, 'var(--c5)', 3.5, es(u, .2, .4) * (1 - es(u, .9, 1))) + tx(hx2 + 26, 180, 'ほどく向き', { s: 12, op: es(u, .2, .4) * (1 - es(u, .9, 1)) });
      }
      if (k === 1) s += lab(Math.max(80, S.F - 34), 156, Math.max(80, S.F - 34), 92, '複製フォーク', { a: 'middle', op: es(u, .45, .65) });
      if (S.polL != null && S.polL < 548 && k >= 2 && k <= 4) s += lab(S.polL + 8, yLn(S.polL) + 4, clamp(S.polL + 8, 120, 480), 340, 'DNA ポリメラーゼ', { a: 'middle', op: k === 2 ? es(u, .15, .3) : 1 });
      if (S.polG != null) { var gx2 = bx(lerp(FR[S.polG][1] - 1, FR[S.polG][0], es(S.frag[S.polG], .2, 1))) - 8; s += lab(gx2, yGn(gx2) - 4, clamp(gx2, 120, 480), 70, 'DNA ポリメラーゼ', { a: 'middle' }); }
      if (S.ligX != null) { var xl = (bx(FR[S.ligX][1]) + bx(FR[S.ligX + 1][0])) / 2; s += lab(xl, yGn(xl) - 4, clamp(xl, 100, 500), 70, 'DNA リガーゼ', { a: 'middle', c: 'var(--c6)' }); }
      if (k === 2 && u > .55) s += tx(X0 + 4, 236, 'リーディング鎖（連続的）→', { s: 13.5, c: NEW, op: es(u, .55, .75) });
      if (k === 3 || k === 4) {
        s += tx(X0 + 4, 236, 'リーディング鎖（連続的）→', { s: 13.5, c: NEW });
        s += tx(X0 + 4, 176, '← ラギング鎖（不連続的）', { s: 13.5, c: NEW, op: k === 3 ? es(u, .15, .3) : 1 });
        if (S.frag[2] >= 1 && k === 3) {
          var b0 = bx(FR[2][0]) - 4, b1 = bx(FR[2][1]) + 4, yb = yGn(bx(FR[2][1])) + 8;
          s += '<path d="M' + b0 + ' ' + N(yb) + 'v5H' + b1 + 'v-5" fill="none" stroke="var(--ink)" stroke-width="1.3"/>' + tx((b0 + b1) / 2, yb + 22, '岡崎フラグメント', { s: 13, a: 'middle' });
        }
      }
      if (k === 4 && u > .1 && u < .6) {
        var px0 = bx(FR[1][1]) - 2;
        s += lab(px0, yGn(px0) + 4, px0 + 24, 208, 'プライマー → DNA に置きかわる', { s: 12.5, c: 'var(--c6)', lc: 'var(--c6)', op: es(u, .1, .2) * (1 - es(u, .5, .6)) });
      }
      if (k === 5) {
        var op5 = es(u, .35, .6);
        s += tx(300, yT(300) - 16, 'もとの鎖', { a: 'middle', c: OLD, op: op5 });
        s += tx(300, yGn(300) + 30, '新しい鎖', { a: 'middle', c: NEW, op: op5 });
        s += tx(300, yLn(300) - 20, '新しい鎖', { a: 'middle', c: NEW, op: op5 });
        s += tx(300, yB(300) + 34, 'もとの鎖', { a: 'middle', c: OLD, op: op5 });
        s += tx(300, 207, '半保存的複製', { a: 'middle', s: 19, c: 'var(--accent)', op: es(u, .55, .8) });
      }
      /* 凡例 */
      var ly2 = 404, lx2 = 40, legend = [[OLD, 'もとの鎖'], [NEW, '新しい鎖'], [PRI, 'プライマー（RNA）']];
      legend.forEach(function (L) { s += '<line x1="' + lx2 + '" y1="' + (ly2 - 5) + '" x2="' + (lx2 + 22) + '" y2="' + (ly2 - 5) + '" stroke="' + L[0] + '" stroke-width="5" stroke-linecap="round"/>' + tx(lx2 + 28, ly2, L[1], { s: 12.5, w: 500 }); lx2 += 40 + L[1].length * 12.5 * F2 + 6; });
      return s;
    }
    BL.addSim({
      id: 'a-replication', anim: true, name: 'DNA の複製', cat: 'アニメーション', subj: 'kiso', ic: '複',
      lead: 'ヘリカーゼがほどき、DNA ポリメラーゼが新しい鎖をつくる（半保存的複製）',
      how: '<p>DNA は複製のとき、<b class="key">ヘリカーゼ</b>で2本の鎖がほどかれ、それぞれの鎖を鋳型にして相補的なヌクレオチドがつながる（A−T、G−C）。</p><p><b class="key">DNA ポリメラーゼ</b>は新しい鎖を <b>5′→3′ の向きにしか伸ばせない</b>。そのため、ほどける向きに連続して伸びる<b class="key">リーディング鎖</b>と、短い断片（<b class="key">岡崎フラグメント</b>）を<b class="key">DNA リガーゼ</b>でつなぐ<b class="key">ラギング鎖</b>ができる。</p><div class="box">半保存的複製：新しい DNA ＝ もとの鎖1本 ＋ 新しい鎖1本</div>',
      pts: [[1, 'DNA ポリメラーゼは 5′→3′ の向きにだけヌクレオチドをつなぐ'], [1, 'ラギング鎖は岡崎フラグメントを DNA リガーゼでつないでできる'], [0, '複製後の DNA は、2本とも新しい鎖からなる → ×（半保存的複製）'], [1, '合成のはじめには RNA のプライマーが必要']],
      tasks: ['最後まで見る（半保存的複製）', '岡崎フラグメントができるところを見る', 'DNA リガーゼがつなぐところを見る'],
      slides: [['k2-2', 1], ['b3-1', 1], ['b3-1', 2]],
      mount: function (stage, ctl, api) {
        var P = player(stage, ctl, { vb: '0 0 600 420', vbN: '16 46 572 374', phases: PH, render: render, onPhase: function (k) { if (k === 3) api.task(1); if (k === 4) api.task(2); }, onEnd: function () { api.task(0); } });
        return P.stop;
      }
    });
  })();

  /* =====================================================================
     2. 転写と翻訳
     ===================================================================== */
  (function () {
    var COD = 'ATGTTCGGCAAATAA', TPL = 'TACAAGCCGTTTATT', MR = 'AUGUUCGGCAAAUAA';
    var AA = [{ n: 'Met', j: 'メチオニン', c: 'var(--c5)', a: 'UAC' }, { n: 'Phe', j: 'フェニルアラニン', c: 'var(--c1)', a: 'AAG' }, { n: 'Gly', j: 'グリシン', c: 'var(--accent)', a: 'CCG' }, { n: 'Lys', j: 'リシン', c: 'var(--c3)', a: 'UUU' }];
    var PAN = 300, YM = 600; /* 細胞質での mRNA の高さ（世界座標） */
    function X(i) { return 112 + 28 * i; }
    function Xc(k) { return X(3 * k + 1); }
    var PH = [
      { n: 'DNA の遺伝子', s: 'DNA', dur: 3.5, d: '核の中の DNA。タンパク質のつくり方（遺伝情報）は、<b>塩基の並び（塩基配列）</b>として書かれている。2本の鎖のうち、読まれる方を<b class="key">鋳型鎖</b>という。' },
      { n: '転写：DNA → mRNA', s: '転写', dur: 9, d: '<b class="key">RNA ポリメラーゼ</b>が DNA の2本鎖をほどきながら進み、鋳型鎖に相補的な塩基をもつ RNA をつないでいく（<b class="key">転写</b>）。RNA では T（チミン）のかわりに <b>U（ウラシル）</b>を使う：A→U、T→A、G→C、C→G。' },
      { n: 'mRNA が核膜孔から細胞質へ', s: '核の外へ', dur: 7, d: 'できた <b class="key">mRNA</b>（伝令 RNA）は、核膜にあいた<b>核膜孔</b>を通って細胞質へ出ていく。DNA は核に残る。' },
      { n: 'リボソームが開始コドンに結合', s: '開始', dur: 5, d: '細胞質で <b class="key">リボソーム</b>が mRNA に結合する。mRNA の塩基は <b>3つで1組（コドン）</b>。最初の <b>AUG（開始コドン）</b>に、アンチコドン UAC をもつ <b class="key">tRNA</b>（運搬 RNA）がメチオニンを運んでくる。' },
      { n: '翻訳：tRNA がアミノ酸を運ぶ', s: '翻訳', dur: 13, d: 'コドンに合う<b class="key">アンチコドン</b>をもつ tRNA が、決まったアミノ酸を運んでくる。となりのアミノ酸どうしが<b class="key">ペプチド結合</b>でつながり、リボソームは <b>3塩基（1コドン）ずつ</b>進む（<b class="key">翻訳</b>）。' },
      { n: '終止コドンで終わる', s: '終止', dur: 6, d: '<b>終止コドン</b>（UAA・UAG・UGA）には対応する tRNA がない。ここで翻訳が終わり、できた<b class="key">ポリペプチド</b>がはなれる。ポリペプチドは折りたたまれて、はたらくタンパク質になる。' }
    ];
    var big = 1;
    function tile(x, y, b, o) {
      o = o || {}; var sc = (o.sc || 1) * big, w = 24 * sc, h = 26 * sc, op = o.op == null ? 1 : o.op;
      if (op <= .01) return '';
      return '<g' + (op < 1 ? ' opacity="' + op.toFixed(2) + '"' : '') + '><rect x="' + N(x - w / 2) + '" y="' + N(y - h / 2) + '" width="' + N(w) + '" height="' + N(h) + '" rx="' + N(5 * sc) + '" fill="' + BCL[b] + '" stroke="' + BCD[b] + '" stroke-width="1.5"/><text x="' + N(x) + '" y="' + N(y + 5.4 * sc) + '" font-size="' + N(15 * sc) + '" font-weight="800" text-anchor="middle" fill="' + BCD[b] + '" font-family="var(--font-data)">' + b + '</text></g>';
    }
    function bb(P, c) { return '<path d="' + poly(P) + '" fill="none" stroke="' + c + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'; }
    function trna(ax, ay, a, aaOn, op, hi) {
      if (op <= .01) return '';
      var s = '<g opacity="' + op.toFixed(2) + '">', A = AA[a];
      s += '<line x1="' + ax + '" y1="' + (ay - 60) + '" x2="' + ax + '" y2="' + (ay - 80) + '" stroke="var(--c6)" stroke-width="4" stroke-linecap="round"/>';
      s += '<line x1="' + ax + '" y1="' + (ay - 20) + '" x2="' + ax + '" y2="' + (ay - 12) + '" stroke="var(--c6)" stroke-width="4"/>';
      s += '<circle cx="' + (ax - 28) + '" cy="' + (ay - 42) + '" r="10" fill="var(--nuc)" stroke="var(--c6)" stroke-width="2"/><circle cx="' + (ax + 28) + '" cy="' + (ay - 42) + '" r="10" fill="var(--nuc)" stroke="var(--c6)" stroke-width="2"/>';
      s += '<rect x="' + (ax - 22) + '" y="' + (ay - 64) + '" width="44" height="44" rx="14" fill="var(--nuc)" stroke="var(--c6)" stroke-width="2"/>';
      s += '<path d="M' + (ax - 34) + ' ' + (ay - 12) + 'H' + (ax + 34) + '" stroke="var(--c6)" stroke-width="3" stroke-linecap="round"/>';
      for (var q = 0; q < 3; q++) s += tile(ax + (q - 1) * 28, ay, A.a[q], { sc: .86 });
      if (aaOn) s += aaBall(ax, ay - 92, a, hi);
      return s + '</g>';
    }
    function aaBall(x, y, a, hi) {
      var A = AA[a];
      return '<circle cx="' + N(x) + '" cy="' + N(y) + '" r="' + N(15 * big) + '" fill="' + A.c + '" stroke="var(--ink)" stroke-width="' + (hi ? 2.5 : 1.2) + '"/><text x="' + N(x) + '" y="' + N(y + 4.5 * big) + '" font-size="' + N(12 * big) + '" font-weight="800" text-anchor="middle" fill="var(--panel)">' + A.n + '</text>';
    }
    function render(k, u, t) {
      big = F > 1 ? 1.12 : 1;
      var s = '', cy = k < 2 ? 0 : k > 2 ? PAN : PAN * es(u, .3, .85);
      s += '<g transform="translate(0 ' + N(-cy) + ')">';
      /* 核と細胞質 */
      s += '<rect x="-20" y="-60" width="640" height="352" fill="var(--nuc)" opacity=".55"/><rect x="-20" y="300" width="640" height="520" fill="var(--cyto)"/>';
      s += '<path d="M-20 292H284M316 292H620M-20 300H284M316 300H620" stroke="var(--c6)" stroke-width="2.6" fill="none"/><path d="M284 292a4 4 0 0 0 0 8M316 292a4 4 0 0 1 0 8" fill="none" stroke="var(--c6)" stroke-width="2.6"/>';
      if (cy < 260) s += tx(12, 26 + 0, '核', { s: 16, c: 'var(--c6)' });
      s += tx(12, 326, '細胞質', { s: 15, c: 'var(--muted)' });
      /* ---- 核の中：DNA と転写 ---- */
      if (cy < 290) {
        var cur = k === 0 ? -2 : k === 1 ? lerp(-1.6, 15.6, u) : 17;
        var pol = k === 1 ? 1 : k === 2 ? 1 - es(u, 0, .12) : 0;
        if (k === 1) pol = Math.min(es(u, 0, .06), 1 - es(u, .95, 1));
        var Pc = [], Pt = [];
        function bump(i) { var d = Math.abs(i - cur); return k === 1 ? Math.max(0, 1 - d / 2.2) : 0; }
        for (var i = 0; i < 15; i++) { Pc.push([X(i), 80 - 16 * ease(bump(i))]); Pt.push([X(i), 134]); }
        for (i = 0; i < 15; i++) { var bo = 1 - Math.min(1, bump(i) * 2); if (bo > .02) s += '<line x1="' + X(i) + '" y1="' + N(Pc[i][1] + 13) + '" x2="' + X(i) + '" y2="121" stroke="var(--muted)" stroke-width="2" stroke-dasharray="3 3" opacity="' + bo.toFixed(2) + '"/>'; }
        s += bb([[X(0) - 14, 80]].concat(Pc, [[X(14) + 14, 80]]), 'var(--c3)') + bb([[X(0) - 14, 134]].concat(Pt, [[X(14) + 14, 134]]), 'var(--c3)');
        for (i = 0; i < 15; i++) s += tile(Pc[i][0], Pc[i][1], COD[i]) + tile(X(i), 134, TPL[i]);
        s += tx(94, 85, '5′', { a: 'end', s: 12.5, c: 'var(--muted)' }) + tx(94, 139, '3′', { a: 'end', s: 12.5, c: 'var(--muted)' }) + tx(X(14) + 18, 85, '3′', { s: 12.5, c: 'var(--muted)' }) + tx(X(14) + 18, 139, '5′', { s: 12.5, c: 'var(--muted)' });
        s += tx(6, 66, '非鋳型鎖', { s: 12, c: 'var(--muted)', w: 700 }) + tx(6, 120, '鋳型鎖', { s: 12, c: 'var(--accent)' });
        if (k === 0) s += '<path d="M' + (X(0) - 12) + ' 52v-6H' + (X(14) + 12) + 'v6" fill="none" stroke="var(--ink)" stroke-width="1.3"/>' + tx(300, 38, '遺伝子（タンパク質の情報）', { a: 'middle', s: 14, op: es(u, .15, .4) });
        if (k === 0) s += lab(X(4), 147, X(4) + 6, 196, 'この鎖が読まれる（鋳型鎖）', { s: 13, c: 'var(--accent)', op: es(u, .45, .7) });
        /* mRNA（転写中） */
        if (k === 1 || (k === 2 && u < .2)) {
          var M = [];
          for (i = 0; i < 15; i++) {
            var ap = k === 1 ? clamp((cur - i) * 1.4, 0, 1) : 1; if (ap <= 0) break;
            var pe = k === 1 ? ease(clamp((cur - i - 1.4) / 2.6, 0, 1)) : 1, y = 188 + 40 * pe;
            if (k === 2) y = 228;
            M.push([X(i), y, ap, pe]);
          }
          M.forEach(function (m, i) { if (m[3] < .5) s += '<line x1="' + m[0] + '" y1="147" x2="' + m[0] + '" y2="' + N(m[1] - 13) + '" stroke="var(--muted)" stroke-width="2" stroke-dasharray="3 3" opacity="' + ((1 - m[3] * 2) * m[2]).toFixed(2) + '"/>'; });
          if (M.length > 1) s += bb(M.map(function (m) { return [m[0], m[1]]; }), 'var(--warm)');
          M.forEach(function (m, i) { s += tile(m[0], m[1], MR[i], { op: m[2], sc: lerp(.5, 1, m[2]) }); });
          if (pol > 0) {
            var px = X(cur);
            s += '<g opacity="' + pol.toFixed(2) + '"><ellipse cx="' + N(px) + '" cy="134" rx="52" ry="84" fill="var(--accent)" fill-opacity=".16" stroke="var(--accent)" stroke-width="2.4"/>' + arrow(px + 30, 40 + 0, px + 62, 40, 'var(--accent)', 3) + '</g>';
            s += tx(clamp(px, 70, 470) - 40, 30, 'RNA ポリメラーゼ', { a: 'middle', s: 14, c: 'var(--accent)', op: pol });
            /* 材料のリボヌクレオチド */
            for (var q = 0; q < 3; q++) { var ph = (t * 1.1 + q / 3) % 1, nx = lerp(px + 70 + q * 16, px + 10, ease(ph)), ny = lerp(250 + q * 8, 196, ease(ph)); s += '<g opacity="' + (Math.min(1, ph * 5) * (1 - es(ph, .8, 1)) * pol).toFixed(2) + '">' + tile(nx, ny, 'AUGC'[(q + Math.floor(t * 1.1)) % 4], { sc: .62 }) + '</g>'; }
          }
          if (k === 1 && cur > 4.5) s += lab(X(3), 241, X(3) + 26, 272, 'DNA の T（チミン）のかわりに U（ウラシル）', { s: 13, c: 'var(--c6)', op: es(u, .3, .4) });
          if (k === 1 && cur > 2) s += tx(94, 193 + 40 * clamp((cur - 1.4) / 2.6, 0, 1), '5′', { a: 'end', s: 12.5, c: 'var(--warm)' }) + tx(6, 174 + 40 * clamp((cur - 1.4) / 2.6, 0, 1), 'mRNA', { s: 12, c: 'var(--warm)' });
        }
      }
      /* ---- mRNA が核膜孔を通る ---- */
      var MT = [];
      if (k === 2) {
        for (var i2 = 0; i2 < 15; i2++) {
          var A0 = [X(i2), 228], B = [300, 280], C = [300, 312], D = [X(i2), YM];
          var l1 = Math.hypot(B[0] - A0[0], B[1] - A0[1]), l3 = Math.hypot(D[0] - C[0], D[1] - C[1]);
          var dist = clamp((u - (.32 + i2 * .026)) * 1400 + l1, 0, l1 + 32 + l3), p;
          if (dist < l1) p = [lerp(A0[0], B[0], dist / l1), lerp(A0[1], B[1], dist / l1)];
          else if (dist < l1 + 32) p = [300, lerp(B[1], C[1], (dist - l1) / 32)];
          else p = [lerp(C[0], D[0], (dist - l1 - 32) / l3), lerp(C[1], D[1], (dist - l1 - 32) / l3)];
          var near = Math.hypot(p[0] - 300, p[1] - 296);
          MT.push([p[0], p[1], 1 - .4 * Math.max(0, 1 - near / 34)]);
        }
        if (u >= .2) {
          s += bb(MT, 'var(--warm)');
          MT.forEach(function (m, i) { s += tile(m[0], m[1], MR[i], { sc: m[2] }); });
        }
        s += lab(314, 298, 352, 340, '核膜孔', { op: es(u, .1, .25) * (1 - es(u, .85, .95)) });
        s += lab(180, 292, 150, 262, '核膜', { op: es(u, .1, .25) * (1 - es(u, .7, .8)) });
      }
      /* ---- 翻訳 ---- */
      if (k >= 3 || (k === 2 && u > .95)) {
        var r = 0, inS = 1, inL = 1, sepR = 0, T = [], chain = null;
        if (k === 3) { inS = es(u, 0, .35); inL = es(u, .2, .55); T.push({ a: 0, x: Xc(0), y: lerp(380, YM - 30, es(u, .5, .85)), xo: lerp(160, 0, es(u, .5, .85)), op: es(u, .5, .6), aa: 1 }); chain = null; }
        if (k === 4) {
          var c = Math.min(2, Math.floor(u * 3)), v = u * 3 - c, kk = c + 1;
          r = c + es(v, .55, 1);
          var lam = es(v, .35, .55);
          var prev = { a: kk - 1, x: Xc(kk - 1), y: YM - 30, xo: 0, op: 1, aa: 0 };
          if (v > .55) { var dv = es(v, .55, .95); prev.xo = -90 * dv; prev.y = YM - 30 - 140 * dv; prev.op = 1 - dv; }
          var fl = es(v, 0, .35), nw = { a: kk, x: Xc(kk), y: lerp(380, YM - 30, fl), xo: lerp(170, 0, fl), op: es(v, 0, .1), aa: fl < 1, hi: 0 };
          T.push(prev, nw);
          chain = { n: kk, lam: lam, fl: fl, from: [Xc(kk - 1), YM - 122], to: [Xc(kk), YM - 122] };
        }
        if (k === 5) {
          r = 3;
          T.push({ a: 3, x: Xc(3), y: YM - 30 - 160 * es(u, .35, .7), xo: -60 * es(u, .35, .7), op: 1 - es(u, .35, .7), aa: 0 });
          chain = { n: 4, lam: 1, from: [Xc(3), YM - 122], to: [Xc(3), YM - 122], rel: es(u, .3, .65) };
          sepR = es(u, .6, .95);
        }
        var Rx = Xc(0) + 84 * r + 42;
        /* リボソーム（大・小サブユニット） */
        var sx = -260 * (1 - inS), ly = -170 * (1 - inL);
        s += '<g opacity="' + (1 - es(sepR, .2, .7)).toFixed(2) + '">';
        s += '<path d="M' + N(Rx - 104) + ' ' + N(YM - 18 + ly - sepR * 60) + 'C' + N(Rx - 110) + ' ' + N(YM - 92 + ly - sepR * 60) + ' ' + N(Rx + 110) + ' ' + N(YM - 104 + ly - sepR * 60) + ' ' + N(Rx + 104) + ' ' + N(YM - 18 + ly - sepR * 60) + 'Z" fill="var(--c5)" fill-opacity="' + (.3 * inL).toFixed(2) + '" stroke="var(--c5)" stroke-width="2.4" opacity="' + inL.toFixed(2) + '"/>';
        s += '<ellipse cx="' + N(Rx + sx) + '" cy="' + N(YM + 26 + sepR * 50) + '" rx="96" ry="20" fill="var(--c5)" fill-opacity=".45" stroke="var(--c5)" stroke-width="2.4" opacity="' + inS.toFixed(2) + '"/>';
        s += '</g>';
        /* mRNA */
        var MP = [];
        for (i = 0; i < 15; i++) MP.push([X(i), YM]);
        s += bb([[X(0) - 14, YM]].concat(MP, [[X(14) + 14, YM]]), 'var(--warm)');
        MP.forEach(function (m, i) { s += tile(m[0], m[1], MR[i]); });
        s += tx(96, YM + 5, '5′', { a: 'end', s: 12.5, c: 'var(--warm)' }) + tx(X(14) + 18, YM + 5, '3′', { s: 12.5, c: 'var(--warm)' }) + tx(6, YM - 20, 'mRNA', { s: 12, c: 'var(--warm)' });
        /* コドンの区切り */
        if (k >= 3) {
          var cop = k === 3 ? es(u, .1, .35) : 1;
          for (var cc = 0; cc < 5; cc++) {
            var x0 = X(3 * cc) - 12, x1 = X(3 * cc + 2) + 12, hl = (k === 3 && cc === 0) || (k === 5 && cc === 4);
            s += '<path d="M' + (x0 + 2) + ' ' + (YM + 50) + 'v6H' + (x1 - 2) + 'v-6" fill="none" stroke="' + (hl ? 'var(--warm)' : 'var(--muted)') + '" stroke-width="' + (hl ? 2 : 1.3) + '" opacity="' + cop.toFixed(2) + '"/>';
            s += tx((x0 + x1) / 2, YM + 76, cc === 0 ? '開始コドン' : cc === 4 ? '終止コドン' : 'コドン', { a: 'middle', s: 12, c: hl ? 'var(--warm)' : 'var(--muted)', op: cop });
          }
        }
        /* tRNA */
        T.forEach(function (q) { s += trna(N(q.x + q.xo), N(q.y), q.a, q.aa, q.op, q.hi); });
        /* ペプチド鎖：aa 0..n-1 は鎖として、新しい aa は tRNA の上 */
        if (chain) {
          var st = [-26, -21], pts = [], m, back;
          for (m = 0; m < chain.n; m++) {
            back = chain.n - 1 - m;
            var zz = back % 2 ? 5 : -5;
            var A1 = [chain.from[0] + back * st[0] + zz, chain.from[1] + back * st[1]];
            var B1 = [chain.to[0] + (back + 1) * st[0] - zz, chain.to[1] + (back + 1) * st[1]];
            var P1 = k === 5 ? [A1[0] - 40 * chain.rel + Math.sin(back * 1.7) * 6 * chain.rel, A1[1] - 64 * chain.rel] : [lerp(A1[0], B1[0], chain.lam), lerp(A1[1], B1[1], chain.lam)];
            pts.push(P1);
          }
          if (k === 4) s += '<line x1="' + N(pts[pts.length - 1][0]) + '" y1="' + N(pts[pts.length - 1][1]) + '" x2="' + N(Xc(chain.n)) + '" y2="' + (YM - 122) + '" stroke="var(--ink)" stroke-width="3" opacity="' + chain.lam.toFixed(2) + '"/>';
          for (m = 1; m < pts.length; m++) s += '<line x1="' + N(pts[m - 1][0]) + '" y1="' + N(pts[m - 1][1]) + '" x2="' + N(pts[m][0]) + '" y2="' + N(pts[m][1]) + '" stroke="var(--ink)" stroke-width="3"/>';
          if (k === 4 && chain.fl >= 1) s += aaBall(Xc(chain.n), YM - 122, chain.n, chain.lam > 0 && chain.lam < 1);
          pts.forEach(function (pp, i) { s += aaBall(pp[0], pp[1], i); });
          if (k === 4 && (u * 3) % 1 > .33 && (u * 3) % 1 < .75) {
            var bx2 = (pts[pts.length - 1][0] + Xc(chain.n)) / 2, by2 = (pts[pts.length - 1][1] + YM - 122) / 2;
            s += lab(bx2, by2, bx2 + 60, YM - 190, 'ペプチド結合', { s: 13, c: 'var(--c1)', op: es((u * 3) % 1, .33, .4) });
          }
          if (k === 5) s += tx(Xc(3) + 10, YM - 170, 'ポリペプチド', { s: 15, c: 'var(--accent)', op: es(chain.rel, .6, 1) }) + tx(Xc(3) + 10, YM - 150, '→ 折りたたまれてタンパク質に', { s: 12.5, op: es(chain.rel, .7, 1) });
        }
        /* ラベル */
        if (k === 3) {
          var o3 = es(u, .7, .9), ax = Xc(0);
          s += lab(ax + 14, YM - 126, 300, YM - 156, 'アミノ酸（メチオニン）', { s: 13.5, op: o3 });
          s += lab(ax + 38, YM - 72, 300, YM - 116, 'tRNA（運搬 RNA）', { s: 13.5, op: o3 });
          s += lab(ax + 40, YM - 30, 300, YM - 76, 'アンチコドン', { s: 13.5, op: o3 });
          s += lab(Rx + 92, YM - 40, 300, YM - 36 + 0, 'リボソーム', { s: 13.5, op: es(u, .45, .65) });
        }
        if (k === 4 && u > 0 && (u * 3) % 1 > .55) s += arrow(Rx - 30, YM + 104, Rx + 40, YM + 104, 'var(--c5)', 3, 1) + tx(Rx + 50, YM + 109, '3塩基ずつ進む', { s: 12.5, c: 'var(--muted)' });
        if (k === 5) s += lab(Xc(4), YM - 34, Xc(4) - 10, YM - 140, '対応する tRNA がない', { a: 'middle', s: 13, c: 'var(--warm)', op: es(u, .05, .2) * (1 - es(u, .7, .8)) });
        /* アミノ酸の名前 */
        if (k >= 3) {
          var lo = k === 3 ? es(u, .6, .8) : 1;
          s += tx(592, PAN + 30, 'Met：メチオニン　Phe：フェニルアラニン', { a: 'end', s: 12, w: 500, op: lo }) + tx(592, PAN + 50, 'Gly：グリシン　Lys：リシン', { a: 'end', s: 12, w: 500, op: lo });
        }
      }
      s += '</g>';
      return s;
    }
    BL.addSim({
      id: 'a-express', anim: true, name: '転写と翻訳', cat: 'アニメーション', subj: 'kiso', ic: '訳',
      lead: 'DNA → mRNA（転写）→ タンパク質（翻訳）。コドン・アンチコドンの対応を見る',
      how: '<p><b class="key">転写</b>：核の中で、RNA ポリメラーゼが DNA の鋳型鎖を読み、相補的な塩基をもつ <b>mRNA</b> をつくる（T のかわりに U）。</p><p><b class="key">翻訳</b>：mRNA は核膜孔から細胞質へ出る。リボソームが mRNA の塩基を<b>3つずつ（コドン）</b>読み、コドンに合う<b>アンチコドン</b>をもつ tRNA が運んできたアミノ酸を<b>ペプチド結合</b>でつなぐ。</p><div class="box">DNA（ATG）→ mRNA（AUG）→ tRNA のアンチコドン（UAC）→ メチオニン</div>',
      pts: [[1, 'RNA では T（チミン）のかわりに U（ウラシル）を使う'], [1, '1つのアミノ酸は、mRNA の3つの塩基（コドン）で指定される'], [0, '翻訳は核の中で行われる → ×（細胞質のリボソームで行われる）'], [1, '終止コドンには対応する tRNA がなく、そこで翻訳が終わる']],
      tasks: ['転写を最後まで見る', 'tRNA がアミノ酸を運ぶところを見る', '最後まで見る（終止コドン）'],
      slides: [['k2-3', 1], ['k2-3', 2], ['k2-3', 3]],
      mount: function (stage, ctl, api) {
        var P = player(stage, ctl, { vb: '0 0 600 420', phases: PH, render: render, onPhase: function (k) { if (k === 2) api.task(0); if (k === 4) api.task(1); }, onEnd: function () { api.task(2); } });
        return P.stop;
      }
    });
  })();

  /* =====================================================================
     染色体をかく道具（体細胞分裂・減数分裂で共通）
     ===================================================================== */
  var NP = 16;
  /* 染色分体の点の列：中心 (cx,cy)、軸の角度 a、腕の長さ L、法線方向のずれ off(s)（s：-1〜1） */
  function cpts(cx, cy, a, L, off) {
    var ax = Math.cos(a), ay = Math.sin(a), nx = -ay, ny = ax, P = [];
    for (var i = 0; i <= NP; i++) { var s = -1 + 2 * i / NP, o = off(s); P.push([cx + ax * s * L + nx * o, cy + ay * s * L + ny * o]); }
    return P;
  }
  /* ほどけた染色体（クロマチン）の形：乱数で決めた曲がりくねった線 */
  function wiggle(seed, amp) {
    var R = rng(seed), th = R() * 6.28, x = 0, y = 0, P = [];
    for (var i = 0; i <= NP; i++) { P.push([x, y]); th += (R() - .5) * 2.2; x += Math.cos(th) * 7.5 * amp; y += Math.sin(th) * 7.5 * amp; }
    var mx = 0, my = 0; P.forEach(function (p) { mx += p[0]; my += p[1]; }); mx /= P.length; my /= P.length;
    return P.map(function (p) { return [p[0] - mx, p[1] - my]; });
  }
  function mix(A, B, t) { return A.map(function (p, i) { return [lerp(p[0], B[i][0], t), lerp(p[1], B[i][1], t)]; }); }
  /* 染色分体を描く（cols：[[色, 始めの番号, 終わりの番号], ...]） */
  function drawCT(P, w, cols, op) {
    var s = '<g' + (op != null && op < 1 ? ' opacity="' + op.toFixed(2) + '"' : '') + '>';
    s += '<path d="' + smooth(P) + '" fill="none" stroke="var(--ink)" stroke-opacity=".55" stroke-width="' + N(w + 2.4) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    cols.forEach(function (c) { var Q = P.slice(c[1], c[2] + 1); if (Q.length > 1) s += '<path d="' + smooth(Q) + '" fill="none" stroke="' + c[0] + '" stroke-width="' + N(w) + '" stroke-linecap="round" stroke-linejoin="round"/>'; });
    if (w > 4) s += '<path d="' + smooth(P) + '" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="' + N(w * .3) + '" stroke-linecap="round" transform="translate(' + N(-w * .16) + ' ' + N(-w * .16) + ')"/>';
    return s + '</g>';
  }
  /* 細胞の輪郭：楕円を x=cx（axis 'x'）または y=cy（axis 'y'）の所でくびれさせる。p=1 で2つに分かれ、gap だけはなれる */
  function cellPath(cx, cy, rx, ry, p, gap, axis, round) {
    var P = [], i, n = 120;
    for (i = 0; i < n; i++) {
      var th = i / n * Math.PI * 2, x = Math.cos(th) * rx, y = Math.sin(th) * ry;
      if (axis === 'y') { var f2 = 1 - p * Math.exp(-Math.pow(y / (ry * .26), 2)); x *= f2; } else { var f = 1 - p * Math.exp(-Math.pow(x / (rx * .22), 2)); y *= f; }
      P.push([x, y]);
    }
    function sh(Q, sg) { return Q.map(function (q) { return axis === 'y' ? [cx + q[0], cy + q[1] + sg * gap] : [cx + q[0] + sg * gap, cy + q[1]]; }); }
    if (p < .999) return '<path d="' + smooth(sh(P, 0), true) + '"/>';
    var A = P.filter(function (q) { return axis === 'y' ? q[1] <= .01 : q[0] <= .01; }), B = P.filter(function (q) { return axis === 'y' ? q[1] >= -.01 : q[0] >= -.01; });
    function sortA(Q) { return Q.sort(function (a, b) { return Math.atan2(a[1], a[0] + (axis === 'y' ? 0 : rx * .5)) - Math.atan2(b[1], b[0] + (axis === 'y' ? 0 : rx * .5)); }); }
    void sortA;
    var left = [], right = [];
    for (i = 0; i < n; i++) { var q = P[i]; if (axis === 'y' ? q[1] < 0 : q[0] < 0) left.push(q); else right.push(q); }
    /* 円周の順にならべかえる（境目で切れないように回転） */
    function rot(Q) { var k = 0; for (var j = 1; j < Q.length; j++) { var d = Math.hypot(Q[j][0] - Q[j - 1][0], Q[j][1] - Q[j - 1][1]); if (d > 20) { k = j; break; } } return Q.slice(k).concat(Q.slice(0, k)); }
    void A; void B;
    /* 分かれたあと、丸い細胞にもどる */
    function rnd(Q, sg) {
      if (!round) return Q;
      var c = axis === 'y' ? [0, sg * ry * .5] : [sg * rx * .5, 0], a = axis === 'y' ? rx * .92 : rx * .5, b = axis === 'y' ? ry * .5 : ry * .9;
      return Q.map(function (q) { var th = Math.atan2((q[1] - c[1]) / b, (q[0] - c[0]) / a); return [lerp(q[0], c[0] + Math.cos(th) * a, round), lerp(q[1], c[1] + Math.sin(th) * b, round)]; });
    }
    return '<path d="' + smooth(sh(rnd(rot(left), -1), -1), true) + '"/><path d="' + smooth(sh(rnd(rot(right), 1), 1), true) + '"/>';
  }
  function centrosome(x, y, op, rays) {
    if (op <= .01) return '';
    var s = '<g opacity="' + op.toFixed(2) + '">';
    for (var i = 0; i < 12; i++) { var a = i / 12 * Math.PI * 2; s += '<line x1="' + N(x + Math.cos(a) * 9) + '" y1="' + N(y + Math.sin(a) * 9) + '" x2="' + N(x + Math.cos(a) * (9 + rays)) + '" y2="' + N(y + Math.sin(a) * (9 + rays)) + '" stroke="var(--c5)" stroke-width="1.4" stroke-linecap="round"/>'; }
    s += '<circle cx="' + N(x) + '" cy="' + N(y) + '" r="7.5" fill="var(--c5)" fill-opacity=".3"/><rect x="' + N(x - 5) + '" y="' + N(y - 2) + '" width="10" height="4" rx="1.5" fill="var(--c5)" stroke="var(--ink)" stroke-width=".8"/><rect x="' + N(x - 2) + '" y="' + N(y - 5) + '" width="4" height="10" rx="1.5" fill="var(--c5)" stroke="var(--ink)" stroke-width=".8"/>';
    return s + '</g>';
  }
  function fiber(x1, y1, x2, y2, bend, frac, op) {
    if (op <= .01 || frac <= .01) return '';
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + bend;
    return '<path d="M' + N(x1) + ' ' + N(y1) + 'Q' + N(mx) + ' ' + N(my) + ' ' + N(x2) + ' ' + N(y2) + '" pathLength="1" stroke-dasharray="' + frac.toFixed(3) + ' 2" fill="none" stroke="var(--muted)" stroke-width="1.3" opacity="' + op.toFixed(2) + '"/>';
  }
  var HC = ['var(--c1)', 'var(--c3)', 'var(--c2)', 'var(--c4)']; /* 赤・青（母由来）／ピンク・水色（父由来） */

  /* =====================================================================
     3. 体細胞分裂（なめらかに）
     ===================================================================== */
  (function () {
    var CX = 300, CY = 222;
    var CH = [
      { c: HC[0], L: 28, h: [262, 198], a: 1.1, my: 138 },
      { c: HC[1], L: 18, h: [334, 192], a: 2.0, my: 196 },
      { c: HC[2], L: 28, h: [322, 252], a: 1.9, my: 254 },
      { c: HC[3], L: 18, h: [266, 254], a: 1.25, my: 312 }
    ];
    CH.forEach(function (c, j) { c.W = wiggle(11 + j * 7, 1); });
    var mode = 'animal';
    function phases() {
      var an = mode === 'animal';
      return [
        { n: '間期', dur: 4, d: '核の中で、染色体は細い糸のようにのびて広がっている（DNA はすでに<b>複製</b>されている）。' + (an ? '核の近くに<b>中心体</b>がある。' : '') + '核の中に<b>核小体</b>が見える。' },
        { n: '前期', dur: 7, d: '染色体が<b>太く短く</b>なり（凝縮）、2本の<b class="key">染色分体</b>がくっついた X 字形の染色体が見えるようになる。' + (an ? '<b>中心体</b>が両極へ移動し、' : '両極から') + '<b class="key">紡錘体</b>ができはじめる。核膜と核小体が見えなくなる。' },
        { n: '中期', dur: 5, d: '紡錘糸が染色体の<b>動原体</b>につき、染色体が細胞の中央の<b class="key">赤道面</b>に並ぶ。染色体が最も見やすいので、<b>観察に向く</b>時期。' },
        { n: '後期', dur: 5, d: '各染色体の<b>染色分体が分かれ</b>、紡錘糸に引かれて両極へ移動する。両極に同じ染色体が1本ずつ分かれる。' },
        { n: '終期', dur: 5, d: '染色体が両極に集まり、再び細い糸状にもどる。<b>核膜・核小体が現れ</b>、2つの核ができる。' + (an ? '細胞の中央が<b>くびれ</b>はじめる。' : '赤道面に<b class="key">細胞板</b>ができはじめる。') },
        { n: '細胞質分裂', dur: 5, d: (an ? '動物細胞では、細胞膜が外側から<b class="key">くびれ</b>て細胞質が2つに分かれる。' : '植物細胞では、<b class="key">細胞板</b>が内側から外側へ広がり、新しい細胞壁になって細胞質を仕切る。') + '同じ遺伝情報（<b>2n＝4</b>）をもつ2つの娘細胞ができる。' }
      ];
    }
    function render(k, u) {
      var an = mode === 'animal', s = '';
      var cond = [0, es(u, .05, .65), 1, 1, 1 - .85 * es(u, .3, .9), .15 * (1 - es(u, 0, .5))][k];
      var env = k === 0 ? 1 : k === 1 ? 1 - es(u, .62, .95) : 0, nucl = k === 0 ? 1 : k === 1 ? 1 - es(u, .15, .45) : 0;
      var newEnv = k === 4 ? es(u, .35, .8) : k === 5 ? 1 : 0;
      var m = k < 2 ? 0 : k === 2 ? es(u, 0, .55) : 1;
      var ana = k < 3 ? 0 : k === 3 ? es(u, .05, .9) : 1;
      var el = k < 3 ? 0 : k === 3 ? es(u, .2, 1) : 1;
      var pin = !an ? 0 : k === 4 ? .5 * es(u, .4, 1) : k === 5 ? lerp(.5, 1, es(u, 0, .6)) : 0, gap = k === 5 && an ? 12 * es(u, .6, 1) : 0;
      var plate = an ? 0 : k === 4 ? .3 * es(u, .45, 1) : k === 5 ? .3 + .7 * es(u, 0, .7) : 0;
      var spg = [0, es(u, .25, .9), 1, 1, 1 - es(u, .1, .6), 0][k], att = k === 2 ? es(u, 0, .25) : k === 3 ? 1 : k === 4 ? 1 - es(u, 0, .4) : 0;
      var vb = k === 3 ? 24 * Math.sin(Math.PI * Math.min(1, ana * 1.1) * .5) : k === 4 ? 24 * (1 - es(u, 0, .5)) : 0;
      /* 細胞 */
      var rx = 172 + 40 * el, ry = 140 - 14 * el;
      if (an) s += '<g fill="var(--cyto)" stroke="' + MEM + '" stroke-width="3.2">' + cellPath(CX, CY, rx, ry, pin, gap, 'x', k === 5 ? es(u, .5, 1) : 0) + '</g>';
      else {
        s += '<rect x="' + (CX - 214) + '" y="' + (CY - 146) + '" width="428" height="292" rx="10" fill="var(--leaf)" fill-opacity=".28" stroke="var(--leaf2)" stroke-width="3"/>';
        s += '<rect x="' + (CX - 205) + '" y="' + (CY - 137) + '" width="410" height="274" rx="6" fill="var(--cyto)" stroke="' + MEM + '" stroke-width="2"/>';
      }
      /* 古い核 */
      if (env > .01) s += '<circle cx="' + CX + '" cy="' + CY + '" r="80" fill="var(--nuc)" fill-opacity="' + (.9 * env).toFixed(2) + '" stroke="var(--c6)" stroke-width="3" stroke-dasharray="' + (env > .98 ? 'none' : N(30 * env + 2) + ' ' + N(14 * (1 - env) + 3)) + '" opacity="' + Math.min(1, env * 1.6).toFixed(2) + '"/>';
      if (nucl > .01) s += '<circle cx="322" cy="238" r="13" fill="var(--c6)" opacity="' + (.55 * nucl).toFixed(2) + '"/>';
      /* 新しい核 */
      var dx = 139;
      if (newEnv > .01) [-1, 1].forEach(function (sd) {
        var x = CX + sd * (dx + gap); s += '<circle cx="' + N(x) + '" cy="' + CY + '" r="' + N(38 + 12 * newEnv) + '" fill="var(--nuc)" fill-opacity="' + (.85 * newEnv).toFixed(2) + '" stroke="var(--c6)" stroke-width="2.6" stroke-dasharray="' + (newEnv > .98 ? 'none' : N(28 * newEnv + 2) + ' ' + N(12 * (1 - newEnv) + 3)) + '" opacity="' + newEnv.toFixed(2) + '"/>';
        if (newEnv > .5) s += '<circle cx="' + N(x + sd * 14) + '" cy="' + (CY + 12) + '" r="9" fill="var(--c6)" opacity="' + (.55 * es(newEnv, .5, 1)).toFixed(2) + '"/>';
      });
      /* 細胞板 */
      if (plate > .01) {
        var hh = plate < .3 ? 60 * plate / .3 : 60 + (137 - 60) * (plate - .3) / .7, ves = '';
        if (plate < .5) for (var vi = -5; vi <= 5; vi++) { var vy = CY + vi * 12; if (Math.abs(vi * 12) < hh + 6) ves += '<circle cx="' + (CX + (vi % 2) * 3) + '" cy="' + vy + '" r="4" fill="var(--leaf)" stroke="var(--leaf2)" stroke-width="1"/>'; }
        s += ves + '<line x1="' + CX + '" y1="' + N(CY - hh) + '" x2="' + CX + '" y2="' + N(CY + hh) + '" stroke="var(--leaf2)" stroke-width="' + N(lerp(2, 6, es(plate, .3, 1))) + '" stroke-linecap="round" opacity="' + es(plate, .1, .4).toFixed(2) + '"/>';
      }
      /* 極と紡錘体 */
      var pole = (an ? 178 : 172) + 34 * el, PLx = CX - pole, PRx = CX + pole;
      var cen = [];
      if (an) {
        var ce = k === 0 ? 0 : k === 1 ? es(u, .1, .75) : 1, R0 = lerp(96, pole, ce);
        cen = [[CX + R0 * Math.cos(lerp(-Math.PI / 2 - .12, -Math.PI, ce)), CY + R0 * Math.sin(lerp(-Math.PI / 2 - .12, -Math.PI, ce))], [CX + R0 * Math.cos(lerp(-Math.PI / 2 + .12, 0, ce)), CY + R0 * Math.sin(lerp(-Math.PI / 2 + .12, 0, ce))]];
        if (k === 5) { cen[0][0] -= gap; cen[1][0] += gap; }
      }
      var PL = an ? cen[0] : [PLx, CY], PR = an ? cen[1] : [PRx, CY];
      if (spg > .01) {
        for (var fi = -2; fi <= 2; fi++) {
          s += fiber(PL[0], PL[1] + (an ? 0 : fi * 7), CX + 26, CY + fi * 24, fi * 30, spg, .75) + fiber(PR[0], PR[1] + (an ? 0 : fi * 7), CX - 26, CY + fi * 24, fi * 30, spg, .75);
        }
      }
      /* 染色体 */
      var ctPts = [], o = '';
      CH.forEach(function (c, j) {
        var ccx = lerp(c.h[0], CX, m), ccy = lerp(c.h[1], c.my, m), a = lerp(c.a, Math.PI / 2, m);
        [1, -1].forEach(function (sd) {
          var nx = -Math.sin(a), ny = Math.cos(a), d = 4.6 * Math.min(1, cond * 2) + 139 * ana;
          var px = ccx + nx * sd * d, py = lerp(ccy, CY + (ccy - CY) * .5, ana);
          if (k >= 4) py = lerp(py, CY + (ccy - CY) * .3, k === 4 ? es(u, .2, .9) : 1);
          if (k === 5) px += -sd * gap;
          var bow = 5.5 * cond * (1 - ana);
          var Pc = cpts(px, py, a, c.L, function (q) { var aq = Math.abs(q); return sd * (bow * Math.pow(aq, 1.5) - vb * Math.pow(aq, 1.4)); });
          var wsc = k >= 4 ? .5 : 1, Pd = c.W.map(function (w) { return [px + w[0] * wsc + nx * sd * 1.5, py + w[1] * wsc]; });
          var P = mix(Pd, Pc, ease(cond));
          o += drawCT(P, lerp(2.4, 8.5, cond), [[c.c, 0, NP]], lerp(.8, 1, cond));
          ctPts.push({ x: P[NP / 2][0], y: P[NP / 2][1], sd: sd, j: j });
        });
      });
      /* 動原体へつく紡錘糸 */
      if (att > .01) ctPts.forEach(function (q) { var Pp = q.sd > 0 ? PL : PR; s += fiber(Pp[0], Pp[1] + (an ? 0 : (q.y - CY) * .12), q.x, q.y, 0, 1, .9 * att); });
      s += o;
      if (cond > .6 && ana < .05) ctPts.forEach(function (q, i) { if (i % 2 === 0) s += '<circle cx="' + N((q.x + ctPts[i + 1].x) / 2) + '" cy="' + N((q.y + ctPts[i + 1].y) / 2) + '" r="3.4" fill="var(--ink)" opacity="' + es(cond, .6, 1).toFixed(2) + '"/>'; });
      if (an) { s += centrosome(cen[0][0], cen[0][1], 1, 4 + 8 * spg) + centrosome(cen[1][0], cen[1][1], 1, 4 + 8 * spg); }
      /* 赤道面 */
      if (k === 2) s += '<line x1="' + CX + '" y1="' + (CY - 132) + '" x2="' + CX + '" y2="' + (CY + 132) + '" stroke="var(--warm)" stroke-width="1.6" stroke-dasharray="6 5" opacity="' + es(u, .4, .7).toFixed(2) + '"/>';
      /* ラベル */
      var Lb = '';
      if (k === 0) {
        Lb += lab(366, 177, 486, 120, '核膜', { op: es(u, .1, .3) }) + lab(330, 244, 486, 300, '核小体', { op: es(u, .2, .4) }) + lab(250, 206, 112, 300, '染色体', { a: 'end', op: es(u, .3, .5) });
        if (an) Lb += lab(cen[0][0] - 6, cen[0][1] - 4, 112, 110, '中心体', { a: 'end', op: es(u, .4, .6) });
      }
      if (k === 1) {
        Lb += lab(ctPts[0].x - 4, ctPts[0].y, 112, 300, '染色体', { a: 'end' }) + lab(380, 200, 486, 120, '核膜', { op: 1 - es(u, .55, .7) });
        if (an) Lb += lab(cen[0][0] - 4, cen[0][1] - 6, 112, 110, '中心体', { a: 'end' });
        Lb += lab(CX + 90, CY + 52, 486, 330, '紡錘体', { op: es(u, .55, .75) });
      }
      if (k === 2) {
        Lb += lab(CX, CY - 132, CX, 56, '赤道面', { a: 'middle', c: 'var(--warm)', op: es(u, .4, .7) });
        Lb += lab(CX + 70, CY + 40, 486, 352, '紡錘体', { op: 1 });
        Lb += lab(ctPts[3].x + 8, ctPts[3].y, 486, 180, '染色体', { op: es(u, .3, .5) });
      }
      if (k === 3) Lb += lab(ctPts[1].x + 8, ctPts[1].y - 10, 470, 56, '染色分体が両極へ', { a: 'middle', op: es(u, .1, .3) }) + lab(CX - 60, CY + 50, 140, 402, '紡錘糸', { a: 'middle', op: es(u, .1, .3) });
      if (k === 4) {
        Lb += lab(CX + dx + 34, CY - 36, 470, 56, '核膜が現れる', { a: 'middle', op: es(u, .45, .7) });
        Lb += an ? lab(CX, CY - ry * (1 - pin) + 2, 210, 56, 'くびれ', { a: 'middle', op: es(u, .5, .7) }) : lab(CX, CY - 40, 210, 56, '細胞板', { a: 'middle', op: es(u, .5, .7) });
      }
      if (k === 5) {
        Lb += lab(CX - dx - gap, CY + 54, 150, 404, '娘細胞（2n＝4）', { a: 'middle', op: es(u, .5, .8) }) + lab(CX + dx + gap, CY + 54, 450, 404, '娘細胞（2n＝4）', { a: 'middle', op: es(u, .5, .8) });
        if (!an) Lb += lab(CX, CY - 100, CX, 56, '細胞板 → 新しい細胞壁', { a: 'middle', op: es(u, .2, .4) });
        else Lb += lab(CX, CY - 4, CX, 56, 'くびれて2つに', { a: 'middle', op: es(u, .1, .3) * (1 - es(u, .85, 1)) });
      }
      s += Lb;
      s += tx(F > 1 ? 546 : 592, 434, '2n＝4（赤・ピンク、青・水色がそれぞれ相同染色体）', { a: 'end', s: F > 1 ? 10 : 11.5, w: 500, c: 'var(--muted)' });
      return s;
    }
    BL.addSim({
      id: 'a-mitosis', anim: true, name: '体細胞分裂（なめらかに）', cat: 'アニメーション', subj: 'kiso', ic: '裂',
      lead: '間期→前期→中期→後期→終期→細胞質分裂を連続で。動物細胞と植物細胞のちがいも',
      how: '<p>体細胞分裂では、間期に<b>複製</b>した染色体（2本の<b class="key">染色分体</b>）が、分裂期に分かれて2つの細胞へ等しく分配される。</p><ul><li><b>前期</b>：染色体が凝縮し、紡錘体ができる。核膜が消える。</li><li><b>中期</b>：染色体が<b class="key">赤道面</b>に並ぶ。</li><li><b>後期</b>：染色分体が分かれて両極へ。</li><li><b>終期</b>：核膜が現れ、細胞質分裂が起こる。</li></ul><div class="box">動物細胞：外側から<b>くびれる</b>（中心体あり）<br>植物細胞：<b>細胞板</b>が内側から広がる（中心体なし）</div>',
      pts: [[1, '分裂の前後で染色体数は変わらない（2n → 2n）'], [1, '中期は染色体が赤道面に並び、観察しやすい'], [0, '後期には相同染色体どうしが分かれる → ×（染色分体が分かれる）'], [1, '植物細胞は細胞板で、動物細胞はくびれで細胞質分裂する']],
      tasks: ['動物細胞で最後まで見る', '植物細胞で最後まで見る', '中期（赤道面）を見る'],
      slides: [['k2-2', 3]],
      mount: function (stage, ctl, api) {
        mode = 'animal';
        BL.ui.seg(ctl, '細胞', [['animal', '動物細胞'], ['plant', '植物細胞']], mode, function (v) { mode = v; var ph = phases(); P.phases.forEach(function (p, i) { p.d = ph[i].d; }); P.retext(); });
        var P = player(stage, ctl, { vb: '0 0 600 440', vbN: '50 40 500 400', phases: phases(), render: render, onPhase: function (k) { if (k === 2) api.task(2); }, onEnd: function () { api.task(mode === 'animal' ? 0 : 1); } });
        return P.stop;
      }
    });
  })();

  /* =====================================================================
     4. 減数分裂と乗換え
     ===================================================================== */
  (function () {
    var CX = 300, CY = 220;
    /* 相同染色体（R・P：長い、L・B：短い）。hoff：二価染色体の中での位置 */
    var HO = {
      R: { c: HC[0], L: 40, home: [232, 172], ha: 1.15, hoff: -12, bv: 0, sg: -1 },
      P: { c: HC[2], L: 40, home: [340, 274], ha: 2.05, hoff: 12, bv: 0, sg: 1 },
      L: { c: HC[3], L: 26, home: [354, 166], ha: 1.95, hoff: -12, bv: 1, sg: -1 },
      B: { c: HC[1], L: 26, home: [244, 272], ha: .95, hoff: 12, bv: 1, sg: 1 }
    };
    /* 二価染色体の位置（前期・中期） */
    var BV = [{ pro: [256, 204], meta: [CX, 150], sc: -.38, dir: -1 }, { pro: [350, 228], meta: [CX, 296], sc: .38, dir: 1 }];
    /* 染色分体：h 相同染色体、w 相同染色体の中での位置、x 乗換えの相手への向き（0 は乗換えなし）、tip 乗換え後の先の色 */
    var CT = [
      { h: 'R', w: -6, x: 0 }, { h: 'R', w: 6, x: 1, tip: 'P' }, { h: 'P', w: -6, x: -1, tip: 'R' }, { h: 'P', w: 6, x: 0 },
      { h: 'L', w: -6, x: 0 }, { h: 'L', w: 6, x: 1, tip: 'B' }, { h: 'B', w: -6, x: -1, tip: 'L' }, { h: 'B', w: 6, x: 0 }
    ];
    CT.forEach(function (c, i) { c.W = wiggle(31 + i * 5 + (c.w > 0 ? 0 : 2), .9); });
    for (var hk in HO) HO[hk].W = wiggle(hk.charCodeAt(0) * 3, 1);
    var PH = [
      { n: '第一分裂 前期：相同染色体の対合', s: '対合', dur: 6, d: '複製された染色体が凝縮して見えるようになる。形と大きさが同じ<b class="key">相同染色体</b>どうしが平行に並んで くっつく（<b class="key">対合</b>）。対合した1組を<b class="key">二価染色体</b>という（染色分体は4本）。' },
      { n: '乗換え', s: '乗換え', dur: 7, d: '二価染色体の中で、相同染色体の染色分体どうしが交差し（<b class="key">キアズマ</b>）、その部分で切れて つなぎかわる（<b class="key">乗換え</b>）。これで遺伝子の新しい組み合わせができる（<b>組換え</b>）。' },
      { n: '第一分裂 中期', s: '中期Ⅰ', dur: 4, d: '核膜が消え、<b>二価染色体</b>が赤道面に並ぶ。相同染色体の一方ずつが、それぞれ反対の極を向く。' },
      { n: '第一分裂 後期・終期', s: '後期Ⅰ', dur: 6, d: '<b>相同染色体どうしが分かれ</b>て両極へ移動し、細胞が2つに分かれる。染色体数は半分（<b>2n → n</b>）になる。どちらの極へ行くかは染色体ごとに独立（<b>独立の法則</b>のもと）。' },
      { n: '第二分裂 中期', s: '中期Ⅱ', dur: 4, d: '第二分裂の前には <b>DNA の複製は起こらない</b>。それぞれの細胞で、染色体が赤道面に並ぶ。' },
      { n: '第二分裂 後期・終期', s: '後期Ⅱ', dur: 6, d: '体細胞分裂と同じように、<b>染色分体が分かれ</b>て両極へ移動し、それぞれの細胞がさらに2つに分かれる。' },
      { n: '4つの娘細胞（n＝2）', s: '完成', dur: 4, d: '1つの母細胞（2n＝4）から、染色体数が半分（<b>n＝2</b>）の細胞が<b>4つ</b>できる。乗換えと、相同染色体の分かれ方の組み合わせにより、<b>4つとも遺伝子の組み合わせがちがう</b>。' }
    ];
    function W(s, sc, dir) { return ease(dir < 0 ? (sc - s) / .3 : (s - sc) / .3); }
    function render(k, u, t) {
      var s = '', cond = k === 0 ? es(u, 0, .45) : 1, pair = k === 0 ? es(u, .45, .95) : 1, LX = F > 1 ? 114 : 96, RX = F > 1 ? 466 : 504;
      var env = k <= 1 ? 1 : k === 2 ? 1 - es(u, 0, .35) : 0;
      /* 細胞 */
      var cells = '';
      if (k <= 2) cells = cellPath(CX, CY, 200, 150, 0, 0, 'x');
      else if (k === 3) cells = cellPath(CX, CY, 200, 150, es(u, .45, .9), 35 * es(u, .8, 1), 'x', es(u, .8, 1));
      else {
        var p5 = k === 5 ? es(u, .45, .9) : k === 6 ? 1 : 0, g5 = k === 5 ? 32.5 * es(u, .8, 1) : k === 6 ? 32.5 : 0, r5 = k === 5 ? es(u, .8, 1) : k === 6 ? 1 : 0;
        cells = cellPath(CX - 135, CY, 100, 135, p5, g5, 'y', r5) + cellPath(CX + 135, CY, 100, 135, p5, g5, 'y', r5);
      }
      s += '<g fill="var(--cyto)" stroke="' + MEM + '" stroke-width="3">' + cells + '</g>';
      if (env > .01) s += '<circle cx="' + CX + '" cy="' + CY + '" r="112" fill="var(--nuc)" fill-opacity="' + (.85 * env).toFixed(2) + '" stroke="var(--c6)" stroke-width="2.8" stroke-dasharray="' + (env > .98 ? 'none' : N(30 * env + 2) + ' ' + N(14 * (1 - env) + 3)) + '" opacity="' + Math.min(1, env * 1.5).toFixed(2) + '"/>';
      /* 相同染色体の位置 */
      var hp = {};
      for (var h in HO) {
        var H = HO[h], bv = BV[H.bv], c, a;
        if (k <= 1) { a = lerp(H.ha, Math.PI / 2, pair); var bc = [bv.pro[0] + H.hoff, bv.pro[1]]; c = [lerp(H.home[0], bc[0], pair), lerp(H.home[1], bc[1], pair)]; }
        else if (k === 2) { var m2 = es(u, 0, .6); a = Math.PI / 2; c = [lerp(bv.pro[0], bv.meta[0], m2) + H.hoff, lerp(bv.pro[1], bv.meta[1], m2)]; }
        else if (k === 3) { a = Math.PI / 2; c = [lerp(CX + H.hoff, CX + H.sg * 135, es(u, .05, .7)), bv.meta[1]]; }
        else {
          var e4 = k === 4 ? es(u, 0, .7) : 1, cc = CX + H.sg * 135, tgt = [cc + (H.bv ? 44 : -32), CY];
          a = lerp(Math.PI / 2, h === 'B' ? Math.PI : 0, e4); c = [lerp(cc, tgt[0], e4), lerp(bv.meta[1], tgt[1], e4)];
        }
        hp[h] = { c: c, a: a };
      }
      /* 紡錘体 */
      var spI = k === 2 ? es(u, .2, .6) : k === 3 ? 1 - es(u, .55, .8) : 0, spII = k === 4 ? es(u, .3, .7) : k === 5 ? 1 - es(u, .55, .8) : 0;
      var poles = [];
      if (spI > .01) {
        var PLx = CX - 188, PRx = CX + 188;
        for (var fi = -2; fi <= 2; fi++) s += fiber(PLx, CY, CX + 24, CY + fi * 30, fi * 34, 1, .6 * spI) + fiber(PRx, CY, CX - 24, CY + fi * 30, fi * 34, 1, .6 * spI);
        for (h in HO) { var hc = hp[h].c; s += fiber(HO[h].sg < 0 ? PLx : PRx, CY, hc[0], hc[1], 0, 1, .9 * spI); }
        poles.push([PLx, CY, spI], [PRx, CY, spI]);
      }
      if (spII > .01) [-1, 1].forEach(function (sg) {
        var cx2 = CX + sg * 135, T2 = CY - 112, B2 = CY + 112;
        for (var fj = -2; fj <= 2; fj++) s += fiber(cx2, T2, cx2 + fj * 22, CY + 16, fj * 16, 1, .5 * spII) + fiber(cx2, B2, cx2 + fj * 22, CY - 16, fj * 16, 1, .5 * spII);
        poles.push([cx2, T2, spII], [cx2, B2, spII]);
      });
      /* 染色分体 */
      var o = '', cross = null, sp5 = k === 5 ? es(u, .05, .7) : k === 6 ? 1 : 0, vb5 = k === 5 ? 18 * Math.sin(Math.PI * Math.min(1, sp5)) : 0;
      var chi = k === 1 ? es(u, .05, .35) : 0, cut = k === 1 ? u >= .6 : k > 1, rho = k === 1 ? es(u, .62, .95) : k > 1 ? 1 : 0;
      CT.forEach(function (q) {
        var H = HO[q.h], P0 = hp[q.h], bv = BV[H.bv], nx = Math.sin(P0.a), ny = -Math.cos(P0.a);
        var d = q.w * Math.min(1, cond * 1.4 + .2) + (q.w > 0 ? 1 : -1) * 92 * sp5;
        var cx3 = P0.c[0] + nx * d, cy3 = P0.c[1] + ny * d;
        var off = function (sv) {
          var o2 = 0, ww = W(sv, bv.sc, bv.dir);
          if (q.x) { if (!cut) o2 = 12 * q.x * chi * ww; else { var cu = 12 * q.x * (ww < .5 ? ww : 1 - ww); o2 = lerp(cu, 0, rho); } }
          if (vb5) o2 -= (q.w > 0 ? 1 : -1) * vb5 * Math.pow(Math.abs(sv), 1.4);
          return o2 + (q.w > 0 ? 1 : -1) * 1.2 * cond * Math.pow(Math.abs(sv), 2) * (k <= 2 ? 1 : 0);
        };
        var Pc = cpts(cx3, cy3, P0.a + Math.PI, H.L, function (sv) { return -off(sv); });
        /* cpts の法線は (-sin a, cos a)。a+π で (sin a, -cos a) にそろえる */
        Pc = cpts(cx3, cy3, P0.a, H.L, function (sv) { return -off(sv); });
        var Pd = H.W.map(function (w2, i) { return [P0.c[0] + w2[0] + q.w * .3, P0.c[1] + w2[1] + q.w * .3 + q.W[i][1] * .15]; });
        var P = cond < 1 ? mix(Pd, Pc, ease(cond)) : Pc;
        var ix = 0; for (var i = 0; i <= NP; i++) { var sv = -1 + 2 * i / NP; if (W(sv, bv.sc, bv.dir) >= .5) { ix = i; if (bv.dir < 0) continue; break; } }
        var cols = [[H.c, 0, NP]];
        if (q.x && cut) cols = bv.dir < 0 ? [[HO[q.tip].c, 0, ix], [H.c, ix, NP]] : [[H.c, 0, ix], [HO[q.tip].c, ix, NP]];
        o += drawCT(P, lerp(2.6, 9, cond), cols, lerp(.8, 1, cond));
        if (q.x === 1 && k === 1) { var sx = -1 + 2 * (ix + (bv.dir < 0 ? .5 : -.5)) / NP; (cross = cross || []).push([P0.c[0] + nx * (q.w + 6), P0.c[1] + sx * H.L]); }
      });
      s += o;
      /* 動原体 */
      if (cond > .7 && sp5 < .02) for (h in HO) { var cc2 = hp[h].c; s += '<circle cx="' + N(cc2[0]) + '" cy="' + N(cc2[1]) + '" r="3.2" fill="var(--ink)" opacity="' + es(cond, .7, 1).toFixed(2) + '"/>'; }
      poles.forEach(function (p) { s += centrosome(p[0], p[1], p[2], 10); });
      /* キアズマ・乗換え */
      if (k === 1 && cross) {
        var fl = es(u, .33, .4) * (1 - es(u, .6, .66));
        if (fl > .01) cross.forEach(function (cp) { s += '<circle cx="' + N(cp[0]) + '" cy="' + N(cp[1]) + '" r="' + N(14 + 3 * Math.sin(t * 9)) + '" fill="none" stroke="var(--warm)" stroke-width="2.6" opacity="' + fl.toFixed(2) + '"/>'; });
        s += lab(cross[0][0] - 14, cross[0][1] - 4, LX, 118, 'キアズマ', { a: 'end', op: es(u, .3, .4) * (1 - es(u, .9, 1)) });
        s += tx(CX, 52, '交差した所で切れて、つなぎかわる', { a: 'middle', s: 14, c: 'var(--warm)', op: es(u, .38, .48) * (1 - es(u, .9, 1)) });
        var bv2 = BV[1], cs2 = hp.L.c;
        s += lab(cs2[0] + 6, bv2.pro[1] + 22, CX, 420, '組換えが起こった染色分体', { a: 'middle', op: es(u, .75, .9) });
      }
      /* ラベル */
      if (k === 0) {
        s += lab(hp.R.c[0] - 8, hp.R.c[1] - 20, LX, 118, '相同染色体', { a: 'end', op: es(u, .35, .5) * (1 - es(u, .75, .85)) }) + lab(hp.P.c[0] + 8, hp.P.c[1] + 18, RX, 330, '相同染色体', { op: es(u, .35, .5) * (1 - es(u, .75, .85)) });
        s += lab(hp.R.c[0] - 12, hp.R.c[1] - 26, LX, 118, '二価染色体', { a: 'end', op: es(u, .85, 1) }) + lab(hp.L.c[0] + 24, hp.L.c[1], RX, 160, '二価染色体', { op: es(u, .85, 1) });
        s += lab(390, 140, RX, 92, '核膜', { op: es(u, .1, .3) * (1 - es(u, .75, .85)) });
      }
      if (k === 2) s += '<line x1="' + CX + '" y1="' + (CY - 140) + '" x2="' + CX + '" y2="' + (CY + 140) + '" stroke="var(--warm)" stroke-width="1.6" stroke-dasharray="6 5" opacity="' + es(u, .4, .7).toFixed(2) + '"/>' + lab(CX, CY - 140, CX, 52, '赤道面', { a: 'middle', c: 'var(--warm)', op: es(u, .4, .7) }) + lab(hp.P.c[0] + 10, hp.P.c[1] + 20, RX, 120, '二価染色体', { op: es(u, .3, .5) });
      if (k === 3) s += tx(CX, 52, '相同染色体どうしが分かれる', { a: 'middle', s: 15, c: 'var(--accent)', op: es(u, .1, .3) }) + tx(CX - 135, 410, 'n＝2', { a: 'middle', s: 15, op: es(u, .8, 1) }) + tx(CX + 135, 410, 'n＝2', { a: 'middle', s: 15, op: es(u, .8, 1) });
      if (k === 4) s += tx(CX, 52, 'DNA は複製しないで、すぐ第二分裂', { a: 'middle', s: 14.5, c: 'var(--accent)', op: es(u, .1, .3) });
      if (k === 5) s += tx(CX, 30, '染色分体どうしが分かれる', { a: 'middle', s: 15, c: 'var(--accent)', op: es(u, .1, .3) });
      if (k === 6) {
        [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (p, i) { s += tx(CX + p[0] * 135, CY + p[1] * 100 + 40, 'n＝2', { a: 'middle', s: 14, op: es(u, .1 + i * .1, .25 + i * .1) }); });
        s += tx(CX, 437, '4つとも 組み合わせがちがう', { a: 'middle', s: 15, c: 'var(--accent)', op: es(u, .5, .7) });
      }
      if (k < 6) s += tx(F > 1 ? 556 : 592, 437, k < 3 ? '母細胞 2n＝4' : '', { a: 'end', s: 12, w: 500, c: 'var(--muted)' });
      return s;
    }
    BL.addSim({
      id: 'a-meiosis', anim: true, name: '減数分裂と乗換え', cat: 'アニメーション', subj: 'bio', ic: '減',
      lead: '対合 → 乗換え → 第一分裂（相同染色体が分かれる）→ 第二分裂 → 4つの細胞（n）',
      how: '<p><b class="key">減数分裂</b>は、配偶子（卵・精子）などをつくるときの分裂。2回続けて分裂し、染色体数が半分（2n → n）の細胞が4つできる。</p><ul><li><b>第一分裂</b>：相同染色体が<b class="key">対合</b>して<b class="key">二価染色体</b>になり、<b class="key">乗換え</b>が起こる。その後、<b>相同染色体どうしが分かれる</b>。</li><li><b>第二分裂</b>：DNA は複製せずに、<b>染色分体どうしが分かれる</b>。</li></ul><div class="box">乗換え ＋ 相同染色体の分かれ方の組み合わせ（2<sup>n</sup> 通り）→ 多様な配偶子</div>',
      pts: [[1, '第一分裂で相同染色体が分かれ、染色体数が半分になる'], [1, '乗換えは第一分裂前期の二価染色体で起こる'], [0, '第二分裂の前にも DNA が複製される → ×'], [1, '1つの母細胞から、遺伝子の組み合わせのちがう4つの細胞ができる']],
      tasks: ['乗換えを見る', '第一分裂で相同染色体が分かれるのを見る', '最後まで見て4つの細胞をくらべる'],
      slides: [['b1-3', 1], ['b1-3', 2]],
      mount: function (stage, ctl, api) {
        var P = player(stage, ctl, { vb: '0 0 600 445', vbN: '40 12 520 433', phases: PH, render: render, onPhase: function (k) { if (k === 2) api.task(0); if (k === 4) api.task(1); }, onEnd: function () { api.task(2); } });
        return P.stop;
      }
    });
  })();

  /* =====================================================================
     5. 膜輸送（拡散・チャネル・ナトリウムポンプ・浸透）
     ===================================================================== */
  (function () {
    var MT = 178, MB = 242, MY = 210; /* 膜の上・下・中央 */
    var HEAD = '#e2bd55', HEADL = '#9c7a1c';
    function bilayer(skip) {
      var s = '';
      for (var x = 8; x < 600; x += 16) {
        if (skip && Math.abs(x - 300) < 42) continue;
        [[MT + 8, 1], [MB - 8, -1]].forEach(function (r) {
          var y = r[0], d = r[1];
          s += '<path d="M' + (x - 3) + ' ' + (y + d * 5) + 'q-2 ' + d * 6 + ' 0 ' + d * 11 + 't0 ' + d * 9 + 'M' + (x + 3) + ' ' + (y + d * 5) + 'q2 ' + d * 6 + ' 0 ' + d * 11 + 't0 ' + d * 9 + '" fill="none" stroke="var(--muted)" stroke-width="1.6" stroke-linecap="round"/>';
          s += '<circle cx="' + x + '" cy="' + y + '" r="6.6" fill="' + HEAD + '" stroke="' + HEADL + '" stroke-width="1.2"/>';
        });
      }
      return s;
    }
    function bg() {
      return '<rect x="0" y="0" width="600" height="' + MT + '" fill="var(--water)" opacity=".7"/><rect x="0" y="' + MB + '" width="600" height="' + (420 - MB) + '" fill="var(--cyto)"/>' +
        tx(10, 24, '細胞外', { s: 14, c: 'var(--muted)' }) + tx(10, 410, '細胞内（細胞質）', { s: 14, c: 'var(--muted)' });
    }
    function ion(x, y, kind, op) {
      var r = kind === 'K' ? 10 : 8.5, c = kind === 'K' ? 'var(--c6)' : kind === 'O' ? 'var(--ask)' : 'var(--c5)';
      if (kind === 'W') return '<circle cx="' + N(x) + '" cy="' + N(y) + '" r="3.2" fill="var(--ask)"/>';
      if (kind === 'S') return '<circle cx="' + N(x) + '" cy="' + N(y) + '" r="7" fill="var(--c5)" stroke="var(--ink)" stroke-width=".9"/>';
      if (kind === 'O') return '<g' + (op != null ? ' opacity="' + op.toFixed(2) + '"' : '') + '><circle cx="' + N(x - 3.6) + '" cy="' + N(y) + '" r="5.4" fill="' + c + '" stroke="var(--ink)" stroke-width=".8"/><circle cx="' + N(x + 3.6) + '" cy="' + N(y) + '" r="5.4" fill="' + c + '" stroke="var(--ink)" stroke-width=".8"/></g>';
      return '<g' + (op != null ? ' opacity="' + op.toFixed(2) + '"' : '') + '><circle cx="' + N(x) + '" cy="' + N(y) + '" r="' + r + '" fill="' + c + '" stroke="var(--ink)" stroke-width=".9"/><path d="M' + N(x - 3.5) + ' ' + N(y) + 'h7M' + N(x) + ' ' + N(y - 3.5) + 'v7" stroke="var(--panel)" stroke-width="1.8" stroke-linecap="round"/></g>';
    }
    function legend(items, y) {
      var s = '', x = 592;
      for (var i = items.length - 1; i >= 0; i--) { var w = items[i][1].length * 12 * F + 22; x -= w; s += ion(x + 8, y - 5, items[i][0]) + tx(x + 20, y, items[i][1], { s: 12, w: 600 }); x -= 8; }
      return s;
    }

    /* ---- 粒子のシミュレーション（同じ乱数で、何度でも同じ動き） ---- */
    var TRANS = [[4.4, 1], [5.0, 1], [5.6, 1], [6.3, 1], [7.0, 1], [7.8, 1], [8.6, 1], [9.5, 1], [10.5, 1], [11.6, -1], [12.4, 1], [13.6, 1], [15.0, 1], [16.6, 1]];
    function Sim(kind) {
      var S = { t: 0, P: [], R: null, ti: 0 };
      function init() {
        S.t = 0; S.ti = 0; S.R = rng(kind === 'diff' ? 77 : 123); S.P = [];
        var nOut = kind === 'diff' ? 34 : 28, nIn = 4, R = S.R;
        for (var i = 0; i < nOut + nIn; i++) { var out = i < nOut; S.P.push({ x: 20 + R() * 560, y: out ? 20 + R() * 140 : 262 + R() * 136, th: R() * 6.283, out: out, tr: null }); }
      }
      function step(dt) {
        var R = S.R, open = kind === 'diff' ? S.t >= 3 : false;
        if (kind === 'chan') while (S.ti < TRANS.length && S.t >= TRANS[S.ti][0]) {
          var dir = TRANS[S.ti][1], best = null, bd = 1e9;
          S.P.forEach(function (p) { if (p.tr || p.out !== (dir > 0)) return; var d = Math.hypot(p.x - 300, p.y - (dir > 0 ? 150 : 270)); if (d < bd) { bd = d; best = p; } });
          if (best) best.tr = { dir: dir, st: 0 };
          S.ti++;
        }
        S.P.forEach(function (p) {
          if (p.tr) {
            var tr = p.tr, tx2 = 300, ty2 = tr.st === 0 ? (tr.dir > 0 ? 158 : 262) : (tr.dir > 0 ? 268 : 152), sp = tr.st === 0 ? 170 : 120;
            var dx = tx2 - p.x, dy = ty2 - p.y, d = Math.hypot(dx, dy);
            if (d < sp * dt + .5) { p.x = tx2; p.y = ty2; if (tr.st === 0) tr.st = 1; else { p.tr = null; p.out = tr.dir < 0; p.th = tr.dir > 0 ? Math.PI / 2 : -Math.PI / 2; } }
            else { p.x += dx / d * sp * dt; p.y += dy / d * sp * dt; }
            return;
          }
          p.th += (R() - .5) * .6;
          var v = kind === 'diff' && p.y > MT && p.y < MB ? 90 : 125;
          p.x += Math.cos(p.th) * v * dt; p.y += Math.sin(p.th) * v * dt;
          if (p.x < 12) { p.x = 12; p.th = Math.PI - p.th; } if (p.x > 588) { p.x = 588; p.th = Math.PI - p.th; }
          var lo = 14, hi = 406;
          if (!open) { if (p.out) hi = MT - 10; else lo = MB + 10; }
          if (p.y < lo) { p.y = lo; p.th = -p.th; } if (p.y > hi) { p.y = hi; p.th = -p.th; }
          if (open) p.out = p.y < MY;
        });
        S.t += dt;
      }
      S.seek = function (t) { if (!S.R || t < S.t - 1e-6) init(); while (S.t < t) step(1 / 60); };
      return S;
    }
    var sims = {};

    var PHS = {
      diff: [
        { n: '濃度のちがい', s: '濃度の差', dur: 3, d: '細胞の外に酸素（O<sub>2</sub>）が多く、中に少ない。O<sub>2</sub> や CO<sub>2</sub> のような<b>小さくて電荷をもたない分子</b>は、リン脂質二重層をそのまま通りぬけられる。' },
        { n: '拡散：濃い方からうすい方へ', s: '拡散', dur: 14, d: '分子はでたらめに動き回る（熱運動）。その結果、<b>濃度の高い方から低い方へ</b>広がっていく。これを<b class="key">拡散</b>という。エネルギー（ATP）は使わない（<b>受動輸送</b>）。' },
        { n: '平衡', s: '平衡', dur: 5, d: '濃度が等しくなると、出入りする数がつり合い、見かけ上の移動は止まる。分子はその後も動き続けている。' }
      ],
      chan: [
        { n: 'イオンは脂質二重層を通りにくい', s: '閉', dur: 3, d: 'Na<sup>+</sup> などの<b>イオン</b>は電荷をもつので、リン脂質二重層をほとんど通れない。膜には<b class="key">チャネル</b>（通り道になるタンパク質）がある。' },
        { n: 'チャネルが開く', s: '開く', dur: 1.5, d: '刺激などによって、チャネルの<b>ゲート（とびら）が開く</b>。' },
        { n: '濃度勾配にしたがって通る', s: '通る', dur: 15, d: 'イオンはチャネルを通って、<b>濃度の高い方から低い方へ</b>移動する。決まったイオンだけを通す（選択的）。エネルギーを使わない<b class="key">受動輸送</b>。' },
        { n: '受動輸送のまとめ', s: 'まとめ', dur: 3, d: '濃度の差がなくなると、移動はつり合う。水を通すチャネルは<b class="key">アクアポリン</b>という。' }
      ],
      pump: [
        { n: '細胞内の Na⁺ が3個結合', s: 'Na⁺結合', dur: 3.5, d: '<b class="key">ナトリウムポンプ</b>（Na<sup>+</sup>-K<sup>+</sup>-ATP アーゼ）は、細胞の内側に開いた形で、細胞内の Na<sup>+</sup> を <b>3個</b>結合する。' },
        { n: 'ATP を分解してエネルギーを得る', s: 'ATP', dur: 3.5, d: 'ポンプが <b>ATP を ADP とリン酸に分解</b>し、そのエネルギーを使う。リン酸はポンプにつく。' },
        { n: '形が変わり、Na⁺ を細胞外へ', s: 'Na⁺を外へ', dur: 3.5, d: 'ポンプの<b>形が変わって外側に開き</b>、3個の Na<sup>+</sup> を細胞外へ放出する。Na<sup>+</sup> は外の方が濃いのに、さらに外へ運ばれる。' },
        { n: '細胞外の K⁺ が2個結合', s: 'K⁺結合', dur: 3, d: '外側に開いた形で、細胞外の K<sup>+</sup> を <b>2個</b>結合する。' },
        { n: 'リン酸がはずれ、もとの形に', s: 'もどる', dur: 3, d: 'リン酸がはずれると、ポンプは<b>もとの形（内側に開いた形）</b>にもどる。' },
        { n: 'K⁺ を細胞内へ', s: 'K⁺を中へ', dur: 3, d: '2個の K<sup>+</sup> を細胞内へ放出する。K<sup>+</sup> も、濃い方（細胞内）へさらに運ばれる。' },
        { n: '能動輸送', s: 'まとめ', dur: 4.5, d: 'ATP のエネルギーを使い、<b>濃度勾配に逆らって</b>物質を運ぶことを<b class="key">能動輸送</b>という。その結果、<b>Na<sup>+</sup> は細胞外に多く、K<sup>+</sup> は細胞内に多い</b>状態が保たれる。' }
      ],
      osmo: [
        { n: '半透膜：水は通るが、スクロースは通らない', s: '半透膜', dur: 5, d: '<b class="key">半透膜</b>は、水などの小さな分子は通すが、スクロース（砂糖）などの大きな分子は通さない膜。細胞膜も半透膜に近い性質をもつ（<b>選択的透過性</b>）。' },
        { n: '浸透：水が濃い方へ移動する', s: '浸透', dur: 7, d: '水は両方向に通るが、<b>溶質の濃度が高い方（スクロース水溶液側）へ多く移動</b>する。これを<b class="key">浸透</b>といい、水を引き込む力を<b>浸透圧</b>という。' },
        { n: '赤血球：等張液', s: '等張', dur: 4, d: '外の液の濃度が細胞内と同じ（<b class="key">等張液</b>、ヒトでは約 0.9% 食塩水＝生理食塩水）なら、出入りする水の量がつり合い、形は変わらない。' },
        { n: '赤血球：高張液', s: '高張', dur: 5, d: '外の液の濃度が高い（<b class="key">高張液</b>）と、水が細胞から<b>出ていき</b>、赤血球は<b>縮む</b>（表面がでこぼこになる）。' },
        { n: '赤血球：低張液', s: '低張', dur: 6, d: '外の液の濃度が低い（<b class="key">低張液</b>）と、水が細胞に<b>入り</b>、赤血球はふくらんで、やがて<b>破れる</b>（<b class="key">溶血</b>）。植物細胞は細胞壁があるので破れない。' }
      ]
    };
    var mode = 'diff';

    function rDiff(k, u, t) {
      var S = sims.diff || (sims.diff = Sim('diff')); S.seek(t);
      var s = bg() + bilayer(false), no = 0, ni = 0;
      S.P.forEach(function (p) { s += ion(p.x, p.y, 'O'); if (p.y < MY) no++; else ni++; });
      var op1 = k === 1 ? es(u, .05, .2) * (1 - es(u, .8, 1)) : 0;
      if (op1 > .01) s += '<path d="M44 96v168" stroke="var(--ask)" stroke-width="14" stroke-linecap="round" opacity="' + (.35 * op1).toFixed(2) + '"/>' + arrowHead(44, 300, Math.PI / 2, 26, 'var(--ask)').replace('<path', '<path opacity="' + (.5 * op1).toFixed(2) + '"') + tx(70, 330, '高い → 低い', { s: 13.5, c: 'var(--ask)', op: op1 });
      s += lab(560, MT + 8, 588, 154, '細胞膜（リン脂質二重層）', { a: 'end', s: 12.5 });
      s += '<g>' + tx(588, 26, '細胞外：' + no + ' 個', { a: 'end', s: 14 }) + tx(588, 404, '細胞内：' + ni + ' 個', { a: 'end', s: 14 }) + '</g>';
      s += legend([['O', 'O₂（酸素）']], 382);
      return s;
    }
    function channel(open) {
      var s = '';
      [-1, 1].forEach(function (sd) {
        s += '<rect x="' + (300 + sd * 24 - 15) + '" y="' + (MT - 6) + '" width="30" height="' + (MB - MT + 12) + '" rx="13" fill="var(--c6)" fill-opacity=".5" stroke="var(--c6)" stroke-width="2"/>';
      });
      var ang = -80 * open;
      s += '<g transform="rotate(' + N(ang) + ' 284 ' + (MT - 6) + ')"><rect x="282" y="' + (MT - 10) + '" width="38" height="8" rx="4" fill="var(--c6)" stroke="var(--ink)" stroke-width="1"/></g>';
      return s;
    }
    function rChan(k, u, t) {
      var S = sims.chan || (sims.chan = Sim('chan')); S.seek(t);
      var open = k === 0 ? 0 : k === 1 ? es(u, .1, .9) : 1;
      var s = bg() + bilayer(true) + channel(open), no = 0, ni = 0;
      S.P.forEach(function (p) { s += ion(p.x, p.y, 'Na'); if (p.tr ? p.y < MY : p.out) no++; else ni++; });
      s += lab(276, 214, 150, 154, 'チャネル', { a: 'end', s: 14 }) + lab(284 + 22 * Math.cos(-1.396 * open), MT - 6 + 22 * Math.sin(-1.396 * open), 400, 140, 'ゲート', { s: 13 });
      if (k === 2) s += arrow(362, 150, 362, 276, 'var(--c5)', 4, es(u, 0, .1) * (1 - es(u, .85, 1)) * .8);
      s += tx(588, 26, '細胞外：' + no + ' 個', { a: 'end', s: 14 }) + tx(588, 404, '細胞内：' + ni + ' 個', { a: 'end', s: 14 });
      s += legend([['Na', 'Na⁺（ナトリウムイオン）']], 382);
      return s;
    }
    /* ナトリウムポンプ */
    var BGN = [[60, 60], [120, 120], [180, 50], [250, 100], [420, 60], [470, 120], [530, 70], [565, 135], [90, 150], [370, 120], [210, 150], [500, 30], [330, 40], [150, 30]];
    var BGK_out = [[150, 90], [400, 90], [540, 110]];
    var BGN_in = [[90, 300], [520, 320], [160, 340]];
    var BGK = [[60, 340], [130, 290], [180, 385], [240, 320], [300, 392], [540, 285], [110, 392], [200, 270], [565, 240], [400, 395], [470, 255], [40, 270]];
    function jig(p, i, t) { return [p[0] + 3 * Math.sin(t * 1.3 + i * 1.7), p[1] + 3 * Math.cos(t * 1.1 + i * 2.3)]; }
    function pump(m) {
      var th = lerp(13, -13, m), s = '';
      s += '<g transform="rotate(' + N(th) + ' 279 ' + MY + ')"><rect x="258" y="' + (MY - 52) + '" width="40" height="104" rx="17" fill="var(--c3)" fill-opacity=".38" stroke="var(--c3)" stroke-width="2.2"/></g>';
      s += '<g transform="rotate(' + N(-th) + ' 321 ' + MY + ')"><rect x="302" y="' + (MY - 52) + '" width="40" height="104" rx="17" fill="var(--c3)" fill-opacity=".38" stroke="var(--c3)" stroke-width="2.2"/></g>';
      return s;
    }
    function rPump(k, u, t) {
      var s = bg() + bilayer(true);
      var m = k < 2 ? 0 : k === 2 ? es(u, 0, .45) : k === 3 ? 1 : k === 4 ? 1 - es(u, .3, .9) : 0;
      s += pump(m);
      var dy = lerp(10, -10, m), sitesN = [[291, MY - 8 + dy], [309, MY - 2 + dy], [298, MY + 12 + dy]], sitesK = [[292, MY - 4 + dy], [308, MY + 10 + dy]];
      BGN.forEach(function (p, i) { var q = jig(p, i, t); s += ion(q[0], q[1], 'Na'); });
      BGK_out.forEach(function (p, i) { var q = jig(p, i + 20, t); s += ion(q[0], q[1], 'K'); });
      BGN_in.forEach(function (p, i) { var q = jig(p, i + 30, t); s += ion(q[0], q[1], 'Na'); });
      BGK.forEach(function (p, i) { var q = jig(p, i + 40, t); s += ion(q[0], q[1], 'K'); });
      /* 運ばれる Na⁺ 3個 */
      var nStart = [[230, 300], [350, 330], [280, 360]], nEnd = [[240, 80], [360, 70], [300, 130]];
      sitesN.forEach(function (st, i) {
        var p;
        if (k === 0) p = [lerp(nStart[i][0], st[0], es(u, .1 + i * .1, .6 + i * .1)), lerp(nStart[i][1], st[1], es(u, .1 + i * .1, .6 + i * .1))];
        else if (k === 1 || (k === 2 && u < .45)) p = st;
        else if (k === 2) p = [lerp(st[0], nEnd[i][0], es(u, .45 + i * .08, .85 + i * .05)), lerp(st[1], nEnd[i][1], es(u, .45 + i * .08, .85 + i * .05))];
        else p = jig(nEnd[i], i + 60, t);
        s += ion(p[0], p[1], 'Na');
      });
      /* 運ばれる K⁺ 2個 */
      var kStart = [[220, 70], [380, 110]], kEnd = [[250, 340], [350, 300]];
      sitesK.forEach(function (st, i) {
        var p;
        if (k < 3) p = jig(kStart[i], i + 70, t);
        else if (k === 3) p = [lerp(kStart[i][0], st[0], es(u, .1 + i * .15, .7 + i * .15)), lerp(kStart[i][1], st[1], es(u, .1 + i * .15, .7 + i * .15))];
        else if (k === 4) p = st;
        else if (k === 5) p = [lerp(st[0], kEnd[i][0], es(u, .1 + i * .1, .7 + i * .1)), lerp(st[1], kEnd[i][1], es(u, .1 + i * .1, .7 + i * .1))];
        else p = jig(kEnd[i], i + 80, t);
        s += ion(p[0], p[1], 'K');
      });
      /* ATP → ADP ＋ P */
      function atp(x, y, n, op) {
        var o = '<g opacity="' + op.toFixed(2) + '"><rect x="' + N(x - 22) + '" y="' + N(y - 11) + '" width="30" height="22" rx="8" fill="var(--c1)" fill-opacity=".85"/>';
        for (var j = 0; j < n; j++) o += '<circle cx="' + N(x + 15 + j * 13) + '" cy="' + N(y) + '" r="6" fill="var(--warm)" stroke="var(--ink)" stroke-width=".8"/>';
        return o + tx(x - 7, y + 4.5, n === 3 ? 'ATP' : 'ADP', { a: 'middle', s: 10.5, c: '#fff', h: false }) + '</g>';
      }
      if (k === 1) {
        var ax = lerp(470, 352, es(u, 0, .4)), ay = lerp(340, 262, es(u, 0, .4));
        if (u < .5) s += atp(ax, ay, 3, es(u, 0, .1));
        else s += atp(lerp(352, 450, es(u, .55, 1)), lerp(262, 350, es(u, .55, 1)), 2, 1 - es(u, .8, 1));
        if (u > .45 && u < .8) s += tx(390, 252, 'エネルギー', { s: 13, c: 'var(--warm)', op: es(u, .45, .55) * (1 - es(u, .7, .8)) });
        s += tx(440, 300, 'ATP → ADP ＋ リン酸', { a: 'middle', s: 13, op: es(u, .4, .55) });
      }
      var Pp = null;
      if (k === 1 && u >= .5) Pp = [lerp(378, 340, es(u, .5, .7)), lerp(262, 252, es(u, .5, .7))];
      if (k === 2 || k === 3) Pp = [340 + 6 * Math.sin(m * 3), 252 - 4 * m];
      if (k === 4) Pp = [lerp(340, 400, es(u, 0, .5)), lerp(248, 330, es(u, 0, .5))];
      if (Pp) s += '<g opacity="' + (k === 4 ? 1 - es(u, .3, .55) : 1).toFixed(2) + '"><circle cx="' + N(Pp[0]) + '" cy="' + N(Pp[1]) + '" r="7.5" fill="var(--warm)" stroke="var(--ink)" stroke-width="1"/>' + tx(Pp[0], Pp[1] + 4, 'P', { a: 'middle', s: 10.5, c: '#fff', h: false }) + '</g>';
      s += lab(338, MY - 26, 432, 216, 'ナトリウムポンプ', { s: 13.5, box: 1 });
      if (k === 6) {
        var o6 = es(u, .05, .25);
        s += arrow(150, 300, 150, 110, 'var(--c5)', 5, o6) + tx(164, 140, '3Na⁺ を外へ', { s: 14, op: o6 }) + arrow(565, 110, 565, 300, 'var(--c6)', 5, o6) + tx(552, 290, '2K⁺ を中へ', { a: 'end', s: 14, op: o6 });
        s += tx(300, 24, 'Na⁺：細胞外に多い　K⁺：細胞内に多い', { a: 'middle', s: 13.5, c: 'var(--accent)', op: es(u, .3, .5) });
      }
      s += legend([['Na', 'Na⁺'], ['K', 'K⁺']], 382);
      return s;
    }
    /* 浸透 */
    function rOsmo(k, u, t) {
      var s = '';
      if (k <= 1) {
        var lv = k === 0 ? 0 : es(u, .1, 1), hL = 140 + 40 * lv, hR = 140 - 40 * lv, B = 380;
        s += '<rect x="78" y="62" width="444" height="322" rx="6" fill="none" stroke="var(--muted)" stroke-width="3"/>';
        s += '<rect x="80" y="' + N(hL) + '" width="219" height="' + N(B + 2 - hL) + '" fill="var(--water)"/><rect x="301" y="' + N(hR) + '" width="219" height="' + N(B + 2 - hR) + '" fill="var(--water)"/>';
        s += '<path d="M80 ' + N(hL) + 'H299M301 ' + N(hR) + 'H520" stroke="var(--ask)" stroke-width="2"/>';
        s += '<line x1="300" y1="64" x2="300" y2="382" stroke="var(--c3)" stroke-width="4" stroke-dasharray="7 4"/>';
        for (var i = 0; i < 44; i++) {
          var R = rng(i * 13 + 5), ph = R() * 6.28, w = .35 + R() * .5, ph2 = R() * 6.28, w2 = .5 + R() * .6;
          var x = 300 + 212 * Math.sin(t * w * .8 + ph), side = x < 300 ? hL : hR, y = side + 8 + (B - side - 14) * (.5 + .5 * Math.sin(t * w2 + ph2));
          s += '<circle cx="' + N(x) + '" cy="' + N(y) + '" r="3" fill="var(--ask)"/>';
        }
        for (i = 0; i < 12; i++) {
          var R2 = rng(i * 7 + 99), a = R2() * 6.28, b = R2() * 6.28, ww = .3 + R2() * .4;
          var x2 = 410 + 98 * Math.sin(t * ww + a), y2 = hR + 16 + (B - hR - 26) * (.5 + .5 * Math.sin(t * ww * 1.3 + b));
          s += '<circle cx="' + N(x2) + '" cy="' + N(y2) + '" r="8" fill="var(--c5)" stroke="var(--ink)" stroke-width=".9"/>';
        }
        s += tx(190, 52, '水', { a: 'middle', s: 15 }) + tx(410, 52, 'スクロース水溶液', { a: 'middle', s: 15 });
        s += lab(300, 330, 300, 412, '半透膜', { a: 'middle', c: 'var(--c3)' });
        if (k === 0) s += legend([['W', '水分子'], ['S', 'スクロース']], 412);
        if (k === 1) {
          var oa = es(u, .05, .2);
          s += arrow(240, 260, 360, 260, 'var(--ask)', 6, oa * .85) + tx(300, 240, '水が移動', { a: 'middle', s: 14, c: 'var(--ask)', op: oa });
          s += tx(410, hR - 10, '液面が上がる ↑', { s: 13, c: 'var(--warm)', op: es(u, .5, .7), a: 'middle' }) + tx(190, hL - 10, '液面が下がる ↓', { s: 13, c: 'var(--muted)', op: es(u, .5, .7), a: 'middle' });
        }
        return s;
      }
      /* 赤血球 */
      var kind = k - 2, shr = kind === 1 ? es(u, .15, .7) : 0, sw = kind === 2 ? es(u, .1, .6) : 0, burst = kind === 2 ? es(u, .68, .85) : 0;
      var titles = ['等張液（細胞内と同じ濃度）', '高張液（外の濃度が高い）', '低張液（外の濃度が低い）'];
      s += '<rect x="40" y="62" width="520" height="320" rx="16" fill="var(--water)" stroke="var(--ask)" stroke-width="1.5"/>';
      s += tx(300, 46, titles[kind], { a: 'middle', s: 16 });
      var nd = [14, 34, 4][kind];
      for (var j = 0; j < nd; j++) {
        var Rr = rng(j * 31 + kind * 7 + 1), x3, y3, tries = 0;
        do { x3 = 60 + Rr() * 480; y3 = 82 + Rr() * 280; tries++; } while (Math.hypot(x3 - 300, (y3 - 222) * 1.1) < 128 && tries < 30);
        x3 = clamp(x3 + 6 * Math.sin(t + j), 56, 544); y3 = clamp(y3 + 6 * Math.cos(t * .8 + j), 78, 366);
        s += '<circle cx="' + N(x3) + '" cy="' + N(y3) + '" r="5.5" fill="var(--c5)" stroke="var(--ink)" stroke-width=".7"/>';
      }
      var r0 = 72, r = r0 * (1 - .24 * shr) * (1 + .26 * sw), bumps = 6 * shr, P = [];
      for (var q = 0; q < 96; q++) { var th = q / 96 * 6.283, rq = r + bumps * Math.cos(th * 14); P.push([300 + Math.cos(th) * rq, 222 + Math.sin(th) * rq]); }
      if (burst > .01) s += '<circle cx="300" cy="222" r="' + N(r + 60 * burst) + '" fill="#d9534f" opacity="' + (.3 * burst).toFixed(2) + '"/>';
      s += '<path d="' + smooth(P, true) + '" fill="#d9534f" fill-opacity="' + (1 - .55 * burst).toFixed(2) + '" stroke="#9e2b28" stroke-width="2.4"' + (burst > .05 ? ' stroke-dasharray="' + N(30 - 22 * burst) + ' ' + N(4 + 18 * burst) + '"' : '') + '/>';
      var pal = (1 - sw) * (1 - shr * .6);
      if (pal > .02) s += '<ellipse cx="300" cy="222" rx="' + N(r * .42) + '" ry="' + N(r * .42) + '" fill="#ef9a96" opacity="' + (.85 * pal * (1 - burst)).toFixed(2) + '"/>';
      /* 水の出入り */
      var inw = [0, -1, 1][kind];
      for (var w3 = 0; w3 < 8; w3++) {
        var ang = w3 / 8 * 6.283 + .2, ph3 = (t * .7 + w3 * .13) % 1, op3 = Math.sin(ph3 * Math.PI) * (kind === 2 ? 1 - burst : 1);
        var r1 = r + 18, r2 = r + 52;
        if (inw === 0) { s += arrow(300 + Math.cos(ang) * r2, 222 + Math.sin(ang) * r2, 300 + Math.cos(ang) * r1, 222 + Math.sin(ang) * r1, 'var(--ask)', 2.4, .55) + arrow(300 + Math.cos(ang + .2) * r1, 222 + Math.sin(ang + .2) * r1, 300 + Math.cos(ang + .2) * r2, 222 + Math.sin(ang + .2) * r2, 'var(--ask)', 2.4, .55); }
        else {
          var a1 = inw > 0 ? r2 : r1, a2 = inw > 0 ? r1 : r2, d3 = (a2 - a1) * ph3 * .35;
          s += arrow(300 + Math.cos(ang) * (a1 + d3), 222 + Math.sin(ang) * (a1 + d3), 300 + Math.cos(ang) * (a2 + d3), 222 + Math.sin(ang) * (a2 + d3), 'var(--ask)', 3, op3 * .9);
        }
      }
      s += lab(300 + r * .7, 222 - r * .7, 470, 96, '赤血球', { s: 14 });
      var msg = ['水の出入りがつり合う → 形は変わらない', '水が出ていく → 縮む', burst > .2 ? '破れて中身が出る（溶血）' : '水が入る → ふくらむ'][kind];
      s += tx(300, 410, msg, { a: 'middle', s: 15, c: kind === 2 && burst > .2 ? 'var(--c1)' : 'var(--ask)' });
      s += '<circle cx="62" cy="402" r="5.5" fill="var(--c5)" stroke="var(--ink)" stroke-width=".7"/>' + tx(72, 407, '溶質', { s: 12, w: 600 });
      return s;
    }
    var R = { diff: rDiff, chan: rChan, pump: rPump, osmo: rOsmo };
    BL.addSim({
      id: 'a-transport', anim: true, name: '膜輸送（拡散・ポンプ・浸透）', cat: 'アニメーション', subj: 'bio', ic: '膜',
      lead: '拡散・チャネル（受動輸送）、ナトリウムポンプ（能動輸送）、浸透と赤血球',
      how: '<p>細胞膜は<b class="key">リン脂質二重層</b>にタンパク質がうかんだつくりで、物質を選んで通す（<b>選択的透過性</b>）。</p><ul><li><b class="key">受動輸送</b>：濃度の高い方から低い方へ。エネルギー不要（拡散、<b>チャネル</b>・輸送体）。</li><li><b class="key">能動輸送</b>：ATP のエネルギーを使い、濃度勾配に逆らって運ぶ（<b>ナトリウムポンプ</b>：3Na<sup>+</sup> を外へ、2K<sup>+</sup> を中へ）。</li><li><b class="key">浸透</b>：水が半透膜を通って、溶質の濃い方へ移動する。</li></ul>',
      pts: [[1, 'チャネルによる輸送は、濃度勾配にしたがう受動輸送'], [1, 'ナトリウムポンプは ATP を使い、Na⁺ を外へ、K⁺ を中へ運ぶ'], [0, '赤血球を高張液に入れるとふくらんで破れる → ×（縮む。破れるのは低張液）'], [1, '水は、溶質の濃度が高い方へ浸透する']],
      tasks: ['拡散を最後まで見る', 'ナトリウムポンプの1サイクルを見る', '浸透で赤血球の溶血を見る'],
      slides: [['b2-2', 1], ['b2-1', 4]],
      mount: function (stage, ctl, api) {
        mode = 'diff'; sims = {};
        BL.ui.seg(ctl, '輸送', [['diff', '拡散'], ['chan', 'チャネル'], ['pump', 'ナトリウムポンプ'], ['osmo', '浸透']], mode, function (v) { mode = v; P.set(PHS[v]); });
        var P = player(stage, ctl, {
          vb: '0 0 600 420', phases: PHS.diff, render: function (k, u, t) { return R[mode](k, u, t); },
          onPhase: function (k) { if (mode === 'osmo' && k === 4) api.task(2); },
          onEnd: function () { if (mode === 'diff') api.task(0); if (mode === 'pump') api.task(1); }
        });
        return P.stop;
      }
    });
  })();
})();
