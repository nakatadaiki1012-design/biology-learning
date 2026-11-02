// ファイルの中身から版番号（?v=…）をつくり、index.html の読みこみに付ける
// 更新したあと、古いファイルがブラウザに残って先生と生徒で内容がずれるのを防ぐ。
// 使い方：node tools/bust.js（コミットの前に）
var fs = require('fs'), path = require('path'), crypto = require('crypto');
var root = path.join(__dirname, '..'), idx = path.join(root, 'index.html'), html = fs.readFileSync(idx, 'utf8'), n = 0;
html = html.replace(/(src|href)="((?:js|css)\/[^"?]+)(\?v=[^"]*)?"/g, function (m, attr, file) {
  var p = path.join(root, file); if (!fs.existsSync(p)) return m;
  var h = crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex').slice(0, 8); n++;
  return attr + '="' + file + '?v=' + h + '"';
});
fs.writeFileSync(idx, html);
console.log('版番号をつけました：' + n + ' ファイル');
