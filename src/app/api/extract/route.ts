import type { MenuData } from "@/types";

const ZAMMPY_API = process.env.ZAMMPY_API_URL || "https://manzana.zammpy.com";

const CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

async function safeJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function buildExtractionPrompt(isPDF: boolean): string {
  const target = isPDF ? "este documento PDF" : "esta imagen";
  return `Analiza ${target} de un menú de restaurante.

Devuelve ÚNICAMENTE un JSON válido (sin markdown, sin explicaciones, sin código) con esta estructura exacta:

{
  "categories": [
    { "name": "Nombre de la categoría", "icon": "burger" }
  ],
  "products": [
    {
      "categoryName": "Nombre de la categoría",
      "name": "Nombre del plato",
      "description": "Descripción si aparece, sino deja string vacío",
      "price": 18000,
      "components": ["Ingrediente 1", "Ingrediente 2"],
      "imageUrl": ""
    }
  ]
}

ICONOS VÁLIDOS para categories[].icon (elige el más apropiado según el contexto):
burger|hamburguesas, cup|café/bebidas, cake|postres, ice|helados, box|combos,
pizza|pizza, bag|para llevar, soup|sopas, star|especiales, heart|favoritos,
bread|panadería, croissant|croissantería, cookie|galletas, sandwich|sándwiches,
beef|carnes, fish|mariscos/pescados, salad|ensaladas, leaf|vegano/vegetariano,
wine|vinos, beer|cervezas, chef|recomendados del chef, fork|genérico.
Si no sabes cuál poner, usa "fork".

REGLAS OBLIGATORIAS:
- categories[].name: máx 40 caracteres. Cada nombre debe ser ÚNICO (sin duplicar por mayúsculas/minúsculas)
- categories[].icon: uno de los 22 valores de la tabla
- products[].categoryName: DEBE coincidir exactamente con el name de una categoría existente
- products[].name: máx 50 caracteres
- products[].description: máx 200 caracteres, texto plano (sin HTML ni markdown). Si no hay, string vacío ""
- products[].price: entero positivo en COP. Sin puntos, comas ni símbolo de moneda. Ej: 18000 no "18.000". Si el precio no es visible, usa 0
- products[].components: array de strings (ingredientes/componentes visibles). Si no hay, array vacío []
- products[].imageUrl: siempre string vacío "" (la imagen se sube después)
- Incluye TODOS los productos/platos visibles en el menú
- Respeta los nombres originales del menú
- Si no hay categorías claras, usa una sola categoría llamada "Menú" con icon "fork"
${isPDF ? "- El PDF puede tener múltiples páginas, extrae de TODAS las páginas" : ""}

SOLO el JSON. Nada más antes ni después.`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // === Login email/password ===
    if (body.action === "login") {
      const email = String(body.email || "").trim();
      const password = String(body.password || "");
      const loginBody = JSON.stringify({ email, password });
      console.log(`[LOGIN] POST ${ZAMMPY_API}/api/v1/auth/login`);
      console.log(`[LOGIN] email="${email}" pass_len=${password.length}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(`${ZAMMPY_API}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": CHROME_UA },
        body: loginBody,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      console.log(`[LOGIN] Status: ${res.status}`);

      const data = await safeJson(res);
      console.log(`[LOGIN] Response keys: ${typeof data === "object" && data !== null ? Object.keys(data).join(", ") : typeof data}`);

      if (!res.ok) {
        const msg = (data && typeof data === "object" && "message" in data)
          ? String((data as Record<string, unknown>).message)
          : `Credenciales incorrectas (${res.status})`;
        console.log(`[LOGIN] Error: ${msg}`);
        return Response.json({ error: msg }, { status: res.status });
      }

      console.log(`[LOGIN] Token received: ${!!(data as Record<string, unknown>).token}`);
      return Response.json({
        token: (data as Record<string, unknown>).token,
        userId: (data as Record<string, unknown>).userId,
        nombre: (data as Record<string, unknown>).nombre,
        apellido: (data as Record<string, unknown>).apellido,
        email: (data as Record<string, unknown>).email,
        avatar: (data as Record<string, unknown>).avatar,
      });
    }

    // === Login Google ===
    if (body.action === "google_token") {
      const idToken = String(body.idToken || "");
      console.log(`[GOOGLE] Intercambiando id_token por JWT`);

      if (!idToken) {
        return Response.json({ error: "No se recibió id_token de Google" }, { status: 400 });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(`${ZAMMPY_API}/api/v1/auth/google/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": CHROME_UA, Accept: "application/json" },
        body: JSON.stringify({ idToken }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      console.log(`[GOOGLE] Status: ${res.status}`);

      if (!res.ok) {
        const data = await safeJson(res);
        console.log(`[GOOGLE] Error body:`, data);
        const msg = (data && typeof data === "object" && "message" in data)
          ? String((data as Record<string, unknown>).message)
          : `Error al autenticar con Google (${res.status})`;
        return Response.json({ error: msg }, { status: res.status });
      }

      const data = (await res.json()) as Record<string, unknown>;
      console.log(`[GOOGLE] Token received: ${!!data.token}`);
      return Response.json({
        token: data.token, userId: data.userId, nombre: data.nombre,
        apellido: data.apellido, email: data.email, avatar: data.avatar,
      });
    }

    // === Fetch menus ===
    if (body.action === "fetch_menus") {
      console.log(`[MENUS] Fetching menus`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${ZAMMPY_API}/api/v1/menus`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "User-Agent": CHROME_UA, Authorization: `Bearer ${body.token}` },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      console.log(`[MENUS] Status: ${res.status}`);

      if (!res.ok) {
        const data = await safeJson(res);
        const msg = (data && typeof data === "object" && "message" in data)
          ? String((data as Record<string, unknown>).message)
          : `Error al obtener menús (${res.status})`;
        return Response.json({ error: msg }, { status: res.status });
      }

      const menus = await res.json();
      console.log(`[MENUS] Found ${Array.isArray(menus) ? menus.length : "?"} menus`);
      return Response.json(menus);
    }

    // === Update menu draft ===
    if (body.action === "update_menu") {
      console.log(`[UPDATE] Updating menu ${body.menId}`);
      const draftRes = await fetch(`${ZAMMPY_API}/api/v1/menus/${body.menId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "User-Agent": CHROME_UA, Authorization: `Bearer ${body.token}` },
        body: JSON.stringify(body.draft),
      });

      console.log(`[UPDATE] Draft status: ${draftRes.status}`);
      if (!draftRes.ok) {
        const text = await draftRes.text();
        console.log(`[UPDATE] Error: ${text}`);
        return Response.json({ error: `Error al actualizar borrador (${draftRes.status}): ${text}` }, { status: draftRes.status });
      }

      const result = await draftRes.json().catch(() => ({}));
      console.log(`[UPDATE] Success`);
      return Response.json({ ok: true, ...result });
    }

    // === Demo data ===
    if (body.action === "demo") {
      console.log(`[DEMO] Returning mock menu data`);
      const mock: MenuData = {
        categories: [
          { name: "Hamburguesas", icon: "burger" },
          { name: "Pizzas", icon: "pizza" },
          { name: "Bebidas", icon: "cup" },
          { name: "Postres", icon: "cake" },
          { name: "Ensaladas", icon: "salad" },
        ],
        products: [
          { categoryName: "Hamburguesas", name: "Clásica", description: "Carne 150g, lechuga, tomate, cebolla", price: 22000, components: ["Carne", "Lechuga", "Tomate", "Cebolla", "Pan brioche"], imageUrl: "" },
          { categoryName: "Hamburguesas", name: "Doble Cheddar", description: "Doble carne, queso cheddar, bacon", price: 32000, components: ["Doble carne", "Cheddar", "Bacon", "Pan brioche"], imageUrl: "" },
          { categoryName: "Hamburguesas", name: "Vegana", description: "Patty de garbanzo, aguacate, tomate", price: 24000, components: ["Patty garbanzo", "Aguacate", "Tomate", "Lechuga"], imageUrl: "" },
          { categoryName: "Pizzas", name: "Margherita", description: "Salsa de tomate, mozzarella, albahaca fresca", price: 28000, components: ["Masa artesanal", "Salsa tomate", "Mozzarella", "Albahaca"], imageUrl: "" },
          { categoryName: "Pizzas", name: "Pepperoni", description: "Pepperoni artesanal, queso mozzarella", price: 32000, components: ["Masa", "Pepperoni", "Mozzarella", "Salsa tomate"], imageUrl: "" },
          { categoryName: "Pizzas", name: "Cuatro Quesos", description: "Mozzarella, gorgonzola, parmesano, provolone", price: 34000, components: ["Mozzarella", "Gorgonzola", "Parmesano", "Provolone"], imageUrl: "" },
          { categoryName: "Bebidas", name: "Limonada natural", description: "Limón fresco, hielo", price: 8000, components: ["Limón", "Agua", "Hielo"], imageUrl: "" },
          { categoryName: "Bebidas", name: "Jugo de mango", description: "Mango natural, sin azúcar añadida", price: 9000, components: ["Mango", "Agua"], imageUrl: "" },
          { categoryName: "Bebidas", name: "Cerveza artesanal", description: "IPA local, 473ml", price: 14000, components: [], imageUrl: "" },
          { categoryName: "Postres", name: "Tiramisú", description: "Tiramisú italiano tradicional", price: 16000, components: ["Cacao", "Café", "Queso mascarpone", "Bizcocho"], imageUrl: "" },
          { categoryName: "Postres", name: "Brownie", description: "Brownie de chocolate con helado", price: 14000, components: ["Chocolate", "Helado de vainilla"], imageUrl: "" },
          { categoryName: "Ensaladas", name: "Caesar", description: "Lechuga romana, pollo grillado, crutones", price: 18000, components: ["Lechuga romana", "Pollo", "Crutones", "Parmesano", "Aderezo Caesar"], imageUrl: "" },
          { categoryName: "Ensaladas", name: "Mediterránea", description: "Tomate, pepino, aceitunas, queso feta", price: 17000, components: ["Tomate", "Pepino", "Aceitunas", "Queso feta", "Aceite de oliva"], imageUrl: "" },
        ],
      };
      return Response.json(mock);
    }

    // === Gemini extraction (formato Zammpy) ===
    if (body.file) {
      const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return Response.json({ error: "GEMINI_API_KEY no configurada" }, { status: 500 });
      }

      const isPDF = body.mimeType === "application/pdf";
      const mimeType = isPDF ? "application/pdf" : (body.mimeType || "image/jpeg");

      console.log(`[GEMINI] Extracting menu from ${isPDF ? "PDF" : "image"}`);

      const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ inlineData: { mimeType, data: body.file } }, { text: buildExtractionPrompt(isPDF) }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error(`[GEMINI] Error: ${geminiRes.status} - ${errText}`);
        return Response.json({ error: `Error al procesar con IA (${geminiRes.status})` }, { status: 502 });
      }

      const geminiData = await geminiRes.json();
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return Response.json({ error: "No se pudo extraer el menú" }, { status: 422 });
      }

      const extracted: MenuData = JSON.parse(jsonMatch[0]);
      console.log(`[GEMINI] Extracted ${extracted.categories?.length || 0} categories, ${extracted.products?.length || 0} products`);
      return Response.json(extracted);
    }

    return Response.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err: unknown) {
    console.error("[API] Error:", err);
    const msg = err instanceof Error && err.name === "AbortError"
      ? "El servidor tardó demasiado en responder. Intenta de nuevo."
      : "Error interno del servidor";
    return Response.json({ error: msg }, { status: 500 });
  }
}
