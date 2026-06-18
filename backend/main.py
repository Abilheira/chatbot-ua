from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
from dotenv import load_dotenv
import json
import re

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
    
    # Limpa o texto e separa por palavras exatas usando Regex
    words = set(re.findall(r'\b\w+\b', user_message.lower()))

    # 1. TRAVÃO RÍGIDO (Filtro por Palavras EXATAS no Código)
    # Expandido para aceitar todas as tuas sugestões da Home e temas académicos
    palavras_chave = {
        # Identificadores da instituição
        "ua", "aveiro", "universidade", "paco", "sasua", "campus",
        
        # Inscrições e Cursos
        "curso", "cursos", "matrícula", "matriculas", "matricular", "licenciatura", "mestrado", "estudante",
        
        # Calendário e Horários
        "aula", "aulas", "horário", "horarios", "calendário", "calendario", "começam", "comecam",
        
        # Propinas e Pagamentos (O que faltava para a tua sugestão!)
        "pagamento", "pagamentos", "prazos", "prazo", "propina", "propinas", "pagar", "valores", "fatura"
    }
    
    # Se nenhuma palavra exata da pergunta bater com as palavras-chave da UA, bloqueia na hora!
    if not words.intersection(palavras_chave):
        return {"response": "Lamento, mas sou um assistente exclusivo da Universidade de Aveiro. Não posso responder a assuntos externos como futebol, culinária ou generalidades."}

    # 2. CAPTURAR CONTEXTO RELEVANTE
    contexto_linhas = []
    for linha in UA_KNOWLEDGE:
        linha_low = linha.lower()
        if any(w in linha_low for w in words if len(w) > 3):
            contexto_linhas.append(linha)
            if len(contexto_linhas) >= 3:
                break
    
    contexto = " ".join(contexto_linhas) if contexto_linhas else "Informações gerais sobre a UA."

    # Adicionamos "da Universidade de Aveiro" logo no início da pergunta para contextualizar a IA
    prompt = f"És o assistente oficial da Universidade de Aveiro. Responde estritamente sobre temas da universidade. Pergunta do aluno sobre a UA: {user_message}. Contexto extraído do site: {contexto}"
    
    endpoint = "https://api.iaedu.pt/agent-chat/api/v1/agent/cmamvd3n40000c801qeacoad2/stream"
    form_data = {
        "channel_id": "cmqa0pde3aoy2nr01b2jnjlef",
        "thread_id": "local-thread-unique-124",
        "user_info": "{}",
        "message": prompt
    }
    headers = {"x-api-key": IAEDU_API_KEY}

    try:
        response = requests.post(endpoint, data=form_data, headers=headers, timeout=25)
        
        if response.status_code != 200:
            return {"response": f"Erro na API da IAedu (Código {response.status_code})."}

        raw_text = response.text
        reply = ""
        
        # 1. Tenta o parser estruturado por tokens
        for line in raw_text.split("\n"):
            line = line.strip()
            if not line:
                continue
                
            try:
                if line.startswith("data:"):
                    line = line.replace("data:", "").strip()
                    
                data_json = json.loads(line)
                
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

        # 🔄 RECURSO DE SUCESSO: Se o parser falhou mas veio texto no raw_text, não o deites fora!
        if not reply.strip() and len(raw_text) > 10:
            # Procura qualquer padrão de texto legível dentro do bloco de resposta por Regex
            encontrados = re.findall(r'"content":\s*"([^"]+)"', raw_text)
            if encontrados:
                # Junta os fragmentos encontrados para não devolver vazio
                reply = "".join(encontrados).replace("\\n", "\n")

        # Se mesmo assim estiver vazio, devolve uma resposta padrão que não bloqueia
        if not reply.strip():
            reply = "Não consegui aceder aos dados da universidade neste momento. Podes tentar reformular a pergunta?"

        return {"response": reply}

    except Exception as e:
        return {"response": f"Erro ao comunicar com o servidor: {str(e)}"}