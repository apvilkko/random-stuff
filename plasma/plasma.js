let canvas;
let context;
let plasma;
let palette;
let reqId;
let isPortrait = false;
let canvasData = null;

// Internal render dimensions
const WIDTH = 256;
const HEIGHT = 256;

const FRAME_TIME = 30;
const ASPECT_RATIO = 4 / 3;
const PALETTE_SIZE = 192;

let paletteShift = 0;

const rand = (min, max) => Math.random() * (max - min) + min;

const createPlasma = (width, height) => {
  const buffer = new Array(height);
  const c0 = rand(1, 30);
  const c1 = rand(1, 16);
  const c2 = rand(1, 30);
  const c3 = rand(1, 16);

  for (let y = 0; y < height; y++) {
    buffer[y] = new Array(width);

    for (let x = 0; x < width; x++) {
      let value = Math.sin(x / c0);
      value += Math.sin(y / c1);
      value += Math.sin((x + y) / c2);
      value += Math.sin(Math.sqrt(x * x + y * y) / c3);
      value += 4; // shift range from -4 .. 4 to 0 .. 8
      value /= 8; // bring range down to 0 .. 1

      buffer[y][x] = value;
    }
  }
  return buffer;
};

const HSVtoRGB = (h, s, v) => {
  let r, g, b, i, f, p, q, t;

  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

function drawPlasma(width, height, canvasWidth, canvasHeight) {
  for (let i = 0; i < canvasWidth * canvasHeight; ++i) {
    let x0 = i % canvasWidth;
    let y0 = (i - x0) / canvasWidth;
    let x = Math.floor((x0 / canvasWidth) * width);
    let y = Math.floor((y0 / canvasHeight) * height);
    if (isPortrait) {
      x = Math.floor((y0 / canvasHeight) * width);
      y = Math.floor((x0 / canvasWidth) * height);
    }

    const pos =
      (paletteShift + Math.floor((plasma[y][x] % 1) * PALETTE_SIZE)) %
      PALETTE_SIZE;
    const rgb = palette[pos];

    canvasData.data[i * 4] = rgb[0];
    canvasData.data[i * 4 + 1] = rgb[1];
    canvasData.data[i * 4 + 2] = rgb[2];
    canvasData.data[i * 4 + 3] = 255;
  }
  context.putImageData(canvasData, 0, 0);
}

function animate(lastFrameTime) {
  const time = new Date().getTime();
  let updated = lastFrameTime;

  if (lastFrameTime + FRAME_TIME < time) {
    paletteShift = ++paletteShift % PALETTE_SIZE;
    drawPlasma(WIDTH, HEIGHT, canvas.width, canvas.height);
    updated = time;
  }

  reqId = requestAnimationFrame(function() {
    animate(updated);
  });
}

const lerp = (a, b, fac) => {
  let ret = [];

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    ret[i] = a[i] * (1 - fac) + b[i] * fac;
  }

  return ret;
};

function lerpColors(colors, n) {
  let ret = [];
  const segments = colors.length - 1;

  for (let i = 0; i < n; i++) {
    const currentColor = Math.floor((i / n) * segments);
    const start = (currentColor / segments) * n;
    const end = ((currentColor + 1) / segments) * n;
    const fac = (i - start) / (end - start);
    ret.push(lerp(colors[currentColor], colors[currentColor + 1], fac));
  }

  return ret;
}

const createPalette = size => {
  let pal;

  if (Math.random() > 0.9) {
    // Simple hue shifting
    pal = new Array(size);
    for (let i = 0; i < size; i++) {
      const hue = i / size;
      const rgb = HSVtoRGB(hue, 1, 1);
      pal[i] = rgb;
    }
  } else {
    // Random linear gradient palette with n colors
    const numColors = Math.round(rand(2, 5));
    const colors = new Array(numColors);
    for (let i = 0; i < numColors; ++i) {
      colors[i] = [rand(0, 255), rand(0, 255), rand(0, 255)];
    }
    pal = lerpColors(colors, PALETTE_SIZE / 2);
    const palCopy = [...pal];
    palCopy.reverse();
    pal = [...pal, ...palCopy];
  }

  return pal;
};

const SCREEN_MARGIN_RATIO = 0.95;

const setupCanvas = () => {
  canvas = document.getElementById("canvas");
  isPortrait = window.innerHeight > window.innerWidth;
  let height = Math.floor(window.innerHeight * SCREEN_MARGIN_RATIO);
  const aspect = isPortrait ? 1 / ASPECT_RATIO : ASPECT_RATIO;
  let width = Math.floor(height * aspect);
  if (width / SCREEN_MARGIN_RATIO > window.innerWidth) {
    const scale = width / SCREEN_MARGIN_RATIO / window.innerWidth;
    width = Math.floor(width / scale);
    height = Math.floor(height / scale);
  }
  canvas.setAttribute("width", width);
  canvas.setAttribute("height", height);
  canvas.imageSmoothingEnabled = false;
  canvas.mozImageSmoothingEnabled = false;
  canvas.webkitImageSmoothingEnabled = false;
  canvas.msImageSmoothingEnabled = false;
  context = canvas.getContext("2d");
  canvasData = context.createImageData(width, height);
};

const onResize = () => {
  setupCanvas();
};

const randomize = () => {
  palette = createPalette(PALETTE_SIZE);
  plasma = createPlasma(WIDTH, HEIGHT);
};

const main = () => {
  onResize();
  randomize();
  animate(0);

  window.addEventListener("resize", onResize);
  canvas.addEventListener("click", () => {
    randomize();
  });
};

main();
