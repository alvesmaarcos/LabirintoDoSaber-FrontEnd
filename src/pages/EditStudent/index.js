import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./style.css";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import iconNotification from "../../assets/images/icon_notification.png";
import iconProfile from "../../assets/images/icon_profile.png";
import iconBack from "../../assets/images/seta_icon_esquerda.png";
import avatarPlaceholder from "../../assets/images/icon_random.png";
import iconUpload from "../../assets/images/iconUpload.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function EditStudentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const studentId = useMemo(
    () => location.state?.studentId || location.state?.id,
    [location.state]
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [studentPhotoUrl, setStudentPhotoUrl] = useState("");
  const [profileFile, setProfileFile] = useState(null);

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

  useEffect(() => {
    if (!studentId) {
      setIsLoading(false);
      alert("Erro: ID do aluno não fornecido.");
      navigate("/alunos");
      return;
    }

    const fetchStudent = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("authToken");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const res = await axios.get(`${API_BASE_URL}/student/`, config);
        const list = Array.isArray(res.data) ? res.data : res.data.students || [];
        const student = list.find((s) => String(s.id) === String(studentId));

        if (!student) {
          alert("Aluno não encontrado.");
          navigate("/alunos");
          return;
        }

        setStudentPhotoUrl(student.photoUrl || "");

        setFormData({
          nome: student.name || "",
          idade: student.age ? String(student.age) : "",
          genero: student.gender || "male",
          cep: student.zipcode || "",
          rua: student.road || "",
          numero: student.housenumber || "",
          contato: student.phonenumber || "",
          objetivo:
            Array.isArray(student.learningTopics) && student.learningTopics.length > 0
              ? student.learningTopics[0]
              : "",
        });
      } catch (error) {
        if (error.response?.status === 401) {
          alert("Sua sessão expirou. Faça login novamente.");
          navigate("/");
          return;
        }
        alert("Erro ao carregar dados do aluno.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudent();
  }, [studentId, navigate]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProfileFile(file);
      setStudentPhotoUrl(URL.createObjectURL(file));
    } else {
      setProfileFile(null);
    }
  };

  const buildUpdatePayload = () => {
    const payload = {};
    const nome = (formData.nome || "").trim();
    const idadeNum = formData.idade !== "" ? Number(formData.idade) : NaN;
    const genero = formData.genero;
    const cep = (formData.cep || "").trim();
    const rua = (formData.rua || "").trim();
    const numero = (formData.numero || "").trim();
    const contato = (formData.contato || "").trim();
    const objetivo = (formData.objetivo || "").trim();

    if (nome) payload.name = nome;
    if (!Number.isNaN(idadeNum)) payload.age = idadeNum;
    if (genero) payload.gender = genero;
    if (cep) payload.zipcode = cep;
    if (rua) payload.road = rua;
    if (numero) payload.housenumber = numero;
    if (contato) payload.phonenumber = contato;
    if (objetivo) payload.learningTopics = [objetivo];

    return payload;
  };

  const validateBeforeSubmit = () => {
    const nome = (formData.nome || "").trim();
    if (!nome) return "Nome é obrigatório.";

    const idadeNum = Number(formData.idade);
    if (!Number.isFinite(idadeNum) || idadeNum < 1) return "Idade inválida.";

    const objetivo = (formData.objetivo || "").trim();
    if (!objetivo) return "Objetivo é obrigatório.";

    return null;
  };

  const uploadStudentPhoto = async ({ token }) => {
    if (!profileFile) return null;
    const form = new FormData();
    form.append("photo", profileFile);

    const tryUrls = [
      `${API_BASE_URL}/student/update-profile-picture/${studentId}`,
      `${API_BASE_URL}/student/update-profile-picture`,
      `${API_BASE_URL}/student/update/${studentId}`,
    ];

    let lastErr = null;
    for (const url of tryUrls) {
      try {
        const res = await axios.put(url, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data || {};
        const photo = data.photoUrl || data._photoUrl || data.photo || data.url || null;
        if (photo) return photo;
        if (data.student?.photoUrl) return data.student.photoUrl;
        return "__UPLOADED_BUT_NO_URL__";
      } catch (err) {
        lastErr = err;
        const status = err?.response?.status;
        if (status === 404 || status === 405) continue;
      }
    }
    throw lastErr;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateBeforeSubmit();
    if (validationError) {
      alert(validationError);
      return;
    }

    const payload = buildUpdatePayload();
    if (Object.keys(payload).length === 0 && !profileFile) {
      alert("Nada para atualizar.");
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("Sessão inválida. Faça login novamente.");
        navigate("/");
        return;
      }

      let uploadedPhotoUrl = null;
      if (profileFile) {
        uploadedPhotoUrl = await uploadStudentPhoto({ token });
        if (uploadedPhotoUrl && uploadedPhotoUrl !== "__UPLOADED_BUT_NO_URL__") {
          setStudentPhotoUrl(`${uploadedPhotoUrl}?t=${Date.now()}`);
        }
      }

      if (Object.keys(payload).length > 0) {
        const res = await axios.put(
          `${API_BASE_URL}/student/update/${studentId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updated = res.data || {};
        const newPhoto = updated.photoUrl || updated._photoUrl || updated.student?.photoUrl;
        if (newPhoto) setStudentPhotoUrl(`${newPhoto}?t=${Date.now()}`);
      }

      alert("✅ Aluno atualizado com sucesso!");
      navigate("/alunos", { state: { studentUpdated: Date.now() } });
    } catch (error) {
      if (error.response?.status === 401) {
        alert("Sua sessão expirou. Faça login novamente.");
        navigate("/");
        return;
      }
      alert(`❌ Falha ao atualizar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="edit-student-dashboard-container">
        <h2 style={{ textAlign: "center", marginTop: 40 }}>Carregando...</h2>
      </div>
    );
  }

  return (
    <div className="edit-student-dashboard-container">
      <header className="edit-student-header">
        <img src={logo} alt="Labirinto do Saber" className="edit-student-logo" />
        <nav className="edit-student-navbar">
          <a href="/home" className="edit-student-nav-link">Dashboard</a>
          <a href="/activitiesMain" className="edit-student-nav-link">Atividades</a>
          <a href="/alunos" className="edit-student-nav-link active">Alunos</a>
          <a href="/MainReport" className="edit-student-nav-link">Relatórios</a>
        </nav>
        <div className="edit-student-user-controls">
          <img src={iconNotification} alt="Notificações" className="edit-student-icon" />
          <img src={iconProfile} alt="Perfil" className="edit-student-icon edit-student-profile-icon" />
        </div>
      </header>

      <main className="edit-student-main-content">
        <button className="edit-student-back-button" onClick={() => navigate(-1)}>
          <img src={iconBack} alt="seta" className="edit-student-seta" />
        </button>

        <div className="edit-student-profile-card">
          <div className="edit-title-container">
            <h2>Editar Perfil do Aluno</h2>
            <p>Atualize as informações cadastradas.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="edit-student-profile-pic-section">
              <div className="avatar-wrapper">
                <img
                  src={studentPhotoUrl || avatarPlaceholder}
                  alt="Foto de perfil"
                  className="edit-student-avatar"
                  onError={(e) => { e.currentTarget.src = avatarPlaceholder; }}
                />
                <label htmlFor="file-upload" className="inner-upload-badge">
                  <img src={iconUpload} alt="" />
                </label>
              </div>
              <div className="edit-student-file-uploader">
                <p className="upload-instruction-text">Clique no ícone para alterar a foto</p>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg"
                />
              </div>
            </div>

            <div className="section-form-flow">
              <div className="figma-section-title">
                <span className="step-badge">1</span>
                <h3>Informações Pessoais</h3>
              </div>
              <div className="edit-student-form-grid">
                <div className="edit-student-form-group">
                  <label htmlFor="nome">Nome Completo</label>
                  <input type="text" id="nome" value={formData.nome} onChange={handleChange} required />
                </div>
                <div className="edit-student-form-group">
                  <label htmlFor="idade">Idade</label>
                  <input type="number" id="idade" value={formData.idade} onChange={handleChange} required />
                </div>
                <div className="edit-student-form-group" style={{ gridColumn: "1 / -1" }}>
                  <label htmlFor="genero">Gênero</label>
                  <select id="genero" value={formData.genero} onChange={handleChange} required>
                    <option value="male">Masculino</option>
                    <option value="female">Feminino</option>
                    <option value="other">Outro</option>
                  </select>
                </div>
              </div>

              <div className="figma-section-title">
                <span className="step-badge">2</span>
                <h3>Endereço</h3>
              </div>
              <div className="edit-student-form-grid">
                <div className="edit-student-form-group">
                  <label htmlFor="cep">CEP</label>
                  <input type="text" id="cep" value={formData.cep} onChange={handleChange} required />
                </div>
                <div className="edit-student-form-row" style={{ gridColumn: "1 / -1" }}>
                  <div className="edit-student-form-group" style={{ flex: 3 }}>
                    <label htmlFor="rua">Rua</label>
                    <input type="text" id="rua" value={formData.rua} onChange={handleChange} required />
                  </div>
                  <div className="edit-student-form-group" style={{ flex: 1 }}>
                    <label htmlFor="numero">Número</label>
                    <input type="text" id="numero" value={formData.numero} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div className="figma-section-title">
                <span className="step-badge">3</span>
                <h3>Objetivo do Acompanhamento</h3>
              </div>
              <div className="edit-student-form-group full-width-textarea">
                <label htmlFor="objetivo">Descrição dos Objetivos</label>
                <textarea id="objetivo" value={formData.objetivo} onChange={handleChange} required placeholder="Preencha os objetivos do acompanhamento..." />
              </div>

              <div className="figma-section-title">
                <span className="step-badge">4</span>
                <h3>Contato</h3>
              </div>
              <div className="edit-student-form-grid single-column-last">
                <div className="edit-student-form-group">
                  <label htmlFor="contato">Contato do Responsável</label>
                  <input 
                    type="text" 
                    id="contato" 
                    value={formData.contato} 
                    onChange={handleChange} 
                    placeholder="(99) 9 9999-9999"
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="edit-form-footer-row">
              <button type="button" className="btn-cancelar-figma" onClick={() => navigate(-1)}>
                Cancelar
              </button>
              <button type="submit" className="btn-salvar-figma" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default EditStudentPage;