from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bs4 import BeautifulSoup
import os
import requests
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IAEDU_API_KEY = os.getenv("IAEDU_API_KEY")

chat_history = []


class ChatRequest(BaseModel):
    message: str


# =========================
# UA SCRAPING
# =========================

SITEMAP_URL = "https://www.ua.pt/sitemap.xml"


def get_all_urls_from_sitemap():
    try:
        r = requests.get(SITEMAP_URL, timeout=10)
        soup = BeautifulSoup(r.text, "lxml-xml")
        return [loc.text for loc in soup.find_all("loc") if "ua.pt" in loc.text]
    except:
        return []


def scrape(url):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, headers=headers, timeout=8)

        soup = BeautifulSoup(r.text, "html.parser")

        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        return soup.get_text(separator=" ", strip=True)
    except:
        return ""


print("🔄 Loading UA knowledge...")

ua_text = ""
for url in get_all_urls_from_sitemap()[:80]:
    ua_text += scrape(url) + " "

print("✅ UA loaded")


def get_context(query):
    chunks = ua_text.split(". ")
    scored = []

    for c in chunks:
        score = sum(
            1 for w in query.lower().split()
            if len(w) > 2 and w in c.lower()
        )
        if score > 0:
            scored.append((score, c))

    scored.sort(reverse=True)
    return " ".join([c for _, c in scored[:6]])


# =========================
# CHAT
# =========================

@app.post("/chat")
def chat(req: ChatRequest):

    user_message = req.message
    print("\nUSER:", user_message)

    chat_history.append({"role": "user", "text": user_message})

    history_text = "\n".join(
        f"{m['role']}: {m['text']}" for m in chat_history[-6:]
    )

    prompt = f"""
És um assistente oficial da Universidade de Aveiro.

REGRAS:
- Só respondes sobre a Universidade de Aveiro
- Se não for sobre a UA, recusa educadamente

HISTÓRICO:
{history_text}

CONTEXT:
{get_context(user_message)}

PERGUNTA:
{user_message}
"""

    endpoint = "https://api.iaedu.pt/agent-chat//api/v1/agent/cmamvd3n40000c801qeacoad2/stream"

    form_data = {
        "channel_id": "cmqa0pde3aoy2nr01b2jnjlef",
        "thread_id": "local-thread-1",
        "user_info": "{}",
        "message": prompt
    }

    headers = {
        "x-api-key": IAEDU_API_KEY
    }

    try:
        response = requests.post(
            endpoint,
            data=form_data,
            headers=headers,
            stream=True,
            timeout=60
        )

        print("STATUS IA:", response.status_code)

        if response.status_code != 200:
            print("ERRO IA:", response.text)
            return {"response": "Erro ao contactar IA."}

        reply = ""

        for line in response.iter_lines():
            if not line:
                continue

            try:
                decoded = line.decode("utf-8").strip()

                if decoded.startswith("data:"):
                    decoded = decoded.replace("data:", "").strip()

                data = json.loads(decoded)

                if data.get("type") == "token":
                    reply += data.get("content", "")

                elif data.get("type") == "message":
                    content = data.get("content", {})
                    if isinstance(content, dict):
                        reply = content.get("content", reply)
                    else:
                        reply = content

            except Exception as e:
                print("PARSE ERROR:", e)
                continue

        print("FINAL REPLY:", reply)

        if not reply:
            reply = "Erro ao gerar resposta."

    except Exception as e:
        print("FATAL ERROR:", e)
        return {"response": "Erro interno do servidor."}

    chat_history.append({"role": "assistant", "text": reply})

    return {"response": reply}