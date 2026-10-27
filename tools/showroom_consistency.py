#!/usr/bin/env python3
"""Product visual consistency gate: read real committed images, no mockups.

Uses image-space garment dimensions, not CSS sizing or generated metadata.
Pure visual heuristics; a human still must review construction details.
"""
import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage

COLORS=("deepGreen","navy","sky","terracotta")
ANGLES=("front","side","back")
SKU="TTC-SCH-003"

def bounds(path):
    image=Image.open(path).convert("RGB")
    w,h=image.size
    # Downscale only for mask detection. Source files are NEVER edited.
    if max(w,h)>650:
        image.thumbnail((650,650),Image.Resampling.LANCZOS)
    arr=np.asarray(image,dtype=np.float32)
    sh,sw=arr.shape[:2]
    patch=max(8,min(sh,sw)//18)
    corners=np.concatenate([arr[:patch,:patch].reshape(-1,3),
      arr[:patch,-patch:].reshape(-1,3),arr[-patch:,:patch].reshape(-1,3),
      arr[-patch:,-patch:].reshape(-1,3)])
    bg=np.median(corners,axis=0)
    diff=np.linalg.norm(arr-bg,axis=2)
    mask=diff>46
    # Connected component filtering rejects labels, shadows and stray specks.
    mask=ndimage.binary_opening(mask,iterations=1)
    labels,n=ndimage.label(mask)
    sizes=np.bincount(labels.ravel())
    if len(sizes)<2: raise ValueError("no garment isolated from background")
    sizes[0]=0
    largest=sizes.argmax()
    ys,xs=np.nonzero(labels==largest)
    if len(xs)<0.025*sw*sh: raise ValueError("garment coverage below 2.5 percent")
    x0,x1=int(xs.min()),int(xs.max())+1
    y0,y1=int(ys.min()),int(ys.max())+1
    return {"path":str(path),"source_width":w,"source_height":h,
      "bbox_norm":[round(x0/sw,3),round(y0/sh,3),round(x1/sw,3),round(y1/sh,3)],
      "garment_width":round((x1-x0)/sw,3),
      "garment_height":round((y1-y0)/sh,3),
      "silhouette_ratio":round((y1-y0)/(x1-x0),3),
      "center_x":round((x0+x1)/(2*sw),3),
      "center_y":round((y0+y1)/(2*sh),3),
      "background_rgb":[round(float(v)) for v in bg]}

def inspect(root, sku=SKU):
    base=root/sku
    collected={}
    issues=[]
    for color in COLORS:
        for angle in ANGLES:
            path=base/color/(angle+".webp")
            key=f"{color}/{angle}"
            if not path.is_file():
                issues.append(f"{key}: source image missing")
                continue
            try:
                item=bounds(path)
                collected[key]=item
                if item["source_width"]<750 or item["source_height"]<750:
                    issues.append(f"{key}: low source pixel dimensions")
                if abs(item["center_x"]-0.5)>0.095:
                    issues.append(f"{key}: garment not centered horizontally")
            except Exception as exc:
                issues.append(f"{key}: {exc}")
    for angle in ANGLES:
        items=[collected[f"{c}/{angle}"] for c in COLORS if f"{c}/{angle}" in collected]
        if len(items)!=len(COLORS):continue
        ratios=[i["silhouette_ratio"] for i in items]
        spread=max(ratios)/min(ratios)
        if spread>1.18:
            issues.append(f"{angle}: silhouette height/width ratio varies {spread:.2f}x across colors (max 1.18x); rerender mismatched silhouettes")
        heights=[i["garment_height"] for i in items]
        hspread=max(heights)/min(heights)
        if hspread>1.25:
            issues.append(f"{angle}: garment artboard height varies {hspread:.2f}x (max 1.25x); normalize framing after silhouette QA")
    return {"sku":sku,"checked":len(collected),"expected":len(COLORS)*len(ANGLES),
            "pass":not issues,"issues":issues,"measurements":collected}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--root",type=Path,default=Path("public/assets/showroom"))
    p.add_argument("--enforce",action="store_true",help="nonzero exit if any QA failure; use as release gate")
    p.add_argument("--output",type=Path,help="write evidence JSON")
    args=p.parse_args()
    result=inspect(args.root)
    print(json.dumps(result,indent=2))
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
    return 1 if args.enforce and not result["pass"] else 0
if __name__=="__main__":
    raise SystemExit(main())
