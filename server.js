// Backend Source Code Link: backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); 
app.use(express.json());

// POČETAK FUNKCIJE: pozoviImagenAPI
const pozoviImagenAPI = async (promptTekst) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Nedostaje GOOGLE_API_KEY u .env fajlu. Proveri konfiguraciju V8 servera.");
  }

  // V8 Taktika: Koristimo zvanični Google-ov OpenAI kompatibilni endpoint 
  // Ovo često zaobilazi 404 Not Found greške na klasičnom 'predict' endpointu
  const url = `https://generativelanguage.googleapis.com/v1beta/openai/images/generations`;

  const body = {
    // KLJUČNA PROMENA: Koristimo novi, otključani model za tvoj API ključ
    model: "gemini-2.5-flash-image", 
    prompt: promptTekst,
    n: 1, 
    response_format: "b64_json" 
  };
  const response = await fetch(url, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}` // Ključ se ovde šalje kao Bearer token
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Google API Greška: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  
  // V8 ZAŠTITA: Očitavamo podatke iz novog OpenAI-style JSON formata
  if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      console.error("🚨 Neočekivan odgovor od Google API-ja (verovatno safety blokada):", JSON.stringify(data, null, 2));
      throw new Error("Google API nije uspeo da generiše sliku. Pogledaj V8 terminal za detalje.");
  }

  // Ako je sve u redu, pakujemo sliku za React frontend
  const base64Image = data.data[0].b64_json;
  return `data:image/jpeg;base64,${base64Image}`;
};
// KRAJ FUNKCIJE: pozoviImagenAPI


// POČETAK FUNKCIJE: generisiPixarHandler
const generisiPixarHandler = async (req, res) => {
  try {
    const primljeniPrompt = req.body.prompt;
    
    console.log("🔥 V8 Sistem: Zahtev za renderovanje primljen.");
    console.log("Inicijalizujem Imagen 3 (OpenAI kompatibilni mod)...");

    // Pozivamo funkciju koja komunicira sa Google-om
    const generisanaSlikaUrl = await pozoviImagenAPI(primljeniPrompt);

    console.log("✅ Imagen 3.0 je uspešno završio renderovanje!");
    
    // Šaljemo pravu sliku nazad ka React-u
    res.json({ imageUrl: generisanaSlikaUrl });

  } catch (error) {
    console.error("V8 Sistemska Greška:", error.message);
    res.status(500).json({ error: "Greška na serveru prilikom generisanja slike." });
  }
};
// KRAJ FUNKCIJE: generisiPixarHandler

// Definicija rute
app.post('/api/generisi-pixar', generisiPixarHandler);

// POČETAK FUNKCIJE: pokreniServer
const pokreniServer = () => {
  console.log(`🚀 V8 Cloud Backend je ONLINE na portu ${PORT}`);
  console.log("🔧 Google Imagen 3.0 (OpenAI ruta) sistem je uspešno povezan.");
  console.log("🏎️ Spreman za spaljivanje asfalta i serviranje premium sadržaja!");
};
// KRAJ FUNKCIJE: pokreniServer

// Startovanje aplikacije
app.listen(PORT, pokreniServer);