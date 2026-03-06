const cleanHarga = (hargaStr) => {
    if (typeof hargaStr === 'number') return hargaStr;
    // Hapus semua teks/simbol, ambil angkanya saja
    const cleaned = String(hargaStr).replace(/\D/g, ''); 
    return parseInt(cleaned) || 0;
};

document.getElementById('btn-import').addEventListener('click', () => {
    // Simulasi input file JSON
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonArray = JSON.parse(event.target.result);
                // Transform data array ke object untuk IndexedDB
                const formattedData = jsonArray.map(row => ({
                    id: `${row[0]}_${row[1]}`, // UNIX ID: Nama_Supplier
                    nama: row[0],
                    supplier: row[1],
                    stok: parseInt(row[2]) || 0,
                    barcode: row[3],
                    harga: cleanHarga(row[4])
                }));

                document.getElementById('progress-container').style.display = 'block';
                const progressBar = document.getElementById('import-progress');
                
                // Simpan ke DB dengan progress
                await dbInsertBulk('inventory', formattedData, (pct) => {
                    progressBar.value = pct;
                });

                document.getElementById('progress-container').style.display = 'none';
                showSuccessModal(`Berhasil import ${formattedData.length} data!`);
                updateDbSize();
                refreshDashboardStats(); // Refresh angka
            } catch (err) {
                alert("Gagal memproses JSON. Pastikan format benar.");
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

// ... (kode sebelumnya tetap ada) ...

document.getElementById('btn-export').addEventListener('click', async () => {
    try {
        const data = await dbGetAll('inventory');
        if (data.length === 0) return alert("Data kosong!");

        // Format balik ke array sesuai spesifikasi: ["Nama Barang","suplyer",STOK,"BARCODE","HARGA JUAL"]
        const exportData = data.map(item => [
            item.nama,
            item.supplier,
            item.stok,
            item.barcode,
            item.harga
        ]);

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_gudang_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showSuccessModal("Berhasil Export JSON!");
    } catch (e) {
        alert("Gagal export data!");
    }
});



const refreshDashboardStats = async () => {
    // 1. Hitung Total Produk di Inventory (total baris di store inventory)
    const invData = await dbGetAll('inventory');
    document.getElementById('stat-produk').innerText = invData.length;

    // 2. Hitung Total Frekuensi Transaksi Masuk dan Keluar
    const txData = await dbGetAll('transaksi');
    
    let countMasuk = 0;
    let countKeluar = 0;

    txData.forEach(tx => {
        // Kita hanya menghitung jumlah record (baris) transaksi berdasarkan tipenya
        if (tx.tipe === 'masuk') {
            countMasuk += 1;
        } else if (tx.tipe === 'keluar') {
            countKeluar += 1;
        }
    });

    document.getElementById('stat-masuk').innerText = countMasuk;
    document.getElementById('stat-keluar').innerText = countKeluar;
};

// Pastikan fungsi ini dipanggil saat dashboard aktif
// Tambahkan event listener untuk tombol Refresh jika diperlukan
document.getElementById('btn-import').addEventListener('click', () => {
    // ... kode import anda ...
    // Setelah import selesai, panggil:
    refreshDashboardStats();
});