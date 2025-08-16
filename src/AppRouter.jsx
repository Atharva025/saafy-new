import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from '@/pages/LandingPage'
import MusicPlayer from '@/pages/MusicPlayer'

const AppRouter = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/app/*" element={<MusicPlayer />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    )
}

export default AppRouter
