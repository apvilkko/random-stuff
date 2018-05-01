const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const exec = require('child_process').exec;
const argv = require('minimist')(process.argv.slice(2));

const inFile = argv._[0];

const uint16 = (b1, b2) => {
  return b1 + (b2 << 8);
};

const HEADER_LEN = 256 * 3 + 4;
const WIDTH_OFFSET = 0x300;
const HEIGHT_OFFSET = 0x302;

const inData = fs.readFileSync(inFile);
const width = uint16(inData[WIDTH_OFFSET], inData[WIDTH_OFFSET+1]);
const height = uint16(inData[HEIGHT_OFFSET], inData[HEIGHT_OFFSET+1]);
console.log(inData.length, width, height);

const colormap = [];
let min = 0;
let max = 0;
for (let i = 0; i < (HEADER_LEN - 4); i += 3) {
  colormap.push([inData[i], inData[i+1], inData[i+2]]);
}

var newfile = new PNG({width:width,height:height});

let i = 0;
let j = HEADER_LEN;

for (var y = 0; y < height; y++) {
  for (var x = 0; x < width; x++) {
    newfile.data[i] = colormap[inData[j]][0] * 4;
    newfile.data[i + 1] = colormap[inData[j]][1] * 4;
    newfile.data[i + 2] = colormap[inData[j]][2] * 4;
    newfile.data[i + 3] = 0xff;
    ++j;
    i += 4;
  }
}

const basename = path.basename(inFile, path.extname(inFile));
const outfile = __dirname + '/' + basename + '.png';

newfile.pack()
  .pipe(fs.createWriteStream(outfile))
  .on('finish', function() {
    console.log('Written!');
    // exec('start ' + outfile);
  });
