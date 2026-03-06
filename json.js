// --- IMPORT / EXPORT ---
async function importJSON() {
    const file = document.getElementById('importFile').files[0];
    if (!file) return alert("Pilih file!");

    const reader = new FileReader();
    reader.onload = async (e) => {
        const data = JSON.parse(e.target.result);
        const total = data.length;
        document.getElementById('progressContainer').classList.remove('hidden');
        
        const tx = db.transaction("inventory", "readwrite");
        const store = tx.objectStore("inventory");

        for (let i = 0; i < total; i++) {
            const item = data[i];
            // Bersihkan harga (hapus text/huruf)
            let harga = String(item[4]).replace(/[^0-9]/g, '');
            
            const obj = {
                id: `${item[0]}-${item[1]}`, // Unique Key
                nama: item[0],
                supplier: item[1],
                stok: parseInt(item[2]) || 0,
                barcode: item[3],
                harga: parseInt(harga) || 0
            };
            store.put(obj);

            if (i % 100 === 0) { // Update progress setiap 100 data
                let progress = Math.round((i / total) * 100);
                document.getElementById('progressBar').style.width = progress + "%";
            }
        }
        
        tx.oncomplete = () => {
            document.getElementById('progressContainer').classList.add('hidden');
            showSuccess();
            loadInventory();
        };
    };
    reader.readAsText(file);
}

async function exportJSON() {
    const tx = db.transaction("inventory", "readonly");
    const store = tx.objectStore("inventory");
    const all = await new Promise(res => {
        store.getAll().onsuccess = (e) => res(e.target.result);
    });

    const exportData = all.map(i => [i.nama, i.supplier, i.stok, i.barcode, i.harga]);
    const blob = new Blob([JSON.stringify(exportData)], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_gudang_${Date.now()}.json`;
    a.click();
}
