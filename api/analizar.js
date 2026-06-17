// api/analizar.js  -  Subtexto con GROQ (Llama 3.1 8B Instant)
// Groq usa el formato de OpenAI. La llave va en Vercel como GROQ_API_KEY.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metodo no permitido" });

  const API_KEY = process.env.GROQ_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: "Falta configurar GROQ_API_KEY" });

  try {
    const { msg, rel, ctx, who } = req.body || {};
    if (!msg || typeof msg !== "string" || msg.trim().length < 3)
      return res.status(400).json({ error: "Mensaje vacio o demasiado corto" });
    if (msg.length > 4000) return res.status(400).json({ error: "Mensaje demasiado largo" });

    const mode = who === "enviar"
      ? "El usuario va a ENVIAR este mensaje y quiere saber como sonara al recibirlo y como mejorarlo."
      : "El usuario RECIBIO este mensaje y quiere entender que significa de verdad.";

    const prompt = `Eres "Subtexto", un analista experto en comunicacion, psicologia relacional y pragmatica del lenguaje. Hablas espanol, eres perspicaz, calido y honesto, nunca cursi. ${mode}

Relacion: ${rel || "no especificada"}
${ctx ? "Contexto: " + ctx : ""}
Mensaje: """${msg}"""

Analiza el subtexto con matices reales (evita lo obvio y los cliches). Responde SOLO con JSON valido, sin markdown ni texto extra, con esta forma exacta:
{
  "truth": "<en 1-2 frases, que significa de verdad / que emocion o intencion hay debajo. Directo y revelador>",
  "gauges": [
    {"label":"Interes","value":<0-100>,"color":"green"},
    {"label":"Sinceridad","value":<0-100>,"color":"blue"},
    {"label":"Distancia emocional","value":<0-100>,"color":"red"},
    {"label":"Urgencia de responder","value":<0-100>,"color":"yellow"}
  ],
  "reading": "<2-3 frases explicando la lectura: tono, lo que esa persona probablemente siente, y que senales lo indican>",
  "flags": [
    {"type":"green|red|neutral","text":"<senal concreta observada en el mensaje>"},
    {"type":"green|red|neutral","text":"<otra>"}
  ],
  "replies": [
    {"label":"Para acercarte","text":"<respuesta lista para enviar, natural>"},
    {"label":"Para poner un limite","text":"<respuesta>"},
    {"label":"Para alejarte con elegancia","text":"<respuesta>"}
  ]
}
Las respuestas deben sonar humanas y enviables tal cual. Se especifico al mensaje, no generico.`;

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + API_KEY
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.9,
        max_tokens: 2048,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Eres un asistente que responde unicamente con JSON valido." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("Error de Groq:", detail);
      return res.status(502).json({ error: "La IA no respondio. Intentalo de nuevo." });
    }

    const data = await r.json();
    let txt = (((data.choices || [])[0] || {}).message || {}).content || "";
    txt = txt.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(txt);
    return res.status(200).json(parsed);

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "No se pudo analizar el mensaje." });
  }
}
