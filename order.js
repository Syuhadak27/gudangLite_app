const loadOrderData = async () => {
    const data = await dbGetAll('inventory');
    const grouped = {};

    data.forEach(item => {
        // Group by nama
        if (!grouped[item.nama]) {
            grouped[item.nama] = { nama: item.nama, total_stok: 0, sups: [] };
        }
        grouped[item.nama].total_stok += item.stok;
        // Menghindari duplikat supplier dalam array
        if (!grouped[item.nama].sups.includes(item.supplier)) {
            grouped[item.nama].sups.push(item.supplier);
        }
    });

    renderOrderTable(Object.values(grouped));
};

const renderOrderTable = (groupedData) => {
    const tbody = document.getElementById('tbody-order');
    tbody.innerHTML = '';
    
    const keyword = document.getElementById('search-order').value.toLowerCase();

    // Filter hanya berdasarkan nama barang
    const filtered = groupedData.filter(item => {
        return item.nama.toLowerCase().includes(keyword);
    });

    filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.nama}</td>
            <td><b>${item.total_stok}</b></td>
            <td><small>${item.sups.join(', ')}</small></td>
        `;
        tbody.appendChild(tr);
    });
};

// Hanya tersisa event listener untuk search bar
document.getElementById('search-order').addEventListener('input', () => loadOrderData());