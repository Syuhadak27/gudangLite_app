// Routing Sederhana
document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Hapus active class
        document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Set active class ke target
        e.target.classList.add('active');
        const targetId = e.target.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
        
        // Update Title
        document.getElementById('page-title').innerText = e.target.innerText;

        // Di dalam link.addEventListener('click', ...
        if(targetId === 'dashboard') refreshDashboardStats();
        if(targetId === 'inventory') loadInventory();
        if(targetId === 'transaksi') loadTransaksi();
        if(targetId === 'order') loadOrderData();
        
        updateDbSize();
    });
});

// Saat aplikasi pertama kali dibuka
window.onload = async () => {
    try {
        await initDB();
        updateDbSize();
        refreshDashboardStats();
    } catch (error) {
        console.error("Gagal inisialisasi IndexedDB", error);
    }
};