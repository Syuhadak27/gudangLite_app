// --- LOGIKA TRANSAKSI (Update Stok Otomatis) ---

async function saveTransaksi() {
    const barangId = document.getElementById('txBarangId').value; // ID gabungan Nama-Supplier
    const tipe = document.getElementById('txTipe').value; // "Masuk" atau "Keluar"
    const jumlah = parseInt(document.getElementById('txJumlah').value);

    if (!barangId || !jumlah) return alert("Data tidak lengkap!");

    const tx = db.transaction(["inventory", "transaksi"], "readwrite");
    const invStore = tx.objectStore("inventory");
    const traStore = tx.objectStore("transaksi");

    // 1. Ambil data barang asli
    const item = await new Promise(res => {
        invStore.get(barangId).onsuccess = (e) => res(e.target.result);
    });

    if (!item) return alert("Barang tidak ditemukan!");

    // 2. Hitung Stok Baru
    // Rumus: Masuk menambah (+), Keluar mengurangi (-)
    if (tipe === "Masuk") {
        item.stok += jumlah;
    } else {
        if (item.stok < jumlah) return alert("Stok tidak mencukupi!");
        item.stok -= jumlah;
    }

    // 3. Simpan perubahan ke kedua tabel
    invStore.put(item);
    traStore.add({
        barangId: barangId,
        tipe: tipe,
        jumlah: jumlah,
        waktu: new Date().toLocaleString()
    });

    tx.oncomplete = () => {
        showSuccess();
        closeModal();
        loadInventory();
        loadTransaksi();
    };
}

async function loadTransaksi() {
    const tx = db.transaction("transaksi", "readonly");
    const store = tx.objectStore("transaksi");
    const body = document.getElementById('transaksiBody');
    body.innerHTML = "";

    store.getAll().onsuccess = (e) => {
        const data = e.target.result.reverse(); // Transaksi terbaru di atas
        data.forEach(t => {
            const row = `
                <tr class="hover:bg-gray-50 text-sm">
                    <td class="p-3 border">${t.barangId}</td>
                    <td class="p-3 border">
                        <span class="px-2 py-1 rounded text-xs ${t.tipe === 'Masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${t.tipe}
                        </span>
                    </td>
                    <td class="p-3 border font-bold">${t.jumlah}</td>
                    <td class="p-3 border text-gray-500 text-xs">${t.waktu}</td>
                    <td class="p-3 border">
                        <button onclick="deleteTransaksi(${t.id}, '${t.barangId}', '${t.tipe}', ${t.jumlah})" class="text-red-400 hover:text-red-600">
                            <i class="fas fa-undo"></i> Batal
                        </button>
                    </td>
                </tr>
            `;
            body.insertAdjacentHTML('beforeend', row);
        });
    };
}

async function deleteTransaksi(id, barangId, tipe, jumlah) {
    if (!confirm("Batalkan transaksi ini? Stok akan dikembalikan.")) return;

    const tx = db.transaction(["inventory", "transaksi"], "readwrite");
    const invStore = tx.objectStore("inventory");
    
    // Kembalikan stok (logika terbalik)
    const item = await new Promise(res => {
        invStore.get(barangId).onsuccess = (e) => res(e.target.result);
    });

    if (item) {
        if (tipe === "Masuk") item.stok -= jumlah;
        else item.stok += jumlah;
        invStore.put(item);
    }

    tx.objectStore("transaksi").delete(id);
    tx.oncomplete = () => {
        showSuccess();
        loadTransaksi();
        loadInventory();
    };
}