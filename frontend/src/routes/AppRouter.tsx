import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

import { Login } from "@/pages/auth/Login";
import { Unauthorized } from "@/pages/Unauthorized";
import { DesignSystem } from "@/pages/DesignSystem";

import { CitizenLayout } from "@/layouts/CitizenLayout";
import { OfficerLayout } from "@/layouts/OfficerLayout";
import { ContractorLayout } from "@/layouts/ContractorLayout";
import { AdminLayout } from "@/layouts/AdminLayout";

import { ReportComplaint } from "@/pages/citizen/ReportComplaint";
import { MyComplaints } from "@/pages/citizen/MyComplaints";
import { OfficerDashboard } from "@/pages/officer/OfficerDashboard";
import { MapView } from "@/pages/officer/MapView";
import { Contractors } from "@/pages/officer/Contractors";
import { Analytics } from "@/pages/officer/Analytics";
import { ComplaintDetail } from "@/pages/officer/ComplaintDetail";
import { AssignedJobs } from "@/pages/contractor/AssignedJobs";
import { JobDetail } from "@/pages/contractor/JobDetail";
import { UserManagement } from "@/pages/admin/UserManagement";
import { Settings } from "@/pages/admin/Settings";
import { Analytics as AdminAnalytics } from "@/pages/officer/Analytics";

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/design-system" element={<DesignSystem />} />

          {/* Citizen-only routes */}
          <Route element={<ProtectedRoute allowedRoles={["citizen"]} />}>
            <Route element={<CitizenLayout />}>
              <Route path="/citizen/report" element={<ReportComplaint />} />
              <Route path="/citizen/complaints" element={<MyComplaints />} />
              <Route
                path="/citizen/dashboard"
                element={<Navigate to="/citizen/report" replace />}
              />
            </Route>
          </Route>

          {/* Officer-only routes */}
          <Route element={<ProtectedRoute allowedRoles={["officer"]} />}>
            <Route element={<OfficerLayout />}>
              <Route path="/officer/dashboard" element={<OfficerDashboard />} />
              <Route path="/officer/map" element={<MapView />} />
              <Route
                path="/officer/complaints/:id"
                element={<ComplaintDetail />}
              />
              <Route path="/officer/contractors" element={<Contractors />} />
              <Route path="/officer/analytics" element={<Analytics />} />
            </Route>
          </Route>

          {/* Contractor-only routes */}
          <Route element={<ProtectedRoute allowedRoles={["contractor"]} />}>
            <Route element={<ContractorLayout />}>
              <Route path="/contractor/jobs" element={<AssignedJobs />} />
              <Route path="/contractor/jobs/:id" element={<JobDetail />} />
              <Route
                path="/contractor/dashboard"
                element={<Navigate to="/contractor/jobs" replace />}
              />
            </Route>
          </Route>

          {/* Admin-only routes */}
          {/* Admin-only routes */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route
                path="/admin/dashboard"
                element={<Navigate to="/admin/users" replace />}
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
