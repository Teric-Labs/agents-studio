import { useEffect, useRef } from 'react';
import { Box } from '@radix-ui/themes';
import * as LiveKitSDK from 'livekit-client';

export type VisualizerState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'thinking';

export function AgentAudioVisualizerBar({
    audioTrack,
    state
}: {
    audioTrack: LiveKitSDK.RemoteAudioTrack | null;
    state: VisualizerState;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const colorTrackerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const colorTracker = colorTrackerRef.current;
        if (!canvas || !colorTracker) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let analyser: AnalyserNode | null = null;
        let dataArray: Uint8Array | null = null;
        let audioCtx: AudioContext | null = null;
        let source: MediaStreamAudioSourceNode | null = null;

        // Setup high DPI Canvas
        const dpr = window.devicePixelRatio || 1;
        const width = 160;
        const height = 160;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // Global smoothed array for natural physics
        const barCount = 100;
        const smoothedValues = new Array(barCount).fill(0);
        let tick = 0;

        if (audioTrack && audioTrack.mediaStreamTrack) {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const stream = new MediaStream([audioTrack.mediaStreamTrack]);
            source = audioCtx.createMediaStreamSource(stream);
            analyser = audioCtx.createAnalyser();

            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.4;
            dataArray = new Uint8Array(analyser.frequencyBinCount);

            source.connect(analyser);
        }

        // Keep track of resolved DOM colors, starting with professional gray fallbacks
        let activeMainColor = '#a0a0a0';
        let activeHighlightColor = '#ffffff';

        const draw = () => {
            tick += 0.05;

            // Periodically resolve Radix theme colors (every ~60 frames) to safely support dark mode toggles or late CSS injection
            if (Math.floor(tick * 20) % 60 === 0 && colorTracker) {
                const style = getComputedStyle(colorTracker);
                if (style.color && style.color !== 'rgba(0, 0, 0, 0)' && style.color !== 'transparent') {
                    activeMainColor = style.color;
                    activeHighlightColor = style.backgroundColor;
                }
            }

            ctx.clearRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;
            const baseRadius = 45;

            if (analyser && dataArray && state === 'speaking') {
                analyser.getByteFrequencyData(dataArray as any);
            }

            // Draw base inner ring softly
            ctx.beginPath();
            ctx.arc(centerX, centerY, baseRadius - 2, 0, Math.PI * 2);
            ctx.strokeStyle = activeMainColor;
            ctx.globalAlpha = 0.2;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            const targetValues = new Array(barCount).fill(0);

            for (let i = 0; i < barCount; i++) {
                if (state === 'disconnected') {
                    targetValues[i] = 1;
                } else if (state === 'connecting') {
                    const angleOffset = (i / barCount) * Math.PI * 2;
                    const distanceToSpinner = Math.abs(Math.sin((angleOffset - tick * 2) / 2));
                    targetValues[i] = distanceToSpinner < 0.2 ? 10 * (1 - distanceToSpinner * 5) : 2;
                } else if (state === 'listening') {
                    targetValues[i] = 2 + (Math.sin(tick * 1.5) + 1) * 2;
                } else if (state === 'thinking') {
                    targetValues[i] = 2 + (Math.sin(tick * -2 + (i * Math.PI * 6 / barCount)) + 1) * 6;
                } else if (state === 'speaking' && dataArray) {
                    // Distribute frequencies symmetrically across the ring
                    const halfBar = barCount / 2;
                    const mirrorIndex = i < halfBar ? i : barCount - i;
                    const usefulFrequencies = Math.floor(dataArray.length * 0.3);

                    const dataIndex = Math.floor((mirrorIndex / halfBar) * usefulFrequencies);
                    targetValues[i] = Math.max(2, (dataArray[dataIndex] / 255) * 45);
                }
            }

            const tension = state === 'speaking' ? 0.4 : 0.1;
            for (let i = 0; i < barCount; i++) {
                smoothedValues[i] += (targetValues[i] - smoothedValues[i]) * tension;
            }

            // Draw glow ring if volume is high
            const maxVal = Math.max(...smoothedValues);
            if (state === 'speaking' && maxVal > 15) {
                const glowIntensity = Math.min(maxVal / 45, 1);
                ctx.beginPath();
                ctx.arc(centerX, centerY, baseRadius + 4, 0, Math.PI * 2);
                ctx.strokeStyle = activeHighlightColor;
                ctx.globalAlpha = 0.15 * glowIntensity;
                ctx.lineWidth = 10;
                ctx.filter = `blur(${8 * glowIntensity}px)`;
                ctx.stroke();
                ctx.filter = 'none';
                ctx.globalAlpha = 1.0;
            }

            // Draw the visualizer rays
            for (let i = 0; i < barCount; i++) {
                const value = smoothedValues[i];
                const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;

                const x1 = centerX + Math.cos(angle) * baseRadius;
                const y1 = centerY + Math.sin(angle) * baseRadius;
                const x2 = centerX + Math.cos(angle) * (baseRadius + value);
                const y2 = centerY + Math.sin(angle) * (baseRadius + value);

                const normalizedProgress = Math.min(value / 35, 1);
                const alpha = 0.3 + (normalizedProgress * 0.7);

                const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                gradient.addColorStop(0, activeMainColor);
                gradient.addColorStop(1, activeHighlightColor);

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.globalAlpha = alpha;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }

            animationId = requestAnimationFrame(draw);
        };

        // Prime first resolution instantly
        const initialStyle = getComputedStyle(colorTracker);
        if (initialStyle.color && initialStyle.color !== 'rgba(0, 0, 0, 0)' && initialStyle.color !== 'transparent') {
            activeMainColor = initialStyle.color;
            activeHighlightColor = initialStyle.backgroundColor;
        }

        draw();

        return () => {
            cancelAnimationFrame(animationId);
            if (source) source.disconnect();
            if (analyser) analyser.disconnect();
            if (audioCtx) audioCtx.close();
        };
    }, [audioTrack, state]);

    return (
        <Box style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {/* Invisible tracker rendered alongside to strictly inherit current DOM/Theme variables passively */}
            <div
                ref={colorTrackerRef}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', color: 'var(--accent-9)', backgroundColor: 'var(--accent-11)', width: '1px', height: '1px' }}
            >.</div>
            <canvas
                ref={canvasRef}
                style={{ width: '160px', height: '160px' }}
            />
        </Box>
    );
}
