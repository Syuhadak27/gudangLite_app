async function updateDashboardStats() {
    // 1. Hitung Total Produk (dari Cached Inventory)
    document.getElementById('dash-total-produk').innerText = cachedInventory.length;

    // 2. Hitung Transaksi Hari Ini
    const today = new Date().toLocaleDateString('id-ID'); // Format: DD/MM/YYYY
    let masukCount = 0;
    let keluarCount = 0;

    const tx = db.transaction("transaksi", "readonly");
    const store = tx.objectStore("transaksi");
    
    store.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const t = cursor.value;
            // Ambil bagian tanggal saja dari string waktu (misal: "01/01/2024, 10:00:00")
            const dateOnly = t.waktu.split(',')[0]; 

            if (dateOnly === today) {
                if (t.tipe.toLowerCase().includes("masuk")) masukCount++;
                if (t.tipe.toLowerCase().includes("keluar")) keluarCount++;
            }
            cursor.continue();
        } else {
            // Update UI setelah cursor selesai
            document.getElementById('dash-masuk-today').innerText = masukCount;
            document.getElementById('dash-keluar-today').innerText = keluarCount;
        }
    };
}