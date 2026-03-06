// Memanggil modal input
function openAddProduct() {
    // Sesuaikan dengan fungsi modal global Anda
    const modal = document.getElementById('globalModal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
        <div class="p-2">
            <h2 class="text-xl font-bold mb-6">Tambah Barang</h2>
            <div class="space-y-4">
                <div>
                    <label class="text-xs font-bold text-slate-400">Nama Barang</label>
                    <input id="p_nama" class="w-full mt-1 p-3 bg-slate-100 rounded-xl outline-none">
                </div>
                <div>
                    <label class="text-xs font-bold text-slate-400">Supplier</label>
                    <input id="p_supplier" class="w-full mt-1 p-3 bg-slate-100 rounded-xl outline-none">
                </div>
                <div>
                    <label class="text-xs font-bold text-slate-400">Barcode</label>
                    <input id="p_barcode" class="w-full mt-1 p-3 bg-slate-100 rounded-xl outline-none">
                </div>
                <div>
                    <label class="text-xs font-bold text-slate-400">Stok</label>
                    <input type="number" id="p_stok" value="0" class="w-full mt-1 p-3 bg-slate-100 rounded-xl outline-none">
                </div>
                <div>
                    <label class="text-xs font-bold text-slate-400">Harga</label>
                    <input type="number" id="p_price" value="0" class="w-full mt-1 p-3 bg-slate-100 rounded-xl outline-none">
                </div>
            </div>
            <div class="mt-8 flex gap-3">
                <button onclick="closeModal()" class="flex-1 py-3 text-slate-400 font-bold">Batal</button>
                <button onclick="submitProduct()" class="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold">Simpan</button>
            </div>
        </div>
    `;
    modal.classList.remove('hidden');
}

// Logika penyimpanan ke IndexedDB
async function submitProduct() {
    const nama = document.getElementById('p_nama').value.trim();
    const sup = document.getElementById('p_supplier').value.trim();
    const barcode = document.getElementById('p_barcode').value.trim();
    const stok = parseInt(document.getElementById('p_stok').value) || 0;
    const harga = parseInt(document.getElementById('p_price').value) || 0;

    if (!nama || !sup) return alert("Nama dan Supplier wajib diisi!");

    const itemBaru = {
        id: `${nama}-${sup}`, // Sesuai keyPath: "id" di database
        nama: nama,
        supplier: sup,
        barcode: barcode,
        stok: stok,
        harga: harga
    };

    const tx = db.transaction("inventory", "readwrite");
    const request = tx.objectStore("inventory").add(itemBaru);

    request.onsuccess = () => {
        showSuccess(); // Animasi centang ijo
        closeModal();
        loadInventory(); // Refresh tabel agar data baru muncul
    };

    request.onerror = () => {
        alert("Gagal: Barang dengan Nama & Supplier tersebut sudah ada!");
    };
}