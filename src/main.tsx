import "@radix-ui/themes/styles.css";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AgentBuilder from './pages/AgentBuilder'
import { Theme, ThemePanel } from "@radix-ui/themes";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme>
      <AgentBuilder />
    </Theme>
  </StrictMode>,
)
