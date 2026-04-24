import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { STORAGE_USER_TOKEN } from './constants'

import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'

// 从 URL 中读取小程序传入的 token，写入 localStorage 后清除 URL 参数
const params = new URLSearchParams(window.location.search)
const tokenFromUrl = params.get('token')
if (tokenFromUrl) {
  localStorage.setItem(STORAGE_USER_TOKEN, tokenFromUrl)
  params.delete('token')
  const newSearch = params.toString()
  const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash
  window.history.replaceState({}, '', newUrl)
}

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
