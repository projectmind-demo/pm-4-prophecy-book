const STORAGE_KEY = 'prophecy-book.records.v1';
let records = loadRecords();
let activeFilter = 'all';

const $ = (selector) => document.querySelector(selector);
const form = $('#prophecy-form');
const contentInput = $('#prophecy-content');
const dateInput = $('#prophecy-date');
const list = $('#prophecy-list');
const modal = $('#record-modal');
const openFormButton = $('#open-form-button');
const closeFormButton = $('#close-form-button');
let lastFocusedElement = openFormButton;

function loadRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((item) => item.content && item.date) : [];
  } catch { return []; }
}

function saveRecords() { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
function formatDate(value) { return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(`${value}T00:00:00`)); }
function escapeHtml(value) { return value.replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char])); }
function getCounts() {
  return { total: records.length, pending: records.filter((r) => r.status === 'pending').length, success: records.filter((r) => r.status === 'success').length, failed: records.filter((r) => r.status === 'failed').length };
}
function updateRate(counts) {
  const completed = counts.success + counts.failed;
  const hasResults = completed > 0;
  const rate = hasResults ? Math.round(counts.success / completed * 100) : 0;
  const rateStat = $('#rate-stat');
  const rateProgress = $('#rate-progress');
  const rateMeter = $('#rate-meter');
  rateProgress.style.setProperty('--rate-progress', rate);
  rateStat.classList.toggle('is-empty', !hasResults);
  rateStat.classList.toggle('is-low', hasResults && rate < 50);
  rateStat.classList.toggle('is-high', hasResults && rate >= 80);
  $('#rate-count').textContent = hasResults ? `${rate}%` : '—';
  $('#rate-label').textContent = hasResults ? '命中指数' : '等待揭晓';
  $('#rate-detail').textContent = hasResults ? `${counts.success} 成功 · ${counts.failed} 失败` : '完成记录后，仪表将开始运行';
  rateMeter.setAttribute('aria-label', hasResults ? `成功率 ${rate}%，${counts.success} 次成功，${counts.failed} 次失败` : '成功率等待揭晓');
}
function render() {
  const counts = getCounts();
  $('#total-count').textContent = counts.total;
  $('#done-count').textContent = counts.success + counts.failed;
  $('#success-count').textContent = counts.success;
  $('#failed-count').textContent = counts.failed;
  updateRate(counts);
  const countByFilter = { all: counts.total, pending: counts.pending, success: counts.success, failed: counts.failed };
  document.querySelectorAll('.filter').forEach((button) => { button.classList.toggle('active', button.dataset.filter === activeFilter); button.querySelector('b').textContent = countByFilter[button.dataset.filter]; });
  const sorted = [...records].sort((a, b) => { const sort = $('#sort-select').value; return sort === 'created-desc' ? b.createdAt - a.createdAt : sort === 'date-desc' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date); });
  const visible = activeFilter === 'all' ? sorted : sorted.filter((record) => record.status === activeFilter);
  $('#list-count').textContent = visible.length;
  if (!visible.length) { list.innerHTML = `<div class="empty"><div class="empty-icon">✧</div><h3>${records.length ? '这里暂时没有匹配的预言' : '未来还没有被写下'}</h3><p>${records.length ? '换一个筛选条件，看看其他时间线。' : '在左侧写下第一条预言，让时间开始回应。'}</p></div>`; return; }
  list.innerHTML = visible.map((record) => `<article class="prophecy-card ${record.status}"><span class="bar"></span><div><p class="prophecy-content">${escapeHtml(record.content)}</p><span class="date">预计揭晓 · ${formatDate(record.date)}</span></div><div class="status-actions"><button class="status-chip ${record.status === 'success' ? 'success' : ''}" data-id="${record.id}" data-status="success" aria-pressed="${record.status === 'success'}">${record.status === 'success' ? '✓ 成功' : '成功'}</button><button class="status-chip ${record.status === 'failed' ? 'failed' : ''}" data-id="${record.id}" data-status="failed" aria-pressed="${record.status === 'failed'}">${record.status === 'failed' ? '× 失败' : '失败'}</button><button class="status-chip ${record.status === 'pending' ? 'pending' : ''}" data-id="${record.id}" data-status="pending" aria-pressed="${record.status === 'pending'}">${record.status === 'pending' ? '✓ 未揭晓' : '未揭晓'}</button><button class="delete-button" data-delete="${record.id}" aria-label="删除这条预言" title="删除">⌫</button></div></article>`).join('');
}
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400); }
function openModal() { lastFocusedElement = document.activeElement; modal.hidden = false; document.body.classList.add('modal-open'); contentInput.focus(); }
function closeModal() { modal.hidden = true; document.body.classList.remove('modal-open'); lastFocusedElement?.focus(); }
function validate() {
  const content = contentInput.value.trim(); const date = dateInput.value; let valid = true;
  $('#content-error').textContent = content ? '' : '请先写下预言内容'; $('#date-error').textContent = date ? '' : '请选择预计揭晓日期';
  if (!content || !date) valid = false; return valid;
}
contentInput.addEventListener('input', () => { $('#char-count').textContent = `${contentInput.value.length} / 200`; if (contentInput.value.trim()) $('#content-error').textContent = ''; });
form.addEventListener('submit', (event) => { event.preventDefault(); if (!validate()) return; records.unshift({ id: crypto.randomUUID(), content: contentInput.value.trim(), date: dateInput.value, status: 'pending', createdAt: Date.now() }); saveRecords(); form.reset(); $('#char-count').textContent = '0 / 200'; render(); closeModal(); showToast('预言已收录，等待未来揭晓'); });
openFormButton.addEventListener('click', openModal);
closeFormButton.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => { if (event.target.dataset.closeModal) closeModal(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) closeModal(); });
document.addEventListener('click', (event) => { const filter = event.target.closest('.filter'); if (filter) { activeFilter = filter.dataset.filter; render(); return; } const action = event.target.closest('[data-status]'); if (action) { const record = records.find((item) => item.id === action.dataset.id); if (record && record.status !== action.dataset.status) { record.status = action.dataset.status; saveRecords(); render(); showToast(action.dataset.status === 'pending' ? '已恢复为未揭晓' : `状态已更新为${action.dataset.status === 'success' ? '成功' : '失败'}`); } return; } const deletion = event.target.closest('[data-delete]'); if (deletion) { const record = records.find((item) => item.id === deletion.dataset.delete); if (record && window.confirm('确定删除这条预言吗？删除后无法恢复。')) { records = records.filter((item) => item.id !== record.id); saveRecords(); render(); showToast('预言已删除'); } } });
$('#sort-select').addEventListener('change', render);
render();
