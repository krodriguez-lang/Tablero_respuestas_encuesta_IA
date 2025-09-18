let excelData = [];
let chartInstances = [];

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

    renderCharts("general"); // mostrar general por defecto
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

    let filteredData = excelData;
    if (filter !== "general") {
        filteredData = excelData.filter(row => row.Colegio?.trim() === filter);
    }

    // ----------------- Resumen -----------------
    const totalRespuestas = filteredData.length;
    const preguntas = Object.keys(excelData[0]).filter(
        key => !["Marca temporal", "Puntuación", "NOMBRE COMPLETO", "Cargo que desempeñas", "Colegio"].includes(key)
    );
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

    // ----------------- Gráficas -----------------
    preguntas.forEach(question => {
        const sampleValue = filteredData[0][question];
        const isOpenQuestion = typeof sampleValue === "string" && sampleValue.split(" ").length > 5;

        if (isOpenQuestion) {
            // Procesar preguntas abiertas
            let allWords = [];
            filteredData.forEach(row => {
                if (row[question]) {
                    allWords.push(...row[question].toLowerCase().split(/\s+/));
                }
            });

            let wordCounts = {};
            allWords.forEach(word => {
                if (word.length > 3) { // evitar palabras cortas
                    wordCounts[word] = (wordCounts[word] || 0) + 1;
                }
            });

            let sortedWords = Object.entries(wordCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10);

            const div = document.createElement("div");
            div.className = "open-question";
            div.innerHTML = `
                <h3>${question}</h3>
                <p><b>Palabras más repetidas:</b></p>
                <ul>${sortedWords.map(w => `<li>${w[0]} (${w[1]})</li>`).join("")}</ul>
            `;
            openQuestionsDiv.appendChild(div);

        } else {
            // Procesar preguntas cerradas (con gráficas)
            const counts = {};
            filteredData.forEach(row => {
                const value = row[question] || "No responde";
                counts[value] = (counts[value] || 0) + 1;
            });

            const labels = Object.keys(counts);
            const values = Object.values(counts);

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
                        title: { display: true, text: question }
                    },
                    scales: { y: { beginAtZero: true } }
                }
            });

            chartInstances.push(chart);
        }
    });
}
