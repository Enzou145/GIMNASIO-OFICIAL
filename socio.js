// 1. CONFIGURACIÓN
const supabaseUrl = 'https://mhipqrjxnyykrwfjquxy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaXBxcmp4bnl5a3J3ZmpxdXh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzYwNzIsImV4cCI6MjA5MzkxMjA3Mn0.U8nEWlt2ARh7Sq0ZX_boxXQGgbkuopAJqLtJcegPh34';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// LEER EL ID DINÁMICAMENTE
const GIMNASIO_ID = localStorage.getItem('gimnasio_id');

// PROTECCIÓN: Si no hay ID, mandarlo al login inmediatamente
if (!GIMNASIO_ID) {
    window.location.href = 'login.html';
}






let filtroEstado = 'todos';
let filtroPlan = 'todos';
let busqueda = '';

const SOCIOS_POR_PAGINA = 7;
let paginaActual = 1;

let socioIdActual = null; // Variable global para controlar el estado
let socioIdAEliminar = null; // Variable para el socio a eliminar

// --- LÓGICA DE DROPDOWNS Y FILTROS ---
// Toggle de Dropdowns
document.querySelectorAll('.filtro-container > button').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentDropdown = btn.nextElementSibling;
        document.querySelectorAll('.dropdown').forEach(d => {
            if (d !== currentDropdown) d.classList.remove('abierto');
        });
        currentDropdown.classList.toggle('abierto');
    });
});

// Cerrar dropdowns al hacer clic fuera
window.addEventListener('click', () => {
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('abierto'));
});

// Eventos de selección en Dropdowns
document.querySelectorAll('.dropdown li').forEach(item => {
    item.addEventListener('click', function () {

        const text = this.textContent;
        const container = this.closest('.filtro-container');
        const btnSpan = container.querySelector('button span');

        btnSpan.textContent = text;

        // FILTRO ESTADO
        if (container.querySelector('.filtro-estado')) {

            filtroEstado = this.getAttribute('data-estado');

        }

        // FILTRO PLAN
        else {

            filtroPlan = this.getAttribute('data-plan');

        }

        paginaActual = 1;
        listarSocios();

    });
});

// Buscador con delay (debounce)
const inputsBuscador = document.querySelectorAll('.buscador-input');
let timerBusqueda;
inputsBuscador.forEach(input => {
    input.addEventListener('input', (e) => {
        clearTimeout(timerBusqueda);
        busqueda = e.target.value.toLowerCase().trim();
        // Sincronizar el otro buscador
        inputsBuscador.forEach(otherInput => {
            if (otherInput !== e.target) {
                otherInput.value = e.target.value;
            }
        });
        timerBusqueda = setTimeout(() => {
            paginaActual = 1;
            listarSocios();
        }, 300);
    });
});

async function cargarPlanesFiltro() {
    try {
        const gymId = localStorage.getItem("gimnasio_id") || GIMNASIO_ID;
        const { data: planes, error } = await supabaseClient
            .from("planes")
            .select("id, nombre, duracion_dias")
            .eq("gimnasio_id", gymId)
            .eq("activo", true);

        if (error) throw error;

        const dropdown = document.getElementById("dropdown-planes-filtro");
        if (!dropdown) return;

        dropdown.innerHTML = '';

        const crearOption = (id, texto) => {
            const li = document.createElement("li");
            li.setAttribute("data-plan", id);
            li.textContent = texto;
            li.addEventListener('click', function () {
                const container = this.closest('.filtro-container');
                container.querySelector('button span').textContent = this.textContent;
                filtroPlan = this.getAttribute('data-plan');
                paginaActual = 1;
                listarSocios();
            });
            return li;
        };

        dropdown.appendChild(crearOption("todos", "Todos los planes"));

        planes.forEach((plan) => {
            dropdown.appendChild(crearOption(plan.id, plan.nombre));
        });

    } catch (error) {
        console.error("Error cargando planes filtro:", error);
    }
}

cargarPlanesFiltro();



// Modal Nuevo Socio
const btnNuevoSocio = document.getElementById('nuevo-socio');
const modalNuevoSocio = document.getElementById('modal-nuevo-socio');
const btnCerrarModalNuevo = document.getElementById('cerrar-modal-socio');

// ⬇️ AGREGAR ESTAS DOS LÍNEAS (con null si los elementos no existen aún)
const btnCerrarModalEditar = document.getElementById('cerrar-modal-editar');
const btnCerrarModalVer = document.getElementById('cerrar-modal-ver');
const modalEditarSocio = document.getElementById('modal-editar-socio');
const modalVerSocio = document.getElementById('modal-ver-socio');

const btnTema = document.getElementById('cambiar-tema');
const body = document.body;

// Los 3 temas en orden
const temas = ['dark', 'light', 'green'];

// Cargar tema guardado (o dark por defecto)
let temaActual = localStorage.getItem('tema') || 'dark';

// Aplicar al cargar la página
aplicarTema(temaActual);

// Clic en el botón → pasar al siguiente tema
btnTema.addEventListener('click', () => {
    const index = temas.indexOf(temaActual);
    temaActual = temas[(index + 1) % temas.length];
    aplicarTema(temaActual);
    localStorage.setItem('tema', temaActual);
});

function aplicarTema(tema) {
    // Quitar todas las clases de tema
    body.classList.remove('light', 'green');

    // Agregar la clase si no es dark (dark es el :root, no necesita clase)
    if (tema !== 'dark') {
        body.classList.add(tema);
    }
}



// Función general para cerrar modals
function cerrarModals() {
    if (modalNuevoSocio) modalNuevoSocio.classList.remove('abierto');
    if (modalEditarSocio) modalEditarSocio.classList.remove('abierto');
    if (modalVerSocio) modalVerSocio.classList.remove('abierto');
}



// --- LOGIC PARA MODAL NUEVO SOCIO ---
if (btnNuevoSocio && modalNuevoSocio && btnCerrarModalNuevo) {
    btnNuevoSocio.addEventListener('click', () => {
        abrirModalNuevoSocio();
    });

    btnCerrarModalNuevo.addEventListener('click', (e) => {
        e.preventDefault();
        cerrarModalNuevoSocio();
    });
}

if (btnCerrarModalVer) {
    btnCerrarModalVer.addEventListener('click', (e) => {
        e.preventDefault();
        cerrarModals();
    });
}

// Cerrar haciendo clic afuera (Simplificado)
window.addEventListener('click', (e) => {
    document.querySelectorAll('.dropdown-acciones').forEach(d => d.classList.remove('activo'));
    document.querySelectorAll('.dropdown-acciones-menu').forEach(d => d.classList.remove('abierto'));
    document.querySelectorAll('.cliente, .socio-card-mobile').forEach(c => c.style.zIndex = '1');
    if (e.target === modalNuevoSocio) cerrarModalNuevoSocio();
    if (e.target === modalEditarSocio) cerrarModals();
    if (e.target === modalVerSocio) cerrarModals();

    const modalRenovar = document.getElementById('modal-renovar-cuota');
    if (modalRenovar && e.target === modalRenovar) {
        modalRenovar.classList.remove('abierto');
    }
});

// --- 1. CARGAR PLANES DINÁMICAMENTE ---
async function cargarPlanes() {
    try {
        const gymId = localStorage.getItem("gimnasio_id") || GIMNASIO_ID;
        const { data: planes, error } = await supabaseClient
            .from("planes")
            .select("id, nombre, precio, duracion_dias")
            .eq("gimnasio_id", gymId)
            .eq("activo", true)
            .order("precio", { ascending: true });

        if (error) throw error;

        const selectPlan = document.getElementById("select-plan-nuevo");
        if (!selectPlan) return;

        selectPlan.innerHTML = `<option value="" disabled selected>Seleccionar...</option>`;

        planes.forEach((plan) => {
            const option = document.createElement("option");
            option.value = plan.id;
            const duracionTexto = plan.duracion_dias ? `(${plan.duracion_dias} días)` : '';
            option.textContent = `${plan.nombre} ${duracionTexto} — $${plan.precio}`;
            // Guardamos los datos para usarlos al seleccionar
            option.dataset.precio = plan.precio;
            option.dataset.duracionDias = plan.duracion_dias;
            selectPlan.appendChild(option);
        });
    } catch (error) {
        console.error("Error cargando planes:", error);
    }
}

// --- 2. ACTUALIZAR PRECIO CUANDO SE ELIGE UN PLAN ---
const selectPlanNuevo = document.getElementById("select-plan-nuevo");
if (selectPlanNuevo) {
    selectPlanNuevo.addEventListener("change", function () {
        const opcionSeleccionada = this.options[this.selectedIndex];
        const precio = opcionSeleccionada.dataset.precio || 0;

        // Actualizar el texto visual (el que dice $ 0)
        const txtPrecio = document.getElementById("precio-total-nuevo");
        if (txtPrecio) txtPrecio.textContent = `$ ${Number(precio).toLocaleString("es-AR")}`;

        // Actualizar el input oculto o de monto
        const inputMonto = document.getElementById("input-monto-nuevo");
        if (inputMonto) inputMonto.value = precio;
    });
}

// --- 3. FUNCIONES DE APERTURA Y CIERRE ---
function abrirModalNuevoSocio() {
    cargarPlanes(); // Importante: Carga los planes antes de mostrar el modal
    if (document.getElementById('input-fecha-ingreso')) {
        document.getElementById('input-fecha-ingreso').value = new Date().toISOString().split('T')[0];
    }
    modalNuevoSocio.classList.add('abierto');
}

function cerrarModalNuevoSocio() {
    modalNuevoSocio.classList.remove('abierto');
    const form = document.getElementById("form-nuevo-socio");
    if (form) form.reset();

    const txtPrecio = document.getElementById("precio-total-nuevo");
    if (txtPrecio) txtPrecio.textContent = "$ 0";
}


// --- 4. GUARDAR SOCIO ---
const formNuevoSocio = document.getElementById("form-nuevo-socio");
if (formNuevoSocio) {
    formNuevoSocio.addEventListener("submit", async function (e) {
        e.preventDefault();

        const btnGuardar = document.getElementById("btn-guardar-socio");
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";

        try {
            const nombre = document.getElementById("input-nombre").value.trim();
            const apellido = document.getElementById("input-apellido").value.trim();


            // --- NUEVOS CAMPOS CAPTURADOS ---
            const fechaNacimiento = document.getElementById("input-fecha-nacimiento").value || null;
            const genero = document.getElementById("select-genero").value || null;
            const telefono = document.getElementById("input-telefono").value.trim() || null;
            // --------------------------------

            const planId = document.getElementById("select-plan-nuevo").value;
            const monto = parseFloat(document.getElementById("input-monto-nuevo").value) || 0;
            const rawMetodo = document.getElementById("select-metodo-pago")?.value || 'Efectivo';
            const metodoPago = rawMetodo.charAt(0).toUpperCase() + rawMetodo.slice(1).toLowerCase();

            const hoy = new Date();
            const inputFecha = document.getElementById("input-fecha-ingreso").value;
            const fechaIngreso = inputFecha || hoy.toISOString().split('T')[0];

            const gymId = localStorage.getItem("gimnasio_id") || GIMNASIO_ID;

            if (socioIdActual) {
                // ==========================================
                // MODO EDICIÓN (UPDATE) - Incluyendo nuevos campos
                // ==========================================
                const { error: errorSocio } = await supabaseClient
                    .from("socios")
                    .update({
                        nombre,
                        apellido,
                        fecha_nacimiento: fechaNacimiento, // Agregado
                        genero: genero,                    // Agregado
                        telefono: telefono,                // Agregado
                        fecha_ingreso: fechaIngreso
                    })
                    .eq('id', socioIdActual);

                if (errorSocio) throw errorSocio;

                // Recalcular vencimiento con la fecha de ingreso editada y el plan elegido
                const selectPlanEdit = document.getElementById("select-plan-nuevo");
                const opcionPlanEdit = selectPlanEdit.options[selectPlanEdit.selectedIndex];
                const duracionDiasEdit = parseInt(opcionPlanEdit.dataset.duracionDias) || 30;

                const [anioE, mesE, diaE] = fechaIngreso.split("-").map(Number);
                const vencimientoEditObj = new Date(anioE, mesE - 1, diaE + duracionDiasEdit - 1);
                const fechaVencimientoEditStr = vencimientoEditObj.toISOString().split('T')[0];

                // Determinar estado según si ya venció o no
                const hoyStr = hoy.toISOString().split('T')[0];
                const estadoMembresia = fechaVencimientoEditStr >= hoyStr ? 'Activa' : 'Vencida';

                const { error: errorMem } = await supabaseClient
                    .from("membresias_socios")
                    .update({
                        plan_id: planId,
                        fecha_inicio: fechaIngreso,
                        fecha_vencimiento: fechaVencimientoEditStr,
                        estado: estadoMembresia
                    })
                    .eq('socio_id', socioIdActual);

                if (errorMem) throw errorMem;

                alert("✅ Socio actualizado correctamente.");
            }
            else {
                // ==========================================
                // MODO CREACIÓN (INSERT) - Incluyendo nuevos campos
                // ==========================================

                // 1. Insertar Socio
                const { data: socio, error: errorSocio } = await supabaseClient
                    .from("socios")
                    .insert({
                        gimnasio_id: gymId,
                        nombre,
                        apellido,
                        fecha_nacimiento: fechaNacimiento, // Agregado
                        genero: genero,                    // Agregado
                        telefono: telefono,                // Agregado
                        fecha_ingreso: fechaIngreso,
                        activo: true
                    })
                    .select().single();

                if (errorSocio) throw errorSocio;

                // 2. Calcular vencimiento dinamico basado en el plan
                const selectPlanNuevo = document.getElementById("select-plan-nuevo");
                const opcionPlan = selectPlanNuevo.options[selectPlanNuevo.selectedIndex];
                const duracionDias = parseInt(opcionPlan.dataset.duracionDias) || 30;

                const [anio, mes, dia] = fechaIngreso.split("-").map(Number);
                const vencimientoObj = new Date(anio, mes - 1, dia + duracionDias - 1);
                const fechaVencimientoStr = vencimientoObj.toISOString().split('T')[0];

                // 3. Crear Membresía
                const { error: errorMem } = await supabaseClient
                    .from("membresias_socios")
                    .insert({
                        socio_id: socio.id,
                        gimnasio_id: gymId,
                        plan_id: planId,
                        fecha_inicio: fechaIngreso,
                        fecha_vencimiento: fechaVencimientoStr,
                        estado: 'Activa'
                    });

                if (errorMem) throw errorMem;

                // 4. Registrar Pago
                const { error: errorPago } = await supabaseClient
                    .from("pagos")
                    .insert({
                        socio_id: socio.id,
                        gimnasio_id: gymId,
                        monto: monto,
                        fecha_pago: hoy.toISOString(),
                        metodo_pago: metodoPago
                    });

                if (errorPago) throw errorPago;

                alert("✅ Socio creado correctamente.");
            }

            cerrarModalNuevoSocio();
            listarSocios();

        } catch (err) {
            console.error(err);
            alert("❌ Error: " + err.message);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = socioIdActual ? "Guardar Cambios" : "Guardar Socio";
        }
    });
}





function actualizarTarjetasEstadisticas(socios) {
    const hoy = new Date();
    const proximoVencer = new Date();
    proximoVencer.setDate(hoy.getDate() + 5);

    let total = socios.length;
    let activos = 0;
    let vencidos = 0;
    let porVencer = 0;

    socios.forEach(socio => {
        const membresia = socio.membresias_socios?.[0];
        if (!membresia || !membresia.fecha_vencimiento) {
            vencidos++; // Si no tiene membresía, lo contamos como vencido/inactivo
            return;
        }

        const venc = new Date(membresia.fecha_vencimiento + 'T00:00:00');

        if (venc < hoy) {
            vencidos++;
        } else if (venc >= hoy && venc <= proximoVencer) {
            porVencer++;
            activos++; // Los "por vencer" técnicamente siguen activos
        } else {
            activos++;
        }
    });

    // Inyectar valores en el HTML
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-activos').textContent = activos;
    document.getElementById('stat-vencidos').textContent = vencidos;
    document.getElementById('stat-por-vencer').textContent = porVencer;
}




// --- CARGAR LISTADO DE SOCIOS ---
async function listarSocios() {
    const contenedor = document.getElementById('contenedor-socios-real');
    if (!contenedor) return;

    try {
        // 1. Obtenemos los datos base
        let { data: socios, error } = await supabaseClient
            .from('socios')
            .select(`
        id, nombre, apellido, telefono,
        membresias_socios (
            estado,
            fecha_inicio,
            fecha_vencimiento,
            planes ( id, nombre, precio, duracion_dias )
        )
    `)
            .eq('gimnasio_id', GIMNASIO_ID);

        if (error) throw error;

        actualizarTarjetasEstadisticas(socios);

        const hoy = new Date();
        const cincoDiasDespues = new Date();
        cincoDiasDespues.setDate(hoy.getDate() + 5);

        // 2. Aplicamos filtros en JS
        let sociosFiltrados = socios.filter(socio => {
            const membresia = socio.membresias_socios?.[0];
            const plan = membresia?.planes;
            const venc = membresia ? new Date(membresia.fecha_vencimiento + 'T00:00:00') : null;

            // Filtro de Búsqueda (Nombre o Apellido)
            const nombreCompleto = `${socio.nombre || ''} ${socio.apellido || ''}`.toLowerCase();
            const cumpleBusqueda = busqueda === '' || nombreCompleto.includes(busqueda);

            // Filtro de Plan
            let cumplePlan = true;
            if (filtroPlan !== 'todos') {
                if (!plan || plan.id !== filtroPlan) {
                    cumplePlan = false;
                }
            }

            // Filtro de Estado/Vencimiento
            let cumpleEstado = true;
            if (filtroEstado !== 'todos') {
                if (filtroEstado === 'activos') {
                    cumpleEstado = venc && venc > hoy;
                } else if (filtroEstado === 'vencidos') {
                    cumpleEstado = !venc || venc < hoy;
                } else if (filtroEstado === 'por-vencer') {
                    cumpleEstado = venc && venc >= hoy && venc <= cincoDiasDespues;
                }
            }

            return cumpleBusqueda && cumplePlan && cumpleEstado;
        });

        // 3. Renderizar
        contenedor.innerHTML = '';

        if (sociosFiltrados.length === 0) {
            contenedor.innerHTML = '<p style="padding: 20px; text-align: center; color: var(--text-gray);">No se encontraron socios con esos filtros.</p>';
            actualizarPaginacion(0);
            return;
        }

        const inicio = (paginaActual - 1) * SOCIOS_POR_PAGINA;
        const fin = inicio + SOCIOS_POR_PAGINA;
        const sociosPagina = sociosFiltrados.slice(inicio, fin);

        sociosPagina.forEach(socio => {
            const membresia = socio.membresias_socios?.[0];
            const plan = membresia?.planes;
            const venc = membresia ? new Date(membresia.fecha_vencimiento + 'T00:00:00') : null;
            const iniciales = `${socio.nombre[0]}${socio.apellido[0]}`.toUpperCase();

            let claseEstado = 'vencido';
            let textoEstado = 'VENCIDO';

            if (venc) {
                if (venc > cincoDiasDespues) {
                    claseEstado = 'activo';
                    textoEstado = 'ACTIVO';
                } else if (venc > hoy) {
                    claseEstado = 'por-vencer'; // Asegúrate de tener este estilo en CSS
                    textoEstado = 'POR VENCER';
                }
            }

            const telefono = socio.telefono ? socio.telefono : '';
            let whatsappBtnHtml = '';

            // Calcular días transcurridos y restantes para la barra de progreso
            const hoyLimpio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            const inicioDate = membresia?.fecha_inicio ? new Date(membresia.fecha_inicio) : null;

            let diasTotales = plan?.duracion_dias || 30;
            let diasTranscurridos = 0;
            let diasRestantes = 0;
            let porcentajeTiempo = 0;

            if (venc) {
                const vencLimpio = new Date(venc.getFullYear(), venc.getMonth(), venc.getDate());

                if (inicioDate) {
                    const inicioLimpio = new Date(inicioDate.getFullYear(), inicioDate.getMonth(), inicioDate.getDate());
                    diasTotales = Math.max(1, Math.round((vencLimpio - inicioLimpio) / (1000 * 60 * 60 * 24)));
                    diasTranscurridos = Math.max(0, Math.round((hoyLimpio - inicioLimpio) / (1000 * 60 * 60 * 24)));
                } else {
                    diasTranscurridos = diasTotales - Math.max(0, Math.round((vencLimpio - hoyLimpio) / (1000 * 60 * 60 * 24)));
                }

                diasRestantes = Math.round((vencLimpio - hoyLimpio) / (1000 * 60 * 60 * 24));
                porcentajeTiempo = Math.min(100, Math.max(0, (diasTranscurridos / diasTotales) * 100));
            }

            if (diasRestantes < 0) {
                diasRestantes = 0;
                porcentajeTiempo = 100;
            }

            const progressColor = claseEstado === 'activo' ? 'var(--estado-activo)' : (claseEstado === 'por-vencer' ? 'var(--estado-por-vencer)' : 'var(--estado-vencido)');

            if (telefono) {
                const telefonoLimpio = telefono.replace(/\D/g, '');
                let mensaje = '';
                const opcionesFecha = { day: 'numeric', month: 'short', year: 'numeric' };
                const fechaStr = venc ? venc.toLocaleDateString('es-ES', opcionesFecha) : '';
                const nombrePlan = plan?.nombre || 'Plan';

                if (textoEstado === 'VENCIDO') {
                    mensaje = `Hola ${socio.nombre}, te recordamos que tu cuota del ${nombrePlan} venció el ${fechaStr}. ¡Te esperamos para renovar!`;
                } else if (textoEstado === 'POR VENCER') {
                    mensaje = `Hola ${socio.nombre}, te recordamos que tu cuota del ${nombrePlan} está próximaa a vencer el ${fechaStr}.`;
                } else {
                    mensaje = `Hola ${socio.nombre}, te saludamos desde el gimnasio. Tu plan ${nombrePlan} está activo hasta el ${fechaStr}.`;
                }

                const mensajeCodificado = encodeURIComponent(mensaje);

                whatsappBtnHtml = `
                    <a href="https://wa.me/${telefonoLimpio}?text=${mensajeCodificado}" target="_blank" class="whatsapp-btn btn-whatsapp" title="Contactar por WhatsApp">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.67-1.612-.916-2.204-.24-.58-.48-.501-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.026a11.918 11.918 0 001.592 5.982L0 24l6.146-1.612a11.893 11.893 0 005.9 1.543h.005c6.632 0 12.028-5.391 12.032-12.024a11.85 11.85 0 00-3.535-8.508z"/></svg>
                        
                    </a>
                `;
            } else {
                whatsappBtnHtml = `
                    <div class="whatsapp-btn btn-whatsapp disabled" title="Sin teléfono registrado">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.67-1.612-.916-2.204-.24-.58-.48-.501-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.414 0 .018 5.393 0 12.026a11.918 11.918 0 0 0 1.592 5.982L0 24l6.146-1.612a11.893 11.893 0 0 0 5.9 1.543h.005c6.632 0 12.028-5.391 12.032-12.024a11.85 11.85 0 0 0-3.535-8.508z"/></svg>
                        
                    </div>
                `;
            }

            const divSocio = document.createElement('div');
            divSocio.className = 'socio-item-container';
            divSocio.innerHTML = `
                <div class="cliente lista-socios-tabla">
                    <div class="socio-info">
                        <div class="inicial">${iniciales}</div>
                        <div class="nombre-correo">
                            <h1>${socio.nombre} ${socio.apellido}</h1>
                            <p>${socio.telefono || 'Sin teléfono'}</p>
                        </div>
                    </div>
                    <div class="plan-info">
                        <h1>${plan?.nombre || 'Sin Plan'}</h1>
                        <p>Membresía</p>
                    </div>
                    <div class="vencimiento-info">
                        <h1>${venc ? venc.toLocaleDateString('es-AR') : '---'}</h1>
                        <p>Vencimiento</p>
                    </div>
                    <div>
                        <div class="estado ${claseEstado}">${textoEstado}</div>
                    </div>
                    <div class="cuota-info">
                        <h1>$ ${plan?.precio || 0}</h1>
                    </div>
                    <div class="acciones-lista">
                        <button class="btn-renovar-inline" onclick="abrirModalRenovar('${socio.id}', '${plan?.id || ''}')" title="Renovar Cuota">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                            Renovar
                        </button>
                        ${whatsappBtnHtml}
                        <div class="acciones-dropdown-container">
                            <button class="btn-tres-puntos" onclick="toggleAccionesDropdown(event)" title="Más acciones">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                            </button>
                            <div class="dropdown-acciones-menu">
                                <button class="opcion-dropdown" onclick="verDetalles('${socio.id}'); cerrarAccionesDropdown()" title="Ver Detalles">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    <span>Ver Socio</span>
                                </button>
                                <button class="opcion-dropdown" onclick="abrirModalSocio('${socio.id}'); cerrarAccionesDropdown()" title="Modificar">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    <span>Editar</span>
                                </button>
                                <button class="opcion-dropdown eliminar" onclick="eliminarSocio('${socio.id}')" title="Eliminar">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    <span>Eliminar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="socio-card-mobile lista-socios-mobile estado-${claseEstado}">
                    <div class="socio-card-header" onclick="toggleCardExpand(this)">
                        <div class="inicial">${iniciales}</div>
                        <div class="socio-card-info" style="display: flex; flex-direction: column; gap: 4px; padding-left: 2px;">
                            <span class="socio-card-name" style="font-weight: 700; color: var(--texto-principal); font-size: 14px;">${socio.nombre} ${socio.apellido}</span>
                            <span class="socio-card-phone" style="font-size: 10px; color: var(--texto-secundario); font-weight: 500;">
                                ${plan?.nombre || 'Sin Plan'} · $ ${(plan?.precio || 0).toLocaleString("es-AR")}
                            </span>
                        </div>
                        <div class="socio-card-status-wrapper" style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
                            <div class="estado ${claseEstado}">${textoEstado}</div>
                            <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>
                    <div class="socio-card-body">
                        <div class="socio-card-body-inner">
                            <div class="socio-card-details-list">
                                <div class="details-item">
                                    <svg class="details-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                    </svg>
                                    <span class="label">Tel:</span>
                                    <span class="valor">${telefono || 'Sin teléfono'}</span>
                                </div>
                                <div class="details-item">
                                    <svg class="details-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    <span class="label">Vence:</span>
                                    <span class="valor ${claseEstado === 'vencido' ? 'texto-vencido' : ''}">${venc ? venc.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : '---'}</span>
                                </div>
                                <div class="details-item">
                                    <svg class="details-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                                        <line x1="2" y1="10" x2="22" y2="10"></line>
                                    </svg>
                                    <span class="label">Cuota:</span>
                                    <span class="valor">$ ${(plan?.precio || 0).toLocaleString("es-AR")}</span>
                                </div>
                            </div>
                            
                            <div class="socio-card-progress-section">
                                <div class="progress-info">
                                    <span>Progreso de días</span>
                                    <span>${diasTranscurridos}/${diasTotales} días</span>
                                </div>
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill" style="width: ${porcentajeTiempo}%; background: ${progressColor};"></div>
                                </div>
                            </div>

                            <div class="socio-card-acciones">
                                <button class="btn-card-primary" onclick="abrirModalRenovar('${socio.id}', '${plan?.id || ''}')" title="Renovar Cuota">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                    Renovar cuota
                                </button>
                                
                                ${whatsappBtnHtml}
                                
                                <div class="acciones-dropdown-container">
                                    <button class="btn-tres-puntos btn-card-secondary" onclick="toggleAccionesDropdown(event)" title="Más acciones">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                                    </button>
                                    <div class="dropdown-acciones-menu">
                                        <button class="opcion-dropdown" onclick="verDetalles('${socio.id}'); cerrarAccionesDropdown()" title="Ver Detalles">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                            <span>Ver Socio</span>
                                        </button>
                                        <button class="opcion-dropdown" onclick="abrirModalSocio('${socio.id}'); cerrarAccionesDropdown()" title="Modificar">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            <span>Modificar</span>
                                        </button>
                                        <button class="opcion-dropdown eliminar" onclick="eliminarSocio('${socio.id}'); cerrarAccionesDropdown()" title="Eliminar">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            <span>Eliminar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            contenedor.appendChild(divSocio);
        });

        actualizarPaginacion(sociosFiltrados.length);

    } catch (err) {
        console.error("Error filtrando:", err);
    }
}

// Funciones auxiliares para los botones de la tabla
window.toggleAcciones = (btn, e) => {
    e.stopPropagation();
    document.querySelectorAll('.dropdown-acciones').forEach(d => d.classList.remove('activo'));
    btn.nextElementSibling.classList.toggle('activo');
};

window.eliminarSocio = async (id) => {
    socioIdAEliminar = id;
    document.getElementById('modal-confirmar-eliminar').classList.add('abierto');
};

// Cancelar eliminación
window.cancelarEliminacion = () => {
    socioIdAEliminar = null;
    document.getElementById('modal-confirmar-eliminar').classList.remove('abierto');
};



// Confirmar eliminación
window.confirmarEliminacion = async () => {
    if (!socioIdAEliminar) return;

    const btnConfirmar = document.getElementById('btn-confirmar-eliminar');
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'Eliminando...';

    try {
        const { error } = await supabaseClient.from('socios').delete().eq('id', socioIdAEliminar);

        if (error) {
            alert("Error al eliminar el socio");
            throw error;
        }

        alert("✅ Socio eliminado correctamente");
        document.getElementById('modal-confirmar-eliminar').classList.remove('abierto');
        listarSocios();
    } catch (err) {
        console.error("Error:", err);
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = 'Eliminar';
        socioIdAEliminar = null;
    }
};


window.verDetalles = async (id) => {
    document.querySelectorAll('.dropdown-acciones').forEach(d => d.classList.remove('activo'));
    const modal = document.getElementById('modal-ver-socio');
    const cuerpoModal = modal.querySelector('.detalles-body');

    try {
        const { data: socio, error } = await supabaseClient
            .from('socios')
            .select(`
                *,
                membresias_socios (
                    fecha_inicio,
                    fecha_vencimiento,
                    planes (
                        nombre,
                        precio
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;

        const membresia = socio.membresias_socios?.[0];
        const plan = membresia?.planes;
        const hoy = new Date();
        const venc = membresia ? new Date(membresia.fecha_vencimiento + 'T00:00:00') : null;
        const iniciales = `${socio.nombre[0]}${socio.apellido[0]}`.toUpperCase();

        let claseEstado = 'vencido';
        let textoEstado = 'VENCIDO';
        if (venc && venc > hoy) {
            claseEstado = 'activo';
            textoEstado = 'ACTIVO';
        }

        cuerpoModal.innerHTML = `
            <div class="detalles-header">
                <div class="inicial-grande">${iniciales}</div>
                <div>
                    <h3>${socio.nombre} ${socio.apellido}</h3>
                    <p class="estado-badge ${claseEstado}">${textoEstado}</p>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <span>Teléfono</span>
                    <p>${socio.telefono || 'No asignado'}</p>
                </div>
                <div class="info-item">
                    <span>Fecha de Nac.</span>
                    <p>${socio.fecha_nacimiento ? new Date(socio.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '---'}</p>
                </div>
                <div class="info-item">
                    <span>Género</span>
                    <p>${socio.genero || '---'}</p>
                </div>
            </div>

            <div class="separador">
                <p>MEMBRESÍA</p>
                <div class="linea"></div>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <span>Plan Actual</span>
                    <p>${plan?.nombre || 'Sin Plan'}</p>
                </div>
                <div class="info-item">
                    <span>Cuota</span>
                    <p>$ ${plan?.precio || 0}</p>
                </div>
                <div class="info-item">
                    <span>Fecha Ingreso</span>
                    <p>${membresia?.fecha_inicio ? new Date(membresia.fecha_inicio + 'T00:00:00').toLocaleDateString('es-AR') : '---'}</p>
                </div>
                <div class="info-item">
                    <span>Vencimiento</span>
                    <p class="${venc < hoy ? 'texto-vencido' : ''}">${venc ? venc.toLocaleDateString('es-AR') : '---'}</p>
                </div>
            </div>

            <div class="separador">
                <p>CÓDIGO QR DE ACCESO</p>
                <div class="linea"></div>
            </div>

            <div class="qr-card">
                <div class="qr-container" id="qr-container-${id}"></div>
                <div class="qr-info">
                    <p class="qr-nombre">${socio.nombre} ${socio.apellido}</p>
                </div>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button class="btn-descargar-qr" onclick="descargarQR('${socio.nombre}', '${socio.apellido}', '${id}')" style="flex: 1;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Descargar
                    </button>
                    <button class="btn-descargar-qr" onclick="enviarQRWhatsApp('${socio.nombre}', '${socio.apellido}', '${id}', '${socio.telefono || ''}')" style="flex: 1; background-color: #25D366; color: white; border-color: #25D366;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                        </svg>
                        Enviar QR
                    </button>
                </div>
            </div>
        `;

        generarQR(socio.qr_token, id);
        modal.classList.add('abierto');

    } catch (err) {
        console.error('Error cargando detalles:', err);
        alert('No se pudieron cargar los detalles del socio');
    }
};



// Función para abrir el modal (sirve para ambos casos)
window.abrirModalSocio = async (id = null) => {
    socioIdActual = id;
    const modal = document.getElementById('modal-nuevo-socio');
    const titulo = modal.querySelector('h2');
    const btnGuardar = document.getElementById('btn-guardar-socio');
    const formulario = document.getElementById('form-nuevo-socio');
    formulario.reset();

    formulario.reset();
    // Resetear el texto del precio visual
    if (document.getElementById('precio-total-nuevo')) {
        document.getElementById('precio-total-nuevo').textContent = "$ 0";
    }

    // Cargamos los planes primero para que el select tenga las opciones
    await cargarPlanes();

    if (socioIdActual) {
        titulo.textContent = "EDITAR SOCIO";
        btnGuardar.textContent = "Guardar Cambios";

        try {
            const { data: socio, error } = await supabaseClient
                .from('socios')
                .select('*, membresias_socios(*, planes(*))')
                .eq('id', socioIdActual)
                .single();

            if (error) throw error;

            const membresia = socio.membresias_socios?.[0];

            // LLENAR CAMPOS CON LOS IDs CORRECTOS
            document.getElementById('input-nombre').value = socio.nombre;
            document.getElementById('input-apellido').value = socio.apellido;

            // Si tienes estos campos en tu HTML, se llenarán:
            if (document.getElementById('input-fecha-ingreso')) document.getElementById('input-fecha-ingreso').value = socio.fecha_ingreso || '';
            if (document.getElementById('input-fecha-nacimiento')) document.getElementById('input-fecha-nacimiento').value = socio.fecha_nacimiento || '';
            if (document.getElementById('select-genero')) document.getElementById('select-genero').value = socio.genero || '';
            if (document.getElementById('input-telefono')) document.getElementById('input-telefono').value = socio.telefono || '';

            // Llenar datos de membresía
            if (membresia) {
                document.getElementById('select-plan-nuevo').value = membresia.plan_id;
                document.getElementById('input-monto-nuevo').value = membresia.monto_pago || membresia.planes?.precio || 0;
                document.getElementById('precio-total-nuevo').textContent = `$ ${membresia.planes?.precio || 0}`;
            }

        } catch (err) {
            console.error("Error al cargar datos:", err);
        }
    } else {
        titulo.textContent = "NUEVO SOCIO";
        btnGuardar.textContent = "Guardar Socio";

        if (document.getElementById('input-fecha-ingreso')) {
            document.getElementById('input-fecha-ingreso').value = new Date().toISOString().split('T')[0];
        }
    }

    modal.classList.add('abierto');
};














function actualizarTarjetasEstadisticas(socios) {
    const hoy = new Date();
    const proximoVencer = new Date();
    proximoVencer.setDate(hoy.getDate() + 5);

    let activos = 0;
    let vencidos = 0;
    let porVencer = 0;

    socios.forEach(socio => {
        const membresia = socio.membresias_socios?.[0];
        const venc = membresia ? new Date(membresia.fecha_vencimiento + 'T00:00:00') : null;

        if (!venc || venc < hoy) {
            vencidos++;
        } else if (venc >= hoy && venc <= proximoVencer) {
            porVencer++;
            activos++; // Siguen activos aunque falte poco para vencer
        } else {
            activos++;
        }
    });

    // Actualizamos el HTML (Asegúrate de tener estos IDs en tu HTML)
    if (document.getElementById('stat-total')) document.getElementById('stat-total').textContent = socios.length;
    if (document.getElementById('stat-activos')) document.getElementById('stat-activos').textContent = activos;
    if (document.getElementById('stat-vencidos')) document.getElementById('stat-vencidos').textContent = vencidos;
    if (document.getElementById('stat-por-vencer')) document.getElementById('stat-por-vencer').textContent = porVencer;
}

// --- LOGICA RENOVAR CUOTA ---
let socioParaRenovarId = null;

window.abrirModalRenovar = async (idSocio, planIdActual) => {
    socioParaRenovarId = idSocio;
    document.querySelectorAll('.dropdown-acciones').forEach(d => d.classList.remove('activo'));

    const modalRenovar = document.getElementById('modal-renovar-cuota');
    if (!modalRenovar) return;

    // Reset textos
    document.getElementById('renovar-nombre').textContent = "Cargando...";
    document.getElementById('renovar-inicial').textContent = "--";
    document.getElementById('renovar-badge').textContent = "--";
    document.getElementById('renovar-badge').className = "estado-badge";
    const inputFechaIngreso = document.getElementById('renovar-fecha-ingreso');
    if (inputFechaIngreso) inputFechaIngreso.value = new Date().toISOString().split('T')[0];
    document.getElementById('renovar-vencimiento-nuevo').textContent = "--/--/----";

    const select = document.getElementById('select-plan-renovar');

    try {
        // Cargar datos del socio y de los planes
        const [socioRes, planesRes] = await Promise.all([
            supabaseClient.from('socios').select('*, membresias_socios(*, planes(nombre, precio, duracion_dias))').eq('id', idSocio).single(),
            supabaseClient.from("planes").select("id, nombre, precio, duracion_dias").eq("gimnasio_id", GIMNASIO_ID).eq("activo", true)
        ]);

        const socio = socioRes.data;
        const planes = planesRes.data;

        if (socio) {
            // Iniciales y Nombre
            const iniciales = `${socio.nombre[0] || ''}${socio.apellido[0] || ''}`.toUpperCase();
            document.getElementById('renovar-nombre').textContent = `${socio.nombre} ${socio.apellido}`;
            document.getElementById('renovar-inicial').textContent = iniciales;

            // Membresia Actual
            const membresia = socio.membresias_socios?.[0];
            const hoy = new Date();
            let venc = null;
            let claseEstado = 'vencido';
            let textoEstado = 'VENCIDO';

            if (membresia && membresia.fecha_vencimiento) {
                // Parseamos respetando zona local para evitar desfases
                const parts = membresia.fecha_vencimiento.split('-');
                venc = new Date(parts[0], parts[1] - 1, parts[2]);
                if (venc > hoy) {
                    claseEstado = 'activo';
                    textoEstado = 'ACTIVO';
                }
            }

            const badge = document.getElementById('renovar-badge');
            badge.className = `estado-badge ${claseEstado}`;
            badge.textContent = textoEstado;

            // Cargar planes en el select
            select.innerHTML = '<option value="" disabled selected>Seleccione un plan</option>';
            planes.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.nombre} - $${p.precio}`;
                opt.dataset.precio = p.precio;
                opt.dataset.dias = p.duracion_dias || 30; // 30 por defecto
                select.appendChild(opt);
            });

            // Pre-seleccionar
            if (planIdActual) {
                select.value = planIdActual;
            } else if (membresia && membresia.plan_id) {
                select.value = membresia.plan_id;
            }

            // Calcular nuevo vencimiento inicial
            actualizarMontoYVencimientoRenovar();
        }
    } catch (err) {
        console.error("Error cargando planes/socio para renovar:", err);
    }

    modalRenovar.classList.add('abierto');
};

function actualizarMontoYVencimientoRenovar() {
    const select = document.getElementById('select-plan-renovar');
    if (select.selectedIndex === -1) return;
    const op = select.options[select.selectedIndex];

    if (op && op.value) {
        document.getElementById('input-monto-renovar').value = op.dataset.precio || 0;

        const diasAgregados = parseInt(op.dataset.dias) || 30;
        const inputFechaIngreso = document.getElementById('renovar-fecha-ingreso');
        let fechaBase = new Date();
        
        if (inputFechaIngreso && inputFechaIngreso.value) {
            const parts = inputFechaIngreso.value.split('-');
            fechaBase = new Date(parts[0], parts[1] - 1, parts[2]);
        }

        fechaBase.setDate(fechaBase.getDate() + diasAgregados - 1);
        document.getElementById('renovar-vencimiento-nuevo').textContent = fechaBase.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
}

const selectPlanRenovar = document.getElementById('select-plan-renovar');
if (selectPlanRenovar) {
    selectPlanRenovar.addEventListener('change', actualizarMontoYVencimientoRenovar);
}

const inputFechaIngresoRenovar = document.getElementById('renovar-fecha-ingreso');
if (inputFechaIngresoRenovar) {
    inputFechaIngresoRenovar.addEventListener('change', actualizarMontoYVencimientoRenovar);
}

const btnCerrarRenovar = document.getElementById('cerrar-modal-renovar');
if (btnCerrarRenovar) {
    btnCerrarRenovar.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('modal-renovar-cuota').classList.remove('abierto');
    });
}

// Event listeners para modal de confirmación de eliminación
const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');
const modalConfirmarEliminar = document.getElementById('modal-confirmar-eliminar');

if (btnCancelarEliminar) {
    btnCancelarEliminar.addEventListener('click', cancelarEliminacion);
}

if (btnConfirmarEliminar) {
    btnConfirmarEliminar.addEventListener('click', confirmarEliminacion);
}

// Cerrar modal al hacer clic fuera
if (modalConfirmarEliminar) {
    modalConfirmarEliminar.addEventListener('click', (e) => {
        if (e.target === modalConfirmarEliminar) {
            cancelarEliminacion();
        }
    });
}

const formRenovar = document.getElementById('form-renovar-cuota');
if (formRenovar) {
    formRenovar.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnGuardar = document.getElementById('btn-guardar-renovacion');
        btnGuardar.disabled = true;
        btnGuardar.textContent = 'Guardando...';

        try {
            const planId = document.getElementById('select-plan-renovar').value;
            const monto = parseFloat(document.getElementById('input-monto-renovar').value);
            const metodoRaw = document.getElementById('select-metodo-renovar').value;
            const metodoPago = metodoRaw.charAt(0).toUpperCase() + metodoRaw.slice(1).toLowerCase();

            // Calcular vencimiento
            const select = document.getElementById('select-plan-renovar');
            const op = select.options[select.selectedIndex];
            const diasAgregados = parseInt(op.dataset.dias) || 30;

            const hoy = new Date();
            const inputFechaIngreso = document.getElementById('renovar-fecha-ingreso');
            let fechaBase = new Date(hoy);
            if (inputFechaIngreso && inputFechaIngreso.value) {
                const parts = inputFechaIngreso.value.split('-');
                fechaBase = new Date(parts[0], parts[1] - 1, parts[2]);
            }

            const fechaInicioStr = (inputFechaIngreso && inputFechaIngreso.value) ? inputFechaIngreso.value : fechaBase.toISOString().split('T')[0];

            fechaBase.setDate(fechaBase.getDate() + diasAgregados - 1);
            const fechaVencimientoStr = fechaBase.toISOString().split('T')[0];

            // Actualizar Membresía (Si ya existe, la actualiza con el eq, sino insertarla si se requiere, pero vamos a probar update o upsert)
            // Ya que el socio TIENE membresia o deberia, pero si no la tiene 'update' podria no hacer nada.
            // Para asegurar, busquemos si tiene:
            const { data: memExistente } = await supabaseClient.from('membresias_socios').select('id').eq('socio_id', socioParaRenovarId).maybeSingle();

            let membresiaIdGenerada = null;

            if (memExistente) {
                const { error: errMem } = await supabaseClient
                    .from('membresias_socios')
                    .update({
                        plan_id: planId,
                        fecha_inicio: fechaInicioStr,
                        fecha_vencimiento: fechaVencimientoStr,
                        estado: 'Activa'
                    })
                    .eq('socio_id', socioParaRenovarId);
                if (errMem) throw errMem;
                membresiaIdGenerada = memExistente.id;
            } else {
                const { data: newMem, error: errMem } = await supabaseClient
                    .from('membresias_socios')
                    .insert({
                        socio_id: socioParaRenovarId,
                        gimnasio_id: GIMNASIO_ID,
                        plan_id: planId,
                        fecha_inicio: fechaInicioStr,
                        fecha_vencimiento: fechaVencimientoStr,
                        estado: 'Activa'
                    })
                    .select('id').single();
                if (errMem) throw errMem;
                if (newMem) membresiaIdGenerada = newMem.id;
            }

            // Insertar Pago
            const { error: errPago } = await supabaseClient
                .from('pagos')
                .insert({
                    socio_id: socioParaRenovarId,
                    gimnasio_id: GIMNASIO_ID,
                    membresia_id: membresiaIdGenerada,
                    monto: monto,
                    fecha_pago: hoy.toISOString(),
                    metodo_pago: metodoPago
                });

            if (errPago) throw errPago;

            alert('✅ Renovación registrada correctamente.');
            document.getElementById('modal-renovar-cuota').classList.remove('abierto');
            formRenovar.reset();
            listarSocios();
        } catch (err) {
            alert('❌ Error al renovar: ' + err.message);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Registrar Renovación';
        }
    });
}









// --- FUNCIONES PARA GENERAR Y DESCARGAR QR ---
function generarQR(qrToken, socioId) {
    const container = document.getElementById(`qr-container-${socioId}`);
    if (!container) return;

    container.innerHTML = '';

    try {
        const qr = qrcode(0, 'M');
        qr.addData(qrToken);
        qr.make();

        const qrElement = document.createElement('div');
        qrElement.innerHTML = qr.createImgTag(8);
        container.appendChild(qrElement);
    } catch (err) {
        console.error('Error generando QR:', err);
        container.innerHTML = '<p style="color: var(--color-rojo);">Error al generar QR</p>';
    }
}

window.descargarQR = async (nombre, apellido, socioId) => {
    try {
        const container = document.getElementById(`qr-container-${socioId}`);
        if (!container) return;

        const svg = container.querySelector('img');
        if (!svg) {
            alert('Error: No se encontró el QR para descargar');
            return;
        }

        const canvas = await html2canvas(container, {
            backgroundColor: '#ffffff',
            scale: 2
        });

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `QR-${nombre}-${apellido}.png`;
        link.click();

        alert('✅ QR descargado correctamente');
    } catch (err) {
        console.error('Error descargando QR:', err);
        alert('Error al descargar el QR');
    }
};

window.enviarQRWhatsApp = (nombre, apellido, id, telefono) => {
    if (!telefono || telefono === 'null' || telefono === 'undefined') {
        alert("El socio no tiene un número de teléfono registrado.");
        return;
    }

    const telefonoLimpio = String(telefono).replace(/\D/g, '');
    const mensaje = `¡Bienvenido/a al gimnasio, ${nombre} ${apellido}! \n\nTe enviamos tu código QR personal de acceso. Utilizá este QR para ingresar al gimnasio.`;

    window.open(`https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`, '_blank');
};





// --- LOGICA DEL FOOTER DEL SIDEBAR ---
async function cargarDatosUsuario() {
    const gymId = localStorage.getItem("gimnasio_id");

    if (!gymId) {
        window.location.href = "login.html";
        return;
    }

    // 1. Buscamos el nombre actualizado directamente en la base de datos
    const { data, error } = await supabaseClient
        .from("gimnasios")
        .select("nombre")
        .eq("id", gymId)
        .single();

    if (error) {
        console.error("Error cargando nombre:", error);
        return;
    }

    if (data) {
        const nombreGym = data.nombre; // Aquí vendrá "enzou" o el que pongas en la BD

        // 2. Actualizamos el texto en el sidebar
        const labelNombre = document.getElementById("sidebar-user-name");
        if (labelNombre) labelNombre.textContent = nombreGym;

        // 3. Generamos las iniciales dinámicamente
        const inicialesElemento = document.getElementById("user-initials");
        if (inicialesElemento) {
            const partes = nombreGym.trim().split(" ");
            let iniciales = "";

            if (partes.length > 1) {
                // Si es "Enzo Gym" -> "EG"
                iniciales = partes[0].charAt(0) + partes[1].charAt(0);
            } else {
                // Si es "enzou" -> "EN" (primeras dos letras) o solo "E"
                iniciales = partes[0].substring(0, 2);
            }
            inicialesElemento.textContent = iniciales.toUpperCase();
        }
    }
}

// Llamar a la función al cargar la página
cargarDatosUsuario();


// --- LOGICA DE CERRAR SESIÓN ---
const btnLogout = document.getElementById("btn-logout");
if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
        const confirmar = confirm("¿Estás seguro que deseas cerrar sesión?");
        if (confirmar) {
            // 1. Cerrar en Supabase
            await supabaseClient.auth.signOut();
            // 2. Limpiar LocalStorage
            localStorage.clear();
            // 3. Redirigir al login
            window.location.href = "index.html";
        }
    });
}


window.toggleAccionesDropdown = (e) => {
    e.stopPropagation();
    const container = e.target.closest('.acciones-dropdown-container');
    const dropdown = container.querySelector('.dropdown-acciones-menu');
    const cliente = e.target.closest('.cliente') || e.target.closest('.socio-card-mobile');

    // Cerrar otros dropdowns y resetear z-index
    document.querySelectorAll('.dropdown-acciones-menu').forEach(d => {
        if (d !== dropdown) d.classList.remove('abierto');
    });
    document.querySelectorAll('.cliente, .socio-card-mobile').forEach(c => {
        if (c !== cliente) c.style.zIndex = '1';
    });

    const isAbierto = dropdown.classList.toggle('abierto');
    if (isAbierto && cliente) {
        cliente.style.zIndex = '99';
    } else if (cliente) {
        cliente.style.zIndex = '1';
    }
};

window.cerrarAccionesDropdown = () => {
    document.querySelectorAll('.dropdown-acciones-menu').forEach(d => {
        d.classList.remove('abierto');
    });
    document.querySelectorAll('.cliente, .socio-card-mobile').forEach(c => {
        c.style.zIndex = '1';
    });
};

window.toggleCardExpand = (headerElement) => {
    const card = headerElement.closest('.socio-card-mobile');

    // Close other expanded cards
    document.querySelectorAll('.socio-card-mobile.expandido').forEach(otherCard => {
        if (otherCard !== card) {
            otherCard.classList.remove('expandido');
        }
    });

    // Toggle current card
    card.classList.toggle('expandido');
};

function actualizarPaginacion(totalSocios) {
    const info = document.getElementById('paginacion-info');
    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const numerosContainer = document.getElementById('paginacion-numeros');

    if (!info || !btnAnterior || !btnSiguiente || !numerosContainer) return;

    if (totalSocios === 0) {
        info.textContent = `Mostrando 0 - 0 de 0 socios`;
        btnAnterior.disabled = true;
        btnSiguiente.disabled = true;
        numerosContainer.innerHTML = '';
        return;
    }

    const totalPaginas = Math.ceil(totalSocios / SOCIOS_POR_PAGINA);

    if (paginaActual > totalPaginas) {
        paginaActual = totalPaginas;
        listarSocios();
        return;
    }

    const startIdx = (paginaActual - 1) * SOCIOS_POR_PAGINA + 1;
    const endIdx = Math.min(paginaActual * SOCIOS_POR_PAGINA, totalSocios);

    info.textContent = `Mostrando ${startIdx} - ${endIdx} de ${totalSocios} socios`;

    btnAnterior.disabled = paginaActual === 1;
    btnSiguiente.disabled = paginaActual === totalPaginas;

    numerosContainer.innerHTML = '';

    let startPage = Math.max(1, paginaActual - 2);
    let endPage = Math.min(totalPaginas, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `btn-paginacion ${i === paginaActual ? 'activo' : ''}`;
        btn.textContent = i;
        btn.onclick = () => {
            paginaActual = i;
            listarSocios();
        };
        numerosContainer.appendChild(btn);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');

    if (btnAnterior) {
        btnAnterior.addEventListener('click', () => {
            if (paginaActual > 1) {
                paginaActual--;
                listarSocios();
            }
        });
    }
    if (btnSiguiente) {
        btnSiguiente.addEventListener('click', () => {
            paginaActual++;
            listarSocios();
        });
    }
});

listarSocios();

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const socioId = params.get('id');
    
    if (action === 'renovar' && socioId) {
        // Retraso ligero para permitir que la vista se renderice
        setTimeout(() => {
            if (typeof abrirModalRenovar === 'function') {
                abrirModalRenovar(socioId);
            }
        }, 300);
    }
});