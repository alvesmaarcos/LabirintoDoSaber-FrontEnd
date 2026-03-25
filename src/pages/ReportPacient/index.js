import React, { useState, useEffect } from "react";
import "./styles.css";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import PageTurner from "../../components/ui/PageTurner/index.js";
import patientAvatar from "../../assets/images/icon_random.png";
import iconArrowLeft from "../../assets/images/seta_icon_esquerda.png";
import iconSeta from "../../assets/images/seta_icon.png";
import iconSession from "../../assets/images/icon_profile.png";
import SearchBar from "../../components/ui/SearchBar/Search";
import Navbar from "../../components/ui/NavBar/index.js";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const formatDate = (dateString) => {
    if (!dateString) return "Data desconhecida";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
};

const formatSecondsToMinutes = (seconds) => {
    if (!seconds) return "0 min";
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
};

function ReportPacient() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const { patientId } = location.state || {};

    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState({ name: "Carregando...", age: "", level: "..." });
    const [studentPhotoUrl, setStudentPhotoUrl] = useState(""); // Adicionado para armazenar a foto do aluno
    const [sessions, setSessions] = useState([]);
    
    const [metrics, setMetrics] = useState({
        totalTime: 0,
        accuracy: 0,
        avgTimePerAnswer: 0,
        avgSessionTime: 0 // Adicionado inicialização
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    useEffect(() => {
        console.log("--- ReportPacient: Iniciando ---");
        console.log("PatientID recebido:", patientId);

        if (!patientId) {
            alert("Erro: ID do aluno não encontrado.");
            navigate("/MainReport");
            return;
        }

        const fetchData = async () => {
            try {
                const token = localStorage.getItem("authToken");
                const config = { headers: { Authorization: `Bearer ${token}` } };

                // 1. Busca Dados do Aluno
                let studentData = { name: "Aluno", age: "?", level: "Em progresso", photoUrl: "" }; // Inicialização com photoUrl
                try {
                    const studentRes = await axios.get(`${API_BASE_URL}/student`, config);
                    const foundStudent = studentRes.data.find(s => s.id === patientId) || 
                                         (studentRes.data.students && studentRes.data.students.find(s => s.id === patientId));
                    
                    if (foundStudent) {
                        studentData = {
                            name: foundStudent.name,
                            age: foundStudent.age,
                            level: foundStudent.learningTopics?.[0] || "Geral",
                            photoUrl: foundStudent.photoUrl || ""  // Atribuindo a URL da foto do aluno
                        };
                    }
                } catch (err) {
                    console.warn("Erro ao buscar detalhes do aluno", err);
                }
                setStudent(studentData);
                setStudentPhotoUrl(studentData.photoUrl); // Atualiza o estado com a foto do aluno

                // 2. Busca Sessões do Aluno
                console.log(`Buscando sessões em: ${API_BASE_URL}/task-notebook-session/student/${patientId}`);
                const sessionsRes = await axios.get(`${API_BASE_URL}/task-notebook-session/student/${patientId}`, config);
                
                console.log("Resposta bruta da lista de sessões:", sessionsRes.data);

                const sessionsData = sessionsRes.data || [];
                const sortedSessions = sessionsData.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
                
                setSessions(sortedSessions);
                calculateMetrics(sortedSessions);
                setLoading(false);

            } catch (error) {
                console.error("Erro fatal ao carregar relatório do paciente:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [patientId, navigate]);

    const calculateMetrics = (sessionsList) => {
        if (!sessionsList.length) return;

        let totalCorrect = 0;
        let totalQuestions = 0;
        let totalTimeSeconds = 0;
        let totalAnswerTime = 0;

        sessionsList.forEach(session => {
            if (session.finishedAt && session.startedAt) {
                const start = new Date(session.startedAt);
                const end = new Date(session.finishedAt);
                totalTimeSeconds += (end - start) / 1000;
            }

            if (session.answers) {
                session.answers.forEach(ans => {
                    totalQuestions++;
                    if (ans.isCorrect) totalCorrect++;
                    totalAnswerTime += (ans.timeToAnswer || 0);
                });
            }
        });

        const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        const avgTimeAnswer = totalQuestions > 0 ? (totalAnswerTime / totalQuestions) : 0;
        const avgSessionTime = sessionsList.length > 0 ? (totalTimeSeconds / sessionsList.length) : 0;

        setMetrics({
            accuracy: accuracy,
            avgSessionTime: avgSessionTime,
            avgTimePerAnswer: avgTimeAnswer
        });
    };

    const handleSessionClick = (session) => {
        const idToSend = session.sessionId || session.id;
        
        console.log("--- Clique na Sessão ---");
        console.log("Objeto sessão clicado:", session);
        console.log("ID extraído para envio:", idToSend);

        if (!idToSend) {
            alert("Erro: Sessão sem ID válido.");
            return;
        }

        navigate("/ReportSession", { state: { sessionId: idToSend } });
    };

    const filteredSessions = sessions.filter(s => 
        (s.sessionId && s.sessionId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        formatDate(s.startedAt).includes(searchTerm)
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSessions = filteredSessions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);

    const changePage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="dashboard-container">
            <Navbar activePage="reports" />

            <main className="session-main-content">
                <div className="session-container">
                    <div className="top-nav-row">
                        <button onClick={() => navigate(-1)} className="back-arrow-link-report" style={{background: 'none', border: 'none', cursor: 'pointer'}}>
                            <img src={iconArrowLeft} alt="Voltar" className="back-arrow-icon" />
                        </button>
                    </div>

                    <div className="student-report-card">
                        <div className="student-header-info">
                            <div className="student-profile-left">
                                <img src={studentPhotoUrl || patientAvatar} alt={student.name} className="big-avatar" />
                                <div className="student-text">
                                    {loading ? (
                                        <h2>Carregando...</h2>
                                    ) : (
                                        <>
                                            <h2>{student.name}</h2>
                                            <p>{student.age} anos</p>
                                            <p className="student-level">{student.level}</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="student-search-area">
                                <SearchBar
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    placeholder="Pesquisar sessão (Data)..."
                                />
                            </div>
                        </div>

                        <div className="sessions-white-box">
                            <h3 className="section-title">Sessões de atendimentos</h3>
                            
                            {loading ? (
                                <p style={{textAlign: 'center', padding: '20px'}}>Carregando histórico...</p>
                            ) : currentSessions.length > 0 ? (
                                <div className="sessions-list">
                                    {currentSessions.map((session, index) => (
                                        <div 
                                            key={session.sessionId || session.id || index} 
                                            className="session-item"
                                            onClick={() => handleSessionClick(session)} 
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div className="session-icon-box">
                                                <img src={iconSession} alt="Icone Sessão" className="session-icon-img"/> 
                                            </div>
                                            <div className="session-info">
                                                <h4>Sessão Realizada</h4>
                                                <p>{formatDate(session.startedAt)} - {session.status === 'IN_PROGRESS' ? 'Em Andamento' : 'Finalizada'}</p>
                                                <small style={{fontSize:'10px', color:'#ccc'}}>ID: {session.sessionId || session.id}</small>
                                            </div>
                                            <img src={iconSeta} alt="Ver detalhes" className="arrow-right" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{textAlign: 'center', padding: '20px', color: '#888'}}>Nenhuma sessão encontrada para este aluno.</p>
                            )}

                            {!loading && filteredSessions.length > 0 && (
                                <PageTurner 
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={changePage}
                                />
                            )}
                        </div>

                        <div className="dashboard-metrics-section">
                            <h3 className="section-title">Desempenho Geral</h3>
                            <div className="metrics-grid">
                                <div className="metric-item">
                                    <span className="metric-label">Tempo Médio Sessão</span>
                                    <div className="metric-pill">{formatSecondsToMinutes(metrics.avgSessionTime)}</div>
                                    <span className="metric-sub">(Duração)</span>
                                </div>
                                <div className="vertical-divider"></div>
                                <div className="metric-item">
                                    <span className="metric-label">Porcentagem de acertos</span>
                                    <div className="metric-pill" style={{backgroundColor: metrics.accuracy > 70 ? '#81C784' : '#FFCC80'}}>
                                        {metrics.accuracy}%
                                    </div>
                                    <span className="metric-sub">(Precisão Geral)</span>
                                </div>
                                <div className="vertical-divider"></div>
                                <div className="metric-item">
                                    <span className="metric-label">Tempo por Resposta</span>
                                    <div className="metric-pill">{Math.round(metrics.avgTimePerAnswer)} seg</div>
                                    <span className="metric-sub">(Média de raciocínio)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ReportPacient;
