"""
PaddleOCR engine wrapper.  Owns nothing but OCR inference.

Field extraction / normalization happens in ocr_service.py — this module
only converts an image into a flat list of detected text lines with their
confidence scores and bounding boxes.

The engine is initialized lazily (once per process) to avoid the heavy
model-loading cost on every request.
"""
from paddleocr import PaddleOCR

_ocr_engine = None


def get_engine() -> PaddleOCR:
    """Lazily initialize the PaddleOCR engine once per process."""
    global _ocr_engine
    if _ocr_engine is None:
        # paddleocr 2.7.x on Windows/CPU: use_angle_cls=True enables the
        # text-direction classifier which helps with rotated documents.
        # show_log=False suppresses the verbose DEBUG namespace dump on
        # every call.
        _ocr_engine = PaddleOCR(lang="en", use_angle_cls=True, show_log=False)
    return _ocr_engine


def run_paddle_ocr(image) -> list[dict]:
    """
    Run PaddleOCR on an image and return a flat list of
    ``{"text": str, "confidence": float, "bbox": list}`` dicts,
    ordered top-to-bottom as PaddleOCR detects them.

    *image* can be a file path (str) or a numpy ndarray (OpenCV image).

    paddleocr 2.7.x ``ocr()`` returns::

        [                            # list of pages (always 1 for a single image)
          [                          # list of detected lines
            [ [[x1,y1],[x2,y2],[x3,y3],[x4,y4]], ("text", confidence) ],
            ...
          ]
        ]
    """
    engine = get_engine()
    raw_result = engine.ocr(image, cls=True)

    lines: list[dict] = []
    if not raw_result or raw_result[0] is None:
        return lines

    for detection in raw_result[0]:      # first (only) page
        bbox, (text, confidence) = detection
        lines.append({
            "text": text,
            "confidence": float(confidence),
            "bbox": bbox,
        })

    return lines
