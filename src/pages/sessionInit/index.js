import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom"; 
import "./style.css";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import iconArrowLeft from "../../assets/images/seta_icon_esquerda.png";
import labirintoLogo from "../../assets/images/logo.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const formatTime = (totalSeconds) => {
  if (!totalSeconds || isNaN(totalSeconds)) return "00:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");
  return `${formattedMinutes}:${formattedSeconds}`;
};

const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const AudioPlayerControl = ({ audioSrc }) => {
  const audioRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((error) => console.error(error));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [audioSrc]);

  if (!audioSrc) return null;

  const handleTogglePlay = () => setIsPlaying((prev) => !prev);
  const handleTimeUpdate = () => setCurrentTime(audioRef.current?.currentTime || 0);
  const handleLoadedMetadata = () => setDuration(audioRef.current?.duration || 0);
  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="session-audio-player-controls">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        preload="metadata"
      />
      <button className="session-audio-control-btn" onClick={handleTogglePlay}>
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div className="session-audio-bar-track">
        <div className="session-audio-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="session-audio-time-text">
        {formatTime(duration - currentTime)}
      </div>
    </div>
  );
};

const OptionButtons = ({ options, onSelect, selectedId, isAnswered, feedback }) => {
  return (
    <div className="session-option-buttons-container">
      {options.map((opt, index) => {
        const safeId = opt.id || opt._id || String(index);
        const isSelected = String(selectedId) === String(safeId);

        let classes = "session-option-btn";
        if (isAnswered) {
          if (isSelected) {
            classes += feedback === true ? " option-correct" : " option-incorrect";
          } else {
            classes += " option-disabled";
          }
        } else if (isSelected) {
          classes += " option-selected";
        }

        return (
          <button
            key={safeId}
            className={classes}
            onClick={() => !isAnswered && onSelect(safeId)}
            disabled={isAnswered}
          >
            {opt.text || opt.label || "Opção"}
          </button>
        );
      })}
    </div>
  );
};

const ActivityImage = ({ src }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="activity-image-wrapper">
        <img
          src={src}
          alt="Atividade"
          className="activity-main-image"
          onClick={() => setOpen(true)}
        />
        <div className="zoom-badge-icon" onClick={() => setOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </div>
      </div>

      {open && createPortal(
        <div className="lightbox-overlay" onClick={() => setOpen(false)}>
          <div className="lightbox-content-box" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-back-btn" onClick={() => setOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            
            <img 
              src={src} 
              alt="Atividade ampliada" 
              className="lightbox-image-expanded"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

const MixedActivity = (props) => {
  const { imageSrc, question, audioSrc, ...rest } = props;
  return (
    <>
      {imageSrc && <ActivityImage src={imageSrc} />}
      {audioSrc && <AudioPlayerControl audioSrc={audioSrc} />}
      <h2 className="session-activity-question">{question}</h2>
      <OptionButtons {...rest} />
    </>
  );
};

const VisualActivity = (props) => {
  const { imageSrc, question, ...rest } = props;
  return (
    <>
      {imageSrc && <ActivityImage src={imageSrc} />}
      <h2 className="session-activity-question">{question}</h2>
      <OptionButtons {...rest} />
    </>
  );
};

const AudioActivity = (props) => {
  const { question, audioSrc, ...rest } = props;
  return (
    <>
      <h2 className="session-activity-question">{question}</h2>
      <div className="session-centered-controls">
        {audioSrc && <AudioPlayerControl audioSrc={audioSrc} />}
      </div>
      <OptionButtons {...rest} />
    </>
  );
};

const ConstructionActivity = (props) => {
  const { question, ...rest } = props;
  return (
    <>
      <h2 className="session-activity-question">{question}</h2>
      <OptionButtons {...rest} />
    </>
  );
};

function SessionInitPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { task, tasks, sessionId } = location.state || {};

  const [sessionActivities] = useState(tasks ? tasks : task ? [task] : []);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [sessionTimeElapsed, setSessionTimeElapsed] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const [selectedAlternativeId, setSelectedAlternativeId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);

  const [isBnW, setIsBnW] = useState(() => localStorage.getItem("sessionBnW") === "1");

  const [showObservationModal, setShowObservationModal] = useState(false);
  const [observationText, setObservationText] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState(0);

  useEffect(() => {
    localStorage.setItem("sessionBnW", isBnW ? "1" : "0");
  }, [isBnW]);

  useEffect(() => {
    if (showObservationModal) return;
    const timerId = setInterval(() => setSessionTimeElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timerId);
  }, [showObservationModal]);

  useEffect(() => {
    setSelectedAlternativeId(null);
    setIsAnswered(false);
    setAnswerFeedback(null);
    setQuestionStartTime(Date.now());
    setTaskDetails(null);

    const taskId = sessionActivities[currentActivityIndex]?.id || sessionActivities[currentActivityIndex]?._id;
    if (!taskId) return;

    const token = localStorage.getItem("authToken");
    fetch(`${API_BASE_URL}/task/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setTaskDetails(data);
      })
      .catch((err) => console.error(err));
  }, [currentActivityIndex, sessionActivities]);

  useEffect(() => {
    if (!isAnswered || answerFeedback !== null || !taskDetails || !selectedAlternativeId) return;

    const selectedAlt = taskDetails.alternatives?.find(
      (alt) => String(alt.id ?? alt._id) === String(selectedAlternativeId)
    );
    if (selectedAlt !== undefined) {
      setAnswerFeedback(selectedAlt.isCorrect);
      if (selectedAlt.isCorrect) setCorrectAnswers((prev) => prev + 1);
    }
  }, [taskDetails, isAnswered, answerFeedback, selectedAlternativeId]);

  const currentActivity = sessionActivities[currentActivityIndex];
  const isLastActivity = currentActivityIndex === sessionActivities.length - 1;

  const handleOptionSelect = (alternativeId) => {
    if (isAnswered) return;
    setSelectedAlternativeId(alternativeId);
  };

  const handleConfirmAnswer = async () => {
    if (!selectedAlternativeId || isAnswered) return;

    const timeToAnswer = Math.max(0, Math.floor((Date.now() - questionStartTime) / 1000));
    const taskId = currentActivity?.id || currentActivity?._id;

    const selectedAlt = taskDetails?.alternatives?.find(
      (alt) => String(alt.id ?? alt._id) === String(selectedAlternativeId)
    );

    setIsAnswered(true);

    if (selectedAlt !== undefined) {
      setAnswerFeedback(selectedAlt.isCorrect);
      if (selectedAlt.isCorrect) setCorrectAnswers((prev) => prev + 1);
    }

    const payload = {
      sessionId: sessionId,
      taskId: taskId,
      selectedAlternativeId: selectedAlternativeId,
      timeToAnswer: timeToAnswer,
    };

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(`${API_BASE_URL}/task-notebook-session/answer`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (selectedAlt === undefined) {
        const lastAnswer = response.data.answers?.[response.data.answers.length - 1];
        const apiIsCorrect = lastAnswer ? lastAnswer.isCorrect : false;
        setAnswerFeedback(apiIsCorrect);
        if (apiIsCorrect) setCorrectAnswers((prev) => prev + 1);
      }
    } catch (error) {
      console.error(error);
      if (selectedAlt === undefined) setAnswerFeedback(false);
    }
  };

  const finishSession = async () => {
    if (!sessionId) {
      setShowObservationModal(true);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`${API_BASE_URL}/task-notebook-session/finish`, { sessionId }, config);
      setShowObservationModal(true);
    } catch (error) {
      alert("Sessão encerrada.");
      navigate("/home");
    }
  };

  const handleSaveObservation = async () => {
    if (sessionId && observationText.trim()) {
      try {
        const token = localStorage.getItem("authToken");
        await axios.post(
          `${API_BASE_URL}/task-notebook-session/observation`,
          { sessionId, observation: observationText.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error(err);
      }
    }
    navigate("/home");
  };

  const handleNextOrFinish = async () => {
    if (isLastActivity) await finishSession();
    else setCurrentActivityIndex((prev) => prev + 1);
  };

  const renderActivity = () => {
    if (!currentActivity) return <div>Carregando Atividade...</div>;

    const options = taskDetails?.alternatives || currentActivity.alternatives || currentActivity.options || [];

    const activityProps = {
      key: currentActivity.id || currentActivityIndex,
      question: currentActivity.prompt || currentActivity.question || "Selecione:",
      options,
      imageSrc: currentActivity.imageFile,
      audioSrc: currentActivity.audioFile,
      onSelect: handleOptionSelect,
      selectedId: selectedAlternativeId,
      isAnswered: isAnswered,
      feedback: answerFeedback,
    };

    let componentKey = "construction";
    if (activityProps.imageSrc && activityProps.audioSrc) componentKey = "mixed";
    else if (activityProps.imageSrc) componentKey = "visual";
    else if (activityProps.audioSrc) componentKey = "audio";

    switch (componentKey) {
      case "mixed": return <MixedActivity {...activityProps} />;
      case "visual": return <VisualActivity {...activityProps} />;
      case "audio": return <AudioActivity {...activityProps} />;
      default: return <ConstructionActivity {...activityProps} />;
    }
  };

  const totalMins = Math.floor(sessionTimeElapsed / 60);
  const totalSecs = sessionTimeElapsed % 60;
  const timeLabel = totalMins > 0 ? `${totalMins} min e ${totalSecs} seg` : `${totalSecs} segundos`;

  const totalActivities = sessionActivities.length;
  const accuracyPercent = totalActivities > 0 ? Math.round((correctAnswers / totalActivities) * 100) : 0;

  return (
    <div className={`dashboard-container ${isBnW ? "session-bw" : ""}`}>
      <header className="session-activity-header">
        <button onClick={() => navigate(-1)} className="session-back-arrow-button">
          <img src={iconArrowLeft} alt="Voltar" className="session-back-arrow-icon" />
        </button>
        <img src={labirintoLogo} alt="Logo" className="session-header-logo" />
        <button type="button" className="session-theme-toggle-btn" onClick={() => setIsBnW((prev) => !prev)}>
          {isBnW ? "Modo normal" : "Preto e branco"}
        </button>
      </header>

      <main className="session-init-main-content">
        <div className="session-activity-card-wrapper">
          <div className="session-activity-card">
            
            <div className="card-top-bar">
              <button onClick={() => navigate(-1)} className="card-inner-back">←</button>
              <div className="card-inner-timer">
                <span>{formatTime(sessionTimeElapsed)}</span>
                <span className="timer-play-dot">▶</span>
              </div>
            </div>

            {sessionActivities.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Carregando...</h2>
              </div>
            ) : (
              renderActivity()
            )}

            <div className="session-card-actions-footer">
              <button
                onClick={handleConfirmAnswer}
                className="btn-action-confirm"
                disabled={!selectedAlternativeId || isAnswered}
              >
                Confirmar Resposta
              </button>
              <button
                onClick={handleNextOrFinish}
                className="btn-action-next"
                disabled={!isAnswered}
              >
                {isLastActivity ? "Encerrar Sessão" : "Próxima"}
              </button>
            </div>

          </div>
        </div>
      </main>

      {showObservationModal && (
        <div className="session-obs-overlay">
          <div className="session-obs-modal">
            <h1 className="session-obs-title">Encerramento da Sessão</h1>
            <p className="session-obs-subtitle">Registre suas observações clínicas sobre o desempenho do paciente</p>
            <div className="session-obs-summary-card">
              <h3>Resumo de Desempenho da Sessão</h3>
              <div className="session-obs-summary-stats">
                <p>Tempo Total: {timeLabel}</p>
                <p>Taxa de acerto: {accuracyPercent}%</p>
                <p>Atividades realizadas: {totalActivities}</p>
              </div>
            </div>
            <div className="session-obs-section">
              <div className="session-obs-section-title">
                <strong>Observações da Sessão <span className="session-obs-asterisk">*</span></strong>
              </div>
              <textarea
                className="session-obs-textarea"
                value={observationText}
                onChange={(e) => setObservationText(e.target.value)}
                placeholder="Descreva aqui o comportamento do paciente..."
              />
            </div>
            <div className="session-obs-actions">
              <button className="session-obs-btn-skip" onClick={() => navigate("/home")}>Pular</button>
              <button className="session-obs-btn-save" onClick={handleSaveObservation} disabled={!observationText.trim()}>
                Salvar Observação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionInitPage;