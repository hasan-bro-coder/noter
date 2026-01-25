import './style.css'
// Define the shape of our diary data
interface DiaryData {
  [date: string]: string;
}

// Select elements with proper Type Casting
const list = document.querySelector<HTMLUListElement>('ul')!;
const dialog = document.querySelector<HTMLDialogElement>('dialog')!;
const textarea = document.querySelector<HTMLTextAreaElement>('textarea')!;
const saveBtn = dialog.querySelector<HTMLButtonElement>('button:last-child')!;
const deleteBtn = dialog.querySelector<HTMLButtonElement>('button:first-child')!;

// Get buttons from Nav
const navButtons = document.querySelectorAll<HTMLButtonElement>('nav button');
const [newBtn, exportBtn, importBtn] = Array.from(navButtons);

// Initialize State
let diaryData: DiaryData = JSON.parse(localStorage.getItem('noter_data') || '{}');
let currentEditingDate: string = "";

/**
 * Renders the list of notes from the JSON object
 */
const render = (): void => {
  if (!list) return;
  
  const sortedDates = Object.keys(diaryData).sort((a, b) => b.localeCompare(a));
  
  list.innerHTML = sortedDates.map(date => `
      <li data-date="${date}">
        <h3>${new Date(date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</h3>
        <p>${diaryData[date]}</p>
      </li>
    `).join('');
};

/**
 * Persists data to LocalStorage
 */
const persist = (): void => {
  localStorage.setItem('noter_data', JSON.stringify(diaryData));
  render();
};

// --- Events ---

newBtn.onclick = () => {
  // Use local date string YYYY-MM-DD to avoid timezone shifts
  currentEditingDate = new Date().toISOString().split('T')[0];
  textarea.value = diaryData[currentEditingDate] || "";
  dialog.showModal();
};

saveBtn.onclick = () => {
  const content = textarea.value.trim();
  if (content) {
    diaryData[currentEditingDate] = content;
    persist();
    dialog.close();
  } else {
    alert("Please write something before saving.");
  }
};

deleteBtn.onclick = () => {
  if (confirm("Delete this entry?")) {
    delete diaryData[currentEditingDate];
    persist();
    dialog.close();
  }
};

// Delegate click event to the list items
list.onclick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const li = target.closest('li');
  if (!li) return;
  
  currentEditingDate = li.dataset.date || "";
  textarea.value = diaryData[currentEditingDate] || "";
  dialog.showModal();
};

// --- Export / Import Logic ---

exportBtn.onclick = () => {
  const dataStr = JSON.stringify(diaryData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `diary_export_${currentEditingDate || 'backup'}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

importBtn.onclick = () => {
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  
  fileInput.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        diaryData = { ...diaryData, ...importedData }; // Merge instead of overwrite
        persist();
      } catch (err) {
        alert("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
  };
  fileInput.click();
};

// Initial Render
render();