import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import "./style.css";
import logo from "../../../assets/images/logo.png";
import iconProfile from "../../../assets/images/icon_profile.png";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Adicionamos a prop 'activePage' aqui
function Navbar({ activePage }) {
  const [userName, setUserName] = useState("");
  const [userPhotoUrl, setUserPhotoUrl] = useState(iconProfile);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEducator = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const userResponse = await axios.get(
          `${API_BASE_URL}/educator/me`,
          config
        );

        const data = userResponse.data || {};
        const avatar = data.photoUrl || data._photoUrl || iconProfile;

        setUserName(data.name || "");
        setUserPhotoUrl(avatar);
      } catch (error) {
        console.error("Erro ao carregar dados do educador na navbar:", error);
      }
    };

    fetchEducator();
  }, []);

  // Nova função para verificar qual item deve ficar ativo
  const checkActive = (menuName, path) => {
    // 1. Prioridade: Se a prop activePage foi passada, usamos ela
    if (activePage) {
      return activePage === menuName;
    }

    // 2. Fallback: Se não passou prop, tenta adivinhar pela URL
    if (path === "/home") return location.pathname === "/home";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="header">
      <img src={logo} alt="Labirinto do Saber" className="logo" />

      <nav className="navbar">
        <Link
          to="/home"
          // Usamos o identificador 'dashboard'
          className={`nav-link ${checkActive("dashboard", "/home") ? "active" : ""}`}
        >
          Dashboard
        </Link>
        
        <Link
          to="/activitiesMain"
          // Usamos o identificador 'activities'
          className={`nav-link ${checkActive("activities", "/activitiesMain") ? "active" : ""}`}
        >
          Atividades
        </Link>
        
        <Link
          to="/alunos"
          // Usamos o identificador 'students'
          className={`nav-link ${checkActive("students", "/alunos") ? "active" : ""}`}
        >
          Alunos
        </Link>
        
        <Link
          to="/MainReport"
          // Usamos o identificador 'reports'
          className={`nav-link ${checkActive("reports", "/MainReport") ? "active" : ""}`}
        >
          Relatórios
        </Link>
      </nav>

      <div className="home-user-controls user-controls">
        <img
          src={userPhotoUrl}
          alt={userName || "Perfil"}
          className="profile-icon"
          onClick={() => navigate("/Profile")}
          style={{
            cursor: "pointer",
            objectFit: "cover",
          }}
        />
      </div>
    </header>
  );
}

export default Navbar;