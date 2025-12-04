// --- Game Variables ---
let scene, camera, renderer;
let car, road, grass;
let traffic = [];
let speed = 0;
let maxSpeed = 2.5; // Game units
let steering = 0;
let score = 0;
let gameActive = true;
let speedDisplay = 0; // The visual MPH
let clock = new THREE.Clock();

// --- Colors ---
const COLORS = {
    car: 0xd92525, // Ferrari Red
    glass: 0x333333,
    road: 0x333333,
    grass: 0x2d5a27, // Dark UK Green
    line: 0xffffff
};

function init() {
    // 1. Setup Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky Blue
    scene.fog = new THREE.Fog(0x87CEEB, 10, 50); // Fog for depth

    // 2. Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, -7); // Behind car
    camera.lookAt(0, 0, 10);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, -10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // 5. Build World
    createRoad();
    createPlayerCar();
    
    // 6. Listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // 7. Start Loop
    animate();
}

// --- Object Creation Helpers ---

function createRoad() {
    // Road
    const roadGeo = new THREE.PlaneGeometry(12, 1000);
    const roadMat = new THREE.MeshPhongMaterial({ color: COLORS.road });
    road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    scene.add(road);

    // Grass (Infinite Plane illusion)
    const grassGeo = new THREE.PlaneGeometry(200, 1000);
    const grassMat = new THREE.MeshPhongMaterial({ color: COLORS.grass });
    grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.1;
    scene.add(grass);
}

function createPlayerCar() {
    car = new THREE.Group();

    // Main Body
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.5, 4);
    const bodyMat = new THREE.MeshPhongMaterial({ color: COLORS.car });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    car.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.4, 2);
    const cabinMat = new THREE.MeshPhongMaterial({ color: COLORS.glass });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.y = 0.9;
    cabin.position.z = -0.2;
    car.add(cabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 16);
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    
    const w1 = new THREE.Mesh(wheelGeo, wheelMat);
    w1.rotation.z = Math.PI / 2;
    w1.position.set(0.9, 0.35, 1.2);
    car.add(w1);

    const w2 = w1.clone(); w2.position.set(-0.9, 0.35, 1.2); car.add(w2);
    const w3 = w1.clone(); w3.position.set(0.9, 0.35, -1.2); car.add(w3);
    const w4 = w1.clone(); w4.position.set(-0.9, 0.35, -1.2); car.add(w4);

    scene.add(car);
}

function spawnTraffic() {
    if (!gameActive) return;
    
    // Create a random traffic car
    const tCar = new THREE.Group();
    const color = Math.random() * 0xffffff;
    
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.8, 3.5);
    const bodyMat = new THREE.MeshPhongMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    tCar.add(body);

    // Random Lane (-3, 0, or 3)
    const lanes = [-3, 0, 3];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];

    tCar.position.set(lane, 0, 100); // Spawn far ahead
    scene.add(tCar);
    traffic.push(tCar);
}

// --- Logic ---

const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false };

function onKeyDown(e) { if(keys.hasOwnProperty(e.code)) keys[e.code] = true; }
function onKeyUp(e) { if(keys.hasOwnProperty(e.code)) keys[e.code] = false; }

function updatePhysics() {
    if (!gameActive) return;

    // Acceleration
    if (keys.ArrowUp) {
        speed += 0.02;
    } else {
        speed *= 0.98; // Friction
    }
    speed = Math.max(0, Math.min(speed, maxSpeed));

    // Steering
    if (keys.ArrowLeft) car.position.x += 0.15;
    if (keys.ArrowRight) car.position.x -= 0.15;

    // Boundary Check
    if (car.position.x > 5) car.position.x = 5;
    if (car.position.x < -5) car.position.x = -5;

    // Car Tilt animation
    car.rotation.z = (keys.ArrowLeft ? -0.05 : 0) + (keys.ArrowRight ? 0.05 : 0);
    car.rotation.x = speed * 0.05; // Nose up when fast

    // Move Road (Illusion of speed)
    // Actually, we move traffic towards us
    traffic.forEach((tCar, index) => {
        tCar.position.z -= speed * 2 + 0.5; // Traffic moves slower than player

        // Collision detection
        const dist = car.position.distanceTo(tCar.position);
        if (dist < 2.5) {
            crash();
        }

        // Remove if passed
        if (tCar.position.z < -20) {
            scene.remove(tCar);
            traffic.splice(index, 1);
            score += 100;
            updateScore();
        }
    });

    // Spawn new traffic randomly
    if (Math.random() < 0.02 * speed) spawnTraffic();

    // Update UI
    speedDisplay = Math.floor(speed * 80); // Fake MPH calculation
    document.getElementById('speed').innerText = speedDisplay;
    
    // RPM Bar
    const rpmPct = (speed / maxSpeed) * 100;
    document.getElementById('rpm').style.width = rpmPct + "%";
    
    // Gear Logic
    const gear = speedDisplay === 0 ? 'N' : Math.ceil(speedDisplay / 40);
    document.getElementById('gear').innerText = gear;
}

function updateScore() {
    document.getElementById('score').innerText = score;
    const skillText = document.getElementById('skill-action');
    skillText.style.opacity = 1;
    skillText.innerText = "NEAR MISS";
    setTimeout(() => { skillText.style.opacity = 0; }, 500);
}

function crash() {
    gameActive = false;
    document.getElementById('game-over').style.display = 'flex';
}

function animate() {
    requestAnimationFrame(animate);
    updatePhysics();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start
init();
