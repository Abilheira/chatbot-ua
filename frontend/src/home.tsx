import "./Home.css";

type Props = {
  onStart: () => void;
  setMessage: (msg: string) => void;
};

export default function Home({ onStart, setMessage }: Props) {
  function goToChatWith(text: string) {
    setMessage(text);
    onStart();
  }

  return (
    <div className="home">

      {/* HEADER */}
      <div className="topo">
        <button className="logo-btn" onClick={onStart}>
          <img src="/logobranco.png" className="chatbot-image2" />
        </button>
      </div>

      {/* WELCOME */}
      <div className="welcome">
        <img src="/chatbot2.png" className="chatbot-image" />

        <h2>
          Olá! Tira as tuas<br />
          dúvidas comigo :)
        </h2>

        <button className="botao" onClick={onStart}>
          Começar chat
        </button>
      </div>

      {/* SUGESTÕES */}
      <h3 className="sugestoes-titulo">Sugestões Populares</h3>

      <div className="sugestoes-grid">

        <div className="sugestao-card"
          onClick={() => goToChatWith("Como faço a minha matrícula?")}>
          📚 <p>Como faço a minha matrícula?</p>
        </div>

        <div className="sugestao-card"
          onClick={() => goToChatWith("Quando começam as aulas?")}>
          📅 <p>Quando começam as aulas?</p>
        </div>

        <div className="sugestao-card"
          onClick={() => goToChatWith("Como consultar o meu horário?")}>
          ⏰ <p>Como consultar o meu horário?</p>
        </div>

      </div>

      {/* LINKS */}
      <h3 className="atalhos-titulo">Atalhos Rápidos</h3>

      <div className="atalhos-box">
        <a href="https://paco.ua.pt/" className="atalho">Portal Académico</a>
        <a href="https://elearning.ua.pt/" className="atalho">E-Learning</a>
      </div>

    </div>
  );
}