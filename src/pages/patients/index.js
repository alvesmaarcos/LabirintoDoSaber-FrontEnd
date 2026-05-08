import React, { useState, useEffect, useCallback, useRef } from 'react';
import './style.css';
import axios from 'axios';
import Navbar from "../../components/ui/NavBar/index.js";
import PageTurner from '../../components/ui/PageTurner/index.js';
import iconRandom from '../../assets/images/icon_random.png';
import addIcon from '../../assets/images/icon-button-aluno.png';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function mapGender(gender) {
  if (!gender) return null;
  const g = String(gender).toLowerCase();
  if (g === 'male' || g === 'masculino' || g === 'm') return 'Masculino';
  if (g === 'female' || g === 'feminino' || g === 'f') return 'Feminino';
  return gender;
}

function StudentCard({ aluno, onVerPerfil, progressMap }) {
  const cardRef = useRef(null);
  const progress = progressMap[aluno.id];
  const genderLabel = mapGender(aluno.gender);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onVerPerfil(aluno.id, 'observe');
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [aluno.id, onVerPerfil]);

  const pct = progress?.accuracy != null ? Math.round(progress.accuracy * 100) : null;
  const loading = progress?.loading;

  return (
    <div className="student-list-item-card" ref={cardRef}>
      <div className="student-card-top">
        <img
          src={aluno.photoUrl || iconRandom}
          alt={aluno.name || "Avatar"}
          className="student-card-avatar"
          onError={(e) => { e.currentTarget.src = iconRandom; }}
        />
        <div className="student-card-info">
          <h3>{aluno.name}</h3>
          <p className="student-card-meta">
            {aluno.age} anos{genderLabel ? ` • ${genderLabel}` : ''}
          </p>
          <p className="student-card-level">
            {aluno.learningTopics && aluno.learningTopics.length > 0
              ? aluno.learningTopics[0]
              : 'Sem nível definido'}
          </p>
        </div>
        <button
          className="ver-perfil-btn"
          onClick={() => onVerPerfil(aluno.id, 'click')}
        >
          Ver Perfil
        </button>
      </div>

      <div className="student-card-progress-section">
        <div className="progress-info-row">
          <span className="progress-label">Progresso Geral</span>
          <span className="progress-pct">
            {loading ? '...' : pct != null ? `${pct}%` : '—'}
          </span>
        </div>
        <div className="card-progress-bar">
          <div
            className="card-progress-fill"
            style={{ width: loading || pct == null ? '0%' : `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function AlunosPage() {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [progressMap, setProgressMap] = useState({});
  const itemsPerPage = 4;

  useEffect(() => {
    const fetchAlunos = async () => {
      try {
        const educatorId = localStorage.getItem('userId');
        const token = localStorage.getItem('authToken');
        if (!educatorId || !token) {
          alert('Sessão inválida. Por favor, faça login novamente.');
          navigate('/');
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_BASE_URL}/student/`, config);

        let listaCompleta = [];
        if (Array.isArray(response.data)) {
          listaCompleta = response.data;
        } else if (response.data && Array.isArray(response.data.students)) {
          listaCompleta = response.data.students;
        }

        const meusAlunos = listaCompleta
          .filter(aluno => String(aluno.educatorId) === String(educatorId))
          .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));

        setAlunos(meusAlunos);
      } catch (error) {
        console.error("Erro ao buscar alunos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlunos();
  }, [navigate]);

  const handleAction = useCallback((studentId, type) => {
    if (type === 'click') {
      navigate('/alunosDetails', { state: { studentId } });
      return;
    }
    // IntersectionObserver trigger — load progress lazily
    setProgressMap(prev => {
      if (prev[studentId] !== undefined) return prev;
      const token = localStorage.getItem('authToken');
      // GET é idempotente — não persiste nada, retorna dados em tempo real
      axios
        .get(`${API_BASE_URL}/task-notebook-session/analysis/student/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => {
          const accuracy = res.data?.total?.accuracy ?? null;
          setProgressMap(p => ({ ...p, [studentId]: { accuracy } }));
        })
        .catch(() => {
          setProgressMap(p => ({ ...p, [studentId]: { accuracy: null } }));
        });
      return { ...prev, [studentId]: { loading: true } };
    });
  }, [navigate]);

  const filteredAlunos = alunos.filter(a =>
    (a.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentAlunos = filteredAlunos.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredAlunos.length / itemsPerPage);

  return (
    <div className="dashboard-container">
      <Navbar activePage="students" />

      <main className="alunos-main-content">
        <div className="alunos-container">

          <div className="top-container">
            <div>
              <h1>Alunos</h1>
              <p className="subtitle">Visualize e gerencie informações e progresso de cada aluno.</p>
            </div>
            <button
              className="create-patient-bnt"
              onClick={() => navigate('/CreatePacient')}
            >
              <img src={addIcon} alt="+" className="add-icon" />
              Cadastrar Aluno
            </button>
          </div>

          <div className="search-bar-wrapper">
            <input
              type="text"
              className="alunos-search-input"
              placeholder="Buscar aluno por nome..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {!loading && (
            <p className="alunos-count-label">
              Alunos organizados em ordem alfabética ({filteredAlunos.length} aluno{filteredAlunos.length !== 1 ? 's' : ''})
            </p>
          )}

          <div className="student-card-list">
            {loading ? (
              <p>Carregando alunos...</p>
            ) : filteredAlunos.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>Nenhum aluno encontrado.</p>
            ) : (
              currentAlunos.reduce((rows, aluno, i) => {
                if (i % 2 === 0) rows.push([]);
                rows[rows.length - 1].push(aluno);
                return rows;
              }, []).map((pair, rowIdx) => (
                <div key={rowIdx} className="student-row">
                  {pair.map(aluno => (
                    <StudentCard
                      key={aluno.id}
                      aluno={aluno}
                      onVerPerfil={handleAction}
                      progressMap={progressMap}
                    />
                  ))}
                </div>
              ))
            )}
          </div>

          <PageTurner
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={page => setCurrentPage(page)}
          />
        </div>
      </main>
    </div>
  );
}

export default AlunosPage;
