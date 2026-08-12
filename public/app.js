const { createApp, ref, reactive, computed, onMounted, watch } = Vue;

// ============ API 封装 ============
const api = {
  async get(url) {
    const r = await fetch(url);
    return r.json();
  },
  async post(url, data) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return r.json();
  },
  async put(url, data) {
    const r = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return r.json();
  },
  async del(url) {
    const r = await fetch(url, { method: 'DELETE' });
    return r.json();
  }
};

// ============ 工具函数 ============
const STORAGE_KEY = 'family_meal_member';
const getMember = () => {
  const s = localStorage.getItem(STORAGE_KEY);
  return s ? JSON.parse(s) : null;
};
const setMember = (m) => localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
const clearMember = () => localStorage.removeItem(STORAGE_KEY);

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const formatDateLabel = (s) => {
  const d = new Date(s);
  const weekdays = ['周日','周一','周二','周三','周四','周五','周六'];
  return `${d.getMonth()+1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
};

const ROLES = [
  { name: '爸爸', avatar: '👨' },
  { name: '妈妈', avatar: '👩' },
  { name: '爷爷', avatar: '👴' },
  { name: '奶奶', avatar: '👵' },
  { name: '儿子', avatar: '👦' },
  { name: '女儿', avatar: '👧' },
  { name: '外公', avatar: '👴' },
  { name: '外婆', avatar: '👵' },
  { name: '其他', avatar: '🧑' }
];

// ============ 主应用 ============
const app = createApp({
  setup() {
    const view = ref('role'); // role | home | recipes | result | detail | custom | members
    const member = ref(getMember());
    const members = ref([]);
    const recipes = ref([]);
    const categories = ref([]);
    const selectedMeal = ref('dinner'); // lunch | dinner
    const selectedDate = ref(tomorrowStr());
    const currentCategory = ref('全部');
    const searchKeyword = ref('');
    const activeRecipe = ref(null);
    const voteData = ref({ total_votes: 0, results: [], voters: [] });
    const showShare = ref(false);

    // 自定义菜谱表单
    const customForm = reactive({
      name: '', category: '荤菜', cuisine: '家常菜', difficulty: 2,
      cook_time: 30, servings: 3,
      ingredients: '', steps: '', tags: '', tips: '', image: '🍲'
    });

    const loadData = async () => {
      const [r, m, c] = await Promise.all([
        api.get('/api/recipes'),
        api.get('/api/members'),
        api.get('/api/recipes/categories')
      ]);
      recipes.value = r.items || [];
      members.value = m || [];
      categories.value = ['全部', ...((c || []).map(x => x.category))];
    };

    const loadVoteData = async () => {
      const d = await api.get(`/api/votes?date=${selectedDate.value}&meal=${selectedMeal.value}`);
      voteData.value = d;
    };

    const ensureMemberExists = async () => {
      // 如果是已选角色但服务器没有，自动创建
      if (!member.value) return;
      const exists = members.value.find(m => m.name === member.value.name);
      if (!exists) {
        const r = await api.post('/api/members', { name: member.value.name, avatar: member.value.avatar });
        member.value = r.member;
        setMember(r.member);
      } else {
        member.value = exists;
        setMember(exists);
      }
    };

    const myVote = computed(() => {
      if (!member.value) return null;
      return voteData.value.voters.find(v => v.id === member.value.id);
    });

    const filteredRecipes = computed(() => {
      let list = recipes.value;
      if (currentCategory.value !== '全部') {
        list = list.filter(r => r.category === currentCategory.value);
      }
      if (searchKeyword.value.trim()) {
        const k = searchKeyword.value.toLowerCase();
        list = list.filter(r =>
          r.name.toLowerCase().includes(k) ||
          (r.tags || []).some(t => t.toLowerCase().includes(k))
        );
      }
      return list;
    });

    const selectRole = async (role) => {
      const newMember = { name: role.name, avatar: role.avatar };
      member.value = newMember;
      setMember(newMember);
      await ensureMemberExists();
      view.value = 'home';
      await loadVoteData();
    };

    const changeRole = () => {
      clearMember();
      member.value = null;
      view.value = 'role';
    };

    const switchMeal = (meal) => {
      selectedMeal.value = meal;
      loadVoteData();
    };

    const openRecipe = (r) => {
      activeRecipe.value = r;
      view.value = 'detail';
    };

    const castVote = async (recipe) => {
      if (!member.value) return vant.showToast('请先选择身份');
      await api.post('/api/votes', {
        date: selectedDate.value,
        meal: selectedMeal.value,
        member_id: member.value.id,
        recipe_id: recipe.id
      });
      vant.showToast({ message: '投票成功！', type: 'success' });
      await loadVoteData();
    };

    const removeVote = async () => {
      await api.del(`/api/votes?date=${selectedDate.value}&meal=${selectedMeal.value}&member_id=${member.value.id}`);
      vant.showToast('已取消');
      await loadVoteData();
    };

    const goToResult = () => {
      view.value = 'result';
    };

    const goToRecipes = () => {
      view.value = 'recipes';
      currentCategory.value = '全部';
      searchKeyword.value = '';
    };

    const goToHome = () => {
      view.value = 'home';
    };

    const goToCustom = () => {
      Object.assign(customForm, {
        name: '', category: '荤菜', cuisine: '家常菜', difficulty: 2,
        cook_time: 30, servings: 3,
        ingredients: '', steps: '', tags: '', tips: '', image: '🍲'
      });
      view.value = 'custom';
    };

    const goToMembers = async () => {
      await loadData();
      view.value = 'members';
    };

    const saveCustomRecipe = async () => {
      if (!customForm.name.trim()) return vant.showToast('请输入菜名');
      if (!customForm.ingredients.trim()) return vant.showToast('请填写食材');
      if (!customForm.steps.trim()) return vant.showToast('请填写做法');
      const ingredients = customForm.ingredients.split('\n').filter(Boolean).map(line => {
        const [name, amount] = line.split(/[，,]/).map(s => s.trim());
        return { name: name || '', amount: amount || '适量' };
      });
      const steps = customForm.steps.split('\n').filter(Boolean);
      const tags = customForm.tags ? customForm.tags.split(/[，,]/).map(s => s.trim()).filter(Boolean) : [];
      const r = await api.post('/api/recipes', {
        ...customForm,
        ingredients, steps, tags
      });
      if (r.ok) {
        vant.showToast({ message: '已加入菜单！', type: 'success' });
        await loadData();
        view.value = 'recipes';
      } else {
        vant.showToast(r.error || '保存失败');
      }
    };

    const addMember = async (name, avatar) => {
      const r = await api.post('/api/members', { name, avatar });
      if (r.ok) {
        await loadData();
        vant.showToast('已添加');
      } else {
        vant.showToast(r.error || '添加失败');
      }
    };

    const deleteMember = async (m) => {
      try {
        await vant.showConfirmDialog({ title: '确认删除', message: `删除「${m.name}」？` });
      } catch (e) { return; }
      await api.del(`/api/members/${m.id}`);
      await loadData();
    };

    const shareLink = computed(() => {
      return window.location.origin + window.location.pathname;
    });

    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(shareLink.value);
        vant.showToast('链接已复制，去微信粘贴分享吧');
      } catch (e) {
        vant.showToast('请长按链接手动复制');
      }
    };

    onMounted(async () => {
      await loadData();
      if (member.value) {
        await ensureMemberExists();
        view.value = 'home';
        await loadVoteData();
      } else {
        view.value = 'role';
      }
    });

    return {
      view, member, members, recipes, categories,
      selectedMeal, selectedDate, currentCategory, searchKeyword,
      activeRecipe, voteData, customForm, showShare, shareLink,
      myVote, filteredRecipes,
      selectRole, changeRole, switchMeal, openRecipe, castVote, removeVote,
      goToResult, goToRecipes, goToHome, goToCustom, goToMembers,
      saveCustomRecipe, addMember, deleteMember, copyLink,
      ROLES, formatDateLabel, tomorrowStr, todayStr
    };
  },
  template: `
    <div class="app-container">
      <!-- 顶部导航 -->
      <div class="header" v-if="view !== 'role'">
        <span class="back-btn" v-if="view !== 'home'" @click="goToHome">‹</span>
        <span>{{ view === 'detail' ? '菜谱详情' : view === 'result' ? '投票结果' : view === 'recipes' ? '选菜' : view === 'custom' ? '添加菜谱' : view === 'members' ? '家庭成员' : '明日吃啥' }}</span>
        <span class="share-btn" v-if="view === 'home'" @click="showShare = true">📤 分享</span>
        <span class="share-btn" v-else-if="view === 'home'" @click="showShare = true"></span>
      </div>

      <!-- 角色选择 -->
      <div v-if="view === 'role'">
        <div class="header" style="position:relative;">选择你的身份</div>
        <div style="padding: 24px 16px 8px; text-align:center;">
          <div style="font-size: 48px;">🍱</div>
          <div style="font-size: 22px; font-weight: 600; margin-top: 8px;">欢迎来到家庭饭桌</div>
          <div style="font-size: 14px; color: #969799; margin-top: 6px;">请选择你是谁，开始投票</div>
        </div>
        <div class="role-grid">
          <div class="role-item" v-for="r in ROLES" :key="r.name" @click="selectRole(r)">
            <div class="avatar">{{ r.avatar }}</div>
            <div class="name">{{ r.name }}</div>
          </div>
        </div>
      </div>

      <!-- 主页 -->
      <div v-if="view === 'home'">
        <div class="date-picker">
          <div>
            <div class="date-label">{{ formatDateLabel(selectedDate) }}</div>
            <div class="date-info">明天</div>
          </div>
          <div class="meal-time">{{ selectedMeal === 'lunch' ? '中餐' : '晚餐' }}投票</div>
        </div>
        <div class="meal-tabs">
          <div class="tab" :class="{active: selectedMeal === 'lunch'}" @click="switchMeal('lunch')">🌞 中餐</div>
          <div class="tab" :class="{active: selectedMeal === 'dinner'}" @click="switchMeal('dinner')">🌙 晚餐</div>
        </div>

        <div v-if="myVote" class="status-card">
          <div class="title">✅ 你已投了</div>
          <div class="my-pick" @click="openRecipe(recipes.find(r => r.id === myVote.recipe_id))">
            <div class="emoji">{{ recipes.find(r => r.id === myVote.recipe_id)?.image }}</div>
            <div style="flex:1;">
              <div class="name">{{ recipes.find(r => r.id === myVote.recipe_id)?.name }}</div>
              <div class="voted-info">点击查看菜谱</div>
            </div>
            <div style="color:#969799;">›</div>
          </div>
          <div class="desc" style="margin-top:12px;">
            {{ voteData.voters.length }} 人已投票，{{ voteData.voters.length }}/{{ members.length || '?' }} 人
          </div>
        </div>

        <div v-else class="status-card">
          <div class="title">🍽️ 为 {{ formatDateLabel(selectedDate) }} {{ selectedMeal === 'lunch' ? '中餐' : '晚餐' }} 投票</div>
          <div class="desc">浏览 100+ 家常菜，选一道你最想吃的！</div>
        </div>

        <button v-if="!myVote" class="big-btn" @click="goToRecipes">🍳 选一道菜</button>
        <button v-else class="big-btn outline" @click="goToRecipes">🔁 改投别的</button>
        <button v-if="myVote" class="big-btn gray" @click="removeVote">取消投票</button>
        <button class="big-btn gray" @click="goToResult">📊 查看结果</button>

        <div class="status-card" style="margin-top: 8px;">
          <div class="title">👨‍👩‍👧 家庭成员</div>
          <div class="desc">
            <span v-for="m in members" :key="m.id" style="margin-right:8px;">{{ m.avatar }} {{ m.name }}</span>
            <span v-if="!members.length" style="color:#969799;">还没有其他成员</span>
          </div>
          <button style="margin-top:8px; padding:6px 12px; border:1px solid #ebedf0; background:#fff; border-radius:14px; font-size:12px; color:#646566;" @click="goToMembers">管理成员</button>
        </div>

        <div style="text-align:center; padding: 12px; color:#c8c9cc; font-size:12px;">
          当前身份：{{ member?.avatar }} {{ member?.name }} · <span style="color:#ff6b6b;" @click="changeRole">切换</span>
        </div>
      </div>

      <!-- 选菜页 -->
      <div v-if="view === 'recipes'">
        <div class="search-box">
          <input v-model="searchKeyword" placeholder="🔍 搜菜名、标签（如：扬州、汤）">
        </div>
        <div class="filter-bar">
          <div class="filter-chip" v-for="c in categories" :key="c" :class="{active: currentCategory === c}" @click="currentCategory = c">{{ c }}</div>
        </div>
        <div class="recipe-list">
          <div v-if="!filteredRecipes.length" class="empty-state">
            <div class="icon">🍽️</div>
            <div>没有匹配的菜谱</div>
          </div>
          <div class="recipe-item" v-for="r in filteredRecipes" :key="r.id" @click="openRecipe(r)">
            <div class="emoji">{{ r.image }}</div>
            <div class="info">
              <div class="name">{{ r.name }}</div>
              <div class="meta">
                <span class="tag">{{ r.category }}</span>
                <span class="tag" v-for="t in (r.tags || []).slice(0,2)" :key="t">{{ t }}</span>
                <span style="margin-left:4px;">{{ r.cook_time }}分钟</span>
              </div>
            </div>
            <button @click.stop="castVote(r)" style="background:linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%); color:#fff; border:none; padding:6px 12px; border-radius:14px; font-size:12px;">投它</button>
          </div>
        </div>
        <div style="text-align:center; padding: 16px;">
          <button class="big-btn gray" style="display:inline-block; width:auto; padding:10px 24px;" @click="goToCustom">➕ 添加我的菜</button>
        </div>
      </div>

      <!-- 揭晓页 -->
      <div v-if="view === 'result'">
        <div v-if="voteData.results.length === 0" class="empty-state">
          <div class="icon">🗳️</div>
          <div>还没人投票呢~</div>
          <button class="big-btn" style="margin-top:20px;" @click="goToRecipes">去投票</button>
        </div>
        <div v-else>
          <div class="result-banner">
            <div class="winner-emoji">{{ voteData.results[0].recipe_image }}</div>
            <div class="winner-name">{{ voteData.results[0].recipe_name }}</div>
            <div class="winner-meta">🏆 得票最多 · {{ voteData.results[0].count }} 票</div>
            <button @click="openRecipe(recipes.find(r => r.id === voteData.results[0].recipe_id))" style="margin-top:12px; background:rgba(255,255,255,0.25); color:#fff; border:none; padding:8px 20px; border-radius:18px; font-size:14px;">查看做法 ›</button>
          </div>
          <div class="result-list">
            <div class="result-item" v-for="(r, idx) in voteData.results" :key="r.recipe_id" @click="openRecipe(recipes.find(x => x.id === r.recipe_id))">
              <div class="rank" :class="{gold: idx===0, silver: idx===1, bronze: idx===2}">{{ idx+1 }}</div>
              <div class="emoji" style="font-size:28px; margin-right:8px;">{{ r.recipe_image }}</div>
              <div class="info">
                <div class="name">{{ r.recipe_name }}</div>
                <div class="voters">
                  <span class="voter" v-for="v in r.voters" :key="v.id">{{ v.avatar }} {{ v.name }}</span>
                </div>
              </div>
              <div class="count">{{ r.count }}票</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 菜谱详情 -->
      <div v-if="view === 'detail' && activeRecipe">
        <div class="detail-page">
          <div class="detail-header">
            <div class="emoji">{{ activeRecipe.image }}</div>
            <div class="name">{{ activeRecipe.name }}</div>
            <div class="meta">
              <span>⏱️ {{ activeRecipe.cook_time }}分钟</span>
              <span>👨‍🍳 {{ activeRecipe.difficulty }}星</span>
              <span>🍽️ {{ activeRecipe.servings }}人份</span>
            </div>
            <div class="tag-list" style="justify-content:center;">
              <span class="tag">{{ activeRecipe.category }}</span>
              <span class="tag" v-for="t in activeRecipe.tags" :key="t">{{ t }}</span>
            </div>
          </div>

          <div v-if="activeRecipe.tips" class="tips-box">💡 {{ activeRecipe.tips }}</div>

          <div class="section">
            <div class="section-title">🛒 食材清单</div>
            <div class="ingredient-item" v-for="(ing, idx) in activeRecipe.ingredients" :key="idx">
              <span class="name">{{ ing.name }}</span>
              <span class="amount">{{ ing.amount }}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">👨‍🍳 做法步骤</div>
            <div class="step-item" v-for="(s, idx) in activeRecipe.steps" :key="idx">
              <div class="num">{{ idx+1 }}</div>
              <div class="text">{{ s }}</div>
            </div>
          </div>
        </div>
        <div class="bottom-action">
          <button v-if="myVote?.recipe_id !== activeRecipe.id" @click="castVote(activeRecipe); goToHome();">投这道菜</button>
          <button v-else disabled>你已投了这道菜</button>
        </div>
      </div>

      <!-- 自定义菜谱 -->
      <div v-if="view === 'custom'" class="form-page">
        <div class="form-card">
          <label>菜名 *</label>
          <input v-model="customForm.name" placeholder="如：妈妈牌红烧肉">
          <label>表情图标</label>
          <input v-model="customForm.image" placeholder="🍲">
          <div class="row">
            <div>
              <label>分类 *</label>
              <select v-model="customForm.category">
                <option>荤菜</option><option>素菜</option>
                <option>汤</option><option>主食</option><option>凉菜</option>
              </select>
            </div>
            <div>
              <label>菜系</label>
              <select v-model="customForm.cuisine">
                <option>家常菜</option><option>淮扬菜</option>
                <option>川菜</option><option>鲁菜</option><option>粤菜</option>
              </select>
            </div>
          </div>
          <div class="row">
            <div>
              <label>耗时(分钟)</label>
              <input type="number" v-model="customForm.cook_time">
            </div>
            <div>
              <label>难度(1-5)</label>
              <input type="number" v-model="customForm.difficulty" min="1" max="5">
            </div>
            <div>
              <label>几人份</label>
              <input type="number" v-model="customForm.servings">
            </div>
          </div>
        </div>

        <div class="form-card">
          <label>食材清单 *（每行一个，逗号分隔食材和用量）</label>
          <textarea v-model="customForm.ingredients" placeholder="五花肉, 500g&#10;生抽, 3勺&#10;冰糖, 30g"></textarea>
        </div>

        <div class="form-card">
          <label>做法步骤 *（每行一步）</label>
          <textarea v-model="customForm.steps" placeholder="五花肉切块焯水&#10;锅中放冰糖炒糖色&#10;下肉块翻炒上色&#10;加调料小火炖50分钟"></textarea>
        </div>

        <div class="form-card">
          <label>标签（用逗号分隔）</label>
          <input v-model="customForm.tags" placeholder="下饭菜, 硬菜">
          <label>小贴士</label>
          <textarea v-model="customForm.tips" placeholder="如：炒糖色要注意火候" style="min-height:50px;"></textarea>
        </div>

        <button class="big-btn" @click="saveCustomRecipe">保存到菜单</button>
      </div>

      <!-- 成员管理 -->
      <div v-if="view === 'members'">
        <div class="form-card" style="margin:12px;">
          <div class="section-title">➕ 添加成员</div>
          <label>名字</label>
          <input id="new-member-name" placeholder="如：叔叔、阿姨">
          <label>头像</label>
          <select id="new-member-avatar">
            <option value="👨">👨 男性</option>
            <option value="👩">👩 女性</option>
            <option value="👴">👴 老人男</option>
            <option value="👵">👵 老人女</option>
            <option value="👦">👦 男孩</option>
            <option value="👧">👧 女孩</option>
            <option value="🧑">🧑 其他</option>
          </select>
          <button class="big-btn" style="margin:0;" @click="addMember(document.getElementById('new-member-name').value, document.getElementById('new-member-avatar').value)">添加</button>
        </div>

        <div class="member-list">
          <div class="member-item" v-for="m in members" :key="m.id">
            <div class="avatar">{{ m.avatar }}</div>
            <div class="name">{{ m.name }}</div>
            <div class="actions">
              <button class="danger" @click="deleteMember(m)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分享弹窗 -->
    <van-popup v-model:show="showShare" position="bottom" round :style="{ height: '40%' }">
      <div class="share-modal">
        <div class="title">📤 分享给家人</div>
        <div class="link-box">{{ shareLink }}</div>
        <button class="big-btn" @click="copyLink">复制链接</button>
        <div class="hint">复制后到微信粘贴发给家人<br>他们打开就能投票啦！</div>
      </div>
    </van-popup>
  `
});

app.use(vant);
app.mount('#app');
