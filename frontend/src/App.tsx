import { useState, useRef, useEffect } from "react";
import "./App.css";
import Home from "./Home";

type Message = {
  role: "user" | "bot";
  text: string;
};

function EfeitoEscrita({ texto }: { texto: string }) {
  const [textoExibido, setTextoExibido] = useState("");
  
  useEffect(() => {
    // 🔥 PROTEÇÃO: Se o texto for undefined ou vazio, não faz nada
    if (!texto) return;

    const palavras = texto.split(" ");
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

  // Se não houver texto, mostra uma string vazia em vez de undefined
  return <span>{textoExibido || texto || ""}</span>;
}


export default function App() {
  const [page, setPage] = useState<"home" | "chat">("home");
  const [message, setMessage] = useState("");

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

  /* SEND <div className="message-text">*/
  async function sendMessage(customMessage?: string) {
    const userMsg = customMessage ?? message;

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

      setChat((prev) => [
        ...prev,
        {
          role: "bot",
          text: data.response, // mantém \n para CSS tratar
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
          sendMessage(text); // envia logo a pergunta
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
        {/* Botão de Limpar Chat */}
        <button onClick={limparChat} className="icon-btn" title="Limpar conversa">
            🧹
        </button>
  
        <button onClick={() => setDarkMode(!darkMode)} className="icon-btn">
            {darkMode ? "☀️" : "🌙"}
        </button>
    </div>
      </div>

      {/* CHAT */}
      <div className="chat-container">
        {chat.map((msg, i) => (
          <div
            key={i}
            className={msg.role === "user" ? "mensagem-user" : "mensagem-bot"}
          >
            {msg.role === "bot" && (
              <img src="/chatbot2.png" className="logo-bot" />
            )}

            {/* IMPORTANTE: isto preserva quebras de linha */}
            <div className="message-text">
              {msg.role === "bot" ? (
                <EfeitoEscrita texto={msg.text} />
            ) : (
              msg.text
            )}
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