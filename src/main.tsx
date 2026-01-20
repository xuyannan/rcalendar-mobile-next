import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const theme = createTheme({
  primaryColor: 'blue',
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme} defaultColorScheme="light">
        <Notifications position="top-center" />
        <App />
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
