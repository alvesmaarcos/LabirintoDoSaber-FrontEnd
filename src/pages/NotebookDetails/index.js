import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style.css";
import iconArrowLeft from "../../assets/images/seta_icon_esquerda.png";
import iconDoubleCard from "../../assets/images/iconDoublecard.png";
import iconActivitie from "../../assets/images/iconActivitie.png";
import iconSeta from "../../assets/images/seta_icon.png";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/ui/NavBar/index.js";

// --- ESTILOS INJETADOS (Separados por tamanho) ---
const modalStyles = `
    /* OVERLAY COMUM */
    .notebook-modal-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex; justify-content: center; align-items: center; z-index: 9999;
    }

    /* --- ESTILOS PARA MODAL PEQUENO (Confirmação/Aviso) --- */
    .notebook-small-modal-content {
        background: white; padding: 2rem; border-radius: 8px;
        width: 90%; max-width: 450px; /* Tamanho compacto */
        text-align: center;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    .notebook-small-modal-actions {
        display: flex; justify-content: center; gap: 1rem; margin-top: 1.5rem;
    }
    .notebook-small-modal-btn {
        padding: 0.6rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;
    }
    .notebook-small-modal-btn.cancel { background-color: #f0f0f0; color: #333; border: 1px solid #ccc; }
    .notebook-small-modal-btn.confirm { background-color: #008D85; color: white; }

    /* --- ESTILOS PARA MODAL GRANDE (Detalhes/Lista) --- */
    .notebook-large-modal-content {
        background: white; padding: 2rem; border-radius: 8px;
        width: 95%; max-width: 800px; /* Tamanho LARGO para a lista */
        text-align: center;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }
    .notebook-large-modal-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;
    }
    .notebook-large-modal-title {
        margin: 0; font-size: 1.5rem; color: #333;
    }
    .notebook-large-modal-close-btn { 
        background: none; border: none; font-size: 2rem; cursor: pointer; color: #666; 
    }
    .notebook-large-modal-body-scroll {
        max-height: 70vh; overflow-y: auto; text-align: left; padding-right: 5px;
    }
`;

// --- 1. MODAL DE CONFIRMAÇÃO (Usa estilos SMALL) ---
const DeleteModal = ({ isOpen, onClose, onConfirm, message }) => {
    if (!isOpen) return null;
  
    return (
      <div className="notebook-modal-overlay">
        <div className="notebook-small-modal-content">
          <h3 style={{ marginBottom: '10px' }}>Confirmação</h3>
          <p style={{ color: '#555' }}>{message || "Tem certeza que deseja realizar esta ação?"}</p>
          <div className="notebook-small-modal-actions">
            <button className="notebook-small-modal-btn cancel" onClick={onClose}>Cancelar</button>
            <button className="notebook-small-modal-btn confirm" onClick={onConfirm}>Confirmar</button>
          </div>
        </div>
      </div>
    );
};

// --- 2. MODAL DE AVISO (Usa estilos SMALL) ---
const WarningModal = ({ isOpen, onClose, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="notebook-modal-overlay">
            <div className="notebook-small-modal-content">
                <h3 style={{ marginBottom: '10px' }}>{title}</h3>
                <p style={{ color: '#555' }}>{message}</p>
                <div className="notebook-small-modal-actions">
                    <button className="notebook-small-modal-btn confirm" onClick={onClose}>OK</button>
                </div>
            </div>
        </div>
    );
};

// --- ÍCONE LIXEIRA ---
const TrashIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 6H19L18.1245 19.133C18.0544 20.1836 17.1818 21 16.1289 21H7.87111C6.81818 21 5.94558 20.1836 5.87554 19.133L5 6Z" stroke="black" strokeWidth="2"/>
        <path d="M9 6V3H15V6" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M3 6H21" stroke="black" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 10V17" stroke="black" strokeWidth="2" strokeLinecap="round"/>
        <path d="M14 10V17" stroke="black" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

function NotebookDetailsPage() {
    const navigate = useNavigate();
    const location = useLocation();

    // ID do caderno vindo da navegação
    const { notebookId } = location.state || {};

    // --- ESTADOS DE DADOS ---
    const [notebookName, setNotebookName] = useState("Carregando...");
    const [taskGroups, setTaskGroups] = useState([]); 
    const [allTasks, setAllTasks] = useState([]); 
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DE UI (MODAIS) ---
    // 1. Modal de Detalhes do Grupo
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    // 2. Modal de Confirmação (Delete)
    const [deleteModalState, setDeleteModalState] = useState({
        isOpen: false,
        groupId: null,
        message: ""
    });

    // 3. Modal de Aviso (Sucesso/Erro)
    const [warningModal, setWarningModal] = useState({ 
        isOpen: false, 
        title: "", 
        message: "", 
        onCloseAction: null
    });

    const categoryMap = {
        'reading': 'Leitura',
        'writing': 'Escrita',
        'vocabulary': 'Vocabulário',
        'comprehension': 'Compreensão'
    };

    // --- BUSCAR DADOS ---
    useEffect(() => {
        const fetchData = async () => {
            if (!notebookId) {
                alert("Erro: ID do caderno não informado.");
                navigate('/ManageNotebook');
                return;
            }

            try {
                const token = localStorage.getItem('authToken');
                const config = { headers: { Authorization: `Bearer ${token}` } };

                const [notebooksResponse, tasksResponse] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_BASE_URL}/task-notebook/`, config),
                    axios.get(`${process.env.REACT_APP_API_BASE_URL}/task/`, config)
                ]);
                
                if (Array.isArray(tasksResponse.data)) {
                    setAllTasks(tasksResponse.data);
                }

                const allNotebooks = notebooksResponse.data;
                const foundItem = allNotebooks.find(item => item.notebook.id === notebookId);

                if (foundItem) {
                    setNotebookName(foundItem.notebook.description || "Sem descrição");
                    setTaskGroups(foundItem.taskGroups || []);
                } else {
                    setNotebookName("Caderno não encontrado");
                }

                setLoading(false);

            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, [notebookId, navigate]);


    // --- LÓGICA DO MODAL DE DETALHES ---
    const handleGroupClick = (group) => {
        setSelectedGroup(group);
        setIsDetailsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedGroup(null);
    };

    const getResolvedTasksForGroup = (group) => {
        if (!group || !group.tasksIds) return [];
        return group.tasksIds
            .map(id => allTasks.find(task => task.id === id))
            .filter(Boolean);
    };

    const handleEditActivityInModal = () => {
        console.log("Editar atividade clicada.");
    };

    // --- LÓGICA DE EXCLUSÃO ---
    const requestRemoveGroup = (e, groupIdToRemove) => {
        e.stopPropagation();
        
        const remainingGroups = taskGroups.filter(group => group.id !== groupIdToRemove);
        let msg = "Tem certeza que deseja remover este grupo do caderno?";
        
        if (remainingGroups.length === 0) {
            msg = "ATENÇÃO: Este é o único grupo do caderno. Ao removê-lo, o CADERNO INTEIRO será excluído. Deseja continuar?";
        }

        setDeleteModalState({
            isOpen: true,
            groupId: groupIdToRemove,
            message: msg
        });
    };

    const confirmRemoveGroup = async () => {
        const groupIdToRemove = deleteModalState.groupId;
        if (!groupIdToRemove) return;

        const token = localStorage.getItem('authToken');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const remainingGroups = taskGroups.filter(group => group.id !== groupIdToRemove);
        const remainingGroupIds = remainingGroups.map(group => group.id);

        try {
            // CENÁRIO 1: Caderno Vazio -> Deletar Caderno
            if (remainingGroups.length === 0) {
                await axios.delete(
                    `${process.env.REACT_APP_API_BASE_URL}/task-notebook/delete/${notebookId}`,
                    config
                );

                setDeleteModalState({ isOpen: false, groupId: null, message: "" });
                setWarningModal({
                    isOpen: true,
                    title: "Caderno Excluído",
                    message: "O caderno foi excluído pois ficou sem grupos.",
                    onCloseAction: () => navigate('/ManageNotebook')
                });
            } 
            // CENÁRIO 2: Atualizar Caderno
            else {
                const payload = {
                    taskNotebookId: notebookId,
                    taskGroupsIds: remainingGroupIds 
                };

                await axios.put(
                    `${process.env.REACT_APP_API_BASE_URL}/task-notebook/update`,
                    payload,
                    config
                );

                setTaskGroups(remainingGroups);
                
                setDeleteModalState({ isOpen: false, groupId: null, message: "" });
                setWarningModal({
                    isOpen: true,
                    title: "Sucesso",
                    message: "Grupo removido com sucesso!",
                    onCloseAction: null
                });
            }
        } catch (error) {
            console.error("Erro ao remover grupo:", error);
            setDeleteModalState({ isOpen: false, groupId: null, message: "" });
            setWarningModal({
                isOpen: true,
                title: "Erro",
                message: "Ocorreu um erro ao tentar realizar a operação.",
                onCloseAction: null
            });
        }
    };

    const handleCloseWarning = () => {
        const action = warningModal.onCloseAction;
        setWarningModal({ ...warningModal, isOpen: false });
        if (action) action();
    };

    return (
        <div className="dashboard-container">
            {/* INJEÇÃO DO CSS ESPECÍFICO */}
            <style>{modalStyles}</style>

            <Navbar activePage="activities" />

            {/* --- MODAL DE CONFIRMAÇÃO (DELETE) - USA STYLE SMALL --- */}
            <DeleteModal 
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ ...deleteModalState, isOpen: false })}
                onConfirm={confirmRemoveGroup}
                message={deleteModalState.message}
            />

            {/* --- MODAL DE AVISO (SUCESSO/ERRO) - USA STYLE SMALL --- */}
            <WarningModal 
                isOpen={warningModal.isOpen}
                onClose={handleCloseWarning}
                title={warningModal.title}
                message={warningModal.message}
            />

            <main className="notebook-details-main-content">
                <a href="/ManageNotebook" className="back-arrow-link">
                    <img src={iconArrowLeft} alt="Voltar" className="back-arrow-icon" />
                </a>
                <div className="notebook-details-container">
                    <div className="top-container">
                        <h1>Caderno: {notebookName}</h1>
                        <button 
                            className="add-group-btn" 
                            onClick={() => navigate('/GroupSelect', { 
                                state: { 
                                    notebookId: notebookId, 
                                    currentGroupIds: taskGroups.map(g => g.id) 
                                } 
                            })}
                        >
                            Adicionar novo grupo
                        </button>
                    </div>

                    <div className="details-activity-list">
                        {loading ? (
                            <p>Carregando...</p>
                        ) : taskGroups.length === 0 ? (
                            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                <p>Nenhum grupo encontrado neste caderno.</p>
                            </div>
                        ) : (
                            taskGroups.map((group) => (
                                <div className="activity-details-row-wrapper" key={group.id}>
                                    <div 
                                        className="activity-details-list-item-card" 
                                        onClick={() => handleGroupClick(group)} 
                                        style={{ cursor: "pointer" }}
                                    >
                                        <img src={iconDoubleCard} alt="icone" className="activity-details-card-icon" />
                                        <div className="activity-details-card-info">
                                            <h3>{group.name || "Grupo sem nome"}</h3>
                                            <button className="activity-details-bnt-details">
                                                {categoryMap[group.category] || group.category}
                                            </button>
                                        </div>
                                        
                                        <span className="back-arrow">
                                            <img src={iconSeta} alt="seta" className="seta" />
                                        </span>
                                    </div>
                                    <button 
                                        className="remove-activity-btn" 
                                        onClick={(e) => requestRemoveGroup(e, group.id)} 
                                        title="Remover Grupo do Caderno"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* --- MODAL DE DETALHES DO GRUPO (USA STYLE LARGE) --- */}
            {isDetailsModalOpen && selectedGroup && (
                <div className="notebook-modal-overlay" onClick={closeDetailsModal}>
                    <div className="notebook-large-modal-content" onClick={(e) => e.stopPropagation()}>
                        
                        <div className="notebook-large-modal-header">
                            <h2 className="notebook-large-modal-title">{selectedGroup.name}</h2>
                            <button className="notebook-large-modal-close-btn" onClick={closeDetailsModal}>&times;</button>
                        </div>

                        <div className="notebook-large-modal-body-scroll">
                            <p style={{ color: "#666", marginBottom: "15px" }}>
                                Categoria: {categoryMap[selectedGroup.category] || selectedGroup.category}
                            </p>

                            <div className="activity-card-list">
                                {getResolvedTasksForGroup(selectedGroup).length > 0 ? (
                                    getResolvedTasksForGroup(selectedGroup).map((task) => (
                                        <div key={task.id} className="group-row-wrapper modal-activity-row">
                                            <div
                                                className="group-list-item-card modal-group-task-card"
                                                onClick={handleEditActivityInModal}
                                                style={{ cursor: "pointer", width: "100%" }}
                                            >
                                                <img src={iconActivitie} alt="icone atividade" className="activity-card-icon" />
                                                <div className="group-card-info">
                                                    <h3>{task.prompt ? (task.prompt.slice(0, 40) + "...") : "Tarefa sem título"}</h3>
                                                    <button className="group-bnt-details">
                                                        {categoryMap[task.category] || task.category}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>Este grupo não possui atividades.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotebookDetailsPage;