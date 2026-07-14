import type { ExtractedMenu } from "@/types";

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

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
        headers: {
          "Content-Type": "application/json",
          "User-Agent": CHROME_UA,
        },
        body: loginBody,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      console.log(`[LOGIN] Status: ${res.status} ${res.statusText}`);

      const data = await safeJson(res);
      console.log(`[LOGIN] Response keys: ${typeof data === "object" && data !== null ? Object.keys(data).join(", ") : typeof data}`);

      if (!res.ok) {
        const msg =
          (data && typeof data === "object" && "message" in data)
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

    if (body.action === "google_token") {
      const idToken = String(body.idToken || "");
      console.log(`[GOOGLE] Intercambiando id_token por JWT`);

      if (!idToken) {
        return Response.json(
          { error: "No se recibió id_token de Google" },
          { status: 400 }
        );
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(`${ZAMMPY_API}/api/v1/auth/google/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": CHROME_UA,
          Accept: "application/json",
        },
        body: JSON.stringify({ idToken }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      console.log(`[GOOGLE] Status: ${res.status}`);

      if (!res.ok) {
        const data = await safeJson(res);
        console.log(`[GOOGLE] Error body:`, data);
        const msg =
          (data && typeof data === "object" && "message" in data)
            ? String((data as Record<string, unknown>).message)
            : `Error al autenticar con Google (${res.status})`;
        return Response.json({ error: msg }, { status: res.status });
      }

      const data = (await res.json()) as Record<string, unknown>;
      console.log(`[GOOGLE] Token received: ${!!data.token}`);

      return Response.json({
        token: data.token,
        userId: data.userId,
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        avatar: data.avatar,
      });
    }

    if (body.action === "fetch_menus") {
      console.log(`[MENUS] Fetching menus`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(`${ZAMMPY_API}/api/v1/menus`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": CHROME_UA,
          Authorization: `Bearer ${body.token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      console.log(`[MENUS] Status: ${res.status}`);

      if (!res.ok) {
        const data = await safeJson(res);
        console.log(`[MENUS] Error body:`, data);
        const msg =
          (data && typeof data === "object" && "message" in data)
            ? String((data as Record<string, unknown>).message)
            : `Error al obtener menús (${res.status})`;
        return Response.json({ error: msg }, { status: res.status });
      }

      const menus = await res.json();
      console.log(`[MENUS] Found ${Array.isArray(menus) ? menus.length : "?"} menus`);
      return Response.json(menus);
    }

    if (body.action === "update_menu") {
      console.log(`[UPDATE] Updating menu ${body.menId}`);

      const draftRes = await fetch(
        `${ZAMMPY_API}/api/v1/menus/${body.menId}/draft`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": CHROME_UA,
            Authorization: `Bearer ${body.token}`,
          },
          body: JSON.stringify(body.draft),
        }
      );

      console.log(`[UPDATE] Draft status: ${draftRes.status}`);

      if (!draftRes.ok) {
        const text = await draftRes.text();
        console.log(`[UPDATE] Error: ${text}`);
        return Response.json(
          { error: `Error al actualizar borrador (${draftRes.status}): ${text}` },
          { status: draftRes.status }
        );
      }

      const result = await draftRes.json().catch(() => ({}));
      console.log(`[UPDATE] Success`);
      return Response.json({ ok: true, ...result });
    }

    if (body.file) {
      const GEMINI_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return Response.json(
          { error: "GEMINI_API_KEY no configurada" },
          { status: 500 }
        );
      }

      const isPDF = body.mimeType === "application/pdf";

      const prompt = isPDF
        ? `Analiza este documento PDF de un menú de restaurante. Extrae TODOS los items visibles y devuelve ÚNICAMENTE un JSON válido (sin markdown, sin explicaciones) con esta estructura:

{
  "categories": [
    {
      "name": "Nombre de la categoría",
      "products": [
        {
          "name": "Nombre exacto del plato/bebida",
          "description": "Descripción si aparece, sino null",
          "price": 18000
        }
      ]
    }
  ],
  "grupos": [
    {
      "name": "Grupo de opciones",
      "items": ["Opción 1", "Opción 2"]
    }
  ]
}

REGLAS:
- Precios enteros en COP (sin puntos ni comas). Ej: 18000 no 18.000
- Si un precio no es visible, ponlo null
- Si no hay grupos, retorna []
- Detecta categorías por encabezados/separadores
- Si no hay categorías claras, usa "Menú"
- Respeta nombres originales
- Incluye TODOS los items visibles
- El PDF puede tener múltiples páginas, extrae de TODAS
- SOLO el JSON, nada más`
        : `Analiza esta imagen de un menú de restaurante. Extrae TODOS los items visibles y devuelve ÚNICAMENTE un JSON válido (sin markdown, sin explicaciones) con esta estructura:

{
  "categories": [
    {
      "name": "Nombre de la categoría",
      "products": [
        {
          "name": "Nombre exacto del plato/bebida",
          "description": "Descripción si aparece, sino null",
          "price": 18000
        }
      ]
    }
  ],
  "grupos": [
    {
      "name": "Grupo de opciones",
      "items": ["Opción 1", "Opción 2"]
    }
  ]
}

REGLAS:
- Precios enteros en COP (sin puntos ni comas). Ej: 18000 no 18.000
- Si un precio no es visible, ponlo null
- Si no hay grupos, retorna []
- Detecta categorías por encabezados/separadores
- Si no hay categorías claras, usa "Menú"
- Respeta nombres originales
- Incluye TODOS los items visibles
- SOLO el JSON, nada más`;

      const mimeType = isPDF ? "application/pdf" : (body.mimeType || "image/jpeg");

      const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: { mimeType, data: body.file },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error(`[GEMINI] Error: ${geminiRes.status} - ${errText}`);
        return Response.json(
          { error: `Error al procesar con IA (${geminiRes.status})` },
          { status: 502 }
        );
      }

      const geminiData = await geminiRes.json();
      const text =
        geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return Response.json(
          { error: "No se pudo extraer el menú" },
          { status: 422 }
        );
      }

      const extracted: ExtractedMenu = JSON.parse(jsonMatch[0]);
      return Response.json(extracted);
    }

    return Response.json({ error: "Acción no válida" }, { status: 400 });
  } catch (err: unknown) {
    console.error("[API] Error:", err);
    const msg =
      err instanceof Error && err.name === "AbortError"
        ? "El servidor tardó demasiado en responder. Intenta de nuevo."
        : "Error interno del servidor";
    return Response.json({ error: msg }, { status: 500 });
  }
}
