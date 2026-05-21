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
  const [darkMode, setDarkMode] = useState(true);

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

  const theme = darkMode ? darkStyles : lightStyles;

  return (
    <div style={theme.page}>
      <div style={theme.container}>
        {/* HEADER */}
        <div style={theme.header}>
          🎓 UA Assistente

          <button
            onClick={() => setDarkMode(!darkMode)}
            style={theme.toggle}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

        {/* CHAT */}
        <div style={theme.chat}>
          {chat.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...theme.msg,
                  backgroundColor:
                    msg.role === "user"
                      ? "#006341"
                      : darkMode
                      ? "#2a2a2a"
                      : "#F2F2F2",
                  color: msg.role === "user" ? "white" : theme.text,
                }}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && <div style={theme.loading}>A pensar...</div>}
          <div ref={endRef} />
        </div>

        {/* INPUT */}
        <div style={theme.inputBox}>
          <input
            style={theme.input}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Pergunta sobre a Universidade de Aveiro..."
          />

          <button style={theme.button} onClick={sendMessage}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= THEMES ================= */

const darkStyles: any = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f0f0f",
    fontFamily: "Arial",
  },

  container: {
    width: "90%",
    maxWidth: 700,
    height: "80vh",
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  header: {
    padding: 15,
    backgroundColor: "#006341",
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    position: "relative",
  },

  toggle: {
    position: "absolute",
    right: 15,
    top: 10,
    background: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "white",
  },

  chat: {
    flex: 1,
    padding: 15,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    backgroundColor: "#1a1a1a",
  },

  msg: {
    padding: "10px 14px",
    borderRadius: 14,
    maxWidth: "70%",
    fontSize: 14,
    lineHeight: 1.4,
    textAlign: "left",
    whiteSpace: "pre-wrap",
  },

  inputBox: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #333",
    gap: 10,
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: "1px solid #444",
    backgroundColor: "#2a2a2a",
    color: "white",
    outline: "none",
  },

  button: {
    backgroundColor: "#006341",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10,
    cursor: "pointer",
  },

  loading: {
    fontSize: 12,
    color: "#aaa",
  },

  text: "#eaeaea",
};

const lightStyles: any = {
  page: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f5f5",
    fontFamily: "Arial",
  },

  container: {
    width: "90%",
    maxWidth: 700,
    height: "80vh",
    backgroundColor: "white",
    borderRadius: 18,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  header: {
    padding: 15,
    backgroundColor: "#006341",
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    position: "relative",
  },

  toggle: {
    position: "absolute",
    right: 15,
    top: 10,
    background: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "white",
  },

  chat: {
    flex: 1,
    padding: 15,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    backgroundColor: "white",
  },

  msg: {
    padding: "10px 14px",
    borderRadius: 14,
    maxWidth: "70%",
    fontSize: 14,
    lineHeight: 1.4,
    textAlign: "left",
    whiteSpace: "pre-wrap",
  },

  inputBox: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #eee",
    gap: 10,
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: "1px solid #ccc",
    outline: "none",
  },

  button: {
    backgroundColor: "#006341",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10,
    cursor: "pointer",
  },

  loading: {
    fontSize: 12,
    color: "#666",
  },

  text: "#1a1a1a",
};