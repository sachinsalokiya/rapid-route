import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import ShipmentsPage from './pages/ShipmentsPage';
import ShipmentDetailPage from './pages/ShipmentDetailPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import DriversPage from './pages/DriversPage';
import DriverDetailPage from './pages/DriverDetailPage';
import MapPage from './pages/MapPage';
import OptimizePage from './pages/OptimizePage';
import TrackingLivePage from './pages/TrackingLivePage';
import UsersPage from './pages/UsersPage';
import NotificationsPage from './pages/NotificationsPage';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

const LazyTrackPage = lazy(() => import('./pages/TrackPage'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/track"
        element={
          <Suspense fallback={<LoadingSpinner label="Loading tracker..." />}>
            <LazyTrackPage />
          </Suspense>
        }
      />
      <Route
        path="/track/:trackingNumber"
        element={
          <Suspense fallback={<LoadingSpinner label="Loading tracker..." />}>
            <LazyTrackPage />
          </Suspense>
        }
      />

      <Route
        path="/app"
        element={
          <ProtectedRoute roles={['admin', 'dispatcher', 'driver']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="shipments/:id" element={<ShipmentDetailPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />
        <Route
          path="drivers"
          element={
            <ProtectedRoute roles={['admin', 'dispatcher']}>
              <DriversPage />
            </ProtectedRoute>
          }
        />
        <Route path="drivers/:id" element={<DriverDetailPage />} />
        <Route path="map" element={<MapPage />} />
        <Route
          path="optimize"
          element={
            <ProtectedRoute roles={['admin', 'dispatcher']}>
              <OptimizePage />
            </ProtectedRoute>
          }
        />
        <Route path="live-tracking" element={<TrackingLivePage />} />
        <Route
          path="users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
