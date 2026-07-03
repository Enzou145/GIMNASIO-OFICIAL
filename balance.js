// =============================================
// BALANCE.JS — Lógica de la sección de Balance
// =============================================

// 1. CONFIGURACIÓN SUPABASE
const supabaseUrl = 'https://mhipqrjxnyykrwfjquxy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaXBxcmp4bnl5a3J3ZmpxdXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzYwNzIsImV4cCI6MjA5MzkxMjA3Mn0.U8nEWlt2ARh7Sq0ZX_boxXQGgbkuopAJqLtJcegPh34';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 2. LEER GIMNASIO_ID DESDE LOCALSTORAGE
const GIMNASIO_ID = localStorage.getItem('gimnasio_id');

// 3. PROTECCIÓN DE LOGIN
if (!GIMNASIO_ID) {
    window.location.href = 'login.html';
}

// =============================================
// TEMA (dark / light / green)
// =============================================
const btnTema = document.getElementById('cambiar-tema');
const body = document.body;
const temas = ['dark', 'light', 'green'];
let temaActual = localStorage.getItem('tema') || 'dark';
aplicarTema(temaActual);

if (btnTema) {
    btnTema.addEventListener('click', () => {
        const index = temas.indexOf(temaActual);
        temaActual = temas[(index + 1) % temas.length];
        aplicarTema(temaActual);
        localStorage.setItem('tema', temaActual);

        // Actualizar gráficos al cambiar de tema si existen
        if (chartGastosInstance) chartGastosInstance.update();
        if (chartIngresosInstance) chartIngresosInstance.update();
    });
}

function aplicarTema(tema) {
    body.classList.remove('light', 'green');
    if (tema !== 'dark') {
        body.classList.add(tema);
    }
}

// =============================================
// SIDEBAR FOOTER: DATOS DEL USUARIO
// =============================================
async function cargarDatosUsuario() {
    const gymId = localStorage.getItem('gimnasio_id');
    if (!gymId) return;

    const { data, error } = await supabaseClient
        .from('gimnasios')
        .select('nombre')
        .eq('id', gymId)
        .single();

    if (data) {
        const nombreGym = data.nombre;
        const labelNombre = document.getElementById('sidebar-user-name');
        if (labelNombre) labelNombre.textContent = nombreGym;

        const inicialesElemento = document.getElementById('user-initials');
        if (inicialesElemento) {
            const partes = nombreGym.trim().split(' ');
            let iniciales = '';
            if (partes.length > 1) {
                iniciales = partes[0].charAt(0) + partes[1].charAt(0);
            } else {
                iniciales = partes[0].substring(0, 2);
            }
            inicialesElemento.textContent = iniciales.toUpperCase();
        }
    }
}
cargarDatosUsuario();

// =============================================
// CERRAR SESIÓN
// =============================================
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
        const confirmar = confirm('¿Estás seguro que deseas cerrar sesión?');
        if (confirmar) {
            await supabaseClient.auth.signOut();
            localStorage.clear();
            window.location.href = 'index.html';
        }
    });
}

// =============================================
// LÓGICA DE BALANCE
// =============================================

// ESTADO GLOBAL
let mesSeleccionado = new Date();
// Asegurar que es el primer día del mes a las 00:00:00 para cálculos correctos
mesSeleccionado.setDate(1);
mesSeleccionado.setHours(0, 0, 0, 0);

// Nombres de meses en español
const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const nombresMesesAbrev = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// Instancias de Chart.js
let chartGastosInstance = null;
let chartIngresosInstance = null;

// COLORES PARA GRÁFICOS
const coloresPlanes = ['#ef4444', '#f97316', '#eab308', '#06b6d4', '#8b5cf6', '#10b981'];
// Colores estáticos para categorías basados en gastos.js
const coloresCategorias = {
    'Alquiler': '#ef4444',
    'Profesores': '#f97316',
    'Luz': '#eab308',
    'Agua': '#06b6d4',
    'Limpieza': '#8b5cf6',
    'Mantenimiento': '#6b7280',
    'Marketing': '#ec4899',
    'Equipamiento': '#3b82f6',
    'Impuestos': '#10b981',
    'Otros': '#6b7280'
};

// INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    // Set footer date
    document.getElementById('footer-fecha').textContent = new Date().toLocaleDateString('es-AR', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    configurarNavegacionMes();
    actualizarVistaCompleta();
});

// UTILIDADES
function formatCurrency(monto) {
    return '$ ' + parseFloat(monto || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getRangoMes(fecha) {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const primerDia = new Date(año, mes, 1).toISOString();
    const ultimoDia = new Date(año, mes + 1, 0, 23, 59, 59, 999).toISOString();
    return { primerDia, ultimoDia };
}

// OBTENER FECHAS MES ANTERIOR
function getMesAnterior(fecha) {
    const prev = new Date(fecha);
    prev.setMonth(prev.getMonth() - 1);
    return prev;
}

// NAVEGACIÓN Y CHIPS
function configurarNavegacionMes() {
    document.getElementById('btn-mes-prev').addEventListener('click', () => {
        mesSeleccionado.setMonth(mesSeleccionado.getMonth() - 1);
        actualizarVistaCompleta();
    });

    document.getElementById('btn-mes-next').addEventListener('click', () => {
        mesSeleccionado.setMonth(mesSeleccionado.getMonth() + 1);
        actualizarVistaCompleta();
    });
}

function actualizarNavegacionUI() {
    const nombre = nombresMeses[mesSeleccionado.getMonth()];
    const año = mesSeleccionado.getFullYear();

    document.getElementById('label-mes-actual').textContent = `${nombre} ${año}`;
    document.getElementById('titulo-mes-resumen').textContent = `${nombre} ${año}`;
}

function actualizarChipsMeses() {
    const container = document.getElementById('chips-meses');
    container.innerHTML = '';

    // Mostramos los últimos 6 meses (incluyendo el actual si queremos, o centrado)
    // Para simplificar: el mes actual y 5 anteriores
    const meses = [];
    const fechaActual = new Date(); // El mes calendario real

    for (let i = 5; i >= 0; i--) {
        const d = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1);
        meses.push(d);
    }

    // Si mesSeleccionado es más nuevo que el actual o más viejo, lo añadimos si no está
    const selectedStr = `${mesSeleccionado.getFullYear()}-${mesSeleccionado.getMonth()}`;
    const found = meses.some(m => `${m.getFullYear()}-${m.getMonth()}` === selectedStr);

    if (!found) {
        meses.push(new Date(mesSeleccionado));
        meses.sort((a, b) => a - b);
    }

    meses.forEach(d => {
        const chip = document.createElement('div');
        chip.className = 'chip-mes';
        chip.textContent = nombresMesesAbrev[d.getMonth()];

        // Resaltar si es el seleccionado
        if (d.getFullYear() === mesSeleccionado.getFullYear() && d.getMonth() === mesSeleccionado.getMonth()) {
            chip.classList.add('activo');
        }

        chip.addEventListener('click', () => {
            mesSeleccionado = new Date(d);
            actualizarVistaCompleta();
        });

        container.appendChild(chip);
    });
}

// FUNCIÓN PRINCIPAL DE ACTUALIZACIÓN
async function actualizarVistaCompleta() {
    actualizarNavegacionUI();
    actualizarChipsMeses();

    await Promise.all([
        cargarResumenMes(mesSeleccionado),
        cargarGraficoGastosPorCategoria(mesSeleccionado),
        cargarGraficoIngresosPorPlan(mesSeleccionado),
        cargarTablaComparativa() // Carga los 6 meses hasta el mes seleccionado
    ]);
}

// =============================================
// QUERIES Y RENDERS
// =============================================

async function getIngresosMes(inicio, fin) {
    const { data, error } = await supabaseClient
        .from('pagos')
        .select('monto')
        .eq('gimnasio_id', GIMNASIO_ID)
        .gte('fecha_pago', inicio)
        .lte('fecha_pago', fin);

    if (error) { console.error('Error ingresos:', error); return 0; }
    return data.reduce((sum, pago) => sum + (pago.monto || 0), 0);
}

async function getGastosMes(inicio, fin) {
    const { data, error } = await supabaseClient
        .from('gastos')
        .select('monto')
        .eq('gimnasio_id', GIMNASIO_ID)
        .gte('fecha', inicio)
        .lte('fecha', fin);

    if (error) { console.error('Error gastos:', error); return 0; }
    return data.reduce((sum, gasto) => sum + (gasto.monto || 0), 0);
}

async function getSociosActivosMes() {
    // Socios activos actualmente (no históricamente, es un snapshot actual)
    // El usuario pide "count de membresias_socios con estado='Activa'"
    const { count, error } = await supabaseClient
        .from('membresias_socios')
        .select('*', { count: 'exact', head: true })
        .eq('gimnasio_id', GIMNASIO_ID)
        .eq('estado', 'Activa');

    if (error) { console.error('Error activos:', error); return 0; }
    return count || 0;
}

async function getAltasMes(inicio, fin) {
    const { count, error } = await supabaseClient
        .from('socios')
        .select('*', { count: 'exact', head: true })
        .eq('gimnasio_id', GIMNASIO_ID)
        .gte('creado_en', inicio)
        .lte('creado_en', fin);

    if (error) { console.error('Error altas:', error); return 0; }
    return count || 0;
}

async function getBajasMes(inicio, fin) {
    // Bajas: socios cuya membresía venció ese mes
    const { count, error } = await supabaseClient
        .from('membresias_socios')
        .select('*', { count: 'exact', head: true })
        .eq('gimnasio_id', GIMNASIO_ID)
        .eq('estado', 'Vencida')
        .gte('fecha_vencimiento', inicio)
        .lte('fecha_vencimiento', fin);

    if (error) { console.error('Error bajas:', error); return 0; }
    return count || 0;
}

function calcularPorcentaje(actual, anterior) {
    if (anterior === 0) return actual > 0 ? '+100%' : '0%';
    const diff = actual - anterior;
    const perc = (diff / anterior) * 100;
    const sign = perc > 0 ? '+' : '';
    return `${sign}${perc.toFixed(1)}% vs mes anterior`;
}

async function cargarResumenMes(fecha) {
    const { primerDia: inicioAct, ultimoDia: finAct } = getRangoMes(fecha);
    const mesAnterior = getMesAnterior(fecha);
    const { primerDia: inicioAnt, ultimoDia: finAnt } = getRangoMes(mesAnterior);

    // Ejecutar queries en paralelo
    const [ingresos, gastos, activos, altas, bajas, ingAnt, gasAnt, actAnt, altasAnt, bajasAnt] = await Promise.all([
        getIngresosMes(inicioAct, finAct),
        getGastosMes(inicioAct, finAct),
        getSociosActivosMes(), // Activos actuales (ignora fecha en este caso específico según lógica pedida)
        getAltasMes(inicioAct, finAct),
        getBajasMes(inicioAct, finAct),

        getIngresosMes(inicioAnt, finAnt),
        getGastosMes(inicioAnt, finAnt),
        getSociosActivosMes(), // Simplificación para demo, sería ideal un histórico si existiese
        getAltasMes(inicioAnt, finAnt),
        getBajasMes(inicioAnt, finAnt)
    ]);

    const neto = ingresos - gastos;

    // Actualizar UI
    document.getElementById('val-ingresos').textContent = formatCurrency(ingresos);
    document.getElementById('val-gastos').textContent = formatCurrency(gastos);
    document.getElementById('val-activos').textContent = activos;

    const elNeto = document.getElementById('val-ganancia');
    elNeto.textContent = formatCurrency(neto);
    elNeto.className = 'tarjeta-valor ganancia-valor ' + (neto >= 0 ? 'positivo' : 'negativo');

    const elNetoHeader = document.getElementById('val-ganancia-header');
    if (elNetoHeader) {
        elNetoHeader.textContent = formatCurrency(neto);
        elNetoHeader.className = 'ganancia-valor ' + (neto >= 0 ? 'positivo' : 'negativo');
    }

    // Subtextos comparativos
    const subIng = document.getElementById('sub-ingresos');
    subIng.textContent = calcularPorcentaje(ingresos, ingAnt);
    subIng.className = 'tarjeta-sub ' + (ingresos >= ingAnt ? 'sub-positivo' : 'sub-negativo');

    const subGas = document.getElementById('sub-gastos');
    subGas.textContent = calcularPorcentaje(gastos, gasAnt);
    // Para gastos, más es negativo visualmente
    subGas.className = 'tarjeta-sub ' + (gastos <= gasAnt ? 'sub-positivo' : 'sub-negativo');

    const subAct = document.getElementById('sub-activos');
    subAct.textContent = calcularPorcentaje(activos, actAnt); // Note: actAnt is same as activos in this simple demo
    subAct.className = 'tarjeta-sub sub-neutral';
}

// ---------------------------------------------
// GRÁFICOS
// ---------------------------------------------
function getTextColor() {
    return temaActual === 'light' ? '#111827' : '#f3f4f6';
}

async function cargarGraficoGastosPorCategoria(fecha) {
    const { primerDia, ultimoDia } = getRangoMes(fecha);

    const { data, error } = await supabaseClient
        .from('gastos')
        .select('monto, categoria')
        .eq('gimnasio_id', GIMNASIO_ID)
        .gte('fecha', primerDia)
        .lte('fecha', ultimoDia);

    if (error) { console.error('Error grafico gastos:', error); return; }

    const totalesPorCategoria = {};
    data.forEach(g => {
        const cat = g.categoria || 'Otros';
        totalesPorCategoria[cat] = (totalesPorCategoria[cat] || 0) + g.monto;
    });

    const labels = Object.keys(totalesPorCategoria);
    const values = Object.values(totalesPorCategoria);
    const bgColors = labels.map(l => coloresCategorias[l] || '#6b7280');

    if (chartGastosInstance) {
        chartGastosInstance.destroy();
    }

    const ctx = document.getElementById('chart-gastos').getContext('2d');

    if (labels.length === 0) {
        // Grafico vacío de relleno si no hay datos
        chartGastosInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Sin datos'], datasets: [{ data: [1], backgroundColor: ['#374151'] }] },
            options: { cutout: '75%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
        });
        document.getElementById('leyenda-gastos').innerHTML = '<p class="texto-secundario">No hay gastos este mes</p>';
        return;
    }

    chartGastosInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: bgColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            cutout: '70%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ' ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });

    // Construir leyenda
    const leyendaContainer = document.getElementById('leyenda-gastos');
    leyendaContainer.innerHTML = '';

    // Sort by value descending for legend
    const pares = labels.map((l, i) => ({ label: l, value: values[i], color: bgColors[i] }));
    pares.sort((a, b) => b.value - a.value);

    pares.forEach(item => {
        leyendaContainer.innerHTML += `
            <div class="leyenda-item">
                <div class="leyenda-left">
                    <div class="leyenda-color" style="background-color: ${item.color}"></div>
                    <span>${item.label}</span>
                </div>
                <div class="leyenda-monto">${formatCurrency(item.value)}</div>
            </div>
        `;
    });
}

async function cargarGraficoIngresosPorPlan(fecha) {
    const { primerDia, ultimoDia } = getRangoMes(fecha);

    // Join logic: Pagos -> membresias_socios -> planes
    const { data: pagosData, error: pagosError } = await supabaseClient
        .from('pagos')
        .select(`
            monto,
            membresias_socios (
                planes ( nombre )
            )
        `)
        .eq('gimnasio_id', GIMNASIO_ID)
        .gte('fecha_pago', primerDia)
        .lte('fecha_pago', ultimoDia);

    if (pagosError) { console.error('Error grafico ingresos:', pagosError); return; }

    const totalesPorPlan = {};
    pagosData.forEach(p => {
        let planNombre = 'Desconocido';
        try {
            planNombre = p.membresias_socios.planes.nombre;
        } catch (e) { }

        totalesPorPlan[planNombre] = (totalesPorPlan[planNombre] || 0) + p.monto;
    });

    const labels = Object.keys(totalesPorPlan);
    const values = Object.values(totalesPorPlan);
    const bgColors = labels.map((_, i) => coloresPlanes[i % coloresPlanes.length]);

    if (chartIngresosInstance) {
        chartIngresosInstance.destroy();
    }

    const ctx = document.getElementById('chart-ingresos').getContext('2d');

    if (labels.length === 0) {
        chartIngresosInstance = new Chart(ctx, {
            type: 'pie',
            data: { labels: ['Sin datos'], datasets: [{ data: [1], backgroundColor: ['#374151'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }
        });
        document.getElementById('leyenda-ingresos').innerHTML = '<p class="texto-secundario">No hay ingresos este mes</p>';
        return;
    }

    chartIngresosInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: bgColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ' ' + formatCurrency(context.raw);
                        }
                    }
                }
            }
        }
    });

    // Construir leyenda
    const leyendaContainer = document.getElementById('leyenda-ingresos');
    leyendaContainer.innerHTML = '';

    const pares = labels.map((l, i) => ({ label: l, value: values[i], color: bgColors[i] }));
    pares.sort((a, b) => b.value - a.value);

    pares.forEach(item => {
        leyendaContainer.innerHTML += `
            <div class="leyenda-item">
                <div class="leyenda-left">
                    <div class="leyenda-color" style="background-color: ${item.color}"></div>
                    <span>${item.label}</span>
                </div>
                <div class="leyenda-monto">${formatCurrency(item.value)}</div>
            </div>
        `;
    });
}

// ---------------------------------------------
// TABLA COMPARATIVA MENSUAL
// ---------------------------------------------
async function cargarTablaComparativa() {
    const tbody = document.getElementById('tabla-comparativa');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Cargando historial...</td></tr>';

    const promesas = [];
    const mesesInfo = [];

    for (let i = 0; i < 6; i++) {
        const d = new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth() - i, 1);
        mesesInfo.push(d);

        const { primerDia, ultimoDia } = getRangoMes(d);

        promesas.push(Promise.all([
            getIngresosMes(primerDia, ultimoDia),
            getGastosMes(primerDia, ultimoDia),
            getSociosActivosEnMes(primerDia, ultimoDia)
        ]));
    }

    const resultados = await Promise.all(promesas);

    tbody.innerHTML = '';

    const chartLabels = [];
    const chartData = [];

    for (let i = 0; i < 6; i++) {
        const d = mesesInfo[i];
        const [ing, gas, act] = resultados[i];
        const neto = ing - gas;

        const isActual = (i === 0);

        const tr = document.createElement('tr');
        if (isActual) tr.className = 'fila-actual';

        const nombreMes = nombresMeses[d.getMonth()] + ' ' + d.getFullYear();
        const nombreMesAbv = nombresMesesAbrev[d.getMonth()] + ' ' + d.getFullYear();

        // Agregar al principio para que queden cronológicos (más antiguo a más nuevo)
        chartLabels.unshift(nombreMesAbv);
        chartData.unshift(neto);

        tr.innerHTML = `
            <td>
                ${nombreMes}
                ${isActual ? ' <span class="badge-actual">Actual</span>' : ''}
            </td>
            <td class="text-green">${formatCurrency(ing)}</td>
            <td class="text-red">${formatCurrency(gas)}</td>
            <td style="font-weight: 700; color: ${neto >= 0 ? 'var(--estado-activo)' : 'var(--color-rojo)'}">
                ${formatCurrency(neto)}
            </td>
            <td>${act}</td>
        `;
        tbody.appendChild(tr);
    }

    renderChartGananciaHistorica(chartLabels.slice(-3), chartData.slice(-3));
}

let chartGananciaHistoricaInstance = null;

const customBarLinePlugin = {
    id: 'customBarLine',
    afterDatasetsDraw: (chart) => {
        const { ctx, chartArea: { left }, scales: { y } } = chart;
        chart.getDatasetMeta(0).data.forEach((datapoint) => {
            const barY = datapoint.y;
            const barX = datapoint.x;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(left, barY);
            ctx.lineTo(barX, barY);
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; // Más visible ahora
            ctx.setLineDash([2, 4]); // punteada
            ctx.stroke();
            ctx.restore();
        });
    }
};

function renderChartGananciaHistorica(labels, data) {
    const ctxElement = document.getElementById('chart-ganancia-historica');
    if (!ctxElement) return;

    if (chartGananciaHistoricaInstance) {
        chartGananciaHistoricaInstance.destroy();
    }

    const bgColors = data.map(v => v >= 0 ? '#10b981' : '#ef4444');

    chartGananciaHistoricaInstance = new Chart(ctxElement.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ganancia Neta',
                data: data,
                backgroundColor: bgColors,
                borderRadius: 4
            }]
        },
        plugins: [customBarLinePlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return ' ' + formatCurrency(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '$' + value.toLocaleString('es-AR');
                        },
                        color: '#9ca3af'
                    },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { display: false }
                }
            }
        }
    });
}

async function getSociosActivosEnMes(inicio, fin) {
    const { data, error } = await supabaseClient
        .from('pagos')
        .select('socio_id')
        .eq('gimnasio_id', GIMNASIO_ID)
        .gte('fecha_pago', inicio)
        .lte('fecha_pago', fin);

    if (error) { console.error('Error activos en mes:', error); return 0; }

    const unicos = new Set();
    data.forEach(p => {
        if (p.socio_id) unicos.add(p.socio_id);
    });
    return unicos.size;
}

// ---------------------------------------------
// DESCARGA PDF DEL RESUMEN
// ---------------------------------------------
function descargarPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const W = 210; // ancho A4
    let y = 15;

    // Leer datos del DOM (ya están cargados por JS)
    const mesTitulo = document.getElementById('titulo-mes-resumen')?.textContent?.trim() || 'Mes';
    const valIngresos = document.getElementById('val-ingresos')?.textContent?.trim() || '-';
    const valGastos   = document.getElementById('val-gastos')?.textContent?.trim()   || '-';
    const valGanancia = document.getElementById('val-ganancia-header')?.textContent?.trim() || '-';
    const valActivos  = document.getElementById('val-activos')?.textContent?.trim()  || '-';

    // ── ENCABEZADO ──────────────────────────────────────────
    pdf.setFillColor(30, 30, 40);
    pdf.rect(0, 0, W, 38, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(255, 255, 255);
    pdf.text('GYM CRONOS', 14, 15);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(180, 180, 180);
    pdf.text('BALANCE MENSUAL  ·  ' + mesTitulo.toUpperCase(), 14, 23);

    const hoy = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });
    pdf.text('Generado: ' + hoy, 14, 30);

    y = 48;

    // ── TARJETAS RESUMEN ─────────────────────────────────────
    const cards = [
        { label: 'INGRESOS',     valor: valIngresos, color: [16, 185, 129] },
        { label: 'GASTOS',       valor: valGastos,   color: [239, 68,  68]  },
        { label: 'GANANCIA NETA',valor: valGanancia, color: [99, 102, 241]  },
        { label: 'SOCIOS ACTIVOS',valor: valActivos, color: [234, 179, 8]   },
    ];

    const cardW = 42;
    const cardH = 22;
    const gap = 5;
    const startX = 14;

    cards.forEach((c, i) => {
        const x = startX + i * (cardW + gap);
        // fondo oscuro
        pdf.setFillColor(40, 40, 55);
        pdf.roundedRect(x, y, cardW, cardH, 3, 3, 'F');
        // borde de color
        pdf.setDrawColor(...c.color);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(x, y, cardW, cardH, 3, 3, 'S');
        // label
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6);
        pdf.setTextColor(...c.color);
        pdf.text(c.label, x + 3, y + 6);
        // valor
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(255, 255, 255);
        pdf.text(c.valor, x + 3, y + 16);
    });

    y += cardH + 12;

    // ── TABLA COMPARATIVA ────────────────────────────────────
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(220, 220, 220);
    pdf.text('COMPARATIVA MENSUAL', 14, y);
    y += 7;

    // Cabecera de tabla
    const cols = ['MES', 'INGRESOS', 'GASTOS', 'NETO', 'SOCIOS'];
    const colW = [50, 36, 36, 36, 24];
    let x = 14;

    pdf.setFillColor(50, 50, 65);
    pdf.rect(14, y, W - 28, 8, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 170);
    cols.forEach((col, i) => {
        pdf.text(col, x + 2, y + 5.5);
        x += colW[i];
    });
    y += 8;

    // Filas de la tabla
    const filas = document.querySelectorAll('#tabla-comparativa tr');
    filas.forEach((fila, idx) => {
        const celdas = fila.querySelectorAll('td');
        if (!celdas.length) return;

        const rowData = Array.from(celdas).map(td => td.textContent.replace('Actual', '').trim());
        const isActual = fila.classList.contains('fila-actual');

        if (isActual) {
            pdf.setFillColor(40, 40, 70);
        } else {
            pdf.setFillColor(idx % 2 === 0 ? 35 : 42, idx % 2 === 0 ? 35 : 42, idx % 2 === 0 ? 48 : 55);
        }
        pdf.rect(14, y, W - 28, 7, 'F');

        x = 14;
        pdf.setFont('helvetica', isActual ? 'bold' : 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(isActual ? 255 : 200, isActual ? 255 : 200, isActual ? 255 : 200);

        rowData.forEach((cell, i) => {
            let color = [200, 200, 200];
            if (i === 1) color = [16, 185, 129];   // ingresos verde
            if (i === 2) color = [239, 68, 68];     // gastos rojo
            if (i === 3) {
                const val = parseFloat(cell.replace(/[^0-9.,-]/g, '').replace(',', '.'));
                color = val >= 0 ? [16, 185, 129] : [239, 68, 68];
            }
            if (i === 0) color = [220, 220, 220];
            pdf.setTextColor(...color);
            pdf.text(cell, x + 2, y + 5);
            x += colW[i];
        });
        y += 7;
    });

    y += 8;

    // ── PIE DE PÁGINA ────────────────────────────────────────
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 120);
    pdf.text('GYM CRONOS · Balance del mes de ' + mesTitulo, 14, 287);
    pdf.text('Página 1', W - 25, 287);

    pdf.save('balance_' + mesTitulo.replace(/ /g, '_') + '.pdf');
}

// Listener del botón PDF
document.addEventListener('DOMContentLoaded', () => {
    const btnPdf = document.querySelector('.btn-descarga-pdf');
    if (btnPdf) {
        btnPdf.addEventListener('click', e => {
            e.preventDefault();
            descargarPDF();
        });
    }

    const btnImg = document.querySelector('.btn-descarga-img');
    if (btnImg) {
        btnImg.addEventListener('click', e => {
            e.preventDefault();
            descargarImagen();
        });
    }
});

// ---------------------------------------------
// DESCARGA IMAGEN DEL RESUMEN
// ---------------------------------------------
function descargarImagen() {
    const mesTitulo = document.getElementById('titulo-mes-resumen')?.textContent?.trim() || 'Mes';
    const valIngresos = document.getElementById('val-ingresos')?.textContent?.trim() || '-';
    const valGastos   = document.getElementById('val-gastos')?.textContent?.trim()   || '-';
    const valGanancia = document.getElementById('val-ganancia-header')?.textContent?.trim() || '-';
    const valActivos  = document.getElementById('val-activos')?.textContent?.trim()  || '-';

    const W = 900;
    const H = 600;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // ── FONDO ──────────────────────────────────
    ctx.fillStyle = '#0f0f1a';
    ctx.fillRect(0, 0, W, H);

    // ── ENCABEZADO ──────────────────────────────
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, 90);

    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('GYM CRONOS', 30, 42);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('BALANCE MENSUAL  ·  ' + mesTitulo.toUpperCase(), 30, 65);

    const hoy = new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' });
    ctx.fillText('Generado: ' + hoy, 30, 82);

    // ── TARJETAS ────────────────────────────────
    const cards = [
        { label: 'INGRESOS',      valor: valIngresos, color: '#10b981' },
        { label: 'GASTOS',        valor: valGastos,   color: '#ef4444' },
        { label: 'GANANCIA NETA', valor: valGanancia, color: '#6366f1' },
        { label: 'SOCIOS ACTIVOS',valor: valActivos,  color: '#eab308' },
    ];

    const cardW = 190;
    const cardH = 90;
    const cardGap = 20;
    const startX = 30;
    const cardY = 110;

    cards.forEach((c, i) => {
        const x = startX + i * (cardW + cardGap);
        // Fondo tarjeta
        ctx.fillStyle = '#1e1e30';
        roundRect(ctx, x, cardY, cardW, cardH, 10);
        ctx.fill();
        // Borde de color
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        roundRect(ctx, x, cardY, cardW, cardH, 10);
        ctx.stroke();
        // Label
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = c.color;
        ctx.fillText(c.label, x + 14, cardY + 26);
        // Valor
        ctx.font = 'bold 26px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(c.valor, x + 14, cardY + 64);
    });

    // ── TABLA COMPARATIVA ───────────────────────
    const tableY = 230;
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText('COMPARATIVA MENSUAL', 30, tableY);

    const cols = ['MES', 'INGRESOS', 'GASTOS', 'NETO', 'SOCIOS'];
    const colW = [220, 140, 140, 140, 80];
    const rowH = 38;

    // Cabecera
    ctx.fillStyle = '#2a2a40';
    ctx.fillRect(30, tableY + 12, W - 60, rowH);

    let tx = 30;
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#9ca3af';
    cols.forEach((col, i) => {
        ctx.fillText(col, tx + 10, tableY + 12 + rowH / 2 + 5);
        tx += colW[i];
    });

    // Filas
    const filas = document.querySelectorAll('#tabla-comparativa tr');
    filas.forEach((fila, idx) => {
        const celdas = fila.querySelectorAll('td');
        if (!celdas.length) return;
        const rowData = Array.from(celdas).map(td => td.textContent.replace('Actual', '').trim());
        const isActual = fila.classList.contains('fila-actual');
        const ry = tableY + 12 + rowH + idx * rowH;

        ctx.fillStyle = isActual ? '#2a2a50' : (idx % 2 === 0 ? '#18182a' : '#1e1e30');
        ctx.fillRect(30, ry, W - 60, rowH);

        tx = 30;
        rowData.forEach((cell, i) => {
            let color = '#e5e7eb';
            if (i === 1) color = '#10b981';
            if (i === 2) color = '#ef4444';
            if (i === 3) {
                const val = parseFloat(cell.replace(/[^0-9.,-]/g, '').replace(',', '.'));
                color = val >= 0 ? '#10b981' : '#ef4444';
            }
            ctx.font = isActual && i === 0 ? 'bold 13px sans-serif' : '13px sans-serif';
            ctx.fillStyle = color;
            ctx.fillText(cell, tx + 10, ry + rowH / 2 + 5);
            tx += colW[i];
        });
    });

    // ── PIE ─────────────────────────────────────
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#4b5563';
    ctx.fillText('GYM CRONOS · Balance del mes de ' + mesTitulo, 30, H - 15);

    // Descargar
    const link = document.createElement('a');
    link.download = 'balance_' + mesTitulo.replace(/ /g, '_') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Helper: rectángulo con bordes redondeados en canvas
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}
