/* 生物ラボ：🏆 クラス対戦（先生の大画面 ＋ 生徒のスマホ）
   ・🎯 クイズ大会：先生ペースの 4 択。早く正解するほど高得点。答えのあとに解説の図とランキング
   ・🚀 タイムアタック対戦：全員同じ順番の問題を、決めた時間でどんどん解く。ランキングがリアルタイムで動く
   Firebase Realtime Database の REST ＋ ストリーム（EventSource）。URL は js/config.js
   rooms/b{4けた} = { cfg, state: lobby|q|reveal|board|play|end, qi, qAt, startAt, players: { pid: { n, s, k, w, j } }, ans: { qi: { pid: c } } }
   英検ラボ（e）・論理表現ラボと同じデータベースなので、部屋の名前の頭に b をつけてぶつからないようにしている */
(function () {
  'use strict';
  var KEYP = 'b', S = BL.store, esc = BL.esc;
  var COL = [['▲', '#e0413a'], ['◆', '#2f6fd0'], ['●', '#d9a400'], ['■', '#2f9a4a']];
  var KINDS = [['quiz', '🎯 クイズ大会'], ['race', '🚀 タイムアタック対戦']];

  /* ---------- つながり ---------- */
  function base() {
    var u = String(S.get('battleDb', '') || (window.BL_CONFIG && BL_CONFIG.db) || '').trim().replace(/\/+$/, '');
    return /^https:\/\/\S+$/.test(u) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(u) ? u : '';
  }
  function pid() { var p = S.get('pid', ''); if (!p) { p = 'p' + Math.random().toString(36).slice(2, 10); S.set('pid', p); } return p; }
  function rpath(code) { return 'rooms/' + KEYP + code; }
  function api(method, path, body) {
    var o = { method: method };
    if (body !== undefined) o.body = JSON.stringify(body);
    return fetch(base() + '/' + path + '.json', o).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function listen(path, cb) {
    var tree = null, es = null, poll = null, closed = false;
    function setAt(p, val) {
      var keys = p.split('/').filter(Boolean);
      if (!keys.length) { tree = val; return; }
      if (tree === null || typeof tree !== 'object') tree = {};
      var o = tree;
      for (var i = 0; i < keys.length - 1; i++) { if (o[keys[i]] == null || typeof o[keys[i]] !== 'object') o[keys[i]] = {}; o = o[keys[i]]; }
      if (val === null) delete o[keys[keys.length - 1]]; else o[keys[keys.length - 1]] = val;
    }
    function net(ok) { document.body.classList.toggle('offline', !ok && !closed); }
    function startPoll() { if (poll || closed) return; poll = setInterval(function () { api('GET', path).then(function (v) { net(true); tree = v; cb(tree); }, function () { net(false); }); }, 1500); }
    try {
      es = new EventSource(base() + '/' + path + '.json');
      es.addEventListener('put', function (e) { net(true); var d = JSON.parse(e.data); setAt(d.path, d.data); cb(tree); });
      es.addEventListener('patch', function (e) { net(true); var d = JSON.parse(e.data), p = d.path.replace(/\/$/, ''); Object.keys(d.data || {}).forEach(function (k) { setAt(p + '/' + k, d.data[k]); }); cb(tree); });
      es.addEventListener('keep-alive', function () { net(true); });
      es.onerror = function () { net(false); if (es.readyState === 2) startPoll(); };
    } catch (e) { startPoll(); }
    return function () { closed = true; document.body.classList.remove('offline'); if (es) es.close(); clearInterval(poll); };
  }
  var OFF = 0;
  function now() { return Date.now() + OFF; }
  function syncClock(code) {
    var t0 = Date.now(), p = rpath(code) + '/clock/' + pid();
    return api('PUT', p, { '.sv': 'timestamp' }).then(function (ts) { var t1 = Date.now(); if (typeof ts === 'number') OFF = ts - (t0 + t1) / 2; api('DELETE', p).catch(function () {}); }, function () {});
  }
  function joinUrl(code) { var u = location.origin + location.pathname + '#battle/join/' + code; if (S.get('battleDb', '')) u += '?db=' + encodeURIComponent(base()); return u; }

  /* ---------- 問題（同じ seed なら、先生も生徒も同じ順番・同じ選択肢の並び） ---------- */
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function sh(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function partsOf(subj) { var out = [], seen = {}; BL.lessons.forEach(function (l) { if (subj !== 'all' && l.subj !== subj) return; var k = l.subj + ':' + l.part; if (!seen[k]) { seen[k] = 1; out.push({ k: l.id.split('-')[0], n: BL.SUBJ[l.subj] + ' ' + l.part, subj: l.subj }); } }); return out; }
  function pool(cfg) {
    var ps = String(cfg.p || '').split(',').filter(Boolean), out = [];
    BL.lessons.forEach(function (l) { if (ps.length ? ps.indexOf(l.id.split('-')[0]) >= 0 : (cfg.subj === 'all' || l.subj === cfg.subj)) l.qs.forEach(function (q, i) { out.push({ l: l, q: q, i: i }); }); });
    return sh(out, rng(+cfg.seed));
  }
  function sig(cfg) { var p = pool(cfg); return p.length + '|' + (p[0] ? p[0].l.id + p[0].i : ''); }
  function question(cfg, qi) {
    var p = pool(cfg); if (!p.length) return null;
    var it = p[qi % p.length], ord = sh([0, 1, 2, 3], rng(+cfg.seed + qi * 7919 + 1));
    return { it: it, ord: ord, ans: ord.indexOf(0) };
  }
  function figOf(it) { var i = BL.figFor(it.l, it.q.q + ' ' + it.q.c[0] + ' ' + it.q.e); return i >= 0 ? it.l.slides[i].fig.replace('<svg', '<svg class="svgfig"') : ''; }
  function ranked(room) { var ps = room && room.players || {}; return Object.keys(ps).map(function (k) { var p = ps[k]; return { id: k, n: p.n || '？', s: p.s || 0, k: p.k || 0, w: p.w || 0 }; }).sort(function (a, b) { return b.s - a.s || b.k - a.k; }); }

  /* ---------- 画面の部品 ---------- */
  function tag(t, cls) { return '<span class="bt-tag ' + (cls || '') + '">' + t + '</span>'; }
  function choiceBtns(qq, big) { return '<div class="bt-choices' + (big ? ' big' : '') + '">' + qq.ord.map(function (o, j) { return '<button class="bt-ch" data-j="' + j + '" style="--c:' + COL[j][1] + '"><span class="sym">' + COL[j][0] + '</span><span class="tx">' + esc(qq.it.q.c[o]) + '</span></button>'; }).join('') + '</div>'; }
  function board(list, me, top) {
    var mx = Math.max(1, list[0] ? list[0].s : 1);
    return '<ol class="bt-board">' + list.slice(0, top || 10).map(function (p, i) { return '<li class="' + (p.id === me ? 'me' : '') + '"><b class="rk">' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1) + '</b><span class="nm">' + esc(p.n) + '</span><i class="bar"><i style="width:' + Math.round(p.s / mx * 100) + '%"></i></i><b class="sc">' + p.s + '</b></li>'; }).join('') + '</ol>';
  }
  function timerBar(el, t0, ms) {
    var bar = el.querySelector('.bt-timer i'), num = el.querySelector('.bt-sec');
    var iv = setInterval(function () { var left = Math.max(0, t0 + ms - now()); if (bar) bar.style.width = (left / ms * 100) + '%'; if (num) num.textContent = Math.ceil(left / 1000); if (!document.body.contains(el)) clearInterval(iv); }, 100);
    return function () { clearInterval(iv); };
  }
  function loadQR(cb) {
    if (window.QRCode) return cb();
    var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'; s.onload = cb; s.onerror = function () {}; document.head.appendChild(s);
  }

  /* =========================================================
     入口（ハブ）
     ========================================================= */
  function hub(view) {
    var ok = !!base();
    view.innerHTML = '<div class="battle bt-hub"><div class="ghead"><button class="btn" data-go="#game">← ゲーム一覧</button><h2>🏆 クラス対戦</h2></div>' +
      '<div class="bt-two"><section class="panel bt-card"><div class="em">📱</div><h3>参加する（生徒）</h3><p class="note">先生の画面に出ている 4 けたの番号を入れよう</p><div class="bt-fld"><input id="jcode" inputmode="numeric" maxlength="4" placeholder="1234" autocomplete="off"><button class="btn main big" id="jgo">参加 →</button></div></section>' +
      '<section class="panel bt-card"><div class="em">🖥️</div><h3>部屋をつくる（先生）</h3><p class="note">大画面に映して、生徒はスマホで参加</p><button class="btn main big" data-go="#battle/host">部屋をつくる →</button>' + ((S.get('hostRooms', []) || []).slice(-2).reverse().map(function (c) { return '<button class="btn" data-go="#battle/host/' + c + '">↩ 部屋 ' + c + ' にもどる</button>'; }).join('')) + '</section></div>' +
      '<details class="bt-db"><summary>⚙ データベース' + (ok ? '（接続先あり）' : '（未設定）') + '</summary><p class="note">ふだんは設定不要です（js/config.js の URL を使います）。自分の Firebase Realtime Database を使うときだけ入れてください。</p><div class="bt-fld"><input id="dbu" placeholder="https://〇〇-default-rtdb.firebaseio.com" value="' + esc(S.get('battleDb', '')) + '"><button class="btn" id="dbs">保存</button></div></details></div>';
    view.querySelectorAll('[data-go]').forEach(function (b) { b.onclick = function () { location.hash = b.dataset.go; }; });
    var inp = view.querySelector('#jcode');
    function go() { var c = inp.value.replace(/\D/g, ''); if (c.length === 4) location.hash = '#battle/join/' + c; else inp.focus(); }
    view.querySelector('#jgo').onclick = go; inp.onkeydown = function (e) { if (e.key === 'Enter') go(); };
    view.querySelector('#dbs').onclick = function () { S.set('battleDb', view.querySelector('#dbu').value.trim()); hub(view); };
  }

  /* =========================================================
     先生（ホスト）
     ========================================================= */
  function host(view, code) {
    if (!base()) { view.innerHTML = '<div class="battle"><p>データベースが設定されていません。</p></div>'; return; }
    var stop = null, room = null, timers = [], busy = false, last = '';
    if (!code) {
      var cfg = S.get('battleCfg', { kind: 'quiz', subj: 'kiso', p: '', qn: 10, qt: 20, dur: 120, top: 10 });
      return setup(view, cfg, function (c) {
        var tryCode = function (n) {
          var cc = String(1000 + Math.floor(Math.random() * 9000));
          return api('GET', rpath(cc) + '/state').then(function (st) {
            if (st && n < 6) return tryCode(n + 1);
            c.seed = Math.floor(Math.random() * 1e9); c.sig = sig(c);
            return api('PUT', rpath(cc), { cfg: c, state: 'lobby', qi: 0, created: { '.sv': 'timestamp' }, host: pid() }).then(function () { var h = S.get('hostRooms', []); h.push(cc); S.set('hostRooms', h.slice(-5)); location.hash = '#battle/host/' + cc; });
          });
        };
        tryCode(0).catch(function (e) { alert('データベースにつながりません：' + e.message); });
      });
    }
    syncClock(code);
    view.innerHTML = '<div class="battle bt-host"><div class="bt-top"><button class="btn" id="hx">✕ 閉じる</button><div class="bt-code">部屋 <b>' + code + '</b></div><div class="bt-mode"></div><div class="bt-count"></div></div><div class="bt-stage"></div></div>';
    var stage = view.querySelector('.bt-stage');
    view.querySelector('#hx').onclick = function () { if (confirm('部屋を閉じますか？（参加者の画面も終わります）')) api('PATCH', rpath(code), { state: 'closed' }).then(function () { location.hash = '#battle'; }); };
    function set(o) { return api('PATCH', rpath(code), o); }
    function clearT() { timers.forEach(function (f) { f(); }); timers = []; }
    stop = listen(rpath(code), function (r) {
      room = r; if (!r) { stage.innerHTML = '<p>部屋が見つかりません。</p>'; return; }
      var list = ranked(r);
      view.querySelector('.bt-count').textContent = '👥 ' + list.length + ' 人';
      view.querySelector('.bt-mode').textContent = r.cfg.kind === 'race' ? '🚀 タイムアタック対戦' : '🎯 クイズ大会';
      var key = r.state + ':' + r.qi + ':' + (r.qAt || '') + ':' + (r.startAt || '');
      if (key !== last) { last = key; clearT(); draw(r, list); } else update(r, list);
    });
    function draw(r, list) {
      var c = r.cfg;
      if (r.state === 'lobby') {
        stage.innerHTML = '<div class="bt-lobby"><div class="bt-join"><div class="eyebrow">スマホで参加</div><div class="bt-big">' + code + '</div><div class="bt-url">' + esc(joinUrl(code).replace(/^https?:\/\//, '')) + '</div><div id="qr"></div><p class="note">ゲーム → 🏆 クラス対戦 → 番号を入力</p></div><div class="bt-wait"><h3>参加した人</h3><div class="bt-names"></div><div class="bt-info">' + tag(c.kind === 'race' ? '🚀 ' + c.dur + ' 秒' : '🎯 ' + c.qn + ' 問・' + c.qt + ' 秒') + tag(rangeName(c)) + '</div><button class="btn main big" id="hs">▶ スタート</button></div></div>';
        loadQR(function () { var q = stage.querySelector('#qr'); if (q && window.QRCode) { q.innerHTML = ''; new QRCode(q, { text: joinUrl(code), width: 168, height: 168 }); } });
        stage.querySelector('#hs').onclick = function () {
          if (!ranked(room).length && !confirm('まだだれも参加していません。スタートしますか？')) return;
          if (c.kind === 'race') set({ state: 'play', startAt: now() + 4000 }); else set({ state: 'q', qi: 0, qAt: now() + 3000, ans: null });
        };
        update(r, list);
      } else if (r.state === 'q') {
        var qq = question(c, r.qi);
        stage.innerHTML = '<div class="bt-q"><div class="bt-qh">' + tag('第 ' + (r.qi + 1) + ' / ' + c.qn + ' 問') + tag(esc(qq.it.l.unit + ' ' + qq.it.l.title), 'muted') + '<span class="bt-sec"></span><span class="bt-ans">0 人が回答</span></div><div class="bt-timer"><i></i></div><div class="bt-qt">' + esc(qq.it.q.q) + '</div>' + choiceBtns(qq, true) + '<div class="row" style="justify-content:flex-end"><button class="btn" id="hr">答えを見る →</button></div></div>';
        stage.querySelectorAll('.bt-ch').forEach(function (b) { b.disabled = true; });
        stage.querySelector('#hr').onclick = function () { set({ state: 'reveal' }); };
        var wait = r.qAt - now();
        if (wait > 0) { stage.querySelector('.bt-q').classList.add('ready'); stage.insertAdjacentHTML('afterbegin', '<div class="bt-ready">' + Math.ceil(wait / 1000) + '</div>'); var rv = setInterval(function () { var w = r.qAt - now(), el = stage.querySelector('.bt-ready'); if (!el) return clearInterval(rv); if (w <= 0) { el.remove(); stage.querySelector('.bt-q').classList.remove('ready'); clearInterval(rv); } else el.textContent = Math.ceil(w / 1000); }, 100); timers.push(function () { clearInterval(rv); }); }
        timers.push(timerBar(stage, r.qAt, c.qt * 1000));
        var iv = setInterval(function () { if (busy) return; var n = Object.keys((room.ans || {})[room.qi] || {}).length, tot = ranked(room).length; if (now() > room.qAt + c.qt * 1000 + 300 || (tot && n >= tot)) { busy = true; set({ state: 'reveal' }).then(function () { busy = false; }, function () { busy = false; }); clearInterval(iv); } }, 250);
        timers.push(function () { clearInterval(iv); });
        update(r, list);
      } else if (r.state === 'reveal') {
        var q2 = question(c, r.qi), ans = (r.ans || {})[r.qi] || {}, cnt = [0, 0, 0, 0], tot = 0;
        Object.keys(ans).forEach(function (k) { var v = ans[k]; if (v >= 0 && v < 4) { cnt[v]++; tot++; } });
        var mx = Math.max(1, Math.max.apply(null, cnt)), okN = cnt[q2.ans];
        stage.innerHTML = '<div class="bt-rev"><div class="bt-qh">' + tag('第 ' + (r.qi + 1) + ' 問の答え') + '<span class="bt-rate">正解 ' + okN + ' / ' + list.length + ' 人</span></div><div class="bt-qt sm">' + esc(q2.it.q.q) + '</div><div class="bt-dist">' + q2.ord.map(function (o, j) { return '<div class="d' + (j === q2.ans ? ' ok' : '') + '" style="--c:' + COL[j][1] + '"><i style="height:' + (cnt[j] / mx * 100) + '%"></i><b>' + cnt[j] + '</b><span>' + COL[j][0] + ' ' + esc(q2.it.q.c[o]) + (j === q2.ans ? ' ✔' : '') + '</span></div>'; }).join('') + '</div><div class="bt-expl"><div><b>解説</b><p>' + esc(q2.it.q.e) + '</p></div><div class="bt-fig">' + figOf(q2.it) + '</div></div><div class="row" style="justify-content:flex-end"><button class="btn main big" id="hb">ランキング →</button></div></div>';
        stage.querySelector('#hb').onclick = function () { set({ state: 'board' }); };
      } else if (r.state === 'board') {
        var lastQ = r.qi + 1 >= c.qn;
        stage.innerHTML = '<div class="bt-rank"><h3>🏆 ランキング（' + (r.qi + 1) + ' / ' + c.qn + ' 問）</h3>' + board(list, null, c.top || 10) + '<div class="row" style="justify-content:flex-end"><button class="btn main big" id="hn">' + (lastQ ? '🏁 結果発表 →' : '次の問題 →') + '</button></div></div>';
        stage.querySelector('#hn').onclick = function () { if (lastQ) set({ state: 'end' }); else set({ state: 'q', qi: r.qi + 1, qAt: now() + 3000 }); };
      } else if (r.state === 'play') {
        stage.innerHTML = '<div class="bt-race"><div class="bt-qh">' + tag('🚀 タイムアタック対戦') + tag(rangeName(c), 'muted') + '<span class="bt-sec big"></span></div><div class="bt-timer"><i></i></div><div class="bt-live"></div></div>';
        var t0 = r.startAt;
        if (t0 > now()) { stage.insertAdjacentHTML('afterbegin', '<div class="bt-ready"></div>'); var cd = setInterval(function () { var el = stage.querySelector('.bt-ready'); if (!el) return clearInterval(cd); var w = t0 - now(); if (w <= 0) { el.remove(); clearInterval(cd); } else el.textContent = Math.ceil(w / 1000); }, 100); timers.push(function () { clearInterval(cd); }); }
        timers.push(timerBar(stage, t0, c.dur * 1000));
        var iv2 = setInterval(function () { if (now() > t0 + c.dur * 1000 + 1500 && !busy) { busy = true; clearInterval(iv2); set({ state: 'end' }).then(function () { busy = false; }); } }, 300);
        timers.push(function () { clearInterval(iv2); });
        update(r, list);
      } else if (r.state === 'end') {
        var p3 = list.slice(0, 3);
        stage.innerHTML = '<div class="bt-end"><h3>🎉 結果発表</h3><div class="bt-podium">' + [1, 0, 2].map(function (i) { var p = p3[i]; return p ? '<div class="pd pd' + (i + 1) + '"><div class="pn">' + esc(p.n) + '</div><div class="ps">' + p.s + ' 点</div><div class="pb">' + ['🥇', '🥈', '🥉'][i] + '</div></div>' : '<div class="pd"></div>'; }).join('') + '</div>' + board(list, null, 99) + '<div class="row" style="justify-content:center"><button class="btn main big" id="ha">🔁 同じメンバーでもう一度</button><button class="btn big" id="hset">⚙ 設定を変えて新しい部屋</button></div></div>';
        stage.querySelector('#ha').onclick = function () { var ps = {}; Object.keys(r.players || {}).forEach(function (k) { ps[k] = { n: r.players[k].n, s: 0, k: 0, w: 0, j: r.players[k].j || 0 }; }); var nc = Object.assign({}, c, { seed: Math.floor(Math.random() * 1e9) }); api('PUT', rpath(code), { cfg: nc, state: 'lobby', qi: 0, players: ps, host: pid() }); };
        stage.querySelector('#hset').onclick = function () { location.hash = '#battle/host'; };
      } else if (r.state === 'closed') stage.innerHTML = '<p>この部屋は閉じました。</p>';
    }
    function update(r, list) {
      if (r.state === 'lobby') { var el = stage.querySelector('.bt-names'); if (el) { el.innerHTML = list.length ? list.map(function (p) { return '<button class="bt-name" data-pid="' + p.id + '" title="タップで退出させる">' + esc(p.n) + '</button>'; }).join('') : '<span class="note">待っています…</span>'; el.querySelectorAll('[data-pid]').forEach(function (b) { b.onclick = function () { if (confirm('「' + b.textContent + '」を部屋から退出させますか？（名前を入れなおしてもらいます）')) api('DELETE', rpath(code) + '/players/' + b.dataset.pid); }; }); } }
      if (r.state === 'q') { var a = stage.querySelector('.bt-ans'); if (a) a.textContent = Object.keys((r.ans || {})[r.qi] || {}).length + ' / ' + list.length + ' 人が回答'; }
      if (r.state === 'play') { var lv = stage.querySelector('.bt-live'); if (lv) lv.innerHTML = board(list, null, r.cfg.top || 10); }
    }
    return function () { clearT(); if (stop) stop(); };
  }
  function rangeName(c) { var ps = String(c.p || '').split(',').filter(Boolean); if (!ps.length) return c.subj === 'all' ? '生物基礎＋生物 ぜんぶ' : BL.SUBJ[c.subj] + ' ぜんぶ'; var all = partsOf('all'); return ps.map(function (k) { var x = all.filter(function (a) { return a.k === k; })[0]; return x ? x.n.replace(/\s.*?第/, ' 第').replace(/編.*/, '編') : k; }).join('・'); }
  function setup(view, cfg, onCreate) {
    function seg(label, key, opts) { return '<div class="bt-row"><span>' + label + '</span><div class="seg">' + opts.map(function (o) { return '<button data-k="' + key + '" data-v="' + o[0] + '" aria-pressed="' + (String(cfg[key]) === String(o[0])) + '">' + o[1] + '</button>'; }).join('') + '</div></div>'; }
    function render() {
      var ps = partsOf(cfg.subj), sel = String(cfg.p || '').split(',').filter(Boolean);
      view.innerHTML = '<div class="battle bt-setup"><div class="ghead"><button class="btn" id="sb">← もどる</button><h2>🖥️ 部屋をつくる</h2></div><section class="panel bt-card">' +
        seg('あそびかた', 'kind', KINDS) + seg('科目', 'subj', [['kiso', '生物基礎'], ['bio', '生物'], ['all', '両方']]) +
        '<div class="bt-row"><span>範囲</span><div class="chips">' + ps.map(function (p) { return '<button class="chip" data-p="' + p.k + '" aria-pressed="' + (sel.indexOf(p.k) >= 0) + '">' + esc(p.n.replace(/^生物基礎 |^生物 /, cfg.subj === 'all' ? (p.subj === 'kiso' ? '基礎 ' : '生物 ') : '')) + '</button>'; }).join('') + '</div></div><p class="note" style="margin:0 0 6px 7em">何もえらばないと、その科目ぜんぶから出ます</p>' +
        (cfg.kind === 'quiz' ? seg('問題の数', 'qn', [[5, '5 問'], [10, '10 問'], [15, '15 問'], [20, '20 問']]) + seg('1問の時間', 'qt', [[10, '10 秒'], [20, '20 秒'], [30, '30 秒']]) : seg('時間', 'dur', [[60, '1 分'], [90, '1 分半'], [120, '2 分'], [180, '3 分'], [300, '5 分']])) +
        seg('ランキング', 'top', [[3, '上位 3 人'], [5, '上位 5 人'], [10, '上位 10 人'], [99, '全員']]) +
        '<div class="row" style="margin-top:12px"><button class="btn main big" id="sc">部屋をつくる →</button><span class="note">問題 ' + pool(Object.assign({}, cfg, { seed: 1 })).length + ' 問から出題</span></div></section></div>';
      view.querySelector('#sb').onclick = function () { location.hash = '#battle'; };
      view.querySelectorAll('[data-k]').forEach(function (b) { b.onclick = function () { var v = b.dataset.v; cfg[b.dataset.k] = isNaN(+v) ? v : +v; if (b.dataset.k === 'subj') cfg.p = ''; S.set('battleCfg', cfg); render(); }; });
      view.querySelectorAll('[data-p]').forEach(function (b) { b.onclick = function () { var s2 = String(cfg.p || '').split(',').filter(Boolean), i = s2.indexOf(b.dataset.p); if (i >= 0) s2.splice(i, 1); else s2.push(b.dataset.p); cfg.p = s2.join(','); S.set('battleCfg', cfg); render(); }; });
      view.querySelector('#sc').onclick = function () { this.disabled = true; onCreate(Object.assign({}, cfg)); };
    }
    render();
  }

  /* =========================================================
     生徒（参加）
     ========================================================= */
  function join(view, code) {
    var m = location.hash.match(/\?db=([^&]+)/); if (m) S.set('battleDb', decodeURIComponent(m[1]));
    if (!base()) { view.innerHTML = '<div class="battle"><p>データベースが設定されていません。</p></div>'; return; }
    var name = S.get('battleName', ''), stop = null, room = null, last = '', timers = [], me = pid(), joinedOnce = false;
    function ask() {
      view.innerHTML = '<div class="battle bt-joinf"><section class="panel bt-card"><div class="em">📱</div><h3>部屋 ' + code + ' に参加</h3><div class="bt-fld"><input id="nm" maxlength="12" placeholder="なまえ（ニックネーム）" value="' + esc(name) + '"><button class="btn main big" id="ng">参加 →</button></div><p class="note">ほかの人に見えるので、本名でなくてもOK</p></section></div>';
      var inp = view.querySelector('#nm'); inp.focus();
      function go() { var n = inp.value.trim().slice(0, 12); if (!n) return inp.focus(); name = n; S.set('battleName', n); enter(); }
      view.querySelector('#ng').onclick = go; inp.onkeydown = function (e) { if (e.key === 'Enter') go(); };
    }
    function enter() {
      view.innerHTML = '<div class="battle bt-player"><div class="bt-top"><span class="bt-code">部屋 <b>' + code + '</b></span><span class="bt-me">' + esc(name) + '</span><span class="bt-myscore">0 点</span></div><div class="bt-stage"></div></div>';
      api('GET', rpath(code) + '/state').then(function (st) {
        if (!st) { view.querySelector('.bt-stage').innerHTML = '<p class="bt-msg">部屋 ' + code + ' が見つかりません。番号を確かめてね。</p><button class="btn" onclick="location.hash=\'#battle\'">もどる</button>'; return; }
        syncClock(code);
        return api('PATCH', rpath(code) + '/players/' + me, { n: name, j: { '.sv': 'timestamp' } }).then(function () {
          stop = listen(rpath(code), function (r) {
            room = r; if (!r) return;
            var mine = (r.players || {})[me];
            if (!mine && r.state === 'lobby' && joinedOnce) { if (stop) stop(); stop = null; last = ''; S.set('battleJoined', ''); name = ''; alert('先生が名前を消しました。名前を入れなおしてください。'); ask(); return; }
            if (mine) joinedOnce = true;
            view.querySelector('.bt-myscore').textContent = (mine ? mine.s || 0 : 0) + ' 点';
            var key = r.state + ':' + r.qi + ':' + (r.qAt || '') + ':' + (r.startAt || '') + ':' + (r.cfg && r.cfg.seed);
            if (key !== last) { last = key; timers.forEach(function (f) { f(); }); timers = []; draw(r); }
          });
        });
      }).catch(function () { view.querySelector('.bt-stage').innerHTML = '<p class="bt-msg">つながりません。電波を確かめて、もう一度。</p>'; });
    }
    function stage() { return view.querySelector('.bt-stage'); }
    function myRank(r) { var l = ranked(r); for (var i = 0; i < l.length; i++) if (l[i].id === me) return [i + 1, l.length, l[i]]; return [0, l.length, { s: 0 }]; }
    function draw(r) {
      var c = r.cfg, st = stage();
      if (c.sig && c.sig !== sig(c)) { st.innerHTML = '<p class="bt-msg">⚠ 先生の画面とアプリの内容がちがいます。ページを再読み込みしてください。</p>'; return; }
      if (r.state === 'lobby') st.innerHTML = '<div class="bt-msg"><div class="em">⏳</div><b>参加しました！</b><p>先生がスタートするまで待ってね</p><p class="note">' + (c.kind === 'race' ? '🚀 タイムアタック対戦（' + c.dur + ' 秒）' : '🎯 クイズ大会（' + c.qn + ' 問）') + '</p></div>';
      else if (r.state === 'q') {
        var qq = question(c, r.qi), done = ((r.ans || {})[r.qi] || {})[me] != null;
        if (done) { st.innerHTML = '<div class="bt-msg"><div class="em">✅</div><b>回答しました</b><p>みんなの回答を待っています…</p></div>'; return; }
        st.innerHTML = '<div class="bt-pq"><div class="bt-qh">' + tag('第 ' + (r.qi + 1) + ' / ' + c.qn + ' 問') + '<span class="bt-sec"></span></div><div class="bt-timer"><i></i></div><div class="bt-qt">' + esc(qq.it.q.q) + '</div>' + choiceBtns(qq) + '</div>';
        var lock = function (on) { st.querySelectorAll('.bt-ch').forEach(function (b) { b.disabled = on; }); };
        if (r.qAt > now()) { lock(true); st.insertAdjacentHTML('afterbegin', '<div class="bt-ready sm"></div>'); var rv = setInterval(function () { var el = st.querySelector('.bt-ready'); if (!el) return clearInterval(rv); var w = r.qAt - now(); if (w <= 0) { el.remove(); lock(false); clearInterval(rv); } else el.textContent = Math.ceil(w / 1000); }, 100); timers.push(function () { clearInterval(rv); }); }
        timers.push(timerBar(st, r.qAt, c.qt * 1000));
        st.querySelectorAll('.bt-ch').forEach(function (b) {
          b.onclick = function () {
            var j = +b.dataset.j, el = now() - r.qAt, ok = j === qq.ans, pts = ok ? Math.round(1000 - 500 * Math.min(1, Math.max(0, el) / (c.qt * 1000))) : 0;
            lock(true); b.classList.add('picked');
            var mine = (room.players || {})[me] || {};
            S.set('btLast', { code: code, qi: r.qi, seed: c.seed, j: j, ok: ok, pts: pts });
            api('PUT', rpath(code) + '/ans/' + r.qi + '/' + me, j);
            api('PATCH', rpath(code) + '/players/' + me, { s: (mine.s || 0) + pts, k: (mine.k || 0) + (ok ? 1 : 0) });
            st.innerHTML = '<div class="bt-msg"><div class="em">✅</div><b>回答しました</b><p>みんなの回答を待っています…</p></div>';
          };
        });
      } else if (r.state === 'reveal') {
        var q2 = question(c, r.qi), lastA = S.get('btLast', {}), mineA = lastA.code === code && lastA.qi === r.qi && lastA.seed === c.seed ? lastA : null, rk = myRank(r);
        BL.bigMark && mineA && BL.bigMark(mineA.ok);
        st.innerHTML = '<div class="bt-pres ' + (mineA ? (mineA.ok ? 'ok' : 'ng') : 'none') + '"><div class="big">' + (mineA ? (mineA.ok ? '◯ 正解！ +' + mineA.pts : '✕ ざんねん') : '⏰ 時間切れ') + '</div><p>答え：<b style="color:' + COL[q2.ans][1] + '">' + COL[q2.ans][0] + ' ' + esc(q2.it.q.c[0]) + '</b></p><p class="note">' + esc(q2.it.q.e) + '</p><details class="ansfig"><summary>📊 図で確かめる</summary><div class="ansfig-in">' + figOf(q2.it) + '</div></details><div class="bt-myrank">いま <b>' + rk[0] + '</b> 位 / ' + rk[1] + ' 人</div></div>';
      } else if (r.state === 'board') { var rk2 = myRank(r); st.innerHTML = '<div class="bt-msg"><div class="em">🏆</div><p>いまの順位</p><div class="bt-bigrank">' + rk2[0] + ' 位</div><p>' + rk2[2].s + ' 点</p></div>'; }
      else if (r.state === 'play') race(r);
      else if (r.state === 'end') { var rk3 = myRank(r); st.innerHTML = '<div class="bt-msg"><div class="em">' + (rk3[0] === 1 ? '🥇' : rk3[0] === 2 ? '🥈' : rk3[0] === 3 ? '🥉' : '🎉') + '</div><b>おつかれさま！</b><div class="bt-bigrank">' + rk3[0] + ' 位</div><p>' + rk3[2].s + ' 点（正解 ' + (rk3[2].k || 0) + ' 問）</p><p class="note">先生の画面で結果発表を見よう</p></div>'; }
      else if (r.state === 'closed') st.innerHTML = '<div class="bt-msg"><b>部屋が閉じられました</b><button class="btn" onclick="location.hash=\'#battle\'">もどる</button></div>';
    }
    function race(r) {
      var c = r.cfg, st = stage(), qi = S.get('btRace', {}), key = code + ':' + c.seed + ':' + r.startAt;
      var my = qi.key === key ? qi : { key: key, n: 0, s: 0, k: 0, w: 0, st: 0 };
      function save() { S.set('btRace', my); }
      st.innerHTML = '<div class="bt-pq"><div class="bt-qh">' + tag('🚀 タイムアタック') + '<span class="bt-streak"></span><span class="bt-sec"></span></div><div class="bt-timer"><i></i></div><div class="bt-body"></div></div>';
      timers.push(timerBar(st, r.startAt, c.dur * 1000));
      var body = st.querySelector('.bt-body'), endT = r.startAt + c.dur * 1000, lockUntil = 0;
      function next() {
        if (now() >= endT) { body.innerHTML = '<div class="bt-msg"><div class="em">🏁</div><b>終了！</b><p>' + my.s + ' 点（正解 ' + my.k + '）</p></div>'; return; }
        var qq = question(c, my.n);
        body.innerHTML = '<div class="bt-qt">' + esc(qq.it.q.q) + '</div>' + choiceBtns(qq);
        body.querySelectorAll('.bt-ch').forEach(function (b) {
          b.onclick = function () {
            if (now() < lockUntil || now() >= endT) return;
            var ok = +b.dataset.j === qq.ans;
            if (ok) { my.st++; my.k++; my.s += 10 + Math.min(my.st - 1, 5) * 2; b.classList.add('right'); } else { my.st = 0; my.w++; b.classList.add('wrong'); lockUntil = now() + 1500; body.querySelectorAll('.bt-ch')[qq.ans].classList.add('right'); }
            my.n++; save();
            st.querySelector('.bt-streak').textContent = my.st >= 2 ? '🔥 ' + my.st : '';
            view.querySelector('.bt-myscore').textContent = my.s + ' 点';
            api('PATCH', rpath(code) + '/players/' + me, { s: my.s, k: my.k, w: my.w });
            setTimeout(next, ok ? 250 : 1500);
          };
        });
      }
      function wait() {
        var w = r.startAt - now();
        if (w > 0) { body.innerHTML = '<div class="bt-ready sm" style="position:static">' + Math.ceil(w / 1000) + '</div>'; var t = setTimeout(wait, 150); timers.push(function () { clearTimeout(t); }); }
        else next();
      }
      wait();
      var endTimer = setInterval(function () { if (now() >= endT) { clearInterval(endTimer); next(); } }, 300);
      timers.push(function () { clearInterval(endTimer); });
    }
    if (name && S.get('battleJoined', '') === code) enter(); else { ask(); S.set('battleJoined', code); }
    return function () { timers.forEach(function (f) { f(); }); if (stop) stop(); };
  }

  BL.renderBattle = function (view, parts) {
    if (parts[1] === 'host') return host(view, parts[2]);
    if (parts[1] === 'join' && /^\d{4}/.test(parts[2] || '')) return join(view, parts[2].slice(0, 4));
    hub(view);
  };
})();
