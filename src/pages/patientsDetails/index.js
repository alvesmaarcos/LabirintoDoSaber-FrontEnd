import React, { useState, useEffect } from "react";
import "./style.css";
import { useNavigate, useLocation, useParams } from "react-router-dom"; // Adicionado useParams
import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import Navbar from "../../components/ui/NavBar/index.js";
import ReportPDF from "../mainReport/ReportPDF.js";
import iconRandom from "../../assets/images/icon_random.png";
import editIcon from "../../assets/images/editar-perfil-icon.png";
import seta from "../../assets/images/back-button.png";
import calendarIcon from "../../assets/images/blue-schedule-icon.png";
import docIcon from "../../assets/images/relatorio-icon.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const CATEGORY_LABELS = {
  Reading: "Leitura",
  Writing: "Escrita",
  Vocabulary: "Vocabulário",
  Comprehension: "Compreensão",
  reading: "Leitura",
  writing: "Escrita",
  vocabulary: "Vocabulário",
  comprehension: "Compreensão",
};

function mapGender(gender) {
  if (!gender) return null;
  const g = String(gender).toLowerCase();
  if (g === "male" || g === "m") return "Masculino";
  if (g === "female" || g === "f") return "Feminino";
  return gender;
}

function formatDate(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  const months = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ];
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}

function sessionDurationMinutes(startedAt, finishedAt) {
  if (!startedAt || !finishedAt) return null;
  const diff = new Date(finishedAt) - new Date(startedAt);
  return Math.round(diff / 60000);
}

function CategoryBar({ category, accuracy }) {
  const pct = Math.round((accuracy || 0) * 100);
  const label = CATEGORY_LABELS[category] || category;
  return (
    <div className="category-bar-row">
      <span className="category-label">{label}</span>
      <div className="category-bar-track">
        <div className="category-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="category-pct">{pct}%</span>
    </div>
  );
}

function SessionCard({ session, onClick }) {
  const answers = Array.isArray(session.answers) ? session.answers : [];
  const totalAnswers = answers.length;
  const correctAnswers = answers.filter((a) => a.isCorrect).length;
  const durationMin = sessionDurationMinutes(session.startedAt, session.finishedAt);
  const name = session.name || session.sessionName || session.activityName || "Sessão";

  return (
    <div className="session-card session-card-clickable" onClick={onClick}>
      <div className="session-card-left">
        <img src={calendarIcon} alt="sessão" className="session-icon" />
        <div>
          <p className="session-name">{name}</p>
          <p className="session-date">{formatDateTime(session.startedAt || session.date || session.createdAt)}</p>
        </div>
      </div>
      <div className="session-card-right">
        {totalAnswers > 0 && (
          <span className="session-acertos">{correctAnswers}/{totalAnswers} acertos</span>
        )}
        {durationMin != null && (
          <span className="session-time">{durationMin} min</span>
        )}
      </div>
    </div>
  );
}

function snapshotToAnalysisData(snapshot) {
  const categoriesObj = {};
  (snapshot.categories || []).forEach((c) => {
    categoriesObj[c.category.toLowerCase()] = c;
  });
  return {
    categories: categoriesObj,
    total: {
      total: snapshot.totalQuestions || 0,
      correct: snapshot.totalCorrect || 0,
      accuracy: snapshot.accuracy || 0,
    },
  };
}

function AnalysisReportCard({ report, student, onDownload, downloading }) {
  const pct = Math.round((report.accuracy || 0) * 100);
  return (
    <div className="doc-item">
      <img src={docIcon} alt="relatório" className="doc-icon-img" />
      <div className="doc-info">
        <strong className="doc-title">Relatório Pedagógico</strong>
        <small className="doc-date">{formatDate(report.generatedAt)}</small>
      </div>
      <span className="doc-accuracy">{pct}% acertos • {report.totalQuestions || 0} questões</span>
      <button
        className="doc-download-btn"
        onClick={() => onDownload(report)}
        disabled={downloading}
        title="Baixar PDF"
      >
        {downloading ? "…" : "↓"}
      </button>
    </div>
  );
}

function AlunoDetalhe() {
  const navigate = useNavigate();
  const location = useLocation();
  const { studentId: paramId } = useParams(); // Pega da URL se houver
  const studentId = paramId || location.state?.studentId; // Fallback seguro

  const [studentDetails, setStudentDetails] = useState(null);
  const [educatorDetails, setEducatorDetails] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("progresso");
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (!studentId) {
      setIsLoading(false);
      alert("Erro: ID do aluno não fornecido.");
      navigate("/alunos");
      return;
    }

    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 1. Busca dados essenciais (Educador e Alunos)
        const [educatorRes, studentRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/educator/me`, config).catch(() => ({ data: {} })),
          axios.get(`${API_BASE_URL}/student`, config),
        ]);

        const educatorData = educatorRes.data || {};
        setEducatorDetails({
          name: educatorData.name || educatorData.fullName || educatorData.username || "Profissional responsável",
          photoUrl: educatorData.photoUrl || "",
        });

        const list = Array.isArray(studentRes.data)
          ? studentRes.data
          : studentRes.data?.students || [];
        const studentData = list.find((s) => String(s.id) === String(studentId));
        
        if (!studentData) {
          alert("Aluno não encontrado.");
          setIsLoading(false);
          return;
        }
        setStudentDetails(studentData);

        // 2. Busca dados de análise (Se falhar/estiver vazio, não quebra a tela)
        try {
          const analysisRes = await axios.get(`${API_BASE_URL}/task-notebook-session/analysis/student/${studentId}`, config);
          const analysisData = analysisRes.data || {};
          
          const categoriesRaw = analysisData.categories || {};
          const categoriesArray = Array.isArray(categoriesRaw) ? categoriesRaw : Object.values(categoriesRaw);
          setProgressData(categoriesArray);

          const sessionsRaw = Array.isArray(analysisData.sessions) ? analysisData.sessions : [];
          const sorted = [...sessionsRaw].sort(
            (a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0)
          );
          setSessions(sorted.slice(0, 10));
        } catch (err) {
          console.error("Este aluno ainda não possui dados de sessões ou análises.", err);
        }

        // 3. Busca histórico de documentos de forma isolada
        try {
          const historyRes = await axios.get(`${API_BASE_URL}/task-notebook-session/analysis/student/${studentId}/history`, config);
          setAnalysisHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
        } catch (err) {
          console.error("Não foi possível carregar o histórico de relatórios.", err);
        }

      } catch (error) {
        alert("Erro ao carregar dados do aluno.");
        navigate("/alunos");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [studentId, navigate]);

  const handleDownloadReport = async (report) => {
    if (downloadingId) return;
    setDownloadingId(report.id);
    try {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const freshRes = await axios.get(
        `${API_BASE_URL}/task-notebook-session/analysis/student/${studentId}`,
        config
      );
      const sessions = Array.isArray(freshRes.data.sessions) ? freshRes.data.sessions : [];

      const analysisData = snapshotToAnalysisData(report);
      const blob = await pdf(
        <ReportPDF
          student={studentDetails}
          analysisData={analysisData}
          sessions={sessions}
          includeMetrics={true}
          includeObservations={true}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Relatorio_${studentDetails?.name || "aluno"}_${formatDate(report.generatedAt)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Não foi possível gerar o PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleGerarRelatorio = () => {
    navigate("/MainReport", { state: { preSelectedStudentId: studentId } });
  };

  if (isLoading) {
    return (
      <div className="aluno-detalhe-container">
        <Navbar activePage="students" />
        <p style={{ textAlign: "center", marginTop: "4rem", color: "#888" }}>
          Carregando detalhes do aluno...
        </p>
      </div>
    );
  }

  if (!studentDetails) {
    return (
      <div className="aluno-detalhe-container">
        <Navbar activePage="students" />
        <p style={{ textAlign: "center", marginTop: "4rem", color: "#888" }}>
          Aluno não encontrado.
        </p>
      </div>
    );
  }

  const { name, age, dateOfBirth, birthDate, gender, road, housenumber, learningTopics, photoUrl } = studentDetails;
  const genderLabel = mapGender(gender);
  const educatorName = educatorDetails?.name || "Profissional responsável";
  const address = [road, housenumber].filter(Boolean).join(", ");
  const topicsText = Array.isArray(learningTopics) ? learningTopics.join(", ") : learningTopics || "Sem objetivo definido";
  const birthDateDisplay = dateOfBirth || birthDate ? formatDate(dateOfBirth || birthDate) : null;

  return (
    <div className="aluno-detalhe-container">
      <Navbar activePage="students" />

      <main className="main-content-detalhe">

        <div className="perfil-header-row">
          <button onClick={() => navigate(-1)} className="back-arrow-button">
            <img src={seta} alt="voltar" className="seta" />
          </button>
          <div className="perfil-header-title">
            <h1>Perfil do Aluno</h1>
            <p className="perfil-subtitle">Informações detalhadas e acompanhamento.</p>
          </div>
        </div>

        <div className="info-card-expanded">
          <div className="info-card-top">
            <div className="info-card-identity">
              <img
                src={photoUrl || iconRandom}
                alt={name}
                className="avatar-grande"
                onError={(e) => { e.currentTarget.src = iconRandom; }}
              />
              <div className="info-card-main">
                <h2 className="aluno-nome">{name}</h2>
                <p className="aluno-meta">{age} anos{genderLabel ? ` • ${genderLabel}` : ""}</p>
              </div>
            </div>
            <div className="info-card-actions">
              <button className="btn-gerar-relatorio" onClick={handleGerarRelatorio}>
                <img src={docIcon} alt="" className="btn-icon" />
                Gerar Relatório
              </button>
              <button
                className="btn-editar-perfil"
                onClick={() => navigate("/EditStudent", { state: { studentId } })}
              >
                <img src={editIcon} alt="" className="btn-icon" />
                Editar Perfil
              </button>
            </div>
          </div>

          <div className="info-card-details">
            {birthDateDisplay && (
              <div className="info-detail-item">
                <span className="info-detail-label">Data de Nascimento</span>
                <span className="info-detail-value">{birthDateDisplay}</span>
              </div>
            )}
            <div className="info-detail-item">
              <span className="info-detail-label">Profissional Responsável</span>
              <span className="info-detail-value">{educatorName}</span>
            </div>
            {address && (
              <div className="info-detail-item info-detail-full">
                <span className="info-detail-label">Endereço</span>
                <span className="info-detail-value">{address}</span>
              </div>
            )}
            <div className="info-detail-item info-detail-full">
              <span className="info-detail-label">Objetivo de Acompanhamento</span>
              <span className="info-detail-value">{topicsText}</span>
            </div>
          </div>
        </div>

        <div className="tab-bar-wrapper">
          <div className="tab-bar">
            {["progresso", "documentos", "anamnese"].map((tab) => (
              <button
                key={tab}
                className={`tab-btn${activeTab === tab ? " tab-btn-active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "progresso" && (
          <div className="tab-content-card">
            <section className="tab-section">
              <h3 className="section-title">Progresso por Categoria</h3>
              {progressData.length === 0 ? (
                <p className="empty-state">Nenhuma sessão realizada ainda.</p>
              ) : (
                <div className="category-bars">
                  {progressData.map((item, i) => (
                    <CategoryBar key={i} category={item.category} accuracy={item.accuracy} />
                  ))}
                </div>
              )}
            </section>

            <section className="tab-section">
              <h3 className="section-title">Histórico de Atividades</h3>
              {sessions.length === 0 ? (
                <p className="empty-state">Nenhuma atividade registrada.</p>
              ) : (
                <div className="sessions-list">
                  {sessions.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      onClick={() => navigate("/ReportSession", { state: { sessionId: s.id } })}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "documentos" && (
          <div className="tab-content-card">
            <div className="doc-header">
              <h3 className="section-title">Documentos do Aluno</h3>
              <button className="btn-adicionar-doc" onClick={handleGerarRelatorio}>
                <img src={docIcon} alt="" className="btn-icon-sm" />
                Gerar Relatório
              </button>
            </div>

            {analysisHistory.length === 0 ? (
              <p className="empty-state">Nenhum relatório gerado ainda. Clique em "Gerar Relatório" para criar o primeiro.</p>
            ) : (
              <div className="doc-list">
                {analysisHistory.map((report) => (
                  <AnalysisReportCard
                    key={report.id}
                    report={report}
                    student={studentDetails}
                    onDownload={handleDownloadReport}
                    downloading={downloadingId === report.id}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "anamnese" && (
          <div className="tab-content-card">
            <div className="anamnese-placeholder">
              <p className="empty-state">Em breve disponível.</p>
              <p style={{ color: "#aaa", fontSize: "0.9rem" }}>
                O módulo de Anamnese está em desenvolvimento.
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default AlunoDetalhe;