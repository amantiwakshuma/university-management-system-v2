import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./components/Login/Login ";
import StudentDashboard from "./components/Dashboard/Student/StudentDashboard/StudentDashboard";
import InstructorDashboard from "./components/Dashboard/InstructorDashboard";
import AdminDashboard from "./components/Dashboard/Admin/AdminDashboard";
import Register from "./components/Registration/Register";
import Home from "./components/Home/Home";
import Library from "./components/Library/Library";
import HomeDashboard from "./components/Dashboard/HomeDashboard/HomeDashboard";

// PrivateRoute component to protect routes
function PrivateRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  // Not logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check role permission
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === "student") return <Navigate to="/student" replace />;
    if (user.role === "instructor")
      return <Navigate to="/instructor" replace />;
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      {/* Toast notifications container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/library" element={<Library />} />

        {/* Protected Home Dashboard (Landing after login) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute allowedRoles={["student", "instructor", "admin"]}>
              <HomeDashboard />
            </PrivateRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/student/*"
          element={
            <PrivateRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </PrivateRoute>
          }
        />

        {/* Instructor Routes */}
        <Route
          path="/instructor/*"
          element={
            <PrivateRoute allowedRoles={["instructor"]}>
              <InstructorDashboard />
            </PrivateRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Catch all - redirect to home page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;