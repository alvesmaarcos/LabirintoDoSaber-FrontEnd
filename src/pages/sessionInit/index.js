import React, { useState, useEffect } from "react";
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
  <svg
    width="30"
    height="33"
    viewBox="0 0 30 33"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="session-audio-icon"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M23.7354 15.6654C24.3343 16.0606 24.3343 16.9394 23.7354 17.3346L7.80084 27.8514C7.13599 28.2902 6.25 27.8134 6.25 27.0168L6.25 5.98317C6.25 5.18657 7.13599 4.70976 7.80084 5.14856L23.7354 15.6654Z"
      fill="#191D23"
    />
  </svg>
);

const PauseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="session-audio-icon"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 4L5 20H9V4H5Z"
      stroke="black"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M15 4L15 20H19V4H15Z"
      stroke="black"
      strokeLinejoin="round"
    />
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

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime || 0);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || 0);
  };

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

      <div
        className="session-audio-bar-placeholder"
        style={{
          background: `linear-gradient(to right, #4A90E2 ${progressPercent}%, #ccc ${progressPercent}%)`,
        }}
      ></div>

      <div className="session-audio-time-text">
        {formatTime(currentTime)} / {formatTime(duration)}
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

        let buttonStyle = {};
        if (isAnswered) {
          if (isSelected) {
            buttonStyle =
              feedback === true || feedback === null
                ? { backgroundColor: "#4CAF50", color: "white", borderColor: "#4CAF50" }
                : { backgroundColor: "#F44336", color: "white", borderColor: "#F44336" };
          } else {
            buttonStyle = { opacity: 0.6, cursor: "not-allowed" };
          }
        }

        return (
          <button
            key={safeId}
            className="session-option-btn"
            style={buttonStyle}
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

const MixedActivity = (props) => {
  const { imageSrc, question, ...rest } = props;

  return (
    <>
      {imageSrc && (
        <div className="activity-image-wrapper">
          <img src={imageSrc} alt="Atividade" className="activity-main-image" />
        </div>
      )}
      {props.audioSrc && <AudioPlayerControl audioSrc={props.audioSrc} />}
      <h2 className="session-activity-question">{question}</h2>
      <OptionButtons {...rest} />
    </>
  );
};

const VisualActivity = (props) => {
  const { imageSrc, question, ...rest } = props;

  return (
    <>
      {imageSrc && (
        <div className="activity-image-wrapper">
          <img src={imageSrc} alt="Atividade" className="activity-main-image" />
        </div>
      )}
      <h2 className="session-activity-question">{question}</h2>
      <OptionButtons {...rest} />
    </>
  );
};

const AudioActivity = (props) => {
  const { question, ...rest } = props;

  return (
    <>
      <h2 className="session-activity-question">{question}</h2>
      <div className="session-centered-controls">
        {props.audioSrc && <AudioPlayerControl audioSrc={props.audioSrc} />}
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
  const [isLoading, setIsLoading] = useState(false);

  const [isBnW, setIsBnW] = useState(() => localStorage.getItem("sessionBnW") === "1");

  useEffect(() => {
    localStorage.setItem("sessionBnW", isBnW ? "1" : "0");
  }, [isBnW]);

  useEffect(() => {
    const timerId = setInterval(() => setSessionTimeElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    setSelectedAlternativeId(null);
    setIsAnswered(false);
    setAnswerFeedback(null);
    setQuestionStartTime(Date.now());
    setIsLoading(false);
  }, [currentActivityIndex]);

  const currentActivity = sessionActivities[currentActivityIndex];
  const isLastActivity = currentActivityIndex === sessionActivities.length - 1;

  const handleOptionSelect = async (alternativeId) => {
    if (isAnswered || isLoading) return;

    setSelectedAlternativeId(alternativeId);
    setIsLoading(true);

    const timeToAnswer = Math.max(0, Math.floor((Date.now() - questionStartTime) / 1000));
    const taskId = currentActivity?.id || currentActivity?._id;

    const payload = {
      sessionId: sessionId,
      taskId: taskId,
      selectedAlternativeId: alternativeId,
      timeToAnswer: timeToAnswer,
    };

    try {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.post(`${API_BASE_URL}/task-notebook-session/answer`, payload, config);

      const lastAnswer = response.data.answers ? response.data.answers[response.data.answers.length - 1] : null;
      const isCorrect = lastAnswer ? lastAnswer.isCorrect : true;

      setAnswerFeedback(isCorrect);
      setIsAnswered(true);
    } catch (error) {
      setAnswerFeedback(true);
      setIsAnswered(true);
    } finally {
      setIsLoading(false);
    }
  };

  const finishSession = async () => {
    if (!sessionId) {
      alert("Sessão finalizada (Modo local).");
      navigate("/home");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_BASE_URL}/task-notebook-session/finish`, { sessionId }, config);

      alert("Sessão Finalizada!");
      navigate("/home");
    } catch (error) {
      alert("Sessão encerrada (com aviso de rede).");
      navigate("/home");
    }
  };

  const handleNextOrFinish = async () => {
    if (isLastActivity) await finishSession();
    else setCurrentActivityIndex((prev) => prev + 1);
  };

  const renderActivity = () => {
    if (!currentActivity) return <div>Carregando Atividade...</div>;

    const activityProps = {
      key: currentActivity.id || currentActivityIndex,
      question: currentActivity.prompt || currentActivity.question || "Selecione:",
      options: currentActivity.alternatives || currentActivity.options || [],
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
      case "mixed":
        return <MixedActivity {...activityProps} />;
      case "visual":
        return <VisualActivity {...activityProps} />;
      case "audio":
        return <AudioActivity {...activityProps} />;
      default:
        return <ConstructionActivity {...activityProps} />;
    }
  };

  return (
    <div className={`dashboard-container ${isBnW ? "session-bw" : ""}`}>
      <header className="session-activity-header">
        <button onClick={() => navigate(-1)} className="session-back-arrow-button">
          <img src={iconArrowLeft} alt="Voltar" className="session-back-arrow-icon" />
        </button>

        <img src={labirintoLogo} alt="Logo" className="session-header-logo" />

        <div className="session-timer-controls">
          <button
            type="button"
            className="session-theme-toggle-btn"
            onClick={() => setIsBnW((prev) => !prev)}
          >
            {isBnW ? "Modo normal" : "Preto e branco"}
          </button>

          <div className="session-activity-timer">{formatTime(sessionTimeElapsed)}</div>
        </div>
      </header>

      <main className="session-init-main-content">
        <div className="session-activity-card-wrapper">
          <div className="session-activity-card">
            {sessionActivities.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>Carregando...</h2>
              </div>
            ) : (
              renderActivity()
            )}

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <button
                onClick={handleNextOrFinish}
                className="session-debug-btn"
                disabled={!isAnswered}
                style={{
                  backgroundColor: isLastActivity ? "#FF5722" : "#4A90E2",
                  opacity: !isAnswered ? 0.5 : 1,
                  cursor: !isAnswered ? "not-allowed" : "pointer",
                  padding: "10px 30px",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  fontWeight: "bold",
                }}
              >
                {isLastActivity ? "ENCERRAR SESSÃO" : "PRÓXIMA ATIVIDADE"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SessionInitPage;
