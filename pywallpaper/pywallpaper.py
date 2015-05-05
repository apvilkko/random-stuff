import ctypes
import tempfile
import os.path
import urllib2
import io

from bs4 import BeautifulSoup
from PIL import Image

user32 = ctypes.windll.user32


def set_wallpaper(imagepath):
    SPI_SETDESKWALLPAPER = 0x0014
    flags = 2
    return user32.SystemParametersInfoA(SPI_SETDESKWALLPAPER, 0, imagepath, 2)


def get_screen_dimensions():
    user32.SetProcessDPIAware()
    return (user32.GetSystemMetrics(0), user32.GetSystemMetrics(1))

def generate_base_image():
    return Image.new("RGB", get_screen_dimensions(), "black")

def save_image(image):
    filename = os.path.join(tempfile.gettempdir(), 'pywallpaper.jpg')
    image.save(filename, 'JPEG')
    return filename

def matcher(tag):
    return tag.has_attr('src') and 'meteogram' in tag['src']

def scrape_image():
    try:
        page = urllib2.urlopen('http://www.foreca.fi/Finland/Tampere').read()
    except urllib2.URLError:
        print "Can not open url"
        return
    soup = BeautifulSoup(page)
    img = soup.find_all(matcher)
    if len(img) > 0:
        img = img[0]
        data = urllib2.urlopen('http://www.foreca.fi' + img['src'])
        image_file = io.BytesIO(data.read())
        return Image.open(image_file)


im = scrape_image()
if not im:
    print "No image"
base_image = generate_base_image()
base_image.paste(im, (0, 0))
filename = save_image(base_image)
set_wallpaper(filename)
