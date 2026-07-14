import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { ContentProvider } from './context/ContentContext'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <ContentProvider>
        <App />
      </ContentProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
