"""
Module 4: Face detection + face match.

Uses OpenCV's built-in Haar cascade for face detection (no external model
download needed — ships inside opencv-python-headless). Match score is a
histogram-correlation similarity between the two detected face crops.
This is a lightweight, explainable approach appropriate for a hackathon
checkpoint demo; swap in a proper embedding model (e.g. ArcFace/FaceNet)
post-hackathon for production accuracy.
"""
import cv2
import numpy as np
from PIL import Image

_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")


def detect_face_box(img: Image.Image):
    """Returns normalized {x,y,w,h} of the largest detected face, or None."""
    cv_img = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)
    gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
    faces = _cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(40, 40))
    if len(faces) == 0:
        return None, None
    # largest face by area
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    H, W = gray.shape
    box_norm = {"x": round(x / W, 4), "y": round(y / H, 4), "w": round(w / W, 4), "h": round(h / H, 4)}
    crop = cv_img[y:y + h, x:x + w]
    return box_norm, crop


def match_faces(doc_img: Image.Image, live_img: Image.Image = None):
    doc_box, doc_crop = detect_face_box(doc_img)

    if live_img is None:
        return {"matchPercentage": 0, "isMatch": False}, doc_box, "No live capture provided for comparison"

    live_box, live_crop = detect_face_box(live_img)

    if doc_crop is None or live_crop is None:
        return {"matchPercentage": 0, "isMatch": False}, doc_box, "Face not detected in one or both images"

    size = (150, 150)
    a = cv2.resize(cv2.cvtColor(doc_crop, cv2.COLOR_BGR2GRAY), size)
    b = cv2.resize(cv2.cvtColor(live_crop, cv2.COLOR_BGR2GRAY), size)

    hist_a = cv2.calcHist([a], [0], None, [256], [0, 256])
    hist_b = cv2.calcHist([b], [0], None, [256], [0, 256])
    cv2.normalize(hist_a, hist_a)
    cv2.normalize(hist_b, hist_b)
    correlation = cv2.compareHist(hist_a, hist_b, cv2.HISTCMP_CORREL)  # -1..1

    match_pct = max(0, min(100, round(((correlation + 1) / 2) * 100, 1)))
    return {"matchPercentage": match_pct, "isMatch": match_pct >= 85}, doc_box, None
