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
import iconPencil from "../../assets/images/edit.png";

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
  const [fileName, setFileName] = useState("Nenhum arquivo foi selecionado");

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
      setFileName(file.name);
      setStudentPhotoUrl(URL.createObjectURL(file));
    } else {
      setProfileFile(null);
      setFileName("Nenhum arquivo foi selecionado");
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
        const photo =
          data.photoUrl || data._photoUrl || data.photo || data.url || null;

        if (photo) return photo;

        if (data.student?.photoUrl) return data.student.photoUrl;
        if (data.student?._photoUrl) return data.student._photoUrl;

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

        const newPhoto =
          updated.photoUrl || updated._photoUrl || updated.student?.photoUrl || updated.student?._photoUrl;

        if (newPhoto) setStudentPhotoUrl(`${newPhoto}?t=${Date.now()}`);

        setFormData((prev) => ({
          ...prev,
          nome: updated.name ?? updated.student?.name ?? prev.nome,
          idade:
            updated.age !== undefined && updated.age !== null
              ? String(updated.age)
              : updated.student?.age !== undefined && updated.student?.age !== null
              ? String(updated.student.age)
              : prev.idade,
          genero: updated.gender ?? updated.student?.gender ?? prev.genero,
          cep: updated.zipcode ?? updated.student?.zipcode ?? prev.cep,
          rua: updated.road ?? updated.student?.road ?? prev.rua,
          numero: updated.housenumber ?? updated.student?.housenumber ?? prev.numero,
          contato: updated.phonenumber ?? updated.student?.phonenumber ?? prev.contato,
          objetivo:
            Array.isArray(updated.learningTopics) && updated.learningTopics.length > 0
              ? updated.learningTopics[0]
              : Array.isArray(updated.student?.learningTopics) && updated.student.learningTopics.length > 0
              ? updated.student.learningTopics[0]
              : prev.objetivo,
        }));
      }

      alert("✅ Aluno atualizado com sucesso!");
      navigate("/alunos", { state: { studentUpdated: Date.now() } });
    } catch (error) {
      if (error.response?.status === 401) {
        alert("Sua sessão expirou. Faça login novamente.");
        navigate("/");
        return;
      }
      const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      alert(`❌ Falha ao atualizar: ${msg}`);
      console.error("Erro update aluno:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="alunos-dashboard-container">
        <h2 style={{ textAlign: "center", marginTop: 40 }}>Carregando...</h2>
      </div>
    );
  }

  return (
    <div className="alunos-dashboard-container">
      <header className="alunos-header">
        <img src={logo} alt="Labirinto do Saber" className="alunos-logo" />
        <nav className="alunos-navbar">
          <a href="/home" className="alunos-nav-link">Dashboard</a>
          <a href="/activitiesMain" className="alunos-nav-link">Atividades</a>
          <a href="/alunos" className="alunos-nav-link active">Alunos</a>
          <a href="/MainReport" className="alunos-nav-link">Relatórios</a>
        </nav>
        <div className="alunos-user-controls">
          <img src={iconNotification} alt="Notificações" className="alunos-icon" />
          <img src={iconProfile} alt="Perfil" className="alunos-icon alunos-profile-icon" />
        </div>
      </header>

      <main className="alunos-main-content">
        <button className="alunos-back-button" onClick={() => navigate(-1)}>
          <img src={iconBack} alt="seta" className="alunos-seta" />
        </button>

        <div className="alunos-profile-card">
          <form onSubmit={handleSubmit}>
            <div className="alunos-profile-pic-section">
              <img
                src={studentPhotoUrl || avatarPlaceholder}
                alt="Foto de perfil"
                className="alunos-avatar"
                onError={(e) => {
                  e.currentTarget.src = avatarPlaceholder;
                }}
              />
              <div className="alunos-file-uploader">
                <label htmlFor="file-upload" className="alunos-file-upload-label">
                  <img src={iconUpload} alt="" style={{ width: 20, height: 20, opacity: 0.7 }} />
                  Selecionar arquivo
                </label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg"
                />
                <span className="alunos-file-name">{fileName}</span>
                <p className="alunos-file-hint">Formatos aceitos: JPG, PNG. Tamanho máximo: 2MB.</p>
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
                  <select id="genero" value={formData.genero} onChange={handleChange} required>
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

export default EditStudentPage;
