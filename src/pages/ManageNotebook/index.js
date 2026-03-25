import React, { useState, useEffect } from "react";
import axios from "axios";
import "./style.css";
import iconArrowLeft from "../../assets/images/seta_icon_esquerda.png";
import iconCard from "../../assets/images/caderneta.png";
import iconSeta from "../../assets/images/seta_icon.png";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/NavBar/index.js";
import SearchBar from "../../components/ui/SearchBar/Search";

// --- 1. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO ---
const DeleteModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="notebook-manager-modal-overlay">
      <div className="notebook-manager-modal-content">
        <h3>Excluir Caderno</h3>
        <p>
          Tem certeza que deseja excluir este caderno? Esta ação não pode ser
          desfeita e excluirá as tarefas associadas.
        </p>
        <div className="notebook-manager-modal-actions">
          <button
            className="notebook-manager-modal-btn cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="notebook-manager-modal-btn confirm"
            onClick={onConfirm}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 2. NOVO MODAL DE AVISO (Sucesso/Erro) ---
const WarningModal = ({ isOpen, onClose, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="notebook-manager-modal-overlay">
      <div className="notebook-manager-modal-content">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="notebook-manager-modal-actions">
          <button
            className="notebook-manager-modal-btn confirm"
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// --- ÍCONE LIXEIRA ---
const TrashIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 6H19L18.1245 19.133C18.0544 20.1836 17.1818 21 16.1289 21H7.87111C6.81818 21 5.94558 20.1836 5.87554 19.133L5 6Z"
      stroke="black"
      strokeWidth="2"
    />
    <path
      d="M9 6V3H15V6"
      stroke="black"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M3 6H21" stroke="black" strokeWidth="2" strokeLinecap="round" />
    <path d="M10 10V17" stroke="black" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 10V17" stroke="black" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function ManageNotebookPage() {
  const navigate = useNavigate();

  // --- ESTADOS ---
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados dos Modais
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [notebookToDelete, setNotebookToDelete] = useState(null);

  // Estado do Modal de Aviso (Substitui o Alert)
  const [warningModal, setWarningModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const categoryMap = {
    reading: "Leitura",
    writing: "Escrita",
    vocabulary: "Vocabulário",
    comprehension: "Compreensão",
  };

  // --- BUSCAR DADOS ---
  useEffect(() => {
    fetchNotebooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchNotebooks = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/");
        return;
      }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/task-notebook/`,
        config
      );

      if (Array.isArray(response.data)) {
        setNotebooks(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar cadernos:", error);
      setLoading(false);
    }
  };

  const handleNotebookClick = (id) => {
    navigate("/NotebookDetails", { state: { notebookId: id } });
  };

  // --- LÓGICA DE EXCLUSÃO ---
  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    setNotebookToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!notebookToDelete) return;

    try {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/task-notebook/delete/${notebookToDelete}`,
        config
      );

      setNotebooks(
        notebooks.filter((item) => item.notebook.id !== notebookToDelete)
      );

      // Fecha modal de delete
      setIsDeleteModalOpen(false);
      setNotebookToDelete(null);

      // Abre modal de Sucesso (Substituindo Alert)
      setWarningModal({
        isOpen: true,
        title: "Sucesso",
        message: "Caderno excluído com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao excluir:", error);

      // Fecha modal de delete e Abre modal de Erro (Substituindo Alert)
      setIsDeleteModalOpen(false);
      setWarningModal({
        isOpen: true,
        title: "Erro",
        message: "Não foi possível excluir o caderno. Tente novamente.",
      });
    }
  };

  const closeWarningModal = () => {
    setWarningModal({ ...warningModal, isOpen: false });
  };

  // --- FILTRO E PAGINAÇÃO ---
  const filteredNotebooks = notebooks.filter((item) => {
    const description = item.notebook.description || "";
    return description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotebooks = filteredNotebooks.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredNotebooks.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  return (
    <div className="dashboard-container">
      {/* Modal de Confirmação (Sim/Não) */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
      />

      {/* Modal de Aviso (Sucesso/Erro) */}
      <WarningModal
        isOpen={warningModal.isOpen}
        onClose={closeWarningModal}
        title={warningModal.title}
        message={warningModal.message}
      />

      <Navbar activePage="activities" />

      <main className="manage-notebook-main-content">
        <a href="/activitiesMain" className="back-arrow-link">
          <img src={iconArrowLeft} alt="Voltar" className="back-arrow-icon" />
        </a>
        <div className="manage-notebook-container">
          {/* Header */}
          <div
            className="manage-notebook-header-top"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "30px",
              flexWrap: "wrap",
              gap: "20px",
            }}
          >
            <div>
              <h1>Gerenciar cadernos</h1>
              <h2>Gerencie os cadernos</h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <SearchBar
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                placeholder="Pesquisar..."
                onFilterClick={() => console.log("Filtro clicado")}
              />

              <button
                className="create-patient-bnt"
                onClick={() => navigate("/addNotebook")}
                style={{ height: "45px" }}
              >
                Novo Caderno
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="notebook-card-list">
            {loading ? (
              <p>Carregando cadernos...</p>
            ) : filteredNotebooks.length === 0 ? (
              <p>Nenhum caderno encontrado.</p>
            ) : (
              currentNotebooks.map((item) => {
                const notebook = item.notebook;
                return (
                  <div className="notebook-row-wrapper" key={notebook.id}>
                    <div
                      className="notebook-list-item-card"
                      onClick={() => handleNotebookClick(notebook.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={iconCard}
                        alt="Avatar"
                        className="notebook-card-icon"
                      />
                      <div className="notebook-card-info">
                        <h3>
                          {notebook.description || "Caderno sem descrição"}
                        </h3>
                        <button className="notebook-bnt-details">
                          {categoryMap[notebook.category] || notebook.category}
                        </button>
                      </div>
                      <span className="back-arrow">
                        <img src={iconSeta} alt="seta" className="seta" />
                      </span>
                    </div>
                    <button
                      className="remove-notebook-btn"
                      onClick={(e) => handleDeleteClick(e, notebook.id)}
                      title="Remover CADERNO"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="page-arrow"
                onClick={prevPage}
                disabled={currentPage === 1}
                style={{
                  background: "none",
                  border: "none",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  className={`page-number ${
                    currentPage === i + 1 ? "active" : ""
                  }`}
                  onClick={() => paginate(i + 1)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: currentPage === i + 1 ? "bold" : "normal",
                  }}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className="page-arrow"
                onClick={nextPage}
                disabled={currentPage === totalPages}
                style={{
                  background: "none",
                  border: "none",
                  cursor:
                    currentPage === totalPages ? "not-allowed" : "pointer",
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

export default ManageNotebookPage;
