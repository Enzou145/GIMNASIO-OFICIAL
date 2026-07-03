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
if (btnCerrarModalNuevo) {
    btnCerrarModalNuevo.addEventListener('click', (e) => {
        e.preventDefault();
        cerrarModalNuevoSocio();
    });
}


// Cerrar haciendo clic afuera (Simplificado)
window.addEventListener('click', (e) => {
    if (e.target === modalNuevoSocio) cerrarModalNuevoSocio();
    if (e.target === modalEditarSocio) cerrarModals();
    if (e.target === modalVerSocio) cerrarModals();
});

// --- 1. CARGAR PLANES DINÁMICAMENTE ---
async function cargarPlanes() {
    try {
        const gymId = localStorage.getItem("gimnasio_id");
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
            const gymId = localStorage.getItem("gimnasio_id");

            // Captura de datos del Socio (Campos nuevos agregados)
            const nombre = document.getElementById("input-nombre").value.trim();
            const apellido = document.getElementById("input-apellido").value.trim();
            const fechaNacimiento = document.getElementById("input-fecha-nacimiento").value || null;
            const genero = document.getElementById("select-genero").value;
            const telefono = document.getElementById("input-telefono").value.trim();

            const planId = document.getElementById("select-plan-nuevo").value;
            const monto = parseFloat(document.getElementById("input-monto-nuevo").value) || 0;
            const metodoPago = document.getElementById("select-metodo-pago").value;

            const hoy = new Date();
            const inputFecha = document.getElementById("input-fecha-ingreso").value;
            const fechaIngreso = inputFecha || hoy.toISOString().split('T')[0];

            if (!nombre || !apellido || !planId) {
                throw new Error("Nombre, apellido y plan son obligatorios.");
            }

            // Calcular vencimiento
            const selectPlanNuevo = document.getElementById("select-plan-nuevo");
            const opcionPlan = selectPlanNuevo.options[selectPlanNuevo.selectedIndex];
            const duracionDias = parseInt(opcionPlan.dataset.duracionDias) || 30;

            const [anio, mes, dia] = fechaIngreso.split("-").map(Number);
            const vencimiento = new Date(anio, mes - 1, dia + duracionDias - 1);
            const fechaVencimiento = vencimiento.toISOString().split('T')[0];

            // PASO 1: Insertar socio con TODOS los datos
            const { data: socio, error: errorSocio } = await supabaseClient
                .from("socios")
                .insert({
                    gimnasio_id: gymId,
                    nombre,
                    apellido,
                    fecha_nacimiento: fechaNacimiento,
                    genero,
                    telefono,
                    fecha_ingreso: fechaIngreso,
                    activo: true
                }).select().single();

            if (errorSocio) throw errorSocio;

            // PASO 2: Membresía
            const { data: mem, error: errorMem } = await supabaseClient
                .from("membresias_socios")
                .insert({
                    gimnasio_id: gymId,
                    socio_id: socio.id,
                    plan_id: planId,
                    fecha_inicio: fechaIngreso,
                    fecha_vencimiento: fechaVencimiento,
                    estado: "Activa"
                }).select().single();

            if (errorMem) throw errorMem;

            // PASO 3: Pago
            const { error: errorPago } = await supabaseClient
                .from("pagos")
                .insert({
                    gimnasio_id: gymId,
                    socio_id: socio.id,
                    membresia_id: mem.id,
                    monto: monto,
                    metodo_pago: metodoPago
                });

            if (errorPago) throw errorPago;

            alert(`✅ Socio guardado correctamente.`);
            if (typeof cerrarModalNuevoSocio === "function") {
                cerrarModalNuevoSocio();
            }
            location.reload();

        } catch (err) {
            alert("❌ Error: " + err.message);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar Socio";
        }
    });
}
// --- LOGICA DEL FOOTER DEL SIDEBAR ---
async function cargarDatosUsuario() {
    const gymId = localStorage.getItem("gimnasio_id");

    if (!gymId) {
        window.location.href = "login.html";
        return;
    }

    const { data, error } = await supabaseClient
        .from("gimnasios")
        .select("nombre")
        .eq("id", gymId)
        .single();

    if (error) return;

    if (data) {
        const nombreCompleto = data.nombre; // Ejemplo: "Mateo Coach" o "enzou"

        // 1. Extraer solo el primer nombre
        // .split(' ') divide el texto donde hay espacios, [0] toma la primera palabra
        const primerNombre = nombreCompleto.split(' ')[0];

        // 2. Mostrar NOMBRE COMPLETO en el Sidebar
        const labelNombreSidebar = document.getElementById("sidebar-user-name");
        if (labelNombreSidebar) labelNombreSidebar.textContent = nombreCompleto;

        // 3. Mostrar SOLO EL PRIMER NOMBRE en la Tarjeta de Bienvenida
        const labelNombreWelcome = document.getElementById("welcome-user-name");
        if (labelNombreWelcome) {
            labelNombreWelcome.textContent = primerNombre.toUpperCase();
        }

        // 4. Iniciales para el círculo (MC)
        const inicialesElemento = document.getElementById("user-initials");
        if (inicialesElemento) {
            const partes = nombreCompleto.trim().split(" ");
            let iniciales = partes[0].charAt(0);
            if (partes.length > 1) {
                iniciales += partes[partes.length - 1].charAt(0); // Primera del nombre + Primera del apellido
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

// --- GUARDAR NUEVO PLAN DESDE INICIO ---
const formPlanInicio = document.getElementById("form-plan-inicio");
if (formPlanInicio) {
    formPlanInicio.addEventListener("submit", async function (e) {
        e.preventDefault();
        const gymId = localStorage.getItem("gimnasio_id");
        const btnGuardar = document.getElementById("btn-guardar-plan-inicio");
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";

        try {
            const nombre = document.getElementById("input-plan-nombre").value.trim();
            const descripcion = document.getElementById("input-plan-desc").value.trim();
            const duracion = parseInt(document.getElementById("select-plan-duracion").value);
            const precio = parseFloat(document.getElementById("input-plan-precio").value);

            const { error } = await supabaseClient
                .from('planes')
                .insert({
                    gimnasio_id: gymId,
                    nombre: nombre,
                    descripcion: descripcion,
                    duracion_dias: duracion,
                    precio: precio,
                    activo: true
                });

            if (error) throw error;

            alert("Plan creado exitosamente.");
            document.getElementById('modal-plan-inicio').classList.remove('abierto');
            formPlanInicio.reset();
            cargarPlanes(); // Actualizar el select del modal de nuevo socio
        } catch (err) {
            alert("Error al crear plan: " + err.message);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar Plan";
        }
    });
}

// --- GUARDAR NUEVO PROFESOR DESDE INICIO ---
const formProfeInicio = document.getElementById("form-profe-inicio");
if (formProfeInicio) {
    formProfeInicio.addEventListener("submit", async function (e) {
        e.preventDefault();
        const gymId = localStorage.getItem("gimnasio_id");
        const btnGuardar = document.getElementById("btn-guardar-profe-inicio");
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";

        try {
            const nombre = document.getElementById("profe-nombre-inicio").value.trim();
            const especialidad = document.getElementById("profe-especialidad-inicio").value.trim();
            const telefono = document.getElementById("profe-contacto-inicio").value.trim();
            const urlFoto = document.getElementById("profe-avatar-inicio").value.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre)}&background=random`;
            const diasTurno = document.getElementById("profe-dias-inicio").value.trim();
            const horario = document.getElementById("profe-horario-inicio").value.trim();

            const { error } = await supabaseClient
                .from('profesores')
                .insert({
                    gimnasio_id: gymId,
                    nombre_apellido: nombre,
                    especialidad: especialidad,
                    telefono: telefono,
                    url_foto: urlFoto,
                    dias_turno: diasTurno,
                    horario: horario,
                    activo: true
                });

            if (error) throw error;

            alert("Profesor agregado exitosamente.");
            document.getElementById('modal-profe-inicio').classList.remove('abierto');
            formProfeInicio.reset();
        } catch (err) {
            alert("Error al agregar profesor: " + err.message);
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = "Guardar Profesor";
        }
    });
}

// --- CARGAR DASHBOARD ---
async function cargarDashboard() {
    try {
        const gymId = localStorage.getItem("gimnasio_id");
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
        const hoyIso = hoy.toISOString().split('T')[0];

        // 1. Ingresos del Mes (Ahora histórico)
        const { data: pagos, error: errPagos } = await supabaseClient
            .from('pagos')
            .select('monto')
            .eq('gimnasio_id', gymId);

        if (!errPagos && pagos) {
            const ingresos = pagos.reduce((acc, curr) => acc + Number(curr.monto), 0);
            const tarjetaIngresos = document.getElementById('tarjeta-ingresos');
            if (tarjetaIngresos) tarjetaIngresos.textContent = `$ ${ingresos.toLocaleString('es-AR')}`;
        }

        // 2. Socios Activos (con membresia activa)
        const { count: countActivos, error: errActivos } = await supabaseClient
            .from('membresias_socios')
            .select('*', { count: 'exact', head: true })
            .eq('gimnasio_id', gymId)
            .eq('estado', 'Activa');

        if (!errActivos) {
            const tarjetaActivos = document.getElementById('tarjeta-activos');
            if (tarjetaActivos) tarjetaActivos.textContent = countActivos || 0;
        }

        // 3. Socios con Deuda (Membresias Vencidas)
        const { count: countDeuda, error: errVencidas } = await supabaseClient
            .from('membresias_socios')
            .select('*', { count: 'exact', head: true })
            .eq('gimnasio_id', gymId)
            .eq('estado', 'Vencida');

        if (!errVencidas) {
            const tarjetaDeuda = document.getElementById('tarjeta-deuda');
            if (tarjetaDeuda) tarjetaDeuda.textContent = countDeuda || 0;
        }

        // 4. Vencen Hoy
        const { count: countVencenHoy, error: errVencen } = await supabaseClient
            .from('membresias_socios')
            .select('*', { count: 'exact', head: true })
            .eq('gimnasio_id', gymId)
            .eq('fecha_vencimiento', hoyIso)
            .eq('estado', 'Activa');

        if (!errVencen) {
            const tarjetaVencenHoy = document.getElementById('tarjeta-vencen-hoy');
            if (tarjetaVencenHoy) tarjetaVencenHoy.textContent = countVencenHoy || 0;
        }

        // 5. Vencimientos Recientes (15 días pasados hasta 5 días en el futuro para no mostrar activos)
        const quinceDiasAtras = new Date(hoy);
        quinceDiasAtras.setDate(hoy.getDate() - 15);
        const cincoDiasAdelante = new Date(hoy);
        cincoDiasAdelante.setDate(hoy.getDate() + 5);

        const { data: vencimientosRecientes, error: errRecientes } = await supabaseClient
            .from('membresias_socios')
            .select(`
                id, 
                fecha_vencimiento, 
                estado,
                socios (nombre, apellido, telefono),
                planes (nombre)
            `)
            .eq('gimnasio_id', gymId)
            .gte('fecha_vencimiento', quinceDiasAtras.toISOString().split('T')[0])
            .lte('fecha_vencimiento', cincoDiasAdelante.toISOString().split('T')[0])
            .order('fecha_vencimiento', { ascending: true })
            .limit(10);

        if (!errRecientes && vencimientosRecientes) {
            const listaVencimientos = document.getElementById('lista-vencimientos');
            if (listaVencimientos) {
                listaVencimientos.innerHTML = '';
                const hoyF = new Date(hoyIso + 'T00:00:00');

                vencimientosRecientes.forEach(mem => {
                    const socio = Array.isArray(mem.socios) ? mem.socios[0] : mem.socios;
                    const plan = Array.isArray(mem.planes) ? mem.planes[0] : mem.planes;

                    const nombreCompleto = socio ? `${socio.nombre} ${socio.apellido}` : 'Desconocido';
                    const nombrePlan = plan ? plan.nombre : 'Plan';

                    const fechaObj = new Date(mem.fecha_vencimiento + 'T00:00:00');
                    const opcionesFecha = { day: 'numeric', month: 'short', year: 'numeric' };
                    const fechaStr = fechaObj.toLocaleDateString('es-ES', opcionesFecha);

                    const inicial = socio && socio.nombre ? socio.nombre.charAt(0).toUpperCase() : '?';

                    const diffTime = fechaObj - hoyF;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    let estadoTexto = '';
                    let claseEstado = '';

                    if (mem.estado === 'Vencida' || diffDays < 0) {
                        estadoTexto = 'VENCIDO';
                        claseEstado = 'vencido';
                    } else if (diffDays >= 0 && diffDays <= 5) { // En socios suele ser 5 dias
                        estadoTexto = 'POR VENCER';
                        claseEstado = 'por-vencer';
                    } else {
                        estadoTexto = 'ACTIVO';
                        claseEstado = 'activo';
                    }

                    if (estadoTexto === 'ACTIVO') return; // Omitir activos de la lista de vencimientos


                    // 📱 MODULO DE WHATSAPP
                    // Trabaja de la misma forma que venimos trabajando: construyendo el link dinámicamente.
                    const telefono = socio && socio.telefono ? socio.telefono : '';
                    let whatsappBtnHtml = '';

                    if (telefono) {
                        // Limpiar el teléfono de espacios, guiones, etc. (solo números)
                        const telefonoLimpio = telefono.replace(/\D/g, '');

                        // Construir el mensaje
                        let mensaje = '';
                        if (estadoTexto === 'VENCIDO') {
                            mensaje = `Hola ${socio.nombre}, te recordamos que tu cuota del ${nombrePlan} venció el ${fechaStr}. ¡Te esperamos para renovar!`;
                        } else if (estadoTexto === 'POR VENCER') {
                            mensaje = `Hola ${socio.nombre}, te recordamos que tu cuota del ${nombrePlan} está próxima a vencer el ${fechaStr}.`;
                        } else {
                            mensaje = `Hola ${socio.nombre}, te saludamos desde el gimnasio. Tu plan ${nombrePlan} está activo hasta el ${fechaStr}.`;
                        }

                        const mensajeCodificado = encodeURIComponent(mensaje);

                        // Usamos el número limpio.
                        whatsappBtnHtml = `
                            <a href="https://wa.me/${telefonoLimpio}?text=${mensajeCodificado}" target="_blank" class="whatsapp-btn" title="Enviar recordatorio por WhatsApp">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.67-1.612-.916-2.204-.24-.58-.48-.501-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.026a11.918 11.918 0 001.592 5.982L0 24l6.146-1.612a11.893 11.893 0 005.9 1.543h.005c6.632 0 12.028-5.391 12.032-12.024a11.85 11.85 0 00-3.535-8.508z"/></svg>
                            </a>
                        `;
                    } else {
                        whatsappBtnHtml = `
                            <div class="whatsapp-btn disabled" title="Sin teléfono registrado" style="color: #ccc; cursor: not-allowed;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.67-1.612-.916-2.204-.24-.58-.48-.501-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.026a11.918 11.918 0 001.592 5.982L0 24l6.146-1.612a11.893 11.893 0 005.9 1.543h.005c6.632 0 12.028-5.391 12.032-12.024a11.85 11.85 0 00-3.535-8.508z"/></svg>
                            </div>
                        `;
                    }

                    // 📅 CALCULO DE TIEMPO RELATIVO PARA EL VENCIMIENTO
                    let labelVencimiento = 'VENCE';
                    if (diffDays < 0) {
                        const dias = Math.abs(diffDays);
                        labelVencimiento = `Hace ${dias} día${dias > 1 ? 's' : ''}`;
                    } else if (diffDays === 0) {
                        labelVencimiento = 'Vence hoy';
                    } else {
                        labelVencimiento = `En ${diffDays} día${diffDays > 1 ? 's' : ''}`;
                    }

                    // Calcular progreso de la membresía (para la barra de progreso mobile)
                    let porcentajeTiempo = 0;
                    let diasTranscurridos = 0;
                    let diasTotales = 0;
                    let progressColor = 'var(--estado-activo)';
                    
                    if (mem.fecha_ingreso && fechaObj) {
                        const fechaIngresoObj = new Date(mem.fecha_ingreso + 'T00:00:00');
                        diasTotales = Math.ceil((fechaObj - fechaIngresoObj) / (1000 * 60 * 60 * 24));
                        diasTranscurridos = Math.ceil((hoyF - fechaIngresoObj) / (1000 * 60 * 60 * 24));
                        
                        if (diasTranscurridos < 0) diasTranscurridos = 0;
                        if (diasTranscurridos > diasTotales) diasTranscurridos = diasTotales;
                        
                        if (diasTotales > 0) {
                            porcentajeTiempo = (diasTranscurridos / diasTotales) * 100;
                        }
                    } else {
                        // Aproximación si no hay fecha_ingreso
                        diasTotales = plan?.duracion_dias || 30; // asume plan mensual si no hay
                        diasTranscurridos = diasTotales - diffDays;
                        if (diasTranscurridos < 0) diasTranscurridos = 0;
                        if (diasTranscurridos > diasTotales) diasTranscurridos = diasTotales;
                        porcentajeTiempo = (diasTranscurridos / diasTotales) * 100;
                    }
                    
                    if (porcentajeTiempo > 85 && porcentajeTiempo < 100) {
                        progressColor = 'var(--estado-por-vencer)';
                    } else if (porcentajeTiempo >= 100) {
                        progressColor = 'var(--estado-vencido)';
                    }
                    
                    const html = `
                        <div class="cliente lista-socios-tabla">
                            <div class="inicial">${inicial}</div>
                            <div class="nombreyplan">
                                <h1>${nombreCompleto}</h1>
                                <p>${nombrePlan}</p>
                            </div>
                            <div class="vencimientos">
                                <p>${labelVencimiento}</p>
                                <h1>${fechaStr}</h1>
                            </div>
                            <div class="estado ${claseEstado}">${estadoTexto}</div>
                            ${whatsappBtnHtml}
                        </div>
                        
                        <div class="socio-card-mobile lista-socios-mobile estado-${claseEstado}">
                            <div class="socio-card-header" onclick="this.parentElement.classList.toggle('expandido')">
                                <div class="inicial">${inicial}</div>
                                <div class="socio-card-info" style="display: flex; flex-direction: column; gap: 4px; padding-left: 2px;">
                                    <span class="socio-card-name" style="font-weight: 700; color: var(--texto-principal); font-size: 14px;">${nombreCompleto}</span>
                                    <span class="socio-card-phone" style="font-size: 10px; color: var(--texto-secundario); font-weight: 500;">
                                        ${nombrePlan}
                                    </span>
                                </div>
                                <div class="socio-card-status-wrapper" style="margin-left: auto; display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 4px;">
                                    <div class="estado ${claseEstado}">${estadoTexto}</div>
                                    <span style="font-size: 10px; color: var(--texto-secundario);">${labelVencimiento}</span>
                                </div>
                                <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 8px;">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                            <div class="socio-card-body">
                                <div class="socio-card-body-inner">
                                    <div class="socio-card-details-list">
                                        <div class="details-item">
                                            <svg class="details-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                            <span class="label">Vence:</span>
                                            <span class="valor ${claseEstado === 'vencido' ? 'texto-vencido' : ''}">${fechaStr}</span>
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

                                    <div class="socio-card-acciones" style="padding-bottom: 16px;">
                                        <button class="btn-card-primary" onclick="window.location.href='socio.html?action=renovar&id=${socio.id || ''}'" title="Renovar Cuota">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                            Renovar cuota
                                        </button>
                                        
                                        ${whatsappBtnHtml.replace('class="whatsapp-btn"', 'class="whatsapp-btn btn-whatsapp"').replace('class="whatsapp-btn disabled"', 'class="whatsapp-btn btn-whatsapp disabled"')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    listaVencimientos.insertAdjacentHTML('beforeend', html);
                });

                if (vencimientosRecientes.length === 0) {
                    listaVencimientos.innerHTML = '<p style="padding: 1rem; color: #888;">No hay vencimientos recientes.</p>';
                }
            }
        }

    } catch (err) {
        console.error("Error cargando dashboard:", err);
    }
}

// --- CARGAR CUMPLEAÑOS DE LA SEMANA ---
async function cargarCumpleanos() {
    try {
        const gymId = localStorage.getItem("gimnasio_id");

        // Obtener todos los socios activos
        const { data: socios, error } = await supabaseClient
            .from('socios')
            .select('id, nombre, apellido, fecha_nacimiento, telefono')
            .eq('gimnasio_id', gymId)
            .eq('activo', true);

        if (error) throw error;

        const listaCumpleanos = document.getElementById('lista-cumpleanos');
        if (!listaCumpleanos) return;

        listaCumpleanos.innerHTML = '';

        const hoy = new Date();
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay() + (hoy.getDay() === 0 ? -6 : 1)); // Lunes
        inicioSemana.setHours(0, 0, 0, 0);

        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6); // Domingo
        finSemana.setHours(23, 59, 59, 999);

        const cumpleanosFiltrados = [];

        socios.forEach(socio => {
            if (!socio.fecha_nacimiento) return;

            const fechaNac = new Date(socio.fecha_nacimiento + 'T00:00:00');

            // Verificar si el cumpleaños cae en la semana actual
            const bdayThisYear = new Date(inicioSemana.getFullYear(), fechaNac.getMonth(), fechaNac.getDate());
            const bdayNextYear = new Date(finSemana.getFullYear(), fechaNac.getMonth(), fechaNac.getDate());

            let cumpleanosEnSemana = false;
            let fechaCumple = null;

            if (bdayThisYear >= inicioSemana && bdayThisYear <= finSemana) {
                cumpleanosEnSemana = true;
                fechaCumple = bdayThisYear;
            } else if (bdayNextYear >= inicioSemana && bdayNextYear <= finSemana) {
                cumpleanosEnSemana = true;
                fechaCumple = bdayNextYear;
            }

            if (cumpleanosEnSemana) {
                cumpleanosFiltrados.push({
                    ...socio,
                    fechaCumple,
                    fechaNac
                });
            }
        });

        // Ordenar: los más próximos arriba.
        // Criterio: Hoy y futuros primero (ordenados por cercanía), luego pasados.
        const hoyNormalizado = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

        cumpleanosFiltrados.sort((a, b) => {
            const diffA = a.fechaCumple - hoyNormalizado;
            const diffB = b.fechaCumple - hoyNormalizado;

            if (diffA >= 0 && diffB >= 0) return diffA - diffB; // Ambos futuros/hoy: el más cercano primero
            if (diffA < 0 && diffB < 0) return diffA - diffB; // Ambos pasados: orden cronológico
            return diffA >= 0 ? -1 : 1; // Futuros/hoy van primero
        });

        const hayCumpleanos = cumpleanosFiltrados.length > 0;

        cumpleanosFiltrados.forEach(socio => {
            const fechaCumple = socio.fechaCumple;
            const fechaNac = socio.fechaNac;

            const nombreCompleto = `${socio.nombre} ${socio.apellido}`;
            const inicial = socio.nombre ? socio.nombre.charAt(0).toUpperCase() : '?';

            const opcionesFecha = { day: 'numeric', month: 'short' };
            const fechaStr = fechaCumple.toLocaleDateString('es-ES', opcionesFecha);

            const telefono = socio.telefono ? socio.telefono : '';
            let whatsappBtnHtml = '';

            // Calcular la edad que cumple (o cumplió) este año
            const edad = fechaCumple.getFullYear() - fechaNac.getFullYear();

            // Verificar si el cumpleaños es HOY
            const esHoy = fechaCumple.getTime() === hoyNormalizado.getTime();

            if (telefono) {
                const telefonoLimpio = telefono.replace(/\D/g, '');
                const mensaje = encodeURIComponent(`¡Hola ${socio.nombre}! 🥳🥳 Desde el gimnasio te deseamos un muy feliz cumpleaños. ¡Que pases un gran día! 🎉`);

                if (esHoy) {
                    whatsappBtnHtml = `
                        <a href="https://wa.me/${telefonoLimpio}?text=${mensaje}" target="_blank" class="whatsapp-btn" title="Saludar por WhatsApp">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.67-1.612-.916-2.204-.24-.58-.48-.501-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.026a11.918 11.918 0 001.592 5.982L0 24l6.146-1.612a11.893 11.893 0 005.9 1.543h.005c6.632 0 12.028-5.391 12.032-12.024a11.85 11.85 0 00-3.535-8.508z"/></svg>
                        </a>
                    `;
                } else {
                    whatsappBtnHtml = `
                        <div class="whatsapp-btn disabled" title="Aún no es su cumpleaños" style="color: #ccc; cursor: not-allowed;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.67-1.612-.916-2.204-.24-.58-.48-.501-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.026a11.918 11.918 0 001.592 5.982L0 24l6.146-1.612a11.893 11.893 0 005.9 1.543h.005c6.632 0 12.028-5.391 12.032-12.024a11.85 11.85 0 00-3.535-8.508z"/></svg>
                        </div>
                    `;
                }
            } else {
                whatsappBtnHtml = `
                <div class="whatsapp-btn disabled" title="Sin teléfono registrado" style="color: #ccc; cursor: not-allowed;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.67-1.612-.916-2.204-.24-.58-.48-.501-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.026a11.918 11.918 0 001.592 5.982L0 24l6.146-1.612a11.893 11.893 0 005.9 1.543h.005c6.632 0 12.028-5.391 12.032-12.024a11.85 11.85 0 00-3.535-8.508z"/></svg>
                </div>
            `;
            }

            const html = `
                <div class="cliente" style="grid-template-columns: 45px 1fr 1.5fr 80px;">
                    <div class="inicial">${inicial}</div>
                    <div class="nombreyplan">
                        <h1>${nombreCompleto}</h1>
                    </div>
                    <div class="vencimientos">
                        <p>${edad} años</p>
                        <h1>${fechaStr}</h1>
                    </div>
                    ${whatsappBtnHtml}
                </div>
            `;
            listaCumpleanos.insertAdjacentHTML('beforeend', html);
        });

        if (!hayCumpleanos) {
            listaCumpleanos.innerHTML = '<p style="padding: 1rem; color: #888;">No hay cumpleaños esta semana.</p>';
        }

    } catch (err) {
        console.error("Error cargando cumpleaños:", err);
    }
}

// Llamar al cargar el dashboard
cargarDashboard();
cargarCumpleanos();