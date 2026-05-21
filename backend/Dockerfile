FROM python:3.11-slim

WORKDIR /app

# instalar dependências
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# copiar código
COPY . .

# expor porta FastAPI
EXPOSE 8000

# correr servidor
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]