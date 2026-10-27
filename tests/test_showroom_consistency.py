import tempfile
import unittest
from pathlib import Path
from PIL import Image, ImageDraw
from tools.showroom_consistency import bounds, inspect, COLORS, ANGLES

class QualityGate(unittest.TestCase):
    def setUp(self):
        self.t=tempfile.TemporaryDirectory()
        self.root=Path(self.t.name)/"TTC-SCH-003"
        for color in COLORS:
            (self.root/color).mkdir(parents=True)
    def tearDown(self):self.t.cleanup()
    def write(self,color,angle,width=450,height=730):
        img=Image.new("RGB",(900,1100),(227,225,221))
        d=ImageDraw.Draw(img)
        # Artificial shirt silhouette only to test measurement behavior.
        x0=(900-width)//2;y0=(1100-height)//2
        d.rectangle([x0,y0,x0+width,y0+height],fill=(28,68,76))
        img.save(self.root/color/(angle+".webp"),"WEBP")
    def test_steady_reference_passes(self):
        for c in COLORS:
            for a in ANGLES:self.write(c,a)
        result=inspect(self.root.parent)
        self.assertTrue(result["pass"],result["issues"])
    def test_short_garment_rejected(self):
        for c in COLORS:
            for a in ANGLES:self.write(c,a)
        for a in ANGLES:self.write("sky",a,width=450,height=420)
        result=inspect(self.root.parent)
        self.assertFalse(result["pass"])
        self.assertTrue(any("silhouette" in x for x in result["issues"]))
    def test_offcenter_rejected(self):
        for c in COLORS:
            for a in ANGLES:self.write(c,a)
        path=self.root/"terracotta"/"front.webp"
        img=Image.new("RGB",(900,1100),(227,225,221))
        ImageDraw.Draw(img).rectangle([480,185,880,915],fill=(110,50,35))
        img.save(path,"WEBP")
        result=inspect(self.root.parent)
        self.assertFalse(result["pass"])
        self.assertTrue(any("not centered" in x for x in result["issues"]))
if __name__=="__main__": unittest.main()
