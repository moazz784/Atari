import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminDashboard from "./pages/AdminDashboard.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import CustomerPage from "./pages/CustomerPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Customer (QR) — مفتوحة بدون login */}
        <Route path="/order" element={<CustomerPage />} />

        {/* Admin */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Staff */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}