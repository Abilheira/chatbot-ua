import { useState, useRef, useEffect } from "react";
import "./App.css";

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
      <a href="/">
        <button className="logo-btn">
          <img src="/logobranco.png" className="chatbot-image2" />
        </button>
      </a>
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

      {/* BUTTONS */}
      <div className="top-buttons">
        <button className="small-btn">Matrículas</button>
        <button className="small-btn">Horários</button>
        <button className="small-btn">Prazos</button>
      </div>

      {/* INPUT */}
      <div className="area-input">
        <div className="input-box">

          <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Pergunta alguma coisa..."
          />

          <button
            className="botao4"
            onClick={sendMessage}
          >
            ➜
          </button>

        </div>
      </div>

      {/* ALERTA */}
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

