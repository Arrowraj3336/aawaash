import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { buildingProfiles, buildResidence } from "./residence-massing.js";

function buildModel(project, texture, facadeMaps) {
  const model = new THREE.Group();
  const colors = {
    concrete: 0xc3c0b6, trim: 0xd6d3ca, charcoal: 0x35383a, frame: 0x505353,
    glass: 0x648290, railing: 0x88a2ae, stone: 0x605142, warm: 0xa9906b,
    facade0: 0xffffff, facade1: 0xffffff, facade2: 0xffffff, facade3: 0xffffff,
    asphalt: 0x85827e, ivory: 0xdedbd1, leaf: 0x55673b, bud: 0x6f8149, lamp: 0xf7ce88,
  };
  if (project === "savitri") Object.assign(colors, {
    concrete: 0xa78571, trim: 0xefe4d4, charcoal: 0x574538, frame: 0x302b26,
    glass: 0x637779, railing: 0x829b9c, stone: 0x705643, warm: 0xc8a17a,
  });
  if (project === "shree") Object.assign(colors, {
    concrete: 0xd1c2ad, trim: 0xece2d2, charcoal: 0x4d4844, frame: 0x272d2c,
    glass: 0x5c7983, stone: 0xb8855d,
  });
  const olive = new THREE.Color(0x778c49);
  const materials = [];
  const selectables = [];
  let boxes = [];
  const box = (color, x, y, z, w, h, d) => {
    boxes.push({ color, geometry: new THREE.BoxGeometry(w, h, d).translate(x, y, z) });
  };
  const leaf = (x, y, z) => {
    for (const [dx, dy, dz, size, color] of [
      [0, 0, 0, .105, "leaf"], [-.068, -.012, .034, .073, "bud"], [.058, .052, .028, .071, "leaf"],
    ]) {
      const shape = new THREE.IcosahedronGeometry(size, 0).scale(1.13, .9, .92).translate(x + dx, y + dy, z + dz);
      shape.setIndex(Array.from({ length: shape.attributes.position.count }, (_, i) => i));
      boxes.push({ color, geometry: shape });
    }
  };
  const facade = (tile, x, y, z, width, height, rotation = 0) => {
    const geometry = new THREE.PlaneGeometry(width, height).rotateY(rotation).translate(x, y, z);
    boxes.push({ color: `facade${tile}`, geometry });
  };
  const finish = (area) => {
    const group = new THREE.Group();
    group.userData.area = area;
    for (const [name, color] of Object.entries(colors)) {
      const parts = boxes.filter((part) => part.color === name);
      if (!parts.length) continue;
      const geometry = mergeGeometries(parts.map((part) => part.geometry));
      parts.forEach((part) => part.geometry.dispose());
      const masonry = ["concrete", "stone", "trim", "charcoal"].includes(name);
      const glazing = name === "glass" || name === "railing";
      const photo = name.startsWith("facade") ? Number(name.at(-1)) : null;
      const material = photo === null ? new THREE.MeshStandardMaterial({
        color,
        roughness: glazing ? .27 : .85,
        metalness: glazing ? .18 : .02,
        map: masonry ? texture : null,
        bumpMap: masonry ? texture : null,
        bumpScale: .035,
        emissive: name === "lamp" ? 0xffbd66 : name === "warm" ? 0x58300d : 0,
        emissiveIntensity: name === "lamp" ? .85 : .25,
      }) : new THREE.MeshBasicMaterial({ color, map: facadeMaps[photo], toneMapped: false });
      material.userData = { masonry, photo };
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = mesh.receiveShadow = photo === null;
      group.add(mesh);
      materials.push({ material, color: material.color.clone(), area });
      selectables.push(mesh);
    }
    model.add(group);
    boxes = [];
  };

  if (project !== "avenue") {
    buildResidence(project, { box, facade, leaf, finish });
  } else {
    buildAvenue({ box, facade, leaf, finish });
  }

  buildParking({ box, finish, boxes }, project);
  return {
    model, selectables,
    highlight(area) {
      for (const entry of materials) {
        entry.material.color.copy(entry.color);
        if (entry.area === area) entry.material.color.lerp(olive, .65);
      }
    },
  };
}

function buildAvenue({ box, facade, leaf, finish }) {
  box("charcoal", 0, .33, -.2, 10, .66, 3.95);
  for (const x of [-4.8, -3.75, -2.6, 2.6, 3.75, 4.8])
    box("concrete", x, .33, 2.11, .2, .66, .21);
  box("stone", 0, .19, 2.36, 2.72, .35, .23);
  for (let i = -9; i <= 9; i++)
    box("frame", i * .135, .35, 2.47, .035, .47, .05);
  finish();

  const wings = [-1, 1];
  for (let floor = 1; floor <= 8; floor++) {
    const y = .65 + (floor - .5) * .87;
    box("stone", 0, y, 0, 1, .87, 3.41);
    for (const side of wings) {
      box("concrete", side * 2.72, y, 0, 4.6, .87, 4.35);
      box("charcoal", side * 3.27, y, 2.19, .73, .87, .12);
      box("charcoal", side * 2.46, y, -2.19, 3.75, .87, .12);
      box("frame", side * .22, y + .06, 1.73, .27, .45, .07);
      box("warm", side * .22, y + .06, 1.775, .19, .35, .028);
      for (const [x, width] of [[1.86, 2.24], [4.36, 1.23]]) {
        box("trim", side * x, y - .38, 2.34, width, .125, .64);
        box("trim", side * x, y + .38, 2.27, width, .095, .49);
        facade(x < 3 ? (floor + (side === 1 ? 1 : 0)) % 2 : 2, side * x, y, 2.47, width - .055, .64);
        box("frame", side * x, y - .105, 2.67, width - .06, .029, .045);
        box("lamp", side * x, y + .322, 2.48, .085, .024, .09);
        if ((floor + side) % 3 === 0) {
          box("stone", side * (x - .35 * width), y - .27, 2.56, .17, .12, .18);
          leaf(side * (x - .35 * width), y - .15, 2.56);
        }
        for (const offset of [-.34, .34])
          box("frame", side * (x + width * offset), y - .215, 2.68, .021, .21, .024);
      }
      for (const x of [.97, 1.7, 2.25, 3.27, 4.19, 4.58]) {
        const color = x === .97 || x === 4.58 ? "warm" : "glass";
        box("frame", side * x, y + .035, 2.256, .43, .56, .075);
        box(color, side * x, y + .035, 2.299, .35, .47, .02);
        box("frame", side * x, y + .035, 2.314, .023, .47, .014);
      }
      for (const x of [.9, 1.78, 2.66, 3.54, 4.55]) {
        box("trim", side * x, y + .06, -2.262, .51, .53, .11);
        box("glass", side * x, y + .06, -2.327, .43, .45, .028);
      }
      for (const z of [-1.37, 0, 1.37]) {
        box("frame", side * 5.04, y + .035, z, .08, .43, .57);
        box("glass", side * 5.087, y + .035, z, .026, .34, .48);
        box("frame", side * 5.107, y + .035, z, .02, .34, .024);
        if (side === -1) {
          box("trim", -5.19, y - .31, z, .46, .12, .75);
          facade(3, -5.37, y - .012, z, .73, .48, -Math.PI / 2);
        }
      }
    }
    finish(floor === 2 ? "two" : floor === 5 ? "three" : undefined);
  }

  for (const side of wings) {
    const x = side * 1.62;
    box("trim", side * 2.72, 7.7, 0, 4.71, .24, 4.5);
    box("concrete", side * 4.32, 7.94, 0, 1.4, .32, 4.1);
    box("concrete", x, 7.94, .31, 2.74, .32, 2.88);
    box("railing", x, 8.17, 1.72, 2.64, .25, .08);
    for (const offset of [-1.26, 1.26]) {
      for (const z of [-1.06, 1.64]) box("charcoal", x + offset, 8.51, z, .14, 1.14, .15);
      box("charcoal", x + offset, 9.02, .29, .15, .15, 2.89);
    }
    for (const z of [-1.07, 1.65]) box("charcoal", x, 9.02, z, 2.74, .15, .15);
    for (let i = -7; i <= 7; i++) box("charcoal", x + i * .17, 9.035, .29, .061, .12, 2.64);
  }
  finish("roof");

}

function buildParking({ box, finish, boxes }, project) {
  const bayX = project === "avenue" ? -6.16 :  -6.25;
  const bayZ = .89;
  box("asphalt", bayX, .053, bayZ, 2, .106, 3.15);
  for (const x of [-.89, .89]) box("ivory", bayX + x, .12, bayZ, .06, .025, 2.98);
  for (const z of [-1.47, 1.47]) box("ivory", bayX, .12, bayZ + z, 1.82, .025, .06);
  box("ivory", bayX, .35, bayZ, 1.18, .43, 2.36);
  const profile = new THREE.Shape();
  profile.moveTo(-.76, .49);
  profile.lineTo(-.45, .84);
  profile.quadraticCurveTo(0, 1, .49, .84);
  profile.lineTo(.91, .47);
  profile.closePath();
  const cabin = new THREE.ExtrudeGeometry(profile, { depth: .85, bevelEnabled: true, bevelSize: .05, bevelThickness: .06, bevelSegments: 2, steps: 1 });
  cabin.rotateY(Math.PI / 2).translate(bayX - .425, 0, bayZ);
  cabin.setIndex(Array.from({ length: cabin.attributes.position.count }, (_, index) => index));
  boxes.push({ color: "ivory", geometry: cabin });
  for (const side of [-1, 1]) {
    for (const z of [-.71, .72]) {
      const tire = new THREE.CylinderGeometry(.225, .225, .15, 16);
      tire.rotateZ(Math.PI / 2).translate(bayX + side * .55, .27, bayZ + z);
      boxes.push({ color: "frame", geometry: tire });
    }
  }
  finish("parking");

}

// Render the same Three.js meshes when a browser runs without WebGL.
function makeCanvasRenderer(canvas, model, meshes, camera, sun) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable");
  const stillRatio = Math.min(devicePixelRatio, 1.35);
  let interactive = false;
  let width, height, image;
  const vertexCache = new WeakMap();
  const world = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const viewNormal = new THREE.Vector3();
  const color = new THREE.Color();
  const matrix = new THREE.Matrix4();
  const light = sun.position.clone().normalize();
  const bounds = new THREE.Box3().setFromObject(model);
  const shadowHeight = bounds.max.y * .86;
  const rgb = new THREE.Color();
  let depthBuffer;
  let texturePixels;
  const photoPixels = [];

  function rasterize(pixels, vertices, a, b, c, shade, uv) {
    const ax = vertices[a], ay = vertices[a + 1], az = vertices[a + 2];
    const bx = vertices[b] - ax, by = vertices[b + 1] - ay;
    const cx = vertices[c] - ax, cy = vertices[c + 1] - ay;
    const area = bx * cy - by * cx;
    if (Math.abs(area) < .001) return;
    const left = Math.max(0, Math.floor(ax + Math.min(0, bx, cx)));
    const right = Math.min(canvas.width - 1, Math.ceil(ax + Math.max(0, bx, cx)));
    const top = Math.max(0, Math.floor(ay + Math.min(0, by, cy)));
    const bottom = Math.min(canvas.height - 1, Math.ceil(ay + Math.max(0, by, cy)));
    const bz = vertices[b + 2] - az, cz = vertices[c + 2] - az;
    const photo = photoPixels[shade.photo];
    const textured = uv && (photo || shade.masonry && texturePixels);
    const ua = textured ? uv.getX(a / 3) : 0;
    const va = textured ? uv.getY(a / 3) : 0;
    const ub = textured ? uv.getX(b / 3) - ua : 0;
    const vb = textured ? uv.getY(b / 3) - va : 0;
    const uc = textured ? uv.getX(c / 3) - ua : 0;
    const vc = textured ? uv.getY(c / 3) - va : 0;
    for (let y = top; y <= bottom; y++) {
      const dy = y + .5 - ay;
      for (let x = left; x <= right; x++) {
        const dx = x + .5 - ax;
        const u = (dx * cy - dy * cx) / area;
        const v = (bx * dy - by * dx) / area;
        if (u < 0 || v < 0 || u + v > 1) continue;
        const depth = az + u * bz + v * cz;
        const index = y * canvas.width + x;
        if (depth >= depthBuffer[index]) continue;
        depthBuffer[index] = depth;
        pixels[index * 4 + 3] = 255;
        if (photo) {
          const sx = Math.min(255, Math.max(0, Math.round((ua + u * ub + v * uc) * 255)));
          const sy = Math.min(127, Math.max(0, Math.round((1 - va - u * vb - v * vc) * 127)));
          const offset = 4 * (sy * 256 + sx);
          pixels[index * 4] = shade.r * photo[offset];
          pixels[index * 4 + 1] = shade.g * photo[offset + 1];
          pixels[index * 4 + 2] = shade.b * photo[offset + 2];
          continue;
        }
        let grain = 1;
        if (textured) {
          const sx = Math.floor(63 * (1 - Math.abs(1 - 2 * (ua + u * ub + v * uc))));
          const sy = Math.floor(63 * (1 - Math.abs(1 - 2 * (va + u * vb + v * vc))));
          grain = texturePixels[4 * (Math.max(0, sy) * 64 + Math.max(0, sx))] / 255;
        }
        pixels[index * 4] = shade.r * 255 * grain;
        pixels[index * 4 + 1] = shade.g * 255 * grain;
        pixels[index * 4 + 2] = shade.b * 255 * grain;
      }
    }
  }

  function project(out, x, y, z) {
    world.set(x, y, z).project(camera);
    out.set((world.x + 1) * canvas.width / 2, (1 - world.y) * canvas.height / 2, world.z);
  }

  function size(nextWidth, nextHeight) {
    width = nextWidth;
    height = nextHeight;
    const ratio = interactive ? Math.min(.9, 440 / Math.max(width, height)) : Math.min(stillRatio, 1050 / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    depthBuffer = new Float32Array(canvas.width * canvas.height);
    image = context.createImageData(canvas.width, canvas.height);
  }

  return {
    setTexture(source, index) {
      const tile = document.createElement("canvas");
      tile.width = index === undefined ? 64 : 256;
      tile.height = index === undefined ? 64 : 128;
      const drawing = tile.getContext("2d");
      if (!drawing) return;
      drawing.drawImage(source, 0, 0, tile.width, tile.height);
      const pixels = drawing.getImageData(0, 0, tile.width, tile.height).data;
      if (index === undefined) texturePixels = pixels;
      else photoPixels[index] = pixels;
    },
    setSize: size,
    setInteractive(value) {
      interactive = value;
      if (width && height) size(width, height);
    },
    render() {
      model.updateMatrixWorld(true);
      image.data.fill(0);
      const shadow = [
        [-5.05, 2.2, 0], [-5.05, -2.2, 0], [-5.05, -2.2, shadowHeight], [5.05, -2.2, shadowHeight], [5.05, 2.2, shadowHeight], [5.05, 2.2, 0],
      ];
      context.beginPath();
      for (const [index, [x, z, y]] of shadow.entries()) {
        world.set(x, 0, z).applyMatrix4(model.matrixWorld);
        project(world, world.x - light.x * y / light.y, 0, world.z - light.z * y / light.y);
        if (index === 0) context.moveTo(world.x, world.y);
        else context.lineTo(world.x, world.y);
      }
      context.closePath();
      depthBuffer.fill(Infinity);
      for (const mesh of meshes) {
        const { masonry, photo } = mesh.material.userData;
        if (photo !== null && !photoPixels[photo]) continue;
        matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(mesh.matrixWorld);
        const { position, normal: normals, uv } = mesh.geometry.attributes;
        const indices = mesh.geometry.index.array;
        let vertices = vertexCache.get(mesh);
        if (!vertices) {
          vertices = new Float32Array(position.count * 3);
          vertexCache.set(mesh, vertices);
        }
        for (let i = 0; i < position.count; i++) {
          world.fromBufferAttribute(position, i).applyMatrix4(matrix);
          vertices[3 * i] = (world.x + 1) * canvas.width / 2;
          vertices[3 * i + 1] = (1 - world.y) * canvas.height / 2;
          vertices[3 * i + 2] = world.z;
        }
        const shades = new Map();
        for (let i = 0; i < indices.length; i += 3) {
          const a = indices[i] * 3, b = indices[i + 1] * 3, c = indices[i + 2] * 3;
          normal.fromBufferAttribute(normals, indices[i]).transformDirection(mesh.matrixWorld);
          if (viewNormal.copy(normal).transformDirection(camera.matrixWorldInverse).z <= 0) continue;
          const level = Math.round((.58 + .5 * Math.max(0, normal.dot(light))) * 100);
          if (!shades.has(level)) {
            color.copy(mesh.material.color).multiplyScalar(photo === null ? level / 100 : 1).getRGB(rgb, THREE.SRGBColorSpace);
            shades.set(level, { r: rgb.r, g: rgb.g, b: rgb.b, masonry, photo });
          }
          rasterize(image.data, vertices, a, b, c, shades.get(level), uv);
        }
      }
      context.putImageData(image, 0, 0);
      context.globalCompositeOperation = "destination-over";
      context.fillStyle = "#07130c38";
      context.fill();
      context.globalCompositeOperation = "source-over";
    },
    dispose() {},
  };
}

export function mountBuilding(host, project, selected, onSelect) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera();
  const profile = buildingProfiles[project];
  const center = project === "avenue" ? 4.63 : project === "savitri" ? 2.9 : 3.3;
  camera.position.set(0, center + 4.17, 20);
  camera.lookAt(0, center, 0);
  camera.updateMatrixWorld();
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", { antialias: true, alpha: true });
  let disposed = false;
  const texture = new THREE.TextureLoader().load(
    `/images/building-explorer/${profile.texture}`,
    (loaded) => {
      if (disposed) return;
      if (!gl) renderer.setTexture(loaded.image);
      draw();
    },
  );
  texture.wrapS = texture.wrapT = THREE.MirroredRepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(2, 2);
  texture.anisotropy = 4;
  const facadeMaps = Array.from({ length: 4 }, (_, index) => {
    const map = new THREE.TextureLoader().load(
      `/images/building-explorer/${project}-balcony-${index}.webp`,
      (loaded) => {
        if (disposed) return;
        if (!gl) renderer.setTexture(loaded.image, index);
        draw();
      },
    );
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  });
  const { model, highlight, selectables } = buildModel(project, texture, facadeMaps);
  model.rotation.y = profile.angle;
  scene.add(model, new THREE.HemisphereLight(0xffffff, 0xbab3a5, 2));
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(-9, 16, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 });
  sun.shadow.normalBias = .035;
  sun.shadow.bias = -.0003;
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.ShadowMaterial({ opacity: .17 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const renderer = gl
    ? new THREE.WebGLRenderer({ canvas, context: gl, antialias: true, alpha: true })
    : makeCanvasRenderer(canvas, model, selectables, camera, sun);
  if (gl) {
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
  }
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);
  const raycaster = new THREE.Raycaster();
  let frame = 0;
  let visible = true;
  let dragging = false;
  let fastRendering = false;
  let targetAngle = profile.angle;
  let lastFrameTime;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function renderAtReducedDetail(value) {
    if (fastRendering === value) return;
    fastRendering = value;
    if (gl) {
      renderer.setPixelRatio(Math.min(devicePixelRatio, value ? 1 : 1.65));
      sun.shadow.autoUpdate = !value;
    } else {
      renderer.setInteractive(value);
    }
  }

  const draw = () => {
    if (frame || !visible) return;
    frame = requestAnimationFrame((now) => {
      frame = 0;
      const dt = lastFrameTime === undefined ? 16.7 : Math.min(48, now - lastFrameTime);
      const remaining = targetAngle - model.rotation.y;
      const moving = !reduceMotion && Math.abs(remaining) > .003;
      model.rotation.y = moving
        ? model.rotation.y + remaining * (1 - Math.exp(-dt / 14))
        : targetAngle;
      renderAtReducedDetail(moving || dragging);
      renderer.render(scene, camera);
      lastFrameTime = moving ? now : undefined;
      if (moving) draw();
    });
  };
  const resize = () => {
    const { clientWidth: width, clientHeight: height } = host;
    if (!width || !height) return;
    const aspect = width / height;
    const vertical = Math.max(project === "avenue" ? 10.55 : 8.25, profile.width / aspect);
    Object.assign(camera, {
      left: -vertical * aspect / 2, right: vertical * aspect / 2,
      top: vertical / 2, bottom: -vertical / 2, near: .1, far: 100,
    });
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    draw();
  };
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      draw();
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      lastFrameTime = undefined;
    }
  }, { rootMargin: "100px" });
  visibility.observe(host);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  highlight(selected);
  resize();

  return {
    select(area) { highlight(area); draw(); },
    reset() { targetAngle = model.rotation.y = profile.angle; draw(); },
    setInteractive(value) {
      dragging = value;
      draw();
    },
    rotate(delta) { targetAngle += delta; draw(); },
    pick(clientX, clientY) {
      const rect = host.getBoundingClientRect();
      model.updateMatrixWorld(true);
      raycaster.setFromCamera(new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        1 - ((clientY - rect.top) / rect.height) * 2,
      ), camera);
      const area = raycaster.intersectObjects(selectables, false)[0]?.object.parent.userData.area;
      if (area) onSelect(area);
    },
    dispose() {
      disposed = true;
      texture.dispose();
      facadeMaps.forEach((map) => map.dispose());
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      scene.traverse((item) => {
        item.geometry?.dispose();
        item.material?.dispose();
      });
      sun.shadow.dispose();
      renderer.dispose();
      if (gl) renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
