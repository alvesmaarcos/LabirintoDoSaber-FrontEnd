import React, { useEffect, useState } from "react";
import "./styles.css";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import iconArrowLeft from "../../assets/images/seta_icon_esquerda.png";
import Navbar from "../../components/ui/NavBar/index.js";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// --- NOVA FUNÇÃO AUXILIAR PARA FORMATAR O TEMPO ---
const formatDuration = (seconds) => {
  const val = Number(seconds) || 0; // Garante que é número

  // Se for menos de 1 minuto, mostra em segundos
  if (val < 60) {
    return `${Math.round(val)} segundos`;
  }

  // Se for maior, calcula minutos e segundos restantes
  const m = Math.floor(val / 60);
  const s = Math.round(val % 60);

  if (s === 0) return `${m} minutos`;
  return `${m} min e ${s} seg`;
};

function ReportSession() {
  const navigate = useNavigate();
  const location = useLocation();

  // Recebe sessionId da tela anterior
  const { sessionId } = location.state || {};

  const [loading, setLoading] = useState(true);

  const [sessionData, setSessionData] = useState({
    title: "Carregando...",
    timeMetrics: [],
    categoryRates: [],
    activityRates: [],
  });

  useEffect(() => {
    if (!sessionId) {
      alert("Erro: sessão não identificada.");
      navigate(-1);
      return;
    }

    const fetchSessionData = async () => {
      try {
        const token = localStorage.getItem("authToken");

        const res = await axios.get(
          `${API_BASE_URL}/task-notebook-session/report/${sessionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const api = res.data;

        const formatPercent = (value) => {
          const n = Number(value);
          if (!Number.isFinite(n)) return "0%";
          return `${n.toFixed(1)}%`;
        };

        const displayTitle = api.sessionName
          ? api.sessionName
          : `Sessão ${sessionId.substring(0, 8)}`;

        setSessionData({
          title: displayTitle,

          timeMetrics: [
            {
              label: "Tempo total da sessão",
              value: formatDuration(api.totalTimeSession),
            },
            {
              label: "Tempo médio de resposta",
              value: formatDuration(api.averageTimePerQuestion),
            },
            {
              label: "Tempo médio para acerto",
              value: formatDuration(api.averageCorrectTime),
            },
            {
              label: "Tempo médio para erro",
              value: formatDuration(api.averageIncorrectTime),
            },
          ],

          categoryRates: api.percentageByCategory
            ? Object.entries(api.percentageByCategory).map(([key, val]) => ({
                label: key,
                value: formatPercent(val),
              }))
            : [],

          activityRates: api.percentageByType
            ? Object.entries(api.percentageByType).map(([key, val]) => ({
                label: key,
                value: formatPercent(val),
              }))
            : [],
        });

        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar relatório:", err);
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, navigate]);

  return (
    <div className="dashboard-container">
      <Navbar activePage="reports" />

      <main className="session-main-content">
        <div className="session-container">
          <div className="top-nav-row">
            <button
              onClick={() => navigate(-1)}
              className="back-arrow-link-report"
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <img
                src={iconArrowLeft}
                alt="Voltar"
                className="back-arrow-icon"
              />
            </button>
          </div>

          <div className="session-report-card">
            <h1 className="session-page-title">{sessionData.title}</h1>

            {loading ? (
              <div style={{ textAlign: "center", marginTop: "40px" }}>
                <p>Gerando relatório...</p>
              </div>
            ) : (
              <div className="metrics-white-box-large">
                <h2 className="box-subtitle">Relação de tempos e taxas</h2>

                <div className="metrics-split-layout">
                  {/* COLUNA ESQUERDA */}
                  <div className="metrics-column left-column">
                    {sessionData.timeMetrics.map((item, i) => (
                      <div key={i} className="metric-row">
                        <span className="metric-label-text">{item.label}</span>
                        <div className="metric-pill-large">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="vertical-separator"></div>

                  {/* COLUNA DIREITA */}
                  <div className="metrics-column right-column">
                    {/* CATEGORIAS */}
                    <div className="rates-group">
                      <h3 className="group-title">
                        Taxa de acerto por categoria
                      </h3>
                      <div className="rates-grid">
                        {sessionData.categoryRates.length > 0 ? (
                          sessionData.categoryRates.map((item, i) => (
                            <div key={i} className="rate-item">
                              <span className="rate-label">
                                {(() => {
                                  if (item.label === "reading")
                                    return "Leitura";
                                  if (item.label === "writing")
                                    return "Escrita";
                                  if (item.label === "vocabulary")
                                    return "Vocabulário";
                                  if (item.label === "comprehension")
                                    return "Compreensão";
                                  return item.label;
                                })()}
                              </span>
                              <div className="metric-pill-medium">
                                {item.value}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: "14px", color: "#999" }}>
                            Sem dados de categoria
                          </p>
                        )}
                      </div>
                    </div>

                    {/* TIPOS */}
                    <div className="rates-group">
                      <h3 className="group-title">
                        Taxa de acerto por tipo de atividade
                      </h3>
                      <div className="rates-grid">
                        {sessionData.activityRates.length > 0 ? (
                          sessionData.activityRates.map((item, i) => (
                            <div key={i} className="rate-item">
                              <span className="rate-label">
                                {(() => {
                                  if (item.label === "multipleChoice")
                                    return "Múltipla escolha";
                                  if (item.label === "multipleChoiceWithMedia")
                                    return "Múltipla escolha com mídia";
                                  return item.label;
                                })()}
                              </span>
                              <div className="metric-pill-medium">
                                {item.value}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: "14px", color: "#999" }}>
                            Sem dados de tipo
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReportSession;
