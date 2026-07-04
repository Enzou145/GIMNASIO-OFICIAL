// =============================================
// GASTOS.JS — Lógica de la sección de Gastos
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
// DATOS DE CATEGORÍAS
// =============================================
const categoriasData = [
    { id: 'Alquiler', nombre: 'Alquiler', color: '#ef4444', icon: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>' },
    { id: 'Profesores', nombre: 'Profesores', color: '#f97316', icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
    { id: 'Luz', nombre: 'Luz', color: '#eab308', icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
    { id: 'Agua', nombre: 'Agua', color: '#06b6d4', icon: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>' },
    { id: 'Limpieza', nombre: 'Limpieza', color: '#8b5cf6', icon: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' },
    { id: 'Mantenimiento', nombre: 'Mantenimiento', color: '#6b7280', icon: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>' },
    { id: 'Marketing', nombre: 'Marketing', color: '#ec4899', icon: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>' },
    { id: 'Equipamiento', nombre: 'Equipamiento', color: '#3b82f6', icon: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>' },
    { id: 'Impuestos', nombre: 'Impuestos', color: '#10b981', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' },
    { id: 'Otros', nombre: 'Otros', color: '#6b7280', icon: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' }
];

function getCategoriaData(id) {
    return categoriasData.find(c => c.id === id) || categoriasData[categoriasData.length - 1];
}

// =============================================
// ESTADO LOCAL DE GASTOS
// =============================================
let gastosLocales = []; // Array de objetos { idSupabase, tempId, categoria, nota, monto }
let filaAEliminar = null; // Guardar referencia a la fila que se intenta eliminar

// =============================================
// INICIALIZACIÓN
// =============================================
function inicializarPágina() {
    renderizarChips();
    cargarResumen();
    cargarGastosSupabase();
}

// =============================================
// 1. RENDERIZAR CHIPS "AGREGAR RÁPIDO"
// =============================================
function renderizarChips() {
    const container = document.getElementById('chips-categorias');
    if (!container) return;

    container.innerHTML = '';
    categoriasData.forEach(cat => {
        const chip = document.createElement('div');
        chip.className = 'chip-categoria';
        chip.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="${cat.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${cat.icon}
            </svg>
            ${cat.nombre}
            <span class="chip-plus">+</span>
        `;
        chip.addEventListener('click', () => agregarFilaGasto(cat.id));
        container.appendChild(chip);
    });
}

// =============================================
// 2. AGREGAR FILA DE GASTO
// =============================================
function agregarFilaGasto(categoriaId, datosExistentes = null) {
    const container = document.getElementById('lista-gastos');

    // Si estaba mostrando "Cargando..." o "Vacio", limpiar
    if (container.querySelector('.gastos-loading') || container.querySelector('.gastos-empty')) {
        container.innerHTML = '';
    }

    const catData = getCategoriaData(categoriaId);
    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

    const gastoObj = {
        idSupabase: datosExistentes ? datosExistentes.id : null,
        tempId: tempId,
        categoria: categoriaId,
        nota: datosExistentes ? (datosExistentes.descripcion === categoriaId ? '' : datosExistentes.descripcion) : '',
        monto: datosExistentes ? datosExistentes.monto : 0
    };

    gastosLocales.unshift(gastoObj); // Agrega

    // Utilities para el monto
    function parseMonto(str) {
        if (!str) return 0;
        return parseInt(str.toString().replace(/\./g, ""), 10) || 0;
    }

    function formatMonto(num) {
        if (!num) return '';
        // Bulletproof thousand separator formatting
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    let montoInicial = gastoObj.monto > 0 ? formatMonto(gastoObj.monto) : "";

    const fila = document.createElement('div');
    fila.className = 'fila-gasto';
    fila.id = 'fila-' + tempId;
    if (gastoObj.idSupabase) fila.classList.add('guardado');

    fila.innerHTML = `
        <div class="fila-icono" style="color: ${catData.color}">
            <svg viewBox="0 0 24 24" fill="none" stroke="${catData.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${catData.icon}
            </svg>
        </div>
        <div class="fila-info">
            <div class="fila-categoria">${catData.nombre}</div>
            <input type="text" class="fila-input-nota" placeholder="Nota (opcional)" value="${gastoObj.nota}">
        </div>
        <div class="fila-monto-container">
            <span>$</span>
            <input type="text" class="fila-input-monto" placeholder="0" value="${montoInicial}">
        </div>
        <button class="btn-eliminar-fila" title="Eliminar">&times;</button>
    `;

    // Eventos
    const inputNota = fila.querySelector('.fila-input-nota');
    const inputMonto = fila.querySelector('.fila-input-monto');
    const btnEliminar = fila.querySelector('.btn-eliminar-fila');

    // Formatear en vivo mientras escribe
    inputMonto.addEventListener('input', (e) => {
        let cursorPosition = e.target.selectionStart;
        let originalLength = e.target.value.length;
        
        let originalValue = e.target.value;
        let num = parseMonto(originalValue);
        
        if (num === 0 && originalValue.replace(/\D/g, "") === "") {
                e.target.value = '';
                gastoObj.monto = 0;
        } else {
                e.target.value = formatMonto(num);
                gastoObj.monto = num;
        }
        
        // Mantener el cursor más o menos en el lugar correcto
        let newLength = e.target.value.length;
        cursorPosition = cursorPosition + (newLength - originalLength);
        e.target.setSelectionRange(cursorPosition, cursorPosition);
        
        actualizarFooterYTotal();
    });

    const triggerSave = () => {
        gastoObj.nota = inputNota.value;
        const nuevoMonto = parseMonto(inputMonto.value) || 0;

        // Solo guardar si hay monto > 0 y hubo cambios o es nuevo con monto
        if (nuevoMonto > 0) {
            gastoObj.monto = nuevoMonto;
            guardarEnSupabase(gastoObj, fila);
        } else {
            gastoObj.monto = 0;
            actualizarFooterYTotal();
        }
    };

    inputNota.addEventListener('change', triggerSave);
    inputMonto.addEventListener('change', triggerSave);



    btnEliminar.addEventListener('click', () => confirmarEliminar(gastoObj, fila));

    // Agregar al DOM al principio
    container.prepend(fila);
    actualizarFooterYTotal();

    // Si es nuevo (no vino de Supabase), hacer focus en el monto
    if (!datosExistentes) {
        inputMonto.focus();
    }
}

// =============================================
// 3. GUARDAR EN SUPABASE AUTOMÁTICO
// =============================================
async function guardarEnSupabase(gastoObj, filaElement) {
    if (!GIMNASIO_ID || gastoObj.monto <= 0) return;

    filaElement.classList.add('guardando');

    try {
        const fechaActual = new Date().toISOString().split('T')[0];
        const descFinal = gastoObj.nota.trim() !== '' ? gastoObj.nota.trim() : gastoObj.categoria;

        const payload = {
            gimnasio_id: GIMNASIO_ID,
            descripcion: descFinal,
            monto: gastoObj.monto,
            categoria: gastoObj.categoria,
            fecha: fechaActual
        };

        if (gastoObj.idSupabase) {
            // UPDATE
            const { error } = await supabaseClient
                .from('gastos')
                .update(payload)
                .eq('id', gastoObj.idSupabase);

            if (error) throw error;
        } else {
            // INSERT
            const { data, error } = await supabaseClient
                .from('gastos')
                .insert(payload)
                .select()
                .single();

            if (error) throw error;
            gastoObj.idSupabase = data.id; // Guardar el ID real
        }

        filaElement.classList.remove('guardando');
        filaElement.classList.add('guardado');

        // Remover clase guardado después de un rato para efecto visual
        setTimeout(() => filaElement.classList.remove('guardado'), 2000);

        // Actualizar resumen
        cargarResumen();

    } catch (err) {
        console.error('Error al guardar gasto:', err);
        filaElement.classList.remove('guardando');
        alert('Error al guardar el gasto. Revisá tu conexión.');
    }
}

// =============================================
// 4. ELIMINAR FILA
// =============================================
function confirmarEliminar(gastoObj, filaElement) {
    if (gastoObj.monto > 0 || gastoObj.nota.trim() !== '') {
        // Mostrar Modal
        filaAEliminar = { obj: gastoObj, el: filaElement };
        const catData = getCategoriaData(gastoObj.categoria);

        document.getElementById('eliminar-categoria').textContent = catData.nombre;
        document.getElementById('eliminar-monto').textContent = `$ ${Number(gastoObj.monto).toLocaleString('es-AR')}`;

        document.getElementById('modal-confirmar-eliminar').classList.add('abierto');
    } else {
        // Eliminar directo
        ejecutarEliminar(gastoObj, filaElement);
    }
}

async function ejecutarEliminar(gastoObj, filaElement) {
    // Si estaba guardado en Supabase, borrar
    if (gastoObj.idSupabase) {
        try {
            filaElement.style.opacity = '0.5';
            const { error } = await supabaseClient
                .from('gastos')
                .delete()
                .eq('id', gastoObj.idSupabase);

            if (error) throw error;
            cargarResumen();
        } catch (err) {
            console.error('Error al eliminar de Supabase:', err);
            filaElement.style.opacity = '1';
            alert('Error al eliminar el gasto de la base de datos.');
            return;
        }
    }

    // Quitar del array local
    gastosLocales = gastosLocales.filter(g => g.tempId !== gastoObj.tempId);

    // Quitar del DOM
    filaElement.remove();
    actualizarFooterYTotal();

    // Mostrar empty state si no quedan filas
    if (gastosLocales.length === 0) {
        document.getElementById('lista-gastos').innerHTML = `
            <div class="gastos-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>No hay gastos registrados. Tocá una categoría arriba para empezar.</p>
            </div>
        `;
    }
}

// Eventos Modal Eliminar
document.getElementById('cerrar-modal-eliminar')?.addEventListener('click', cerrarModalEliminar);
document.getElementById('btn-cancelar-eliminar')?.addEventListener('click', cerrarModalEliminar);
document.getElementById('btn-confirmar-eliminar')?.addEventListener('click', () => {
    if (filaAEliminar) {
        ejecutarEliminar(filaAEliminar.obj, filaAEliminar.el);
        cerrarModalEliminar();
    }
});

function cerrarModalEliminar() {
    document.getElementById('modal-confirmar-eliminar').classList.remove('abierto');
    filaAEliminar = null;
}

// =============================================
// 5. CARGAR GASTOS DE SUPABASE (Al cargar página)
// =============================================
async function cargarGastosSupabase() {
    const container = document.getElementById('lista-gastos');

    try {
        const gymId = GIMNASIO_ID;
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

        const primerDiaISO = primerDiaMes.toISOString();
        const ultimoDiaISO = ultimoDiaMes.toISOString();

        const { data: gastos, error } = await supabaseClient
            .from('gastos')
            .select('*')
            .eq('gimnasio_id', gymId)
            .gte('fecha', primerDiaISO)
            .lte('fecha', ultimoDiaISO)
            .order('creado_en', { ascending: true }); // Orden ascendente para que se agreguen al principio

        if (error) throw error;

        gastosLocales = []; // Reset local state
        container.innerHTML = '';

        if (gastos.length === 0) {
            container.innerHTML = `
                <div class="gastos-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p>No hay gastos registrados. Tocá una categoría arriba para empezar.</p>
                </div>
            `;
        } else {
            // Renderizar cada gasto
            gastos.forEach(gasto => {
                // Ensure the category exists, fallback to 'Otros'
                const catId = categoriasData.some(c => c.id === gasto.categoria) ? gasto.categoria : 'Otros';
                agregarFilaGasto(catId, gasto);
            });
        }

        actualizarFooterYTotal();

    } catch (err) {
        console.error('Error cargando gastos:', err);
        container.innerHTML = `<div class="gastos-empty"><p>Error al cargar los gastos. Recargá la página.</p></div>`;
    }
}

// =============================================
// 6. ACTUALIZAR FOOTER Y CONTADOR
// =============================================
function actualizarFooterYTotal() {
    let totalMonto = 0;
    let filasConMonto = 0;
    const totalFilas = gastosLocales.length;

    gastosLocales.forEach(g => {
        if (g.monto > 0) {
            totalMonto += g.monto;
            filasConMonto++;
        }
    });

    document.getElementById('gastos-total-label').textContent = `TOTAL: -$ ${totalMonto.toLocaleString('es-AR')}`;
}

// =============================================
// 7. CARGAR RESUMEN (3 tarjetas superiores)
// =============================================
async function cargarResumen() {
    try {
        const gymId = GIMNASIO_ID;
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);

        const primerDiaISO = primerDiaMes.toISOString();
        const ultimoDiaISO = ultimoDiaMes.toISOString();

        // Ingresos del mes (tabla pagos)
        const { data: pagos, error: errPagos } = await supabaseClient
            .from('pagos')
            .select('monto')
            .eq('gimnasio_id', gymId)
            .gte('fecha_pago', primerDiaISO)
            .lte('fecha_pago', ultimoDiaISO);

        let totalIngresos = 0;
        if (!errPagos && pagos) {
            totalIngresos = pagos.reduce((acc, p) => acc + Number(p.monto), 0);
        }

        // Gastos del mes (tabla gastos)
        const { data: gastos, error: errGastos } = await supabaseClient
            .from('gastos')
            .select('monto')
            .eq('gimnasio_id', gymId)
            .gte('fecha', primerDiaISO)
            .lte('fecha', ultimoDiaISO);

        let totalGastos = 0;
        let cantidadMovimientos = 0;
        if (!errGastos && gastos) {
            totalGastos = gastos.reduce((acc, g) => acc + Number(g.monto), 0);
            cantidadMovimientos = gastos.length;
        }

        // Ganancia neta
        const gananciaNeta = totalIngresos - totalGastos;
        const margen = totalIngresos > 0 ? ((gananciaNeta / totalIngresos) * 100).toFixed(1) : 0;

        // Actualizar DOM - Ingresos
        const statIngresos = document.getElementById('stat-ingresos');
        if (statIngresos) statIngresos.textContent = `$ ${totalIngresos.toLocaleString('es-AR')}`;

        // Actualizar DOM - Gastos
        const statGastos = document.getElementById('stat-gastos');
        if (statGastos) statGastos.textContent = `$ ${totalGastos.toLocaleString('es-AR')}`;
        const statGastosSub = document.getElementById('stat-gastos-sub');
        if (statGastosSub) statGastosSub.textContent = `${cantidadMovimientos} con monto`;

        // Actualizar DOM - Ganancia
        const statGanancia = document.getElementById('stat-ganancia');
        if (statGanancia) {
            statGanancia.textContent = `$ ${Math.abs(gananciaNeta).toLocaleString('es-AR')}`;
            statGanancia.className = 'tarjeta-valor ' + (gananciaNeta >= 0 ? 'stat-positivo' : 'stat-negativo');
        }
        const statMargenSub = document.getElementById('stat-margen-sub');
        if (statMargenSub) statMargenSub.textContent = `Margen ${margen}%`;

    } catch (err) {
        console.error('Error cargando resumen:', err);
    }
}

// Función auxiliar para escapar HTML
function escapeHtml(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(texto));
    return div.innerHTML;
}

// INICIAR
document.addEventListener('DOMContentLoaded', inicializarPágina);
