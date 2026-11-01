/* 演習：計算問題（数字は毎回変わる）。gen() → { q, ans, tol, u, steps, fig }
   fig は、その問題の数字でかいた「解説の図」（答えたあとに出る） */
(function () {
  var R = BL.rnd, P = BL.pick;
  function r1(x) { return Math.round(x * 10) / 10; }
  /* 図の小さな道具 */
  function svg(w, h, body) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img">' + body + '</svg>'; }
  function T(x, y, t, o) { o = o || {}; return '<text x="' + x + '" y="' + y + '" font-size="' + (o.fs || 14) + '" text-anchor="' + (o.a || 'middle') + '" fill="' + (o.c || 'var(--ink)') + '"' + (o.b ? ' font-weight="700"' : '') + '>' + t + '</text>'; }
  function Rc(x, y, w, h, f, o) { o = o || {}; return '<rect x="' + x + '" y="' + y + '" width="' + Math.max(0, w) + '" height="' + Math.max(0, h) + '" rx="' + (o.r || 3) + '" fill="' + f + '" stroke="' + (o.s || 'var(--ink)') + '" stroke-width="' + (o.sw || 1) + '"/>'; }
  function L(x1, y1, x2, y2, c, w, d) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (c || 'var(--ink)') + '" stroke-width="' + (w || 1.5) + '"' + (d ? ' stroke-dasharray="' + d + '"' : '') + '/>'; }
  function arc(cx, cy, r, a0, a1, f) { var x0 = cx + r * Math.sin(a0), y0 = cy - r * Math.cos(a0), x1 = cx + r * Math.sin(a1), y1 = cy - r * Math.cos(a1); return '<path d="M' + cx + ' ' + cy + ' L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'Z" fill="' + f + '" stroke="var(--panel)" stroke-width="2"/>'; }
  /* 横に並ぶ帯グラフ：parts = [[値, 色, ラベル]] */
  function band(x, y, w, h, parts, total) {
    var s = '', cx = x; total = total || parts.reduce(function (a, p) { return a + p[0]; }, 0);
    parts.forEach(function (p) { var pw = w * p[0] / total; s += Rc(cx, y, pw, h, p[1], { r: 0 }); if (pw > 34) s += T(cx + pw / 2, y + h / 2 + 5, p[2], { b: 1, c: '#1b1b1b', fs: 13 }); cx += pw; });
    return s;
  }
  var BASE = { A: '#e07a5f', T: '#e9c46a', G: '#6fa35a', C: '#5e8fc4' };

  BL.calcs = [
    { id: 'chargaff', subj: 'kiso', l: 'k2-1', t: 'シャルガフの規則', gen: function () {
      var a = R(15, 35), g = (100 - 2 * a) / 2;
      var fig = svg(480, 190, T(240, 22, 'DNA の塩基の割合（A＝T、G＝C）', { b: 1 }) + band(30, 40, 420, 46, [[a, BASE.A, 'A ' + a + '%'], [a, BASE.T, 'T ' + a + '%'], [g, BASE.G, 'G ' + g + '%'], [g, BASE.C, 'C ' + g + '%']], 100) +
        L(30, 100, 30 + 420 * a * 2 / 100, 100, 'var(--warm)', 2) + T(30 + 210 * a * 2 / 100, 120, 'A＋T ＝ ' + 2 * a + '%', { c: 'var(--warm)', b: 1 }) + L(30 + 420 * a * 2 / 100, 100, 450, 100, 'var(--accent)', 2) + T(30 + 420 * a * 2 / 100 + 210 * (100 - 2 * a) / 100, 120, 'G＋C ＝ ' + (100 - 2 * a) + '%', { c: 'var(--accent)', b: 1 }) +
        T(240, 160, '2本鎖では A と T、G と C が向かい合うので、同じ割合になる', { fs: 13, c: 'var(--muted)' }));
      return { q: 'ある生物の DNA で、塩基 A の割合は ' + a + '% だった。G の割合は何 % か。', ans: g, u: '%', fig: fig, steps: ['A と T は対になるので T ＝ A ＝ ' + a + '%', 'G ＋ C ＝ 100 − ' + a + ' × 2 ＝ ' + (100 - 2 * a) + '%', 'G ＝ C なので G ＝ ' + (100 - 2 * a) + ' ÷ 2 ＝ ' + g + '%'] };
    } },
    { id: 'cycle', subj: 'kiso', l: 'k2-2', t: '細胞周期の各期の長さ', gen: function () {
      var T0 = P([16, 18, 20, 24, 30]), N = P([200, 400, 500, 800, 1000]), m = N * P([.05, .1, .15, .2]), ans = r1(T0 * m / N), fr = m / N;
      var fig = svg(480, 220, arc(120, 124, 80, 0, Math.PI * 2 * (1 - fr) - .001, 'var(--chip)') + arc(120, 124, 80, Math.PI * 2 * (1 - fr), Math.PI * 2 - .001, 'var(--warm)') + '<circle cx="120" cy="124" r="80" fill="none" stroke="var(--ink)"/>' + T(120, 140, '間期', { b: 1 }) + T(120, 159, (N - m) + ' 個', { fs: 13, c: 'var(--muted)' }) +
        T(120 + 98 * Math.sin(Math.PI * 2 * (1 - fr / 2)), 124 - 98 * Math.cos(Math.PI * 2 * (1 - fr / 2)) + 5, 'M期 ' + m + '個', { b: 1, c: 'var(--warm)', fs: 13 }) +
        T(250, 60, '細胞の数の割合 ＝ 時間の割合', { a: 'start', b: 1 }) + T(250, 92, 'M期の割合 ＝ ' + m + ' ÷ ' + N + ' ＝ ' + fr, { a: 'start', fs: 13.5 }) + T(250, 122, '1周 ＝ ' + T0 + ' 時間', { a: 'start', fs: 13.5 }) + T(250, 156, 'M期 ＝ ' + T0 + ' × ' + fr + ' ＝ ' + ans + ' 時間', { a: 'start', b: 1, c: 'var(--warm)' }) + T(250, 190, '（どの細胞もばらばらの時期にあるとき）', { a: 'start', fs: 11.5, c: 'var(--muted)' }));
      return { q: '細胞周期が ' + T0 + ' 時間の細胞を観察すると、' + N + ' 個のうち ' + m + ' 個が分裂期（M期）だった。分裂期の長さは何時間か。', ans: ans, u: '時間', fig: fig, steps: ['各期の長さは、その期の細胞の数の割合に比例する', '分裂期 ＝ ' + T0 + ' × ' + m + ' ÷ ' + N, '＝ ' + ans + ' 時間'] };
    } },
    { id: 'aa', subj: 'kiso', l: 'k2-3', t: 'アミノ酸の数と塩基の数', gen: function () {
      var fig = function (top) {
        var s = T(240, 20, top, { b: 1 }), seq = 'ATGGCAAGTTTC', rna = 'AUGGCAAGUUUC', aa = ['メチオニン', 'アラニン', 'セリン', 'フェニルアラニン'];
        for (var i = 0; i < 12; i++) { s += Rc(70 + i * 28, 36, 24, 24, BASE[seq[i]], { r: 3 }) + T(82 + i * 28, 53, seq[i], { fs: 13, b: 1, c: '#1b1b1b' }) + Rc(70 + i * 28, 84, 24, 24, rna[i] === 'U' ? '#b388d9' : BASE[rna[i]], { r: 3 }) + T(82 + i * 28, 101, rna[i], { fs: 13, b: 1, c: '#1b1b1b' }); }
        s += T(62, 53, 'DNA', { a: 'end', fs: 12 }) + T(62, 101, 'mRNA', { a: 'end', fs: 12 });
        for (i = 0; i < 4; i++) { s += '<path d="M' + (70 + i * 84) + ' 114 v6 h80 v-6" fill="none" stroke="var(--ink)"/>' + Rc(74 + i * 84, 128, 72, 30, 'var(--accent)', { r: 15 }) + T(110 + i * 84, 148, aa[i], { fs: aa[i].length > 5 ? 9.5 : 12, c: 'var(--accent-ink)', b: 1 }); }
        return svg(480, 200, s + T(240, 186, '塩基 3 つ（コドン）＝ アミノ酸 1 つ　→　塩基の数 ＝ アミノ酸の数 × 3', { fs: 13, c: 'var(--warm)', b: 1 }));
      };
      if (Math.random() < .5) { var n = R(100, 600); return { q: 'アミノ酸 ' + n + ' 個からなるタンパク質がある。これを指定する mRNA の塩基は何個か（終止コドンは考えない）。', ans: n * 3, u: '個', fig: fig(n + ' 個 × 3 ＝ ' + n * 3 + ' 個'), steps: ['アミノ酸 1 個 ＝ コドン 1 つ ＝ 塩基 3 個', n + ' × 3 ＝ ' + n * 3 + ' 個'] }; }
      var bp = R(30, 200) * 30; return { q: 'ある遺伝子の、翻訳される部分の DNA は ' + bp + ' 塩基対だった。できるタンパク質のアミノ酸は何個か（終止コドンは考えない）。', ans: bp / 3, u: '個', fig: fig(bp + ' 塩基 ÷ 3 ＝ ' + bp / 3 + ' 個'), steps: ['DNA 1 塩基対 → mRNA の塩基 1 個', '塩基 3 個でアミノ酸 1 個', bp + ' ÷ 3 ＝ ' + bp / 3 + ' 個'] };
    } },
    { id: 'micro', subj: 'kiso', l: 'k1-2', t: 'ミクロメーター', gen: function () {
      var b = P([10, 20, 25, 40, 50]), a = Math.round(b * P([.2, .4, .5, .25])), one = r1(10 * a / b), k = R(3, 12);
      var W = 400, x0 = 40, s = T(240, 20, '視野の中のようす（目盛りが重なった所）', { b: 1 });
      for (var i = 0; i <= b; i++) s += L(x0 + i * W / b, 50, x0 + i * W / b, i % 5 ? 62 : 68, 'var(--c3)', 1.4);
      s += L(x0, 50, x0 + W, 50, 'var(--c3)', 1.4) + T(x0 - 6, 60, '接眼', { a: 'end', fs: 12, c: 'var(--c3)' });
      for (i = 0; i <= a; i++) s += L(x0 + i * W / a, 112, x0 + i * W / a, 92, 'var(--warm)', 2);
      s += L(x0, 112, x0 + W, 112, 'var(--warm)', 2) + T(x0 - 6, 108, '対物', { a: 'end', fs: 12, c: 'var(--warm)' });
      s += L(x0, 40, x0, 122, 'var(--ink)', 1, '3 3') + L(x0 + W, 40, x0 + W, 122, 'var(--ink)', 1, '3 3');
      s += T(240, 140, '接眼 ' + b + ' 目盛り ＝ 対物 ' + a + ' 目盛り ＝ ' + a * 10 + ' μm', { b: 1 }) + T(240, 166, '接眼 1 目盛り ＝ ' + a * 10 + ' ÷ ' + b + ' ＝ ' + one + ' μm', { fs: 13.5 }) + T(240, 192, '細胞 ＝ ' + one + ' × ' + k + ' ＝ ' + r1(one * k) + ' μm', { b: 1, c: 'var(--accent)' });
      return { q: '接眼ミクロメーター ' + b + ' 目盛りと、対物ミクロメーター（1 目盛り 10 μm）' + a + ' 目盛りが重なった。ある細胞の長さが接眼ミクロメーター ' + k + ' 目盛りのとき、細胞の長さは何 μm か。', ans: r1(one * k), tol: .11, u: 'μm', fig: svg(480, 205, s), steps: ['接眼 1 目盛り ＝ 10 × ' + a + ' ÷ ' + b + ' ＝ ' + one + ' μm', '細胞 ＝ ' + one + ' × ' + k + ' ＝ ' + r1(one * k) + ' μm'] };
    } },
    { id: 'urine', subj: 'kiso', l: 'k3-4', t: '濃縮率と原尿の量', gen: function () {
      var c = P([60, 80, 100, 120, 125]), u = P([1, 1.2, 1.5, 2]), pri = r1(c * u);
      var s = T(240, 20, 'イヌリンは「こしとられるが、再吸収されない」', { b: 1 });
      s += Rc(30, 50, 160, 70, 'var(--water)') + T(110, 78, '原尿 ' + pri + ' L', { b: 1 }) + T(110, 102, 'イヌリン 0.1 mg/mL', { fs: 12.5 });
      s += '<path d="M200 85 H280" stroke="var(--ink)" stroke-width="2" marker-end="url(#cuA)"/><defs><marker id="cuA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--ink)"/></marker></defs>' + T(240, 72, '水を再吸収', { fs: 12 });
      s += Rc(290, 70, 160 * Math.max(.18, u / pri * 20), 30, '#e9c46a') + T(370, 60, '尿 ' + u + ' L', { b: 1 }) + T(370, 120, 'イヌリン ' + r1(c * .1) + ' mg/mL', { fs: 12.5 });
      s += T(240, 160, '濃縮率 ＝ ' + r1(c * .1) + ' ÷ 0.1 ＝ ' + c + ' 倍', { fs: 13.5 }) + T(240, 188, '原尿 ＝ 尿 × 濃縮率 ＝ ' + u + ' × ' + c + ' ＝ ' + pri + ' L', { b: 1, c: 'var(--accent)' });
      return { q: 'イヌリン（再吸収されない物質）の濃度は、血しょう中 0.1 mg/mL、尿中 ' + r1(c * .1) + ' mg/mL だった。1 日の尿が ' + u + ' L のとき、1 日の原尿は何 L か。', ans: pri, u: 'L', fig: svg(480, 205, s), steps: ['濃縮率 ＝ 尿中濃度 ÷ 血しょう中濃度 ＝ ' + r1(c * .1) + ' ÷ 0.1 ＝ ' + c + ' 倍', 'イヌリンは再吸収されないので、原尿の量 ＝ 尿の量 × 濃縮率', u + ' × ' + c + ' ＝ ' + pri + ' L'] };
    } },
    { id: 'photo', subj: 'kiso', l: 'k1-5', t: '光合成速度', gen: function () {
      var r = R(2, 6), a = R(4, 20), sc = 130 / (a + r + 2), y0 = 66 + (a + r) * sc;
      var s = T(240, 20, '光合成速度 ＝ 見かけの光合成速度 ＋ 呼吸速度', { b: 1 }) + L(60, y0, 440, y0, 'var(--ink)', 1.5) + T(54, y0 + 4, '0', { a: 'end', fs: 12 });
      s += Rc(110, y0 - a * sc, 70, a * sc, 'var(--accent)') + T(145, y0 - a * sc - 6, '見かけ ' + a, { b: 1, c: 'var(--accent)', fs: 13 }) + T(145, y0 + 18, '明るい所（吸収）', { fs: 12 });
      s += Rc(230, y0, 70, r * sc, 'var(--warm)') + T(265, y0 + r * sc + 16, '呼吸 ' + r, { b: 1, c: 'var(--warm)', fs: 13 }) + T(265, y0 - 6, '暗黒（放出）', { fs: 12 });
      s += Rc(350, y0 - a * sc, 70, a * sc, 'var(--accent)') + Rc(350, y0 - (a + r) * sc, 70, r * sc, 'var(--warm)') + T(385, y0 - (a + r) * sc - 6, '光合成 ' + (a + r), { b: 1, fs: 13 });
      return { q: 'ある植物の葉は、暗黒で CO₂ を 1 時間に ' + r + ' mg 放出し、ある明るさで CO₂ を 1 時間に ' + a + ' mg 吸収した。この明るさでの光合成速度（CO₂ mg/時）はいくらか。', ans: a + r, u: 'mg/時', fig: svg(480, Math.max(200, y0 + r * sc + 30), s), steps: ['暗黒での放出量 ＝ 呼吸速度 ＝ ' + r, '吸収量 ＝ 見かけの光合成速度 ＝ ' + a, '光合成速度 ＝ 見かけ ＋ 呼吸 ＝ ' + (a + r)] };
    } },
    { id: 'recomb', subj: 'bio', l: 'b1-3', t: '組換え価', gen: function () {
      var k = P([4, 9, 3, 7]), big = k * R(8, 20), small = R(8, 20), n = big * 2 + small * 2, rv = r1(small * 2 / n * 100), mx = big, s = T(240, 18, '検定交雑の子（＝ 親の配偶子の比）', { b: 1 });
      [['[AB]', big, 0], ['[Ab]', small, 1], ['[aB]', small, 1], ['[ab]', big, 0]].forEach(function (b, i) { var h = 110 * b[1] / mx, x = 60 + i * 95; s += Rc(x, 150 - h, 60, h, b[2] ? 'var(--warm)' : 'var(--c3)') + T(x + 30, 145 - h, b[1], { b: 1, fs: 13 }) + T(x + 30, 168, b[0], { b: 1 }); });
      s += T(250, 192, '組換え型（オレンジ）＝ (' + small + '＋' + small + ') ÷ ' + n + ' × 100 ＝ ' + rv + '%', { fs: 13.5, b: 1, c: 'var(--warm)' });
      return { q: 'AaBb（A と B、a と b が連鎖）を aabb と検定交雑すると、子の表現型が [AB] ' + big + '、[Ab] ' + small + '、[aB] ' + small + '、[ab] ' + big + ' になった。A–B 間の組換え価は何 % か（小数第1位まで）。', ans: rv, tol: .11, u: '%', fig: svg(480, 205, s), steps: ['検定交雑では、子の表現型の比 ＝ 親の配偶子の比', '少ない [Ab]・[aB] が組換えでできたもの', '組換え価 ＝ (' + small + ' ＋ ' + small + ') ÷ ' + n + ' × 100 ＝ ' + rv + '%'] };
    } },
    { id: 'hw', subj: 'bio', l: 'b1-5', t: 'ハーディ・ワインベルグの法則', gen: function () {
      var q = P([.1, .2, .3, .4, .05]), aa = Math.round(q * q * 10000) / 100, p = 1 - q, het = Math.round(2 * p * q * 1000) / 10, S = 170, x0 = 50, y0 = 30, s = '';
      s += Rc(x0, y0, S * p, S * p, 'var(--c3)', { r: 0 }) + Rc(x0 + S * p, y0, S * q, S * p, 'var(--c5)', { r: 0 }) + Rc(x0, y0 + S * p, S * p, S * q, 'var(--c5)', { r: 0 }) + Rc(x0 + S * p, y0 + S * p, S * q, S * q, 'var(--warm)', { r: 0 });
      s += T(x0 + S * p / 2, y0 + S * p / 2 + 5, 'AA', { b: 1, c: '#fff' }) + T(x0 + S * p + S * q / 2, y0 + S * p / 2 + 5, 'Aa', { b: 1, fs: 12 }) + T(x0 + S * p / 2, y0 + S * p + S * q / 2 + 5, 'Aa', { b: 1, fs: 12 }) + (q >= .2 ? T(x0 + S * p + S * q / 2, y0 + S * p + S * q / 2 + 5, 'aa', { b: 1, fs: 12 }) : '');
      s += T(x0 + S * p / 2, y0 - 6, 'A：p＝' + r1(p * 10) / 10, { fs: 12 }) + T(x0 + S * p + S * q / 2, y0 - 6, 'a：q', { fs: 12 });
      s += T(250, 60, 'aa ＝ q² ＝ ' + aa + '%（' + r1(q * q * 1000) / 1000 + '）', { a: 'start', fs: 13.5 }) + T(250, 90, 'q ＝ √' + (Math.round(q * q * 10000) / 10000) + ' ＝ ' + q, { a: 'start', fs: 13.5 }) + T(250, 120, 'p ＝ 1 − q ＝ ' + r1(p * 10) / 10, { a: 'start', fs: 13.5 }) + T(250, 156, 'Aa ＝ 2pq ＝ ' + het + '%', { a: 'start', b: 1, c: 'var(--c5)', fs: 16 }) + T(250, 182, '（四角の面積 ＝ 遺伝子型の割合）', { a: 'start', fs: 12, c: 'var(--muted)' });
      return { q: 'ハーディ・ワインベルグの法則が成り立つ集団で、潜性形質 [a] の個体が ' + aa + '% いた。ヘテロ接合体 Aa は何 % か。', ans: het, tol: .11, u: '%', fig: svg(480, 210, s), steps: ['aa の割合 ＝ q² ＝ ' + q * q, 'q ＝ √' + (q * q) + ' ＝ ' + q + '、p ＝ 1 − q ＝ ' + r1(p * 10) / 10, 'Aa ＝ 2pq ＝ 2 × ' + r1(p * 10) / 10 + ' × ' + q + ' ＝ ' + het + '%'] };
    } },
    { id: 'rq', subj: 'bio', l: 'b2-3', t: '呼吸商', gen: function () {
      var c = P([['炭水化物', 1.0], ['脂肪', 0.7], ['タンパク質', 0.8]]), o = R(10, 40) * 10, co = Math.round(o * c[1]), rq = r1(co / o), sc = 130 / o, s = T(240, 18, '呼吸商 ＝ 放出した CO₂ ÷ 吸収した O₂', { b: 1 });
      s += Rc(80, 170 - o * sc, 70, o * sc, 'var(--c3)') + T(115, 165 - o * sc, o + ' mL', { b: 1, fs: 13 }) + T(115, 188, 'O₂ 吸収', { fs: 13 }) + Rc(180, 170 - co * sc, 70, co * sc, 'var(--warm)') + T(215, 165 - co * sc, co + ' mL', { b: 1, fs: 13 }) + T(215, 188, 'CO₂ 放出', { fs: 13 });
      s += T(290, 70, 'RQ ＝ ' + co + ' ÷ ' + o + ' ＝ ' + rq, { a: 'start', b: 1, fs: 15 }) + T(290, 104, '炭水化物 1.0', { a: 'start', fs: 13, c: c[1] === 1 ? 'var(--accent)' : 'var(--muted)', b: c[1] === 1 }) + T(290, 126, 'タンパク質 約 0.8', { a: 'start', fs: 13, c: c[1] === .8 ? 'var(--accent)' : 'var(--muted)', b: c[1] === .8 }) + T(290, 148, '脂肪 約 0.7', { a: 'start', fs: 13, c: c[1] === .7 ? 'var(--accent)' : 'var(--muted)', b: c[1] === .7 });
      return { q: 'ある種子が呼吸で O₂ を ' + o + ' mL 吸収し、CO₂ を ' + co + ' mL 放出した。呼吸商を小数第1位まで求めよ。', ans: rq, tol: .051, u: '', fig: svg(480, 200, s), steps: ['呼吸商 ＝ 放出した CO₂ ÷ 吸収した O₂', co + ' ÷ ' + o + ' ＝ ' + rq, '約 ' + c[1] + ' なので、おもな呼吸基質は' + c[0]] };
    } },
    { id: 'pcr', subj: 'bio', l: 'b3-4', t: 'PCR 法', gen: function () {
      var n = R(3, 10), m = P([1, 2, 5]), s = T(240, 18, '1 サイクルごとに 2 倍', { b: 1 }), show = Math.min(n, 5);
      for (var i = 0; i <= show; i++) { var cnt = Math.pow(2, i), x = 20 + i * 72; s += T(x + 30, 44, i + ' 回目', { fs: 12, c: 'var(--muted)' }); for (var j = 0; j < Math.min(cnt, 16); j++) { var y = 54 + j * 8.5; s += L(x + 6, y, x + 54, y, 'var(--c3)', 2.2) + L(x + 6, y + 3, x + 54, y + 3, 'var(--warm)', 2.2); } s += T(x + 30, 200, '×' + cnt, { b: 1, fs: 13 }); }
      s += n > 5 ? T(470, 214, '（このあと ' + n + ' 回目まで くり返す）', { a: 'end', fs: 12, c: 'var(--muted)' }) : '';
      return { q: '2 本鎖 DNA ' + m + ' 分子を PCR 法で ' + n + ' サイクル増幅した。2 本鎖 DNA は理論上何分子になるか。', ans: m * Math.pow(2, n), u: '分子', fig: svg(480, 238, s + T(240, 230, m + ' × 2^' + n + ' ＝ ' + m * Math.pow(2, n) + ' 分子', { b: 1, c: 'var(--accent)' })), steps: ['1 サイクルで 2 倍になる', m + ' × 2^' + n + ' ＝ ' + m + ' × ' + Math.pow(2, n) + ' ＝ ' + m * Math.pow(2, n)] };
    } },
    { id: 'nerve', subj: 'bio', l: 'b4-1', t: '興奮の伝導速度', gen: function () {
      var cb = P([[20, 2], [20, 3], [25, 2], [25, 5], [40, 2], [40, 4], [40, 6], [50, 2], [50, 5], [60, 3], [60, 6], [30, 3], [30, 6]]), v = cb[0], d = cb[1], t = Math.round(d * 10 / v * 1000) / 1000, ts = +(t / 1000).toPrecision(4), s = T(240, 18, '時間の差 ＝ A から B まで伝わる時間', { b: 1 });
      s += L(40, 80, 360, 80, 'var(--ink)', 5) + Rc(360, 60, 90, 40, '#e6a1a1', { r: 18 }) + T(405, 85, '筋肉', { fs: 13, b: 1 });
      s += '<circle cx="80" cy="80" r="7" fill="var(--warm)"/>' + T(80, 60, 'A', { b: 1, c: 'var(--warm)' }) + '<circle cx="' + (80 + d * 40) + '" cy="80" r="7" fill="var(--c3)"/>' + T(80 + d * 40, 60, 'B', { b: 1, c: 'var(--c3)' });
      s += L(80, 105, 80 + d * 40, 105, 'var(--accent)', 2) + T(80 + d * 20, 125, d + ' cm ＝ ' + d / 100 + ' m', { b: 1, c: 'var(--accent)', fs: 13 });
      s += T(240, 160, '速さ ＝ 距離 ÷ 時間 ＝ ' + d / 100 + ' m ÷ ' + ts + ' 秒', { fs: 13.5 }) + T(240, 188, '＝ ' + v + ' m/秒', { b: 1, c: 'var(--warm)', fs: 16 });
      return { q: '神経の 2 点 A、B（A は筋肉から遠く、A–B 間は ' + d + ' cm）を刺激すると、筋肉が収縮するまでの時間の差は ' + t + ' ミリ秒だった。伝導速度は何 m/秒か。', ans: v, u: 'm/秒', fig: svg(480, 200, s), steps: ['時間の差は、A–B 間を伝わるのにかかった時間', d + ' cm ＝ ' + d / 100 + ' m、' + t + ' ミリ秒 ＝ ' + ts + ' 秒', '速さ ＝ ' + d / 100 + ' ÷ ' + ts + ' ＝ ' + v + ' m/秒'] };
    } },
    { id: 'mark', subj: 'bio', l: 'b5-1', t: '標識再捕法', gen: function () {
      var N = R(20, 80) * 10, M = R(4, 10) * 10, C = R(4, 10) * 10, Rr = Math.max(1, Math.round(M * C / N)), ans = Math.round(M * C / Rr), s = T(240, 18, '2回目にとった中の「標識つきの割合」＝ 池全体の割合', { b: 1, fs: 13.5 });
      s += '<ellipse cx="120" cy="110" rx="100" ry="70" fill="var(--water)" stroke="var(--c3)"/>' + T(120, 60, '池全体 ？ 匹', { b: 1, fs: 13 });
      for (var i = 0; i < 40; i++) { var x = 120 + (Math.sin(i * 7.3) * .8) * 80, y = 115 + Math.cos(i * 3.1) * 45; s += '<ellipse cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" rx="6" ry="3" fill="' + (i < Math.max(1, Math.round(40 * M / ans)) ? 'var(--warm)' : 'var(--muted)') + '"/>'; }
      s += Rc(270, 60, 180, 22, 'var(--chip)') + Rc(270, 60, 180 * Rr / C, 22, 'var(--warm)', { r: 3 }) + T(360, 98, '2回目 ' + C + ' 匹中、標識 ' + Rr + ' 匹', { fs: 12.5 });
      s += T(360, 136, '全体 : ' + M + ' ＝ ' + C + ' : ' + Rr, { fs: 13.5 }) + T(360, 166, '全体 ＝ ' + M + ' × ' + C + ' ÷ ' + Rr + ' ＝ ' + ans + ' 匹', { b: 1, c: 'var(--accent)', fs: 13.5 }) + T(120, 196, 'オレンジ＝標識つき（' + M + ' 匹）', { fs: 12, c: 'var(--warm)' });
      return { q: '池でフナを ' + M + ' 匹つかまえて標識をつけて放した。数日後に ' + C + ' 匹つかまえると、そのうち ' + Rr + ' 匹に標識があった。池のフナはおよそ何匹か。', ans: ans, tol: 1, u: '匹', fig: svg(480, 205, s), steps: ['全体 : 標識した数 ＝ 2回目の捕獲数 : 標識つきの数', '全体 ＝ ' + M + ' × ' + C + ' ÷ ' + Rr, '＝ ' + ans + ' 匹'] };
    } },
    { id: 'prod', subj: 'bio', l: 'b5-3', t: '純生産量と成長量', gen: function () {
      var G = R(30, 60) * 10, Rr = R(10, 25) * 10, E = R(2, 6) * 10, D = R(2, 6) * 10; if (Rr >= G) Rr = G / 2; var net = G - Rr, gr = net - E - D;
      var s = T(240, 18, '総生産量の内わけ', { b: 1 }) + band(30, 40, 420, 40, [[Rr, 'var(--chip)', '呼吸 ' + Rr], [E, 'var(--c5)', '被食 ' + E], [D, 'var(--soil)', '枯死 ' + D], [gr, 'var(--accent)', '成長 ' + gr]], G);
      var xn = 30 + 420 * Rr / G; s += L(30, 92, 450, 92, 'var(--ink)') + T(240, 110, '総生産量 ' + G, { fs: 13 }) + L(xn, 122, 450, 122, 'var(--c3)', 2) + T((xn + 450) / 2, 140, '純生産量 ' + net + '（＝ 総生産 − 呼吸）', { fs: 13, c: 'var(--c3)', b: 1 });
      s += T(240, 180, '成長量 ＝ 純生産量 −（被食 ＋ 枯死）＝ ' + gr, { b: 1, c: 'var(--accent)', fs: 15 });
      return { q: 'ある森林の生産者で、総生産量 ' + G + '、呼吸量 ' + Rr + '、被食量 ' + E + '、枯死量 ' + D + '（単位はすべて同じ）だった。成長量はいくらか。', ans: gr, u: '', fig: svg(480, 200, s), steps: ['純生産量 ＝ 総生産量 − 呼吸量 ＝ ' + G + ' − ' + Rr + ' ＝ ' + net, '成長量 ＝ 純生産量 −（被食量 ＋ 枯死量）', net + ' − (' + E + ' ＋ ' + D + ') ＝ ' + gr] };
    } },
    { id: 'eff', subj: 'bio', l: 'b5-3', t: 'エネルギー効率', gen: function () {
      var a = R(5, 20) * 100, e = P([10, 12, 15, 20]), b = a * e / 100, s = T(240, 18, '栄養段階が上がるほど、使えるエネルギーは少なくなる', { b: 1, fs: 13.5 });
      var w1 = 300, w2 = w1 * e / 100; s += Rc(240 - w1 / 2, 120, w1, 44, 'var(--c5)') + T(240, 147, '一次消費者 同化量 ' + a, { b: 1, fs: 13.5, c: '#1b1b1b' }) + Rc(240 - Math.max(w2, 40) / 2, 74, Math.max(w2, 40), 44, 'var(--warm)') + T(240, 66, '二次消費者 同化量 ' + b, { b: 1, fs: 13.5 });
      s += T(240, 192, '効率 ＝ ' + b + ' ÷ ' + a + ' × 100 ＝ ' + e + '%', { b: 1, c: 'var(--accent)', fs: 15 });
      return { q: '一次消費者の同化量が ' + a + '、二次消費者の同化量が ' + b + '（単位は同じ）のとき、二次消費者のエネルギー効率は何 % か。', ans: e, u: '%', fig: svg(480, 205, s), steps: ['エネルギー効率 ＝ その段階の同化量 ÷ 1つ前の段階の同化量 × 100', b + ' ÷ ' + a + ' × 100 ＝ ' + e + '%'] };
    } }
  ];
})();
