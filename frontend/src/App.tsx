import { useState, useRef, useEffect } from "react";
import "./App.css";

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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  function openChatWithQuestion(question: string) {
    setPage("chat");
    setMessage(question);
  }

  async function sendMessage() {
    if (!message.trim()) return;

    const userMsg = message;

    setChat((prev) => [...prev, { role: "user", text: userMsg }]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("https://chatbot-ua-wqvd.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await response.json();

      setChat((prev) => [...prev, { role: "bot", text: data.response }]);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: "bot", text: "Erro ao ligar ao servidor." },
      ]);
    }

    setLoading(false);
  }

  /* ===================== HOME ===================== */
  
  if (page === "home") {
    return (
      <div className="page-container home">

        {/* HEADER */}
        <div className="header">
          <img src="/logobranco.png" className="chatbot-image2" />
        </div>

        {/* MAIN */}
        <div className="main">

          <img src="/chatbot2.png" className="chatbot-image" />

          <h2>
            Olá! Tira as tuas<br />
            dúvidas comigo :)
          </h2>

          {/* SUGESTÕES */}
          <div className="dashboard-area">

            <div className="sugestoes-container">

              <h3 className="sugestoes-titulo">Sugestões Populares</h3>

              <div className="sugestoes-grid">

                <div className="sugestao-card" onClick={() =>
                  openChatWithQuestion("Como faço a minha matrícula?")
                }>
                  🎓 <p>Como faço a minha matrícula?</p>
                </div>

                <div className="sugestao-card" onClick={() =>
                  openChatWithQuestion("Quando começam as aulas?")
                }>
                  📅 <p>Quando começam as aulas?</p>
                </div>

                <div className="sugestao-card" onClick={() =>
                  openChatWithQuestion("Como consultar o meu horário?")
                }>
                  ⏰ <p>Consultar horário</p>
                </div>

                <div className="sugestao-card" onClick={() =>
                  openChatWithQuestion("Quais são os prazos de pagamento?")
                }>
                  📄 <p>Prazos de pagamento</p>
                </div>

                <div className="sugestao-card" onClick={() =>
                  openChatWithQuestion("Como pedir uma declaração?")
                }>
                  🧾 <p>Pedir declaração</p>
                </div>

                <div className="sugestao-card" onClick={() =>
                  openChatWithQuestion("Como pedir estatuto de trabalhador-estudante?")
                }>
                  🎓 <p>Trabalhador-estudante</p>
                </div>

              </div>
            </div>

          </div>

          {/* ATALHOS */}
          <div className="atalhos-container">

            <h3 className="atalhos-titulo">Atalhos Rápidos</h3>

            <div className="atalhos-box">

              <a className="atalho" href="https://paco.ua.pt/" target="_blank">
                📚 <span>Portal Académico</span>
              </a>

              <a className="atalho" href="https://www.ua.pt/pt/sga/page/4618" target="_blank">
                📅 <span>Calendário Académico</span>
              </a>

              <a className="atalho" href="https://elearning.ua.pt/" target="_blank">
                📖 <span>E-Learning</span>
              </a>

              <a className="atalho" href="https://www.ua.pt/pt/contactos-gerais" target="_blank">
                📞 <span>Contactos UA</span>
              </a>

              <a className="atalho" href="https://cantinas.pt/" target="_blank">
                🍔 <span>Ementas Cantinas</span>
              </a>

            </div>
          </div>

          {/* BOTÃO COMEÇAR */}
          <button className="botao4" onClick={() => setPage("chat")}>
            Começar ➜
          </button>

        </div>
      </div>
    );
  }

  /* ===================== CHAT ===================== */
  return (
    <div className={`app page-container ${darkMode ? "dark" : ""}`}>

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
            <span>{msg.text}</span>
          </div>
        ))}

        {loading && <div className="loading-text">A responder...</div>}

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

          <button className="botao" onClick={sendMessage}>
            ➜
          </button>

        </div>
      </div>

    </div>
  );
}