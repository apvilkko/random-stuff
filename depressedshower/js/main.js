var ndrops = 100;
var texts = [];

function rand(n, m, a) {
    return Math.floor((Math.random()*n)+(a || 1)) * (m || 1.0);
}

var lastIndex = null;
function getDepressingFact(first) {
    var i = rand(texts.length) - 1;
    if (i === lastIndex) {
        i = rand(texts.length) - 1;
    }
    lastIndex = i;
    var fact = texts[i];
    var el = $('.depressing-fact');
    var fade = 1000;
    if (first) {
        el.hide();
        el.html(fact);
        el.fadeIn(fade);
        return;
    }
    el.fadeOut(fade);
    setTimeout(function () {
        el.html(fact);
        el.fadeIn(fade);
    }, fade);

}

function getTexts() {
    $.get('res/texts.json', function (data) {
        texts = data.texts;
        getDepressingFact(true);
        setInterval(getDepressingFact, 10000);
    });
}

var drops = [];
var canvas = $("#canvas");
var ctx = canvas[0].getContext("2d");
var cH = canvas.height();
var cW = canvas.width();
function setupCanvas() {
    canvas = $("#canvas");
    cH = canvas.height();
    cW = canvas.width();
    canvas[0].setAttribute('width', cW);
    canvas[0].setAttribute('height', cW);
}

function getDropColor() {
    return 'rgba(255,255,255,' + Math.random()*0.6 + ')';
}

function addDrops() {
    setupCanvas();
    ctx.lineWidth = 1;
    var c = $("#canvas");
    var dX = rand(cW), dY = rand(cH), dC = getDropColor();
    for (var i = 0; i < ndrops; i++) {
        drops.push({x: dX, y: dY, c: dC, d: rand(1)});
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
    var myAudio = new Audio('res/shower.ogg');
    myAudio.addEventListener('timeupdate', function() {
        var buffer = 0.64;
        if (this.currentTime > this.duration - buffer) {
            this.currentTime = 0;
            this.play();
        }
    }, false);
    myAudio.play();
}

function main() {
    addDrops();
    startAudio();
    getTexts();
    $(window).resize(setupCanvas);
    window.requestAnimationFrame(step);
}
