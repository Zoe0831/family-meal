const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 工具函数
const parseJSON = (s, fb) => { try { return JSON.parse(s); } catch { return fb; } };
const formatRecipe = (r) => ({
  id: r.id, name: r.name, category: r.category, cuisine: r.cuisine,
  difficulty: r.difficulty, cook_time: r.cook_time, servings: r.servings,
  ingredients: parseJSON(r.ingredients, []), steps: parseJSON(r.steps, []),
  tags: parseJSON(r.tags, []), tips: r.tips, image: r.image,
  is_preset: !!r.is_preset, created_at: r.created_at
});

// ===== 菜谱 API =====
app.get('/api/recipes', (req, res) => {
  const { q, category, cuisine, is_preset, sort = 'name' } = req.query;
  let sql = 'SELECT * FROM recipes WHERE 1=1';
  const params = [];
  if (q) { sql += ' AND (name LIKE ? OR tags LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (cuisine) { sql += ' AND cuisine = ?'; params.push(cuisine); }
  if (is_preset !== undefined) { sql += ' AND is_preset = ?'; params.push(is_preset === 'true' ? 1 : 0); }
  sql += ' ORDER BY ' + (sort === 'time' ? 'cook_time' : 'name') + ' ASC';
  const rows = db.prepare(sql).all(...params);
  res.json({ total: rows.length, items: rows.map(formatRecipe) });
});

app.get('/api/recipes/categories', (req, res) => {
  const list = db.prepare('SELECT category, COUNT(*) as cnt FROM recipes GROUP BY category ORDER BY cnt DESC').all();
  res.json(list);
});

app.get('/api/recipes/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '菜谱不存在' });
  res.json(formatRecipe(row));
});

app.post('/api/recipes', (req, res) => {
  const { name, category, cuisine, difficulty, cook_time, servings, ingredients, steps, tags, tips, image } = req.body;
  if (!name || !category || !ingredients || !steps) return res.status(400).json({ error: '菜名/分类/食材/步骤 不能为空' });
  const result = db.prepare(`INSERT INTO recipes (name, category, cuisine, difficulty, cook_time, servings, ingredients, steps, tags, tips, image, is_preset) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`).run(name, category, cuisine || '家常菜', difficulty || 2, cook_time || 30, servings || 3, JSON.stringify(ingredients), JSON.stringify(steps), JSON.stringify(tags || []), tips || '', image || '🍲');
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(result.lastInsertRowid);
  res.json({ ok: true, recipe: formatRecipe(row) });
});

app.put('/api/recipes/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '菜谱不存在' });
  if (row.is_preset) return res.status(403).json({ error: '预置菜谱不可编辑' });
  const { name, category, cuisine, difficulty, cook_time, servings, ingredients, steps, tags, tips, image } = req.body;
  db.prepare('UPDATE recipes SET name=?, category=?, cuisine=?, difficulty=?, cook_time=?, servings=?, ingredients=?, steps=?, tags=?, tips=?, image=? WHERE id=?').run(name, category, cuisine, difficulty, cook_time, servings, JSON.stringify(ingredients), JSON.stringify(steps), JSON.stringify(tags), tips, image, req.params.id);
  const updated = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  res.json({ ok: true, recipe: formatRecipe(updated) });
});

app.delete('/api/recipes/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: '菜谱不存在' });
  if (row.is_preset) return res.status(403).json({ error: '预置菜谱不可删除' });
  db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ===== 成员 API =====
app.get('/api/members', (req, res) => {
  const rows = db.prepare('SELECT * FROM members ORDER BY id ASC').all();
  res.json(rows);
});

app.post('/api/members', (req, res) => {
  const { name, avatar } = req.body;
  if (!name) return res.status(400).json({ error: '名字不能为空' });
  try {
    const result = db.prepare('INSERT INTO members (name, avatar) VALUES (?, ?)').run(name, avatar || '👤');
    const row = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
    res.json({ ok: true, member: row });
  } catch (e) { res.status(400).json({ error: '名字已存在' }); }
});

app.delete('/api/members/:id', (req, res) => {
  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ===== 投票 API =====
app.get('/api/votes', (req, res) => {
  const { date, meal } = req.query;
  if (!date || !meal) return res.status(400).json({ error: 'date 和 meal 必填' });
  const rows = db.prepare(`SELECT v.*, m.name as member_name, m.avatar as member_avatar, r.name as recipe_name, r.image as recipe_image, r.category as recipe_category FROM votes v JOIN members m ON v.member_id = m.id JOIN recipes r ON v.recipe_id = r.id WHERE v.vote_date = ? AND v.meal = ? ORDER BY v.created_at ASC`).all(date, meal);
  const tally = {};
  rows.forEach(v => {
    if (!tally[v.recipe_id]) tally[v.recipe_id] = { recipe_id: v.recipe_id, recipe_name: v.recipe_name, recipe_image: v.recipe_image, recipe_category: v.recipe_category, count: 0, voters: [] };
    tally[v.recipe_id].count++;
    tally[v.recipe_id].voters.push({ id: v.member_id, name: v.member_name, avatar: v.member_avatar });
  });
  const results = Object.values(tally).sort((a, b) => b.count - a.count);
  res.json({ date, meal, total_votes: rows.length, voters: rows.map(r => ({ id: r.member_id, name: r.member_name, avatar: r.member_avatar, recipe_id: r.recipe_id })), results });
});

app.post('/api/votes', (req, res) => {
  const { date, meal, member_id, recipe_id } = req.body;
  if (!date || !meal || !member_id || !recipe_id) return res.status(400).json({ error: 'date/meal/member_id/recipe_id 必填' });
  if (!['lunch', 'dinner'].includes(meal)) return res.status(400).json({ error: 'meal 必须是 lunch 或 dinner' });
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(member_id);
  if (!member) return res.status(404).json({ error: '成员不存在' });
  const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipe_id);
  if (!recipe) return res.status(404).json({ error: '菜谱不存在' });
  db.prepare(`INSERT INTO votes (vote_date, meal, member_id, recipe_id) VALUES (?, ?, ?, ?) ON CONFLICT(vote_date, meal, member_id) DO UPDATE SET recipe_id = excluded.recipe_id, created_at = CURRENT_TIMESTAMP`).run(date, meal, member_id, recipe_id);
  res.json({ ok: true });
});

app.delete('/api/votes', (req, res) => {
  const { date, meal, member_id } = req.query;
  if (!date || !meal || !member_id) return res.status(400).json({ error: '参数不完整' });
  db.prepare('DELETE FROM votes WHERE vote_date = ? AND meal = ? AND member_id = ?').run(date, meal, member_id);
  res.json({ ok: true });
});

// ===== 统计 =====
app.get('/api/stats', (req, res) => {
  const recipeCount = db.prepare('SELECT COUNT(*) as cnt FROM recipes').get().cnt;
  const presetCount = db.prepare('SELECT COUNT(*) as cnt FROM recipes WHERE is_preset=1').get().cnt;
  const memberCount = db.prepare('SELECT COUNT(*) as cnt FROM members').get().cnt;
  const voteCount = db.prepare('SELECT COUNT(*) as cnt FROM votes').get().cnt;
  res.json({ recipeCount, presetCount, memberCount, voteCount });
});

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, () => {
  console.log('\n🍱  家庭明日菜单投票 已启动');
  console.log(`👉  访问 http://localhost:${PORT}\n`);
});
