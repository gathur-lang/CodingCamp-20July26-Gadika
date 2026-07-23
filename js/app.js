const STORAGE_KEYS = {
  expenses: 'expense-budget-expenses',
  categories: 'expense-budget-categories',
  budget: 'expense-budget-budget',
  theme: 'expense-budget-theme',
};

const defaultCategories = ['Food', 'Transport', 'Bills', 'Entertainment', 'Health', 'Shopping', 'Other'];

let expenses = [];
let categories = [];
let budgetGoal = 0;
let selectedMonth = '';

const form = document.getElementById('expenseForm');
const budgetInput = document.getElementById('budgetInput');
const nameInput = document.getElementById('nameInput');
const amountInput = document.getElementById('amountInput');
const dateInput = document.getElementById('dateInput');
const categorySelect = document.getElementById('categorySelect');
const customCategoryInput = document.getElementById('customCategoryInput');
const expenseList = document.getElementById('expenseList');
const budgetValue = document.getElementById('budgetValue');
const totalSpentValue = document.getElementById('totalSpentValue');
const remainingValue = document.getElementById('remainingValue');
const monthlyValue = document.getElementById('monthlyValue');
const usageText = document.getElementById('usageText');
const progressFill = document.getElementById('progressFill');
const expenseCount = document.getElementById('expenseCount');
const monthSelect = document.getElementById('monthSelect');
const monthlySummary = document.getElementById('monthlySummary');
const themeToggle = document.getElementById('themeToggle');
const clearAllBtn = document.getElementById('clearAllBtn');

document.addEventListener('DOMContentLoaded', init);

function init() {
  loadData();
  setDefaultDate();
  populateCategoryOptions();
  populateMonthOptions();
  bindEvents();
  render();
}

function bindEvents() {
  form.addEventListener('submit', handleAddExpense);
  budgetInput.addEventListener('change', handleBudgetChange);
  clearAllBtn.addEventListener('click', resetAllData);
  monthSelect.addEventListener('change', (event) => {
    selectedMonth = event.target.value;
    renderMonthlySummary();
  });
  themeToggle.addEventListener('click', toggleTheme);
}

function loadData() {
  const savedExpenses = JSON.parse(localStorage.getItem(STORAGE_KEYS.expenses) || '[]');
  const savedCategories = JSON.parse(localStorage.getItem(STORAGE_KEYS.categories) || 'null');
  const savedBudget = Number(localStorage.getItem(STORAGE_KEYS.budget) || '0');
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);

  expenses = Array.isArray(savedExpenses) ? savedExpenses : [];
  categories = Array.isArray(savedCategories) && savedCategories.length ? savedCategories : [...defaultCategories];
  budgetGoal = Number.isFinite(savedBudget) ? savedBudget : 0;

  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    themeToggle.textContent = '☀️';
  } else {
    document.body.classList.remove('dark');
    themeToggle.textContent = '🌙';
  }

  budgetInput.value = budgetGoal > 0 ? budgetGoal : '';
}

function setDefaultDate() {
  if (!dateInput.value) {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    dateInput.value = localDate.toISOString().split('T')[0];
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
  localStorage.setItem(STORAGE_KEYS.budget, String(budgetGoal));
}

function populateCategoryOptions() {
  categorySelect.innerHTML = '';
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function populateMonthOptions() {
  const months = new Set(expenses.map((expense) => expense.date.slice(0, 7)));
  const currentMonth = new Date().toISOString().slice(0, 7);
  months.add(currentMonth);

  const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a));
  monthSelect.innerHTML = '';
  sortedMonths.forEach((month) => {
    const option = document.createElement('option');
    option.value = month;
    option.textContent = formatMonthLabel(month);
    monthSelect.appendChild(option);
  });

  selectedMonth = selectedMonth || currentMonth;
  monthSelect.value = selectedMonth;
}

function handleAddExpense(event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const amount = Number(amountInput.value);
  const date = dateInput.value;
  const selectedCategory = categorySelect.value;
  const customCategory = customCategoryInput.value.trim();

  if (!name || !amount || !date) {
    return;
  }

  const category = customCategory ? customCategory : selectedCategory;

  if (customCategory && !categories.includes(customCategory)) {
    categories.push(customCategory);
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
    populateCategoryOptions();
    categorySelect.value = customCategory;
  }

  expenses.unshift({
    id: crypto.randomUUID(),
    name,
    amount,
    date,
    category,
  });

  saveData();
  form.reset();
  setDefaultDate();
  budgetInput.value = budgetGoal > 0 ? budgetGoal : '';
  customCategoryInput.value = '';
  populateMonthOptions();
  render();
}

function handleBudgetChange(event) {
  budgetGoal = Number(event.target.value) || 0;
  saveData();
  renderSummary();
}

function removeExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  saveData();
  populateMonthOptions();
  render();
}

function resetAllData() {
  if (!window.confirm('Reset all expenses and budget data?')) {
    return;
  }

  expenses = [];
  categories = [...defaultCategories];
  budgetGoal = 0;
  localStorage.removeItem(STORAGE_KEYS.expenses);
  localStorage.removeItem(STORAGE_KEYS.categories);
  localStorage.removeItem(STORAGE_KEYS.budget);
  budgetInput.value = '';
  populateCategoryOptions();
  populateMonthOptions();
  render();
}

function render() {
  renderSummary();
  renderExpenseList();
  renderMonthlySummary();
}

function renderSummary() {
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlySpent = expenses
    .filter((expense) => expense.date.startsWith(currentMonth))
    .reduce((sum, expense) => sum + Number(expense.amount), 0);
  const remaining = budgetGoal - totalSpent;
  const usagePercent = budgetGoal > 0 ? Math.min((totalSpent / budgetGoal) * 100, 100) : 0;

  budgetValue.textContent = formatCurrency(budgetGoal);
  totalSpentValue.textContent = formatCurrency(totalSpent);
  remainingValue.textContent = formatCurrency(remaining);
  monthlyValue.textContent = formatCurrency(monthlySpent);
  usageText.textContent = `${Math.round(usagePercent)}%`;
  progressFill.style.width = `${usagePercent}%`;
  expenseCount.textContent = `${expenses.length} item${expenses.length === 1 ? '' : 's'}`;
}

function renderExpenseList() {
  if (!expenses.length) {
    expenseList.innerHTML = '<li class="empty-state">No expenses captured yet. Add your first item to get started.</li>';
    return;
  }

  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  expenseList.innerHTML = '';

  sortedExpenses.forEach((expense) => {
    const row = document.createElement('li');
    row.innerHTML = `
      <div class="expense-meta">
        <strong>${escapeHtml(expense.name)}</strong>
        <span>${escapeHtml(expense.category)} • ${formatDate(expense.date)}</span>
      </div>
      <div class="expense-actions">
        <span class="amount-pill">${formatCurrency(expense.amount)}</span>
        <button class="remove-btn" type="button" data-id="${expense.id}">Remove</button>
      </div>
    `;
    expenseList.appendChild(row);
  });

  expenseList.querySelectorAll('.remove-btn').forEach((button) => {
    button.addEventListener('click', () => removeExpense(button.dataset.id));
  });
}

function renderMonthlySummary() {
  const monthExpenses = expenses.filter((expense) => expense.date.startsWith(selectedMonth || ''));

  if (!monthExpenses.length) {
    monthlySummary.innerHTML = '<div class="empty-state">No expenses for the selected month yet.</div>';
    return;
  }

  const totalsByCategory = monthExpenses.reduce((accumulator, expense) => {
    accumulator[expense.category] = (accumulator[expense.category] || 0) + Number(expense.amount);
    return accumulator;
  }, {});

  const entries = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1]);
  const totalForMonth = entries.reduce((sum, [, amount]) => sum + amount, 0);

  monthlySummary.innerHTML = `
    <div class="summary-row">
      <span>Selected month</span>
      <strong>${formatMonthLabel(selectedMonth)}</strong>
    </div>
    <div class="summary-row">
      <span>Total for month</span>
      <strong>${formatCurrency(totalForMonth)}</strong>
    </div>
    ${entries
      .map(
        ([category, amount]) => `
          <div class="summary-row">
            <span>${escapeHtml(category)}</span>
            <strong>${formatCurrency(amount)}</strong>
          </div>
        `,
      )
      .join('')}
  `;
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem(STORAGE_KEYS.theme, isDark ? 'dark' : 'light');
  themeToggle.textContent = isDark ? '☀️' : '🌙';
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMonthLabel(value) {
  if (!value) {
    return 'All months';
  }
  const [year, month] = value.split('-');
  return new Date(`${year}-${month}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
