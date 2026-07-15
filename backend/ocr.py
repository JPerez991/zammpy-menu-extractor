import os
import json
import re
import time
import httpx
from dotenv import load_dotenv

load_dotenv()

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"

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


def _call_gemini(image_b64: str, mime_type: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key or api_key == "tu_api_key_de_gemini_aqui":
        raise ValueError("GEMINI_API_KEY no configurada en .env")

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

    last_error = None
    with httpx.Client(timeout=60.0) as client:
        for attempt in range(3):
            resp = client.post(f"{GEMINI_URL}?key={api_key}", json=payload)
            if resp.status_code in (429, 503):
                wait = (attempt + 1) * 5
                print(f"[RETRY] {resp.status_code}, esperando {wait}s...")
                time.sleep(wait)
                last_error = f"Error {resp.status_code}: servidor ocupado, intenta de nuevo"
                continue
            resp.raise_for_status()
            break
        else:
            raise ValueError(last_error or "No se pudo conectar con Gemini tras 3 intentos")

    data = resp.json()
    text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")

    json_match = re.search(r"\{[\s\S]*\}", text)
    if not json_match:
        raise ValueError("Gemini no devolvió JSON válido. La imagen podría estar borrosa o no contener un menú legible.")

    result = json.loads(json_match.group(0))

    if "categories" not in result:
        result["categories"] = [{"name": "Menú", "icon": "fork"}]
    if "products" not in result:
        result["products"] = []

    return result


def extract_menu(image_b64: str, mime_type: str = "image/jpeg") -> dict:
    return _call_gemini(image_b64, mime_type)


def extract_menu_multi(files: list[dict]) -> dict:
    all_categories = {}
    all_products = []
    warnings = []

    for i, f in enumerate(files):
        file_b64 = f["file"]
        mime_type = f.get("mimeType", "image/jpeg")
        file_name = f.get("fileName", f"Archivo {i + 1}")

        print(f"[EXTRACT] Procesando {file_name} ({i + 1}/{len(files)})...")

        try:
            result = _call_gemini(file_b64, mime_type)

            products = result.get("products", [])
            if not products:
                warnings.append({
                    "fileName": file_name,
                    "message": "No se detectaron platos en esta imagen. Puede que no sea un menú o esté borrosa."
                })
            else:
                for cat in result.get("categories", []):
                    if cat["name"] not in all_categories:
                        all_categories[cat["name"]] = cat
                all_products.extend(products)

        except ValueError as e:
            msg = str(e)
            if "borrosa" in msg.lower() or "no devolvió" in msg.lower():
                warnings.append({"fileName": file_name, "message": f"{file_name}: No se pudo leer el menú. Asegúrate de que la foto sea clara, esté bien iluminada y el texto sea legible."})
            elif "GEMINI_API_KEY" in msg:
                warnings.append({"fileName": file_name, "message": "Error de configuración. Contacta al administrador."})
            elif "servidor" in msg.lower() or "429" in msg or "503" in msg:
                warnings.append({"fileName": file_name, "message": f"{file_name}: El servicio de IA está ocupado. Intenta de nuevo en unos segundos."})
            else:
                warnings.append({"fileName": file_name, "message": f"{file_name}: {msg}"})
        except Exception as e:
            print(f"[ERROR] {file_name}: {e}")
            warnings.append({"fileName": file_name, "message": f"{file_name}: No se pudo procesar este archivo. Verifica que no esté corrupto."})

    categories = list(all_categories.values())
    if not categories:
        categories = [{"name": "Menú", "icon": "fork"}]

    return {
        "categories": categories,
        "products": all_products,
        "warnings": warnings,
    }
