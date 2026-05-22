import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./style.css";
import Navbar from "../../components/ui/NavBar/index.js";
import iconBack from "../../assets/images/seta_icon_esquerda.png";
import iconSave from "../../assets/images/icon-salvar.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function FileUploadField({ questionId, value, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadError("");
    setUploading(true);
    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        `${API_BASE_URL}/anamnese/responses/upload-file`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      onUploaded(res.data.url);
    } catch (err) {
      const code = err.response?.data?.error;
      setUploadError(
        code === "FILE_REQUIRED"
          ? "Nenhum arquivo enviado."
          : "Erro ao fazer upload. Tente novamente."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="ar-file-upload">
      <label className="ar-file-label">
        <input
          type="file"
          className="ar-file-input-hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <span className="ar-file-btn">
          {uploading ? "Enviando..." : "Selecionar arquivo"}
        </span>
      </label>
      {value && !uploading && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="ar-file-uploaded-link"
        >
          Arquivo enviado — ver
        </a>
      )}
      {uploadError && <span className="ar-file-error">{uploadError}</span>}
    </div>
  );
}

function AnamneseResponder() {
  const navigate = useNavigate();
  const location = useLocation();
  const { templateId, studentId, responseId } = location.state || {};

  const [template, setTemplate] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = useCallback(async () => {
    if (!templateId || !studentId) {
      navigate(-1);
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const requests = [axios.get(`${API_BASE_URL}/anamnese/templates/${templateId}`, config)];
      if (responseId) {
        requests.push(
          axios.get(`${API_BASE_URL}/anamnese/responses/${responseId}`, config).catch(() => ({ data: null }))
        );
      }

      const [templateRes, responseRes] = await Promise.all(requests);
      const tmpl = templateRes.data;
      setTemplate(tmpl);

      if (responseRes?.data) {
        const initial = {};
        (responseRes.data.answers || []).forEach((a) => {
          if (a.questionType === "Descriptive") initial[a.questionId] = a.textValue || "";
          else if (a.questionType === "MultipleChoice") initial[a.questionId] = a.selectedOptionId || null;
          else if (a.questionType === "Checkbox") initial[a.questionId] = a.selectedOptionIds || [];
          else if (a.questionType === "FileUpload") initial[a.questionId] = a.fileUrl || "";
        });
        setFormValues(initial);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setErrorMsg("Erro ao carregar o formulário.");
    } finally {
      setLoading(false);
    }
  }, [templateId, studentId, responseId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const setFormValue = (questionId, value) => {
    setFormValues((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleCheckbox = (questionId, optionId, checked) => {
    setFormValues((prev) => {
      const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
      const next = checked
        ? [...current, optionId]
        : current.filter((id) => id !== optionId);
      return { ...prev, [questionId]: next };
    });
  };

  const validate = () => {
    const required = (template?.questions || []).filter((q) => q.required);
    for (const q of required) {
      const val = formValues[q.id];
      if (q.type === "Descriptive" && (!val || !String(val).trim())) {
        return `O campo "${q.text}" é obrigatório.`;
      }
      if (q.type === "MultipleChoice" && !val) {
        return `Selecione uma opção para: "${q.text}".`;
      }
      if (q.type === "Checkbox" && (!Array.isArray(val) || val.length === 0)) {
        return `Selecione ao menos uma opção para: "${q.text}".`;
      }
      if (q.type === "FileUpload" && (!val || !String(val).trim())) {
        return `Forneça a URL do arquivo para: "${q.text}".`;
      }
    }
    return null;
  };

  const buildAnswers = () => {
    return (template?.questions || [])
      .filter((q) => {
        const val = formValues[q.id];
        if (val === undefined || val === null || val === "") return false;
        if (q.type === "Checkbox" && (!Array.isArray(val) || val.length === 0)) return false;
        return true;
      })
      .map((q) => {
        const val = formValues[q.id];
        const base = { questionId: q.id };
        if (q.type === "Descriptive") return { ...base, textValue: val };
        if (q.type === "MultipleChoice") return { ...base, selectedOptionId: val };
        if (q.type === "Checkbox") return { ...base, selectedOptionIds: val };
        if (q.type === "FileUpload") return { ...base, fileUrl: val };
        return null;
      })
      .filter(Boolean);
  };

  const handleSave = async () => {
    setErrorMsg("");
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };
      await axios.post(
        `${API_BASE_URL}/anamnese/templates/${templateId}/responses`,
        { studentId, answers: buildAnswers() },
        config
      );
      navigate("/alunosDetails", { state: { studentId, openTab: "anamnese" } });
    } catch (err) {
      console.error("Erro ao salvar:", err);
      const errCode = err.response?.data?.error;
      if (errCode === "MISSING_REQUIRED_ANSWER") {
        setErrorMsg("Preencha todas as perguntas obrigatórias.");
      } else {
        setErrorMsg("Erro ao salvar. Tente novamente.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ar-page">
        <Navbar activePage="students" />
        <div className="ar-content">
          <p className="ar-loading">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="ar-page">
        <Navbar activePage="students" />
        <div className="ar-content">
          <p className="ar-loading">Formulário não encontrado.</p>
        </div>
      </div>
    );
  }

  const sortedQuestions = [...(template.questions || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="ar-page">
      <Navbar activePage="students" />

      <div className="ar-content">
        <div className="ar-topbar">
          <div className="ar-topbar-left">
            <button className="ar-back-btn" onClick={() => navigate(-1)}>
              <img src={iconBack} alt="Voltar" />
            </button>
            <h1 className="ar-page-title">Anamnese</h1>
          </div>
          <button className="ar-save-btn" onClick={handleSave} disabled={saving}>
            <img src={iconSave} alt="Salvar" />
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>

        {template.title && (
          <p className="ar-template-title">{template.title}</p>
        )}

        {errorMsg && <div className="ar-error">{errorMsg}</div>}

        <div className="ar-questions-list">
          {sortedQuestions.map((q) => (
            <div key={q.id} className="ar-question">
              <p className="ar-question-text">
                {q.text}
                {q.required && <span className="ar-required"> *</span>}
              </p>

              {q.type === "Descriptive" && (
                <textarea
                  className="ar-textarea"
                  placeholder="Descrição..."
                  rows={3}
                  value={formValues[q.id] || ""}
                  onChange={(e) => setFormValue(q.id, e.target.value)}
                />
              )}

              {q.type === "MultipleChoice" && (
                <div className="ar-options">
                  {(q.options || []).map((opt) => (
                    <label key={opt.id} className="ar-option-label">
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.id}
                        checked={formValues[q.id] === opt.id}
                        onChange={() => setFormValue(q.id, opt.id)}
                      />
                      <span>{opt.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "Checkbox" && (
                <div className="ar-options">
                  {(q.options || []).map((opt) => (
                    <label key={opt.id} className="ar-option-label">
                      <input
                        type="checkbox"
                        checked={(formValues[q.id] || []).includes(opt.id)}
                        onChange={(e) => toggleCheckbox(q.id, opt.id, e.target.checked)}
                      />
                      <span>{opt.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === "FileUpload" && (
                <FileUploadField
                  questionId={q.id}
                  value={formValues[q.id] || null}
                  onUploaded={(url) => setFormValue(q.id, url)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AnamneseResponder;
