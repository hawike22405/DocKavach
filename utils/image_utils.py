import base64
import binascii
import io
import re
import numpy as np
from PIL import Image


class ImageDecodeError(Exception):
    pass


MAX_IMAGE_BYTES = 12 * 1024 * 1024
MAX_IMAGE_DIMENSION = 6000
_DATA_URL_RE = re.compile(r"^data:image/(?:png|jpeg|jpg|webp);base64,", re.IGNORECASE)


def decode_base64_image(b64_string: str) -> Image.Image:
    """Decode a bounded image payload and reject malformed or oversized input."""
    if not isinstance(b64_string, str) or not b64_string.strip():
        raise ImageDecodeError("Empty image data")

    b64_string = b64_string.strip()
    if b64_string.startswith("data:"):
        if not _DATA_URL_RE.match(b64_string):
            raise ImageDecodeError("Unsupported image data URL")
        b64_string = b64_string.split(",", 1)[1]

    # A base64 value at this size cannot decode into an accepted image.
    if len(b64_string) > ((MAX_IMAGE_BYTES * 4 + 2) // 3) * 4:
        raise ImageDecodeError("Image payload too large")

    try:
        raw = base64.b64decode(b64_string, validate=True)
    except (binascii.Error, ValueError) as e:
        raise ImageDecodeError("Invalid base64 image data") from e

    if len(raw) > MAX_IMAGE_BYTES:
        raise ImageDecodeError("Image payload too large")

    try:
        with Image.open(io.BytesIO(raw)) as img:
            img.verify()
        with Image.open(io.BytesIO(raw)) as img:
            width, height = img.size
            if width <= 0 or height <= 0 or max(width, height) > MAX_IMAGE_DIMENSION:
                raise ImageDecodeError("Image dimensions exceed the allowed limit")
            img.load()
            return img.convert("RGB")
    except ImageDecodeError:
        raise
    except Exception as e:
        raise ImageDecodeError("Unsupported or corrupt image") from e


def pil_to_cv2(img: Image.Image) -> np.ndarray:
    import cv2
    arr = np.array(img)
    return cv2.cvtColor(arr, cv2.COLOR_RGB2BGR)


def encode_pil_to_base64(img: Image.Image, fmt="JPEG") -> str:
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return base64.b64encode(buf.getvalue()).decode()
