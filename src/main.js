'use strict';

// --- 1. SELEKSI ELEMEN DOM ---
const todoForm = document.querySelector('#new-todo-form');
const todoInput = document.querySelector('#todo-input');
const todoList = document.querySelector('#todo-list');
const themeToggleButton = document.querySelector('#theme-toggle');
const themeIcon = document.querySelector('#theme-icon');
const filtersContainer = document.querySelector('.filters');
const taskCounter = document.querySelector('#task-counter');
const clearCompletedBtn = document.querySelector('#clear-completed-btn');
const todoAppContainer = document.querySelector('.todo-app');
const deleteModeBtn = document.querySelector('#delete-mode-btn');
const clearActiveBtn = document.querySelector('#clear-active-btn');
const separator = document.querySelector('.separator');
const confirmationModal = document.querySelector('#confirmation-modal');
const loadingModal = document.querySelector('#loading-modal');
const successModal = document.querySelector('#success-modal');
const confirmDeleteBtn = document.querySelector('#confirm-delete-btn');
const cancelDeleteBtn = document.querySelector('#cancel-delete-btn');
const closeSuccessBtn = document.querySelector('#close-success-btn');
const modalOverlays = document.querySelectorAll('.modal-overlay');
const modalCloseBtns = document.querySelectorAll('.modal-close');

// --- 2. STATE APLIKASI ---
const savedTodos = localStorage.getItem('todos-data');
let todos = savedTodos ? JSON.parse(savedTodos) : [];
let currentTheme = localStorage.getItem('theme') || 'light';
let currentFilter = 'all';  // Default 'all' filter
let isDeleteMode = false;
let pendingDeleteAction = null; // Untuk menyimpan aksi hapus ('active' atau 'completed')

// --- 3. FUNGSI-FUNGSI ---
function renderTodos() {
  // 1. Kosongkan dulu daftar <ul> yang ada agar tidak duplikat
  todoList.innerHTML = '';

  const filteredTodos = todos.filter(todo => {
    if (currentFilter === 'active') {
      return !todo.completed;
    }
    if (currentFilter === 'completed') {
      return todo.completed;
    }
    return true; // Untuk 'all', kembalikan semua
  });

  // 2. Loop setiap objek di dalam array 'todos'
  filteredTodos.forEach(function (todo) {
    // 3. Buat elemen <li> baru untuk setiap todo
    const todoElement = document.createElement('li');
    todoElement.classList.add('todo-item');
    todoElement.dataset.id = todo.id;

    if (todo.isNew) {
      todoElement.classList.add('new');
      // Hapus status 'isNew' agar animasi tidak terulang saat render berikutnya
      delete todo.isNew;
    }

    // Jika todo.completed adalah true, tambahkan class 'completed'
    if (todo.completed) {
      todoElement.classList.add('completed');
    }

    // 4. Buat struktur HTML untuk satu item (checkbox, text, delete button)
    todoElement.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''}>
            <span class="text">${todo.text}</span>
            <button class="delete-btn">X</button>
        `;

    // 5. Masukkan elemen <li> yang sudah jadi ke dalam <ul>
    todoList.appendChild(todoElement);

    // Memicu transisi dengan menghapus class 'new' setelah elemen ditambahkan
    // Menggunakan requestAnimationFrame untuk memastikan browser siap
    requestAnimationFrame(() => {
      const newElement = todoList.querySelector(`[data-id='${todo.id}'].new`);
      if (newElement) {
        newElement.classList.remove('new');
      }
    });
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === currentFilter);
  });

  const hasActive = todos.some(todo => !todo.completed);
  const hasCompleted = todos.some(todo => todo.completed);

  clearActiveBtn.style.display = 'none';
  clearCompletedBtn.style.display = 'none';
  separator.style.display = 'none';

  if (currentFilter === 'all') {
    if (hasActive) clearActiveBtn.style.display = 'block';
    if (hasCompleted) clearCompletedBtn.style.display = 'block';
    if (hasActive && hasCompleted) separator.style.display = 'block';
  } else if (currentFilter === 'active') {
    if (hasActive) clearActiveBtn.style.display = 'block';
  } else if (currentFilter === 'completed') {
    if (hasCompleted) clearCompletedBtn.style.display = 'block';
  }

  // Hitung tugas yang masih aktif (belum selesai)
  const activeTodosCount = todos.filter(todo => !todo.completed).length;
  taskCounter.textContent = `${activeTodosCount} tugas tersisa`;
}

function saveTodos() {
  // Ubah array 'todos' menjadi string JSON dan simpan ke localStorage
  // dengan kunci 'todos-data'
  localStorage.setItem('todos-data', JSON.stringify(todos));
}

function openModal(modal) {
  modal.classList.remove('hidden');
}

function closeAllModals() {
  modalOverlays.forEach(modal => modal.classList.add('hidden'));
}

// --- 4. EVENT LISTENERS ---
todoForm.addEventListener('submit', function (event) {
  // 1. Mencegah form dari perilaku default-nya (reload halaman)
  event.preventDefault();

  // 2. Ambil teks dari input field, buang spasi di awal/akhir
  const newTodoText = todoInput.value.trim();

  // 3. Jika input kosong, jangan lakukan apa-apa
  if (newTodoText === '') {
    return;
  }

  // 4. Buat objek todo baru
  const newTodo = {
    id: Date.now(), // ID unik sederhana menggunakan timestamp
    text: newTodoText,
    completed: false, // Setiap tugas baru statusnya belum selesai
    isNew: true // Tandai sebagai baru untuk animasi
  };

  // 5. Tambahkan objek todo baru ke dalam array 'todos'
  todos.push(newTodo);

  // 6. Panggil fungsi render untuk update tampilan
  renderTodos();
  saveTodos(); // Simpan data terbaru ke localStorage

  // 7. Kosongkan kembali input field
  todoInput.value = '';
  todoInput.focus(); // Fokuskan kursor kembali ke input
});

todoList.addEventListener('click', function (event) {
  const target = event.target; // Elemen yang di-klik (bisa checkbox, text, atau tombol X)
  const parentLi = target.closest('.todo-item'); // Cari elemen <li> terdekat dari yang di-klik

  // Jika tidak ada <li> ditemukan, hentikan fungsi
  if (!parentLi) return;

  // Ambil ID dari atribut data-id yang sudah kita pasang tadi
  const todoId = Number(parentLi.dataset.id);

  // --- LOGIKA UPDATE (TOGGLE COMPLETE) ---
  if (target.type === 'checkbox') {
    // 1. Cari todo di dalam array 'todos' yang ID-nya cocok
    const todoToUpdate = todos.find(todo => todo.id === todoId);

    // 2. Ubah status 'completed'-nya (dari true ke false, atau sebaliknya)
    if (todoToUpdate) {
      todoToUpdate.completed = !todoToUpdate.completed;
    }
  }

  // --- LOGIKA DELETE ---
  if (target.matches('.delete-btn')) {
    // 1. Buat array baru yang isinya semua todo KECUALI yang ID-nya cocok
    todos = todos.filter(todo => todo.id !== todoId);
  }

  // Panggil render dan save HANYA JIKA ada perubahan
  if (target.type === 'checkbox' || target.matches('.delete-btn')) {
    renderTodos();
    saveTodos(); // <<< INI DIA PERBEDAANNYA: saveTodos() dipanggil
  }

});

// Event listener untuk tombol tema
themeToggleButton.addEventListener('click', () => {
  // Ganti tema dari terang ke gelap atau sebaliknya
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';

  if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeIcon.src = '/light.svg'; // Ganti ikon menjadi matahari
  } else {
    document.body.classList.remove('dark-mode');
    themeIcon.src = '/dark.svg'; // Ganti ikon menjadi bulan
  }

  // Simpan preferensi tema ke localStorage
  localStorage.setItem('theme', currentTheme);
});

filtersContainer.addEventListener('click', (event) => {
  const target = event.target;
  // Pastikan yang diklik adalah tombol filter
  if (target.matches('.filter-btn')) {
    // Update state filter saat ini
    currentFilter = target.dataset.filter;
    // Render ulang daftar tugas dengan filter yang baru
    renderTodos();
  }
});

clearActiveBtn.addEventListener('click', () => {
  pendingDeleteAction = 'active';
  openModal(confirmationModal);
});

clearCompletedBtn.addEventListener('click', () => {
  pendingDeleteAction = 'completed';
  openModal(confirmationModal);
});

// Event listener untuk tombol Mode Hapus
deleteModeBtn.addEventListener('click', () => {
  // 1. Balikkan status mode hapus (dari false ke true, atau sebaliknya)
  isDeleteMode = !isDeleteMode;

  // 2. Tambahkan/hapus class 'delete-mode-active' pada kontainer utama
  todoAppContainer.classList.toggle('delete-mode-active');

  // 3. Tambahkan/hapus class 'active' pada tombol itu sendiri untuk feedback
  deleteModeBtn.classList.toggle('active');
});

confirmDeleteBtn.addEventListener('click', () => {
  closeAllModals();
  openModal(loadingModal);

  setTimeout(() => {
    if (pendingDeleteAction === 'active') {
      todos = todos.filter(todo => todo.completed);
    } else if (pendingDeleteAction === 'completed') {
      todos = todos.filter(todo => !todo.completed);
    }

    renderTodos();
    saveTodos();
    closeAllModals();
    openModal(successModal);
    pendingDeleteAction = null; // Reset state
  }, 500); // Simulasi proses hapus
});

cancelDeleteBtn.addEventListener('click', closeAllModals);
closeSuccessBtn.addEventListener('click', closeAllModals);
modalCloseBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
modalOverlays.forEach(overlay => {
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeAllModals();
    }
  });
});

// --- 5. INISIALISASI APLIKASI ---
function applyInitialTheme() {
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeIcon.src = '/light.svg';
  } else {
    document.body.classList.remove('dark-mode');
    themeIcon.src = '/dark.svg';
  }
}

applyInitialTheme(); // Terapkan tema saat halaman dimuat
renderTodos(); // Render daftar tugas