import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_cGV0LWNyb3ctNDUuY2xlcmsuYWNjb3VudHMuZGV2JA'}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)
