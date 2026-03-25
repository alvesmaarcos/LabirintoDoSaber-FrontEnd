import React, { useState, useEffect } from "react";
import "./style.css";
import axios from "axios";
import iconArrowLeft from "../../assets/images/seta_icon_esquerda.png";
import iconDoubleCard from "../../assets/images/iconDoublecard.png";
import iconSeta from "../../assets/images/seta_icon.png";
import iconActivitie from "../../assets/images/iconActivitie.png";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/NavBar/index.js";
import SearchBar from "../../components/ui/SearchBar/Search"; // Importação do SearchBar

// --- Componente DeleteModal ---
const DeleteModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-confirm">
      <div className="modal-content-confirm">
        <h3>{title || "Excluir"}</h3>
        <p>{message || "Tem certeza que deseja realizar esta ação?"}</p>
        <div className="modal-actions-confirm">
          <button className="modal-btn-confirm cancel" onClick={onClose}>Cancelar</button>
          <button className="modal-btn-confirm confirm" onClick={onConfirm}>Excluir</button>
        </div>
      </div>
    </div>
  );
};

// --- Ícone da Lixeira ---
const TrashIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 6H19L18.1245 19.133C18.0544 20.1836 17.1818 21 16.1289 21H7.87111C6.81818 21 5.94558 20.1836 5.87554 19.133L5 6Z" stroke="black" strokeWidth="2"/>
        <path d="M9 6V3H15V6" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M3 6H21" stroke="black" strokeWidth="2" strokeLinecap="round"/>
        <path d="M10 10V17" stroke="black" strokeWidth="2" strokeLinecap="round"/>
        <path d="M14 10V17" stroke="black" strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

function ManageGroupPage() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estado da Pesquisa
    const [searchTerm, setSearchTerm] = useState(""); 

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    // Estado do Modal de Detalhes do Grupo
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    // Estados para o Modal de Confirmação (Delete)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState({ type: null, id: null, message: '' }); 
    
    const categoryMap = {
        reading: "Leitura",
        writing: "Escrita",
        vocabulary: "Vocabulário",
        comprehension: "Compreensão"
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("authToken");
                if (!token) {
                    navigate("/");
                    return;
                }
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const [groupsResponse, tasksResponse] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_BASE_URL}/task-group/list-by-educator`, config),
                    axios.get(`${process.env.REACT_APP_API_BASE_URL}/task/`, config)
                ]);

                if (Array.isArray(groupsResponse.data)) setGroups(groupsResponse.data);
                if (Array.isArray(tasksResponse.data)) setAllTasks(tasksResponse.data);
                setLoading(false);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    // Resetar a paginação quando o termo de busca mudar
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // --- Controles do Modal de Detalhes ---
    const handleGroupClick = (group) => {
        setSelectedGroup(group);
        setIsGroupModalOpen(true);
    };

    const closeGroupModal = () => {
        setIsGroupModalOpen(false);
        setSelectedGroup(null);
    };

    // --- Passo 1: Solicitar Exclusão de GRUPO ---
    const requestDeleteGroup = (e, id) => {
        e.stopPropagation();
        setDeleteTarget({ 
            type: 'GROUP', 
            id: id,
            message: "Tem certeza que deseja excluir este grupo? Esta ação não pode ser desfeita."
        });
        setIsDeleteModalOpen(true);
    };

    // --- Passo 1: Solicitar Remoção de ATIVIDADE do Grupo ---
    const requestRemoveActivityFromGroup = (e, taskId) => {
        e.stopPropagation();
        
        const currentTasksCount = selectedGroup.tasksIds ? selectedGroup.tasksIds.length : 0;
        let warningMessage = "Tem certeza que deseja remover esta atividade do grupo?";

        if (currentTasksCount <= 1) {
            warningMessage = "Esta é a única atividade do grupo. Ao removê-la, o grupo também será excluído. Deseja continuar?";
        }

        setDeleteTarget({ 
            type: 'TASK_FROM_GROUP', 
            id: taskId,
            message: warningMessage
        });
        setIsDeleteModalOpen(true);
    };

    // --- Passo 2: Confirmar a Ação (Executada pelo Modal) ---
    const handleConfirmAction = async () => {
        if (!deleteTarget.type) return;

        const token = localStorage.getItem("authToken");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            // CASO 1: Deletar Grupo Inteiro
            if (deleteTarget.type === 'GROUP') {
                await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/task-group/delete/${deleteTarget.id}`, config);
                setGroups(groups.filter(group => group.id !== deleteTarget.id));
            } 
            // CASO 2: Remover Atividade de dentro do Grupo
            else if (deleteTarget.type === 'TASK_FROM_GROUP') {
                const currentTaskIds = selectedGroup.tasksIds || [];
                const newTaskIds = currentTaskIds.filter(id => id !== deleteTarget.id);

                // Se não sobrou nenhuma atividade -> Deleta o grupo
                if (newTaskIds.length === 0) {
                    await axios.delete(`${process.env.REACT_APP_API_BASE_URL}/task-group/delete/${selectedGroup.id}`, config);
                    setGroups(groups.filter(g => g.id !== selectedGroup.id));
                    setIsGroupModalOpen(false);
                    setSelectedGroup(null);
                } 
                // Se ainda tem atividades -> Atualiza o grupo
                else {
                    const payload = {
                        id: selectedGroup.id,
                        tasksIds: newTaskIds
                    };
                    await axios.put(`${process.env.REACT_APP_API_BASE_URL}/task-group/update`, payload, config);

                    const updatedGroup = { ...selectedGroup, tasksIds: newTaskIds };
                    setSelectedGroup(updatedGroup);
                    setGroups(groups.map(g => g.id === selectedGroup.id ? updatedGroup : g));
                }
            }
        } catch (error) {
            console.error("Erro na operação:", error);
            alert("Ocorreu um erro ao processar a solicitação.");
        } finally {
            setIsDeleteModalOpen(false);
            setDeleteTarget({ type: null, id: null, message: '' });
        }
    };

    const handleEditActivityInModal = () => {
        // Lógica de edição futura
    };

    const getResolvedTasksForGroup = (group) => {
        if (!group || !group.tasksIds) return [];
        return group.tasksIds
            .map(id => allTasks.find(task => task.id === id))
            .filter(Boolean);
    };

    // --- LÓGICA DE FILTRAGEM E PAGINAÇÃO ---
    const filteredGroups = groups.filter(group => 
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentGroups = filteredGroups.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);

    return (
        <div className="dashboard-container">
            <Navbar activePage="activities" />

            {/* --- MODAL DE CONFIRMAÇÃO --- */}
            <DeleteModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setIsDeleteModalOpen(false)} 
                onConfirm={handleConfirmAction} 
                title={deleteTarget.type === 'GROUP' ? "Excluir Grupo" : "Remover Atividade"}
                message={deleteTarget.message}
            />

            <main className="manage-groups-main-content">
                    <a href="/activitiesMain" className="back-arrow-link">
                        <img src={iconArrowLeft} alt="Voltar" className="back-arrow-icon" />
                    </a>
                <div className="manage-groups-container">
                    
                    {/* --- HEADER: Título (Esq) e Ações (Dir) --- */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "30px", flexWrap: "wrap", gap: "20px" }}>
                        
                        {/* Lado Esquerdo: Textos */}
                        <div className="top-container-grup">
                            <h1>Grupo de atividades</h1>
                            <h2>Gerencie os grupos de atividades</h2>
                        </div>
                        
                        {/* Lado Direito: SearchBar + Botão */}
                        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                            <SearchBar 
                                searchTerm={searchTerm} 
                                setSearchTerm={setSearchTerm} 
                                placeholder="Pesquisar..."
                                onFilterClick={() => console.log("Filtro clicado")}
                            />

                            <button
                                className="create-patient-bnt"
                                onClick={() => navigate('/GroupActivities')}
                                style={{ height: "45px" }} // Ajuste opcional para igualar altura
                            >
                                Novo Grupo
                            </button>
                        </div>
                    </div>

                    <div className="group-card-list">
                        {loading ? (
                            <p>Carregando grupos...</p>
                        ) : filteredGroups.length === 0 ? (
                            <p>Nenhum grupo encontrado.</p>
                        ) : (
                            currentGroups.map((group) => (
                                <div className="group-row-wrapper" key={group.id}>
                                    <div
                                        className="group-list-item-card"
                                        onClick={() => handleGroupClick(group)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <img src={iconDoubleCard} alt="Icone Grupo" className="group-card-icon" />
                                        <div className="group-card-info">
                                            <h3>{group.name}</h3>
                                            <button className="group-bnt-details">
                                                {categoryMap[group.category] || group.category}
                                            </button>
                                        </div>
                                        <span className="back-arrow">
                                            <img src={iconSeta} alt="seta" className="seta" />
                                        </span>
                                    </div>

                                    <button
                                        className="remove-group-btn"
                                        onClick={(e) => requestDeleteGroup(e, group.id)}
                                        title="Remover Grupo"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-controls">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>&lt;</button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={currentPage === i + 1 ? 'active' : ''}
                                    style={{ fontWeight: currentPage === i + 1 ? 'bold' : 'normal' }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>&gt;</button>
                        </div>
                    )}
                </div>
            </main>

            {/* --- MODAL DE DETALHES DO GRUPO --- */}
            {isGroupModalOpen && selectedGroup && (
                <div className="modal-overlay" onClick={closeGroupModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{selectedGroup.name}</h2>
                            <button className="modal-close-btn" onClick={closeGroupModal}>&times;</button>
                        </div>

                        <div className="modal-body">
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
                                                style={{ cursor: "pointer" }}
                                            >
                                                <img src={iconActivitie} className="activity-card-icon" alt="activity" />
                                                <div className="group-card-info">
                                                    <h3>{task.prompt?.slice(0, 40) + "..."}</h3>
                                                    <button className="group-bnt-details">
                                                        {categoryMap[task.category] || task.category}
                                                    </button>
                                                </div>
                                            </div>

                                            <button 
                                                className="remove-group-btn" 
                                                onClick={(e) => requestRemoveActivityFromGroup(e, task.id)}
                                            >
                                                <TrashIcon />
                                            </button>
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

export default ManageGroupPage;