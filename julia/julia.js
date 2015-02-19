/* global window, document */

'use strict';

function Julia(colorPalette) {
  this.colorPalette = colorPalette;
  this.context = null;
  this.canvas = null;
  this.canvasData = null;
  this.color = [0, 0, 0];
  this.scale = null;
  this.iterations = 32;
  this.er = 1.9;
  this.drawing = false;
}

Julia.prototype.setColor = function (color) {
  this.color[0] = color[0];
  this.color[1] = color[1];
  this.color[2] = color[2];
};

Julia.prototype.drawPixel = function (x, y) {
  var index = (x + y * this.CANVAS_WIDTH) * 4;
  this.canvasData.data[index + 0] = this.color[0];
  this.canvasData.data[index + 1] = this.color[1];
  this.canvasData.data[index + 2] = this.color[2];
  this.canvasData.data[index + 3] = 255;
};

Julia.prototype.updateCanvas = function () {
  this.context.putImageData(this.canvasData, 0, 0);
};


Julia.prototype.getImageData = function () {
  this.canvasData = this.context.createImageData(this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
};

Julia.prototype.iterate = function (x, y) {
  x = this.scaleX(x);
  y = this.scaleY(y);
  var i = 0;
  var zx2 = x * x;
  var zy2 = y * y;
  var er2 = this.er * this.er;
  for (;i < this.iterations && (zx2 + zy2 < er2); ++i) {
    y = 2 * x * y + this.cy;
    x = zx2 - zy2 + this.cx;
    zx2 = x * x;
    zy2 = y * y;
  }
  return i;
};

Julia.prototype.scaleX = function (x) {
  return (x - this.CANVAS_WIDTH/2)/this.scale;
};

Julia.prototype.scaleY = function (y) {
  return (y - this.CANVAS_HEIGHT/2)/this.scale;
};

Julia.prototype.traverse = function (iterations, phase) {
  var adder = phase === 1 ? 2 : 1;
  var sx, sy;
  for (var x = 0; x < this.CANVAS_WIDTH; x += adder) {
    for (var y = 0; y <= this.CANVAS_HEIGHT/2; y += adder) {
      this.setColor(this.colorPalette.map(this.iterate(x, y), iterations));
      this.drawPixel(x, y);
      // Use point symmetry
      sx = this.CANVAS_WIDTH - x;
      sy = this.CANVAS_HEIGHT - y;
      this.drawPixel(sx, sy);
      if (adder === 2) {
        this.drawPixel(x + 1, y);
        this.drawPixel(x, y + 1);
        this.drawPixel(x + 1, y + 1);
        this.drawPixel(sx + 1, sy);
        this.drawPixel(sx, sy + 1);
        this.drawPixel(sx + 1, sy + 1);
      }
    }
  }
};

Julia.prototype.draw = function () {
  this.drawing = true;
  var startTime = new Date().getTime();
  // TODO multiphase drawing: update with less iterations while moving mouse
  // and once the cursor settles draw with full iterations
  this.traverse(this.iterations);
  this.updateCanvas();
  var endTime = new Date().getTime();
  document.getElementById('timetaken').innerHTML = (endTime - startTime);
  this.drawing = false;
};

Julia.prototype.apply = function () {
  this.iterations = parseInt(document.getElementById('iterations').value, 10);
  this.er = parseFloat(document.getElementById('escape').value, 10);
  this.draw();
};

Julia.prototype.displayScale = function () {
  document.getElementById('scale').innerHTML =
    ('' + this.scale/this.CANVAS_HEIGHT*2).substr(0,6);
};

function nearest(value, n) {
  return Math.round(value/n) * n;
}

Julia.prototype.initCanvas = function () {
  this.CANVAS_WIDTH = nearest(Math.floor(window.innerWidth * 0.8), 8);
  this.CANVAS_HEIGHT = nearest(Math.floor(this.CANVAS_WIDTH*9/16), 8);
  this.canvas.setAttribute('width', this.CANVAS_WIDTH);
  this.canvas.setAttribute('height', this.CANVAS_HEIGHT);
  if (this.scale === null) {
    this.scale = this.CANVAS_HEIGHT/2;
  }
  this.displayScale();
};

Julia.prototype.setC = function (cx, cy) {
  this.cx = cx;
  this.cy = cy;
  document.getElementById('cpos').innerHTML =
    ('' + cx).substr(0, 6) + ' + ' + ('' + cy).substr(0, 6) + 'i';
};

Julia.prototype.zoom = function (delta) {
  this.scale = delta > 0 ? (this.scale * 1.5) : (this.scale / 1.5);
  this.displayScale();
  this.draw();
};

Julia.prototype.mouseMoveOption = function (cb) {
  this.moveC = cb.checked;
};

Julia.prototype.reset = function () {
  this.setC(-0.8, 0.156);
  this.mx = 0;
  this.my = 0;
  this.scale = null;
  this.iterations = 32;
  this.er = 1.9;
  document.getElementById('iterations').value = 32;
  document.getElementById('escape').value = 1.8;
  this.initCanvas();
  this.draw();
};

Julia.prototype.init = function () {
  var canvasContainer = document.getElementById('content');
  this.canvas = document.createElement('canvas');
  this.canvas.setAttribute('width', this.CANVAS_WIDTH);
  this.canvas.setAttribute('height', this.CANVAS_HEIGHT);
  this.canvas.setAttribute('id', 'canvas');
  canvasContainer.appendChild(this.canvas);
  this.context = this.canvas.getContext("2d");
  this.setC(-0.8, 0.156);
  this.mx = 0;
  this.my = 0;
  document.getElementById('iterations').value = 32;
  document.getElementById('escape').value = 1.8;
  this.initCanvas();
  this.moveC = true;
  document.getElementById('mousec').checked = true;

  this.canvas.addEventListener('mousemove', function (event) {
    this.mx = this.scaleX(event.clientX);
    this.my = this.scaleY(event.clientY);
    if (this.moveC && !this.drawing) {
      this.setC(this.mx, this.my);
      this.draw();
    }
  }.bind(this));

  this.canvas.addEventListener('click', function () {
    this.setC(this.mx, this.my);
    this.draw();
  }.bind(this));

  function wheelHandler(event) {
    var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
    this.zoom(delta);
  }

  this.canvas.addEventListener('mousewheel', wheelHandler.bind(this));
  this.canvas.addEventListener('DOMMouseScroll', wheelHandler.bind(this));

  window.addEventListener('resize', function () {
    this.initCanvas();
    this.getImageData();
    this.draw();
  }.bind(this));

  this.getImageData();
  this.draw();
};

function ColorPalette() {
  this.rr = [73, 255, 255, 213];
  this.gg = [4, 255, 248, 0];
  this.bb = [122, 255, 0, 166];
  this.n = 1024;
  this.pr = [];
  this.pg = [];
  this.pb = [];
}

ColorPalette.prototype.lerp = function (a, b, f) {
  return a + f * (b - a);
};

ColorPalette.prototype.preCalc = function () {
  var l = this.rr.length;
  var points = [];
  for (var j = 0; j < l; ++j) {
    points.push(j / (l - 1) * this.n);
  }
  for (var i = 0; i < this.n; ++i) {
    var w1 = 1, w2 = 0;
    var i1 = 0, i2 = 0;
    for (var k = 0; k < points.length; ++k) {
      if (points[k] === i) {
        w1 = 1;
        i1 = k;
        break;
      } else if (k > 0 && points[k] > i) {
        i1 = k - 1;
        i2 = k;
        w2 = (points[k] - i)/(Math.abs(points[i2] - points[i1]));
        w1 = 1.0 - w2;
        break;
      }
    }

    this.pr.push(this.lerp(this.rr[i1], this.rr[i2], w1));
    this.pg.push(this.lerp(this.gg[i1], this.gg[i2], w1));
    this.pb.push(this.lerp(this.bb[i1], this.bb[i2], w1));
  }
};

ColorPalette.prototype.map = function (value, iterations) {
  var scale = Math.floor(value/iterations*this.n);
  return [
    this.pr[scale],
    this.pg[scale],
    this.pb[scale]
  ];
};

var julia;
(function() {
  var colorPalette = new ColorPalette();
  colorPalette.preCalc();
  julia = new Julia(colorPalette);
  julia.init();
})();
