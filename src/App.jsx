import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminDashboard from "./pages/AdminDashboard.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import CustomerPage from "./pages/CustomerPage.jsx";
import { BranchProvider } from "./BranchContext";

export default function App() {
  return (
    <BranchProvider>
      <BrowserRouter>
        <Routes>

          {/* Admin */}
          <Route path="/" element={<AdminDashboard />} />

          {/* Staff */}
          <Route path="/staff" element={<StaffDashboard />} />

          {/* Customer */}
          <Route path="/order" element={<CustomerPage />} />

        </Routes>
      </BrowserRouter>
    </BranchProvider>
  );
}