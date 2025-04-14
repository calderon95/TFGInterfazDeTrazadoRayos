# TFGInterfazDeTrazadoRayos
Interfaz gráfica para el desarrollo de simulaciones de trazado de rayos usando tecnologías CSP/CSA junto con un módulo adicional de una calculadora solar para calcular la radiación incidente total

# Instrucciones para iniciar la interfaz gráfica con XAMPP

1. **Instalación de XAMPP**  
   Para ejecutar la interfaz gráfica, es necesario utilizar un servidor local. En este caso, se utilizará [XAMPP](https://www.apachefriends.org/es/index.html), que puedes descargar desde el sitio oficial.

2. **Ubicación de la interfaz**  
   Una vez instalado XAMPP, coloca la carpeta de la interfaz gráfica dentro del directorio:  `.\xampp\htdocs\`

3. **Inicio del servidor local**  
   Abre el Panel de Control de XAMPP como administrador y activa el servidor **Apache**.

4. **Acceso desde el navegador**  
   Para ver la interfaz en funcionamiento, abre tu navegador preferido y accede a:  
   [http://localhost/TFGInterfazTrazadoRayos/](http://localhost/TFGInterfazTrazadoRayos/)

---

## Configuración de la API de Google Maps

Para utilizar la calculadora solar, es necesario contar con una credencial de acceso a la API de Google Maps.

1. Accede a [Google Cloud Console](https://console.cloud.google.com).
2. Crea un nuevo proyecto.
3. Habilita las siguientes APIs:
   - Maps Platform Datasets API  
   - Maps Static API  
   - Maps Embed API  
   - Maps JavaScript API  
   - Maps Elevation API  
   - Maps SDK for Android

4. Genera una clave de API y en `index.html` en la línea `<script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&callback=initMap">`, sustituye `YOUR_KEY` por la clave generada

