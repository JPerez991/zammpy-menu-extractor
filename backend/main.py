import time
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ocr import extract_menu, extract_menu_multi

app = FastAPI(title="Zammpy Menu Extractor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExtractRequest(BaseModel):
    file: str
    mimeType: str = "image/jpeg"


class FileItem(BaseModel):
    file: str
    mimeType: str = "image/jpeg"
    fileName: str = "Archivo"


class ExtractMultiRequest(BaseModel):
    files: List[FileItem]


@app.post("/extract")
async def extract_menu_endpoint(req: ExtractRequest):
    start = time.time()
    try:
        menu = extract_menu(req.file, req.mimeType)
        elapsed = time.time() - start
        print(f"[EXTRACT] {len(menu.get('categories', []))} categorías, {len(menu.get('products', []))} productos en {elapsed:.1f}s")
        return menu
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        print(f"[ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract-multi")
async def extract_multi_endpoint(req: ExtractMultiRequest):
    start = time.time()
    files_data = [f.model_dump() for f in req.files]
    try:
        result = extract_menu_multi(files_data)
        elapsed = time.time() - start
        print(f"[EXTRACT-MULTI] {len(result.get('categories', []))} categorías, {len(result.get('products', []))} productos, {len(result.get('warnings', []))} warnings en {elapsed:.1f}s")
        return result
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        print(f"[ERROR] {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/demo")
async def demo_menu():
    return {
        "categories": [
            {"name": "Hamburguesas", "icon": "burger"},
            {"name": "Pizzas", "icon": "pizza"},
            {"name": "Bebidas", "icon": "cup"},
            {"name": "Postres", "icon": "cake"},
            {"name": "Ensaladas", "icon": "salad"},
        ],
        "products": [
            {"categoryName": "Hamburguesas", "name": "Clásica", "description": "Carne 150g, lechuga, tomate, cebolla", "price": 22000, "components": ["Carne", "Lechuga", "Tomate", "Cebolla", "Pan brioche"], "imageUrl": ""},
            {"categoryName": "Hamburguesas", "name": "Doble Cheddar", "description": "Doble carne, queso cheddar, bacon", "price": 32000, "components": ["Doble carne", "Cheddar", "Bacon", "Pan brioche"], "imageUrl": ""},
            {"categoryName": "Hamburguesas", "name": "Vegana", "description": "Patty de garbanzo, aguacate, tomate", "price": 24000, "components": ["Patty garbanzo", "Aguacate", "Tomate", "Lechuga"], "imageUrl": ""},
            {"categoryName": "Pizzas", "name": "Margherita", "description": "Salsa de tomate, mozzarella, albahaca fresca", "price": 28000, "components": ["Masa artesanal", "Salsa tomate", "Mozzarella", "Albahaca"], "imageUrl": ""},
            {"categoryName": "Pizzas", "name": "Pepperoni", "description": "Pepperoni artesanal, queso mozzarella", "price": 32000, "components": ["Masa", "Pepperoni", "Mozzarella", "Salsa tomate"], "imageUrl": ""},
            {"categoryName": "Pizzas", "name": "Cuatro Quesos", "description": "Mozzarella, gorgonzola, parmesano, provolone", "price": 34000, "components": ["Mozzarella", "Gorgonzola", "Parmesano", "Provolone"], "imageUrl": ""},
            {"categoryName": "Bebidas", "name": "Limonada natural", "description": "Limón fresco, hielo", "price": 8000, "components": ["Limón", "Agua", "Hielo"], "imageUrl": ""},
            {"categoryName": "Bebidas", "name": "Jugo de mango", "description": "Mango natural, sin azúcar añadida", "price": 9000, "components": ["Mango", "Agua"], "imageUrl": ""},
            {"categoryName": "Bebidas", "name": "Cerveza artesanal", "description": "IPA local, 473ml", "price": 14000, "components": [], "imageUrl": ""},
            {"categoryName": "Postres", "name": "Tiramisú", "description": "Tiramisú italiano tradicional", "price": 16000, "components": ["Cacao", "Café", "Queso mascarpone", "Bizcocho"], "imageUrl": ""},
            {"categoryName": "Postres", "name": "Brownie", "description": "Brownie de chocolate con helado", "price": 14000, "components": ["Chocolate", "Helado de vainilla"], "imageUrl": ""},
            {"categoryName": "Ensaladas", "name": "Caesar", "description": "Lechuga romana, pollo grillado, crutones", "price": 18000, "components": ["Lechuga romana", "Pollo", "Crutones", "Parmesano", "Aderezo Caesar"], "imageUrl": ""},
            {"categoryName": "Ensaladas", "name": "Mediterránea", "description": "Tomate, pepino, aceitunas, queso feta", "price": 17000, "components": ["Tomate", "Pepino", "Aceitunas", "Queso feta", "Aceite de oliva"], "imageUrl": ""},
        ],
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
