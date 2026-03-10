// Toggle Sidebar
document.getElementById('toggle-sidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('hidden');
});

// Modal System
const showModal = (contentHTML) => {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-content').innerHTML = contentHTML;
    overlay.classList.add('active');
};
const closeModal = () => {
    document.getElementById('modal-overlay').classList.remove('active');
};

const showSuccessModal = (message) => {
    showModal(`
        <div class="modal-success-icon">✔</div>
        <h3>Berhasil</h3>
        <p>${message}</p>
        <button class="btn btn-primary mt-2" onclick="closeModal()">Tutup</button>
    `);
};

// Update DB Size dynamically
const updateDbSize = async () => {
    // Sesuaikan ID dengan HTML kamu yaitu "db-size"
    const display = document.getElementById('db-size');
    if (!display) return; 

    try {
        // Mengambil data untuk estimasi ukuran string
        const invData = await dbGetAll('inventory');
        const txData = await dbGetAll('transaksi');
        
        // Menghitung ukuran karakter sebagai representasi Bytes
        const totalString = JSON.stringify(invData) + JSON.stringify(txData);
        const bytes = new Blob([totalString]).size;
        
        if (bytes < 1024) {
            //display.innerText = `${bytes} B`;
            display.innerText = `😌`;
        } else {
            // Mengubah ke KB dengan 2 angka di belakang koma
            display.innerText = `${(bytes / 1024).toFixed(2)} KB`;
        }
    } catch (err) {
        console.error("Gagal update size:", err);
    }
};