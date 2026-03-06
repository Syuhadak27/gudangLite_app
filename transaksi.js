let txData = [];

const loadTransaksi = async () => {
    txData = await dbGetAll('transaksi');
    const tbody = document.getElementById('tbody-transaksi');
    tbody.innerHTML = '';
    
    txData.slice().reverse().forEach(tx => { // Tampilkan yg terbaru di atas
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(tx.timestamp).toLocaleString('id-ID')}</td>
            <td>${tx.nama || '-'}</td>       <td>${tx.supplier || '-'}</td>   <td style="color:${tx.tipe === 'masuk' ? 'green' : 'red'}">${tx.tipe.toUpperCase()}</td>
            <td>${tx.qty}</td>
            <td>
                <button class="btn btn-secondary" onclick="editTransaksi(${tx.tx_id}, '${tx.inv_id}', ${tx.qty}, '${tx.tipe}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteTransaksi(${tx.tx_id}, '${tx.inv_id}', '${tx.tipe}', ${tx.qty})">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
};

const generateDatalist = async () => {
    const invData = await dbGetAll('inventory');
    // Membuat HTML datalist
    const options = invData.map(i => `<option value="${i.id}">${i.nama} - ${i.supplier}</option>`).join('');
    return `<datalist id="list-barang">${options}</datalist>`;
};

// Contoh pada Transaksi:
document.getElementById('btn-add-tx').addEventListener('click', async () => {
    const datalist = await generateDatalist();
    showModal(`
        <h3>Input Transaksi</h3>
        ${datalist}
        <input list="list-barang" id="tx-inv-id" placeholder="Ketik nama barang..." style="width:100%; padding:8px;">
        <select id="tx-tipe" class="mt-2" style="width:100%; padding:8px;">
            <option value="masuk">Barang Masuk</option>
            <option value="keluar">Barang Keluar</option>
        </select>
        <input type="number" id="tx-qty" placeholder="Jumlah" class="mt-2" style="width:100%; padding:8px;">
        <button class="btn btn-primary mt-2" onclick="saveTransaksi()">Simpan</button>
        <button class="btn btn-secondary mt-2" onclick="closeModal()">Batal</button>
    `);
});

const saveTransaksi = async () => {
    const fullId = document.getElementById('tx-inv-id').value; // Contoh: "Sabun_Wings"
    const tipe = document.getElementById('tx-tipe').value;
    const qty = parseInt(document.getElementById('tx-qty').value);
    
    // Pisahkan nama dan supplier dari ID (asumsi format ID adalah "nama_supplier")
    const parts = fullId.split('_');
    const nama = parts[0];
    const supplier = parts[1] || 'Tanpa Supplier';

    const txDB = db.transaction(['inventory', 'transaksi'], 'readwrite');
    const invStore = txDB.objectStore('inventory');
    
    const invReq = invStore.get(fullId);
    invReq.onsuccess = () => {
        const item = invReq.result;
        if (tipe === 'masuk') item.stok += qty;
        else item.stok -= qty;

        invStore.put(item);
        txDB.objectStore('transaksi').add({ 
            inv_id: fullId, 
            nama: nama,          // <--- Tambahkan field baru
            supplier: supplier,  // <--- Tambahkan field baru
            tipe: tipe, 
            qty: qty, 
            timestamp: Date.now() 
        });
    };

    txDB.oncomplete = () => {
        loadTransaksi();
        loadInventory(); // Refresh memori stok
        showSuccessModal("Transaksi berhasil dicatat!");
    };
};

window.deleteTransaksi = (tx_id, inv_id, tipe, qty) => {
    // Revert stok sebelum hapus
    const txDB = db.transaction(['inventory', 'transaksi'], 'readwrite');
    const invStore = txDB.objectStore('inventory');
    
    const invReq = invStore.get(inv_id);
    invReq.onsuccess = () => {
        if(invReq.result) {
            const item = invReq.result;
            // Kembalikan kebalikannya
            if (tipe === 'masuk') item.stok -= qty;
            else item.stok += qty;
            invStore.put(item);
        }
        txDB.objectStore('transaksi').delete(tx_id);
    };

    txDB.oncomplete = () => {
        loadTransaksi();
        loadInventory();
        showSuccessModal("Transaksi dibatalkan & stok dikembalikan.");
    };
};

// Tambahkan fungsi ini
window.editTransaksi = async (tx_id, inv_id, oldQty, tipe) => {
    showModal(`
        <h3>Edit Jumlah Transaksi</h3>
        <input type="number" id="edit-qty" value="${oldQty}" class="mt-2" style="width:100%; padding:8px;">
        <button class="btn btn-primary mt-2" onclick="confirmEditTx(${tx_id}, '${inv_id}', ${oldQty}, '${tipe}')">Update</button>
    `);
};

window.confirmEditTx = async (tx_id, inv_id, oldQty, tipe) => {
    const newQty = parseInt(document.getElementById('edit-qty').value);
    const selisih = newQty - oldQty;

    const txDB = db.transaction(['inventory', 'transaksi'], 'readwrite');
    const invStore = txDB.objectStore('inventory');
    
    const invReq = invStore.get(inv_id);
    invReq.onsuccess = () => {
        const item = invReq.result;
        // Jika Masuk: stok = stok + selisih
        // Jika Keluar: stok = stok - selisih
        if (tipe === 'masuk') item.stok += selisih;
        else item.stok -= selisih;
        
        invStore.put(item);
        txDB.objectStore('transaksi').put({ tx_id, inv_id, tipe, qty: newQty, timestamp: Date.now() });
    };

    txDB.oncomplete = () => {
        loadTransaksi();
        loadInventory();
        showSuccessModal("Transaksi diupdate!");
    };
};