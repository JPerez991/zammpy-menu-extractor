import os
import json
import re
import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

PROMPT = """Eres un extractor de datos de menús de restaurante. Tu ÚNICO trabajo es leer lo que ves en la imagen y devolverlo como JSON.

REGLAS CRÍTICAS - VIOLARLAS ES UN ERROR GRAVE:
1. SOLO extrae texto que puedas LEER CON CERTEZA en la imagen
2. Si no puedes leer algo, lo omites. NO lo inventes.
3. Si un precio no es visible o no es legible, ponlo en 0
4. Si solo ves 3 platos, devuelve EXACTAMENTE 3 platos. No más, no menos.
5. NO inventes productos que no existan en la imagen
6. NO agregues categorías que no aparezcan en la imagen
7. NO completes información que no puedas leer con certeza
8. Respeta los nombres TAL COMO aparecen en el menú, incluyendo mayúsculas/minúsculas originales
9. Si una descripción no es visible, deja string vacío ""
10. Si no ves ingredientes/componentes, deja array vacío []

DEVUELVE ÚNICAMENTE este JSON válido (sin markdown, sin explicaciones, sin código):

{
  "categories": [
    { "name": "Nombre exacto de la categoría tal como aparece", "icon": "icono_apropiado" }
  ],
  "products": [
    {
      "categoryName": "Nombre exacto de la categoría tal como aparece",
      "name": "Nombre exacto del plato tal como aparece",
      "description": "Descripción si aparece, sino string vacío",
      "price": 18000,
      "components": [],
      "imageUrl": ""
    }
  ]
}

ICONOS VÁLIDOS para categories[].icon:
burger|hamburguesas, cup|café/bebidas, cake|postres, ice|helados, box|combos,
pizza|pizza, bag|para llevar, soup|sopas, star|especiales, heart|favoritos,
bread|panadería, croissant|croissantería, cookie|galletas, sandwich|sándwiches,
beef|carnes, fish|mariscos/pescados, salad|ensaladas, leaf|vegano,
wine|vinos, beer|cervezas, chef|chef, fork|genérico.

Si no puedes leer bien el nombre de una categoría, usa "Menú" con icon "fork".
price debe ser entero COP sin formato (18000 no "18.000"). Si no hay precio visible, usa 0.

Si NO puedes leer NADA útil del menú, devuelve:
{"categories": [{"name": "Menú", "icon": "fork"}], "products": []}

SOLO el JSON. Nada más antes ni después."""


def extract_menu(image_b64: str, mime_type: str = "image/jpeg") -> dict:
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "tu_api_key_de_gemini_aqui":
        raise ValueError("GEMINI_API_KEY no configurada en .env.local")

    is_pdf = mime_type == "application/pdf"

    parts = []
    if is_pdf:
        parts.append({"inlineData": {"mimeType": "application/pdf", "data": image_b64}})
    else:
        parts.append({"inlineData": {"mimeType": mime_type, "data": image_b64}})
    parts.append({"text": PROMPT})

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"temperature": 0.0, "maxOutputTokens": 8192},
    }

    with httpx.Client(timeout=60.0) as client:
        resp = client.post(f"{GEMINI_URL}?key={api_key}", json=payload)
        resp.raise_for_status()

    data = resp.json()
    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")

    json_match = re.search(r"\{[\s\S]*\}", text)
    if not json_match:
        raise ValueError("Gemini no devolvió JSON válido")

    result = json.loads(json_match.group(0))

    if "categories" not in result:
        result["categories"] = [{"name": "Menú", "icon": "fork"}]
    if "products" not in result:
        result["products"] = []

    return result
