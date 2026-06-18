import { useState, useRef, useEffect } from "react";
import "./App.css";
import Home from "./Home";

type Message = {
  role: "user" | "bot";
  text: string;
};

export default function App() {
  const [page, setPage] = useState<"home" | "chat">("home");
  const [message, setMessage] = useState("");

  const [chat, setChat] = useState<Message[]>([
    {
      role: "bot",
      text: "Olá! Tira as tuas dúvidas comigo :)",
    },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);

  /* 🔥 SCROLL AUTOMÁTICO REFORÇADO */
  useEffect(() => {
    // O setTimeout de 50ms garante que o React já renderizou o texto no ecrã antes de rolar
    const timer = setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);

    return () => clearTimeout(timer);
  }, [chat, loading]); // Executa quando o chat muda OU quando o loading ativa/desativa

  /* SEND MESSAGE */
  async function sendMessage(customMessage?: string) {
    const userMsg = customMessage && customMessage.trim() ? customMessage : message;

    if (!userMsg.trim()) return;

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

      let respostaDoBot = data && data.response ? String(data.response).trim() : "";
      
      if (!respostaDoBot || respostaDoBot.toLowerCase() === "undefined" || respostaDoBot === "") {
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
          text: "Erro ao ligar ao servidor.",
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
          sendMessage(text); 
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
          <button onClick={() => setDarkMode(!darkMode)} className="icon-btn">
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* CHAT CONTAINER */}
      <div className="chat-container" style={{ overflowY: "auto" }}>
        {chat.map((msg, i) => (
          <div
            key={i}
            className={msg.role === "user" ? "mensagem-user" : "mensagem-bot"}
          >
            {msg.role === "bot" && (
              <img src="/chatbot2.png" className="logo-bot" />
            )}

            <div className="message-text">
              {msg.text}
            </div>
          </div>
        ))}

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

        {/* Elemento âncora para o scroll */}
        <div ref={endRef} style={{ float: "left", clear: "both" }} />
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