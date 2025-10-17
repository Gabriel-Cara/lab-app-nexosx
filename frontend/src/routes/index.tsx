import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/layout/app-layout";
import { useAuth } from "../hooks/useAuth";
import { DashboardPage } from "../pages/dashboard";
import { EventsPage } from "../pages/events";
import { LoginPage } from "../pages/auth/login";
import { PackagesPage } from "../pages/packages";
import { ResidentsPage } from "../pages/residents";
import { VisitorsPage } from "../pages/visitors";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const LayoutRoute = ({ children }: { children: React.ReactNode }) => {
  return <AppLayout>{children}</AppLayout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <LayoutRoute>
              <DashboardPage />
            </LayoutRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/packages"
        element={
          <ProtectedRoute>
            <LayoutRoute>
              <PackagesPage />
            </LayoutRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/residents"
        element={
          <ProtectedRoute>
            <LayoutRoute>
              <ResidentsPage />
            </LayoutRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/visitors"
        element={
          <ProtectedRoute>
            <LayoutRoute>
              <VisitorsPage />
            </LayoutRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <LayoutRoute>
              <EventsPage />
            </LayoutRoute>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
