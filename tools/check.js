// 授業データのチェック：node tools/check.js
var fs = require('fs'), path = require('path'), vm = require('vm');
var SIMS = ['cell','enzyme','photo','dna','mitosis','sugar','immune','neuron','succession','biome','mendel','popgen','predator'];
var ctx = { window: {}, console: console }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/core.js'), 'utf8'), ctx);
var dir = path.join(__dirname, '../js/data'), err = 0;
fs.readdirSync(dir).filter(function (f) { return /\.js$/.test(f); }).sort().forEach(function (f) {
  try { vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { console.log('NG ' + f + ': ' + e.message); err++; }
});
var ids = {};
function bad(l, m) { console.log('NG ' + (l.id || '?') + ': ' + m); err++; }
ctx.BL.lessons.forEach(function (l) {
  ['id','subj','part','unit','title','lead'].forEach(function (k) { if (!l[k]) bad(l, k + ' がない'); });
  if (ids[l.id]) bad(l, 'id が重複'); ids[l.id] = 1;
  if (l.subj !== 'kiso' && l.subj !== 'bio') bad(l, 'subj');
  if (l.sim && SIMS.indexOf(l.sim) < 0) bad(l, 'sim 名 ' + l.sim);
  if (!l.slides || l.slides.length < 3) bad(l, 'slides が少ない');
  (l.slides || []).forEach(function (s, i) {
    if (!s.h || !s.html) bad(l, 'slide ' + i + ' h/html');
    if (s.sim && SIMS.indexOf(s.sim) < 0) bad(l, 'slide ' + i + ' sim 名 ' + s.sim);
    if (s.ask && (!s.ask.q || !s.ask.c || s.ask.c.length < 2 || !s.ask.e)) bad(l, 'slide ' + i + ' ask');
    var open = (s.html.match(/<(p|ul|ol|li|div|table|tr|td|th|b)\b/g) || []).length, close = (s.html.match(/<\/(p|ul|ol|li|div|table|tr|td|th|b)>/g) || []).length;
    if (open !== close) bad(l, 'slide ' + i + ' タグの数があわない ' + open + '/' + close);
  });
  if (!l.exam || !l.exam.length) bad(l, 'exam');
  if (!l.qs || l.qs.length !== 10) bad(l, 'qs は10問 (' + (l.qs || []).length + ')');
  (l.qs || []).forEach(function (q, i) {
    if (!q.q || !q.e || !q.c || q.c.length !== 4) bad(l, 'qs ' + i);
    else if (new Set(q.c).size !== 4) bad(l, 'qs ' + i + ' 選択肢が重複');
  });
  if (!l.terms || l.terms.length !== 8) bad(l, 'terms は8個');
  (l.terms || []).forEach(function (t, i) { if (!t.w || !t.d) bad(l, 'terms ' + i); });
});
var n = ctx.BL.lessons.length, q = ctx.BL.lessons.reduce(function (a, l) { return a + (l.qs || []).length; }, 0);
console.log((err ? 'エラー ' + err + ' 件' : 'OK') + '：授業 ' + n + '、問題 ' + q);
process.exit(err ? 1 : 0);
