  import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Employees from "./pages/Employees";
import AddEmployee from "./pages/AddEmployee";
import EditEmployee from "./pages/EditEmployee";
import EmployeeProfile from "./pages/EmployeeProfile";
import ViewEmployee from "./pages/ViewEmployee";

function getSession() {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role")?.toLowerCase();

  return {
    token,
    role,
    isAuthenticated:
      Boolean(token) && ["admin", "employee"].includes(role),
  };
}

function ProtectedRoute({ role, children }) {
  const session = getSession();

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== role.toLowerCase()) {
    return (
      <Navigate
        to={session.role === "admin" ? "/admin" : "/profile"}
        replace
      />
    );
  }

  return children;
}

function LoginRoute() {
  const session = getSession();

  // If no valid session exists, always show the login page.
  if (!session.isAuthenticated) {
    return <Login />;
  }

  return (
    <Navigate
      to={session.role === "admin" ? "/admin" : "/profile"}
      replace
    />
  );
}

function HomeRedirect() {
  const session = getSession();

  if (!session.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={session.role === "admin" ? "/admin" : "/profile"}
      replace
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees"
          element={
            <ProtectedRoute role="admin">
              <Employees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees/new"
          element={
            <ProtectedRoute role="admin">
              <AddEmployee />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees/:id/edit"
          element={
            <ProtectedRoute role="admin">
              <EditEmployee />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employees/:id"
          element={
            <ProtectedRoute role="admin">
              <ViewEmployee />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute role="employee">
              <EmployeeProfile />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
