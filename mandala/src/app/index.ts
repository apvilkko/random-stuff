declare var ColorScheme : any;

function getCanvas() {
  return document.getElementById('canvas');
}

function setupCanvas() {
  var canvas = getCanvas();
  canvas.setAttribute('width', '' + window.innerWidth);
  canvas.setAttribute('height', '' + window.innerHeight);
}

var draw = {
  circle: function (ctx : any, x0 : number, y0 : number, r : number, fillColor? : string) {
    ctx.save();
    ctx.translate(x0, y0);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, 2 * Math.PI, true);
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
  },
  rect: function (ctx : any, x0 : number, y0 : number, r : number, fillColor? : string, pos? : number) {
    ctx.save();
    ctx.translate(x0, y0);
    if (pos) {
      ctx.rotate(pos);
    }
    ctx.beginPath();
    ctx.rect(-r, -r, r * 2, r * 2);
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.stroke();
    ctx.restore();
  },
  star: function (ctx : any, cx : number, cy : number, outerRadius, fillColor : string, pos : number, innerRadius : number, spikes : number){
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(pos - Math.PI / 2);
    let rot = Math.PI/2*3;
    let x = 0;
    let y = 0;
    let step = Math.PI/spikes;

    ctx.beginPath();
    ctx.moveTo(0, -outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = Math.cos(rot) * outerRadius;
      y = Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = Math.cos(rot) * innerRadius;
      y = Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(0, -outerRadius);
    ctx.stroke();
    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.closePath();
    ctx.restore();
  }
};

function rand(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function getColor(colors) {
  return '#' + randPick(colors);
}

function randShape() {
  let r = rand(1, 12);
  if (r >= 9) {
    return 'star';
  } else if (r >= 5) {
    return 'circle';
  }
  return 'rect';
}

function randPick(arr) {
  return arr[rand(0, arr.length - 1)];
}

function randomizeParameters() {
  let colors = new ColorScheme;
  colors.from_hue(rand(0, 359))
    .scheme(randPick(['mono', 'monochromatic', 'contrast', 'triade', 'tetrade', 'analogic']))
    .distance(rand(0,100) / 100)
    .variation(randPick(['default', 'pastel', 'soft', 'light', 'hard', 'pale']));
  let amountBgShapes = rand(8, 32);
  let ret : any = {
    shapes: {
      bg: [],
      rings: []
    }
  };
  for (let i = 0; i < amountBgShapes; ++i) {
    ret.shapes.bg.push({
      method: randShape(),
      color: getColor(colors.colors()),
      spikes: Math.pow(2, rand(2, 5)),
      innerRadiusScale: rand(30, 90) / 100,
      rotation: rand(0, 1)
    });
  }
  let amountRings = rand(3, 6);
  for (let i = 0; i < amountRings; ++i) {
    let factor = rand(1, 4);
    ret.shapes.rings.push({
      size: ((amountRings - i)*1.2 + 1) * rand(1, 3),
      color: getColor(colors.colors()),
      amount: Math.pow(2, factor),
      method: randShape(),
      spikes: rand(4, 8),
      innerRadiusScale: rand(10, 90) / 100
    });
  }
  return ret;
}

function render(params) {
  let canvas : any = getCanvas();
  let ctx = canvas.getContext('2d');
  let x0 = window.innerWidth / 2;
  let y0 = window.innerHeight / 2;
  let scale = Math.min(window.innerWidth, window.innerHeight) / 100;
  let r = scale * 4;

  ctx.lineWidth = scale / 10;
  ctx.strokeStyle = '#000000';

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  let data = params.shapes.bg;
  for (let i = 0; i < data.length; ++i) {
    let r0 = scale * 48;
    let r = r0 - i * (r0 / data.length);
    let rotation = data[i].rotation * Math.PI / 4;
    draw[data[i].method](ctx, x0, y0, r, data[i].color, rotation, r * data[i].innerRadiusScale, data[i].spikes);
  }

  data = params.shapes.rings;
  for (let i = 0; i < data.length; ++i) {
    for (let n = 0; n < data[i].amount; ++n) {
      let r0 = scale * 40;
      let r1 = r0 - i * (r0 / data.length);
      let r2 = scale * data[i].size / 4;
      let theta = 2 * Math.PI / data[i].amount;
      draw[data[i].method](ctx,
        x0 + r1 * Math.cos(n * theta),
        y0 + r1 * Math.sin(n * theta),
        r2, data[i].color, n * theta, r2 * data[i].innerRadiusScale, data[i].spikes);
    }
  }
}

function main() {
  setupCanvas();
  var params = randomizeParameters();
  render(params);

  window.onresize = () => {
    setupCanvas();
    render(params);
  }

  getCanvas().onclick = () => {
    params = randomizeParameters();
    render(params);
  }
}

main();
