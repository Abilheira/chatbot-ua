import "./Home.css";

type Props = {
  onStart: () => void;
  onSuggestionClick: (text: string) => void;
  darkMode: boolean;
  setDarkMode: () => void;
};

export default function Home({
  onStart,
  onSuggestionClick,
  darkMode,
  setDarkMode,
}: Props) {
  return (
    <div className={`home ${darkMode ? "dark" : ""}`}>

      {/* HEADER */}
      <div className="home-header">

        <div className="home-left">
          <img src="/logobranco.png" className="home-logo" />
        </div>

        <div className="home-right">
          <button className="icon-btn" onClick={setDarkMode}>
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

      </div>

      {/* MAIN */}
      <div className="home-main">

        <img src="/chatbot2.png" className="home-bot" />

        <h1>
          Olá! Tira as tuas<br />
          dúvidas comigo :)
        </h1>

        {/* SUGESTÕES */}
        <div className="home-section">

          <h2>Sugestões Populares</h2>

          <div className="suggestions">

            <button onClick={() => onSuggestionClick("Como faço a minha matrícula?")}>
              🎓 Como faço a minha matrícula?
            </button>

            <button onClick={() => onSuggestionClick("Quando começam as aulas?")}>
              📅 Quando começam as aulas?
            </button>

            <button onClick={() => onSuggestionClick("Como consultar o meu horário?")}>
              ⏰ Consultar horário
            </button>

            <button onClick={() => onSuggestionClick("Quais são os prazos de pagamento?")}>
              📄 Prazos de pagamento
            </button>

          </div>
        </div>

        {/* ATALHOS */}
        <div className="home-section">

          <h2>Atalhos Rápidos</h2>

          <div className="shortcuts">

            <a href="https://paco.ua.pt/" target="_blank">📚 Portal Académico</a>
            <a href="https://www.ua.pt/pt/sga/page/4618" target="_blank">📅 Calendário</a>
            <a href="https://elearning.ua.pt/" target="_blank">📖 E-Learning</a>
            <a href="https://www.ua.pt/pt/contactos-gerais" target="_blank">📞 Contactos UA</a>

          </div>

        </div>

        {/* BOTÃO COMEÇAR */}
        <button className="start-btn" onClick={onStart}>
          Começar ➜
        </button>

      </div>
    </div>
  );
}