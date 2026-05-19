import React, { useEffect, useState, useRef } from 'react';
import * as LiveKitSDK from 'livekit-client';
import { Box } from '@radix-ui/themes';

export type VisualizerState = 'connecting' | 'listening' | 'speaking' | 'thinking' | 'error' | 'disconnected';

// --- WebGL Shaders ---
const vertexShaderSource = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShaderSource = `
precision highp float;
uniform float uTime;
uniform vec3 uColor;
uniform vec2 uResolution;
uniform float uAmplitude;
uniform float uSpeed;
varying vec2 vUv;

void main() {
    float mr = min(uResolution.x, uResolution.y);
    vec2 uv = (vUv * 2.0 - 1.0) * uResolution.xy / mr;
    
    float d = -uTime * 0.5 * uSpeed;
    float a = 0.0;
    
    // Iridescence / Plasma animation loop
    for (float i = 0.0; i < 8.0; ++i) {
        a += cos(i - d - a * uv.x);
        d += sin(uv.y * i + a);
    }
    
    // Color generation
    vec3 col = vec3(cos(uv * vec2(d, a)) * 0.6 + 0.4, cos(a + d) * 0.5 + 0.5);
    col = cos(col * cos(vec3(d, a, 2.5)) * 0.5 + 0.5) * uColor;
    
    // Add a soft circular mask to make it look like an orb
    float dist = length(vUv * 2.0 - 1.0);
    float mask = 1.0 - smoothstep(0.8, 1.0, dist);
    
    gl_FragColor = vec4(col, mask);
}
`;

function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
    ] : [0.3, 0.6, 1];
}

export function AgentAudioVisualizerBar({
    audioTrack,
    state,
    theme = 'circle',
    color = '#f0ad44',
    volume: volumeProp
}: {
    audioTrack: LiveKitSDK.RemoteAudioTrack | null;
    state: VisualizerState;
    theme?: 'circle' | 'bars';
    color?: string;
    volume?: number;
}) {
    const [volume, setVolume] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const glRef = useRef<WebGLRenderingContext | null>(null);
    const programRef = useRef<WebGLProgram | null>(null);
    const volumeRef = useRef(0);

    // Audio Analysis
    useEffect(() => {
        if (volumeProp !== undefined) {
            setVolume(volumeProp);
            volumeRef.current = volumeProp;
            return;
        }

        if (!audioTrack || !audioTrack.mediaStreamTrack || (state === 'disconnected' || state === 'connecting')) {
            setVolume(0);
            volumeRef.current = 0;
            return;
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack.mediaStreamTrack]));
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        let rafId: number;

        const update = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            const vol = Math.min(avg / 128, 1.0);
            
            // Smoothing for visual flow
            setVolume(v => v + (vol - v) * 0.2);
            volumeRef.current = volumeRef.current + (vol - volumeRef.current) * 0.2;
            
            rafId = requestAnimationFrame(update);
        };
        update();

        return () => {
            cancelAnimationFrame(rafId);
            audioContext.close();
        };
    }, [audioTrack, state, volumeProp]);

    // Define activeColor based on state
    const activeColor = state === 'error' ? '#ef4444' : 
                       state === 'connecting' ? '#3b82f6' : 
                       state === 'listening' ? '#22d3ee' : 
                       color;

    // WebGL Setup
    useEffect(() => {
        if (!canvasRef.current || theme === 'bars') return;

        const canvas = canvasRef.current;
        const gl = canvas.getContext('webgl', { alpha: true });
        if (!gl) return;
        glRef.current = gl;

        // Compile Shaders
        const createShader = (type: number, source: string) => {
            const shader = gl.createShader(type)!;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        };

        const program = gl.createProgram()!;
        gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderSource));
        gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
        gl.linkProgram(program);
        gl.useProgram(program);
        programRef.current = program;

        // Create a full-screen quad (triangle that covers everything)
        // We use a large triangle to avoid having to setup multiple triangles
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1, 0, 0,
            3, -1, 2, 0,
            -1, 3, 0, 2,
        ]), gl.STATIC_DRAW);

        const posAttr = gl.getAttribLocation(program, 'position');
        const uvAttr = gl.getAttribLocation(program, 'uv');
        gl.enableVertexAttribArray(posAttr);
        gl.enableVertexAttribArray(uvAttr);
        gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 16, 8);

        let raf: number;
        const render = (t: number) => {
            if (!glRef.current || !programRef.current) return;
            const gl = glRef.current;
            const prog = programRef.current;
            
            const rgb = hexToRgb(color);
            const amp = 0.18 + volumeRef.current * 1.7;
            const spd = 0.75 + volumeRef.current * 0.5;

            // Set Uniforms
            gl.uniform1f(gl.getUniformLocation(prog, 'uTime'), t * 0.001);
            gl.uniform3f(gl.getUniformLocation(prog, 'uColor'), rgb[0], rgb[1], rgb[2]);
            gl.uniform2f(gl.getUniformLocation(prog, 'uResolution'), canvas.width, canvas.height);
            gl.uniform1f(gl.getUniformLocation(prog, 'uAmplitude'), amp);
            gl.uniform1f(gl.getUniformLocation(prog, 'uSpeed'), spd);

            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            
            raf = requestAnimationFrame(render);
        };
        raf = requestAnimationFrame(render);

        return () => cancelAnimationFrame(raf);
    }, [theme, color]);

    const scale = 1 + volume * 0.35;
    const glowOpacity = 0.25 + volume * 0.75;

    return (
        <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
            {theme === 'circle' ? (
                <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Shadow / Base Glow */}
                    <div 
                        style={{ 
                            position: 'absolute', 
                            inset: 0, 
                            borderRadius: '50%', 
                            backgroundColor: color, 
                            filter: 'blur(30px)', 
                            opacity: glowOpacity * 0.3,
                            transform: `scale(${scale * 1.2})`,
                            transition: 'transform 0.15s ease-out'
                        }} 
                    />
                    
                    {/* The Iridescent Orb */}
                    <div style={{ 
                        position: 'relative',
                        width: '120px', 
                        height: '120px', 
                        borderRadius: '50%', 
                        overflow: 'hidden',
                        boxShadow: `0 0 50px ${color}44`,
                        transform: `scale(${scale})`,
                        transition: 'transform 0.15s ease-out',
                        border: `2px solid ${color}33`
                    }}>
                        <canvas 
                            ref={canvasRef} 
                            width={300} 
                            height={300} 
                            style={{ width: '100%', height: '100%', display: 'block' }}
                        />
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '60px', padding: '10px' }}>
                    {[0.6, 1.0, 0.8, 1.2, 0.9, 0.7].map((scaleFactor, i) => (
                        <div 
                            key={i}
                            style={{
                                width: '8px',
                                height: `${20 + (volume * 40 * scaleFactor)}px`,
                                minHeight: '8px',
                                backgroundColor: activeColor,
                                borderRadius: '10px',
                                transition: 'height 0.1s ease-out',
                                opacity: 0.7 + (volume * 0.3),
                                boxShadow: `0 0 10px ${activeColor}66`
                            }}
                        />
                    ))}
                </div>
            )}
        </Box>
    );
}
