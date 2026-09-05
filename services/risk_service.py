"""
Combines module2 (validation), module3 (tampering), module4 (face match)
into a single 0-100 risk score and an APPROVE/REVIEW/REJECT recommendation.

Scoring is intentionally simple and explainable for a hackathon demo judge
to follow — document the thresholds if asked, don't oversell it as a
trained model.
"""

def compute_risk(validation: dict, tampering: dict, face_match: dict, had_live_capture: bool):
    score = 0

    score += min(40, len(validation["errors"]) * 14)

    if tampering["isTampered"]:
        score += round(50 * tampering["confidence"])

    if had_live_capture:
        if not face_match["isMatch"]:
            score += 30
    else:
        score += 8  # identity unverified, but document itself may still be fine

    score = max(0, min(100, score))

    if tampering["isTampered"] and tampering["confidence"] >= 0.6:
        recommendation = "REJECT"
    elif score >= 60:
        recommendation = "REJECT"
    elif score >= 25:
        recommendation = "REVIEW"
    else:
        recommendation = "APPROVE"

    return score, recommendation
