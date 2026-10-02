import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import { ActionsProvider } from "./context/ActionsProvider"
import { AuthProvider } from "./context/AuthProvider"
import { ProjectionProvider } from "./context/ProjectionProvider"

createRoot(
  document.getElementById("root")!,
).render(
  <StrictMode>
    <AuthProvider>
      <ProjectionProvider>
        <ActionsProvider>
          <App />
        </ActionsProvider>
      </ProjectionProvider>
    </AuthProvider>
  </StrictMode>,
)
