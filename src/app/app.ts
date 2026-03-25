import { AnexoService } from './services/anexo';
import { Component, ChangeDetectorRef, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth'; 
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


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
  passLogin = ''; 

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

  // --- VARIABLES MODAL ACTUALIZADOS (UX) ---
  registroTiemposEdicion: any = {};
  modalActualizadosVisible = false;
  anexosRecientes: any[] = [];
// UX: Memoria permanente en disco duro para que no resuciten al recargar
  get idsOcultosActualizados(): string[] {
    return JSON.parse(localStorage.getItem('ocultosUX') || '[]');
  }
  set idsOcultosActualizados(valores: string[]) {
    localStorage.setItem('ocultosUX', JSON.stringify(valores));
  }

  // --- VARIABLES DESHACER DESCARTE (CTRL+Z) ---
 descartadosRecientes: any[] = [];
  toastDescarteVisible = false;
  tiempoDescarte = 5;
  contadorDescarteId: any;  toastVisible = false;
  toastExitoVisible = false;
  modalConfirmarSalida = false; // UX: Modal personalizado de salida
// UX: Lista de notificaciones concurrentes (Permite apilamiento de toasts)
  listaNotificacionesDescarga: {id: number, estado: string, nombre: string}[] = [];
  
  mensajeExito = '';  
  anexoEliminadoTemporal: any = null;
  pendientesEliminacion: any[] = [];
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
  indiceVisualEdicion: number = 0;
  

  // UX: Generador dinámico. Solo saca los años que EXISTEN en la base de datos (anexos).
 
  get aniosDisponibles() {
    // Convertimos 'a' a String para que TypeScript no pelee al compararlo con textos
    const aniosUnicos = new Set(this.anexos.map(a => a.anio).filter(a => a != null && String(a).trim() !== '' && String(a) !== '-' && String(a) !== 'Sin Asignar'));
    return Array.from(aniosUnicos).sort((a: any, b: any) => b - a); // Orden descendente
  }
  guardando = false;
  archivoSeleccionado: File | null = null;
  archivoModificado = false;
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

anexos: any[] = [];

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
constructor(private cdr: ChangeDetectorRef, private anexoService: AnexoService, private ngZone: NgZone, private authService: AuthService, private sanitizer: DomSanitizer) {}
@HostListener('document:keydown', ['$event'])
  manejarAtajosTeclado(event: KeyboardEvent) {
 // 1. Atajo para Deshacer (Ctrl + Z)
    if (event.ctrlKey && event.key.toLowerCase() === 'z') {
      if (this.toastVisible && this.pendientesEliminacion.length > 0) {
        event.preventDefault();
        this.deshacerEliminacion();
      } else if (this.toastDescarteVisible && this.descartadosRecientes) {
        event.preventDefault();
        this.deshacerDescarte();
      }
    }
    // 2. Atajo para Cerrar ventanas (Escape)
    if (event.key === 'Escape') {
      if (this.hayFiltrosActivos() && !this.modalFormVisible && !this.modalPdfVisible) {
        this.limpiarFiltros();
      }
    }

    // --- LO NUEVO: 3. Enter Inteligente (Accesibilidad y Eficiencia UX) ---
    if (event.key === 'Enter') {
      if (this.modalFormVisible) {
        const target = event.target as HTMLElement;
        
        // Respetamos los estándares nativos del navegador web:
        // A. Si está en la Descripción (textarea), dejamos que haga el salto de línea normal.
        if (target.tagName === 'TEXTAREA') return;
        
        // B. Si está en una Lista (select), dejamos que la abra/cierre normalmente.
        if (target.tagName === 'SELECT') return;
        
        // C. Si está parado justo sobre el botón "Cancelar", dejamos que lo hunda.
        if (target.tagName === 'BUTTON' && target.innerText.toLowerCase().includes('cancelar')) return;
        
        // Si no está haciendo nada de lo anterior (ej. está en el vacío o en un input normal), GUARDAMOS.
        event.preventDefault();
        this.guardarFormulario();
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
   // Armamos el usuario para Spring Boot
    const nuevoUsuario = {
      nombre: this.nombreRegistro,
      apellido: this.apellidoRegistro,
      correo: this.correoRegistro + '@unimagdalena.edu.co', // Pegamos el dominio
      password: this.passRegistro,
      rol: this.regEsAdmin ? 'ADMINISTRADOR' : 'DOCENTE'
    };

    // Llamamos al backend para registrarlo
    this.authService.register(nuevoUsuario).subscribe({
      next: (respuesta) => {
        // Guardamos el token que nos devuelve
        this.authService.guardarToken(respuesta.token, respuesta.rol);
        
        this.nombreUsuarioActivo = `${this.nombreRegistro} ${this.apellidoRegistro}`;
        this.inicialesUsuario = (this.nombreRegistro.charAt(0) + this.apellidoRegistro.charAt(0)).toUpperCase();
        this.correoLogin = this.correoRegistro; // Recordar correo
        
        this.iniciarSesion(true); // Entramos al dashboard
      },
      error: (err) => {
        alert('Ocurrió un error al crear la cuenta. Quizás el correo ya existe.');
        console.error(err);
      }
    });
    
    // UX: Recordar el correo para la próxima vez que inicie sesión
    this.correoLogin = this.correoRegistro;
    
    this.iniciarSesion(true);
  }

 iniciarSesion(desdeRegistro = false) {
    if (desdeRegistro) {
      this.pantallaActual = 'dashboard';
      this.cargarAnexosDesdeBD();
      this.buscar('', '', '', '');
    } else {
      // 1. Armamos el paquete para el backend (fíjate que le pegamos el @)
      const credenciales = {
        correo: this.correoLogin + '@unimagdalena.edu.co',
        password: this.passLogin
      };

      // --- ¡EL CHISMOSO! ---
      // Esto nos dirá exactamente qué se está enviando al servidor
      console.log('Intentando entrar con:', credenciales);

      // 2. Llamamos a Spring Boot
      this.authService.login(credenciales).subscribe({
        next: (respuesta) => {
          // Si todo sale bien, guardamos el Token
          this.authService.guardarToken(respuesta.token, respuesta.rol);
          
          this.nombreUsuarioActivo = respuesta.correo;
          this.rolActual = respuesta.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Docente';
          this.inicialesUsuario = respuesta.correo.substring(0, 2).toUpperCase();
          
          this.pantallaActual = 'dashboard';
          this.cargarAnexosDesdeBD();
          this.buscar('', '', '', '');
          this.cdr.detectChanges();
        },
        error: (err) => {
          alert('Error: Correo o contraseña incorrectos.');
          console.error(err);
        }
      });
    }
  }
 cargarAnexosDesdeBD() {
    this.anexoService.getAnexos().subscribe({
      next: (data: any[]) => { // <-- Asegúrate de poner : any[] para que TypeScript no pelee
        // ¡EL ARREGLO ESTÁ AQUÍ! Ordenamos por ID ascendente apenas llegan los datos
        this.anexos = data.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        
        this.buscar(this.filtroActualTexto, this.filtroActualCatPrin, this.filtroActualCatSec, this.filtroActualAnio); // Refresca la tabla visual
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error cargando anexos:', err)
    });
  }
cerrarSesion() {
    this.menuAbierto = false; // Cerramos el menú desplegable
    this.modalConfirmarSalida = true; // Abrimos nuestro modal hermoso
  }
confirmarCerrarSalida() {
    this.modalConfirmarSalida = false;
    
    // --- ¡LO NUEVO! (El "Flush" de UX) ---
    // Si el usuario decide salir, ejecutamos INMEDIATAMENTE todos los borrados 
    // que estaban en el limbo esperando que el reloj llegara a cero.
    if (this.pendientesEliminacion && this.pendientesEliminacion.length > 0) {
      console.log('Forzando borrado definitivo por cierre de sesión...');
      this.ejecutarBorradosEnBD();
    }
    // ------------------------------------
    
    // UX: Privacidad y Control de Usuario. Limpiamos y MATAMOS TODO el rastro.
    this.pantallaActual = 'login';
    this.chatAbierto = false;
    this.listaNotificacionesDescarga = [];
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
    const memoriaTiempos = JSON.parse(localStorage.getItem('memoriaAnexosUX') || '{}');
    
    // UX: Definimos qué es "Reciente" (30 días en milisegundos)
    const treintaDiasEnMs = 30 * 24 * 60 * 60 * 1000;
    const ahora = Date.now();

    this.actualizados = this.anexosFiltrados.filter(a => {
        const idStr = String(a.id);
        const tiempoEdicion = memoriaTiempos[idStr] || 0;
        const esCambioReciente = (ahora - tiempoEdicion) < treintaDiasEnMs && tiempoEdicion > 0;
        const esAnioNuevo = parseInt(a.anio, 10) >= 2022;

        // Es actualizado si tiene año nuevo O se cambió hace poco
        // PERO solo si el usuario no lo ha descartado manualmente
        return (esAnioNuevo || esCambioReciente) && !this.idsOcultosActualizados.includes(idStr);
    }).length;

    // ... (el resto del código de rangoAnios se queda igual)
    const aniosValidos = this.anexosFiltrados.map(a => parseInt(a.anio, 10)).filter(anio => !isNaN(anio) && anio > 0); 
    if (aniosValidos.length > 0) {
      const min = Math.min(...aniosValidos);
      const max = Math.max(...aniosValidos);
      this.rangoAnios = min === max ? `${min}` : `${min} - ${max}`;
    } else { this.rangoAnios = '-'; }
    this.cdr.detectChanges();
  }
eliminarAnexo(anexoSeleccionado: any) {
    // 1. Ocultar de la vista inmediatamente (Optimismo UI)
    this.anexos = this.anexos.filter(a => a.id !== anexoSeleccionado.id);
    this.buscar(this.filtroActualTexto, this.filtroActualCatPrin, this.filtroActualCatSec, this.filtroActualAnio);

    // 2. Agregar a la pila de pendientes
    this.pendientesEliminacion.push(anexoSeleccionado);

    // 3. Reiniciar el reloj a 10 cada vez que se borra uno nuevo (UX consistente)
    this.tiempoRestante = 10;
    this.toastVisible = true;

    // 4. Limpiamos cualquier reloj anterior para que NO choquen
    if (this.contadorId) {
      window.clearInterval(this.contadorId);
    }

    // 5. Iniciamos un único reloj maestro
    this.ngZone.runOutsideAngular(() => {
      this.contadorId = window.setInterval(() => {
        this.ngZone.run(() => {
          this.tiempoRestante--;

          // Cuando el reloj llega a cero de verdad, ejecutamos la purga
          if (this.tiempoRestante <= 0) {
            window.clearInterval(this.contadorId);
            this.contadorId = null;
            this.toastVisible = false;
            
            this.ejecutarBorradosEnBD();
          }
          this.cdr.detectChanges();
        });
      }, 1000);
    });
  }

  ejecutarBorradosEnBD() {
    const elementosABorrar = [...this.pendientesEliminacion];
    this.pendientesEliminacion = [];

    elementosABorrar.forEach(item => {
      this.anexoService.eliminarAnexo(item.id).subscribe({
        next: () => {
          console.log(`Anexo #${item.id} eliminado permanentemente de la BD.`);
        },
        error: (err: any) => {
          console.warn(`Sincronizando con la BD por conflicto en anexo #${item.id}...`);
          
          this.cargarAnexosDesdeBD();
        }
      });
    });
  }
  deshacerEliminacion() {
    if (this.pendientesEliminacion.length > 0) {
      // Sacamos el último elemento de la pila (Lógica LIFO para Ctrl+Z progresivo)
      const ultimoSalvado = this.pendientesEliminacion.pop();
      
      if (ultimoSalvado) {
        // Lo devolvemos a la tabla y ORDENAMOS a su posición original
        this.anexos.push(ultimoSalvado);
        this.anexos.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        this.buscar(this.filtroActualTexto, this.filtroActualCatPrin, this.filtroActualCatSec, this.filtroActualAnio);
      }

      // Si ya vaciamos la pila, apagamos el toast y el reloj
      if (this.pendientesEliminacion.length === 0) {
        this.toastVisible = false;
        if (this.contadorId) {
          window.clearInterval(this.contadorId);
          this.contadorId = null;
        }
      } else {
        // Si aún quedan, reiniciamos el tiempo para que el usuario respire
        this.tiempoRestante = 10;
      }
      this.cdr.detectChanges();
    }
  }
 abrirFormularioCrear() {
    this.modoFormulario = 'crear';
    this.anexoFormulario = { nombre: '', anio: '', categoriaPrincipal: '', categoriaSecundaria: '', descripcion: '' };
    
    // UX: Limpiamos TODOS los fantasmas de errores anteriores
    this.errorNombre = false;
    this.errorCatPrin = false;
    this.errorCatSec = false;
    this.errorAnio = false; // <-- ESTE FALTABA
    
    this.archivoSeleccionado = null;
    this.archivoModificado = false; // Limpiamos seguridad
    this.modalFormVisible = true;
  }
abrirFormularioEditar(anexo: any, numeroFila: number = 0) {
    this.indiceVisualEdicion = numeroFila; 
    this.modoFormulario = 'editar';
    
    this.anexoFormulario = { 
      ...anexo, 
      anio: anexo.anio === 'Sin Asignar' ? '' : anexo.anio, 
      categoriaPrincipal: anexo.categoriaPrincipal ? anexo.categoriaPrincipal.toUpperCase() : '',
      categoriaSecundaria: anexo.categoriaSecundaria ? anexo.categoriaSecundaria.toUpperCase() : '' 
    };
    
    // UX: Limpiamos TODOS los fantasmas de errores anteriores
    this.errorNombre = false;
    this.errorCatPrin = false;
    this.errorCatSec = false;
    this.errorAnio = false; // <-- ¡AQUÍ ESTABA EL FANTASMA!
    
    // UX: 1. Asumimos que está vacío al inicio (mostramos la zona punteada para subir)
    this.archivoSeleccionado = null;
    this.archivoModificado = false; 
    this.modalFormVisible = true;

    // UX: 2. Hacemos un "Ping" silencioso al servidor para ver si el archivo existe
    this.anexoService.verArchivoFisico(anexo.id).subscribe({
      next: (blob: Blob) => {
        if (blob && blob.size > 0 && !blob.type.includes('text') && !blob.type.includes('json')) {
          this.archivoSeleccionado = new File([""], anexo.nombre + ".pdf", { type: "application/pdf" });
          this.archivoInfo = {
            nombre: "Doc_Actual_" + anexo.nombre + ".pdf",
            tamano: this.obtenerTamanoArchivoMB(blob.size),
            colorBase: 'border-red-200 bg-red-50',
            colorIcono: 'bg-red-100 text-red-600 border-red-200',
            label: 'PDF'
          };
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.cdr.detectChanges();
      }
    });
  }
 cerrarFormulario() {
    this.modalFormVisible = false;
    
    // UX: Limpiamos la basura por si canceló a la mitad de un error
    this.errorNombre = false;
    this.errorCatPrin = false;
    this.errorCatSec = false;
    this.errorAnio = false; 
    
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
      this.archivoModificado = true; // ¡ESTO ES CLAVE! Sabemos que es un archivo nuevo real
      
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
    this.archivoModificado = false; // Limpiamos seguridad
    if (this.modoFormulario === 'crear') {
      this.anexoFormulario.nombre = '';
    }
  }
// UX: Interceptor de teclado en el aire para el Año
  verificarTeclaAnio(event: KeyboardEvent) {
    // Permitimos borrar, mover flechas, tabulador y el atajo de Enter
    const teclasPermitidas = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];
    
    // Si la tecla NO es un número (del teclado principal o numpad) y NO es permitida...
    if (!teclasPermitidas.includes(event.key) && !/^[0-9]$/.test(event.key)) {
      event.preventDefault(); // 1. Bloquea la letra antes de que se escriba
      this.errorAnio = true;  // 2. UX: Feedback visual inmediato (Pone la caja roja)
      
      // 3. Quitamos el rojo después de 800ms para que sea solo un "parpadeo" de advertencia
      setTimeout(() => {
        this.validarAnio(this.anexoFormulario.anio);
        this.cdr.detectChanges();
      }, 800);
    }
  }

  validarAnio(valor: any) {
    if (!valor) {
      this.anexoFormulario.anio = '';
      this.errorAnio = false;
      return;
    }

    const valorLimpio = String(valor).replace(/\D/g, '');
    this.anexoFormulario.anio = valorLimpio;
    
    if (valorLimpio.length > 0) {
      const numAnio = parseInt(valorLimpio, 10);
      this.errorAnio = valorLimpio.length < 4 || numAnio < 1900 || numAnio > 2100;
    } else {
      this.errorAnio = false;
    }
  }
guardarFormulario() {
    // 1. VALIDACIONES RESTAURADAS (Aquí estaba el error, ¡volvieron los rojos!)
    this.errorNombre = !this.anexoFormulario.nombre || this.anexoFormulario.nombre.trim() === '';
    this.errorCatPrin = !this.anexoFormulario.categoriaPrincipal || this.anexoFormulario.categoriaPrincipal.trim() === '';
    this.errorCatSec = !this.anexoFormulario.categoriaSecundaria || this.anexoFormulario.categoriaSecundaria.trim() === '';

    // Si falta algo, detenemos el guardado y mostramos los errores en pantalla
    if (this.errorNombre || this.errorCatPrin || this.errorCatSec || this.errorAnio) {
      this.cdr.detectChanges(); 
      return;
    }

    this.guardando = true;
    this.cdr.detectChanges();

    const datosParaGuardar: any = {
      nombre: this.anexoFormulario.nombre,
      anio: this.anexoFormulario.anio,
      categoriaPrincipal: this.anexoFormulario.categoriaPrincipal,
      categoriaSecundaria: this.anexoFormulario.categoriaSecundaria,
      descripcion: this.anexoFormulario.descripcion
    };

    if (this.anexoFormulario.id) { 
      datosParaGuardar.id = this.anexoFormulario.id; 
    }

    const obs = this.anexoFormulario.id 
      ? this.anexoService.actualizarAnexo(this.anexoFormulario.id, datosParaGuardar)
      : this.anexoService.guardarAnexo(datosParaGuardar);

    obs.subscribe({
      next: (res: any) => {
        const idReal = this.anexoFormulario.id || res.id;
        const idStr = String(idReal);

        // --- UX: RESURRECCIÓN DE DESCARTADOS ---
        this.idsOcultosActualizados = this.idsOcultosActualizados.filter(id => id !== idStr);

        // --- UX: SINCRONIZACIÓN INMEDIATA ---
        if (this.anexoFormulario.id) {
          const index = this.anexos.findIndex(a => String(a.id) === idStr);
          if (index !== -1) { 
            this.anexos[index] = { ...this.anexos[index], ...datosParaGuardar }; 
          }
        } else {
          this.anexos.push(res);
        }

        // --- UX: MEMORIA EN DISCO DURO ---
        const memoriaTiempos = JSON.parse(localStorage.getItem('memoriaAnexosUX') || '{}');
        memoriaTiempos[idStr] = Date.now();
        localStorage.setItem('memoriaAnexosUX', JSON.stringify(memoriaTiempos));

        // Refrescamos la tabla y el dashboard
        this.buscar(this.filtroActualTexto, this.filtroActualCatPrin, this.filtroActualCatSec, this.filtroActualAnio);

        // --- LÓGICA DEL ARCHIVO FÍSICO ---
        if (this.archivoSeleccionado && (this.modoFormulario === 'crear' || this.archivoModificado)) {
          this.anexoService.subirArchivoFisico(idReal, this.archivoSeleccionado).subscribe({
            next: () => this.finalizarGuardado('Cambios y documento guardados.'),
            error: () => this.finalizarGuardado('Datos guardados, pero falló el archivo.')
          });
        } else {
          this.finalizarGuardado('¡Cambios guardados correctamente!');
        }
      },
      error: () => { 
        this.guardando = false; 
        this.cdr.detectChanges(); 
      }
    });
  }
  finalizarGuardado(mensaje: string) {
    this.cargarAnexosDesdeBD(); // Refrescamos la tabla
    this.guardando = false;
    this.modalFormVisible = false;
    this.toastExitoVisible = true;
    this.mensajeExito = mensaje;
    this.cdr.detectChanges();

    setTimeout(() => {
      this.toastExitoVisible = false;
      this.cdr.detectChanges();
    }, 4000);
  }
  

  // 1. Agrega esta variable justo arriba del método para guardar la URL segura
  urlPdfReal: any = null; 
  errorArchivo = false;

abrirPdf(anexo: any) {
    this.anexoViendoPdf = anexo;
    this.cargandoPdf = true;
    this.modalPdfVisible = true;
    
    // 1. Limpiamos TODO rastro del documento anterior
    this.errorArchivo = false;
    this.urlPdfReal = null; 

    // Usamos el servicio seguro para traer el archivo con nuestro Token
    this.anexoService.verArchivoFisico(anexo.id).subscribe({
      next: (blob: Blob) => {
        
        // --- ¡EL BLINDAJE DE UX ESTÁ AQUÍ! ---
        // Verificamos si el archivo está vacío (0 bytes) o si el servidor nos mandó un error en formato texto/json por accidente
        if (!blob || blob.size === 0 || blob.type.includes('text') || blob.type.includes('json')) {
          console.warn('El archivo está registrado pero físicamente vacío o corrupto en el servidor.');
          this.cargandoPdf = false;
          this.errorArchivo = true; // Forzamos nuestro Empty State bonito
          this.cdr.detectChanges();
          return; // Abortamos para que no cargue el iframe roto
        }
        // ------------------------------------

        // Si pasó la aduana, armamos la URL mágica
        const objectUrl = URL.createObjectURL(blob);
        this.urlPdfReal = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
        
        this.cargandoPdf = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar el PDF', err);
        this.cargandoPdf = false;
        this.errorArchivo = true; // Forzamos nuestro Empty State bonito
        this.cdr.detectChanges();
      }
    });
  }
  cerrarPdf() {
    this.modalPdfVisible = false;
    this.anexoViendoPdf = null;
  }

// UX: Permite múltiples descargas concurrentes (Apilamiento dinámico)
  descargarPdfRapido(anexoDesdeTabla: any = null) {
    const anexoADescargar = anexoDesdeTabla || this.anexoViendoPdf;
    if (!anexoADescargar) return;

    // CREAMOS UNA NOTIFICACIÓN ÚNICA PARA ESTA ACCIÓN
    const idNotificacion = Date.now(); 
    const nuevaNotificacion = {
      id: idNotificacion,
      estado: 'iniciada',
      nombre: anexoADescargar.nombre
    };

    // LA AGREGAMOS A LA LISTA 
    this.listaNotificacionesDescarga.push(nuevaNotificacion);
    this.cdr.detectChanges();

    this.anexoService.verArchivoFisico(anexoADescargar.id).subscribe({
      next: (blob: Blob) => {
        const index = this.listaNotificacionesDescarga.findIndex(n => n.id === idNotificacion);
        if (index === -1) return; 

        // Blindaje anti-0 bytes
        if (!blob || blob.size === 0 || blob.type.includes('text') || blob.type.includes('json')) {
          this.listaNotificacionesDescarga[index].estado = 'error_vacio';
          this.cdr.detectChanges();
          this.iniciarTemporizadorRemover(idNotificacion, 3500); 
          return;
        }

        // Descarga real
        const url = window.URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        const nombreLimpio = anexoADescargar.nombre.replace(/[^a-zA-Z0-9 -]/g, ""); 
        enlace.download = `${nombreLimpio}.pdf`;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        
        // --- LA MAGIA ESTÁ AQUÍ ---
        // Retrasamos la limpieza de la memoria para que el gestor de descargas de Chrome reaccione
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
        // ---------------------------

        // Actualizamos NUESTRA notificación a finalizada
        this.listaNotificacionesDescarga[index].estado = 'finalizada';
        this.cdr.detectChanges();
        this.iniciarTemporizadorRemover(idNotificacion, 3000);
      },
      error: (err: any) => {
        console.error('Error en descarga', err);
        const index = this.listaNotificacionesDescarga.findIndex(n => n.id === idNotificacion);
        if (index !== -1) {
          this.listaNotificacionesDescarga[index].estado = 'error_vacio';
          this.cdr.detectChanges();
          this.iniciarTemporizadorRemover(idNotificacion, 3500);
        }
      }
    });
  }

  // Ayudante para limpiar notificaciones específicas de la lista
  private iniciarTemporizadorRemover(id: number, tiempo: number) {
    setTimeout(() => {
      this.listaNotificacionesDescarga = this.listaNotificacionesDescarga.filter(n => n.id !== id);
      this.cdr.detectChanges();
    }, tiempo);
  }
  // UX: Divulgación Progresiva - Mostrar detalles del contador
  // UX: Divulgación Progresiva - Mostrar detalles del contador
// UX: Divulgación Progresiva - Mostrar detalles del contador
  // UX: Divulgación Progresiva - Mostrar detalles del contador
abrirModalActualizados() {
    const memoriaTiempos = JSON.parse(localStorage.getItem('memoriaAnexosUX') || '{}');
    const treintaDiasEnMs = 30 * 24 * 60 * 60 * 1000;
    const ahora = Date.now();

    this.anexosRecientes = this.anexos.filter(a => {
      const idStr = String(a.id);
      const tiempoEdicion = memoriaTiempos[idStr] || 0;
      const esCambioReciente = (ahora - tiempoEdicion) < treintaDiasEnMs && tiempoEdicion > 0;
      const esAnioNuevo = parseInt(a.anio, 10) >= 2022;

      return (esAnioNuevo || esCambioReciente) && !this.idsOcultosActualizados.includes(idStr);
    }).sort((a, b) => {
      const tA = memoriaTiempos[String(a.id)] || 0;
      const tB = memoriaTiempos[String(b.id)] || 0;
      return tB - tA || parseInt(b.id) - parseInt(a.id);
    });

    this.modalActualizadosVisible = true;
  }
  cerrarModalActualizados() {
    this.modalActualizadosVisible = false;
  }
// Heurística #3: Control y Libertad del Administrador
 // Heurística #3: Control y Libertad del Administrador
  quitarDeActualizados(anexo: any) {
    const ocultos = this.idsOcultosActualizados;
    ocultos.push(String(anexo.id));
    this.idsOcultosActualizados = ocultos;

    this.anexosRecientes = this.anexosRecientes.filter(a => String(a.id) !== String(anexo.id));
    this.actualizarDashboard();

    // UX: Agregamos a la pila y reiniciamos el reloj
    this.descartadosRecientes.push(anexo);
    this.toastDescarteVisible = true;
    this.tiempoDescarte = 5;

    if (this.contadorDescarteId) window.clearInterval(this.contadorDescarteId);
    this.ngZone.runOutsideAngular(() => {
      this.contadorDescarteId = window.setInterval(() => {
        this.ngZone.run(() => {
          this.tiempoDescarte--;
          if (this.tiempoDescarte <= 0) {
            window.clearInterval(this.contadorDescarteId);
            this.toastDescarteVisible = false;
            this.descartadosRecientes = []; // Vaciamos la memoria temporal al terminar el tiempo
          }
          this.cdr.detectChanges();
        });
      }, 1000);
    });
  }

  // UX: Ctrl+Z para múltiples descartes (Pila LIFO)
  deshacerDescarte() {
    if (this.descartadosRecientes.length > 0) {
      // Sacamos el ÚLTIMO anexo que descartaste
      const recuperado = this.descartadosRecientes.pop();
      
      // Lo sacamos de la lista negra
      const ocultos = this.idsOcultosActualizados.filter(id => id !== String(recuperado.id));
      this.idsOcultosActualizados = ocultos;
      
      this.actualizarDashboard();
      if (this.modalActualizadosVisible) {
        this.abrirModalActualizados(); 
      }

      // Si ya vaciamos la pila, apagamos el Toast
      if (this.descartadosRecientes.length === 0) {
        this.toastDescarteVisible = false;
        if (this.contadorDescarteId) window.clearInterval(this.contadorDescarteId);
      } else {
        // Si aún quedan, reiniciamos el reloj para que respires
        this.tiempoDescarte = 5;
      }
      
      this.cdr.detectChanges();
    }
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