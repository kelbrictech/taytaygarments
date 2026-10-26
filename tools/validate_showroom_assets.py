#!/usr/bin/env python3
"""Check staged showroom image assets before any catalog integration.

Strict source policy: one independently generated original per SKU/color/view.
This script performs technical and provenance checks only. It CANNOT approve visual fidelity.
"""
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

VIEWS = {"front","side","back","detail-collar","detail-button","detail-fabric","detail-logo"}
ORIGINS = {"independent_render","original_photograph"}
VALID_NAME = re.compile(r"^(TTC-[A-Z]{3}-[0-9]{3})__([A-Za-z0-9-]+)__(front|side|back|detail-collar|detail-button|detail-fabric|detail-logo)\.(webp|png|jpg|jpeg)$")

def inspect(path, metadata, inventory):
    problems=[]
    match=VALID_NAME.fullmatch(path.name)
    if not match: return ["invalid filename; expected SKU__color__angle.webp"]
    sku,color,angle,_=match.groups()
    matching=[v for v in inventory["variants"] if v["sku"]==sku and v["color"]==color]
    if not matching: problems.append("SKU/color not present in confirmed inventory")
    if metadata.get("render_provenance") not in ORIGINS:
        problems.append("origin is not an independently generated source image or actual photograph")
    if metadata.get("review_status")!="visual_qa_approved":
        problems.append("visual approval not recorded")
    if metadata.get("sku")!=sku or metadata.get("color_slug")!=color or metadata.get("view")!=angle:
        problems.append("manifest identity does not match filename")
    if path.stat().st_size < 12000: problems.append("asset too small for catalog quality threshold")
    try:
        from PIL import Image
        with Image.open(path) as im:
            im.verify()
        with Image.open(path) as im:
            w,h=im.size
            if w < 420 or h < 420: problems.append("image resolution below minimum 420x420")
            if w > 8192 or h > 8192: problems.append("image exceeds maximum permitted dimensions")
    except ImportError: problems.append("Pillow unavailable: image decoding not verified (install pillow)")
    except Exception as e: problems.append("image cannot be decoded: "+str(e)[:160])
    expected=metadata.get("sha256")
    if expected and hashlib.sha256(path.read_bytes()).hexdigest()!=expected:
        problems.append("content SHA-256 differs from manifest")
    return problems

def main():
    p=argparse.ArgumentParser()
    p.add_argument("directory",type=Path)
    p.add_argument("--inventory",type=Path,default=Path("catalog/production_inventory.json"))
    p.add_argument("--manifest",default="ASSET_MANIFEST.json")
    args=p.parse_args()
    if not args.directory.is_dir(): sys.exit("Missing directory: "+str(args.directory))
    inv=json.loads(args.inventory.read_text(encoding="utf8"))
    mf=args.directory/args.manifest
    if not mf.exists(): sys.exit("Missing asset manifest")
    data=json.loads(mf.read_text(encoding="utf8"))
    entries=data.get("assets",[])
    results=[]
    seen=set()
    for entry in entries:
        filepath=args.directory/entry.get("filename","")
        problems=[]
        if filepath.name!=entry.get("filename") or not filepath.is_file():
            problems=["missing asset or unsafe path"]
        elif filepath.name in seen:
            problems=["duplicate asset entry"]
        else:
            seen.add(filepath.name)
            problems=inspect(filepath,entry,inv)
        results.append({"asset":filepath.name,"pass":not problems,"reasons":problems})
    result={"count":len(results),"passed":sum(r["pass"] for r in results),"blocked":sum(not r["pass"] for r in results),"results":results}
    print(json.dumps(result,indent=2))
    # Nonzero exit for any blocked asset. This avoids silently publishing candidates.
    return 0 if results and not result["blocked"] else 1

if __name__=="__main__":sys.exit(main())
