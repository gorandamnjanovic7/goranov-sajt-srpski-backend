const express = require('express');

require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Služi za "GTT 5 mini" (GPT-4o-mini) pozive

const app = express();
const PORT = process.env.PORT || 5000;

// =========================================================
// V8 CLOUD STORAGE SYSTEM (RAILWAY VOLUME)
// =========================================================
// Ako smo na Railway-u, koristi trajnu memoriju, inače koristi lokalni folder
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'products.json');

// Inicijalizacija foldera i fajla ako ne postoje
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Dozvoljava veće fajlove

// Pomoćne funkcije za bazu
const readData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// =========================================================
// 1. RUTE ZA PROIZVODE (PREMIUM PRODAVNICA)
// =========================================================

// Daj sve proizvode
app.get('/api/products', (req, res) => {
    res.json(readData());
});

// Dodaj novi proizvod
app.post('/api/products', (req, res) => {
    const products = readData();
    const newProduct = req.body;
    products.push(newProduct);
    writeData(products);
    res.status(201).json(newProduct);
});

// Ažuriraj proizvod (Edit)
app.put('/api/products/:id', (req, res) => {
    const products = readData();
    const index = products.findIndex(p => String(p.id) === String(req.params.id));
    if (index !== -1) {
        products[index] = { ...products[index], ...req.body };
        writeData(products);
        res.json(products[index]);
    } else {
        res.status(404).json({ message: "V8 Sistem: Proizvod nije pronađen!" });
    }
});

// Obriši proizvod
app.delete('/api/products/:id', (req, res) => {
    let products = readData();
    products = products.filter(p => String(p.id) !== String(req.params.id));
    writeData(products);
    res.json({ message: "V8 Sistem: Proizvod uspešno uništen!" });
});

// =========================================================
// 2. V8 VISION ENGINE (GPT-4o-mini ČITAČ SLIKA)
// =========================================================
app.post('/api/read-image', async (req, res) => {
    const { imageUrl, prompt } = req.body;
    const apiKey = process.env.OPENAI_API_KEY; // Ovde sistem vuče tvoj tajni ključ

    if (!apiKey) {
        return res.status(500).json({ error: "FATAL: API ključ nije podešen u Railway varijablama!" });
    }
    if (!imageUrl) {
        return res.status(400).json({ error: "Nedostaje URL slike za analizu." });
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4o-mini", // Tvoj GTT 5 mini model
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt || "Kao vrhunski AI inženjer, detaljno analiziraj ovu sliku i izvuci sve vizuelne elemente, stilove i osvetljenje iz nje." },
                            { type: "image_url", image_url: { url: imageUrl } }
                        ]
                    }
                ],
                max_tokens: 1000
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({ result: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Greska pri V8 Vision analizi:", error.response?.data || error.message);
        res.status(500).json({ error: "V8 Sistem nije uspeo da pročita sliku." });
    }
});


// ==========================================
// V8 GENERATOR SLIKA - DALL-E 3 INTEGRACIJA
// ==========================================
app.post('/api/generisi-sliku', async (req, res) => {
  const { prompt, size } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt je obavezan da bi mašina radila.' });
  }

  try {
    console.log(`\n[V8 MOTOR] Pokrećem DALL-E 3... Učitavam ideju: "${prompt}"`);
    
    const response = await openai.images.generate({
      model: "dall-e-3", // Koristimo najmoćniji model
      prompt: prompt,
      n: 1, 
      size: size || "1024x1024", 
      quality: "standard", 
      response_format: "url", 
    });

    const imageUrl = response.data[0].url;
    console.log("[V8 MOTOR] Slika je uspešno iskovana i spremna za klijenta!");
    
    // Šaljemo sliku nazad tvom React frontendu
    res.json({ imageUrl });

  } catch (error) {
    console.error("[V8 MOTOR ERROR] Kvar na mašini:", error);
    res.status(500).json({ error: 'Došlo je do greške prilikom komuniciranja sa OpenAI serverom.' });
  }
});
// ==========================================
// V8 BLINDIRANI SISTEM ZA PREUZIMANJE SLIKA
// ==========================================
app.get('/api/download-sliku', async (req, res) => {
  const imageUrl = req.query.url; // React šalje URL slike ovde

  if (!imageUrl) {
    return res.status(400).send('Nema URL-a slike.');
  }

  try {
    console.log(`[V8 MOTOR] Preuzimam sliku sa OpenAI servera radi direktnog slanja...`);
    
    // 1. Backend skida sliku kao "stream" (tok podataka)
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'stream'
    });

    // 2. Postavljamo blindirane zaglavlja (Headers) da primoramo pretraživač da skine fajl
    const imeFajla = `V8-Remek-Delo-${Date.now()}.png`;
    res.setHeader('Content-Disposition', `attachment; filename="${imeFajla}"`);
    res.setHeader('Content-Type', 'image/png');

    // 3. Spajamo (pipe) dolazni tok podataka direktno u odlazni odgovor klijentu
    response.data.pipe(res);
    console.log(`[V8 MOTOR] Slika uspešno poslata direktno na klijentov računar!`);

  } catch (error) {
    console.error("[V8 MOTOR GREŠKA] Kvar na sistemu za preuzimanje:", error);
    res.status(500).send('Greška prilikom preuzimanja slike.');
  }
});
// ==========================================
// =========================================================
// POKRETANJE SERVERA
// =========================================================
app.listen(PORT, () => {
    console.log(`🚀 V8 Cloud Backend je ONLINE i sluša na portu ${PORT}`);
});