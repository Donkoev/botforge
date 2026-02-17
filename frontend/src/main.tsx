// frontend/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ConfigProvider, theme } from 'antd'
import 'antd/dist/reset.css'
import './index.css' // We will create this for global overrides if needed

import ruRU from 'antd/locale/ru_RU';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ConfigProvider
            locale={ruRU}
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#6366f1',
                    colorBgContainer: 'transparent', // Let CSS handle backgrounds
                    colorBgElevated: '#1f1f1f',
                    borderRadius: 12,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    colorText: '#ffffff',
                    colorTextSecondary: 'rgba(255, 255, 255, 0.7)',
                },
                components: {
                    Button: {
                        controlHeight: 40,
                        controlHeightLG: 48,
                        controlHeightSM: 32,
                        borderRadius: 8,
                        algorithm: true,
                        primaryShadow: '0 4px 10px rgba(99, 102, 241, 0.4)',
                    },
                    Card: {
                        borderRadiusLG: 16,
                    },
                    Input: {
                        controlHeight: 42,
                        borderRadius: 8,
                    },
                    Select: {
                        controlHeight: 42,
                        borderRadius: 8,
                    },
                    Menu: {
                        itemBorderRadius: 8,
                        itemHeight: 44,
                        itemMarginInline: 12,
                        darkItemBg: 'transparent',
                    },
                    Typography: {
                        fontFamilyCode: "'Outfit', sans-serif", // Using for headers via CSS mapping if needed
                    }
                }
            }}
        >
            <App />
        </ConfigProvider>
    </React.StrictMode>,
)
