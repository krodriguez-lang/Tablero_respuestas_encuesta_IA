let excelData = [];
let chartInstances = [];

document.getElementById("fileInput").addEventListener("change", handleFile);

async function handleFile(event) {
    const file = event.target.files[0];
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);

    // Tomamos la primera hoja
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    excelData = XLSX.utils.sheet_to_json(sheet);

    // Llenar el desplegable de colegios
    fillSelectOptions();

    // Mostrar datos generales por defecto
    renderCharts("general");
}

// Llenar la lista desplegable
function fillSelectOptions() {
    const colegioSelect = document.getElementById("colegioSelect");
    const colegios = [...new Set(excelData.map(row => row.Colegio))].filter(c => c);

    colegios.forEach(colegio => {
        const option = document.createElement("option");
        option.value = colegio;
        option.textContent = colegio;
        colegioSelect.appendChild(option);
    });

    colegioSelect.addEventListener("change", (e) => {
        renderCharts(e.target.value);
    });
}

// Renderizar gráficos
function renderCharts(filter) {
    const chartsContainer = document.getElementById("chartsContainer");
    chartsContainer.innerHTML = ""; // limpiar gráficos previos

    // Destruir instancias anteriores de Chart.js
    chartInstances.forEach(chart => chart.destroy());
    chartInstances = [];

    // Filtrar los datos según la selección
    let filteredData = excelData;
    if (filter !== "general") {
        filteredData = excelData.filter(row => row.Colegio === filter);
    }

    const keys = Object.keys(filteredData[0]).filter(
        key => !["Marca temporal", "Puntuación", "Nombre completo", "Cargo", "Colegio"].includes(key)
    );

    keys.forEach((question, index) => {
        const counts = {};
        filteredData.forEach(row => {
            const value = row[question] || "No responde";
            counts[value] = (counts[value] || 0) + 1;
        });

        const labels = Object.keys(counts);
        const values = Object.values(counts);

        // Crear contenedor de la gráfica
        const chartDiv = document.createElement("div");
        chartDiv.className = "chart-item";

        const canvas = document.createElement("canvas");
        chartDiv.appendChild(canvas);
        chartsContainer.appendChild(chartDiv);

        const chart = new Chart(canvas, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: question,
                    data: values,
                    backgroundColor: "rgba(56, 89, 136, 0.7)"
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: question
                    }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        chartInstances.push(chart);
    });
}
