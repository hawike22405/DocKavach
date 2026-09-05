import base64
import io
import numpy as np
from PIL import Image


class ImageDecodeError(Exception):
    pass


def decode_base64_image(b64_string: str) -> Image.Image:
    """Accepts a raw base64 string or a data URL (data:image/png;base64,....)."""
    if not b64_string:
        raise ImageDecodeError("Empty image data")
    if "," in b64_string and b64_string.strip().startswith("data:"):
        b64_string = b64_string.split(",", 1)[1]
    try:
        raw = base64.b64decode(b64_string, validate=False)
        img = Image.open(io.BytesIO(raw))
        img.load()
        return img.convert("RGB")
    except Exception as e:
        raise ImageDecodeError(f"Could not decode image: {e}")


def pil_to_cv2(img: Image.Image) -> np.ndarray:
    import cv2
    arr = np.array(img)  # RGB
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)


def encode_pil_to_base64(img: Image.Image, fmt="JPEG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode()
