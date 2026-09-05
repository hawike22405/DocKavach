"""
Module 3: Tampering detection using Error Level Analysis (ELA).

How it works: re-save the image at a known JPEG quality and diff it against
the original. Regions that were edited/pasted in after the original capture
compress differently than the rest of the image, so they light up as
high-error patches. This is a real, established forensic technique (not a
mocked score) — see: Krawetz, "A Picture's Worth: Digital Image Analysis"
(2007), commonly used for exactly this kind of document/photo tamper check.

We additionally cross-reference anomaly regions against the detected face
bounding box to decide between PHOTO_REPLACEMENT (anomaly on the face) vs
FONT_MISMATCH (anomaly on a thin/wide text-like region) vs METADATA
(anything else).
"""
import io
import numpy as np
import cv2
from PIL import Image, ImageChops

ELA_QUALITY = 90
DIFF_THRESHOLD = 28          # 0-255 scale; empirically reasonable for JPEG re-save artifacts
MIN_REGION_AREA_FRAC = 0.004  # ignore tiny noise specks (<0.4% of image area)


def analyze_tampering(img: Image.Image, face_box_norm=None):
    buf = io.BytesIO()
    img.convert("RGB").save(buf, format="JPEG", quality=ELA_QUALITY)
    buf.seek(0)
    resaved = Image.open(buf)

    diff = ImageChops.difference(img.convert("RGB"), resaved)
    diff_np = np.array(diff).astype(np.uint8)
    gray_diff = cv2.cvtColor(diff_np, cv2.COLOR_RGB2GRAY)

    _, mask = cv2.threshold(gray_diff, DIFF_THRESHOLD, 255, cv2.THRESH_BINARY)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    h, w = gray_diff.shape
    img_area = h * w
    anomalies = []
    total_flagged_area = 0

    for c in contours:
        area = cv2.contourArea(c)
        if area / img_area < MIN_REGION_AREA_FRAC:
            continue
        x, y, bw, bh = cv2.boundingRect(c)
        total_flagged_area += area

        box_norm = {"x": round(x / w, 4), "y": round(y / h, 4),
                    "w": round(bw / w, 4), "h": round(bh / h, 4)}

        anomaly_type, description = _classify_region(box_norm, bw, bh, face_box_norm)
        anomalies.append({"type": anomaly_type, "description": description, "boundingBox": box_norm})

    # sort by area proxy (w*h) descending, keep top 5 so response stays readable
    anomalies.sort(key=lambda a: a["boundingBox"]["w"] * a["boundingBox"]["h"], reverse=True)
    anomalies = anomalies[:5]

    confidence = min(1.0, round((total_flagged_area / img_area) * 6, 3)) if anomalies else 0.0
    is_tampered = len(anomalies) > 0 and confidence >= 0.12

    return {"isTampered": is_tampered, "confidence": confidence, "anomalies": anomalies}


def _classify_region(box_norm, bw, bh, face_box_norm):
    if face_box_norm and _overlaps(box_norm, face_box_norm):
        return "PHOTO_REPLACEMENT", "Pixel-density discontinuity detected within the face photo region."
    aspect = bw / max(bh, 1)
    if aspect > 3.5 and bh < 60:
        return "FONT_MISMATCH", "Compression artifact pattern on a text line differs from surrounding text."
    return "METADATA", "Localized compression inconsistency detected outside the photo/text regions."


def _overlaps(a, b) -> bool:
    ax1, ay1, ax2, ay2 = a["x"], a["y"], a["x"] + a["w"], a["y"] + a["h"]
    bx1, by1, bx2, by2 = b["x"], b["y"], b["x"] + b["w"], b["y"] + b["h"]
    return not (ax2 < bx1 or bx2 < ax1 or ay2 < by1 or by2 < ay1)
