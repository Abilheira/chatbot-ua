import { useNavigate } from "react-router-dom";
import "./App.css";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-page">

      {/* HEADER */}
      <header className="header">
        <button className="logo-btn" onClick={() => navigate("/")}>
          <img src="/logobranco.png" alt="Logo" className="chatbot-image2" />
        </button>
      </header>

      {/* MAIN */}
      <main className="main">

        {/* WELCOME */}
        <div className="welcome">
          <img src="/chatbot2.png" alt="Chatbot" className="chatbot-image" />

          <h2>
            Olá! Tira as tuas<br />
            dúvidas comigo :)
          </h2>
        </div>

        {/* DASHBOARD */}
        <div className="dashboard-area">

          {/* SUGESTÕES */}
          <div className="sugestoes-container">
            <h3 className="sugestoes-titulo">Sugestões Populares</h3>

            <div className="sugestoes-grid">

              <div className="sugestao-card" onClick={() => navigate("/chat")}>
                <i className="fa-solid fa-building-columns"></i>
                <p>Como faço a minha matrícula?</p>
              </div>

              <div className="sugestao-card" onClick={() => navigate("/chat")}>
                <i className="fa-solid fa-calendar-days"></i>
                <p>Quando começam as aulas?</p>
              </div>

              <div className="sugestao-card" onClick={() => navigate("/chat")}>
                <i className="fa-regular fa-clock"></i>
                <p>Como consultar o meu horário?</p>
              </div>

              <div className="sugestao-card" onClick={() => navigate("/chat")}>
                <i className="fa-solid fa-file-invoice"></i>
                <p>Quais são os prazos de pagamento?</p>
              </div>

              <div className="sugestao-card" onClick={() => navigate("/chat")}>
                <i className="fa-solid fa-file-signature"></i>
                <p>Como pedir uma declaração?</p>
              </div>

              <div className="sugestao-card" onClick={() => navigate("/chat")}>
                <i className="fa-solid fa-graduation-cap"></i>
                <p>Estatuto trabalhador-estudante</p>
              </div>

            </div>
          </div>

          {/* ATALHOS */}
          <div className="atalhos-container">

            <h3 className="atalhos-titulo">Atalhos Rápidos</h3>

            <div className="atalhos-box">

              <a className="atalho" href="https://paco.ua.pt/" target="_blank">
                <i className="fa-solid fa-user-graduate"></i>
                <span>Portal Académico</span>
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </a>

              <a className="atalho" href="https://www.ua.pt/pt/sga/page/4618" target="_blank">
                <i className="fa-solid fa-calendar"></i>
                <span>Calendário Académico</span>
                <i className="fa-solid fa-arrow-up-right-from-square"></i>
              </a>

              <a className="atalho" href="https://elearning.ua.pt/" target="_blank">
                <i className="fa-solid fa-book"></i>
                <span>E-Learning</span>
              </a>

              <a className="atalho" href="https://www.ua.pt/pt/contactos-gerais" target="_blank">
                <i className="fa-solid fa-phone"></i>
                <span>Contactos UA</span>
              </a>

              <a className="atalho" href="https://cantinas.pt/" target="_blank">
                <i className="fa-solid fa-burger"></i>
                <span>Ementas Cantinas UA</span>
              </a>

            </div>
          </div>
        </div>

        {/* INPUT (leva para chat) */}
        <div className="area-input">
          <div className="input-box">
            <input
              placeholder="Pergunta alguma coisa..."
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate("/chat");
              }}
            />

            <button className="botao4" onClick={() => navigate("/chat")}>
              ➜
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}