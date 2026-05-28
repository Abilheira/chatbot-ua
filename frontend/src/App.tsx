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
      text: "Olá! Tira as tuas dúvidas comigo :)",
    },
  ]);

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);


  async function sendMessage() {
  if (!message.trim()) return;

  const userMsg = message;

  setChat((prev) => [...prev, {
    role: "user",
    text: userMsg
  }]);

  setMessage("");

  try {
    const response = await fetch("http://chatbot-ua.vercel.app//chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMsg,
      }),
    });

    const data = await response.json();

    setChat((prev) => [
      ...prev,
      {
        role: "bot",
        text: data.response,
      },
    ]);
  } catch (error) {
    setChat((prev) => [
      ...prev,
      {
        role: "bot",
        text: "Erro ao ligar ao servidor.",
      },
    ]);
  }
}

  return (
    <div className="app">

      {/* HEADER */}
      <div className="topo">
        <a href="/">
          <button className="logo-btn">
            <img src="/logobranco.png" className="chatbot-image2" />
          </button>
        </a>
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
; </div>

    </div>
  );
}
