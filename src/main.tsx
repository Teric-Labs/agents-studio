import "@radix-ui/themes/styles.css";
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AgentBuilder from './pages/AgentBuilder'
import LandingPage from './pages/LandingPage'
import { Theme } from "@radix-ui/themes";
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TooltipProvider } from "@/components/ui/tooltip"
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? (
    <ErrorBoundary fallback={<div>Something went wrong.</div>}>
      <AgentBuilder />
    </ErrorBoundary>
  ) : (
    <LandingPage />
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <TooltipProvider>
        <AuthProvider>
          <Theme appearance="light" accentColor="amber" grayColor="slate" panelBackground="translucent" radius="small">
            <App />
          </Theme>
        </AuthProvider>
      </TooltipProvider>
    </Provider>
  </StrictMode>,
)

