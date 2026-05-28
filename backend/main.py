from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bs4 import BeautifulSoup
import os
import requests
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

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


class ChatRequest(BaseModel):
    message: str


def is_university_question(text: str):
    text_lower = text.lower()

    # ✅ keywords UA
    ua_keywords = [
        "ua",
        "aveiro",
        "universidade de aveiro",
        "universidade",
        "curso",
        "cursos",
        "matricula",
        "inscricao",
        "exame",
        "cadeira",
        "campus",
        "propina",
        "mestrado",
        "licenciatura",
        "erasmus",
        "estudante",
        "academico"
    ]

    # ❌ temas bloqueados
    blocked_keywords = [
        "futebol",
        "mundial",
        "nba",
        "filme",
        "musica",
        "presidente",
        "guerra",
        "noticias",
        "tempo",
        "clima",
        "benfica",
        "porto",
        "sporting"
    ]

    # 🚫 bloqueia logo
    if any(word in text_lower for word in blocked_keywords):
        return False

    # ✅ deixa passar logo
    if any(word in text_lower for word in ua_keywords):
        return True
    
    # 🤖 fallback Gemini
    prompt = f"""
Classifica esta pergunta.

Responde APENAS com YES ou NO.

YES = perguntas sobre a Universidade de Aveiro.
NO = qualquer outro tema.

Pergunta:
{text}
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    response = requests.post(url, json=payload)

    if response.status_code != 200:
        return False

    try:
        data = response.json()

        result = data["candidates"][0]["content"]["parts"][0]["text"]
        result = result.strip().upper()

        result = result.replace(".", "").replace(",", "")

        return result == "YES"

    except:
        return False
    
    # =========================
# UA SCRAPING
# =========================

SITEMAP_URL = "https://www.ua.pt/sitemap.xml"

def get_all_urls_from_sitemap():
    r = requests.get(SITEMAP_URL)
    soup = BeautifulSoup(r.text, "xml")

    urls = []

    for loc in soup.find_all("loc"):
        url = loc.text
        if "ua.pt" in url:
            urls.append(url)

    return urls


def scrape(url):
    headers = {"User-Agent": "Mozilla/5.0"}
    r = requests.get(url, headers=headers, timeout=10)

    soup = BeautifulSoup(r.text, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    text = soup.get_text(separator=" ", strip=True)
    return text


def build_ua_knowledge():
    urls = get_all_urls_from_sitemap()

    all_text = ""

    for i, url in enumerate(urls[:100]):  # limita para não rebentar
        print(f"Scraping {i+1}/{len(urls)}:", url)

        try:
            all_text += scrape(url) + " "
        except:
            continue

    return all_text



print("🔄 Loading UA knowledge...")
ua_text = build_ua_knowledge()
print("✅ UA knowledge loaded")

def get_context(query):
    chunks = ua_text.split(". ")
    scored = []

    for c in chunks:
        score = sum(1 for w in query.lower().split() if len(w) > 2 and w in c.lower())

        if score > 0:
            scored.append((score, c))

    scored.sort(reverse=True)

    return " ".join([c for _, c in scored[:8]])




@app.get("/")
def health():
    return {"status": "ok"}


@app.post("/chat")
def chat(req: ChatRequest):
    user_message = req.message

    if not is_university_question(user_message):
        return {
            "response": "Desculpa, só posso responder a questões relacionadas com a Universidade de Aveiro."
        }

    prompt = f"""
És um assistente da Universidade de Aveiro.

Usa APENAS a informação abaixo (site da UA):

{get_context(user_message)}


Pergunta:
{user_message}

Responde de forma clara e útil.
"""

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + GEMINI_API_KEY

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    response = requests.post(url, json=payload)

    print("STATUS:", response.status_code)
    print("TEXT:", response.text)

    try:
        data = response.json()
        reply = data["candidates"][0]["content"]["parts"][0]["text"]
    except:
        reply = "Erro ao gerar resposta."

    return {"response": reply}