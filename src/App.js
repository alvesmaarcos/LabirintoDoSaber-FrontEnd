import "./App.css";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/Login/index";
import RegisterPage from "./pages/Register/index";
import ForgotPasswordPage from "./pages/forgotPassword/index";
import ResetPasswordPage from "./pages/resetPassword/index.js";
import HomePage from "./pages/Home/index";
import AlunosPage from "./pages/patients";
import AlunosDetails from "./pages/patientsDetails";
import CreateActivitiePage from "./pages/CreateNewActivitie";
import ActivitiePersonalizePage from "./pages/NewActivitiePersonalize";
import ActivitiesMain from "./pages/mainActivities/index.js";
import AddNotebook from "./pages/addNotebook/index.js";
import GroupActivitiesPage from "./pages/GroupActivities";
import ManageActivitiesPage from "./pages/ManageActivities";
import ActivityDetailsPage from "./pages/ActivityDetails";
import ManageGroupPage from "./pages/ManageGroup";
import ManageNotebookPage from "./pages/ManageNotebook";
import NotebookDetailsPage from "./pages/NotebookDetails";
import GroupSelectPage from "./pages/GroupSelect";
import SessionPage from "./pages/session";
import SessionTitlePage from "./pages/sessionTitle";
import SessionTypePage from "./pages/sessionType";
import SessionGroupPage from "./pages/sessionGroup";
import SessionNotebookPage from "./pages/sessionNotebook";
import SessionActivitiesPage from "./pages/sessionActivities";
import MainReport from "./pages/mainReport";
import ReportPacient from "./pages/ReportPacient/index.js";
import ReportSession from "./pages/ReportSession/index.js";
import Profile from "./pages/Profile";
import SessionInitPage from "./pages/sessionInit";
import EditStudentPage from "./pages/EditStudent";
import AnamnesePage from "./pages/anamnese";
import AnamneseFormPage from "./pages/anamneseForm";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgotPassword" element={<ForgotPasswordPage />} />
        <Route path="/resetPassword" element={<ResetPasswordPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/alunos" element={<AlunosPage />} />
        <Route path="/alunosDetails" element={<AlunosDetails />} />
        <Route path="/CreateNewActivitie" element={<CreateActivitiePage />} />
        <Route
          path="/NewActivitiePersonalize"
          element={<ActivitiePersonalizePage />}
        />
        <Route path="/activitiesMain" element={<ActivitiesMain />} />
        <Route path="/addNotebook" element={<AddNotebook />} />
        <Route path="/GroupActivities" element={<GroupActivitiesPage />} />
        <Route path="/ManageActivities" element={<ManageActivitiesPage />} />
        <Route path="/activityDetails" element={<ActivityDetailsPage />} />
        <Route path="/ManageGroup" element={<ManageGroupPage />} />
        <Route path="/ManageNotebook" element={<ManageNotebookPage />} />
        <Route path="/NotebookDetails" element={<NotebookDetailsPage />} />
        <Route path="/GroupSelect" element={<GroupSelectPage />} />
        <Route path="/Session" element={<SessionPage />} />
        <Route path="/SessionTitle" element={<SessionTitlePage />} />
        <Route path="/SessionType" element={<SessionTypePage />} />
        <Route path="/SessionGroup" element={<SessionGroupPage />} />
        <Route path="/SessionNotebook" element={<SessionNotebookPage />} />
        <Route path="/SessionActivities" element={<SessionActivitiesPage />} />
        <Route path="/MainReport" element={<MainReport />} />
        <Route path="/ReportPacient" element={<ReportPacient />} />
        <Route path="/ReportSession" element={<ReportSession />} />
        <Route path="/Profile" element={<Profile />} />
        <Route path="/SessionInit" element={<SessionInitPage />} />
        <Route path="/EditStudent" element={<EditStudentPage />} />
        <Route path="/anamnese" element={<AnamnesePage />} />
        <Route path="/anamnese/criar" element={<AnamneseFormPage />} />
        <Route path="/anamnese/editar" element={<AnamneseFormPage />} />
      </Routes>
    </div>
  );
}

export default App;
