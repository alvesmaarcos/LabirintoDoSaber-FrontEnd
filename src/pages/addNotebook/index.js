import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles.css";
import iconBack from "../../assets/images/seta_icon_esquerda.png";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/ui/NavBar/index.js";
const ActivityChip = ({ label, isSelected, onClick }) => (
  <button
    className={`activity-chip ${isSelected ? "selected" : ""}`}
    onClick={onClick}
    type="button"
  >
    {label}
  </button>
);

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

const AddIcon = () => (
  <svg
    width="29"
    height="31"
    viewBox="0 0 29 31"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_d_150_1802)">
      <path d="M19.5 12H9.5" stroke="black" strokeLinecap="round" />
      <path d="M14.5 17V7" stroke="black" strokeLinecap="round" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.5 22C20.0228 22 24.5 17.5228 24.5 12C24.5 6.47715 20.0228 2 14.5 2C8.97715 2 4.5 6.47715 4.5 12C4.5 17.5228 8.97715 22 14.5 22Z"
        stroke="black"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_150_1802"
        x="-1.5"
        y="0"
        width="32"
        height="32"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy="4" />
        <feGaussianBlur stdDeviation="2" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_150_1802"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_150_1802"
          result="shape"
        />
      </filter>
    </defs>
  </svg>
);

function AdicionarAtividade() {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState("Leitura");
  const [description, setDescription] = useState("");

  const [availableTaskGroups, setAvailableTaskGroups] = useState([]);
  const [notebookGroups, setNotebookGroups] = useState([
    { uniqueId: Date.now(), groupId: "" },
  ]);

  const categories = ["Leitura", "Escrita", "Vocabulário", "Compreensão"];

  const categoryMap = {
    Leitura: "reading",
    Escrita: "writing",
    Vocabulário: "vocabulary",
    Compreensão: "comprehension",
  };

  useEffect(() => {
    const fetchGroups = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/task-group/list-by-educator`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        console.log("Grupos carregados:", response.data);

        if (Array.isArray(response.data)) {
          setAvailableTaskGroups(response.data);
        }
      } catch (error) {
        console.error("Erro ao carregar grupos de atividades:", error);
      }
    };
    fetchGroups();
  }, []);

  const addGroupRow = () => {
    setNotebookGroups([
      ...notebookGroups,
      { uniqueId: Date.now(), groupId: "" },
    ]);
  };

  const removeGroupRow = (uniqueId) => {
    if (notebookGroups.length > 1) {
      setNotebookGroups(
        notebookGroups.filter((item) => item.uniqueId !== uniqueId)
      );
    }
  };

  const updateGroupSelection = (uniqueId, newGroupId) => {
    setNotebookGroups(
      notebookGroups.map((item) =>
        item.uniqueId === uniqueId ? { ...item, groupId: newGroupId } : item
      )
    );
  };

  const handleSave = async () => {
    const token = localStorage.getItem("authToken");

    const validGroupIds = notebookGroups
      .map((item) => item.groupId)
      .filter((id) => id !== "");

    if (!description.trim()) {
      alert("Por favor, preencha a descrição do caderno.");
      return;
    }
    if (validGroupIds.length === 0) {
      alert("Selecione pelo menos um grupo de atividades.");
      return;
    }

    let aggregatedTaskIds = [];

    validGroupIds.forEach((groupId) => {
      const groupObj = availableTaskGroups.find((g) => g.id === groupId);
      if (groupObj && groupObj.tasksIds && Array.isArray(groupObj.tasksIds)) {
        aggregatedTaskIds = [...aggregatedTaskIds, ...groupObj.tasksIds];
      }
    });

    const uniqueTaskIds = [...new Set(aggregatedTaskIds)];

    const payload = {
      tasks: uniqueTaskIds,
      category: categoryMap[selectedCategory] || "vocabulary",
      description: description,
      taskGroupsIds: validGroupIds,
    };

    console.log("Enviando Payload:", payload);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/task-notebook/create`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Resposta da API:", response.data);
      alert("Caderno criado com sucesso!");
      navigate("/activitiesMain");
    } catch (error) {
      console.error("Erro ao criar caderno:", error);
      alert("Erro ao criar o caderno. Verifique os dados e tente novamente.");
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar activePage="activities" />

      <main className="main-content">
        <button
          onClick={() => navigate("/activitiesMain")}
          className="back-arrow"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <img src={iconBack} alt="seta" className="seta" />
        </button>

        <div className="adicionar-atividade-container">
          <h1 className="form-title">Adicionar novo caderno</h1>
          <hr className="title-separator" />

          {/* Categoria */}
          <div className="form-group">
            <label className="form-label required">Categoria do caderno</label>
            <div className="chips-container">
              {categories.map((cat) => (
                <ActivityChip
                  key={cat}
                  label={cat}
                  isSelected={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Descrição do caderno</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Exemplo: Caderno de associação e leitura com animais"
              className="text-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label required">
              Adicione os grupos de atividades
            </label>

            <div className="activities-list-container">
              {notebookGroups.map((item) => (
                <div key={item.uniqueId} className="activity-row">
                  <div className="activity-item">
                    <select
                      className="activity-input"
                      value={item.groupId}
                      onChange={(e) =>
                        updateGroupSelection(item.uniqueId, e.target.value)
                      }
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "none",
                        background: "transparent",
                        outline: "none",
                      }}
                    >
                      <option value="">Selecione um grupo...</option>

                      {availableTaskGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name
                            ? group.name
                            : `Grupo - ${group.category}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="activity-remove-button"
                    onClick={() => removeGroupRow(item.uniqueId)}
                    title="Remover grupo"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="activity-add-button"
              onClick={addGroupRow}
            >
              <AddIcon />
              Adicionar mais grupos
            </button>
          </div>

          <div className="next-button-container">
            <button className="button-next" type="button" onClick={handleSave}>
              Salvar Caderno
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdicionarAtividade;
