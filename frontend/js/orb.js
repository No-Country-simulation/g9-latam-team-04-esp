// TechMind — orb.js
// Loader "thinking orb": esfera de nodos conectados tipo red neuronal.
// Portado a canvas 2D puro (sin librerías) inspirado en el efecto de
// https://github.com/Jakubantalik/thinking-orbs (MIT): constelación que
// se teje y rota despacio. Respeta el tema activo y prefers-reduced-motion.

(function () {
  "use strict";

  // MATEMÁTICAS 3D Y DISTRIBUCIÓN
  function fibonacciSphere(n) {
    // Distribuye los puntos (nodos) de manera uniforme sobre una esfera utilizando la espiral de Fibonacci.
    const pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5)); // Ángulo áureo
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;       // Rango de -1 a 1 (altura en Y)
      const radius = Math.sqrt(1 - y * y);
      const theta = golden * i;
      pts.push({
        x: Math.cos(theta) * radius,
        y,
        z: Math.sin(theta) * radius,
        // phase: crea una desincronización individual para que los nodos palpiten o se conecten en distintos momentos.
        phase: (i / n) * Math.PI * 2,
      });
    }
    return pts;
  }

  function rotateY(p, angle) {
    // Rota un punto 3D sobre el eje Y para generar la ilusión de giro.
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: p.x * cos + p.z * sin,
      y: p.y,
      z: -p.x * sin + p.z * cos,
    };
  }

  // CREACIÓN DEL ORB Y CONFIGURACIÓN
  function create(options = {}) {
    // Parámetros por defecto sobreescritos por las opciones pasadas desde tu app
    const {
      size = 110,               // Tamaño total del canvas (ancho y alto)
      nodeCount = 22,           // Cantidad total de puntos (vértices)
      linkDistance = 1.3,       // Distancia máxima para que dos puntos se conecten con una línea
      speed = 1,                // Velocidad de rotación base
      lineWidth = 1.6,          // Grosor de las líneas conectoras
      nodeRadiusBase = 2.0,     // Tamaño mínimo de los nodos
      nodeRadiusMax = 4.5,      // Tamaño máximo (cuando están al frente)
      // Colores por defecto, pero se pueden sobreescribir al crear la instancia
      colorNodeDefault = "187, 250, 50", // Color fallback para vértices (si no hay CSS var)
      colorLinkDefault = "138, 138, 138" // Color fallback para aristas
    } = options;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(2, window.devicePixelRatio || 1); // Escala para pantallas Retina

    // Configuración inicial del canvas
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Procesando");
    canvas.setAttribute("aria-hidden", "true");

    ctx.scale(dpr, dpr);

    const pts = fibonacciSphere(nodeCount);
    const R = size * 0.38; // El radio real de la esfera respecto al tamaño del canvas
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches; // Accesibilidad

    // LECTURA DE COLORES DINÁMICOS
    function themeColors() {
      const cs = getComputedStyle(document.documentElement);
      
      // Detecta si el tema activo es 'light' (por la clase o el atributo data-theme)
      const isLight = document.documentElement.getAttribute("data-theme") === "light" ||
                      document.documentElement.classList.contains("light");

      const parseColor = (prop, fallback) => {
        const val = cs.getPropertyValue(prop).trim();
        return val ? val.replace(/\s+/g, ", ") : fallback;
      };

      if (isLight) {
        // EN MODO CLARO (Fondo blanco --c-coal / --c-paper)
        // Nodos: --c-volt (#7bac00 verde lima denso)
        // Aristas: --c-paper (#0b0b0b) o --c-muted (#6a6a64) para máximo contraste
        return {
          node: options.customColorNode || parseColor("--c-volt", "11, 11, 11"),
          link: options.customColorLink || parseColor("--c-paper", "106, 106, 100"), // O usa --c-muted para aristas suaves
        };
      } else {
        // EN MODO OSCURO (Fondo oscuro --c-coal / --c-void)
        // Nodos: --c-volt (#BBFA32 Electric Lime)
        // Aristas: --c-paper (#FFFFFF) o --c-muted (#8a8a8a) para alto brillo
        return {
          node: options.customColorNode || parseColor("--c-volt", "31, 31, 31"),
          link: options.customColorLink || parseColor("--c-muted", "138, 138, 138"),
        };
      }
    }

    let angle = 0;
    let rafId = 0;
    let running = false;
    let lastTime = 0;

    // EL MOTOR DE DIBUJO (RENDER LOOP)
    function draw() {
      const colors = themeColors();
      const cx = size / 2; // Centro en X
      const cy = size / 2; // Centro en Y
      
      ctx.clearRect(0, 0, size, size); // Limpia el frame anterior

      // Proyecta los puntos 3D rotados hacia el plano 2D
      const projected = pts.map((p) => rotateY(p, angle));

      // Dibuja Capa 1: ARISTAS (Conexiones entre puntos cercanos)
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          
          // Calcula distancia en 3D
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dz = a.z - b.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          // Solo conecta si están cerca
          if (dist > linkDistance) continue;

          // Efecto de "onda" o destello para que las líneas aparezcan y desaparezcan
          const wave = (Math.sin((angle * 2.2 + dist * 3.2 + (i + j)) * 0.9) + 1) / 2;
          const alpha = wave * (1 - dist / linkDistance) * 0.85;

          const x1 = cx + a.x * R;
          const y1 = cy + a.y * R;
          const x2 = cx + b.x * R;
          const y2 = cy + b.y * R;

          ctx.strokeStyle = `rgba(${colors.link}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = lineWidth;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Dibuja Capa 2: VÉRTICES (Nodos / Puntos)
      projected.forEach((p, i) => {
        // 'depth' determina qué tan adelante o atrás está el punto. (0 = atrás, 1 = adelante)
        const depth = (p.z + 1) / 2; 
        
        // Calcula el radio dinámico basado en la profundidad (los de enfrente son más grandes)
        const r = nodeRadiusBase + depth * (nodeRadiusMax - nodeRadiusBase); 
        
        // Efecto de pulso ligero utilizando la 'fase' individual
        const pulse = 0.7 + 0.3 * Math.sin(angle * 3 + pts[i].phase);

        // Los puntos de atrás son más transparentes
        ctx.fillStyle = `rgba(${colors.node}, ${(0.65 + depth * 0.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx + p.x * R, cy + p.y * R, r * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // Dibuja Capa 3: Anillo Exterior (Opcional, de referencia)
      ctx.strokeStyle = `rgba(${colors.link}, 0.20)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
    }

    // CONTROL DE ANIMACIÓN
    function frame(ts) {
      if (!canvas.isConnected || !running) {
        running = false;
        return;
      }
      const dt = lastTime ? (ts - lastTime) / 1000 : 0.016;
      lastTime = ts;
      
      // Ajusta el multiplicador 0.30 para cambiar la sensación de velocidad base
      angle += 0.30 * speed * Math.min(dt, 0.05); 
      
      draw();
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

    function start() {
      if (reduced) {
        angle = 0.9; // Deja el orb en una posición representativa estática
        draw();
        return;
      }
      running = true;
      lastTime = 0;
      rafId = requestAnimationFrame(frame);
    }

    // Retorna los métodos para interactuar con el componente
    return { canvas, start, stop, draw };
  }

  // Expone la función constructora globalmente
  window.TechMindOrb = { create };
})();