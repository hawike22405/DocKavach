"""
Module 1: OCR extraction.
For PASSPORT: runs tesseract, locates the MRZ block, parses it (mrz_parser).
For VISA / NATIONAL_ID (no standard MRZ): runs plain OCR and applies
light heuristics to pull a name / number / dates from the raw text,
since these formats vary by issuing country.
"""
import re
import pytesseract
from PIL import Image
from services.mrz_parser import parse_mrz


def run_ocr(img: Image.Image, document_type: str):
    # Upscale small images — tesseract accuracy drops badly below ~300dpi equivalent
    w, h = img.size
    if max(w, h) < 1200:
        scale = 1200 / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)))

    raw_text = pytesseract.image_to_string(img)

    if document_type == "PASSPORT":
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
