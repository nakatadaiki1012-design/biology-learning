/* 見る：細胞の構造（教科書レベルの模式図・拡大図）と 大きさくらべ */
(function () {
  var ORG = {
    nucleus: { n: '核', d: 'DNA（遺伝情報）を保管する。二重の核膜で包まれ、核膜孔で細胞質とつながる。中に核小体がある。', has: '動物○ 植物○ 原核×', size: '直径 約 5〜10 μm' },
    mito: { n: 'ミトコンドリア', d: '呼吸を行い、有機物を分解して ATP をつくる。二重膜で、内膜がひだ（クリステ）になっている。独自の DNA をもつ。', has: '動物○ 植物○ 原核×', size: '長さ 約 1〜数 μm、幅 約 0.5 μm' },
    chloro: { n: '葉緑体', d: '光合成を行う。二重膜の中にチラコイド（重なった所がグラナ）とストロマがある。独自の DNA をもつ。', has: '動物× 植物○ 原核×', size: '長さ 約 5〜10 μm' },
    membrane: { n: '細胞膜', d: 'リン脂質の二重層にタンパク質がうかんだ膜。物質の出入りを調節する。', has: '動物○ 植物○ 原核○', size: '厚さ 約 5〜10 nm' },
    wall: { n: '細胞壁', d: '細胞膜の外側のかたい壁。植物ではセルロースが主成分で、細胞の形を保つ。となりの細胞とは原形質連絡でつながる。', has: '動物× 植物○ 原核○（成分は植物とちがう）', size: '厚さ 約 0.1〜数 μm' },
    vacuole: { n: '液胞', d: '液胞膜で包まれ、細胞液（糖・無機塩類・色素のアントシアンなど）をためる。成熟した植物細胞で大きく発達する。', has: '動物△（小さい） 植物○ 原核×', size: '細胞の体積の 9 割をしめることも' },
    er: { n: '小胞体', d: '核膜とつながる膜の袋・管。リボソームがついた粗面小胞体ではタンパク質がつくられ、ついていない滑面小胞体では脂質の合成などを行う。', has: '動物○ 植物○ 原核×', size: '膜の袋（細胞全体に広がる）' },
    golgi: { n: 'ゴルジ体', d: '平たい袋（へん平な膜の袋）が重なった形。小胞体から来たタンパク質を加工・包装し、小胞に入れて細胞外へ送り出す（分泌）。', has: '動物○ 植物○ 原核×', size: '直径 約 1〜3 μm' },
    ribo: { n: 'リボソーム', d: 'mRNA の情報をもとにタンパク質を合成する小さな粒。大小 2 つのサブユニットからなり、膜をもたない。', has: '動物○ 植物○ 原核○', size: '直径 約 20〜30 nm' },
    centro: { n: '中心体', d: '2 個の中心小体（9 組 × 3 本の微小管）が直角に並んだもの。細胞分裂で紡錘体をつくる起点。べん毛・繊毛の形成にも関わる。', has: '動物○ 植物×（コケ・シダの一部は○） 原核×', size: '中心小体 長さ 約 0.4 μm' },
    lyso: { n: 'リソソーム', d: '分解酵素（加水分解酵素）を含む小さな袋。不要になった物質や細胞小器官を分解する。', has: '動物○ 植物△ 原核×', size: '直径 約 0.2〜0.5 μm' },
    cyto: { n: '細胞質基質', d: '細胞小器官のすき間をうめる液体の部分（サイトゾル）。解糖系など多くの化学反応の場。細胞骨格が張りめぐらされている。', has: '動物○ 植物○ 原核○', size: '' },
    nucleoid: { n: 'DNA（核様体）', d: '原核細胞では DNA が核膜に包まれず、細胞質基質の中にかたまっている。1 本の環状 DNA。', has: '原核細胞の特徴', size: '大腸菌の DNA：全長 約 1.5 mm（約 460 万塩基対）' },
    plasmid: { n: 'プラスミド', d: '染色体 DNA とは別の小さな環状 DNA。遺伝子組換えでベクター（運び屋）として使われる。', has: '原核（細菌）など', size: '数千〜数十万塩基対' },
    flag: { n: 'べん毛', d: '根元のモーターで回転させて泳ぐための長い毛（細菌のべん毛はタンパク質の繊維）。', has: '原核の一部・精子など', size: '長さ 約 10〜20 μm' },
    pili: { n: '線毛', d: '細菌の表面の短い毛。ほかの細胞や物の表面にくっつくのに使う。', has: '原核の一部', size: '' }
  };
  BL.ORG = ORG;
  var MEM = '#c9a227', NUC = '#6b4a8a', ERC = '#5e8fc4', GOL = '#d08a1e', MIT = '#f3b38a', MITL = '#a0522d', CHL = '#7fbf68', CHLD = '#2f6b3a', RIB = '#5b3f7a';
  function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function g(id, inner, extra) { return '<g class="org" data-id="' + id + '"' + (extra || '') + '>' + inner + '</g>'; }
  function hit(d) { return '<path class="hb" d="' + d + '"/>'; }

  /* ---- 部品 ---- */
  function nucleus(cx, cy, r) {
    var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--nuc)" stroke="' + NUC + '" stroke-width="2.4"/>';
    s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r - 5) + '" fill="none" stroke="' + NUC + '" stroke-width="1.4"/>';
    for (var k = 0; k < 12; k++) { var a = k / 12 * Math.PI * 2 + .2, x1 = cx + Math.cos(a) * (r - 7), y1 = cy + Math.sin(a) * (r - 7), x2 = cx + Math.cos(a) * (r + 2), y2 = cy + Math.sin(a) * (r + 2); s += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="var(--cyto)" stroke-width="4"/>'; }
    for (k = 0; k < 14; k++) { var ax = cx + (rnd(k) - .5) * r * 1.3, ay = cy + (rnd(k + 9) - .5) * r * 1.3; if (Math.hypot(ax - cx, ay - cy) < r - 14) s += '<path d="M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + ' q4 -6 8 0 t8 0" fill="none" stroke="' + NUC + '" stroke-opacity=".55" stroke-width="1.6"/>'; }
    s += '<circle cx="' + (cx + r * .18) + '" cy="' + (cy - r * .12) + '" r="' + (r * .26) + '" fill="#8a68b0" stroke="' + NUC + '"/>';
    return g('nucleus', s);
  }
  function mito(x, y, L, W, rot) {
    var hw = L / 2, hh = W / 2, s = '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">';
    s += '<rect x="' + -hw + '" y="' + -hh + '" width="' + L + '" height="' + W + '" rx="' + hh + '" fill="' + MIT + '" stroke="' + MITL + '" stroke-width="1.8"/>';
    s += '<rect x="' + (-hw + 3) + '" y="' + (-hh + 3) + '" width="' + (L - 6) + '" height="' + (W - 6) + '" rx="' + (hh - 3) + '" fill="#f8d2b4" stroke="' + MITL + '" stroke-width="1.1"/>';
    var n = Math.max(3, Math.round(L / 11));
    for (var k = 1; k < n; k++) { var cx = -hw + k * L / n, up = k % 2; s += '<path d="M' + cx + ' ' + (up ? -hh + 3 : hh - 3) + ' L' + cx + ' ' + (up ? hh * .35 : -hh * .35) + '" stroke="' + MITL + '" stroke-width="2.6" stroke-linecap="round"/>'; }
    return g('mito', s + '</g>');
  }
  function chloro(x, y, L, W, rot) {
    var hw = L / 2, hh = W / 2, s = '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">';
    s += '<ellipse rx="' + hw + '" ry="' + hh + '" fill="' + CHL + '" stroke="' + CHLD + '" stroke-width="1.6"/><ellipse rx="' + (hw - 3) + '" ry="' + (hh - 3) + '" fill="#a6d78f" stroke="' + CHLD + '" stroke-width="1"/>';
    var n = Math.max(3, Math.round(L / 14));
    s += '<line x1="' + (-hw + 8) + '" y1="0" x2="' + (hw - 8) + '" y2="0" stroke="' + CHLD + '" stroke-width="1"/>';
    for (var k = 0; k < n; k++) { var gx = -hw + (k + .5) * L / n, gh = Math.min(W - 10, 12); for (var j = 0; j < 4; j++) s += '<rect x="' + (gx - 4) + '" y="' + (-gh / 2 + j * gh / 4) + '" width="8" height="' + (gh / 4 - .6) + '" rx="1" fill="' + CHLD + '"/>'; }
    s += '<ellipse cx="' + hw * .45 + '" cy="' + hh * .5 + '" rx="4" ry="2.5" fill="#fff" opacity=".7"/>';
    return g('chloro', s + '</g>');
  }
  function golgi(x, y, sc, rot) {
    var s = '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + sc + ')">', ws = [70, 62, 54, 46, 38];
    ws.forEach(function (w, i) { var yy = i * 9; s += '<path d="M' + (-w / 2) + ' ' + yy + ' q' + (w / 2) + ' -16 ' + w + ' 0 q-' + (w / 2) + ' -10 -' + w + ' 0z" fill="#f2c27a" stroke="' + GOL + '" stroke-width="1.6"/>'; });
    [[40, 4, 4], [44, 16, 3.5], [36, 30, 3], [-40, 6, 3.5], [0, 50, 4.5], [18, 56, 3.5]].forEach(function (v) { s += '<circle cx="' + v[0] + '" cy="' + v[1] + '" r="' + v[2] + '" fill="#f2c27a" stroke="' + GOL + '" stroke-width="1.3"/>'; });
    return g('golgi', s + '</g>' + hit('M' + (x - 36 * sc) + ' ' + (y + 20 * sc) + ' h' + 72 * sc));
  }
  function roughER(d, ribs) { return g('er', '<path d="' + d + '" fill="none" stroke="' + ERC + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/><path d="' + d + '" fill="none" stroke="' + ERC + '" stroke-width="1.4" stroke-linecap="round"/>' + ribs.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.4" fill="' + RIB + '"/>'; }).join('') + hit(d)); }
  function smoothER(d) { return g('er', '<path d="' + d + '" fill="none" stroke="' + ERC + '" stroke-width="6" stroke-linecap="round" opacity=".4"/><path d="' + d + '" fill="none" stroke="' + ERC + '" stroke-width="1.2" stroke-linecap="round"/>' + hit(d)); }
  function freeRibos(pts) { return g('ribo', pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="' + RIB + '"/><circle class="hb" cx="' + p[0] + '" cy="' + p[1] + '" r="10"/>'; }).join('')); }
  function lyso(x, y, r) { var s = '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#e6b8c6" stroke="#a04a6a" stroke-width="1.6"/>'; for (var k = 0; k < 5; k++) s += '<circle cx="' + (x + (rnd(k + x) - .5) * r) + '" cy="' + (y + (rnd(k + y) - .5) * r) + '" r="1.4" fill="#a04a6a"/>'; return g('lyso', s); }
  function centro(x, y) { var s = '<g transform="translate(' + x + ' ' + y + ')">'; s += '<rect x="-12" y="-5" width="24" height="10" rx="2" fill="#7fa8d8" stroke="#2f5f9e" stroke-width="1.4"/>'; for (var k = -8; k <= 8; k += 4) s += '<line x1="' + k + '" y1="-5" x2="' + k + '" y2="5" stroke="#2f5f9e"/>'; s += '<g transform="translate(16 -9)"><circle r="7" fill="#7fa8d8" stroke="#2f5f9e" stroke-width="1.4"/>'; for (k = 0; k < 9; k++) { var a = k / 9 * Math.PI * 2; s += '<circle cx="' + (Math.cos(a) * 4.6).toFixed(1) + '" cy="' + (Math.sin(a) * 4.6).toFixed(1) + '" r="1.1" fill="#2f5f9e"/>'; } return g('centro', s + '</g></g>'); }
  function cytoskel(n, x0, y0, w, h) { var s = ''; for (var k = 0; k < n; k++) { var x1 = x0 + rnd(k) * w, y1 = y0 + rnd(k + 50) * h, x2 = x0 + rnd(k + 90) * w, y2 = y0 + rnd(k + 130) * h; s += '<path d="M' + x1.toFixed(0) + ' ' + y1.toFixed(0) + ' Q' + ((x1 + x2) / 2 + 20).toFixed(0) + ' ' + ((y1 + y2) / 2 - 20).toFixed(0) + ' ' + x2.toFixed(0) + ' ' + y2.toFixed(0) + '" stroke="var(--muted)" stroke-opacity=".25" stroke-width="1" fill="none"/>'; } return s; }
  function scaleBar(x, y, px, t) { return '<g pointer-events="none"><line x1="' + x + '" y1="' + y + '" x2="' + (x + px) + '" y2="' + y + '" stroke="var(--ink)" stroke-width="3"/><line x1="' + x + '" y1="' + (y - 5) + '" x2="' + x + '" y2="' + (y + 5) + '" stroke="var(--ink)" stroke-width="2"/><line x1="' + (x + px) + '" y1="' + (y - 5) + '" x2="' + (x + px) + '" y2="' + (y + 5) + '" stroke="var(--ink)" stroke-width="2"/><text x="' + (x + px / 2) + '" y="' + (y - 8) + '" text-anchor="middle" font-size="13" font-weight="700" fill="var(--ink)">' + t + '</text></g>'; }

  /* ラベル：[x, y（図の点）, 側（L/R）, 段（0から）, 文字] */
  function labels(list, fs, top, step) {
    return list.map(function (a) {
      var right = a[2] === 'R', lx = right ? 618 : -18, ly = top + a[3] * step;
      return '<g class="lab" pointer-events="none"><polyline points="' + a[0] + ',' + a[1] + ' ' + (right ? lx - 14 : lx + 14) + ',' + ly + ' ' + lx + ',' + ly + '" fill="none" stroke="var(--ink)" stroke-width="1"/><circle cx="' + a[0] + '" cy="' + a[1] + '" r="2.4" fill="var(--ink)"/><text x="' + (right ? lx + 4 : lx - 4) + '" y="' + (ly + fs * .35) + '" font-size="' + fs + '" font-weight="700" fill="var(--ink)" text-anchor="' + (right ? 'start' : 'end') + '">' + a[4] + '</text></g>';
    }).join('');
  }

  BL.cellSVG = function (type, showLab) {
    var narrow = BL.narrow(), fs = narrow ? 24 : 15, vb = showLab ? (narrow ? '-250 -6 1100 460' : '-150 -6 900 460') : '0 0 600 450';
    var s = '<svg class="svgfig cellsvg" viewBox="' + vb + '" role="img" aria-label="細胞の模式図">', L = [];
    if (type === 'animal') {
      var out = 'M60 210 C50 110 150 40 290 38 C430 34 560 90 556 210 C552 330 450 410 300 412 C150 414 70 320 60 210Z';
      s += g('cyto', '<path d="' + out + '" fill="var(--cyto)"/>' + cytoskel(14, 90, 70, 440, 320));
      s += roughER('M168 150 C140 180 136 240 166 282 M154 138 C120 176 116 250 152 298 M140 128 C100 170 96 256 138 314 M214 300 C250 324 300 320 330 296', [[170, 160], [148, 200], [150, 250], [164, 278], [139, 150], [124, 200], [128, 260], [148, 300], [118, 162], [104, 220], [112, 280], [230, 310], [262, 320], [300, 316], [322, 300]]);
      s += smoothER('M380 300 q20 -16 40 0 t40 0 M400 300 q-6 24 14 34 M440 300 q8 20 -6 36 M392 334 q24 10 50 0');
      s += nucleus(240, 210, 72);
      s += golgi(430, 140, 1, 12);
      s += mito(120, 330, 62, 28, -20) + mito(470, 250, 56, 26, 70) + mito(330, 360, 58, 26, 8) + mito(150, 96, 52, 24, 24);
      s += lyso(370, 92, 11) + lyso(500, 330, 9);
      s += centro(350, 210);
      s += freeRibos([[300, 110], [330, 140], [520, 180], [400, 380], [210, 380], [90, 230], [260, 70], [530, 290], [420, 220], [370, 260]]);
      s += '<circle cx="548" cy="160" r="6" fill="#f2c27a" stroke="' + GOL + '"/>';
      s += g('membrane', '<path d="' + out + '" fill="none" stroke="' + MEM + '" stroke-width="4.5"/><path d="' + out + '" fill="none" stroke="var(--cyto)" stroke-width="1.2"/>' + hit(out));
      L = [[60, 210, 'L', 5, '細胞膜'], [240, 170, 'R', 4, '核'], [270, 194, 'R', 5, '核小体'], [298, 160, 'R', 3, '核膜（二重膜）'], [150, 250, 'L', 3, '粗面小胞体'], [126, 200, 'L', 2, 'リボソーム'], [420, 315, 'R', 7, '滑面小胞体'], [430, 128, 'R', 1, 'ゴルジ体'], [100, 335, 'L', 6, 'ミトコンドリア'], [370, 92, 'R', 0, 'リソソーム'], [356, 205, 'R', 6, '中心体'], [220, 372, 'L', 7, '細胞質基質']];
    } else if (type === 'plant') {
      var wall = 'M24 22 H576 V428 H24Z', memb = 'M40 38 H560 V412 H40Z';
      s += g('wall', '<rect x="16" y="14" width="568" height="422" rx="10" fill="#b8d99a" stroke="#3b7a3a" stroke-width="2"/><rect x="36" y="34" width="528" height="382" rx="6" fill="none" stroke="#3b7a3a" stroke-width="1.2"/>' + [[16, 120], [16, 300], [584, 150], [584, 340], [200, 14], [420, 436]].map(function (p) { var v = p[0] === 16 || p[0] === 584; return '<line x1="' + p[0] + '" y1="' + p[1] + '" x2="' + (v ? (p[0] === 16 ? 40 : 560) : p[0]) + '" y2="' + (v ? p[1] : (p[1] === 14 ? 38 : 412)) + '" stroke="var(--cyto)" stroke-width="3"/>'; }).join('') + hit('M20 20 H580 V430 H20Z'));
      s += g('cyto', '<rect x="40" y="38" width="520" height="374" rx="6" fill="var(--cyto)"/>');
      s += g('vacuole', '<path d="M190 96 C260 70 470 72 510 110 C540 170 540 300 506 350 C440 382 270 380 206 352 C170 290 168 160 190 96Z" fill="#d6e9f5" stroke="' + ERC + '" stroke-width="2.4"/><text x="360" y="230" text-anchor="middle" font-size="13" fill="' + ERC + '">細胞液</text>');
      s += roughER('M90 140 C70 170 70 230 90 262 M76 128 C52 168 52 236 76 278', [[88, 150], [76, 190], [78, 230], [88, 255], [72, 140], [60, 190], [62, 240], [74, 270]]);
      s += nucleus(122, 205, 50);
      s += chloro(120, 74, 56, 26, 8) + chloro(80, 350, 54, 26, -18) + chloro(190, 390, 56, 26, 4) + chloro(320, 392, 58, 26, -3) + chloro(462, 388, 56, 26, 6) + chloro(536, 236, 56, 26, 88) + chloro(360, 56, 58, 26, 0) + chloro(230, 56, 54, 26, -6) + chloro(500, 62, 52, 24, 20);
      s += mito(150, 300, 38, 18, 30) + mito(150, 120, 36, 17, -30) + mito(540, 340, 36, 17, 70);
      s += golgi(96, 404, .62, -8);
      s += freeRibos([[60, 110], [168, 160], [176, 250], [260, 380], [400, 410], [548, 120], [548, 380], [292, 52]]);
      s += g('membrane', '<rect x="40" y="38" width="520" height="374" rx="6" fill="none" stroke="' + MEM + '" stroke-width="3.2"/>' + hit('M40 38 H560 V412 H40Z'));
      L = [[16, 60, 'L', 0, '細胞壁'], [40, 330, 'L', 7, '細胞膜'], [122, 205, 'L', 3, '核'], [300, 200, 'R', 3, '液胞（液胞膜）'], [360, 56, 'R', 0, '葉緑体'], [150, 300, 'L', 5, 'ミトコンドリア'], [76, 240, 'L', 4, '粗面小胞体'], [96, 404, 'L', 8, 'ゴルジ体'], [176, 250, 'R', 5, 'リボソーム'], [584, 150, 'R', 1, '原形質連絡'], [250, 400, 'R', 8, '細胞質基質']];
    } else {
      s += '<text x="300" y="28" text-anchor="middle" font-size="' + (narrow ? 20 : 13) + '" fill="var(--muted)">大腸菌（実際の長さは約 2〜3 μm。真核細胞の約 1/10）</text>';
      var body = 'M150 130 H430 A90 90 0 0 1 430 310 H150 A90 90 0 0 1 150 130Z';
      s += g('flag', '<path d="M518 230 C545 200 565 260 590 230 S630 200 650 232" fill="none" stroke="var(--ink)" stroke-width="3"/><circle cx="518" cy="230" r="4" fill="var(--ink)"/>' + hit('M518 230 C545 200 565 260 590 230 S630 200 650 232'));
      var pil = ''; for (var k = 0; k < 18; k++) { var a = k / 18 * Math.PI * 2, rx = 300 + Math.cos(a) * 205, ry = 220 + Math.sin(a) * 100; pil += '<line x1="' + rx.toFixed(0) + '" y1="' + ry.toFixed(0) + '" x2="' + (300 + Math.cos(a) * 222).toFixed(0) + '" y2="' + (220 + Math.sin(a) * 112).toFixed(0) + '" stroke="var(--muted)" stroke-width="1.5"/>'; }
      s += g('pili', pil + hit('M120 140 L100 125'));
      s += g('wall', '<path d="' + body + '" fill="#b8d99a" stroke="#3b7a3a" stroke-width="2"/>' + hit(body));
      s += g('cyto', '<path d="M152 140 H428 A80 80 0 0 1 428 300 H152 A80 80 0 0 1 152 140Z" fill="var(--cyto)"/>');
      s += g('membrane', '<path d="M152 140 H428 A80 80 0 0 1 428 300 H152 A80 80 0 0 1 152 140Z" fill="none" stroke="' + MEM + '" stroke-width="3"/>' + hit('M152 140 H428 A80 80 0 0 1 428 300 H152 A80 80 0 0 1 152 140Z'));
      var dna = 'M220 220 C220 170 300 166 330 196 C360 226 400 180 380 230 C364 270 300 280 272 250 C244 222 260 196 290 210 C330 228 340 262 300 262 C250 262 230 246 236 214 C244 180 286 186 310 214 C330 240 360 240 352 210';
      s += g('nucleoid', '<path d="' + dna + '" fill="none" stroke="' + NUC + '" stroke-width="2.6" stroke-linecap="round"/>' + hit(dna));
      s += g('plasmid', '<circle cx="410" cy="190" r="11" fill="none" stroke="' + NUC + '" stroke-width="2.2"/><circle cx="180" cy="262" r="9" fill="none" stroke="' + NUC + '" stroke-width="2.2"/><circle class="hb" cx="410" cy="190" r="14"/><circle class="hb" cx="180" cy="262" r="12"/>');
      var rp = []; for (k = 0; k < 26; k++) { var px = 170 + rnd(k + 3) * 260, py = 160 + rnd(k + 40) * 120; if (Math.hypot(px - 295, py - 220) > 80) rp.push([px.toFixed(0), py.toFixed(0)]); }
      s += freeRibos(rp);
      L = [[300, 200, 'R', 4, 'DNA（核様体）'], [410, 190, 'R', 2, 'プラスミド'], [440, 132, 'R', 0, '細胞壁'], [158, 288, 'L', 6, '細胞膜'], [rp.reduce(function (m, q) { return +q[0] < +m[0] ? q : m; })[0], rp.reduce(function (m, q) { return +q[0] < +m[0] ? q : m; })[1], 'L', 4, 'リボソーム'], [590, 230, 'R', 6, 'べん毛'], [100, 125, 'L', 2, '線毛'], [190, 280, 'L', 8, '細胞質基質']].filter(function (a) { return a[4]; });
    }
    if (type !== 'pro') s += scaleBar(narrow ? 420 : 470, 444, 60, '約 ' + (type === 'animal' ? '5 μm' : '10 μm'));
    return s + (showLab ? labels(L, fs, narrow ? 10 : 20, narrow ? 48 : 46) : '') + '</svg>';
  };

  /* ---- 拡大図（クリックした小器官） ---- */
  function lab2(x1, y1, x2, y2, t, anchor) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="var(--ink)" stroke-width="1"/><circle cx="' + x1 + '" cy="' + y1 + '" r="2" fill="var(--ink)"/><text x="' + (x2 + (anchor === 'end' ? -3 : 3)) + '" y="' + (y2 + 4) + '" font-size="12.5" font-weight="700" fill="var(--ink)" text-anchor="' + (anchor || 'start') + '">' + t + '</text>'; }
  var ZOOM = {
    nucleus: function () { return '<circle cx="130" cy="100" r="78" fill="var(--nuc)" stroke="' + NUC + '" stroke-width="3"/><circle cx="130" cy="100" r="70" fill="none" stroke="' + NUC + '" stroke-width="2"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { var a = k / 8 * Math.PI * 2; return '<line x1="' + (130 + Math.cos(a) * 66) + '" y1="' + (100 + Math.sin(a) * 66) + '" x2="' + (130 + Math.cos(a) * 82) + '" y2="' + (100 + Math.sin(a) * 82) + '" stroke="var(--panel)" stroke-width="6"/>'; }).join('') + '<circle cx="145" cy="88" r="20" fill="#8a68b0"/>' + [0, 1, 2, 3, 4, 5].map(function (k) { return '<path d="M' + (90 + rnd(k) * 60) + ' ' + (60 + rnd(k + 5) * 90) + ' q6 -8 12 0 t12 0" fill="none" stroke="' + NUC + '" stroke-width="1.8"/>'; }).join('') + lab2(130, 22, 230, 20, '核膜（二重膜）') + lab2(208, 100, 230, 70, '核膜孔') + lab2(150, 92, 230, 110, '核小体') + lab2(104, 130, 230, 150, 'クロマチン（DNA＋タンパク質）') + '<text x="130" y="195" text-anchor="middle" font-size="12" fill="var(--muted)">直径 約 5〜10 μm</text>'; },
    mito: function () { var s = '<rect x="20" y="40" width="230" height="110" rx="55" fill="' + MIT + '" stroke="' + MITL + '" stroke-width="3"/><rect x="30" y="50" width="210" height="90" rx="45" fill="#f8d2b4" stroke="' + MITL + '" stroke-width="2"/>'; for (var k = 1; k < 9; k++) { var x = 30 + k * 23, up = k % 2; s += '<path d="M' + x + ' ' + (up ? 50 : 140) + ' L' + x + ' ' + (up ? 112 : 78) + '" stroke="' + MITL + '" stroke-width="7" stroke-linecap="round"/><path d="M' + x + ' ' + (up ? 50 : 140) + ' L' + x + ' ' + (up ? 112 : 78) + '" stroke="#f8d2b4" stroke-width="2.5" stroke-linecap="round"/>'; } return s + '<circle cx="70" cy="120" r="6" fill="none" stroke="' + NUC + '" stroke-width="1.5"/>' + lab2(60, 44, 270, 30, '外膜') + lab2(100, 53, 270, 55, '内膜') + lab2(122, 100, 270, 85, 'クリステ（内膜のひだ）') + lab2(150, 125, 270, 115, 'マトリックス') + lab2(70, 120, 270, 145, 'DNA') + '<text x="135" y="180" text-anchor="middle" font-size="12" fill="var(--muted)">長さ 約 1〜数 μm</text><text x="135" y="196" text-anchor="middle" font-size="11.5" fill="var(--muted)">クエン酸回路：マトリックス／電子伝達系：内膜</text>'; },
    chloro: function () { var s = '<ellipse cx="130" cy="95" rx="115" ry="62" fill="' + CHL + '" stroke="' + CHLD + '" stroke-width="3"/><ellipse cx="130" cy="95" rx="107" ry="55" fill="#b9e0a4" stroke="' + CHLD + '" stroke-width="1.6"/><line x1="40" y1="95" x2="220" y2="95" stroke="' + CHLD + '" stroke-width="1.5"/>'; [55, 95, 135, 175, 205].forEach(function (x, i) { var h = i === 4 ? 4 : 6; for (var j = 0; j < h; j++) s += '<rect x="' + (x - 12) + '" y="' + (95 - h * 4.5 + j * 9) + '" width="24" height="7.4" rx="2" fill="' + CHLD + '"/>'; }); return s + '<ellipse cx="160" cy="130" rx="10" ry="6" fill="#fff" opacity=".8"/>' + lab2(130, 33, 262, 18, '外膜・内膜') + lab2(95, 80, 262, 50, 'グラナ（チラコイドの重なり）') + lab2(80, 95, 262, 80, 'チラコイド') + lab2(180, 140, 262, 110, 'ストロマ') + lab2(160, 130, 262, 135, 'デンプン粒') + '<text x="130" y="185" text-anchor="middle" font-size="12" fill="var(--muted)">長さ 約 5〜10 μm　チラコイド：光をとらえる／ストロマ：カルビン回路</text>'; },
    membrane: function () { var s = '<rect x="0" y="0" width="420" height="200" fill="var(--panel)"/>'; for (var x = 14; x < 410; x += 16) { if (x > 150 && x < 200) continue; s += '<circle cx="' + x + '" cy="62" r="7" fill="' + MEM + '"/><path d="M' + (x - 2) + ' 69 v32 M' + (x + 2) + ' 69 v32" stroke="' + MEM + '" stroke-width="1.6"/><circle cx="' + x + '" cy="140" r="7" fill="' + MEM + '"/><path d="M' + (x - 2) + ' 133 v-32 M' + (x + 2) + ' 133 v-32" stroke="' + MEM + '" stroke-width="1.6"/>'; } return s + '<rect x="152" y="40" width="46" height="122" rx="18" fill="var(--c6)" opacity=".8"/><rect x="171" y="40" width="8" height="122" fill="var(--panel)"/><path d="M300 52 q20 -30 40 0" fill="var(--c3)" opacity=".7"/>' + lab2(14, 58, 20, 18, 'リン脂質（親水性の頭部）') + lab2(320, 40, 300, 18, '糖鎖') + lab2(46, 100, 20, 186, '疎水性の尾部') + lab2(175, 150, 120, 186, 'チャネル（輸送タンパク質）') + '<text x="415" y="190" text-anchor="end" font-size="12" fill="var(--muted)">厚さ 約 5〜10 nm</text>'; },
    wall: function () { var s = '<rect x="20" y="30" width="380" height="140" fill="#cfe6b8" stroke="#3b7a3a" stroke-width="2"/>'; for (var k = 0; k < 14; k++) s += '<line x1="' + (20 + k * 28) + '" y1="30" x2="' + (60 + k * 28) + '" y2="170" stroke="#3b7a3a" stroke-opacity=".5" stroke-width="2.5"/>'; return s + '<rect x="190" y="30" width="16" height="140" fill="var(--cyto)" stroke="' + MEM + '" stroke-width="2"/>' + lab2(100, 60, 120, 16, 'セルロースの繊維（細胞壁）') + lab2(198, 120, 240, 190, '原形質連絡（となりの細胞とつながる穴）') + '<text x="20" y="190" font-size="12" fill="var(--muted)">植物の細胞壁：おもにセルロース</text>'; },
    vacuole: function () { return '<rect x="10" y="10" width="300" height="180" rx="12" fill="var(--cyto)" stroke="' + MEM + '" stroke-width="2"/><path d="M60 40 C140 20 260 30 280 70 C300 130 270 170 180 172 C90 174 40 140 50 90 C52 70 54 50 60 40Z" fill="#d6e9f5" stroke="' + ERC + '" stroke-width="3"/>' + [0, 1, 2, 3, 4, 5, 6].map(function (k) { return '<circle cx="' + (100 + rnd(k) * 140) + '" cy="' + (60 + rnd(k + 3) * 90) + '" r="3" fill="' + (k < 3 ? '#b04a8a' : ERC) + '"/>'; }).join('') + lab2(280, 70, 320, 40, '液胞膜') + lab2(160, 110, 320, 110, '細胞液（糖・無機塩類）') + lab2(110, 70, 320, 160, 'アントシアン（色素）'); },
    er: function () { var s = ''; for (var k = 0; k < 4; k++) { var y = 40 + k * 26; s += '<path d="M20 ' + y + ' q60 -14 120 0 t120 0" fill="none" stroke="' + ERC + '" stroke-width="12" opacity=".45"/><path d="M20 ' + y + ' q60 -14 120 0 t120 0" fill="none" stroke="' + ERC + '" stroke-width="1.5"/>'; for (var j = 0; j < 12; j++) { var x = 26 + j * 20; s += '<circle cx="' + x + '" cy="' + (y - 7 + Math.sin(j) * 2) + '" r="3" fill="' + RIB + '"/>'; } } s += '<path d="M290 60 q20 -20 40 0 t40 0 M300 60 q-10 40 20 60 M350 60 q20 30 0 60 M320 120 q20 14 50 0" fill="none" stroke="' + ERC + '" stroke-width="10" opacity=".4" stroke-linecap="round"/>'; return s + lab2(60, 33, 60, 170, '粗面小胞体（リボソームがつく → タンパク質合成）') + lab2(340, 70, 300, 180, '滑面小胞体（脂質の合成など）'); },
    golgi: function () { var s = ''; [150, 135, 120, 105, 90].forEach(function (w, i) { var y = 40 + i * 20; s += '<path d="M' + (160 - w / 2) + ' ' + y + ' q' + w / 2 + ' -28 ' + w + ' 0 q-' + w / 2 + ' -16 -' + w + ' 0z" fill="#f2c27a" stroke="' + GOL + '" stroke-width="2"/>'; }); [[70, 30], [255, 34], [100, 150], [210, 155], [160, 175]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="9" fill="#f2c27a" stroke="' + GOL + '" stroke-width="2"/>'; }); return s + lab2(160, 30, 300, 25, 'シス側（小胞体から受けとる）') + lab2(160, 118, 300, 120, 'トランス側（送り出す）') + lab2(210, 155, 300, 160, '小胞（分泌顆粒）') + '<text x="20" y="195" font-size="12" fill="var(--muted)">直径 約 1〜3 μm</text>'; },
    ribo: function () { return '<path d="M20 140 C80 120 260 120 340 140" fill="none" stroke="var(--c5)" stroke-width="4"/><ellipse cx="170" cy="96" rx="70" ry="48" fill="#8a6aa8" stroke="' + RIB + '" stroke-width="2"/><ellipse cx="170" cy="150" rx="56" ry="24" fill="#b79ad0" stroke="' + RIB + '" stroke-width="2"/>' + lab2(170, 70, 270, 40, '大サブユニット') + lab2(210, 156, 280, 180, '小サブユニット') + lab2(40, 136, 40, 180, 'mRNA') + '<text x="20" y="22" font-size="12" fill="var(--muted)">直径 約 20〜30 nm（rRNA ＋ タンパク質）</text>'; },
    centro: function () { var s = '<rect x="40" y="70" width="120" height="50" rx="6" fill="#7fa8d8" stroke="#2f5f9e" stroke-width="2"/>'; for (var x = 50; x < 160; x += 12) s += '<line x1="' + x + '" y1="70" x2="' + x + '" y2="120" stroke="#2f5f9e"/>'; s += '<g transform="translate(240 95)"><circle r="52" fill="#cfe0f3" stroke="#2f5f9e" stroke-width="2"/>'; for (var k = 0; k < 9; k++) { var a = k / 9 * Math.PI * 2; for (var j = 0; j < 3; j++) s += '<circle cx="' + (Math.cos(a + j * .12) * (38 - j * 6)).toFixed(1) + '" cy="' + (Math.sin(a + j * .12) * (38 - j * 6)).toFixed(1) + '" r="4.2" fill="#2f5f9e"/>'; } s += '</g>'; return s + '<text x="100" y="60" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--ink)">中心小体（横から）</text><text x="240" y="170" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--ink)">断面：微小管 3 本 × 9 組</text><text x="20" y="190" font-size="12" fill="var(--muted)">中心体 ＝ 中心小体 2 個（直角に並ぶ）　長さ 約 0.4 μm</text>'; },
    lyso: function () { var s = '<circle cx="120" cy="100" r="70" fill="#e6b8c6" stroke="#a04a6a" stroke-width="3"/>'; for (var k = 0; k < 14; k++) s += '<path d="M' + (80 + rnd(k) * 80) + ' ' + (60 + rnd(k + 7) * 80) + ' l6 -6 l6 6" fill="none" stroke="#a04a6a" stroke-width="2"/>'; return s + lab2(160, 80, 220, 60, '分解酵素（加水分解酵素）') + lab2(186, 120, 220, 130, '膜（一重）') + '<text x="20" y="190" font-size="12" fill="var(--muted)">直径 約 0.2〜0.5 μm　不要な物質を分解（オートファジーにも関わる）</text>'; },
    nucleoid: function () { return '<path d="M60 100 C60 40 180 30 220 80 C260 130 300 60 280 120 C260 170 160 180 120 150 C80 120 100 90 140 100 C190 112 200 150 150 160" fill="none" stroke="' + NUC + '" stroke-width="3"/>' + lab2(220, 80, 300, 40, '環状の DNA（1 本）') + '<text x="20" y="190" font-size="12" fill="var(--muted)">核膜がない。DNA 全長 約 1.5 mm を小さく折りたたむ</text>'; },
    plasmid: function () { return '<circle cx="120" cy="100" r="60" fill="none" stroke="' + NUC + '" stroke-width="4"/><path d="M120 40 a60 60 0 0 1 52 30" fill="none" stroke="var(--warm)" stroke-width="7"/>' + lab2(150, 48, 220, 40, '遺伝子（例：薬剤耐性遺伝子）') + lab2(170, 130, 220, 140, '小さな環状 DNA') + '<text x="20" y="190" font-size="12" fill="var(--muted)">遺伝子組換えのベクターとして使う</text>'; },
    flag: function () { return '<rect x="20" y="70" width="70" height="80" fill="#b8d99a"/><rect x="20" y="70" width="70" height="80" fill="none" stroke="#3b7a3a"/><rect x="40" y="90" width="40" height="40" rx="4" fill="var(--c6)" opacity=".8"/><path d="M80 110 C130 60 160 160 210 110 S290 60 340 110" fill="none" stroke="var(--ink)" stroke-width="4"/>' + lab2(60, 110, 60, 180, 'モーター（回転する）') + lab2(210, 110, 230, 170, 'べん毛（らせん状の繊維）'); },
    pili: function () { return '<rect x="40" y="60" width="240" height="90" rx="45" fill="#b8d99a" stroke="#3b7a3a" stroke-width="2"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (k) { var x = 60 + k * 22; return '<line x1="' + x + '" y1="60" x2="' + (x - 5) + '" y2="36" stroke="var(--muted)" stroke-width="2"/><line x1="' + x + '" y1="150" x2="' + (x + 5) + '" y2="174" stroke="var(--muted)" stroke-width="2"/>'; }).join('') + lab2(104, 40, 300, 30, '線毛（短い毛。付着に使う）'); },
    cyto: function () { var s = '<rect x="10" y="10" width="300" height="170" rx="10" fill="var(--cyto)"/>'; for (var k = 0; k < 9; k++) s += '<path d="M' + (20 + rnd(k) * 280) + ' ' + (20 + rnd(k + 4) * 150) + ' Q160 90 ' + (20 + rnd(k + 8) * 280) + ' ' + (20 + rnd(k + 12) * 150) + '" stroke="var(--c3)" stroke-width="1.5" fill="none" opacity=".7"/>'; return s + lab2(160, 90, 320, 60, '細胞骨格（タンパク質の繊維）') + '<text x="20" y="196" font-size="12" fill="var(--muted)">水・タンパク質・イオンなど。解糖系の場</text>'; }
  };
  BL.orgZoom = function (id) { var f = ZOOM[id]; return f ? '<svg class="svgfig" viewBox="0 0 420 200" style="max-height:200px;margin-top:6px">' + f() + '</svg>' : ''; };

  BL.addSim({
    id: 'cell', name: '細胞の構造', cat: '細胞', subj: 'kiso', ic: '細', lead: '動物・植物・原核細胞をくらべ、小器官をクリックすると拡大図',
    how: '<p>生物のからだは<b class="key">細胞</b>でできている。核をもつ<b class="key">真核細胞</b>（動物・植物・菌類など）と、核をもたない<b class="key">原核細胞</b>（細菌など）がある。</p><p>真核細胞の中には、はたらきの決まった<b class="key">細胞小器官</b>がある。ミトコンドリア・葉緑体・核は<b class="key">二重膜</b>、小胞体・ゴルジ体・液胞・リソソームは一重の膜、リボソーム・中心体は膜をもたない。</p><table class="tbl"><tr><th></th><th>動物</th><th>植物</th><th>原核</th></tr><tr><td>核（核膜）</td><td>○</td><td>○</td><td>×</td></tr><tr><td>ミトコンドリア</td><td>○</td><td>○</td><td>×</td></tr><tr><td>葉緑体</td><td>×</td><td>○</td><td>×</td></tr><tr><td>中心体</td><td>○</td><td>×</td><td>×</td></tr><tr><td>発達した液胞</td><td>×</td><td>○</td><td>×</td></tr><tr><td>細胞壁</td><td>×</td><td>○</td><td>○</td></tr><tr><td>細胞膜・リボソーム・DNA</td><td>○</td><td>○</td><td>○</td></tr></table>',
    pts: [[1, 'すべての細胞は細胞膜・DNA・リボソーム・細胞質基質をもつ'], [1, '原核細胞は核膜がなく、DNA は細胞質基質の中（核様体）'], [0, '葉緑体は動物細胞にもある → ×（植物細胞だけ）'], [1, 'ミトコンドリアと葉緑体は二重膜で独自の DNA をもつ（共生説の根拠）'], [1, '大きさ：原核細胞 1〜10 μm ＜ 真核細胞 10〜100 μm']],
    tasks: ['3種類の細胞をすべて見る', 'ミトコンドリアの拡大図を見る', '原核細胞にもあるものを1つ調べる'],
    mount: function (stage, ctl, api) {
      var type = 'animal', seen = {}, lbl = !BL.narrow(), info;
      BL.ui.seg(ctl, '細胞', [['animal', '動物'], ['plant', '植物'], ['pro', '原核（細菌）']], type, function (v) { type = v; draw(); });
      BL.ui.seg(ctl, 'ラベル', [[true, '出す'], [false, 'かくす']], lbl, function (v) { lbl = v; draw(); });
      info = BL.ui.box(ctl, 'info', '<h4>🔍 小器官をタップ</h4>図の中の部分をタップすると、名前・はたらき・大きさと<b>拡大図</b>が出ます。');
      function draw() {
        seen[type] = 1; if (seen.animal && seen.plant && seen.pro) api.task(0);
        stage.innerHTML = BL.cellSVG(type, lbl);
        stage.querySelectorAll('.org').forEach(function (gg) {
          gg.addEventListener('click', function (e) {
            e.stopPropagation(); var id = gg.dataset.id, o = ORG[id];
            stage.querySelectorAll('.org.hit').forEach(function (x) { x.classList.remove('hit'); }); stage.querySelectorAll('.org[data-id="' + id + '"]').forEach(function (x) { x.classList.add('hit'); });
            info.innerHTML = '<h4>' + o.n + '</h4>' + o.d + (o.size ? '<div class="note" style="color:var(--accent);font-weight:700">📏 ' + o.size + '</div>' : '') + '<div class="note">' + o.has + '</div>' + BL.orgZoom(id);
            if (id === 'mito') api.task(1);
            if (type === 'pro' && ['membrane', 'ribo', 'cyto', 'nucleoid', 'wall'].indexOf(id) >= 0) api.task(2);
          });
        });
      }
      draw();
    }
  });

  /* ---------- 大きさくらべ ---------- */
  var OBJ = [
    { n: '水素原子', s: 1e-10, sh: 'atom' }, { n: 'グルコース', s: 9e-10, sh: 'mol' }, { n: 'DNA（幅）', s: 2e-9, sh: 'dna' }, { n: 'ヘモグロビン', s: 6.5e-9, sh: 'prot' },
    { n: 'リボソーム', s: 2.5e-8, sh: 'ribo' }, { n: 'インフルエンザウイルス', s: 1e-7, sh: 'virus' }, { n: 'ミトコンドリア', s: 2e-6, sh: 'mito' }, { n: '大腸菌', s: 3e-6, sh: 'rod' },
    { n: '葉緑体', s: 6e-6, sh: 'chl' }, { n: '赤血球', s: 7.5e-6, sh: 'rbc' }, { n: 'ヒトの口の上皮細胞', s: 6e-5, sh: 'cell' }, { n: 'ヒトの卵', s: 1.4e-4, sh: 'egg' },
    { n: 'ゾウリムシ', s: 2.2e-4, sh: 'para' }, { n: 'カエルの卵', s: 2.5e-3, sh: 'frog' }, { n: 'ニワトリの卵黄（1つの細胞）', s: 3e-2, sh: 'yolk' }, { n: 'メダカ', s: 3.5e-2, sh: 'fish' }, { n: 'ヒト', s: 1.7, sh: 'human' }
  ];
  (function () { var x = 0; OBJ.forEach(function (o, i) { if (i) x += (OBJ[i - 1].s + o.s) * .62; o.x = x; }); })();
  function shape(o, cx, cy, d) {
    var r = d / 2, s = '';
    switch (o.sh) {
      case 'atom': return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#cfe0f3" stroke="#2f5f9e" stroke-width="' + Math.max(.5, r * .04) + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + Math.max(.6, r * .08) + '" fill="#c0392b"/>';
      case 'mol': for (var k = 0; k < 6; k++) { var a = k / 6 * Math.PI * 2; s += (k ? 'L' : 'M') + (cx + Math.cos(a) * r * .7).toFixed(2) + ' ' + (cy + Math.sin(a) * r * .7).toFixed(2); } return '<path d="' + s + 'Z" fill="#f5e3a8" stroke="#8a6a1a" stroke-width="' + Math.max(.5, r * .08) + '"/>';
      case 'dna': for (k = 0; k <= 20; k++) { var yy = cy - r * 2.5 + k * r * .25; s += '<circle cx="' + (cx + Math.sin(k * .6) * r * .8) + '" cy="' + yy + '" r="' + r * .18 + '" fill="#6b4a8a"/><circle cx="' + (cx - Math.sin(k * .6) * r * .8) + '" cy="' + yy + '" r="' + r * .18 + '" fill="#e07a5f"/>'; } return s;
      case 'prot': return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#e6a1a1" stroke="#a04040" stroke-width="' + Math.max(.4, r * .05) + '"/><circle cx="' + (cx - r * .4) + '" cy="' + (cy - r * .3) + '" r="' + r * .45 + '" fill="#d98080"/><circle cx="' + (cx + r * .4) + '" cy="' + (cy + r * .3) + '" r="' + r * .45 + '" fill="#d98080"/>';
      case 'ribo': return '<ellipse cx="' + cx + '" cy="' + (cy - r * .2) + '" rx="' + r + '" ry="' + r * .65 + '" fill="#8a6aa8"/><ellipse cx="' + cx + '" cy="' + (cy + r * .55) + '" rx="' + r * .75 + '" ry="' + r * .35 + '" fill="#b79ad0"/>';
      case 'virus': for (k = 0; k < 16; k++) { a = k / 16 * Math.PI * 2; s += '<line x1="' + (cx + Math.cos(a) * r * .8) + '" y1="' + (cy + Math.sin(a) * r * .8) + '" x2="' + (cx + Math.cos(a) * r) + '" y2="' + (cy + Math.sin(a) * r) + '" stroke="#7a4fa0" stroke-width="' + Math.max(.5, r * .07) + '"/>'; } return s + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r * .8 + '" fill="#d7c2ea" stroke="#7a4fa0" stroke-width="' + Math.max(.5, r * .05) + '"/>';
      case 'mito': return '<rect x="' + (cx - r) + '" y="' + (cy - r * .25) + '" width="' + d + '" height="' + r * .5 + '" rx="' + r * .25 + '" fill="' + MIT + '" stroke="' + MITL + '" stroke-width="' + Math.max(.5, r * .03) + '"/>';
      case 'rod': return '<rect x="' + (cx - r) + '" y="' + (cy - r * .25) + '" width="' + d + '" height="' + r * .5 + '" rx="' + r * .25 + '" fill="#b8d99a" stroke="#3b7a3a" stroke-width="' + Math.max(.5, r * .03) + '"/><path d="M' + (cx + r) + ' ' + cy + ' q' + r * .3 + ' -' + r * .2 + ' ' + r * .6 + ' 0 t' + r * .6 + ' 0" fill="none" stroke="var(--ink)" stroke-width="' + Math.max(.4, r * .02) + '"/>';
      case 'chl': return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r + '" ry="' + r * .45 + '" fill="' + CHL + '" stroke="' + CHLD + '" stroke-width="' + Math.max(.5, r * .03) + '"/>';
      case 'rbc': return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#d9534f"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r * .45 + '" fill="#e88a87"/>';
      case 'cell': for (k = 0; k < 7; k++) { a = k / 7 * Math.PI * 2 + .3; var rr = r * (.85 + rnd(k) * .15); s += (k ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); } return '<path d="' + s + 'Z" fill="var(--cyto)" stroke="' + MEM + '" stroke-width="' + Math.max(.5, r * .02) + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r * .15 + '" fill="var(--nuc)" stroke="' + NUC + '" stroke-width="' + Math.max(.4, r * .02) + '"/>';
      case 'egg': return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#f6ead0" stroke="#c9a227" stroke-width="' + Math.max(.5, r * .05) + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r * .2 + '" fill="var(--nuc)"/>';
      case 'para': return '<path d="M' + (cx - r) + ' ' + cy + ' C' + (cx - r) + ' ' + (cy - r * .35) + ' ' + (cx + r * .6) + ' ' + (cy - r * .4) + ' ' + (cx + r) + ' ' + (cy - r * .05) + ' C' + (cx + r * .7) + ' ' + (cy + r * .35) + ' ' + (cx - r * .8) + ' ' + (cy + r * .38) + ' ' + (cx - r) + ' ' + cy + 'Z" fill="#cfe6b8" stroke="#5a8a3a" stroke-width="' + Math.max(.5, r * .02) + '"/>';
      case 'frog': return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#e8e0c8" stroke="#8a7a5a" stroke-width="' + Math.max(.5, r * .03) + '"/><path d="M' + (cx - r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + cy + 'Z" fill="#4a3a30"/>';
      case 'yolk': return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#f3c34a" stroke="#c08a1a" stroke-width="' + Math.max(.5, r * .02) + '"/>';
      case 'fish': return '<path d="M' + (cx - r) + ' ' + cy + ' C' + (cx - r * .5) + ' ' + (cy - r * .3) + ' ' + (cx + r * .4) + ' ' + (cy - r * .25) + ' ' + (cx + r * .7) + ' ' + cy + ' L' + (cx + r) + ' ' + (cy - r * .2) + ' L' + (cx + r) + ' ' + (cy + r * .2) + ' L' + (cx + r * .7) + ' ' + cy + ' C' + (cx + r * .4) + ' ' + (cy + r * .25) + ' ' + (cx - r * .5) + ' ' + (cy + r * .3) + ' ' + (cx - r) + ' ' + cy + 'Z" fill="#e9b872" stroke="#8a5a2a" stroke-width="' + Math.max(.5, r * .02) + '"/><circle cx="' + (cx - r * .72) + '" cy="' + (cy - r * .05) + '" r="' + r * .05 + '" fill="#222"/>';
      case 'human': var h = d, w = h * .26, top = cy - h / 2; return '<circle cx="' + cx + '" cy="' + (top + h * .07) + '" r="' + h * .065 + '" fill="#d9b48f"/><path d="M' + (cx - w / 2) + ' ' + (top + h * .15) + ' h' + w + ' l' + (-w * .1) + ' ' + h * .38 + ' h' + (-w * .25) + ' l' + (-w * .05) + ' ' + h * .45 + ' h' + (-w * .2) + ' l' + (-w * .05) + ' ' + (-h * .45) + ' h' + (-w * .25) + 'z" fill="#5b7fa8"/>';
    }
    return '';
  }
  function fmtLen(m) {
    var u = [[1, 'm'], [1e-2, 'cm'], [1e-3, 'mm'], [1e-6, 'μm'], [1e-9, 'nm']];
    for (var i = 0; i < u.length; i++) if (m >= u[i][0] * .999) { var v = m / u[i][0]; return (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10) + ' ' + u[i][1]; }
    return Math.round(m / 1e-10 * 10) / 10 / 10 + ' nm';
  }
  function niceBar(f) { var t = f / 4, p = Math.pow(10, Math.floor(Math.log10(t))), m = t / p; return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * p; }
  function scope(s) { return s >= 1e-4 ? ['肉眼', 'var(--accent)'] : s >= 2e-7 ? ['光学顕微鏡', 'var(--c3)'] : s >= 2e-10 ? ['電子顕微鏡', 'var(--c6)'] : ['電子顕微鏡でもむずかしい', 'var(--muted)']; }
  BL.addSim({
    id: 'scale', name: '大きさくらべ', cat: '細胞', subj: 'kiso', ic: '尺', lead: '原子からヒトまで。ズームして大きさのちがいを実感しよう',
    how: '<p>長さの単位：<b class="key">1 m ＝ 1000 mm、1 mm ＝ 1000 μm（マイクロメートル）、1 μm ＝ 1000 nm（ナノメートル）</b></p><table class="tbl"><tr><th>もの</th><th>大きさ</th></tr><tr><td>原子</td><td>約 0.1 nm</td></tr><tr><td>DNA の幅</td><td>約 2 nm</td></tr><tr><td>ウイルス</td><td>約 20〜300 nm</td></tr><tr><td>原核細胞（大腸菌）</td><td>約 1〜10 μm</td></tr><tr><td>ミトコンドリア</td><td>約 1〜数 μm</td></tr><tr><td>赤血球</td><td>約 7〜8 μm</td></tr><tr><td>真核細胞</td><td>約 10〜100 μm</td></tr><tr><td>ヒトの卵</td><td>約 140 μm</td></tr></table><div class="box"><b>分解能</b>（見分けられる最小の長さ）：肉眼 約 0.1 mm、光学顕微鏡 約 0.2 μm、電子顕微鏡 約 0.2 nm</div>',
    pts: [[1, '1 μm ＝ 1000 nm、1 mm ＝ 1000 μm'], [1, '多くの細胞は光学顕微鏡で見えるが、ウイルスは電子顕微鏡でないと見えない'], [0, '赤血球は大腸菌より小さい → ×（赤血球 約 8 μm、大腸菌 約 3 μm）'], [1, 'ニワトリの卵黄は、1つの細胞']],
    tasks: ['ウイルスを見る（電子顕微鏡の世界）', '赤血球と大腸菌をくらべる', 'ヒトまでズームアウトする'],
    mount: function (stage, ctl, api) {
      var z = Math.log10(2e-5), target = z, playing = null;
      var sl = BL.ui.slider(ctl, { label: '見ている幅', min: -9.5, max: .9, step: .01, value: z, fmt: function (v) { return fmtLen(Math.pow(10, v)); }, on: function (v) { target = z = v; } });
      var r = BL.el('div', { class: 'row' }); ctl.appendChild(r);
      [['水素原子', 0], ['ウイルス', 5], ['大腸菌', 7], ['赤血球', 9], ['ヒトの卵', 11], ['カエルの卵', 13], ['ヒト', 16]].forEach(function (b) { BL.ui.btn(r, b[0], function () { target = Math.log10(OBJ[b[1]].s * 4); }); });
      var r2 = BL.el('div', { class: 'row' }); ctl.appendChild(r2);
      BL.ui.btn(r2, '🔍 原子 → ヒト まで自動ズーム', function () { z = -9.5; target = .82; }, 'main');
      var info = BL.ui.box(ctl, 'info', '');
      var W = BL.narrow() ? 420 : 640, H = 340;
      var stop = BL.loop(function (dt) {
        if (Math.abs(target - z) > .002) { z += (target - z) * Math.min(1, dt * 3.2); if (Math.abs(target - z) < .003) z = target; sl.set(z); }
        var F = Math.pow(10, z), focusS = F / 4, lf = Math.log10(focusS), fi = 0;
        for (var i = 0; i < OBJ.length - 1; i++) { var a = Math.log10(OBJ[i].s), b = Math.log10(OBJ[i + 1].s); if (lf >= a) fi = i + Math.min(1, (lf - a) / (b - a)); }
        if (lf < Math.log10(OBJ[0].s)) fi = 0;
        var i0 = Math.floor(fi), t = fi - i0, cxm = i0 < OBJ.length - 1 ? OBJ[i0].x + (OBJ[i0 + 1].x - OBJ[i0].x) * t : OBJ[i0].x;
        var px = W / F, used = [], s = '<svg class="svgfig" viewBox="0 0 ' + W + ' ' + H + '" style="max-width:860px"><rect width="' + W + '" height="' + H + '" fill="var(--panel)"/>', labs = '';
        OBJ.slice().reverse().forEach(function (o) {
          var d = o.s * px, cx = W / 2 + (o.x - cxm) * px, cy = 150, tall = { dna: 5, rod: .5, mito: .5, chl: .9, para: .8, fish: .6 }[o.sh] || 1;
          if (d < .4 || d * tall > 290 || d > W * .95 || cx + d < 0 || cx - d > W) return;
          s += shape(o, cx, cy, d);
          var lw = Math.max(o.n.length * 14, 60), lx0 = cx - lw / 2, lx1 = cx + lw / 2;
          if (d >= 3 && cx > 10 && cx < W - 10 && !used.some(function (u) { return lx0 < u[1] && lx1 > u[0]; })) { used.push([lx0, lx1]); var ly = cy + Math.max(d * tall / 2, 6) + 18; if (ly < H - 60) labs += '<text x="' + cx.toFixed(1) + '" y="' + ly.toFixed(1) + '" text-anchor="middle" font-size="14" font-weight="700" fill="var(--ink)" paint-order="stroke" stroke="var(--panel)" stroke-width="4">' + o.n + '</text><text x="' + cx.toFixed(1) + '" y="' + (ly + 16).toFixed(1) + '" text-anchor="middle" font-size="12" fill="var(--muted)" paint-order="stroke" stroke="var(--panel)" stroke-width="4">' + fmtLen(o.s) + '</text>'; }
        });
        var bar = niceBar(F), bpx = bar * px;
        s += labs + '<g><line x1="20" y1="300" x2="' + (20 + bpx) + '" y2="300" stroke="var(--ink)" stroke-width="4"/><line x1="20" y1="292" x2="20" y2="308" stroke="var(--ink)" stroke-width="2"/><line x1="' + (20 + bpx) + '" y1="292" x2="' + (20 + bpx) + '" y2="308" stroke="var(--ink)" stroke-width="2"/><text x="' + (24 + bpx) + '" y="305" font-size="15" font-weight="700" fill="var(--ink)">' + fmtLen(bar) + '</text></g>';
        var sc = scope(focusS);
        s += '<rect x="' + (W - 210) + '" y="12" width="198" height="30" rx="15" fill="' + sc[1] + '"/><text x="' + (W - 111) + '" y="32" text-anchor="middle" font-size="14" font-weight="700" fill="var(--panel)">' + sc[0] + 'で見える世界</text>';
        /* ものさし（対数） */
        var rx0 = 20, rx1 = W - 20, ry = 325; function rxp(v) { return rx0 + (Math.log10(v) + 10) / 10.5 * (rx1 - rx0); }
        s += '<rect x="' + rxp(1e-10) + '" y="' + (ry - 6) + '" width="' + (rxp(2e-7) - rxp(1e-10)) + '" height="6" fill="var(--c6)" opacity=".6"/><rect x="' + rxp(2e-7) + '" y="' + (ry - 6) + '" width="' + (rxp(1e-4) - rxp(2e-7)) + '" height="6" fill="var(--c3)" opacity=".6"/><rect x="' + rxp(1e-4) + '" y="' + (ry - 6) + '" width="' + (rxp(3) - rxp(1e-4)) + '" height="6" fill="var(--accent)" opacity=".6"/>';
        [[1e-9, '1nm'], [1e-6, '1μm'], [1e-3, '1mm'], [1, '1m']].forEach(function (m) { s += '<text x="' + rxp(m[0]) + '" y="' + (ry + 13) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + m[1] + '</text>'; });
        s += '<polygon points="' + (rxp(focusS) - 6) + ',' + (ry - 14) + ' ' + (rxp(focusS) + 6) + ',' + (ry - 14) + ' ' + rxp(focusS) + ',' + (ry - 6) + '" fill="var(--warm)"/>';
        stage.innerHTML = s + '</svg>';
        var near = OBJ[Math.min(OBJ.length - 1, Math.round(fi))];
        var msg = '<h4>' + near.n + '：' + fmtLen(near.s) + '</h4>見ている幅 ' + fmtLen(F) + '（' + sc[0] + '）';
        if (info._m !== msg) { info.innerHTML = msg; info._m = msg; }
        if (Math.round(fi) === 5) api.task(0);
        if (fi >= 6.6 && fi <= 9.4) api.task(1);
        if (fi >= 15.6) api.task(2);
      });
      return stop;
    }
  });
})();
