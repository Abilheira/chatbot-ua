import { useState, useRef, useEffect } from "react";
import "./App.css";
import Home from "./Home";

type Message = {
  role: "user" | "bot";
  text: string;
};

/* =====================================================================
   COMPONENTE: EfeitoEscrita
   ===================================================================== */
function EfeitoEscrita({ texto }: { texto: string }) {
  const [textoExibido, setTextoExibido] = useState("");
  
  useEffect(() => {
    // Se não for string ou vier vazia, não faz nada
    if (!texto || typeof texto !== "string") {
      setTextoExibido("");
      return;
    }

    // 🔥 Remove qualquer palavra "undefined" fantasma que venha misturada por erro de string
    const textoLimpo = texto.replace(/\bundefined\b/g, "").trim();

    const palavras = textoLimpo.split(" ");
    let i = 0;
    setTextoExibido(""); 
    
    const timer = setInterval(() => {
      if (i < palavras.length) {
        setTextoExibido((prev) => prev + (i === 0 ? "" : " ") + palavras[i]);
        i++;
      } else {
        clearInterval(timer);
      }
    }, 45); 
    
    return () => clearInterval(timer);
  }, [texto]);

  return <span>{textoExibido}</span>;
}


export default function App() {
  const [page, setPage] = useState<"home" | "chat">("home");
  const [message, setMessage] = useState("");
  const [ultimaMensagem, setUltimaMensagem] = useState(""); 

  const [chat, setChat] = useState<Message[]>(() => {
    const guardado = localStorage.getItem("chat_ua_history");
    return guardado ? JSON.parse(guardado) : [
      {
        role: "bot",
        text: "Olá! Tira as tuas dúvidas comigo :)",
      },
    ];
  });

  useEffect(() => {
    localStorage.setItem("chat_ua_history", JSON.stringify(chat));
  }, [chat]);

  function limparChat() {
    const chatInicial: Message[] = [
      { role: "bot", text: "Olá! Tira as tuas dúvidas comigo :)" }
    ];
    setChat(chatInicial);
    localStorage.setItem("chat_ua_history", JSON.stringify(chatInicial));
  }

  const endRef = useRef<HTMLDivElement | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  /* SCROLL AUTOMÁTICO */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  /* SEND MESSAGE (CORRIGIDO) */
  async function sendMessage(customMessage?: string) {
  const userMsg = customMessage && customMessage.trim() ? customMessage : message;

  if (!userMsg.trim()) return;

  setUltimaMensagem(userMsg); 
  setChat((prev) => [...prev, { role: "user", text: userMsg }]);
  setMessage(""); 
  setLoading(true);

  try {
  const response = await fetch(
    "https://chatbot-ua-wqvd.onrender.com/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMsg }),
    }
  );

  const data = await response.json();

  // Se data.response não existir ou vier a string "undefined", usamos uma frase padrão fixa
  let respostaDoBot = data && data.response ? data.response.toString().trim() : "";
  
  if (!respostaDoBot || respostaDoBot === "undefined" || respostaDoBot === "") {
    respostaDoBot = "O assistente processou o pedido mas devolveu uma resposta vazia. Tenta reformular a tua questão.";
  }

  setChat((prev) => [
    ...prev,
    {
      role: "bot",
      text: respostaDoBot,
    },
  ]);
} catch {
  setChat((prev) => [
    ...prev,
    {
      role: "bot",
      text: "Erro ao ligar ao servidor. Queres tentar novamente?",
    },
  ]);
}

  setLoading(false);
}

  /* HOME */
  if (page === "home") {
    return (
      <Home
        onStart={() => setPage("chat")}
        onSuggestionClick={(text) => {
          setPage("chat");
          sendMessage(text); // Agora funciona de forma independente!
        }}
        darkMode={darkMode}
        setDarkMode={() => setDarkMode(!darkMode)}
      />
    );
  }

  /* CHAT */
  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>

      {/* HEADER */}
      <div className="topo">
        <button className="logo-btn" onClick={() => setPage("home")}>
          <img src="/logobranco.png" className="chatbot-image2" />
        </button>

        <div className="header-actions">
          <button onClick={limparChat} className="icon-btn" title="Limpar conversa">
            🧹
          </button>
          <button onClick={() => setDarkMode(!darkMode)} className="icon-btn">
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* CHAT CONTAINER */}
      <div className="chat-container">
        {chat.map((msg, i) => {
          const textoMensagem = msg && msg.text ? msg.text : "";

          return (
            <div
              key={i}
              className={msg.role === "user" ? "mensagem-user" : "mensagem-bot"}
            >
              {msg.role === "bot" && (
                <img src="/chatbot2.png" className="logo-bot" />
              )}

              <div className="message-text">
                {msg.role === "bot" ? (
                  <>
                    <EfeitoEscrita texto={textoMensagem} />
                    {textoMensagem.includes("Erro ao ligar ao servidor") && (
                      <button 
                        className="btn-tentar-novamente" 
                        onClick={() => sendMessage(ultimaMensagem)}
                      >
                        Tentar novamente 🔄
                      </button>
                    )}
                  </>
                ) : (
                  textoMensagem
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="mensagem-bot loading-box">
            <img src="/chatbot2.png" className="logo-bot" />
            <div className="tic-tac-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* INPUT */}
      <div className="area-input">
        <div className="input-box">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Pergunta alguma coisa..."
          />
          <button className="botao" onClick={() => sendMessage()}>
            ➜
          </button>
        </div>
      </div>

    </div>
  );
}