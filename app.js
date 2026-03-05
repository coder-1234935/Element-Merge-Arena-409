const TOTAL_ELEMENTS = 409;
const BOARD_SIZE = 8;
const STORAGE_KEY = 'element-merge-409-save-v1';

const baseElements = [
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'water', emoji: '💧', label: 'Water' },
  { id: 'earth', emoji: '🌍', label: 'Earth' },
  { id: 'air', emoji: '🌬️', label: 'Air' }
];

const elements = {};
baseElements.forEach((el, i) => {
  elements[el.id] = { ...el, era: getEraName(i) };
});

for (let i = 1; i <= TOTAL_ELEMENTS - baseElements.length; i += 1) {
  const idx = i + baseElements.length - 1;
  elements[`e${i}`] = {
    id: `e${i}`,
    emoji: pickEmoji(i),
    label: `Fusion ${i}`,
    era: getEraName(idx)
  };
}

const combos = buildCombos();
const comboKeys = Object.keys(combos);


const eraThemes = [
  { index: 0, name: 'Nature', title: 'Forest Realm', subtitle: '🌲 mossy wildlands' },
  { index: 1, name: 'Civilization', title: 'Kingdom Frontier', subtitle: '🏰 fortified valleys' },
  { index: 2, name: 'Technology', title: 'Modern Neon District', subtitle: '🌆 cyber-tech skyline' },
  { index: 3, name: 'Space', title: 'Cosmic Expanse', subtitle: '🪐 orbital sectors' }
];

const boardEl = document.getElementById('board');
const boardWrap = document.getElementById('boardWrap');
const boardTitle = document.getElementById('boardTitle');
const retryBtn = document.getElementById('retryBtn');
const hintBtn = document.getElementById('hintBtn');
const hintText = document.getElementById('hintText');
const scoreText = document.getElementById('scoreText');
const highScoreText = document.getElementById('highScoreText');
const mergeText = document.getElementById('mergeText');
const possibleText = document.getElementById('possibleText');
const discoverText = document.getElementById('discoverText');
const progressBar = document.getElementById('progressBar');
const eraText = document.getElementById('eraText');
const statusText = document.getElementById('statusText');
const discoveryList = document.getElementById('discoveryList');
const toast = document.getElementById('toast');

let state = createNewRun();
loadSave();
render();

function getEraName(index) {
  const q = Math.floor((index / TOTAL_ELEMENTS) * 4);
  return ['Nature', 'Civilization', 'Technology', 'Space'][Math.min(3, q)];
}

function pickEmoji(i) {
  const set = ['✨', '⚗️', '🌟', '🔮', '🧪', '🛰️', '⚙️', '💠', '🌀', '🌠'];
  return set[i % set.length];
}

function createNewRun() {
  const discovered = baseElements.map((x) => x.id);
  return {
    board: seedBoard(discovered),
    discovered,
    score: 0,
    merges: 0,
    highScore: 0,
    selected: null,
    over: false
  };
}

function buildCombos() {
  const map = {
    [k('fire', 'water')]: 'e1',
    [k('water', 'earth')]: 'e2',
    [k('earth', 'fire')]: 'e3',
    [k('air', 'fire')]: 'e4',
    [k('air', 'water')]: 'e5'
  };

  for (let i = 6; i <= TOTAL_ELEMENTS - 4; i += 1) {
    const prev = `e${i - 1}`;
    const prev2 = `e${i - 2}`;
    const base = baseElements[(i - 1) % 4].id;
    map[k(prev, base)] = `e${i}`;
    map[k(prev, prev2)] = `e${i}`;
  }
  return map;
}

function seedBoard(pool) {
  const size = BOARD_SIZE * BOARD_SIZE;
  return Array.from({ length: size }, () => pool[Math.floor(Math.random() * pool.length)]);
}

function k(a, b) {
  return [a, b].sort().join('+');
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ highScore: state.highScore }));
}

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state.highScore = Number(parsed.highScore || 0);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function render() {
  boardEl.innerHTML = '';
  const era = currentEra();
  boardWrap.classList.remove('era-0', 'era-1', 'era-2', 'era-3', 'era-nature', 'era-civilization', 'era-technology', 'era-space');
  boardWrap.classList.add(`era-${era.index}`, `era-${era.name.toLowerCase()}`);
  boardTitle.textContent = `${era.title} Grid`;
  boardTitle.dataset.subtitle = era.subtitle;
  eraText.textContent = `Era: ${era.name} · ${era.subtitle}`;

  state.board.forEach((id, idx) => {
    const cell = document.createElement('button');
    cell.className = 'cell';
    cell.innerHTML = `${elements[id].emoji}<small>${elements[id].label}</small>`;
    cell.addEventListener('click', () => onCellClick(idx));

    if (state.selected === idx) cell.classList.add('selected');
    if (state.selected !== null && isAdjacent(state.selected, idx)) cell.classList.add('valid');

    boardEl.appendChild(cell);
  });

  const possible = findPossibleMerges();
  scoreText.textContent = `Score: ${state.score}`;
  highScoreText.textContent = `High Score: ${state.highScore}`;
  mergeText.textContent = `Merges: ${state.merges}`;
  possibleText.textContent = `Possible Merges In Grid: ${possible.length}`;
  discoverText.textContent = `Discovered: ${state.discovered.length} / ${TOTAL_ELEMENTS}`;
  progressBar.style.width = `${Math.round((state.discovered.length / TOTAL_ELEMENTS) * 100)}%`;
  statusText.textContent = state.over ? 'Status: Game Over - No Moves Left' : 'Status: Running';

  renderDiscoveryList();

  if (!state.over && possible.length === 0) {
    endRun();
  }
}

function renderDiscoveryList() {
  discoveryList.innerHTML = '';
  state.discovered.slice(-40).reverse().forEach((id) => {
    const li = document.createElement('li');
    li.textContent = `${elements[id].emoji} ${elements[id].label} · ${elements[id].era}`;
    discoveryList.appendChild(li);
  });
}

function onCellClick(idx) {
  if (state.over) return;
  if (state.selected === null) {
    state.selected = idx;
    render();
    return;
  }

  if (state.selected === idx) {
    state.selected = null;
    render();
    return;
  }

  if (!isAdjacent(state.selected, idx)) {
    state.selected = idx;
    render();
    return;
  }

  const aIdx = state.selected;
  const bIdx = idx;
  const a = state.board[aIdx];
  const b = state.board[bIdx];
  const result = combos[k(a, b)];

  if (!result) {
    hintText.textContent = `No merge: ${elements[a].label} + ${elements[b].label}`;
    state.selected = null;
    render();
    return;
  }

  const isNew = !state.discovered.includes(result);
  if (isNew) {
    state.discovered.push(result);
    showToast(`✨ NEW: ${elements[result].emoji} ${elements[result].label}`);
    state.score += 200;
  }

  state.score += 25;
  state.merges += 1;

  // candy-like behavior: first cell becomes result, second removed, then gravity + refill
  state.board[aIdx] = result;
  state.board[bIdx] = null;
  applyGravityAndRefill();

  state.selected = null;
  hintText.textContent = '';

  if (state.score > state.highScore) {
    state.highScore = state.score;
    save();
  }

  if (state.discovered.length === TOTAL_ELEMENTS) {
    state.over = true;
    statusText.textContent = 'Status: Victory! All 409 unlocked';
    showToast('🏆 You unlocked all 409 elements!');
  }

  render();
}

function applyGravityAndRefill() {
  const n = BOARD_SIZE;
  for (let col = 0; col < n; col += 1) {
    const colVals = [];
    for (let row = n - 1; row >= 0; row -= 1) {
      const idx = row * n + col;
      if (state.board[idx] !== null) colVals.push(state.board[idx]);
    }

    for (let row = n - 1; row >= 0; row -= 1) {
      const idx = row * n + col;
      state.board[idx] = colVals[n - 1 - row] || null;
    }

    for (let row = 0; row < n; row += 1) {
      const idx = row * n + col;
      if (state.board[idx] === null) {
        state.board[idx] = randomSpawn();
      }
    }
  }
}

function randomSpawn() {
  const pool = state.discovered.length > 14 ? state.discovered.slice(0, 4).concat(state.discovered.slice(-10)) : state.discovered;
  return pool[Math.floor(Math.random() * pool.length)];
}

function findPossibleMerges() {
  const out = [];
  const n = BOARD_SIZE;
  const dirs = [[0,1],[1,0]];

  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      const idx = r * n + c;
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= n || nc >= n) continue;
        const nIdx = nr * n + nc;
        const pairKey = k(state.board[idx], state.board[nIdx]);
        if (combos[pairKey]) out.push([idx, nIdx, combos[pairKey]]);
      }
    }
  }
  return out;
}

function isAdjacent(i, j) {
  const r1 = Math.floor(i / BOARD_SIZE);
  const c1 = i % BOARD_SIZE;
  const r2 = Math.floor(j / BOARD_SIZE);
  const c2 = j % BOARD_SIZE;
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function currentEra() {
  const d = state.discovered.length;
  const idx = Math.min(3, Math.floor((d / TOTAL_ELEMENTS) * 4));
  return eraThemes[idx];
}

function endRun() {
  state.over = true;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    save();
  }
  showToast('💀 No merges left. Retry to beat your high score and unlock all 409!');
  render();
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2200);
}

retryBtn.addEventListener('click', () => {
  const keepHigh = state.highScore;
  state = createNewRun();
  state.highScore = keepHigh;
  hintText.textContent = '';
  render();
});

hintBtn.addEventListener('click', () => {
  const possible = findPossibleMerges();
  if (possible.length === 0) {
    hintText.textContent = 'No merge left. Retry run.';
    return;
  }
  const [a, b, res] = possible[Math.floor(Math.random() * possible.length)];
  hintText.textContent = `Try: ${elements[state.board[a]].label} + ${elements[state.board[b]].label} → ${elements[res].label}`;
});

console.log(`Loaded ${Object.keys(elements).length} elements and ${comboKeys.length} combo recipes.`);
