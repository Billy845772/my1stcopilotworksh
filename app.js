// 待辦清單的 localStorage 鍵名稱
const STORAGE_KEY = 'todoListItems';

// 取得頁面上的 DOM 元素
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');

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

// 更新底部未完成數量與空白提示
function updateSummary() {
  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `未完成:${remaining} 項`;

  if (todos.length === 0) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }
}

// 渲染待辦清單
function renderTodos() {
  todoList.innerHTML = '';

  if (todos.length === 0) {
    updateSummary();
    return;
  }

  todos.forEach((todo) => {
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

// 首次載入時渲染介面
renderTodos();
