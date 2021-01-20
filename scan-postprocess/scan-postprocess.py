import os
import sys
from PIL import Image, ImageEnhance

# left, upper, right, lower: percentage, tuple: even,odd
#crops = ((7, 6, 3, 4), (5, 3, 5, 7))
crops = ((3, 4, 3, 2), (3, 1, 3, 4))
outputDir = 'out'

def contrast(im, factor):
  return ImageEnhance.Contrast(im).enhance(factor)
def brightness(im, factor):
  return ImageEnhance.Brightness(im).enhance(factor)

def processFile(filename, testMode):
  im = Image.open(filename)
  seq = int(filename.split('_')[-1].split('.')[0])
  isEven = seq % 2 == 0
  if not isEven:
    im = im.transpose(method=Image.ROTATE_180)
  (w,h) = im.size
  crop = crops[0] if isEven else crops[1]
  im2 = im.crop(
    (int(crop[0] * w / 100),
    int(crop[1] * h / 100),
    w - int(crop[2] * w / 100),
    h - int(crop[3] * h / 100))
  )
  if testMode:
    im2 = im2.reduce(8)
  im2 = brightness(contrast(im2, 1.5), 1.2)
  try:
    os.mkdir(outputDir)
  except FileExistsError:
    pass
  outFile = os.path.join(outputDir, os.path.basename(filename))
  im2.save(outFile, 'jpeg', quality=95)
  print('Saved ' + outFile)

def main(inputFolder, maxNumFiles):
  inputExt = '.jpg'
  maxFiles = int(maxNumFiles) if maxNumFiles else 1e6
  testMode = bool(maxNumFiles)
  files = []
  for entry in os.scandir(inputFolder):
    if entry.path.endswith(inputExt) and entry.is_file():
        if len(files) < maxFiles:
          files.append(entry.path)
  for file in files:
    processFile(file, testMode)

if __name__ == "__main__":
  main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
