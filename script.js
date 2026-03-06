// --- DATABASE LOGIC ---
let db;
const request = indexedDB.open("GudangDB", 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains("inventory")) {
        db.createObjectStore("inventory", { keyPath: "id" }); // id = Nama Barang + Supplier (Unique)
    }
    if (!db.objectStoreNames.contains("transaksi")) {
        db.createObjectStore("transaksi", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
    loadInventory();
    DatabaseAnalytics.updateSidebarIndicator(); // <--- TAMBAHKAN INI
};

// --- NAVIGATION & UI ---
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('hidden-sidebar');
}

function showSection(sectionId) {
    ['dashboard', 'inventory', 'transaksi'].forEach(s => {
        document.getElementById(s).classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
    document.getElementById('section-title').innerText = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
    
    if (sectionId === 'inventory') loadInventory();
    if (sectionId === 'transaksi') loadTransaksi();
}

// --- UTILS ---
function showSuccess() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('hidden'), 1500);
}



// --- INVENTORY LOGIC (HANDLING 10k DATA) ---
let cachedInventory = [];

async function loadInventory() {
    const tx = db.transaction("inventory", "readonly");
    const store = tx.objectStore("inventory");
    
    store.getAll().onsuccess = (e) => {
        cachedInventory = e.target.result;
        renderInventory(cachedInventory);
    };
}

function renderInventory(data) {
    const sortVal = document.getElementById('sortFilter').value;
    const body = document.getElementById('inventoryBody');
    body.innerHTML = "";

    // Sort
    data.sort((a, b) => {
        return sortVal === 'az' ? a.nama.localeCompare(b.nama) : b.nama.localeCompare(a.nama);
    });

    // Optimasi: Gunakan fragment atau limit tampilan jika lambat
    // Di sini kita tampilkan semua, IndexedDB kuat handle 10k, yang berat biasanya DOM.
    // Untuk 10k baris, idealnya gunakan Virtual Scrolling, tapi untuk demo ini kita pakai limit 1000 dulu.
    const limit = data.slice(0, 1000); 

    limit.forEach(item => {
        // Di dalam loop renderInventory:
const row = `
    <tr class="hover:bg-gray-50 text-sm border-b">
        <td class="p-3 border">
            <b>${item.nama}</b><br>
            <span class="text-xs text-gray-400">${item.supplier}</span>
            ${item.stok < 5 ? '<span class="ml-2 bg-red-100 text-red-600 text-[10px] px-1 rounded font-bold">LOW</span>' : ''}
        </td>
        <td class="p-3 border font-mono ${item.stok < 5 ? 'text-red-600 font-bold' : ''}">${item.stok}</td>
        <td class="p-3 border text-gray-500">${item.barcode}</td>
        <td class="p-3 border text-blue-700 font-semibold">Rp ${item.harga.toLocaleString()}</td>
        <td class="p-3 border flex gap-3 justify-center">
            <button onclick="openEditModal('${item.id}')" class="text-blue-500 hover:scale-110 transition-transform"><i class="fas fa-edit"></i></button>
            <button onclick="deleteItem('${item.id}')" class="text-red-400 hover:text-red-600 transition-colors"><i class="fas fa-trash"></i></button>
        </td>
    </tr>
`;
        body.insertAdjacentHTML('beforeend', row);
    });
}

function handleSearch(val) {
    if (val.length < 3) {
        if (val.length === 0) renderInventory(cachedInventory);
        return;
    }
    const filtered = cachedInventory.filter(i => 
        i.nama.toLowerCase().includes(val.toLowerCase()) || 
        i.barcode.includes(val)
    );
    renderInventory(filtered);
}

// --- RESET ALL WITH PASSWORD ---
function confirmReset() {
    const pwd = prompt("Masukkan Password Admin:");
    if (pwd === 'admin') {
        const tx = db.transaction(["inventory", "transaksi"], "readwrite");
        tx.objectStore("inventory").clear();
        tx.objectStore("transaksi").clear();
        tx.oncomplete = () => {
            showSuccess();
            loadInventory();
            DatabaseAnalytics.updateSidebarIndicator(); // <--- TAMBAHKAN INI
        };
    } else {
        alert("Password Salah!");
    }
}

// Tambahkan logika Transaksi dan Modal Barang di sini sesuai kebutuhan spesifikasi
// Fungsi Transaksi akan memanggil store.get(id) inventory, update stok, lalu put kembali.
function openModal(type) {
    const modal = document.getElementById('globalModal');
    const content = document.getElementById('modalContent');
    modal.classList.remove('hidden');

    if (type === 'modalTransaksi') {
        content.innerHTML = `
            <h3 class="text-lg font-bold mb-4">Transaksi Baru</h3>
            <div class="space-y-3">
                <label class="block text-sm">Cari Barang (Ketik Nama/Supplier)</label>
                <input type="text" id="txSearch" onkeyup="suggestBarang(this.value)" class="w-full border p-2 rounded" placeholder="Min. 3 huruf...">
                <select id="txBarangId" class="w-full border p-2 rounded bg-gray-50"></select>
                
                <label class="block text-sm">Tipe</label>
                <select id="txTipe" class="w-full border p-2 rounded">
                    <option value="Masuk">Barang Masuk (+)</option>
                    <option value="Keluar">Barang Keluar (-)</option>
                </select>

                <label class="block text-sm">Jumlah</label>
                <input type="number" id="txJumlah" class="w-full border p-2 rounded" min="1" value="1">
                
                <div class="flex justify-end gap-2 mt-4">
                    <button onclick="closeModal()" class="px-4 py-2 bg-gray-200 rounded">Batal</button>
                    <button onclick="saveTransaksi()" class="px-4 py-2 bg-orange-500 text-white rounded">Simpan</button>
                </div>
            </div>
        `;
    }
}

function closeModal() {
    document.getElementById('globalModal').classList.add('hidden');
}

// Auto-suggest untuk transaksi agar user tidak salah input ID
function suggestBarang(val) {
    const select = document.getElementById('txBarangId');
    select.innerHTML = "";
    if (val.length < 3) return;

    const matches = cachedInventory.filter(i => 
        i.nama.toLowerCase().includes(val.toLowerCase()) || 
        i.supplier.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 5); // Ambil 5 teratas saja agar ringan

    matches.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.text = `${m.nama} (${m.supplier}) - Stok: ${m.stok}`;
        select.appendChild(opt);
    });
}






// --- FIX DELETE ITEM ---
async function deleteItem(id) {
    if (!confirm(`Hapus barang ${id}? Data transaksi terkait tidak akan hilang tapi stok tidak lagi terpantau.`)) return;

    const tx = db.transaction("inventory", "readwrite");
    const store = tx.objectStore("inventory");
    
    store.delete(id);
    
    tx.oncomplete = () => {
        // Update cache lokal agar UI sinkron tanpa reload DB
        cachedInventory = cachedInventory.filter(item => item.id !== id);
        renderInventory(cachedInventory);
        showSuccess();
    };
}

// --- EDIT ITEM MODAL ---
function openEditModal(id) {
    const item = cachedInventory.find(i => i.id === id);
    if (!item) return;

    const modal = document.getElementById('globalModal');
    const content = document.getElementById('modalContent');
    modal.classList.remove('hidden');

    content.innerHTML = `
        <h3 class="text-lg font-bold mb-4">Edit Barang</h3>
        <div class="space-y-3">
            <p class="text-xs text-gray-500 italic">ID: ${item.id} (Key cannot be changed)</p>
            <label class="block text-xs font-semibold">Nama Barang</label>
            <input type="text" id="editNama" value="${item.nama}" class="w-full border p-2 rounded">
            
            <label class="block text-xs font-semibold">Supplier</label>
            <input type="text" id="editSup" value="${item.supplier}" class="w-full border p-2 rounded">

            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="block text-xs font-semibold">Barcode</label>
                    <input type="text" id="editBarcode" value="${item.barcode}" class="w-full border p-2 rounded">
                </div>
                <div>
                    <label class="block text-xs font-semibold">Harga Jual</label>
                    <input type="number" id="editHarga" value="${item.harga}" class="w-full border p-2 rounded">
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-4">
                <button onclick="closeModal()" class="px-4 py-2 bg-gray-200 rounded text-sm">Batal</button>
                <button onclick="saveEdit('${item.id}')" class="px-4 py-2 bg-blue-600 text-white rounded text-sm">Simpan Perubahan</button>
            </div>
        </div>
    `;
}

async function saveEdit(oldId) {
    const nama = document.getElementById('editNama').value;
    const sup = document.getElementById('editSup').value;
    const barcode = document.getElementById('editBarcode').value;
    const harga = parseInt(document.getElementById('editHarga').value);

    const tx = db.transaction("inventory", "readwrite");
    const store = tx.objectStore("inventory");

    // Ambil stok lama
    const oldItem = cachedInventory.find(i => i.id === oldId);
    
    const updatedItem = {
        id: `${nama}-${sup}`,
        nama: nama,
        supplier: sup,
        stok: oldItem.stok,
        barcode: barcode,
        harga: harga
    };

    // Jika Nama/Supplier berubah, ID (key) berubah. IndexedDB tidak bisa ganti key, jadi hapus lama & tambah baru.
    if (oldId !== updatedItem.id) {
        store.delete(oldId);
    }
    
    store.put(updatedItem);

    tx.oncomplete = () => {
        showSuccess();
        closeModal();
        loadInventory(); // Refresh full untuk re-sync cache
        DatabaseAnalytics.updateSidebarIndicator(); // <--- TAMBAHKAN INI
    };
}