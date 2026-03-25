import React, { useState, useEffect } from "react";
import "./style.css";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/ui/NavBar/index.js";
import iconRandom from "../../assets/images/icon_random.png";
import edit from "../../assets/images/edit.png";
import seta from "../../assets/images/seta_icon_esquerda.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const SubProgressItem = ({ category, percentage }) => (
  <div className="sub-progress-item">
    <p>{category}</p>
    <span>{percentage}%</span>
  </div>
);

const HistoryRow = ({ activityName, date, status }) => {
  const formattedDate = date
    ? new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" })
    : "Data Indisp.";

  return (
    <tr>
      <td>
        <span className="btn-tag tag-atividade">{activityName}</span>
      </td>
      <td>{formattedDate}</td>
      <td>
        <span
          className="btn-tag"
          style={{
            backgroundColor: status === "Pendente" ? "#FFECB3" : "#C8E6C9",
            color: status === "Pendente" ? "#FFA000" : "#388E3C",
          }}
        >
          {status}
        </span>
      </td>
    </tr>
  );
};

function AlunoDetalhe() {
  const navigate = useNavigate();
  const location = useLocation();

  const studentId = location.state?.studentId;

  const [studentDetails, setStudentDetails] = useState(null);
  const [educatorDetails, setEducatorDetails] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [overallCompletionRate, setOverallCompletionRate] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentId) {
      setIsLoading(false);
      alert("Erro: ID do aluno não fornecido.");
      navigate("/alunos");
      return;
    }

    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const educatorRes = await axios.get(
          `${API_BASE_URL}/educator/me`,
          config
        );
        const educatorData = educatorRes.data || {};

        setEducatorDetails({
          name:
            educatorData.name ||
            educatorData.fullName ||
            educatorData.username ||
            "Profissional responsável",
          photoUrl: educatorData.photoUrl || educatorData._photoUrl || "",
        });

        const studentRes = await axios.get(`${API_BASE_URL}/student`, config);

        const list = Array.isArray(studentRes.data)
          ? studentRes.data
          : studentRes.data.students || [];

        const studentData = list.find(
          (s) => String(s.id) === String(studentId)
        );

        if (!studentData) {
          setIsLoading(false);
          alert("Aluno não encontrado.");
          return;
        }

        setStudentDetails({
          id: studentData.id,
          name: studentData.name,
          age: studentData.age,
          learningTopics: studentData.learningTopics,
          photoUrl: studentData.photoUrl,
        });

        const analysisRes = await axios.get(
          `${API_BASE_URL}/task-notebook-session/analysis/student/${studentId}`,
          config
        );

        const reportData = analysisRes.data || {};
        const categoriesObj = reportData.categories || {};
        const categoriesArray = Object.values(categoriesObj);

        const categoriesWithProgress = categoriesArray.filter(
          (item) => (item.accuracy || 0) > 0
        );

        let totalAccuracy = 0;
        if (categoriesWithProgress.length > 0) {
          const sumAccuracy = categoriesWithProgress.reduce(
            (sum, item) => sum + (item.accuracy || 0),
            0
          );
          totalAccuracy = Math.round(
            (sumAccuracy / categoriesWithProgress.length) * 100
          );
        }

        if (totalAccuracy < 0) totalAccuracy = 0;
        if (totalAccuracy > 100) totalAccuracy = 100;

        setProgressData(categoriesArray);
        setOverallCompletionRate(totalAccuracy);

        const sessionsRes = await axios.get(
          `${API_BASE_URL}/task-notebook-session/student/${studentId}`,
          config
        );

        const sessionsRaw = Array.isArray(sessionsRes.data)
          ? sessionsRes.data
          : sessionsRes.data.sessions || [];

        const sortedSessions = [...sessionsRaw].sort(
          (a, b) =>
            new Date(b.startedAt || b.date || b.createdAt) -
            new Date(a.startedAt || a.date || a.createdAt)
        );

        setHistoryData(sortedSessions.slice(0, 10));
      } catch (error) {
        alert("Erro ao carregar dados.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [studentId, navigate]);

  if (isLoading) {
    return (
      <div className="aluno-detalhe-container">
        <h1 style={{ textAlign: "center", marginTop: "50px" }}>
          Carregando detalhes do aluno...
        </h1>
      </div>
    );
  }

  if (!studentDetails) {
    return (
      <div className="aluno-detalhe-container">
        <h1 style={{ textAlign: "center", marginTop: "50px" }}>
          Aluno não encontrado.
        </h1>
        <button
          onClick={() => navigate("/alunos")}
          style={{
            padding: "10px 20px",
            marginTop: "20px",
            backgroundColor: "#4A90E2",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Voltar
        </button>
      </div>
    );
  }

  const { name, age, learningTopics, photoUrl } = studentDetails;
  const firstTopic = Array.isArray(learningTopics)
    ? learningTopics[0]
    : learningTopics;

  const educatorName = educatorDetails?.name || "Profissional responsável";
  const educatorPhotoUrl = educatorDetails?.photoUrl || "";

  return (
    <div className="aluno-detalhe-container">
      <Navbar activePage="students" />

      <main className="main-content-detalhe">
        <div className="back-arrow-container">
          <button onClick={() => navigate(-1)} className="back-arrow-button">
            <img src={seta} alt="seta" className="seta" />
          </button>
        </div>

        <div className="info-card">
          <div className="info-section">
            <img
              src={photoUrl || iconRandom}
              alt={name}
              className="avatar-grande1"
            />
            <div className="info-text1">
              <h3>{name}</h3>
              <p>{age || "?"} anos</p>
              <p>{firstTopic || "Sem área definida"}</p>
            </div>
          </div>

          <div className="vertical-divider"></div>

          <div className="info-section">
            <img
              src={educatorPhotoUrl || iconRandom}
              alt={educatorName}
              className="avatar-grande2"
              style={{ objectFit: "cover" }}
            />
            <div className="info-text2">
              <h3>{educatorName}</h3>
              <p>Profissional responsável</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/EditStudent", { state: { studentId } })}
            className="btn-tag btn-editar"
          >
            <img src={edit} alt="edit" className="iconEdit" />
            Editar perfil
          </button>
        </div>

        <div className="progress-card">
          <h2>Progresso Detalhado</h2>
          <p className="subtitle">Atividades concluídas</p>

          {historyData.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#999",
                fontSize: "1.2rem",
                padding: "2rem 0",
                fontWeight: 500,
              }}
            >
              Nenhuma sessão realizada.
            </div>
          ) : (
            <>
              <div className="progress-main-container">
                <div className="progress-bar-main">
                  <div
                    className="progress-bar-inner"
                    style={{ width: `${overallCompletionRate}%` }}
                  ></div>
                </div>
                <span className="progress-percent-main">
                  {overallCompletionRate}%
                </span>
              </div>

              <div className="sub-progress-container">
                {progressData.length > 0 ? (
                  progressData.map((item, index) => (
                    <SubProgressItem
                      key={index}
                      category={(() => {
                        if (item.category === "reading") return "Leitura";
                        if (item.category === "writing") return "Escrita";
                        if (item.category === "vocabulary")
                          return "Vocabulário";
                        if (item.category === "comprehension")
                          return "Compreensão";
                        return item.category;
                      })()}
                      percentage={Math.round((item.accuracy || 0) * 100)}
                    />
                  ))
                ) : (
                  <p style={{ textAlign: "center", color: "#999" }}>
                    Dados de progresso indisponíveis.
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="history-card">
          <h2>Histórico de atividades</h2>

          <table className="history-table">
            <thead>
              <tr>
                <th>Atividade</th>
                <th>Data</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {historyData.length > 0 ? (
                historyData.map((session, index) => (
                  <HistoryRow
                    key={index}
                    activityName={
                      session.sessionName || session.activityName || "Sessão"
                    }
                    date={
                      session.startedAt || session.date || session.createdAt
                    }
                    status={
                      session.status ||
                      (session.finishedAt || session.isFinished
                        ? "Concluído"
                        : "Pendente")
                    }
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    style={{ textAlign: "center", color: "#999" }}
                  >
                    Nenhum histórico encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default AlunoDetalhe;
