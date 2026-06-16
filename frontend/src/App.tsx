import { useState, useRef, useEffect } from "react";
import "./App.css";
import "./home.css";

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

  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  
  useEffect(() => {
    if (!ttsEnabled) {
      window.speechSynthesis.cancel();
    }
  }, [ttsEnabled]);


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);


  async function sendMessage() {
  if (!message.trim()) return;

  const userMsg = message;

  setChat((prev) => [...prev, { role: "user", text: userMsg }]);
  setMessage("");
  setLoading(true);

  try {
    const response = await fetch("https://chatbot-ua-wqvd.onrender.com/chat", {
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
    setTimeout(() => {
  speak(data.response);
}, 100);

  } catch (error) {
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

function speak(text: string) {
  if (!ttsEnabled) return; // 👈 isto é o toggle

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-PT";
  utterance.rate = 1;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
}


  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>

      {/* HEADER */}
     <div className="topo">
  <a href="/">
    <button className="logo-btn">
      <img src="/logobranco.png" className="chatbot-image2" />
    </button>
  </a>

  <div className="header-actions">
    <button onClick={() => setDarkMode(!darkMode)} className="icon-btn">
      {darkMode ? "☀️" : "🌙"}
    </button>

    <button onClick={() => setTtsEnabled(!ttsEnabled)} className="icon-btn">
      {ttsEnabled ? "🔊" : "🔇"}
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
            {loading && (
            <div aria-live="polite" aria-busy="true" className="loading-text">
            A responder...
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

          <button className="botao" onClick={sendMessage}>
            ➜
          </button>
        </div>
 </div>

    </div>
  );
}