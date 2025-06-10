import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Performance monitoring for scene editor
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
  console.log('CraftVerse Scene Editor - Development Mode')
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
)