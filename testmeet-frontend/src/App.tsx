import { Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './shared/context/UserContext';
import { RoomProvider } from './shared/context/RoomContext';
import { LoginPage } from './features/auth/presentation/pages/LoginPage';
import { DashboardPage } from './features/dashboard/presentation/pages/DashboardPage';
import { RoomLobbyPage } from './features/rooms/presentation/pages/RoomLobbyPage';
import { RoomPage } from './features/rooms/presentation/pages/RoomPage';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  return user ? <>{children}</> : <Navigate to="/" />;
}

function AppRoutes() {
  const { user } = useUser();

  return (
    <Container className="vh-100 d-flex align-items-center justify-content-center">
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/:inviteLink"
          element={
            <ProtectedRoute>
              <RoomLobbyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/room/:roomId/session"
          element={
            <ProtectedRoute>
              <RoomPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Container>
  );
}

export default function App() {
  return (
    <UserProvider>
      <RoomProvider>
        <AppRoutes />
      </RoomProvider>
    </UserProvider>
  );
}