import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "bot";
  text: string;
};

export default function App() {

  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<Message[]>([
    {
      role: "bot",
      text: "👋 Olá! Sou o assistente da Universidade de Aveiro. Como posso ajudar?"
    }
  ]);

  const [loading, setLoading] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  async function sendMessage() {
    if (!message.trim()) return;

    const userMessage = message;

    setChat((prev) => [...prev, { role: "user", text: userMessage }]);
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("https://chatbot-ua-wqvd.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      setChat((prev) => [
        ...prev,
        { role: "bot", text: data.response },
      ]);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: "bot", text: "Erro ao comunicar com o backend." },
      ]);
    }

    setLoading(false);
  }

  return (
  <div className="app">

    {/* HEADER */}
    <header className="header">
      <button className="logo-btn">
        <img src="/logobranco.png" className="chatbot-image2" />
      </button>
    </header>

    {/* MAIN */}
    <main className="main">

      {/* WELCOME */}
      <div className="welcome">
        <img src="/chatbot2.png" className="chatbot-image" />

        <h2>
          Olá! Tira as tuas<br />
          dúvidas comigo :)
        </h2>
      </div>

      {/* CHAT (mantém o teu chat aqui se quiseres) */}
      <div className="chat-box">
        {chat.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 10
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                maxWidth: "70%",
                backgroundColor:
                  msg.role === "user" ? "#006341" : "#eaeaea",
                color: msg.role === "user" ? "white" : "#000",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && <p>A pensar...</p>}
        <div ref={endRef} />
      </div>

      {/* INPUT */}
      <div className="area-input">
        <div className="input-box">

          <input
            id="mensagem"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Pergunta alguma coisa..."
          />

          <button className="botao4" onClick={sendMessage}>
            ➜
          </button>

        </div>
      </div>

      {/* DISCLAIMER */}
      <p className="texto_alerta">
        Este chatbot foi desenvolvido no âmbito de um Projeto Final de Licenciatura e encontra-se em fase experimental.
      </p>

      <p className="texto_alerta2">
        As informações fornecidas não representam posições oficiais da Universidade de Aveiro.
      </p>

    </main>
  </div>
);
}
