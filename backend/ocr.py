import io
import base64
from typing import NamedTuple

import numpy as np
from PIL import Image
from paddleocr import PaddleOCR


class OcrBlock(NamedTuple):
    text: str
    confidence: float
    y_center: float
    x_center: float


_ocr_engine: PaddleOCR | None = None


def _get_engine() -> PaddleOCR:
    global _ocr_engine
    if _ocr_engine is None:
        _ocr_engine = PaddleOCR(use_angle_cls=True, lang="es", show_log=False)
    return _ocr_engine


def extract_text(image_b64: str) -> list[OcrBlock]:
    img_bytes = base64.b64decode(image_b64)
    img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    img_array = np.array(img)

    engine = _get_engine()
    result = engine.ocr(img_array, det=True, rec=True)

    blocks: list[OcrBlock] = []
    if result and result[0]:
        for line in result[0]:
            box = line[0]
            text = line[1][0]
            confidence = float(line[1][1])

            x_coords = [p[0] for p in box]
            y_coords = [p[1] for p in box]
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
