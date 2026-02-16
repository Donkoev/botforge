// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ConfigProvider, theme } from 'antd'
import 'antd/dist/reset.css'
import './index.css' // We will create this for global overrides if needed

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#1890ff',
                    borderRadius: 6,
                },
            }}
        >
            <App />
        </ConfigProvider>
    </React.StrictMode>,
)
