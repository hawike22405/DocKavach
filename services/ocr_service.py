"""
Module 1: OCR extraction.
For PASSPORT: preprocesses the image, runs tesseract on a whitelisted crop
of the MRZ band (falling back to the full page if that doesn't pan out),
locates the MRZ block, and parses it (mrz_parser).
For VISA / NATIONAL_ID (no standard MRZ): runs plain OCR and applies
light heuristics to pull a name / number / dates from the raw text,
since these formats vary by issuing country.
"""
import re
import cv2
import numpy as np
import pytesseract
from PIL import Image
from services.mrz_parser import parse_mrz

# MRZ text is printed in OCR-B, a font stock Tesseract's general English
# model reads poorly without help. Restricting the whitelist to the actual
# MRZ alphabet removes most of the "looks-plausible-but-wrong" character
# substitutions that were producing garbage name/DOB/document-number fields.
MRZ_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<"


def _preprocess_for_ocr(img: Image.Image) -> Image.Image:
    """Grayscale + deskew + denoise + adaptive threshold.

    Tesseract accuracy on a phone/webcam photo of a document (uneven
    lighting, slight rotation/skew, JPEG noise) is dramatically better on a
    clean binarized image than on the raw color photo we were feeding it
    before.
    """
    cv_img = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)

    # Deskew: estimate rotation from the orientation of dark (ink) pixels.
    angle_mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]
    coords = cv2.findNonZero(angle_mask)
    if coords is not None and len(coords) > 50:
        angle = cv2.minAreaRect(coords)[-1]
        angle = -(90 + angle) if angle < -45 else -angle
        if 0.5 < abs(angle) < 15:  # ignore near-zero noise and implausibly large angles
            h, w = gray.shape
            m = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
            gray = cv2.warpAffine(gray, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

    gray = cv2.fastNlMeansDenoising(gray, h=10)
    binarized = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 15
    )
    return Image.fromarray(binarized)


def _ocr_mrz_band(img: Image.Image) -> str:
    """MRZ always sits in the bottom band of a passport photo page.
    Cropping to just that band and whitelisting tesseract's character set
    to the MRZ alphabet avoids most of the misreads that happen when
    tesseract runs its general model over the whole page (names, seals,
    background patterns, etc. all add noise to that pass)."""
    w, h = img.size
    band = img.crop((0, int(h * 0.72), w, h))
    config = f"--psm 6 -c tessedit_char_whitelist={MRZ_CHARSET}"
    return pytesseract.image_to_string(band, config=config)


def run_ocr(img: Image.Image, document_type: str):
    # Upscale small images — tesseract accuracy drops badly below ~300dpi equivalent
    w, h = img.size
    if max(w, h) < 1200:
        scale = 1200 / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)))

    processed = _preprocess_for_ocr(img)
    # --psm 6 ("assume a single uniform block of text") is more reliable
    # here than Tesseract's default automatic page segmentation, which can
    # silently drop an isolated text block (like the MRZ sitting below a
    # gap under the personal-details fields) that it doesn't confidently
    # classify as part of the page layout.
    raw_text = pytesseract.image_to_string(processed, config="--psm 6")

    if document_type == "PASSPORT":
        mrz_band_text = _ocr_mrz_band(processed)
        fields, errors = parse_mrz(mrz_band_text)
        if not fields.get("documentNumber") and not fields.get("dob"):
            # The bottom-band crop didn't line up with the MRZ (e.g. the
            # photo was already tightly cropped) — fall back to full-page OCR.
            fields, errors = parse_mrz(raw_text)
        return fields, errors

    # VISA / NATIONAL_ID — no guaranteed MRZ, extract what we reasonably can
    return _heuristic_extract(raw_text)


def _heuristic_extract(raw_text: str):
    errors = []
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]

    name = ""
    doc_number = ""
    dob = ""
    expiry = ""
    nationality = "UNK"

    date_pattern = re.compile(r"\b(\d{2}[/\-.]\d{2}[/\-.]\d{4}|\d{4}[/\-.]\d{2}[/\-.]\d{2})\b")
    id_pattern = re.compile(r"\b([A-Z0-9]{6,12})\b")

    dates_found = date_pattern.findall(raw_text)
    if len(dates_found) >= 1:
        dob = _normalize_date(dates_found[0])
    if len(dates_found) >= 2:
        expiry = _normalize_date(dates_found[1])
    else:
        errors.append("Could not confidently locate two dates (DOB/expiry) on document")

    for line in lines:
        m = id_pattern.search(line.replace(" ", ""))
        if m and any(c.isdigit() for c in m.group(1)) and any(c.isalpha() for c in m.group(1)):
            doc_number = m.group(1)
            break
    if not doc_number:
        errors.append("Document/ID number not confidently detected")

    # crude name guess: first all-caps line with 2+ words and no digits
    for line in lines:
        words = line.split()
        if len(words) >= 2 and line.isupper() and not any(c.isdigit() for c in line):
            name = line
            break
    if not name:
        errors.append("Name field not confidently detected")
        name = "UNKNOWN"

    fields = {
        "name": name,
        "documentNumber": doc_number,
        "dob": dob,
        "expiry": expiry,
        "nationality": nationality,
        "mrz": "",  # not applicable for non-MRZ documents
    }
    return fields, errors


def _normalize_date(raw: str) -> str:
    parts = re.split(r"[/\-.]", raw)
    if len(parts[0]) == 4:
        return f"{parts[0]}-{parts[1]}-{parts[2]}"
    return f"{parts[2]}-{parts[1]}-{parts[0]}"
