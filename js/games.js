/* ゲーム */
(function () {
  var ORDERS = [
    ['体細胞分裂（分裂期）', ['前期', '中期', '後期', '終期']],
    ['細胞周期', ['G₁期', 'S期', 'G₂期', 'M期（分裂期）']],
    ['一次遷移', ['裸地', '荒原', '草原', '低木林', '陽樹林', '混交林', '陰樹林']],
    ['遺伝情報の流れ', ['DNA の鋳型鎖', '転写で mRNA ができる', 'mRNA が核の外へ', 'リボソームで翻訳', 'タンパク質']],
    ['体液性免疫', ['樹状細胞が抗原をとりこむ', 'ヘルパーT細胞に抗原提示', 'ヘルパーT細胞が B細胞を活性化', 'B細胞が形質細胞になる', '抗体で抗原抗体反応']],
    ['血液凝固', ['血管が傷つく', '血小板が集まる', 'フィブリンができる', '血ぺいができて傷口をふさぐ']],
    ['呼吸の過程', ['解糖系', 'クエン酸回路', '電子伝達系']],
    ['反射・反応の経路', ['受容器', '感覚神経', '中枢', '運動神経', '効果器']],
    ['カエルの発生', ['受精卵', '卵割', '胞胚', '原腸胚', '神経胚', '尾芽胚']],
    ['地質時代', ['先カンブリア時代', '古生代', '中生代', '新生代']],
    ['分類の階層（大 → 小）', ['ドメイン', '界', '門', '綱', '目', '科', '属', '種']],
    ['血糖値が上がったとき', ['血糖値が上がる', '視床下部が感知', '副交感神経', 'ランゲルハンス島 B細胞', 'インスリン分泌', '血糖値が下がる']],
    ['PCR 法の1サイクル', ['約95℃で2本鎖をほどく', '約55℃でプライマーが結合', '約72℃で DNA ポリメラーゼが伸長']],
    ['筋収縮のしくみ', ['運動神経の興奮', 'アセチルコリンの放出', '筋小胞体から Ca²⁺ 放出', 'アクチンとミオシンが結合', '筋肉が縮む']],
    ['生物の誕生と変遷', ['化学進化', '原核生物の誕生', 'シアノバクテリアが酸素を放出', '真核生物の誕生', '多細胞生物の出現', '生物の陸上進出']],
    ['光合成（葉緑体）', ['光エネルギーの吸収', '水の分解（O₂ 発生）', 'ATP と NADPH の合成', 'カルビン回路で CO₂ を固定']]
  ];
  function allTerms(subj) {
    var t = [];
    BL.lessons.forEach(function (l) { if (!subj || l.subj === subj) (l.terms || []).forEach(function (x) { t.push({ w: x.w, d: x.d, l: l.id }); }); });
    return t;
  }
  function best(id, v, higher) {
    var b = BL.store.get('best', {}), cur = b[id];
    if (v != null && (cur == null || (higher ? v > cur : v < cur))) { b[id] = v; BL.store.set('best', b); return true; }
    return false;
  }
  BL.bestOf = function (id) { return BL.store.get('best', {})[id]; };
  function head(el, title, exit) {
    var h = BL.el('div', { class: 'ghead' });
    var back = BL.el('button', { class: 'btn' }, '← ゲーム一覧'); back.addEventListener('click', exit);
    h.appendChild(back); h.appendChild(BL.el('h2', {}, title));
    var st = BL.el('div', { class: 'gstat' }); h.appendChild(st);
    el.appendChild(h); return st;
  }
  function subjPick(el, title, desc, go) {
    el.appendChild(BL.el('p', {}, desc));
    var r = BL.el('div', { class: 'row' }); el.appendChild(r);
    [['', 'ぜんぶ'], ['kiso', '生物基礎'], ['bio', '生物']].forEach(function (s) { BL.ui.btn(r, s[1], function () { go(s[0]); }, s[0] === '' ? 'main big' : 'big'); });
  }
  function timed(st, secs, onEnd) {
    var t0 = Date.now(), bar = BL.el('div', { class: 'timer' }, '<i></i>'), iv;
    iv = setInterval(function () { if (!document.body.contains(bar)) { clearInterval(iv); return; } var left = secs - (Date.now() - t0) / 1000; bar.firstChild.style.width = Math.max(0, left / secs * 100) + '%'; if (left <= 0) { clearInterval(iv); onEnd(); } }, 100);
    return { bar: bar, stop: function () { clearInterval(iv); }, add: function (s) { t0 += s * 1000; } };
  }
  function endScreen(el, title, score, unit, isBest, again, exit) {
    el.innerHTML = '';
    var d = BL.el('div', { class: 'panel result' });
    d.innerHTML = '<div class="eyebrow">' + title + '</div><div class="big">' + score + ' <small style="font-size:18px">' + unit + '</small></div>' + (isBest ? '<p><span class="stamp">新記録</span></p>' : '');
    var r = BL.el('div', { class: 'row', style: 'justify-content:center' }); d.appendChild(r);
    BL.ui.btn(r, 'もう一度', again, 'main big'); BL.ui.btn(r, 'ゲーム一覧', exit, 'big');
    el.appendChild(d);
  }

  BL.games = [
    { id: 'time', em: '⏱', name: '用語タイムアタック', desc: '60秒で、説明に合う用語をどんどん選ぶ。連続正解でボーナス。', unit: '点', run: function (el, exit) {
      var st = head(el, '⏱ 用語タイムアタック', exit), area = BL.el('div', { class: 'panel qbox' }); el.appendChild(area);
      subjPick(area, '', '範囲をえらんでスタート。まちがえると 3 秒へる。', start);
      function start(subj) {
        var pool = allTerms(subj), score = 0, combo = 0, done = false;
        area.innerHTML = ''; var tm = timed(st, 60, finish); area.appendChild(tm.bar);
        var box = BL.el('div'); area.appendChild(box);
        function next() {
          if (done) return;
          var t = BL.pick(pool), rev = Math.random() < .3, others = BL.shuffle(pool.filter(function (x) { return x.w !== t.w; })).slice(0, 3);
          var opts = BL.shuffle([t].concat(others));
          box.innerHTML = '<div class="eyebrow">' + (rev ? 'この用語の説明は？' : 'この説明に合う用語は？') + '</div><div class="qtext">' + BL.esc(rev ? t.w : t.d) + '</div>';
          var g = BL.el('div', { class: 'qchoices' }); box.appendChild(g);
          opts.forEach(function (o) {
            var b = BL.el('button', { class: 'qc' }, BL.esc(rev ? o.d : o.w)); g.appendChild(b);
            b.addEventListener('click', function () {
              if (o === t) { combo++; score += 10 + Math.min(combo - 1, 5) * 2; b.classList.add('right'); }
              else { combo = 0; tm.add(-3); b.classList.add('wrong'); box.classList.add('flash-ng'); }
              st.innerHTML = '<span>' + score + ' 点</span><span>連続 ' + combo + '</span>';
              setTimeout(function () { box.classList.remove('flash-ng'); next(); }, o === t ? 180 : 600);
            });
          });
        }
        function finish() { done = true; var nb = best('time' + subj, score, true); endScreen(el, '用語タイムアタック', score, '点', nb, function () { el.innerHTML = ''; BL.games[0].run(el, exit); }, exit); }
        st.innerHTML = '<span>0 点</span>'; next();
      }
    } },
    { id: 'org', em: '🔬', name: '細胞小器官さがし', desc: '言われた小器官を細胞の図からさがしてタップ。10問のタイムを競う。', unit: '秒', low: true, run: function (el, exit) {
      var st = head(el, '🔬 細胞小器官さがし', exit), area = BL.el('div', { class: 'panel qbox' }); el.appendChild(area);
      var Q = [['animal', ['nucleus', 'mito', 'er', 'golgi', 'ribo', 'centro', 'membrane']], ['plant', ['nucleus', 'mito', 'chloro', 'wall', 'vacuole', 'membrane', 'golgi']], ['pro', ['nucleoid', 'wall', 'ribo', 'flag', 'membrane']]];
      var n = 0, miss = 0, t0 = Date.now(), iv = setInterval(function () { if (!document.body.contains(st)) { clearInterval(iv); return; } st.innerHTML = '<span>' + n + '/10</span><span>' + ((Date.now() - t0) / 1000).toFixed(1) + ' 秒</span><span>ミス ' + miss + '</span>'; }, 100);
      function q() {
        if (n >= 10) { clearInterval(iv); var sec = Math.round((Date.now() - t0) / 100) / 10 + miss * 3; var nb = best('org', sec, false); endScreen(el, '細胞小器官さがし（ミス1回＝＋3秒）', sec.toFixed(1), '秒', nb, function () { el.innerHTML = ''; BL.games[1].run(el, exit); }, exit); return; }
        var c = BL.pick(Q), target = BL.pick(c[1]);
        area.innerHTML = '<div class="qtext" style="text-align:center">' + ({ animal: '動物細胞', plant: '植物細胞', pro: '原核細胞' })[c[0]] + 'の <span style="color:var(--warm);font-size:24px">' + BL.ORG[target].n + '</span> はどこ？</div><div style="max-width:620px;margin:0 auto">' + BL.cellSVG(c[0], false) + '</div>';
        area.querySelectorAll('.org').forEach(function (g) {
          g.addEventListener('click', function (e) {
            e.stopPropagation();
            if (g.dataset.id === target) { g.classList.add('hit'); n++; setTimeout(q, 350); }
            else { g.classList.add('miss'); miss++; area.classList.add('flash-ng'); setTimeout(function () { g.classList.remove('miss'); area.classList.remove('flash-ng'); }, 450); }
          });
        });
      }
      q();
    } },
    { id: 'codon', em: '🧬', name: 'コドンラッシュ', desc: '相補的な塩基・転写・翻訳を60秒で何問とけるか。コドン表つき。', unit: '問', run: function (el, exit) {
      var st = head(el, '🧬 コドンラッシュ', exit), area = BL.el('div', { class: 'panel qbox' }); el.appendChild(area);
      var score = 0, done = false, tm = timed(st, 60, function () { done = true; var nb = best('codon', score, true); endScreen(el, 'コドンラッシュ', score, '問', nb, function () { el.innerHTML = ''; BL.games[2].run(el, exit); }, exit); });
      area.appendChild(tm.bar); var box = BL.el('div'); area.appendChild(box);
      var tbl = BL.el('details', { style: 'margin-top:10px' }, '<summary style="cursor:pointer;font-weight:700">コドン表を見る</summary>' + BL.codonTable()); area.appendChild(tbl);
      function rb(n) { var s = ''; for (var i = 0; i < n; i++) s += 'ATGC'[BL.rnd(0, 3)]; return s; }
      function cmp(s, rna) { return s.split('').map(function (b) { return BL.comp(b, rna); }).join(''); }
      function mutate(s, alpha) { var i = BL.rnd(0, s.length - 1), b; do { b = alpha[BL.rnd(0, 3)]; } while (b === s[i]); return s.slice(0, i) + b + s.slice(i + 1); }
      function next() {
        if (done) return;
        var k = BL.rnd(0, 2), q, ans, opts = [];
        if (k === 0) { var d = rb(6); q = 'DNA の片方の鎖が <span class="codon">' + d + '</span><br>もう一方の鎖は？'; ans = cmp(d); while (opts.length < 3) { var w = mutate(ans, 'ATGC'); if (opts.indexOf(w) < 0 && w !== ans) opts.push(w); } }
        else if (k === 1) { var t = rb(6); q = 'DNA の鋳型鎖が <span class="codon">' + t + '</span><br>転写される mRNA は？'; ans = cmp(t, true); opts = [cmp(t), t.replace(/T/g, 'U'), mutate(ans, 'UAGC')]; opts = opts.filter(function (o, i) { return o !== ans && opts.indexOf(o) === i; }); while (opts.length < 3) { var w2 = mutate(ans, 'UAGC'); if (opts.indexOf(w2) < 0 && w2 !== ans) opts.push(w2); } }
        else { var cs = Object.keys(BL.CODON), c = BL.pick(cs); q = 'mRNA のコドン <span class="codon">' + c + '</span><br>指定するアミノ酸は？（コドン表を見てOK）'; ans = BL.AAN[BL.CODON[c]]; var names = BL.shuffle(Object.keys(BL.AAN).map(function (x) { return BL.AAN[x]; }).filter(function (x) { return x !== ans; })); opts = names.slice(0, 3); }
        box.innerHTML = '<div class="qtext" style="text-align:center">' + q + '</div>';
        var g = BL.el('div', { class: 'qchoices' }); box.appendChild(g);
        BL.shuffle([ans].concat(opts)).forEach(function (o) {
          var b = BL.el('button', { class: 'qc', style: 'text-align:center;font-family:var(--font-data);font-size:18px' }, o); g.appendChild(b);
          b.addEventListener('click', function () { if (o === ans) { score++; b.classList.add('right'); } else { b.classList.add('wrong'); tm.add(-3); } st.innerHTML = '<span>' + score + ' 問</span>'; setTimeout(next, o === ans ? 200 : 700); });
        });
      }
      st.innerHTML = '<span>0 問</span>'; next();
    } },
    { id: 'pairs', em: '🃏', name: '用語ペア', desc: '用語と説明のカードをめくって、ペアをそろえる（神経衰弱）。', unit: '手', low: true, run: function (el, exit) {
      var st = head(el, '🃏 用語ペア', exit), area = BL.el('div'); el.appendChild(area);
      var p0 = BL.el('div', { class: 'panel qbox' }); area.appendChild(p0);
      p0.appendChild(BL.el('p', {}, '授業をえらぶと、その授業の用語 6 組でスタート。「おまかせ」は全体からランダム。'));
      var sel = BL.el('select', { class: 'btn', style: 'max-width:100%' }); sel.innerHTML = '<option value="">おまかせ（ぜんぶから）</option>' + BL.lessons.map(function (l) { return '<option value="' + l.id + '">' + BL.SUBJ[l.subj] + ' ' + l.unit + ' ' + BL.esc(l.title) + '</option>'; }).join('');
      p0.appendChild(sel); var r = BL.el('div', { class: 'row', style: 'margin-top:10px' }); p0.appendChild(r);
      BL.ui.btn(r, 'スタート', function () { start(sel.value); }, 'main big');
      function start(lid) {
        var pool = lid ? BL.lessons.filter(function (l) { return l.id === lid; })[0].terms.map(function (x) { return { w: x.w, d: x.d }; }) : allTerms();
        var six = BL.shuffle(pool).slice(0, 6), cards = [];
        six.forEach(function (t, i) { cards.push({ k: i, s: t.w, term: 1 }, { k: i, s: t.d }); });
        cards = BL.shuffle(cards);
        area.innerHTML = ''; var g = BL.el('div', { class: 'pairs' }); area.appendChild(g);
        var open = [], moves = 0, got = 0, lock = false;
        cards.forEach(function (c) {
          var b = BL.el('button', { class: 'pcard' + (c.term ? ' term' : '') }, '？'); c.b = b; g.appendChild(b);
          b.addEventListener('click', function () {
            if (lock || c.open || c.got) return;
            c.open = true; b.classList.add('open'); b.textContent = c.s; open.push(c);
            if (open.length === 2) {
              moves++; st.innerHTML = '<span>' + moves + ' 手</span><span>' + got + '/6</span>';
              var a = open[0], z = open[1]; open = [];
              if (a.k === z.k && a.term !== z.term) { a.got = z.got = true; a.b.classList.add('got'); z.b.classList.add('got'); got++; st.innerHTML = '<span>' + moves + ' 手</span><span>' + got + '/6</span>'; if (got === 6) setTimeout(function () { var nb = best('pairs', moves, false); endScreen(el, '用語ペア', moves, '手', nb, function () { el.innerHTML = ''; BL.games[3].run(el, exit); }, exit); }, 600); }
              else { lock = true; setTimeout(function () { [a, z].forEach(function (c2) { c2.open = false; c2.b.classList.remove('open'); c2.b.textContent = '？'; }); lock = false; }, 1100); }
            }
          });
        });
        st.innerHTML = '<span>0 手</span><span>0/6</span>';
      }
    } },
    { id: 'order', em: '🧩', name: 'ならべかえ', desc: '分裂・遷移・免疫などの順番を、正しい順にタップする（8 問）。', unit: '点', run: function (el, exit) {
      var st = head(el, '🧩 ならべかえ', exit), area = BL.el('div', { class: 'panel qbox' }); el.appendChild(area);
      var set = BL.shuffle(ORDERS).slice(0, 8), n = 0, score = 0;
      function q() {
        if (n >= set.length) { var nb = best('order', score, true); endScreen(el, 'ならべかえ（1問 最大10点）', score, '点', nb, function () { el.innerHTML = ''; BL.games[4].run(el, exit); }, exit); return; }
        var o = set[n], i = 0, miss = 0;
        area.innerHTML = '<div class="eyebrow">' + (n + 1) + ' / ' + set.length + '</div><div class="qtext">「' + o[0] + '」を正しい順にタップ</div>';
        var picked = BL.el('div', { class: 'picked' }); area.appendChild(picked);
        var g = BL.el('div', { class: 'qchoices' }); area.appendChild(g);
        BL.shuffle(o[1]).forEach(function (s) {
          var b = BL.el('button', { class: 'qc' }, s); g.appendChild(b);
          b.addEventListener('click', function () {
            if (s === o[1][i]) { i++; b.disabled = true; b.classList.add('dim'); picked.appendChild(BL.el('span', {}, s)); if (i === o[1].length) { var pts = Math.max(0, 10 - miss * 3); score += pts; st.innerHTML = '<span>' + score + ' 点</span>'; n++; setTimeout(q, 900); } }
            else { miss++; b.classList.add('flash-ng'); setTimeout(function () { b.classList.remove('flash-ng'); }, 400); }
          });
        });
      }
      st.innerHTML = '<span>0 点</span>'; q();
    } }
  ];
})();
