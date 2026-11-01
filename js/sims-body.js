/* 見る：血糖値・免疫・ニューロン */
(function () {
  /* ---------- 血糖値 ---------- */
  function sugarModel(type) {
    var st = { t: 0, G: 95, I: 5, Gn: 4, gut: 0, ex: 0, hist: [] };
    var secr = type === 't1' ? 0.03 : type === 't2' ? 0.6 : 1, sens = type === 't2' ? 0.35 : 1;
    st.step = function () {
      var a = 0.03 * st.gut; st.gut -= a;
      st.I += (0.009 * Math.max(0, st.G - 80) + 0.05) * secr - 0.03 * st.I;
      st.Gn += 0.06 * Math.max(0, 100 - st.G) + 0.1 + (st.ex > 0 ? 0.25 : 0) - 0.08 * st.Gn;
      var uptake = (0.004 + 0.0012 * st.I * sens) * st.G;
      var liver = Math.max(0, 0.6 + 0.1 * st.Gn - 0.01 * st.I * sens);
      st.G += a * 2.4 + liver - uptake - (st.ex > 0 ? 0.6 : 0);
      if (st.ex > 0) st.ex--;
      st.G = Math.max(30, st.G); st.t++;
      st.hist.push([st.t, st.G, st.I, st.Gn]); if (st.hist.length > 480) st.hist.shift();
    };
    for (var k = 0; k < 600; k++) st.step();
    st.hist = []; st.t = 0;
    return st;
  }
  BL.sugarModel = sugarModel;
  BL.addSim({
    id: 'sugar', name: '血糖値の調節', cat: 'からだ', subj: 'kiso', ic: '糖', lead: '食事や運動のあと、ホルモンで血糖値がもどるようすを見る',
    how: '<p>血液中のグルコース（ブドウ糖）の濃さを<b class="key">血糖値</b>という。ヒトでは空腹時 約 100 mg/100 mL（＝ 約 0.1%）に保たれる。</p><div class="box"><b>血糖値が高いとき</b>：間脳の視床下部 → 副交感神経 → すい臓ランゲルハンス島の <b class="key">B細胞</b> → <b class="key">インスリン</b>（細胞へのグルコースの取りこみ・肝臓でのグリコーゲン合成を促進）→ 血糖値が下がる<br><b>血糖値が低いとき</b>：交感神経 → ランゲルハンス島 <b class="key">A細胞</b> → <b class="key">グルカゴン</b>、副腎髄質 → <b class="key">アドレナリン</b>（グリコーゲンを分解）、脳下垂体前葉 → 副腎皮質 → <b class="key">糖質コルチコイド</b>（タンパク質からグルコースをつくる）→ 血糖値が上がる</div><p><b class="key">糖尿病</b>：1型 … B細胞がこわされ、インスリンがほとんど出ない。2型 … インスリンが出にくい・効きにくい（生活習慣も関係）。</p>',
    pts: [[1, '血糖値を下げるホルモンはインスリンだけ'], [1, 'グルカゴン・アドレナリンは肝臓のグリコーゲン分解を促進'], [0, '1型糖尿病は、標的細胞がインスリンに反応しにくくなる → ×（それは2型が多い）'], [1, '血糖値の調節には、自律神経とホルモンの両方がはたらく']],
    tasks: ['健康なヒトで食事 → 血糖値がもどるのを見る', '1型糖尿病で食事をする', '運動して、グルカゴンがふえるのを見る'],
    mount: function (stage, ctl, api) {
      var type = 'ok', st = sugarModel(type), speed = 1, ate = 0;
      BL.ui.seg(ctl, 'ヒト', [['ok', '健康'], ['t1', '1型糖尿病'], ['t2', '2型糖尿病']], type, function (v) { type = v; st = sugarModel(v); ate = 0; });
      var r = BL.el('div', { class: 'row' }); ctl.appendChild(r);
      BL.ui.btn(r, '🍚 食事をする', function () { st.gut += 60; ate = st.t; if (type === 't1') api.task(1); }, 'main');
      BL.ui.btn(r, '🏃 運動する', function () { st.ex = 40; api.task(2); });
      BL.ui.seg(ctl, '速さ', [[1, '×1'], [3, '×3'], [8, '×8']], speed, function (v) { speed = v; });
      var m = BL.ui.meter(ctl, ['時間', '血糖値', 'インスリン', 'グルカゴン']);
      var path = BL.ui.box(ctl, 'info', '');
      var acc = 0;
      var stop = BL.loop(function (dt) {
        acc += dt * 8 * speed;
        while (acc >= 1) { st.step(); acc--; }
        var h = st.hist, t1 = Math.max(240, st.t), t0 = t1 - 240;
        var G = [], I = [], Gn = [];
        h.forEach(function (p) { if (p[0] >= t0) { G.push([p[0], p[1]]); I.push([p[0], p[2] * 4]); Gn.push([p[0], p[3] * 8]); } });
        stage.innerHTML = '<div style="width:100%;max-width:760px">' + BL.plot({ w: 640, h: 330, x: [t0, t1], y: [0, 260], xt: [0, 60, 120, 180, 240].map(function (v) { return Math.round((t0 + v) / 10) * 10; }), yt: [0, 50, 100, 150, 200, 250], xl: '時間（分）', yl: '血糖値（mg/100mL）・ホルモン（相対値）', series: [{ pts: G, c: 'var(--warm)', w: 3.2, label: '血糖値' }, { pts: I, c: 'var(--c3)', label: 'インスリン' }, { pts: Gn, c: 'var(--accent)', label: 'グルカゴン' }], hl: [{ y: 100, t: '正常（約100）' }, { y: 200, c: 'var(--ng)', t: '高血糖' }] }) + '</div>';
        m([st.t + ' 分', Math.round(st.G) + ' mg', BL.fmt(st.I, 1), BL.fmt(st.Gn, 1)], [0, st.G > 140 || st.G < 70, 0, 0]);
        var msg;
        if (st.G > 115) msg = '<h4>血糖値が高い ↑</h4>視床下部が感知 → 副交感神経 → すい臓ランゲルハンス島 B細胞 → <b>インスリン</b> → 細胞がグルコースを取りこむ・肝臓でグリコーゲンを合成' + (type === 't1' ? '<br><b style="color:var(--ng)">1型：B細胞がこわれていてインスリンがほとんど出ない！</b>' : type === 't2' ? '<br><b style="color:var(--ng)">2型：インスリンが効きにくく、なかなか下がらない</b>' : '');
        else if (st.G < 88) msg = '<h4>血糖値が低い ↓</h4>視床下部 → 交感神経 → ランゲルハンス島 A細胞 → <b>グルカゴン</b>、副腎髄質 → <b>アドレナリン</b> → 肝臓のグリコーゲンを分解してグルコースを出す';
        else msg = '<h4>ちょうどよい</h4>血糖値は 約100 mg/100mL 付近に保たれている（恒常性）。';
        if (path._m !== msg) { path.innerHTML = msg; path._m = msg; }
        if (type === 'ok' && ate && st.t - ate > 120 && st.G < 110) api.task(0);
      });
      return stop;
    }
  });

  /* ---------- 免疫 ---------- */
  function resp(d, d0, second) {
    var x = d - d0; if (x < 0) return 0;
    var lag = second ? 2 : 6, peak = second ? 6 : 12, amp = second ? 100 : 8, decay = second ? 0.035 : 0.08;
    if (x < lag) return 0.01;
    var u = x - lag;
    return u < peak ? 0.01 + amp * Math.pow(u / peak, 2) : amp * Math.exp(-decay * (u - peak)) + amp * 0.05;
  }
  BL.addSim({
    id: 'immune', name: '免疫（一次応答と二次応答）', cat: 'からだ', subj: 'kiso', ic: '免', lead: '同じ抗原が2回目に入ると、抗体はどうなる？ ワクチンのしくみ',
    how: '<p><b class="key">自然免疫</b>：好中球・マクロファージ・樹状細胞が<b class="key">食作用</b>で異物をとりこむ。NK細胞は感染細胞をこわす。すぐにはたらくが、相手を区別しない。</p><p><b class="key">獲得免疫</b>（適応免疫）：<b class="key">樹状細胞</b>が抗原をリンパ節でヘルパーT細胞に<b class="key">抗原提示</b> →</p><ul><li><b class="key">体液性免疫</b>：ヘルパーT細胞が B細胞を活性化 → <b class="key">形質細胞（抗体産生細胞）</b>が<b class="key">抗体</b>をつくる → 抗原抗体反応</li><li><b class="key">細胞性免疫</b>：キラーT細胞が感染細胞を直接こわす</li></ul><p>一部は<b class="key">記憶細胞</b>として残る。同じ抗原が再び入ると、すばやく大量に抗体ができる＝<b class="key">二次応答</b>。これを利用したのが<b class="key">ワクチン</b>（予防接種）。</p>',
    pts: [[1, '二次応答は一次応答より速く、抗体の量も多い'], [1, '記憶細胞は、その抗原だけを覚えている（特異性）'], [0, '抗原Aで記憶ができると、抗原Bにも二次応答が起こる → ×'], [1, 'ワクチンは弱毒化・不活化した病原体などを入れて記憶細胞をつくらせる']],
    tasks: ['抗原Aを2回入れて二次応答を見る', '抗原Aのあとに抗原Bを入れる（Bは一次応答）', 'ワクチンを先に打ってから感染する'],
    mount: function (stage, ctl, api) {
      var day = 0, ev = [], timer = null, log = BL.el('div', { class: 'note' });
      var r = BL.el('div', { class: 'row' }); ctl.appendChild(r);
      BL.ui.btn(r, '💉 抗原Aを入れる', function () { add('A'); }, 'main');
      BL.ui.btn(r, '🦠 抗原Bを入れる', function () { add('B'); });
      var r2 = BL.el('div', { class: 'row' }); ctl.appendChild(r2);
      BL.ui.btn(r2, '🛡 ワクチン（A）を打つ', function () { add('A', 1); });
      BL.ui.btn(r2, 'はじめから', function () { day = 0; ev = []; draw(); });
      var m = BL.ui.meter(ctl, ['日', '抗A抗体', '抗B抗体']);
      var info = BL.ui.box(ctl, 'info', '<h4>しくみ</h4>抗原 → 樹状細胞が抗原提示 → ヘルパーT細胞 → B細胞 → 形質細胞が抗体をつくる。一部が記憶細胞として残る。');
      ctl.appendChild(log);
      function add(k, vac) {
        var prior = ev.filter(function (e) { return e.k === k && day - e.d >= 5; }).length > 0;
        ev.push({ k: k, d: day, s: prior, v: vac });
        if (k === 'A' && prior) { api.task(0); if (ev.some(function (e) { return e.v; })) api.task(2); }
        if (k === 'B' && ev.some(function (e) { return e.k === 'A'; })) api.task(1);
        info.innerHTML = prior ? '<h4>二次応答！</h4>記憶細胞が残っていたので、すぐに大量の抗体ができる。' + (ev.some(function (e) { return e.v; }) ? '（ワクチンでできた記憶細胞のおかげ）' : '') : '<h4>一次応答</h4>はじめての抗原なので、抗体ができるまで 1 週間ほどかかり、量も少ない。記憶細胞ができる。';
        log.textContent = ev.map(function (e) { return e.d + '日目：' + (e.v ? 'ワクチンA' : '抗原' + e.k); }).join('、');
      }
      function lvl(k, d) { return ev.filter(function (e) { return e.k === k; }).reduce(function (s, e) { return s + resp(d, e.d, e.s) * (e.v ? .8 : 1); }, 0); }
      function draw() {
        var A = [], B = [];
        for (var d = 0; d <= Math.max(80, day); d += .5) { if (d > day) break; A.push([d, Math.max(.01, lvl('A', d))]); B.push([d, Math.max(.01, lvl('B', d))]); }
        var x1 = Math.max(80, day);
        stage.innerHTML = '<div style="width:100%;max-width:760px">' + BL.plot({ w: 640, h: 340, x: [x1 - 80, x1], y: [.01, 300], ylog: true, xt: [0, 20, 40, 60, 80].map(function (v) { return x1 - 80 + v; }), yt: [.01, .1, 1, 10, 100], xl: '日数', yl: '血液中の抗体の量（相対値・目盛りは10倍ずつ）', series: [{ pts: A, c: 'var(--warm)', w: 3, label: '抗A抗体' }, { pts: B, c: 'var(--c3)', w: 3, label: '抗B抗体' }], vl: ev.map(function (e) { return { x: e.d, c: e.k === 'A' ? 'var(--warm)' : 'var(--c3)', t: e.v ? 'ワクチン' : e.k }; }) }) + '</div>';
        m([Math.floor(day) + ' 日', BL.fmt(lvl('A', day), 1), BL.fmt(lvl('B', day), 1)]);
      }
      var stop = BL.loop(function (dt) { day += dt * 4; draw(); });
      return stop;
    }
  });

  /* ---------- ニューロン ---------- */
  BL.addSim({
    id: 'neuron', name: 'ニューロンと活動電位', cat: 'からだ', subj: 'bio', ic: '神', lead: '刺激の強さを変えて、興奮（活動電位）が起こるか調べる',
    how: '<p>神経細胞（<b class="key">ニューロン</b>）は、細胞体・樹状突起・軸索からなる。</p><p>ふだん細胞の内側は外側より約 −60〜−70 mV 低い（<b class="key">静止電位</b>）。ナトリウムポンプで Na⁺ を外、K⁺ を内に集め、K⁺ が漏れ出ることで生じる。</p><p>刺激が<b class="key">閾値</b>をこえると、電位依存性 Na⁺ チャネルが開いて Na⁺ が流れこみ、内側が一瞬 ＋ になる（<b class="key">活動電位</b>＝<b class="key">興奮</b>）。その後 K⁺ が流れ出てもどる。</p><div class="box"><b>全か無かの法則</b>：閾値より弱い刺激では興奮せず、閾値以上ならどんなに強くても活動電位の大きさは同じ。刺激の強さは<b>興奮の回数（頻度）</b>で伝わる。</div><p><b class="key">有髄神経繊維</b>では、興奮がランビエ絞輪をとびとびに伝わる（<b class="key">跳躍伝導</b>）ので速い。</p>',
    pts: [[1, '閾値未満の刺激では活動電位は生じない'], [1, '強い刺激ほど、活動電位の発生する頻度が高くなる'], [0, '強い刺激ほど、1回の活動電位が大きくなる → ×'], [1, '有髄神経繊維は跳躍伝導で、無髄より伝導が速い']],
    tasks: ['閾値より弱い刺激で、興奮しないのを確かめる', '活動電位を起こす', '強い刺激を続けて、興奮の回数がふえるのを見る'],
    mount: function (stage, ctl, api) {
      var S = 6, th = 10, V = [], t = 0, cont = false, myel = true, refr = 0, spikes = [], pulse = -1;
      var sS = BL.ui.slider(ctl, { label: '刺激の強さ', min: 0, max: 30, value: S, on: function (v) { S = v; } });
      var r = BL.el('div', { class: 'row' }); ctl.appendChild(r);
      BL.ui.btn(r, '⚡ 1回刺激', function () { stim(); }, 'main');
      var cb = BL.ui.btn(r, '刺激を続ける：オフ', function () { cont = !cont; cb.textContent = '刺激を続ける：' + (cont ? 'オン' : 'オフ'); cb.setAttribute('aria-pressed', String(cont)); });
      BL.ui.seg(ctl, '神経繊維', [[true, '有髄（跳躍伝導）'], [false, '無髄']], myel, function (v) { myel = v; });
      var m = BL.ui.meter(ctl, ['膜電位', '閾値', '結果']);
      var res = '–';
      function stim() {
        if (refr > 0) return;
        if (S >= th) { spikes.push(0); refr = 3; res = '興奮した！'; pulse = 0; api.task(1); }
        else { spikes.push(-S); res = '興奮しない（閾値未満）'; api.task(0); }
      }
      var acc = 0, lastStim = 0;
      var stop = BL.loop(function (dt) {
        acc += dt * 1000 / 50;
        while (acc >= 1) {
          acc--; t += .1;
          if (cont && S >= th) { var period = Math.max(3.2, 30 / S * 3.2); if (t - lastStim >= period) { lastStim = t; stim(); if (S >= 20) api.task(2); } }
          else if (cont && t - lastStim >= 4) { lastStim = t; stim(); }
          if (refr > 0) refr -= .1;
          var v = -65;
          V.push([t, v]); if (V.length > 300) V.shift();
        }
        var Vs = [];
        for (var i = 0; i < V.length; i++) Vs.push([V[i][0], potential(V[i][0])]);
        var now = potential(t);
        stage.innerHTML = '<div style="width:100%;max-width:760px">' + axon() + BL.plot({ w: 640, h: 270, x: [t - 30, t], y: [-90, 50], xt: [], yt: [-80, -60, -40, -20, 0, 20, 40], xl: '時間（ミリ秒）→', yl: '膜電位（mV）', series: [{ pts: Vs, c: 'var(--warm)', w: 3 }], hl: [{ y: -65 + th * 2, c: 'var(--c3)', t: '閾値' }, { y: 0, c: 'var(--line)' }] }) + '</div>';
        m([Math.round(now) + ' mV', (-65 + th * 2) + ' mV', res]);
        if (pulse >= 0) { pulse += dt * (myel ? 2.2 : .7); if (pulse > 1.05) pulse = -1; }
      });
      var events = [];
      var oldStim = stim;
      stim = function () { var before = spikes.length; oldStim(); if (spikes.length > before) events.push({ t: t, sub: spikes[spikes.length - 1] < 0 ? -spikes[spikes.length - 1] : 0 }); };
      function potential(x) {
        var v = -65;
        events.forEach(function (e) {
          var u = x - e.t; if (u < 0) return;
          if (e.sub) v += e.sub * 2 * Math.exp(-u / 1.2) * (u < .3 ? u / .3 : 1);
          else if (u < .6) v += (u / .6) * 105;
          else if (u < 1.4) v += 105 - (u - .6) / .8 * 120;
          else if (u < 4) v += -15 * (1 - (u - 1.4) / 2.6);
        });
        return Math.max(-90, Math.min(45, v));
      }
      function axon() {
        var s = '<svg class="svgfig" viewBox="0 0 640 90"><circle cx="40" cy="45" r="28" fill="var(--nuc)" stroke="var(--ink)"/><text x="40" y="50" text-anchor="middle" font-size="11" fill="var(--ink)">細胞体</text><line x1="68" y1="45" x2="620" y2="45" stroke="var(--ink)" stroke-width="5"/>';
        if (myel) for (var k = 0; k < 7; k++) s += '<rect x="' + (84 + k * 76) + '" y="33" width="64" height="24" rx="12" fill="var(--chip)" stroke="var(--ink)"/>';
        if (pulse >= 0) { var px = 68 + pulse * 552; if (myel) px = 78 + Math.round(pulse * 7) * 76; s += '<circle cx="' + px + '" cy="45" r="11" fill="var(--warm)" opacity=".85"/>'; }
        return s + '<text x="330" y="84" text-anchor="middle" font-size="11.5" fill="var(--muted)">' + (myel ? '有髄神経繊維：髄鞘のすき間（ランビエ絞輪）をとびとびに伝わる' : '無髄神経繊維：となりへ順に伝わる（おそい）') + '</text></svg>';
      }
      return stop;
    }
  });
})();
