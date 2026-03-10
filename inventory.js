let inventoryData = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 100;

const loadInventory = async () => {
    inventoryData = await dbGetAll('inventory');
    renderInventory();
};

// ... (kode loadInventory & event listener hapus semua tetap) ...

const renderInventory = () => {
    const tbody = document.getElementById('tbody-inventory');
    tbody.innerHTML = '';
    
    const keyword = document.getElementById('search-inventory').value.toLowerCase();
    let filtered = inventoryData;
    
    if (keyword.length >= 3) {
        filtered = inventoryData.filter(item => 
            item.nama.toLowerCase().includes(keyword) || 
            item.supplier.toLowerCase().includes(keyword)
        );
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = filtered.slice(start, start + ITEMS_PER_PAGE);

    paginatedItems.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nama}</td>
            <td>${item.supplier}</td>
            <td><b>${item.stok}</b></td>
            <td>${item.barcode}</td>
            <td>Rp ${item.harga.toLocaleString('id-ID')}</td>
            <td>
                <button class="btn btn-secondary" style="padding:5px" onclick="editInventory('${item.id}')">Edit</button>
                <button class="btn btn-danger" style="padding:5px" onclick="deleteInventory('${item.id}')">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

// FITUR TAMBAH
document.getElementById('btn-add-inv').addEventListener('click', () => {
    showModal(`
        <h3>Tambah Barang</h3>
        <input type="text" id="inv-nama" placeholder="Nama Barang" class="mt-2" style="width:100%; padding:8px;">
        <input type="text" id="inv-sup" placeholder="Supplier" class="mt-2" style="width:100%; padding:8px;">
        <input type="number" id="inv-stok" placeholder="Stok Awal" class="mt-2" style="width:100%; padding:8px;">
        <input type="text" id="inv-bc" placeholder="Barcode" class="mt-2" style="width:100%; padding:8px;">
        <input type="number" id="inv-harga" placeholder="Harga Jual" class="mt-2" style="width:100%; padding:8px;">
        <div class="mt-2">
            <button class="btn btn-primary" onclick="saveInventory()">Simpan</button>
            <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
        </div>
    `);
});

const saveInventory = async (isEdit = false, oldId = null) => {
    const nama = document.getElementById('inv-nama').value;
    const supplier = document.getElementById('inv-sup').value;
    const id = `${nama}_${supplier}`; // UNIX ID

    const data = {
        id: id,
        nama: nama,
        supplier: supplier,
        stok: parseInt(document.getElementById('inv-stok').value) || 0,
        barcode: document.getElementById('inv-bc').value,
        harga: parseInt(document.getElementById('inv-harga').value) || 0
    };

    const tx = db.transaction('inventory', 'readwrite');
    const store = tx.objectStore('inventory');
    
    if (isEdit && oldId !== id) store.delete(oldId); // Hapus jika key berubah
    store.put(data);

    tx.oncomplete = () => {
        loadInventory();
        updateDbSize();
        showSuccessModal(isEdit ? "Data diubah!" : "Barang ditambahkan!");
    };
};

// FITUR EDIT
window.editInventory = (id) => {
    const item = inventoryData.find(i => i.id === id);
    if(!item) return;
    showModal(`
        <h3>Edit Barang</h3>
        <input type="text" id="inv-nama" value="${item.nama}" class="mt-2" style="width:100%; padding:8px;">
        <input type="text" id="inv-sup" value="${item.supplier}" class="mt-2" style="width:100%; padding:8px;">
        <input type="number" id="inv-stok" value="${item.stok}" class="mt-2" style="width:100%; padding:8px;" readonly title="Edit stok dari menu Transaksi/Opname">
        <input type="text" id="inv-bc" value="${item.barcode}" class="mt-2" style="width:100%; padding:8px;">
        <input type="number" id="inv-harga" value="${item.harga}" class="mt-2" style="width:100%; padding:8px;">
        <div class="mt-2">
            <button class="btn btn-primary" onclick="saveInventory(true, '${item.id}')">Update</button>
            <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
        </div>
    `);
};

// FITUR HAPUS
// FITUR HAPUS (KOREKSI)
window.deleteInventory = (id) => {
    showModal(`
        <h3>Hapus Barang?</h3>
        <p>Anda yakin ingin menghapus barang ini?</p>
        <button class="btn btn-danger mt-2" onclick="confirmDeleteInv('${id}')">Ya, Hapus</button>
        <button class="btn btn-secondary mt-2" onclick="closeModal()">Batal</button>
    `);
};

window.confirmDeleteInv = (id) => {
    const request = db.transaction('inventory', 'readwrite').objectStore('inventory').delete(id);
    request.onsuccess = () => {
        loadInventory();
        updateDbSize();
        closeModal(); // Pastikan modal tertutup setelah hapus
        showSuccessModal("Barang berhasil dihapus!");
    };
    request.onerror = () => {
        alert("Gagal menghapus data dari database.");
    };
};

// Event Listener Search Bar Auto Suggest
document.getElementById('search-inventory').addEventListener('keyup', (e) => {
    currentPage = 1;
    renderInventory();
});

// Fitur Hapus Semua dengan Password
document.getElementById('btn-del-all').addEventListener('click', () => {
    showModal(`
        <h3>Peringatan Kritis!</h3>
        <p>Masukkan password untuk menghapus seluruh inventory:</p>
        <input type="password" id="del-password" class="mt-2" style="padding:10px; width:100%;"><br>
        <button id="confirm-del" class="btn btn-danger mt-2">Hapus Permanen</button>
        <button onclick="closeModal()" class="btn btn-secondary mt-2">Batal</button>
    `);

    document.getElementById('confirm-del').addEventListener('click', async () => {
        const pass = document.getElementById('del-password').value;
        
        // Menggunakan password yang sama dengan login atau beda (sesuai keinginan Anda)
        if (pass === 'admin') { 
            try {
                // 1. Bersihkan Store Inventory
                await dbClear('inventory');
                
                // 2. Bersihkan Store Transaksi (Kunci agar sinkron!)
                await dbClear('transaksi');

                // 3. Refresh Tampilan
                loadInventory();
                if (typeof loadTransactions === 'function') loadTransactions();
                updateDbSize();
                
                closeModal();
                showSuccessModal("Sistem berhasil dikosongkan (Inventory & Transaksi)!");
            } catch (err) {
                console.error(err);
                alert("Gagal mengosongkan database.");
            }
        } else {
            alert("Password salah! Data aman.");
        }
    });
});