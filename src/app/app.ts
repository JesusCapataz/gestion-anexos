import { Component, ChangeDetectorRef, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
})
export class App {
  pantallaActual = 'login';
  cargando = false;
  rolActual: 'Administrador' | 'Docente' | 'Estudiante' = 'Administrador';
  menuAbierto = false;

  // --- VARIABLES DE AUTENTICACIÓN Y REGISTRO ---
  modoAuth: 'login' | 'registro' = 'login';
  regEsAdmin = false;
  errorToken = false;
  
  nombreRegistro = '';
  apellidoRegistro = '';
  correoRegistro = '';
  passRegistro = '';
  correoLogin = '';

  // Errores individuales
  errorRegNombre = false;
  errorRegApellido = false;
  errorRegCorreo = false;
  errorRegPass = false;
  // Patrones de validación para la contraseña
 // Patrones regex simples y exclusivos para validar la contraseña
  minusculaRegex = /[a-z]/;
  mayusculaRegex = /[A-Z]/;
  numeroRegex = /[0-9]/;
  especialRegex = /[!@#$&*.,\-_]/;

  // Estados de validación individuales
  passMinusculaValida = false;
  passMayusculaValida = false;
  passNumeroValida = false;
  passEspecialValida = false;
  passLongitudValida = false;
  errorRegPassMensaje = '';

  nombreUsuarioActivo = 'Usuario Activo';
  inicialesUsuario = 'UA';

  // --- VARIABLES DE FILTROS ---
  filtroActualTexto = '';
  filtroActualCatPrin = '';
  filtroActualCatSec = '';
  filtroActualAnio = '';
  // --- LISTAS PARA FILTROS (Extraídas del Excel Oficial) ---
  categoriasPrincipales = [
    'Inclusión',
    'Interculturalidad',
    'Investigación',
    'Permanencia y graduación',
    'Procesos académicos',
    'Sin categorizar' // UX: Etiqueta clara para evitar ambigüedad de vacíos o "NA"
  ];
  
  categoriasSecundarias = [
    'Administrativo',
    'Calidad',
    'Docencia',
    'Egresados',
    'Extensión',
    'Inclusión',
    'Infraestructura',
    'Interculturalidad',
    'Investigación',
    'Permanencia y graduación',
    'Procesos académicos',
    'Sin categorizar' // UX: Reemplazo estándar para celdas en blanco/NA
  ];

  // UX: Generador dinámico de años en orden descendente (Desde el año actual hasta 1950)
  anios = Array.from({length: new Date().getFullYear() - 1950 + 1}, (_, i) => (new Date().getFullYear() - i).toString());

  // --- VARIABLES DE NOTIFICACIONES ---
  toastVisible = false;
  toastExitoVisible = false;
  modalConfirmarSalida = false; // UX: Modal personalizado de salida
  estadoDescarga: 'iniciada' | 'finalizada' | 'ninguna' = 'ninguna';
  mensajeExito = '';
  
  anexoEliminadoTemporal: any = null;
  tiempoRestante = 10;
  contadorId: any;
  descargaTimeout1: any;
  descargaTimeout2: any;

  // --- VARIABLES DE FORMULARIOS ---
  modalFormVisible = false;
  modoFormulario: 'crear' | 'editar' = 'crear';
  anexoFormulario: any = {};
  errorNombre = false;
  errorCatPrin = false;
  errorCatSec = false;
  errorAnio = false;
  

  // UX: Generador dinámico. Solo saca los años que EXISTEN en la base de datos (anexos).
 
  get aniosDisponibles() {
    // Convertimos 'a' a String para que TypeScript no pelee al compararlo con textos
    const aniosUnicos = new Set(this.anexos.map(a => a.anio).filter(a => a != null && String(a).trim() !== '' && String(a) !== '-' && String(a) !== 'Sin Asignar'));
    return Array.from(aniosUnicos).sort((a: any, b: any) => b - a); // Orden descendente
  }
  guardando = false;
  archivoSeleccionado: File | null = null;
  archivoInfo = { nombre: '', tamano: '', colorBase: '', colorIcono: '', label: '' };

  // --- VARIABLES DE PDF ---
  modalPdfVisible = false;
  anexoViendoPdf: any = null;
  cargandoPdf = false;

  // --- CHATBOT ---
  chatAbierto = false;
  mensajeUsuario = '';
  mensajesChat: {rol: string, texto: string, hora: string}[] = [
    { rol: 'bot', texto: '¡Hola! Soy tu asistente virtual de Acreditación. ¿Buscando algún PEP o Resolución específica?', hora: this.obtenerHoraActual() }
  ];

 anexos = [
    { id: '1', nombre: 'Certificado Acreditación Internacional', anio: 2023, categoriaPrincipal: 'PROCESOS ACADÉMICOS', categoriaSecundaria: 'CALIDAD', descripcion: 'Resolución del Ministerio de Educación por medio del cual se otorga la acreditación...' },
    { id: '2', nombre: 'PEP de Odontología 2021', anio: 2022, categoriaPrincipal: 'PROCESOS ACADÉMICOS', categoriaSecundaria: 'PROCESOS ACADÉMICOS', descripcion: 'Proyecto Educativo del Programa de Odontología (Diciembre 2021). Contiene los lineamientos...' },
    { id: '3', nombre: 'Plan de Desarrollo Unimagdalena 2020-2030', anio: 2020, categoriaPrincipal: 'INCLUSIÓN', categoriaSecundaria: 'ADMINISTRATIVO', descripcion: 'Plan de Desarrollo Universitario Comprometida 2020-2030...' }
  ];

  anexosFiltrados = [...this.anexos];
  totalAnexos = this.anexos.length;
  actualizados = this.anexos.filter(a => a.anio >= 2022).length;
  rangoAnios = '2020 - 2023';
// Método para validar la contraseña en tiempo real
  validarContrasenaEnTiempoReal(pass: string) {
    this.passRegistro = pass;
    this.cdr.detectChanges(); // Forzamos la detección de cambios para la interfaz

    // Ejecutamos las validaciones
    this.passMinusculaValida = this.minusculaRegex.test(pass);
    this.passMayusculaValida = this.mayusculaRegex.test(pass);
    this.passNumeroValida = this.numeroRegex.test(pass);
    this.passEspecialValida = this.especialRegex.test(pass);
    this.passLongitudValida = pass.length >= 8;
  }
  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  @HostListener('document:keydown', ['$event'])
  manejarAtajosTeclado(event: KeyboardEvent) {
    if (event.ctrlKey && event.key.toLowerCase() === 'z') {
      if (this.toastVisible && this.anexoEliminadoTemporal) {
        event.preventDefault();
        this.deshacerEliminacion();
      }
    }
    if (event.key === 'Escape') {
      if (this.hayFiltrosActivos() && !this.modalFormVisible && !this.modalPdfVisible) {
        this.limpiarFiltros();
      }
    }
  }

  cambiarModoAuth(modo: 'login' | 'registro') {
    this.modoAuth = modo;
    this.errorToken = false;
    this.regEsAdmin = false;
    this.nombreRegistro = '';
    this.apellidoRegistro = '';
    this.correoRegistro = '';
    this.passRegistro = '';
    this.errorRegNombre = false;
    this.errorRegApellido = false;
    this.errorRegCorreo = false;
    this.errorRegPass = false;
    
    // UX: Resetear los checks de la contraseña para que vuelvan a gris
    this.passMinusculaValida = false;
    this.passMayusculaValida = false;
    this.passNumeroValida = false;
    this.passEspecialValida = false;
    this.passLongitudValida = false;
  }

  toggleRegAdmin(event: any) {
    this.regEsAdmin = event.target.checked;
    this.errorToken = false;
  }

  crearCuenta(token: string) {
    let formularioValido = true;

    // 1. Validar campos vacíos individualmente
    this.errorRegNombre = !this.nombreRegistro.trim();
    this.errorRegApellido = !this.apellidoRegistro.trim();

   
   // 2. Validar Correo Institucional (UX: Ahora solo validamos el usuario antes del @)
    const prefijoRegex = /^[^\s@]+$/;
    this.errorRegCorreo = !this.correoRegistro.trim() || !prefijoRegex.test(this.correoRegistro);

    // 3. Validar Contraseña (Min 8 chars, 1 mayúscula, 1 número, 1 carácter especial)
    // Validar Contraseña con criterios específicos y dinámicos
    if (!this.passRegistro.trim()) {
      this.errorRegPass = true;
      this.errorRegPassMensaje = '*La contraseña es obligatoria.';
      formularioValido = false;
    } else if (
      !(this.passMinusculaValida && this.passMayusculaValida && this.passNumeroValida &&
        this.passEspecialValida && this.passLongitudValida)
    ) {
      this.errorRegPass = true;
      this.errorRegPassMensaje = '*La contraseña no cumple con los requisitos de seguridad establecidos.';
      formularioValido = false;
    } else {
      this.errorRegPass = false;
    }

    if (this.errorRegNombre || this.errorRegApellido || this.errorRegCorreo || this.errorRegPass) {
      formularioValido = false;
    }

    // 4. Validar Código de Autorización (si aplica)
    if (this.regEsAdmin && token !== 'ADMIN123') {
      this.errorToken = true;
      formularioValido = false;
    } else {
      this.errorToken = false;
    }

    if (!formularioValido) {
      this.cdr.detectChanges(); // OBLIGA A REFRESCAR LA PANTALLA PARA MOSTRAR LOS ERRORES ROJOS
      return;
    }
    
    // Éxito: Guardar datos y entrar
   // Éxito: Guardar datos y entrar
    this.nombreUsuarioActivo = `${this.nombreRegistro} ${this.apellidoRegistro}`;
    this.inicialesUsuario = (this.nombreRegistro.charAt(0) + this.apellidoRegistro.charAt(0)).toUpperCase();
    
    // UX: Recordar el correo para la próxima vez que inicie sesión
    this.correoLogin = this.correoRegistro;
    
    this.iniciarSesion(true);
  }

  iniciarSesion(desdeRegistro = false) {
    if (!desdeRegistro) {
      this.nombreUsuarioActivo = 'Diana Escobar';
      this.inicialesUsuario = 'DE';
    }
    this.pantallaActual = 'dashboard';
    this.buscar('', '', '', '');
  }

cerrarSesion() {
    this.menuAbierto = false; // Cerramos el menú desplegable
    this.modalConfirmarSalida = true; // Abrimos nuestro modal hermoso
  }
confirmarCerrarSalida() {
    this.modalConfirmarSalida = false;
    
    // UX: Privacidad y Control de Usuario. Limpiamos y MATAMOS TODO el rastro.
    this.pantallaActual = 'login';
    this.chatAbierto = false;
    this.estadoDescarga = 'ninguna';
    this.toastVisible = false;
    this.toastExitoVisible = false;
    
    // MATAR MODALES Y VISORES ABIERTOS
    this.modalFormVisible = false;
    this.modalPdfVisible = false;
    this.anexoViendoPdf = null;
    this.archivoSeleccionado = null;
    
    // Reiniciar la IA a su estado de fábrica
    this.mensajeUsuario = '';
    this.mensajesChat = [
      { rol: 'bot', texto: '¡Hola! Soy tu asistente virtual de Acreditación. ¿Buscando algún PEP o Resolución específica?', hora: this.obtenerHoraActual() }
    ];

    // Cuidamos a nuestro amado contador
    if (this.contadorId) {
      window.clearInterval(this.contadorId);
      this.contadorId = null;
    }

    this.cambiarModoAuth('login');
  }

  cambiarRol(nuevoRol: 'Administrador' | 'Docente' | 'Estudiante') {
    this.rolActual = nuevoRol;
    this.menuAbierto = false;
  }

buscar(termino: string, catPrincipal: string, catSecundaria: string, anioSeleccionado: string) {
    this.filtroActualTexto = termino;
    this.filtroActualCatPrin = catPrincipal;
    this.filtroActualCatSec = catSecundaria;
    this.filtroActualAnio = anioSeleccionado;

    const busqueda = termino.toLowerCase();
    
    this.anexosFiltrados = this.anexos.filter(anexo => {
      const coincideTexto = anexo.nombre.toLowerCase().includes(busqueda) || anexo.descripcion.toLowerCase().includes(busqueda);
      const coincideCatPrin = catPrincipal === '' || anexo.categoriaPrincipal === catPrincipal;
      const coincideCatSec = catSecundaria === '' || anexo.categoriaSecundaria === catSecundaria;
      
      // UX: Lógica avanzada y estrictamente tipada para el año
      let coincideAnio = true;
      if (anioSeleccionado === 'SIN_ANIO') {
        // Convertimos a String SIEMPRE para evitar el error TS2367
        coincideAnio = !anexo.anio || String(anexo.anio).trim() === '' || String(anexo.anio) === 'Sin Asignar';
      } else if (anioSeleccionado !== '') {
        coincideAnio = anexo.anio != null && String(anexo.anio) === anioSeleccionado;
      }

      return coincideTexto && coincideCatPrin && coincideCatSec && coincideAnio;
    });

    this.actualizarDashboard();
  }
  hayFiltrosActivos(): boolean {
    return this.filtroActualTexto !== '' || this.filtroActualCatPrin !== '' || this.filtroActualCatSec !== '' || this.filtroActualAnio !== '';
  }

  limpiarFiltros() {
    this.filtroActualTexto = '';
    this.filtroActualCatPrin = '';
    this.filtroActualCatSec = '';
    this.filtroActualAnio = '';
    this.buscar('', '', '', '');
    this.cdr.detectChanges();
  }

  actualizarDashboard() {
    this.totalAnexos = this.anexosFiltrados.length;
    this.actualizados = this.anexosFiltrados.filter(a => a.anio >= 2022).length;

    if (this.anexosFiltrados.length > 0) {
      const anios = this.anexosFiltrados.map(a => a.anio);
      const min = Math.min(...anios);
      const max = Math.max(...anios);
      this.rangoAnios = min === max ? `${min}` : `${min} - ${max}`;
    } else {
      this.rangoAnios = '-';
    }
  }

eliminarAnexo(anexoSeleccionado: any) {
    // 1. Limpieza total y estricta antes de empezar
    if (this.contadorId) {
      window.clearInterval(this.contadorId);
      this.contadorId = null;
    }
    
    this.anexoEliminadoTemporal = anexoSeleccionado;
    this.tiempoRestante = 10;
    this.toastVisible = true;

    this.anexos = this.anexos.filter(a => a.id !== anexoSeleccionado.id);
    this.buscar(this.filtroActualTexto, this.filtroActualCatPrin, this.filtroActualCatSec, this.filtroActualAnio);

    // 2. UX: Blindaje Anti-Congelamiento. Corremos el reloj FUERA del hilo principal de Angular
    this.ngZone.runOutsideAngular(() => {
      this.contadorId = window.setInterval(() => {
        // Volvemos a entrar a Angular SOLO para actualizar el número exacto
        this.ngZone.run(() => {
          this.tiempoRestante--;
          
          if (this.tiempoRestante <= 0) {
            if (this.contadorId) {
              window.clearInterval(this.contadorId);
              this.contadorId = null;
            }
            this.toastVisible = false;
            this.anexoEliminadoTemporal = null;
          }
          // Forzamos a la pantalla a pintar el nuevo segundo de inmediato
          this.cdr.detectChanges();
        });
      }, 1000);
    });
  }

  deshacerEliminacion() {
    // 3. Matamos el proceso independiente
    if (this.contadorId) {
      window.clearInterval(this.contadorId);
      this.contadorId = null;
    }
    
    if (this.anexoEliminadoTemporal) {
      this.anexos.push(this.anexoEliminadoTemporal);
      this.anexos.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      this.anexoEliminadoTemporal = null;
    }
    
    this.toastVisible = false;
    this.buscar(this.filtroActualTexto, this.filtroActualCatPrin, this.filtroActualCatSec, this.filtroActualAnio);
    this.cdr.detectChanges();
  }
  abrirFormularioCrear() {
  this.modoFormulario = 'crear';
  this.anexoFormulario = { 
    nombre: '', 
    anio: '', 
    categoriaPrincipal: '', 
    categoriaSecundaria: '', 
    descripcion: '' 
  };
  this.errorNombre = false;
  this.errorCatPrin = false;
  this.errorCatSec = false;
  this.archivoSeleccionado = null; // UX: Aseguramos que empiece limpio sin iconos falsos
  this.modalFormVisible = true;
}
abrirFormularioEditar(anexo: any) {
    this.modoFormulario = 'editar';
    
    this.anexoFormulario = { 
      ...anexo, 
      // UX: Si el anexo dice 'Sin Asignar', la lista desplegable debe mostrarse vacía
      anio: anexo.anio === 'Sin Asignar' ? '' : anexo.anio, 
      categoriaPrincipal: anexo.categoriaPrincipal ? anexo.categoriaPrincipal.toUpperCase() : '',
      categoriaSecundaria: anexo.categoriaSecundaria ? anexo.categoriaSecundaria.toUpperCase() : '' 
    };
    this.errorNombre = false;
    this.errorCatPrin = false;
    this.errorCatSec = false;
    
    this.archivoSeleccionado = new File([""], anexo.nombre + ".pdf", { type: "application/pdf" });
    this.archivoInfo = {
      nombre: anexo.nombre + ".pdf",
      tamano: "2.45",
      colorBase: 'border-red-200 bg-red-50',
      colorIcono: 'bg-red-100 text-red-600 border-red-200',
      label: 'PDF'
    };
    
    this.modalFormVisible = true;
  }
  cerrarFormulario() {
    this.modalFormVisible = false;
    this.errorNombre = false;
    this.archivoSeleccionado = null;
    this.guardando = false;
  }

  actualizarCampo(campo: string, valor: string) {
    this.anexoFormulario[campo] = valor;
    if (campo === 'nombre' && valor.trim() !== '') {
      this.errorNombre = false;
    }
  }

  seleccionarArchivo(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.archivoSeleccionado = file;
      
      const nombreSinExt = file.name.replace(/\.[^/.]+$/, "");
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (this.modoFormulario === 'crear') {
        this.anexoFormulario.nombre = nombreSinExt;
        this.errorNombre = false;
      }

      let colorBase = 'border-gray-200 bg-gray-50';
      let colorIcono = 'bg-gray-100 text-gray-500 border-gray-200';
      let label = 'DOC';

      if (ext === 'pdf') { colorBase = 'border-red-200 bg-red-50'; colorIcono = 'bg-red-100 text-red-600 border-red-200'; label = 'PDF'; }
      else if (['doc', 'docx'].includes(ext)) { colorBase = 'border-blue-200 bg-blue-50'; colorIcono = 'bg-blue-100 text-blue-600 border-blue-200'; label = 'WORD'; }
      else if (['xls', 'xlsx', 'csv'].includes(ext)) { colorBase = 'border-green-200 bg-green-50'; colorIcono = 'bg-green-100 text-green-600 border-green-200'; label = 'EXCEL'; }
      else if (['ppt', 'pptx'].includes(ext)) { colorBase = 'border-orange-200 bg-orange-50'; colorIcono = 'bg-orange-100 text-orange-600 border-orange-200'; label = 'PPT'; }
      else if (ext === 'txt') { label = 'TXT'; }

      this.archivoInfo = {
        nombre: file.name,
        tamano: this.obtenerTamanoArchivoMB(file.size),
        colorBase, colorIcono, label
      };
      
      this.cdr.detectChanges();
    }
    input.value = '';
  }

  removerArchivo() {
    this.archivoSeleccionado = null;
    if (this.modoFormulario === 'crear') {
      this.anexoFormulario.nombre = '';
    }
  }
validarAnio(valor: any) {
    if (!valor) {
      this.anexoFormulario.anio = '';
      this.errorAnio = false;
      return;
    }

    // Limpiamos letras
    const valorLimpio = String(valor).replace(/\D/g, '');
    this.anexoFormulario.anio = valorLimpio;
    
    if (valorLimpio.length > 0) {
      const numAnio = parseInt(valorLimpio, 10);
      // UX: Error estricto SI tiene menos de 4 números, O si es menor a 1900, O si es mayor a 2100
      this.errorAnio = valorLimpio.length < 4 || numAnio < 1900 || numAnio > 2100;
    } else {
      this.errorAnio = false;
    }
  }

  guardarFormulario() {
    this.errorNombre = !this.anexoFormulario.nombre?.trim();
    this.errorCatPrin = !this.anexoFormulario.categoriaPrincipal;
    this.errorCatSec = !this.anexoFormulario.categoriaSecundaria;

    // Re-validar el año justo antes de guardar por si el usuario lo dejó a medias
    const anioStr = this.anexoFormulario.anio ? String(this.anexoFormulario.anio) : '';
    if (anioStr.length > 0) {
      const numAnio = parseInt(anioStr, 10);
      this.errorAnio = anioStr.length < 4 || numAnio < 1900 || numAnio > 2100;
    } else {
      this.errorAnio = false;
    }

    // Detener si hay ALGÚN error
    if (this.errorNombre || this.errorCatPrin || this.errorCatSec || this.errorAnio) {
      this.cdr.detectChanges();
      return;
    }

    this.guardando = true;
    this.cdr.detectChanges();

    setTimeout(() => {
      // Guardamos el año (se guarda vacío si no asignó ninguno)
      const anioParaGuardar = this.anexoFormulario.anio;

      if (this.modoFormulario === 'crear') {
        const ids = this.anexos.map(a => parseInt(a.id));
        const nuevoId = ids.length > 0 ? (Math.max(...ids) + 1).toString() : '1';
        
        this.anexos.push({
          id: nuevoId,
          nombre: this.anexoFormulario.nombre,
          anio: anioParaGuardar,
          categoriaPrincipal: this.anexoFormulario.categoriaPrincipal,
          categoriaSecundaria: this.anexoFormulario.categoriaSecundaria,
          descripcion: this.anexoFormulario.descripcion
        });
      } else {
        const index = this.anexos.findIndex(a => a.id === this.anexoFormulario.id);
        if (index !== -1) {
          this.anexos[index] = { 
            ...this.anexos[index], 
            ...this.anexoFormulario,
            anio: anioParaGuardar 
          };
        }
      }

      this.anexos.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      this.buscar(this.filtroActualTexto, this.filtroActualCatPrin, this.filtroActualCatSec, this.filtroActualAnio);
      
      this.guardando = false;
      this.modalFormVisible = false;

      this.toastExitoVisible = true;
      this.mensajeExito = this.modoFormulario === 'crear' ? 'El anexo fue cargado y guardado en el sistema correctamente.' : 'Los cambios del documento fueron actualizados con éxito.';
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.toastExitoVisible = false;
        this.cdr.detectChanges();
      }, 4000);
    }, 1500);
  }
  abrirPdf(anexo: any) {
    this.anexoViendoPdf = anexo;
    this.cargandoPdf = true;
    this.modalPdfVisible = true;

    // Temporizador limpio, Angular detecta el cambio automáticamente
    setTimeout(() => {
      this.cargandoPdf = false;
      this.cdr.detectChanges();
    }, 1200);
  }

  cerrarPdf() {
    this.modalPdfVisible = false;
    this.anexoViendoPdf = null;
  }

  descargarPdfRapido() {
    if (this.estadoDescarga !== 'ninguna') return;

    this.estadoDescarga = 'iniciada';
    this.cdr.detectChanges();

    if (this.descargaTimeout1) clearTimeout(this.descargaTimeout1);
    if (this.descargaTimeout2) clearTimeout(this.descargaTimeout2);

    this.descargaTimeout1 = setTimeout(() => {
      this.estadoDescarga = 'finalizada';
      this.cdr.detectChanges();

      this.descargaTimeout2 = setTimeout(() => {
        this.estadoDescarga = 'ninguna';
        this.cdr.detectChanges();
      }, 3000);
    }, 2500);
  }
  
  obtenerTamanoArchivoMB(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  toggleChat() {
    this.chatAbierto = !this.chatAbierto;
  }

  enviarMensajeChat() {
    if (this.mensajeUsuario.trim() === '') return;
    
    const pregunta = this.mensajeUsuario;
    this.mensajesChat.push({ rol: 'usuario', texto: pregunta, hora: this.obtenerHoraActual() });
    this.mensajeUsuario = '';
    this.cdr.detectChanges();

    setTimeout(() => {
      let respuesta = 'No encontré un documento exacto para eso en la base de datos. ¿Podrías darme el año o la resolución?';
      const pLowerCase = pregunta.toLowerCase();
      
      if (pLowerCase.includes('pep') || pLowerCase.includes('odontología')) {
        respuesta = '¡Claro! El PEP de Odontología 2021 se encuentra en la categoría de CALIDAD (ID #2).';
      } else if (pLowerCase.includes('acreditación') || pLowerCase.includes('internacional')) {
        respuesta = 'Tengo el "Certificado Acreditación Internacional" del 2023. Está ubicado en Procesos Académicos (ID #1).';
      } else if (pLowerCase.includes('plan') || pLowerCase.includes('desarrollo')) {
        respuesta = 'El Plan de Desarrollo Unimagdalena 2020-2030 está en Administrativo (ID #3).';
      }

      this.mensajesChat.push({ rol: 'bot', texto: respuesta, hora: this.obtenerHoraActual() });
      this.cdr.detectChanges();
    }, 1200);
  }

  obtenerHoraActual(): string {
    const ahora = new Date();
    return ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}