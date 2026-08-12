const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'family-meal.db');
const db = new DatabaseSync(DB_PATH);

// 初始化表结构
db.exec(`
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    cuisine TEXT,
    difficulty INTEGER DEFAULT 2,
    cook_time INTEGER DEFAULT 30,
    servings INTEGER DEFAULT 3,
    ingredients TEXT NOT NULL,
    steps TEXT NOT NULL,
    tags TEXT,
    tips TEXT,
    image TEXT,
    is_preset INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    avatar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vote_date TEXT NOT NULL,
    meal TEXT NOT NULL,
    member_id INTEGER NOT NULL,
    recipe_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vote_date, meal, member_id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_votes_date_meal ON votes(vote_date, meal);
  CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
`);

// 初始化时导入预置菜谱
function initPresetRecipes() {
  const stmt = db.prepare('SELECT COUNT(*) as cnt FROM recipes WHERE is_preset = 1');
  const count = stmt.get();
  if (count.cnt > 0) return;

  const recipesPath = path.join(__dirname, 'data', 'recipes.json');
  if (!fs.existsSync(recipesPath)) {
    console.warn('[warn] 预置菜谱文件不存在:', recipesPath);
    return;
  }
  const recipes = JSON.parse(fs.readFileSync(recipesPath, 'utf-8'));
  const insert = db.prepare(`
    INSERT INTO recipes (name, category, cuisine, difficulty, cook_time, servings,
                         ingredients, steps, tags, tips, image, is_preset)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);
  db.exec('BEGIN');
  try {
    for (const r of recipes) {
      insert.run(
        r.name,
        r.category,
        r.cuisine || '家常菜',
        r.difficulty || 2,
        r.cook_time || 30,
        r.servings || 3,
        JSON.stringify(r.ingredients || []),
        JSON.stringify(r.steps || []),
        JSON.stringify(r.tags || []),
        r.tips || '',
        r.image || '🍲'
      );
    }
    db.exec('COMMIT');
    console.log(`[init] 导入 ${recipes.length} 道预置菜谱`);
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

initPresetRecipes();

module.exports = db;
