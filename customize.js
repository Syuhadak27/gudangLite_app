/**
 * customize.js - Modul untuk UI & Analytics Tambahan
 */

const DatabaseAnalytics = {
    // Menghitung estimasi ukuran database dalam format string (B, KB, atau MB)
    async getDatabaseSize() {
        if (!window.indexedDB || !db) return "0 B";

        let totalSize = 0;
        const stores = ["inventory", "transaksi"];
        
        for (const storeName of stores) {
            // Tambahkan pengecekan agar tidak error jika store belum ada
            if (!db.objectStoreNames.contains(storeName)) continue;

            const tx = db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const all = await new Promise((resolve) => {
                store.getAll().onsuccess = (e) => resolve(e.target.result);
            });

            // Estimasi ukuran: JSON stringify + size per karakter
            const jsonString = JSON.stringify(all);
            totalSize += new Blob([jsonString]).size;
        }

        // Konversi ke satuan yang sesuai
        if (totalSize < 1024) {
            //return totalSize + " B"; 
            return "0";
        } else if (totalSize < 1024 * 1024) {
            return (totalSize / 1024).toFixed(1) + " KB";
        } else {
            return (totalSize / (1024 * 1024)).toFixed(2) + " MB";
        }
    },

    // Menampilkan ke Sidebar
    async updateSidebarIndicator() {
        const sizeString = await this.getDatabaseSize(); // Sudah dalam bentuk "10 KB" atau "1 MB"
        const indicator = document.getElementById('dbSizeIndicator');
        
        if (indicator) {
            // Hapus tambahan string "MB" karena sudah ada di sizeString
            indicator.innerText = sizeString; 
        }
    }
};