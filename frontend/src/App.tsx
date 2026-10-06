import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"
import { ProtectedRoute } from "./components/auth/ProtectedRoute"
import { AppShell } from "./components/layout/AppShell"
import { ClientPortalPage } from "./pages/client/ClientPortalPage"
import { LoginPage } from "./pages/auth/LoginPage"
import { ActionCenterPage } from "./pages/internal/ActionCenterPage"
import { AuditPage } from "./pages/internal/AuditPage"
import { Client720Page } from "./pages/internal/Client720Page"
import { Organization720Page } from "./pages/internal/Organization720Page"
import { ContactsPage } from "./pages/internal/ContactsPage"
import { OrganizationsPage } from "./pages/internal/OrganizationsPage"
import { DashboardPage } from "./pages/internal/DashboardPage"
import { GrowthEnginePage } from "./pages/internal/GrowthEnginePage"
import { BusinessModulePage } from "./pages/internal/BusinessModulePage"
import { PlaceholderPage } from "./pages/internal/PlaceholderPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/client"
          element={
            <ProtectedRoute
              accountType="client"
            >
              <ClientPortalPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hub"
          element={
            <ProtectedRoute
              accountType="internal"
            >
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<DashboardPage />}
          />

          <Route
            path="contacts"
            element={<ContactsPage />}
          />

          <Route
            path="contacts/:contactId"
            element={<Client720Page />}
          />

          <Route
            path="actions"
            element={<ActionCenterPage />}
          />

          <Route
            path="audit"
            element={<AuditPage />}
          />

          <Route
            path="business/:context/:module"
            element={<BusinessModulePage />}
          />

          <Route
            path="organizations"
            element={<OrganizationsPage />}
          />

          <Route
            path="organizations/:organizationId"
            element={<Organization720Page />}
          />

          <Route
            path="growth"
            element={
              <GrowthEnginePage />
            }
          />

          <Route
            path="assurance"
            element={
              <PlaceholderPage
                title="Assurance"
                description="Pilotage métier Assurance."
              />
            }
          />

          <Route
            path="investissement"
            element={
              <PlaceholderPage
                title="Investissement"
                description="Pilotage métier Investissement."
              />
            }
          />

          <Route
            path="technologies"
            element={
              <PlaceholderPage
                title="Technologies"
                description="Clients, opportunités, projets, maintenance et opérations Technologies."
              />
            }
          />

          <Route
            path="settings"
            element={
              <PlaceholderPage
                title="Administration"
                description="Organisation, rôles et paramètres KEMS."
              />
            }
          />
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
