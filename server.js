const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== 菜谱 API =====
app.get('/api/recipes', (req, res) => {
  const items = db.listRecipes(req.query);
  res.json({ total: items.length, items });
});

app.get('/api/recipes/categories', (req, res) => {
  res.json(db.recipeCategories());
});

app.get('/api/recipes/:id', (req, res) => {
  const row = db.getRecipe(req.params.id);
  if (!row) return res.status(404).json({ error: '菜谱不存在' });
  res.json(row);
});

app.post('/api/recipes', (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.category || !b.ingredients || !b.steps) {
    return res.status(400).json({ error: '菜名/分类/食材/步骤 不能为空' });
  }
  try {
    const row = db.createRecipe({
      name: b.name, category: b.category, cuisine: b.cuisine,
      difficulty: b.difficulty, cook_time: b.cook_time, servings: b.servings,
      ingredients: b.ingredients, steps: b.steps, tags: b.tags, tips: b.tips, image: b.image
    });
    res.json({ ok: true, recipe: row });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/recipes/:id', (req, res) => {
  const row = db.getRecipe(req.params.id);
  if (!row) return res.status(404).json({ error: '菜谱不存在' });
  if (row.is_preset) return res.status(403).json({ error: '预置菜谱不可编辑' });
  try {
    const b = req.body || {};
    const updated = db.updateRecipe(req.params.id, {
      name: b.name, category: b.category, cuisine: b.cuisine,
      difficulty: b.difficulty, cook_time: b.cook_time, servings: b.servings,
      ingredients: b.ingredients, steps: b.steps, tags: b.tags, tips: b.tips, image: b.image
    });
    res.json({ ok: true, recipe: updated });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/recipes/:id', (req, res) => {
  const row = db.getRecipe(req.params.id);
  if (!row) return res.status(404).json({ error: '菜谱不存在' });
  if (row.is_preset) return res.status(403).json({ error: '预置菜谱不可删除' });
  db.deleteRecipe(req.params.id);
  res.json({ ok: true });
});

// ===== 成员 API =====
app.get('/api/members', (req, res) => res.json(db.listMembers()));

app.post('/api/members', (req, res) => {
  const { name, avatar } = req.body || {};
  if (!name) return res.status(400).json({ error: '名字不能为空' });
  try { res.json({ ok: true, member: db.createMember(name, avatar) }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/members/:id', (req, res) => {
  db.deleteMember(req.params.id);
  res.json({ ok: true });
});

// ===== 投票 API =====
app.get('/api/votes', (req, res) => {
  const { date, meal } = req.query;
  if (!date || !meal) return res.status(400).json({ error: 'date 和 meal 必填' });
  res.json(db.listVotes(date, meal));
});

app.post('/api/votes', (req, res) => {
  const { date, meal, member_id, recipe_id } = req.body || {};
  if (!date || !meal || !member_id || !recipe_id) return res.status(400).json({ error: 'date/meal/member_id/recipe_id 必填' });
  try { db.upsertVote(date, meal, member_id, recipe_id); res.json({ ok: true }); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/votes', (req, res) => {
  const { date, meal, member_id } = req.query;
  if (!date || !meal || !member_id) return res.status(400).json({ error: '参数不完整' });
  db.deleteVote(date, meal, member_id);
  res.json({ ok: true });
});

// ===== 统计 / 健康 =====
app.get('/api/stats', (req, res) => res.json(db.stats()));
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

app.listen(PORT, () => {
  console.log('\n🍱  家庭明日菜单投票 已启动');
  console.log(`👉  访问 http://localhost:${PORT}\n`);
});