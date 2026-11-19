// Pitfire — first-person arena duel.
// Arrow keys turn and move. Space shoots. One computer opponent.

const BOUND = 20;
const PLAYER_RADIUS = 0.42;
const ENEMY_RADIUS = 0.52;
const PLAYER_SPEED = 8.8;
const ENEMY_SPEED = 5.6;
const TURN_SPEED = 2.25;
const EYE = 1.6;
const PLAYER_DAMAGE = 26;
const ENEMY_DAMAGE = 18;
const PLAYER_FIRE_DELAY = 0.36;
const BOLT_SPEED = 20;
const ENEMY_HIT_RADIUS = 0.62;

const COVER = [
  { x: -11, z: 0, w: 1.8, d: 9, h: 3.1, color: 0x232a3a, trim: 0x3df0ff },
  { x: 11, z: 0, w: 1.8, d: 9, h: 3.1, color: 0x232a3a, trim: 0x3df0ff },
  { x: -6.5, z: -11, w: 6, d: 1.5, h: 2.6, color: 0x2c2433, trim: 0xff6a32 },
  { x: 6.5, z: -11, w: 6, d: 1.5, h: 2.6, color: 0x2c2433, trim: 0xff6a32 },
  { x: -6.5, z: 11, w: 6, d: 1.5, h: 2.6, color: 0x2c2433, trim: 0xff6a32 },
  { x: 6.5, z: 11, w: 6, d: 1.5, h: 2.6, color: 0x2c2433, trim: 0xff6a32 },
  { x: -16, z: -16, w: 2.6, d: 2.6, h: 4.2, color: 0x1a2030, trim: 0xff3d5a },
  { x: 16, z: -16, w: 2.6, d: 2.6, h: 4.2, color: 0x1a2030, trim: 0xff3d5a },
  { x: -16, z: 16, w: 2.6, d: 2.6, h: 4.2, color: 0x1a2030, trim: 0xff3d5a },
  { x: 16, z: 16, w: 2.6, d: 2.6, h: 4.2, color: 0x1a2030, trim: 0xff3d5a },
];

const app = document.querySelector("#app");
const hud = document.querySelector("#hud");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayCopy = document.querySelector("#overlay-copy");
const startButton = document.querySelector("#start-button");
const record = document.querySelector("#record");
const playerHp = document.querySelector("#player-hp");
const enemyHp = document.querySelector("#enemy-hp");
const playerFill = document.querySelector("#player-fill");
const enemyFill = document.querySelector("#enemy-fill");
const playerBar = document.querySelector("#player-bar");
const crosshair = document.querySelector("#crosshair");
const readyFill = document.querySelector("#ready-fill");
const marker = document.querySelector("#marker");
const markerDistance = document.querySelector("#marker-distance");
const hint = document.querySelector("#hint");
const hurt = document.querySelector("#hurt");
const radar = document.querySelector("#radar");
const radarCtx = radar.getContext("2d");

const keys = {};
const obstacles = [];
const projectiles = [];
const beams = [];
const sparks = [];
const lookTarget = new THREE.Vector3();
const aimPoint = new THREE.Vector3();

const score = { wins: 0, losses: 0 };
const player = { x: 0, z: 14, yaw: 0, health: 100, cool: 0, moving: false };
const enemy = {
  x: 0,
  z: -14,
  yaw: Math.PI,
  health: 100,
  charge: 0,
  shotWait: 0.8,
  deploy: 0.45,
  strafe: 1,
  strafeT: 1,
  hit: 0,
  walking: false,
  group: null,
  legL: null,
  legR: null,
};

let state = "menu";
let time = 0;
let playTime = 0;
let shake = 0;
let hurtFlash = 0;
let gunKick = 0;
let roll = 0;
let bob = 0;
let audioCtx = null;
let armorMat;
let visorMat;
let gun;
let flashLight;
let enemyFlash;

const beamGeo = new THREE.BoxGeometry(0.045, 0.045, 1);
const sparkGeo = new THREE.SphereGeometry(0.13, 8, 8);
const boltGeo = new THREE.BoxGeometry(0.1, 0.1, 0.7);
const boltMat = new THREE.MeshBasicMaterial({ color: 0xff7a2a });

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07090f);
scene.fog = new THREE.Fog(0x07090f, 28, 72);

const camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.08, 140);
camera.rotation.order = "YXZ";
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
app.appendChild(renderer.domElement);

buildWorld();
buildGun();
buildEnemy();
resetRound();

window.addEventListener("resize", resize);
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.addEventListener("blur", clearKeys);
overlay.addEventListener("click", () => {
  if (state !== "play") startMatch();
});

const clock = new THREE.Clock();
requestAnimationFrame(frame);

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  time += dt;
  if (state === "play") playTime += dt;
  updatePlayer(dt);
  updateEnemy(dt);
  if (state === "play") separateBodies();
  updateProjectiles(dt);
  updateBeams(dt);
  updateSparks(dt);
  updateDust(dt);
  updateCamera(dt);
  updateHud();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

function buildWorld() {
  const floorTex = makeFloorTexture();
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(BOUND * 2 + 6, BOUND * 2 + 6),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.92, metalness: 0.08 })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(4.2, 4.45, 64),
    new THREE.MeshBasicMaterial({ color: 0xff5a1f, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  scene.add(ring);

  addWalls();
  COVER.forEach(addCover);
  addDust();

  scene.add(new THREE.HemisphereLight(0xc5e7ff, 0x2a140c, 0.72));
  const sun = new THREE.DirectionalLight(0xfff1df, 1.35);
  sun.position.set(10, 18, 8);
  scene.add(sun);
  addLamp(-16, -16, 0xff5a3c, 2.4);
  addLamp(16, 16, 0xff5a3c, 2.4);
  addLamp(-16, 16, 0x3de1ff, 2.1);
  addLamp(16, -16, 0x3de1ff, 2.1);

  enemyFlash = new THREE.PointLight(0xff6a2a, 0, 8, 2);
  scene.add(enemyFlash);
}

function makeFloorTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#121722";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "rgba(70, 214, 255, 0.32)";
  ctx.lineWidth = 2;
  for (let i = 0; i <= size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addWalls() {
  const height = 5.4;
  const thick = 1.15;
  const material = new THREE.MeshStandardMaterial({ color: 0x171c27, roughness: 0.8, metalness: 0.28 });
  const trimMat = new THREE.MeshBasicMaterial({ color: 0x37e7ff });
  const northSpan = BOUND * 2;
  const sideSpan = BOUND * 2 + thick * 2;
  const specs = [
    [0, -BOUND - thick / 2, northSpan, thick],
    [0, BOUND + thick / 2, northSpan, thick],
    [-BOUND - thick / 2, 0, thick, sideSpan],
    [BOUND + thick / 2, 0, thick, sideSpan],
  ];
  specs.forEach(([x, z, w, d]) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), material);
    wall.position.set(x, height / 2, z);
    scene.add(wall);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), trimMat);
    trim.position.set(x, 2.15, z);
    scene.add(trim);
  });
}

function addCover(spec) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(spec.w, spec.h, spec.d),
    new THREE.MeshStandardMaterial({
      color: spec.color,
      roughness: 0.58,
      metalness: 0.34,
      emissive: spec.trim,
      emissiveIntensity: 0.07,
    })
  );
  mesh.position.set(spec.x, spec.h / 2, spec.z);
  scene.add(mesh);
  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(spec.w + 0.08, 0.07, spec.d + 0.08),
    new THREE.MeshBasicMaterial({ color: spec.trim })
  );
  trim.position.set(spec.x, spec.h + 0.02, spec.z);
  scene.add(trim);
  obstacles.push({ x: spec.x, z: spec.z, hx: spec.w / 2, hz: spec.d / 2, h: spec.h });
}

function addLamp(x, z, color, intensity) {
  const light = new THREE.PointLight(color, intensity, 16, 2);
  light.position.set(x, 3.1, z);
  scene.add(light);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), new THREE.MeshBasicMaterial({ color }));
  bulb.position.copy(light.position);
  scene.add(bulb);
}

function addDust() {
  const count = 90;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() * 2 - 1) * BOUND;
    positions[i * 3 + 1] = Math.random() * 4.2;
    positions[i * 3 + 2] = (Math.random() * 2 - 1) * BOUND;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0xb7e9ff, size: 0.07, transparent: true, opacity: 0.55 })
  );
  points.name = "dust";
  scene.add(points);
}

function buildGun() {
  gun = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x2b3444, metalness: 0.74, roughness: 0.28 });
  const accent = new THREE.MeshStandardMaterial({
    color: 0xd8fbff,
    emissive: 0x15c4d8,
    emissiveIntensity: 0.9,
    roughness: 0.32,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.46), metal);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.36), metal);
  barrel.position.set(0, 0.035, -0.36);
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.055, 0.09), accent);
  sight.position.set(0, 0.1, -0.06);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.08), metal);
  grip.position.set(0, -0.1, 0.02);
  grip.rotation.x = 0.35;
  gun.add(body, barrel, sight, grip);
  gun.position.set(0.26, -0.24, -0.55);
  camera.add(gun);

  flashLight = new THREE.PointLight(0xc8fbff, 0, 7, 2);
  flashLight.position.set(0.04, -0.04, -0.85);
  camera.add(flashLight);
}

function buildEnemy() {
  const group = new THREE.Group();
  armorMat = new THREE.MeshStandardMaterial({
    color: 0xd04552,
    roughness: 0.36,
    metalness: 0.48,
    emissive: 0x5a1020,
    emissiveIntensity: 0.65,
  });
  visorMat = new THREE.MeshStandardMaterial({
    color: 0xffd0b4,
    emissive: 0xff5a1f,
    emissiveIntensity: 1.7,
    roughness: 0.22,
  });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.86, 0.42), armorMat);
  torso.position.y = 1.28;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.38, 0.38), armorMat);
  head.position.y = 1.92;
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.09, 0.06), visorMat);
  visor.position.set(0, 1.94, -0.2);
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.05), visorMat);
  core.position.set(0, 1.28, -0.22);
  enemy.legL = makeLimb(0.18, 0.72, 0.22);
  enemy.legR = makeLimb(0.18, 0.72, 0.22);
  enemy.legL.position.set(-0.18, 0.78, 0);
  enemy.legR.position.set(0.18, 0.78, 0);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.48), armorMat);
  arm.position.set(0.32, 1.32, -0.28);
  const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.46), visorMat);
  rifle.position.set(0.32, 1.28, -0.68);
  group.add(torso, head, visor, core, enemy.legL, enemy.legR, arm, rifle);
  scene.add(group);
  enemy.group = group;

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 18),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.025;
  shadow.name = "enemy-shadow";
  scene.add(shadow);
}

function makeLimb(w, h, d) {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), armorMat);
  mesh.position.y = -h / 2;
  pivot.add(mesh);
  return pivot;
}

function resetRound() {
  player.x = 0;
  player.z = 14;
  player.yaw = 0;
  player.health = 100;
  player.cool = 0;
  player.moving = false;
  enemy.x = 0;
  enemy.z = -14;
  enemy.yaw = Math.PI;
  enemy.health = 100;
  enemy.charge = 0;
  enemy.shotWait = 0.55;
  enemy.deploy = 0.4;
  enemy.strafe = Math.random() < 0.5 ? -1 : 1;
  enemy.strafeT = 0.8;
  enemy.hit = 0;
  enemy.walking = false;
  enemy.group.rotation.z = 0;
  enemy.group.position.set(enemy.x, 0, enemy.z);
  clearProjectiles();
  shake = 0;
  hurtFlash = 0;
  gunKick = 0;
  roll = 0;
  playTime = 0;
  hint.classList.remove("gone");
}

function startMatch() {
  if (state === "play") return;
  ensureAudio();
  resetRound();
  state = "play";
  overlay.classList.add("hidden");
  overlay.classList.remove("won", "lost");
  hud.classList.remove("hidden");
  document.body.classList.add("playing");
  startButton.blur();
}

function endMatch(result) {
  if (state !== "play") return;
  state = "end";
  clearProjectiles();
  const won = result === "win";
  if (!won) score.losses += 1;
  overlayTitle.textContent = won ? "Vex down" : "You fell";
  overlayCopy.textContent = won
    ? "The pit goes quiet. Walk back in whenever you want the lane."
    : "Vex keeps the arena. Break line of sight, then take the shot.";
  record.textContent = "Wins " + score.wins + "  ·  Losses " + score.losses;
  startButton.textContent = "Rematch";
  overlay.classList.remove("hidden");
  overlay.classList.toggle("won", won);
  overlay.classList.toggle("lost", !won);
  document.body.classList.remove("playing");
  sfx(won ? "win" : "lose");
}

function updatePlayer(dt) {
  player.cool = Math.max(0, player.cool - dt);
  if (state !== "play" || player.health <= 0) {
    player.moving = false;
    return;
  }
  const turn = (keys.ArrowLeft ? 1 : 0) - (keys.ArrowRight ? 1 : 0);
  player.yaw += turn * TURN_SPEED * dt;
  const move = (keys.ArrowUp ? 1 : 0) - (keys.ArrowDown ? 1 : 0);
  const facing = forwardFromYaw(player.yaw);
  player.moving = move !== 0;
  if (move !== 0) {
    moveBody(player, facing.x * move * PLAYER_SPEED * dt, facing.z * move * PLAYER_SPEED * dt, PLAYER_RADIUS);
    bob += dt * 10;
  }
  roll = THREE.MathUtils.damp(roll, -turn * 0.03, 10, dt);
  if (keys.Space && player.cool <= 0) {
    playerFire();
    player.cool = PLAYER_FIRE_DELAY;
  }
}

function updateEnemy(dt) {
  enemyFlash.position.set(enemy.x, EYE, enemy.z);
  if (enemy.health <= 0) {
    enemy.group.rotation.z = THREE.MathUtils.damp(enemy.group.rotation.z, 1.2, 3.5, dt);
    enemy.group.position.y = THREE.MathUtils.damp(enemy.group.position.y, 0.2, 3, dt);
    visorMat.emissiveIntensity = 0.2;
    return;
  }

  const desired = yawToward(enemy.x, enemy.z, player.x, player.z);
  const step = 1.85 * dt;
  enemy.yaw += clamp(wrapAngle(desired - enemy.yaw), -step, step);
  enemy.group.rotation.y = enemy.yaw;
  enemy.group.rotation.z = THREE.MathUtils.damp(enemy.group.rotation.z, 0, 8, dt);

  const facing = forwardFromYaw(enemy.yaw);
  const right = { x: -facing.z, z: facing.x };
  const dist = Math.hypot(player.x - enemy.x, player.z - enemy.z);
  enemy.walking = false;

  if (state === "play") {
    enemy.deploy = Math.max(0, enemy.deploy - dt);
    enemy.strafeT -= dt;
    if (enemy.strafeT <= 0) {
      enemy.strafe = Math.random() < 0.5 ? -1 : 1;
      enemy.strafeT = 0.75 + Math.random() * 1.4;
    }
    if (enemy.deploy <= 0) {
      let vx = right.x * enemy.strafe;
      let vz = right.z * enemy.strafe;
      if (dist > 12) {
        vx += facing.x;
        vz += facing.z;
      } else if (dist < 6.5) {
        vx -= facing.x * 0.9;
        vz -= facing.z * 0.9;
      }
      const mag = Math.hypot(vx, vz) || 1;
      vx /= mag;
      vz /= mag;
      if (circleBlocked(enemy.x + vx * 1.3, enemy.z + vz * 1.3, ENEMY_RADIUS)) {
        enemy.strafe *= -1;
        vx = right.x * enemy.strafe;
        vz = right.z * enemy.strafe;
      }
      const beforeX = enemy.x;
      const beforeZ = enemy.z;
      moveBody(enemy, vx * ENEMY_SPEED * dt, vz * ENEMY_SPEED * dt, ENEMY_RADIUS);
      enemy.walking = Math.hypot(enemy.x - beforeX, enemy.z - beforeZ) > ENEMY_SPEED * dt * 0.2;
      if (!enemy.walking) enemy.strafe *= -1;
    }

    const aimError = Math.abs(wrapAngle(desired - enemy.yaw));
    const linedUp = aimError < 0.22 && dist > 3.2 && dist < 27 && hasLineOfSight(enemy.x, enemy.z, player.x, player.z);
    if (linedUp) enemy.charge = Math.min(0.5, enemy.charge + dt);
    else enemy.charge = Math.max(0, enemy.charge - dt * 1.5);
    enemy.shotWait -= dt;
    if (enemy.charge >= 0.48 && enemy.shotWait <= 0) {
      enemyFire();
      enemy.charge = 0;
      enemy.shotWait = 1.15;
    }
  } else {
    enemy.charge = 0;
  }

  const bobY = Math.sin(time * (enemy.walking ? 10 : 2.2)) * (enemy.walking ? 0.045 : 0.02);
  enemy.group.position.set(enemy.x, bobY, enemy.z);
  const swing = enemy.walking ? Math.sin(time * 10) * 0.55 : 0;
  enemy.legL.rotation.x = swing;
  enemy.legR.rotation.x = -swing;
  visorMat.emissiveIntensity = 1.5 + (enemy.charge / 0.48) * 7;
  armorMat.emissive.setHex(enemy.hit > 0 ? 0xfff0ea : 0x5a1020);
  enemy.hit = Math.max(0, enemy.hit - dt);

  const shadow = scene.getObjectByName("enemy-shadow");
  if (shadow) shadow.position.set(enemy.x, 0.025, enemy.z);
}

function updateProjectiles(dt) {
  const stepLength = 0.3;
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const shot = projectiles[i];
    shot.life -= dt;
    let remove = shot.life <= 0;
    const travel = BOLT_SPEED * dt;
    const steps = Math.max(1, Math.ceil(travel / stepLength));
    const step = travel / steps;
    for (let s = 0; s < steps && !remove; s++) {
      shot.x += shot.dx * step;
      shot.z += shot.dz * step;
      if (pointHitsCover(shot.x, shot.z)) {
        spawnSpark(shot.x, shot.z, 0xff8a3a);
        remove = true;
        break;
      }
      const dx = shot.x - player.x;
      const dz = shot.z - player.z;
      if (dx * dx + dz * dz < 0.48 * 0.48) {
        damagePlayer(ENEMY_DAMAGE);
        spawnSpark(player.x, player.z, 0xffd2c2);
        if (state !== "play") return;
        remove = true;
      }
    }
    shot.mesh.position.set(shot.x, EYE, shot.z);
    lookTarget.set(shot.x + shot.dx, EYE, shot.z + shot.dz);
    shot.mesh.lookAt(lookTarget);
    if (remove) {
      scene.remove(shot.mesh);
      projectiles.splice(i, 1);
    }
  }
}

function updateBeams(dt) {
  for (let i = beams.length - 1; i >= 0; i--) {
    beams[i].life -= dt;
    beams[i].mesh.material.opacity = Math.max(0, beams[i].life / 0.08);
    if (beams[i].life <= 0) {
      scene.remove(beams[i].mesh);
      beams[i].mesh.material.dispose();
      beams.splice(i, 1);
    }
  }
}

function updateSparks(dt) {
  for (let i = sparks.length - 1; i >= 0; i--) {
    sparks[i].life -= dt;
    const scale = 1 + (0.16 - sparks[i].life) * 8;
    sparks[i].mesh.scale.setScalar(Math.max(0.2, scale));
    sparks[i].mesh.material.opacity = Math.max(0, sparks[i].life / 0.16);
    if (sparks[i].life <= 0) {
      scene.remove(sparks[i].mesh);
      sparks[i].mesh.material.dispose();
      sparks.splice(i, 1);
    }
  }
}

function updateDust(dt) {
  const dust = scene.getObjectByName("dust");
  if (!dust) return;
  const positions = dust.geometry.attributes.position;
  for (let i = 1; i < positions.array.length; i += 3) {
    positions.array[i] += dt * 0.22;
    if (positions.array[i] > 4.4) positions.array[i] = 0.15;
  }
  positions.needsUpdate = true;
}

function updateCamera(dt) {
  const bobY = player.moving && state === "play" ? Math.sin(bob) * 0.045 : 0;
  const jx = (Math.random() - 0.5) * shake;
  const jz = (Math.random() - 0.5) * shake;
  camera.position.set(player.x + jx, EYE + bobY, player.z + jz);
  camera.rotation.y = player.yaw;
  camera.rotation.x = 0;
  camera.rotation.z = state === "play" ? roll : 0;
  shake = Math.max(0, shake - dt * 1.8);
  gun.position.z = -0.55 - gunKick * 0.16;
  gun.position.y = -0.24 - gunKick * 0.03;
  gunKick = THREE.MathUtils.damp(gunKick, 0, 16, dt);
  flashLight.intensity = Math.max(0, flashLight.intensity - dt * 48);
  enemyFlash.intensity = Math.max(0, enemyFlash.intensity - dt * 32);
}

function updateHud() {
  playerHp.textContent = String(Math.ceil(player.health));
  enemyHp.textContent = String(Math.ceil(enemy.health));
  playerFill.style.width = player.health + "%";
  enemyFill.style.width = enemy.health + "%";
  playerBar.classList.toggle("low", player.health > 0 && player.health <= 35);
  const ready = 1 - clamp(player.cool, 0, PLAYER_FIRE_DELAY) / PLAYER_FIRE_DELAY;
  readyFill.style.transform = "scaleX(" + ready + ")";
  hurt.style.opacity = String(hurtFlash);
  hurtFlash = Math.max(0, hurtFlash - 0.02);
  hint.classList.toggle("gone", playTime > 8);
  updateMarker();
  if (state !== "menu") drawRadar();
}

function updateMarker() {
  if (state === "menu" || enemy.health <= 0) {
    marker.hidden = true;
    crosshair.classList.remove("lock");
    return;
  }
  const facing = forwardFromYaw(player.yaw);
  const dx = enemy.x - player.x;
  const dz = enemy.z - player.z;
  const along = dx * facing.x + dz * facing.z;
  if (along <= 0.5) {
    marker.hidden = true;
  } else {
    aimPoint.set(enemy.x, 2.25, enemy.z).project(camera);
    marker.hidden = false;
    marker.style.left = (aimPoint.x * 0.5 + 0.5) * window.innerWidth + "px";
    marker.style.top = (-aimPoint.y * 0.5 + 0.5) * window.innerHeight + "px";
    markerDistance.textContent = Math.round(Math.hypot(dx, dz)) + "m";
  }
  const dist = Math.hypot(dx, dz);
  const aimError = Math.abs(wrapAngle(yawToward(player.x, player.z, enemy.x, enemy.z) - player.yaw));
  const onTarget = aimError < Math.atan2(ENEMY_HIT_RADIUS, Math.max(dist, 0.5)) && hasLineOfSight(player.x, player.z, enemy.x, enemy.z);
  crosshair.classList.toggle("lock", state === "play" && enemy.health > 0 && onTarget);
}

function drawRadar() {
  const size = radar.width;
  const ctx = radarCtx;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "rgba(8, 12, 18, 0.78)";
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  const scale = (size * 0.5 - 12) / BOUND;
  const toX = (x) => size / 2 + x * scale;
  const toY = (z) => size / 2 + z * scale;

  ctx.strokeStyle = "rgba(255, 106, 50, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, 4.3 * scale, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(90, 210, 255, 0.38)";
  obstacles.forEach((box) => {
    ctx.fillRect(toX(box.x - box.hx), toY(box.z - box.hz), box.hx * 2 * scale, box.hz * 2 * scale);
  });

  ctx.fillStyle = "#ff7a32";
  projectiles.forEach((shot) => {
    ctx.fillRect(toX(shot.x) - 2, toY(shot.z) - 2, 4, 4);
  });

  if (enemy.health > 0) {
    ctx.fillStyle = "#ff4b3a";
    ctx.beginPath();
    ctx.arc(toX(enemy.x), toY(enemy.z), 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const facing = forwardFromYaw(player.yaw);
  ctx.strokeStyle = "#7ef0ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(toX(player.x), toY(player.z));
  ctx.lineTo(toX(player.x + facing.x * 2.4), toY(player.z + facing.z * 2.4));
  ctx.stroke();
  ctx.fillStyle = "#dffbff";
  ctx.beginPath();
  ctx.arc(toX(player.x), toY(player.z), 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function playerFire() {
  const facing = forwardFromYaw(player.yaw);
  const originX = player.x + facing.x * 0.75;
  const originZ = player.z + facing.z * 0.75;
  const range = 48;
  const coverDist = distanceToCover(originX, originZ, facing.x, facing.z, range);
  let end = coverDist;
  let struck = false;
  if (enemy.health > 0) {
    const enemyDist = distanceToCircle(originX, originZ, facing.x, facing.z, enemy.x, enemy.z, ENEMY_HIT_RADIUS);
    if (enemyDist !== null && enemyDist <= coverDist) {
      end = enemyDist;
      struck = true;
    }
  }
  const endX = originX + facing.x * end;
  const endZ = originZ + facing.z * end;
  spawnBeam(originX, originZ, endX, endZ, 0x9af6ff);
  spawnSpark(endX, endZ, struck ? 0xffd8bf : 0x9adfff);
  if (struck) damageEnemy(PLAYER_DAMAGE);
  gunKick = 1;
  flashLight.intensity = 8;
  shake = Math.max(shake, 0.025);
  sfx("player");
  crosshair.classList.add("hit");
  window.setTimeout(() => crosshair.classList.remove("hit"), 80);
}

function enemyFire() {
  const dx = player.x - enemy.x;
  const dz = player.z - enemy.z;
  const dist = Math.hypot(dx, dz) || 1;
  const dirX = dx / dist;
  const dirZ = dz / dist;
  const spread = (Math.random() - 0.5) * 0.04;
  const cos = Math.cos(spread);
  const sin = Math.sin(spread);
  const shotX = dirX * cos - dirZ * sin;
  const shotZ = dirX * sin + dirZ * cos;
  spawnProjectile(enemy.x + dirX * 0.9, enemy.z + dirZ * 0.9, shotX, shotZ);
  enemyFlash.intensity = 7;
  sfx("enemy");
}

function damageEnemy(amount) {
  if (state !== "play" || enemy.health <= 0) return;
  enemy.health = Math.max(0, enemy.health - amount);
  enemy.hit = 0.14;
  floatText("Hit", "hit");
  sfx("hit");
  if (enemy.health <= 0) {
    score.wins += 1;
    endMatch("win");
  }
}

function damagePlayer(amount) {
  if (state !== "play" || player.health <= 0) return;
  player.health = Math.max(0, player.health - amount);
  hurtFlash = 0.72;
  shake = Math.max(shake, 0.09);
  floatText("-" + amount, "hurt");
  sfx("pain");
  if (player.health <= 0) endMatch("lose");
}

function spawnBeam(x1, z1, x2, z2, color) {
  const length = Math.hypot(x2 - x1, z2 - z1);
  if (length < 0.05) return;
  const mesh = new THREE.Mesh(
    beamGeo,
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
  );
  mesh.position.set((x1 + x2) / 2, EYE, (z1 + z2) / 2);
  lookTarget.set(x2, EYE, z2);
  mesh.lookAt(lookTarget);
  mesh.scale.set(1, 1, length);
  scene.add(mesh);
  beams.push({ mesh, life: 0.08 });
}

function spawnSpark(x, z, color) {
  const mesh = new THREE.Mesh(
    sparkGeo,
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 })
  );
  mesh.position.set(x, EYE, z);
  scene.add(mesh);
  sparks.push({ mesh, life: 0.16 });
}

function spawnProjectile(x, z, dx, dz) {
  const mesh = new THREE.Mesh(boltGeo, boltMat);
  mesh.position.set(x, EYE, z);
  scene.add(mesh);
  projectiles.push({ mesh, x, z, dx, dz, life: 2.4 });
}

function clearProjectiles() {
  projectiles.forEach((shot) => scene.remove(shot.mesh));
  projectiles.length = 0;
}

function separateBodies() {
  let dx = player.x - enemy.x;
  let dz = player.z - enemy.z;
  let dist = Math.hypot(dx, dz);
  const minDist = PLAYER_RADIUS + ENEMY_RADIUS;
  if (dist >= minDist) return;
  if (dist < 0.0001) {
    dx = 1;
    dz = 0;
    dist = 1;
  }
  const push = (minDist - dist) * 0.5;
  const nx = dx / dist;
  const nz = dz / dist;
  moveBody(player, nx * push, nz * push, PLAYER_RADIUS);
  if (enemy.health > 0) moveBody(enemy, -nx * push, -nz * push, ENEMY_RADIUS);
}

function moveBody(body, dx, dz, radius) {
  if (!circleBlocked(body.x + dx, body.z, radius)) body.x += dx;
  if (!circleBlocked(body.x, body.z + dz, radius)) body.z += dz;
}

function circleBlocked(x, z, radius) {
  if (Math.abs(x) > BOUND - radius || Math.abs(z) > BOUND - radius) return true;
  for (let i = 0; i < obstacles.length; i++) {
    const box = obstacles[i];
    const nearestX = clamp(x, box.x - box.hx, box.x + box.hx);
    const nearestZ = clamp(z, box.z - box.hz, box.z + box.hz);
    const dx = x - nearestX;
    const dz = z - nearestZ;
    if (dx * dx + dz * dz < radius * radius) return true;
  }
  return false;
}

function pointHitsCover(x, z) {
  if (Math.abs(x) >= BOUND || Math.abs(z) >= BOUND) return true;
  for (let i = 0; i < obstacles.length; i++) {
    const box = obstacles[i];
    if (Math.abs(x - box.x) <= box.hx && Math.abs(z - box.z) <= box.hz) return true;
  }
  return false;
}

function distanceToCover(ox, oz, dx, dz, maxDist) {
  let best = maxDist;
  for (let i = 0; i < obstacles.length; i++) {
    const hit = rayBox(ox, oz, dx, dz, obstacles[i]);
    if (hit !== null && hit < best) best = hit;
  }
  if (Math.abs(dx) > 1e-8) {
    const wall = dx > 0 ? (BOUND - ox) / dx : (-BOUND - ox) / dx;
    if (wall > 0 && wall < best) best = wall;
  }
  if (Math.abs(dz) > 1e-8) {
    const wall = dz > 0 ? (BOUND - oz) / dz : (-BOUND - oz) / dz;
    if (wall > 0 && wall < best) best = wall;
  }
  return best;
}

function rayBox(ox, oz, dx, dz, box) {
  let tmin = 0;
  let tmax = Infinity;
  const slabs = [
    [ox, dx, box.x - box.hx, box.x + box.hx],
    [oz, dz, box.z - box.hz, box.z + box.hz],
  ];
  for (let i = 0; i < slabs.length; i++) {
    const origin = slabs[i][0];
    const dir = slabs[i][1];
    const min = slabs[i][2];
    const max = slabs[i][3];
    if (Math.abs(dir) < 1e-8) {
      if (origin < min || origin > max) return null;
      continue;
    }
    let t1 = (min - origin) / dir;
    let t2 = (max - origin) / dir;
    if (t1 > t2) {
      const swap = t1;
      t1 = t2;
      t2 = swap;
    }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  if (tmax < 0) return null;
  return tmin < 0 ? 0 : tmin;
}

function distanceToCircle(ox, oz, dx, dz, cx, cz, radius) {
  const lx = cx - ox;
  const lz = cz - oz;
  const t = lx * dx + lz * dz;
  if (t < 0) return null;
  const px = ox + dx * t;
  const pz = oz + dz * t;
  const perp = (px - cx) * (px - cx) + (pz - cz) * (pz - cz);
  if (perp > radius * radius) return null;
  const hit = t - Math.sqrt(radius * radius - perp);
  if (hit < 0) return 0;
  return hit;
}

function hasLineOfSight(x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const dist = Math.hypot(dx, dz);
  if (dist < 0.001) return true;
  return distanceToCover(x1, z1, dx / dist, dz / dist, dist) >= dist - 0.08;
}

function forwardFromYaw(yaw) {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}

function yawToward(x, z, targetX, targetZ) {
  return Math.atan2(-(targetX - x), -(targetZ - z));
}

function wrapAngle(angle) {
  const tau = Math.PI * 2;
  angle = (angle + Math.PI) % tau;
  if (angle < 0) angle += tau;
  return angle - Math.PI;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function floatText(text, kind) {
  const el = document.createElement("p");
  el.className = "floater " + kind;
  el.textContent = text;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 600);
}

function ensureAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function sfx(kind) {
  if (!audioCtx) return;
  if (kind === "player") {
    noise(0.08, 0.16, 1700);
    tone(460, 0.07, "square", 0.035, 0.45);
  } else if (kind === "enemy") {
    noise(0.12, 0.1, 640);
    tone(170, 0.16, "sawtooth", 0.04, 0.5);
  } else if (kind === "hit") {
    tone(860, 0.07, "square", 0.045, 1.5);
  } else if (kind === "pain") {
    noise(0.14, 0.14, 280);
    tone(130, 0.18, "triangle", 0.05, 0.45);
  } else if (kind === "win") {
    tone(523, 0.1, "square", 0.04, 1.2);
    window.setTimeout(() => tone(784, 0.16, "square", 0.04, 1.15), 100);
  } else if (kind === "lose") {
    tone(180, 0.28, "sawtooth", 0.045, 0.35);
  }
}

function tone(freq, duration, type, volume, slide) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), audioCtx.currentTime + duration);
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function noise(duration, volume, frequency) {
  if (!audioCtx) return;
  const count = Math.max(1, Math.floor(audioCtx.sampleRate * duration));
  const buffer = audioCtx.createBuffer(1, count, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < count; i++) data[i] = Math.random() * 2 - 1;
  const source = audioCtx.createBufferSource();
  const filter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  source.start();
}

function onKeyDown(event) {
  if (event.code === "Space" || event.code.indexOf("Arrow") === 0) event.preventDefault();
  keys[event.code] = true;
  if (event.code === "Enter" && !event.repeat && state !== "play") {
    event.preventDefault();
    startMatch();
  }
}

function onKeyUp(event) {
  keys[event.code] = false;
}

function clearKeys() {
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
}

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

