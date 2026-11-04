import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ThemeToggle from './ThemeToggle.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeToggle /> {/* outside App, so it's on every page: mine, Sam's and the sign-in page */}
    <App />
  </StrictMode>,
)
