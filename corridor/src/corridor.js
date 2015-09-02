(function(w) {
  var d = document;
  var ctx = w;
  var canvas = null;
  var synth = null;

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
    function VCO(context){
      this.name = 'VCO';
      this.context = context;
      this.oscillator = context.createOscillator();
      this.oscillator.type = 'sawtooth';
      this.setFrequency(220);
      this.oscillator.start(0);

      this.input = this.oscillator;
      this.output = this.oscillator;

      var that = this;
      d.addEventListener('frequency', function (value) {
        that.setFrequency(value.detail);
      });
      d.addEventListener('detune', function (value) {
        that.oscillator.detune.value = value.detail;
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
    };

    VCA.prototype.connect = connector;

    return VCA;
  })();

  var Filter = (function() {
    function Filter(context) {
      this.name = 'Filter';
      this.filter = context.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency = 2000;
      this.filter.Q = 0.5;
      this.input = this.filter;
      this.output = this.filter;
      this.frequency = this.filter.frequency;

      var that = this;
      d.addEventListener('set'+ that.name + 'Q', function (value) {
        that.filter.Q = value.detail;
      });
    };

    Filter.prototype.connect = connector;

    return Filter;
  })();

  var Delay = (function () {
    function Delay(context, initialDelay, tempo) {
      this.name = 'Delay';
      this.delay = context.createDelay();
      var delayValue = initialDelay || 0.5;
      if (tempo) {
        delayValue = delayValue * 60.0 / tempo;
      }
      this.delay.delayTime.value = delayValue;
      this.input = this.delay;
      this.output = this.delay;
    }

    Delay.prototype.connect = connector;

    return Delay;
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
      d.addEventListener('gateOn', function () {
        that.trigger();
      });
      d.addEventListener('set'+ name + 'A', function (value) {
        that.attackTime = value.detail;
      });
      d.addEventListener('set' + name + 'R', function (value) {
        that.releaseTime = value.detail;
      });
      d.addEventListener('set' + name + 'Max', function (value) {
        that.max = value.detail;
      });
    };

    EnvelopeGenerator.prototype.trigger = function() {
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

  ctx.Synth = function(audio, tempo) {
    var vco = new VCO(audio);
    var vca = new VCA(audio);
    var aenv = new EnvelopeGenerator('A', audio);
    var filter = new Filter(audio);
    var fenv = new EnvelopeGenerator('F', audio);
    var delay = new Delay(audio, 0.52, tempo);
    var feedback = new VCA(audio, 'feedback', 0.6);
    var widener = new Widener(audio);
    vco.connect(filter);
    filter.connect(vca);
    fenv.connect(filter.frequency, 100, 3000);
    aenv.connect(vca.amplitude);
    vca.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    vca.connect(audio.destination);
    var delayGain = new VCA(audio, 'DelayGain', 0.33);
    delay.connect(delayGain);
    widener.connect(delayGain, audio.destination);

    trigger('frequency', 51.91);
    trigger('setAA', 0.025);
    trigger('setAR', 0.8);
    trigger('setFA', 0.025);
    trigger('setFR', 0.3);
  }

  ctx.Synth.prototype.noteOn = function () {
    trigger('gateOn');
  }

  ctx.Sequencer = function () {
    var audio = new (window.AudioContext || window.webkitAudioContext)();
    this.audio = audio;
    this.tempo = 100;
    this.synth = new Synth(audio, this.tempo);
    this.scheduleAheadTime = 0.1;
    this.secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime = audio.currentTime;
    this.current16thNote = 0;
    this.pattern = [1,0,0,0,1,0,0,1,0,0,1,0,0,0,1,0];
  };

  ctx.Sequencer.prototype.nextNote = function () {
    this.nextNoteTime += 0.25 * this.secondsPerBeat;
    this.current16thNote++;    // Advance the beat number, wrap to zero
    if (this.current16thNote === 16) {
        this.current16thNote = 0;
    }
  };

  ctx.Sequencer.prototype.scheduleNote = function () {
    if (this.pattern[this.current16thNote]) {
      trigger('setFMax', 1000 + Math.random() * 4000);
      trigger('setFilterQ', 0.2 + Math.random() * 900);
      trigger('detune', Math.floor(Math.random() * 6));
      trigger('gateOn');
    }
  };

  ctx.Sequencer.prototype.scheduler = function () {
    while (this.nextNoteTime < this.audio.currentTime + this.scheduleAheadTime ) {
      this.scheduleNote();
      this.nextNote();
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

    var seq = new Sequencer();
    setInterval(function () {
      seq.scheduler();
    }, 25);
  }

}(window));
