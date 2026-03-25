import React, { useState } from "react";
import axios from "axios";
import "./style.css";
import iconBack from "../../assets/images/seta_icon_esquerda.png";
import avatarPlaceholder from "../../assets/images/icon_random.png";
import iconUpload from "../../assets/images/iconUpload.png";
import iconPencil from "../../assets/images/edit.png";
import Navbar from "../../components/ui/NavBar/index.js";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function AlunosPage() {
  const navigate = useNavigate();

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
        navigate("/");
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
      navigate("/alunos", { state: { studentUpdated: Date.now() } });
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      const msg =
        error.response?.data?.message
          ? JSON.stringify(error.response.data)
          : error.message;
      alert(`Falha no cadastro: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="alunos-dashboard-container">
      <Navbar activePage="students" />

      <main className="alunos-main-content">
        <button className="alunos-back-button" onClick={() => navigate(-1)}>
          <img src={iconBack} alt="seta" className="alunos-seta" />
        </button>

        <div className="alunos-profile-card">
          <form onSubmit={handleSubmit}>
            <div className="alunos-profile-pic-section">
              <img
                src={previewUrl || avatarPlaceholder}
                alt="Foto de perfil"
                className="alunos-avatar"
              />

              <div className="alunos-file-uploader">
                <label htmlFor="file-upload" className="alunos-file-upload-label">
                  <img
                    src={iconUpload}
                    alt=""
                    style={{ width: 20, height: 20, opacity: 0.7 }}
                  />
                  Selecionar arquivo
                </label>

                <input
                  id="file-upload"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                />

                <span className="alunos-file-name">{fileName}</span>
                <p className="alunos-file-hint">
                  Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB.
                </p>
              </div>
            </div>

            <div className="alunos-form-grid">
              <div className="alunos-form-column">
                <div className="alunos-form-group">
                  <label htmlFor="nome">Nome do paciente</label>
                  <div className="alunos-input-with-icon">
                    <img src={iconPencil} alt="" className="alunos-input-icon" />
                    <input
                      type="text"
                      id="nome"
                      placeholder="Preencha aqui..."
                      value={formData.nome}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="alunos-form-group">
                  <label htmlFor="idade">Idade do paciente</label>
                  <input
                    type="number"
                    id="idade"
                    placeholder="Digite a idade aqui..."
                    min="1"
                    value={formData.idade}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="alunos-form-group">
                  <label htmlFor="objetivo">Objetivo do paciente</label>
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
                  <label htmlFor="genero">Gênero</label>
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
      </main>
    </div>
  );
}

export default AlunosPage;
