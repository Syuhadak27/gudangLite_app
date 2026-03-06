const DB_NAME = "GudangDB";
const DB_VERSION = 1;
let db;

const initDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e) => {
            db = e.target.result;
            // Tabel Inventory. UNIX ID = NamaBarang_Supplier
            if (!db.objectStoreNames.contains('inventory')) {
                const invStore = db.createObjectStore('inventory', { keyPath: 'id' });
                invStore.createIndex('nama', 'nama', { unique: false });
                invStore.createIndex('supplier', 'supplier', { unique: false });
            }
            // Tabel Transaksi
            if (!db.objectStoreNames.contains('transaksi')) {
                const txStore = db.createObjectStore('transaksi', { keyPath: 'tx_id', autoIncrement: true });
                txStore.createIndex('inv_id', 'inv_id', { unique: false });
                txStore.createIndex('tipe', 'tipe', { unique: false }); // 'masuk' atau 'keluar'
            }
        };

        request.onsuccess = (e) => {
            db = e.target.result;
            resolve(db);
        };
        request.onerror = (e) => reject(e.target.error);
    });
};

const dbInsertBulk = async (storeName, dataArray, onProgress) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        
        let i = 0;
        const putNext = () => {
            if (i < dataArray.length) {
                store.put(dataArray[i]);
                i++;
                if (i % 100 === 0 && onProgress) onProgress((i / dataArray.length) * 100);
                putNext(); // Recursive push untuk mencegah call stack error
            }
        };
        putNext();

        transaction.oncomplete = () => {
            if (onProgress) onProgress(100);
            resolve();
        };
        transaction.onerror = (e) => reject(e.target.error);
    });
};

const dbGetAll = (storeName) => {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const dbClear = (storeName) => {
    return new Promise((resolve, reject) => {
        const request = db.transaction([storeName], "readwrite").objectStore(storeName).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject();
    });
};