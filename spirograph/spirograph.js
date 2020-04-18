let canvas;
let context;
let plasma;
let palette;
let reqId;
let isPortrait = false;
let data;

// Internal render dimensions
const WIDTH = 256;
const HEIGHT = 256;

const FRAME_TIME = 5;
const ASPECT_RATIO = 1;
const PALETTE_SIZE = 192;

let paletteShift = 0;

const rand = (min, max) => Math.random() * (max - min) + min;

const drawCircle = (x, y, r, strokeStyle = "#0f0", lineWidth) => {
  context.beginPath();
  context.arc(x, y, r, 0, 2 * Math.PI, false);
  context.fillStyle = "rgba(0,0,0,0)";
  context.fill();
  context.lineWidth = lineWidth || scaler / 200;
  context.strokeStyle = strokeStyle;
  context.stroke();
};

const initialize = (width, height) => {
  return {
    theta: 0,
    r1scale: rand(0.05, 0.4),
    speed: rand(0.05, 0.15),
  };
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

function draw(width, height, canvasWidth, canvasHeight, color) {
  const { theta, r1scale } = data;
  const x0 = canvasWidth / 2;
  const y0 = canvasHeight / 2;
  const r0 = scaler * 0.47;
  const r1 = scaler * r1scale;
  const rDelta = r0 - r1;
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const x1 = x0 + rDelta * cosTheta;
  const y1 = y0 + rDelta * sinTheta;
  drawCircle(x0, y0, r0, "rgb(20,20,20)");
  const rgb = `rgb(${color[0]},${color[1]},${color[2]})`;
  //drawCircle(x1, y1, r1, rgb);
  const beta = (1 - r0 / r1) * theta;
  const x2 = x0 + rDelta * cosTheta + r1 * Math.cos(beta);
  const y2 = y0 + rDelta * sinTheta + r1 * Math.sin(beta);
  const w = scaler / 350;
  drawCircle(x2, y2, w, rgb);
}

function animate(lastFrameTime) {
  const time = new Date().getTime();
  let updated = lastFrameTime;

  if (lastFrameTime + FRAME_TIME < time) {
    paletteShift = ++paletteShift % PALETTE_SIZE;
    draw(WIDTH, HEIGHT, canvas.width, canvas.height, palette[paletteShift]);
    data.theta += data.speed;
    updated = time;
  }

  reqId = requestAnimationFrame(function () {
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

const createPalette = (size) => {
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

const clear = () => {
  context.clearRect(0, 0, canvas.width, canvas.height);
};

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
  context = canvas.getContext("2d");
  // canvasData = context.createImageData(width, height);
  scaler = Math.min(width, height);
};

const onResize = () => {
  setupCanvas();
};

const randomize = () => {
  palette = createPalette(PALETTE_SIZE);
  data = initialize(canvas.width, canvas.height);
  clear();
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
