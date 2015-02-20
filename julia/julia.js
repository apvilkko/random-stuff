/* global _, window, document */

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
  this.syncer = _.identity;
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
  var sx, sy, x, y, width = this.CANVAS_WIDTH, height = this.CANVAS_HEIGHT;
  for (x = 0; x < width; x += adder) {
    for (y = 0; y <= height/2; y += adder) {
      this.setColor(this.colorPalette.map(this.iterate(x, y), iterations));
      this.drawPixel(x, y);
      // Use point symmetry
      sx = width - x;
      sy = height - y;
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
  /*for (x = 0; x < width; ++x) {
    this.setColor(this.colorPalette.map(x, width));
    for (y = 0; y < height; ++y) {
      this.drawPixel(x, y);
    }
  }*/
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

Julia.prototype.apply = function (config) {
  this.iterations = config.iterations;
  this.er = config.er;
  this.setC(config.cx, config.cy);
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

Julia.prototype.setC = function (cx, cy, sync) {
  this.cx = cx;
  this.cy = cy;
  this.syncer({cx: this.cx, cy: this.cy});
};

Julia.prototype.zoom = function (delta) {
  this.scale = delta > 0 ? (this.scale * 1.5) : (this.scale / 1.5);
  this.displayScale();
  this.draw();
};

Julia.prototype.getConfig = function () {
  return {
    iterations: this.iterations,
    er: this.er,
    cx: this.cx,
    cy: this.cy,
    scale: this.scale,
    moveC: this.moveC
  };
};

Julia.prototype.reset = function () {
  this.setC(-0.8, 0.156);
  this.mx = 0;
  this.my = 0;
  this.scale = null;
  this.iterations = 32;
  this.er = 1.9;
  this.initCanvas();
  this.draw();
};

Julia.prototype.setSyncer = function (cb) {
  this.syncer = cb;
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
  this.initCanvas();
  this.moveC = true;

  function moveHandler(event) {
    this.mx = this.scaleX(event.clientX);
    this.my = this.scaleY(event.clientY);
    if (this.moveC && !this.drawing) {
      this.setC(this.mx, this.my, true);
      this.draw();
    }
  }

  this.canvas.addEventListener('mousemove', _.throttle(moveHandler.bind(this), 100));

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
  this.n = 1024;
  this.pr = [];
  this.pg = [];
  this.pb = [];
  this.inverted = false;
  this.custom = false;
  this.choices = [
    {
      id: 1,
      name: 'Purple Rain',
      palette: {
        r: [73, 255, 255, 213],
        g: [4, 255, 248, 0],
        b: [122, 255, 0, 166]
      }
    },
    {
      id: 2,
      name: '256 Shades Of Grey',
      palette: {
        r: [0, 255],
        g: [0, 255],
        b: [0, 255]
      }
    },
    {
      id: 3,
      name: 'Dusk At Sea',
      palette: {
        r: [228, 223, 149, 84,  43,  0,   0,   0,  0],
        g: [92,  168, 161, 131, 95,  68,  56,  42, 39],
        b: [57,  120, 178, 181, 160, 137, 119, 99, 90]
      }
    },
    {
      id: 4,
      name: 'R-G-B',
      palette: {
        r: [255, 0, 0],
        g: [0, 255, 0],
        b: [0, 0, 255]
      }
    },
    {
      id: 5,
      name: 'Crimson Idol',
      palette: {
        r: [0, 220, 255],
        g: [0, 20, 255],
        b: [0, 60, 255]
      }
    },
  ];
  this.current = this.choices[0];
  this.customvalues = [
    {r: 0, g: 0, b: 0},
    {r: 60, g: 128, b: 0},
    {r: 255, g: 255, b: 255},
  ];
}

ColorPalette.prototype.getConfig = function () {
  return {
    current: this.current,
    choices: this.choices,
    custom: this.custom,
    customvalues: this.customvalues
  };
};

ColorPalette.prototype.useCustom = function (value) {
  if (this.custom !== value) {
    this.custom = value;
    this.preCalc();
    return true;
  }
};

ColorPalette.prototype.invert = function (value) {
  if (value !== this.inverted) {
    this.inverted = value;
    this.preCalc();
    return true;
  }
};

ColorPalette.prototype.apply = function (paletteId) {
  if (this.current.id === paletteId) {
    return;
  }
  var found = _.find(this.choices, {id: paletteId});
  if (found) {
    this.current = found;
    this.preCalc();
  }
};

ColorPalette.prototype.lerp = function (a, b, f) {
  return a + f * (b - a);
};

ColorPalette.prototype.getPalette = function () {
  if (!this.custom) {
    return this.current.palette;
  }
  return {
    r: _.map(this.customvalues, 'r'),
    g: _.map(this.customvalues, 'g'),
    b: _.map(this.customvalues, 'b')
  };
};

ColorPalette.prototype.preCalc = function () {
  this.pr = [];
  this.pg = [];
  this.pb = [];
  var palette = this.getPalette();
  var l = palette.r.length;
  var points = [];
  for (var j = 0; j < l; ++j) {
    points.push(j / (l - 1) * this.n);
  }
  for (var i = 0; i < this.n; ++i) {
    var w1 = 1, w2 = 0;
    var i1 = 0, i2 = 0;
    for (var k = 0; k < points.length; ++k) {
      if (i === 0) {
        i1 = 0;
        i2 = 1;
        w1 = 0;
      } else if (points[k] > i) {
        i1 = k - 1;
        i2 = k;
        w2 = (points[k] - i)/(Math.abs(points[i2] - points[i1]));
        w1 = 1.0 - w2;
        break;
      }
    }

    this.pr.push(this.lerp(palette.r[i1], palette.r[i2], w1));
    this.pg.push(this.lerp(palette.g[i1], palette.g[i2], w1));
    this.pb.push(this.lerp(palette.b[i1], palette.b[i2], w1));
  }
  if (this.inverted) {
    this.pr.reverse();
    this.pg.reverse();
    this.pb.reverse();
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

var julia, palette;
(function() {
  palette = new ColorPalette();
  palette.preCalc();
  julia = new Julia(palette);
  julia.init();
})();


var juliaControlsApp = angular.module('JuliaControls', []);

juliaControlsApp.controller('ControlsController', function ($scope, $timeout) {
  function sync(data) {
    $timeout(function () {
      _.each(data, function (value, key) {
        $scope.$apply(function () {
          $scope.data[key] = value;
        });
      });
    });
  }
  julia.setSyncer(sync);
  $scope.data = julia.getConfig();
  $scope.palette = palette.getConfig();
  $scope.apply = function () {
    julia.apply($scope.data);
  };
  $scope.applyPalette = function () {
    palette.preCalc();
    julia.draw();
  };
  $scope.reset = function () {
    julia.reset();
    $scope.data = julia.getConfig();
  };
  $scope.$watch('data.moveC', function (value) {
    julia.moveC = value;
  });
  $scope.$watch('palette.current', function (value) {
    palette.apply(value.id);
    julia.draw();
  });
  $scope.$watch('palette.invert', function (value) {
    if (palette.invert(value)) {
      julia.draw();
    }
  });
  $scope.$watch('palette.custom', function (value) {
    if (palette.useCustom(value)) {
      julia.draw();
    }
  });
});
