let excelData = [];
let chartInstances = [];

// Exclusiones fijas
const excludedQuestions = [
    "Marca temporal",
    "Puntuación",
    "NOMBRE COMPLETO",
    "Cargo que desempeñas",
    "Colegio" // no graficar
];

document.getElementById("fileInput").addEventListener("change", handleFile);
document.getElementById("colegioSelect").addEventListener("change", (e) => {
    renderCharts(e.target.value);
});

async function handleFile(event) {
    const file = event.target.files[0];
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    excelData = XLSX.utils.sheet_to_json(sheet);

    renderCharts("general"); // por defecto
}

function renderCharts(filter) {
    const chartsContainer = document.getElementById("chartsContainer");
    const resumenDiv = document.getElementById("resumen");
    const openQuestionsDiv = document.getElementById("openQuestions");

    chartsContainer.innerHTML = "";
    resumenDiv.innerHTML = "";
    openQuestionsDiv.innerHTML = "";

    chartInstances.forEach(chart => chart.destroy());
    chartInstances = [];

    // Filtrar datos
    let filteredData = excelData;
    if (filter !== "general") {
        filteredData = excelData.filter(
            row => (row.Colegio?.trim() || "").toLowerCase() === filter.toLowerCase()
        );
    }

    if (filteredData.length === 0) {
        resumenDiv.innerHTML = `<p style="color:red"><b>No hay datos para ${filter}</b></p>`;
        return;
    }

    // ----------------- Resumen -----------------
    const totalRespuestas = filteredData.length;
    const preguntas = Object.keys(excelData[0]).filter(key => !excludedQuestions.includes(key));
    const colegiosUnicos = [...new Set(excelData.map(row => row.Colegio))].filter(c => c);

    if (filter === "general") {
        resumenDiv.innerHTML = `
            <h2>Resumen General</h2>
            <p>📌 Total de respuestas: <b>${totalRespuestas}</b></p>
            <p>📌 Cantidad de preguntas: <b>${preguntas.length}</b></p>
            <p>📌 Colegios participantes: <b>${colegiosUnicos.length}</b></p>
        `;
    } else {
        resumenDiv.innerHTML = `
            <h2>${filter}</h2>
            <p>👥 Participantes: <b>${totalRespuestas}</b></p>
        `;
    }

    // ----------------- Gráficas y abiertas -----------------
    preguntas.forEach(question => {
        const sampleValue = filteredData[0][question];
        const isOpenQuestion = typeof sampleValue === "string" && sampleValue.split(" ").length > 5;

        if (isOpenQuestion) {
            // Procesar preguntas abiertas
            let allWords = [];
            filt
