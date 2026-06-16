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

# 🚨 CLASSE CORRIGIDA (O que estava em falta e fez o Render crashar)
class ChatRequest(BaseModel):
    message: str

# =====================================================================
# CONTEXTO DE EMERGÊNCIA (Hardcoded para garantir que o Render lê sempre)
# =====================================================================
UA_KNOWLEDGE = [
    "A Universidade de Aveiro (UA) localiza-se em Aveiro, no Campus Universitário de Santiago.",
    "Os cursos da UA incluem Engenharia Informática, Engenharia Eletrónica, Design, Gestão, Línguas, Biologia e Química.",
    "Os serviços de ação social da UA (SASUA) tratam do alojamento, bolsas e cantinas.",
    "O portal académico da Universidade de Aveiro chama-se PACO."
]

# Tenta carregar o ficheiro extra se ele existir
if os.path.exists("ua_conhecimento.txt"):
    try:
        with open("ua_conhecimento.txt", "r", encoding="utf-8") as f:
            linhas = [l.strip() for l in f.readlines() if len(l.strip()) > 10]
            if linhas:
                UA_KNOWLEDGE.extend(linhas)
        print(f"✅ Ficheiro lido. Total de frases: {len(UA_KNOWLEDGE)}")
    except Exception as e:
        print(f"Erro ao ler ficheiro: {e}")

@app.post("/chat")
def chat(req: ChatRequest):
    user_message = req.message
    q_low = user_message.lower()

    # 1. TRAVÃO RÍGIDO (Filtro por Palavras-Chave no Código)
    palavras_chave = ["ua", "aveiro", "universidade", "paco", "sasua", "curso", "propina", "matrícula", "alojamento", "licenciatura", "mestrado", "estudante", "campus"]
    
    # Se NÃO tem palavras da UA, bloqueia direto e dá a nega instantânea
    if not any(p in q_low for p in palavras_chave):
        return {"response": "Lamento, mas sou um assistente exclusivo da Universidade de Aveiro. Não posso responder a assuntos externos (como o Benfica, culinária ou outros temas)."}

    # 2. CAPTURAR CONTEXTO
    contexto_linhas = []
    for linha in UA_KNOWLEDGE:
        if any(palavra in linha.lower() for palavra in q_low.split() if len(palavra) > 3):
            contexto_linhas.append(linha)
            if len(contexto_linhas) >= 3:
                break
    
    contexto = " ".join(contexto_linhas) if contexto_linhas else "Informações gerais sobre a UA."

    # 3. PREPARAR PEDIDO
    prompt = f"És o assistente da Universidade de Aveiro. Responde sobre isto: {user_message}. Contexto: {contexto}"
    
    endpoint = "https://api.iaedu.pt/agent-chat/api/v1/agent/cmamvd3n40000c801qeacoad2/stream"
    form_data = {
        "channel_id": "cmqa0pde3aoy2nr01b2jnjlef",
        "thread_id": "local-thread-unique-123",
        "user_info": "{}",
        "message": prompt
    }
    headers = {"x-api-key": IAEDU_API_KEY}

    try:
        response = requests.post(endpoint, data=form_data, headers=headers, timeout=25)
        
        if response.status_code != 200:
            return {"response": f"Erro na API da IAedu (Código {response.status_code}). Verifica a tua API Key no Render!"}

        raw_text = response.text
        reply = ""
        
        # Processa os dados retornados
        for line in raw_text.split("\n"):
            if "data:" in line:
                try:
                    clean_line = line.replace("data:", "").strip()
                    data_json = json.loads(clean_line)
                    if data_json.get("type") == "token":
                        reply += data_json.get("content", "")
                    elif data_json.get("type") == "message":
                        content = data_json.get("content", {})
                        reply = content.get("content", reply) if isinstance(content, dict) else content
                except:
                    continue

        if not reply.strip():
            return {"response": f"A API respondeu mas o formato mudou. Resposta crua da FCT: {raw_text[:200]}"}

        return {"response": reply}

    except Exception as e:
        return {"response": f"Erro fatal no servidor do Render: {str(e)}"}