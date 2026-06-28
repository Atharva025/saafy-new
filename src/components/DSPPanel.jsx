import { useState, useEffect } from 'react'
import { usePlayer } from '@/context/PlayerContext'
import { useTheme } from '@/context/ThemeContext'
import { Sliders, HelpCircle, ToggleLeft, ToggleRight, Info } from 'lucide-react'

export default function DSPPanel() {
    const { colors, fonts, isDark } = useTheme()
    const {
        eqGains,
        setEqGain,
        eqPreset,
        setEqPreset,
        reverbEnabled,
        toggleReverb,
        reverbMix,
        setReverbMix,
        reverbType,
        setReverbType,
        vocalReducerEnabled,
        toggleVocalReducer
    } = usePlayer()

    const frequencies = ['60Hz', '230Hz', '910Hz', '4kHz', '14kHz']
    const reverbTypes = ['Cozy Room', 'Concert Hall', 'Cathedral', 'Deep Cave']
    const presets = ['Flat', 'Bass Boost', 'Vocal Boost', 'Acoustic', 'Treble Boost']

    const glassPanelStyle = {
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)',
    }

    const dropdownStyle = {
        padding: '8px 12px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        fontSize: '13px',
        fontFamily: fonts?.primary || 'sans-serif',
        cursor: 'pointer',
        outline: 'none',
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: '100%',
            overflowY: 'auto',
            paddingRight: '4px',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} style={{ color: 'var(--color-accent)' }} />
                <span style={{ fontFamily: fonts?.display, fontWeight: 700, fontSize: '15px', letterSpacing: '0.03em' }}>
                    DSP AUDIO EFFECTS
                </span>
            </div>

            {/* 1. Equalizer Section */}
            <div style={glassPanelStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontFamily: fonts?.primary }}>
                        Studio Equalizer
                    </span>
                    <select
                        value={eqPreset}
                        onChange={(e) => setEqPreset(e.target.value)}
                        style={dropdownStyle}
                    >
                        {presets.map(p => (
                            <option key={p} value={p} style={{ backgroundColor: '#181818' }}>{p} Preset</option>
                        ))}
                    </select>
                </div>

                {/* EQ Sliders Grid */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '140px',
                    padding: '8px 4px 0',
                    background: 'rgba(0, 0, 0, 0.15)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0,0,0,0.2)'
                }}>
                    {frequencies.map((freq, index) => {
                        const gain = eqGains[index] || 0;
                        return (
                            <div key={freq} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                height: '100%',
                                flex: 1,
                            }}>
                                {/* Slider value display */}
                                <span style={{
                                    fontSize: '10px',
                                    color: 'rgba(255,255,255,0.4)',
                                    fontFamily: fonts?.mono,
                                    marginBottom: '4px'
                                }}>
                                    {gain > 0 ? `+${gain}` : gain}dB
                                </span>

                                {/* Slider track */}
                                <div style={{
                                    position: 'relative',
                                    height: '80px',
                                    width: '18px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    cursor: 'ns-resize'
                                }}>
                                    {/* Skeuomorphic groove */}
                                    <div style={{
                                        position: 'absolute',
                                        width: '4px',
                                        height: '100%',
                                        background: 'rgba(0,0,0,0.5)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '2px',
                                    }} />

                                    {/* Active Track Highlight */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        width: '4px',
                                        height: `${((gain + 12) / 24) * 100}%`,
                                        background: 'var(--color-accent)',
                                        borderRadius: '2px',
                                        boxShadow: '0 0 6px var(--color-accent)',
                                        pointerEvents: 'none'
                                    }} />

                                    {/* Range Input element overlayed vertically */}
                                    <input
                                        type="range"
                                        min="-12"
                                        max="12"
                                        step="1"
                                        value={gain}
                                        onChange={(e) => setEqGain(index, parseInt(e.target.value, 10))}
                                        style={{
                                            writingMode: 'bt-lr', /* Webkit vertical style */
                                            WebkitAppearance: 'slider-vertical', /* Native Vertical Slider */
                                            width: '100%',
                                            height: '100%',
                                            opacity: 0, /* Hide standard track and thumb, use overlays */
                                            cursor: 'ns-resize',
                                            margin: 0
                                        }}
                                    />

                                    {/* Skeuomorphic Knob Thumb */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: `calc(${((gain + 12) / 24) * 100}% - 8px)`,
                                        width: '16px',
                                        height: '14px',
                                        borderRadius: '4px',
                                        background: 'linear-gradient(135deg, #4d4d4d 0%, #262626 100%)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.2)',
                                        pointerEvents: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {/* Center Indicator Notch */}
                                        <div style={{ width: '8px', height: '2px', background: 'var(--color-accent)', opacity: 0.8 }} />
                                    </div>
                                </div>

                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: 'rgba(255,255,255,0.6)',
                                    marginTop: '8px',
                                    fontFamily: fonts?.primary
                                }}>
                                    {freq}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 2. Reverb & Space Section */}
            <div style={glassPanelStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontFamily: fonts?.primary }}>
                            Spatial Reverb
                        </span>
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                            Convolver spatial emulation
                        </span>
                    </div>

                    <button
                        onClick={toggleReverb}
                        style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: reverbEnabled ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)',
                            transition: 'color 0.2s',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {reverbEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                </div>

                {reverbEnabled && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        padding: '12px',
                        background: 'rgba(0,0,0,0.15)',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.2)',
                        animation: 'cardFadeIn 0.3s ease-out'
                    }}>
                        {/* Reverb Type Select */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                                Environment
                            </span>
                            <select
                                value={reverbType}
                                onChange={(e) => setReverbType(e.target.value)}
                                style={{ ...dropdownStyle, padding: '4px 10px', fontSize: '12px' }}
                            >
                                {reverbTypes.map(t => (
                                    <option key={t} value={t} style={{ backgroundColor: '#181818' }}>{t}</option>
                                ))}
                            </select>
                        </div>

                        {/* Wet Mix Slider */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Wet Mix</span>
                                <span style={{ color: 'var(--color-accent)', fontFamily: fonts?.mono }}>
                                    {Math.round(reverbMix * 100)}%
                                </span>
                            </div>

                            <input
                                type="range"
                                min="0.0"
                                max="0.8"
                                step="0.05"
                                value={reverbMix}
                                onChange={(e) => setReverbMix(parseFloat(e.target.value))}
                                style={{
                                    width: '100%',
                                    accentColor: 'var(--color-accent)',
                                    height: '6px',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    backgroundColor: 'rgba(0,0,0,0.4)',
                                    border: 'none',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Vocal Reducer (Karaoke) */}
            <div style={{
                ...glassPanelStyle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontFamily: fonts?.primary }}>
                        Vocal Reducer (Karaoke)
                    </span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px', maxWidth: '80%' }}>
                        Inverts center channel frequencies to filter out vocals.
                    </span>
                </div>

                <button
                    onClick={toggleVocalReducer}
                    style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        color: vocalReducerEnabled ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)',
                        transition: 'color 0.2s',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    {vocalReducerEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
            </div>
            
            {/* Info Footer */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.03)'
            }}>
                <Info size={14} style={{ color: 'rgba(255,255,255,0.3)', marginTop: '1px', flexShrink: 0 }} />
                <span style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.45 }}>
                    These filters use real-time hardware-accelerated Web Audio processing. Keep levels balanced to prevent clipping.
                </span>
            </div>
        </div>
    )
}
