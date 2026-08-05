import envConfig from './env-config.js';

const API = envConfig.API_URL;

// ── Cargar categorías al inicio ─────────────────────
async function cargarCategorias() {
    try {
        const res = await fetch(`${API}/categorias`);
        const data = await res.json();
        const select = document.getElementById('filtroCategoria');
        data.categorias.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.nombre || cat; // Ajuste para compatibilidad con backend
            opt.textContent = cat.nombre || cat;
            select.appendChild(opt);
        });
    } catch (e) {
        console.warn('No se pudieron cargar categorías:', e);
    }
}

// ── Clasificar ───────────────────────────────────────
document.getElementById('formClasificar').addEventListener('submit', async (e) => {
    e.preventDefault();
    const titulo = document.getElementById('inputTitulo').value.trim();
    const texto = document.getElementById('inputTexto').value.trim();
    const resultadoDiv = document.getElementById('resultado');

    if (!titulo || !texto) return;

    resultadoDiv.className = 'hidden';
    resultadoDiv.innerHTML = '<p class="text-gray-500">Clasificando...</p>';
    resultadoDiv.className = 'mt-6 p-4 rounded-lg border fade-in bg-gray-50';

    try {
        const res = await fetch(`${API}/contenido`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo, texto }),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Error del servidor');
        }

        const data = await res.json();
        mostrarResultado(data);
        document.getElementById('inputTitulo').value = '';
        document.getElementById('inputTexto').value = '';
        cargarHistorial();

    } catch (err) {
        resultadoDiv.innerHTML = `<p class="text-red-600">❌ ${err.message}</p>`;
        resultadoDiv.className = 'mt-6 p-4 rounded-lg border fade-in bg-red-50 border-red-200';
    }
});

function mostrarResultado(data) {
    const div = document.getElementById('resultado');
    const badges = data.informacion_adicional
        .map(t => `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">${t}</span>`)
        .join('');

    const prob = (data.probabilidad * 100).toFixed(1);

    div.innerHTML = `
        <div class="flex items-center justify-between mb-3">
            <span class="text-lg font-bold">${data.categoria}</span>
            <span class="text-sm text-gray-500">${prob}% confianza</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div class="bg-blue-600 h-2 rounded-full" style="width: ${prob}%"></div>
        </div>
        <div class="flex flex-wrap gap-1">${badges}</div>
    `;
    div.className = 'mt-6 p-4 rounded-lg border fade-in bg-white border-blue-200';
}

// ── Historial ────────────────────────────────────────
async function cargarHistorial() {
    const categoria = document.getElementById('filtroCategoria').value;
    let url = `${API}/contenidos?limite=50`; // URL correcta del backend, límite amplio sin paginación
    if (categoria) url += `&categoria=${encodeURIComponent(categoria)}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        renderizarHistorial(data);
    } catch (e) {
        document.getElementById('historial').innerHTML =
            '<p class="text-red-500">Error al cargar historial. ¿La API está corriendo?</p>';
    }
}

function renderizarHistorial(data) {
    const container = document.getElementById('historial');

    if (data.items.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-sm">No hay clasificaciones aún.</p>';
        return;
    }

    container.innerHTML = data.items.map(item => {
        const prob = (item.probabilidad * 100).toFixed(1);
        // Ajuste: usar informacion_adicional en lugar de terminos
        const terminos = (item.informacion_adicional || []).map(t =>
            `<span class="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">${t}</span>`
        ).join(' ');
        return `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div class="flex items-center justify-between mb-1">
                    <span class="font-semibold text-gray-800">${item.titulo}</span>
                    <span class="text-xs text-gray-400">${item.creado_en}</span>
                </div>
                <p class="text-sm text-gray-500 truncate">${item.texto}</p>
                <div class="flex items-center gap-3 mt-2">
                    <span class="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded">${item.categoria}</span>
                    <span class="text-xs text-gray-400">${prob}%</span>
                    <div class="flex flex-wrap gap-0.5 ml-1">${terminos}</div>
                </div>
            </div>
        `;
    }).join('');
}

// ── Filtro ───────────────────────────────────────────
document.getElementById('btnFiltrar').addEventListener('click', () => cargarHistorial());

// ── Init ─────────────────────────────────────────────
cargarCategorias();
cargarHistorial();
