/* 生物ラボ：生物・細胞のくわしいイラスト（SVG の文字列を返す）
   使い方：SVG の中に BL.ill.lifeDefs() を1回入れてから、BL.ill.paramecium({lab:true}) などを置く。
   ふつうは「主な長さ＝100」の座標で、中心が (0,0)。transform="translate(x y) scale(d/100)" で大きさを決める。 */
var BL = window.BL = window.BL || {};
BL.ill = BL.ill || {};
(function (I) {
  var PI = Math.PI;
  function n(v) { return Math.round(v * 100) / 100; }
  function R(seed) { var s = Math.floor(seed) % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  /* なめらかな曲線（Catmull-Rom → ベジエ） */
  function cr(pts, closed) {
    var m = pts.length, d = 'M' + n(pts[0][0]) + ' ' + n(pts[0][1]), last = closed ? m : m - 1;
    for (var i = 0; i < last; i++) {
      var p0 = pts[closed ? (i - 1 + m) % m : Math.max(0, i - 1)], p1 = pts[i], p2 = pts[(i + 1) % m], p3 = pts[closed ? (i + 2) % m : Math.min(m - 1, i + 2)];
      d += 'C' + n(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + n(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + n(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + n(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + n(p2[0]) + ' ' + n(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }
  function polar(fr, N, cx, cy) { var p = []; for (var i = 0; i < N; i++) { var a = i / N * PI * 2, r = fr(a, i); p.push([(cx || 0) + Math.cos(a) * r, (cy || 0) + Math.sin(a) * r]); } return p; }
  function C(cx, cy, r, at) { return '<circle cx="' + n(cx) + '" cy="' + n(cy) + '" r="' + n(r) + '" ' + (at || '') + '/>'; }
  function E(cx, cy, rx, ry, rot, at) { return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) + '"' + (rot ? ' transform="rotate(' + n(rot) + ' ' + n(cx) + ' ' + n(cy) + ')"' : '') + ' ' + (at || '') + '/>'; }
  function P(d, at) { return '<path d="' + d + '" ' + (at || '') + '/>'; }
  function arc(cx, cy, r, a0, a1) { var x0 = cx + Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r, x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r; return 'M' + n(x0) + ' ' + n(y0) + 'A' + n(r) + ' ' + n(r) + ' 0 ' + (Math.abs(a1 - a0) > PI ? 1 : 0) + ' ' + (a1 > a0 ? 1 : 0) + ' ' + n(x1) + ' ' + n(y1); }
  function inside(x, y, poly) { var c = false; for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) { var a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  function scatter(rand, poly, k, ok) { var out = [], bx = [1e9, -1e9, 1e9, -1e9], tries = 0; poly.forEach(function (p) { bx[0] = Math.min(bx[0], p[0]); bx[1] = Math.max(bx[1], p[0]); bx[2] = Math.min(bx[2], p[1]); bx[3] = Math.max(bx[3], p[1]); }); while (out.length < k && tries++ < k * 60) { var x = bx[0] + rand() * (bx[1] - bx[0]), y = bx[2] + rand() * (bx[3] - bx[2]); if (inside(x, y, poly) && (!ok || ok(x, y))) out.push([x, y]); } return out; }
  function normals(pts) { var cx = 0, cy = 0; pts.forEach(function (p) { cx += p[0]; cy += p[1]; }); cx /= pts.length; cy /= pts.length; return pts.map(function (p, i) { var a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1, nx = ty / l, ny = -tx / l; if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; } return [nx, ny]; }); }
  function scale(pts, k, cx, cy) { cx = cx || 0; cy = cy || 0; return pts.map(function (p) { return [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]; }); }
  function dots(list, r, at) { return list.map(function (p) { return C(p[0], p[1], typeof r === 'function' ? r(p) : r, at); }).join(''); }
  /* 引き出し線つきのラベル L: [[ax,ay,tx,ty,'文字', 'start'|'end'|'middle']] */
  function labels(L, fs) {
    fs = fs || 6;
    return '<g class="ill-lab">' + L.map(function (l) {
      var an = l[5] || (l[2] < l[0] ? 'end' : 'start'), dx = an === 'end' ? -fs * .3 : an === 'start' ? fs * .3 : 0;
      return '<line x1="' + n(l[0]) + '" y1="' + n(l[1]) + '" x2="' + n(l[2]) + '" y2="' + n(l[3]) + '" stroke="var(--ink)" stroke-width="' + n(fs * .09) + '"/>' + C(l[0], l[1], fs * .16, 'fill="var(--ink)"') +
        '<text x="' + n(l[2] + dx) + '" y="' + n(l[3] + fs * .35) + '" font-size="' + n(fs) + '" text-anchor="' + an + '" font-weight="700" fill="var(--ink)" paint-order="stroke" stroke="var(--panel)" stroke-width="' + n(fs * .28) + '" stroke-linejoin="round">' + l[4] + '</text>';
    }).join('') + '</g>';
  }
  I.labels = labels; I.smooth = cr; I.rand = R;

  /* ---------- グラデーションなど（SVG に1回だけ入れる） ---------- */
  function st(stops) { return stops.map(function (s) { return '<stop offset="' + s[0] + '" style="stop-color:' + s[1] + ';stop-opacity:' + (s[2] == null ? 1 : s[2]) + '"/>'; }).join(''); }
  function rg(id, stops, a) { return '<radialGradient id="' + id + '" ' + (a || 'cx=".42" cy=".38" r=".66"') + '>' + st(stops) + '</radialGradient>'; }
  function lg(id, stops, a) { return '<linearGradient id="' + id + '" ' + (a || 'x1="0" y1="0" x2="0" y2="1"') + '>' + st(stops) + '</linearGradient>'; }
  var DEFS = null;
  I.lifeDefs = function () {
    if (DEFS) return DEFS;
    DEFS = rg('lf-sph', [[0, '#fff', .55], [.42, '#fff', 0], [.8, '#000', .08], [1, '#000', .32]], 'cx=".36" cy=".3" r=".75"') +
      rg('lf-rbc', [[0, '#f4a79c'], [.3, '#ea7a6f'], [.55, '#d8463d'], [.8, '#c0302a'], [.93, '#a11f1b'], [1, '#7c1512']], 'cx=".5" cy=".5" r=".5"') +
      rg('lf-rbcc', [[0, '#fbd0c8', .75], [.6, '#f2a095', .35], [1, '#e8766b', 0]], 'cx=".5" cy=".5" r=".5"') +
      rg('lf-cyto', [[0, '#fffaf0'], [.7, '#f8ead0'], [1, '#ecd5ab']]) +
      rg('lf-nuc', [[0, '#e6d6f6'], [.65, '#b494d8'], [1, '#7f5aac']]) +
      rg('lf-nucd', [[0, '#9b7bcf'], [.6, '#6a47a0'], [1, '#43286f']]) +
      rg('lf-nucb', [[0, '#9fb4e6'], [.7, '#5c72bf'], [1, '#3a4b94']]) +
      rg('lf-para', [[0, '#f3f8e2'], [.65, '#dfecbd'], [1, '#bcd28e']], 'cx=".45" cy=".35" r=".7"') +
      rg('lf-endo', [[0, '#eef5d8'], [1, '#cfe0a6']]) +
      rg('lf-cv', [[0, '#f4fcff'], [.7, '#bfe2f5'], [1, '#86c0e2']]) +
      rg('lf-fv', [[0, '#fdeccc'], [.7, '#efc983'], [1, '#c99a4e']]) +
      rg('lf-chl', [[0, '#c4ea9e'], [.6, '#79c057'], [1, '#3f8a34']]) +
      rg('lf-eug', [[0, '#eef7dc'], [.7, '#cfe6ae'], [1, '#a7cf84']], 'cx=".4" cy=".35" r=".75"') +
      lg('lf-eco', [[0, '#9cc77c'], [.18, '#d5ebbd'], [.45, '#e4f2d4'], [1, '#86b466']]) +
      rg('lf-ecoin', [[0, '#f6fbee'], [.8, '#e1f0cf'], [1, '#cfe5b6']], 'cx=".5" cy=".4" r=".7"') +
      rg('lf-vir', [[0, '#faf4fd'], [.7, '#eadcf5'], [1, '#d4bfea']]) +
      rg('lf-egg', [[0, '#fffaf0'], [.6, '#f8ead0'], [.92, '#efd7a8'], [1, '#e2c48c']], 'cx=".45" cy=".4" r=".6"') +
      rg('lf-zona', [[0, '#eaf1f8', 0], [.8, '#eaf1f8', 0], [.82, '#e3ecf6', .9], [.95, '#d3e0ef', .95], [1, '#b8cbe2', 1]], 'cx=".5" cy=".5" r=".5"') +
      lg('lf-frog', [[0, '#1f1712'], [.3, '#3a2a20'], [.5, '#5b4330'], [.6, '#a98e66'], [.7, '#e2d4ae'], [1, '#f3ead0']]) +
      rg('lf-jelly', [[0, '#d8ecf2', 0], [.82, '#d8ecf2', .05], [.97, '#b9d9e6', .45], [1, '#8fbfd2', .7]], 'cx=".5" cy=".5" r=".5"') +
      lg('lf-fish', [[0, '#9a5a24'], [.22, '#d98d44'], [.5, '#f2b46a'], [.72, '#f8dcae'], [1, '#fff4e4']]) +
      lg('lf-fin', [[0, '#f3b46c', .85], [1, '#f6d2a0', .45]], 'x1="0" y1="0" x2="1" y2="0"') +
      rg('lf-eye', [[0, '#ffffff'], [.5, '#dfe7ec'], [1, '#8fa0ac']]) +
      lg('lf-hum', [[0, '#6f8db3'], [.35, '#a7bfdc'], [.6, '#b9cde4'], [1, '#6f8db3']], 'x1="0" y1="0" x2="1" y2="0"') +
      rg('lf-wbc', [[0, '#fbf6fd'], [.7, '#efe2f3'], [1, '#d9c3e3']]) +
      rg('lf-mac', [[0, '#fbf4ea'], [.7, '#f1dfc8'], [1, '#dcc09a']]) +
      rg('lf-lym', [[0, '#e6f0fb'], [.75, '#bcd4ee'], [1, '#8fb2db']]) +
      rg('lf-pla', [[0, '#dce9f8'], [.7, '#a9c4e6'], [1, '#7d9fcf']]) +
      rg('lf-chk', [[0, '#f1f5fc'], [.7, '#dce6f6'], [1, '#bccbe8']], 'cx=".45" cy=".4" r=".7"') +
      rg('lf-enz', [[0, '#c9edb8'], [.5, '#86c46f'], [.85, '#4f9446'], [1, '#3a7536']], 'cx=".38" cy=".34" r=".72"') +
      rg('lf-sub', [[0, '#ffe2b3'], [.6, '#f3a64c'], [1, '#d07a22']], 'cx=".4" cy=".35" r=".7"') +
      rg('lf-pro', [[0, '#d9e8fb'], [.6, '#79a7dc'], [1, '#3f73b4']], 'cx=".4" cy=".35" r=".7"') +
      rg('lf-soma', [[0, '#fbeaf5'], [.6, '#efc3e0'], [1, '#d197c0']], 'cx=".4" cy=".35" r=".7"') +
      lg('lf-myel', [[0, '#fffbee'], [.35, '#f8ebc6'], [.75, '#e9d39a'], [1, '#c9a862']]) +
      lg('lf-axon', [[0, '#e9bfdc'], [.5, '#f6dff0'], [1, '#c98ab4']]) +
      rg('lf-glow', [[0, '#fff3b0', .95], [.35, '#ffb347', .75], [1, '#ff7a1a', 0]], 'cx=".5" cy=".5" r=".5"') +
      rg('lf-glowb', [[0, '#bfe0ff', .7], [1, '#5ea0e6', 0]], 'cx=".5" cy=".5" r=".5"');
    DEFS = '<defs>' + DEFS + '</defs>';
    return DEFS;
  };
  /* 単独の SVG にする */
  I.lifeSvg = function (inner, vb, style) { return '<svg class="svgfig" viewBox="' + vb + '" role="img"' + (style ? ' style="' + style + '"' : '') + '>' + I.lifeDefs() + inner + '</svg>'; };

  /* =========================================================
     ゾウリムシ（長さ100：x −50 前端〜 +50 後端）
     ========================================================= */
  function paraW(x) { return 17.5 * (1 + .13 * x / 50); }
  function paraBot(x) { var c = -x / 50, s = Math.sqrt(Math.max(0, 1 - c * c)); return paraW(x) * s - 5.5 * Math.exp(-Math.pow((x + 6) / 17, 2)) * s; }
  var PARA = (function () { var p = []; for (var i = 0; i < 120; i++) { var t = i / 120 * PI * 2, c = Math.cos(t), s = Math.sin(t), x = -50 * c, y = paraW(x) * s; if (s > 0) y -= 5.5 * Math.exp(-Math.pow((x + 6) / 17, 2)) * s; p.push([x, y]); } return p; })();
  I.paramecium = function (o) {
    o = o || {}; var r = R(11), ph = o.ph || 0, nm = normals(PARA), s = '<g class="ill-para">';
    /* 繊毛（メタクロナール波） */
    var cil = '';
    PARA.forEach(function (p, i) {
      [0, .5].forEach(function (h) {
        var q = h ? [(p[0] + PARA[(i + 1) % PARA.length][0]) / 2, (p[1] + PARA[(i + 1) % PARA.length][1]) / 2] : p, nn = nm[i], b = .55 * Math.sin(i * .42 + h + ph) + .35, L = 4.3;
        var tx = nn[0] * Math.cos(b) - nn[1] * Math.sin(b), ty = nn[0] * Math.sin(b) + nn[1] * Math.cos(b);
        cil += 'M' + n(q[0]) + ' ' + n(q[1]) + 'Q' + n(q[0] + nn[0] * L * .6) + ' ' + n(q[1] + nn[1] * L * .6) + ' ' + n(q[0] + tx * L) + ' ' + n(q[1] + ty * L);
      });
    });
    s += P(cil, 'fill="none" stroke="#7d9a56" stroke-width=".42" stroke-linecap="round"');
    s += P(cr(PARA, true), 'fill="url(#lf-para)" stroke="#557f34" stroke-width=".9"');
    /* 外質と内質 */
    var endo = scale(PARA, .86, 2, 0);
    s += P(cr(endo, true), 'fill="url(#lf-endo)" opacity=".75" stroke="#a9c27e" stroke-width=".35" stroke-dasharray="1 1.2"');
    /* 毛胞 */
    var tri = ''; PARA.forEach(function (p, i) { if (i % 2) return; var nn = nm[i]; tri += 'M' + n(p[0] - nn[0] * .8) + ' ' + n(p[1] - nn[1] * .8) + 'l' + n(-nn[0] * 1.8) + ' ' + n(-nn[1] * 1.8); });
    s += P(tri, 'stroke="#98b06c" stroke-width=".45" stroke-linecap="round"');
    /* 口溝（口部） */
    var gt = [], gb = [];
    for (var x = -44; x <= 2; x += 3) { var yb = paraBot(x), w = 1 + 5 * Math.pow((x + 44) / 46, 1.3); gt.push([x, yb - .8]); gb.unshift([x + 1.2, yb - .8 - w]); }
    s += P(cr(gt.concat(gb), true), 'fill="#86a85a" opacity=".35"');
    s += P('M' + n(1.5) + ' ' + n(paraBot(2) - 5.5) + 'C6 ' + n(paraBot(2) - 7) + ' 7 6 9 3', 'fill="none" stroke="#6b8f45" stroke-width="1.3" stroke-linecap="round"');
    /* 細胞質の粒 */
    s += dots(scatter(r, endo, 80), .38, 'fill="#7f9a58" opacity=".45"');
    /* 食胞 */
    [[-15, -6, 2.6], [-21, 3, 2.1], [17, 7, 3], [27, -1, 2.4], [-7, -10, 2], [37, 4, 2.2], [9.5, 3, 2.4], [-30, 1, 1.8]].forEach(function (f, k) {
      s += C(f[0], f[1], f[2], 'fill="url(#lf-fv)" stroke="#a7783a" stroke-width=".35"');
      for (var j = 0; j < 3; j++) s += E(f[0] + Math.cos(j * 2.1 + k) * f[2] * .4, f[1] + Math.sin(j * 2.1 + k) * f[2] * .4, f[2] * .28, f[2] * .14, j * 60 + k * 20, 'fill="#8a5f2a" opacity=".7"');
    });
    /* 大核・小核 */
    s += E(8, -2, 12.5, 7, -8, 'fill="url(#lf-nuc)" stroke="#6b4a8a" stroke-width=".7"');
    s += dots(scatter(R(5), polar(function (a) { return 6; }, 16, 8, -2).map(function (p) { return [8 + (p[0] - 8) * 1.8, p[1]]; }), 30), .45, 'fill="#6a47a0" opacity=".55"');
    s += C(-3.2, 4.2, 2.3, 'fill="url(#lf-nucd)" stroke="#3e2566" stroke-width=".4"');
    /* 収縮胞（放射状の水路つき） */
    [[-29, -7.5], [31, -8]].forEach(function (v, k) {
      var cv = '';
      for (var j = 0; j < 8; j++) { var a = j / 8 * PI * 2 + k * .3, a1 = a + .16, a2 = a - .16; cv += 'M' + n(v[0] + Math.cos(a1) * 2.6) + ' ' + n(v[1] + Math.sin(a1) * 2.6) + 'Q' + n(v[0] + Math.cos(a + .25) * 6) + ' ' + n(v[1] + Math.sin(a + .25) * 6) + ' ' + n(v[0] + Math.cos(a + .15) * 8.2) + ' ' + n(v[1] + Math.sin(a + .15) * 8.2) + 'Q' + n(v[0] + Math.cos(a) * 5.4) + ' ' + n(v[1] + Math.sin(a) * 5.4) + ' ' + n(v[0] + Math.cos(a2) * 2.6) + ' ' + n(v[1] + Math.sin(a2) * 2.6) + 'Z'; }
      s += P(cv, 'fill="#a9d4ee" stroke="#5f9cc6" stroke-width=".25"') + C(v[0], v[1], 3.1, 'fill="url(#lf-cv)" stroke="#4f8fbf" stroke-width=".5"');
    });
    if (o.lab) s += labels([[-10, -17.3, -14, -27, '繊毛', 'end'], [-2, -20, 3, -27, '収縮胞', 'start'], [16, -4, 30, -24, '大核'], [-3.2, 4.2, -8, 25, '小核', 'end'], [17, 7, 24, 25, '食胞'], [2, paraBot(2) - 6, 2, 25, '細胞口', 'middle']].map(function (l) { if (l[4] === '収縮胞') { l[0] = -29; l[1] = -7.5; } return l; }), o.fs || 5.5);
    return s + '</g>';
  };

  /* =========================================================
     ミドリムシ（ユーグレナ）（体長100：x −50 前端〜 +50 尾）
     ========================================================= */
  function eugW(x) { var u = (x + 50) / 100; if (u < 0 || u > 1) return 0; return 13.5 * Math.pow(Math.sin(PI * Math.pow(Math.max(0, Math.min(1, u)), .62)), .8) * (1 - .18 * u) + (u < .05 ? 2.6 * (1 - u / .05) : 0); }
  function eugC(x) { return 1.8 * Math.sin((x + 50) / 100 * PI * 1.3); }
  var EUG = (function () { var t = [], b = []; for (var x = -50; x <= 50.01; x += 2.5) { t.push([x, eugC(x) - eugW(x)]); b.unshift([x, eugC(x) + eugW(x)]); } return t.concat(b.slice(1, -1)); })();
  I.euglena = function (o) {
    o = o || {}; var r = R(23), ph = o.ph || 0, s = '<g class="ill-eug">';
    /* べん毛 */
    var fl = [];
    for (var k = 0; k <= 60; k++) { var u = k / 60, x = -50 - u * 80; fl.push([x, eugC(-50) + Math.min(1, u * 4) * 5 * Math.sin(u * 80 / 15 * PI * 2 + ph)]); }
    s += P(cr(fl), 'fill="none" stroke="#4d7a36" stroke-width=".9" stroke-linecap="round"');
    s += P(cr(EUG, true), 'fill="url(#lf-eug)" stroke="#4f8a37" stroke-width=".8"');
    /* ペリクルのらせん模様 */
    var str = '';
    for (var q = -64; q < 64; q += 4.2) { var run = []; for (var y = -16; y <= 16.01; y += 1) { var xx = q + y * .7; if (Math.abs(y - eugC(xx)) < eugW(xx) - .6) run.push(n(xx) + ' ' + n(y)); else { if (run.length > 1) str += 'M' + run.join('L'); run = []; } } if (run.length > 1) str += 'M' + run.join('L'); }
    s += P(str, 'fill="none" stroke="#7aa65a" stroke-width=".3" opacity=".55"');
    /* 葉緑体・パラミロン */
    var cp = scatter(r, scale(EUG, .84, 0, 0), 22, function (x, y) { return x > -36 && Math.hypot((x - 12) / 9, (y - eugC(12)) / 7) > 1; });
    cp.forEach(function (p, k) { s += E(p[0], p[1], 4.3, 1.9, r() * 180, 'fill="url(#lf-chl)" stroke="#3a7a2c" stroke-width=".3"') + E(p[0], p[1], 2.6, .5, 0, 'fill="none"'); });
    scatter(r, scale(EUG, .8, 0, 0), 7, function (x) { return x > -30; }).forEach(function (p) { s += E(p[0], p[1], 2.2, 1.15, r() * 180, 'fill="#fbfbf2" stroke="#b5b39a" stroke-width=".3"'); });
    /* 核 */
    s += E(12, eugC(12), 7.5, 5.8, 8, 'fill="url(#lf-nuc)" stroke="#6b4a8a" stroke-width=".6"') + C(12.5, eugC(12), 2.1, 'fill="#5b3a86"');
    /* 貯蔵胞・収縮胞・眼点 */
    var y0 = eugC(-44);
    s += P('M-50 ' + n(eugC(-50)) + 'L-46 ' + n(y0), 'stroke="#9ccbe8" stroke-width="1.6" stroke-linecap="round"');
    s += E(-43, y0, 4.6, 3, 0, 'fill="url(#lf-cv)" stroke="#5f9cc6" stroke-width=".4"') + E(-44.5, y0 - .6, 1.4, .9, 0, 'fill="#7aa65a"');
    s += C(-38.5, y0 + 4, 1.9, 'fill="url(#lf-cv)" stroke="#5f9cc6" stroke-width=".35"');
    s += E(-41.5, y0 - 4.3, 2.4, 1.7, -10, 'fill="#e2512a" stroke="#a52a12" stroke-width=".3"') + dots([[-42.3, y0 - 4.6], [-40.8, y0 - 4.1], [-41.6, y0 - 3.5]], .55, 'fill="#ff9a5a"');
    if (o.lab) s += labels([[-90, eugC(-50) + 4, -92, 22, 'べん毛', 'middle'], [-41.5, y0 - 4.3, -46, -22, '眼点', 'end'], [-26, -1, -22, -24, '葉緑体', 'middle'], [14, eugC(12) + 3, 20, 24, '核', 'middle'], [-43, y0 + 1, -48, 24, '収縮胞', 'end']], o.fs || 5.5);
    return s + '</g>';
  };

  /* =========================================================
     大腸菌（長さ100・太さ34：x −50〜50）
     ========================================================= */
  var ECO_R = 17;
  function capsule(i) { var rr = ECO_R - i; return '<rect x="' + n(-50 + i) + '" y="' + n(-rr) + '" width="' + n(100 - 2 * i) + '" height="' + n(2 * rr) + '" rx="' + n(rr) + '"'; }
  function capPt(t, off) { /* 周の上の点（t:0〜1）と外向き法線 */
    var L1 = 100 - 2 * ECO_R, arcL = PI * ECO_R, T = 2 * L1 + 2 * arcL, d = t * T, rr = ECO_R + (off || 0);
    if (d < L1) return [-50 + ECO_R + d, -rr, 0, -1];
    d -= L1; if (d < arcL) { var a = -PI / 2 + d / ECO_R; return [50 - ECO_R + Math.cos(a) * rr, Math.sin(a) * rr, Math.cos(a), Math.sin(a)]; }
    d -= arcL; if (d < L1) return [50 - ECO_R - d, rr, 0, 1];
    d -= L1; a = PI / 2 + d / ECO_R; return [-50 + ECO_R + Math.cos(a) * rr, Math.sin(a) * rr, Math.cos(a), Math.sin(a)];
  }
  I.ecoli = function (o) {
    o = o || {}; var r = R(37), ph = o.ph || 0, s = '<g class="ill-eco">';
    /* べん毛（周毛性） */
    [.08, .21, .4, .58, .7, .9].forEach(function (t, k) {
      var p = capPt(t, -.5), dx = p[2] + 1.7, dy = p[3] * .9, l = Math.hypot(dx, dy); dx /= l; dy /= l;
      var pts = [[p[0], p[1]], [p[0] + p[2] * 3, p[1] + p[3] * 3]], L = 70 + k * 6;
      for (var j = 1; j <= 40; j++) { var u = j / 40 * L, w = 3.3 * Math.sin(u / 15 * PI * 2 + ph + k); pts.push([p[0] + p[2] * 3 + dx * u - dy * w, p[1] + p[3] * 3 + dy * u + dx * w]); }
      s += P(cr(pts), 'fill="none" stroke="#5d6b4c" stroke-width=".85" stroke-linecap="round"') + C(p[0], p[1], 1.1, 'fill="#3f4f30"');
    });
    /* 線毛 */
    var pl = '';
    for (var k = 0; k < 64; k++) { var p = capPt((k + r() * .6) / 64, 0), L = 4.5 + r() * 3.5, bend = (r() - .5) * .6; pl += 'M' + n(p[0]) + ' ' + n(p[1]) + 'q' + n(p[2] * L * .5 - p[3] * bend * 2) + ' ' + n(p[3] * L * .5 + p[2] * bend * 2) + ' ' + n(p[2] * L) + ' ' + n(p[3] * L); }
    s += P(pl, 'fill="none" stroke="#7b9a5c" stroke-width=".36" stroke-linecap="round"');
    /* 外膜・ペプチドグリカン（細胞壁）・細胞膜 */
    s += capsule(0) + ' fill="url(#lf-eco)" stroke="#3d6a2a" stroke-width=".9"/>';
    s += capsule(1.4) + ' fill="none" stroke="#b9d69c" stroke-width="1.1"/>';
    s += capsule(2.5) + ' fill="url(#lf-ecoin)" stroke="#4f7f38" stroke-width=".55"/>';
    /* 核様体（環状 DNA が折りたたまれている） */
    s += E(0, 0, 29, 9.5, 0, 'fill="#c8b2e2" opacity=".35"');
    for (var lp = 0; lp < 2; lp++) {
      var pts2 = [], rr = R(91 + lp);
      for (var j = 0; j < 46; j++) { var a = j / 46 * PI * 2, rad = .55 + rr() * .5; pts2.push([Math.cos(a * 3 + lp) * 26 * rad * Math.cos(a), Math.sin(a * 5 + lp) * 8.5 * rad]); }
      s += P(cr(pts2, true), 'fill="none" stroke="#7a55a6" stroke-width=".5" opacity=".9"');
    }
    /* リボソーム・プラスミド */
    var inner = []; for (var t = 0; t < 1; t += 1 / 60) { var q2 = capPt(t, -4); inner.push([q2[0], q2[1]]); }
    s += dots(scatter(r, inner, 95, function (x, y) { return Math.hypot(x / 29, y / 9.5) > .95; }), .78, 'fill="#5d4290" opacity=".6"');
    s += C(-37, 6, 3, 'fill="none" stroke="#a24fb0" stroke-width=".6"') + C(36, -6.5, 2.5, 'fill="none" stroke="#a24fb0" stroke-width=".6"');
    if (o.lab) s += labels([[-24, -16.6, -30, -30, '細胞壁・細胞膜', 'end'], [8, 3, 14, 30, '核様体（DNA）', 'middle'], [-37, 6, -40, 30, 'プラスミド', 'middle'], [30, 10, 40, 30, 'リボソーム', 'start'], [-46, -21, -58, -10, '線毛', 'end'], [80, -6, 92, -20, 'べん毛', 'start']], o.fs || 5.5);
    return s + '</g>';
  };

  /* =========================================================
     インフルエンザウイルス（直径100：表面の突起の先まで）
     o.ha / o.na：突起の色、o.dead：不活化（ワクチン）
     ========================================================= */
  I.virus = function (o) {
    o = o || {}; var ha = o.ha || '#2f9a86', na = o.na || '#d5832c', s = '<g class="ill-virus">', N = 40;
    for (var k = 0; k < N; k++) {
      var deg = k / N * 360 + (k % 3) * 1.5, isNA = k % 5 === 2;
      s += '<g transform="rotate(' + n(deg) + ')">';
      if (isNA) s += '<rect x="40.5" y="-.38" width="6.4" height=".76" fill="' + na + '"/><rect x="46.2" y="-2" width="3.8" height="4" rx=".9" fill="' + na + '" stroke="rgba(0,0,0,.35)" stroke-width=".3"/><path d="M48.1 -2v4M46.2 0h3.8" stroke="rgba(255,255,255,.45)" stroke-width=".3"/>';
      else s += '<path d="M40.5 -.9L46.3 -.75L46.3 .75L40.5 .9Z" fill="' + ha + '"/><circle cx="47.5" cy="-1.05" r="1.25" fill="' + ha + '"/><circle cx="47.5" cy="1.05" r="1.25" fill="' + ha + '"/><circle cx="48.7" cy="0" r="1.25" fill="' + ha + '" stroke="rgba(0,0,0,.25)" stroke-width=".25"/>';
      s += '</g>';
    }
    /* エンベロープ（脂質二重層） */
    s += C(0, 0, 38.7, 'fill="none" stroke="#efdd9a" stroke-width="3.7"');
    var hd = '';
    for (k = 0; k < 84; k++) { var a = k / 84 * PI * 2; hd += C(Math.cos(a) * 40.6, Math.sin(a) * 40.6, .95, ''); }
    for (k = 0; k < 76; k++) { a = (k + .5) / 76 * PI * 2; hd += C(Math.cos(a) * 36.8, Math.sin(a) * 36.8, .9, ''); }
    s += '<g fill="#c99d22">' + hd + '</g>';
    /* M1 タンパク質の層 */
    hd = ''; for (k = 0; k < 60; k++) { a = k / 60 * PI * 2; hd += C(Math.cos(a) * 34.6, Math.sin(a) * 34.6, 1.05, ''); }
    s += C(0, 0, 33.7, 'fill="url(#lf-vir)"') + '<g fill="#a98bc9">' + hd + '</g>';
    /* RNA（8本の分節：RNP） */
    var lens = [24, 20, 27, 17, 25, 14, 21, 18];
    lens.forEach(function (L, j) {
      var x = -15.5 + j * 4.4, y0 = -L / 2 + ((j * 7) % 5 - 2), d = '';
      for (var t = 0; t <= L; t += .6) d += (t ? 'L' : 'M') + n(x + Math.sin(t / 2.2 * PI * 2) * 1.25) + ' ' + n(y0 + t);
      s += '<g transform="rotate(' + (j * 3 - 10) + ')"><line x1="' + n(x) + '" y1="' + n(y0) + '" x2="' + n(x) + '" y2="' + n(y0 + L) + '" stroke="#f5cfd8" stroke-width="2.8" stroke-linecap="round"/>' + P(d, 'fill="none" stroke="#cf5674" stroke-width=".7"') + '</g>';
    });
    s += C(0, 0, 50, 'fill="url(#lf-sph)" opacity=".35"');
    if (o.dead) s += C(0, 0, 50, 'fill="#9a9a9a" opacity=".45"');
    if (o.lab) s += labels([[-29, -36, -48, -52, 'HA（ヘマグルチニン）', 'end'], [Math.cos(2 / 40 * PI * 2) * 48, Math.sin(2 / 40 * PI * 2) * 48, 62, 18, 'NA（ノイラミニダーゼ）', 'start'], [27, -27.5, 52, -40, 'エンベロープ（脂質二重層）', 'start'], [6, 4, 40, 60, 'RNA（8本）', 'start']], o.fs || 6);
    return s + '</g>';
  };

  /* =========================================================
     赤血球（直径100、両凹円盤）  o.side：横から見た形も
     ========================================================= */
  I.rbc = function (o) {
    o = o || {}; var s = '<g class="ill-rbc">';
    s += C(1.2, 1.6, 50, 'fill="#5a0d0b" opacity=".18"');
    s += C(0, 0, 50, 'fill="url(#lf-rbc)" stroke="#7c1512" stroke-width=".8"');
    s += C(0, 0, 25, 'fill="url(#lf-rbcc)"');
    s += P(arc(0, 0, 41, PI * 1.05, PI * 1.62), 'fill="none" stroke="#ffd9d2" stroke-width="5" stroke-linecap="round" opacity=".5"');
    s += P(arc(0, 0, 42, PI * .05, PI * .6), 'fill="none" stroke="#5a0d0b" stroke-width="5" stroke-linecap="round" opacity=".18"');
    s += P(arc(0, 0, 21, PI * 1.05, PI * 1.75), 'fill="none" stroke="#8a1a16" stroke-width="5" stroke-linecap="round" opacity=".22"');
    s += P(arc(0, 0, 21, PI * .1, PI * .75), 'fill="none" stroke="#ffe3dc" stroke-width="4" stroke-linecap="round" opacity=".45"');
    if (o.side) s += '<g transform="translate(0 ' + (o.side) + ')">' + P('M-50 0C-50 -9 -40 -11 -28 -8C-14 -4 -8 -3 0 -3C8 -3 14 -4 28 -8C40 -11 50 -9 50 0C50 9 40 11 28 8C14 4 8 3 0 3C-8 3 -14 4 -28 8C-40 11 -50 9 -50 0Z', 'fill="#d4443b" stroke="#7c1512" stroke-width=".8"') + '</g>';
    if (o.lab) s += labels([[0, 0, 0, 62, '中央がくぼんだ円盤形（核がない）', 'middle']], o.fs || 7);
    return s + '</g>';
  };

  /* =========================================================
     白血球のなかま（直径100）
     ========================================================= */
  function blob(seed, rad, amp, N) { var r = R(seed), ph = [r() * 6, r() * 6, r() * 6]; return polar(function (a) { return rad + amp * (Math.sin(a * 3 + ph[0]) * .5 + Math.sin(a * 5 + ph[1]) * .3 + Math.sin(a * 8 + ph[2]) * .2); }, N || 40); }
  I.neutrophil = function (o) {
    o = o || {}; var r = R(41), body = blob(41, 47, 2.5), s = '<g class="ill-neut">';
    s += P(cr(body, true), 'fill="url(#lf-wbc)" stroke="#9b7aa8" stroke-width=".9"');
    s += dots(scatter(r, scale(body, .93), 170), function () { return .7 + r() * .5; }, 'fill="#c78ab0" opacity=".55"');
    /* 分葉核（3〜5つにくびれた核） */
    var lobes = [[-20, -10, 11, 9, 20], [-2, -19, 10, 8.5, -10], [17, -6, 11, 9, 40], [9, 16, 10.5, 8.5, -20]];
    var link = 'M-20 -10Q-12 -18 -2 -19M-2 -19Q10 -16 17 -6M17 -6Q16 6 9 16';
    s += P(link, 'fill="none" stroke="#4b2f7a" stroke-width="3.2" stroke-linecap="round"');
    lobes.forEach(function (l) { s += E(l[0], l[1], l[2], l[3], l[4], 'fill="url(#lf-nucd)" stroke="#3a2260" stroke-width=".6"'); });
    s += C(0, 0, 50, 'fill="url(#lf-sph)" opacity=".3"');
    return s + '</g>';
  };
  I.macrophage = function (o) {
    o = o || {}; var r = R(53), s = '<g class="ill-mac">';
    var body = polar(function (a) { return 40 + 3 * Math.sin(a * 6 + 1) + 13 * Math.pow(Math.max(0, Math.cos(a * 2 - .4)), 6) + 9 * Math.pow(Math.max(0, Math.cos(a * 3 + 2)), 10); }, 64);
    s += P(cr(body, true), 'fill="url(#lf-mac)" stroke="#a2804e" stroke-width=".9"');
    /* 食胞（とりこんだ細菌）・リソソーム */
    [[18, 14, 8, 1], [-20, 18, 6.5, 0], [22, -16, 5.5, 1]].forEach(function (v, k) { s += C(v[0], v[1], v[2], 'fill="#f6f0e4" stroke="#b39568" stroke-width=".5"') + (v[3] ? E(v[0], v[1], v[2] * .55, v[2] * .25, k * 50, 'fill="#7fb05a" stroke="#4d7a36" stroke-width=".4"') : E(v[0], v[1], v[2] * .4, v[2] * .3, 0, 'fill="#b8a080"')); });
    s += dots(scatter(r, scale(body, .85), 22, function (x, y) { return Math.hypot(x + 6, y + 2) > 16; }), 1.4, 'fill="#c0623a" opacity=".7"');
    s += dots(scatter(r, scale(body, .9), 60), .5, 'fill="#9a7a50" opacity=".45"');
    s += P('M-18 -8C-18 -20 2 -22 6 -12C8 -6 2 -4 2 2C2 10 -16 12 -18 2Z', 'fill="url(#lf-nuc)" stroke="#6b4a8a" stroke-width=".7"');
    if (o.eat) s += E(56, -6, 7, 3, 20, 'fill="#7fb05a" stroke="#4d7a36" stroke-width=".5"');
    return s + '</g>';
  };
  I.dendritic = function (o) {
    o = o || {}; var r = R(67), s = '<g class="ill-dc">', arms = '';
    var A = [-.3, .6, 1.4, 2.1, 2.8, 3.6, 4.4, 5.3];
    A.forEach(function (a, k) {
      var L = 38 + r() * 12, bend = (r() - .5) * .7, b1 = [Math.cos(a - .3) * 17, Math.sin(a - .3) * 17], b2 = [Math.cos(a + .3) * 17, Math.sin(a + .3) * 17];
      var tip = [Math.cos(a + bend) * L, Math.sin(a + bend) * L], m = [Math.cos(a + bend * .4) * L * .55, Math.sin(a + bend * .4) * L * .55], px = -Math.sin(a), py = Math.cos(a), w = 2.4 + r() * 1.4;
      arms += 'M' + n(b1[0]) + ' ' + n(b1[1]) + 'Q' + n(m[0] - px * w) + ' ' + n(m[1] - py * w) + ' ' + n(tip[0]) + ' ' + n(tip[1]) + 'Q' + n(m[0] + px * w) + ' ' + n(m[1] + py * w) + ' ' + n(b2[0]) + ' ' + n(b2[1]) + 'Z';
      var sb = a + (k % 2 ? .6 : -.6), bx = m[0], by = m[1];
      arms += 'M' + n(bx - px * 1.6) + ' ' + n(by - py * 1.6) + 'Q' + n(bx + Math.cos(sb) * 7) + ' ' + n(by + Math.sin(sb) * 7) + ' ' + n(bx + Math.cos(sb) * 15) + ' ' + n(by + Math.sin(sb) * 15) + 'Q' + n(bx + Math.cos(sb) * 6 + px * 2) + ' ' + n(by + Math.sin(sb) * 6 + py * 2) + ' ' + n(bx + px * 1.6) + ' ' + n(by + py * 1.6) + 'Z';
    });
    s += P(arms, 'fill="url(#lf-mac)" stroke="#a2804e" stroke-width=".8" stroke-linejoin="round"');
    s += P(cr(blob(67, 20, 2.5, 30), true), 'fill="url(#lf-mac)" stroke="none"');
    s += dots(scatter(r, blob(67, 17, 2, 20), 18), .6, 'fill="#9a7a50" opacity=".5"');
    s += P('M-9 -6C-6 -14 8 -12 9 -4C10 3 4 2 3 7C2 12 -10 10 -10 3Z', 'fill="url(#lf-nuc)" stroke="#6b4a8a" stroke-width=".6"');
    if (o.ag) s += '<g transform="translate(' + n(Math.cos(.6) * 40) + ' ' + n(Math.sin(.6) * 40) + ') scale(.16)">' + I.virus({ ha: o.ag, na: o.ag }) + '</g>';
    return s + '</g>';
  };
  /* リンパ球：o.kind = 'B' | 'T' | 'mem'（記憶細胞） | 'plasma'（形質細胞＝抗体産生細胞）, o.c：受容体の色 */
  I.lymphocyte = function (o) {
    o = o || {}; var kind = o.kind || 'B', r = R(kind === 'T' ? 71 : 73), s = '<g class="ill-lym">', c = o.c || '#d5832c';
    if (kind === 'plasma') {
      var body = polar(function (a) { return 44 - 6 * Math.cos(2 * a) + 2 * Math.sin(3 * a + 1); }, 44);
      s += P(cr(body, true), 'fill="url(#lf-pla)" stroke="#4f74ad" stroke-width=".9"');
      /* 粗面小胞体（層状）・ゴルジ体の明るい部分 */
      for (var k = 0; k < 6; k++) s += P(arc(-12, 0, 18 + k * 4.4, -1.1, 1.1), 'fill="none" stroke="#5b7fbf" stroke-width="1" opacity=".55" stroke-dasharray=".6 1.1"');
      s += E(-4, -2, 9, 7, 0, 'fill="#eaf2fb" opacity=".8"');
      s += C(-20, 0, 18, 'fill="url(#lf-nucd)" stroke="#3a2260" stroke-width=".7"');
      for (k = 0; k < 9; k++) { var a = k / 9 * PI * 2; s += E(-20 + Math.cos(a) * 11, Math.sin(a) * 11, 3.4, 2.4, a * 57.3, 'fill="#2e1850" opacity=".75"'); }
      s += C(-20, 0, 3.6, 'fill="#2e1850" opacity=".8"');
      s += C(0, 0, 50, 'fill="url(#lf-sph)" opacity=".25"');
      return s + '</g>';
    }
    var rr = kind === 'mem' ? 46 : 44;
    if (kind === 'B' || kind === 'mem') for (k = 0; k < 14; k++) { a = k / 14 * PI * 2 + .2; s += '<g transform="rotate(' + n(a * 57.3) + ') translate(' + rr + ' 0) rotate(90) scale(.14)">' + I.antibody({ c: c, solo: 1 }) + '</g>'; }
    if (kind === 'T') for (k = 0; k < 14; k++) { a = k / 14 * PI * 2 + .2; s += '<g transform="rotate(' + n(a * 57.3) + ')"><path d="M' + rr + ' 0h4M' + (rr + 4) + ' 0l2.4 -2M' + (rr + 4) + ' 0l2.4 2" stroke="' + c + '" stroke-width="1.6" stroke-linecap="round" fill="none"/></g>'; }
    s += P(cr(blob(kind === 'T' ? 71 : 73, rr, 1.5), true), 'fill="url(#lf-lym)" stroke="#4f74ad" stroke-width=".9"');
    s += P(cr(blob(kind === 'T' ? 72 : 74, rr * .8, 1.8), true), 'fill="url(#lf-nucd)" stroke="#3a2260" stroke-width=".6"', 0);
    s += dots(scatter(r, blob(5, rr * .72, 1), 22), function () { return 1.4 + r() * 1.8; }, 'fill="#2e1850" opacity=".45"');
    if (kind === 'mem') s += C(0, 0, rr + 2.5, 'fill="none" stroke="' + c + '" stroke-width="2" stroke-dasharray="3 2.5"');
    s += C(0, 0, rr, 'fill="url(#lf-sph)" opacity=".3"');
    return s + '</g>';
  };
  /* 抗体（Y字形：H鎖2本・L鎖2本）。分かれ目が (0,0)、高さ約 70。o.c：抗原と結合する部分（可変部）の色 */
  I.antibody = function (o) {
    o = o || {}; var c = o.c || '#d5832c', s = '<g class="ill-ab">', hc = '#4a6fb0', lc = '#8fb2e0';
    function arm(sx) {
      var t = '<g transform="scale(' + sx + ' 1) rotate(-38)">';
      t += '<rect x="-3.1" y="-36" width="6.2" height="36" rx="3.1" fill="' + hc + '" stroke="#2c4a80" stroke-width=".6"/>';
      t += '<rect x="3.6" y="-36" width="5.4" height="22" rx="2.7" fill="' + lc + '" stroke="#2c4a80" stroke-width=".6"/>';
      t += '<rect x="-3.1" y="-36" width="12.1" height="10" rx="3.2" fill="' + c + '" stroke="rgba(0,0,0,.35)" stroke-width=".6"/>';
      return t + '</g>';
    }
    s += '<rect x="-6.4" y="-1" width="6" height="36" rx="3" fill="' + hc + '" stroke="#2c4a80" stroke-width=".6"/><rect x=".4" y="-1" width="6" height="36" rx="3" fill="' + hc + '" stroke="#2c4a80" stroke-width=".6"/>';
    s += arm(1) + arm(-1) + '<path d="M-2.6 4h5.2M-2.6 7h5.2" stroke="#fff" stroke-width=".8" opacity=".8"/>';
    return s + '</g>';
  };

  /* =========================================================
     ヒトの口腔上皮細胞（直径100）
     ========================================================= */
  I.cheek = function (o) {
    o = o || {}; var r = R(83), s = '<g class="ill-cheek">';
    var body = polar(function (a, i) { return [48, 44, 49, 46, 42, 47, 50, 45, 43][i % 9] + (i % 2 ? 1 : 0); }, 9);
    body = body.map(function (p, i) { var a = i / 9 * PI * 2 + .2; var rr = Math.hypot(p[0], p[1]); return [Math.cos(a) * rr, Math.sin(a) * rr]; });
    var pts = []; body.forEach(function (p, i) { var q = body[(i + 1) % body.length]; pts.push(p, [(p[0] * .55 + q[0] * .45) * .985, (p[1] * .55 + q[1] * .45) * .985]); });
    s += P(cr(pts, true), 'fill="url(#lf-chk)" stroke="#6f86b8" stroke-width="1"');
    /* しわ（うすい細胞が折れている） */
    s += P('M-38 -12C-24 -6 -14 -14 -4 -26M14 30C22 20 34 18 42 6M-30 24C-20 30 -8 30 0 40M10 -36C16 -26 28 -24 34 -28', 'fill="none" stroke="#7d95c4" stroke-width=".7" opacity=".55"');
    s += dots(scatter(r, scale(pts, .92), 140), function () { return .35 + r() * .45; }, 'fill="#6f86b8" opacity=".35"');
    /* 細菌（ほおの表面についていることが多い） */
    [[30, -14, 30], [33, -10, 80], [-26, 30, -20]].forEach(function (b) { s += E(b[0], b[1], 2.2, .9, b[2], 'fill="#3a4b94" opacity=".7"'); });
    s += E(2, 3, 9, 7.4, -15, 'fill="url(#lf-nucb)" stroke="#2c3a80" stroke-width=".6"');
    s += dots(scatter(r, polar(function () { return 6; }, 12, 2, 3), 14), .7, 'fill="#25307a" opacity=".6"');
    if (o.lab) s += labels([[2, 3, 30, 58, '核', 'start'], [-44, 10, -60, 40, '細胞膜', 'end']], o.fs || 6);
    return s + '</g>';
  };

  /* =========================================================
     ヒトの卵（透明帯の外径100、外側に放射冠）
     ========================================================= */
  I.egg = function (o) {
    o = o || {}; var r = R(97), s = '<g class="ill-egg">', cor = '';
    /* 放射冠（卵をとりまくろ胞細胞） */
    for (var ring = 0; ring < 3; ring++) {
      var N = 34 + ring * 6, rad = 54.5 + ring * 6.5;
      for (var k = 0; k < N; k++) { var a = (k + ring * .5 + r() * .4) / N * PI * 2, rr = rad + (r() - .5) * 2.4, x = Math.cos(a) * rr, y = Math.sin(a) * rr; cor += E(x, y, 3.6 - ring * .3, 2.5, a * 57.3, 'fill="#f6dccb" stroke="#c4927a" stroke-width=".4" opacity="' + (1 - ring * .22) + '"') + C(x, y, .9, 'fill="#9a6a8a" opacity="' + (1 - ring * .22) + '"'); }
    }
    s += cor;
    var pr = ''; for (k = 0; k < 40; k++) { a = k / 40 * PI * 2; pr += 'M' + n(Math.cos(a) * 52) + ' ' + n(Math.sin(a) * 52) + 'L' + n(Math.cos(a + .02) * 44) + ' ' + n(Math.sin(a + .02) * 44); }
    /* 透明帯 */
    s += C(0, 0, 50, 'fill="url(#lf-zona)" stroke="#8fa6c4" stroke-width=".6"') + P(pr, 'stroke="#c4927a" stroke-width=".35" opacity=".6"');
    s += C(0, 0, 41, 'fill="#f5f8fb" stroke="#a7b8cf" stroke-width=".4"');
    /* 卵の細胞（卵細胞質） */
    s += C(0, 0, 38, 'fill="url(#lf-egg)" stroke="#c9a227" stroke-width=".8"');
    s += dots(scatter(r, polar(function () { return 35; }, 30), 160), function () { return .35 + r() * .55; }, 'fill="#c4a060" opacity=".45"');
    s += C(-7, -5, 9, 'fill="url(#lf-nuc)" stroke="#6b4a8a" stroke-width=".6"') + C(-5.5, -6, 2.6, 'fill="#5b3a86"');
    /* 極体（囲卵腔の中） */
    s += C(27.5, -28.5, 4.2, 'fill="url(#lf-egg)" stroke="#c9a227" stroke-width=".5"');
    s += C(0, 0, 38, 'fill="url(#lf-sph)" opacity=".28"');
    if (o.lab) s += labels([[0, 63, 0, 76, '放射冠', 'middle'], [-35, 33, -60, 60, '透明帯', 'end'], [-7, -5, -50, -64, '核', 'end'], [27.5, -28.5, 50, -72, '極体', 'start']], o.fs || 6);
    return s + '</g>';
  };

  /* =========================================================
     カエルの卵（直径100）。上が動物極（色素が多い）、下が植物極（卵黄が多い）
     ========================================================= */
  I.frogEgg = function (o) {
    o = o || {}; var s = '<g class="ill-frog">';
    if (o.jelly !== false) s += C(0, 0, 60, 'fill="url(#lf-jelly)" stroke="#8fbfd2" stroke-width=".6" opacity=".9"');
    s += C(0, 0, 50, 'fill="url(#lf-frog)" stroke="#3a2a20" stroke-width=".8"');
    s += P('M-49.5 6C-30 14 30 14 49.5 6', 'fill="none" stroke="#7a5c3c" stroke-width="2.5" opacity=".25"');
    s += C(0, 0, 50, 'fill="url(#lf-sph)"');
    s += E(-17, -24, 10, 5.5, -35, 'fill="#fff" opacity=".22"');
    if (o.lab) s += labels([[0, -50, 0, -70, '動物極', 'middle'], [0, 50, 0, 74, '植物極', 'middle'], [48, 0, 64, 0, '卵黄が多い→', 'start']].slice(0, 2), o.fs || 7);
    return s + '</g>';
  };

  /* ニワトリの卵黄（1つの細胞） */
  I.yolk = function () {
    var s = '<g class="ill-yolk">' + C(0, 0, 50, 'fill="#f2b632" stroke="#b9801a" stroke-width=".8"');
    for (var k = 1; k < 5; k++) s += C(0, 4, 50 - k * 9, 'fill="none" stroke="#fbe08a" stroke-width="1.6" opacity=".5"');
    s += P('M0 -44L0 4', 'stroke="#fbe7a8" stroke-width="5" stroke-linecap="round" opacity=".6"') + E(0, -45, 9, 3, 0, 'fill="#fffbe8" stroke="#e0c070" stroke-width=".5"');
    return s + C(0, 0, 50, 'fill="url(#lf-sph)"') + '</g>';
  };

  /* =========================================================
     メダカ（全長100：x −50 口先〜 +50 尾びれの先）
     ========================================================= */
  var FISH = [[-49.5, -2.6], [-46, -5.6], [-38, -8.3], [-25, -9.3], [-10, -8.9], [5, -7.9], [18, -6.6], [28, -4.9], [34, -3.7], [37.5, -3.9], [37.5, 3.9], [34, 3.7], [28, 5.6], [15, 8.6], [0, 10.1], [-15, 10.3], [-28, 8.6], [-38, 5.2], [-45, 2.4], [-48.6, .6], [-51.2, -1.2]];
  I.medaka = function (o) {
    o = o || {}; var s = '<g class="ill-fish">', ray = '';
    /* ひれ（すじ＝ひれすじ） */
    function fin(base1, base2, tip1, tip2, nr) {
      var d = 'M' + base1.join(' ') + 'L' + tip1.join(' ') + 'Q' + n((tip1[0] + tip2[0]) / 2 + (tip2[1] - tip1[1]) * .08) + ' ' + n((tip1[1] + tip2[1]) / 2 + (tip1[0] - tip2[0]) * .08) + ' ' + tip2.join(' ') + 'L' + base2.join(' ') + 'Z';
      var rs = ''; for (var k = 1; k < nr; k++) { var u = k / nr; rs += 'M' + n(base1[0] + (base2[0] - base1[0]) * u) + ' ' + n(base1[1] + (base2[1] - base1[1]) * u) + 'L' + n(tip1[0] + (tip2[0] - tip1[0]) * u) + ' ' + n(tip1[1] + (tip2[1] - tip1[1]) * u); }
      return P(d, 'fill="url(#lf-fin)" stroke="#b0682a" stroke-width=".45"') + P(rs, 'stroke="#c07a3a" stroke-width=".3" opacity=".8"');
    }
    s += fin([36, -3.9], [36, 3.9], [50, -10.5], [50, 10.5], 12);
    s += fin([18, -6.6], [27, -5.2], [24, -13.2], [30, -11], 6);
    s += fin([-1, 10], [30, 5.4], [1, 15], [32, 10.2], 16);
    s += P(cr(FISH, true), 'fill="url(#lf-fish)" stroke="#8a4f1e" stroke-width=".7"');
    /* うろこ */
    var sc = '';
    for (var x = -26; x < 34; x += 3.4) for (var y = -6; y < 8; y += 2.8) { var yy = y + ((x / 3.4) % 2 ? 1.4 : 0), lim = x < 20 ? 7.5 - Math.abs(x) * 0 : 4.5; if (Math.abs(yy - 1) < lim - (x > 20 ? 2 : 0)) sc += 'M' + n(x) + ' ' + n(yy - 1.3) + 'a1.6 1.6 0 0 1 0 2.6'; }
    s += P(sc, 'fill="none" stroke="#a5652c" stroke-width=".25" opacity=".55"');
    /* 背中の黒い色素・側線 */
    s += dots([[-30, -7.4], [-24, -8], [-18, -8.1], [-12, -7.9], [-6, -7.6], [0, -7.2], [6, -6.7], [12, -6.2], [20, -5.4], [26, -4.5], [31, -3.6]], .55, 'fill="#5a3412" opacity=".6"');
    s += P('M-31 -2C-10 -1 10 0 36 0', 'fill="none" stroke="#9a5a24" stroke-width=".55" stroke-dasharray="1.2 .9" opacity=".7"');
    /* えらぶた・胸びれ・腹びれ */
    s += P('M-33.5 -7.4C-30 -3 -30 3 -33 7.4', 'fill="none" stroke="#9a5a24" stroke-width=".6"');
    s += P('M-30 0.5L-19 -3.4Q-17.5 0 -19.5 3.6Z', 'fill="url(#lf-fin)" stroke="#b0682a" stroke-width=".4"') + P('M-28 1L-18.6 -1.6M-28 1.6L-18.4 1M-28.5 2.2L-19.5 3', 'stroke="#c07a3a" stroke-width=".25"');
    s += P('M-8 9.6L-1 13.8L-2.5 10Z', 'fill="url(#lf-fin)" stroke="#b0682a" stroke-width=".4"');
    /* 目と口 */
    s += C(-39.5, -3, 5.3, 'fill="url(#lf-eye)" stroke="#6a5a4a" stroke-width=".4"') + C(-39.5, -3, 3.9, 'fill="#c9a227" opacity=".6"') + C(-39.8, -3, 2.9, 'fill="#14100c"') + C(-41, -4.3, .9, 'fill="#fff"');
    s += P('M-51.2 -1.2L-47 -1.6', 'stroke="#6a3a16" stroke-width=".5" stroke-linecap="round"');
    if (o.lab) s += labels([[24, -12, 24, -22, '背びれ', 'middle'], [15, 12, 15, 24, 'しりびれ', 'middle'], [-39.5, -3, -44, -18, '目', 'end'], [45, 0, 60, 0, '尾びれ', 'start']], o.fs || 5);
    return s + '</g>';
  };

  /* =========================================================
     ヒト（身長100：y −50 頭頂 〜 +50 足元。頭は身長の約 1/7.5）
     ========================================================= */
  var HUM = (function () {
    var R1 = [[2.25, -37.6], [2.6, -34.8], [6.2, -33.2], [9.6, -32.2], [11.7, -30.4], [12.6, -26.4], [12.8, -19.5], [13.2, -12.2], [13.7, -4.5], [13.4, 2.6], [14.4, 5.6], [14.3, 9.4], [13.1, 10.8], [11.9, 9.8], [11.6, 6], [11.5, 2.4], [11.2, -4.5], [10.8, -12], [10.4, -19.6], [9.7, -25], [9.3, -20], [8.2, -12.5], [7.7, -7.5], [8.9, -2], [9.4, 3.5], [8.9, 11], [8.2, 18.5], [7.3, 23.4], [7.6, 29.5], [6.6, 38], [5.1, 45.3], [7.2, 48.7], [6.8, 50], [1.8, 50], [1.8, 46], [2.1, 39], [1.7, 31], [1.5, 24], [1.2, 14], [0, 3.2]];
    var L1 = R1.slice(0, -1).reverse().map(function (p) { return [-p[0], p[1]]; });
    return R1.concat(L1);
  })();
  I.human = function (o) {
    o = o || {}; var s = '<g class="ill-human">';
    s += P(cr(HUM, true), 'fill="url(#lf-hum)" stroke="#3f5f88" stroke-width=".55" stroke-linejoin="round"');
    s += E(0, -43.4, 5.1, 6.5, 0, 'fill="url(#lf-hum)" stroke="#3f5f88" stroke-width=".55"');
    s += P('M-6 -27C-3 -25 3 -25 6 -27M0 -24V-9M-7.6 -7.5C-3 -5.5 3 -5.5 7.6 -7.5M-4.6 23.4h2.4M4.6 23.4h-2.4', 'fill="none" stroke="#3f5f88" stroke-width=".35" opacity=".45"');
    return s + '</g>';
  };

  /* =========================================================
     ニューロン（横長。o:{x0,x1,y,myel,n}）。I.neuronGeo で座標を得る
     ========================================================= */
  I.neuronGeo = function (o) {
    var x0 = o.x0 || 0, x1 = o.x1 || 640, y = o.y || 70, cx = x0 + 74, xa = cx + 42, xb = x1 - 66, nn = o.n || 7, L = (xb - xa) / nn, nodes = [];
    for (var i = 0; i <= nn; i++) nodes.push(xa + i * L);
    return { cx: cx, cy: y, xa: xa, xb: xb, L: L, nodes: nodes, ends: [[x1 - 22, y - 30], [x1 - 16, y - 2], [x1 - 22, y + 27]] };
  };
  I.neuron = function (o) {
    o = o || {}; var G = I.neuronGeo(o), r = R(131), cx = G.cx, cy = G.cy, s = '<g class="ill-neuron">', dn = '';
    /* 樹状突起（枝分かれ） */
    function br(x, y, a, len, w, d) {
      var x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, mx = (x + x2) / 2 + Math.cos(a + PI / 2) * len * (r() - .5) * .35, my = (y + y2) / 2 + Math.sin(a + PI / 2) * len * (r() - .5) * .35;
      dn += '<path d="M' + n(x) + ' ' + n(y) + 'Q' + n(mx) + ' ' + n(my) + ' ' + n(x2) + ' ' + n(y2) + '" stroke-width="' + n(w) + '"/>';
      if (d > 0) { br(x2, y2, a - .35 - r() * .3, len * .7, w * .62, d - 1); br(x2, y2, a + .3 + r() * .3, len * .66, w * .62, d - 1); }
    }
    [PI * .62, PI * .86, PI * 1.08, PI * 1.32, PI * 1.6, PI * .4, PI * 1.82].forEach(function (a, k) { br(cx + Math.cos(a) * 16, cy + Math.sin(a) * 14, a + (r() - .5) * .2, k === 2 ? 24 : 17 + r() * 5, 6.5, 2); });
    s += '<g fill="none" stroke="#c98ab4" stroke-linecap="round">' + dn + '</g><g fill="none" stroke="#efc3e0" stroke-linecap="round" opacity=".7">' + dn.replace(/stroke-width="([\d.]+)"/g, function (m, v) { return 'stroke-width="' + n(Math.max(.3, v * .45)) + '"'; }) + '</g>';
    /* 軸索 */
    s += P('M' + n(cx + 18) + ' ' + n(cy - 8) + 'C' + n(cx + 30) + ' ' + n(cy - 4) + ' ' + n(G.xa - 8) + ' ' + n(cy - 2.6) + ' ' + n(G.xa) + ' ' + n(cy - 2.6) + 'L' + n(G.xb) + ' ' + n(cy - 2.6) + 'L' + n(G.xb) + ' ' + n(cy + 2.6) + 'L' + n(G.xa) + ' ' + n(cy + 2.6) + 'C' + n(G.xa - 8) + ' ' + n(cy + 2.6) + ' ' + n(cx + 30) + ' ' + n(cy + 4) + ' ' + n(cx + 18) + ' ' + n(cy + 8) + 'Z', 'fill="url(#lf-axon)" stroke="#9a5a88" stroke-width=".8"');
    /* 細胞体 */
    var soma = polar(function (a) { return 21 + 3 * Math.sin(a * 3 + .5) + 2 * Math.sin(a * 5); }, 30, cx, cy);
    s += P(cr(soma, true), 'fill="url(#lf-soma)" stroke="#9a5a88" stroke-width=".9"');
    s += dots(scatter(r, scale(soma, .85, cx, cy), 18, function (x, y) { return Math.hypot(x - cx + 2, y - cy) > 10; }), 1.1, 'fill="#9a5a88" opacity=".45"');
    s += C(cx - 2, cy, 8.5, 'fill="url(#lf-nuc)" stroke="#6b4a8a" stroke-width=".7"') + C(cx - 1, cy - 1, 2.6, 'fill="#5b3a86"');
    /* 髄鞘（シュワン細胞が巻きついたもの） */
    if (o.myel !== false) {
      for (var i = 0; i < G.nodes.length - 1; i++) {
        var xs = G.nodes[i] + 4, w = G.L - 8, mid = xs + w / 2;
        s += '<rect x="' + n(xs) + '" y="' + n(cy - 11) + '" width="' + n(w) + '" height="22" rx="9" fill="url(#lf-myel)" stroke="#b08c48" stroke-width=".8"/>';
        s += P('M' + n(xs + 6) + ' ' + n(cy - 7.5) + 'H' + n(xs + w - 6) + 'M' + n(xs + 6) + ' ' + n(cy + 7.5) + 'H' + n(xs + w - 6) + 'M' + n(xs + 4) + ' ' + n(cy - 4.5) + 'H' + n(xs + w - 4) + 'M' + n(xs + 4) + ' ' + n(cy + 4.5) + 'H' + n(xs + w - 4), 'stroke="#c9a862" stroke-width=".5" opacity=".7"');
        s += E(mid, cy - 10.5, Math.min(9, w * .18), 2.8, 0, 'fill="#c7b0e3" stroke="#6b4a8a" stroke-width=".5"');
      }
    } else {
      s += P('M' + n(G.xa) + ' ' + n(cy - 4) + 'H' + n(G.xb) + 'M' + n(G.xa) + ' ' + n(cy + 4) + 'H' + n(G.xb), 'stroke="#d9b0cf" stroke-width="1.2" opacity=".6"');
    }
    /* 神経終末（シナプス小頭）と次の細胞 */
    s += P('M' + n(o.x1 - 4) + ' ' + n(cy - 46) + 'C' + n(o.x1 - 12) + ' ' + n(cy - 20) + ' ' + n(o.x1 - 6) + ' ' + n(cy + 18) + ' ' + n(o.x1 - 12) + ' ' + n(cy + 46) + 'L' + n(o.x1 + 10) + ' ' + n(cy + 46) + 'L' + n(o.x1 + 10) + ' ' + n(cy - 46) + 'Z', 'fill="#e4d6ee" stroke="#8a6aa8" stroke-width=".8" opacity=".9"');
    G.ends.forEach(function (e, k) {
      s += P('M' + n(G.xb - 2) + ' ' + n(cy) + 'C' + n(G.xb + 16) + ' ' + n(cy) + ' ' + n(e[0] - 20) + ' ' + n(e[1]) + ' ' + n(e[0] - 4) + ' ' + n(e[1]), 'fill="none" stroke="#c98ab4" stroke-width="3" stroke-linecap="round"');
      s += E(e[0], e[1], 6.5, 5.5, 0, 'fill="url(#lf-soma)" stroke="#9a5a88" stroke-width=".7"') + dots([[e[0] - 1.5, e[1] - 2], [e[0] + 1.8, e[1] - 1], [e[0] - .5, e[1] + 1.8], [e[0] + 2.6, e[1] + 2]], 1.1, 'fill="#fff" stroke="#9a5a88" stroke-width=".35"');
    });
    if (o.lab) {
      var fs = o.fs || 10, ty = cy + 40, nd = G.nodes;
      s += labels([[cx - 40, cy - 22, cx - 52, cy - 40, '樹状突起', 'start'], [cx + 12, cy + 12, cx + 12, ty, '細胞体', 'middle'], [cx - 2, cy, cx - 16, ty, '核', 'end'],
        [(nd[1] + nd[2]) / 2, cy - 11, (nd[1] + nd[2]) / 2, cy - 30, '髄鞘（シュワン細胞）', 'middle'], [nd[3], cy + 2, nd[3], ty, 'ランビエ絞輪', 'middle'],
        [G.xa - 12, cy + 2, G.xa + 6, ty + 2, '軸索', 'start'], [G.ends[0][0], G.ends[0][1] - 5, G.ends[0][0] - 30, cy - 40, '神経終末', 'end']].filter(function (l, i) { return o.myel !== false || (i !== 3 && i !== 4); }), fs);
    }
    return s + '</g>';
  };

  /* =========================================================
     酵素（半径約20、活性部位は右 +x）と基質・生成物
     o.state：'free' | 'bound'（誘導適合で活性部位が閉じる） | 'unf'（変性しかけ）| 'denat'（変性）
     o.unf：0〜1（変性の度合い）、o.seed
     ========================================================= */
  function enzOutline(bound, unf, seed) {
    var r = R(seed || 7), ph = [r() * 6, r() * 6, r() * 6], pts = [], lip = .32, amp = .75 + unf * 3.2;
    var A0 = lip, A1 = PI * 2 - lip;
    for (var k = 0; k <= 46; k++) {
      var a = A0 + (A1 - A0) * k / 46, rr = 20 + amp * (Math.sin(a * 3 + ph[0]) * .8 + Math.sin(a * 8 + ph[1]) * .5 + Math.sin(a * 14 + ph[2]) * .35);
      var da = Math.min(a, PI * 2 - a);
      if (bound && da < .95) { rr += 3.2 * Math.pow(1 - (da - lip) / (.95 - lip), 1.4); a += (a < PI ? -1 : 1) * .07 * (1 - (da - lip) / (.95 - lip)); }
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    var pr = 5.9 - unf * 1.5, pc = 19 - unf * 2, b0 = bound ? PI * 5 / 3 : PI * 1.5, b1 = bound ? PI / 3 : PI / 2;
    for (k = 1; k < 12; k++) { var t = b0 - (b0 - b1) * k / 12, j = unf ? (r() - .5) * unf * 3 : 0; pts.push([pc + Math.cos(t) * (pr + j), Math.sin(t) * (pr + j)]); }
    return pts;
  }
  I.enzyme = function (o) {
    o = o || {}; var stt = o.state || 'free', seed = o.seed || 7, s = '<g class="ill-enz">';
    if (stt === 'denat') {
      var r = R(seed * 13 + 5), pts = [[-18, 0]], a = 0;
      for (var k = 0; k < 34; k++) { a += (r() - .5) * 1.9; var p = pts[pts.length - 1]; pts.push([p[0] + Math.cos(a) * 3.6, p[1] + Math.sin(a) * 3.6 * .8]); if (k % 6 === 5) a += PI * (r() > .5 ? .8 : -.8); }
      var cx = 0, cy = 0; pts.forEach(function (q) { cx += q[0]; cy += q[1]; }); cx /= pts.length; cy /= pts.length;
      var d = cr(pts.map(function (q) { return [q[0] - cx, q[1] - cy]; }));
      return s + P(d, 'fill="none" stroke="#3f7a38" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round" opacity=".55"') + P(d, 'fill="none" stroke="#a9d69a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".85"') + '</g>';
    }
    var unf = stt === 'unf' ? (o.unf == null ? .5 : o.unf) : 0, bound = stt === 'bound', ol = enzOutline(bound, unf, seed);
    /* 変性しかけ：ほどけたループ */
    if (unf > 0) { var rr = R(seed + 99), lp = ''; for (k = 0; k < 3; k++) { var aa = 1.4 + k * 1.6 + rr(), L = 6 + unf * 14; lp += 'M' + n(Math.cos(aa - .15) * 19) + ' ' + n(Math.sin(aa - .15) * 19) + 'C' + n(Math.cos(aa - .3) * (19 + L)) + ' ' + n(Math.sin(aa - .3) * (19 + L)) + ' ' + n(Math.cos(aa + .3) * (19 + L)) + ' ' + n(Math.sin(aa + .3) * (19 + L)) + ' ' + n(Math.cos(aa + .15) * 19) + ' ' + n(Math.sin(aa + .15) * 19); } s += P(lp, 'fill="none" stroke="#5f9a4e" stroke-width="2.6" stroke-linecap="round" opacity=".8"'); }
    s += P(cr(ol, true), 'fill="url(#lf-enz)" stroke="#2f6a2c" stroke-width=".9" stroke-linejoin="round"' + (unf ? ' opacity="' + n(1 - unf * .25) + '"' : '')) + P(cr(ol, true), 'fill="url(#lf-sph)" opacity=".45"');
    /* 2つのドメインの境目・αヘリックスの模様 */
    s += P('M-8 -18C-2 -8 4 -4 12 -3M-8 18C-2 8 4 4 12 3', 'fill="none" stroke="#2f6a2c" stroke-width=".55" opacity=".45"');
    var hx = ''; [[-12, -6, .3], [-4, 10, -.5], [2, -12, .9]].forEach(function (h) { var x = h[0], y = h[1]; hx += 'M' + x + ' ' + y; for (var q = 1; q <= 6; q++) hx += 'q' + n(Math.cos(h[2]) * 1 - Math.sin(h[2]) * 1.8 * (q % 2 ? 1 : -1)) + ' ' + n(Math.sin(h[2]) * 1 + Math.cos(h[2]) * 1.8 * (q % 2 ? 1 : -1)) + ' ' + n(Math.cos(h[2]) * 2) + ' ' + n(Math.sin(h[2]) * 2); });
    s += P(hx, 'fill="none" stroke="#e8f6df" stroke-width=".8" opacity=".55" stroke-linecap="round"');
    /* 活性部位のアミノ酸 */
    if (!unf) [PI * .62, PI * .86, PI * 1.14, PI * 1.38].forEach(function (t, k) { s += C(19 + Math.cos(t) * 7.2, Math.sin(t) * 7.2, 1.15, 'fill="' + (k % 2 ? '#f3c34a' : '#e0533a') + '" stroke="#2f6a2c" stroke-width=".3"'); });
    if (bound) s += I.substrate({ at: 19, strain: 1 });
    return s + '</g>';
  };
  function hexR(cx, cy, r, rot) { var p = []; for (var k = 0; k < 6; k++) { var a = k / 6 * PI * 2 + (rot || 0); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return 'M' + p.map(function (q) { return n(q[0]) + ' ' + n(q[1]); }).join('L') + 'Z'; }
  /* 基質（2つの環がつながった分子）。o.at：左の環の中心 x、o.strain：結合がひずんでいる */
  I.substrate = function (o) {
    o = o || {}; var x = o.at || 0, s = '<g class="ill-sub">';
    s += P('M' + n(x + 4.6) + ' 0L' + n(x + 9.4) + ' 0', 'stroke="' + (o.strain ? '#e0331a' : '#b8601a') + '" stroke-width="' + (o.strain ? 1.6 : 1.3) + '"' + (o.strain ? ' stroke-dasharray="1 .8"' : ''));
    if (o.strain) s += C(x + 7, 0, 4.5, 'fill="url(#lf-glow)"');
    s += P(hexR(x, 0, 4.9, PI / 6), 'fill="url(#lf-sub)" stroke="#a8561a" stroke-width=".8" stroke-linejoin="round"') + P(hexR(x + 14, 0, 4.9, PI / 6), 'fill="url(#lf-sub)" stroke="#a8561a" stroke-width=".8" stroke-linejoin="round"');
    s += C(x + 7, 0, 1.4, 'fill="#e0533a" stroke="#a8561a" stroke-width=".3"') + C(x + 2.4, -4.2, .7, 'fill="#e0533a"') + C(x + 16.4, 4.2, .7, 'fill="#e0533a"');
    return s + '</g>';
  };
  /* 生成物（1つの環） */
  I.product = function () { return '<g class="ill-pro">' + P(hexR(0, 0, 4.9, PI / 6), 'fill="url(#lf-pro)" stroke="#2f5f9e" stroke-width=".8" stroke-linejoin="round"') + C(3.5, -3, .7, 'fill="#e0533a"') + '</g>'; };
})(BL.ill);
