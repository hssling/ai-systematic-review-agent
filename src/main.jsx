import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SystematicReviewApp from './SystematicReviewApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SystematicReviewApp />
  </StrictMode>,
)
