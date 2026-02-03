import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./style.css";
import iconArrowLeft from "../../assets/images/seta_icon_esquerda.png";
import Navbar from "../../components/ui/NavBar/index.js";

// SVG da caneta (PenIcon)
const PenIcon = () => (
  <svg
    width="34"
    height="26"
    viewBox="0 0 34 26"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5.12634 17C5.04271 17.6571 5 18.325 5 19V21M5.12634 17C6.03384 9.86861 11.7594 4 20 4L19 8H16L17 10L15 12H11L13 14L12 16H8L5.12634 17Z"
      stroke="black"
    />
  </svg>
);

function SessionTitlePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sessionName, setSessionName] = useState("");
  // Vamos chamar de studentId para alinhar com a API, mesmo que venha como patientId
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    if (location.state) {
      const id = location.state.studentId || location.state.patientId;
      console.log("State recebido na SessionTitlePage:", location.state);

      if (id) {
        setStudentId(id);
        console.log("Fluxo - ID do Aluno recebido:", id);
      } else {
        console.warn("Nenhum ID de aluno encontrado.");
      }
    }
  }, [location]);

  const handleNext = () => {
    // Validação do nome
    if (sessionName.trim() === "") {
      alert("Por favor, dê um nome à sessão.");
      return;
    }

    // Validação do ID
    if (!studentId) {
      alert(
        "Erro: Aluno não identificado. Volte e selecione o aluno novamente."
      );
      return;
    }

    console.log(`Avançando para Tipo de Sessão.`);
    console.log(`Dados: StudentID: ${studentId}, Nome: ${sessionName}`);

    // PASSANDO OS DADOS PARA A PRÓXIMA TELA (/sessionType)
    // A tela SessionType deve receber isso e repassar para SessionNotebookPage/Group/Activity
    navigate("/sessionType", {
      state: {
        studentId: studentId,
        sessionName: sessionName,
      },
    });
  };

  const handleBack = () => {
    navigate("/session"); // Volta para a seleção de alunos
  };

  return (
    <div className="dashboard-container">
      <Navbar activePage="activities" />

      <main className="start-session-main-content">
        <div className="start-session-container">
          <button
            onClick={handleBack}
            className="back-arrow-button"
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <img src={iconArrowLeft} alt="Voltar" className="back-arrow-icon" />
          </button>
          <div className="start-session-header-top">
            <h1>Sessão de atendimento</h1>
          </div>

          <div className="session-name-card">
            <p className="card-instruction">
              Dê um nome à sessão <span className="required-asterisk">*</span>
            </p>

            <div className="input-with-icon">
              <PenIcon />
              <input
                type="text"
                placeholder="Preencha aqui..."
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="session-name-input"
              />
            </div>

            <button className="next-button" onClick={handleNext}>
              Próximo
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SessionTitlePage;
