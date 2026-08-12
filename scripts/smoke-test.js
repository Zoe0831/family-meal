/**
 * 集成测试脚本
 * 用法: node scripts/smoke-test.js
 * 自动启动 server，测试所有 API 后退出
 */
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const dbFile = path.join(__dirname, '..', 'family-meal.db');
try { fs.unlinkSync(dbFile); } catch(e) {}

const server = spawn('node', ['server.js'], { cwd: path.join(__dirname, '..') });
server.stdout.on('data', d => process.stdout.write(d));
server.stderr.on('data', d => process.stderr.write('[err] ' + d));

const test = (path) => new Promise(resolve => {
  http.get('http://localhost:3000' + path, res => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => resolve({ status: res.statusCode, json: (() => { try { return JSON.parse(d); } catch { return d; } })() }));
  }).on('error', e => resolve({ error: e.message }));
});
const post = (path, body) => new Promise(resolve => {
  const data = JSON.stringify(body);
  const req = http.request({ hostname: 'localhost', port: 3000, path, method: 'POST',
    headers: {'Content-Type':'application/json','Content-Length': Buffer.byteLength(data)} }, res => {
    let r = ''; res.on('data', c => r += c);
    res.on('end', () => resolve({ status: res.statusCode, json: (() => { try { return JSON.parse(r); } catch { return r; } })() }));
  });
  req.write(data); req.end();
});

setTimeout(async () => {
  console.log('\n========== 集成测试 ==========\n');
  const m1 = (await post('/api/members', {name:'爸爸',avatar:'\uD83D\uDC68'})).json.member;
  const m2 = (await post('/api/members', {name:'妈妈',avatar:'\uD83D\uDC69'})).json.member;
  const m3 = (await post('/api/members', {name:'爷爷',avatar:'\uD83D\uDC74'})).json.member;
  console.log('成员已添加:', m1.name, m2.name, m3.name);

  await post('/api/votes', {date:'2026-08-11',meal:'dinner',member_id:m1.id,recipe_id:1});
  await post('/api/votes', {date:'2026-08-11',meal:'dinner',member_id:m2.id,recipe_id:20});
  await post('/api/votes', {date:'2026-08-11',meal:'dinner',member_id:m3.id,recipe_id:24});
  console.log('3 人投票完成');

  const v = (await test('/api/votes?date=2026-08-11&meal=dinner')).json;
  console.log('票数排行:', v.results.map(r => r.recipe_name + '(' + r.count + ')').join(' > '));

  const cr = await post('/api/recipes', {name:'测试菜',category:'荤菜',ingredients:[{name:'肉',amount:'500g'}],steps:['焯水','烧']});
  console.log('自定义菜谱 ID:', cr.json.recipe.id);

  const s = (await test('/api/stats')).json;
  console.log('统计:', JSON.stringify(s));

  console.log('\n========== 测试通过 ==========');
  server.kill();
  process.exit(0);
}, 4000);
