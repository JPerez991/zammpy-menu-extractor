import io
import base64
from typing import NamedTuple

import numpy as np
from PIL import Image
import easyocr


class OcrBlock(NamedTuple):
    text: str
    confidence: float
    y_center: float
    x_center: float


_reader: easyocr.Reader | None = None


def _get_reader() -> easyocr.Reader:
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(["es", "en"], gpu=False, verbose=False)
    return _reader


def extract_text(image_b64: str) -> list[OcrBlock]:
    img_bytes = base64.b64decode(image_b64)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img_array = np.array(img)

    reader = _get_reader()
    results = reader.readtext(img_array)

    blocks: list[OcrBlock] = []
    for bbox, text, confidence in results:
        x_coords = [p[0] for p in bbox]
        y_coords = [p[1] for p in bbox]
        x_center = sum(x_coords) / len(x_coords)
        y_center = sum(y_coords) / len(y_coords)

        blocks.append(OcrBlock(
            text=text.strip(),
            confidence=confidence,
            y_center=y_center,
            x_center=x_center,
        ))

    blocks.sort(key=lambda b: b.y_center)
    return blocks
