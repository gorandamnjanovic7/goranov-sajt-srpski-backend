require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

let mojiProizvodi = [];

// =================================================================
// 🧠 V8 MOZAK: OPENAI KOMPATIBILNI KANAL (SIGURNO RADI)
// =================================================================
const askGeminiText = async (promptTekst) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GOOGLE_API_KEY}`
    },
    body: JSON.stringify({
      model: "gemini-1.5-flash", 
      messages: [{ role: "user", content: promptTekst }]
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Gemini Text Greška");
  return data.choices[0].message.content.trim();
};

const getVisualSpecs = async (fullPrompt) => {
  try {
    const analysisPrompt = `Act as an elite forensic sketch artist and facial profiler. 
    Read this user prompt: "${fullPrompt}". Identify the specific movie/series and the exact main character/actor requested.
    
    CRITICAL RULE: NEVER mention the actor's real name, the character's name, or the movie title in your output. 
    
    Your ONLY job is to provide a hyper-detailed, anatomical physical description of that specific actor's face and iconic look. 
    Focus strictly on: 
    - Facial bone structure (jawline sharpness, cheekbones, chin shape).
    - Eye shape, color, and eyebrow arch.
    - Nose bridge and lip shape.
    - Skin texture (pores, wrinkles, scars, stubble, exact age appearance).
    - Exact hairstyle, color, and hairline.
    - 1-2 iconic clothing details or accessories.
    
    Format the output as a comma-separated list of highly descriptive physical keywords. Maximum 60 words. No intro, no outro.`;

    return await askGeminiText(analysisPrompt);
  } catch (e) {
    console.error("⚠️ V8 Forenzički Mozak greška:", e.message);
    return ""; 
  }
};

// =================================================================
// 🧠 V8 MOZAK: FORENZIČKI PROFILER ZA ULTRA-REALIZAM (BEZ KARIKATURE)
// =================================================================
const getPixarVisualSpecs = async (fullPrompt) => {
  try {
    const analysisPrompt = `Act as an elite CGI character designer for a photorealistic Hollywood movie, and also as a forensic sketch artist.
    Read this user prompt: "${fullPrompt}". Identify the specific movie/series and the exact main actors requested.
    
    CRITICAL RULE: NEVER mention the actor's real name, the character's name, or the movie title in your output. 
    
    Your ONLY job is to describe how this EXACT actor would look in an extremely detailed, hyper-realistic CGI format that preserves their unique facial identity 100%. DO NOT describe them as a stylized or "cartoonish" character!
    Focus strictly on:
    - DETAILED FACIAL GEOMETRY: Describe the specific bone structure, jawline, nose shape, and mouth shape of the actor with forensic precision.
    - SKIN TEXTURE & DETAIL: Describe intricate skin details, pores, subtle wrinkles, sun-weathered texture, stubble, combat scars, dirt, and facial imperfections. (Example for Russell Crowe: "deep-set hazel eyes with intense focus, distinct nose bridge, sun-weathered skin with stubble and minor scars").
    - SIGNATURE EXPRESSION: Capture the exact intense gaze, scowl, or look the actor is famous for in that movie.
    - DETAILED CLOTHING: Describe their exact iconic outfit with detailed, textured materials.
    
    Format as a comma-separated list of highly descriptive keywords. Maximum 80 words. No intro, no outro.`;

    return await askGeminiText(analysisPrompt);
  } catch (e) {
    console.error("⚠️ V8 Pixar Mozak greška:", e.message);
    return ""; 
  }
};
// =================================================================
// 🎨 V8 RUKA: TVOJ ORIGINALNI KOD KOJI 100% RADI!
// =================================================================
const pozoviImagenAPI = async (promptTekst) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  // KORISTIMO TVOJU SIGURNU PUTANJU!
  const url = `https://generativelanguage.googleapis.com/v1beta/openai/images/generations`;

  const body = {
    model: "gemini-2.5-flash-image", // Tvoj originalni model koji hvata API!
    prompt: promptTekst,
    n: 1, 
    response_format: "b64_json" 
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (!response.ok || !data.data) {
      console.error("❌ Imagen Response Greška:", data);
      throw new Error(data.error?.message || "Google API Blokada ili greška.");
  }

  return data.data[0].b64_json;
};

// =================================================================
// 👁️ V8 VISION: OPENAI GPT-4o (NETAKNUTO)
// =================================================================
const analizirajSlikuV8 = async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "Nema slike za analizu!" });
    if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "API ključ nije konfigurisan na serveru." });

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o", 
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: imageUrl } }] }],
        max_tokens: 800
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    res.json({ result: data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// =================================================================
// 🚦 RUTE
// =================================================================

app.get('/api/products', (req, res) => res.json(mojiProizvodi));

app.delete('/api/products/:id', (req, res) => {
  const idZaBrisanje = req.params.id;
  const pocetnaDuzina = mojiProizvodi.length;
  mojiProizvodi = mojiProizvodi.filter(p => String(p.id) !== String(idZaBrisanje));
  if (mojiProizvodi.length < pocetnaDuzina) res.json({ message: 'Obrisano.' });
  else res.status(404).json({ error: 'Nije nađeno.' });
});

app.post('/api/generisi-sliku', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log(`\n🏎️💨 V8 ANALIZA LICA U TOKU...`);
    
    const actorDetails = await getVisualSpecs(prompt);
    console.log(`🔍 REZULTAT ANALIZE: ${actorDetails}`);
    
    // Tvoj bazni prompt ostaje netaknut, samo dodajemo detalje na kraj
    const finalV8Prompt = actorDetails ? `${prompt} \n\n ADDITIONAL IDENTITY REFERENCE: ${actorDetails}` : prompt;
    
    console.log(`🛡️ V8 ŠALJE NA CRTANJE...`);
    const slikaBase64 = await pozoviImagenAPI(finalV8Prompt);
    
    res.json({ imageUrl: `data:image/jpeg;base64,${slikaBase64}` });
  } catch (error) {
    console.error("❌ V8 GREŠKA:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generisi-pixar', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log(`\n🏎️💨 V8 PIXAR ANALIZA U TOKU...`);
    
    const pixarDetails = await getPixarVisualSpecs(prompt);
    console.log(`🔍 REZULTAT ANALIZE: ${pixarDetails}`);
    
    // Tvoj bazni Pixar prompt ostaje netaknut
    const finalPixarPrompt = pixarDetails ? `${prompt} \n\n ADDITIONAL 3D REFERENCE: ${pixarDetails}` : prompt;
    
    console.log(`🛡️ V8 ŠALJE PIXAR NA CRTANJE...`);
    const slikaBase64 = await pozoviImagenAPI(finalPixarPrompt);
    
    res.json({ imageUrl: `data:image/jpeg;base64,${slikaBase64}` });
  } catch (error) {
    console.error("❌ V8 PIXAR GREŠKA:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/read-image', analizirajSlikuV8);

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🏁 V8 Lokalni Server grmi na portu ${PORT}`);
  console.log(`🛡️ VRAĆENO NA ORIGINALNE SIGURNE PUTANJE!`);
  console.log(`=========================================`);
});