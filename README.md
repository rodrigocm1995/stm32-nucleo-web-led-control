# STM32 NUCLEO-F303RE Web LED Controller 🚀

Este proyecto es una interfaz web premium y moderna que permite controlar el LED de usuario integrado (**LD2**, pin **PA5**) de la tarjeta de desarrollo **STM32 NUCLEO-F303RE** en tiempo real mediante comunicación serie utilizando la **Web Serial API** directamente desde el navegador web.

El diseño del panel sigue una estética futurista de tipo *Glassmorphism* (efecto de vidrio esmerilado) en modo oscuro, con variables CSS unificadas, efectos de brillo neón e interacciones animadas muy fluidas que garantizan una experiencia de usuario sumamente atractiva y profesional.

---

## 🗺️ Arquitectura General del Sistema

El siguiente diagrama ilustra el flujo de comunicación y control bidireccional entre la interfaz web y el microcontrolador STM32:

```mermaid
graph TD
    subgraph Navegador Web (PC)
        UI[Panel de Control Web / HTML + CSS] <--> |Acciones e Hilos Asíncronos| JS[Lógica JS / app.js]
        JS <--> |Lectura/Escritura de Streams| WSA[Web Serial API]
    end

    subgraph Conexión Física
        WSA <--> |Protocolo USB COM Virtual VCP| STLINK[Depurador ST-LINK Integrado]
    end

    subgraph Tarjeta STM32 NUCLEO-F303RE
        STLINK <--> |Líneas de UART2 / PA2 TX - PA3 RX| UART[Periférico USART2 MCU]
        UART <--> |Manejo de Registros HAL C / Arduino| CORE[Núcleo del Microcontrolador]
        CORE <--> |Señal GPIO / PA5| LED[LED LD2 Físico]
    end

    style UI fill:#0d1527,stroke:#00f2fe,stroke-width:2px,color:#fff
    style JS fill:#111b30,stroke:#00f2fe,stroke-width:2px,color:#fff
    style WSA fill:#17223b,stroke:#0072ff,stroke-width:1px,color:#fff
    style STLINK fill:#1e293b,stroke:#10b981,stroke-width:1px,color:#fff
    style UART fill:#0f172a,stroke:#10b981,stroke-width:2px,color:#fff
    style LED fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff
```

---

## 📂 Estructura del Proyecto

El espacio de trabajo se compone de los siguientes archivos de código fuente estructurados de forma modular:

| Archivo | Ruta Relativa / Enlace | Descripción y Propósito |
| :--- | :--- | :--- |
| **Página Principal** | [index.html](file:///C:/Users/casti/.gemini/antigravity-ide/scratch/nucleo-led-control/index.html) | Estructura semántica HTML5 de la aplicación. Organiza el dashboard en cuatro paneles clave: Conexión Serie, Control del LED, Consola Serial y Visualizador del Firmware. |
| **Estilos CSS** | [style.css](file:///C:/Users/casti/.gemini/antigravity-ide/scratch/nucleo-led-control/style.css) | Hoja de estilos en Vanilla CSS. Define el sistema de variables de color, el efecto glassmorphism, las animaciones de pulso neón para el LED virtual y el diseño adaptativo responsivo para móviles. |
| **Lógica Frontend** | [app.js](file:///C:/Users/casti/.gemini/antigravity-ide/scratch/nucleo-led-control/app.js) | Script JavaScript que gestiona el ciclo de vida del puerto serie (`navigator.serial`), lee asíncronamente con un buffer contra la fragmentación de datos, actualiza de forma reactiva la UI y realiza el auto-scroll. |
| **Firmware de la Placa** | [nucleo_firmware.md](file:///C:/Users/casti/.gemini/antigravity-ide/scratch/nucleo-led-control/nucleo_firmware.md) | Documentación del código fuente del microcontrolador. Contiene los programas listos para compilar y cargar a través de **Arduino IDE** o **STM32CubeIDE (HAL C)**. |
| **Documentación General** | [README.md](file:///C:/Users/casti/.gemini/antigravity-ide/scratch/nucleo-led-control/README.md) | Este manual de documentación general del proyecto. |

---

## 🔌 Protocolo de Comunicación Serie

La transferencia de información entre el navegador y la tarjeta de desarrollo se realiza de forma asíncrona mediante el protocolo UART. Los parámetros de configuración obligatorios para el puerto son:

*   **Velocidad (Baud Rate):** `115200 bps` (Recomendado para asegurar estabilidad y evitar latencia).
*   **Bits de Datos:** `8`
*   **Paridad:** `Ninguna (None)`
*   **Bits de Parada:** `1`
*   **Control de Flujo:** `Ninguno (None)`

### Comando y Respuesta en Detalle

El protocolo utiliza caracteres simples ASCII de 1 byte enviados desde la PC, seguidos por respuestas estructuradas de texto finalizadas en salto de línea (`\r\n`) enviadas por la tarjeta Nucleo:

| Dirección | Comando enviado (ASCII) | Acción Realizada por el Firmware | Respuesta de la Placa |
| :---: | :---: | :--- | :--- |
| **PC → Placa** | **`'1'`** | Enciende el pin **PA5** de la placa (pone en estado lógico alto). | `LED Encendido\r\n` |
| **PC → Placa** | **`'0'`** | Apaga el pin **PA5** de la placa (pone en estado lógico bajo). | `LED Apagado\r\n` |
| **PC → Placa** | **`'?'`** | Consulta el estado actual de salida leyendo el registro del puerto. | `LED Encendido\r\n` o `LED Apagado\r\n` |

*Nota: La interfaz web también cuenta con retrocompatibilidad heredada para responder de forma reactiva ante caracteres alternativos si el hardware los envía, por ejemplo, interpretando el estado del LED en base a la cadena de texto recibida.*

---

## 🛠️ Requisitos de Hardware y Conexión

Para operar este sistema de manera física, se requiere:

1.  **Tarjeta de Desarrollo:** STM32 NUCLEO-F303RE (basada en el microcontrolador ARM Cortex-M4 STM32F303RET6).
2.  **Conexión Física:** Un cable USB tipo A a Mini-B (o Micro-B según la versión de la placa) conectado entre la tarjeta y un puerto USB libre de la computadora.
3.  **ST-LINK Driver:** El programador/depurador ST-LINK integrado en la placa Nucleo crea un Puerto COM Virtual (VCP) de forma automática. En sistemas operativos Windows, esto puede confirmarse en el *Administrador de Dispositivos* bajo la sección "Puertos (COM y LPT)" como `STMicroelectronics ST-Link Virtual COM Port (COMx)`.
4.  **Navegador Web Compatible:** Google Chrome, Microsoft Edge u Opera (con soporte nativo habilitado para la *Web Serial API*). *Nota: Mozilla Firefox y Apple Safari no soportan esta API debido a decisiones de sus políticas de seguridad.*

---

## 🚀 Guía de Puesta en Marcha

### Paso 1: Cargar el Firmware en la Placa
Abre el documento técnico de soporte **[nucleo_firmware.md](file:///C:/Users/casti/.gemini/antigravity-ide/scratch/nucleo-led-control/nucleo_firmware.md)** y selecciona uno de los dos métodos de programación provistos:

*   **Método A (Arduino IDE):** 
    1. Instala el soporte de placas STM32 en el gestor de tarjetas (`https://github.com/stm32duino/BoardManagerFiles/raw/main/package_stmicroelectronics_index.json`).
    2. Conecta la placa Nucleo a tu PC, selecciona la tarjeta **Nucleo-64** y el número de parte **Nucleo F303RE**.
    3. Copia el código provisto para Arduino, compila y cárgalo.
*   **Método B (STM32CubeIDE):** 
    1. Abre STM32CubeIDE y crea un nuevo proyecto de C a partir del microcontrolador STM32F303RETx.
    2. Configura el periférico `USART2` en modo asíncrono a `115200 bps`.
    3. Asegúrate de configurar el pin `PA5` (conectado al LED LD2) como `GPIO_Output`.
    4. Copia el código final completo de `main.c` provisto en el manual del firmware en tu proyecto.
    5. Compila y descarga el código en la tarjeta de desarrollo.

### Paso 2: Lanzar el Servidor Web Local
Debido a las estrictas políticas de seguridad de los navegadores modernos, las APIs de comunicación con hardware local (como la Web Serial API) solo se habilitan en **contextos seguros** (es decir, accediendo mediante `localhost` o a través de una conexión cifrada `HTTPS`).

Para levantar un servidor rápido en el directorio del proyecto, abre una terminal (PowerShell o CMD en Windows) en la ruta del proyecto y ejecuta:

```bash
# Opción usando Python (instalado por defecto en la mayoría de sistemas de desarrollo)
python -m http.server 8000
```

### Paso 3: Conexión y Control
1. Abre tu navegador web compatible y navega a **[http://localhost:8000](http://localhost:8000)**.
2. Comprueba que no aparezca el banner rojo de advertencia de incompatibilidad de navegador.
3. En el panel de **Conexión Serie**, selecciona la velocidad predeterminada de **115200 bps** en la lista desplegable y haz clic en **Conectar Placa**.
4. En el diálogo del navegador, selecciona el puerto COM que coincida con el puerto virtual ST-Link de tu tarjeta Nucleo y haz clic en **Conectar**.
5. ¡El sistema está listo! Tras conectarse exitosamente, el script enviará automáticamente el comando de consulta `'?'` para leer y sincronizar el estado real del LED físico.
6. Interactúa con el interruptor en el panel **Control de LED (LD2)**. Notarás que el LED verde de la placa se enciende y apaga de forma inmediata, mientras el LED virtual rojo de la pantalla pulsa en color neón brillante y la **Consola Serial** imprime los flujos de log en tiempo real.

---

## 🎨 Arquitectura de Software y Detalles de Ingeniería

### 1. Frontend Web (HTML + CSS + JS)

#### A. Sistema de Diseño Glassmorphic
La interfaz de usuario utiliza una estética visual de diseño fluido futurista lograda mediante:
*   **Desenfoque de Fondo (Backdrop Filter):** Logra el efecto de cristal traslúcido mediante `backdrop-filter: blur(12px) saturate(180%)` aplicado a las tarjetas, permitiendo que dos círculos abstractos y difusos situados en el fondo de la página (`.decor-1` y `.decor-2`) aporten profundidad y dinamismo visual sin comprometer la legibilidad.
*   **Estados de Luces Neón:** El indicador LED virtual simula el comportamiento físico del LED real de la placa. Utiliza una animación cíclica por fotogramas (`@keyframes activeLedPulse`) que expande y contrae una sombra exterior difusa de color rojo neón (`box-shadow: 0 0 25px rgba(239,68,68,0.6)`) únicamente cuando el LED está encendido.
*   **Tipografía Premium:** Se enlazan fuentes modernas de Google Fonts (`Outfit` para encabezados y botones con un peso audaz, y `JetBrains Mono` para la consola de comandos y el bloque de visualización de código) alejándose de las tipografías estándar del navegador.

#### B. Flujo Asíncrono de Lectura no Bloqueante con Buffer
Uno de los retos clave en comunicación serie web es la fragmentación de datos: los datos pueden llegar letra por letra o divididos en varios paquetes pequeños. Si la interfaz intenta interpretar los datos tal como llegan, las respuestas compuestas de varias palabras no se procesarán correctamente.

Para solucionar esto, en `app.js` se implementó:
1.  **Buffer Acumulador (`inputBuffer`):** Los bytes recibidos a través del lector de flujo asíncrono (`reader.read()`) son decodificados mediante `TextDecoder` y concatenados en una variable acumuladora.
2.  **Sincronización Proactiva (Reactive UI):** Se escanea todo el contenido acumulado buscando subcadenas claves como `"encendido"` o `"apagado"` para actualizar el estado del interruptor y del LED virtual inmediatamente, independientemente de que se reciba un retorno de carro o no.
3.  **Procesador de Líneas por Salto de Línea (`\n`):** Se implementa un bucle de extracción que corta y procesa líneas terminadas en salto de línea:
    ```javascript
    let lineIndex;
    while ((lineIndex = inputBuffer.indexOf('\n')) !== -1) {
        const rawLine = inputBuffer.slice(0, lineIndex);
        inputBuffer = inputBuffer.slice(lineIndex + 1);
        const trimmed = rawLine.trim();
        if (trimmed.length > 0) {
            logToTerminal(`Recibido: "${trimmed}"`, 'rx');
        }
    }
    ```
4.  **Control de Desbordamiento de Memoria:** Si por alguna razón la placa envía datos continuos sin saltos de línea, el buffer se trunca al llegar a 1024 caracteres para prevenir fugas de memoria del navegador.

#### C. Simetría de Interfaz y Solución de Desbordamiento Flexbox en Consola
Para lograr una simetría visual pulida en pantallas grandes (resolución de escritorio $\ge$ 850px):
*   Se fijó la altura de la tarjeta de conexión (`#card-connection`) y la tarjeta de la consola (`#card-terminal`) en `340px`.
*   **Solución al bug de Flexbox:** Por defecto, los elementos con distribución Flexbox tienen `min-height: auto`, lo que impide que colapsen por debajo del tamaño de su contenido interno. Esto causaba que la consola creciera infinitamente según se añadían líneas de log, desbordando y rompiendo el diseño de las tarjetas. Se aplicó `min-height: 0` al cuerpo de la terminal y a la consola propiamente en CSS, forzando a que respetaran los límites del contenedor padre de `340px`. Esto activa de manera fluida el desplazamiento vertical (`overflow-y: auto`) e interactúa perfectamente con la directiva JavaScript de auto-scroll (`serialTerminal.scrollTop = serialTerminal.scrollHeight`).

#### D. Diseño Responsivo Adaptativo
El diseño cuenta con una hoja de estilos adaptada a pantallas de teléfonos inteligentes (ancho $\le$ 600px):
*   Se apilan en una sola columna los elementos de rejilla.
*   Se reestructuran los botones a un ancho completo del 100% y distribución vertical para una interacción táctil cómoda.
*   Se reduce el tamaño de las fuentes, márgenes de cabecera y el tamaño del indicador LED virtual para no sobrecargar el viewport.
*   Se añade la regla de prevención `min-width: 0` al contenedor de código fuente (`.panel-column`), asegurando que las líneas extensas de código C que desbordan horizontalmente generen un scroll de código interno encapsulado en lugar de forzar un scroll en toda la página web móvil.

---

### 2. Firmware de la Placa (STM32 HAL C)

El firmware HAL C está diseñado para ejecutarse de manera robusta y limpia:
*   **Lectura Polling de UART:** Utiliza la función `HAL_UART_Receive` configurada con un timeout extremadamente corto (100 ms) para verificar si la PC ha transmitido un comando, impidiendo que el microcontrolador se congele y permitiendo procesar el loop continuamente.
*   **Transmisión de Respuestas Estables:** Al recibir comandos válidos, utiliza `sprintf` para componer una cadena de texto limpia en un buffer temporal (`tx_data`) y la envía de vuelta mediante la función de transmisión síncrona `HAL_UART_Transmit` con un timeout controlado.
*   **Comando de Consulta de Registro Directo:** El comando `'?'` no depende de variables en memoria RAM del microcontrolador que puedan desincronizarse. En su lugar, el firmware realiza una operación de máscara de bits directamente sobre el registro de salida del puerto GPIOA (`GPIOA->ODR & GPIO_PIN_5`) para devolver el estado lógico real que se está aplicando en ese mismo instante en el pin de salida físico del LED.

---

## 🔍 Resolución de Problemas (Troubleshooting)

### 1. El navegador muestra un error al intentar conectarse al puerto COM
*   **Causa:** Otra aplicación (como la consola serie de Arduino IDE, STM32CubeIDE Live Monitor o PuTTY) tiene abierto y reservado el puerto COM en este momento.
*   **Solución:** Cierra todas las consolas seriales abiertas en tu computadora y vuelve a presionar el botón "Conectar Placa" en el navegador.

### 2. No aparece el puerto COM en la lista de dispositivos del navegador
*   **Causa:** El cable USB no transmite datos (solo alimentación), o falta instalar los controladores del depurador ST-LINK.
*   **Solución:** 
    1. Asegúrate de estar usando un cable micro-USB que permita transferencia de datos.
    2. Instala los controladores oficiales ST-LINK USB driver desde la página oficial de STMicroelectronics.

### 3. La consola serie web no muestra nada o muestra caracteres extraños
*   **Causa:** Hay una desincronización en la velocidad de comunicación (Baud Rate) configurada.
*   **Solución:** Verifica que en el menú desplegable de la interfaz web esté seleccionada la velocidad de **115200 bps** antes de conectarte. De igual manera, asegúrate de que el firmware cargado en la tarjeta configure la velocidad de USART2 a 115200.

### 4. La interfaz web no abre el selector de puertos o marca incompatibilidad
*   **Causa:** Estás abriendo el archivo localmente como `file:///path/to/index.html` en tu navegador, lo cual desactiva las APIs de hardware por políticas de seguridad de origen.
*   **Solución:** Debes levantar un servidor web local (Paso 2 de la guía de puesta en marcha) y acceder siempre a través del host local: `http://localhost:8000`.
