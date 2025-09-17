const fileInput = document.getElementById("fileInput");
const viewSelect = document.getElementById("viewSelect");
const chartsContainer = document.getElementById("chartsContainer");

let data = [];
let colegios = [];
let preguntas = [];

fileInput.addEventListener("change", handleFile);

// Leer archivo Excel
function handleFile(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const dataExcel = new Uint8Array(event.target.result);
    const workbook = XLSX.read(dataExcel, { type: "array" });

    // Tomar la primera hoja
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(sheet);

    // Identificar preguntas y colegios
    if (data.length > 0) {
      preguntas = Object.keys(data[0]).filter(k => k.toLowerCase() !== "colegio");
      colegios = [...new Set(data.map(d => d.Colegio))];

      // Limpiar y volver a llenar selector
      viewSelect.innerHTML = `<option value="general">Información General</option>`;
      colegios.forEach(c => {
        const option = document.createElement("option");
        option.value = c;
        option.textContent = c;
        viewSelect.appendChild(option);
      });

      renderCharts("general");
    }
  };

  reader.readAsArrayBuffer(file);
}

viewSelect.addEventListener("change", () => {
  renderCharts(viewSelect.value);
});

// Renderizar gráficos
function renderCharts(vista) {
  chartsContainer.innerHTML = "";

  preguntas.forEach(pregunta => {
    const chartCard = document.createElement("div");
    chartCard.className = "chart-card";
    const title = document.createElement("h3");
    title.textContent = pregunta;
    const canvas = document.createElement("canvas");
    chartCard.appendChild(title);
    chartCard.appendChild(canvas);
    chartsContainer.appendChild(chartCard);

    let datosFiltrados = data;

    if (vista !== "general") {
      datosFiltrados = data.filter(d => d.Colegio === vista);
    }

    // Contar respuestas
    const conteo = {};
    datosFiltrados.forEach(d => {
      const respuesta = d[pregunta];
      conteo[respuesta] = (conteo[respuesta] || 0) + 1;
    });

    new Chart(canvas, {
      type: "bar",
      data: {
        labels: Object.keys(conteo),
        datasets: [{
          label: `Respuestas`,
          data: Object.values(conteo),
          backgroundColor: "#4e79a7"
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  });
}
