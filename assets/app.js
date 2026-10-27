/* =========================================================
   雏翼长青 · 用户自建数据的交互原型
   Vanilla JS · 无外部依赖 · 数据保存在 localStorage
   ========================================================= */
(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mean = arr => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
  const round1 = n => Math.round(n * 10) / 10;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Static model
  --------------------------------------------------------- */
  const DIMS = [
    { key: 'learn', name: '学习敏锐度', color: '#0B5AA5' },
    { key: 'collab', name: '协作影响力', color: '#2E86C1' },
    { key: 'lead', name: '领导潜能', color: '#38B6E5' },
    { key: 'expert', name: '专业深度', color: '#4F6FA8' },
    { key: 'innov', name: '创新驱动', color: '#00A3C4' },
    { key: 'resil', name: '韧性抗压', color: '#6E9FC4' }
  ];
  const DIM_NAME = DIMS.reduce((m, d) => (m[d.key] = d.name, m), {});

  const GOALS = {
    lead: '成为管理者',
    expert: '成为专家',
    innov: '从 0 到 1',
    learn: '持续进化'
  };

  const ARCHETYPES = {
    learn: { name: '进化型学习者', desc: '你从经验中提取规律的速度，快过大多数人。面对陌生领域，你习惯先建立认知地图，再用小步验证修正判断。' },
    collab: { name: '连接型协作者', desc: '你擅长把不同角色的人拉到同一张桌子前。你的影响力不来自职位，而来自别人愿意相信你、跟你一起把事做成。' },
    lead: { name: '潜力型领航者', desc: '你在模糊中不急于找答案，而是先定方向、分责任。你已经开始在没有授权的情况下带动他人，这是领导力最早的信号。' },
    expert: { name: '深耕型专家', desc: '你不满足于「做完」，更在意「做对」。你正在形成自己的方法论，并把经验变成别人可以复用的东西。' },
    innov: { name: '开创型探索者', desc: '你对「本来就该这样」保持怀疑。你愿意用低成本实验去验证新想法，也接受失败带来的信息价值。' },
    resil: { name: '稳定型长跑者', desc: '你在压力下依然能保持节奏。你不是没有情绪，而是懂得把情绪放在合适的位置，先让事情继续向前。' }
  };

  const QUESTIONS = [
    { text: '当你接到一个从未接触过的业务课题，你的第一反应是？', options: [
      { text: '先拆解问题、找资料，快速建立认知框架', scores: { learn: 3, expert: 1 } },
      { text: '找有经验的同事聊一圈，借别人的地图', scores: { collab: 3 } },
      { text: '直接做一个最小可行方案，边做边试', scores: { innov: 3, resil: 1 } },
      { text: '先想清楚这件事对团队目标的价值，再决定怎么做', scores: { lead: 3 } }
    ] },
    { text: '在一个团队项目里，你通常扮演的角色是？', options: [
      { text: '推进节奏、协调分工的人', scores: { lead: 3, collab: 1 } },
      { text: '提供专业判断、把质量兜住的人', scores: { expert: 3 } },
      { text: '提出新角度、打破僵局的人', scores: { innov: 3 } },
      { text: '补位、把细节做扎实的人', scores: { resil: 3, collab: 1 } }
    ] },
    { text: '面对模糊且不断变化的目标，你会？', options: [
      { text: '主动向上确认优先级，帮团队对齐', scores: { lead: 2, collab: 1 } },
      { text: '建立自己的判断框架，再对外沟通', scores: { expert: 2, learn: 1 } },
      { text: '快速试错，边做边校准', scores: { innov: 2, resil: 1 } },
      { text: '保持节奏，先稳住团队情绪', scores: { resil: 3 } }
    ] },
    { text: '过去半年，你投入最多的一类学习是？', options: [
      { text: '系统课程与认证，建立完整知识结构', scores: { learn: 3, expert: 1 } },
      { text: '跨部门项目实战，在协作中学习', scores: { collab: 2, lead: 1 } },
      { text: '行业前沿与跨界内容，找新可能', scores: { innov: 3 } },
      { text: '复盘与刻意练习，把一件事做深', scores: { resil: 2, expert: 1 } }
    ] },
    { text: '当你的方案被资深同事否定时，你更可能？', options: [
      { text: '追问判断依据，快速修正自己的理解', scores: { learn: 2, resil: 1 } },
      { text: '用数据补充论证，再沟通一次', scores: { expert: 2, collab: 1 } },
      { text: '换一个角度，重做一版', scores: { innov: 2 } },
      { text: '先接受，事后单独请教', scores: { collab: 2, resil: 1 } }
    ] },
    { text: '你更享受哪一种成就感？', options: [
      { text: '带一个小团队，把难事真正做成', scores: { lead: 3 } },
      { text: '成为某个领域里「那个可以问他」的人', scores: { expert: 3 } },
      { text: '做出别人没做过的东西', scores: { innov: 3 } },
      { text: '在高压下依然稳定交付', scores: { resil: 3 } }
    ] },
    { text: '未来一年，你最想补齐的能力是？', options: [
      { text: '结构化表达与向上管理', scores: { lead: 2, collab: 1 } },
      { text: '数据分析与专业方法论', scores: { expert: 2, learn: 1 } },
      { text: '用户洞察与创新方法', scores: { innov: 2, learn: 1 } },
      { text: '情绪管理与精力管理', scores: { resil: 3 } }
    ] },
    { text: '在跨部门协作中，你最常遇到的卡点是？', options: [
      { text: '目标不一致，各自为战', scores: { lead: 2, collab: 1 } },
      { text: '信息不同步，重复返工', scores: { collab: 3 } },
      { text: '缺少新解法，事情停在原地', scores: { innov: 2, learn: 1 } },
      { text: '节奏被打乱，精力被消耗', scores: { resil: 2, expert: 1 } }
    ] },
    { text: '如果用一句话描述你的职业野心，更接近？', options: [
      { text: '成为能带团队打硬仗的管理者', scores: { lead: 3 } },
      { text: '成为行业认可的专业专家', scores: { expert: 3 } },
      { text: '成为从 0 到 1 的开创者', scores: { innov: 3, resil: 1 } },
      { text: '成为持续进化的长期主义者', scores: { learn: 3, resil: 1 } }
    ] }
  ];

  // 每个维度的理论最高分，用于把原始分归一到 55–96
  const DIM_MAX = DIMS.reduce((acc, d) => {
    acc[d.key] = QUESTIONS.reduce((sum, q) => {
      const best = Math.max.apply(null, q.options.map(o => o.scores[d.key] || 0));
      return sum + best;
    }, 0);
    return acc;
  }, {});

  const COURSES = [
    { id: 'influence', cat: 'lead', catLabel: '领导力', title: '从专业到影响：非职权领导力', provider: '中欧商业在线', hours: 4.5, format: '线上 · 6 节', learners: 1280, dims: ['lead', 'collab'], tags: ['团队协作', '向上管理'], angle: '在没有授权的情况下影响他人' },
    { id: 'express', cat: 'lead', catLabel: '领导力', title: '结构化表达与向上沟通', provider: '得到', hours: 3, format: '线上 · 5 节', learners: 3160, dims: ['lead', 'collab'], tags: ['表达', '汇报'], angle: '让结论先行，让建议被听见' },
    { id: 'growth', cat: 'expert', catLabel: '专业精进', title: '用户增长实验设计实战', provider: '三节课', hours: 6, format: '线上 · 8 节', learners: 2340, dims: ['expert', 'learn'], tags: ['增长', '实验'], angle: '把零散经验变成可复用的实验方法' },
    { id: 'method', cat: 'expert', catLabel: '专业精进', title: '方法论萃取：把经验变成资产', provider: '雏翼学院', hours: 4, format: '线上 · 6 节', learners: 870, dims: ['expert', 'learn'], tags: ['复盘', '沉淀'], angle: '从「做过」走向「说得清、教得会」' },
    { id: 'data', cat: 'digital', catLabel: '数字化', title: '从数据到洞察：业务分析入门', provider: '雏翼学院', hours: 8, format: '线上 · 10 节', learners: 960, dims: ['expert', 'learn'], tags: ['数据', '归因'], angle: '用数据支撑判断，而不是事后解释' },
    { id: 'cross', cat: 'cross', catLabel: '跨界融合', title: '跨部门协作的冲突解法', provider: '组织发展中心', hours: 2.5, format: '直播工作坊', learners: 680, dims: ['collab', 'resil'], tags: ['协作', '冲突'], angle: '把协调升级为机制设计' },
    { id: 'innov', cat: 'cross', catLabel: '跨界融合', title: '创新工作坊：从洞察到原型', provider: '设计思维实验室', hours: 5, format: '线下 · 2 天', learners: 420, dims: ['innov', 'learn'], tags: ['创新', '原型'], angle: '把点子多变成可验证的原型' },
    { id: 'energy', cat: 'well', catLabel: '自我管理', title: '高压周期中的精力与情绪管理', provider: '身心健康中心', hours: 3, format: '线上 · 4 节', learners: 1520, dims: ['resil', 'resil'], tags: ['压力', '精力'], angle: '在高压周期保持稳定输出' }
  ];

  const STORE_KEY = 'yw-evergreen-v3';

  const freshState = () => ({
    profile: null,
    self: { learn: 6, collab: 6, lead: 5, expert: 6, innov: 5, resil: 5 },
    hours: 4,
    challenge: '',
    answers: Array(QUESTIONS.length).fill(null),
    assessment: null,
    plan: [],
    mentors: [],
    mentorReqs: [],
    feedback: null,
    trendRange: 'half',
    demo: { active: false, step: 0 }
  });

  let state = freshState();

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* 隐私模式忽略 */ }
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      state = Object.assign(freshState(), data);
      state.demo = { active: false, step: 0 };
      return !!(state.profile && state.profile.name);
    } catch (e) { return false; }
  }

  /* ---------------------------------------------------------
     Derived data
  --------------------------------------------------------- */
  const selfValue = key => Math.round(55 + Number(state.self[key] || 0) * 3.9);

  function dimsNow() {
    if (state.assessment) {
      return DIMS.map(d => ({ key: d.key, name: d.name, color: d.color, value: state.assessment.dims[d.key] }));
    }
    return DIMS.map(d => ({ key: d.key, name: d.name, color: d.color, value: selfValue(d.key) }));
  }
  function dimsBase() {
    return DIMS.map(d => ({ key: d.key, name: d.name, color: d.color, value: selfValue(d.key) }));
  }
  const dimVal = key => (dimsNow().find(d => d.key === key) || {}).value || 60;
  const meanNow = () => mean(dimsNow().map(d => d.value));

  function activityPoints() {
    let p = 0;
    if (state.assessment) p += 2.5;
    p += Math.min(3, state.plan.length * 1);
    p += Math.min(2, state.mentorReqs.length * 1);
    if (state.feedback) p += 1.5;
    return Math.min(9, p);
  }
  function growthIndex() {
    return round1(Math.min(99, meanNow() * 0.9 + activityPoints()));
  }
  function planHours() {
    return round1(state.plan.reduce((sum, p) => {
      const c = COURSES.find(x => x.id === p.id);
      return sum + (c ? c.hours : 0);
    }, 0));
  }
  function courseMatch(course) {
    const gaps = course.dims.map(k => 100 - dimVal(k));
    const m = 64 + mean(gaps) * 0.92;
    return clamp(Math.round(m), 60, 98);
  }
  function sortedCourses() {
    return COURSES.slice().sort((a, b) => courseMatch(b) - courseMatch(a));
  }
  function mentorMatch(m) {
    const dims = (m.dims && m.dims.length) ? m.dims : ['learn'];
    const gaps = dims.map(k => 100 - dimVal(k));
    let s = 58 + mean(gaps) * 1.2;
    if (state.profile && state.profile.goal === m.goal) s += 3;
    return clamp(Math.round(s), 62, 97);
  }
  function sortedMentors() {
    return state.mentors.slice().sort((a, b) => mentorMatch(b) - mentorMatch(a));
  }

  function phase() {
    const joined = state.profile && state.profile.joined;
    if (!joined) return { name: '雏翼计划', stage: '破壳期', month: 1 };
    const [y, m] = joined.split('-').map(Number);
    const now = new Date();
    let months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
    months = clamp(months, 1, 240);
    const stage = months < 6 ? '破壳期' : months < 18 ? '展翼期' : months < 36 ? '丰羽期' : '长青期';
    return { name: '雏翼计划 · ' + stage, stage, month: months };
  }

  function topAndLow() {
    const d = dimsNow().slice().sort((a, b) => b.value - a.value);
    return { top: d[0], mid: d[1], low: d[d.length - 1] };
  }

  function initials(name) {
    const n = (name || '').trim();
    if (!n) return '你';
    return /[a-zA-Z]/.test(n[0]) ? n[0].toUpperCase() : n.slice(0, 1);
  }

  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };
  const monthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  /* ---------------------------------------------------------
     Toast
  --------------------------------------------------------- */
  function toast(message) {
    const wrap = $('#toasts');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<i></i><span></span>';
    el.querySelector('span').textContent = message;
    wrap.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 320);
    }, 3200);
  }

  /* ---------------------------------------------------------
     Charts
  --------------------------------------------------------- */
  function polar(cx, cy, r, angle) {
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  }

  function radarMarkup(svg, values, opts) {
    if (!svg) return;
    opts = opts || {};
    const vb = svg.viewBox.baseVal;
    const W = vb.width || 320;
    const H = vb.height || 300;
    const cx = W / 2;
    const cy = H / 2 + 2;
    const R = Math.min(W, H) * (opts.radiusRatio || 0.30);
    const n = values.length;
    const angleAt = i => (-Math.PI / 2) + (i * Math.PI * 2) / n;
    const mapR = v => R * (0.16 + 0.84 * clamp((v - 50) / 50, 0, 1));

    let out = '';
    [0.25, 0.5, 0.75, 1].forEach((level, li) => {
      const pts = values.map((_, i) => polar(cx, cy, R * level, angleAt(i)).map(p => p.toFixed(1)).join(',')).join(' ');
      out += `<polygon points="${pts}" fill="${li === 3 ? 'rgba(0,93,170,.025)' : 'none'}" stroke="rgba(8,52,87,.11)" stroke-width="1"${li === 3 ? '' : ' stroke-dasharray="3 4"'}/>`;
    });
    values.forEach((_, i) => {
      const [x, y] = polar(cx, cy, R, angleAt(i));
      out += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(8,52,87,.08)" stroke-width="1"/>`;
    });

    if (opts.compare) {
      const pts = opts.compare.map((v, i) => polar(cx, cy, mapR(v), angleAt(i)).map(p => p.toFixed(1)).join(',')).join(' ');
      out += `<polygon points="${pts}" fill="rgba(46,159,216,.07)" stroke="#2E9FD8" stroke-width="1.4" stroke-dasharray="5 4"/>`;
    }

    const pts = values.map((v, i) => polar(cx, cy, mapR(v.value), angleAt(i)).map(p => p.toFixed(1)).join(',')).join(' ');
    out += `<polygon points="${pts}" fill="rgba(0,93,170,.14)" stroke="#005DAA" stroke-width="1.8" stroke-linejoin="round"/>`;

    values.forEach((v, i) => {
      const [x, y] = polar(cx, cy, mapR(v.value), angleAt(i));
      out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.7" fill="#FFFFFF" stroke="#005DAA" stroke-width="1.6"><title>${esc(v.name)} ${v.value}</title></circle>`;
    });

    values.forEach((v, i) => {
      const a = angleAt(i);
      const [x, y] = polar(cx, cy, mapR(v.value) + 22, a);
      const cos = Math.cos(a);
      const anchor = cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle';
      const dy = Math.sin(a) > 0.6 ? 6 : Math.sin(a) < -0.6 ? -4 : 0;
      out += `<text x="${x.toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}" font-size="10.4" fill="#5E7890" font-family="inherit">${esc(v.name)}</text>`;
      if (opts.showValues) {
        out += `<text x="${x.toFixed(1)}" y="${(y + dy + 12).toFixed(1)}" text-anchor="${anchor}" font-size="9.8" font-weight="600" fill="#005DAA" font-family="inherit">${v.value}</text>`;
      }
    });

    svg.innerHTML = out;
  }

  function smoothPath(pts) {
    if (pts.length < 2) return '';
    let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }

  function drawLineChart(svg, cfg) {
    if (!svg) return;
    const W = 620, H = 230, padL = 40, padR = 18, padT = 16, padB = 30;
    const labels = cfg.labels, min = cfg.min, max = cfg.max;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const xAt = i => padL + (labels.length === 1 ? plotW / 2 : (i * plotW) / (labels.length - 1));
    const yAt = v => padT + (1 - (v - min) / (max - min)) * plotH;
    const gid = 'grad-' + (svg.id || 'chart');

    let out = `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1B7FC4" stop-opacity=".18"/>
      <stop offset="100%" stop-color="#1B7FC4" stop-opacity="0"/></linearGradient></defs>`;

    (cfg.ticks || [60, 70, 80, 90]).forEach(t => {
      const y = yAt(t);
      out += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="rgba(8,52,87,.07)" stroke-width="1"/>`;
      out += `<text x="${padL - 9}" y="${(y + 3.5).toFixed(1)}" text-anchor="end" font-size="9.5" fill="#93A9BD" font-family="inherit">${t}</text>`;
    });
    labels.forEach((l, i) => {
      out += `<text x="${xAt(i).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="9.5" fill="#93A9BD" font-family="inherit">${l}</text>`;
    });

    cfg.series.forEach((s, si) => {
      const pts = s.data.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
      const path = smoothPath(pts);
      if (s.area) {
        const areaPath = path + ` L${xAt(s.data.length - 1).toFixed(1)},${(H - padB).toFixed(1)} L${xAt(0).toFixed(1)},${(H - padB).toFixed(1)} Z`;
        out += `<path d="${areaPath}" fill="url(#${gid})"/>`;
      }
      out += `<path class="${si === 0 ? 'chart-line' : ''}" d="${path}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2.2}" stroke-linecap="round" stroke-linejoin="round"${s.dash ? ' stroke-dasharray="5 5"' : ''}/>`;
      if (!s.dash) {
        pts.forEach((p, i) => {
          out += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.1" fill="#FFFFFF" stroke="${s.color}" stroke-width="1.8"><title>${esc(s.name)} · ${labels[i]} ${s.data[i]}</title></circle>`;
        });
      }
    });

    svg.innerHTML = out;

    $$('.chart-line', svg).forEach(path => {
      try {
        const len = path.getTotalLength();
        if (!len) return;
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        path.getBoundingClientRect();
        path.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(.22,.68,.28,1)';
        path.style.strokeDashoffset = 0;
      } catch (err) { /* noop */ }
    });
  }

  function drawGrowthRing(value) {
    const svg = $('#growthRing');
    if (!svg) return;
    const r = 76;
    const c = 2 * Math.PI * r;
    const target = c * (1 - value / 100);
    svg.innerHTML = `
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#7EC8F2"/><stop offset="60%" stop-color="#8FC7EC"/><stop offset="100%" stop-color="#8CBBDD"/>
        </linearGradient>
      </defs>
      <circle cx="90" cy="90" r="${r}" fill="none" stroke="rgba(255,255,255,.10)" stroke-width="9"/>
      <circle cx="90" cy="90" r="${r}" fill="none" stroke="rgba(126,200,242,.10)" stroke-width="1" stroke-dasharray="2 6"/>
      <circle id="ringProgress" cx="90" cy="90" r="${r}" fill="none" stroke="url(#ringGrad)" stroke-width="9"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c}"/>`;
    const progress = $('#ringProgress');
    if (!progress) return;
    if (reducedMotion()) { progress.setAttribute('stroke-dashoffset', target); return; }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        progress.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.22,.68,.28,1)';
        progress.setAttribute('stroke-dashoffset', target);
      });
    });
  }

  function renderGrowthTrend() {
    const gi = growthIndex();
    const isYear = state.trendRange === 'year';
    const labels = isYear
      ? ['11月', '12月', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月']
      : ['5月', '6月', '7月', '8月', '9月', '10月'];
    const back = isYear ? [8.2, 7.1, 6.2, 5.4, 4.6, 3.7, 2.9, 2.4, 1.9, 1.2, 0.5, 0] : [7.4, 6.1, 4.8, 3.2, 1.5, 0];
    const data = back.map(v => round1(gi - v));
    const team = labels.map((_, i) => round1(meanNow() * 0.92 - (labels.length - 1 - i) * 0.35));

    drawLineChart($('#growthChart'), {
      labels, min: 50, max: 100, ticks: [55, 65, 75, 85, 95],
      series: [
        { name: '我的成长指数', color: '#005DAA', area: true, data },
        { name: '同批次均值', color: '#B7CCDD', dash: true, data: team }
      ]
    });
  }

  /* ---------------------------------------------------------
     Identity rendering
  --------------------------------------------------------- */
  function renderIdentity() {
    const p = state.profile || {};
    const name = p.name || '同学';
    const meta = [p.dept, p.level].filter(Boolean).join(' · ') || '待完善资料';
    const ini = initials(p.name);

    ['sideName', 'topName'].forEach(id => { const el = $('#' + id); if (el) el.textContent = name; });
    const sideRole = $('#sideRole');
    if (sideRole) sideRole.textContent = [p.role || '未填写岗位', p.level].filter(Boolean).join(' · ');
    const topMeta = $('#topMeta');
    if (topMeta) topMeta.textContent = meta;
    ['sideAvatar', 'topAvatar', 'arAvatar'].forEach(id => { const el = $('#' + id); if (el) el.textContent = ini; });

    const gn = $('#greetingName');
    if (gn) gn.textContent = name;
    const orbitName = $('#orbitName');
    if (orbitName) orbitName.textContent = name.length > 4 ? name.slice(0, 4) : name;
    const orbitLevel = $('#orbitLevel');
    if (orbitLevel) orbitLevel.textContent = p.level || '—';

    const d = new Date();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const gd = $('#greetingDate');
    if (gd) gd.textContent = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · ${weekdays[d.getDay()]} · 第 ${phase().month} 个月`;

    const lead = $('#greetingLead');
    if (lead) {
      const ph = phase();
      lead.textContent = state.assessment
        ? `你在「${ph.stage}」的第 ${ph.month} 个月。以下数据全部来自你自己的测评与操作记录。`
        : `你在「${ph.stage}」的第 ${ph.month} 个月。现在只有你的起点自评，完成测评后画像会更准确。`;
    }

    const pill = $('#phasePill');
    if (pill) pill.textContent = `${phase().name} · ${phase().stage} · 第 ${phase().month} 个月`;
  }

  /* ---------------------------------------------------------
     Overview
  --------------------------------------------------------- */
  function loopItems() {
    return [
      { key: 'assess', done: !!state.assessment, title: '完成职业发展测评', meta: state.assessment ? `已完成 · ${state.assessment.at} · 六维画像已生成` : '9 道情境题 · 约 4 分钟', view: 'assessment' },
      { key: 'plan', done: state.plan.length >= 2, title: '加入 2 门学习课程', meta: state.plan.length ? `已加入 ${state.plan.length} 门 · 共 ${planHours()} 小时` : '从 AI 推荐中挑 2 门', view: 'training' },
      { key: 'mentor', done: state.mentorReqs.length >= 1, title: '向一位导师发起约见', meta: state.mentorReqs.length ? `已发起 ${state.mentorReqs.length} 次 · 等待确认` : 'AI 会生成对话议程', view: 'mentor' },
      { key: 'feedback', done: !!state.feedback, title: '提交一次成长体验反馈', meta: state.feedback ? `已提交 · 情绪温度 ${feedbackTemp()}/100` : '匿名 · 约 1 分钟', view: 'feedback' }
    ];
  }

  function renderActions() {
    const wrap = $('#actionList');
    if (!wrap) return;
    const items = loopItems();
    wrap.innerHTML = items.map(it => `
      <button class="action-item ${it.done ? 'is-done' : ''}" data-loop="${it.view}">
        <span class="check"><svg class="ico-xs" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5"/></svg></span>
        <span class="action-text">
          <strong>${esc(it.title)}</strong>
          <em>${esc(it.meta)}</em>
        </span>
      </button>
    `).join('');

    const done = items.filter(i => i.done).length;
    $('#actionCounter').textContent = done + ' / ' + items.length;
    $('#actionProgress').style.width = (done / items.length) * 100 + '%';
    $('#actionNote').textContent = done === items.length
      ? '闭环已完成，档案里已经留下 4 条可回看的证据。'
      : `还差 ${items.length - done} 步，每完成一步都会写入你的成长档案。`;
  }

  function renderInsights() {
    const wrap = $('#insightRow');
    if (!wrap) return;
    const { top, low } = topAndLow();
    const loop = loopItems().filter(i => !i.done);

    const cards = [];

    if (state.assessment) {
      cards.push({
        cls: 'is-amber',
        icon: '<path d="m12 3 1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4Z"/><path d="M18.5 16.5 19.3 19l2.2.8-2.2.9-.8 2.3-.8-2.3-2.2-.9 2.2-.8Z"/>',
        micro: 'AI 洞察',
        title: `「${top.name}」是你最强的一项`,
        desc: `你在这一维度拿到 ${top.value} 分，高于六维均值 ${Math.round(meanNow())}。优势如果不被看见，就不会变成机会。`,
        link: '查看测评依据 →',
        view: 'assessment'
      });
    } else {
      cards.push({
        cls: 'is-amber',
        icon: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/>',
        micro: '待完成',
        title: '你还没有生成正式的六维画像',
        desc: '现在展示的是你的起点自评。9 道情境题能让画像更准，也会解锁培养计划与导师匹配。',
        link: '开始测评 →',
        view: 'assessment'
      });
    }

    cards.push({
      cls: 'is-mint',
      icon: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
      micro: '跃迁空间',
      title: `接下来最值得投入：${low.name}`,
      desc: `这项当前 ${low.value} 分，是六维中最低的一项。AI 已按此调整了课程排序，并把最匹配的 2 门放在最前。`,
      link: '查看推荐课程 →',
      view: 'training'
    });

    cards.push({
      cls: 'is-sage',
      icon: '<path d="M4 17.5 9.5 12l4 3.5L20 8"/><path d="M15.5 8H20v4.5"/>',
      micro: '成长闭环',
      title: loop.length ? `还差 ${loop.length} 步形成完整闭环` : '成长闭环已完整跑通',
      desc: loop.length
        ? `下一步：${loop[0].title}。完成 4 步后，你的档案里会有一条从测评到反馈的完整证据链。`
        : '测评、学习、导师与反馈都已留下记录，AI 可以基于完整数据生成阶段总结。',
      link: loop.length ? '去做下一步 →' : '查看成长档案 →',
      view: loop.length ? loop[0].view : 'archive'
    });

    wrap.innerHTML = cards.map(c => `
      <article class="insight-card">
        <div class="icon-sq ${c.cls}"><svg class="ico" viewBox="0 0 24 24">${c.icon}</svg></div>
        <div class="insight-body">
          <p class="micro">${c.micro}</p>
          <h3>${esc(c.title)}</h3>
          <p>${esc(c.desc)}</p>
          <button class="link-btn" data-goto="${c.view}">${c.link}</button>
        </div>
      </article>
    `).join('');
  }

  function renderOverview() {
    renderIdentity();
    const gi = growthIndex();
    $('#growthIndex').textContent = gi.toFixed(1);
    drawGrowthRing(gi);

    const baseGrowth = round1(mean(dimsBase().map(d => d.value)) * 0.9);
    const foot = $('#ringFoot');
    if (foot) {
      foot.innerHTML = state.assessment
        ? `<span class="up">↑ ${round1(gi - baseGrowth)}</span> 较起点自评 · 已测评校准`
        : '基于起点自评 · 待测评校准';
    }

    const cta = $('#heroCta');
    if (cta) cta.textContent = state.assessment ? '查看我的测评结果' : '完成职业测评';

    renderInsights();
    renderActions();
    renderGrowthTrend();

    radarMarkup($('#overviewRadar'), dimsNow(), { showValues: true });
    const src = $('#radarSource');
    if (src) {
      src.textContent = state.assessment ? '测评校准 · ' + state.assessment.at : '起点自评 · 待校准';
      src.classList.toggle('is-calibrated', !!state.assessment);
    }
    const rn = $('#radarNote');
    if (rn) {
      const t = topAndLow();
      rn.innerHTML = `<span>最强项 <b>${t.top.name} ${t.top.value}</b></span><span>待补强 <b>${t.low.name} ${t.low.value}</b></span>`;
    }

    const recs = $('#overviewRecs');
    if (recs) {
      const courses = sortedCourses().slice(0, 2);
      const mentor = sortedMentors()[0];
      recs.innerHTML = courses.map((c, i) => `
        <button class="mini-item" data-rec="course:${c.id}">
          <span class="mini-thumb ${i === 1 ? 'is-alt' : ''}">课</span>
          <span class="mini-body">
            <strong>${esc(c.title)}</strong>
            <span>${c.hours} 小时 · ${c.catLabel} · ${courseMatch(c)}% 匹配</span>
          </span>
          <span class="mini-score">${courseMatch(c)}%</span>
        </button>
      `).join('') + (mentor ? `
        <button class="mini-item" data-rec="mentor:${mentor.id}">
          <span class="mini-thumb is-sage">师</span>
          <span class="mini-body">
            <strong>${esc(mentor.name)} · ${esc(mentor.role)}</strong>
            <span>导师匹配 ${mentorMatch(mentor)}% · ${esc(mentor.slots || '时间可协商')}</span>
          </span>
          <span class="mini-score">${mentorMatch(mentor)}%</span>
        </button>` : `
        <button class="mini-item" data-add-mentor>
          <span class="mini-thumb is-sage">师</span>
          <span class="mini-body">
            <strong>添加你的第一位导师</strong>
            <span>由你录入导师信息，AI 按能力缺口计算匹配度</span>
          </span>
          <span class="mini-score">＋</span>
        </button>`);
    }
  }

  /* ---------------------------------------------------------
     Assessment
  --------------------------------------------------------- */
  function setAssessMode(mode) {
    $('#assessIntro').hidden = mode !== 'intro';
    $('#assessQuiz').hidden = mode !== 'quiz';
    $('#assessResult').hidden = mode !== 'result';
  }

  function updateAssessStatus() {
    const el = $('#assessStatus');
    if (!el) return;
    if (state.assessment) {
      el.className = 'status-pill is-green';
      el.innerHTML = `<i></i>已完成 · ${esc(state.assessment.at)}${state.assessment.count > 1 ? ' · 第 ' + state.assessment.count + ' 次' : ''}`;
    } else {
      el.className = 'status-pill';
      el.innerHTML = '<i></i>未开始';
    }
    const pend = $('.nav-pend[data-pend="assessment"]');
    if (pend) pend.classList.toggle('is-done', !!state.assessment);
  }

  function renderAssessment() {
    updateAssessStatus();
    setAssessMode(state.assessment ? 'result' : 'intro');
    if (state.assessment) {
      renderResult(false);
    }
  }

  function startQuiz(reset) {
    if (reset) {
      state.answers = Array(QUESTIONS.length).fill(null);
      state.qIndex = 0;
    }
    state.qIndex = state.qIndex || 0;
    setAssessMode('quiz');
    renderQuestion();
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }

  function renderQuestion() {
    const i = state.qIndex || 0;
    const q = QUESTIONS[i];
    $('#qIndex').textContent = i + 1;
    $('#qNo').textContent = i + 1;
    $('#qText').textContent = q.text;
    $('#qProgress').style.width = ((i + 1) / QUESTIONS.length) * 100 + '%';

    const wrap = $('#qOptions');
    wrap.innerHTML = '';
    q.options.forEach((opt, oi) => {
      const btn = document.createElement('button');
      btn.className = 'option' + (state.answers[i] === oi ? ' is-picked' : '');
      btn.innerHTML = `<span class="letter">${String.fromCharCode(65 + oi)}</span><span>${esc(opt.text)}</span>`;
      btn.addEventListener('click', () => selectOption(oi));
      wrap.appendChild(btn);
    });
    const back = $('#qBack');
    back.disabled = i === 0;
    back.style.opacity = i === 0 ? '.4' : '1';
  }

  let advancing = false;
  function selectOption(oi) {
    if (advancing) return;
    advancing = true;
    const i = state.qIndex;
    state.answers[i] = oi;
    $$('#qOptions .option').forEach((b, idx) => b.classList.toggle('is-picked', idx === oi));

    setTimeout(() => {
      advancing = false;
      if (i < QUESTIONS.length - 1) {
        state.qIndex = i + 1;
        renderQuestion();
      } else {
        finishQuiz();
      }
    }, 230);
  }

  function finishQuiz() {
    const totals = {};
    DIMS.forEach(d => { totals[d.key] = 0; });

    state.answers.forEach((ans, qi) => {
      if (ans == null) return;
      const scores = QUESTIONS[qi].options[ans].scores || {};
      Object.keys(scores).forEach(k => { totals[k] += scores[k]; });
    });

    const dims = {};
    DIMS.forEach(d => {
      const max = DIM_MAX[d.key] || 1;
      dims[d.key] = clamp(Math.round(56 + (totals[d.key] / max) * 40), 55, 96);
    });

    const count = state.assessment ? state.assessment.count + 1 : 1;
    state.assessment = { dims, at: todayStr(), count };
    state.qIndex = 0;
    save();

    renderAssessment();
    renderOverview();
    renderTraining();
    renderMentors();
    renderArchive();
    setAssessMode('result');
    renderResult(true);
    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    toast('测评完成，六维画像已由你的作答生成');
  }

  function renderResult(animate) {
    const res = state.assessment;
    if (!res) return;
    const dims = DIMS.map(d => ({ key: d.key, name: d.name, color: d.color, value: res.dims[d.key] }));
    radarMarkup($('#resultRadar'), dims, { showValues: true, radiusRatio: 0.29 });

    const sorted = dims.slice().sort((a, b) => b.value - a.value);
    const top = sorted[0], mid = sorted[1], low = sorted[sorted.length - 1];
    const arche = ARCHETYPES[top.key] || ARCHETYPES.learn;

    $('#archetypeName').textContent = arche.name;
    $('#archetypeDesc').textContent = arche.desc;
    $('#assessStamp').textContent = `${res.at} · 第 ${res.count} 次`;

    const tags = [top.name, mid.name, GOALS[state.profile.goal] || '成长型动机', low.value < 72 ? '待补强 · ' + low.name : '六维较均衡'];
    $('#traitRow').innerHTML = tags.map(t => `<span>${esc(t)}</span>`).join('');

    const typing = $('#assessTyping');
    typing.hidden = false;
    typing.textContent = '正在生成…';

    const paras = [
      `你的能力形状更像一把向前倾斜的梯子：${top.name} ${top.value} 明显领先，这让你在陌生课题里能快速站稳。`,
      `真正限制你的不是能力短板，而是 ${low.name} ${low.value}。当项目进入高压周期，它会影响你持续输出的稳定性。`,
      `未来 90 天，建议把 60% 的精力放在「${mid.name}」的项目实践上，30% 用于补足${low.name}，剩下 10% 留给复盘。`
    ];

    if (animate) {
      typeParagraphs($('#assessAiText'), paras, 13, () => {
        typing.textContent = '生成完成';
        setTimeout(() => { typing.hidden = true; }, 1800);
      });
    } else {
      $('#assessAiText').innerHTML = paras.map(p => `<p>${esc(p)}</p>`).join('');
      typing.hidden = true;
    }
  }

  function demoAnswers() {
    return [0, 2, 0, 0, 0, 2, 2, 0, 3];
  }

  /* ---------------------------------------------------------
     Training
  --------------------------------------------------------- */
  function renderTraining() {
    const { low } = topAndLow();
    const reason = $('#trainingReason');
    if (reason) {
      reason.textContent = state.assessment
        ? `你的「${low.name}」当前 ${low.value} 分，是六维中最低的一项。AI 优先补足它，再叠加与你目标「${GOALS[state.profile.goal] || '持续成长'}」相关的课程，共从 128 门中筛出 ${COURSES.length} 门。`
        : `你还未完成测评，当前按起点自评中最低的「${low.name}」排序。完成 9 道情境题后，这里的匹配分会被重新计算。`;
    }
    const stat = $('#trainingStat');
    if (stat) stat.innerHTML = `<i></i>计划内 ${state.plan.length} 门 · 共 ${planHours()} 小时`;

    renderCourses();
    renderPlan();
    renderPath();
  }

  function renderCourses() {
    const grid = $('#courseGrid');
    if (!grid) return;
    const filter = state.courseFilter || 'all';
    const list = sortedCourses().filter(c => filter === 'all' || c.cat === filter);

    grid.innerHTML = list.map(c => {
      const added = state.plan.some(p => p.id === c.id);
      const m = courseMatch(c);
      const focus = c.dims[0];
      return `
        <article class="course-card" data-course="${c.id}">
          <div class="course-top">
            <span class="cat-badge cat-${c.cat}">${c.catLabel}</span>
            <span class="match-badge">${m}% 匹配</span>
          </div>
          <h4>${esc(c.title)}</h4>
          <p class="course-provider">${esc(c.provider)}</p>
          <div class="course-meta">
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/></svg>${c.hours} 小时</span>
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="5.5" width="17" height="14" rx="2"/><path d="M3.5 10h17"/></svg>${esc(c.format)}</span>
            <span>${c.learners.toLocaleString()} 人学过</span>
          </div>
          <div class="course-reason">
            <svg viewBox="0 0 24 24"><path d="m12 3 1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4Z"/></svg>
            <span>你的「${DIM_NAME[focus]}」为 ${dimVal(focus)} 分。这门课的重点是${esc(c.angle)}。</span>
          </div>
          <div class="course-foot">
            <div class="course-tags">${c.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
            <button class="btn mini ${added ? 'is-added' : 'primary'}" data-add="${c.id}" ${added ? 'disabled' : ''}>
              ${added ? '已加入 ✓' : '加入计划'}
            </button>
          </div>
        </article>`;
    }).join('');
  }

  function renderPlan() {
    const list = $('#planList');
    if (!list) return;
    $('#planCount').textContent = state.plan.length + ' 门';
    $('#planHours').textContent = planHours() + ' h';
    const stat = $('#trainingStat');
    if (stat) stat.innerHTML = `<i></i>计划内 ${state.plan.length} 门 · 共 ${planHours()} 小时`;

    if (!state.plan.length) {
      list.innerHTML = '<p class="plan-empty">还没有课程。把 AI 推荐的第一门加入计划，档案里就会多一条学习记录。</p>';
      return;
    }
    list.innerHTML = state.plan.map(p => {
      const c = COURSES.find(x => x.id === p.id);
      if (!c) return '';
      return `
        <div class="plan-item">
          <div class="plan-item-top">
            <strong>${esc(c.title)}</strong>
            <button class="plan-remove" data-remove="${c.id}" aria-label="移除课程">×</button>
          </div>
          <div class="plan-meta">${c.hours} 小时 · 已加入 ${esc(p.at)} · 进度 ${p.progress}%</div>
          <div class="plan-bar"><i style="width:${p.progress}%"></i></div>
        </div>`;
    }).join('');
  }

  function renderPath() {
    const wrap = $('#pathList');
    if (!wrap) return;
    const { low } = topAndLow();
    const first = sortedCourses()[0];
    const using = state.plan.length ? COURSES.find(c => c.id === state.plan[0].id) : first;
    const steps = [
      { title: '认知对齐', desc: `本月 · 补足「${low.name}」的基础认知` },
      { title: '项目实践', desc: '下月 · 在真实项目里用一次，并留下证据' },
      { title: '影响扩展', desc: '第 3 个月 · 内部分享 + 导师复盘' }
    ];
    wrap.innerHTML = steps.map((s, i) => `
      <div class="path-step">
        <span class="path-dot">${i + 1}</span>
        <div><strong>${esc(s.title)}</strong><em>${esc(i === 0 && using ? `本月 · ${using.title}` : s.desc)}</em></div>
      </div>
    `).join('');
  }

  /* ---------------------------------------------------------
     Mentor
  --------------------------------------------------------- */
  function scoreRing(value) {
    const r = 19;
    const c = 2 * Math.PI * r;
    const color = value >= 90 ? '#2E9FD8' : '#005DAA';
    return `
      <svg viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="${r}" fill="none" stroke="rgba(8,52,87,.09)" stroke-width="3.2"/>
        <circle cx="24" cy="24" r="${r}" fill="none" stroke="${color}" stroke-width="3.2" stroke-linecap="round"
          stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - value / 100)}"/>
      </svg><b>${value}<small>%</small></b>`;
  }

  function renderMentors() {
    const grid = $('#mentorGrid');
    if (!grid) return;
    const filter = state.mentorFilter || 'all';
    const all = sortedMentors();
    const list = all.filter(m => filter === 'all' || (m.dims || []).includes(filter));

    if (!state.mentors.length) {
      grid.innerHTML = `
        <article class="mentor-empty">
          <div class="mentor-empty-icon">
            <svg viewBox="0 0 48 48"><path d="M32 15a7 7 0 1 0 0 14"/><circle cx="20" cy="22" r="7"/><path d="M8 39c0-6 5.4-10 12-10s12 4 12 10"/></svg>
          </div>
          <h3>导师库还是空的</h3>
          <p>这里不预置任何人物。把你想真正连接的人录进来，平台会根据你的能力缺口计算匹配度，并生成第一次对话议程。${state.profile && state.profile.mentor ? `<br><b>你在录入身份时提到「${esc(state.profile.mentor)}」，先把 TA 的信息补全吧。</b>` : ''}</p>
          <button class="btn primary" data-add-mentor>
            <svg class="ico-xs" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            添加第一位导师
          </button>
        </article>`;
    } else if (!list.length) {
      grid.innerHTML = '<p class="plan-empty">这个维度下还没有导师，换一个筛选条件看看。</p>';
    } else {
      grid.innerHTML = list.map(m => {
        const requested = state.mentorReqs.some(r => r.id === m.id);
        const dims = m.dims && m.dims.length ? m.dims : ['learn'];
        const primaryDim = DIMS.find(d => d.key === dims[0]) || DIMS[0];
        const tags = dims.map(k => DIM_NAME[k]).concat(GOALS[m.goal] || []).slice(0, 3);
        return `
          <article class="mentor-card">
            <div class="mentor-top">
              <div class="mentor-person">
                <div class="avatar mentor-avatar" style="--a1:#E8F4FD;--a2:${primaryDim.color}">${esc(initials(m.name))}</div>
                <div>
                  <h4>${esc(m.name)}</h4>
                  <p>${esc(m.role || '未填写身份')}</p>
                </div>
              </div>
              <div class="score-ring" title="匹配度 ${mentorMatch(m)}%">${scoreRing(mentorMatch(m))}</div>
            </div>
            <div class="mentor-tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
            <p class="mentor-quote">${esc(m.note || `可以在「${DIM_NAME[dims[0]]}」上给你具体反馈，并用真实项目帮你复盘。`)}</p>
            <div class="mentor-slots"><i></i>${esc(m.slots || '时间可协商')}</div>
            <button class="btn ${requested ? 'ghost' : 'primary'} block" data-mentor="${m.id}" ${requested ? 'disabled' : ''}>
              ${requested ? '已发起 · 待导师确认' : '发起一次约见'}
            </button>
          </article>`;
      }).join('');
    }

    const note = $('#mentorNote');
    if (note) {
      note.textContent = state.mentors.length
        ? (state.assessment
          ? `匹配度基于你 ${state.assessment.at} 的测评结果计算，缺口越大、目标越一致，分数越高。`
          : '当前按你的起点自评排序。完成测评后，匹配度会按更准确的缺口重新计算。')
        : '你还没有录入导师，匹配度将基于你填写的擅长维度实时计算。';
    }
    const lead = $('#mentorLead');
    if (lead) {
      lead.textContent = state.mentors.length
        ? `你已录入 ${state.mentors.length} 位导师。你当前的缺口是「${topAndLow().low.name}」，AI 会优先推荐能补上它的人。`
        : `你录入导师信息，AI 负责计算匹配度：不只看你仰望谁，也看谁能补上你当下的能力缺口。`;
    }
  }

  const AGENDA = [
    { title: '第一次 · 建立地图', desc: '澄清你未来 6 个月最想发生的改变，导师给出他的外部视角。' },
    { title: '第二次 · 拆解难题', desc: '带来一个真实的项目难题，现场拆解决策链与关键利益相关方。' },
    { title: '第三次 · 复盘与扩展', desc: '复盘行动结果，识别能力盲区，约定下一个观察点。' }
  ];

  function openMentorModal(id) {
    const mentor = state.mentors.find(m => m.id === id);
    if (!mentor) return;
    state.currentMentor = id;

    const { low } = topAndLow();
    const firstDim = (mentor.dims && mentor.dims[0]) || 'learn';
    const opening = `开场可以这样说：我最近在「${low.name}」上卡住了，想请你从「${DIM_NAME[firstDim]}」的角度帮我看看判断盲区。`;

    $('#mentorModalTitle').textContent = `与${mentor.name}的第一次对话`;
    $('#mentorModalSub').textContent = `${mentor.role || '导师'} · 45 分钟 · 线上 · 匹配度 ${mentorMatch(mentor)}%`;
    $('#agendaList').innerHTML = `
      <div class="agenda-item">
        <span class="agenda-num">1</span>
        <div><strong>开场 · 带着真实难题来</strong><p>${esc(opening)}</p></div>
      </div>
      <div class="agenda-item">
        <span class="agenda-num">2</span>
        <div><strong>你的诉求</strong><p>${esc(mentor.note || '把你想解决的问题说具体：发生在哪个项目、你已经试过什么、希望对方给什么反馈。')}</p></div>
      </div>` + AGENDA.slice(1).map((a, i) => `
      <div class="agenda-item">
        <span class="agenda-num">${i + 3}</span>
        <div><strong>${esc(a.title)}</strong><p>${esc(a.desc)}</p></div>
      </div>`).join('');
    $('#mentorModal').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeMentorModal() {
    $('#mentorModal').classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function openAddMentor() {
    $('#amName').value = (state.profile && state.profile.mentor) || '';
    $('#amRole').value = '';
    $('#amSlots').value = '';
    $('#amNote').value = '';
    $('#amGoal').value = (state.profile && state.profile.goal) || 'lead';
    $$('#amDims .dim-pick').forEach(b => b.classList.remove('is-picked'));
    $('#amError').hidden = true;
    $('#addMentorModal').classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => $('#amName').focus(), 120);
  }
  function closeAddMentor() {
    $('#addMentorModal').classList.remove('is-open');
    document.body.style.overflow = '';
  }
  function saveMentor() {
    const name = $('#amName').value.trim();
    const dims = $$('#amDims .dim-pick.is-picked').map(b => b.dataset.dim);
    if (!name || !dims.length) {
      $('#amError').hidden = false;
      return;
    }
    state.mentors.push({
      id: 'm' + Date.now(),
      name,
      role: $('#amRole').value.trim(),
      dims,
      goal: $('#amGoal').value,
      slots: $('#amSlots').value.trim(),
      note: $('#amNote').value.trim()
    });
    save();
    closeAddMentor();
    renderMentors();
    renderOverview();
    renderArchive();
    go('mentor');
    toast(`已录入导师 ${name}，匹配度已按你的能力缺口计算`);
  }

  /* ---------------------------------------------------------
     Archive
  --------------------------------------------------------- */
  function archiveEntries() {
    const entries = [];
    const p = state.profile || {};

    if (p.joined) {
      const [y, m] = p.joined.split('-');
      entries.push({
        date: `${y}.${m}`,
        ts: new Date(Number(y), Number(m) - 1, 1).getTime(),
        kind: 'start',
        title: '加入雏翼计划',
        desc: `以${p.role || '新同学'}身份加入${p.dept || '公司'}，进入雏翼长青培养体系。`,
        tags: ['起点']
      });
    } else {
      entries.push({
        date: todayStr(),
        ts: Date.now(),
        kind: 'start',
        title: '建立我的成长档案',
        desc: `${p.name || '你'}完成了身份录入与起点自评，后续所有数据都由你自己的操作生成。`,
        tags: ['起点']
      });
    }

    if (state.assessment) {
      const t = topAndLow();
      entries.push({
        date: state.assessment.at,
        ts: Date.now() - 10,
        kind: 'review',
        title: `完成职业发展测评（第 ${state.assessment.count} 次）`,
        desc: `六维坐标已生成：${t.top.name} ${t.top.value} 领先，${t.low.name} ${t.low.value} 待补强。`,
        tags: ['测评', 'AI 画像']
      });
    }

    state.plan.forEach((pl, i) => {
      const c = COURSES.find(x => x.id === pl.id);
      if (!c) return;
      entries.push({
        date: pl.at,
        ts: Date.now() - 100 + i,
        kind: 'cert',
        title: `加入学习计划《${c.title}》`,
        desc: `${c.hours} 小时 · ${c.catLabel} · ${c.provider}`,
        tags: ['学习']
      });
    });

    state.mentorReqs.forEach((r, i) => {
      const m = state.mentors.find(x => x.id === r.id);
      if (!m) return;
      entries.push({
        date: r.at,
        ts: Date.now() - 200 + i,
        kind: 'project',
        title: `向${m.name}发起导师约见`,
        desc: `匹配度 ${r.match || mentorMatch(m)}% · AI 已生成对话议程，等待导师确认。`,
        tags: ['导师', '关键引路']
      });
    });

    if (state.feedback) {
      entries.push({
        date: state.feedback.at,
        ts: Date.now() - 300,
        kind: 'role',
        title: '提交成长体验反馈',
        desc: `情绪温度 ${feedbackTemp()}/100 · 主要关注：${feedbackAnalysis().theme.title}。`,
        tags: ['反馈', '组织洞察']
      });
    }

    entries.sort((a, b) => b.ts - a.ts);
    return entries;
  }

  function renderArchive() {
    const p = state.profile || {};
    $('#arName').textContent = p.name || '—';
    $('#arPill').textContent = `${phase().stage} · 第 ${phase().month} 个月`;
    $('#arRole').textContent = [p.role || '未填写岗位', p.dept || '', p.level || ''].filter(Boolean).join(' · ');

    $('#arMeta').innerHTML = [
      p.mentor ? `导师 ${esc(p.mentor)}` : '导师：待匹配',
      p.joined ? `入职 ${esc(p.joined.replace('-', '.'))}` : '入职时间：未填写',
      `目标 ${esc(GOALS[p.goal] || '待设定')}`
    ].map(t => `<span>${t}</span>`).join('');

    $('#arStats').innerHTML = [
      { v: growthIndex().toFixed(1), l: '成长指数' },
      { v: state.assessment ? state.assessment.count : '0', l: '测评次数' },
      { v: state.plan.length, l: '学习计划' },
      { v: state.mentorReqs.length, l: '导师约见' }
    ].map(s => `<div><strong>${s.v}</strong><span>${s.l}</span></div>`).join('');

    const entries = archiveEntries();
    const tl = $('#timeline');
    tl.innerHTML = entries.length ? entries.map(e => `
      <div class="tl-item">
        <span class="tl-node is-${e.kind}"></span>
        <div class="tl-time">${esc(e.date)}</div>
        <div class="tl-body">
          <strong>${esc(e.title)}</strong>
          <p>${esc(e.desc)}</p>
          <div class="tl-tags">${e.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>
        </div>
      </div>`).join('')
      : '<p class="plan-empty">还没有记录。完成一次测评或加入一门课，这里会自动出现第一条里程碑。</p>';

    radarMarkup($('#archiveRadar'), dimsNow(), {
      showValues: false,
      compare: dimsBase().map(d => d.value)
    });
    $('#archiveCompareTag').textContent = state.assessment ? '起点自评 → 测评校准' : '起点自评 → 现在';
    $('#archiveLegendNow').textContent = `现在 · ${growthIndex().toFixed(1)}`;
    $('#archiveLegendBase').textContent = '起点自评';

    renderArchiveSummary();

    const t = state.assessment ? topAndLow() : null;
    const cards = [
      { micro: '最强维度', value: t ? `${t.top.name}` : '待测评', sub: t ? `${t.top.value} 分 · 你的相对优势` : '完成测评后生成', note: t ? '把它变成可被看见的成果' : '9 道情境题即可解锁' },
      { micro: '学习投入', value: `${planHours()} h`, sub: `${state.plan.length} 门课程在计划内`, note: state.plan.length ? '第一门建议本月完成' : '还没有加入课程' },
      { micro: '导师连接', value: `${state.mentorReqs.length} 次`, sub: state.mentorReqs.length ? '已发起约见' : '尚未发起约见', note: state.mentorReqs.length ? '等待导师确认时间' : '第一位导师很关键' },
      { micro: '反馈闭环', value: state.feedback ? `${feedbackTemp()}` : '—', sub: state.feedback ? '你的情绪温度 / 100' : '尚未提交反馈', note: state.feedback ? feedbackAnalysis().theme.title : '匿名，约 1 分钟' }
    ];

    $('#achieveGrid').innerHTML = cards.map(c => `
      <article class="card achieve">
        <p class="micro">${c.micro}</p>
        <strong>${esc(c.value)}</strong>
        <span>${esc(c.sub)}</span>
        <em>${esc(c.note)}</em>
      </article>`).join('');
  }

  function archiveSummaryParas() {
    const p = state.profile || {};
    const { top, low } = topAndLow();
    const paras = [];

    if (state.assessment) {
      paras.push(`${p.name}，从你的起点自评到 ${state.assessment.at} 的这次测评，你的能力形状已经清晰了：${top.name} ${top.value} 是相对优势，${low.name} ${low.value} 是当前最该补的一环。`);
    } else {
      paras.push(`${p.name}，目前档案里只有你自己的起点自评。它说明你如何看待自己，但还不能说明你在真实情境里会怎么做——完成一次测评，这份档案才算真正开始。`);
    }

    const loop = loopItems();
    const done = loop.filter(i => i.done);
    paras.push(done.length
      ? `你已经完成成长闭环中的 ${done.length} / ${loop.length} 步：${done.map(i => i.title).join('、')}。这些操作已经变成档案里的 ${archiveEntries().length} 条记录。`
      : `你还没有开始成长闭环。建议的第一步不是上课，而是先完成测评，让后续的课程与导师推荐有依据。`);

    paras.push(state.plan.length
      ? `下一步，把《${COURSES.find(c => c.id === state.plan[0].id).title}》放进真实项目里用一次，并请${p.mentor || '一位导师'}帮你复盘。只有被验证的学习，才会变成能力。`
      : `下一步，从 AI 推荐的第一门课开始：${sortedCourses()[0].title}。学完记得回到这里，档案会跟着你一起更新。`);

    return paras;
  }

  function renderArchiveSummary() {
    const el = $('#archiveAiText');
    if (!el) return;
    el.innerHTML = archiveSummaryParas().map(x => `<p>${esc(x)}</p>`).join('');
    const p = state.profile || {};
    const t = topAndLow();
    $('#archiveTags').innerHTML = [
      phase().stage,
      state.assessment ? `${t.top.name} ${t.top.value}` : '待测评',
      `${GOALS[p.goal] || '持续成长'}目标`,
      state.plan.length ? '学习进行中' : '学习未开始'
    ].map(x => `<span>${esc(x)}</span>`).join('');
  }

  /* ---------------------------------------------------------
     Feedback
  --------------------------------------------------------- */
  const THEMES = {
    path: { title: '成长路径清晰度', sug: '和上级把「下一阶段可验证的目标」写成 1–2 条具体结果，而不是抽象的「多锻炼」。' },
    learn: { title: '学习与成长机会', sug: '在项目排期里先锁定固定的学习时段，避免成长机会被交付节奏挤掉。' },
    feedback: { title: '反馈质量', sug: '把导师对话从「答疑」升级为「项目复盘」，每次带一个真实难题去。' },
    collab: { title: '团队协作支持', sug: '梳理跨部门协作中的接口人与决策链，减少无效往返。' }
  };

  function readFeedbackScores() {
    const out = {};
    $$('[data-slider]').forEach(s => { out[s.dataset.key] = Number(s.value); });
    return out;
  }
  function feedbackScores() {
    return state.feedback ? state.feedback.scores : readFeedbackScores();
  }
  function feedbackTemp() {
    const s = feedbackScores();
    return Math.round(mean(Object.values(s)) * 10);
  }

  function feedbackAnalysis() {
    const s = feedbackScores();
    const entries = Object.keys(THEMES).map(k => ({ key: k, score: s[k] == null ? 6 : s[k], ...THEMES[k] }));
    entries.sort((a, b) => a.score - b.score);
    const temp = Math.round(mean(Object.values(s)) * 10);
    const pos = clamp(Math.round((temp / 100) * 68), 12, 70);
    const neg = clamp(Math.round((100 - temp) * 0.32), 6, 26);
    const neu = Math.max(0, 100 - pos - neg);
    return { theme: entries[0], ranked: entries, temp, pos, neu, neg };
  }

  const KEYWORDS = ['导师', '成长', '路径', '学习', '项目', '协作', '反馈', '压力', '机会', '团队', '轮岗', '时间', '领导', '沟通'];

  function renderFeedback() {
    const sliders = $$('[data-slider]');
    if (state.feedback && state.feedback.scores) {
      sliders.forEach(s => {
        const v = state.feedback.scores[s.dataset.key];
        if (v != null) s.value = v;
      });
    }
    initSliders();

    if (state.feedback) {
      const textEl = $('#feedbackText');
      if (textEl && state.feedback.text) textEl.value = state.feedback.text;
      $('#analysisEmpty').hidden = true;
      $('#analysisTag').textContent = `已分析 · ${state.feedback.at}`;
      renderAnalysis();
      const btn = $('#submitFeedback');
      btn.innerHTML = '更新我的反馈';
    }

    renderBenchmark();
    renderEchoes();
    const badge = $('#feedbackBadge');
    if (badge) badge.style.display = state.feedback ? 'none' : '';
  }

  function renderEchoes() {
    const wrap = $('#echoList');
    if (!wrap) return;
    if (state.feedback && state.feedback.text) {
      const p = state.profile || {};
      wrap.innerHTML = `
        <blockquote>“${esc(state.feedback.text)}”</blockquote>
        <div class="echo-meta">
          <span class="avatar avatar-xs">${esc(initials(p.name))}</span>
          ${esc(p.name || '我')}${p.dept ? ' · ' + esc(p.dept) : ''} · ${esc(state.feedback.at)}
        </div>
        <p class="tiny">${state.feedback.anon === false ? '你选择了实名提交。' : '这段文字仅你自己可见，匿名参与组织分析。'}</p>`;
    } else {
      wrap.innerHTML = `
        <p class="plan-empty">你还没有写下自己的回声。</p>
        <p class="tiny">提交左侧问卷后，你写下的那段话会保存在这里，作为自己成长体验的一份记录。</p>`;
    }
  }

  function renderAnalysis() {
    const box = $('#analysisResult');
    const a = feedbackAnalysis();
    const text = $('#feedbackText').value.trim();
    const kws = KEYWORDS.filter(k => text.includes(k)).slice(0, 6);

    box.hidden = false;
    box.innerHTML = `
      <div class="sentiment">
        <div class="sentiment-score"><strong>${a.temp}</strong><span>/ 100 情绪温度</span></div>
        <div class="sentiment-bars">
          <i style="width:${a.pos}%" class="pos"></i><i style="width:${a.neu}%" class="neu"></i><i style="width:${a.neg}%" class="neg"></i>
        </div>
        <div class="sentiment-legend"><span>积极 ${a.pos}%</span><span>平稳 ${a.neu}%</span><span>待关注 ${a.neg}%</span></div>
      </div>

      <div class="themes">
        <p class="micro">你的关注主题 · 按得分从低到高</p>
        ${a.ranked.map(t => `
          <div class="theme-row">
            <span>${esc(t.title)}</span>
            <div class="theme-bar ${t.key === a.theme.key ? 'is-warn' : ''}"><i style="width:${t.score * 10}%"></i></div>
            <b>${t.score}</b>
          </div>`).join('')}
      </div>

      <div class="ai-actions">
        <p class="micro">AI 解读与建议</p>
        <p class="analysis-derived">${esc(
          a.temp >= 75
            ? `整体体验偏积极（${a.temp}/100）。你最主要的拉扯点在「${a.theme.title}」，它不是情绪问题，而是一个可以被设计解决的机制问题。`
            : a.temp >= 60
              ? `整体体验中性偏好（${a.temp}/100）。你的成长动力还在，但「${a.theme.title}」正在消耗它。`
              : `整体体验偏紧（${a.temp}/100）。「${a.theme.title}」已经明显影响到你的体验，建议尽快与上级做一次非绩效性质的对话。`
        )}</p>
        <ol><li>${esc(a.theme.sug)}</li>
          <li>${esc(state.assessment ? `把这次反馈与你的测评结果对照：「${topAndLow().low.name}」可能是同一个问题的两种表现。` : '先完成一次职业测评，让反馈与能力数据互相印证。')}</li>
          <li>下个月复测这四项，看变化而不是看绝对值。</li>
        </ol>
      </div>

      ${kws.length ? `<div class="kw-chips">${kws.map(k => `<span>${esc(k)}</span>`).join('')}</div>` : ''}

      <p class="tiny">分析基于你本次填写的 4 项评分与文字；团队对照只展示聚合值。</p>
    `;
  }

  function renderBenchmark() {
    const wrap = $('#benchmark');
    if (!wrap) return;
    const s = feedbackScores();
    const team = { path: 7.1, learn: 6.4, feedback: 6.8, collab: 7.3 };
    const rows = [
      { k: 'path', label: '成长路径清晰度' },
      { k: 'learn', label: '学习与成长机会' },
      { k: 'feedback', label: '反馈质量' },
      { k: 'collab', label: '团队协作支持' }
    ];
    wrap.innerHTML = rows.map(r => `
      <div class="bench-row">
        <div class="bench-top"><span>${r.label}</span><em>你 ${s[r.k]} · 基线 ${team[r.k]}</em></div>
        <div class="bench-bars">
          <div class="bench-bar"><i style="width:${s[r.k] * 10}%"></i></div>
          <div class="bench-bar is-team"><i style="width:${team[r.k] * 10}%"></i></div>
        </div>
      </div>`).join('') + `
      <div class="bench-legend"><span><i></i>我的评分</span><span><i></i>参考基线</span></div>`;
  }

  function initSliders() {
    $$('[data-slider]').forEach(input => {
      const update = () => {
        const v = Number(input.value);
        input.style.setProperty('--pct', v * 10 + '%');
        const label = input.parentElement.querySelector('[data-val]');
        if (label) label.textContent = v;
      };
      update();
      if (!input.dataset.bound) {
        input.dataset.bound = '1';
        input.addEventListener('input', () => {
          update();
          renderBenchmark();
          if (state.feedback) {
            state.feedback.scores[input.dataset.key] = Number(input.value);
            save();
            renderAnalysis();
          }
        });
      }
    });
  }

  /* ---------------------------------------------------------
     Typewriter
  --------------------------------------------------------- */
  const timers = new WeakMap();
  function typeParagraphs(el, paras, speed, done) {
    if (!el) return;
    const old = timers.get(el);
    if (old) clearInterval(old);
    el.innerHTML = '';

    if (reducedMotion()) {
      el.innerHTML = paras.map(p => `<p>${esc(p)}</p>`).join('');
      if (done) done();
      return;
    }

    let pi = 0, ci = 0;
    let p = document.createElement('p');
    el.appendChild(p);

    const timer = setInterval(() => {
      if (pi >= paras.length) {
        clearInterval(timer);
        timers.delete(el);
        if (done) done();
        return;
      }
      const s = paras[pi];
      if (ci < s.length) {
        p.textContent += s[ci];
        ci += 1;
      } else {
        pi += 1;
        ci = 0;
        if (pi < paras.length) {
          p = document.createElement('p');
          el.appendChild(p);
        }
      }
    }, speed || 14);
    timers.set(el, timer);
  }

  /* ---------------------------------------------------------
     Navigation
  --------------------------------------------------------- */
  const VIEW_TITLES = {
    overview: '成长全景', assessment: '职业发展测评', training: '培训推荐',
    mentor: '导师匹配', archive: '成长档案', feedback: '员工反馈'
  };

  function go(view, fromDemo) {
    if (!VIEW_TITLES[view]) return;
    $$('.view').forEach(v => v.classList.toggle('is-active', v.id === 'view-' + view));
    $$('.nav-item').forEach(n => n.classList.toggle('is-active', n.dataset.goto === view));
    const crumb = $('#crumb');
    if (crumb) crumb.textContent = VIEW_TITLES[view];

    window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });

    if (view === 'archive') renderArchive();
    if (view === 'overview') renderOverview();
    if (view === 'assessment') renderAssessment();
    if (view === 'training') renderTraining();
    if (view === 'mentor') renderMentors();
    if (view === 'feedback') renderFeedback();

    if (state.demo.active && !fromDemo) {
      const idx = getDemoSteps().findIndex(s => s.view === view);
      if (idx >= 0) { state.demo.step = idx; renderDemoUI(); applyDemoFocus(); }
    }

    $('#sidebar').classList.remove('is-open');
    $('#scrim').classList.remove('is-open');
  }

  /* ---------------------------------------------------------
     Coach
  --------------------------------------------------------- */
  function coachWelcome() {
    const p = state.profile || {};
    const { top, low } = topAndLow();
    const paras = state.assessment
      ? [`${p.name || '同学'}，你好。我读过你 ${state.assessment.at} 的测评结果了——${top.name} ${top.value} 是你的优势，${low.name} ${low.value} 是现在最该补的一环。`, '今天想从哪里聊起？']
      : [`${p.name || '同学'}，你好。现在我只看到你的起点自评，${low.name} 被你自己标为最低的一项。`, '要不要先聊聊它，或者直接去做一次测评？'];
    return paras;
  }

  function appendMsg(role, paras) {
    const wrap = $('#coachMessages');
    const el = document.createElement('div');
    el.className = 'msg msg-' + role;
    el.innerHTML = paras.map(p => `<p>${esc(p)}</p>`).join('');
    wrap.appendChild(el);
    wrap.scrollTop = wrap.scrollHeight;
    return el;
  }

  function coachReply(text) {
    const { top, low } = topAndLow();
    const p = state.profile || {};
    const name = p.name || '你';

    if (/测评|维度|结果/.test(text)) {
      return state.assessment
        ? [`你的测评结果不是标签，而是决定「下一步把力气花在哪」。`, `目前 ${top.name} ${top.value} 领先，${low.name} ${low.value} 靠后。这刚好对应从「做得多」走向「做得深」的阶段任务。`, `要不要我基于这份结果帮你排一个 90 天计划？`]
        : [`你还没有完成正式测评，现在我只能看到起点自评。`, `9 道情境题大概 4 分钟，做完我就能给你更具体的建议。`];
    }
    if (/导师|约|第一次/.test(text)) {
      const m = sortedMentors()[0];
      if (!m) {
        return [`你还没有录入导师。与其泛泛地找一个「厉害的人」，不如先写下你真正想靠近的那一位。`, `去「导师匹配」添加姓名、擅长维度和你最想学习的东西，我会立刻算出匹配度并生成第一次对话议程。`];
      }
      return [`第一次见${m.name}，不要把它开成「请教」，要带一个真实难题去。`, `可以这样开场：「我最近卡在${low.name}上，想请你帮我看看我的判断盲区。」`, `然后聊三件事：你未来 6 个月想改变什么、他看到的跃迁点、下一次复盘的观察指标。`];
    }
    if (/档案|总结|成长/.test(text)) {
      const entries = archiveEntries().length;
      return [`你的档案现在有 ${entries} 条记录，最有说服力的不是数量，而是它们能不能连成一条线。`, state.assessment ? `目前这条线是：起点自评 → ${state.assessment.at} 完成测评，${top.name} 领先、${low.name} 待补强。` : `目前还缺一个关键起点：一次正式测评。`, `下一份记录，我建议补上「把一门课用到真实项目里」的证据。`];
    }
    if (/能力|补|短板|提升/.test(text)) {
      return [`从当前数据看，「${low.name}」${low.value} 分是最值得投入的一项。`, `建议三步：先把《${sortedCourses()[0].title}》学完；再在下次项目周会主动承担一次主导；最后请导师给一次具体反馈。`, `要不要我把这三步加进你的成长闭环？`];
    }
    return [`${name}，我理解你的问题。我们可以把它拆成「能力缺口」和「场景机会」两部分。`, `结合你的数据，最值得投入的是「${low.name}」，而不是再上一门泛泛的课。`, `要不要我帮你从当前项目里找一个可以练手的场景？`];
  }

  function openCoach() {
    if (!$('#coachMessages').children.length) appendMsg('ai', coachWelcome());
    $('#coachDrawer').classList.add('is-open');
    $('#drawerScrim').classList.add('is-open');
    setTimeout(() => $('#coachInput').focus(), 350);
  }
  function closeCoach() {
    $('#coachDrawer').classList.remove('is-open');
    $('#drawerScrim').classList.remove('is-open');
  }

  function sendCoach(text) {
    const value = (text || '').trim();
    if (!value) return;
    appendMsg('user', [value]);
    $('#coachInput').value = '';

    const typing = document.createElement('div');
    typing.className = 'msg msg-ai';
    typing.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    const wrap = $('#coachMessages');
    wrap.appendChild(typing);
    wrap.scrollTop = wrap.scrollHeight;

    setTimeout(() => {
      typing.remove();
      appendMsg('ai', coachReply(value));
    }, 1000);
  }

  /* ---------------------------------------------------------
     Demo
  --------------------------------------------------------- */
  function getDemoSteps() {
    const p = state.profile || {};
    return [
      { view: 'overview', title: '看见起点', desc: `${p.name || '这位同学'}录入身份与起点自评后，平台立刻生成第一版画像。完成测评、课程与导师动作后，这里的数字会随之变化。`, hint: '看点：成长指数 · 你的成长闭环', focus: ['#hero-card', '#actionList'] },
      { view: 'assessment', title: '测评定位', desc: '9 道情境题，每一步选择都会计入六维分数。点击「使用示例作答」可快速看到结果如何被计算出来。', hint: '操作：使用示例作答 → 查看能力雷达', focus: ['#assessIntro', '#assessResult'] },
      { view: 'training', title: '精准补给', desc: '课程匹配分由你的能力缺口实时算出。把课程加入计划，右侧路径与档案会同步更新。', hint: '操作：把一门课加入学习计划', focus: ['#courseGrid', '.ai-banner'] },
      { view: 'mentor', title: '关键引路人', desc: '导师匹配度按能力互补、目标一致、风格契合计算。约见时 AI 会生成带开场话术的议程。', hint: '操作：发起约见 → 查看议程', focus: ['#mentorGrid', '#mentorHero'] },
      { view: 'archive', title: '成长被记录', desc: '你的每一次测评、加入课程、约见导师与提交反馈，都会自动写入档案，并生成阶段性总结。', hint: '看点：里程碑 · 能力变化 · AI 总结', focus: ['#archiveProfile', '#timeline'] },
      { view: 'feedback', title: '组织听见你', desc: '匿名填写四项评分与一段文字，AI 计算情绪温度、识别关注主题，并给出可执行的管理建议。', hint: '操作：提交心声 → 查看分析', focus: ['#feedbackSurvey'] }
    ];
  }

  function renderDemoUI() {
    const steps = getDemoSteps();
    const i = state.demo.step;
    const s = steps[i];
    $('#demoStepNum').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0');
    $('#demoProgress').style.width = ((i + 1) / steps.length) * 100 + '%';
    $('#demoTitle').textContent = s.title;
    $('#demoDesc').textContent = s.desc;
    $('#demoHint').textContent = s.hint;
    $('#demoPrev').disabled = i === 0;
    $('#demoPrev').style.opacity = i === 0 ? '.3' : '1';
    $('#demoNext').textContent = i === steps.length - 1 ? '完成演示 ✓' : '下一步 →';
    $('#demoDots').innerHTML = steps.map((_, di) => `<i class="${di === i ? 'is-active' : ''}"></i>`).join('');
  }

  function applyDemoFocus() {
    $$('.demo-focus').forEach(el => el.classList.remove('demo-focus'));
    const s = getDemoSteps()[state.demo.step];
    if (!s) return;
    setTimeout(() => {
      let target = null;
      for (const sel of (s.focus || [])) {
        const el = $(sel);
        if (el && el.offsetParent !== null) { target = el; break; }
      }
      if (!target) return;
      target.classList.add('demo-focus');
      target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
    }, 420);
  }

  function showDemoStep(i) {
    const steps = getDemoSteps();
    if (i < 0 || i >= steps.length) return;
    state.demo.step = i;
    go(steps[i].view, true);
    renderDemoUI();
    applyDemoFocus();
  }

  function startDemo() {
    state.demo.active = true;
    $('#demoPanel').hidden = false;
    showDemoStep(0);
    toast('演示模式已开启：按成长闭环逐步展示');
  }
  function exitDemo() {
    state.demo.active = false;
    $('#demoPanel').hidden = true;
    $$('.demo-focus').forEach(el => el.classList.remove('demo-focus'));
    toast('已退出演示模式');
  }

  /* ---------------------------------------------------------
     Onboarding
  --------------------------------------------------------- */
  let obStep = 0;

  function syncObStep() {
    const names = ['你的身份', '你的起点', '你的方向'];
    $('#obStepNo').textContent = String(obStep + 1).padStart(2, '0');
    $('#obProgress').style.width = ((obStep + 1) / 3) * 100 + '%';
    $('#obStepName').textContent = names[obStep];
    [1, 2, 3].forEach(n => { $('#obStep' + n).hidden = (n - 1) !== obStep; });
  }

  function collectObIdentity() {
    state.profile = {
      name: $('#obName').value.trim(),
      dept: $('#obDept').value,
      role: $('#obRole').value.trim(),
      level: $('#obLevel').value,
      joined: $('#obJoined').value,
      mentor: $('#obMentor').value.trim(),
      goal: 'lead'
    };
  }

  function prefillOb() {
    const p = state.profile || {};
    $('#obName').value = p.name || '';
    if (p.dept) $('#obDept').value = p.dept;
    $('#obRole').value = p.role || '';
    if (p.level) $('#obLevel').value = p.level;
    if (p.joined) $('#obJoined').value = p.joined;
    $('#obMentor').value = p.mentor || '';
    $$('.ob-goal').forEach(b => b.classList.toggle('is-picked', b.dataset.goal === (p.goal || 'lead')));
    $('#obHours').value = state.hours || 4;
    $('#obHoursVal').textContent = ($('#obHours').value) + ' 小时';
    state.self = Object.assign({ learn: 6, collab: 6, lead: 5, expert: 6, innov: 5, resil: 5 }, state.self);
    $$('.self-row').forEach(row => {
      const key = row.dataset.dim;
      const input = row.querySelector('input');
      input.value = state.self[key] == null ? 5 : state.self[key];
      row.querySelector('.self-val').textContent = input.value;
      input.style.setProperty('--pct', input.value * 10 + '%');
    });
    $('#obChallenge').value = state.challenge || '';
  }

  function showGen() {
    const overlay = $('#genOverlay');
    overlay.hidden = false;
    const steps = $$('#genSteps li');
    steps.forEach(s => s.className = '');
    steps.forEach((li, i) => {
      setTimeout(() => { li.className = 'is-on'; }, 220 + i * 460);
      setTimeout(() => { li.className = 'is-done'; }, 620 + i * 460);
    });
    setTimeout(enterApp, 2100);
  }

  function enterApp() {
    $('#genOverlay').hidden = true;
    $('#onboarding').classList.add('is-hide');
    $('#app').hidden = false;
    document.body.style.overflow = '';
    renderAll();
    go('overview', true);
    toast(`${state.profile.name}，你的成长空间已生成`);
  }

  function renderAll() {
    renderIdentity();
    renderOverview();
    renderAssessment();
    renderTraining();
    renderMentors();
    renderArchive();
    renderFeedback();
    renderDemoUI();
  }

  /* ---------------------------------------------------------
     Profile modal
  --------------------------------------------------------- */
  function openProfileModal() {
    const p = state.profile || {};
    $('#pmName').value = p.name || '';
    $('#pmDept').value = p.dept || '';
    $('#pmRole').value = p.role || '';
    $('#pmLevel').value = p.level || '';
    $('#pmJoined').value = p.joined || '';
    $('#pmGoal').value = p.goal || 'lead';
    $('#profileModal').classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeProfileModal() {
    $('#profileModal').classList.remove('is-open');
    document.body.style.overflow = '';
  }

  /* ---------------------------------------------------------
     Event wiring
  --------------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const goBtn = e.target.closest('[data-goto]');
    if (goBtn) { go(goBtn.dataset.goto); return; }

    if (e.target.closest('[data-coach]')) { openCoach(); return; }

    const loopBtn = e.target.closest('[data-loop]');
    if (loopBtn) { go(loopBtn.dataset.loop); return; }

    const add = e.target.closest('[data-add]');
    if (add) {
      const id = add.dataset.add;
      const c = COURSES.find(x => x.id === id);
      if (!c || state.plan.some(p => p.id === id)) return;
      state.plan.push({ id, progress: 0, at: todayStr() });
      save();
      renderCourses(); renderPlan(); renderPath();
      renderOverview(); renderActions(); renderInsights();
      renderArchive();
      toast(`已把《${c.title}》加入学习计划`);
      return;
    }

    const remove = e.target.closest('[data-remove]');
    if (remove) {
      state.plan = state.plan.filter(p => p.id !== remove.dataset.remove);
      save();
      renderCourses(); renderPlan(); renderPath();
      renderOverview(); renderArchive();
      toast('已从学习计划中移除');
      return;
    }

    const rec = e.target.closest('[data-rec]');
    if (rec) {
      const [kind, id] = rec.dataset.rec.split(':');
      if (kind === 'course') {
        go('training');
        setTimeout(() => {
          const card = $(`[data-course="${id}"]`);
          if (card) card.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
        }, 320);
      } else {
        go('mentor');
      }
      return;
    }

    const mentorBtn = e.target.closest('[data-mentor]');
    if (mentorBtn) { openMentorModal(mentorBtn.dataset.mentor); return; }

    const addMentorBtn = e.target.closest('[data-add-mentor], #addMentorBtn');
    if (addMentorBtn) { openAddMentor(); return; }

    const chip = e.target.closest('#courseFilters .chip');
    if (chip) {
      state.courseFilter = chip.dataset.filter;
      $$('#courseFilters .chip').forEach(c => c.classList.toggle('is-active', c === chip));
      renderCourses();
      return;
    }
    const mchip = e.target.closest('#mentorFilters .chip');
    if (mchip) {
      state.mentorFilter = mchip.dataset.filter;
      $$('#mentorFilters .chip').forEach(c => c.classList.toggle('is-active', c === mchip));
      renderMentors();
      return;
    }

    const pAction = e.target.closest('[data-profile-action]');
    if (pAction) {
      const act = pAction.dataset.profileAction;
      $('#sideMenu').hidden = true;
      if (act === 'edit') openProfileModal();
      if (act === 'restart') {
        if (window.confirm('重新录入会清空当前的测评与记录，确定继续？')) {
          try { localStorage.removeItem(STORE_KEY); } catch (err) { /* noop */ }
          state = freshState();
          $('.ob').classList.remove('is-hide');
          $('#app').hidden = true;
          obStep = 0; syncObStep(); prefillOb();
        }
      }
      if (act === 'clear') {
        if (window.confirm('这会清空你的身份、测评与全部记录，确定吗？')) {
          try { localStorage.removeItem(STORE_KEY); } catch (err) { /* noop */ }
          location.reload();
        }
      }
      return;
    }

    if (!e.target.closest('#sidebarUser')) $('#sideMenu').hidden = true;
  });

  // Onboarding interactions
  $('#obNext').addEventListener('click', () => {
    if (!$('#obName').value.trim()) { $('#obError').hidden = false; $('#obName').focus(); return; }
    $('#obError').hidden = true;
    collectObIdentity();
    obStep = 1; syncObStep();
  });
  $('#obBack').addEventListener('click', () => { obStep = 0; syncObStep(); });
  $('#obNext2').addEventListener('click', () => {
    collectSelf();
    obStep = 2; syncObStep();
  });
  $('#obBack2').addEventListener('click', () => { obStep = 1; syncObStep(); });

  $$('.self-row input').forEach(input => {
    input.addEventListener('input', () => {
      input.style.setProperty('--pct', input.value * 10 + '%');
      input.closest('.self-row').querySelector('.self-val').textContent = input.value;
    });
  });

  $$('.ob-goal').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.ob-goal').forEach(b => b.classList.toggle('is-picked', b === btn));
    });
  });

  $('#obHours').addEventListener('input', (e) => {
    $('#obHoursVal').textContent = e.target.value + ' 小时';
    e.target.style.setProperty('--pct', (e.target.value / 12) * 100 + '%');
  });

  function collectSelf() {
    const self = {};
    $$('.self-row').forEach(row => { self[row.dataset.dim] = Number(row.querySelector('input').value); });
    state.self = self;
  }

  $('#obSubmit').addEventListener('click', () => {
    collectSelf();
    state.hours = Number($('#obHours').value);
    state.challenge = $('#obChallenge').value.trim();
    state.profile.goal = ($('.ob-goal.is-picked') || {}).dataset ? $('.ob-goal.is-picked').dataset.goal : 'lead';
    save();
    showGen();
  });

  $('#obName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $('#obNext').click(); }
  });

  // Assessment
  $('#startAssess').addEventListener('click', () => startQuiz(true));
  $('#demoAssess').addEventListener('click', () => {
    state.answers = demoAnswers();
    state.qIndex = 0;
    finishQuiz();
  });
  $('#quitQuiz').addEventListener('click', () => {
    setAssessMode(state.assessment ? 'result' : 'intro');
  });
  $('#qBack').addEventListener('click', () => {
    if ((state.qIndex || 0) > 0) { state.qIndex -= 1; renderQuestion(); }
  });
  $('#retakeAssess').addEventListener('click', () => startQuiz(true));

  // Training
  $('#refreshRec').addEventListener('click', () => {
    renderTraining(); renderOverview();
    toast('已按最新的能力数据刷新推荐');
  });

  // Mentor
  $('#closeMentorModal').addEventListener('click', closeMentorModal);
  $('#cancelMentor').addEventListener('click', closeMentorModal);
  $('#mentorModal').addEventListener('click', (e) => {
    if (e.target === $('#mentorModal')) closeMentorModal();
  });
  $$('#timeChips .time-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('#timeChips .time-chip').forEach(c => c.classList.toggle('is-active', c === chip));
    });
  });
  $('#confirmMentor').addEventListener('click', () => {
    const id = state.currentMentor;
    const m = state.mentors.find(x => x.id === id);
    if (!m) return;
    if (!state.mentorReqs.some(r => r.id === id)) {
      state.mentorReqs.push({ id, at: todayStr(), match: mentorMatch(m) });
      save();
    }
    const time = $('#timeChips .time-chip.is-active');
    closeMentorModal();
    renderMentors(); renderOverview(); renderActions(); renderInsights(); renderArchive();
    toast(`已向${m.name}发出约见${time ? ' · ' + time.textContent : ''}，档案已记录`);
  });
  $('#matchingInfo').addEventListener('click', () => {
    toast('匹配模型：能力互补 40% + 成长目标 35% + 协作风格 25%，随你的测评结果重新计算。');
  });

  // Add mentor modal
  $('#closeAddMentor').addEventListener('click', closeAddMentor);
  $('#cancelAddMentor').addEventListener('click', closeAddMentor);
  $('#saveMentor').addEventListener('click', saveMentor);
  $('#addMentorModal').addEventListener('click', (e) => {
    if (e.target === $('#addMentorModal')) closeAddMentor();
  });
  $$('#amDims .dim-pick').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('is-picked'));
  });

  // Archive
  $('#exportArchive').addEventListener('click', () => {
    toast(`已生成 ${state.profile.name} 的成长档案（演示导出）`);
  });
  $('#shareArchive').addEventListener('click', () => {
    toast(`已生成分享链接，可发送给${state.profile.mentor || '导师'}（演示）`);
  });

  // Feedback
  $('#submitFeedback').addEventListener('click', () => {
    state.feedback = {
      scores: readFeedbackScores(),
      text: $('#feedbackText').value.trim(),
      anon: $('#anonToggle').checked,
      at: todayStr()
    };
    save();
    $('#analysisEmpty').hidden = true;
    $('#analysisTag').textContent = `已分析 · ${state.feedback.at}`;
    renderAnalysis();
    renderBenchmark();
    renderEchoes();
    renderOverview(); renderActions(); renderInsights(); renderArchive();
    const btn = $('#submitFeedback');
    btn.innerHTML = '更新我的反馈';
    toast('心声已提交，AI 已按你的评分与文字生成分析');
  });

  // Profile modal
  $('#identityChip').addEventListener('click', openProfileModal);
  $('#sideMenuBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    $('#sideMenu').hidden = !$('#sideMenu').hidden;
  });
  $('#closeProfileModal').addEventListener('click', closeProfileModal);
  $('#cancelProfile').addEventListener('click', closeProfileModal);
  $('#profileModal').addEventListener('click', (e) => {
    if (e.target === $('#profileModal')) closeProfileModal();
  });
  $('#saveProfile').addEventListener('click', () => {
    const name = $('#pmName').value.trim();
    if (!name) { toast('姓名不能为空'); return; }
    state.profile = Object.assign({}, state.profile, {
      name,
      dept: $('#pmDept').value,
      role: $('#pmRole').value.trim(),
      level: $('#pmLevel').value,
      joined: $('#pmJoined').value,
      goal: $('#pmGoal').value
    });
    save();
    closeProfileModal();
    renderAll();
    toast('资料已更新');
  });

  // Coach
  $('#closeCoach').addEventListener('click', closeCoach);
  $('#drawerScrim').addEventListener('click', closeCoach);
  $('#coachForm').addEventListener('submit', (e) => {
    e.preventDefault();
    sendCoach($('#coachInput').value);
  });
  $$('#coachPrompts button').forEach(btn => {
    btn.addEventListener('click', () => sendCoach(btn.textContent));
  });

  // Trend range
  $$('#trendSeg button').forEach((btn, idx) => {
    btn.addEventListener('click', () => {
      $$('#trendSeg button').forEach(b => b.classList.toggle('is-active', b === btn));
      state.trendRange = idx === 0 ? 'half' : 'year';
      renderGrowthTrend();
    });
  });

  // Demo
  $('#startDemo').addEventListener('click', startDemo);
  $('#exitDemo').addEventListener('click', exitDemo);
  $('#demoPrev').addEventListener('click', () => showDemoStep(state.demo.step - 1));
  $('#demoNext').addEventListener('click', () => {
    const steps = getDemoSteps();
    if (state.demo.step >= steps.length - 1) {
      exitDemo();
      toast('演示完成：一条从录入到反馈的成长闭环');
    } else {
      showDemoStep(state.demo.step + 1);
    }
  });

  // Search
  const searchInput = $('#searchInput');
  const searchPop = $('#searchPop');

  function searchIndex() {
    return [
      { label: '成长全景', meta: '页面', view: 'overview', icon: '页' },
      { label: '职业发展测评', meta: '页面', view: 'assessment', icon: '测' },
      { label: '培训推荐', meta: '页面', view: 'training', icon: '课' },
      { label: '导师匹配', meta: '页面', view: 'mentor', icon: '师' },
      { label: '成长档案', meta: '页面', view: 'archive', icon: '档' },
      { label: '员工反馈', meta: '页面', view: 'feedback', icon: '声' }
    ].concat(COURSES.map(c => ({ label: c.title, meta: '课程', view: 'training', icon: '课' })))
      .concat(state.mentors.map(m => ({ label: m.name + (m.role ? ' · ' + m.role : ''), meta: '导师', view: 'mentor', icon: '师' })));
  }

  function renderSearch(q) {
    if (!q) { searchPop.classList.remove('is-open'); return; }
    const query = q.toLowerCase();
    const results = searchIndex().filter(it => it.label.toLowerCase().includes(query)).slice(0, 6);
    searchPop.innerHTML = results.length
      ? results.map(r => `<button class="search-result" data-search-view="${r.view}"><i>${r.icon}</i><span>${esc(r.label)}</span><small>${r.meta}</small></button>`).join('')
      : '<div class="search-empty">没有找到相关内容，试试「导师」或「增长」。</div>';
    searchPop.classList.add('is-open');
  }

  searchInput.addEventListener('input', (e) => renderSearch(e.target.value.trim()));
  searchInput.addEventListener('focus', () => renderSearch(searchInput.value.trim()));
  searchPop.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-search-view]');
    if (!btn) return;
    go(btn.dataset.searchView);
    searchInput.value = '';
    searchPop.classList.remove('is-open');
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#searchWrap')) searchPop.classList.remove('is-open');
  });

  $('#bellBtn').addEventListener('click', () => {
    const msgs = [];
    if (!state.assessment) msgs.push('测评提醒：完成 9 道情境题即可生成画像');
    if (state.mentorReqs.length) msgs.push('导师约见等待确认');
    if (!state.feedback) msgs.push('本月成长体验问卷待填写');
    toast(msgs.length ? msgs.join(' · ') : '暂无新消息，你的成长闭环已完成');
  });

  // Mobile menu
  $('#menuBtn').addEventListener('click', () => {
    $('#sidebar').classList.add('is-open');
    $('#scrim').classList.add('is-open');
  });
  $('#scrim').addEventListener('click', () => {
    $('#sidebar').classList.remove('is-open');
    $('#scrim').classList.remove('is-open');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCoach();
      closeMentorModal();
      closeProfileModal();
      searchPop.classList.remove('is-open');
      $('#sideMenu').hidden = true;
      $('#sidebar').classList.remove('is-open');
      $('#scrim').classList.remove('is-open');
    }
  });

  // Hero CTA
  $('#heroCta').addEventListener('click', () => go('assessment'));

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  function init() {
    const hasProfile = load();
    prefillOb();
    syncObStep();
    if (hasProfile) {
      $('#onboarding').classList.add('is-hide');
      $('#app').hidden = false;
      renderAll();
      go('overview', true);
    } else {
      $('#onboarding').classList.remove('is-hide');
      $('#app').hidden = true;
      setTimeout(() => $('#obName').focus(), 300);
    }
  }

  init();
})();
