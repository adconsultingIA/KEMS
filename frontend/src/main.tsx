import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App"
import { ActionsProvider } from "./context/ActionsProvider"

createRoot(
  document.getElementById("root")!,
).render(
  <StrictMode>
    <ActionsProvider>
      <App />
    </ActionsProvider>
  </StrictMode>,
)
