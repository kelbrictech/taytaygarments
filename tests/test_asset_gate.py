import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from tools.validate_showroom_assets import inspect

INV={"variants":[{"sku":"TTC-SCH-002","color":"navy"}]}

class AssetGateTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.path=Path(self.tmp.name)/"TTC-SCH-002__navy__side.webp"
        # Procedural nonuniform pixels are for validator testing ONLY, never showroom imagery.
        img=Image.new('RGB',(480,660))
        for y in range(img.height):
            for x in range(img.width):
                img.putpixel((x,y),((x*13+y)%256,(x*3+y*5)%256,(x+y*7)%256))
        img.save(self.path,'WEBP',quality=90)
        self.metadata={"sku":"TTC-SCH-002","color_slug":"navy","view":"side",
            "render_provenance":"independent_render","review_status":"visual_qa_approved",
            "sha256":hashlib.sha256(self.path.read_bytes()).hexdigest()}

    def tearDown(self):self.tmp.cleanup()

    def test_complete_approved_independent_file_passes(self):
        self.assertEqual(inspect(self.path,self.metadata,INV),[])

    def test_composite_crop_cannot_be_approved(self):
        m={**self.metadata,"render_provenance":"cropped_distinct-view_from_single_generated_triptych"}
        self.assertTrue(any("independently generated" in e for e in inspect(self.path,m,INV)))

    def test_unreviewed_file_cannot_pass(self):
        m={**self.metadata,"review_status":"candidate_unapproved"}
        self.assertTrue(any("visual approval" in e for e in inspect(self.path,m,INV)))

    def test_wrong_color_rejected(self):
        m={**self.metadata,"color_slug":"red"}
        self.assertTrue(any("identity" in e for e in inspect(self.path,m,INV)))

    def test_changed_file_rejected(self):
        m={**self.metadata,"sha256":"0"*64}
        self.assertTrue(any("SHA-256" in e for e in inspect(self.path,m,INV)))

    def test_unknown_inventory_rejected(self):
        self.assertTrue(any("confirmed inventory" in e for e in inspect(self.path,self.metadata,{"variants":[]})))

if __name__=="__main__":unittest.main()
