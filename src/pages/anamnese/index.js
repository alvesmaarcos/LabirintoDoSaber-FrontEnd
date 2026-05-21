import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./style.css";
import Navbar from "../../components/ui/NavBar/index.js";
import iconDocumento from "../../assets/images/icon-documento.png";
import iconEdit from "../../assets/images/edit.png";
import iconTrash from "../../assets/images/trash.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ITEMS_PER_PAGE = 4;

function formatDate(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const DeleteModal = ({ target, onClose, onConfirm }) => {
  if (!target) return null;
  return (
    <div className="anamnese-modal-overlay" onClick={onClose}>
      <div className="anamnese-modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="anamnese-modal-title">Confirmar Exclusão</h2>
        <p className="anamnese-modal-desc">
          Tem certeza que deseja excluir o modelo "{target.title}"? Esta ação não
          pode ser desfeita.
        </p>
        <div className="anamnese-modal-actions">
          <button className="anamnese-modal-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="anamnese-modal-confirm" onClick={onConfirm}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

function AnamnesePage() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${API_BASE_URL}/anamnese/templates`, config);
      setTemplates(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar templates de anamnese:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = templates.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const openDeleteModal = (template) => {
    setDeleteError("");
    setDeleteTarget({ id: template.id, title: template.title });
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(
        `${API_BASE_URL}/anamnese/templates/${deleteTarget.id}`,
        config
      );
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      closeDeleteModal();
    } catch (error) {
      const errCode = error.response?.data?.error;
      if (errCode === "TEMPLATE_HAS_RESPONSES") {
        setDeleteError(
          "Este modelo já possui respostas vinculadas e não pode ser excluído."
        );
      } else {
        setDeleteError("Erro ao excluir o modelo. Tente novamente.");
      }
    }
  };

  return (
    <div className="anamnese-page">
      <Navbar activePage="anamnese" />

      <div className="anamnese-content">
        <div className="anamnese-header-row">
          <div>
            <h1 className="anamnese-title">Modelos de Anamnese</h1>
            <p className="anamnese-subtitle">
              Crie e gerencie seus próprios formulários personalizados
            </p>
          </div>
          <button
            className="anamnese-create-btn"
            onClick={() => navigate("/anamnese/criar")}
          >
            + Criar novo modelo
          </button>
        </div>

        <div className="anamnese-search-wrapper">
          <input
            type="text"
            className="anamnese-search-input"
            placeholder="Buscar modelo..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {loading ? (
          <p className="anamnese-empty">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="anamnese-empty">Nenhum modelo encontrado.</p>
        ) : (
          <>
            <div className="anamnese-grid">
              {paginated.map((template) => (
                <div key={template.id} className="anamnese-card">
                  <div className="anamnese-card-top">
                    <img
                      src={iconDocumento}
                      alt="Documento"
                      className="anamnese-card-icon"
                    />
                    <div className="anamnese-card-info">
                      <h3 className="anamnese-card-title">{template.title}</h3>
                      {template.description && (
                        <p className="anamnese-card-desc">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="anamnese-card-footer">
                    <div className="anamnese-card-meta">
                      <span>
                        <span className="meta-label">Perguntas</span>
                        <br />
                        <strong>{template.questions?.length ?? 0}</strong>
                      </span>
                      <span>
                        <span className="meta-label">Última Edição</span>
                        <br />
                        <strong>{formatDate(template.createdAt)}</strong>
                      </span>
                    </div>
                    <div className="anamnese-card-actions">
                      <button
                        className="anamnese-icon-btn"
                        title="Editar"
                        onClick={() =>
                          navigate("/anamnese/editar", {
                            state: { templateId: template.id },
                          })
                        }
                      >
                        <img src={iconEdit} alt="Editar" />
                      </button>
                      <button
                        className="anamnese-icon-btn anamnese-icon-btn--danger"
                        title="Excluir"
                        onClick={() => openDeleteModal(template)}
                      >
                        <img src={iconTrash} alt="Excluir" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="anamnese-pagination">
                <button
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`page-btn ${currentPage === page ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  className="page-btn"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  &gt;
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <DeleteModal
        target={deleteTarget}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
      />
      {deleteError && (
        <div className="anamnese-delete-error">{deleteError}</div>
      )}
    </div>
  );
}

export default AnamnesePage;
