import os
import sys
from PIL import Image

outputDir = 'pdf'

def main(inputFolder):
  inputExt = '.jpg'
  files = []
  for entry in os.scandir(inputFolder):
    if entry.path.endswith(inputExt) and entry.is_file():
      files.append(entry.path)
  try:
    os.mkdir(outputDir)
  except FileExistsError:
    pass
  print('Found ' + str(len(files)) + ' files')
  outFile = os.path.join(outputDir, 'output.pdf')
  imageList = [
    Image.open(x).reduce(4) #.convert('RGB')
    for x in files]
  imageList[0].save(outFile, save_all=True, append_images=imageList[1:], resolution=150)
  print('Saved ' + outFile)

if __name__ == "__main__":
  main(sys.argv[1])