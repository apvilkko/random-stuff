var ndrops = 100;
var textDelay = 11500;
var texts = [];

function rand(n) {
    return Math.floor((Math.random() * n) + 1);
}

var lastIndex = null;
function getDepressingText(first) {
    var i = rand(texts.length) - 1;
    if (i === lastIndex) {
        i = rand(texts.length) - 1;
    }
    lastIndex = i;
    var text = texts[i];
    var el = $('.depressing-text');
    var fade = 1000;
    if (first) {
        el.hide();
        el.html(text);
        el.fadeIn(fade);
        return;
    }
    el.fadeOut(fade, function () {
        el.html(text);
        el.fadeIn(fade);
    });
}

function getTexts() {
    $.get('res/texts.json', function (data) {
        texts = data.texts;
        getDepressingText(true);
        setInterval(getDepressingText, textDelay);
    });
}

var drops = [];
var canvas = $('#canvas');
var ctx = canvas[0].getContext('2d');
var cH = 192;
var cW = 192;

function setupCanvas() {
    canvas = $('#canvas');
    cH = $('.box').height();
    cW = $('.box').width();
    canvas[0].setAttribute('width', cW);
    canvas[0].setAttribute('height', cW);
}

function getDropColor() {
    return 'rgba(255,255,255,' + Math.random()*0.6 + ')';
}

function addDrops() {
    setupCanvas();
    ctx.lineWidth = 1;
    for (var i = 0; i < ndrops; i++) {
        drops.push({x: rand(cW), y: rand(cH), c: getDropColor(), d: rand(1)});
    }
}

function step() {
    ctx.clearRect(0, 0, cW, cH);
    for (var i = 0; i < ndrops; i++) {
        ctx.strokeStyle = drops[i].c;
        ctx.beginPath();
        ctx.moveTo(drops[i].x + 0.5, drops[i].y);
        ctx.lineTo(drops[i].x + 0.5, drops[i].y + 5);
        ctx.stroke();
        drops[i].y += 18;
        if (Math.random() > 0.8) {
            drops[i].x += (drops[i].d ? 4 : -4);
        }
        if (drops[i].y > cH) {
            drops[i].y = rand(cH * 0.4);
            drops[i].x = rand(cW * 0.5) + cW * 0.25;
            drops[i].c = getDropColor();
            drops[i].d = rand(1);
        }
    }
    window.requestAnimationFrame(step);
}

function startAudio() {
    var filename = 'res/showerambience.ogg';
    try {
        var context = new (window.AudioContext || window.webkitAudioContext)();
        var source = context.createBufferSource();
        source.connect(context.destination);
        var request = new XMLHttpRequest();
        request.open('GET', filename, true);
        request.responseType = 'arraybuffer';
        request.onload = function() {
            context.decodeAudioData(request.response, function(response) {
                source.buffer = response;
                source.start(0);
                source.loop = true;
            }, function () { console.error('The request failed.'); } );
        };
        request.send();
    } catch(e) {
        console.log('Web Audio API is not supported in this browser', e);
        var myAudio = new Audio(filename);
        myAudio.addEventListener('timeupdate', function() {
            var buffer = 0.64;
            if (this.currentTime > this.duration - buffer) {
                this.currentTime = 0;
                this.play();
            }
        }, false);
        myAudio.play();
    }
}

function main() {
    addDrops();
    startAudio();
    getTexts();
    $(window).resize(setupCanvas);
    window.requestAnimationFrame(step);
}
