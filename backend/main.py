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

# Carrega o conhecimento guardado pelo scraper
UA_KNOWLEDGE = []
if os.path.exists("ua_conhecimento.txt"):
    with open("ua_conhecimento.txt", "r", encoding="utf-8") as f:
        UA_KNOWLEDGE = [linha.strip() for linha in f.readlines() if len(linha.strip()) > 10]
    print(f"✅ Base de dados carregada: {len(UA_KNOWLEDGE)} linhas.")
else:
    print("⚠️ Ficheiro ua_conhecimento.txt não encontrado!")
    UA_KNOWLEDGE = ["A Universidade de Aveiro (UA) localiza-se em Aveiro, Portugal."]

def verificar_e_filtrar(query: str):
    """
    O TRAVÃO (BRAKE): Garante que perguntas aleatórias (Benfica, receitas, etc.)
    nem sequer gastam a API da IAedu.
    """
    q_low = query.lower()
    
    # Palavras-chave obrigatórias sobre o universo universitário/Aveiro
    palavras_chave = ["ua", "aveiro", "universidade", "paco", "sasua", "curso", "propina", "matrícula", "alojamento", "licenciatura", "mestrado", "estudante", "campus"]
    
    # Se o utilizador usar alguma palavra-chave, consideramos válido
    it_is_ua = any(p in q_low for p in palavras_chave)
    
    # Procura contexto relevante no ficheiro
    contexto_encontrado = []
    for linha in UA_KNOWLEDGE:
        # Conta termos em comum
        termos_comuns = sum(1 for palavra in q_low.split() if len(palavra) > 3 and palavra in linha.lower())
        if termos_comuns > 0:
            contexto_encontrado.append(linha)
            if len(contexto_encontrado) >= 3: # Limita a 3 parágrafos para não estoirar
                break
                
    return " ".join(contexto_encontrado), (it_is_ua or len(contexto_encontrado) > 0)

@app.post("/chat")
def chat(req: ChatRequest):
    user_message = req.message
    print(f"\n[USER]: {user_message}")

    # 1. CORRER O TRAVÃO IMMEDIATAMENTE
    contexto, e_valido = verificar_e_filtrar(user_message)
    
    if not e_valido:
        reply = "Lamento, mas sou um assistente exclusivo da Universidade de Aveiro. Não posso responder a assuntos externos como desporto, culinária ou generalidades."
        return {"response": reply}

    # 2. SE FOR VÁLIDO, PREPARA O PROMPT PARA A IAEDU
    prompt = f"""És o assistente oficial da Universidade de Aveiro. Responde em português de forma clara.
Se não souberes a resposta com base no contexto, usa o teu conhecimento geral sobre a Universidade de Aveiro.

CONTEXTO INSTITUCIONAL:
{contexto}

PERGUNTA:
{user_message}"""

    endpoint = "https://api.iaedu.pt/agent-chat/api/v1/agent/cmamvd3n40000c801qeacoad2/stream"
    
    form_data = {
        "channel_id": "cmqa0pde3aoy2nr01b2jnjlef",
        "thread_id": "local-thread-1",
        "user_info": "{}",
        "message": prompt
    }

    headers = {"x-api-key": IAEDU_API_KEY}

    try:
        # Fazemos o pedido normal (desativando o streaming complexo para maior estabilidade no Render)
        response = requests.post(endpoint, data=form_data, headers=headers, timeout=20)
        
        if response.status_code != 200:
            print(f"Erro na API da IAedu. Código: {response.status_code}")
            return {"response": "De momento estou com dificuldades em ligar-me ao servidor central da UA."}

        # Vamos processar o texto completo retornado
        reply = ""
        # Caso a API da IAedu envie várias linhas de dados no response (formato Server-Sent Events)
        for line in response.text.split("\n"):
            if line.startswith("data:"):
                try:
                    data_json = json.loads(line.replace("data:", "").strip())
                    if data_json.get("type") == "token":
                        reply += data_json.get("content", "")
                    elif data_json.get("type") == "message":
                        content = data_json.get("content", {})
                        if isinstance(content, dict):
                            reply = content.get("content", reply)
                        else:
                            reply = content
                except:
                    continue

        if not reply.strip():
            # Plano B: Se o parser falhar mas houver texto puro
            reply = "Não consegui extrair a resposta estruturada da IAedu, mas a ligação foi estabelecida."

    except Exception as e:
        print(f"Erro fatal: {e}")
        return {"response": "Ocorreu um erro interno ao processar a resposta."}

    return {"response": reply}