import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import ProfileForm from "./pages/Employee/ProfileForm";
import SkillPrediction from "./pages/Employee/SkillPrediction";
import RecommendedCourses from "./pages/Employee/RecommendedCourses";
import SkillHistory from "./pages/Employee/SkillHistory";
import Notifications from "./pages/Employee/Notifications";
import ReviewForm from "./pages/Manager/ReviewForm";
import Pending from "./pages/Manager/Pending";
import Completed from "./pages/Manager/Completed";
import ReviewHistory from "./pages/Manager/ReviewHistory";
import CourseRequests from "./pages/Manager/CourseRequests";
import CourseNeeds from "./pages/Manager/CourseNeeds";
import Dashboard from "./pages/HR/Dashboard";
import CreateUser from "./pages/HR/CreateUser";
import EditUser from "./pages/HR/EditUser";
import StatusList from "./pages/HR/StatusList";
import PredictionStatus from "./pages/HR/PredictionStatus";
import ManageCourses from "./pages/HR/ManageCourses";
import SkillGapDetail from "./pages/HR/SkillGapDetail";
import EmployeeDetail from "./pages/HR/EmployeeDetail";
import DeactivatedEmployees from "./pages/HR/DeactivatedEmployees";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRole="employee">
                <ProfileForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/predictions"
            element={
              <ProtectedRoute allowedRole="employee">
                <SkillPrediction />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/courses"
            element={
              <ProtectedRoute allowedRole="employee">
                <RecommendedCourses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/history"
            element={
              <ProtectedRoute allowedRole="employee">
                <SkillHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employee/notifications"
            element={
              <ProtectedRoute allowedRole="employee">
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRole="manager">
                <ReviewForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/pending"
            element={
              <ProtectedRoute allowedRole="manager">
                <Pending />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/completed"
            element={
              <ProtectedRoute allowedRole="manager">
                <Completed />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/history"
            element={
              <ProtectedRoute allowedRole="manager">
                <ReviewHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/course-requests"
            element={
              <ProtectedRoute allowedRole="manager">
                <CourseRequests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager/course-needs"
            element={
              <ProtectedRoute allowedRole="manager">
                <CourseNeeds />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hr"
            element={
              <ProtectedRoute allowedRole="hr">
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hr/create-user"
            element={
              <ProtectedRoute allowedRole="hr">
                <CreateUser />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hr/status/:status"
            element={
              <ProtectedRoute allowedRole="hr">
                <StatusList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hr/edit-user/:employeeId"
            element={
              <ProtectedRoute allowedRole="hr">
                <EditUser />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hr/prediction-status"
            element={
              <ProtectedRoute allowedRole="hr">
                <PredictionStatus />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hr/courses"
            element={
              <ProtectedRoute allowedRole="hr">
                <ManageCourses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hr/employee/:employeeId"
            element={
              <ProtectedRoute allowedRole="hr">
                <EmployeeDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hr/deactivated"
            element={
              <ProtectedRoute allowedRole="hr">
                <DeactivatedEmployees />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hr/skill-gap/:skillName"
            element={
              <ProtectedRoute allowedRole="hr">
                <SkillGapDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;