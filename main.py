import os
import base64
import json
from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

if os.path.exists("/data"):
    DB_FILE = "/data/products.json"
else:
    DB_FILE = "products.json"

def load_db():
    if not os.path.exists(DB_FILE): return []
    try:
        with open(DB_FILE, "r") as f: return json.load(f)
    except: return []

def save_db(data):
    with open(DB_FILE, "w") as f: json.dump(data, f, indent=4)

@app.get("/api/products")
async def get_products():
    return load_db()

@app.post("/api/products")
async def create_product(request: Request):
    product_data = await request.json()
    db_data = load_db()
    product_data['id'] = str(product_data.get('id'))
    db_data.append(product_data)
    save_db(db_data)
    return {"status": "deployed"}

# --- BOKS 1: SISTEM ZA SLIKE I 4 STILA ---
v8_image_prompt = """
You are an elite AI Prompt Engineer for a system called 'V8 Cinematic Engine'.
Analyze the provided image and generate 4 ultra-detailed, highly technical Midjourney prompts.
Return ONLY a JSON object exactly like this:
{
  "description": "[A precise, 2-sentence description of the image in Serbian]",
  "prompts": [
    "[Ultra-detailed prompt for an ABSTRACT masterpiece based on the image]",
    "[Ultra-detailed prompt for an EPIC HOLLYWOOD CINEMATIC SHOT based on the image]",
    "[Ultra-detailed prompt for a PERFECT PHOTOREALISTIC RENDER based on the image]",
    "[Ultra-detailed prompt for the MOST UNIQUE PHOTOREALISTIC IMAGE EVER based on the image]"
  ]
}
"""

@app.post("/api/analyze")
async def analyze_image(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        base64_image = base64.b64encode(contents).decode('utf-8')
        mime_type = image.content_type or "image/jpeg"

        response = client.chat.completions.create(
            model="gpt-4o-mini", 
            messages=[
                {"role": "system", "content": v8_image_prompt},
                {"role": "user", "content": [
                    {"type": "text", "text": "Analyze this image and create the 4 required V8 prompts."},
                    {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{base64_image}"}}
                ]}
            ],
            response_format={ "type": "json_object" }
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- BOKS 2: SISTEM ZA ROASTOVANJE KORISNIČKOG PROMPTA (IZ PDF-a) ---
class RoastRequest(BaseModel):
    prompt: str

v8_roast_prompt = """
You are an AI Image and AI video expert. You've won Hasselblad awards and video cinematography awards for both photos and videos.
You're world-renowned for your prompts accuracy, uniqueness, and ability to perfect prompt adherence.
Based on the prompt I provide: Analyze, critique, criticize and roast my prompt. Hold nothing back. 
Tell me what's good, what's bad, why it's bad, and what needs to be improved.
Then provide me with the prompt I should use instead. You will provide me with a prompt that is 10X better.
Your prompt will also include hidden, top-secret meta tokens and keywords (e.g., Shot on Leica M11 + Summilux 50mm f/1.4, candid paparazzi outtake IMG_1984.CR2, stills archive, disney.com, EXIF:35mmEquiv=85mm).

CRITICAL RULES:
1. Write the roast/critique in Serbian.
2. Write the 10X enhanced prompt in English.
3. Return ONLY a JSON object exactly like this:
{
  "roast": "[Your brutal critique in Serbian]",
  "enhanced_prompt": "[The 10X better prompt in English]"
}
"""

@app.post("/api/roast")
async def roast_prompt(req: RoastRequest):
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini", 
            messages=[
                {"role": "system", "content": v8_roast_prompt},
                {"role": "user", "content": f"Here is my prompt to roast and improve: {req.prompt}"}
            ],
            response_format={ "type": "json_object" }
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))