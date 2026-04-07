import "@radix-ui/themes/styles.css";
import './index.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AgentBuilder from './pages/AgentBuilder'
import { Theme, ThemePanel } from "@radix-ui/themes";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme appearance="light" accentColor="teal" grayColor="slate" panelBackground="translucent" radius="small">
      <AgentBuilder />
    </Theme>
  </StrictMode>,
)
