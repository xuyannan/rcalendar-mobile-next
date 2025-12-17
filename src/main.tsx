import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// import 'antd-mobile/es/global' // Optional depending on version, let's include it just in case if needed or rely on auto. 
// Actually v5 doesn't strictly require global css import if not using some resets. 
// But let's verify if index.css exists.

import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
