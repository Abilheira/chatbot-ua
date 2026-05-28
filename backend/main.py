from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bs4 import BeautifulSoup
import os
import requests
from dotenv import load_dotenv

load_dotenv()

chat_history = []

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
    
# =========================
# UA SCRAPING
# =========================

SITEMAP_URL = "https://www.ua.pt/sitemap.xml"

def get_all_urls_from_sitemap():
    r = requests.get(SITEMAP_URL)
    soup = BeautifulSoup(r.text, "lxml-xml")

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

    for i, url in enumerate(urls[:200]):  # limita para não rebentar
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

    # guardar user
    chat_history.append({"role": "user", "text": user_message})

    # criar histórico
    history_text = ""
    for msg in chat_history[-6:]:
        history_text += f"{msg['role']}: {msg['text']}\n"


    prompt = f"""
És um assistente oficial da Universidade de Aveiro.

HISTÓRICO DA CONVERSA:
{history_text}

REGRAS IMPORTANTES:
- Só respondes a perguntas relacionadas com a Universidade de Aveiro
- Se a pergunta NÃO for sobre a UA, responde exatamente:
  "Desculpa, só posso responder a questões relacionadas com a Universidade de Aveiro."

Usa apenas a informação abaixo (site da UA):

INFORMAÇÃO UA:
{get_context(user_message)}

Pergunta atual:
{user_message}

Responde de forma clara e útil.
"""

    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=" + GEMINI_API_KEY

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


    # guardar bot
    chat_history.append({"role": "assistant", "text": reply})

    return {"response": reply}