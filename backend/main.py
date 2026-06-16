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

IAEDU_API_KEY = os.getenv("IAEDU_API_KEY")

chat_history = []


class ChatRequest(BaseModel):
    message: str


# =========================
# UA SCRAPING (igual ao teu)
# =========================

SITEMAP_URL = "https://www.ua.pt/sitemap.xml"

def get_all_urls_from_sitemap():
    r = requests.get(SITEMAP_URL)
    soup = BeautifulSoup(r.text, "lxml-xml")

    return [loc.text for loc in soup.find_all("loc") if "ua.pt" in loc.text]


def scrape(url):
    headers = {"User-Agent": "Mozilla/5.0"}
    r = requests.get(url, headers=headers, timeout=10)

    soup = BeautifulSoup(r.text, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    return soup.get_text(separator=" ", strip=True)


ua_text = ""
print("🔄 Loading UA knowledge...")

for i, url in enumerate(get_all_urls_from_sitemap()[:100]):
    try:
        ua_text += scrape(url) + " "
    except:
        pass

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
    return " ".join([c for _, c in scored[:8]])


# =========================
# CHAT
# =========================

@app.post("/chat")
def chat(req: ChatRequest):
    user_message = req.message
    chat_history.append({"role": "user", "text": user_message})

    history_text = "\n".join(
        f"{m['role']}: {m['text']}" for m in chat_history[-6:]
    )

    prompt = f"""
És um assistente oficial da Universidade de Aveiro.

HISTÓRICO:
{history_text}

INFORMAÇÃO UA:
{get_context(user_message)}

PERGUNTA:
{user_message}

Responde de forma clara.
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

    response = requests.post(
        endpoint,
        data=form_data,
        headers=headers,
        stream=True
    )

    reply = ""

    for line in response.iter_lines():
        if not line:
            continue

        try:
            import json
            data = json.loads(line.decode("utf-8"))

            if data.get("type") == "token":
                reply += data.get("content", "")

            elif data.get("type") == "message":
                reply = data["content"]["content"]

        except:
            continue

    chat_history.append({"role": "assistant", "text": reply})

    return {"response": reply}