// Backend Source Code Link: backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// V8 KONFIGURACIJA: Dozvoljavamo velike Base64 slike (do 50MB) i otvaramo vrata klijentima
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- V8 PRODAVNICA PODACI (Rešava 404 /api/products) ---
// Ovde definišeš šta se sve prodaje na tvojoj V8 platformi
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
    opis: "Pretvorite se u omiljenog filmskog ili serijskog junaka uz vrhunsku AI simulaciju.",
    ikonica: "Camera",
    link: "/v8-pixar-selfie"
  }
];

// POČETAK FUNKCIJE: pozoviImagenAPI
// Glavni V8 motor koji priča sa Google Imagen 3.0 preko OpenAI rute
const pozoviImagenAPI = async (promptTekst) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Nedostaje GOOGLE_API_KEY u .env fajlu. Proveri konfiguraciju V8 servera.");
  }

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

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Google API Greška: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  
  if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      console.error("🚨 V8 Safety Blokada (Google odbio prompt):", JSON.stringify(data, null, 2));
      throw new Error("Google API nije odobrio ovaj prompt. Pokušajte sa drugim opisom.");
  }

  const base64Image = data.data[0].b64_json;
  return `data:image/jpeg;base64,${base64Image}`;
};
// KRAJ FUNKCIJE: pozoviImagenAPI


// --- RUTE ZA FRONTEND ---

// RUTA: Lista Proizvoda (Popravlja 404 grešku na sajtu)
app.get('/api/products', (req, res) => {
  console.log("📦 V8 Katalog: Šaljem listu proizvoda klijentu.");
  res.json(mojiProizvodi);
});

// RUTA: Pixar Selfie Generator
app.post('/api/generisi-pixar', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("🎬 V8 Pixar: Zahtev za filmski render primljen.");
    const slikaUrl = await pozoviImagenAPI(prompt);
    console.log("✅ V8 Pixar: Renderovanje uspešno!");
    res.json({ imageUrl: slikaUrl });
  } catch (error) {
    console.error("V8 Pixar Greška:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// RUTA: Glavni Kreator Slika
app.post('/api/generisi-sliku', async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log("🎨 V8 Kreator: Zahtev za generisanje slike primljen.");
    const slikaUrl = await pozoviImagenAPI(prompt);
    console.log("✅ V8 Kreator: Slika isporučena!");
    res.json({ imageUrl: slikaUrl });
  } catch (error) {
    console.error("V8 Kreator Greška:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// RUTA: Download Zaštita (Da ne baca 404 iako skidamo direktno u Reactu)
app.get('/api/download-sliku', (req, res) => {
  res.status(200).send("V8 Download tunel je otvoren.");
});

// --- POKRETANJE V8 MAŠINE ---
const pokreniServer = () => {
  console.log(`
  🏁🏁🏁 V8 BACKEND JE UPALJEN 🏁🏁🏁
  🚀 Port: ${PORT}
  🛠️ Google Imagen 3: Povezan
  📦 Products Ruta: Aktivna
  🛡️ Admin Mod: Spreman
  ---------------------------------------
  🏎️ Puni gas na: https://ai-alati.rs
  `);
};

app.listen(PORT, pokreniServer);