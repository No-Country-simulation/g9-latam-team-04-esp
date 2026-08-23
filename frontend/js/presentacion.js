// TechMind — presentacion.js
// Modal de presentación para la demo: slides HTML navegables (←/→), abrir
// con la tecla "P" o el botón del header, cerrar con ESC, X o clic afuera.
// Cada slide es HTML editable acá mismo; si algún día se exportan slides del
// PPTX como imágenes, basta reemplazar el innerHTML de un slide por <img>.

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const SLIDES = [
    {
      title: "TechMind",
      html: `
        <div class="flex flex-col items-center text-center">
          <img src="assets/logos/techmind.png" alt="TechMind" class="logo-invert h-16 lg:h-24 w-auto object-contain mb-6">
          <h2 class="text-[28px] lg:text-[40px] font-semibold tracking-[-1px] text-paper">El cerebro que entiende tu contenido técnico.</h2>
          <p class="mt-2 text-[18px] lg:text-[24px] text-muted">La API, lo comparte!</p>
          <p class="mt-8 text-[11px] font-semibold uppercase tracking-[0.5px] text-volt">Generación 9 · Team 04</p>
        </div>`,
    },
    {
      title: "El problema",
      html: `
        <div class="max-w-3xl">
          <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Problema</span>
          <h2 class="mt-4 text-[22px] lg:text-[30px] font-semibold tracking-[-0.5px] text-paper">Dolor: Demasiado conocimiento técnico sin organizar</h2>
          <ul class="my-6 space-y-3 text-[18px] leading-relaxed text-muted">
            <li class="flex gap-3">¿Sabían que un profesional o estudiante de tecnología pasa un tiempo importante de su semana buscando, desenterrando y releyendo documentación dispersa para resolver problemas que alguien en su equipo ya resolvió?</li>
          </ul>
          <!-- Lista de Bloques Horizontales (Filas) -->
          <div class="space-y-3.5">
            
            <!-- Bloque 1: Tiempo Perdido -->
            <div class="p-4 lg:p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-volt/30 transition-all duration-300 flex items-center justify-center gap-4">
              <!-- Círculo con 20% -->
              <div class="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-volt/10 border border-volt/20 flex items-center justify-center shrink-0">
                <span class="text-[18px] lg:text-[20px] font-bold text-volt">20%</span>
              </div>
              <!-- Contenido -->
              <div class="flex-1">
                <h3 class="text-[16px] lg:text-[18px] font-semibold text-paper flex items-center gap-2 flex-wrap">
                  Tiempo perdido 
                  <span class="text-[12px] lg:text-[13px] font-normal text-muted">(en la semana buscando soluciones)</span>
                </h3>
                <ul class="mt-2 space-y-1 text-[12px] lg:text-[13px] text-muted leading-relaxed">
                  <li class="flex items-start gap-2">
                    <span class="text-volt">•</span>
                    <span>Se guarda documentación, tutoriales y notas en todos lados.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-volt">•</span>
                    <span>Clasificar, encontrar y reutilizar ese conocimiento lleva horas.</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Bloque 2: Reinvención de la rueda -->
            <div class="p-4 lg:p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-volt/30 transition-all duration-300 flex items-center justify-center gap-4">
              <!-- Icono Capas / Stack -->
              <div class="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-volt/10 border border-volt/20 flex items-center justify-center text-volt shrink-0">
                <svg class="w-6 h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
              </div>
              <!-- Contenido -->
              <div class="flex-1">
                <h3 class="text-[16px] lg:text-[18px] font-semibold text-paper flex items-center gap-2 flex-wrap">
                  Reinvención de la rueda
                </h3>
                <ul class="mt-2 space-y-1 text-[12px] lg:text-[13px] text-muted leading-relaxed">
                  <li class="flex items-start gap-2">
                    <span class="text-volt">•</span>
                    <span>Varios miembros del equipo resuelven el mismo problema de forma independiente.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-volt">•</span>
                    <span>Falta de un repositorio centralizado de soluciones probadas.</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Bloque 3: Conocimiento fragmentado -->
            <div class="p-4 lg:p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-volt/30 transition-all duration-300 flex items-center justify-center gap-4">
              <!-- Icono Documentos dispersos / Caos (SVG) -->
              <div class="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-volt/10 border border-volt/20 flex items-center justify-center text-volt shrink-0">
                <svg class="w-6 h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <!-- Contenido -->
              <div class="flex-1">
                <h3 class="text-[16px] lg:text-[18px] font-semibold text-paper">
                  Conocimiento fragmentado
                  <span class="text-[12px] lg:text-[13px] font-normal text-muted">(Sin Metadatos)</span>
                </h3>
                <ul class="mt-2 space-y-1 text-[12px] lg:text-[13px] text-muted leading-relaxed">
                  <li class="flex items-start gap-2">
                    <span class="text-volt">•</span>
                    <span>La documentación vive dispersa en artículos, tutoriales, apuntes o repositorios olvidados.</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-volt">•</span>
                    <span>Cuando un desarrollador clave se va, el contexto técnico se pierde con él.</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>`,
    },
    {
      title: "Nuestra Solución",
      html: `
        <div class="max-w-4xl w-full mx-auto space-y-6">
          <!-- Badge & Título de Sección -->
          <div class="flex items-center justify-between">
            <div>
              <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Solución</span>
              <h2 class="mt-2 text-[24px] lg:text-[32px] font-semibold tracking-[-0.5px] text-paper">Nuestra Solución</h2>
            </div>
            <a href="http://144.22.60.240:8000/" target="_blank" class="hidden sm:inline-flex items-center gap-1.5 text-[12px] font-mono text-volt/80 hover:text-volt bg-volt/5 border border-volt/15 px-3 py-1.5 rounded-lg transition-colors">
              <span>http://144.22.60.240:8000/</span>
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
          </div>

          <!-- Diagrama de Arquitectura / Flujo -->
          <div class="p-4 lg:p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div class="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
              <!-- Cliente -->
              <div class="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 w-full">
                <div class="flex items-center justify-center text-volt mb-2 text-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 17H8C5.17157 17 3.75736 17 2.87868 16.1213C2 15.2426 2 13.8284 2 11V9C2 6.17157 2 4.75736 2.87868 3.87868C3.75736 3 5.17157 3 8 3H16C18.8284 3 20.2426 3 21.1213 3.87868C21.9466 4.70398 21.9968 6.00173 21.9998 8.5"></path>
                      <path d="M16 14V18C16 19.4142 16 20.1213 16.4393 20.5607C16.8787 21 17.5858 21 19 21C20.4142 21 21.1213 21 21.5607 20.5607C22 20.1213 22 19.4142 22 18V14C22 12.5858 22 11.8787 21.5607 11.4393C21.1213 11 20.4142 11 19 11C17.5858 11 16.8787 11 16.4393 11.4393C16 11.8787 16 12.5858 16 14Z"></path>
                      <path d="M10 21H8M10 21C10.8284 21 11.5 20.3284 11.5 19.5V17L12 17M10 21H12.5V17L12 17M12 17V21"></path>
                  </svg>
                </div>
                <p class="text-[13px] font-semibold text-paper">Cliente Web / App</p>
              </div>

              <!-- Flechas & Protocolo -->
              <div class="flex flex-col items-center px-2">
                <span class="text-[10px] font-mono font-bold tracking-wider text-volt bg-volt/10 px-2.5 py-0.5 rounded-full mb-1">GET / POST / PUT / DELETE</span>
                <div class="flex items-center gap-2 text-muted text-xs">
                  <span>← JSON / HTTP →</span>
                </div>
              </div>

              <!-- REST API Cloud -->
              <div class="flex-1 p-3 rounded-xl bg-volt/10 border border-volt/30 w-full">
                <div class="flex items-center justify-center text-volt mb-2 text-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.4776 10.0001C17.485 10 17.4925 10 17.5 10C19.9853 10 22 12.0147 22 14.5C22 16.9853 19.9853 19 17.5 19H7C4.23858 19 2 16.7614 2 14C2 11.4003 3.98398 9.26407 6.52042 9.0227M17.4776 10.0001C17.4924 9.83536 17.5 9.66856 17.5 9.5C17.5 6.46243 15.0376 4 12 4C9.12324 4 6.76233 6.20862 6.52042 9.0227M17.4776 10.0001C17.3753 11.1345 16.9286 12.1696 16.2428 13M6.52042 9.0227C6.67826 9.00768 6.83823 9 7 9C8.12582 9 9.16474 9.37209 10.0005 10"></path>
                  </svg>
                </div>
                <p class="text-[13px] font-semibold text-volt">REST API Central</p>
                <p class="text-[10px] text-muted font-mono">{ ... }</p>
              </div>

              <!-- Flecha DB -->
              <div class="text-muted text-xs">⇄</div>

              <!-- Base de Datos -->
              <div class="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 w-full">
                <div class="flex items-center justify-center text-volt mb-2 text-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none" stroke="currentColor" stroke-width="1.5">
                      <ellipse cx="12" cy="5" rx="8" ry="3"></ellipse>
                      <path d="M7 10.842C7.60158 11.0229 8.27434 11.1718 9 11.282" stroke-linecap="round"></path>
                      <path d="M20 12C20 13.6569 16.4183 15 12 15C7.58172 15 4 13.6569 4 12"></path>
                      <path d="M7 17.842C7.60158 18.0229 8.27434 18.1718 9 18.282" stroke-linecap="round"></path>
                      <path d="M20 5V19C20 20.6569 16.4183 22 12 22C7.58172 22 4 20.6569 4 19V5"></path>
                  </svg>
                </div>
                <p class="text-[13px] font-semibold text-paper">Base de Datos</p>
              </div>
            </div>
          </div>

          <!-- Grid de 3 Pilares -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Pilar 1 -->
            <div class="p-4 rounded-xl bg-white/5 border border-white/10 border-l-2 border-l-volt">
              <h3 class="text-[15px] font-semibold text-paper mb-2">Organización Automatizada</h3>
              <p class="text-[12px] text-muted leading-relaxed">
                Procesamiento inteligente de textos técnicos no estructurados mediante modelos NLP que clasifican categorías y extraen tags semánticos.
              </p>
            </div>

            <!-- Pilar 2 -->
            <div class="p-4 rounded-xl bg-white/5 border border-white/10 border-l-2 border-l-volt">
              <h3 class="text-[15px] font-semibold text-paper mb-2">Consumo mediante API REST</h3>
              <p class="text-[12px] text-muted leading-relaxed">
                Puerta de entrada con arquitectura desacoplada y endpoints estandarizados para integrarse con plataformas EdTech, repositorios corporativos y dashboards.
              </p>
            </div>

            <!-- Pilar 3 -->
            <div class="p-4 rounded-xl bg-white/5 border border-white/10 border-l-2 border-l-volt">
              <h3 class="text-[15px] font-semibold text-paper mb-2">Infra OCI - Compute</h3>
              <p class="text-[12px] text-muted leading-relaxed">
                Despliegue y gestión en la nube sobre infraestructura Oracle, con recursos flexibles desde apps web básicas hasta supercómputo e IA.
              </p>
            </div>
          </div>

          <!-- Bloque de Contribución e Impacto -->
          <div class="p-4 rounded-xl bg-volt/5 border border-volt/20">
            <h4 class="text-[12px] uppercase font-bold tracking-wider text-volt mb-3 flex items-center gap-2">
              Contribución & Impacto
            </h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
              <div class="p-2.5 rounded-lg bg-black/20 border border-white/5">
                <p class="text-[20px] font-bold text-volt">-67%</p>
                <p class="text-[11px] text-muted mt-0.5">Tiempo de búsqueda</p>
              </div>
              <div class="p-2.5 rounded-lg bg-black/20 border border-white/5">
                <p class="text-[20px] font-bold text-volt">+20%</p>
                <p class="text-[11px] text-muted mt-0.5">Productividad global</p>
              </div>
              <div class="p-2.5 rounded-lg bg-black/20 border border-white/5">
                <p class="text-[20px] font-bold text-volt">Clasificación</p>
                <p class="text-[11px] text-muted mt-0.5">Repositorio centralizado</p>
              </div>
              <div class="p-2.5 rounded-lg bg-black/20 border border-white/5">
                <p class="text-[20px] font-bold text-volt">Automático</p>
                <p class="text-[11px] text-muted mt-0.5">Reentrenamiento continuo</p>
              </div>
            </div>
          </div>
        </div>`,
    },
    {
      title: "Capacidades Principales",
      html: `
        <div class="max-w-3xl w-full mx-auto">
          <!-- Encabezado de la Slide -->
          <div class="text-center mb-8">
            <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Machine Learning</span>
            <h2 class="mt-3 text-[26px] lg:text-[34px] font-semibold tracking-[-0.5px] text-paper">Capacidades Principales del Modelo</h2>
            <p class="mt-1 text-[13px] lg:text-[15px] text-muted">Motor de procesamiento del lenguaje adaptado a conocimiento técnico.</p>
          </div>

          <!-- Grid con las 3 Funcionalidades Principales -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <!-- Tarjeta 1: Clasificación Temática -->
            <div class="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-volt/40 transition-all duration-300 flex flex-col items-center text-center">
              <div class="w-12 h-12 rounded-xl bg-volt/10 border border-volt/20 flex items-center justify-center text-volt mb-4 group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
              </div>
              <h3 class="text-[16px] font-semibold text-paper mb-2">Clasificación Temática</h3>
              <p class="text-[13px] text-muted leading-relaxed">
                Categoriza automáticamente textos crudos en dominios clave como Backend, Frontend, DevOps y Cloud Native.
              </p>
            </div>

            <!-- Tarjeta 2: Extracción de Keywords -->
            <div class="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-volt/40 transition-all duration-300 flex flex-col items-center text-center">
              <div class="w-12 h-12 rounded-xl bg-volt/10 border border-volt/20 flex items-center justify-center text-volt mb-4 group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z"/>
                </svg>
              </div>
              <h3 class="text-[16px] font-semibold text-paper mb-2">Extracción de Keywords</h3>
              <p class="text-[13px] text-muted leading-relaxed">
                Identifica tecnologías clave, frameworks y conceptos indispensables dentro del documento.
              </p>
            </div>

            <!-- Tarjeta 3: Score de Confianza -->
            <div class="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-volt/40 transition-all duration-300 flex flex-col items-center text-center">
              <div class="w-12 h-12 rounded-xl bg-volt/10 border border-volt/20 flex items-center justify-center text-volt mb-4 group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <h3 class="text-[16px] font-semibold text-paper mb-2">Score de Confianza</h3>
              <p class="text-[13px] text-muted leading-relaxed">
                Calcula la probabilidad matemática de pertenencia para garantizar decisiones informadas y precisas.
              </p>
            </div>
          </div>
        </div>`,
    },
    {
      title: "Cómo funciona el modelo",
      html: `
        <div class="max-w-3xl w-full mx-auto">
          <div class="text-center mb-8">
            <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Machine Learning</span>
            <h2 class="mt-3 text-[26px] lg:text-[34px] font-semibold tracking-[-0.5px] text-paper">Cómo funciona el modelo</h2>
            <p class="mt-1 text-[13px] lg:text-[15px] text-muted">Compara patrones aprendidos de contenido real.</p>
          </div>

          <!-- Pipeline -->
          <div class="flex flex-wrap items-center justify-center gap-2 text-[11px] lg:text-[12px] font-mono">
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted">texto</span>
            <span class="text-volt">→</span>
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted">limpieza</span>
            <span class="text-volt">→</span>
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted">TF-IDF</span>
            <span class="text-volt">→</span>
            <span class="px-3 py-1.5 rounded-lg bg-volt/10 border border-volt/30 text-volt">Regresión Logística</span>
            <span class="text-volt">→</span>
            <span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted">categoría + confianza</span>
          </div>

          <!-- Puntos clave -->
          <div class="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
              <h3 class="text-[15px] font-semibold text-paper mb-3">Entrenado con datos reales</h3>
              <ul class="space-y-2 text-[13px] text-muted">
                <li class="flex gap-2"><span class="text-volt mt-0.5">•</span>60.000+ artículos técnicos (dev.to)</li>
                <li class="flex gap-2"><span class="text-volt mt-0.5">•</span>7 categorías: Backend, Frontend, Cloud, DevOps, Database, Data Eng., Data Science</li>
                <li class="flex gap-2"><span class="text-volt mt-0.5">•</span>Un modelo por idioma (EN / ES)</li>
              </ul>
            </div>
            <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
              <h3 class="text-[15px] font-semibold text-paper mb-3">Con un texto nuevo</h3>
              <ul class="space-y-2 text-[13px] text-muted">
                <li class="flex gap-2"><span class="text-volt mt-0.5">•</span>Se convierte al mismo formato numérico</li>
                <li class="flex gap-2"><span class="text-volt mt-0.5">•</span>Se compara contra los patrones aprendidos</li>
                <li class="flex gap-2"><span class="text-volt mt-0.5">•</span>Elige la categoría a la que más se parece</li>
              </ul>
            </div>
          </div>
        </div>`,
    },
    {
      title: "Clasificación y keywords",
      html: `
        <div class="max-w-3xl w-full mx-auto">
          <div class="text-center mb-8">
            <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Machine Learning</span>
            <h2 class="mt-3 text-[26px] lg:text-[34px] font-semibold tracking-[-0.5px] text-paper">Clasifica y extrae keywords</h2>
            <p class="mt-1 text-[13px] lg:text-[15px] text-muted">Dos capacidades, un mismo criterio: lo distintivo importa.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Clasificación -->
            <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div class="w-10 h-10 rounded-xl bg-volt/10 border border-volt/20 flex items-center justify-center text-volt mb-3">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
              </div>
              <h3 class="text-[15px] font-semibold text-paper">Clasificación temática</h3>
              <ul class="mt-3 space-y-2 text-[13px] text-muted">
                <li class="flex gap-2"><span class="text-volt mt-0.5">•</span>Detecta palabras típicas de cada categoría</li>
                <li class="flex gap-2"><span class="text-volt mt-0.5">•</span>Asigna la categoría más parecida</li>
                <li class="flex gap-2"><span class="text-volt mt-0.5">•</span>7 categorías técnicas, una por contenido</li>
              </ul>
            </div>

            <!-- Keywords -->
            <div class="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div class="w-10 h-10 rounded-xl bg-volt/10 border border-volt/20 flex items-center justify-center text-volt mb-3">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z"/></svg>
              </div>
              <h3 class="text-[15px] font-semibold text-paper">Extracción de keywords</h3>
              <ul class="mt-3 space-y-2 text-[13px] text-muted">
                <li class="flex gap-2"><span class="text-volt mt-0.5">•</span>No las más repetidas: las más distintivas</li>
                <li class="flex gap-2"><span class="text-volt mt-0.5">•</span>"el" no dice nada — "PostgreSQL" sí</li>
                <li class="flex gap-2"><span class="text-volt mt-0.5">•</span>Explican el porqué de la decisión</li>
              </ul>
            </div>
          </div>

          <!-- Técnica en una línea -->
          <div class="mt-4 p-4 rounded-xl bg-volt/5 border border-volt/20">
            <p class="text-[13px] text-muted text-center">
              <span class="text-volt font-semibold">TF-IDF:</span> pesa más lo <span class="text-paper font-medium">raro pero revelador</span>, menos lo común.
            </p>
          </div>
        </div>`,
    },
    {
      title: "Score de confianza",
      html: `
        <div class="max-w-2xl w-full mx-auto text-center">
          <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Machine Learning</span>
          <h2 class="mt-3 text-[26px] lg:text-[34px] font-semibold tracking-[-0.5px] text-paper">El modelo nunca responde a ciegas</h2>

          <!-- Destaque puntual: la demo en video muestra el detalle -->
          <div class="mt-8">
            <div class="text-[110px] lg:text-[140px] font-bold leading-none tracking-[-4px] text-volt">65%</div>
            <p class="mt-2 text-[16px] text-paper font-medium">probabilidad estimada — categoría elegida: Backend</p>
          </div>

          <p class="mt-8 text-[13px] text-muted">
            Calcula la probabilidad para las <span class="text-paper font-semibold">7 categorías</span> y devuelve la mayor.
            Confianza baja = contenido ambiguo.
          </p>
        </div>`,
    },
    {
      title: "Momento de la demo",
      html: `
        <div class="flex flex-col items-center justify-center text-center max-w-2xl w-full mx-auto min-h-[55vh]">
          <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt uppercase tracking-[0.3em]">Demo en vivo</span>
          <h2 class="mt-5 text-[30px] lg:text-[42px] font-semibold tracking-[-1px] text-paper leading-tight">Basta de teoría,<br>veamos <span class="text-volt">TechMind</span> en acción</h2>

          <!-- Play button -->
          <div class="mt-10 relative">
            <div class="absolute inset-0 rounded-full bg-volt/30 blur-xl animate-pulse"></div>
            <div class="relative w-24 h-24 rounded-full bg-volt/10 border-2 border-volt/40 flex items-center justify-center">
              <svg class="w-10 h-10 text-volt ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>

          <p class="mt-6 text-[14px] text-muted">La API real, con Oracle en la nube — contenido real, respuestas reales.</p>
        </div>`,
    },
    {
      title: "Arquitectura",
      html: `
        <div class="max-w-2xl">
          <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Arquitectura</span>
          <h2 class="mt-4 text-[22px] lg:text-[30px] font-semibold tracking-[-0.5px] text-paper">FastAPI + Oracle + modelos por idioma</h2>
          <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] text-muted">
            <div class="rounded-[12px] border border-ash bg-coal p-4"><p class="font-semibold text-paper">API</p><p class="mt-1">FastAPI, Pydantic v2, Uvicorn</p></div>
            <div class="rounded-[12px] border border-ash bg-coal p-4"><p class="font-semibold text-paper">Datos</p><p class="mt-1">Oracle Database (wallet/DSN)</p></div>
            <div class="rounded-[12px] border border-ash bg-coal p-4"><p class="font-semibold text-paper">ML</p><p class="mt-1">TF-IDF + Logistic Regression por idioma, embeddings</p></div>
            <div class="rounded-[12px] border border-ash bg-coal p-4"><p class="font-semibold text-paper">Frontend</p><p class="mt-1">SPA vanilla + Tailwind, servida por la misma API</p></div>
            <div class="rounded-[12px] border border-ash bg-coal p-4"><p class="font-semibold text-paper">Infra</p><p class="mt-1">Docker, OCI Compute</p></div>
            <div class="rounded-[12px] border border-ash bg-coal p-4"><p class="font-semibold text-paper">Telemetría</p><p class="mt-1">Métricas en memoria: latencia P95, éxito, tráfico</p></div>
          </div>
        </div>`,
    },
    {
      title: "Demostración en vivo",
      html: `
        <div class="max-w-2xl">
          <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Demo</span>
          <h2 class="mt-4 text-[22px] lg:text-[30px] font-semibold tracking-[-0.5px] text-paper">Veamos TechMind en acción</h2>
          <ul class="mt-6 space-y-3 text-[14px] leading-relaxed text-muted">
            <li class="flex gap-3"><span class="text-volt">1.</span><span><span class="text-paper font-medium">Clasificar</span> — un contenido real, con categoría, confianza y términos clave.</span></li>
            <li class="flex gap-3"><span class="text-volt">2.</span><span><span class="text-paper font-medium">Búsqueda semántica</span> — encontrar por significado, no por palabras exactas.</span></li>
            <li class="flex gap-3"><span class="text-volt">3.</span><span><span class="text-paper font-medium">Correcciones</span> — feedback humano que alimenta el reentrenamiento.</span></li>
            <li class="flex gap-3"><span class="text-volt">4.</span><span><span class="text-paper font-medium">Métricas</span> — la API real en vivo: peticiones, P95, éxito.</span></li>
          </ul>
        </div>`,
    },
    {
      title: "El equipo",
      html: `
        <div class="flex flex-col items-center text-center">
          <span class="rounded-full bg-volt/10 border border-volt/20 px-3 py-1 text-[11px] font-semibold text-volt">Equipo</span>
          <h2 class="mt-4 text-[22px] lg:text-[30px] font-semibold tracking-[-0.5px] text-paper">Ocho personas, una sola misión</h2>
          <p class="mt-2 text-[14px] text-muted">Arquitecto · 2 Data Scientists · BI Analyst · 2 Backend · 2 Full Stack</p>
          <p class="mt-10 text-[12px] text-muted">Membresía completa en la splash del equipo (botón reloj arriba).</p>
        </div>`,
    },
    {
      title: "Gracias",
      html: `
        <div class="flex flex-col items-center text-center">
          <img src="assets/logos/techmind.png" alt="TechMind" class="logo-invert h-14 lg:h-20 w-auto object-contain mb-6">
          <h2 class="text-[26px] lg:text-[38px] font-semibold tracking-[-1px] text-paper">¡Gracias!</h2>
          <p class="mt-2 text-[14px] lg:text-[16px] text-muted">¿Preguntas?</p>
          <p class="mt-8 text-[11px] font-semibold uppercase tracking-[0.5px] text-volt">Generation 9 · Team 04 · No Country</p>
        </div>`,
    },
  ];

  let current = 0;
  let exitBound = false;
  let i18nLabel = "Presentación";

  function t(key) {
    return (window.TechMindI18n && window.TechMindI18n.t(key)) || key;
  }

  function modal() {
    let el = $("#presentacion-modal");
    if (el) return el;
    el = document.createElement("div");
    el.id = "presentacion-modal";
    el.className = "fixed inset-0 z-[80] hidden items-center justify-center bg-void";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML = `
      <div class="pointer-events-none absolute inset-0 presentacion-dotgrid" aria-hidden="true"></div>
      <button type="button" data-pres-close aria-label="Cerrar presentación" title="Cerrar (Esc)"
        class="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-[8px] text-muted transition-colors duration-200 hover:bg-dot hover:text-paper">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18"/>
        </svg>
      </button>
      <div class="relative flex h-full w-full max-w-5xl flex-col px-6 py-6 lg:py-10">
        <div class="flex flex-1 items-center justify-center" id="pres-slide"></div>
        <div class="mt-6 flex items-center justify-between gap-4">
          <button type="button" data-pres-prev aria-label="Anterior"
            class="grid h-10 w-10 place-items-center rounded-full border border-ash text-muted transition-colors duration-200 hover:bg-dot hover:text-paper disabled:opacity-30 disabled:cursor-not-allowed">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>
          </button>
          <p class="text-[12px] font-medium text-muted" id="pres-counter"></p>
          <button type="button" data-pres-next aria-label="Siguiente"
            class="grid h-10 w-10 place-items-center rounded-full border border-ash text-muted transition-colors duration-200 hover:bg-dot hover:text-paper disabled:opacity-30 disabled:cursor-not-allowed">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>`;
    document.body.appendChild(el);
    return el;
  }

  function renderSlide() {
    const el = $("#pres-slide");
    const counter = $("#pres-counter");
    if (!el) return;
    el.innerHTML = SLIDES[current].html;
    if (counter) counter.textContent = `${current + 1} / ${SLIDES.length}`;
    const prev = modal().querySelector("[data-pres-prev]");
    const next = modal().querySelector("[data-pres-next]");
    if (prev) prev.disabled = current <= 0;
    if (next) next.disabled = current >= SLIDES.length - 1;
  }

  function open() {
    const el = modal();
    current = 0;
    renderSlide();
    el.classList.remove("hidden");
    el.classList.add("flex");
    document.body.style.overflow = "hidden";
    bindExit();
  }

  function close() {
    const el = $("#presentacion-modal");
    if (!el || el.classList.contains("hidden")) return;
    el.classList.add("hidden");
    el.classList.remove("flex");
    document.body.style.overflow = "";
  }

  function bindExit() {
    if (exitBound) return;
    exitBound = true;
    const el = modal();
    el.querySelector("[data-pres-close]").addEventListener("click", close);
    el.querySelector("[data-pres-prev]").addEventListener("click", () => {
      if (current > 0) { current--; renderSlide(); }
    });
    el.querySelector("[data-pres-next]").addEventListener("click", () => {
      if (current < SLIDES.length - 1) { current++; renderSlide(); }
    });
    document.addEventListener("keydown", (e) => {
      const visible = !$("#presentacion-modal").classList.contains("hidden");
      if (!visible) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key === "ArrowLeft") { if (current > 0) { current--; renderSlide(); } }
      if (e.key === "ArrowRight") { if (current < SLIDES.length - 1) { current++; renderSlide(); } }
    });
    // Tecla "P" abre la presentación desde cualquier vista.
    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "p" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target;
        const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
        if (!typing) open();
      }
    });
  }

  function syncLabel() {
    i18nLabel = t("presentacion.abrir");
    document.querySelectorAll("[data-pres-label]").forEach((btn) => {
      btn.setAttribute("aria-label", i18nLabel);
      btn.title = i18nLabel;
    });
  }

  function init() {
    document.querySelectorAll("[data-pres-label]").forEach((btn) => {
      btn.addEventListener("click", open);
    });
    if (window.TechMindI18n) {
      syncLabel();
      document.addEventListener("TechMindLang.change", syncLabel);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.TechMindPresentacion = { open, close };
})();
