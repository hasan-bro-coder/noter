import { initPWA } from "./pwa";
import"./style.css"

initPWA(document.body);
// ── Types ─────────────────────────────────────────
type DiaryData = Record<string, string>;

// ── State ─────────────────────────────────────────
let data: DiaryData = JSON.parse(localStorage.getItem('noter_data') ?? '{}');
let currentDate: string = '';
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// ── Element helpers ───────────────────────────────
function getEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el as T;
}

// ── Elements ──────────────────────────────────────
const sidebar    = getEl<HTMLElement>('sidebar');
const sidebarTab = getEl<HTMLButtonElement>('sidebarTab');
const overlay    = getEl<HTMLElement>('overlay');
const toggleBtn  = getEl<HTMLButtonElement>('toggleSidebar');
const entryList  = getEl<HTMLElement>('entryList');
const newBtn     = getEl<HTMLButtonElement>('newBtn');
const exportBtn  = getEl<HTMLButtonElement>('exportBtn');
const importBtn  = getEl<HTMLButtonElement>('importBtn');
const importFile = getEl<HTMLInputElement>('importFile');
const datePicker = getEl<HTMLInputElement>('datePicker');
const noteArea   = getEl<HTMLTextAreaElement>('noteArea');
const saveBtn    = getEl<HTMLButtonElement>('saveBtn');
const deleteBtn  = getEl<HTMLButtonElement>('deleteBtn');
const editorDate = getEl<HTMLElement>('editorDate');
const editorMeta = getEl<HTMLElement>('editorMeta');
const charCount  = getEl<HTMLElement>('charCount');
const editor     = getEl<HTMLElement>('editor');
const emptyState = getEl<HTMLElement>('emptyState');
const toast      = getEl<HTMLElement>('toast');

// ── Utilities ─────────────────────────────────────
const isMobile = (): boolean => window.innerWidth <= 640;

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function showToast(msg: string): void {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

// ── Persist ───────────────────────────────────────
function persist(): void {
  localStorage.setItem('noter_data', JSON.stringify(data));
}

// ── Render sidebar list ───────────────────────────
function renderList(): void {
  const sorted = Object.keys(data).sort((a, b) => b.localeCompare(a));

  if (sorted.length === 0) {
    entryList.innerHTML = '<div class="entry-empty">no entries yet</div>';
    return;
  }

  entryList.innerHTML = sorted.map(date => {
    const content = data[date] ?? '';
    const preview = content.split('\n')[0].slice(0, 60) || '—';
    const active  = date === currentDate ? 'active' : '';
    return `
      <button class="entry-item ${active}" data-date="${date}">
        <div class="entry-date">${formatDate(date)}</div>
        <div class="entry-preview">${escapeHtml(preview)}</div>
      </button>`;
  }).join('');
}

// ── Update char/word counter ──────────────────────
function updateCounts(text: string): void {
  const chars = text.length;
  const words = countWords(text);
  charCount.textContent = `${chars} char${chars !== 1 ? 's' : ''} · ${words} word${words !== 1 ? 's' : ''}`;
}

// ── Open an entry ─────────────────────────────────
function openEntry(date: string): void {
  currentDate = date;
  noteArea.value = data[date] ?? '';

  editorDate.textContent = formatDate(date);
  editorMeta.textContent = date === todayStr() ? 'today' : '';

  updateCounts(noteArea.value);

  editor.classList.add('active');
  emptyState.classList.add('hidden');
  deleteBtn.style.display = data[date] ? 'block' : 'none';

  renderList();
  noteArea.focus();

  if (isMobile()) closeSidebar();
}

// ── Save ──────────────────────────────────────────
function save(): void {
  if (!currentDate) return;

  const content = noteArea.value.trim();
  if (content) {
    data[currentDate] = noteArea.value;
    persist();
    deleteBtn.style.display = 'block';
    renderList();
    showToast('saved');
  } else {
    showToast('nothing to save');
  }
}

// ── Delete ────────────────────────────────────────
function deleteEntry(): void {
  if (!currentDate) return;
  if (!confirm(`Delete entry for ${formatDate(currentDate)}?`)) return;

  delete data[currentDate];
  persist();
  currentDate = '';
  noteArea.value = '';
  editor.classList.remove('active');
  emptyState.classList.remove('hidden');
  deleteBtn.style.display = 'none';
  renderList();
  showToast('deleted');
}

// ── Sidebar ───────────────────────────────────────
function openSidebar(): void {
  if (isMobile()) {
    sidebar.classList.add('mobile-open');
    overlay.classList.add('active');
  } else {
    sidebar.classList.remove('collapsed');
  }
}

function closeSidebar(): void {
  if (isMobile()) {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  } else {
    sidebar.classList.add('collapsed');
  }
}

function toggleSidebar(): void {
  if (isMobile()) {
    sidebar.classList.contains('mobile-open') ? closeSidebar() : openSidebar();
  } else {
    sidebar.classList.contains('collapsed') ? openSidebar() : closeSidebar();
  }
}

// ── Events ────────────────────────────────────────
toggleBtn.addEventListener('click', toggleSidebar);
sidebarTab.addEventListener('click', openSidebar);
overlay.addEventListener('click', closeSidebar);

newBtn.addEventListener('click', () => {
  openEntry(todayStr());
  datePicker.value = '';
});

datePicker.addEventListener('change', () => {
  const val = datePicker.value;
  if (val) {
    openEntry(val);
    datePicker.value = '';
  }
});

entryList.addEventListener('click', (e: MouseEvent) => {
  const item = (e.target as HTMLElement).closest<HTMLElement>('.entry-item');
  if (item?.dataset['date']) {
    openEntry(item.dataset['date']);
  }
});

noteArea.addEventListener('input', () => {
  updateCounts(noteArea.value);

  if (saveTimeout !== null) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    if (currentDate && noteArea.value.trim()) {
      data[currentDate] = noteArea.value;
      persist();
      renderList();
    }
  }, 1200);
});

saveBtn.addEventListener('click', save);
deleteBtn.addEventListener('click', deleteEntry);

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    save();
  }
});

// ── Export ────────────────────────────────────────
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `noter_export_${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('exported');
});

// ── Import ────────────────────────────────────────
importBtn.addEventListener('click', () => importFile.click());

importFile.addEventListener('change', (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event: ProgressEvent<FileReader>) => {
    try {
      const imported = JSON.parse(event.target?.result as string) as unknown;
      if (typeof imported !== 'object' || imported === null || Array.isArray(imported)) {
        throw new Error('Invalid format');
      }
      data = { ...data, ...(imported as DiaryData) };
      persist();
      renderList();
      showToast(`imported ${Object.keys(imported).length} entries`);
    } catch {
      showToast('invalid file');
    }
  };
  reader.readAsText(file);
  importFile.value = '';
});

// ── Init ──────────────────────────────────────────
renderList();

if (!isMobile()) {
  const today = todayStr();
  const newest = Object.keys(data).sort((a, b) => b.localeCompare(a))[0];
  if (data[today]) openEntry(today);
  else if (newest) openEntry(newest);
}