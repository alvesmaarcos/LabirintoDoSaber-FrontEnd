import React, { useState, useEffect } from "react";
import "./style.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import iconProfile from "../../assets/images/icon_profile.png";
import iconArrowLeft from "../../assets/images/seta_icon_esquerda.png";
import Navbar from "../../components/ui/NavBar/index.js";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function ProfileEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact: "",
  });

  const [profileFile, setProfileFile] = useState(null);
  const [fileName, setFileName] = useState("Nenhum arquivo foi selecionado");
  const [avatarUrl, setAvatarUrl] = useState(iconProfile);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/");
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_BASE_URL}/educator/me`, config);
        const userData = response.data;

        // Preencher os dados do formulário com os dados recebidos da API
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          contact: userData.contact || "",
        });

        // Carregar a foto do perfil
        const apiAvatar =
          userData.photoUrl || userData._photoUrl || iconProfile;
        setAvatarUrl(apiAvatar);

        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        if (error.response && error.response.status === 401) {
          setError("Sessão expirada. Por favor, faça login novamente.");
          navigate("/");
        }
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleFileClick = (e) => {
    e.preventDefault();
    const input = document.getElementById("fileInputHidden");
    if (input) input.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileName(file.name);
      setProfileFile(file);
    } else {
      setFileName("Nenhum arquivo foi selecionado");
      setProfileFile(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureUpload = async () => {
    if (!profileFile) return true;

    try {
      const token = localStorage.getItem("authToken");
      const formDataToSend = new FormData();
      formDataToSend.append("photo", profileFile);

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.put(
        `${API_BASE_URL}/educator/update-profile-picture`,
        formDataToSend,
        config
      );

      if (response.data) {
        const newAvatar =
          response.data.photoUrl || response.data._photoUrl || avatarUrl;
        setAvatarUrl(newAvatar);
      }

      return true;
    } catch (error) {
      console.error("ERRO DETALHADO NO UPLOAD (PUT FOTO):", error);
      setError("Erro ao atualizar foto de perfil.");
      return false;
    }
  };

  const handleUpdateTextData = async () => {
    const dataToUpdate = {};

    if (formData.name.trim()) dataToUpdate.newName = formData.name;
    if (formData.contact.trim()) dataToUpdate.newContact = formData.contact;

    if (Object.keys(dataToUpdate).length === 0) {
      setError("Nenhum dado foi alterado.");
      return false;
    }

    try {
      const token = localStorage.getItem("authToken");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.put(
        `${API_BASE_URL}/educator/update-educator`,
        dataToUpdate,
        config
      );

      if (response.data && response.data.name) {
        setFormData((prev) => ({ ...prev, name: response.data.name }));
      }

      return true;
    } catch (error) {
      console.error("ERRO DETALHADO NO PUT TEXTO:", error);
      setError("Erro ao atualizar nome/contato.");
      return false;
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError(""); // Limpar mensagens de erro antes de tentar salvar

    await Promise.all([handleUpdateTextData(), handleProfilePictureUpload()]);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <h2>Carregando perfil...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />

      <main className="profile-main-content">
        <div className="profile-container">
          <div className="top-nav-row">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="back-arrow-link"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <img
                src={iconArrowLeft}
                alt="Voltar"
                className="back-arrow-icon"
              />
            </button>
          </div>

          <div className="profile-edit-card">
            <div className="avatar-upload-section">
              <div className="avatar-placeholder-large">
                {avatarUrl === iconProfile ? (
                  <div className="default-user-icon">
                    <div className="user-head" />
                    <div className="user-body" />
                  </div>
                ) : (
                  <img
                    src={avatarUrl}
                    alt="Foto de Perfil"
                    className="actual-avatar-image"
                  />
                )}
              </div>

              <div className="upload-controls">
                <label className="field-label">Foto de perfil</label>

                <div className="custom-file-wrapper">
                  <button
                    type="button"
                    className="btn-select-file"
                    onClick={handleFileClick}
                  >
                    ☁️ Selecionar arquivo
                  </button>
                  <span className="file-status-text">{fileName}</span>
                  <input
                    type="file"
                    id="fileInputHidden"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg"
                  />
                </div>

                <p className="upload-hint">
                  Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB.
                </p>
              </div>
            </div>

            <form className="profile-form">
              <div className="form-group">
                <label className="field-label">Nome do profissional</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Nome completo"
                />
              </div>

              <div className="form-group">
                <label className="field-label">Contato do profissional</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Preencha aqui..."
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-save-profile"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Salvar perfil"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProfileEdit;
