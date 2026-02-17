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
                    colorPrimary: '#6366f1', // Violet/Indigo
                    colorBgContainer: '#1f1f1f',
                    colorBgElevated: '#1f1f1f',
                    borderRadius: 12,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                },
                components: {
                    Button: {
                        controlHeight: 40,
                        controlHeightLG: 48,
                        controlHeightSM: 32,
                        borderRadius: 8,
                        algorithm: true, // Enable algorithm for button states
                    },
                    Card: {
                        borderRadiusLG: 16,
                        colorBgContainer: 'rgba(31, 31, 31, 0.6)', // Semi-transparent for glass effect
                    },
                    Input: {
                        controlHeight: 40,
                        borderRadius: 8,
                        colorBgContainer: 'rgba(255, 255, 255, 0.04)',
                        colorBorder: 'rgba(255, 255, 255, 0.1)',
                    },
                    Select: {
                        controlHeight: 40,
                        borderRadius: 8,
                        colorBgContainer: 'rgba(255, 255, 255, 0.04)',
                        colorBorder: 'rgba(255, 255, 255, 0.1)',
                    },
                    Table: {
                        borderRadiusLG: 12,
                        colorBgContainer: 'rgba(31, 31, 31, 0.4)',
                        headerBg: 'rgba(255, 255, 255, 0.02)',
                    },
                    Menu: {
                        itemBorderRadius: 8,
                        itemHeight: 44,
                        itemMarginInline: 12,
                    }
                }
            }}
        >
            <App />
        </ConfigProvider>
    </React.StrictMode>,
)
