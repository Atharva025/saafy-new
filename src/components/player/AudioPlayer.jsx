import React from 'react'
import { usePlayer } from '@/context/PlayerContext'

export default function AudioPlayer() {
    const { audioRef } = usePlayer()

    return (
        <audio
            ref={audioRef}
            preload="metadata"
            crossOrigin="anonymous"
            style={{ display: 'none' }}
        />
    )
}
