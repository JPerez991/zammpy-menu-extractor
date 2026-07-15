import re
from typing import NamedTuple

from ocr import OcrBlock


class MenuItem(NamedTuple):
    name: str
    price: int
    description: str
    components: list[str]


class Category(NamedTuple):
    name: str
    icon: str


PRICE_RE = re.compile(
    r"\$?\s*([\d]{1,3}(?:[.\.,]\d{3})+|\d+)"
)

ICON_KEYWORDS: dict[str, list[str]] = {
    "burger": ["hamburguesa", "burger", "hamburguesas"],
    "pizza": ["pizza", "pizzas"],
    "cup": ["café", "cafe", "bebida", "bebidas", "jugos", "jugo", "gaseosa", "refresco", "té", "te", "cappuccino", "latte", "expresso", "espresso"],
    "cake": ["postre", "postres", "torta", "pastel"],
    "ice": ["helado", "helados", "nieve", "helados"],
    "soup": ["sopa", "sopas", "caldo", "caldos"],
    "salad": ["ensalada", "ensaladas"],
    "beef": ["carne", "carnes", "res", "bife", "steak", "lomo"],
    "fish": ["pescado", "pescados", "marisco", "mariscos", "salmón", "salmon", "atún", "atun", "camarón", "camaron"],
    "sandwich": ["sándwich", "sandwich", "emparedado"],
    "bread": ["pan", "panes", "panadería"],
    "croissant": ["croissant", "medialuna"],
    "cookie": ["galleta", "galletas"],
    "leaf": ["vegano", "vegana", "vegetariano", "vegetariana", "ensalada vegana"],
    "wine": ["vino", "vinos", "vino tinto", "vino blanco"],
    "beer": ["cerveza", "cervezas", "birra", "lager", "pilsner"],
    "chef": ["chef", "especial del chef", "recomendación"],
    "star": ["especial", "especiales", "estrella", "famoso", "signature"],
    "heart": ["favorito", "favoritos", "más pedido"],
    "box": ["combo", "combos", "menú del día", "menu del día"],
    "bag": ["para llevar", "take away", "take-away"],
    "fork": [],
}

SECTION_KEYWORDS: set[str] = {
    "menú", "menu", "carta", "comidas", "almuerzo", "cena",
    "desayuno", "antojitos", "entradas", "bocadillos", "tapas",
    "acompañamientos", "guarniciones", "salsas", "aderezos",
    "bebidas", "refrescos", "jugos", "vinos", "cervezas",
    "cocteles", "tragos", "postres", "helados",
    "especiales", "promociones", "combos", "para llevar",
    " adicionales", "extras", "kids", "infantil",
}


def _parse_price(text: str) -> int | None:
    match = PRICE_RE.search(text)
    if not match:
        return None
    raw = match.group(1).replace(".", "").replace(",", "").replace(" ", "")
    try:
        return int(raw)
    except ValueError:
        return None


def _remove_price_from_text(text: str) -> str:
    return PRICE_RE.sub("", text).strip(" -–—·•")


def _is_section_header(text: str, blocks: list[OcrBlock], idx: int) -> bool:
    lower = text.lower().strip()

    if lower in SECTION_KEYWORDS:
        return True

    if len(text) <= 3:
        return False

    has_price = _parse_price(text) is not None
    if has_price:
        return False

    all_upper = text == text.upper() and len(text) > 3
    if all_upper:
        next_has_price = False
        if idx + 1 < len(blocks):
            next_has_price = _parse_price(blocks[idx + 1].text) is not None
        if not next_has_price:
            return True

    return False


def _infer_icon(category_name: str) -> str:
    lower = category_name.lower()
    for icon, keywords in ICON_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                return icon
    return "fork"


def _price_from_next_line(blocks: list[OcrBlock], idx: int) -> int | None:
    for offset in range(1, 4):
        if idx + offset >= len(blocks):
            break
        price = _parse_price(blocks[idx + offset].text)
        if price is not None:
            return price
    return None


def _extract_description(blocks: list[OcrBlock], name_idx: int, price_idx: int | None) -> str:
    descs: list[str] = []
    start = name_idx + 1
    end = price_idx if price_idx is not None else name_idx + 3

    for i in range(start, min(end + 1, len(blocks))):
        block = blocks[i]
        text = _remove_price_from_text(block.text)
        if text and len(text) > 2:
            descs.append(text)
        if descs:
            break

    return ", ".join(descs) if descs else ""


def parse_menu(blocks: list[OcrBlock]) -> dict:
    if not blocks:
        return {"categories": [], "products": []}

    categories: list[dict] = []
    products: list[dict] = []

    current_category_name = "Menú"
    current_category_idx = -1
    category_header_indices: list[int] = []

    section_header_re = re.compile(
        r"^(entradas|postres|bebidas|vinos|cervezas|cocteles|cocktails|"
        r"ensaladas|sopas|pizzas|hamburguesas|sandwiches|sándwiches|"
        r"carnes|pescados|mariscos|pasta|arroces|acompañamientos|"
        r"desayuno|almuerzo|cena|menú|menu|especiales|combos|"
        r"para llevar|extras|adicionales|kids|infantil|brunch|"
        r"antojitos|bocadillos|tapas|parrilla|parrillada|"
        r"tacos|burritos|quesadillas|tortas|antojitos mexicanos|"
        r"sushi|rolls|sashimi|ramen|udon|dim sum|"
        r"café|cafe|cafetería|cafeteria|helados|nieves|"
        r"jugos|refrescos|gaseosas|agua|agua mineral|"
        r"copas|botellas|tragos|sin alcohol|con alcohol|"
        r"infantil|niños|kids|degustación|tasting|"
        r"desayuno|brunch|almuerzo|cena|repostería|bollería|"
        r"panadería|panaderia|reposteria|pastelería|pasteleria)",
        re.IGNORECASE,
    )

    i = 0
    while i < len(blocks):
        block = blocks[i]
        text = block.text.strip()

        if not text or len(text) < 2:
            i += 1
            continue

        if section_header_re.match(text):
            current_category_name = text.title()
            if len(current_category_name) > 40:
                current_category_name = current_category_name[:40]
            current_category_idx = len(categories)
            categories.append({"name": current_category_name, "icon": _infer_icon(current_category_name)})
            category_header_indices.append(i)
            i += 1
            continue

        if _is_section_header(text, blocks, i):
            current_category_name = text.title()
            if len(current_category_name) > 40:
                current_category_name = current_category_name[:40]
            current_category_idx = len(categories)
            categories.append({"name": current_category_name, "icon": _infer_icon(current_category_name)})
            category_header_indices.append(i)
            i += 1
            continue

        price = _parse_price(text)
        price_line_idx = i

        if price is not None:
            name_text = _remove_price_from_text(text)
            if not name_text and i > 0:
                prev_block = blocks[i - 1]
                prev_text = prev_block.text.strip()
                if prev_text and _parse_price(prev_text) is None:
                    name_text = prev_text
                    price_line_idx = i - 1

            if name_text and len(name_text) >= 2:
                description = ""
                for j in range(i + 1, min(i + 4, len(blocks))):
                    next_text = blocks[j].text.strip()
                    next_price = _parse_price(next_text)
                    next_is_header = _is_section_header(next_text, blocks, j)
                    if next_price is not None or next_is_header:
                        break
                    clean = _remove_price_from_text(next_text)
                    if clean and len(clean) > 2:
                        description = clean
                        break

                products.append({
                    "categoryName": current_category_name,
                    "name": name_text,
                    "description": description,
                    "price": price,
                    "components": [],
                    "imageUrl": "",
                })
            i += 1
            continue

        if i + 1 < len(blocks):
            next_price = _parse_price(blocks[i + 1].text)
            if next_price is not None:
                name_text = text
                description = ""
                search_start = i + 2
                for j in range(search_start, min(search_start + 3, len(blocks))):
                    next_next = blocks[j].text.strip()
                    if _parse_price(next_next) is not None or _is_section_header(next_next, blocks, j):
                        break
                    clean = _remove_price_from_text(next_next)
                    if clean and len(clean) > 2:
                        description = clean
                        break

                products.append({
                    "categoryName": current_category_name,
                    "name": name_text,
                    "description": description,
                    "price": next_price,
                    "components": [],
                    "imageUrl": "",
                })
                i += 2
                continue

        i += 1

    if not categories:
        categories.append({"name": "Menú", "icon": "fork"})

    used_names = {c["name"] for c in categories}
    for prod in products:
        if prod["categoryName"] not in used_names:
            cat_name = prod["categoryName"]
            if len(cat_name) > 40:
                cat_name = cat_name[:40]
            categories.append({"name": cat_name, "icon": _infer_icon(cat_name)})
            used_names.add(cat_name)

    return {"categories": categories, "products": products}
