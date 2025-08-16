import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import SongListItem from '@/components/music/SongListItem'
import { Heart, Clock, ListMusic, Download } from 'lucide-react'

const tabs = [
    { id: 'liked', label: 'Liked Songs', icon: Heart },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'recent', label: 'Recently Played', icon: Clock },
    { id: 'downloaded', label: 'Downloaded', icon: Download },
]

export default function Library() {
    const [activeTab, setActiveTab] = useState('liked')

    // Mock data - in a real app, this would come from user's library
    const mockLikedSongs = []
    const mockPlaylists = []
    const mockRecentSongs = []
    const mockDownloaded = []

    const renderEmptyState = (title, description, icon) => {
        const Icon = icon
        return (
            <div className="text-center py-16">
                <Icon className="w-24 h-24 text-text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-heading font-semibold text-text-secondary mb-2">{title}</h3>
                <p className="text-text-secondary/70 mb-8">{description}</p>
                <Button onClick={() => window.location.href = '/search'}>
                    Browse Music
                </Button>
            </div>
        )
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'liked':
                return mockLikedSongs.length > 0 ? (
                    <div className="space-y-2">
                        {mockLikedSongs.map((song, index) => (
                            <SongListItem key={song.id} song={song} index={index} />
                        ))}
                    </div>
                ) : (
                    renderEmptyState(
                        "No liked songs yet",
                        "Heart songs to build your collection",
                        Heart
                    )
                )

            case 'playlists':
                return mockPlaylists.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {mockPlaylists.map((playlist) => (
                            <Card key={playlist.id} className="cursor-pointer hover:bg-gray-750">
                                <CardContent className="p-4">
                                    <div className="aspect-square bg-gray-700 rounded-lg mb-3">
                                        <img
                                            src={playlist.image}
                                            alt={playlist.name}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    </div>
                                    <h3 className="font-semibold text-white text-sm truncate">
                                        {playlist.name}
                                    </h3>
                                    <p className="text-gray-400 text-xs">
                                        {playlist.songCount} songs
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    renderEmptyState(
                        "No playlists created",
                        "Create your first playlist to organize your music",
                        ListMusic
                    )
                )

            case 'recent':
                return mockRecentSongs.length > 0 ? (
                    <div className="space-y-2">
                        {mockRecentSongs.map((song, index) => (
                            <SongListItem key={song.id} song={song} index={index} />
                        ))}
                    </div>
                ) : (
                    renderEmptyState(
                        "No recent activity",
                        "Songs you play will appear here",
                        Clock
                    )
                )

            case 'downloaded':
                return mockDownloaded.length > 0 ? (
                    <div className="space-y-2">
                        {mockDownloaded.map((song, index) => (
                            <SongListItem key={song.id} song={song} index={index} />
                        ))}
                    </div>
                ) : (
                    renderEmptyState(
                        "No downloaded music",
                        "Download songs for offline listening",
                        Download
                    )
                )

            default:
                return null
        }
    }

    return (
        <div className="flex-1 bg-background overflow-y-auto">
            <div className="max-w-7xl mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">Your Library</h1>
                    <p className="text-text-secondary">
                        Your music collection and personal playlists
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${isActive
                                        ? 'bg-accent text-gray-900 shadow-lg'
                                        : 'bg-background-secondary text-text-secondary hover:text-text-primary hover:bg-background-secondary'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Content */}
                <div className="min-h-96">
                    {renderContent()}
                </div>

                {/* Quick Stats */}
                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-br from-accent to-accent-blue text-white">
                        <CardContent className="p-6 text-center">
                            <div className="text-2xl font-bold mb-1">0</div>
                            <div className="text-sm opacity-100">Liked Songs</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
                        <CardContent className="p-6 text-center">
                            <div className="text-2xl font-bold mb-1">0</div>
                            <div className="text-sm opacity-100">Playlists</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-accent-blue to-indigo-600 text-white">
                        <CardContent className="p-6 text-center">
                            <div className="text-2xl font-bold mb-1">0</div>
                            <div className="text-sm opacity-100">Following</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-accent-orange to-accent-secondary text-white">
                        <CardContent className="p-6 text-center">
                            <div className="text-2xl font-bold mb-1">0h</div>
                            <div className="text-sm opacity-100">Listening Time</div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
