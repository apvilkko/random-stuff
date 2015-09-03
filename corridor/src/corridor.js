(function(w) {
  var d = document;
  var ctx = w;
  var canvas = null;
  var synth = null;
  var seq = null;
  var cc = null;
  var analyser = null;
  var analyserData = null;
  var analyserBufferLength = null;
  var FRAMETIME = 0.019;
  //var FRAMETIME = 0.500;

  var NOTES = {
    'G#1': 51.91,
    'E1': 41.20,
    'A1': 55.00,
    'B1': 61.74,
    'C2': 65.41,
    'E2': 82.41
  };

  var KPATTERNS = [
    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,1],
    [1,0,0,0,1,0,0,0,1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
    [1,0,0,1,0,0,1,0,1,0,0,0,0,0,0,0],
    [1,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0]
  ];

  var PATTERNS = [
    ['G#1',0,0,0,'G#1',0,0,'G#1',0,0,'G#1',0,0,0,'G#1',0],
    ['B1',0,0,0,0,0,0,'B1',0,0,0,0,0,0,0,0],
    ['E1','E2','E1','E2','E1','E2','E1',0,0,0,'E1','E2',0,0,0,0],
    ['A1',0,'A1',0,0,0,'A1',0,0,0,'A1',0,0,0,'A1',0],
    ['E1',0,'C2',0,'B1',0,'E1',0,'E1',0,'C2',0,'B1',0,'E1',0]
  ];

  var parameters = {
    tempo: 80,
    pattern: 0,
    kpattern: 0,
    pitch: 1.0
  };

  function connectChain(chain) {
    for (var i = 0; i < chain.length - 1; ++i) {
      chain[i].connect(chain[i+1]);
    }
  }

  function randInt(n) {
    return Math.floor(Math.random() * n);
  }

  function randRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function trigger(eventName, data) {
    d.dispatchEvent(new d.defaultView.CustomEvent(eventName, {detail: data}));
  }

  function connector(node) {
    console.log("connect", this.name, node);
    if (node.hasOwnProperty('input')) {
      this.output.connect(node.input);
    } else {
      this.output.connect(node);
    };
  }

  var VCO = (function() {
    function VCO(context, name){
      this.name = name || 'VCO';
      this.context = context;
      this.oscillator = context.createOscillator();
      this.oscillator.type = Math.random() > 0.5 ? 'sawtooth' : 'square';
      this.setFrequency(440);
      this.oscillator.start(0);

      this.input = this.oscillator;
      this.output = this.oscillator;

      var that = this;
      d.addEventListener(that.name + '_frequency', function (value) {
        that.setFrequency(value.detail);
      });
      d.addEventListener(that.name + '_detune', function (value) {
        that.oscillator.detune.value = value.detail;
      });
      d.addEventListener(that.name + '_type', function (value) {
        that.oscillator.type = value.detail;
      });
    };

    VCO.prototype.setFrequency = function(frequency) {
      this.oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    };

    VCO.prototype.connect = connector;

    return VCO;
  })();

  var VCA = (function() {
    function VCA(context, name, initialGain) {
      this.name = name || 'VCA';
      this.gain = context.createGain();
      this.gain.gain.value = initialGain || 0;
      this.input = this.gain;
      this.output = this.gain;
      this.amplitude = this.gain.gain;

      var that = this;
      d.addEventListener(that.name + '_gain', function (value) {
        that.amplitude = value.detail;
      });
    };

    VCA.prototype.connect = connector;

    return VCA;
  })();

  var Filter = (function() {
    function Filter(context) {
      this.name = 'Filter';
      this.filter = context.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency = parameters.pitch * 2000;
      this.filter.Q = 0.5;
      this.input = this.filter;
      this.output = this.filter;
      this.frequency = this.filter.frequency;

      var that = this;
      d.addEventListener(that.name + '_Q', function (value) {
        that.filter.Q = value.detail;
      });
    };

    Filter.prototype.connect = connector;

    return Filter;
  })();

  var Delay = (function () {
    function Delay(context, initialDelay) {
      this.name = 'Delay';
      this.delay = context.createDelay();
      delayValue = (initialDelay || 0.5) * 60.0 / parameters.tempo;
      this.delay.delayTime.value = delayValue;
      this.input = this.delay;
      this.output = this.delay;

      var that = this
      d.addEventListener(that.name + '_delay', function (value) {
        that.delay.delayTime.value = value.detail * 60.0 / parameters.tempo;
      });
    }

    Delay.prototype.connect = connector;

    return Delay;
  })();

  var Compressor = (function () {
    function Compressor(context) {
      this.name = 'Compressor';
      this.compressor = context.createDynamicsCompressor();
      this.compressor.threshold.value = -3;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0;
      this.compressor.release.value = 0.25;
      this.input = this.compressor;
      this.output = this.compressor;
    }

    Compressor.prototype.connect = connector;

    return Compressor;
  })();

  var Widener = (function () {
    function Widener(context, amount) {
      this.name = 'Widener';
      this.context = context;
      this.amount = amount || 0.010;
    }

    Widener.prototype.connect = function connector(from, to) {
      console.log("connect", this.name, from, to);
      var splitter = this.context.createChannelSplitter(2);
      var merger = this.context.createChannelMerger(2);
      var delay = this.context.createDelay();
      delay.delayTime.value = this.amount;
      var unity = this.context.createGain();
      unity.gain.value = 1.0;

      var fromNode = from.hasOwnProperty('output') ? from.output : from;
      fromNode.connect(splitter);
      splitter.connect(delay, 0);
      splitter.connect(unity, splitter.numberOfInputs > 1 ? 1 : 0);
      delay.connect(merger, 0, 0);
      unity.connect(merger, 0, 1);
      if (to.hasOwnProperty('input')) {
        merger.connect(to.input);
      } else {
        merger.connect(to);
      };
    };

    return Widener;
  })();

  var EnvelopeGenerator = (function() {
    function EnvelopeGenerator(name, context) {
      this.name = name;
      this.context = context;
      this.attackTime = 0.05;
      this.releaseTime = 0.4;
      this.min = 0;
      this.max = 1;

      var that = this;
      d.addEventListener(that.name + '_gateOn', function () {
        that.trigger();
      });
      d.addEventListener(name + '_A', function (value) {
        that.attackTime = value.detail;
      });
      d.addEventListener(name + '_R', function (value) {
        that.releaseTime = value.detail;
      });
      d.addEventListener(name + '_max', function (value) {
        that.max = value.detail;
      });
    };

    EnvelopeGenerator.prototype.trigger = function() {
      //console.log("trigger", this.name);
      now = this.context.currentTime;
      this.param.cancelScheduledValues(now);
      this.param.setValueAtTime(this.min, now);
      this.param.linearRampToValueAtTime(this.max, now + this.attackTime);
      this.param.linearRampToValueAtTime(this.min, now + this.attackTime + this.releaseTime);
    };

    EnvelopeGenerator.prototype.connect = function(param, min, max) {
      this.min = min || 0;
      this.max = max || 1;
      this.param = param;
    };

    return EnvelopeGenerator;
  })();

  ctx.Synth = function(audio) {
    var vco = new VCO(audio);
    var vca = new VCA(audio);
    var aenv = new EnvelopeGenerator('A', audio);
    var filter = new Filter(audio);
    var fenv = new EnvelopeGenerator('F', audio);
    var delay = new Delay(audio, 0.52);
    var feedback = new VCA(audio, 'Feedback', 0.6);
    var widener = new Widener(audio);
    var limiter = new Compressor(audio);
    var masterGain = new VCA(audio, 'Master', 0.6);
    var delayGain = new VCA(audio, 'DelayGain', 0.33);
    analyser = audio.createAnalyser();
    analyser.fftSize = 2048;
    var bufferLength = analyser.frequencyBinCount;
    analyserData = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(analyserData);
    analyserBufferLength = analyser.frequencyBinCount;

    connectChain([vco, filter, vca, delay, feedback, delay, delayGain]);
    connectChain([vca, masterGain, limiter, analyser, audio.destination]);
    widener.connect(delayGain, masterGain);
    fenv.connect(filter.frequency, parameters.pitch * 100, parameters.pitch * 3000);
    aenv.connect(vca.amplitude);

    var kvco = new VCO(audio, 'KickVCO');
    var kvca = new VCA(audio, 'KickVCA');
    var penv = new EnvelopeGenerator('KickP', audio);
    var kaenv = new EnvelopeGenerator('KickA', audio);
    connectChain([kvco, kvca, masterGain]);
    kvco.oscillator.type = 'sine';
    kaenv.connect(kvca.amplitude);
    penv.connect(kvco.oscillator.frequency, 20, 250);
    trigger('KickP_A', 0.005);
    trigger('KickP_R', 0.050);
    trigger('KickA_A', 0.005);
    trigger('KickA_R', 0.300);
}

  ctx.Synth.prototype.noteOn = function () {
    trigger('F_gateOn');
    trigger('A_gateOn');
  }

  ctx.Sequencer = function () {
    var audio = new (window.AudioContext || window.webkitAudioContext)();
    this.audio = audio;
    this.scheduleAheadTime = 0.1;
    this.nextNoteTime = audio.currentTime;
    this.current16thNote = 0;
    this.lastAnalyserTime = 0;
    this.randomize();
    this.synth = new Synth(audio);
  };

  ctx.Sequencer.prototype.randomize = function () {
    parameters.pattern = randInt(PATTERNS.length);
    parameters.kpattern = randInt(KPATTERNS.length);
    parameters.tempo = randRange(95, 150);
    parameters.pitch = randRange(0.5, 1.5);
    this.secondsPerBeat = 60.0 / parameters.tempo;
    trigger('A_A', 0.025);
    trigger('A_R', randRange(0.1, 0.6));
    trigger('F_A', 0.025);
    trigger('F_R', randRange(0.1, 0.6));
    trigger('VCO_type', Math.random() > 0.5 ? 'sawtooth' : 'square');

    trigger('KickP_R', randRange(0.050, 0.150));
    trigger('KickP_max', randRange(100, 280));

    trigger('Delay_delay', randInt(4) * 1.01 / 4);
    trigger('DelayGain_gain', randRange(0.05, 0.55));
    trigger('Feedback_gain', randRange(0.05, 0.55));

    console.log(parameters);
  };

  ctx.Sequencer.prototype.nextNote = function () {
    this.nextNoteTime += 0.25 * this.secondsPerBeat;
    this.current16thNote++;    // Advance the beat number, wrap to zero
    if (this.current16thNote === 16) {
        this.current16thNote = 0;
    }
  };

  ctx.Sequencer.prototype.scheduleNote = function () {
    if (PATTERNS[parameters.pattern][this.current16thNote]) {
      trigger('VCO_frequency', parameters.pitch * NOTES[PATTERNS[parameters.pattern][this.current16thNote]]);
      trigger('F_max', randRange(1000, 5000));
      trigger('Filter_Q', randRange(0.2, 900));
      trigger('VCO_detune', randInt(6));
      this.synth.noteOn();
    }
    if (KPATTERNS[parameters.kpattern][this.current16thNote]) {
      trigger('KickP_gateOn');
      trigger('KickA_gateOn');
    }
  };

  function dec2hex(i) {
    return (i).toString(16).substr(0, 2).toUpperCase();
  }

  var lastArc = [{},{},{},{}];
  var arcIndex = 0;

  function drawArc(width, strength, dec) {
    cc.lineWidth = width;
    cc.strokeStyle = '#' + dec2hex(lastArc[arcIndex].r*512*strength/canvas.width) + '0000';
    cc.beginPath();
    cc.arc(lastArc[arcIndex].x, lastArc[arcIndex].y, lastArc[arcIndex].r, Math.PI, 2*Math.PI, false);
    cc.stroke();
    if (dec) {
      arcIndex--;
      if (arcIndex < 0) arcIndex = lastArc.length - 1;
    }
  }

  ctx.Sequencer.prototype.scheduler = function () {
    w.requestAnimationFrame(this.scheduler.bind(this));
    if (this.nextNoteTime < this.audio.currentTime + this.scheduleAheadTime ) {
      this.scheduleNote();
      this.nextNote();
    }
    if (analyser && this.audio.currentTime > this.lastAnalyserTime + FRAMETIME) {
      this.lastAnalyserTime = this.audio.currentTime;
      cc.fillRect(0, 0, canvas.width, canvas.height);
      drawArc(15, 1/4, true);
      drawArc(20, 1/8, true);
      drawArc(25, 1/16, true);

      analyser.getByteTimeDomainData(analyserData);
      var maxAmp = 0;
      for(var i = 0; i < analyserBufferLength; i++) {
        if (Math.abs(analyserData[i] - 128) > maxAmp) {
          maxAmp = Math.abs(analyserData[i] - 128);
        }
      }
      cc.strokeStyle = '#' + dec2hex(maxAmp*2) + '0000';
      maxAmp = maxAmp / 256 * canvas.width;
      cc.beginPath();
      cc.lineWidth = 10;
      lastArc[arcIndex] = {
        x: canvas.width / 2,
        y: canvas.height,
        r: maxAmp
      };
      cc.arc(lastArc[arcIndex].x, lastArc[arcIndex].y, lastArc[arcIndex].r, Math.PI, 2*Math.PI, false);
      cc.stroke();
    }
  };

  function resizeCanvas() {
    canvas.width = w.innerWidth;
    canvas.height = w.innerHeight;
  }

  ctx.main = function () {
    canvas = d.getElementById('corridor-canvas');
    ctx.addEventListener('resize', resizeCanvas, false);
    resizeCanvas();

    cc = canvas.getContext('2d');
    cc.fillStyle = "rgb(0,0,0)";
    cc.fillRect(0, 0, canvas.width, canvas.height);
    cc.lineWidth = 10;
    cc.strokeStyle = '#660000';

    seq = new Sequencer();
    seq.scheduler();
  }

  w.onkeyup = function (e) {
    var key = e.keyCode ? e.keyCode : e.which;
    switch(key) {
      case 82:
        seq.randomize();
        break;
      default:
        break;
    }
  };

}(window));
