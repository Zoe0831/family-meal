// 纯 JSON 文件存储，零依赖、零编译、100% 兼容 Render / 任何 Node 版本
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');
const SEED_PATH = path.join(DATA_DIR, 'recipes.seed.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadSeed() {
  if (!fs.existsSync(SEED_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(SEED_PATH, 'utf8')); }
  catch (e) { console.error('[seed] 解析失败:', e.message); return []; }
}

function loadStore() {
  ensureDir();
  if (!fs.existsSync(STORE_PATH)) {
    const init = { recipes_custom: [], members: [], votes: [], next_recipe_id: 10000, next_member_id: 1, next_vote_id: 1 };
    fs.writeFileSync(STORE_PATH, JSON.stringify(init, null, 2), 'utf8');
    return init;
  }
  try { return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')); }
  catch (e) {
    console.error('[store] 解析失败，重置:', e.message);
    const init = { recipes_custom: [], members: [], votes: [], next_recipe_id: 10000, next_member_id: 1, next_vote_id: 1 };
    fs.writeFileSync(STORE_PATH, JSON.stringify(init, null, 2), 'utf8');
    return init;
  }
}

let store = loadStore();
const presetRecipes = loadSeed();
let writeTimer = null;
function scheduleWrite() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    const tmp = STORE_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2), 'utf8');
    fs.renameSync(tmp, STORE_PATH);
  }, 50);
}

function formatRecipe(r) {
  return {
    id: r.id, name: r.name, category: r.category, cuisine: r.cuisine || '家常菜',
    difficulty: r.difficulty || 2, cook_time: r.cook_time || 30, servings: r.servings || 3,
    ingredients: r.ingredients || [], steps: r.steps || [], tags: r.tags || [],
    tips: r.tips || '', image: r.image || '🍲',
    is_preset: !!r.is_preset, created_at: r.created_at
  };
}

const api = {
  // ===== 菜谱 =====
  listRecipes(filter = {}) {
    let all = presetRecipes.map((r, i) => ({ ...r, id: i + 1, is_preset: true, created_at: 'preset' }));
    all = all.concat(store.recipes_custom.map(r => ({ ...r, is_preset: false })));
    const { q, category, cuisine, is_preset, sort = 'name' } = filter;
    if (q) {
      const kw = String(q).toLowerCase();
      all = all.filter(r => (r.name || '').toLowerCase().includes(kw) || (r.tags || []).some(t => t.toLowerCase().includes(kw)));
    }
    if (category) all = all.filter(r => r.category === category);
    if (cuisine) all = all.filter(r => r.cuisine === cuisine);
    if (is_preset !== undefined) {
      const want = is_preset === 'true' || is_preset === true;
      all = all.filter(r => !!r.is_preset === want);
    }
    if (sort === 'time') all.sort((a, b) => (a.cook_time || 0) - (b.cook_time || 0));
    else all.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-Hans-CN'));
    return all;
  },

  recipeCategories() {
    const map = {};
    this.listRecipes().forEach(r => { map[r.category] = (map[r.category] || 0) + 1; });
    return Object.entries(map).map(([category, cnt]) => ({ category, cnt })).sort((a, b) => b.cnt - a.cnt);
  },

  getRecipe(id) {
    const nid = Number(id);
    const p = presetRecipes[nid - 1];
    if (p) return formatRecipe({ ...p, id: nid, is_preset: true, created_at: 'preset' });
    const c = store.recipes_custom.find(r => r.id === nid);
    if (c) return formatRecipe({ ...c, is_preset: false });
    return null;
  },

  createRecipe(data) {
    const id = store.next_recipe_id++;
    const row = {
      id, name: data.name, category: data.category,
      cuisine: data.cuisine || '家常菜',
      difficulty: data.difficulty || 2, cook_time: data.cook_time || 30,
      servings: data.servings || 3,
      ingredients: data.ingredients || [], steps: data.steps || [],
      tags: data.tags || [], tips: data.tips || '', image: data.image || '🍲',
      created_at: new Date().toISOString()
    };
    store.recipes_custom.push(row);
    scheduleWrite();
    return row;
  },

  updateRecipe(id, data) {
    const idx = store.recipes_custom.findIndex(r => r.id === Number(id));
    if (idx === -1) return null;
    store.recipes_custom[idx] = { ...store.recipes_custom[idx], ...data, id: store.recipes_custom[idx].id };
    scheduleWrite();
    return store.recipes_custom[idx];
  },

  deleteRecipe(id) {
    const idx = store.recipes_custom.findIndex(r => r.id === Number(id));
    if (idx === -1) return false;
    store.recipes_custom.splice(idx, 1);
    scheduleWrite();
    return true;
  },

  // ===== 成员 =====
  listMembers() { return store.members.slice(); },
  createMember(name, avatar) {
    if (store.members.some(m => m.name === name)) throw new Error('名字已存在');
    const m = { id: store.next_member_id++, name, avatar: avatar || '👤', created_at: new Date().toISOString() };
    store.members.push(m);
    scheduleWrite();
    return m;
  },
  deleteMember(id) {
    const idx = store.members.findIndex(m => m.id === Number(id));
    if (idx === -1) return false;
    store.members.splice(idx, 1);
    scheduleWrite();
    return true;
  },

  // ===== 投票 =====
  listVotes(date, meal) {
    const rows = store.votes.filter(v => v.vote_date === date && v.meal === meal);
    const enriched = rows.map(v => {
      const m = store.members.find(x => x.id === v.member_id) || {};
      const r = this.getRecipe(v.recipe_id) || {};
      return { ...v, member_name: m.name, member_avatar: m.avatar, recipe_name: r.name, recipe_image: r.image, recipe_category: r.category };
    });
    const tally = {};
    enriched.forEach(v => {
      if (!tally[v.recipe_id]) tally[v.recipe_id] = {
        recipe_id: v.recipe_id, recipe_name: v.recipe_name,
        recipe_image: v.recipe_image, recipe_category: v.recipe_category,
        count: 0, voters: []
      };
      tally[v.recipe_id].count++;
      tally[v.recipe_id].voters.push({ id: v.member_id, name: v.member_name, avatar: v.member_avatar });
    });
    const results = Object.values(tally).sort((a, b) => b.count - a.count);
    return {
      date, meal, total_votes: rows.length,
      voters: enriched.map(v => ({ id: v.member_id, name: v.member_name, avatar: v.member_avatar, recipe_id: v.recipe_id })),
      results
    };
  },

  upsertVote(date, meal, member_id, recipe_id) {
    if (!['lunch', 'dinner'].includes(meal)) throw new Error('meal 必须是 lunch 或 dinner');
    const m = store.members.find(x => x.id === Number(member_id));
    if (!m) throw new Error('成员不存在');
    if (!this.getRecipe(Number(recipe_id))) throw new Error('菜谱不存在');
    const idx = store.votes.findIndex(v => v.vote_date === date && v.meal === meal && v.member_id === Number(member_id));
    if (idx >= 0) {
      store.votes[idx].recipe_id = Number(recipe_id);
      store.votes[idx].created_at = new Date().toISOString();
    } else {
      store.votes.push({ id: store.next_vote_id++, vote_date: date, meal, member_id: Number(member_id), recipe_id: Number(recipe_id), created_at: new Date().toISOString() });
    }
    scheduleWrite();
    return true;
  },

  deleteVote(date, meal, member_id) {
    const idx = store.votes.findIndex(v => v.vote_date === date && v.meal === meal && v.member_id === Number(member_id));
    if (idx === -1) return false;
    store.votes.splice(idx, 1);
    scheduleWrite();
    return true;
  },

  // ===== 统计 =====
  stats() {
    return {
      recipeCount: presetRecipes.length + store.recipes_custom.length,
      presetCount: presetRecipes.length,
      memberCount: store.members.length,
      voteCount: store.votes.length
    };
  }
};

console.log(`[init] 预置菜谱 ${presetRecipes.length} 道，自定义菜谱 ${store.recipes_custom.length} 道`);
module.exports = api;