// 待辦清單的 localStorage 鍵名稱
const STORAGE_KEY = 'todoListItems';

// 取得頁面上的 DOM 元素
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');
const clearCompletedButton = document.getElementById('clear-completed');
const themeToggle = document.getElementById('theme-toggle');
const filterButtons = document.querySelectorAll('.filter-btn');
const THEME_STORAGE_KEY = 'todoListTheme';
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');

let currentFilter = 'all';
let currentTheme = loadTheme();

// 套用主題並更新按鈕文字
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.dataset.theme = theme;
  themeToggle.textContent = theme === 'dark' ? '☀️ 淺色模式' : '🌙 深色模式';
  themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
}

// 優先使用使用者儲存的主題，否則跟隨系統設定
function loadTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === 'light' || savedTheme === 'dark'
      ? savedTheme
      : systemTheme.matches ? 'dark' : 'light';
  } catch (error) {
    console.error('載入主題設定失敗:', error);
    return systemTheme.matches ? 'dark' : 'light';
  }
}

// 儲存待辦事項的陣列
let todos = loadTodos();

// 將字串轉成安全 HTML，避免 XSS
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 從 localStorage 載入資料
function loadTodos() {
  try {
    const savedTodos = localStorage.getItem(STORAGE_KEY);
    if (!savedTodos) {
      return [];
    }

    const parsedTodos = JSON.parse(savedTodos);
    return Array.isArray(parsedTodos) ? parsedTodos : [];
  } catch (error) {
    console.error('載入待辦資料失敗:', error);
    return [];
  }
}

// 儲存資料到 localStorage
function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (error) {
    console.error('儲存待辦資料失敗:', error);
  }
}

// 更新底部未完成數量與篩選後的空白提示
function updateSummary() {
  const remaining = todos.filter((todo) => !todo.completed).length;
  const completed = todos.some((todo) => todo.completed);
  remainingCount.textContent = `未完成:${remaining} 項`;
  clearCompletedButton.hidden = !completed;

  const visibleTodos = getVisibleTodos();
  const emptyMessages = {
    all: '還沒有任何待辦事項,新增一個吧!',
    active: '沒有未完成的待辦事項。',
    completed: '沒有已完成的待辦事項。',
  };
  emptyState.textContent = emptyMessages[currentFilter];
  emptyState.hidden = visibleTodos.length > 0;
}

// 依目前篩選條件取得待顯示項目
function getVisibleTodos() {
  if (currentFilter === 'active') {
    return todos.filter((todo) => !todo.completed);
  }
  if (currentFilter === 'completed') {
    return todos.filter((todo) => todo.completed);
  }
  return todos;
}

// 渲染待辦清單
function renderTodos() {
  todoList.innerHTML = '';

  const visibleTodos = getVisibleTodos();

  if (visibleTodos.length === 0) {
    updateSummary();
    return;
  }

  visibleTodos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = 'todo-item';

    if (todo.completed) {
      item.classList.add('completed');
    }

    item.innerHTML = `
      <label class="todo-main">
        <input type="checkbox" ${todo.completed ? 'checked' : ''} />
        <span class="todo-text">${escapeHtml(todo.text)}</span>
      </label>
      <button type="button" class="delete-btn">刪除</button>
    `;

    const checkbox = item.querySelector('input[type="checkbox"]');
    const deleteButton = item.querySelector('.delete-btn');

    checkbox.addEventListener('change', () => {
      todo.completed = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    deleteButton.addEventListener('click', () => {
      todos = todos.filter((currentTodo) => currentTodo.id !== todo.id);
      saveTodos();
      renderTodos();
    });

    todoList.appendChild(item);
  });

  updateSummary();
}

// 新增待辦事項
function addTodo() {
  const value = todoInput.value.trim();

  if (!value) {
    todoInput.focus();
    return;
  }

  todos.unshift({
    id: Date.now() + Math.random(),
    text: value,
    completed: false,
  });

  todoInput.value = '';
  saveTodos();
  renderTodos();
  todoInput.focus();
}

// 表單送出事件
todoForm.addEventListener('submit', (event) => {
  event.preventDefault();
  addTodo();
});

// 在輸入框按 Enter 也會新增
todoInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    addTodo();
  }
});

// 確認後清除所有已完成項目
clearCompletedButton.addEventListener('click', () => {
  if (!todos.some((todo) => todo.completed)) {
    return;
  }

  if (!window.confirm('確定要清除所有已完成的待辦事項嗎？此操作無法復原。')) {
    return;
  }

  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  renderTodos();
});

// 主題按鈕會保存使用者明確選擇
themeToggle.addEventListener('click', () => {
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (error) {
    console.error('儲存主題設定失敗:', error);
  }
});

// 尚未手動選擇主題時，持續跟隨系統設定
systemTheme.addEventListener('change', (event) => {
  if (!localStorage.getItem(THEME_STORAGE_KEY)) {
    applyTheme(event.matches ? 'dark' : 'light');
  }
});

// 切換清單篩選條件
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle('active', isActive);
      filterButton.setAttribute('aria-pressed', String(isActive));
    });
    renderTodos();
  });
});

// 首次載入時渲染介面
applyTheme(currentTheme);
renderTodos();
