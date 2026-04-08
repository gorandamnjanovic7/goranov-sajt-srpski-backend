require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

let mojiProizvodi = [];

// =================================================================
// 🧠 POČETAK: V8 MOZAK - OPENAI KOMPATIBILNI KANAL (SIGURNO RADI)
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
// --- KRAJ: V8 MOZAK - OPENAI KOMPATIBILNI KANAL ---

// =================================================================
// 🧠 POČETAK: V8 MOZAK - FORENZIČKI PROFILER
// =================================================================
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
// --- KRAJ: V8 MOZAK - FORENZIČKI PROFILER ---

// =================================================================
// 🧠 POČETAK: V8 MOZAK - PIXAR PROFILER ZA ULTRA-REALIZAM
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
// --- KRAJ: V8 MOZAK - PIXAR PROFILER ---

// =================================================================
// 🎨 POČETAK: V8 RUKA - IMAGEN API KANAL
// =================================================================
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
      console.error("❌ Imagen Response Greška:", data);
      throw new Error(data.error?.message || "Google API Blokada ili greška.");
  }

  return data.data[0].b64_json;
};
// --- KRAJ: V8 RUKA - IMAGEN API KANAL ---

// =================================================================
// 👁️ POČETAK: V8 VISION - OPENAI GPT-4o ANALIZA SLIKE
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
// --- KRAJ: V8 VISION - OPENAI GPT-4o ANALIZA SLIKE ---

// =================================================================
// 🚦 POČETAK: RUTE ZA PROIZVODE I GENERISANJE SLIKA
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
// --- KRAJ: RUTE ZA PROIZVODE I GENERISANJE SLIKA ---

// ==========================================
// 🚀 POČETAK: V8 RUTA ZA ČUVANJE NOVOG PROIZVODA
// ==========================================
app.post('/api/products', (req, res) => {
  try {
    const noviProizvod = req.body;
    
    if (!noviProizvod.id) {
      noviProizvod.id = Date.now().toString(); 
    }

    mojiProizvodi.push(noviProizvod);
    console.log("🔥 V8 Motor: Uspešno sačuvan proizvod ->", noviProizvod.title || noviProizvod.id);

    res.status(201).json({ 
      success: true, 
      message: "Proizvod je V8 blindiran i sačuvan!", 
      product: noviProizvod 
    });

  } catch (error) {
    console.error("❌ V8 Greška pri čuvanju proizvoda:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
// --- KRAJ: V8 RUTA ZA ČUVANJE NOVOG PROIZVODA ---

// =================================================================
// 🧠 POČETAK: V8 MOZAK - OPENAI TEKSTUALNI GENERATOR ZA MIKRO ALATE (PRO MAX)
// =================================================================
app.post('/api/openai-alati', async (req, res) => {
  try {
    const { alatId, unos } = req.body;
    
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "API ključ nije konfigurisan na serveru." });
    }

    console.log(`\n🏎️💨 V8 POKREĆE ALAT: [${alatId}] ZA UNOS: "${unos}"`);

    // V8 Prompt Inženjering: Dajemo AI-u specifičan mozak zavisno od alata koji je kliknut
    let sistemskiPrompt = "Ti si surovi prodajni ekspert. Pišeš kratko, jasno, bez generičnih floskula, direktno u metu na srpskom jeziku.";
    
    switch(alatId) {
      case 'v8-hook':
        sistemskiPrompt = `Ti si najplaćeniji ekspert za TikTok i Reels udice na Balkanu. Cilj: otmi pažnju u prve 2 sekunde.
        ZABRANJENO je koristiti dosadne početke poput 'Da li imaš...', 'Otkrij tajne...', ili 'Evo kako...'.
        Koristi šok, kontroverzu, surovu istinu i direktno pogađaj najbolnije tačke klijenta. Izazovi instant radoznalost, FOMO ili blagi bes (da se osete prozvanim).
        FORMAT: Napiši tačno 5 brutalnih, kratkih udica na osnovu unosa. Svaka udica mora imati 1 emoji. Piši isključivo na srpskom.`;
        break;
        
      case 'v8-b2b':
        sistemskiPrompt = `Ti si elitni B2B prodajni snajperista. Tvoj cilj je zakazivanje sastanka sa direktorima i vlasnicima.
        ZABRANJENE su floskule: 'Nadam se da ste dobro', 'Mi smo lideri na tržištu', 'Želim da Vam predstavim...'.
        FORMAT: Napiši JEDAN hirurški precizan hladni email. Prva rečenica mora odmah da ukaže na to gde trenutno gube novac ili vreme. Email mora odisati luksuzom, autoritetom i završiti se sa pozivom na kratak sastanak od tačno 5 ili 7 minuta. Ne moli za pažnju, dominiraj. Srpski jezik.`;
        break;
        
      case 'v8-closer':
        sistemskiPrompt = `Ti si elitni "Closer" (zatvarač prodaje) za high-ticket usluge. Klijent kaže "skupo je" ili okleva.
        FORMAT: Napiši 3 različita psihološka odgovora koja slamaju taj prigovor:
        1. MATEMATIKA (Fokus na ROI - dokaži mu da je skuplje da NE kupi).
        2. CENA ČEKANJA (Fokus na to koliko novca/vremena gubi svakog meseca dok čeka idealan trenutak).
        3. EKSKLUZIVNOST / FOMO (Hladno mu reci da ovo nije za svakoga i da radite samo sa onima koji su spremni za ozbiljan nivo).
        Zvuči samouvereno, logično i neumoljivo. Srpski jezik.`;
        break;
        
      case 'kopirajter':
        sistemskiPrompt = `Ti si vrhunski V8 copywriter za premium brendove. Zaboravi na dosadne opise i nabrajanje karakteristika. Ljudi kupuju status, rešenje i emociju.
        FORMAT: Napiši 3 verzije prodajnog teksta za mreže:
        🔥 VERZIJA 1 (Agresivna dominacija i prekid obrazaca - napad na konkurenciju)
        💎 VERZIJA 2 (Emocija, luksuz i statusni simbol - zašto je ovo prestiž)
        ⚡ VERZIJA 3 (Brutalno kratka, hitna, ograničena ponuda).
        Koristi "skupe" reči. Srpski jezik.`;
        break;
        
      case 'diplomata':
        sistemskiPrompt = `Ti si "V8 Poslovni Diplomata" – mešavina vrhunskog pregovarača i korporativnog advokata.
        ZADATAK: Pretvori korisnikov besan, neformalan ili emotivan unos u savršeno odmeren, ledeno-hladan i visoko-profesionalan korporativni imejl.
        Cilj je postaviti čelične granice, zaštititi interese klijenta, ali zadržati maksimalno poštovanje tako da druga strana ne može da se ljuti, već mora da popusti. Srpski jezik.`;
        break;
        
      case 'pro-max':
        sistemskiPrompt = `Ti si V8 PRO MAX - najnapredniji AI za duboku psihološku prodaju.
        FORMAT: Napiši tri nivoa prodajnog teksta na zadatu temu, secirajući ljudsku psihu:
        1. NIVO STRAHA (Strah od propuštanja, FOMO, propadanje ako se odmah ne reaguje).
        2. NIVO LOGIKE (Surova matematika isplativosti, nepobitne činjenice, ušteda vremena).
        3. NIVO EGA (Statusni simbol, ekskluzivnost, moć, dominacija nad konkurencijom).
        Bez jeftinih floskula, samo surova prodajna psihologija. Srpski jezik.`;
        break;
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
          { role: "system", content: sistemskiPrompt },
          { role: "user", content: `Korisnikov unos: ${unos}` }
        ],
        temperature: 0.7, 
        max_tokens: 1500
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const generisaniTekst = data.choices[0].message.content;
    console.log(`✅ V8 ALAT ZAVRŠIO ZADATAK!`);

    res.json({ rezultat: generisaniTekst });

  } catch (error) {
    console.error("🔥 V8 OpenAI Greška:", error.message);
    res.status(500).json({ error: "Greška na serveru pri OpenAI generisanju." });
  }
});
// --- KRAJ: V8 MOZAK - OPENAI TEKSTUALNI GENERATOR ZA MIKRO ALATE ---

// =================================================================
// 🏁 POČETAK: POKRETANJE SERVERA
// =================================================================
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🏁 V8 Lokalni Server grmi na portu ${PORT}`);
  console.log(`🛡️ MAŠINA U PUNOM GASU SA V8 PRO MAX PROMPTOVIMA!`);
  console.log(`=========================================`);
});
// --- KRAJ: POKRETANJE SERVERA ---