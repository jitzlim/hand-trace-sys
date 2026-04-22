import * as THREE from 'three';

const GRAB_RADIUS = 0.55;
const UNDO_LIMIT  = 12;
const CLAY_COLOR  = 0x39FF14;
const BASE_RADIUS = 1.5;

let mesh, geometry;
let origPositions;
let undoStack = [];
let indicator = null;

// ── Value noise + FBM ─────────────────────────────────────

function hash(a, b, c) {
  let n = Math.imul(a * 374761393 + b * 668265263 + c * 1274126177, 1274126177);
  n ^= n >>> 13;
  return (Math.imul(n, 1274126177) >>> 0) / 0xffffffff;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(t) { return t * t * (3 - 2 * t); }

function valueNoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u  = smoothstep(x - xi);
  const v  = smoothstep(y - yi);
  const w  = smoothstep(z - zi);
  return lerp(
    lerp(lerp(hash(xi,yi,zi), hash(xi+1,yi,zi), u), lerp(hash(xi,yi+1,zi), hash(xi+1,yi+1,zi), u), v),
    lerp(lerp(hash(xi,yi,zi+1), hash(xi+1,yi,zi+1), u), lerp(hash(xi,yi+1,zi+1), hash(xi+1,yi+1,zi+1), u), v),
    w,
  );
}

function fbm(x, y, z) {
  return valueNoise(x, y, z)       * 0.500
       + valueNoise(x*2, y*2, z*2) * 0.250
       + valueNoise(x*4, y*4, z*4) * 0.125
       + valueNoise(x*8, y*8, z*8) * 0.0625;
}

// ── Surface bump texture ──────────────────────────────────

function makeBumpTexture() {
  const SIZE   = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(SIZE, SIZE);
  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const nx = px / SIZE * 8;
      const ny = py / SIZE * 8;
      // Layered: mid bumps + fine grain + scratches
      const mid    = fbm(nx,     ny,     1.7) * 0.55;
      const fine   = valueNoise(nx * 6, ny * 6, 3.3) * 0.30;
      const finest = valueNoise(nx * 18, ny * 18, 7.1) * 0.15;
      const v      = Math.min(mid + fine + finest, 1);
      const b      = Math.floor(v * 255);
      const i      = (py * SIZE + px) * 4;
      img.data[i] = img.data[i+1] = img.data[i+2] = b;
      img.data[i+3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

// ── Initial blob deformation ──────────────────────────────

function randomPointOnSphere(r) {
  const theta = Math.random() * Math.PI * 2;
  const phi   = Math.acos(2 * Math.random() - 1);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi),
  ).multiplyScalar(r);
}

function blobify(geo) {
  const pos = geo.attributes.position;

  // Random asymmetric stretch — a blob is rarely a perfect sphere
  const stretchX = 0.92 + Math.random() * 0.16;
  const stretchY = 0.92 + Math.random() * 0.16;
  const stretchZ = 0.92 + Math.random() * 0.16;

  // Pick 4–6 "thumb press" points where the clay was handled
  const presses = [];
  const numPresses = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < numPresses; i++) {
    presses.push({
      center: randomPointOnSphere(BASE_RADIUS),
      depth:  0.10 + Math.random() * 0.12,
      radius: 0.55 + Math.random() * 0.25,
    });
  }

  // A couple of "pulled nubs" — gentle outward pulls
  const pulls = [];
  const numPulls = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < numPulls; i++) {
    pulls.push({
      center: randomPointOnSphere(BASE_RADIUS),
      strength: 0.08 + Math.random() * 0.10,
      radius:   0.45 + Math.random() * 0.20,
    });
  }

  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));

    // 1) Asymmetric stretch
    v.x *= stretchX;
    v.y *= stretchY;
    v.z *= stretchZ;

    // 2) Large organic variation from FBM
    const nLarge = fbm(v.x * 0.85 + 1.3, v.y * 0.85 + 2.7, v.z * 0.85 + 0.5);
    const large  = (nLarge * 2 - 1) * 0.14;

    // 3) Medium surface lumps
    const nMed = valueNoise(v.x * 2.5, v.y * 2.5, v.z * 2.5);
    const med  = (nMed * 2 - 1) * 0.05;

    let displacement = large + med;

    // 4) Thumb indents
    for (const p of presses) {
      const d = v.distanceTo(p.center);
      if (d < p.radius) {
        const t = 1 - d / p.radius;
        displacement -= p.depth * smoothstep(t);
      }
    }

    // 5) Pulled nubs
    for (const p of pulls) {
      const d = v.distanceTo(p.center);
      if (d < p.radius) {
        const t = 1 - d / p.radius;
        displacement += p.strength * smoothstep(t);
      }
    }

    const disp = 1 + displacement;
    pos.setXYZ(i, v.x * disp, v.y * disp, v.z * disp);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}

// ── Public API ────────────────────────────────────────────

export function createClayMesh(scene) {
  // Level 5 = ~10k vertices — smooth to the eye, still performs for sculpting
  geometry = new THREE.IcosahedronGeometry(BASE_RADIUS, 5);
  blobify(geometry);

  mesh = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({
    color:              CLAY_COLOR,
    roughness:          0.78,
    metalness:          0.0,
    clearcoat:          0.2,
    clearcoatRoughness: 0.75,
    bumpMap:            makeBumpTexture(),
    bumpScale:          0.05,
    envMapIntensity:    0.8,
  }));
  scene.add(mesh);

  origPositions = geometry.attributes.position.array.slice();
  return mesh;
}

export function createIndicator(scene) {
  indicator = new THREE.Mesh(
    new THREE.SphereGeometry(0.048, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }),
  );
  indicator.renderOrder = 999;
  indicator.visible     = false;
  scene.add(indicator);
}

export function hideIndicator() {
  if (indicator) indicator.visible = false;
}

export function updateIndicator(ndcX, ndcY, camera, isGrabbing) {
  if (!indicator || !mesh) return;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
  const hits = raycaster.intersectObject(mesh);

  if (hits.length) {
    const toCamera = new THREE.Vector3()
      .subVectors(camera.position, hits[0].point)
      .normalize();
    indicator.position.copy(hits[0].point).addScaledVector(toCamera, 0.05);
    indicator.visible = true;
    indicator.material.color.setHex(isGrabbing ? 0xffee00 : 0xffffff);
    indicator.scale.setScalar(isGrabbing ? 0.75 : 1.0);
  } else {
    indicator.visible = false;
  }
}

export function getMesh() { return mesh; }

export function startGrab(ndcX, ndcY, camera) {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
  const hits = raycaster.intersectObject(mesh);
  if (!hits.length) return null;

  const anchorWorld = hits[0].point.clone();
  const planeNormal = new THREE.Vector3().subVectors(camera.position, anchorWorld).normalize();
  const plane       = new THREE.Plane().setFromNormalAndCoplanarPoint(planeNormal, anchorWorld);

  const pos       = geometry.attributes.position;
  const grabVerts = [];
  for (let i = 0; i < pos.count; i++) {
    const v    = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
    const dist = v.distanceTo(anchorWorld);
    if (dist < GRAB_RADIUS) {
      const t = 1 - dist / GRAB_RADIUS;
      grabVerts.push({ i, weight: smoothstep(t) });
    }
  }

  if (!grabVerts.length) return null;
  return { grabVerts, anchorWorld, plane };
}

export function applyGrab(grab, ndcX, ndcY, camera) {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera({ x: ndcX, y: ndcY }, camera);
  const newPoint = new THREE.Vector3();
  if (!raycaster.ray.intersectPlane(grab.plane, newPoint)) return;

  const delta = newPoint.clone().sub(grab.anchorWorld);
  grab.anchorWorld.copy(newPoint);

  const planeNormal = new THREE.Vector3().subVectors(camera.position, grab.anchorWorld).normalize();
  grab.plane.setFromNormalAndCoplanarPoint(planeNormal, grab.anchorWorld);

  const pos = geometry.attributes.position;
  for (const { i, weight } of grab.grabVerts) {
    pos.setXYZ(i,
      pos.getX(i) + delta.x * weight,
      pos.getY(i) + delta.y * weight,
      pos.getZ(i) + delta.z * weight,
    );
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

export function saveUndo() {
  undoStack.push(geometry.attributes.position.array.slice());
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
}

export function undo() {
  if (!undoStack.length) return false;
  geometry.attributes.position.array.set(undoStack.pop());
  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();
  return true;
}

export function getUndoCount() { return undoStack.length; }
