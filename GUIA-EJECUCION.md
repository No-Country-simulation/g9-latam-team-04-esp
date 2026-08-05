# Techmind AI
Instructivo para poder montar el programa y ejecutarlo adecuadamente.

## Requerimientos
- Máquina con cualquier Windows, macOS o Linux, de 64 bits.
- Docker Desktop (si se está en Linux, también puede ser y se recomienda Docker CE nativo, y para usar Docker Desktop la virtualización debe estar activada en la BIOS).
- Git adecuadamente configurado (con e-mail y nombre de usuario seteados).
- Cualquier editor de código, aunque se recomienda VSCodium o cualquier derivado suyo (como VSCode).
- Cuenta de Gmail para poder utilizar Google Colab.

## En entorno de desarrollo
Existen los scripts de techmind. Según se encuentre uno en Windows o Linux/macOS:
- En Linux/macOS/WSL, trabajar con el script Bash (.sh): ejecutar `chmod +x techmind.sh` para dar permisos de ejecución al mismo, y luego `./techmind.sh up` para construir los contenedores (si no fueron construidos previamente) y levantarlos.
- En Windows, trabajar con el script PowerShell (.ps1): ejecutar `Set-ExecutionPolicy RemoteSigned` para dar permisos de ejecución a scripts locales no firmados (como el mismo), y ejecutar `.\techmind.ps1 up` para construir los contenedores (si no fueron construidos previamente) y levantarlos.

## En entorno de producción
A desarrollar...

## Para entrenar el modelo
A desarrollar...
