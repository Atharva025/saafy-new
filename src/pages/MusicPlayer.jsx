import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PlayerProvider } from '@/context/PlayerContext'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import PlayerBar from '@/components/layout/PlayerBar'
import Home from '@/pages/Home'
import NewReleasesPage from '@/pages/NewReleases'
import QueuePage from '@/pages/Queue'
import Search from '@/pages/Search'
import AlbumDetails from '@/pages/AlbumDetails'
import ArtistDetails from '@/pages/ArtistDetails'
import PlaylistDetails from '@/pages/PlaylistDetails'
import NowPlaying from '@/pages/NowPlaying'
import Library from '@/pages/Library'

const MusicPlayer = () => {
    return (
        <PlayerProvider>
            <div className="h-screen bg-background-primary text-text-primary flex flex-col overflow-hidden">
                <Header />

                <div className="flex flex-1 pt-20 overflow-hidden">
                    <Sidebar />

                    <main className="flex-1 overflow-y-auto scrollbar-hide">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/new-releases" element={<NewReleasesPage />} />
                            <Route path="/queue" element={<QueuePage />} />
                            <Route path="/search" element={<Search />} />
                            <Route path="/album/:id" element={<AlbumDetails />} />
                            <Route path="/artist/:id" element={<ArtistDetails />} />
                            <Route path="/playlist/:id" element={<PlaylistDetails />} />
                            <Route path="/now-playing" element={<NowPlaying />} />
                            <Route path="/library" element={<Library />} />
                            <Route path="*" element={<Navigate to="/app" replace />} />
                        </Routes>
                    </main>
                </div>

                <PlayerBar />
            </div>
        </PlayerProvider>
    )
}

export default MusicPlayer
