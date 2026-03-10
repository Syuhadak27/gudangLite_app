document.getElementById('btn-add-opname').addEventListener('click', async () => {
    const invData = await dbGetAll('inventory');
    const options = invData.map(i => `<option value="${i.id}">${i.nama} - ${i.supplier} (Sistem: ${i.stok})</option>`).join('');
    
    showModal(`
        <h3>Stok Opname</h3>
        <input list="list-opname" id="opname-inv-id" placeholder="Cari barang..." style="width:100%; padding:8px;">
        <datalist id="list-opname">${options}</datalist>
        <input type="number" id="opname-fisik" placeholder="Jumlah Fisik Sebenarnya" class="mt-2" style="width:100%; padding:8px;">
        <button class="btn btn-primary mt-2" onclick="saveOpname()">Update ke Inventory</button>
        <button class="btn btn-secondary mt-2" onclick="closeModal()">Batal</button>
    `);
});

const saveOpname = async () => {
    const invId = document.getElementById('opname-inv-id').value;
    const stokFisik = parseInt(document.getElementById('opname-fisik').value);

    // Dapatkan stok lama untuk menghitung selisih (transaksi)
    const invStore = db.transaction('inventory', 'readonly').objectStore('inventory');
    const req = invStore.get(invId);
    
    req.onsuccess = async () => {
        const item = req.result;
        if (!item) return alert("Barang tidak ditemukan!");
        
        const selisih = stokFisik - item.stok;
        
        // Update Inventory & Tambah Log Transaksi
        const txDB = db.transaction(['inventory', 'transaksi'], 'readwrite');
        item.stok = stokFisik;
        txDB.objectStore('inventory').put(item);
        txDB.objectStore('transaksi').add({
            inv_id: invId,
            tipe: selisih >= 0 ? 'masuk' : 'keluar',
            qty: Math.abs(selisih),
            timestamp: Date.now(),
            catatan: 'Opname'
        });

        txDB.oncomplete = () => {
            loadInventory();
            loadTransaksi();
            showSuccessModal(`Opname sukses! Selisih ${selisih} tersimpan.`);
        };
    };
};