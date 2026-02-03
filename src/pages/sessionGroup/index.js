import React, { useState, useEffect } from "react";
import "./style.css";
import axios from "axios";
import iconDoubleCard from "../../assets/images/iconDoublecard.png";
import iconArrowLeft from "../../assets/images/seta_icon_esquerda.png";
import SearchBar from "../../components/ui/SearchBar/Search";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/ui/NavBar/index.js";
// --- ÍCONES (Mantidos iguais) ---
const PlusIcon = () => (
  <svg
    width="25"
    height="25"
    viewBox="0 0 65 69"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_d_398_2393)">
      <path d="M46.0418 32.5003H18.9585" stroke="black" strokeLinecap="round" />
      <path d="M32.4998 46.0413V18.958" stroke="black" strokeLinecap="round" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32.4998 59.5837C47.4575 59.5837 59.5832 47.458 59.5832 32.5003C59.5832 17.5426 47.4575 5.41699 32.4998 5.41699C17.5421 5.41699 5.4165 17.5426 5.4165 32.5003C5.4165 47.458 17.5421 59.5837 32.4998 59.5837Z"
        stroke="black"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_398_2393"
        x="-4"
        y="0"
        width="73"
        height="73"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_398_2393"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_398_2393"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
);

const CheckIcon = () => (
  <svg
    width="25"
    height="25"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 6L9 17L4 12"
      stroke="white"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function SessionGroupPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. RECUPERANDO DADOS DO FLUXO
  const { studentId, sessionName } = location.state || {};

  // Estados
  const [groups, setGroups] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // NOVO: Guarda todas as tarefas para referência
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  // ESTADO DE SELEÇÃO ÚNICA
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const categoryMap = {
    reading: "Vocabulário & Leitura",
    writing: "Escrita",
    vocabulary: "Vocabulário",
    comprehension: "Compreensão, Leitura & Vocabulário",
    general: "Geral",
  };

  // --- VERIFICAÇÃO DE FLUXO ---
  useEffect(() => {
    if (!studentId || !sessionName) {
      console.warn("Dados de sessão perdidos (studentId/sessionName).");
    }
  }, [studentId, sessionName]);

  // --- INTEGRANDO A API (LISTAR GRUPOS E TAREFAS) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/");
          return;
        }
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };

        // Executa as duas requisições em paralelo
        const [groupsResponse, tasksResponse] = await Promise.all([
          axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/task-group/list-by-educator`,
            config
          ),
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/task/`, config),
        ]);

        setGroups(groupsResponse.data);

        // Salva todas as tarefas para podermos "traduzir" os IDs do grupo depois
        if (Array.isArray(tasksResponse.data)) {
          setAllTasks(tasksResponse.data);
        }

        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
        if (error.response && error.response.status === 401) {
          navigate("/");
        }
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Lógica de Seleção ÚNICA
  const handleGroupSelection = (group) => {
    if (selectedGroup && selectedGroup.id === group.id) {
      setSelectedGroup(null);
    } else {
      setSelectedGroup(group);
    }
  };

  // --- LÓGICA CORRIGIDA PARA HABILITAR O BOTÃO ---
  const handleStartSession = async () => {
    if (!selectedGroup) {
      alert("Selecione um grupo.");
      return;
    }

    // 1. Pega a lista crua de IDs ou Objetos
    const rawTasksOrIds = selectedGroup.tasksIds || selectedGroup.tasks || [];

    if (rawTasksOrIds.length === 0) {
      alert("Este grupo está vazio (sem atividades).");
      return;
    }

    setIsStarting(true);

    // 2. NORMALIZAÇÃO DE DADOS (A CORREÇÃO ESTÁ AQUI)
    const resolvedTasks = rawTasksOrIds
      .map((item) => {
        // Acha a tarefa original completa na lista global 'allTasks'
        // Verifica tanto pelo .id quanto pelo ._id para garantir
        const originalTask =
          typeof item === "object"
            ? item
            : allTasks.find((t) => t.id === item || t._id === item);

        if (!originalTask) return undefined;

        console.log(
          "Processando tarefa:",
          originalTask.prompt || originalTask.name
        );

        // Retorna um objeto limpo e formatado corretamente para o SessionInit
        return {
          ...originalTask,
          // Garante que o ID da tarefa seja o do banco (_id tem prioridade)
          id: originalTask._id || originalTask.id,

          // Mapeia as alternativas garantindo que o ID seja uma STRING VÁLIDA
          // Se o backend receber número (index), ele pode rejeitar.
          alternatives: (
            originalTask.alternatives ||
            originalTask.options ||
            []
          ).map((opt, index) => ({
            ...opt,
            // PRIORIDADE MÁXIMA PARA O _id do banco
            id: opt._id || opt.id || String(index),
            text: opt.text || opt.label || "Opção sem texto",
          })),
        };
      })
      .filter((task) => task !== undefined);

    if (resolvedTasks.length === 0) {
      alert("Erro: Não foi possível carregar os detalhes das atividades.");
      setIsStarting(false);
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Payload para criar a sessão no banco
      const payload = {
        studentId: studentId,
        name: sessionName,
        taskGroupId: selectedGroup.id,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/task-notebook-session/start`,
        payload,
        config
      );

      const realSessionId = response.data.sessionId || response.data.id;

      if (!realSessionId) {
        throw new Error("O servidor não retornou o ID da sessão.");
      }

      console.log("Sessão iniciada com tarefas:", resolvedTasks);

      // Navega para a tela de execução com tudo pronto
      navigate("/sessionInit", {
        state: {
          sessionId: realSessionId,
          studentId: studentId,
          itemType: "group",
          groupName: selectedGroup.name,
          tasks: resolvedTasks,
        },
      });
    } catch (error) {
      console.error("Erro ao iniciar sessão:", error);
      alert("Erro ao iniciar. Verifique o console para detalhes.");
    } finally {
      setIsStarting(false);
    }
  };
  // --- PAGINAÇÃO E FILTROS ---
  const filteredGroups = groups.filter(
    (group) =>
      group.name && group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredGroups.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);

  const paginate = (e, pageNumber) => {
    e.preventDefault();
    setCurrentPage(pageNumber);
  };

  return (
    <div className="dashboard-container">
      <Navbar activePage="activities" />
      <main className="session-group-select-main-content">
        <div className="session-group-select-container">
          <a href="/sessionType" className="back-arrow-link">
            <img src={iconArrowLeft} alt="Voltar" className="back-arrow-icon" />
          </a>
          <div className="top-container">
            <h1>Selecione o grupo de atividade desejado</h1>

            <div
              className="search-filter-group"
              style={{ display: "flex", alignItems: "center", gap: "15px" }}
            >
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={(value) => {
                  setSearchTerm(value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar grupo..."
                onFilterClick={() => console.log("Abrir Filtro")}
              />

              <button
                onClick={handleStartSession}
                disabled={!selectedGroup || isStarting}
                style={{
                  backgroundColor: selectedGroup ? "#81C784" : "#E0E0E0",
                  color: selectedGroup ? "#FFF" : "#9E9E9E",
                  border: "none",
                  padding: "0 25px",
                  height: "52px",
                  borderRadius: "30px",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  cursor:
                    selectedGroup && !isStarting ? "pointer" : "not-allowed",
                  boxShadow: selectedGroup
                    ? "0px 4px 6px rgba(0,0,0,0.1)"
                    : "none",
                  transition: "all 0.3s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {isStarting ? "Iniciando..." : "Iniciar Sessão"}
              </button>
            </div>
          </div>

          <div className="session-group-select-card-list">
            {loading ? (
              <p style={{ textAlign: "center", color: "#666" }}>
                Carregando grupos...
              </p>
            ) : currentItems.length > 0 ? (
              currentItems.map((group) => {
                const isSelected =
                  selectedGroup && selectedGroup.id === group.id;

                return (
                  <div className="group-select-row-wrapper" key={group.id}>
                    <div
                      className="group-select-list-item-card"
                      style={{
                        cursor: "pointer",
                        border: isSelected
                          ? "2px solid #81C784"
                          : "2px solid transparent",
                        backgroundColor: isSelected ? "#F1F8E9" : "#FFF",
                        transition: "all 0.2s ease",
                      }}
                      onClick={() => handleGroupSelection(group)}
                    >
                      <img
                        src={iconDoubleCard}
                        alt="Icone Grupo"
                        className="group-select-card-icon"
                      />
                      <div className="group-select-card-info">
                        <h3>{group.name}</h3>
                        <button className="group-select-bnt-details">
                          {categoryMap[group.category] || group.category}
                        </button>
                      </div>

                      <button
                        className="select-plus-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGroupSelection(group);
                        }}
                        title={isSelected ? "Desmarcar" : "Selecionar"}
                        style={{
                          backgroundColor: isSelected
                            ? "#81C784"
                            : "transparent",
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                          transition: "background-color 0.3s ease",
                        }}
                      >
                        {isSelected ? <CheckIcon /> : <PlusIcon />}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ textAlign: "center", marginTop: "20px" }}>
                {searchTerm
                  ? "Nenhum grupo encontrado."
                  : "Nenhum grupo disponível."}
              </p>
            )}
          </div>

          {!loading && filteredGroups.length > 0 && (
            <div className="pagination-controls">
              <button
                type="button"
                className={`page-arrow ${currentPage === 1 ? "disabled" : ""}`}
                onClick={() => {
                  if (currentPage > 1) setCurrentPage(currentPage - 1);
                }}
                style={{
                  pointerEvents: currentPage === 1 ? "none" : "auto",
                  opacity: currentPage === 1 ? 0.5 : 1,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, index) => (
                <button
                  key={index + 1}
                  type="button"
                  className={`page-number ${
                    currentPage === index + 1 ? "active" : ""
                  }`}
                  onClick={(e) => paginate(e, index + 1)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {index + 1}
                </button>
              ))}

              <button
                type="button"
                className={`page-arrow ${
                  currentPage === totalPages ? "disabled" : ""
                }`}
                onClick={() => {
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                }}
                style={{
                  pointerEvents: currentPage === totalPages ? "none" : "auto",
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default SessionGroupPage;
