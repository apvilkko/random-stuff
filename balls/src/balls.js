(function(ctx, doc) {
  var BALLS_PER_RING_MULTIPLIER = 6;
  var RINGS = 9;
  var RADIUS = 6;
  var TWOPI = 2 * Math.PI;
  var RING_DISTANCE = 30;
  var MOVER_AMOUNT = 0.3;
  var canvas = null;
  var centerX = 0;
  var centerY = 0;

  function resizeCanvas() {
    canvas.width = ctx.innerWidth;
    canvas.height = ctx.innerHeight;
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
  }

  ctx.Ball = function (ring, index) {
    this.ring = ring;
    this.index = index;
    this.pair = null;
    this.pairLink = null;
  };

  ctx.Ball.prototype.getCoordinates = function (raw) {
    if ((!this.pair && !this.pairLink) || raw) {
      var amount = this.ring * BALLS_PER_RING_MULTIPLIER + (this.ring === 0 ? 1 : 0);
      var angle = this.index / amount * TWOPI;
      var radius = this.ring * RING_DISTANCE;
      return {
        x: radius * Math.sin(angle),
        y: radius * Math.cos(angle)
      };
    }
    if (this.pairLink) {
      var pairAngle = (this.pairLink.pairPosition + 180) / 360 * TWOPI;
      return {
        x: this.pairLink.pairCenter.x + this.pairLink.pairRadius * Math.sin(pairAngle),
        y: this.pairLink.pairCenter.y + this.pairLink.pairRadius * Math.cos(pairAngle)
      };
    }
    var pairAngle = this.pairPosition / 360 * TWOPI;
    return {
      x: this.pairCenter.x + this.pairRadius * Math.sin(pairAngle),
      y: this.pairCenter.y + this.pairRadius * Math.cos(pairAngle)
    };
  };

  ctx.Ball.prototype.setPair = function (other) {
    this.pair = other;
    other.pairLink = this;
    var a = this.getCoordinates(true), b = other.getCoordinates(true);
    this.pairCenter = {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    };
    var abx = a.x - b.x;
    var aby = a.y - b.y;
    this.pairRadius = Math.sqrt(abx * abx + aby * aby) / 2;
    this.pairPosition = 0;
  };

  ctx.Scene = function () {
    canvas = doc.getElementById('balls-canvas');
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.objs = [];

    ctx.addEventListener('resize', resizeCanvas, false);
  };

  ctx.Scene.prototype.add = function (item) {
    this.objs.push(item);
  };

  ctx.Scene.prototype.advance = function () {
    for (var i = 0; i < this.objs.length; ++i) {
      var ball = this.objs[i];
      if (ball.pair) {
        ball.pairPosition++;
        if (ball.pairPosition >= 360) {
          ball.pairPosition = 0;
        }
      }
    }
  };

  function dec2hex(i) {
    return (i).toString(16).substr(0, 2).toUpperCase();
  }

  ctx.Scene.prototype.draw = function () {
    var context = this.context;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = 3;
    for (var i = 0; i < this.objs.length; ++i) {
      var ball = this.objs[i];
      context.strokeStyle = '#00' + dec2hex((ball.ring + 1) * 255 / RINGS) + '00';
      var coords = ball.getCoordinates();
      context.beginPath();
      context.arc(centerX + coords.x, centerY + coords.y, RADIUS, 0, TWOPI, false);
      context.closePath();
      context.stroke();
      if (ball.pair) {
        // connecting lines
        var pairCoords = ball.pair.getCoordinates();
        /*context.beginPath();
        context.moveTo(centerX + coords.x, centerY + coords.y);
        context.lineTo(centerX + pairCoords.x, centerY + pairCoords.y);
        context.closePath();
        context.stroke();*/
      }
    }
  };

  function rnd(n) {
    return Math.floor(Math.random() * (n + 1));
  }

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  ctx.Scene.prototype.assignPairs = function () {
    var toBePaired = [];
    var pool = [];
    for (var i = 0; i < this.objs.length; ++i) {
      this.objs[i].pair = null;
      this.objs[i].pairLink = null;
      if (Math.random() < MOVER_AMOUNT) {
        toBePaired.push(i);
      } else {
        pool.push(i);
      }
    }
    shuffle(pool);
    var item;
    while(item = toBePaired.pop()) {
      var pair = pool.pop();
      this.objs[item].setPair(this.objs[pair]);
    }
  };

  ctx.main = function () {
    var scene = new Scene();
    for (var ring = 0; ring < RINGS; ++ring) {
      var amount = ring * BALLS_PER_RING_MULTIPLIER + (ring === 0 ? 1 : 0);
      for (var i = 0; i < amount; ++i) {
        scene.add(new Ball(ring, i));
      }
    }
    resizeCanvas();
    scene.assignPairs();
    scene.draw();

    var mainloop = function() {
        scene.advance();
        scene.draw();
    };

    var animFrame = ctx.requestAnimationFrame ||
            ctx.webkitRequestAnimationFrame ||
            ctx.mozRequestAnimationFrame    ||
            ctx.oRequestAnimationFrame      ||
            ctx.msRequestAnimationFrame     ||
            null ;

    if (animFrame !== null) {
        var recursiveAnim = function() {
            mainloop();
            animFrame(recursiveAnim);
        };
        animFrame(recursiveAnim);
    } else {
        var ONE_FRAME_TIME = 1000.0 / 60.0 ;
        setInterval(mainloop, ONE_FRAME_TIME);
    }
  }

}(window, document));
