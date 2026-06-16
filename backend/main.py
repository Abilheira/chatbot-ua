from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

# =====================================================================
# BASE DE CONHECIMENTO (Simulada para estabilidade, expande conforme precisares)
# =====================================================================
# Em vez de fazeres scrape a 80 páginas todas as vezes que o servidor inicia,
# o ideal é guardares o texto num ficheiro .txt ou JSON local e lê-lo aqui.
UA_KNOWLEDGE = [
    "A Universidade de Aveiro (UA) é uma fundação pública com regime de direito privado.",
    "Os serviços de ação social da UA (SASUA) gerem os alojamentos e cantinas universitárias.",
    "A UA oferece licenciaturas, mestrados e doutoramentos em áreas como Engenharia, Ciências e Artes.",
    "O campus principal da Universidade de Aveiro localiza-se em Santiago, Aveiro.",
    "As inscrições e matrículas na UA são feitas através do portal académico PACO."
]

def get_context_and_verify(query: str):
    query_lower = query.lower()
    
    # Palavras-chave obrigatórias para o "Brake" (Filtro)
    ua_keywords = ["ua", "aveiro", "universidade", "paco", "sasua", "campus", "curso", "propina", "matrícula", "alojamento", "licenciatura", "mestrado"]
    
    has_keyword = any(keyword in query_lower for keyword in ua_keywords)
    
    scored_chunks = []
    for chunk in UA_KNOWLEDGE:
        # Pontuação baseada em palavras exatas para evitar lixo
        score = sum(1 for word in query_lower.split() if len(word) > 3 and word in chunk.lower())
        if score > 0:
            scored_chunks.append((score, chunk))
            
    # Ordena por relevância
    scored_chunks.sort(reverse=True)
    
    # Pegamos apenas nos 3 melhores pedaços, mas garantimos que não duplicamos frases parecidas
    unique_chunks = []
    for _, chunk in scored_chunks:
        if chunk not in unique_chunks:
            unique_chunks.append(chunk)
        if len(unique_chunks) >= 3:
            break
            
    context = " ".join(unique_chunks)
    
    # Se o contexto for muito gigante, cortamos para não quebrar o limite de tokens da IAedu
    if len(context) > 1000:
        context = context[:1000] + "..."
    
    is_valid = has_keyword or len(context) > 0
    return context, is_valid

# =====================================================================
# ENDPOINT DE CHAT
# =====================================================================

@app.post("/chat")
def chat(req: ChatRequest):
    user_message = req.message
    print(f"\n[USER]: {user_message}")

    # 1. Aplicar o FILTRO/BRAKE em código antes de chamar a IA
    context, is_valid_topic = get_context_and_verify(user_message)
    
    if not is_valid_topic:
        reply = "Lamento, mas como assistente oficial da Universidade de Aveiro, apenas posso responder a questões relacionadas com a UA (cursos, campus, serviços, etc.)."
        chat_history.append({"role": "user", "text": user_message})
        chat_history.append({"role": "assistant", "text": reply})
        return {"response": reply}

    # 2. Construir o Histórico
    chat_history.append({"role": "user", "text": user_message})
    history_text = "\n".join(f"{m['role']}: {m['text']}" for m in chat_history[-4:])

    # 3. Prompt de Sistema Blindado (System Prompt)
    prompt = f"""[SYSTEM: És o assistente virtual exclusivo da Universidade de Aveiro (UA). 
Responde de forma prestável e curta.
REGRA ABSOLUTA: Se a pergunta não for sobre a UA, diz estritamente: 'Apenas posso responder a assuntos sobre a UA.']

[CONTEXTO INSTITUCIONAL]:
{context}

[HISTÓRICO RECENTE]:
{history_text}

[PERGUNTA DO ALUNO]:
{user_message}"""

    # Endpoint Streaming da IAedu
    endpoint = "https://api.iaedu.pt/agent-chat/api/v1/agent/cmamvd3n40000c801qeacoad2/stream"

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
        # Nota: Corrigido o typo do '//' no teu URL original para '/'
        response = requests.post(
            endpoint,
            data=form_data,
            headers=headers,
            stream=True,
            timeout=15
        )

        if response.status_code != 200:
            print(f"Erro IAedu Status: {response.status_code}")
            return {"response": "De momento não consegui contactar o sistema central da UA."}

        reply = ""
        for line in response.iter_lines():
            if not line:
                continue
            try:
                decoded = line.decode("utf-8").strip()
                if decoded.startswith("data:"):
                    decoded = decoded.replace("data:", "").strip()

                data = json.loads(decoded)
                
                # Captura os tokens gerados por streaming
                if data.get("type") == "token":
                    reply += data.get("content", "")
                elif data.get("type") == "message":
                    content = data.get("content", {})
                    reply = content.get("content", reply) if isinstance(content, dict) else content
            except:
                continue

        # Fallback caso a API responda em branco
        if not reply.strip():
            reply = "Não consegui processar uma resposta útil. Podes reformular?"

    except Exception as e:
        print(f"Erro Fatal: {e}")
        return {"response": "Ocorreu um erro interno no servidor."}

    chat_history.append({"role": "assistant", "text": reply})
    print(f"[ASSISTANT]: {reply}")
    return {"response": reply}