import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { YouTubeProvider } from './contexts/YouTubeContext.jsx'

// Load Google Identity Services script
const script = document.createElement('script');
script.src = 'https://accounts.google.com/gsi/client';
script.async = true;
script.defer = true;
document.body.appendChild(script);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <YouTubeProvider>
        <App />
      </YouTubeProvider>
    </AuthProvider>
  </StrictMode>,
)
