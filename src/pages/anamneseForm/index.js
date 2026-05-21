import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./style.css";
import Navbar from "../../components/ui/NavBar/index.js";
import iconBack from "../../assets/images/seta_icon_esquerda.png";
import iconAdd from "../../assets/images/add.png";
import iconSave from "../../assets/images/relatorio-icon.png";
import iconTrash from "../../assets/images/trash.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const TYPE_LABELS = {
  Descriptive: "Campo Descritivo (Texto)",
  MultipleChoice: "Múltipla Escolha",
  Checkbox: "Caixas de Seleção",
  FileUpload: "Envio de Arquivo",
};

const OPTION_TYPES = ["MultipleChoice", "Checkbox"];

let localIdCounter = 0;
function newLocalId() {
  return `local_${++localIdCounter}`;
}

function AnamneseFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const templateId = location.state?.templateId;
  const isEditMode = Boolean(templateId);

  const [pageTitle, setPageTitle] = useState(
    isEditMode ? "" : "Criar formulário"
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadTemplate = useCallback(async () => {
    try {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get(
        `${API_BASE_URL}/anamnese/templates/${templateId}`,
        config
      );
      setPageTitle(data.title);
      setTitle(data.title);
      setDescription(data.description || "");
      setQuestions(
        (data.questions || []).map((q) => ({
          _localId: newLocalId(),
          text: q.text,
          type: q.type,
          required: q.required,
          options: (q.options || []).map((opt) => ({
            _localId: newLocalId(),
            text: opt.text,
          })),
        }))
      );
    } catch (error) {
      console.error("Erro ao carregar template:", error);
      setErrorMsg("Erro ao carregar o template.");
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    if (isEditMode) loadTemplate();
  }, [isEditMode, loadTemplate]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        _localId: newLocalId(),
        text: "",
        type: "Descriptive",
        required: false,
        options: [],
      },
    ]);
  };

  const removeQuestion = (localId) => {
    setQuestions((prev) => prev.filter((q) => q._localId !== localId));
  };

  const updateQuestion = (localId, field, value) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q._localId !== localId) return q;
        const updated = { ...q, [field]: value };
        if (field === "type" && !OPTION_TYPES.includes(value)) {
          updated.options = [];
        }
        return updated;
      })
    );
  };

  const addOption = (questionLocalId) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q._localId !== questionLocalId) return q;
        return {
          ...q,
          options: [...q.options, { _localId: newLocalId(), text: "" }],
        };
      })
    );
  };

  const updateOption = (questionLocalId, optLocalId, text) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q._localId !== questionLocalId) return q;
        return {
          ...q,
          options: q.options.map((opt) =>
            opt._localId === optLocalId ? { ...opt, text } : opt
          ),
        };
      })
    );
  };

  const removeOption = (questionLocalId, optLocalId) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q._localId !== questionLocalId) return q;
        return {
          ...q,
          options: q.options.filter((opt) => opt._localId !== optLocalId),
        };
      })
    );
  };

  const validate = () => {
    if (!title.trim()) {
      setErrorMsg("O título do formulário é obrigatório.");
      return false;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setErrorMsg(`A pergunta ${i + 1} está sem texto.`);
        return false;
      }
      if (OPTION_TYPES.includes(q.type)) {
        const filledOpts = q.options.filter((o) => o.text.trim());
        if (filledOpts.length < 2) {
          setErrorMsg(
            `A pergunta ${i + 1} (${TYPE_LABELS[q.type]}) precisa de pelo menos 2 opções.`
          );
          return false;
        }
      }
    }
    return true;
  };

  const buildPayload = () => ({
    title: title.trim(),
    description: description.trim() || undefined,
    questions: questions.map((q) => {
      const base = { text: q.text.trim(), type: q.type, required: q.required };
      if (OPTION_TYPES.includes(q.type)) {
        base.options = q.options
          .filter((o) => o.text.trim())
          .map((o) => ({ text: o.text.trim() }));
      }
      return base;
    }),
  });

  const handleSave = async () => {
    setErrorMsg("");
    if (!validate()) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      const payload = buildPayload();

      if (isEditMode) {
        await axios.put(
          `${API_BASE_URL}/anamnese/templates/${templateId}`,
          payload,
          config
        );
      } else {
        await axios.post(`${API_BASE_URL}/anamnese/templates`, payload, config);
      }
      navigate("/anamnese");
    } catch (error) {
      const errCode = error.response?.data?.error;
      if (errCode === "TEMPLATE_HAS_RESPONSES") {
        setErrorMsg(
          "Este modelo já possui respostas vinculadas e não pode ser editado."
        );
      } else {
        setErrorMsg("Erro ao salvar o formulário. Tente novamente.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Tem certeza que deseja excluir o modelo "${title}"? Esta ação não pode ser desfeita.`
      )
    )
      return;
    try {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(
        `${API_BASE_URL}/anamnese/templates/${templateId}`,
        config
      );
      navigate("/anamnese");
    } catch (error) {
      const errCode = error.response?.data?.error;
      if (errCode === "TEMPLATE_HAS_RESPONSES") {
        setErrorMsg(
          "Este modelo já possui respostas vinculadas e não pode ser excluído."
        );
      } else {
        setErrorMsg("Erro ao excluir o formulário. Tente novamente.");
      }
    }
  };

  if (loading) {
    return (
      <div className="anamnese-form-page">
        <Navbar activePage="anamnese" />
        <div className="anamnese-form-content">
          <p className="anamnese-form-loading">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="anamnese-form-page">
      <Navbar activePage="anamnese" />

      <div className="anamnese-form-content">
        {/* Page header */}
        <div className="anamnese-form-topbar">
          <div className="anamnese-form-topbar-left">
            <button
              className="anamnese-form-back-btn"
              onClick={() => navigate("/anamnese")}
            >
              <img src={iconBack} alt="Voltar" />
            </button>
            <h1 className="anamnese-form-page-title">{pageTitle}</h1>
          </div>
          <div className="anamnese-form-topbar-right">
            {isEditMode && (
              <button
                className="anamnese-form-delete-btn"
                onClick={handleDelete}
              >
                <img src={iconTrash} alt="Excluir" />
                Excluir Modelo
              </button>
            )}
            <button
              className="anamnese-form-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              <img src={iconSave} alt="Salvar" />
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>

        {errorMsg && <div className="anamnese-form-error">{errorMsg}</div>}

        {/* Template info section */}
        <div className="anamnese-form-section">
          <h2 className="anamnese-form-section-title">Informações do Modelo</h2>
          <div className="anamnese-form-field">
            <label className="anamnese-form-label">
              Título do Formulário *
            </label>
            <input
              type="text"
              className="anamnese-form-input"
              placeholder="Ex: Anamnese Autismo Infantil"
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="anamnese-form-field">
            <label className="anamnese-form-label">Descrição (opcional)</label>
            <textarea
              className="anamnese-form-textarea"
              placeholder="Descreva o objetivo deste formulário..."
              value={description}
              maxLength={1000}
              rows={4}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Questions section */}
        <div className="anamnese-form-section">
          <div className="anamnese-questions-header">
            <h2 className="anamnese-form-section-title">
              Perguntas ({questions.length})
            </h2>
            <button className="anamnese-add-question-btn" onClick={addQuestion}>
              <img src={iconAdd} alt="Adicionar" />
              Adicionar Pergunta
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="anamnese-questions-empty">
              <p>Nenhuma pergunta adicionada</p>
              <span>Clique em "Adicionar Pergunta" para começar</span>
            </div>
          ) : (
            <div className="anamnese-questions-list">
              {questions.map((q, index) => (
                <div key={q._localId} className="anamnese-question-card">
                  <div className="anamnese-question-top">
                    <span className="anamnese-question-label">
                      Pergunta {index + 1}
                    </span>
                    <button
                      className="anamnese-remove-question-btn"
                      onClick={() => removeQuestion(q._localId)}
                      title="Remover pergunta"
                    >
                      <img src={iconTrash} alt="Remover" />
                    </button>
                  </div>

                  <input
                    type="text"
                    className="anamnese-form-input"
                    placeholder="Digite a pergunta..."
                    value={q.text}
                    onChange={(e) =>
                      updateQuestion(q._localId, "text", e.target.value)
                    }
                  />

                  <div className="anamnese-question-controls">
                    <div className="anamnese-question-type-wrap">
                      <label className="anamnese-form-label">
                        Tipo de Resposta
                      </label>
                      <select
                        className="anamnese-form-select"
                        value={q.type}
                        onChange={(e) =>
                          updateQuestion(q._localId, "type", e.target.value)
                        }
                      >
                        {Object.entries(TYPE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="anamnese-required-label">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) =>
                          updateQuestion(
                            q._localId,
                            "required",
                            e.target.checked
                          )
                        }
                      />
                      Resposta obrigatória
                    </label>
                  </div>

                  {q.type === "Descriptive" && (
                    <textarea
                      className="anamnese-form-textarea anamnese-preview-textarea"
                      placeholder="O profissional preencherá este campo com texto livre..."
                      disabled
                      rows={2}
                    />
                  )}

                  {OPTION_TYPES.includes(q.type) && (
                    <div className="anamnese-options-section">
                      <label className="anamnese-form-label">
                        {q.type === "MultipleChoice"
                          ? "Opções de Seleção"
                          : "Opções de Marcação"}
                      </label>
                      <div className="anamnese-options-list">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={opt._localId}
                            className="anamnese-option-row"
                          >
                            <span className="anamnese-option-num">
                              {optIdx + 1}.
                            </span>
                            <input
                              type="text"
                              className="anamnese-form-input anamnese-option-input"
                              placeholder={`Opção ${optIdx + 1}`}
                              value={opt.text}
                              onChange={(e) =>
                                updateOption(
                                  q._localId,
                                  opt._localId,
                                  e.target.value
                                )
                              }
                            />
                            <button
                              className="anamnese-remove-option-btn"
                              onClick={() =>
                                removeOption(q._localId, opt._localId)
                              }
                              title="Remover opção"
                            >
                              <img src={iconTrash} alt="Remover" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        className="anamnese-add-option-btn"
                        onClick={() => addOption(q._localId)}
                      >
                        + Adicionar Opção
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnamneseFormPage;
