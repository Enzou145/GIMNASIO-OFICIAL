const socio = { id: 1, nombre: 'a', apellido: 'b' };
const plan = { id: 1, nombre: 'a', precio: 100 };
const venc = new Date();
const claseEstado = 'vencido';
const textoEstado = 'VENCIDO';
const iniciales = 'AB';
const diasTranscurridos = 1;
const diasTotales = 30;
const porcentajeTiempo = 10;
const progressColor = 'red';
const telefono = '123';
const whatsappBtnHtml = '';

const divSocio = document.createElement('div');
divSocio.innerHTML = `
    <div class="cliente lista-socios-tabla">
        <div class="socio-info">
            <div class="inicial">${iniciales}</div>
            <div class="nombre-correo">
                <h1>${socio.nombre} ${socio.apellido}</h1>
                <p>${socio.email || 'sin@correo.com'}</p>
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
                <span class="socio-card-phone" style="font-size: 11px; color: var(--texto-secundario); font-weight: 500;">
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
                        <span class="valor ${claseEstado === 'vencido' ? 'texto-vencido' : ''}">${venc ? venc.toLocaleDateString('es-AR', {day: 'numeric', month: 'long', year: 'numeric'}) : '---'}</span>
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
