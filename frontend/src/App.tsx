import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"
import { AppShell } from "./components/layout/AppShell"
import { ClientPortalPage } from "./pages/client/ClientPortalPage"
import { ActionCenterPage } from "./pages/internal/ActionCenterPage"
import { Client720Page } from "./pages/internal/Client720Page"
import { ContactsPage } from "./pages/internal/ContactsPage"
import { DashboardPage } from "./pages/internal/DashboardPage"
import { PlaceholderPage } from "./pages/internal/PlaceholderPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/hub" replace />}
        />

        <Route
          path="/client"
          element={<ClientPortalPage />}
        />

        <Route path="/hub" element={<AppShell />}>
          <Route index element={<DashboardPage />} />

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
            path="organizations"
            element={
              <PlaceholderPage
                title="Organizations"
                description="Registry et Organization 720°."
              />
            }
          />

          <Route
            path="growth"
            element={
              <PlaceholderPage
                title="Growth Engine"
                description="Acquisition, qualification et opportunités."
              />
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
                description="Projets, intégrations et automatisations."
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
          element={<Navigate to="/hub" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}
