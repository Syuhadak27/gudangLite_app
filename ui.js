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
    if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usageKB = (estimate.usage / 1024).toFixed(2);
        const usageMB = (estimate.usage / (1024 * 1024)).toFixed(2);
        const display = estimate.usage > 1024 * 1024 ? `${usageMB} MB` : `${usageKB} KB`;
        document.getElementById('db-size').innerText = display;
    }
};