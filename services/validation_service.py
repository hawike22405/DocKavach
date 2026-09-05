"""
Module 2: Validation. Combines any errors already found while parsing
(MRZ checksum mismatches etc.) with business-rule checks: expiry date,
required-field presence.
"""
import datetime


def validate_fields(fields: dict, ocr_errors: list) -> dict:
    errors = list(ocr_errors)

    expiry = fields.get("expiry", "")
    if expiry:
        try:
            expiry_date = datetime.datetime.strptime(expiry, "%Y-%m-%d").date()
            if expiry_date < datetime.date.today():
                errors.append("Document expiry date has passed")
        except ValueError:
            errors.append("Expiry date is not a valid calendar date")

    dob = fields.get("dob", "")
    if dob:
        try:
            dob_date = datetime.datetime.strptime(dob, "%Y-%m-%d").date()
            age_years = (datetime.date.today() - dob_date).days / 365.25
            if age_years < 0 or age_years > 120:
                errors.append("Date of birth is implausible")
        except ValueError:
            errors.append("Date of birth is not a valid calendar date")

    if not fields.get("documentNumber"):
        errors.append("Document number is missing")
    if not fields.get("name") or fields.get("name") == "UNKNOWN":
        errors.append("Name field could not be verified")

    # de-duplicate while preserving order
    seen = set()
    deduped = []
    for e in errors:
        if e not in seen:
            deduped.append(e)
            seen.add(e)

    return {"isValid": len(deduped) == 0, "errors": deduped}
