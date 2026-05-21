import React, { useState } from "react";
import axios from "axios";
import "./style.css";
import avatarPlaceholder from "../../../assets/images/icon_random.png";
import iconUpload from "../../../assets/images/iconUpload.png";
import iconPencil from "../../../assets/images/edit.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function CreateStudentModal({ isOpen, onClose, onSaveSuccess }) {
  const [formData, setFormData] = useState({
    nome: "",
    idade: "",
    genero: "male",
    cep: "",
    rua: "",
    numero: "",
    contato: "",
    objetivo: "",
  });

  const [profileFile, setProfileFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileName, setFileName] = useState("Nenhum arquivo foi selecionado");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProfileFile(file);
      setFileName(file.name);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setProfileFile(null);
      setFileName("Nenhum arquivo foi selecionado");
      setPreviewUrl("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const idadeNumerica = parseInt(formData.idade, 10);
    if (isNaN(idadeNumerica) || idadeNumerica < 1) {
      alert("Por favor, insira uma idade válida.");
      return;
    }

    if (!formData.nome.trim()) {
      alert("Nome é obrigatório.");
      return;
    }

    if (!formData.objetivo.trim()) {
      alert("Objetivo é obrigatório.");
      return;
    }

    try {
      setIsSaving(true);

      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Sessão inválida. Faça login novamente.");
        return;
      }

      const form = new FormData();
      form.append("name", formData.nome.trim());
      form.append("age", String(idadeNumerica));
      form.append("gender", formData.genero);
      form.append("zipcode", formData.cep.trim());
      form.append("road", formData.rua.trim());
      form.append("housenumber", formData.numero.trim());
      form.append("phonenumber", formData.contato.trim());
      form.append("learningTopics[]", formData.objetivo.trim());

      if (profileFile) {
        form.append("photo", profileFile);
      }

      await axios.post(`${API_BASE_URL}/student/create`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Aluno cadastrado com sucesso!");
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      const msg = error.response?.data?.message
        ? JSON.stringify(error.response.data)
        : error.message;
      alert(`Falha no cadastro: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-wrapper" onClick={(e) => e.stopPropagation()}>
        
        <div className="modal-figma-header">
          <div className="modal-step-indicator">
            <span className="step-number">1</span>
            <h3>Dados Obrigatórios</h3>
          </div>
          <button className="modal-close-x" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="alunos-profile-pic-section">
            <img
              src={previewUrl || avatarPlaceholder}
              alt="Foto de perfil"
              className="alunos-avatar"
            />

            <div className="alunos-file-uploader">
              <label htmlFor="modal-file-upload" className="alunos-file-upload-label">
                <img
                  src={iconUpload}
                  alt=""
                  style={{ width: 20, height: 20, opacity: 0.7 }}
                />
                Adicionar foto
              </label>

              <input
                id="modal-file-upload"
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
              />

              <span className="alunos-file-name">{fileName}</span>
              <p className="alunos-file-hint">
                Opcional - Pode ser adicionada depois
              </p>
            </div>
          </div>

          <div className="alunos-form-grid">
            <div className="alunos-form-column">
              <div className="alunos-form-group">
                <label htmlFor="nome">Nome Completo *</label>
                <div className="alunos-input-with-icon">
                  <img src={iconPencil} alt="" className="alunos-input-icon" />
                  <input
                    type="text"
                    id="nome"
                    placeholder="Digite o nome completo do aluno"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="alunos-form-row">
                <div className="alunos-form-group">
                  <label htmlFor="idade">Idade *</label>
                  <input
                    type="number"
                    id="idade"
                    placeholder="Ex: 7"
                    min="1"
                    value={formData.idade}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="alunos-form-group">
                  <label htmlFor="genero">Gênero *</label>
                  <select
                    id="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    required
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
              </div>

              <div className="alunos-form-group">
                <label htmlFor="objetivo">Objetivo do paciente *</label>
                <div className="alunos-input-with-icon">
                  <img src={iconPencil} alt="" className="alunos-input-icon" />
                  <input
                    type="text"
                    id="objetivo"
                    placeholder="Preencha aqui..."
                    value={formData.objetivo}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="alunos-form-column">
              <div className="alunos-form-group">
                <label htmlFor="cep">CEP</label>
                <div className="alunos-input-with-icon">
                  <img src={iconPencil} alt="" className="alunos-input-icon" />
                  <input
                    type="text"
                    id="cep"
                    placeholder="Preencha aqui..."
                    value={formData.cep}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="alunos-form-row">
                <div className="alunos-form-group" style={{ flex: 3 }}>
                  <label htmlFor="rua">Rua</label>
                  <div className="alunos-input-with-icon">
                    <img src={iconPencil} alt="" className="alunos-input-icon" />
                    <input
                      type="text"
                      id="rua"
                      placeholder="Preencha aqui..."
                      value={formData.rua}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="alunos-form-group" style={{ flex: 1 }}>
                  <label htmlFor="numero">Número</label>
                  <input
                    type="text"
                    id="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="alunos-form-group">
                <label htmlFor="contato">Contato do responsável</label>
                <input
                  type="text"
                  id="contato"
                  placeholder="(99) 9 9999 9999"
                  value={formData.contato}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="alunos-form-footer">
            <button type="submit" className="alunos-save-button" disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateStudentModal;