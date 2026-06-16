import requests
from bs4 import BeautifulSoup
import re

SITEMAP_URL = "https://www.ua.pt/sitemap.xml"

def get_all_urls():
    print("🔄 A recolher links do sitemap da UA...")
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        r = requests.get(SITEMAP_URL, headers=headers, timeout=10)
        
        # Tentamos ler como XML. Se falhar, tentamos como HTML normal
        soup = BeautifulSoup(r.text, "lxml-xml")
        urls = [loc.text.strip() for loc in soup.find_all("loc") if "ua.pt" in loc.text]
        
        if not urls:
            # Segunda tentativa caso o XML venha disfarçado
            soup = BeautifulSoup(r.text, "html.parser")
            urls = [loc.text.strip() for loc in soup.find_all("loc") if "ua.pt" in loc.text]

        if urls:
            return urls[:60]
            
    except Exception as e:
        print(f"Erro ao ler sitemap: {e}")
    
    # 🔥 SE TUDO FALHAR: Links de emergência para o teu projeto funcionar já!
    print("⚠️ Sitemap inacessível. A usar links principais da UA como alternativa...")
    return [
        "https://www.ua.pt/",
        "https://www.ua.pt/pt/viver-a-ua",
        "https://www.ua.pt/pt/cursos",
        "https://www.ua.pt/pt/paco",
        "https://www.ua.pt/pt/sasua",
        "https://www.ua.pt/pt/servicos-academicos"
    ]

def scrape_page(url):
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(r.text, "html.parser")
        
        # Remove lixo visual e scripts
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()
            
        text = soup.get_text(separator=" ", strip=True)
        # Limpa espaços excessivos
        text = re.sub(f' +', ' ', text)
        return text
    except:
        return ""

if __name__ == "__main__":
    urls = get_all_urls()
    print(f"🔗 Encontrados {len(urls)} links. A iniciar a raspagem...")
    
    conhecimento = []
    for i, url in enumerate(urls):
        conteudo = scrape_page(url)
        if len(conteudo) > 100: # Só guarda se tiver texto relevante
            # Divide o texto em frases ou parágrafos pequenos
            frases = [f.strip() for f in conteudo.split(".") if len(f.strip()) > 30]
            conhecimento.extend(frases)
        print(f"[{i+1}/{len(urls)}] Concluído: {url[:40]}...")

    # Guarda tudo estruturado linha a linha num ficheiro local
    with open("ua_conhecimento.txt", "w", encoding="utf-8") as f:
        for linha in set(conhecimento): # 'set' remove linhas duplicadas automaticamente
            f.write(linha + "\n")
            
    print("✅ Sucesso! Base de conhecimento guardada em 'ua_conhecimento.txt'")