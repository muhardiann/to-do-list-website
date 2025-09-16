'use strict';

// --- 1. SELEKSI ELEMEN DOM ---
const todoForm = document.querySelector('#new-todo-form');
const todoInput = document.querySelector('#todo-input');
const todoList = document.querySelector('#todo-list');

// --- 2. STATE APLIKASI ---
const savedTodos = localStorage.getItem('todos-data');
let todos = savedTodos ? JSON.parse(savedTodos) : [];

// --- 3. FUNGSI-FUNGSI ---
function renderTodos() {
    // 1. Kosongkan dulu daftar <ul> yang ada agar tidak duplikat
    todoList.innerHTML = '';

    // 2. Loop setiap objek di dalam array 'todos'
    todos.forEach(function(todo) {
        // 3. Buat elemen <li> baru untuk setiap todo
        const todoElement = document.createElement('li');
        todoElement.classList.add('todo-item');
        todoElement.dataset.id = todo.id;

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
    });
}

function saveTodos() {
    // Ubah array 'todos' menjadi string JSON dan simpan ke localStorage
    // dengan kunci 'todos-data'
    localStorage.setItem('todos-data', JSON.stringify(todos));
}

// --- 4. EVENT LISTENERS ---
todoForm.addEventListener('submit', function(event) {
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
        completed: false // Setiap tugas baru statusnya belum selesai
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

todoList.addEventListener('click', function(event) {
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

    // 2. Panggil renderTodos() untuk memperbarui tampilan sesuai data terbaru
    renderTodos();
});

// --- 5. INISIALISASI APLIKASI ---
renderTodos();
saveTodos(); // Pastikan data di localStorage sudah sesuai saat pertama kali load