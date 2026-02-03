import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style.css";
import iconArrowLeft from "../../assets/images/seta_icon_esquerda.png";
import iconActivitie from "../../assets/images/iconActivitie.png";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/ui/NavBar/index.js";

const categoryMap = {
  reading: "Leitura",
  writing: "Escrita",
  vocabulary: "Vocabulário",
  comprehension: "Compreensão",
};

function mediaUrl(value) {
  if (!value) return null;
  if (typeof value === "string" && value.startsWith("http")) return value;
  const base = process.env.REACT_APP_API_BASE_URL || "";
  return base
    ? `${base.replace(/\/$/, "")}${value.startsWith("/") ? value : `/${value}`}`
    : value;
}

function AudioPlayer({ src }) {
  if (!src) return null;
  return (
    <div className="activity-details-audio-wrap">
      <audio src={src} controls className="activity-details-audio" />
    </div>
  );
}

function ActivityDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const activityId = location.state?.activityId;

  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activityId) {
      navigate("/ManageActivities", { replace: true });
      return;
    }

    const fetchActivity = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/");
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/task/`,
          config
        );

        const list = Array.isArray(response.data) ? response.data : [];
        const found = list.find((t) => t.id === activityId);
        if (found) {
          setActivity(found);
        } else {
          setError("Atividade não encontrada.");
        }
      } catch (err) {
        console.error("Erro ao buscar atividade:", err);
        setError("Erro ao carregar os detalhes da atividade.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [activityId, navigate]);

  if (!activityId) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <Navbar activePage="activities" />

      <main className="activity-details-main-content">
        <button
          type="button"
          onClick={() => navigate("/ManageActivities")}
          className="activity-details-back-arrow"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <img
            src={iconArrowLeft}
            alt="Voltar"
            className="activity-details-back-icon"
          />
        </button>

        <div className="activity-details-container">
          {loading ? (
            <p className="activity-details-loading">Carregando...</p>
          ) : error ? (
            <div className="activity-details-error">
              <p>{error}</p>
              <button
                type="button"
                className="activity-details-back-btn"
                onClick={() => navigate("/ManageActivities")}
              >
                Voltar para Atividades
              </button>
            </div>
          ) : activity ? (
            <>
              <h1 className="activity-details-title">Detalhes da Atividade</h1>
              <div className="activity-details-card">
                <img
                  src={iconActivitie}
                  alt="Atividade"
                  className="activity-details-icon"
                />
                <div className="activity-details-info">
                  <h2 className="activity-details-prompt">{activity.prompt}</h2>
                  <span className="activity-details-category">
                    {categoryMap[activity.category] || activity.category}
                  </span>
                </div>
              </div>

              <section className="activity-details-section">
                <h3 className="activity-details-section-title">Enunciado</h3>
                <p className="activity-details-enunciado">
                  {activity.prompt || "—"}
                </p>
              </section>

              {(activity.alternatives?.length > 0 ||
                activity.options?.length > 0) && (
                <section className="activity-details-section">
                  <h3 className="activity-details-section-title">
                    Alternativas
                  </h3>
                  <ul className="activity-details-alternativas">
                    {(activity.alternatives || activity.options || []).map(
                      (opt, idx) => {
                        const text =
                          typeof opt === "string"
                            ? opt
                            : opt?.text ?? opt?.texto ?? "";
                        const isCorrect =
                          typeof opt === "object" &&
                          (opt?.isCorrect === true || opt?.correta === true);
                        return (
                          <li
                            key={idx}
                            className={`activity-details-alt-item ${
                              isCorrect ? "activity-details-alt-correct" : ""
                            }`}
                          >
                            <span className="activity-details-alt-text">
                              {text || "—"}
                            </span>
                            {isCorrect && (
                              <span className="activity-details-alt-badge">
                                Correta
                              </span>
                            )}
                          </li>
                        );
                      }
                    )}
                  </ul>
                </section>
              )}

              {(activity.imageFile || activity.imageUrl) && (
                <section className="activity-details-section">
                  <h3 className="activity-details-section-title">Imagem</h3>
                  <div className="activity-details-media-wrap">
                    <img
                      src={mediaUrl(activity.imageFile || activity.imageUrl)}
                      alt="Atividade"
                      className="activity-details-image"
                    />
                  </div>
                </section>
              )}

              {(activity.audioFile || activity.audioUrl) && (
                <section className="activity-details-section">
                  <h3 className="activity-details-section-title">Áudio</h3>
                  <AudioPlayer
                    src={mediaUrl(activity.audioFile || activity.audioUrl)}
                  />
                </section>
              )}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default ActivityDetailsPage;
