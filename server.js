require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// POČETAK FUNKCIJE: proizvodiPodaci
const mojiProizvodi = [
  {
    id: 1,
    naziv: "V8 Kreator Slika - Premium",
    cena: "300 RSD",
    opis: "Generisanje unikatnih AI slika u 4K rezoluciji uz pomoć V8 neuronske mreže.",
    ikonica: "ImageIcon",
    link: "/v8-kreator-slika"
  },
  {
    id: 2,
    naziv: "V8 Pixar Selfie",
    cena: "350 RSD",
    opis: "Pretvorite se u omiljenog filmskog junaka uz vrhunsku AI simulaciju.",
    ikonica: "Camera",
    link: "/v8-pixar-selfie"
  }
];
// KRAJ FUNKCIJE: proizvodiPodaci

// POČETAK FUNKCIJE: pozoviImagenAPI
const pozoviImagenAPI = async (promptTekst) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/openai/images/generations`;

  const body = {
    model: "gemini-2.5-flash-image", 
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
      throw new Error("Google API Safety Blokada ili greška.");
  }

  return `data:image/jpeg;base64,${data.data[0].b64_json}`;
};
// KRAJ FUNKCIJE: pozoviImagenAPI

// POČETAK FUNKCIJE: analizirajSlikuV8
const analizirajSlikuV8 = async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body;
    console.log("🔥 V8 Sistem: Primljena slika za analizu:", imageUrl);

    if (!imageUrl) {
      return res.status(400).json({ error: "Nema slike za analizu!" });
    }

    if (!process.env.OPENAI_API_KEY) {
        console.error("❌ Greška: OPENAI_API_KEY nije pronađen u .env fajlu!");
        return res.status(500).json({ error: "API ključ nije konfigurisan na serveru." });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o", 
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 800
      })
    });

    const data = await response.json();

    if (data.error) {
        console.error("❌ OpenAI Greška:", data.error);
        return res.status(500).json({ error: data.error.message });
    }

    const gptAnaliza = data.choices[0].message.content;
    console.log("✅ V8 Analiza uspešna! Šaljem nazad na sajt...");
    
    res.json({ result: gptAnaliza });

  } catch (error) {
    console.error("❌ [V8 MOTOR GREŠKA] Analiza slike pukla:", error);
    res.status(500).json({ error: error.message });
  }
};
// KRAJ FUNKCIJE: analizirajSlikuV8


// --- RUTE ---

// POČETAK FUNKCIJE: dohvatiProizvodeRuta
app.get('/api/products', (req, res) => {
  res.json(mojiProizvodi);
});
// KRAJ FUNKCIJE: dohvatiProizvodeRuta

// POČETAK FUNKCIJE: generisiSlikuRuta
app.post('/api/generisi-sliku', async (req, res) => {
  try {
    const { prompt } = req.body;
    const slikaUrl = await pozoviImagenAPI(prompt);
    res.json({ imageUrl: slikaUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// KRAJ FUNKCIJE: generisiSlikuRuta

// POČETAK FUNKCIJE: generisiPixarRuta
app.post('/api/generisi-pixar', async (req, res) => {
  try {
    const { prompt } = req.body;
    const slikaUrl = await pozoviImagenAPI(prompt);
    res.json({ imageUrl: slikaUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// KRAJ FUNKCIJE: generisiPixarRuta

// POČETAK FUNKCIJE: analizirajSlikuRuta
app.post('/api/read-image', analizirajSlikuV8);
// KRAJ FUNKCIJE: analizirajSlikuRuta

// POČETAK FUNKCIJE: pokreniServer
app.listen(PORT, () => {
  console.log(`🏁 V8 Lokalni Server je upaljen na portu ${PORT}`);
});
// KRAJ FUNKCIJE: pokreniServer