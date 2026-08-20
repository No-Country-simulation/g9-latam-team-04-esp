# Despliegue de Infraestructura Cloud en OCI — Proyecto Grupo 4

Resumen técnico del proceso de diseño, despliegue y puesta en producción de una aplicación (backend en **FastAPI** + frontend web) sobre **Oracle Cloud Infrastructure (OCI)**.



---

## Tabla de contenidos

- [Despliegue de Infraestructura Cloud en OCI — Proyecto Grupo 4](#despliegue-de-infraestructura-cloud-en-oci--proyecto-grupo-4)
  - [Tabla de contenidos](#tabla-de-contenidos)
  - [1. Infraestructura base en OCI](#1-infraestructura-base-en-oci)
  - [2. Publicación web inicial: Apache y firewall](#2-publicación-web-inicial-apache-y-firewall)
    - [Ubuntu vs. Oracle Linux / RHEL](#ubuntu-vs-oracle-linux--rhel)
    - [Lección clave sobre firewall en Ubuntu (OCI)](#lección-clave-sobre-firewall-en-ubuntu-oci)
  - [3. Balanceo de carga](#3-balanceo-de-carga)
  - [4. Despliegue del backend (FastAPI)](#4-despliegue-del-backend-fastapi)
    - [Preparación del entorno](#preparación-del-entorno)
    - [Incidentes durante la instalación](#incidentes-durante-la-instalación)
    - [Errores de arranque de la API](#errores-de-arranque-de-la-api)
    - [Puesta en producción con `systemd`](#puesta-en-producción-con-systemd)
  - [5. Incidentes: motor de IA y enrutamiento](#5-incidentes-motor-de-ia-y-enrutamiento)
    - [Motor de clasificación (NLP)](#motor-de-clasificación-nlp)
    - [Error de enrutamiento](#error-de-enrutamiento)
  - [6. Separación de frontend y backend](#6-separación-de-frontend-y-backend)
    - [Incidentes durante la migración](#incidentes-durante-la-migración)
  - [7. Seguridad HTTPS, CORS y SSL](#7-seguridad-https-cors-y-ssl)
    - [El problema de fondo: Mixed Content vs. CORS](#el-problema-de-fondo-mixed-content-vs-cors)
    - [Solución aplicada](#solución-aplicada)
    - [Evaluación de alternativas (ngrok)](#evaluación-de-alternativas-ngrok)
  - [8. Consolidación final](#8-consolidación-final)
    - [Incidentes de la consolidación](#incidentes-de-la-consolidación)
  - [9. Lecciones aprendidas](#9-lecciones-aprendidas)
  - [Stack utilizado](#stack-utilizado)

---

## 1. Infraestructura base en OCI

Orden de construcción de los recursos, siguiendo dependencias de abajo hacia arriba:

```
Usuarios y Grupos → Compartimento → Políticas (IAM) → Red (VCN) → Base de Datos → Cómputo / App
```

- **Usuarios y grupos (IAM):** se crea un usuario por integrante, se agrupan en un grupo de trabajo y se habilita MFA. Se crea además un *dynamic group* para otorgar permisos automáticos a recursos del sistema (no personas).
- **Compartimento:** carpeta lógica que aloja todos los recursos del proyecto (redes, bases de datos, servidores, almacenamiento).
- **Políticas (IAM Policies):** reglas que conectan el grupo con el compartimento. Regla especial: los permisos de *Cloud Shell* deben declararse a nivel de **Tenancy (root)**, nunca dentro de un compartimento, porque es un servicio global de la cuenta. El resto de políticas (gestión de base de datos, redes, cómputo, almacenamiento) se aplican a nivel de compartimento.
- **Red virtual (VCN):** se crea con una subred pública (para el servidor de aplicación) y una subred privada (para la base de datos), usando el asistente estándar de OCI. Las reglas de *Ingress* se configuran de forma restrictiva, exponiendo únicamente los puertos necesarios.
- **Base de datos:** aprovisionada en la subred privada, sin exposición directa a internet. La conexión se realiza mediante Wallet (credenciales cifradas), nunca con conexión directa expuesta.
- **Cómputo:** instancia Ubuntu creada en la subred pública, accesible únicamente por llave SSH (no por contraseña).

---

## 2. Publicación web inicial: Apache y firewall

Se instala Apache como prueba de conectividad HTTP básica antes de desplegar la aplicación real.

### Ubuntu vs. Oracle Linux / RHEL

Las guías de referencia estaban pensadas para Oracle Linux (`firewall-cmd`), por lo que se tradujeron los comandos a su equivalente en Ubuntu (`ufw` / `iptables`).

### Lección clave sobre firewall en Ubuntu (OCI)

- Si **UFW está inactivo** (comportamiento por defecto en muchas imágenes de Ubuntu en OCI): usar `iptables -I INPUT 1 ...` (insertando la regla en la posición 1 para que tenga prioridad) y guardar con `netfilter-persistent save`.
- Si **UFW está activo**: usar directamente `ufw allow <puerto>/tcp`, ya que UFW administra sus propias cadenas internas y cubre IPv4 e IPv6 simultáneamente; mezclar reglas manuales de iptables con UFW activo puede generar conflictos.

> Regla de oro: nunca asumir el estado de UFW; siempre verificarlo antes de decidir qué método usar.

Se crearon dos instancias con Apache, cada una publicando una página de prueba distinta, para luego validar el balanceo de carga.

---

## 3. Balanceo de carga

Se implementó un **Load Balancer** de OCI para distribuir el tráfico entre las dos instancias.

- **Listener:** puerta de entrada que escucha en un puerto específico y protocolo (HTTP), y reenvía el tráfico al *Backend Set*.
- **Backend Set:** agrupación lógica de instancias hacia las que se distribuye el tráfico, con *health checks* que monitorean su disponibilidad.
- Los usuarios finales dejan de acceder directamente a la IP de cada servidor y pasan a usar la IP pública del balanceador.

---

## 4. Despliegue del backend (FastAPI)

### Preparación del entorno

- Instalación de Git, Python 3, `pip` y `venv`.
- Clonado del repositorio y cambio a la rama de trabajo del backend.
- Creación de entorno virtual e instalación de dependencias con `pip install -r requirements.txt`.

### Incidentes durante la instalación

- **Falta de memoria (`Killed`)** al instalar librerías pesadas de Machine Learning: se resolvió creando memoria **SWAP** en disco para compensar la RAM insuficiente.
- **Error de compilación de dependencias**: se resolvió actualizando `pip`, `setuptools` y `wheel` antes de reinstalar.

### Errores de arranque de la API

- `ModuleNotFoundError: No module named 'app'` → el punto de entrada real del proyecto no seguía la convención esperada; se corrigió apuntando al módulo correcto.
- `ModuleNotFoundError` de un paquete compartido → el código dependía de una carpeta ubicada un nivel por encima del proyecto backend; se resolvió ajustando la variable `PYTHONPATH`.
- Error de conexión a base de datos por credenciales → se resolvió configurando correctamente las variables de entorno del *Wallet* de Oracle (usuario, contraseña, DSN y ruta del wallet gestionados como secretos, nunca hardcodeados).

### Puesta en producción con `systemd`

Se configuró la API como servicio de sistema (`systemd`) para que:
- corra en segundo plano de forma persistente,
- se reinicie automáticamente ante fallos,
- arranque automáticamente si el servidor se reinicia.

Las variables sensibles (credenciales de base de datos) se gestionan mediante variables de entorno del servicio, no quedan expuestas en el código fuente.

---

## 5. Incidentes: motor de IA y enrutamiento

### Motor de clasificación (NLP)

- **Síntoma:** `NotFittedError` al intentar clasificar contenido.
- **Causa raíz:** los binarios del modelo (vectorizador TF-IDF + clasificador, serializados con `joblib`) estaban corruptos o generados con una versión incompatible de la librería de Machine Learning.
- **Solución:** se localizó el script de entrenamiento del proyecto y se ejecutó un reentrenamiento forzado, regenerando los binarios del modelo de forma consistente con el entorno de ejecución.

### Error de enrutamiento

- **Síntoma:** `405 Method Not Allowed` al llamar a un endpoint.
- **Causa raíz:** el cliente apuntaba a una ruta que no coincidía con la definida en el backend.
- **Solución:** se revisó el código fuente de los controladores para identificar las rutas reales expuestas y se corrigió la URL consumida por el cliente.

La documentación interactiva automática de FastAPI (Swagger UI) se usó como herramienta central de diagnóstico, para verificar en tiempo real qué endpoints existen y qué esquema de datos esperan.

---

## 6. Separación de frontend y backend

Se evaluaron dos arquitecturas posibles:

| Criterio | Frontend en la misma instancia | Frontend en almacenamiento de objetos (bucket) |
|---|---|---|
| Uso ideal | Pruebas rápidas / MVP | Producción |
| Rendimiento del backend | Compite por recursos con el frontend | Backend 100% dedicado a la API |
| Costo | Ocupa disco y ancho de banda de la VM | Muy económico y altamente escalable |
| Mantenimiento | Requiere administrar un servidor web adicional | Sin mantenimiento de servidor |

**Decisión:** migrar el frontend a un bucket de almacenamiento de objetos con hosting estático, dejando el servidor de cómputo dedicado exclusivamente al backend y al modelo de IA.

### Incidentes durante la migración

- **Timeout de conexión remota:** causado por una configuración de red interna incorrecta en la instancia; se resolvió reasignando la instancia a una red con conectividad pública y ajustando las reglas de entrada.
- **Descarga automática de archivos en el navegador en vez de renderizar la web:** causado por un tipo de contenido (`Content-Type`) genérico asignado al subir los archivos al bucket. Se resolvió subiendo cada archivo indicando explícitamente su tipo MIME real según su extensión (HTML, CSS, JS, imágenes, etc.).
- **Conflictos de puerto ocupado al probar el backend manualmente:** se resolvió identificando y liberando procesos huérfanos antes de dejar el servicio bajo `systemd` de forma definitiva.

---

## 7. Seguridad HTTPS, CORS y SSL

### El problema de fondo: Mixed Content vs. CORS

| | Mixed Content | CORS |
|---|---|---|
| Qué es | Incompatibilidad de protocolo (HTTPS llamando a HTTP) | Política de permisos entre orígenes distintos |
| Quién bloquea | El navegador, de forma incondicional | El navegador, según las cabeceras del servidor |
| Solución | Certificado SSL/TLS en el backend | Cabeceras `Access-Control-Allow-Origin` |

Como el frontend (bucket) se sirve obligatoriamente por HTTPS y el backend respondía por HTTP simple, el navegador bloqueaba las peticiones por **Mixed Content**, antes incluso de evaluar CORS.

### Solución aplicada

1. Generación de un certificado SSL (autofirmado, para entorno de pruebas) y su clave privada.
2. Configuración de un *listener* HTTPS en el Load Balancer, vinculado al certificado.
3. Apertura del puerto HTTPS correspondiente únicamente en las reglas de red necesarias.
4. Ajuste del middleware CORS en el backend para aceptar peticiones desde el origen del frontend.

### Evaluación de alternativas (ngrok)

Se evaluó el uso de un servicio de túnel HTTPS como alternativa rápida para obtener un certificado válido sin configurar infraestructura propia. Se descartó para este proyecto por no ser una solución pensada para disponibilidad continua en producción, prefiriendo la solución con certificado propio sobre el Load Balancer.

---

## 8. Consolidación final

Para simplificar la entrega, se decidió revertir el balanceo de carga y el certificado SSL dedicado, consolidando **frontend y backend nuevamente en una sola instancia**, servidos ambos por el mismo proceso de backend bajo `systemd`.

### Incidentes de la consolidación

- **Frontend no accesible desde la raíz del servidor:** el bloque de código que montaba los archivos estáticos del frontend estaba comentado en el backend; se descomentó y activó.
- **Fallo de arranque del servicio (`status=1/FAILURE`):** causado por un error de indentación en el código Python (Python es sensible a la sangría). Se corrigió alineando el bloque de código al estándar del lenguaje.
- **`405 Method Not Allowed` en el cliente:** causado por una URL base duplicada en el código JavaScript del frontend, generando rutas mal formadas. Se corrigió la constante de configuración de la URL de la API.

Estado final: una única instancia sirviendo, bajo un proceso administrado por `systemd`, tanto la API (FastAPI) como la interfaz web del proyecto.

---

## 9. Lecciones aprendidas

- **Orden de dependencias en IAM:** las políticas de alcance global (como Cloud Shell) deben vivir en la raíz de la cuenta (Tenancy), no dentro de un compartimento.
- **Firewall en Ubuntu sobre OCI:** siempre verificar si UFW está activo antes de elegir entre `ufw` o `iptables` directo; mezclarlos sin criterio genera bloqueos difíciles de diagnosticar.
- **Gestión de memoria en instancias pequeñas:** instalar dependencias de Machine Learning puede requerir memoria SWAP adicional si la RAM de la instancia es limitada.
- **Rutas de Python (`PYTHONPATH`):** proyectos con módulos compartidos fuera de la carpeta principal del backend requieren ajustar explícitamente el path de búsqueda de módulos.
- **Servicios en systemd:** las variables de entorno de una sesión SSH no las hereda automáticamente un servicio del sistema; deben declararse explícitamente en la configuración del servicio.
- **Content-Type en almacenamiento de objetos:** al subir archivos estáticos a un bucket, es necesario asignar el tipo MIME correcto o el navegador los descargará en lugar de renderizarlos.
- **Mixed Content ≠ CORS:** son dos bloqueos de seguridad distintos del navegador; diagnosticar cuál de los dos está ocurriendo realmente ahorra tiempo de depuración.
- **Arquitectura desacoplada vs. monolítica:** separar frontend (almacenamiento estático) y backend (cómputo dedicado) mejora el uso de recursos y la disponibilidad, a costa de una configuración adicional de CORS y HTTPS.

---

## Stack utilizado

- **Cloud:** Oracle Cloud Infrastructure (OCI) — IAM, VCN, Compute, Autonomous Database, Object Storage, Load Balancer.
- **Sistema operativo:** Ubuntu (instancias de Compute en OCI).
- **Backend:** Python, FastAPI, Uvicorn, `systemd`.
- **Machine Learning / NLP:** scikit-learn (TF-IDF + clasificador), `joblib`.
- **Base de datos:** Oracle Database (conexión vía Wallet).
- **Frontend:** HTML / CSS / JavaScript, servido como sitio estático.
- **Servidor web / pruebas:** Apache2 (Ubuntu).




