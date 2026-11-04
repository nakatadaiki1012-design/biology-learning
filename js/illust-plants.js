/* 生物ラボ：植物のイラスト（手がきの SVG・博物画ふう）
   使い方：svg の中で最初に BL.ill.defs('接頭辞') を入れてから、各関数で <g> の文字を得る。
   どれも (x, y) が根もと（地面）で、h が高さ（px）。o.seed で形が決まる（同じ seed なら毎回同じ形）。 */
(function () {
  var BL = window.BL = window.BL || {};
  var ill = BL.ill = BL.ill || {};
  var P = 'il', cache = {};

  function f(v) { return String(Math.round(v * 10) / 10); }
  function rng(seed) {
    var a = (seed * 2654435761) >>> 0;
    return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function U(n) { return 'url(#' + P + '-' + n + ')'; }
  /* 点列をなめらかな曲線にする（Catmull-Rom） */
  function smooth(p, closed) {
    var n = p.length, d = 'M' + f(p[0][0]) + ' ' + f(p[0][1]), m = closed ? n : n - 1;
    for (var i = 0; i < m; i++) {
      var p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
      if (!closed) { if (i === 0) p0 = p1; if (i + 2 >= n) p3 = p2; }
      d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }
  function blobPts(r, cx, cy, rx, ry, k, amp) {
    var pts = [], ph = r() * 6.28;
    for (var i = 0; i < k; i++) { var a = ph + i / k * Math.PI * 2, q = 1 + (r() - .5) * 2 * amp; pts.push([cx + Math.cos(a) * rx * q, cy + Math.sin(a) * ry * q]); }
    return pts;
  }
  function blob(r, cx, cy, rx, ry, k, amp) { return smooth(blobPts(r, cx, cy, rx, ry, k || 9, amp == null ? .12 : amp), true); }
  /* 葉の形（原点が葉のつけ根、+x 方向に長さ 1） */
  var SH = {
    ell: ['M', 0, 0, 'Q', .5, -.32, 1, 0, 'Q', .5, .32, 0, 0, 'Z'],
    obo: ['M', 0, 0, 'Q', .15, -.1, .3, -.16, 'Q', .42, -.3, .55, -.24, 'Q', .68, -.38, .8, -.26, 'Q', 1, -.22, 1, 0, 'Q', 1, .22, .8, .26, 'Q', .68, .38, .55, .24, 'Q', .42, .3, .3, .16, 'Q', .15, .1, 0, 0, 'Z'],
    ova: ['M', 0, 0, 'Q', .08, -.32, .4, -.34, 'Q', .52, -.3, .62, -.3, 'Q', .76, -.24, .86, -.15, 'Q', .95, -.06, 1, 0, 'Q', .92, .1, .82, .2, 'Q', .64, .33, .45, .33, 'Q', .12, .3, 0, 0, 'Z'],
    lan: ['M', 0, 0, 'Q', .35, -.26, .7, -.17, 'Q', .9, -.08, 1, 0, 'Q', .9, .08, .7, .17, 'Q', .35, .26, 0, 0, 'Z'],
    tab: ['M', 0, 0, 'Q', .3, -.18, .66, -.3, 'Q', .97, -.28, 1, 0, 'Q', .97, .28, .66, .3, 'Q', .3, .18, 0, 0, 'Z'],
    ita: ['M', 0, 0, 'Q', .02, -.44, .42, -.42, 'Q', .78, -.32, 1, 0, 'Q', .78, .32, .42, .42, 'Q', .02, .44, 0, 0, 'Z'],
    stip: ['M', 0, 0, 'Q', -.1, -.55, .45, -.5, 'Q', .95, -.35, 1, .05, 'Q', .7, .3, .3, .2, 'Q', .1, .1, 0, 0, 'Z']
  };
  function leaf(sh, x, y, ang, len, wid) {
    var c = Math.cos(ang), s = Math.sin(ang), w = wid || 1, out = '', t = SH[sh];
    for (var i = 0; i < t.length; i++) {
      if (typeof t[i] === 'string') { out += t[i]; continue; }
      var u = t[i] * len, v = t[i + 1] * len * w; i++;
      out += f(x + u * c - v * s) + ' ' + f(y + u * s + v * c) + ' ';
    }
    return out;
  }
  function vein(x, y, ang, len) { return 'M' + f(x) + ' ' + f(y) + 'L' + f(x + Math.cos(ang) * len * .85) + ' ' + f(y + Math.sin(ang) * len * .85); }
  function place(inner, x, y, h, flip) { var k = h / 100; return '<g transform="translate(' + f(x) + ' ' + f(y) + ') scale(' + (flip ? -k : k).toFixed(4) + ' ' + k.toFixed(4) + ')">' + inner + '</g>'; }
  function make(key, fn) { key = P + ':' + key; return cache[key] || (cache[key] = fn()); }

  /* ---------- 共通の部品 ---------- */
  ill.defs = function (p) {
    P = p || 'il';
    function rg(n, st, cx, cy, r) { return '<radialGradient id="' + P + '-' + n + '" cx="' + (cx || .38) + '" cy="' + (cy || .32) + '" r="' + (r || .75) + '">' + st.map(function (c, i) { return '<stop offset="' + (c[1] != null ? c[1] : i / (st.length - 1)) + '" stop-color="' + c[0] + '"' + (c[2] != null ? ' stop-opacity="' + c[2] + '"' : '') + '/>'; }).join('') + '</radialGradient>'; }
    function lg(n, st, x2, y2) { return '<linearGradient id="' + P + '-' + n + '" x1="0" y1="0" x2="' + (x2 == null ? 1 : x2) + '" y2="' + (y2 || 0) + '">' + st.map(function (c, i) { return '<stop offset="' + (c[1] != null ? c[1] : i / (st.length - 1)) + '" stop-color="' + c[0] + '"' + (c[2] != null ? ' stop-opacity="' + c[2] + '"' : '') + '/>'; }).join('') + '</linearGradient>'; }
    return '<defs>' +
      rg('oak', [['#cfe48a'], ['#8db44a', .45], ['#4d752b']]) +
      rg('shii', [['#86b464'], ['#3c6e34', .5], ['#1a3a1c']]) +
      rg('tabu', [['#a4cc72'], ['#4b8439', .5], ['#21482a']]) +
      rg('buna', [['#d2ec98'], ['#8cbf55', .45], ['#4b7d2e']]) +
      rg('yasha', [['#bcd87c'], ['#6e9c40', .5], ['#3d6427']]) +
      rg('conif', [['#5f8a68'], ['#2f5a44', .55], ['#183428']]) +
      rg('tuft', [['#4f7a38'], ['#2c4a24', .6], ['#1d331a']]) +
      rg('pea', [['#bfdc9a'], ['#79a85e', .55], ['#4a7a3e']]) +
      rg('rock', [['#9a948c'], ['#68625b', .5], ['#3a3632']], .4, .25, .8) +
      rg('lava', [['#7d736a'], ['#4e4740', .5], ['#2a2622']], .4, .25, .8) +
      rg('peaY', [['#fff6cf'], ['#f4d76e', .3], ['#dcaf34', .75], ['#a7791a']], .36, .3, .8) +
      rg('peaG', [['#f1f9d6'], ['#b4d877', .3], ['#77a840', .75], ['#4b7429']], .36, .3, .8) +
      rg('peaYw', [['#fbefc0'], ['#e9c95e', .35], ['#c9982a', .8], ['#8f6614']], .4, .34, .8) +
      rg('peaGw', [['#e8f3c8'], ['#a5c868', .35], ['#6a9838', .8], ['#405f22']], .4, .34, .8) +
      rg('spec', [['#fff', 0, .95], ['#fff', 1, 0]], .5, .5, .5) +
      rg('shadow', [['#000', 0, .38], ['#000', 1, 0]], .5, .5, .5) +
      rg('acorn', [['#c89a5a'], ['#8a5a28', .6], ['#4f3216']]) +
      lg('barkPine', [['#e2864c'], ['#cf6a3a', .35], ['#9a5638', .55], ['#5f4a3e']], 0, 1) +
      lg('shadeH', [['#000', 0, .5], ['#fff', .28, .22], ['#fff', .42, 0], ['#000', .75, .12], ['#000', 1, .55]]) +
      lg('pod', [['#4f8a34'], ['#9fd06a', .35], ['#c4e690', .5], ['#5c9a3a']], 0, 1) +
      lg('culm', [['#b8b07a'], ['#8a8a4a']], 0, 1) +
      '</defs>';
  };

  function trunkPath(w0, w1, top, bend) {
    var b = bend || 0;
    return 'M' + f(-w0 * .95) + ' 0Q' + f(-w0 * .5) + ' ' + f(-w0 * .15) + ' ' + f(-w0 * .5) + ' ' + f(-w0 * .8) +
      'C' + f(-w0 * .5 + b * .2) + ' ' + f(top * .45) + ' ' + f(-w1 / 2 + b) + ' ' + f(top * .7) + ' ' + f(-w1 / 2 + b) + ' ' + f(top) +
      'L' + f(w1 / 2 + b) + ' ' + f(top) + 'C' + f(w1 / 2 + b) + ' ' + f(top * .7) + ' ' + f(w0 * .5 + b * .2) + ' ' + f(top * .45) + ' ' + f(w0 * .5) + ' ' + f(-w0 * .8) +
      'Q' + f(w0 * .5) + ' ' + f(-w0 * .15) + ' ' + f(w0 * .95) + ' 0Z';
  }
  function tcx(y, top, bend) { var t = y / top; return (bend || 0) * (t * t * .8 + t * .2); }
  /* 先細りの枝 */
  function limb(x0, y0, x1, y1, w0, w1, cv) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / L, ny = dx / L;
    var cx = (x0 + x1) / 2 + nx * (cv || 0), cy = (y0 + y1) / 2 + ny * (cv || 0), wm = (w0 + w1) / 4;
    return 'M' + f(x0 + nx * w0 / 2) + ' ' + f(y0 + ny * w0 / 2) + 'Q' + f(cx + nx * wm) + ' ' + f(cy + ny * wm) + ' ' + f(x1 + nx * w1 / 2) + ' ' + f(y1 + ny * w1 / 2) +
      'L' + f(x1 - nx * w1 / 2) + ' ' + f(y1 - ny * w1 / 2) + 'Q' + f(cx - nx * wm) + ' ' + f(cy - ny * wm) + ' ' + f(x0 - nx * w0 / 2) + ' ' + f(y0 - ny * w0 / 2) + 'Z';
  }
  function bark(d, col) { return '<path d="' + d + '" fill="' + col + '"/><path d="' + d + '" fill="' + U('shadeH') + '"/>'; }

  /* 広葉樹の樹冠：小さな葉のかたまりを重ねて、光の当たる側を明るく */
  function crown(r, c) {
    var cl = [], i, j;
    for (i = 0; i < c.n; i++) {
      var a = r() * Math.PI * 2, d = Math.sqrt(r()), rad = c.r0 + (c.r1 - c.r0) * r();
      cl.push({ x: c.cx + Math.cos(a) * d * (c.rx - rad * .7), y: c.cy + Math.sin(a) * d * (c.ry - rad * .7), r: rad, z: r() * .6 + (Math.sin(a) > 0 ? .3 : 0), e: d });
    }
    var ring = Math.round(c.n * .55);
    for (i = 0; i < ring; i++) {
      var b = Math.PI + (i + .5) / ring * Math.PI * 1.15 - .08 + (r() - .5) * .2, rr = c.r0 + (c.r1 - c.r0) * r() * .8;
      cl.push({ x: c.cx + Math.cos(b) * (c.rx - rr * .55), y: c.cy + Math.sin(b) * (c.ry - rr * .55), r: rr, z: .5 + r() * .5, e: 1 });
    }
    cl.sort(function (p, q) { return p.z - q.z; });
    var ew = c.ew || 1, s = '', mass = '', back = '', front = '', tex = '', hi = '', lv = '', lvv = '', lv2 = '', gl = '';
    cl.forEach(function (k) { mass += blob(r, k.x + 1.2, k.y + 1.6, k.r * 1.06 * ew, k.r * 1.04, 9, .1); });
    cl.forEach(function (k, idx) {
      var d = blob(r, k.x, k.y, k.r * ew, k.r, 9, .11), path = '<path d="' + d + '" fill="' + U(c.grad) + '"/>';
      if (k.z < .45) back += path + '<path d="' + d + '" fill="#0d1f10" opacity=".28"/>'; else front += path;
      /* 葉の重なりの影（下側の弧） */
      for (j = 0; j < 3; j++) { var a0 = .3 + r() * 2.2, rr2 = k.r * (.45 + r() * .4), cx = k.x + (r() - .5) * k.r * .6, cy = k.y + (r() - .3) * k.r * .5; tex += 'M' + f(cx + Math.cos(a0) * rr2) + ' ' + f(cy + Math.sin(a0) * rr2) + 'A' + f(rr2) + ' ' + f(rr2) + ' 0 0 1 ' + f(cx + Math.cos(a0 + .9) * rr2) + ' ' + f(cy + Math.sin(a0 + .9) * rr2); }
      /* 光の当たる葉 */
      for (j = 0; j < 3; j++) { var hx = k.x - k.r * (.15 + r() * .45), hy = k.y - k.r * (.2 + r() * .45); hi += leaf(c.leaf, hx, hy, -2.4 + r() * 1.6, c.ll * .7, .9); }
      if (c.gloss) for (j = 0; j < 2; j++) gl += leaf('ell', k.x - k.r * (.1 + r() * .5), k.y - k.r * (.2 + r() * .5), -2.6 + r() * .8, c.ll * .5, .7);
      /* ふちから突き出る葉 */
      if (k.e > .8) {
        var nl = c.nl || 4;
        for (j = 0; j < nl; j++) {
          var aa = -Math.PI / 2 + (k.x - c.cx) / c.rx * 1.3 + (r() - .5) * 2.2, lx = k.x + Math.cos(aa) * k.r * .82 * ew, ly = k.y + Math.sin(aa) * k.r * .82, an = aa + (r() - .5) * .7, ln = c.ll * (.85 + r() * .4);
          if (c.alt && r() < c.alt) lv2 += leaf(c.leaf, lx, ly, an, ln); else lv += leaf(c.leaf, lx, ly, an, ln);
          lvv += vein(lx, ly, an, ln);
        }
      }
      if (idx === Math.floor(cl.length * .45) && c.mid) back += c.mid;
    });
    s += '<path d="' + mass + '" fill="' + c.dark + '"/>' + back;
    s += '<path d="' + lv + '" fill="' + c.leafC + '" stroke="' + c.dark + '" stroke-width=".25"/>' + (lv2 ? '<path d="' + lv2 + '" fill="' + c.leafC2 + '" stroke="' + c.dark + '" stroke-width=".25"/>' : '') + '<path d="' + lvv + '" stroke="' + c.dark + '" stroke-width=".22" opacity=".7" fill="none"/>';
    s += front + '<path d="' + tex + '" fill="none" stroke="' + c.dark + '" stroke-width=".55" opacity=".55" stroke-linecap="round"/>';
    s += '<path d="' + hi + '" fill="' + c.hi + '" opacity=".8"/>';
    if (gl) s += '<path d="' + gl + '" fill="#fff" opacity=".42"/>';
    return s;
  }

  /* ---------- アカマツ（陽樹・針葉樹・赤い樹皮） ---------- */
  function tuft(r, x, y, w, h) {
    var s = '<path d="' + blob(r, x + .6, y + h * .25, w * .5, h * .42, 10, .22) + '" fill="#1b2f17" opacity=".55"/><path d="' + blob(r, x, y, w * .5, h * .45, 11, .25) + '" fill="' + U('tuft') + '"/>';
    var g = ['', '', '', ''], n = Math.round(w * 3.2);
    for (var i = 0; i < n; i++) {
      var px = x + (r() - .5) * w * .95, py = y + (r() - .35) * h * .7, rel = (px - x) / w, ang = -Math.PI / 2 + rel * 2.4 + (r() - .5) * .9, len = 2 + r() * 3.2;
      var k = py < y - h * .1 ? (r() < .6 ? 3 : 2) : py < y + h * .1 ? (r() < .5 ? 2 : 1) : 0;
      if (k === 0) ang = Math.PI / 2 + rel * 2 + (r() - .5) * .8;
      g[k] += 'M' + f(px) + ' ' + f(py) + 'l' + f(Math.cos(ang) * len) + ' ' + f(Math.sin(ang) * len);
    }
    ['#1f3a1a', '#3e6a2e', '#6a9a42', '#a3c96a'].forEach(function (c, i) { s += '<path d="' + g[i] + '" stroke="' + c + '" stroke-width="' + (i === 3 ? .4 : .5) + '" stroke-linecap="round" fill="none"/>'; });
    return s;
  }
  function pineInner(seed, young) {
    var r = rng(seed * 31 + 7), s = '', i;
    if (young) {
      var tp = trunkPath(3.4, .8, -96, 0);
      s += '<path d="' + tp + '" fill="' + U('barkPine') + '"/><path d="' + tp + '" fill="' + U('shadeH') + '"/>';
      var tiers = 6;
      for (i = 0; i < tiers; i++) {
        var y = -26 - i * 13 - r() * 3, w = 44 * (1 - i / tiers) + 10;
        s += '<path d="' + limb(0, y + 3, -w * .42, y - 2, 1.2, .4, -1) + limb(0, y + 3, w * .42, y - 3, 1.2, .4, 1) + '" fill="#7a4a30"/>';
        s += tuft(r, -w * .3, y - 2, w * .42, 9) + tuft(r, w * .3, y - 3, w * .42, 9) + tuft(r, 0, y - 6, w * .3, 8);
      }
      return s + tuft(r, 0, -98, 10, 9);
    }
    var bend = (r() - .5) * 10, top = -86, tp2 = trunkPath(4.8, 1.5, top, bend);
    var tips = [], br = '', nb = 7 + Math.floor(r() * 3);
    for (i = 0; i < nb; i++) {
      var y0 = -46 - i / nb * 36 - r() * 3, side = (i % 2 ? 1 : -1) * (r() < .15 ? -1 : 1), len = (14 + r() * 18) * (1 - i / nb * .45), x0 = tcx(y0, top, bend);
      var x1 = x0 + side * len, y1 = y0 - 5 - r() * 9;
      br += limb(x0, y0, x1, y1, 2 - i * .12, .6, side * (2 + r() * 2));
      tips.push([x1, y1, 13 + r() * 9 + (1 - i / nb) * 6, 6 + r() * 3]);
      if (len > 18) { var mx = x0 + side * len * .55, my = y0 - (y0 - y1) * .5 - 1; tips.push([mx, my - 2, 9 + r() * 5, 5]); br += limb(mx, my + 1, mx + side * 3, my - 4, .7, .3, 0); }
    }
    tips.push([bend * .95, top - 5, 16, 8]);
    s += tuft(r, tips[2][0] * .6, tips[2][1] - 6, 14, 7);
    s += '<path d="' + tp2 + '" fill="' + U('barkPine') + '"/><path d="' + tp2 + '" fill="' + U('shadeH') + '"/>';
    /* 下の樹皮：亀甲状のひび　上の樹皮：赤くうすくはがれる */
    var cr = '', fl = '';
    for (i = 0; i < 26; i++) { var yy = -2 - r() * 42, cx = tcx(yy, top, bend), ww = 4.6 * (1 + yy / 200); var xx = cx + (r() - .5) * ww * .75; cr += 'M' + f(xx) + ' ' + f(yy) + 'l' + f((r() - .5) * .8) + ' ' + f(-2 - r() * 3) + 'l' + f((r() - .5) * 1.2) + ' -.6'; }
    for (i = 0; i < 18; i++) { var y2 = -46 - r() * 38, c2 = tcx(y2, top, bend); fl += 'M' + f(c2 - 1.2 + r() * .8) + ' ' + f(y2) + 'q.8 -.5 1.6 0'; }
    s += '<path d="' + cr + '" stroke="#2e2019" stroke-width=".45" fill="none" opacity=".8"/><path d="' + fl + '" stroke="#f6b082" stroke-width=".35" fill="none"/>';
    s += '<path d="' + br + '" fill="#8a4a2c"/>';
    tips.sort(function (a, b) { return a[1] - b[1]; });
    tips.forEach(function (t) { s += tuft(r, t[0], t[1], t[2], t[3]); });
    /* 松かさ */
    for (i = 0; i < 3; i++) { var t3 = tips[2 + i * 2]; if (t3) s += '<ellipse cx="' + f(t3[0] + 2) + '" cy="' + f(t3[1] + 4) + '" rx="1" ry="1.5" fill="#7a5a34" stroke="#4a3220" stroke-width=".25"/>'; }
    return s;
  }
  ill.akamatsu = function (x, y, h, o) { o = o || {}; var sd = o.seed || 1; return place(make('pine' + sd + (o.young ? 'y' : ''), function () { return pineInner(sd, o.young); }), x, y, h, o.flip); };

  /* ---------- 針葉樹（トウヒ・モミ：亜寒帯の針葉樹林） ---------- */
  ill.conifer = function (x, y, h, o) {
    o = o || {}; var sd = o.seed || 1;
    return place(make('conif' + sd, function () {
      var r = rng(sd * 17 + 3), s = '<path d="' + trunkPath(3, .6, -100, 0) + '" fill="#4a3426"/>', tiers = 11, i;
      var nd = '', hl = '';
      for (i = 0; i < tiers; i++) {
        var t = i / tiers, y = -10 - t * 86, w = 30 * (1 - t) + 4, hh = 12 - t * 4, sag = 4 + (1 - t) * 3;
        var pts = [[0, y - hh], [-w * .35, y - hh * .35], [-w * .55, y + sag * .3], [-w * .5 - 1, y + sag], [-w * .2, y + sag * .45], [0, y + sag * .7], [w * .2, y + sag * .45], [w * .5 + 1, y + sag], [w * .55, y + sag * .3], [w * .35, y - hh * .35]];
        pts = pts.map(function (p) { return [p[0] + (r() - .5) * 1.4, p[1] + (r() - .5) * 1.2]; });
        s += '<path d="' + smooth(pts, true) + '" fill="' + U('conif') + '" stroke="#132a1e" stroke-width=".4"/>';
        for (var j = 0; j < w * 1.6; j++) { var px = (r() - .5) * w * .95, py = y + r() * sag * .8 - hh * .2; nd += 'M' + f(px) + ' ' + f(py) + 'l' + f(px * .04) + ' ' + f(1.4 + r() * 1.4); }
        hl += 'M' + f(-w * .3) + ' ' + f(y - hh * .2) + 'q' + f(w * .12) + ' -' + f(hh * .3) + ' ' + f(w * .25) + ' -' + f(hh * .5);
      }
      return s + '<path d="' + nd + '" stroke="#142c1f" stroke-width=".45" fill="none"/><path d="' + hl + '" stroke="#8ab08a" stroke-width=".6" fill="none" opacity=".6"/><path d="M0 -104 l0 6" stroke="#2f5a44" stroke-width="1.4"/>';
    }), x, y, h, o.flip);
  };

  /* ---------- コナラ（陽樹・落葉広葉樹） ---------- */
  ill.konara = function (x, y, h, o) {
    o = o || {}; var sd = o.seed || 1;
    return place(make('kon' + sd, function () {
      var r = rng(sd * 13 + 5), bend = (r() - .5) * 6, tp = trunkPath(6.2, 3.2, -40, bend), s = '';
      var limbs = limb(bend, -38, -18 - r() * 6, -66, 3, .9, -3) + limb(bend, -38, 15 + r() * 6, -70, 2.8, .9, 3) + limb(bend, -39, 2, -82, 2.4, .7, 1) + limb(-8, -52, -30, -60, 1.2, .4, -1) + limb(8, -54, 30, -62, 1.2, .4, 2);
      s += bark(tp, '#7c6e60');
      var fur = '';
      for (var i = 0; i < 9; i++) { var xx = (i - 4) * .6, L = 14 + r() * 20; fur += 'M' + f(xx + (r() - .5) * .4) + ' -' + f(1 + r() * 4) + 'Q' + f(xx * .9) + ' -' + f(L * .5) + ' ' + f(xx * (1 - L / 70) + tcx(-L, -40, bend)) + ' -' + f(L); }
      s += '<path d="' + fur + '" stroke="#3e342b" stroke-width=".45" fill="none" opacity=".75"/>';
      s += crown(r, { cx: 0, cy: -66, rx: 42, ry: 28, n: 22, r0: 8, r1: 13, grad: 'oak', dark: '#3c5a22', leafC: '#82ac44', hi: '#d8eba0', leaf: 'obo', ll: 4.6, nl: 4, mid: bark(limbs, '#76685a') });
      /* どんぐり */
      var ac = '';
      for (i = 0; i < 5; i++) { var ax = -30 + r() * 60, ay = -46 - r() * 6; ac += '<ellipse cx="' + f(ax) + '" cy="' + f(ay + 1.6) + '" rx="1" ry="1.5" fill="' + U('acorn') + '"/><path d="M' + f(ax - 1.1) + ' ' + f(ay + .9) + 'q1.1 -1.3 2.2 0z" fill="#8a7a50"/>'; }
      return s + ac;
    }), x, y, h, o.flip);
  };

  /* ---------- スダジイ・タブノキ（陰樹・照葉樹：こんもりした光沢のある樹冠） ---------- */
  function shiiInner(sd, tabu) {
    var r = rng(sd * 19 + (tabu ? 101 : 1)), s = '', bend = (r() - .5) * 5, tp = trunkPath(9, 5, -26, bend);
    var limbs = limb(bend, -24, -24, -52, 4.2, 1.2, -4) + limb(bend, -24, 22, -54, 4, 1.2, 4) + limb(bend, -25, -6, -70, 3.2, 1, -1) + limb(bend, -25, 8, -72, 3, .9, 2) + limb(-14, -40, -36, -50, 1.6, .5, -2) + limb(14, -42, 38, -50, 1.6, .5, 2);
    s += bark(tp, tabu ? '#6e665c' : '#45403a');
    var fi = '', ri = '';
    for (var i = 0; i < 12; i++) { var xx = bend * .2 + (i - 5.5) * .72; fi += 'M' + f(xx) + ' -1q' + f((r() - .5) * 1.4) + ' -12 ' + f((r() - .5) * 1.4) + ' -' + f(18 + r() * 8); ri += 'M' + f(xx + .3) + ' -2l' + f((r() - .5) * .6) + ' -' + f(6 + r() * 10); }
    s += '<path d="' + fi + '" stroke="#16130f" stroke-width="' + (tabu ? .35 : .7) + '" fill="none"/>' + (tabu ? '' : '<path d="' + ri + '" stroke="#7d766c" stroke-width=".3" fill="none"/>');
    s += crown(r, tabu ? { cx: 0, cy: -63, rx: 45, ry: 36, n: 26, r0: 9, r1: 15, grad: 'tabu', dark: '#173a1d', leafC: '#3f7d37', hi: '#b8dc8a', leaf: 'tab', ll: 5.6, nl: 3, gloss: 1, mid: bark(limbs, '#5e574e') }
      : { cx: 0, cy: -60, rx: 50, ry: 37, n: 32, r0: 8, r1: 14, grad: 'shii', dark: '#122c15', leafC: '#2f5d2b', leafC2: '#b49a5a', alt: .25, hi: '#9cc87a', leaf: 'lan', ll: 4.4, nl: 4, gloss: 1, mid: bark(limbs, '#3a3631') });
    if (tabu) { var bud = ''; for (i = 0; i < 9; i++) { var a = Math.PI + .3 + r() * 2.5, bx = Math.cos(a) * 44, by = -63 + Math.sin(a) * 36; bud += leaf('tab', bx, by, a + (r() - .5) * .5, 3.2, .8); } s += '<path d="' + bud + '" fill="#b25a3c" stroke="#5a2a1a" stroke-width=".2"/>'; }
    return s;
  }
  ill.sudajii = function (x, y, h, o) { o = o || {}; var sd = o.seed || 1; return place(make('shii' + sd, function () { return shiiInner(sd, false); }), x, y, h, o.flip); };
  ill.tabunoki = function (x, y, h, o) { o = o || {}; var sd = o.seed || 1; return place(make('tabu' + sd, function () { return shiiInner(sd, true); }), x, y, h, o.flip); };

  /* ---------- ブナ（夏緑樹林：灰白色のなめらかな樹皮・地衣類の斑紋） ---------- */
  ill.buna = function (x, y, h, o) {
    o = o || {}; var sd = o.seed || 1;
    return place(make('buna' + sd, function () {
      var r = rng(sd * 23 + 9), bend = (r() - .5) * 4, tp = trunkPath(6.6, 3.4, -50, bend), s = '', i;
      var limbs = limb(bend, -46, -22, -72, 2.6, .7, -3) + limb(bend, -47, -8, -84, 2.4, .7, -1) + limb(bend, -47, 9, -86, 2.4, .7, 1) + limb(bend, -46, 24, -74, 2.6, .7, 3) + limb(-10, -58, -34, -66, 1.2, .4, -2) + limb(10, -60, 34, -68, 1.2, .4, 2);
      s += bark(tp, '#a6a49b');
      var sp = '', sp2 = '', ln = '';
      for (i = 0; i < 14; i++) { var yy = -3 - r() * 44, cx = tcx(yy, -50, bend) + (r() - .5) * 4.4; var b = blob(r, cx, yy, .6 + r() * 1.3, .5 + r() * .9, 7, .3); if (r() < .55) sp += b; else sp2 += b; }
      for (i = 0; i < 10; i++) { var y2 = -4 - r() * 44; ln += 'M' + f(tcx(y2, -50, bend) - 2.4 + r()) + ' ' + f(y2) + 'q1.5 -.3 3 0'; }
      s += '<path d="' + sp + '" fill="#e7e6da" opacity=".85"/><path d="' + sp2 + '" fill="#b9c6a2" opacity=".85"/><path d="' + ln + '" stroke="#6f6d66" stroke-width=".3" fill="none"/>';
      s += crown(r, { cx: 0, cy: -70, rx: 46, ry: 30, n: 24, r0: 8, r1: 12, ew: 1.22, grad: 'buna', dark: '#3d6627', leafC: '#93c35a', hi: '#e6f5be', leaf: 'ova', ll: 4.2, nl: 4, mid: bark(limbs, '#9d9b92') });
      return s;
    }), x, y, h, o.flip);
  };

  /* ---------- ヤシャブシ（低木：株立ち・球果） ---------- */
  ill.yashabushi = function (x, y, h, o) {
    o = o || {}; var sd = o.seed || 1;
    return place(make('ysh' + sd, function () {
      var r = rng(sd * 29 + 2), s = '', st = limb(-2, 0, -22, -58, 3.4, 1.2, -4) + limb(0, 0, 3, -74, 3.6, 1.2, 2) + limb(2, 0, 24, -54, 3.2, 1.1, 4) + limb(-12, -34, -34, -48, 1.4, .5, -2) + limb(12, -30, 34, -44, 1.4, .5, 2);
      var cr = crown(r, { cx: 0, cy: -60, rx: 44, ry: 30, n: 18, r0: 8, r1: 12, grad: 'yasha', dark: '#2f4f1e', leafC: '#76a443', hi: '#d6ea9e', leaf: 'lan', ll: 5.4, nl: 4, mid: bark(st, '#857565') });
      var le = ''; for (var i = 0; i < 20; i++) le += 'M' + f(-14 + r() * 28) + ' ' + f(-4 - r() * 40) + 'h.8';
      s += cr + '<path d="' + le + '" stroke="#d8cdb8" stroke-width=".5"/>';
      /* 球果（ぶらさがる実） */
      var cn = '';
      for (i = 0; i < 6; i++) { var cx = -32 + r() * 64, cy = -40 - r() * 14; cn += '<path d="M' + f(cx) + ' ' + f(cy - 3) + 'q.4 1.6 0 3" stroke="#5a4a2a" stroke-width=".35" fill="none"/><ellipse cx="' + f(cx) + '" cy="' + f(cy + 1.6) + '" rx="1.4" ry="2.1" fill="#7a5530" stroke="#3e2a14" stroke-width=".3"/><path d="M' + f(cx - 1.2) + ' ' + f(cy + 1) + 'h2.4M' + f(cx - 1.3) + ' ' + f(cy + 2.1) + 'h2.6" stroke="#3e2a14" stroke-width=".25"/>'; }
      return s + cn;
    }), x, y, h, o.flip);
  };

  /* ---------- ススキ（イネ科：銀色の穂） ---------- */
  ill.susuki = function (x, y, h, o) {
    o = o || {}; var sd = o.seed || 1;
    return place(make('sus' + sd, function () {
      var r = rng(sd * 37 + 4), s = '', lv = '', mr = '', i, j;
      for (i = 0; i < 22; i++) {
        var x0 = (r() - .5) * 10, side = r() < .5 ? -1 : 1, hh = 34 + r() * 30, lean = side * (8 + r() * 26), w = 1.3 + r() * .5;
        var tx = x0 + lean * 1.3, ty = -hh + (Math.abs(lean) > 20 ? 10 + r() * 8 : 0), cx = x0 + lean * .3, cy = -hh * .95;
        lv += 'M' + f(x0 - w) + ' 0Q' + f(cx - w) + ' ' + f(cy) + ' ' + f(tx) + ' ' + f(ty) + 'Q' + f(cx + w) + ' ' + f(cy + 2) + ' ' + f(x0 + w) + ' 0Z';
        mr += 'M' + f(x0) + ' 0Q' + f(cx) + ' ' + f(cy + 1) + ' ' + f(tx - lean * .04) + ' ' + f(ty + 2);
      }
      var cu = '', rc = '', hr = '', sp = '';
      for (i = 0; i < 6; i++) {
        var bx = (r() - .5) * 8, tx2 = bx + (r() - .5) * 18, ty2 = -78 - r() * 20, dir = r() < .6 ? 1 : -1;
        cu += 'M' + f(bx) + ' 0Q' + f(bx) + ' ' + f(ty2 * .6) + ' ' + f(tx2) + ' ' + f(ty2);
        for (j = 0; j < 11; j++) {
          var sy = ty2 + j * 1.1, sx = tx2 + (j - 5) * .1, a = -Math.PI / 2 + dir * (.25 + j * .1) + (r() - .5) * .3, L = 9 + r() * 6 - Math.abs(j - 4) * .5;
          var ex = sx + Math.cos(a) * L * .5 + dir * L * .25, ey = sy + Math.sin(a) * L * .5 + L * .45, mx = sx + Math.cos(a) * L * .45, my = sy + Math.sin(a) * L * .45;
          rc += 'M' + f(sx) + ' ' + f(sy) + 'Q' + f(mx) + ' ' + f(my) + ' ' + f(ex) + ' ' + f(ey);
          for (var k = 1; k < 7; k++) { var t = k / 7, px = (1 - t) * (1 - t) * sx + 2 * t * (1 - t) * mx + t * t * ex, py = (1 - t) * (1 - t) * sy + 2 * t * (1 - t) * my + t * t * ey, ha = r() * 6.28; hr += 'M' + f(px) + ' ' + f(py) + 'l' + f(Math.cos(ha) * 1.6) + ' ' + f(Math.sin(ha) * 1.6); if (k % 2) sp += 'M' + f(px) + ' ' + f(py) + 'l' + f(dir * .5) + ' .5'; }
        }
      }
      s += '<path d="' + cu + '" stroke="' + U('culm') + '" stroke-width=".9" fill="none"/>';
      s += '<path d="' + lv + '" fill="#6b9440" stroke="#3f5f22" stroke-width=".25"/><path d="' + mr + '" stroke="#e6efc8" stroke-width=".35" fill="none" opacity=".9"/>';
      s += '<path d="' + rc + '" stroke="#8f7466" stroke-width=".55" fill="none"/><path d="' + hr + '" stroke="#f4efe2" stroke-width=".3" fill="none" opacity=".9"/><path d="' + sp + '" stroke="#7d5a62" stroke-width=".6" fill="none"/>';
      return s;
    }), x, y, h, o.flip);
  };

  /* ---------- イタドリ（タデ科：節のある茎・白い花〜翼のある実） ---------- */
  ill.itadori = function (x, y, h, o) {
    o = o || {}; var sd = o.seed || 1;
    return place(make('ita' + sd, function () {
      var r = rng(sd * 41 + 6), s = '', st = '', nd = '', sk = '', lf = '', vn = '', fl = '', fl2 = '', i, j;
      var leaves = [];
      for (i = 0; i < 4; i++) {
        var x0 = (i - 1.5) * 4, lean = (i - 1.5) * 9 + (r() - .5) * 6, top = -(70 + r() * 26), pts = [[x0, 0]], ns = 7;
        for (j = 1; j <= ns; j++) { var t = j / ns; pts.push([x0 + lean * t * t + (j % 2 ? 1 : -1) * .8, top * t]); }
        st += smooth(pts, false);
        pts.forEach(function (p, j2) {
          if (!j2) return;
          nd += 'M' + f(p[0] - 1.1) + ' ' + f(p[1]) + 'h2.2'; for (var q = 0; q < 3; q++) sk += 'M' + f(p[0] + (r() - .5) * 1.2) + ' ' + f(p[1] + 2 + r() * 5) + 'h.3';
          if (j2 < 2) return;
          var side = j2 % 2 ? 1 : -1, ang = side > 0 ? -.35 - r() * .5 : Math.PI + .35 + r() * .5, L = 13 - j2 * .6 + r() * 3;
          leaves.push([p[0], p[1], ang, L]);
          if (j2 >= ns - 3) { var fx = p[0] + side * 2, fy = p[1] - 1; for (var q2 = 0; q2 < 9; q2++) { var a = -Math.PI / 2 + side * (.4 + r() * .9), Ln = 4 + r() * 7; fl += 'M' + f(fx) + ' ' + f(fy) + 'q' + f(Math.cos(a) * Ln * .5) + ' ' + f(Math.sin(a) * Ln * .5 - 1) + ' ' + f(Math.cos(a) * Ln) + ' ' + f(Math.sin(a) * Ln + 2); for (var q3 = 0; q3 < 5; q3++) { var u = .3 + q3 * .16; fl2 += 'M' + f(fx + Math.cos(a) * Ln * u + (r() - .5)) + ' ' + f(fy + Math.sin(a) * Ln * u + u * 2) + 'h.01'; } } }
        });
      }
      leaves.forEach(function (L) { lf += leaf('ita', L[0], L[1], L[2], L[3], .95); vn += vein(L[0], L[1], L[2], L[3]); for (var k = 1; k < 4; k++) { var t = k / 4.4, bx = L[0] + Math.cos(L[2]) * L[3] * t, by = L[1] + Math.sin(L[2]) * L[3] * t; vn += 'M' + f(bx) + ' ' + f(by) + 'l' + f(Math.cos(L[2] - .9) * L[3] * .22) + ' ' + f(Math.sin(L[2] - .9) * L[3] * .22) + 'M' + f(bx) + ' ' + f(by) + 'l' + f(Math.cos(L[2] + .9) * L[3] * .22) + ' ' + f(Math.sin(L[2] + .9) * L[3] * .22); } });
      s += '<path d="' + st + '" stroke="#7d9a4a" stroke-width="1.5" fill="none"/><path d="' + sk + '" stroke="#a03a2e" stroke-width=".7" stroke-linecap="round"/><path d="' + nd + '" stroke="#5a6a30" stroke-width=".5"/>';
      s += '<path d="' + lf + '" fill="#79a948" stroke="#3f6624" stroke-width=".3"/><path d="' + vn + '" stroke="#c4dc94" stroke-width=".3" fill="none"/>';
      s += '<path d="' + fl + '" stroke="#b49a8a" stroke-width=".35" fill="none"/><path d="' + fl2 + '" stroke="#f3e6df" stroke-width="1.5" stroke-linecap="round"/><path d="' + fl2 + '" stroke="#d8a8a0" stroke-width=".6" stroke-linecap="round" opacity=".7"/>';
      return s;
    }), x, y, h, o.flip);
  };

  /* ---------- 岩とコケ植物・地衣類（w＝幅） ---------- */
  ill.mossRock = function (x, y, w, o) {
    o = o || {}; var sd = o.seed || 1, mo = Math.round((o.moss || 0) * 4) / 4, li = Math.round((o.lichen || 0) * 4) / 4;
    return place(make('rock' + sd + ':' + mo + ':' + li + (o.lava ? 'L' : ''), function () {
      var r = rng(sd * 43 + 8), s = '', pts = [], i, k = 12;
      for (i = 0; i <= k; i++) { var t = i / k, a = Math.PI + t * Math.PI; pts.push([Math.cos(a) * 50 * (1 + (r() - .5) * .14), Math.sin(a) * 30 * (.7 + r() * .45) - 2]); }
      pts[0][1] = 2; pts[k][1] = 2;
      var d = smooth(pts, false) + 'Q0 6 ' + f(pts[0][0]) + ' 2Z';
      s += '<ellipse cx="0" cy="2" rx="54" ry="5" fill="' + U('shadow') + '"/><path d="' + d + '" fill="' + U(o.lava ? 'lava' : 'rock') + '" stroke="#2a2622" stroke-width=".6"/>';
      var cr = '', ves = '';
      for (i = 0; i < 6; i++) { var cx = -34 + r() * 68, cy = -8 - r() * 12; cr += 'M' + f(cx) + ' ' + f(cy) + 'l' + f((r() - .5) * 8) + ' ' + f(2 + r() * 3) + 'l' + f((r() - .5) * 5) + ' ' + f(1 + r() * 2); }
      if (o.lava) for (i = 0; i < 26; i++) ves += '<ellipse cx="' + f(-40 + r() * 80) + '" cy="' + f(-2 - r() * 20) + '" rx="' + f(.6 + r() * 1.2) + '" ry="' + f(.4 + r() * .7) + '" fill="#1d1a17" opacity=".8"/>';
      s += '<path d="' + cr + '" stroke="#24201c" stroke-width=".7" fill="none" opacity=".7"/>' + ves;
      s += '<path d="M-34 -18q20 -10 44 -8" stroke="#fff" stroke-width="1.2" opacity=".18" fill="none"/>';
      /* 地衣類：円形にひろがる */
      var LC = [['#c9cfa0', '#9aa070'], ['#e3a03a', '#b06e1e'], ['#dcdccc', '#a8a898'], ['#a8bc8a', '#6f8a5a']];
      for (i = 0; i < Math.round(li * 9); i++) {
        var lc = LC[Math.floor(r() * LC.length)], lx = -38 + r() * 76, ly = -4 - r() * 18, lr = 2 + r() * 4;
        s += '<path d="' + blob(r, lx, ly, lr, lr * .6, 16, .28) + '" fill="' + lc[0] + '" stroke="' + lc[1] + '" stroke-width=".35"/><path d="' + blob(r, lx, ly, lr * .6, lr * .34, 12, .3) + '" fill="' + lc[1] + '" opacity=".35"/>';
        var ap = ''; for (var q = 0; q < 6; q++) ap += 'M' + f(lx + (r() - .5) * lr * 1.2) + ' ' + f(ly + (r() - .5) * lr * .6) + 'h.01';
        s += '<path d="' + ap + '" stroke="' + lc[1] + '" stroke-width=".7" stroke-linecap="round"/>';
      }
      /* コケ植物：くぼみからこんもり */
      for (i = 0; i < Math.round(mo * 7); i++) {
        var mx = -40 + i / 6 * 80 + (r() - .5) * 10, mr = 4 + r() * 6, my = -Math.sqrt(Math.max(0, 1 - mx * mx / 2500)) * 26 + mr * .2;
        s += '<path d="' + blob(r, mx, my, mr, mr * .5, 11, .2) + '" fill="#4e7a2a"/><path d="' + blob(r, mx - .4, my - .6, mr * .9, mr * .4, 11, .2) + '" fill="#7aa83c"/>';
        var dots = '', sp = '';
        for (q = 0; q < mr * 3; q++) dots += 'M' + f(mx + (r() - .5) * mr * 1.6) + ' ' + f(my - r() * mr * .45) + 'h.01';
        for (q = 0; q < 3; q++) { var sx = mx + (r() - .5) * mr, sy = my - mr * .35; sp += 'M' + f(sx) + ' ' + f(sy) + 'q' + f((r() - .5) * 2) + ' -3 ' + f((r() - .5) * 2) + ' -' + f(4 + r() * 3); }
        s += '<path d="' + dots + '" stroke="#b8d870" stroke-width=".9" stroke-linecap="round"/><path d="' + sp + '" stroke="#8a5a30" stroke-width=".35" fill="none" stroke-linecap="round"/>';
      }
      return s;
    }), x, y, w, o.flip);
  };

  /* ---------- 芽ばえ：kind 'sun'＝陽樹（アカマツ）, 'shade'＝陰樹（スダジイ）。o.weak で弱って黄ばむ ---------- */
  ill.seedling = function (x, y, h, o) {
    o = o || {}; var sd = o.seed || 1, kind = o.kind || 'sun', weak = !!o.weak;
    return place(make('sdl' + kind + sd + (weak ? 'w' : ''), function () {
      var r = rng(sd * 47 + (kind === 'sun' ? 1 : 2)), s = '<ellipse cx="0" cy="1" rx="16" ry="3" fill="' + U('shadow') + '"/>', i;
      if (kind === 'sun') {
        var top = weak ? -70 : -86, lean = weak ? 12 : 2;
        s += '<path d="M0 0Q' + f(lean * .2) + ' ' + f(top * .5) + ' ' + f(lean) + ' ' + f(top) + '" stroke="' + (weak ? '#b08a5a' : '#a8603a') + '" stroke-width="2.4" fill="none"/>';
        var nd = '', nd2 = '';
        for (i = 0; i < 8; i++) { var a = -Math.PI / 2 + (i - 3.5) * .42 + (weak ? .9 : 0), L = 30 + r() * 6, dr = weak ? 18 : 2; var p = 'M' + f(lean) + ' ' + f(top) + 'q' + f(Math.cos(a) * L * .5) + ' ' + f(Math.sin(a) * L * .5) + ' ' + f(Math.cos(a) * L) + ' ' + f(Math.sin(a) * L + dr); if (i % 2) nd += p; else nd2 += p; }
        s += '<path d="' + nd + '" stroke="' + (weak ? '#c8b45a' : '#4f8a34') + '" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="' + nd2 + '" stroke="' + (weak ? '#d8c870' : '#6fa848') + '" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
        s += '<path d="M' + f(lean - 2) + ' ' + f(top - 4) + 'q2 -6 4 0z" fill="#8a5a3a"/>';
      } else {
        s += '<ellipse cx="7" cy="-2" rx="6" ry="4.6" fill="' + U('acorn') + '" transform="rotate(-20 7 -2)"/><path d="M3 -5q4 -4 9 1" stroke="#4f3216" stroke-width="1" fill="none"/>';
        s += '<path d="M0 0Q-2 -40 1 -90" stroke="#5a4a32" stroke-width="2.6" fill="none"/>';
        var lf = '', vn = '', gl = '';
        [[-28, -1, 1], [-46, 1, 1.05], [-62, -1, 1.1], [-78, 1, 1], [-90, 0, .8]].forEach(function (q, j) {
          var ang = q[1] === 0 ? -Math.PI / 2 - .1 : q[1] > 0 ? -.3 - j * .05 : Math.PI + .3 + j * .05, L = 34 * q[2];
          lf += leaf('lan', q[1] === 0 ? 1 : 0, q[0], ang, L, 1.15); vn += vein(q[1] === 0 ? 1 : 0, q[0], ang, L); gl += leaf('ell', (q[1] === 0 ? 1 : 0) + Math.cos(ang) * L * .25, q[0] + Math.sin(ang) * L * .25 - 1.5, ang, L * .4, .5);
        });
        s += '<path d="' + lf + '" fill="#2f6a30" stroke="#16391a" stroke-width=".8"/><path d="' + vn + '" stroke="#8cc070" stroke-width=".8" fill="none"/><path d="' + gl + '" fill="#fff" opacity=".35"/>';
      }
      return s;
    }), x, y, h, o.flip);
  };

  /* ---------- シダ植物（林床の草本層） ---------- */
  ill.fern = function (x, y, h, o) {
    o = o || {}; var sd = o.seed || 1;
    return place(make('fern' + sd, function () {
      var r = rng(sd * 71 + 4), st = '', pn = '', pn2 = '';
      for (var i = 0; i < 6; i++) {
        var a = -Math.PI / 2 + (i - 2.5) * .42 + (r() - .5) * .2, L = 70 + r() * 30, pts = [];
        for (var k = 0; k <= 10; k++) { var t = k / 10, bend = t * t * (a + Math.PI / 2) * 1.2; pts.push([Math.cos(a + bend) * L * t, Math.sin(a + bend) * L * t + t * t * 18]); }
        st += smooth(pts, false);
        for (k = 1; k < 10; k++) {
          var p = pts[k], q = pts[k + 1], dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.sqrt(dx * dx + dy * dy) || 1, an = Math.atan2(dy, dx), pl = (1 - k / 11) * 16 + 3;
          var l1 = leaf('lan', p[0], p[1], an - 1.25, pl, .55), l2 = leaf('lan', p[0], p[1], an + 1.25, pl, .55);
          if (k % 2) pn += l1 + l2; else pn2 += l1 + l2;
        }
      }
      return '<path d="' + pn + '" fill="#3f7a34"/><path d="' + pn2 + '" fill="#5a9a44"/><path d="' + st + '" stroke="#5a4a2a" stroke-width="1.6" fill="none"/>';
    }), x, y, h, o.flip);
  };

  /* ---------- 倒木（ギャップをつくる） ---------- */
  ill.log = function (x, y, len, o) {
    o = o || {}; var sd = o.seed || 1;
    return place(make('log' + sd, function () {
      var r = rng(sd * 53 + 1), s = '<path d="M-50 0Q0 -2 50 -1L50 -9Q0 -11 -50 -8Z" fill="#6a5240"/><path d="M-50 -2Q0 -3 50 -2L50 -7Q0 -9 -50 -6Z" fill="' + U('shadeH') + '" opacity=".6"/><ellipse cx="50" cy="-5" rx="2.4" ry="4.2" fill="#c8a478" stroke="#6a5240" stroke-width=".6"/><path d="M49 -5a1.2 2 0 1 0 2 0a.6 1 0 1 0 -1 0" stroke="#8a6a48" stroke-width=".3" fill="none"/>', m = '';
      for (var i = 0; i < 8; i++) m += blob(r, -44 + i * 11 + r() * 4, -8.5, 3 + r() * 2, 1.6, 8, .25);
      return s + '<path d="' + m + '" fill="#6f9a3a"/>';
    }), x, y, len, o.flip);
  };

  /* ---------- エンドウの種子（丸／しわ × 黄／緑） r＝半径 ---------- */
  ill.pea = function (x, y, r, o) {
    o = o || {}; var round = o.round !== false, yellow = o.yellow !== false, sd = o.seed || 1;
    return place(make('pea' + (round ? 'R' : 'W') + (yellow ? 'Y' : 'G') + (sd % 12) + (o.shadow === false ? 'n' : ''), function () {
      var g = rng(sd * 61 + (round ? 3 : 5)), s = o.shadow === false ? '' : '<ellipse cx="6" cy="44" rx="44" ry="14" fill="' + U('shadow') + '"/>';
      var rim = yellow ? '#8a6414' : '#3f5f22', hil = '<path d="M' + f(30 + g() * 4) + ' 22q6 -4 9 -12" stroke="#5a3a18" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M' + f(31 + g() * 3) + ' 21q5 -3 7 -9" stroke="#c8a870" stroke-width="1.6" stroke-linecap="round" fill="none"/>';
      if (round) {
        var d = blob(g, 0, 0, 48, 45, 10, .035);
        s += '<path d="' + d + '" fill="' + U(yellow ? 'peaY' : 'peaG') + '" stroke="' + rim + '" stroke-width="2"/>' + hil;
        s += '<ellipse cx="-16" cy="-19" rx="16" ry="10" transform="rotate(-30 -16 -19)" fill="' + U('spec') + '"/><path d="M14 38q20 -8 28 -26" stroke="#fff" stroke-width="3" opacity=".25" fill="none" stroke-linecap="round"/>';
      } else {
        var pts = [], k = 16;
        for (var i = 0; i < k; i++) { var a = i / k * Math.PI * 2, q = .84 + g() * .14 + (i % 3 === 0 ? -.05 : 0); pts.push([Math.cos(a) * 47 * q, Math.sin(a) * 43 * q]); }
        s += '<path d="' + smooth(pts, true) + '" fill="' + U(yellow ? 'peaYw' : 'peaGw') + '" stroke="' + rim + '" stroke-width="2"/>';
        var cr = '', ri = '';
        for (i = 0; i < 9; i++) {
          var a0 = g() * 6.28, rr = 10 + g() * 26, x0 = Math.cos(a0) * rr, y0 = Math.sin(a0) * rr * .9, a1 = a0 + Math.PI / 2 + (g() - .5) * 1.2, L = 12 + g() * 16;
          var x1 = x0 + Math.cos(a1) * L, y1 = y0 + Math.sin(a1) * L, cx = (x0 + x1) / 2 + (g() - .5) * 10, cy = (y0 + y1) / 2 + (g() - .5) * 10;
          cr += 'M' + f(x0) + ' ' + f(y0) + 'Q' + f(cx) + ' ' + f(cy) + ' ' + f(x1) + ' ' + f(y1);
          ri += 'M' + f(x0 - 2.5) + ' ' + f(y0 - 3) + 'Q' + f(cx - 2.5) + ' ' + f(cy - 3) + ' ' + f(x1 - 2.5) + ' ' + f(y1 - 3);
        }
        s += '<path d="' + cr + '" stroke="' + rim + '" stroke-width="3.2" opacity=".55" fill="none" stroke-linecap="round"/><path d="' + ri + '" stroke="#fff" stroke-width="2.2" opacity=".32" fill="none" stroke-linecap="round"/>' + hil;
        s += '<ellipse cx="-15" cy="-17" rx="10" ry="6" transform="rotate(-30 -15 -17)" fill="' + U('spec') + '" opacity=".6"/>';
      }
      return s;
    }), x, y, r * 2, o.flip);
  };

  /* ---------- エンドウの株（花・さや・巻きひげ・托葉） ---------- */
  ill.peaPlant = function (x, y, h, o) {
    o = o || {}; var sd = o.seed || 1, purple = o.flower === 'purple', round = o.round !== false, yellow = o.yellow !== false;
    return place(make('pp' + sd + (purple ? 'p' : 'w') + (round ? 'R' : 'W') + (yellow ? 'Y' : 'G') + (o.closed ? 'c' : ''), function () {
      var r = rng(sd * 67 + 2), s = '<ellipse cx="0" cy="1" rx="26" ry="3.5" fill="' + U('shadow') + '"/><path d="M8 2L9 -102" stroke="#c8a870" stroke-width="1.6"/><path d="M8.6 2L9.6 -102" stroke="#8a6a40" stroke-width=".4"/>';
      var pts = [[0, 0]], ns = 7, i;
      for (i = 1; i <= ns; i++) pts.push([(i % 2 ? -3 : 4) + (r() - .5) * 2, -i * 13.5]);
      s += '<path d="' + smooth(pts, false) + '" stroke="#5f9a46" stroke-width="1.8" fill="none"/><path d="' + smooth(pts, false) + '" stroke="#b6dc94" stroke-width=".4" fill="none" transform="translate(-.4 0)"/>';
      var sti = '', lf = '', vn = '', pet = '', te = '', fl = '';
      pts.forEach(function (p, j) {
        if (!j) return;
        var side = j % 2 ? -1 : 1;
        /* 托葉（茎をだく大きな葉） */
        sti += leaf('stip', p[0], p[1], -.3, 11, 1.1) + leaf('stip', p[0], p[1], Math.PI + .3, 11, -1.1);
        vn += vein(p[0], p[1], -.6, 7) + vein(p[0], p[1], Math.PI + .6, 7);
        if (j === ns) return;
        /* 複葉：小葉 2 対＋巻きひげ */
        var ang = side > 0 ? -.45 : Math.PI + .45, L = 22, ex = p[0] + Math.cos(ang) * L, ey = p[1] + Math.sin(ang) * L;
        pet += 'M' + f(p[0]) + ' ' + f(p[1]) + 'L' + f(ex) + ' ' + f(ey);
        [.32, .62].forEach(function (t) { var bx = p[0] + Math.cos(ang) * L * t, by = p[1] + Math.sin(ang) * L * t; lf += leaf('ell', bx, by, ang - 1.1, 8.5, 1.45) + leaf('ell', bx, by, ang + 1.1, 8.5, 1.45); vn += vein(bx, by, ang - 1.1, 9) + vein(bx, by, ang + 1.1, 9); });
        for (var k = -1; k <= 1; k++) { var a = ang + k * .5, L2 = 7 + r() * 3, tx = ex + Math.cos(a) * L2, ty = ey + Math.sin(a) * L2, rr = 1.6 + r(); te += 'M' + f(ex) + ' ' + f(ey) + 'Q' + f(ex + Math.cos(a) * L2 * .6 + 1) + ' ' + f(ey + Math.sin(a) * L2 * .6 - 1) + ' ' + f(tx) + ' ' + f(ty) + 'a' + f(rr) + ' ' + f(rr) + ' 0 1 ' + (side > 0 ? 1 : 0) + ' ' + f(rr * 1.4) + ' ' + f(rr * .6) + 'a' + f(rr * .6) + ' ' + f(rr * .6) + ' 0 1 ' + (side > 0 ? 1 : 0) + ' ' + f(-rr * .7) + ' ' + f(-rr * .4); }
      });
      s += '<path d="' + sti + '" fill="' + U('pea') + '" stroke="#3f6a34" stroke-width=".35"/><path d="' + pet + '" stroke="#5f9a46" stroke-width=".9"/><path d="' + lf + '" fill="' + U('pea') + '" stroke="#3f6a34" stroke-width=".35"/><path d="' + vn + '" stroke="#d6ecbe" stroke-width=".3" fill="none"/><path d="' + te + '" stroke="#6faa48" stroke-width=".55" fill="none" stroke-linecap="round"/>';
      /* 花（旗弁・翼弁） */
      [[5, 1], [6, -1], [7, 1]].forEach(function (q) {
        var p = pts[q[0]], fx = p[0] + q[1] * 9, fy = p[1] - 6, sc = q[1];
        var stdc = purple ? '#d9b4e6' : '#fdfdf8', stdS = purple ? '#9a6aae' : '#b8bcae', wing = purple ? '#8e2f7a' : '#f2f4ea', wingS = purple ? '#5a1a4a' : '#a8ac9e';
        fl += '<path d="M' + f(p[0]) + ' ' + f(p[1]) + 'Q' + f(p[0] + sc * 4) + ' ' + f(p[1] - 1) + ' ' + f(fx - sc * 2) + ' ' + f(fy + 3) + '" stroke="#5f9a46" stroke-width=".7" fill="none"/>';
        fl += '<path d="M' + f(fx - sc * 3) + ' ' + f(fy + 3.5) + 'l' + f(sc * 3) + ' -2.5l0 2.5z" fill="#6aa04a"/>';
        fl += '<path d="M' + f(fx) + ' ' + f(fy + 2) + 'C' + f(fx - sc * 1) + ' ' + f(fy - 7) + ' ' + f(fx + sc * 9) + ' ' + f(fy - 9) + ' ' + f(fx + sc * 8) + ' ' + f(fy - 1) + 'C' + f(fx + sc * 8) + ' ' + f(fy + 3) + ' ' + f(fx + sc * 3) + ' ' + f(fy + 4) + ' ' + f(fx) + ' ' + f(fy + 2) + 'Z" fill="' + stdc + '" stroke="' + stdS + '" stroke-width=".4"/>';
        fl += '<path d="M' + f(fx + sc * 1.2) + ' ' + f(fy + 1) + 'q' + f(sc * 3) + ' -4 ' + f(sc * 5) + ' -6M' + f(fx + sc * 1.2) + ' ' + f(fy + 1) + 'q' + f(sc * 4) + ' -1 ' + f(sc * 6) + ' -2" stroke="' + (purple ? '#7a3a8a' : '#c8d4b0') + '" stroke-width=".3" fill="none"/>';
        fl += '<path d="M' + f(fx + sc * .5) + ' ' + f(fy + 2.5) + 'C' + f(fx + sc * 3) + ' ' + f(fy - 1) + ' ' + f(fx + sc * 7) + ' ' + f(fy + 1) + ' ' + f(fx + sc * 6.5) + ' ' + f(fy + 4) + 'C' + f(fx + sc * 5) + ' ' + f(fy + 6) + ' ' + f(fx + sc * 2) + ' ' + f(fy + 5) + ' ' + f(fx + sc * .5) + ' ' + f(fy + 2.5) + 'Z" fill="' + wing + '" stroke="' + wingS + '" stroke-width=".4"/>';
      });
      /* さや（1 つは開いて中の種子が見える） */
      [[2, 1, 1], [3, -1, 0], [4, 1, 0]].forEach(function (q) {
        var p = pts[q[0]], sc = q[1], px = p[0] + sc * 3, py = p[1] + 2, L = 24, op = q[2] && !o.closed;
        var d = 'M' + f(px) + ' ' + f(py) + 'C' + f(px + sc * 6) + ' ' + f(py + 4) + ' ' + f(px + sc * 9) + ' ' + f(py + 14) + ' ' + f(px + sc * 7) + ' ' + f(py + L) + 'C' + f(px + sc * 4) + ' ' + f(py + 14) + ' ' + f(px + sc * 1) + ' ' + f(py + 6) + ' ' + f(px) + ' ' + f(py) + 'Z';
        if (op) {
          fl += '<path d="M' + f(px) + ' ' + f(py) + 'C' + f(px + sc * 9) + ' ' + f(py + 3) + ' ' + f(px + sc * 14) + ' ' + f(py + 14) + ' ' + f(px + sc * 9) + ' ' + f(py + L + 1) + 'C' + f(px + sc * 2) + ' ' + f(py + 16) + ' ' + f(px - sc * 1) + ' ' + f(py + 6) + ' ' + f(px) + ' ' + f(py) + 'Z" fill="#e6f4c8" stroke="#4f8a34" stroke-width=".5"/>';
          for (var k = 0; k < 4; k++) { var t = .2 + k * .2; fl += ill.pea(px + sc * (2 + 7 * Math.sin(t * 2.6)), py + t * L - 2.4, 2.4, { round: round, yellow: yellow, seed: k + 1, shadow: false }); }
          fl += '<path d="M' + f(px) + ' ' + f(py) + 'C' + f(px - sc * 4) + ' ' + f(py + 6) + ' ' + f(px - sc * 2) + ' ' + f(py + 16) + ' ' + f(px + sc * 7) + ' ' + f(py + L) + 'C' + f(px + sc * 1) + ' ' + f(py + 14) + ' ' + f(px - sc * 1) + ' ' + f(py + 6) + ' ' + f(px) + ' ' + f(py) + 'Z" fill="' + U('pod') + '" stroke="#3f6a2a" stroke-width=".4"/>';
        } else {
          fl += '<path d="' + d + '" fill="' + U('pod') + '" stroke="#3f6a2a" stroke-width=".4"/>';
          var bm = ''; for (k = 0; k < 4; k++) { var t2 = .25 + k * .18; bm += 'M' + f(px + sc * (3 + 3.2 * Math.sin(t2 * 2.6))) + ' ' + f(py + t2 * L) + 'h.01'; }
          fl += '<path d="' + bm + '" stroke="#d4ecb0" stroke-width="2.6" stroke-linecap="round" opacity=".55"/>';
        }
        fl += '<path d="M' + f(px) + ' ' + f(py) + 'l' + f(-sc * 1.2) + ' -1.8l' + f(sc * 2.6) + ' .4z" fill="#5f9a46"/>';
      });
      return s + fl;
    }), x, y, h, o.flip);
  };
})();
