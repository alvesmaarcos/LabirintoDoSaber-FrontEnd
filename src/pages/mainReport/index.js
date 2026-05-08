import React, { useState, useEffect, useRef } from "react";
import "./style.css";
import Navbar from "../../components/ui/NavBar/index.js";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { pdf } from "@react-pdf/renderer";
import ReportPDF from "./ReportPDF";
import patientAvatar from "../../assets/images/icon_random.png";
import iconCalendario from "../../assets/images/icon-calendario.png";
import iconCheckbox from "../../assets/images/icon-checkbox.png";
import iconDocumento from "../../assets/images/icon-documento.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const PERIODS = [
  { id: "last3", label: "Últimas 3 sessões", limit: 3 },
  { id: "last6", label: "Últimas 6 sessões", limit: 6 },
  { id: "all", label: "Todas as sessões", limit: null },
  { id: "custom", label: "Período Personalizado", limit: null },
];

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

function formatDate(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

function MainReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("last3");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [analysisData, setAnalysisData] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [includeMetrics, setIncludeMetrics] = useState(true);
  const [includeObservations, setIncludeObservations] = useState(true);
  const [includeAnamnese, setIncludeAnamnese] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [showNoSessionsModal, setShowNoSessionsModal] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const educatorId = localStorage.getItem("userId");
        const token = localStorage.getItem("authToken");
        if (!educatorId || !token) {
          navigate("/");
          return;
        }

        const res = await axios.get(`${API_BASE_URL}/student/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const all = Array.isArray(res.data)
          ? res.data
          : (res.data?.students ?? []);
        const mine = all
          .filter((s) => String(s.educatorId) === String(educatorId))
          .map((s) => ({
            id: s.id,
            name: s.name,
            age: s.age,
            photoUrl: s.photoUrl,
          }));
        setAllStudents(mine);

        const preId = location.state?.preSelectedStudentId;
        if (preId) {
          const preSelected = mine.find((s) => String(s.id) === String(preId));
          if (preSelected) setSelectedStudent(preSelected);
        }
      } catch (err) {
        console.error("Erro ao buscar alunos:", err);
      }
    };
    fetchStudents();
  }, [navigate, location.state?.preSelectedStudentId]);

  // GET /analysis não persiste — seguro para auto-fetch na preview.
  // O POST /snapshot (que persiste) só é chamado dentro do handleExportPDF.
  useEffect(() => {
    if (!selectedStudent) return;
    if (selectedPeriod === "custom" && (!customStartDate || !customEndDate)) return;

    const fetchPreview = async () => {
      setLoadingAnalysis(true);
      try {
        const token = localStorage.getItem("authToken");
        const params = {};
        const period = PERIODS.find((p) => p.id === selectedPeriod);
        if (period?.limit) {
          params.limit = period.limit;
        } else if (selectedPeriod === "custom") {
          params.startDate = new Date(customStartDate).toISOString();
          params.endDate = new Date(customEndDate + "T23:59:59").toISOString();
        }
        const res = await axios.get(
          `${API_BASE_URL}/task-notebook-session/analysis/student/${selectedStudent.id}`,
          { headers: { Authorization: `Bearer ${token}` }, params },
        );
        setAnalysisData(res.data);
      } catch (err) {
        console.error("Erro ao buscar preview:", err);
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchPreview();
  }, [selectedStudent, selectedPeriod, customStartDate, customEndDate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStudents = allStudents.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSelectStudent = (student) => {
    if (selectedStudent?.id === student.id) {
      setDropdownOpen(false);
      return;
    }
    setSelectedStudent(student);
    setSearchTerm("");
    setDropdownOpen(false);
    setAnalysisData(null);
  };

  const handlePeriodChange = (periodId) => {
    setSelectedPeriod(periodId);
    setAnalysisData(null);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    setDropdownOpen(true);
    if (selectedStudent && val !== selectedStudent.name) {
      setSelectedStudent(null);
      setAnalysisData(null);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedStudent) return;
    if (selectedPeriod === "custom" && (!customStartDate || !customEndDate)) return;

    setExportingPDF(true);
    setLoadingAnalysis(true);
    try {
      const token = localStorage.getItem("authToken");
      const headers = { Authorization: `Bearer ${token}` };
      const params = {};
      const period = PERIODS.find((p) => p.id === selectedPeriod);
      if (period?.limit) {
        params.limit = period.limit;
      } else if (selectedPeriod === "custom") {
        params.startDate = new Date(customStartDate).toISOString();
        params.endDate = new Date(customEndDate + "T23:59:59").toISOString();
      }

      // GET — dados completos com sessions para o PDF (não persiste)
      const analysisRes = await axios.get(
        `${API_BASE_URL}/task-notebook-session/analysis/student/${selectedStudent.id}`,
        { headers, params },
      );
      const data = analysisRes.data;
      setAnalysisData(data);

      const sessions = data.sessions ?? [];
      if (sessions.length === 0) {
        setShowNoSessionsModal(true);
        return;
      }

      // POST /snapshot — persiste 1 único snapshot no histórico
      await axios.post(
        `${API_BASE_URL}/task-notebook-session/analysis/student/${selectedStudent.id}/snapshot`,
        null,
        { headers, params },
      );

      const blob = await pdf(
        <ReportPDF
          student={selectedStudent}
          analysisData={data}
          sessions={sessions}
          includeMetrics={includeMetrics}
          includeObservations={includeObservations}
        />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${selectedStudent.name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
    } finally {
      setExportingPDF(false);
      setLoadingAnalysis(false);
    }
  };

  const sessions = analysisData?.sessions ?? [];
  const sessionCount = sessions.length;

  return (
    <div className="dashboard-container">
      <Navbar activePage="relatorios" />

      <main className="report-main">
        <h1 className="report-page-title">Gerar Relatório</h1>

        <div className="report-top-row">
          {/* Card 1: Buscar Aluno */}
          <div className="report-card report-card--search" ref={dropdownRef}>
            <h2 className="report-card-title">
              <span className="icon-circle icon-circle--blue">👤</span>
              1. Buscar Aluno
            </h2>

            <div className="student-search-wrapper">
              <div
                className="student-search-input-row"
                onClick={() => {
                  if (!dropdownOpen) setDropdownOpen(true);
                }}
              >
                <span className="search-icon-inner" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder={selectedStudent ? selectedStudent.name : "Digite o nome do aluno..."}
                  className="student-search-input"
                />
                <span className="search-chevron">&#9662;</span>
              </div>

              {dropdownOpen && filteredStudents.length > 0 && (
                <ul className="student-dropdown-list">
                  {filteredStudents.map((s) => (
                    <li
                      key={s.id}
                      className="student-dropdown-item"
                      onMouseDown={() => handleSelectStudent(s)}
                    >
                      <img
                        src={s.photoUrl || patientAvatar}
                        alt=""
                        className="student-dropdown-avatar"
                        onError={(e) => {
                          e.currentTarget.src = patientAvatar;
                        }}
                      />
                      <span>{s.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedStudent && (
              <div className="student-selected-card">
                <img
                  src={selectedStudent.photoUrl || patientAvatar}
                  alt={selectedStudent.name}
                  className="student-selected-avatar"
                  onError={(e) => {
                    e.currentTarget.src = patientAvatar;
                  }}
                />
                <div className="student-selected-info">
                  <p className="student-selected-name">
                    {selectedStudent.name}
                  </p>
                  <p className="student-selected-meta">
                    {selectedStudent.age} anos
                    {analysisData && ` • ${sessionCount} sessões registradas`}
                  </p>
                </div>
                <span className="student-selected-check">&#10003;</span>
              </div>
            )}
          </div>

          {/* Card 2: Período */}
          <div className="report-card report-card--period">
            <h2 className="report-card-title">
              <span className="icon-circle icon-circle--gold">
                <img src={iconCalendario} alt="" className="icon-circle-img" />
              </span>
              2. Período
            </h2>

            <div className="period-options">
              {PERIODS.map((p) => (
                <button
                  key={p.id}
                  className={`period-option${selectedPeriod === p.id ? " active" : ""}`}
                  onClick={() => handlePeriodChange(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {selectedPeriod === "custom" && (
              <div className="custom-date-range">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="date-input"
                />
                <span className="date-range-sep">até</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
            )}
          </div>
        </div>

        {!selectedStudent && (
          <div className="report-empty-state">
            <p className="report-empty-title">Busque um aluno para começar</p>
            <p className="report-empty-sub">
              Use o campo de busca acima para encontrar o aluno
            </p>
          </div>
        )}

        {selectedStudent && (
          <>
            {/* Prévia das Sessões */}
            <div className="report-section-card">
              <div className="report-section-header">
                <div className="report-section-title-row">
                  <span className="icon-circle icon-circle--blue2">
                    <img src={iconDocumento} alt="" className="icon-circle-img" />
                  </span>
                  <h2 className="report-section-title">
                    Prévia das Sessões Incluídas
                  </h2>
                </div>
                <span className="sessions-badge">
                  {sessionCount} {sessionCount === 1 ? "sessão" : "sessões"}
                </span>
              </div>

              {loadingAnalysis ? (
                <p className="report-loading-text">Carregando sessões...</p>
              ) : sessions.length === 0 ? (
                <p className="report-no-data-text">
                  Nenhuma sessão encontrada para o período selecionado.
                </p>
              ) : (
                <ul className="sessions-preview-list">
                  {sessions.map((session) => {
                    const total = session.answers?.length ?? 0;
                    const correct =
                      session.answers?.filter((a) => a.isCorrect).length ?? 0;
                    const accuracy =
                      total > 0 ? Math.round((correct / total) * 100) : 0;
                    return (
                      <li
                        key={session.id}
                        className="session-preview-item"
                        onClick={() =>
                          navigate("/ReportSession", {
                            state: { sessionId: session.id },
                          })
                        }
                      >
                        <div className="session-preview-info">
                          <p className="session-preview-name">{session.name}</p>
                          <p className="session-preview-date">
                            {formatDate(session.startedAt)}
                          </p>
                        </div>
                        <div className="session-preview-score">
                          <p className="session-score-fraction">
                            {correct}/{total}
                          </p>
                          <p className="session-score-pct">
                            {accuracy}% acerto
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Conteúdo do Relatório */}
            <div className="report-section-card">
              <div
                className="report-section-title-row"
                style={{ marginBottom: "1.25rem" }}
              >
                <span className="icon-circle icon-circle--purple">
                  <img src={iconCheckbox} alt="" className="icon-circle-img" />
                </span>
                <h2 className="report-section-title">
                  3. Conteúdo do Relatório
                </h2>
              </div>

              <ul className="report-content-options">
                <li className="checkbox-row">
                  <input
                    type="checkbox"
                    id="cb-metrics"
                    checked={includeMetrics}
                    onChange={(e) => setIncludeMetrics(e.target.checked)}
                    className="report-checkbox"
                  />
                  <div className="checkbox-text">
                    <label htmlFor="cb-metrics" className="checkbox-label">
                      Métricas de Desempenho
                    </label>
                    <p className="checkbox-description">
                      Inclui gráficos de progresso, taxa de acertos e
                      estatísticas gerais
                    </p>
                  </div>
                </li>
                <li className="checkbox-row">
                  <input
                    type="checkbox"
                    id="cb-observations"
                    checked={includeObservations}
                    onChange={(e) => setIncludeObservations(e.target.checked)}
                    className="report-checkbox"
                  />
                  <div className="checkbox-text">
                    <label htmlFor="cb-observations" className="checkbox-label">
                      Observações Qualitativas
                    </label>
                    <p className="checkbox-description">
                      Anotações e observações registradas durante as sessões
                    </p>
                  </div>
                </li>
                <li className="checkbox-row">
                  <input
                    type="checkbox"
                    id="cb-anamnese"
                    checked={includeAnamnese}
                    onChange={(e) => setIncludeAnamnese(e.target.checked)}
                    className="report-checkbox"
                  />
                  <div className="checkbox-text">
                    <label htmlFor="cb-anamnese" className="checkbox-label">
                      Dados da Anamnese
                    </label>
                    <p className="checkbox-description">
                      Informações gerais, histórico médico e desenvolvimento do
                      aluno
                    </p>
                  </div>
                </li>
              </ul>
            </div>

			{/* Exportar PDF */}
            <div className="export-button-container">
              <button
                className="export-pdf-button"
                onClick={handleExportPDF}
                disabled={exportingPDF || loadingAnalysis}
              >
                <span className="export-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </span>
                
                <div className="export-text-group">
                  <span className="export-main-text">
                    {exportingPDF ? "Gerando PDF..." : "Exportar Relatório em PDF"}
                  </span>
                  <span className="export-sub-text">
                    Relatório de {selectedStudent.name}
                  </span>
                </div>
              </button>
            </div>
          </>
        )}
      </main>

      {showNoSessionsModal && (
        <div className="modal-overlay" onClick={() => setShowNoSessionsModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">📋</div>
            <p className="modal-title">Nenhuma sessão encontrada</p>
            <p className="modal-description">
              Este aluno não possui sessões registradas para o período
              selecionado. Escolha um período diferente ou aguarde a realização
              de sessões.
            </p>
            <button
              className="modal-confirm-btn"
              onClick={() => setShowNoSessionsModal(false)}
            >
              Ok
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainReport;
