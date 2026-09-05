"""
Parses TD3-format MRZ (2 lines x 44 chars, used on passports) per ICAO Doc 9303.

Line 1: P<CCCSURNAME<<GIVEN<NAMES<<<<<<<<<<<<<<<<<<<<
Line 2: PPPPPPPPPCCCYYMMDDCSYYMMDDCPPPPPPPPPPPPPCC
        |9 doc no|3nat|6dob|1|1sex|6exp|1|14 personal|1|1 composite
"""
import re

_WEIGHTS = [7, 3, 1]


def _char_value(c: str) -> int:
    if c == "<":
        return 0
    if c.isdigit():
        return int(c)
    if c.isalpha():
        return ord(c.upper()) - ord("A") + 10
    return 0


def _checksum(data: str) -> int:
    total = 0
    for i, c in enumerate(data):
        total += _char_value(c) * _WEIGHTS[i % 3]
    return total % 10


def find_mrz_lines(raw_text: str):
    """Scan OCR output for two 44-ish char lines that look like MRZ."""
    candidates = []
    for line in raw_text.splitlines():
        cleaned = re.sub(r"[^A-Z0-9<]", "", line.upper())
        if len(cleaned) >= 30 and cleaned.count("<") >= 2:
            candidates.append(cleaned)
    if len(candidates) < 2:
        return None
    # Take the two longest candidate lines, in original order
    candidates = sorted(candidates, key=len, reverse=True)[:2]
    line1, line2 = candidates
    # normalise to 44 chars (pad or trim) so fixed-offset parsing is safe
    line1 = (line1 + "<" * 44)[:44]
    line2 = (line2 + "<" * 44)[:44]
    return line1, line2


def parse_mrz(raw_text: str):
    """
    Returns (fields dict, errors list). fields always has name/documentNumber/
    dob/expiry/nationality/mrz keys (empty string if unparseable) so the
    caller can always build a valid ScreeningResponse.
    """
    errors = []
    lines = find_mrz_lines(raw_text)
    if not lines:
        return {
            "name": "", "documentNumber": "", "dob": "", "expiry": "",
            "nationality": "", "mrz": raw_text.strip()[:200],
        }, ["MRZ not detected in OCR output"]

    line1, line2 = lines
    mrz_text = f"{line1}\n{line2}"

    # ---- Line 1: names ----
    name_field = line1[5:44].rstrip("<")
    parts = name_field.split("<<", 1)
    surname = parts[0].replace("<", " ").strip()
    given = parts[1].replace("<", " ").strip() if len(parts) > 1 else ""
    full_name = f"{given} {surname}".strip() or "UNKNOWN"

    # ---- Line 2: doc number, nationality, dob, sex, expiry, checks ----
    doc_number_raw = line2[0:9]
    doc_number_check = line2[9]
    nationality = line2[10:13].replace("<", "")
    dob_raw = line2[13:19]
    dob_check = line2[19]
    expiry_raw = line2[21:27]
    expiry_check = line2[27]
    composite_check = line2[43] if len(line2) > 43 else "0"

    doc_number = doc_number_raw.replace("<", "")

    def fmt_date(yymmdd: str, is_expiry: bool):
        if not re.match(r"^\d{6}$", yymmdd):
            return ""
        yy, mm, dd = yymmdd[0:2], yymmdd[2:4], yymmdd[4:6]
        # heuristic century: expiry dates roll to 20xx; dob > current year yy means 19xx
        century = "20"
        if not is_expiry and int(yy) > 30:
            century = "19"
        return f"{century}{yy}-{mm}-{dd}"

    dob = fmt_date(dob_raw, is_expiry=False)
    expiry = fmt_date(expiry_raw, is_expiry=True)

    # ---- checksum validation (this is where tampering/forgery often shows up) ----
    if doc_number_check.isdigit() and _checksum(doc_number_raw) != int(doc_number_check):
        errors.append("MRZ checksum digit mismatch on document number (line 2)")
    if dob_check.isdigit() and dob_raw != "<" * 6 and _checksum(dob_raw) != int(dob_check):
        errors.append("MRZ checksum digit mismatch on date of birth (line 2)")
    if expiry_check.isdigit() and expiry_raw != "<" * 6 and _checksum(expiry_raw) != int(expiry_check):
        errors.append("MRZ checksum digit mismatch on expiry date (line 2)")

    composite_data = (
        doc_number_raw + doc_number_check + dob_raw + dob_check + expiry_raw + expiry_check + line2[28:43]
    )
    if composite_check.isdigit() and _checksum(composite_data) != int(composite_check):
        errors.append("MRZ composite checksum mismatch (line 2)")

    if not doc_number:
        errors.append("Document number could not be read from MRZ")
    if not dob:
        errors.append("Date of birth could not be read from MRZ")

    fields = {
        "name": full_name.upper(),
        "documentNumber": doc_number,
        "dob": dob,
        "expiry": expiry,
        "nationality": nationality or "UNK",
        "mrz": mrz_text,
    }
    return fields, errors
