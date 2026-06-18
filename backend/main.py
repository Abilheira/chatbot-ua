from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv
import json
import re
import uuid

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

class ChatRequest(BaseModel):
    message: str

# Contexto de Emergência Base
UA_KNOWLEDGE = [
    "A Universidade de Aveiro (UA) localiza-se em Aveiro, no Campus Universitário de Santiago.",
    "Os cursos da UA incluem Engenharia Informática, Engenharia Eletrónica, Design, Gestão, Línguas, Biologia e Química.",
    "Os serviços de ação social da UA (SASUA) tratam do alojamento, bolsas e cantinas.",
    "O portal académico da Universidade de Aveiro chama-se PACO."
]

if os.path.exists("ua_conhecimento.txt"):
    try:
        with open("ua_conhecimento.txt", "r", encoding="utf-8") as f:
            linhas = [l.strip() for l in f.readlines() if len(l.strip()) > 10]
            if linhas:
                UA_KNOWLEDGE.extend(linhas)
        print(f"✅ Ficheiro lido com sucesso. Total de frases: {len(UA_KNOWLEDGE)}")
    except Exception as e:
        print(f"Erro ao ler ficheiro: {e}")

@app.post("/chat")
def chat(req: ChatRequest):
    user_message = req.message
    
    words = set(re.findall(r'\b\w+\b', user_message.lower()))

    palavras_chave = {
        "ua", "aveiro", "universidade", "paco", "sasua", "campus",
        "curso", "cursos", "matrícula", "matriculas", "matricular", "licenciatura", "mestrado", "estudante",
        "aula", "aulas", "horário", "horarios", "calendário", "calendario", "começam", "comecam",
        "pagamento", "pagamentos", "prazos", "prazo", "propina", "propinas", "pagar", "valores", "fatura"
    }
    
    if not words.intersection(palavras_chave):
        return {"response": "Lamento, mas sou um assistente exclusivo da Universidade de Aveiro. Não posso responder a assuntos externos."}

    contexto_linhas = []
    for linha in UA_KNOWLEDGE:
        linha_low = linha.lower()
        if any(w in linha_low for w in words if len(w) > 3):
            contexto_linhas.append(linha)
            if len(contexto_linhas) >= 1:
                break
    
    contexto = contexto_linhas[0] if contexto_linhas else "Infos gerais da UA."
    prompt = f"Contexto: {contexto}. Pergunta UA: {user_message}"
    
    # 🔥 GERA UM ID ÚNICO PARA CADA MENSAGEM (Ignora o histórico entupido da API)
    id_conversa_limpa = f"thread-{uuid.uuid4().hex[:12]}"
    
    endpoint = "https://api.iaedu.pt/agent-chat/api/v1/agent/cmamvd3n40000c801qeacoad2/stream"
    form_data = {
        "channel_id": "cmqa0pde3aoy2nr01b2jnjlef",
        "thread_id": id_conversa_limpa,  # <-- Usa o ID dinâmico aqui
        "user_info": "{}",
        "message": prompt
    }
    headers = {"x-api-key": IAEDU_API_KEY}

    try:
        response = requests.post(endpoint, data=form_data, headers=headers, timeout=25)
        
        if response.status_code != 200:
            return {"response": f"Erro na API da IAedu (Código {response.status_code})."}

        raw_text = response.text
        
        print("--- RESPOSTA BRUTA DA API IAEDU ---")
        print(raw_text)
        print("----------------------------------")

        reply = ""
        
        for line in raw_text.split("\n"):
            line = line.strip()
            if not line:
                continue
                
            if line.startswith("data:"):
                line = line.replace("data:", "").strip()
                
            try:
                data_json = json.loads(line)
                if data_json.get("type") == "token":
                    reply += data_json.get("content", "")
                elif data_json.get("type") == "message":
                    content = data_json.get("content", {})
                    reply = content.get("content", reply) if isinstance(content, dict) else content
            except json.JSONDecodeError:
                if not line.startswith("{") and not line.startswith("["):
                    reply += line + "\n"

        if not reply.strip() and len(raw_text) > 5:
            encontrados = re.findall(r'"content":\s*"([^"]+)"', raw_text)
            if encontrados:
                reply = "".join(encontrados).replace("\\n", "\n")
            else:
                reply = raw_text

        if not reply.strip():
            return {"response": "A API processou o pedido mas devolveu uma resposta vazia. Tenta reformular a tua questão."}

        return {"response": reply.strip()}

    except Exception as e:
        return {"response": f"Erro ao comunicar com o servidor: {str(e)}"}