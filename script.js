const scene = new THREE.Scene();

/* ---------------- CAMERA ---------------- */

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);

camera.position.set(0, 0, 0);

/* ---------------- RENDERER ---------------- */

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

/* ---------------- ULTRA DARK BACKGROUND ---------------- */

const canvas = document.createElement("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

function drawGradient() {
  const grad = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width
  );

  grad.addColorStop(0, "#050008");  // 거의 블랙 + 보라
  grad.addColorStop(0.2, "#000003"); // 극단적 딥블루
  grad.addColorStop(0.5, "#000000"); // 완전 블랙
  grad.addColorStop(1, "#000000");   // 완전 블랙

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  scene.background = new THREE.CanvasTexture(canvas);
}

drawGradient();

/* ---------------- STAR FIELD ---------------- */

const geo = new THREE.BufferGeometry();
const pos = [];
const col = [];
const vel = [];

const COUNT = 32000;
const RADIUS = 1400;

function starColor() {
  const palette = [
    [0.9, 0.9, 0.9],
    [0.7, 0.8, 1],
    [1, 0.9, 0.7]
  ];
  return palette[Math.floor(Math.random() * palette.length)];
}

for (let i = 0; i < COUNT; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = RADIUS * Math.cbrt(Math.random());

  pos.push(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );

  const c = starColor();
  col.push(c[0], c[1], c[2]);

  vel.push(
    (Math.random() - 0.5) * 0.04,
    (Math.random() - 0.5) * 0.04,
    (Math.random() - 0.5) * 0.04
  );
}

geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));

const stars = new THREE.Points(
  geo,
  new THREE.PointsMaterial({
    size: 2.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  })
);

scene.add(stars);

/* ---------------- AUDIO ---------------- */

const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

let soundReady = false;

audioLoader.load(
  "https://cdn.jsdelivr.net/gh/ladyiske/space@main/%EC%9A%B0%EC%A3%BC.mp3",
  function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.7);
    soundReady = true;
  }
);

window.addEventListener("click", () => {
  if (soundReady && !sound.isPlaying) {
    sound.play();
  }
});

/* ---------------- CONTROLS ---------------- */

const keys = {};
window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

let vx = 0;
let vy = 0;

function animate() {
  requestAnimationFrame(animate);

  const accel = 0.00002;

  if (keys["arrowleft"]) vy -= accel;
  if (keys["arrowright"]) vy += accel;
  if (keys["arrowup"]) vx -= accel;
  if (keys["arrowdown"]) vx += accel;

  vx *= 0.985;
  vy *= 0.985;

  stars.rotation.x += vx;
  stars.rotation.y += vy;

  const p = geo.attributes.position.array;

  for (let i = 0; i < p.length; i += 3) {
    p[i] += vel[i];
    p[i + 1] += vel[i + 1];
    p[i + 2] += vel[i + 2];

    if (p[i] > RADIUS) p[i] = -RADIUS;
    if (p[i] < -RADIUS) p[i] = RADIUS;

    if (p[i + 1] > RADIUS) p[i + 1] = -RADIUS;
    if (p[i + 1] < -RADIUS) p[i + 1] = RADIUS;

    if (p[i + 2] > RADIUS) p[i + 2] = -RADIUS;
    if (p[i + 2] < -RADIUS) p[i + 2] = RADIUS;
  }

  geo.attributes.position.needsUpdate = true;

  renderer.render(scene, camera);
}

animate();

/* ---------------- RESIZE ---------------- */

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
