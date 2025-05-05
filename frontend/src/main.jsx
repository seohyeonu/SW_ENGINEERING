import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import RootRouter from '../src/routes/RootRouter'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootRouter />
  </StrictMode>,
)
