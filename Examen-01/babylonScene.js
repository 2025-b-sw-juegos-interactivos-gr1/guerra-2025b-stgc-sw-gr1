// ============================================================================
// CAZAFANTASMAS: MISIÓN DE CONTENCIÓN
// Juego 3D desarrollado con Babylon.js
// ============================================================================

// Obtener referencia al canvas del HTML donde se renderizará la escena 3D
const canvas = document.getElementById("renderCanvas");

// Crear el motor de renderizado de Babylon.js con antialiasing activado
const engine = new BABYLON.Engine(canvas, true);

// ============================================================================
// VARIABLES DE ESTADO DEL JUEGO
// ============================================================================

let fantasmaAtrapado = false;      // Indica si el jugador lleva un fantasma
let fantasmaActual = null;         // Referencia al fantasma que está siendo cargado
let todosLosFantasmas = [];        // Array con todos los fantasmas de la escena
let fantasmasContenidos = 0;       // Contador de fantasmas entregados al contenedor
const totalFantasmas = 3;          // Cantidad total de fantasmas para ganar

// Variables de movimiento del jugador
let playerContainer = null;        // Contenedor invisible que maneja las físicas
let moveSpeed = 1.5;               // Velocidad de desplazamiento
const turnSpeed = 0.1;             // Velocidad de rotación suavizada
let keys = {};                     // Estado de las teclas presionadas

// ============================================================================
// EVENTOS DE TECLADO
// ============================================================================

// Detectar tecla presionada
window.addEventListener('keydown', (event) => { 
    keys[event.key.toLowerCase()] = true; 
});

// Detectar tecla soltada
window.addEventListener('keyup', (event) => { 
    keys[event.key.toLowerCase()] = false; 
});

// Limpiar teclas al perder foco (evita teclas "pegadas")
window.addEventListener('blur', () => { 
    keys = {}; 
});

// ============================================================================
// FUNCIÓN PRINCIPAL: CREAR LA ESCENA 3D
// ============================================================================

const createScene = function () {
    // Crear la escena de Babylon.js
    const scene = new BABYLON.Scene(engine);
    
    // Habilitar el sistema de colisiones
    scene.collisionsEnabled = true;

    // ------------------------------------------------------------------------
    // CÁMARA EN TERCERA PERSONA (ArcRotateCamera)
    // Parámetros: alpha (rotación horizontal), beta (inclinación), radius (distancia)
    // ------------------------------------------------------------------------
    const camera = new BABYLON.ArcRotateCamera(
        "camera", 
        0,      // Alpha: posición horizontal inicial
        1.0,    // Beta: ángulo de inclinación (1.0 rad ≈ 57°)
        55,     // Radius: distancia al jugador
        new BABYLON.Vector3(0, 0, 0), 
        scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 30;   // Zoom máximo (más cerca)
    camera.upperRadiusLimit = 80;   // Zoom mínimo (más lejos)
    camera.lowerBetaLimit = 0.5;    // Límite superior de inclinación
    camera.upperBetaLimit = 1.4;    // Límite inferior de inclinación
    camera.wheelPrecision = 20;     // Sensibilidad del zoom

    // ------------------------------------------------------------------------
    // ILUMINACIÓN
    // ------------------------------------------------------------------------
    
    // Luz hemisférica: iluminación ambiental desde arriba
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.8;
    
    // Luz direccional: simula el sol, crea sombras
    const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
    dirLight.position = new BABYLON.Vector3(10, 20, 10);
    dirLight.intensity = 0.5;

    // Variable para el contenedor de fantasmas
    let unidadContencion = null;

    // ------------------------------------------------------------------------
    // CARGAR EL ESCENARIO (CEMENTERIO)
    // ------------------------------------------------------------------------
    BABYLON.SceneLoader.ImportMesh("", "assets/models/", "escenario.glb", scene, function (meshes) {
        // Desplazar el escenario para centrarlo correctamente
        const offsetEscenario = new BABYLON.Vector3(-1775, 0, 0);
        meshes.forEach(mesh => {
            mesh.position.addInPlace(offsetEscenario);
            mesh.checkCollisions = true;
        });

        // Punto central del cementerio (referencia para posicionar objetos)
        const centroCementerio = new BABYLON.Vector3(80, 248, 120);

        // --------------------------------------------------------------------
        // CREAR EL JUGADOR (contenedor invisible + modelo visual)
        // --------------------------------------------------------------------
        const playerHeight = 8;
        
        // Contenedor invisible que maneja físicas y colisiones
        playerContainer = BABYLON.MeshBuilder.CreateBox("playerContainer", {size: 16}, scene);
        playerContainer.isVisible = false;
        playerContainer.checkCollisions = true;
        playerContainer.ellipsoid = new BABYLON.Vector3(6, playerHeight, 6);
        
        // Posicionar al jugador en el centro del cementerio
        playerContainer.position = centroCementerio.clone();
        playerContainer.position.y += 8;

        // Configurar cámara para seguir al jugador
        camera.target = playerContainer;
        camera.alpha = Math.PI;  // Cámara detrás del jugador
        camera.beta = 1.0;       // Ángulo de inclinación

        // --------------------------------------------------------------------
        // CARGAR MODELO 3D DEL PERSONAJE (Cazafantasmas)
        // --------------------------------------------------------------------
        BABYLON.SceneLoader.ImportMesh("", "assets/models/", "personaje.glb", scene, function (meshes) {
            let cazadorMesh = meshes[0];
            cazadorMesh.setParent(playerContainer);
            cazadorMesh.position = new BABYLON.Vector3(0, -playerHeight + 15, 0);
            cazadorMesh.scaling = new BABYLON.Vector3(16, 16, 16);
            cazadorMesh.rotation = new BABYLON.Vector3(0, 0, 0);
        });

        // --------------------------------------------------------------------
        // CREAR LOS FANTASMAS
        // --------------------------------------------------------------------
        
        /**
         * Crea un fantasma con animación de flotación
         * @param {string} nombre - Identificador del fantasma
         * @param {number} offsetX - Posición X relativa al centro
         * @param {number} offsetZ - Posición Z relativa al centro  
         * @param {BABYLON.Color3} colorEmisivo - Color de brillo
         * @param {number} velocidadAnim - Velocidad de flotación
         */
        function crearFantasma(nombre, offsetX, offsetZ, colorEmisivo, velocidadAnim) {
            BABYLON.SceneLoader.ImportMesh("", "assets/models/", "fantasma.glb", scene, function (meshes) {
                let f = meshes[0];
                f.name = nombre;
                f.capturado = false;
                f.position = centroCementerio.add(new BABYLON.Vector3(offsetX, 1, offsetZ));
                f.scaling = new BABYLON.Vector3(5, 5, 5);
                
                // Aplicar color emisivo (brillo)
                meshes.forEach(m => {
                    if (m.material) m.material.emissiveColor = colorEmisivo;
                });

                todosLosFantasmas.push(f);

                // Animación de flotación (solo si no está capturado)
                let t = 0;
                scene.onBeforeRenderObservable.add(() => {
                    if (!f.capturado) {
                        t += velocidadAnim;
                        f.position.y = (centroCementerio.y + 1) + Math.sin(t) * 0.5;
                        f.rotation.y += 0.01;
                    }
                });
            });
        }

        // Crear 3 fantasmas con diferentes colores y posiciones
        crearFantasma("fantasma1", 60, 3, new BABYLON.Color3(0, 0.5, 0), 0.02);       // Verde
        crearFantasma("fantasma2", 75, -100, new BABYLON.Color3(0, 0.5, 0.5), 0.025); // Cyan
        crearFantasma("fantasma3", -75, -150, new BABYLON.Color3(0.5, 0.5, 0), 0.018); // Amarillo

        // --------------------------------------------------------------------
        // CARGAR EL CONTENEDOR DE FANTASMAS
        // --------------------------------------------------------------------
        BABYLON.SceneLoader.ImportMesh("", "assets/models/", "contenedor_fantasmas.glb", scene, function (meshes) {
            unidadContencion = meshes[0];
            unidadContencion.position = centroCementerio.add(new BABYLON.Vector3(0, 0, 400));
            unidadContencion.scaling = new BABYLON.Vector3(3, 3, 3);
        });
    });

    // ------------------------------------------------------------------------
    // FUNCIONES DE INTERFAZ
    // ------------------------------------------------------------------------
    
    /** Actualiza el contador de fantasmas en pantalla */
    function actualizarContador() {
        const el = document.getElementById("contador");
        if (el) el.textContent = `Fantasmas: ${fantasmasContenidos}/${totalFantasmas}`;
    }

    /** Muestra el mensaje de victoria */
    function mostrarVictoria() {
        const el = document.getElementById("mensajeVictoria");
        if (el) el.style.display = "block";
    }

    // ------------------------------------------------------------------------
    // LÓGICA DE CAPTURA Y ENTREGA (TECLA ESPACIO)
    // ------------------------------------------------------------------------
    window.addEventListener('keydown', (event) => {
        if (event.key === " " || event.key === "Spacebar") {
            event.preventDefault();
            
            // Verificar que todo esté cargado
            if (!playerContainer || !unidadContencion || todosLosFantasmas.length === 0) return;
            
            // CASO A: No lleva fantasma -> intentar ATRAPAR
            if (!fantasmaAtrapado) {
                let fantasmaCercano = null;
                let minDst = Infinity;

                // Buscar el fantasma libre más cercano
                todosLosFantasmas.forEach(f => {
                    if (!f.capturado) {
                        let d = BABYLON.Vector3.Distance(playerContainer.position, f.position);
                        if (d < minDst) {
                            minDst = d;
                            fantasmaCercano = f;
                        }
                    }
                });

                // Si hay uno cerca (< 35 unidades), capturarlo
                if (fantasmaCercano && minDst < 35) {
                    fantasmaCercano.capturado = true;
                    fantasmaCercano.setParent(playerContainer);
                    fantasmaCercano.position = new BABYLON.Vector3(0, 8, 10);
                    fantasmaCercano.rotation = BABYLON.Vector3.Zero();
                    fantasmaCercano.scaling = new BABYLON.Vector3(2.5, 2.5, 2.5);
                    
                    fantasmaAtrapado = true;
                    fantasmaActual = fantasmaCercano;
                }
            }
            // CASO B: Lleva fantasma -> intentar ENTREGAR
            else {
                let dist = BABYLON.Vector3.Distance(playerContainer.position, unidadContencion.position);
                
                // Si está cerca del contenedor (< 25 unidades), entregar
                if (dist < 25) {
                    fantasmaActual.setParent(null);
                    fantasmaActual.position = unidadContencion.position.clone();
                    fantasmaActual.position.y += 5 + (fantasmasContenidos * 6);
                    fantasmaActual.scaling = new BABYLON.Vector3(5, 5, 5);
                    fantasmaActual.capturado = true;
                    
                    fantasmasContenidos++;
                    actualizarContador();
                    
                    if (fantasmasContenidos >= totalFantasmas) mostrarVictoria();
                    
                    fantasmaAtrapado = false;
                    fantasmaActual = null;
                }
            }
        }
    });

    return scene;
};

// Crear la escena
const scene = createScene();

// ============================================================================
// BUCLE PRINCIPAL DE RENDERIZADO Y MOVIMIENTO
// ============================================================================

engine.runRenderLoop(function () {
    // Esperar a que la escena y el jugador estén listos
    if (!scene.isReady() || !playerContainer) {
        scene.render();
        return;
    }

    // Delta time para movimiento suave independiente de FPS
    const dt = engine.getDeltaTime() / 1000;
    
    // ------------------------------------------------------------------------
    // MOVIMIENTO DEL JUGADOR (WASD)
    // ------------------------------------------------------------------------
    
    // Leer input de teclado
    let dz = 0;  // Adelante/Atrás
    if (keys['w']) dz = 1;
    if (keys['s']) dz = -1;
    
    let dx = 0;  // Izquierda/Derecha
    if (keys['d']) dx = 1;
    if (keys['a']) dx = -1;

    if (dx !== 0 || dz !== 0) {
        const actualSpeed = moveSpeed * dt * 60;
        
        // Calcular dirección relativa a la cámara
        const cameraAlpha = scene.activeCamera.alpha;
        const moveAngle = Math.atan2(-dx, -dz);
        const targetAngle = cameraAlpha + moveAngle;
        
        // Rotación suave del personaje
        let curRot = playerContainer.rotation.y;
        let diff = targetAngle - curRot;
        
        // Normalizar ángulo al rango [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        
        playerContainer.rotation.y = BABYLON.Scalar.Lerp(curRot, curRot + diff, turnSpeed);

        // Mover respetando colisiones
        const xMove = Math.sin(targetAngle) * actualSpeed;
        const zMove = Math.cos(targetAngle) * actualSpeed;
        playerContainer.moveWithCollisions(new BABYLON.Vector3(xMove, 0, zMove));
    }
    
    // ------------------------------------------------------------------------
    // GRAVEDAD (Raycast hacia abajo)
    // ------------------------------------------------------------------------
    
    const rayStart = playerContainer.position.clone();
    rayStart.y += 2.0;
    const ray = new BABYLON.Ray(rayStart, new BABYLON.Vector3(0, -1, 0), 50.0);
    
    // Detectar suelo (ignorando al jugador)
    const hit = scene.pickWithRay(ray, (mesh) => {
        return mesh !== playerContainer && 
               !mesh.isDescendantOf(playerContainer) && 
               mesh.checkCollisions;
    });

    // Ajustar altura según el suelo
    if (hit.pickedMesh) {
        playerContainer.position.y = BABYLON.Scalar.Lerp(
            playerContainer.position.y, 
            hit.pickedPoint.y + 8, 
            0.2
        );
    } else {
        // Sin suelo -> caer
        playerContainer.position.y -= 0.5;
    }
    
    scene.render();
});

// ============================================================================
// AJUSTE DE VENTANA
// ============================================================================

window.addEventListener("resize", function () {
    engine.resize();
});