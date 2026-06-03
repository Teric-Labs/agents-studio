import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import * as LiveKitSDK from 'livekit-client';
import { Activity, BarChart, Bell, Book, Bot, Brain, Briefcase, Building2, Calendar, Car, Check, CheckCircle, CheckSquare, ChevronLeft, ChevronRight, Code, Copy, Eye, EyeOff, ExternalLink, Globe, GraduationCap, Hammer, Headphones, HeartHandshake, History, Key, LogOut, Menu, MessageSquare, MessageSquareOff, Mic, MoreVertical, Music, Palette, Phone, PhoneOff, Plane, Play, Plus, RefreshCw, Save, Scale, Search, Settings, ShoppingCart, Stethoscope, Trash2, Truck, Undo, User, UserCheck, UtensilsCrossed, Workflow, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GmailIcon from '../assets/gmail.svg';
import GoogleCalendarIcon from '../assets/googlecalendar.svg';
import GoogleSheetsIcon from '../assets/googlesheets.svg';
import phosaiLogo from '../assets/phosai_logo.png';

import { Flex, Text, Button, Box, Grid, Card, Badge, Tabs, TextField, TextArea, Switch, Select, Slider, Heading, Separator, Tooltip, Table, IconButton, SegmentedControl, AlertDialog, Popover, ScrollArea } from '@radix-ui/themes';
import { AgentAudioVisualizerBar } from '../AgentAudioVisualizerBar';
import type { VisualizerState } from '../AgentAudioVisualizerBar';
import { AgentAudioVisualizerGrid } from '../components/agents-ui/agent-audio-visualizer-grid';
import { AgentAudioVisualizerRadial } from '../components/agents-ui/agent-audio-visualizer-radial';
import { AgentAudioVisualizerWave } from '../components/agents-ui/agent-audio-visualizer-wave';
import { AgentAudioVisualizerAura } from '../components/agents-ui/agent-audio-visualizer-aura';
import { AgentWorkflowBuilder } from '../AgentWorkflowBuilder';
import { KnowledgeBaseManager } from '../components/KnowledgeBaseManager';
import { AgentChatTranscript } from '../components/agents-ui/agent-chat-transcript';
import * as Toast from '@radix-ui/react-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://backend.atekervoices.com';
const IS_DEV = import.meta.env.DEV;
const PHOSAI_TTS_URL = IS_DEV && import.meta.env.VITE_PHOSAI_TTS_URL
	? '/phosai-api'
	: (import.meta.env.VITE_PHOSAI_TTS_URL || '');

// Add axios interceptor to include Firebase token
axios.interceptors.request.use(async (config) => {
	const token = await localStorage.getItem('firebase_token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

import WaveSurfer from 'wavesurfer.js';
import * as Flags from 'country-flag-icons/react/3x2';

type ProviderConfig = {
	features: string[];
	models?: any[];
	voice_options?: any[];
	config_fields?: any[];
};

const VoiceCard = ({ voice, playingVoiceId, previewAudioUrl, onPlayToggle, themeColor = '#f0ad44', showToast }: any) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const wsRef = useRef<WaveSurfer | null>(null);
	const isActive = playingVoiceId === voice.id;
	const FlagComponent = voice.flag && (Flags as any)[voice.flag] ? (Flags as any)[voice.flag] : null;

	useEffect(() => {
		if (containerRef.current && !wsRef.current) {
			wsRef.current = WaveSurfer.create({
				container: containerRef.current,
				waveColor: '#d1d5db',
				progressColor: themeColor,
				barWidth: 3,
				barGap: 2,
				barRadius: 2,
				height: 30,
				cursorWidth: 0,
				interact: false,
			});
			
			const fakePeaks = Array.from({ length: 40 }).map((_, i) => Math.abs(Math.sin(i * 0.4)) * 0.5 + Math.random() * 0.5);
			wsRef.current.load('', [fakePeaks]);
			
			wsRef.current.on('finish', () => {
				onPlayToggle(voice.id, true);
			});
		}
		return () => {
			if (wsRef.current) {
				wsRef.current.destroy();
				wsRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (wsRef.current) {
			if (isActive) {
				wsRef.current.setOptions({ waveColor: '#9ca3af' });
				if (previewAudioUrl) {
					wsRef.current.load(previewAudioUrl).then(() => {
						wsRef.current?.play();
					});
				}
			} else {
				wsRef.current.setOptions({ waveColor: '#d1d5db' });
				wsRef.current.stop();
			}
		}
	}, [isActive, previewAudioUrl]);

	return (
		<Card size="2" style={{ borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
			<Flex direction="column" gap="3" style={{ height: '100%' }}>
				<Flex justify="between" align="start">
					<Flex gap="3" align="center">
						<IconButton radius="full" size="3" style={{ backgroundColor: themeColor, color: '#ffffff', cursor: 'pointer' }} onClick={() => onPlayToggle(voice.id, false)} disabled={isActive && !previewAudioUrl}>
							{isActive && !previewAudioUrl ? <RefreshCw size={18} className="animate-spin" /> : (isActive ? <span style={{ width: '12px', height: '12px', backgroundColor: '#fff', display: 'inline-block', borderRadius: '2px' }} /> : <Play size={18} style={{ marginLeft: '2px', fill: 'currentColor' }} />)}
						</IconButton>
						<Box>
							<Flex gap="2" align="center">
								{FlagComponent ? (
									<Box style={{ width: '20px', display: 'flex', alignItems: 'center' }}>
										<FlagComponent title={voice.flag} style={{ width: '100%', borderRadius: '2px' }} />
									</Box>
								) : (
									<span style={{ fontSize: '14px' }}>{voice.flag}</span>
								)}
								<Text size="3" weight="bold" style={{ color: '#111827', display: 'block', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={voice.name}>{voice.name}</Text>
								<Text size="2" style={{ color: '#111827' }}>{voice.gender}</Text>
							</Flex>
							<Flex gap="2" align="center" style={{ marginTop: '2px', visibility: 'hidden', height: 0, overflow: 'hidden' }}>
								<Text size="1" style={{ color: '#111827', fontFamily: 'monospace' }}>{voice.id}</Text>
								<Copy size={10} color="#111827" style={{ cursor: 'pointer' }} onClick={() => { navigator.clipboard.writeText(voice.id); showToast("ID Copied", "Voice ID has been copied to clipboard."); }} />
							</Flex>
						</Box>
					</Flex>
					<IconButton variant="ghost" size="1" style={{ color: '#9ca3af' }}>
						<MoreVertical size={16} />
					</IconButton>
				</Flex>
				
				<Box my="2">
					<Flex justify="between" mb="1">
						<Text size="1" style={{ color: isActive ? themeColor : '#111827', fontWeight: 600 }}>0:00</Text>
						<Text size="1" style={{ color: '#111827', fontWeight: 600 }}>0:10</Text>
					</Flex>
					<div style={{ position: 'relative', height: '30px', display: 'flex', alignItems: 'center' }}>
						<div style={{ position: 'absolute', width: '100%', borderTop: '1px dashed #d1d5db', top: '50%' }} />
						<div ref={containerRef} style={{ width: '100%', zIndex: 1 }} />
					</div>
				</Box>

				<Flex gap="2" wrap="wrap" mt="1">
					{(voice.tags || []).filter((tag: string) => tag.toLowerCase() !== (voice.gender || '').toLowerCase()).map((tag: string) => (
						<Badge key={tag} color="gray" variant="surface" size="1" style={{ backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '4px', fontWeight: 500 }}>{tag}</Badge>
					))}
				</Flex>

				<Text size="2" style={{ color: '#111827', lineHeight: 1.5, marginTop: '4px', flexGrow: 1 }}>
					{voice.description}
				</Text>
			</Flex>
		</Card>
	);
};

export default function App() {
	const { user, signOut } = useAuth();
	const profileDisplayName = user?.displayName?.trim() || (user?.email ? user.email.split('@')[0] : '') || 'Account';
	const profileEmail = user?.email || '';
	const profilePhotoUrl = user?.photoURL || null;
	const profileInitials = user
		? (() => {
			const n = user.displayName?.trim();
			if (n) {
				const parts = n.split(/\s+/).filter(Boolean);
				if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
				return n.slice(0, 2).toUpperCase();
			}
			return (user.email?.[0] || 'U').toUpperCase();
		})()
		: '';
	const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
	const [providers, setProviders] = useState<{ stt: Record<string, ProviderConfig>, tts: Record<string, ProviderConfig>, llm: Record<string, ProviderConfig> }>({
		stt: {}, tts: {}, llm: {}
	});

	const [selectedProviders, setSelectedProviders] = useState({ stt: '', tts: '', llm: '' });

	// List of all agents and workflows from the API
	const [agentsList, setAgentsList] = useState<any[]>([]);
	const [workflowsList, setWorkflowsList] = useState<any[]>([]);

	// Workflows payload state from ReactFlow
	const [workflowsPayload, setWorkflowsPayload] = useState<any>(null);
	const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');
	const [agentType, setAgentType] = useState<'general' | 'workflow'>('general');

	// Agent form state
	const [agentName, setAgentName] = useState('');
	const [instructions, setInstructions] = useState('');
	const [welcomeMessage, setWelcomeMessage] = useState(true);
	const [allowInterruption, setAllowInterruption] = useState(true);
	const [providerConfigs, setProviderConfigs] = useState<Record<string, Record<string, any>>>({ stt: {}, tts: {}, llm: {} });

	const [currentAgent, setCurrentAgent] = useState<any>(null);

	// UI State
	const [activeView, setActiveView] = useState<'dashboard' | 'builder' | 'voices' | 'knowledge' | 'workflows' | 'logs' | 'agent-detail'>('dashboard');
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
	const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
	const [showMobileMenu, setShowMobileMenu] = useState(false);
	const [isCallActive, setIsCallActive] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [isChatActive, setIsChatActive] = useState(false);
	const [isChatConnecting, setIsChatConnecting] = useState(false);
	const [chatInput, setChatInput] = useState('');
	const chatRoomRef = useRef<LiveKitSDK.Room | null>(null);
	const [agentAudioTrack, setAgentAudioTrack] = useState<LiveKitSDK.RemoteAudioTrack | null>(null);
	const [agentState, setAgentState] = useState<VisualizerState>('disconnected');
	const [isLoading, setIsLoading] = useState(false);
	const [transcripts, setTranscripts] = useState<any[]>([]);
	const transcriptsRef = useRef<any[]>([]);
	const roomRef = useRef<LiveKitSDK.Room | null>(null);
	const audioElementRef = useRef<HTMLAudioElement | null>(null);
	const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
	const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
	const [phosAiVoices, setPhosAiVoices] = useState<any[]>([]);
	const [voiceSearch, setVoiceSearch] = useState('');
	const [ttsVoiceSearch, setTtsVoiceSearch] = useState('');
	const [ttsVoiceDropdownOpen, setTtsVoiceDropdownOpen] = useState(false);
	const [voiceCategory, setVoiceCategory] = useState('all_voices');
	const [voiceLanguage, setVoiceLanguage] = useState('all_langs');
	const [voiceCountry, setVoiceCountry] = useState('all_countries');
	const [voiceGender, setVoiceGender] = useState('all_genders');
	const [cloneAudioFile, setCloneAudioFile] = useState<File | null>(null);
	const [cloneRefText, setCloneRefText] = useState('');
	const [cloneText, setCloneText] = useState('');
	const [clonedAudioUrl, setClonedAudioUrl] = useState('');
	const [isCloning, setIsCloning] = useState(false);
	// Logs state
	const [logs, setLogs] = useState<any[]>([]);
	const [isLoadingLogs, setIsLoadingLogs] = useState(false);
	const [logSearch, setLogSearch] = useState('');
	const [logAgentFilter, setLogAgentFilter] = useState('all');
	const [logStatusFilter, setLogStatusFilter] = useState('all');
	const [logTypeFilter, setLogTypeFilter] = useState('all');
	const [logPage, setLogPage] = useState(1);
	const [recordings, setRecordings] = useState<any[]>([]);
	const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
	const [selectedLogForTranscript, setSelectedLogForTranscript] = useState<any>(null);

	const getAgentRouteKey = (agent: any): string | undefined => {
		return agent?.id || agent?.config?.name || agent?.name;
	};
	const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
	const [selectedSessionRecording, setSelectedSessionRecording] = useState<any>(null);
	const [sessionRecordingUrl, setSessionRecordingUrl] = useState<string | null>(null);
	const [isLoadingSessionRecording, setIsLoadingSessionRecording] = useState(false);
	const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);
	const [isVoiceUIOpen, setIsVoiceUIOpen] = useState(false);
	const LOG_PAGE_SIZE = 10;

	// Toast State
	const [toastOpen, setToastOpen] = useState(false);
	const [toastContent, setToastContent] = useState({ title: '', description: '' });
	const [workflowName, setWorkflowName] = useState('New Workflow');

	// Search & Pagination State
	const [agentSearchQuery, setAgentSearchQuery] = useState('');
	const [workflowSearchQuery, setWorkflowSearchQuery] = useState('');
	const [agentPage, setAgentPage] = useState(1);
	const [workflowPage, setWorkflowPage] = useState(1);
	const AGENT_PAGE_SIZE = 10;
	const WORKFLOW_PAGE_SIZE = 10;

	const filteredAgents = agentsList.filter(a =>
		(a.name || '').toLowerCase().includes(agentSearchQuery.toLowerCase()) ||
		(a.id || '').toLowerCase().includes(agentSearchQuery.toLowerCase())
	);

	const filteredWorkflows = workflowsList.filter(wf =>
		(wf.name || '').toLowerCase().includes(workflowSearchQuery.toLowerCase()) ||
		(wf.id || '').toLowerCase().includes(workflowSearchQuery.toLowerCase())
	);

	const paginatedAgents = filteredAgents.slice((agentPage - 1) * AGENT_PAGE_SIZE, agentPage * AGENT_PAGE_SIZE);
	const paginatedWorkflows = filteredWorkflows.slice((workflowPage - 1) * WORKFLOW_PAGE_SIZE, workflowPage * WORKFLOW_PAGE_SIZE);

	// Transform our transcript format to match official LiveKit component format
	const transformTranscripts = (transcripts: any[]): any => {
		return transcripts.map(t => ({
			id: t.id,
			timestamp: t.timestamp || Date.now(),
			from: { isLocal: t.name === 'You' || t.name === 'user' },
			message: t.text
		}));
	};

	// Render the appropriate visualizer based on type
	const renderVisualizer = (audioTrack: LiveKitSDK.RemoteAudioTrack | null, state: string, size: 'icon' | 'sm' | 'md' | 'lg' | 'xl' = 'lg', color: string) => {
		const visualizerState = state === 'speaking' ? 'speaking' : state === 'thinking' ? 'thinking' : 'connecting';
		const vizType = currentAgent?.config?.visualizer_type || visualizerType;

		switch (vizType) {
			case 'grid':
				return (
					<AgentAudioVisualizerGrid
						audioTrack={audioTrack || undefined}
						state={visualizerState}
						size={size}
						color={color as `#${string}`}
						rowCount={15}
						columnCount={15}
						interval={100}
						radius={3}
					/>
				);
			case 'radial':
				return (
					<AgentAudioVisualizerRadial
						audioTrack={audioTrack || undefined}
						state={visualizerState}
						size={size}
						color={color as `#${string}`}
						barCount={12}
					/>
				);
			case 'wave':
				return (
					<AgentAudioVisualizerWave
						audioTrack={audioTrack || undefined}
						state={visualizerState}
						size={size}
						color={color as `#${string}`}
						lineWidth={2}
						blur={0.1}
						colorShift={0.3}
					/>
				);
			case 'aura':
				return (
					<AgentAudioVisualizerAura
						audioTrack={audioTrack || undefined}
						state={visualizerState}
						size={size}
						color={color as `#${string}`}
						colorShift={0.1}
						themeMode="light"
					/>
				);
			case 'bar':
			default:
				return (
					<AgentAudioVisualizerBar
						audioTrack={audioTrack}
						state={visualizerState}
						color={color}
						theme={vizType === 'bars' ? 'bars' : 'circle'}
					/>
				);
		}
	};

	const totalAgentPages = Math.ceil(filteredAgents.length / AGENT_PAGE_SIZE);
	const totalWorkflowPages = Math.ceil(filteredWorkflows.length / WORKFLOW_PAGE_SIZE);

	useEffect(() => {
		setAgentPage(1);
	}, [agentSearchQuery]);

	useEffect(() => {
		setWorkflowPage(1);
	}, [workflowSearchQuery]);

	useEffect(() => {
		if (activeView === 'logs') loadLogs();
	}, [activeView]);

	// Fetch recordings for the selected log when the modal opens (works even if currentAgent is not set)
	useEffect(() => {
		if (isTranscriptModalOpen && selectedLogForTranscript?.agent_id) {
			const agentId = selectedLogForTranscript.agent_id;
			// Always fetch fresh recordings for this agent from the API
			axios.get(`${API_BASE}/agents/${agentId}/recordings`)
				.then(res => {
					const fetchedRecordings = res.data.recordings || [];
					if (fetchedRecordings.length > 0) {
						// Merge with existing recordings (dedup by id)
						setRecordings(prev => {
							const existingIds = new Set(prev.map((r: any) => r.id || r.recording_id));
							const newRecordings = fetchedRecordings.filter((r: any) => !existingIds.has(r.id || r.recording_id));
							return [...prev, ...newRecordings];
						});
					}
				})
				.catch(err => console.error('Failed to load recordings for agent', err));
		}
	}, [isTranscriptModalOpen, selectedLogForTranscript]);

	// Auto-load recording download URL when transcript modal opens
	useEffect(() => {
		if (isTranscriptModalOpen && selectedLogForTranscript) {
			const match = recordings.find((r: any) =>
				r.agent_id === selectedLogForTranscript.agent_id &&
				r.status === 'completed' &&
				r.created_at && selectedLogForTranscript.created_at &&
				new Date(r.created_at).getTime() <= new Date(selectedLogForTranscript.created_at).getTime() + 120_000 &&
				new Date(r.created_at).getTime() >= new Date(selectedLogForTranscript.created_at).getTime() - 300_000
			);
			if (match && (match.id || match.recording_id) && !match.download_url) {
				axios.get(`${API_BASE}/agents/${selectedLogForTranscript.agent_id}/recordings/${match.id || match.recording_id}/download-url`)
					.then(res => {
						match.download_url = res.data.download_url;
						setSelectedSessionRecording({ ...match });
					})
					.catch(err => console.error('Failed to load recording URL', err));
			}
		}
	}, [isTranscriptModalOpen, selectedLogForTranscript, recordings]);

	// New Agent Creation Flow State
	const [creationStep, setCreationStep] = useState<'CATEGORY' | 'PERSONAL_USE_CASE' | 'BUSINESS_INDUSTRY' | 'BUSINESS_USE_CASE' | 'CONFIG'>('CATEGORY');
	const [agentCategory, setAgentCategory] = useState<'blank' | 'personal' | 'business'>('blank');
	const [agentIndustry, setAgentIndustry] = useState<string>('');
	const [agentUseCase, setAgentUseCase] = useState<string>('');
	const [chatOnly, setChatOnly] = useState<boolean>(false);
	const [visualizerType, setVisualizerType] = useState<'bar' | 'grid' | 'radial' | 'wave' | 'aura'>('bar');
	const [brandColor, setBrandColor] = useState<string>('#f0ad44');

	// Tools/Integrations state
	const [toolsEnabled, setToolsEnabled] = useState<boolean>(false);
	const [selectedToolCategories, setSelectedToolCategories] = useState<string[]>([]);
	const [googleConnected, setGoogleConnected] = useState<boolean>(false);
	const [_googleScopes, setGoogleScopes] = useState<string[]>([]);
	const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(false);
	const [tavilyApiKey, setTavilyApiKey] = useState<string>('');
	const [showApiKey, setShowApiKey] = useState<boolean>(false);

	// Fetch Google OAuth connection status
	const fetchGoogleConnectionStatus = async () => {
		try {
			const userId = localStorage.getItem('user_id');
			if (!userId) {
				setGoogleConnected(false);
				return;
			}
			const response = await axios.get(`${API_BASE}/google/status`, {
				params: { user_id: userId }
			});
			setGoogleConnected(response.data.is_connected);
			setGoogleScopes(response.data.scopes || []);
		} catch (error) {
			console.error('Failed to fetch Google connection status:', error);
			setGoogleConnected(false);
		}
	};

	// Initiate Google OAuth
	const initiateGoogleOAuth = async () => {
		try {
			const response = await axios.post(`${API_BASE}/google/authorize`, {});
			const { authorization_url, user_id } = response.data;

			// Store user ID
			localStorage.setItem('user_id', user_id);

			// Open Google OAuth in popup
			const popup = window.open(authorization_url, '_blank', 'width=500,height=600');

			// Poll for connection status change
			const checkInterval = setInterval(() => {
				if (popup && popup.closed) {
					clearInterval(checkInterval);
					// Refresh connection status after popup closes
					setTimeout(fetchGoogleConnectionStatus, 1000);
				}
			}, 1000);
		} catch (error) {
			console.error('Failed to initiate Google OAuth:', error);
		}
	};

	// Disconnect Google account
	const disconnectGoogle = async () => {
		try {
			const userId = localStorage.getItem('user_id');
			if (!userId) return;

			await axios.delete(`${API_BASE}/google/disconnect`, {
				params: { user_id: userId }
			});

			localStorage.removeItem('user_id');
			setGoogleConnected(false);
			setGoogleScopes([]);
		} catch (error) {
			console.error('Failed to disconnect Google account:', error);
		}
	};

	// Fetch connections on mount
	useEffect(() => {
		if (toolsEnabled) {
			fetchGoogleConnectionStatus();
		}
	}, [toolsEnabled]);

	useEffect(() => {
		if (agentUseCase && !instructions.trim()) {
			let defaultPrompt = `You are a helpful AI assistant specialized in ${agentUseCase}.`;

			if (agentCategory === 'business') {
				defaultPrompt = `You are a professional ${agentUseCase} agent for a business in the ${agentIndustry} industry.\nYour goal is to provide excellent service, stay on brand, and help users with their requests accurately.\nBe concise, polite, and helpful.`;
			} else if (agentCategory === 'personal') {
				defaultPrompt = `You are a friendly and efficient ${agentUseCase} personal assistant.\nYour goal is to help me organize my life, answer my questions, and perform tasks quickly and accurately.\nMaintain a warm, supportive, and proactive tone.`;
			}

			setInstructions(defaultPrompt);
			if (!agentName) {
				setAgentName(`${agentUseCase} Agent`);
			}
		}
	}, [agentUseCase, agentCategory, agentIndustry]);

	const loadLogs = async () => {
		setIsLoadingLogs(true);
		try {
			const res = await axios.get(`${API_BASE}/logs`);
			setLogs(res.data.data || []);
		} catch (e) {
			console.error('Failed to load logs', e);
		} finally {
			setIsLoadingLogs(false);
		}
	};

	const loadRecordings = async () => {
		if (!currentAgent?.id) return;
		setIsLoadingRecordings(true);
		try {
			const res = await axios.get(`${API_BASE}/agents/${currentAgent.id}/recordings`);
			setRecordings(res.data.recordings || []);
		} catch (e) {
			console.error('Failed to load recordings', e);
		} finally {
			setIsLoadingRecordings(false);
		}
	};

	useEffect(() => {
		if (activeView === 'logs') {
			loadRecordings();
		}
	}, [activeView, currentAgent]);

	const filteredLogs = logs.filter(l => {
		const matchesSearch = !logSearch ||
			(l.agent_name || '').toLowerCase().includes(logSearch.toLowerCase()) ||
			(l.session_id || '').toLowerCase().includes(logSearch.toLowerCase());
		const matchesAgent = logAgentFilter === 'all' || l.agent_id === logAgentFilter;
		const matchesStatus = logStatusFilter === 'all' || l.status === logStatusFilter;
		const matchesType = logTypeFilter === 'all' || l.agent_type === logTypeFilter;
		return matchesSearch && matchesAgent && matchesStatus && matchesType;
	});
	const paginatedLogs = filteredLogs.slice((logPage - 1) * LOG_PAGE_SIZE, logPage * LOG_PAGE_SIZE);
	const totalLogPages = Math.ceil(filteredLogs.length / LOG_PAGE_SIZE);

	// Ringback Tone logic (Professional Synthetic Oscillator)
	const audioCtxRef = useRef<AudioContext | null>(null);
	const ringIntervalRef = useRef<any>(null);
	const activeOscsRef = useRef<any[]>([]);
	const activeGainsRef = useRef<any[]>([]);

	useEffect(() => {
		const killRings = () => {
			if (ringIntervalRef.current) {
				clearInterval(ringIntervalRef.current);
				ringIntervalRef.current = null;
			}
			const ctx = audioCtxRef.current;
			if (ctx) {
				activeGainsRef.current.forEach(g => {
					try { g.gain.setValueAtTime(0, ctx.currentTime); } catch (e) { }
				});
				activeOscsRef.current.forEach(o => {
					try { o.stop(); o.disconnect(); } catch (e) { }
				});
				activeGainsRef.current = [];
				activeOscsRef.current = [];
				try { ctx.close(); } catch (e) { }
				audioCtxRef.current = null;
			}
		};

		if (isConnecting) {
			if (!audioCtxRef.current) {
				const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
				audioCtxRef.current = new AudioCtx();
			}

			const playRing = () => {
				if (!audioCtxRef.current) return;
				const ctx = audioCtxRef.current;
				if (ctx.state === 'suspended') ctx.resume();

				const osc1 = ctx.createOscillator();
				const osc2 = ctx.createOscillator();
				const gainNode = ctx.createGain();

				// Standard North American ringback tone (440Hz + 480Hz)
				osc1.type = 'sine';
				osc1.frequency.setValueAtTime(440, ctx.currentTime);
				osc2.type = 'sine';
				osc2.frequency.setValueAtTime(480, ctx.currentTime);

				// Envelope: Soft attack & decay
				gainNode.gain.setValueAtTime(0, ctx.currentTime);
				gainNode.gain.setTargetAtTime(0.1, ctx.currentTime + 0.1, 0.1);
				gainNode.gain.setTargetAtTime(0, ctx.currentTime + 1.9, 0.2);

				osc1.connect(gainNode);
				osc2.connect(gainNode);
				gainNode.connect(ctx.destination);

				// Ring duration: 2 seconds
				osc1.start(ctx.currentTime);
				osc2.start(ctx.currentTime);
				osc1.stop(ctx.currentTime + 2.1);
				osc2.stop(ctx.currentTime + 2.1);

				activeOscsRef.current.push(osc1, osc2);
				activeGainsRef.current.push(gainNode);

				// Cleanup arrays
				osc1.onended = () => {
					activeOscsRef.current = [];
					activeGainsRef.current = [];
				};
			};

			// Execute immediately, then every 6 seconds (2s ringing, 4s silence)
			playRing();
			ringIntervalRef.current = setInterval(playRing, 6000);
		} else {
			killRings();
		}

		return () => {
			killRings();
		};
	}, [isConnecting]);

	const showToast = (title: string, description: string) => {
		setToastContent({ title, description });
		setToastOpen(true);
	};

	const testConnection = async () => {
		try {
			await axios.get(`${API_BASE}/health`);
			setConnectionStatus('connected');
		} catch {
			setConnectionStatus('disconnected');
		}
	};

	const pcmToWav = (pcmArrayBuffer: ArrayBuffer, sampleRate: number = 16000) => {
		const numChannels = 1;
		const byteRate = sampleRate * numChannels * 2;
		const blockAlign = numChannels * 2;
		const dataSize = pcmArrayBuffer.byteLength;
		const buffer = new ArrayBuffer(44 + dataSize);
		const view = new DataView(buffer);

		const writeString = (view: DataView, offset: number, string: string) => {
			for (let i = 0; i < string.length; i++) {
				view.setUint8(offset + i, string.charCodeAt(i));
			}
		};

		writeString(view, 0, 'RIFF');
		view.setUint32(4, 36 + dataSize, true);
		writeString(view, 8, 'WAVE');
		writeString(view, 12, 'fmt ');
		view.setUint32(16, 16, true);
		view.setUint16(20, 1, true);
		view.setUint16(22, numChannels, true);
		view.setUint32(24, sampleRate, true);
		view.setUint32(28, byteRate, true);
		view.setUint16(32, blockAlign, true);
		view.setUint16(34, 16, true);
		writeString(view, 36, 'data');
		view.setUint32(40, dataSize, true);

		const pcmData = new Uint8Array(pcmArrayBuffer);
		const targetData = new Uint8Array(buffer, 44);
		targetData.set(pcmData);

		return new Blob([buffer], { type: 'audio/wav' });
	};

	const playVoicePreview = async (voiceId: string, stopOnly = false) => {
		if (playingVoiceId === voiceId || stopOnly) {
			setPlayingVoiceId(null);
			setPreviewAudioUrl(null);
			return;
		}

		try {
			setPlayingVoiceId(voiceId);
			setPreviewAudioUrl(null);

			let previewText = "Hello there! I am a PhosAI voice, powered by our advanced text to speech technology. I'm ready to bring your agent to life.";
			if (voiceId.includes('ach')) previewText = "Itye nining! An abedo dwan me PhosAI, ma tic gi teknoloji me text-to-speech. Atye atera me miyo kwo ki tic meri.";
			else if (voiceId.includes('teo')) previewText = "Yoga! Eong ebe eporoto loka PhosAI, lo iswama kwape teknoloji lo eyangari akiro na egirat akiro. Ekaparit eong aingarakin ijo.";
			else if (voiceId.includes('nyn')) previewText = "Agandi! Ndi eiraka rya PhosAI erikukoresa tekinologiya empya ya text-to-speech. Nyeteekateekire kuha amagara ejenti yaawe.";
			else if (voiceId.includes('swa')) previewText = "Hujambo! Mimi ni sauti ya PhosAI, inayowezeshwa na teknolojia yetu ya hali ya juu ya maandishi-kwa-sauti. Niko tayari kuleta uhai kwa wakala wako.";
			else if (voiceId.includes('lug')) previewText = "Oli otya! Nze ddoboozi lya PhosAI, erikozesebwa tekinologiya waffe ow'omulembe owa text-to-speech. Ndi mwetegefu okussa obulamu mu ejenti wo.";
			else if (voiceId.includes('xog')) previewText = "Otyano! Nze iloboozi lya PhosAI, elikola ku tekinologiya waffe owa text-to-speech. Ndi mwetegefu okuwa obulamu eri ejenti wo.";
			else if (voiceId.includes('kin')) previewText = "Muraho! Ndi ijwi rya PhosAI, rikoreshwa n'ikoranabuhanga ryacu rigezweho rya text-to-speech. Niteguye guha ubuzima agenti wawe.";
			else if (voiceId.includes('luo')) previewText = "Idhi nade! An dwol mar PhosAI, ma tiyo gi tekinoloji ma chung' e malo mar text-to-speech. Aseikora mondo akel ngima ne agent mari.";
			else if (voiceId.includes('kik')) previewText = "Wĩ mwega! Ndĩ mũgambo wa PhosAI, ũrĩa ũhũthagĩra tekinorojĩ yetũ njĩkĩrĩku ya text-to-speech. Ndĩ mwĩhaarĩrie kũhe agenti yaku muoyo.";
			else if (voiceId.includes('hau')) previewText = "Sannu! Ni murya ce ta PhosAI, wadda fasahar mu ta ci gaba ta text-to-speech ke tafiyarwa. A shirye nake in kawo rayuwa ga wakilin ku.";
			else if (voiceId.includes('ibo')) previewText = "Ndeewo! Abụ m olu PhosAI, nke nkà na ụzụ text-to-speech anyị kachasị elu kwadoro. Adị m njikere inye onye nnọchi anya gị ndụ.";
			else if (voiceId.includes('twi')) previewText = "Maakye! Mene PhosAI nne, a yɛn mfiridwuma a ɛkɔ anim a wɔde kyerɛw nsɛm kɔ nne mu na ɛma tumi. Masiesie me ho sɛ mɛma w'ananmusifo no anya nkwa.";
			else if (voiceId.includes('yor')) previewText = "Bawo ni! Emi ni ohùn PhosAI kan, ti agbara nipasẹ imọ-ẹrọ text-to-speech ti ilọsiwaju wa. Mo ti ṣetan lati fun aṣoju rẹ ni igbesi aye.";
			else if (voiceId.includes('wol')) previewText = "Nanga def! Man dama aw batou PhosAI, biy dox ak sunu teknoloji bu bees bi di text-to-speech. Pare na pour jox dund sa agent.";
			else if (voiceId.includes('pcm')) previewText = "How far! I be PhosAI voice, powered by our advanced text-to-speech technology. I ready to bring your agent to life.";

			const response = await fetch(`${PHOSAI_TTS_URL}/v1/audio/speech/stream`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					text: previewText,
					voice: voiceId,
					speaker_id: voiceId,
					temperature: 0.1
				})
			});

			if (!response.ok) throw new Error('Failed to fetch preview');

			const pcmBuffer = await response.arrayBuffer();
			const wavBlob = pcmToWav(pcmBuffer, 16000);
			const audioUrl = URL.createObjectURL(wavBlob);

			setPreviewAudioUrl(audioUrl);
		} catch (err) {
			console.error('Error playing voice:', err);
			setPlayingVoiceId(null);
			setPreviewAudioUrl(null);
			showToast("Preview Failed", "Service is not available. Please try again later.");
		}
	};

	const handleVoiceClone = async () => {
		if (!cloneAudioFile || !cloneText.trim()) return;

		try {
			setIsCloning(true);
			if (audioElementRef.current) {
				audioElementRef.current.pause();
			}

			const formData = new FormData();
			formData.append('text', cloneText);
			formData.append('reference_audio', cloneAudioFile, cloneAudioFile.name || 'audio.wav');
			if (cloneRefText.trim()) formData.append('reference_text', cloneRefText);
			formData.append('temperature', '0.1');

			const response = await fetch(`${PHOSAI_TTS_URL}/v1/audio/speech/clone/upload`, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) throw new Error('Failed to clone voice');

			const contentType = response.headers.get('Content-Type') || '';
			let audioUrl = '';

			if (contentType.includes('application/json')) {
				const data = await response.json();
				if (data.error) throw new Error(data.error);
				if (typeof data === 'string') audioUrl = data;
				else if (data.url) audioUrl = data.url;
				else if (data.audio_base64) audioUrl = `data:audio/wav;base64,${data.audio_base64}`;
			} else {
				const pcmBuffer = await response.arrayBuffer();
				if (pcmBuffer.byteLength === 0) {
					throw new Error("Backend returned no audio data. It may have run out of memory or encountered an error during streaming.");
				}
				if (contentType.includes('audio/')) {
					const blob = new Blob([pcmBuffer], { type: contentType });
					audioUrl = URL.createObjectURL(blob);
				} else {
					const wavBlob = pcmToWav(pcmBuffer, 16000);
					audioUrl = URL.createObjectURL(wavBlob);
				}
			}

			if (audioUrl) {
				setClonedAudioUrl(audioUrl);
			}
			showToast("Success", "Custom voice cloned and synthesized successfully!");
		} catch (err) {
			console.error('Error cloning voice:', err);
			showToast("Cloning Failed", "Service is not available. Please try again later.");
		} finally {
			setIsCloning(false);
		}
	};



	useEffect(() => {
		if (activeView === 'voices' && phosAiVoices.length === 0) {
			const fetchVoices = async () => {
				try {
					const res = await fetch(`${API_BASE}/v1/voices`);
					if (res.ok) {
						const data = await res.json();
						if (data.speaker_ids) {
							setPhosAiVoices(data.speaker_ids);
						}
					}
				} catch (e) {
					console.error("Failed to fetch voices from API", e);
				}
			};
			fetchVoices();
		}
	}, [activeView, phosAiVoices.length]);

	const loadProviders = async () => {
		try {
			const response = await axios.get(`${API_BASE}/providers`);
			setProviders(response.data);

			const p = response.data;
			let initialStt = Object.keys(p.stt)[0] || '';
			let initialTts = Object.keys(p.tts)[0] || '';
			let initialLlm = Object.keys(p.llm)[0] || '';

			setSelectedProviders({
				stt: initialStt,
				tts: initialTts,
				llm: initialLlm
			});
		} catch (error) {
			console.error('Failed to load providers:', error);
		}
	};

	const loadWorkflowsList = async () => {
		try {
			const res = await axios.get(`${API_BASE}/workflows`);
			setWorkflowsList(res.data.workflows || []);
		} catch (e) {
			console.error("Failed to load workflows", e);
		}
	};

	const loadAgentsList = async () => {
		try {
			const res = await axios.get(`${API_BASE}/agents`);
			setAgentsList(res.data.agents || []);
		} catch (e) {
			console.error("Failed to load agents", e);
		}
	};

	useEffect(() => {
		testConnection();
		loadProviders();
		loadAgentsList();
		loadWorkflowsList();
	}, []);

	const loadAgent = (id: string, canOpenModal: boolean = true) => {
		if (id === 'new') {
			setCurrentAgent(null);
			setAgentName('');
			setInstructions('');
			setWelcomeMessage(true);
			setAllowInterruption(true);
			setWorkflowsPayload(null);
			setActiveView('builder');
			// Reset Creation Flow
			setCreationStep('CATEGORY');
			setAgentUseCase('');
			setChatOnly(false);
			setVisualizerType('bar');
			setBrandColor('#f0ad44');
			// Reset tool configuration
			setToolsEnabled(false);
			setSelectedToolCategories([]);
			setWebSearchEnabled(false);
			setTavilyApiKey('');
			if (canOpenModal) setActiveView('agent-detail');
			return;
		}

		const agent = agentsList.find(a => a.id === id);
		if (agent) {
			setCurrentAgent(agent);
			setAgentName(agent.config.name);
			setInstructions(agent.config.instructions);
			setWelcomeMessage(agent.config.welcome_message !== null);
			setAllowInterruption(agent.config.allow_interruption ?? true);

			if (agent.config.stt_config) {
				setSelectedProviders(p => ({ ...p, stt: agent.config.stt_config.provider }));
				setProviderConfigs(p => ({ ...p, stt: agent.config.stt_config.additional_config || {} }));
			}
			if (agent.config.tts_config) {
				setSelectedProviders(p => ({ ...p, tts: agent.config.tts_config.provider }));
				setProviderConfigs(p => ({ ...p, tts: agent.config.tts_config.additional_config || {} }));
			}
			if (agent.config.llm_config) {
				setSelectedProviders(p => ({ ...p, llm: agent.config.llm_config.provider }));
				setProviderConfigs(p => ({ ...p, llm: agent.config.llm_config.additional_config || {} }));
			}
			setAgentType(agent.config.agent_type || 'general');
			setSelectedWorkflowId(agent.config.workflow_id || '');
			setWorkflowsPayload(agent.config.workflows || null);

			// Load tool configuration
			if (agent.config.tool_config) {
				setToolsEnabled(agent.config.tool_config.enabled || false);
				setSelectedToolCategories(agent.config.tool_config.categories || []);
			} else {
				setToolsEnabled(false);
				setSelectedToolCategories([]);
			}

			// Load Tavily API key
			setTavilyApiKey(agent.config.tavily_api_key || '');
			setWebSearchEnabled(!!agent.config.tavily_api_key);

			// Load Categorization
			setAgentCategory(agent.config.category || 'blank');
			setAgentIndustry(agent.config.industry || '');
			setAgentUseCase(agent.config.use_case || '');
			setChatOnly(agent.config.chat_only || false);
			setVisualizerType((agent.config.visualizer_type === 'circle' || agent.config.visualizer_type === 'bars') ? 'bar' : agent.config.visualizer_type || 'bar');
			setBrandColor(agent.config.brand_color || '#f0ad44');
			setCreationStep('CONFIG');

			if (canOpenModal) {
				setActiveView('agent-detail');
			}
		}
	};

	const openNewAgentBuilder = () => {
		loadAgent('new', true);
	};

	const updateProviderConfig = (type: string, field: string, value: any) => {
		setProviderConfigs(prev => ({
			...prev,
			[type]: { ...prev[type], [field]: value }
		}));
	};

	const createAgent = async (silent: boolean = false) => {
		if (!agentName.trim()) {
			if (!silent) showToast("Missing Name", "Please enter a unique name for your agent.");
			return;
		}
		if (!instructions.trim()) {
			if (!silent) showToast("Missing Instructions", "Provide system instructions to define how your agent behaves.");
			return;
		}

		const buildProvConfig = (type: 'stt' | 'tts' | 'llm') => {
			const provider = selectedProviders[type];
			if (!provider) return null;
			const stateCfg = providerConfigs[type] || {};
			const pData = providers[type][provider];

			return {
				provider,
				model: stateCfg.model || pData.models?.[0]?.id,
				language: stateCfg.language || (type === 'stt' ? 'en' : undefined),
				voice: stateCfg.voice || pData.voice_options?.[0]?.id,
				temperature: stateCfg.temperature !== undefined ? parseFloat(stateCfg.temperature) : undefined,
				max_tokens: stateCfg.max_tokens !== undefined ? parseInt(stateCfg.max_tokens) : undefined,
				api_key: stateCfg.api_key || null,
				additional_config: stateCfg
			};
		};

		setIsLoading(true);
		const agentConfig = {
			name: agentName.trim(),
			instructions,
			agent_type: agentType,
			workflow_id: (selectedWorkflowId && selectedWorkflowId !== 'none') ? selectedWorkflowId : null,
			welcome_message: welcomeMessage ? "Hello! I'm here to help you." : null,
			allow_interruption: allowInterruption,
			stt_config: buildProvConfig('stt'),
			tts_config: buildProvConfig('tts'),
			llm_config: buildProvConfig('llm'),
			workflows: workflowsPayload || undefined,
			category: agentCategory,
			industry: agentIndustry,
			use_case: agentUseCase,
			chat_only: chatOnly,
			visualizer_type: visualizerType,
			brand_color: brandColor,
			tool_config: toolsEnabled ? {
				enabled: true,
				categories: selectedToolCategories,
			} : null,
			owner_id: localStorage.getItem('user_id') || null,
			tavily_api_key: webSearchEnabled ? tavilyApiKey.trim() || null : null,
		};

		try {
			if (currentAgent) {
				const response = await axios.put(`${API_BASE}/agents/${currentAgent.id}`, agentConfig);
				setCurrentAgent(response.data);
				if (!silent) showToast("Agent Updated", `Successfully saved changes to ${agentName}.`);
			} else {
				const response = await axios.post(`${API_BASE}/agents`, agentConfig);
				setCurrentAgent(response.data);
				if (!silent) showToast("Agent Created", `Successfully created ${agentName}.`);
			}
			setActiveView('builder');
			loadAgentsList();
		} catch (error: any) {
			console.error('Failed to save agent', error);
			let errMsg = "There was an error saving your agent configuration.";
			if (error.response?.data?.detail) {
				const detail = error.response.data.detail;
				if (Array.isArray(detail)) {
					errMsg = detail.map((e: any) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(', ');
				} else {
					errMsg = typeof detail === 'string' ? detail : JSON.stringify(detail);
				}
			} else if (error.message) {
				errMsg = error.message;
			}
			if (!silent) showToast("Action Failed", errMsg);
		} finally {
			setIsLoading(false);
		}
	};

	const deleteAgent = async (id?: string, confirmed = false) => {
		const targetId = id || currentAgent?.id;
		const targetAgent = id ? agentsList.find(a => a.id === id) : currentAgent;

		if (!targetId || !targetAgent) return;
		if (!confirmed && !confirm(`Are you sure you want to delete agent "${targetAgent.name || targetAgent.config?.name || 'this agent'}"?`)) return;

		setIsLoading(true);
		try {
			await axios.delete(`${API_BASE}/agents/${targetId}`);
			if (currentAgent?.id === targetId) {
				setCurrentAgent(null);
				setAgentName('');
				setInstructions('');
				setActiveView('builder');
			}
			loadAgentsList();
			showToast("Agent Deleted", "The agent has been removed successfully.");
		} catch (error) {
			console.error('Failed to delete agent', error);
			showToast("Delete Failed", "The agent could not be removed.");
		} finally {
			setIsLoading(false);
		}
	};

	const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

	const toggleCall = async (targetAgentOverride?: any) => {
		const targetAgent = targetAgentOverride || currentAgent;
		if (!targetAgent) return;

		// If a call is active, stop it first
		if (isCallActive) {
			setIsConnecting(true);
			if (roomRef.current) {
				roomRef.current.disconnect();
			}
			try {
				// ALWAYS stop the agent that was actually active (currentAgent)
				const currentAgentKey = getAgentRouteKey(currentAgent);
				if (currentAgentKey) {
					await axios.post(`${API_BASE}/agents/${encodeURIComponent(currentAgentKey)}/stop`);
				}
			} catch (e) {
				console.warn('Failed to stop previous agent', e);
			} finally {
				setIsCallActive(false);
				setAgentAudioTrack(null);
				setAgentState('disconnected');
				setActiveNodeId(null);
				roomRef.current = null;
				setIsConnecting(false);
			}

			// If we were just stopping THE SAME agent, we are done
			if (targetAgent?.id === currentAgent?.id) return;
		}

		// Proceed to start targetAgent
		setIsConnecting(true);
		setAgentState('connecting');
		setTranscripts([]);
		transcriptsRef.current = [];
		setIsVoiceUIOpen(true);

		try {
			await createAgent(true);

			const targetAgentKey = getAgentRouteKey(targetAgent);
			if (!targetAgentKey) throw new Error('Missing agent identifier');
			const tokenResponse = await axios.get(`${API_BASE}/livekit/token?agent_name=${encodeURIComponent(targetAgentKey)}`);
			const { token, url } = tokenResponse.data;

			try {
				await axios.post(`${API_BASE}/agents/${encodeURIComponent(targetAgentKey)}/start`);
				await new Promise(r => setTimeout(r, 2000));
			} catch (e) {
				console.warn('Agent start warning', e);
			}

			const room = new LiveKitSDK.Room({
				adaptiveStream: true,
				dynacast: true,
				audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
			});

			room.on(LiveKitSDK.RoomEvent.TranscriptionReceived, (segments, participant) => {
				setTranscripts(prev => {
					let updated = [...prev];
					for (const seg of segments) {
						const sender = participant?.identity?.toLowerCase().includes('agent') || !participant?.isLocal ? 'Agent' : 'You';
						const idx = updated.findIndex(x => x.id === seg.id);
						if (idx >= 0) {
							updated[idx].text = seg.text;
							updated[idx].isFinal = seg.final;
						} else {
							updated.push({ id: seg.id, name: sender, text: seg.text, isFinal: seg.final, timestamp: Date.now() });
						}
					}
					transcriptsRef.current = updated;
					return updated; // Keep all transcripts inside scroll box
				});
			});

			room.on(LiveKitSDK.RoomEvent.Connected, async () => {
				setIsCallActive(true);
				setIsConnecting(false);
				setAgentState('listening');
			});
			room.on(LiveKitSDK.RoomEvent.Disconnected, async () => {
				setIsCallActive(false);
				setAgentAudioTrack(null);
				setAgentState('disconnected');
				setActiveNodeId(null);
				roomRef.current = null;
				setIsConnecting(false);

				if (transcriptsRef.current.length > 0) {
					try {
						// 1. Generate summary first
						const summaryRes = await axios.post(`${API_BASE}/summarize`, {
							session_id: `voice-session-${Date.now()}`,
							transcripts: transcriptsRef.current
						});

						// 2. Save with summary
						await axios.post(`${API_BASE}/agents/${targetAgent.id}/transcripts`, {
							session_id: `voice-session-${Date.now()}`,
							conversation_type: 'voice',
							transcripts: transcriptsRef.current,
							summary: summaryRes.data.summary
						});

						// 3. Refresh logs and recordings (worker saves recording server-side)
						loadLogs();
						loadRecordings();
					} catch (err) {
						console.error('Failed to summarize or save session', err);
						// Fallback save without summary
						axios.post(`${API_BASE}/agents/${targetAgent.id}/transcripts`, {
							session_id: `voice-session-${Date.now()}`,
							conversation_type: 'voice',
							transcripts: transcriptsRef.current
						}).catch(console.error);
					}
				}
				loadRecordings();
			});
			room.on(LiveKitSDK.RoomEvent.DataReceived, (payload, _participant) => {
				const decoder = new TextDecoder();
				const str = decoder.decode(payload);
				try {
					const data = JSON.parse(str);
					if (data.type === 'node_highlight') {
						setActiveNodeId(data.node_id);
					} else if (data.type === 'end_call') {
						if (roomRef.current) roomRef.current.disconnect();
					}
				} catch (e) { }
			});
			room.on(LiveKitSDK.RoomEvent.ActiveSpeakersChanged, (speakers) => {
				const isAgentSpeaking = speakers.some(s => !s.isLocal);
				setAgentState(isAgentSpeaking ? 'speaking' : 'listening');
			});
			room.on(LiveKitSDK.RoomEvent.TrackSubscribed, (track, _publication, _participant) => {
				if (track.kind === LiveKitSDK.Track.Kind.Audio) {
					const t = track as LiveKitSDK.RemoteAudioTrack;
					setAgentAudioTrack(t);
					if (audioElementRef.current) {
						t.attach(audioElementRef.current);
					}
				}
			});
			room.on(LiveKitSDK.RoomEvent.TrackUnsubscribed, (track) => {
				if (track.kind === 'audio') {
					track.detach();
					setAgentAudioTrack(null);
				}
			});

			await room.connect(url, token);

			try {
				const audioTrack = await LiveKitSDK.createLocalAudioTrack({
					echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, sampleRate: 16000
				});
				await room.localParticipant.publishTrack(audioTrack);
			} catch (micError) {
				await room.localParticipant.setMicrophoneEnabled(true);
			}

				roomRef.current = room;

			} catch (error: any) {
				console.error('Call failed:', error);
				setIsCallActive(false);
				setAgentState('error');
				showToast("Connectivity Error", "Could not reach the voice agent.");
			} finally {
				setIsConnecting(false);
			}
	};


	const toggleChatSession = async (targetAgentOverride?: any) => {
		const targetAgent = targetAgentOverride || currentAgent;
		if (!targetAgent) return;
		const targetAgentKey = getAgentRouteKey(targetAgent);
		if (!targetAgentKey) return;

		if (isChatActive) {
			chatRoomRef.current?.disconnect();
			try {
				await axios.post(`${API_BASE}/agents/${encodeURIComponent(targetAgentKey)}/stop`);
			} catch (e) { console.warn(e); }
			setIsChatActive(false);
			setAgentState('disconnected');
			chatRoomRef.current = null;
			return;
		}

		setIsChatConnecting(true);
		setAgentState('connecting');
		setTranscripts([]);
		transcriptsRef.current = [];
		setIsVoiceUIOpen(true);

		try {
			await createAgent(true);
			const tokenResponse = await axios.get(`${API_BASE}/livekit/token?agent_name=${encodeURIComponent(targetAgentKey)}`);
			const { token, url } = tokenResponse.data;

			try {
				await axios.post(`${API_BASE}/agents/${encodeURIComponent(targetAgentKey)}/start`);
				await new Promise(r => setTimeout(r, 1500));
			} catch (e) { console.warn(e); }

			const room = new LiveKitSDK.Room({ adaptiveStream: true, dynacast: true });

			room.on(LiveKitSDK.RoomEvent.TranscriptionReceived, (segments, participant) => {
				setTranscripts(prev => {
					let updated = [...prev];
					for (const seg of segments) {
						const sender = participant?.identity?.toLowerCase().includes('agent') || !participant?.isLocal ? 'Agent' : 'You';
						const idx = updated.findIndex(x => x.id === seg.id);
						if (idx >= 0) {
							updated[idx].text = seg.text;
							updated[idx].isFinal = seg.final;
						} else {
							updated.push({ id: seg.id, name: sender, text: seg.text, isFinal: seg.final, timestamp: Date.now() });
						}
					}
					transcriptsRef.current = updated;
					return updated;
				});
			});

			room.on(LiveKitSDK.RoomEvent.Connected, () => {
				setIsChatActive(true);
				setIsChatConnecting(false);
				setAgentState('listening');
			});
			room.on(LiveKitSDK.RoomEvent.Disconnected, () => {
				setIsChatActive(false);
				setAgentState('disconnected');
				chatRoomRef.current = null;
				setIsChatConnecting(false);
				if (transcriptsRef.current.length > 0) {
					axios.post(`${API_BASE}/agents/${targetAgent.id}/transcripts`, {
						session_id: `chat-session-${Date.now()}`,
						conversation_type: 'chat',
						transcripts: transcriptsRef.current
					}).catch(console.error);
				}
			});

			await room.connect(url, token);
			// Text-only: do NOT publish audio track
			chatRoomRef.current = room;

			// Tell the agent to enter chat mode (disables audio output)
			setTimeout(async () => {
				try {
					// Find the agent participant (usually the first remote participant)
					const agentParticipant = Array.from(room.remoteParticipants.values())[0];
					if (agentParticipant) {
						await room.localParticipant.performRpc({
							destinationIdentity: agentParticipant.identity,
							method: "set_chat_mode",
							payload: JSON.stringify({ enabled: true })
						});
					}
				} catch (e) {
					console.log("Could not set chat mode via RPC", e);
				}
			}, 1000);
		} catch (error: any) {
			console.error('Chat session failed:', error);
			setIsChatActive(false);
			setAgentState('error');
			showToast("Connectivity Error", "Could not establish chat connection.");
		} finally {
			setIsChatConnecting(false);
		}
	};

	const sendChatMessage = async () => {
		const trimmed = chatInput.trim();
		if (!trimmed) return;
		const activeRoom = chatRoomRef.current || roomRef.current;
		if (!activeRoom) return;
		const msgId = `user-${Date.now()}`;
		setTranscripts(prev => {
			const updated = [...prev, { id: msgId, name: 'You', text: trimmed, isFinal: true, timestamp: Date.now() }];
			transcriptsRef.current = updated;
			return updated;
		});
		setChatInput('');
		try {
			await activeRoom.localParticipant.sendText(trimmed, { topic: 'lk.chat' });
		} catch (e) {
			console.error('Failed to send message', e);
		}
	};

	return (
		<Toast.Provider swipeDirection="right">
			<audio ref={audioElementRef} autoPlay playsInline style={{ display: 'none' }} />
			<Box style={{
				display: 'flex',
				minHeight: '100vh',
				fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
				backgroundColor: '#fafafa',
				color: '#111827',
				overflow: 'hidden'
			}}>
				<style>{`
				@media (max-width: 600px) {
					.hide-on-mobile { display: none !important; }
				}
				@media (max-width: 900px) {
					.hide-on-tablet { display: none !important; }
				}
				.animate-spin {
					animation: spin 1s linear infinite;
				}
				@keyframes spin {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
				.visualizer-center-glow {
					position: absolute;
					width: 80px;
					height: 80px;
					background: radial-gradient(circle, #ffffff 30%, rgba(255,255,255,0) 70%);
					border-radius: 50%;
					z-index: 1;
					box-shadow: 0 0 40px rgba(255,255,255,0.8), 0 0 20px rgba(240, 173, 68, 0.45);
					animation: visualizer-pulse 2s ease-in-out infinite;
				}
				@keyframes visualizer-pulse {
					0%, 100% { transform: scale(1); opacity: 0.9; }
					50% { transform: scale(1.1); opacity: 1; }
				}
				.sidebar-item {
					color: #9ca3af !important;
					background-color: transparent !important;
					transition: all 0.2s ease-in-out;
				}
				.sidebar-item:hover {
					color: #ffffff !important;
					background-color: rgba(255, 255, 255, 0.05) !important;
				}
				.sidebar-item.active {
					color: #161617 !important;
					background-color: #f0ad44 !important;
				}
				.hoverable-row {
					transition: background-color 0.2s;
				}
				.hoverable-row:hover {
					background-color: rgba(240, 173, 68, 0.06) !important;
				}
				.hoverable-row.active-row {
					background-color: rgba(240, 173, 68, 0.08) !important;
				}
				table td, table th {
					white-space: nowrap !important;
				}
			`}</style>
				{/* Sidebar - Desktop */}
				<Box display={{ initial: 'none', lg: 'block' }} style={{ flexShrink: 0, transition: 'width 0.2s ease-in-out', width: isSidebarCollapsed ? '60px' : '190px' }}>
					<Flex direction="column" style={{
						width: '100%',
						backgroundColor: '#161617',
						borderRight: '1px solid #2e303a',
						padding: '16px 0',
						height: '100vh',
						transition: 'all 0.2s ease-in-out'
					}}>
						<Box style={{ padding: isSidebarCollapsed ? '0 8px 16px' : '0 12px 16px', borderBottom: '1px solid #2e303a', transition: 'padding 0.2s ease-in-out' }}>
							<Flex align="center" gap="2" justify={isSidebarCollapsed ? 'center' : 'start'}>
								<img src={phosaiLogo} alt="" width={32} height={32} style={{ objectFit: 'contain', flexShrink: 0 }} />
								{!isSidebarCollapsed && (
									<Text style={{ fontWeight: 800, fontSize: 14, color: '#ffffff', whiteSpace: 'nowrap' }}>PhosAI Studio</Text>
								)}
							</Flex>
						</Box>

						<Box style={{ flexGrow: 1, padding: isSidebarCollapsed ? '12px 6px' : '12px 8px', overflowY: 'auto', transition: 'padding 0.2s ease-in-out' }}>
							{[
								{ id: 'dashboard', label: 'Analytics', icon: <BarChart size={18} /> },
								{ id: 'builder', label: 'Agents', icon: <Brain size={18} /> },
								{ id: 'voices', label: 'Voice Library', icon: <Mic size={18} /> },
								{ id: 'workflows', label: 'Workflows', icon: <Workflow size={18} /> },
								{ id: 'knowledge', label: 'Knowledge Base', icon: <Book size={18} /> },
								{ id: 'logs', label: 'Conversations', icon: <History size={18} /> }
							].map(item => {
								const isActive = activeView === item.id;
								const sidebarItemContent = (
									<Box
										onClick={() => setActiveView(item.id as any)}
										className={`sidebar-item ${isActive ? 'active' : ''}`}
										style={{
											display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'start', gap: isSidebarCollapsed ? '0' : '12px',
											padding: '8px 10px', borderRadius: 'var(--radius-1)', marginBottom: '4px',
											fontWeight: isActive ? 600 : 400,
											fontSize: '14px', cursor: 'pointer',
										}}
									>
										{item.icon}
										{!isSidebarCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
									</Box>
								);

								return isSidebarCollapsed ? (
									<Tooltip content={item.label} key={item.id} side="right">
										{sidebarItemContent}
									</Tooltip>
								) : (
									<Box key={item.id}>
										{sidebarItemContent}
									</Box>
								);
							})}
						</Box>

						{/* Collapse Toggle */}
						<Box style={{ padding: '8px 12px', borderTop: '1px solid #2e303a', display: 'flex', justifyContent: isSidebarCollapsed ? 'center' : 'end' }}>
							<IconButton
								variant="ghost"
								onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
								style={{ color: '#9ca3af', cursor: 'pointer' }}
							>
								{isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
							</IconButton>
						</Box>

						<Box style={{ padding: isSidebarCollapsed ? '12px 8px' : '12px 16px 20px', borderTop: '1px solid #2e303a', marginTop: 'auto', backgroundColor: '#161617', transition: 'padding 0.2s ease-in-out' }}>
							{user ? (
								isSidebarCollapsed ? (
									<Flex direction="column" align="center" gap="3">
										<Tooltip content={profileDisplayName} side="right">
											{profilePhotoUrl ? (
												<img src={profilePhotoUrl} alt="" width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #fcd34d' }} />
											) : (
												<Box style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0ad44', color: '#211d1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0, letterSpacing: '0.02em' }}>
													{profileInitials}
												</Box>
											)}
										</Tooltip>
										<Tooltip content="Sign out" side="right">
											<IconButton variant="solid" style={{ backgroundColor: '#f0ad44', color: '#161617', cursor: 'pointer' }} size="2" onClick={() => { void signOut(); }}>
												<LogOut size={16} />
											</IconButton>
										</Tooltip>
									</Flex>
								) : (
									<Flex direction="column" gap="3">
										<Flex align="center" gap="3">
											{profilePhotoUrl ? (
												<img src={profilePhotoUrl} alt="" width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #fcd34d' }} />
											) : (
												<Box style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0ad44', color: '#211d1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0, letterSpacing: '0.02em' }}>
													{profileInitials}
												</Box>
											)}
											<Box style={{ minWidth: 0, flex: 1 }}>
												<Text size="2" weight="bold" as="div" style={{ lineHeight: 1.25, color: '#ffffff', fontSize: '14px' }}>{profileDisplayName}</Text>
												{profileEmail ? (
													<Text size="1" style={{ color: '#9ca3af', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px', fontWeight: 500, fontSize: '14px' }} title={profileEmail}>{profileEmail}</Text>
												) : null}
											</Box>
										</Flex>
										<Button variant="solid" style={{ backgroundColor: '#f0ad44', color: '#161617', width: '100%', justifyContent: 'center', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }} onClick={() => { void signOut(); }}>
											<LogOut size={16} style={{ marginRight: '6px' }} /> Sign out
										</Button>
									</Flex>
								)
							) : (
								isSidebarCollapsed ? (
									<Flex direction="column" align="center" gap="2">
										<Tooltip content="Sign in" side="right">
											<IconButton variant="ghost" size="2" style={{ color: '#ffffff', cursor: 'pointer' }} onClick={() => window.location.href = '/'}>
												<User size={16} />
											</IconButton>
										</Tooltip>
									</Flex>
								) : (
									<Flex direction="column" gap="2">
										<Text size="1" weight="medium" style={{ color: '#9ca3af', fontSize: '14px' }}>Sign in to sync your workspace.</Text>
										<Flex gap="2">
											<Button variant="ghost" size="2" style={{ flex: 1, fontSize: '14px', color: '#ffffff' }} onClick={() => window.location.href = '/'}>Sign in</Button>
											<Button size="2" style={{ flex: 1, backgroundColor: '#f0ad44', color: '#161617', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }} onClick={() => window.location.href = '/'}>Sign up</Button>
										</Flex>
									</Flex>
								)
							)}
						</Box>
					</Flex>
				</Box>

				{/* Sidebar - Mobile Overlay */}
				{showMobileMenu && (
					<Box style={{
						position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.6)',
						display: 'flex'
					}} onClick={() => setShowMobileMenu(false)}>
						<Box style={{
							width: '280px', height: '100%', backgroundColor: '#161617',
							display: 'flex', flexDirection: 'column', borderRight: '1px solid #2e303a'
						}} onClick={e => e.stopPropagation()}>
							<Box style={{ padding: '24px 20px 24px', borderBottom: '1px solid #2e303a' }}>
								<Flex align="center" justify="between">
									<Flex align="center" gap="3">
										<img src={phosaiLogo} alt="" width={36} height={36} style={{ objectFit: 'contain', flexShrink: 0 }} />
										<Text style={{ fontWeight: 800, fontSize: 12, color: '#ffffff' }}>PhosAI Studio</Text>
									</Flex>
									<Button variant="ghost" onClick={() => setShowMobileMenu(false)} style={{ color: '#ffffff', cursor: 'pointer' }}><X size={20} /></Button>
								</Flex>
							</Box>

							<Box style={{ flexGrow: 1, padding: '16px 12px', overflowY: 'auto' }}>
								{[
									{ id: 'dashboard', label: 'Analytics', icon: <BarChart size={18} /> },
									{ id: 'builder', label: 'Agents', icon: <Brain size={18} /> },
									{ id: 'voices', label: 'Voice Library', icon: <Mic size={18} /> },
									{ id: 'workflows', label: 'Workflows', icon: <Workflow size={18} /> },
									{ id: 'knowledge', label: 'Knowledge Base', icon: <Book size={18} /> },
									{ id: 'logs', label: 'Conversations', icon: <History size={18} /> }
								].map(item => (
									<Box
										key={item.id}
										onClick={() => { setActiveView(item.id as any); setShowMobileMenu(false); }}
										className={`sidebar-item ${activeView === item.id ? 'active' : ''}`}
										style={{
											display: 'flex', alignItems: 'center', gap: '12px',
											padding: '12px', borderRadius: 'var(--radius-1)', marginBottom: '4px',
											fontSize: '14px', cursor: 'pointer'
										}}
									>
										{item.icon}
										{item.label}
									</Box>
								))}
							</Box>
							<Box style={{ padding: '12px 16px 20px', borderTop: '1px solid #2e303a', backgroundColor: '#161617' }}>
								{user ? (
									<Flex direction="column" gap="3">
										<Flex align="center" gap="3">
											{profilePhotoUrl ? (
												<img src={profilePhotoUrl} alt="" width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #fcd34d' }} />
											) : (
												<Box style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0ad44', color: '#161617', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
													{profileInitials}
												</Box>
											)}
											<Box style={{ minWidth: 0, flex: 1 }}>
												<Text size="2" weight="bold" as="div" style={{ lineHeight: 1.25, color: '#ffffff' }}>{profileDisplayName}</Text>
												{profileEmail ? (
													<Text size="1" style={{ color: '#9ca3af', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px', fontWeight: 500 }} title={profileEmail}>{profileEmail}</Text>
												) : null}
											</Box>
										</Flex>
										<Button variant="solid" size="2" style={{ width: '100%', justifyContent: 'center', fontWeight: 600, backgroundColor: '#f0ad44', color: '#161617', cursor: 'pointer' }} onClick={() => { void signOut(); setShowMobileMenu(false); }}>
											<LogOut size={16} style={{ marginRight: '6px' }} /> Sign out
										</Button>
									</Flex>
								) : (
									<Flex direction="column" gap="2">
										<Text size="1" weight="medium" style={{ color: '#9ca3af' }}>Sign in to sync your workspace.</Text>
										<Flex gap="2">
											<Button variant="ghost" size="2" style={{ flex: 1, color: '#ffffff', cursor: 'pointer' }} onClick={() => window.location.href = '/'}>Sign in</Button>
											<Button size="2" style={{ flex: 1, backgroundColor: '#f0ad44', color: '#161617', fontWeight: 600, cursor: 'pointer' }} onClick={() => window.location.href = '/'}>Sign up</Button>
										</Flex>
									</Flex>
								)}
							</Box>
						</Box>
					</Box>
				)}

				{/* Main Content */}
				<Box style={{ flexGrow: 1, height: '100vh', overflowY: 'auto', position: 'relative' }}>
					{/* Header */}
					<header style={{
						padding: '12px 18px',
						backgroundColor: '#161617',
						borderBottom: '1px solid #2e303a',
						display: 'flex', alignItems: 'center', justifyContent: 'space-between',
						position: 'sticky', top: 0, zIndex: 10
					}}>
						<Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							<Box display={{ initial: 'block', lg: 'none' }}>
								<Button variant="ghost" onClick={() => setShowMobileMenu(true)} style={{ color: '#ffffff' }}><Menu size={20} /></Button>
							</Box>
							<Box>
								{activeView === 'workflows' && editingWorkflowId ? (
									<Flex align="center" gap="3">
										<Box style={{ backgroundColor: '#fdf4ff', padding: '6px', borderRadius: '8px', border: '1px solid #fae8ff' }}>
											<Workflow size={20} color="#a21caf" />
										</Box>
										<TextField.Root
											placeholder="Workflow Name..."
											value={workflowName}
											onChange={e => setWorkflowName(e.target.value)}
											size="2"
											variant="soft"
											style={{ fontWeight: 800, fontSize: '18px', color: '#111827', minWidth: '300px' }}
										/>
									</Flex>
								) : (
									<>
										<Heading size="4" style={{ margin: 0, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
											{activeView === 'dashboard' ? 'Overview' : activeView === 'knowledge' ? 'Knowledge Management' : activeView === 'workflows' ? 'Workflow Designer' : activeView === 'logs' ? 'Conversations' : 'Agent Builder'}
										</Heading>
										<Box display={{ initial: 'none', sm: 'block' }}>
											<Text size="1" style={{ color: '#9ca3af', marginTop: '2px', fontWeight: 500 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} — {user ? `Welcome back, ${profileDisplayName}.` : 'Welcome back.'}</Text>
										</Box>
									</>
								)}
							</Box>
						</Box>
						<Flex align="center" gap="4">
							<Box display={{ initial: 'none', md: 'block' }}>
								<Flex align="center" gap="2">
									<Text size="1" style={{ color: '#9ca3af' }}>Status</Text>
									<Badge color={connectionStatus === 'connected' ? 'amber' : 'gray'} variant="soft">
										{connectionStatus === 'connected' ? 'Online' : 'Offline'}
									</Badge>
								</Flex>
							</Box>
							<Box display={{ initial: 'none', md: 'block' }}>
								<Separator orientation="vertical" style={{ height: '24px', backgroundColor: '#2e303a' }} />
							</Box>
							{!user ? (
								<Flex gap="2">
									<Button variant="ghost" size="2" style={{ color: '#ffffff' }} onClick={() => window.location.href = '/'}>Sign In</Button>
									<Button size="2" style={{ backgroundColor: '#f0ad44', color: '#161617', fontWeight: 600, cursor: 'pointer' }} onClick={() => window.location.href = '/'}>Sign Up</Button>
								</Flex>
							) : null}

							{activeView === 'workflows' ? (
								<Flex gap="3" align="center" wrap="wrap" justify={{ initial: 'start', sm: 'end' }}>
									{editingWorkflowId && <Button variant="ghost" style={{ color: '#ffffff' }} onClick={() => setEditingWorkflowId(null)} size="2"><LogOut size={16} /> Exit Designer</Button>}
									<Button variant="solid" style={{ backgroundColor: '#f0ad44', color: '#161617', fontWeight: 600, cursor: 'pointer' }} onClick={() => loadWorkflowsList()} size="2"><RefreshCw size={16} /> Reload</Button>
									{editingWorkflowId && (
										<Button variant="solid" style={{ backgroundColor: '#f0ad44', color: '#161617', paddingLeft: '16px', paddingRight: '16px', fontWeight: 600, cursor: 'pointer' }} onClick={async () => {
											if (!workflowName.trim()) {
												showToast("Naming Required", "Please provide a name for your workflow in the header.");
												return;
											}
											setIsLoading(true);
											try {
												await axios.post(`${API_BASE}/workflows`, {
													id: editingWorkflowId === 'new' ? undefined : editingWorkflowId,
													name: workflowName,
													nodes: workflowsPayload?.nodes,
													edges: workflowsPayload?.edges
												});
												setEditingWorkflowId(null);
												loadWorkflowsList();
												showToast("Workflow Saved", "Workflow configuration updated successfully.");
											} catch (e) {
												console.error('Save failed', e);
												showToast("Save Failed", "There was an error saving the workflow.");
											} finally { setIsLoading(false); }
										}} size="2"><Save size={16} /> Save Workflow</Button>
									)}
								</Flex>
							) : (
								<Flex align="center" gap="4">
									<Search size={18} color="#ffffff" style={{ cursor: 'pointer' }} />
									<Bell size={18} color="#ffffff" style={{ cursor: 'pointer' }} />
								</Flex>
							)}
						</Flex>
					</header>

					{activeView !== 'agent-detail' && (
						<Box p={{ initial: "3", md: "4", lg: "5" }}>
						{activeView === 'dashboard' ? (
							<Flex direction="column" gap="4">
								{/* Metrics */}
								<Grid columns={{ initial: '1', sm: '2', lg: '4' }} gap="3">
									{[
										{ label: 'Total Agents', value: agentsList.length, change: '+0 this week', up: true },
										{ label: 'Active Sessions', value: '0', change: 'Live', up: true },
										{ label: 'Latency (Avg)', value: '1.2s', change: '-10%', up: false },
										{ label: 'Success Rate', value: '100%', change: 'Steady', up: true }
									].map((metric, i) => (
										<Card key={i} size="1" style={{ borderRadius: '8px', border: '1px solid #e5e7eb', padding: '12px', backgroundColor: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
											<Flex direction="column" gap="1">
												<Text size="1" style={{ color: '#111827', fontWeight: 600, fontSize: '12px' }}>{metric.label}</Text>
												<Heading size="5" weight="bold" style={{ color: '#111827' }}>{metric.value}</Heading>
												<Flex gap="1" align="center" mt="1">
													<Badge color={metric.up ? 'amber' : 'orange'} variant="soft" radius="full">
														{metric.change}
													</Badge>
												</Flex>
											</Flex>
										</Card>
									))}
								</Grid>


								{/* Bottom Row */}
								<Grid columns={{ initial: '1', lg: '1fr 340px' }} gap="3">
									<Box style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
										<Heading size="3" mb="1" style={{ color: '#111827', fontWeight: 800 }}>Performance Overview</Heading>
										<Text size="1" style={{ color: '#111827', marginBottom: '16px', display: 'block', fontWeight: 500, fontSize: '12px' }}>Last 7 days success metrics</Text>
										<Flex align="end" gap="2" style={{ height: '120px' }}>
											{[55, 72, 61, 88, 76, 95, 82].map((h, index) => (
												<Box key={index} style={{ flexGrow: 1, backgroundColor: index === 5 ? '#f0ad44' : '#f3f4f6', height: `${h}%`, borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
											))}
										</Flex>
									</Box>

									<Box style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
										<Heading size="3" mb="3" style={{ color: '#111827', fontWeight: 700 }}>System Usage</Heading>
										<Flex direction="column" gap="3">
											{[
												{ label: 'API Bandwidth', value: 62, color: '#f0ad44' },
												{ label: 'Token Utilization', value: 48, color: '#d97706' },
												{ label: 'Concurrency', value: 35, color: '#fcd34d' }
											].map(item => (
												<Box key={item.label}>
													<Flex justify="between" mb="1" style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
														<Text style={{ color: '#111827', fontSize: '12px' }}>{item.label}</Text>
														<Text style={{ color: '#111827', fontSize: '12px' }}>{item.value}%</Text>
													</Flex>
													<Box style={{ height: '6px', borderRadius: '3px', backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
														<Box style={{ height: '100%', width: `${item.value}%`, backgroundColor: item.color, borderRadius: '3px' }} />
													</Box>
												</Box>
											))}
										</Flex>
									</Box>
								</Grid>
							</Flex>

						) : activeView === 'knowledge' ? (
							<KnowledgeBaseManager />
						) : activeView === 'workflows' ? (
							<Flex direction="column" gap="4" style={{ height: editingWorkflowId ? 'calc(100vh - 180px)' : 'auto' }}>
								{!editingWorkflowId ? (
									<Card size="2" style={{ borderRadius: 'var(--radius-2)', backgroundColor: 'white', border: '1px solid #e8e5e0' }}>
										<Flex direction={{ initial: 'column', md: 'row' }} justify="between" align={{ initial: 'stretch', md: 'center' }} gap="4" mb="5">
											<Box>
												<Heading size={{ initial: '3', md: '4' }} mb="1" style={{ color: '#111827', fontWeight: 800 }}>Workflows</Heading>
												<Text size={{ initial: '1', md: '2' }} style={{ color: '#111827', fontWeight: 500 }}>Design complex logic for your AI agents</Text>
											</Box>
											<Flex gap="3" direction={{ initial: 'column', md: 'row' }} align={{ initial: 'stretch', md: 'center' }}>
												<TextField.Root placeholder="Search workflows..." value={workflowSearchQuery} onChange={e => setWorkflowSearchQuery(e.target.value)} size="2">
													<TextField.Slot>
														<Search size={14} />
													</TextField.Slot>
												</TextField.Root>
												<Button variant="solid" size="2" style={{ backgroundColor: '#f0ad44', color: '#161617', fontWeight: 600, cursor: 'pointer' }} onClick={() => {
													setWorkflowsPayload(null);
													setWorkflowName('New Workflow');
													setEditingWorkflowId('new');
												}}>
													<Plus size={16} /> New Workflow
												</Button>
											</Flex>
										</Flex>

										<Box style={{ overflowX: 'auto' }}>
											<Table.Root variant="ghost" size="1">
												<Table.Header>
													<Table.Row>
														<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>WORKFLOW NAME</Table.ColumnHeaderCell>
														<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>DESCRIPTION</Table.ColumnHeaderCell>
														<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>WORKFLOW ID</Table.ColumnHeaderCell>
														<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>NODES</Table.ColumnHeaderCell>
														<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>CREATED</Table.ColumnHeaderCell>
														<Table.ColumnHeaderCell justify="center" style={{ fontSize: '12px' }}>ACTIONS</Table.ColumnHeaderCell>
													</Table.Row>
												</Table.Header>
												<Table.Body>
													{paginatedWorkflows.map((wf) => {
														const isSelected = editingWorkflowId === wf.id;
														return (
															<Table.Row 
																key={wf.id} 
																align="center" 
																onClick={() => {
																	setWorkflowsPayload({ nodes: wf.nodes, edges: wf.edges });
																	setWorkflowName(wf.name);
																	setEditingWorkflowId(wf.id);
																}} 
																style={{ 
																	cursor: 'pointer',
																	boxShadow: isSelected ? 'inset 4px 0 0 0 #f0ad44' : 'inset 4px 0 0 0 transparent'
																}} 
																className={`hoverable-row ${isSelected ? 'active-row' : ''}`}
															>
															<Table.Cell>
																<Text weight="bold" style={{ color: '#111827', fontSize: '12px', whiteSpace: 'nowrap' }}>{wf.name}</Text>
															</Table.Cell>
															<Table.Cell>
																<Text style={{ color: '#111827', fontSize: '12px', whiteSpace: 'nowrap' }}>{wf.description || '—'}</Text>
															</Table.Cell>
															<Table.Cell>
																<Tooltip content={wf.id}>
																	<Text style={{ color: '#111827', fontFamily: 'monospace', fontWeight: 500, backgroundColor: '#f8fafc', padding: '2px 6px', borderRadius: '4px', cursor: 'help', fontSize: '12px' }}>
																		{wf.id.substring(0, 8)}...
																	</Text>
																</Tooltip>
															</Table.Cell>
															<Table.Cell>
																<span style={{ color: '#f0ad44', fontWeight: 800, fontSize: '10px', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', border: '1px solid rgba(240, 173, 68, 0.2)', backgroundColor: 'rgba(240, 173, 68, 0.05)' }}>
																	{(wf.nodes as any)?.length || 0} States
																</span>
															</Table.Cell>
															<Table.Cell><Text style={{ color: '#111827', fontSize: '12px' }}>{new Date(wf.created_at).toLocaleDateString()}</Text></Table.Cell>
															<Table.Cell onClick={(e) => e.stopPropagation()}>
																<Flex gap="2" justify="center" align="center">
																	<Popover.Root>
																		<Popover.Trigger onClick={(e) => e.stopPropagation()}>
																			<IconButton variant="ghost" color="gray" style={{ cursor: 'pointer' }}>
																				<MoreVertical size={16} />
																			</IconButton>
																		</Popover.Trigger>
																		<Popover.Content size="1" style={{ padding: '4px' }} onClick={(e) => e.stopPropagation()}>
																			<AlertDialog.Root>
																				<AlertDialog.Trigger onClick={(e) => e.stopPropagation()}>
																					<Button variant="ghost" color="red" size="1" style={{ width: '100%', justifyContent: 'start', cursor: 'pointer' }}>
																						<Trash2 size={14} style={{ marginRight: '6px' }} /> Delete Workflow
																					</Button>
																				</AlertDialog.Trigger>
																				<AlertDialog.Content maxWidth="450px" style={{ border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)' }}>
																					<AlertDialog.Title style={{ color: '#111827', fontWeight: 800 }}>Delete Workflow</AlertDialog.Title>
																					<AlertDialog.Description size="2" style={{ color: '#111827' }}>
																						Are you sure you want to delete the workflow <b>{wf.name}</b>? This action cannot be undone and any agents using this workflow will lose their logic.
																					</AlertDialog.Description>
																					<Flex gap="3" mt="4" justify="end" align="center">
																						<AlertDialog.Cancel>
																							<Button variant="outline" color="gray" style={{ cursor: 'pointer' }}><X size={16} /> Cancel</Button>
																						</AlertDialog.Cancel>
																						<AlertDialog.Action>
																							<Button variant="solid" color="red" style={{ cursor: 'pointer' }} onClick={async (e) => {
																								e.stopPropagation();
																								await axios.delete(`${API_BASE}/workflows/${wf.id}`);
																								loadWorkflowsList();
																								showToast("Workflow Deleted", "The workflow has been removed.");
																							}}><Trash2 size={16} /> Delete Workflow</Button>
																						</AlertDialog.Action>
																					</Flex>
																				</AlertDialog.Content>
																			</AlertDialog.Root>
																		</Popover.Content>
																	</Popover.Root>
																</Flex>
															</Table.Cell>
														</Table.Row>
													);
												})}
													{workflowsList.length === 0 && (
														<Table.Row><Table.Cell colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#111827' }}>No workflows found. Design your first logic graph.</Table.Cell></Table.Row>
													)}
												</Table.Body>
											</Table.Root>
										</Box>

										{totalWorkflowPages > 1 && (
											<Flex justify="between" align="center" mt="5" pt="4" style={{ borderTop: '1px solid #f1f5f9' }}>
												<Text size="1" style={{ color: '#111827' }}>Showing {(workflowPage - 1) * WORKFLOW_PAGE_SIZE + 1} to {Math.min(workflowPage * WORKFLOW_PAGE_SIZE, filteredWorkflows.length)} of {filteredWorkflows.length}</Text>
												<Flex gap="2">
													<IconButton size="1" variant="soft" style={{ color: '#111827' }} disabled={workflowPage === 1} onClick={() => setWorkflowPage(p => p - 1)}><ChevronLeft size={14} /></IconButton>
													<Text size="2" weight="bold" style={{ padding: '0 8px' }}>{workflowPage} / {totalWorkflowPages}</Text>
													<IconButton size="1" variant="soft" style={{ color: '#111827' }} disabled={workflowPage === totalWorkflowPages} onClick={() => setWorkflowPage(p => p + 1)}><ChevronRight size={14} /></IconButton>
												</Flex>
											</Flex>
										)}
									</Card>
								) : (
									<Card size="1" style={{ borderRadius: 'var(--radius-2)', backgroundColor: 'white', border: '1px solid #e8e5e0', height: '100%', overflow: 'hidden', padding: 0 }}>
										<Box style={{ height: '100%', width: '100%' }}>
											<AgentWorkflowBuilder
												initialNodesData={workflowsPayload}
												onSaveData={setWorkflowsPayload}
												activeNodeId={activeNodeId}
											/>
										</Box>
									</Card>
								)}
							</Flex>
						) : activeView === 'logs' ? (
							<Card size="1" style={{ borderRadius: '8px', backgroundColor: 'white', border: '1px solid #e8e5e0', padding: '16px' }}>
								{/* Header */}
								<Flex direction={{ initial: 'column', md: 'row' }} justify="between" align={{ initial: 'stretch', md: 'center' }} gap="4" mb="3">
									<Box>
										<Heading size={{ initial: '3', md: '4' }} mb="1" style={{ color: '#111827', fontWeight: 800 }}>Conversations</Heading>
										<Text size="1" style={{ color: '#111827', fontWeight: 500, fontSize: '12px' }}>{filteredLogs.length} session{filteredLogs.length !== 1 ? 's' : ''} recorded</Text>
									</Box>
									<Flex gap="3" wrap="wrap" align="center">
										{/* Search */}
										<TextField.Root placeholder="Search history..." value={logSearch} onChange={e => { setLogSearch(e.target.value); setLogPage(1); }} size="2" style={{ minWidth: '220px' }}>
											<TextField.Slot><Search size={14} /></TextField.Slot>
										</TextField.Root>
										{/* Agent filter */}
										<Select.Root value={logAgentFilter} onValueChange={v => { setLogAgentFilter(v); setLogPage(1); }}>
											<Select.Trigger placeholder="All Agents" />
											<Select.Content>
												<Select.Item value="all">All Agents</Select.Item>
												{agentsList.map(a => <Select.Item key={a.id} value={a.id}>{a.name || a.id}</Select.Item>)}
											</Select.Content>
										</Select.Root>
										{/* Type filter */}
										<Select.Root value={logTypeFilter} onValueChange={v => { setLogTypeFilter(v); setLogPage(1); }}>
											<Select.Trigger placeholder="All Types" />
											<Select.Content>
												<Select.Item value="all">All Types</Select.Item>
												<Select.Item value="general">General</Select.Item>
												<Select.Item value="workflow">Workflow</Select.Item>
											</Select.Content>
										</Select.Root>
										{/* Status filter */}
										<Select.Root value={logStatusFilter} onValueChange={v => { setLogStatusFilter(v); setLogPage(1); }}>
											<Select.Trigger placeholder="All Status" />
											<Select.Content>
												<Select.Item value="all">All Status</Select.Item>
												<Select.Item value="completed">Completed</Select.Item>
												<Select.Item value="failed">Failed</Select.Item>
											</Select.Content>
										</Select.Root>
										{/* Refresh */}
										<Button variant="solid" style={{ backgroundColor: '#f0ad44', color: '#161617', fontWeight: 600, cursor: 'pointer' }} size="2" onClick={loadLogs} loading={isLoadingLogs}>
											<RefreshCw size={14} /> Refresh
										</Button>
									</Flex>
								</Flex>

								{/* Table */}
								{!currentAgent ? (
									<Box style={{ marginBottom: 16, padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
										<Text size="2" weight="bold">Recordings</Text>
										<Text size="1" style={{ color: '#6b7280', marginTop: 8 }}>Recordings will appear here when an active agent is selected.</Text>
									</Box>
								) : (
									<Box style={{ marginBottom: 16, padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
										<Flex align="center" justify="between">
											<Text size="2" weight="bold">Recordings ({currentAgent.name || currentAgent.config?.name})</Text>
											<Flex gap="2">
												<Button variant="outline" size="1" onClick={loadRecordings} loading={isLoadingRecordings}>Refresh Recordings</Button>
											</Flex>
										</Flex>
										{previewAudioUrl && (
											<Box style={{ marginTop: 8 }}>
												<audio ref={el => { audioElementRef.current = el; if (el && previewAudioUrl) el.src = previewAudioUrl; }} controls style={{ width: '100%' }} />
											</Box>
										)}
										{recordings.length === 0 ? (
											<Text size="1" style={{ color: '#6b7280', marginTop: 8 }}>No recordings found for this agent.</Text>
										) : (
											<Box style={{ marginTop: 8 }}>
												{recordings.map(r => {
													const sizeLabel = r.file_size_bytes ? (r.file_size_bytes > 1024 * 1024 ? `${(r.file_size_bytes / (1024 * 1024)).toFixed(2)} MB` : `${(r.file_size_bytes / 1024).toFixed(1)} KB`) : '';
													const durLabel = r.duration_seconds ? `${Math.round(r.duration_seconds)}s` : '';
													return (
														<Flex key={r.id || r.recording_id} align="center" justify="between" style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
															<Flex direction="column" style={{ minWidth: 0 }}>
																<Text style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{r.file_path || r.storage_path || r.recording_id}</Text>
																<Text size="1" style={{ color: '#6b7280' }}>{r.created_at ? new Date(r.created_at).toLocaleString() : ''} {sizeLabel ? `• ${sizeLabel}` : ''} {durLabel ? `• ${durLabel}` : ''}</Text>
															</Flex>
															<Flex gap="2">
																{(r.status === 'completed' || r.status === 'processed') ? (
																	<>
																		<Button size="1" variant="solid" onClick={async (e) => {
																			e.stopPropagation();
																			try {
																				let url = r.download_url;
																				if (!url) {
																					const res = await axios.get(`${API_BASE}/agents/${currentAgent?.id}/recordings/${r.id || r.recording_id}/download-url`);
																					url = res.data.download_url;
																				}
																				if (url) {
																					setPreviewAudioUrl(url);
																					if (audioElementRef.current) {
																						audioElementRef.current.src = url;
																						audioElementRef.current.play().catch(() => {});
																					}
																				}
																			} catch (err) { console.error('Failed to get download url', err); }
																		}}>Play</Button>
																		<Button size="1" variant="outline" onClick={async (e) => {
																			e.stopPropagation();
																			try {
																				let url = r.download_url;
																				if (!url) {
																					const res = await axios.get(`${API_BASE}/agents/${currentAgent?.id}/recordings/${r.id || r.recording_id}/download-url`);
																					url = res.data.download_url;
																				}
																				if (url) {
																					navigator.clipboard?.writeText(url).then(() => showToast('Copied', 'Download link copied to clipboard')).catch(() => {});
																				}
																			} catch (err) { console.error('Failed to get download url', err); }
																		}}>Copy Link</Button>
																		<Button size="1" variant="soft" onClick={() => { setPreviewAudioUrl(null); if (audioElementRef.current) { audioElementRef.current.pause(); audioElementRef.current.currentTime = 0; audioElementRef.current.src = ''; } }}>Stop</Button>
																	</>
																) : (
																	<Button size="1" variant="soft" disabled>Not ready</Button>
																)}
															</Flex>
														</Flex>
													);
												})}
											</Box>
										)}
									</Box>
								)}
								<Box style={{ overflowX: 'auto' }}>
									<Table.Root variant="ghost" size="1">
										<Table.Header>
											<Table.Row>
												<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>AGENT</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>TYPE</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>MESSAGES</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>TIME</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>SUMMARY</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>STATUS</Table.ColumnHeaderCell>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{isLoadingLogs ? (
												<Table.Row>
													<Table.Cell colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>
														<Flex justify="center" align="center" gap="2"><RefreshCw size={18} className="animate-spin" color="#111827" /><Text style={{ color: '#111827', fontSize: '12px' }}>Loading history...</Text></Flex>
													</Table.Cell>
												</Table.Row>
											) : paginatedLogs.length === 0 ? (
												<Table.Row>
													<Table.Cell colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
														<Flex direction="column" align="center" gap="2">
															<History size={32} color="#111827" />
															<Text weight="bold" style={{ color: '#111827', fontSize: '12px' }}>No history found</Text>
															<Text style={{ color: '#111827', fontSize: '12px' }}>Sessions will appear here after interactions complete.</Text>
														</Flex>
													</Table.Cell>
												</Table.Row>
											) : paginatedLogs.map(log => (
												<Table.Row key={log.id} align="center" onClick={() => { setSelectedLogForTranscript(log); setIsTranscriptModalOpen(true); }} style={{ cursor: 'pointer' }} className="hoverable-row">
													{/* Agent */}
													<Table.Cell>
														<Text style={{ color: '#111827', fontSize: '12px', fontWeight: 600 }}>{log.agent_name}</Text>
													</Table.Cell>
													{/* Type */}
													<Table.Cell>
														<Flex align="center" gap="2">
															<span style={{ color: '#f0ad44', fontWeight: 800, fontSize: '10px', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', border: '1px solid rgba(240, 173, 68, 0.2)', backgroundColor: 'rgba(240, 173, 68, 0.05)' }}>
																{log.agent_type === 'workflow' ? 'WORKFLOW' : 'GENERAL'}
															</span>
															<span style={{ color: '#f0ad44', fontWeight: 800, fontSize: '10px', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', border: '1px solid rgba(240, 173, 68, 0.2)', backgroundColor: 'rgba(240, 173, 68, 0.05)' }}>
																{log.conversation_type === 'chat' ? 'CHAT' : 'VOICE'}
															</span>
														</Flex>
													</Table.Cell>
													{/* Messages */}
													<Table.Cell style={{ whiteSpace: 'nowrap' }}>
														<Text style={{ color: '#111827', fontSize: '12px', fontWeight: 600 }}>
															{log.message_count} turns ({log.user_turn_count} User / {log.agent_turn_count} Agent)
														</Text>
													</Table.Cell>
													{/* Time */}
													<Table.Cell style={{ whiteSpace: 'nowrap' }}>
														<Text style={{ color: '#111827', fontSize: '12px' }}>
															{log.created_at ? `${new Date(log.created_at).toLocaleDateString()} at ${new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—'}
														</Text>
													</Table.Cell>
													{/* Summary */}
													<Table.Cell style={{ maxWidth: '200px' }}>
														{log.summary ? (
															<Tooltip content={log.summary}>
																<Text style={{ color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', fontSize: '12px' }}>
																	{log.summary}
																</Text>
															</Tooltip>
														) : (
															<Text style={{ color: '#111827', fontSize: '12px', fontStyle: 'italic' }}>Pending...</Text>
														)}
													</Table.Cell>
													{/* Status */}
													<Table.Cell>
														<span style={{ color: '#f0ad44', fontWeight: 800, fontSize: '10px', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', border: '1px solid rgba(240, 173, 68, 0.2)', backgroundColor: 'rgba(240, 173, 68, 0.05)' }}>
															● COMPLETED
														</span>
													</Table.Cell>
												</Table.Row>
											))}
										</Table.Body>
									</Table.Root>
								</Box>

								{/* Pagination */}
								{totalLogPages > 1 && (
									<Flex justify="between" align="center" mt="5" pt="4" style={{ borderTop: '1px solid #f1f5f9' }}>
										<Text size="1" style={{ color: '#111827' }}>Showing {(logPage - 1) * LOG_PAGE_SIZE + 1}–{Math.min(logPage * LOG_PAGE_SIZE, filteredLogs.length)} of {filteredLogs.length} sessions</Text>
										<Flex gap="2">
											<IconButton size="1" variant="soft" style={{ color: '#111827' }} disabled={logPage === 1} onClick={() => setLogPage(p => p - 1)}><ChevronLeft size={14} /></IconButton>
											<Text size="2" weight="bold" style={{ padding: '0 8px', color: '#111827' }}>{logPage} / {totalLogPages}</Text>
											<IconButton size="1" variant="soft" style={{ color: '#111827' }} disabled={logPage === totalLogPages} onClick={() => setLogPage(p => p + 1)}><ChevronRight size={14} /></IconButton>
										</Flex>
									</Flex>
								)}
							</Card>
						) : activeView === 'builder' ? (
							<Box>
								<Card size="1" style={{ borderRadius: '8px', backgroundColor: 'white', border: '1px solid #e8e5e0', padding: '16px' }}>
									<Flex direction={{ initial: 'column', md: 'row' }} justify="between" align={{ initial: 'stretch', md: 'center' }} gap="4" mb="3">
										<Box>
											<Heading size={{ initial: '3', md: '4' }} mb="1" style={{ color: '#111827', fontWeight: 800 }}>AI Agents</Heading>
											<Text size="1" style={{ color: '#111827', fontWeight: 500, fontSize: '12px' }}>Manage your fleet of deployed voice assistants</Text>
										</Box>
										<Flex gap="3" direction={{ initial: 'column', md: 'row' }} align={{ initial: 'stretch', md: 'center' }}>
											<TextField.Root placeholder="Search agents..." value={agentSearchQuery} onChange={e => setAgentSearchQuery(e.target.value)} size="2">
												<TextField.Slot>
													<Search size={14} />
												</TextField.Slot>
											</TextField.Root>
											<Button variant="solid" size="2" onClick={openNewAgentBuilder} style={{ borderRadius: 'var(--radius-1)', fontWeight: 600, backgroundColor: '#f0ad44', color: '#161617', cursor: 'pointer' }}>
												<Plus size={14} /> Create New Agent
											</Button>
										</Flex>
									</Flex>

									<Box style={{ overflowX: 'auto' }}>
										<Table.Root variant="ghost" size="1">
											<Table.Header>
												<Table.Row>
													<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>AGENT NAME</Table.ColumnHeaderCell>
													<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>AGENT ID</Table.ColumnHeaderCell>
													<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>CATEGORY</Table.ColumnHeaderCell>
													<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>INDUSTRY</Table.ColumnHeaderCell>
													<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>USE CASE</Table.ColumnHeaderCell>
													<Table.ColumnHeaderCell style={{ fontSize: '12px' }}>MODE</Table.ColumnHeaderCell>
												</Table.Row>
											</Table.Header>

											<Table.Body>
												{paginatedAgents.map((agent) => {
													const isSelected = currentAgent?.id === agent.id;
													return (
													<Table.Row 
														key={agent.id} 
														align="center" 
														className={`hoverable-row cursor-pointer ${isSelected ? 'active-row' : ''}`}
														style={{ 
															boxShadow: isSelected ? 'inset 4px 0 0 0 #f0ad44' : 'inset 4px 0 0 0 transparent',
														}} 
														onClick={() => loadAgent(agent.id, true)}
													>
														<Table.Cell>
															<Text weight="bold" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{agent.name || agent.config?.name}</Text>
														</Table.Cell>
														<Table.Cell>
															<Flex align="center" gap="2">
																<Tooltip content={agent.id}>
																	<Text style={{ color: '#111827', fontFamily: 'monospace', fontWeight: 500, backgroundColor: '#f8fafc', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
																		{agent.id.substring(0, 8)}...
																	</Text>
																</Tooltip>
																<IconButton
																	size="1"
																	variant="ghost"
																	style={{ color: '#111827', cursor: 'pointer' }}
																	onClick={(e) => {
																		e.stopPropagation();
																		navigator.clipboard.writeText(agent.id);
																		showToast("ID Copied", "Agent ID has been copied to clipboard.");
																	}}
																>
																	<Copy size={12} />
																</IconButton>
															</Flex>
														</Table.Cell>
														<Table.Cell>
															<span style={{ color: '#f0ad44', fontWeight: 800, fontSize: '10px', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', border: '1px solid rgba(240, 173, 68, 0.2)', backgroundColor: 'rgba(240, 173, 68, 0.05)' }}>
																{(agent.config?.category || 'blank')}
															</span>
														</Table.Cell>
														<Table.Cell>
															<Text style={{ color: '#111827', fontWeight: 500, fontSize: '12px' }}>
																{agent.config?.industry || '-'}
															</Text>
														</Table.Cell>
														<Table.Cell>
															<Text style={{ color: '#111827', fontWeight: 500, fontSize: '12px' }}>
																{agent.config?.use_case || (agent.config?.category === 'blank' ? '-' : 'General')}
															</Text>
														</Table.Cell>
														<Table.Cell>
															<span style={{ color: '#f0ad44', fontWeight: 800, fontSize: '10px', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', border: '1px solid rgba(240, 173, 68, 0.2)', backgroundColor: 'rgba(240, 173, 68, 0.05)' }}>
																{agent.config?.agent_type === 'workflow' ? 'WORKFLOW' : 'GENERAL'}
															</span>
														</Table.Cell>
													</Table.Row>
												);
											})}
												{agentsList.length === 0 && (
													<Table.Row>
														<Table.Cell colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
															<Text style={{ color: '#111827', fontSize: '12px' }}>No agents found. Create one to start testing.</Text>
														</Table.Cell>
													</Table.Row>
												)}
											</Table.Body>
										</Table.Root>
									</Box>

									{totalAgentPages > 1 && (
										<Flex justify="between" align="center" mt="5" pt="4" style={{ borderTop: '1px solid #f1f5f9' }}>
											<Text size="1" style={{ color: '#111827' }}>Agents {(agentPage - 1) * AGENT_PAGE_SIZE + 1}-{Math.min(agentPage * AGENT_PAGE_SIZE, filteredAgents.length)} of {filteredAgents.length}</Text>
											<Flex gap="2">
												<IconButton size="1" variant="soft" style={{ color: '#111827' }} disabled={agentPage === 1} onClick={() => setAgentPage(p => p - 1)}><ChevronLeft size={14} /></IconButton>
												<Text size="2" weight="bold" style={{ padding: '0 8px', color: '#111827' }}>{agentPage}</Text>
												<IconButton size="1" variant="soft" style={{ color: '#111827' }} disabled={agentPage === totalAgentPages} onClick={() => setAgentPage(p => p + 1)}><ChevronRight size={14} /></IconButton>
											</Flex>
										</Flex>
									)}
								</Card>
							</Box>
						) : activeView === 'voices' ? (
							<Box>
								{/* Voices Library Header & Search */}
								<Flex direction={{ initial: 'column', md: 'row' }} justify="between" align={{ initial: 'stretch', md: 'center' }} gap="4" mb="6">
									<TextField.Root placeholder="Search voices by name, description, or ID..." size="3" value={voiceSearch} onChange={(e) => setVoiceSearch(e.target.value)} style={{ flex: 1, backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb', maxWidth: '600px' }}>
										<TextField.Slot>
											<Search size={16} color="#6b7280" />
										</TextField.Slot>
									</TextField.Root>
									<Flex gap="3" direction={{ initial: 'column', sm: 'row' }}>
										<Select.Root value={voiceCategory} onValueChange={setVoiceCategory} size="2">
											<Select.Trigger style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', minWidth: '140px' }} />
											<Select.Content>
												<Select.Item value="all_voices">All Voices</Select.Item>
												<Select.Item value="custom">Custom Voices</Select.Item>
												<Select.Item value="catalog">Voice Catalog</Select.Item>
											</Select.Content>
										</Select.Root>
										<Select.Root value={voiceLanguage} onValueChange={setVoiceLanguage} size="2">
											<Select.Trigger style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', minWidth: '140px' }} />
											<Select.Content>
												<Select.Item value="all_langs">All Languages</Select.Item>
												<Select.Item value="eng">English</Select.Item>
												<Select.Item value="ach">Acholi</Select.Item>
												<Select.Item value="teo">Ateso</Select.Item>
												<Select.Item value="nyn">Runyankore</Select.Item>
												<Select.Item value="swa">Swahili</Select.Item>
												<Select.Item value="lug">Luganda</Select.Item>
												<Select.Item value="xog">Lusoga</Select.Item>
												<Select.Item value="kin">Kinyarwanda</Select.Item>
												<Select.Item value="luo">Luo</Select.Item>
												<Select.Item value="kik">Kikuyu</Select.Item>
												<Select.Item value="hau">Hausa</Select.Item>
												<Select.Item value="ibo">Igbo</Select.Item>
												<Select.Item value="twi">Twi</Select.Item>
												<Select.Item value="yor">Yoruba</Select.Item>
												<Select.Item value="wol">Wolof</Select.Item>
												<Select.Item value="pcm">Pidgin</Select.Item>
												<Select.Item value="fat">Fula</Select.Item>
											</Select.Content>
										</Select.Root>
										<Select.Root value={voiceCountry} onValueChange={setVoiceCountry} size="2">
											<Select.Trigger style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', minWidth: '140px' }} />
											<Select.Content>
												<Select.Item value="all_countries">All Countries</Select.Item>
												<Select.Item value="UG">Uganda (UG)</Select.Item>
												<Select.Item value="KE">Kenya (KE)</Select.Item>
												<Select.Item value="RW">Rwanda (RW)</Select.Item>
												<Select.Item value="NG">Nigeria (NG)</Select.Item>
												<Select.Item value="GH">Ghana (GH)</Select.Item>
												<Select.Item value="SN">Senegal (SN)</Select.Item>
												<Select.Item value="GN">Guinea (GN)</Select.Item>
											</Select.Content>
										</Select.Root>
										<Select.Root value={voiceGender} onValueChange={setVoiceGender} size="2">
											<Select.Trigger style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', minWidth: '140px' }} />
											<Select.Content>
												<Select.Item value="all_genders">All Genders</Select.Item>
												<Select.Item value="M">Male</Select.Item>
												<Select.Item value="F">Female</Select.Item>
											</Select.Content>
										</Select.Root>
									</Flex>
								</Flex>

								{/* Custom Voice Cloning */}
								<Box mb="8">
									<Heading size="4" mb="4" style={{ color: '#111827', fontWeight: 700 }}>Custom Voice Cloning</Heading>
									<Card size="2" style={{ backgroundColor: '#fafafa', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
										<Flex direction="column" gap="4">
											<Text size="2" style={{ color: '#4b5563' }}>Upload a reference audio file to instantly clone a voice and synthesize new speech.</Text>
											<Grid columns={{ initial: '1', md: '2' }} gap="4">
												<Flex direction="column" gap="3">
													<label>
														<Text size="2" weight="bold" style={{ color: '#374151', marginBottom: '4px', display: 'block' }}>Reference Audio (WAV/MP3)</Text>
														<input type="file" accept="audio/*" onChange={(e) => setCloneAudioFile(e.target.files?.[0] || null)} style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fff' }} />
													</label>
													<label>
														<Text size="2" weight="bold" style={{ color: '#374151', marginBottom: '4px', display: 'block' }}>Reference Text (Optional)</Text>
														<TextField.Root placeholder="Transcript of the reference audio..." value={cloneRefText} onChange={e => setCloneRefText(e.target.value)} />
													</label>
												</Flex>
												<Flex direction="column" gap="3">
													<label style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
														<Text size="2" weight="bold" style={{ color: '#374151', marginBottom: '4px', display: 'block' }}>Text to Synthesize</Text>
														<TextArea placeholder="Enter the text you want the cloned voice to say..." value={cloneText} onChange={e => setCloneText(e.target.value)} style={{ flexGrow: 1 }} />
													</label>
												</Flex>
											</Grid>
											<Flex justify="between" align="center">
												<Box>
													{clonedAudioUrl && (
														<audio controls src={clonedAudioUrl} style={{ height: '40px', maxWidth: '300px' }} autoPlay />
													)}
												</Box>
												<Button style={{ backgroundColor: '#f0ad44', color: '#ffffff' }} onClick={handleVoiceClone} disabled={isCloning || !cloneAudioFile || !cloneText.trim()}>
													{isCloning ? <RefreshCw size={16} className="animate-spin" /> : <Mic size={16} />}
													Generate Custom Voice
												</Button>
											</Flex>
										</Flex>
									</Card>
								</Box>

								{/* Voice Catalog */}
								<Box>
									<Heading size="4" mb="4" style={{ color: '#111827', fontWeight: 700 }}>Voice Catalog ({phosAiVoices.length})</Heading>
									<Grid columns={{ initial: '1', sm: '2', md: '3', xl: '4' }} gap="4">
										{phosAiVoices
											.filter((voice: any) => {
												if (voiceLanguage !== 'all_langs' && !voice.id.includes(voiceLanguage)) return false;
												if (voiceCountry !== 'all_countries' && voice.flag !== voiceCountry) return false;
												if (voiceGender !== 'all_genders' && voice.gender !== voiceGender) return false;
												if (voiceSearch) {
													const term = voiceSearch.toLowerCase();
													if (!voice.name.toLowerCase().includes(term) && !voice.id.toLowerCase().includes(term)) return false;
												}
												return true;
											})
											.map((voice: any) => (
												<VoiceCard key={voice.id} voice={voice} playingVoiceId={playingVoiceId} previewAudioUrl={previewAudioUrl} onPlayToggle={playVoicePreview} themeColor="#f0ad44" showToast={showToast} />
											))}
									</Grid>
								</Box>
							</Box>
						) : null}
						</Box>
					)}

					{/* Live Voice/Chat Interaction Right Panel */}
					<>
						<div
							onClick={() => setIsVoiceUIOpen(false)}
							style={{
								position: 'fixed',
								inset: 0,
								backgroundColor: 'rgba(0, 0, 0, 0.5)',
								zIndex: 50,
								opacity: isVoiceUIOpen ? 1 : 0,
								pointerEvents: isVoiceUIOpen ? 'auto' : 'none',
								transition: 'opacity 0.3s ease-out'
							}}
						/>
						<div
							style={{
								position: 'fixed',
								right: 0,
								top: 0,
								bottom: 0,
								width: '550px',
								maxWidth: '90vw',
								backgroundColor: '#ffffff',
								zIndex: 51,
								display: 'flex',
								flexDirection: 'column',
								boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
								transform: isVoiceUIOpen ? 'translateX(0)' : 'translateX(100%)',
								transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
							}}
						>
							{currentAgent ? (
								<>
									{/* Header */}
									<div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0, backgroundColor: '#ffffff' }}>
										<div style={{ flex: 1 }}>
											<Flex align="center" gap="2">
												<Text size="3" weight="bold" style={{ color: '#111827' }}>{currentAgent?.name}</Text>
												<Badge color={isCallActive ? "amber" : isChatActive ? "blue" : "gray"} variant="soft" radius="full" size="1" style={{ fontWeight: 800 }}>{isCallActive ? 'VOICE' : isChatActive ? 'CHAT' : 'IDLE'}</Badge>
											</Flex>
										</div>
										<IconButton variant="ghost" style={{ color: '#111827' }} onClick={() => setIsVoiceUIOpen(false)}><X size={18} /></IconButton>
									</div>

									<Tabs.Root defaultValue="voice" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', minHeight: 0, overflow: 'hidden' }}>
										<Box px="4" pt="3" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
											<Tabs.List size="2" color="amber">
												<Tabs.Trigger value="voice" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
													<Mic size={16} /> Voice Focus
												</Tabs.Trigger>
												<Tabs.Trigger value="chat" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
													<MessageSquare size={16} /> Chat Transcript
												</Tabs.Trigger>
											</Tabs.List>
										</Box>

										<Tabs.Content value="voice" style={{ flex: 1, overflow: 'hidden' }}>
											<div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative' }}>
												{/* Small Centered Visualizer */}
												<div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
													{!isCallActive && !isConnecting && (
														<div style={{ 
															width: '130px', 
															height: '130px', 
															borderRadius: '50%', 
															display: 'flex', 
															flexDirection: 'column', 
															alignItems: 'center', 
															justifyContent: 'center', 
															backgroundColor: '#ffffff', 
															border: '1.5px solid #f1f5f9',
															boxShadow: '0 10px 40px rgba(0, 0, 0, 0.03), inset 0 -2px 10px rgba(0, 0, 0, 0.01)',
															gap: '12px' 
														}}>
															<div style={{ 
																width: '52px', height: '52px', borderRadius: '50%', 
																backgroundColor: '#fffbeb', color: '#f0ad44', 
																display: 'flex', alignItems: 'center', justifyContent: 'center',
																boxShadow: '0 4px 12px rgba(240, 173, 68, 0.15)' 
															}}>
																<Phone size={24} />
															</div>
															<Text size="2" weight="bold" style={{ color: '#64748b', letterSpacing: '0.01em' }}>READY</Text>
														</div>
													)}
													{(isCallActive || isConnecting) && (
														<div style={{ position: 'relative', zIndex: 1 }}>
															{renderVisualizer(agentAudioTrack, agentState, 'md', currentAgent?.config?.brand_color || brandColor)}
														</div>
													)}
												</div>

												<Box mt="8" style={{ textAlign: 'center' }}>
													<Text size="4" weight="bold" style={{ color: '#111827' }}>
														{isConnecting ? 'Establishing Connection...' : isCallActive ? (agentState === 'speaking' ? 'Agent is speaking...' : 'Listening to you...') : 'Start a Voice Call below'}
													</Text>
												</Box>
											</div>
										</Tabs.Content>

										<Tabs.Content value="chat" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
											<div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', padding: '12px' }}>
												{transcripts.length > 0 ? (
													<AgentChatTranscript messages={transformTranscripts(transcripts)} agentState={agentState === 'thinking' ? 'thinking' : agentState === 'speaking' ? 'speaking' : 'idle'} />
												) : (
													<div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.55 }}>
														<Bot size={48} color="#111827" style={{ marginBottom: '16px' }} />
														<Text size="3" weight="bold" style={{ color: '#111827' }}>No Messages Yet</Text>
													</div>
												)}
											</div>

											{/* WhatsApp-style professional chat input */}
											{(isCallActive || isChatActive) && (
												<form
													onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }}
													style={{
														display: 'flex',
														gap: '10px',
														padding: '12px 16px',
														alignItems: 'center',
														backgroundColor: '#ffffff',
														borderTop: '1px solid #f1f5f9',
														boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.02)'
													}}
												>
													<input
														type="text"
														value={chatInput}
														onChange={e => setChatInput(e.target.value)}
														placeholder="Type a message..."
														style={{
															flex: 1,
															padding: '12px 20px',
															borderRadius: '24px',
															border: '1.5px solid #e2e8f0',
															outline: 'none',
															fontSize: '15px',
															backgroundColor: '#f8fafc',
															transition: 'all 0.2s ease',
															fontFamily: 'inherit',
															minHeight: '44px',
															boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)'
														}}
														onFocus={(e) => {
															e.currentTarget.style.borderColor = '#f0ad44';
															e.currentTarget.style.boxShadow = '0 0 0 3px rgba(240, 173, 68, 0.25)';
															e.currentTarget.style.backgroundColor = '#ffffff';
														}}
														onBlur={(e) => {
															e.currentTarget.style.borderColor = '#e2e8f0';
															e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.02)';
															e.currentTarget.style.backgroundColor = '#f8fafc';
														}}
													/>
													<button
														type="submit"
														disabled={!chatInput.trim()}
														style={{
															width: '44px',
															height: '44px',
															borderRadius: '50%',
															border: 'none',
															backgroundColor: chatInput.trim() ? '#f0ad44' : '#e2e8f0',
															color: chatInput.trim() ? '#211d1e' : '#94a3b8',
															cursor: chatInput.trim() ? 'pointer' : 'default',
															display: 'flex',
															alignItems: 'center',
															justifyContent: 'center',
															transition: 'all 0.2s ease',
															flexShrink: 0,
															boxShadow: chatInput.trim() ? '0 2px 8px rgba(240, 173, 68, 0.35)' : 'none'
														}}
													>
														<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg) translate(-1px, 1px)' }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
													</button>
												</form>
											)}
										</Tabs.Content>
									</Tabs.Root>

									{/* Persistent Bottom Controls with thick, professional Etoil theme colors */}
									<div style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#ffffff', flexShrink: 0, padding: '16px 20px', gap: '14px', display: 'flex', boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.02)' }}>
										<button
											onClick={() => toggleCall()}
											disabled={isConnecting || isChatConnecting || isChatActive || currentAgent?.config?.chat_only}
											style={{
												flex: 1,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												gap: '8px',
												padding: '14px 18px',
												borderRadius: '14px',
												fontWeight: 700,
												fontSize: '14px',
												transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
												opacity: (isChatActive || currentAgent?.config?.chat_only) ? 0.35 : 1,
												fontFamily: 'inherit',
												cursor: (isConnecting || isChatActive || currentAgent?.config?.chat_only) ? 'not-allowed' : 'pointer',
												backgroundColor: (isConnecting || isChatActive || currentAgent?.config?.chat_only)
													? '#f1f5f9'
													: isCallActive
														? '#dc2626'
														: '#f0ad44',
												color: (isConnecting || isChatActive || currentAgent?.config?.chat_only)
													? '#94a3b8'
													: isCallActive
														? '#ffffff'
														: '#211d1e',
												border: (isConnecting || isChatActive || currentAgent?.config?.chat_only)
													? '1.5px solid #e2e8f0'
													: isCallActive
														? '1.5px solid #b91c1c'
														: '1.5px solid #e09e34',
												boxShadow: (isConnecting || isChatActive || currentAgent?.config?.chat_only)
													? 'none'
													: isCallActive
														? '0 4px 14px rgba(220, 38, 38, 0.3)'
														: '0 4px 14px rgba(240, 173, 68, 0.35)'
											}}
											onMouseEnter={(e) => {
												if (!isConnecting && !isChatActive && !currentAgent?.config?.chat_only) {
													e.currentTarget.style.transform = 'translateY(-1px)';
													e.currentTarget.style.boxShadow = isCallActive 
														? '0 6px 18px rgba(220, 38, 38, 0.4)' 
														: '0 6px 18px rgba(240, 173, 68, 0.45)';
												}
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.transform = 'none';
												e.currentTarget.style.boxShadow = (isConnecting || isChatActive || currentAgent?.config?.chat_only)
													? 'none'
													: isCallActive
														? '0 4px 14px rgba(220, 38, 38, 0.3)'
														: '0 4px 14px rgba(240, 173, 68, 0.35)';
											}}
										>
											{isConnecting ? <RefreshCw size={16} className="animate-spin" /> : isCallActive ? <PhoneOff size={16} /> : <Phone size={16} />}
											{isConnecting ? 'Connecting...' : isCallActive ? 'End Call' : (currentAgent?.config?.chat_only ? 'Voice Unavailable' : 'Voice Call')}
										</button>
															<button
																onClick={() => toggleChatSession()}
																disabled={isChatConnecting || isConnecting || isCallActive}
											style={{
												flex: 1,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												gap: '8px',
												padding: '14px 18px',
												borderRadius: '14px',
												fontWeight: 700,
												fontSize: '14px',
												transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
												opacity: (isCallActive) ? 0.35 : 1,
												fontFamily: 'inherit',
												cursor: (isChatConnecting || isCallActive) ? 'not-allowed' : 'pointer',
												backgroundColor: (isChatConnecting || isConnecting || isCallActive)
													? '#f1f5f9'
													: isChatActive
														? '#dc2626'
														: '#211d1e',
												color: (isChatConnecting || isConnecting || isCallActive)
													? '#94a3b8'
													: isChatActive
														? '#ffffff'
														: '#ffffff',
												border: (isChatConnecting || isConnecting || isCallActive)
													? '1.5px solid #e2e8f0'
													: isChatActive
														? '1.5px solid #b91c1c'
														: '1.5px solid #141213',
												boxShadow: (isChatConnecting || isConnecting || isCallActive)
													? 'none'
													: isChatActive
														? '0 4px 14px rgba(220, 38, 38, 0.3)'
														: '0 4px 14px rgba(33, 29, 30, 0.25)'
											}}
											onMouseEnter={(e) => {
												if (!isChatConnecting && !isConnecting && !isCallActive) {
													e.currentTarget.style.transform = 'translateY(-1px)';
													e.currentTarget.style.boxShadow = isChatActive 
														? '0 6px 18px rgba(220, 38, 38, 0.4)' 
														: '0 6px 18px rgba(33, 29, 30, 0.35)';
												}
											}}
											onMouseLeave={(e) => {
												e.currentTarget.style.transform = 'none';
												e.currentTarget.style.boxShadow = (isChatConnecting || isConnecting || isCallActive)
													? 'none'
													: isChatActive
														? '0 4px 14px rgba(220, 38, 38, 0.3)'
														: '0 4px 14px rgba(33, 29, 30, 0.25)';
											}}
										>
											{isChatConnecting ? <RefreshCw size={16} className="animate-spin" /> : isChatActive ? <X size={16} /> : <MessageSquare size={16} />}
											{isChatConnecting ? 'Connecting...' : isChatActive ? 'End Chat' : 'Text Chat'}
										</button>
									</div>
								</>
							) : (
								<div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
									<div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', marginBottom: '14px' }}><Bot size={32} /></div>
									<Text size="2" weight="bold" style={{ color: '#111827' }}>NO AGENT SELECTED</Text>
									<Text size="1" style={{ color: '#111827', marginTop: '4px' }}>Click an agent's row to start monitoring.</Text>
								</div>
							)}
						</div>
					</>

					{/* Agent Detail Full Page View */}
					{activeView === 'agent-detail' && (
						<Box p={{ initial: "3", md: "4", lg: "5" }}>
							<Flex direction="column" style={{ minHeight: 'calc(100vh - 120px)', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff' }}>
								<Box p="3" style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
									<Flex justify="between" align="center" wrap="wrap" gap="2">
										<Box style={{ minWidth: 0 }}>
											<Heading as="h2" style={{ margin: 0, fontWeight: 800, fontSize: '20px', letterSpacing: '-0.02em', color: '#111827', whiteSpace: 'nowrap' }}>
												{currentAgent ? 'Edit Agent' : creationStep === 'CATEGORY' ? 'Select Agent Type' : creationStep === 'BUSINESS_INDUSTRY' ? 'Select Industry' : creationStep === 'BUSINESS_USE_CASE' || creationStep === 'PERSONAL_USE_CASE' ? 'Select Use Case' : 'Configure Agent'}
											</Heading>
											<Text size="1" style={{ display: 'block', color: '#6b7280', marginTop: '2px', whiteSpace: 'nowrap' }}>
												{creationStep === 'CATEGORY' ? 'Choose the starting point for your new AI agent.' : creationStep === 'CONFIG' ? 'Fine-tune your agent behavior and technical settings.' : 'Tell us a bit more about what this agent will do.'}
											</Text>
										</Box>
										<Flex gap="2" align="center" wrap="wrap">
											{currentAgent && (
												<Flex gap="2" wrap="wrap">
													<AlertDialog.Root>
														<AlertDialog.Trigger>
															<Button variant="outline" size="1" style={{ color: '#dc2626', borderColor: '#fca5a5', whiteSpace: 'nowrap' }}><Trash2 size={14} /> Delete</Button>
														</AlertDialog.Trigger>
														<AlertDialog.Content maxWidth="450px" style={{ border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#ffffff' }}>
															<AlertDialog.Title style={{ color: '#111827', fontWeight: 800 }}>Delete Agent</AlertDialog.Title>
															<AlertDialog.Description size="2" style={{ color: '#111827' }}>
																Permanent deletion of agent <b>{currentAgent.name}</b>. All session history will be archived.
															</AlertDialog.Description>
															<Flex gap="3" mt="4" justify="end">
																<AlertDialog.Cancel>
																	<Button variant="soft" color="amber"><X size={16} /> Cancel</Button>
																</AlertDialog.Cancel>
																<AlertDialog.Action>
																	<Button variant="solid" color="red" onClick={() => deleteAgent(currentAgent.id, true)}><Trash2 size={16} /> Delete Agent</Button>
																</AlertDialog.Action>
															</Flex>
														</AlertDialog.Content>
													</AlertDialog.Root>
													<Button
														variant={isCallActive ? "solid" : "outline"}
														size="1"
														style={isCallActive ? { backgroundColor: '#dc2626', color: '#fff', whiteSpace: 'nowrap' } : { borderColor: '#f0ad44', color: '#92400e', whiteSpace: 'nowrap' }}
														loading={isConnecting}
														disabled={isConnecting || isChatConnecting || currentAgent.config?.chat_only}
														onClick={(e) => { e.stopPropagation(); toggleCall(currentAgent); }}
													>
														{isCallActive ? <PhoneOff size={14} /> : <Phone size={14} />}
														{currentAgent.config?.chat_only ? "Chat Only" : (isCallActive ? "Stop Voice" : "Test Voice")}
													</Button>
													<Button
														variant={isChatActive ? "solid" : "outline"}
														size="1"
														style={isChatActive ? { backgroundColor: '#dc2626', color: '#fff', whiteSpace: 'nowrap' } : { borderColor: '#f0ad44', color: '#92400e', whiteSpace: 'nowrap' }}
														loading={isChatConnecting}
														disabled={isChatConnecting || isConnecting}
														onClick={(e) => { e.stopPropagation(); toggleChatSession(currentAgent); }}
													>
														{isChatActive ? <X size={14} /> : <MessageSquare size={14} />}
														{isChatActive ? "End Chat" : "Test Chat"}
													</Button>
												</Flex>
											)}
											<Button variant="ghost" size="1" style={{ color: '#111827', whiteSpace: 'nowrap' }} onClick={() => setActiveView('builder')}><X size={14} /> Close</Button>
											{creationStep === 'CONFIG' && (
												<Button variant="solid" size="1" style={{ backgroundColor: '#f0ad44', color: '#211d1e', whiteSpace: 'nowrap' }} onClick={() => createAgent()} loading={isLoading}>
													{currentAgent ? <Save size={14} /> : <Check size={14} />}
													{currentAgent ? 'Save Changes' : 'Create Agent'}
												</Button>
											)}
										</Flex>
									</Flex>
								</Box>

								<Box style={{ flexGrow: 1, overflowY: 'auto', backgroundColor: '#fafafa' }}>
									<Box p={{ initial: '3', md: '4' }}>
										{creationStep === 'CATEGORY' && (
											<Flex direction="column" align="center" gap="6" py="8">
												<Box style={{ textAlign: 'center' }}>
													<Heading size="8" style={{ fontWeight: 800, color: '#111827' }}>New agent</Heading>
													<Text size="3" style={{ color: '#111827' }}>What type of agent would you like to create?</Text>
												</Box>

												<Flex direction="column" gap="4" style={{ width: '100%', maxWidth: '800px' }}>
													<Card size="3" onClick={() => { setAgentCategory('blank'); setCreationStep('CONFIG'); }} style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }} className="category-card">
														<Flex align="center" justify="center" gap="3">
															<Box style={{ color: '#d97706' }}><History size={24} style={{ border: '2px dashed #f0ad44', borderRadius: '50%', padding: '4px' }} /></Box>
															<Text size="4" weight="bold" style={{ color: '#111827' }}>Blank Agent</Text>
														</Flex>
													</Card>

													<Grid columns="2" gap="4">
														<Card size="3" onClick={() => { setAgentCategory('personal'); setCreationStep('PERSONAL_USE_CASE'); }} style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #e5e7eb', minHeight: '300px', backgroundColor: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }} className="category-card">
															<Flex direction="column" gap="4" align="center" justify="center" style={{ height: '100%' }}>
																<Box style={{ width: '100%', maxWidth: '280px', height: '180px', backgroundColor: '#fffbeb', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #fcd34d' }}>
																	<Flex justify="end"><Box style={{ fontSize: '11px', backgroundColor: '#f0ad44', color: '#211d1e', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>Could you see whether I have any urgent outstanding emails?</Box></Flex>
																	<Box style={{ fontSize: '11px', backgroundColor: '#ffffff', color: '#111827', padding: '4px 10px', borderRadius: '12px', alignSelf: 'start', maxWidth: '80%', border: '1px solid #e5e7eb' }}>Sure, let me check.</Box>
																	<Box style={{ fontSize: '11px', backgroundColor: '#ffffff', color: '#111827', padding: '4px 10px', borderRadius: '12px', alignSelf: 'start', maxWidth: '90%', border: '1px solid #e5e7eb' }}>You've got one urgent email from your manager about tomorrow's meeting. Want a quick summary?</Box>
																</Box>
																<Flex align="center" gap="2">
																	<User size={18} color="#92400e" />
																	<Text size="3" weight="bold" style={{ color: '#111827' }}>Personal Assistant</Text>
																</Flex>
															</Flex>
														</Card>

														<Card size="3" onClick={() => { setAgentCategory('business'); setCreationStep('BUSINESS_INDUSTRY'); }} style={{ cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #e5e7eb', minHeight: '300px', backgroundColor: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }} className="category-card">
															<Flex direction="column" gap="4" align="center" justify="center" style={{ height: '100%' }}>
																<Box style={{ width: '100%', maxWidth: '280px', height: '180px', backgroundColor: '#fffbeb', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #fcd34d' }}>
																	<Flex justify="end"><Box style={{ fontSize: '11px', backgroundColor: '#f0ad44', color: '#211d1e', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>Can you tell me more about pricing?</Box></Flex>
																	<Box style={{ fontSize: '11px', backgroundColor: '#ffffff', color: '#111827', padding: '4px 10px', borderRadius: '12px', alignSelf: 'start', maxWidth: '85%', border: '1px solid #e5e7eb' }}>Absolutely! We offer three plans, Starter, Pro, and Enterprise. Want a quick breakdown, or should I help you pick the best fit?</Box>
																</Box>
																<Flex align="center" gap="2">
																	<Briefcase size={18} color="#92400e" />
																	<Text size="3" weight="bold" style={{ color: '#111827' }}>Business Agent</Text>
																	<Badge color="amber" variant="soft" radius="full">Improved</Badge>
																</Flex>
															</Flex>
														</Card>
													</Grid>
												</Flex>
											</Flex>
										)}

										{creationStep === 'PERSONAL_USE_CASE' && (
											<Flex direction="column" gap="6">
												<Box>
													<Heading size="7" style={{ fontWeight: 800, color: '#111827' }}>Use case</Heading>
													<Text size="3" style={{ color: '#111827' }}>What will your agent help with?</Text>
												</Box>
												<Grid columns="3" gap="4">
													{[
														{ id: 'pa', label: 'Personal Assistant', icon: <User size={20} /> },
														{ id: 'lc', label: 'Learning Companion', icon: <GraduationCap size={20} /> },
														{ id: 'ch', label: 'Creative Helper', icon: <Palette size={20} /> },
														{ id: 'hw', label: 'Health & Wellness', icon: <Activity size={20} /> },
														{ id: 'tm', label: 'Task Management', icon: <CheckSquare size={20} /> },
														{ id: 'ra', label: 'Research Assistant', icon: <Search size={20} /> },
														{ id: 'other', label: 'Other', icon: <Settings size={20} />, dashed: true }
													].map(item => (
														<Card
															key={item.id}
															size="3"
															onClick={() => { setAgentUseCase(item.label); setCreationStep('CONFIG'); }}
															style={{ cursor: 'pointer', border: item.dashed ? '1px dashed #fcd34d' : '1px solid #e5e7eb', transition: 'all 0.2s' }}
															className="category-card"
														>
															<Flex direction="column" align="center" justify="center" gap="3" py="4">
																<Box style={{ color: '#111827' }}>{item.icon}</Box>
																<Text size="2" weight="bold">{item.label}</Text>
															</Flex>
														</Card>
													))}
												</Grid>
												<Box mt="4">
													<Button variant="outline" color="amber" onClick={() => setCreationStep('CATEGORY')} size="2">
														<ChevronLeft size={16} /> Back
													</Button>
												</Box>
											</Flex>
										)}

										{creationStep === 'BUSINESS_INDUSTRY' && (
											<Flex direction="column" gap="6">
												<Box>
													<Heading size="7" style={{ fontWeight: 800, color: '#111827' }}>What industry is your business in?</Heading>
													<Text size="3" style={{ color: '#111827' }}>Select the industry that best describes your business</Text>
												</Box>
												<Grid columns="3" gap="4">
													{[
														{ id: 'retail', label: 'Retail & E-commerce', icon: <ShoppingCart size={20} /> },
														{ id: 'health', label: 'Healthcare & Medical', icon: <Stethoscope size={20} /> },
														{ id: 'finance', label: 'Finance & Banking', icon: <Building2 size={20} /> },
														{ id: 'real', label: 'Real Estate', icon: <Globe size={20} /> },
														{ id: 'edu', label: 'Education & Training', icon: <GraduationCap size={20} /> },
														{ id: 'hosp', label: 'Hospitality & Travel', icon: <Plane size={20} /> },
														{ id: 'auto', label: 'Automotive', icon: <Car size={20} /> },
														{ id: 'prof', label: 'Professional Services', icon: <Briefcase size={20} /> },
														{ id: 'tech', label: 'Technology & Software', icon: <Settings size={20} /> },
														{ id: 'gov', label: 'Government & Public', icon: <Building2 size={20} /> },
														{ id: 'food', label: 'Food & Beverage', icon: <UtensilsCrossed size={20} /> },
														{ id: 'manu', label: 'Manufacturing', icon: <Hammer size={20} /> },
														{ id: 'fit', label: 'Fitness & Wellness', icon: <Activity size={20} /> },
														{ id: 'legal', label: 'Legal Services', icon: <Scale size={20} /> },
														{ id: 'non', label: 'Non-Profit', icon: <HeartHandshake size={20} /> },
														{ id: 'media', label: 'Media & Entertainment', icon: <Music size={20} /> },
														{ id: 'other', label: 'Other', icon: <Settings size={20} />, dashed: true }
													].map(item => (
														<Card
															key={item.id}
															size="3"
															onClick={() => { setAgentIndustry(item.label); setCreationStep('BUSINESS_USE_CASE'); }}
															style={{ cursor: 'pointer', border: item.dashed ? '1px dashed #fcd34d' : '1px solid #e5e7eb', transition: 'all 0.2s' }}
															className="category-card"
														>
															<Flex direction="column" align="center" justify="center" gap="3" py="3">
																<Box style={{ color: '#111827' }}>{item.icon}</Box>
																<Text size="2" weight="bold">{item.label}</Text>
															</Flex>
														</Card>
													))}
												</Grid>
												<Box mt="4">
													<Button variant="outline" color="amber" onClick={() => setCreationStep('CATEGORY')} size="2">
														<ChevronLeft size={16} /> Back
													</Button>
												</Box>
											</Flex>
										)}

										{creationStep === 'BUSINESS_USE_CASE' && (
											<Flex direction="column" gap="6">
												<Box>
													<Heading size="7" style={{ fontWeight: 800, color: '#111827' }}>Use case</Heading>
													<Text size="3" style={{ color: '#111827' }}>What will your agent help with?</Text>
												</Box>
												<Grid columns="3" gap="4">
													{[
														{ id: 'support', label: 'Customer Support', icon: <Headphones size={20} /> },
														{ id: 'sales', label: 'Outbound Sales', icon: <BarChart size={20} /> },
														{ id: 'ld', label: 'Learning and Development', icon: <Book size={20} /> },
														{ id: 'sched', label: 'Scheduling', icon: <Calendar size={20} /> },
														{ id: 'leadq', label: 'Lead Qualification', icon: <UserCheck size={20} /> },
														{ id: 'answer', label: 'Answering Service', icon: <Phone size={20} /> },
														{ id: 'recom', label: 'Product Recommendations', icon: <ShoppingCart size={20} /> },
														{ id: 'track', label: 'Order Tracking', icon: <Truck size={20} /> },
														{ id: 'return', label: 'Returns & Exchanges', icon: <Undo size={20} /> },
														{ id: 'leadg', label: 'Lead Generation', icon: <Activity size={20} /> },
														{ id: 'loyal', label: 'Loyalty Programs', icon: <HeartHandshake size={20} /> },
														{ id: 'other', label: 'Other', icon: <Settings size={20} />, dashed: true }
													].map(item => (
														<Card
															key={item.id}
															size="3"
															onClick={() => { setAgentUseCase(item.label); setCreationStep('CONFIG'); }}
															style={{ cursor: 'pointer', border: item.dashed ? '1px dashed #fcd34d' : '1px solid #e5e7eb', transition: 'all 0.2s' }}
															className="category-card"
														>
															<Flex direction="column" align="center" justify="center" gap="3" py="3">
																<Box style={{ color: '#111827' }}>{item.icon}</Box>
																<Text size="2" weight="bold" style={{ textAlign: 'center' }}>{item.label}</Text>
															</Flex>
														</Card>
													))}
												</Grid>
												<Box mt="4">
													<Button variant="outline" color="amber" onClick={() => setCreationStep('BUSINESS_INDUSTRY')} size="2">
														<ChevronLeft size={16} /> Back
													</Button>
												</Box>
											</Flex>
										)}

										{creationStep === 'CONFIG' && (
											<Tabs.Root defaultValue="instructions">
												<Tabs.List size="2">
													<Tabs.Trigger value="instructions">Core Behavior</Tabs.Trigger>
													<Tabs.Trigger value="providers">Model & Voice</Tabs.Trigger>
													<Tabs.Trigger value="logic">Workflow</Tabs.Trigger>
													<Tabs.Trigger value="tools"><Flex align="center" gap="1"><Workflow size={14} /> Tools & Integrations</Flex></Tabs.Trigger>
													<Tabs.Trigger value="branding">Branding</Tabs.Trigger>
													{currentAgent && <Tabs.Trigger value="widget"><Flex align="center" gap="1"><Code size={14} /> Widget</Flex></Tabs.Trigger>}
												</Tabs.List>

												<Box pt="5">
													<Tabs.Content value="instructions">
														<Flex direction="column" gap="4">
															<Box>
																<Text as="label" size="2" weight="bold" mb="1" style={{ display: 'block' }}>Agent Name</Text>
																<TextField.Root placeholder="e.g. Sarah from Sales" value={agentName} onChange={e => setAgentName(e.target.value)} size="2" />
															</Box>
															<Box>
																<Text as="label" size="2" weight="bold" mb="1" style={{ display: 'block' }}>System Instructions</Text>
																<TextArea placeholder="Explain who the agent is and how it should behave..." value={instructions} onChange={e => setInstructions(e.target.value)} style={{ height: '230px' }} size="2" />
															</Box>

															<Box style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
																<Flex align="center" gap="3">
																	<Switch checked={chatOnly} onCheckedChange={setChatOnly} radius="full" />
																	<Box>
																		<Text size="2" weight="bold" style={{ color: '#111827' }}>Chat only</Text>
																		<Text size="1" ml="2" style={{ color: '#111827' }}>Audio will not be processed and only text will be used</Text>
																	</Box>
																</Flex>
															</Box>

															<Flex align="center" gap="4">
																<Flex align="center" gap="2">
																	<Text size="2">Send Welcome Message</Text>
																	<Switch checked={welcomeMessage} onCheckedChange={setWelcomeMessage} radius="full" />
																</Flex>
																<Flex align="center" gap="2">
																	<Text size="2">Allow Interruption</Text>
																	<Switch checked={allowInterruption} onCheckedChange={setAllowInterruption} radius="full" />
																</Flex>
															</Flex>
															<Box>
																<Button variant="outline" color="amber" onClick={() => {
																	if (agentCategory === 'personal') setCreationStep('PERSONAL_USE_CASE');
																	else if (agentCategory === 'business') setCreationStep('BUSINESS_USE_CASE');
																	else setCreationStep('CATEGORY');
																}} size="2">
																	<ChevronLeft size={16} /> Back to Selection
																</Button>
															</Box>
														</Flex>
													</Tabs.Content>

													<Tabs.Content value="providers">
														<Grid columns={{ initial: '1', md: '3' }} gap="4">
															<Flex direction="column" gap="3">
																<Text size="2" weight="bold" style={{ color: '#111827', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '11px' }}>Transcription (STT)</Text>
																<Select.Root value={selectedProviders.stt} onValueChange={(v) => setSelectedProviders(prev => ({ ...prev, stt: v }))}>
																	<Select.Trigger placeholder="Select STT Provider" />
																	<Select.Content>
																		{providers.stt && Object.keys(providers.stt).map(id => <Select.Item key={id} value={id}>{id.toUpperCase()}</Select.Item>)}
																	</Select.Content>
																</Select.Root>
																{selectedProviders.stt && providers.stt?.[selectedProviders.stt]?.models && (
																	<Select.Root value={providerConfigs.stt.model || providers.stt?.[selectedProviders.stt]?.models?.[0]?.id || ''} onValueChange={v => updateProviderConfig('stt', 'model', v)}>
																		<Select.Trigger placeholder="Select Model" />
																		<Select.Content>
																			{providers.stt?.[selectedProviders.stt]?.models?.map(m => <Select.Item key={m.id} value={m.id}>{m.name}</Select.Item>)}
																		</Select.Content>
																	</Select.Root>
																)}
															</Flex>

															<Flex direction="column" gap="3">
																<Text size="2" weight="bold" style={{ color: '#111827', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '11px' }}>Reasoning (LLM)</Text>
																<Select.Root value={selectedProviders.llm} onValueChange={(v) => setSelectedProviders(prev => ({ ...prev, llm: v }))}>
																	<Select.Trigger placeholder="Select LLM Provider" />
																	<Select.Content>
																		{providers.llm && Object.keys(providers.llm).map(id => <Select.Item key={id} value={id}>{id.toUpperCase()}</Select.Item>)}
																	</Select.Content>
																</Select.Root>
																{selectedProviders.llm && providers.llm?.[selectedProviders.llm]?.models && (
																	<Select.Root value={providerConfigs.llm.model || providers.llm?.[selectedProviders.llm]?.models?.[0]?.id || ''} onValueChange={v => updateProviderConfig('llm', 'model', v)}>
																		<Select.Trigger />
																		<Select.Content>
																			{providers.llm?.[selectedProviders.llm]?.models?.map(m => <Select.Item key={m.id} value={m.id}>{m.name}</Select.Item>)}
																		</Select.Content>
																	</Select.Root>
																)}
																<Flex direction="column" gap="2">
																	<Text size="2" weight="bold" style={{ color: '#111827', whiteSpace: 'nowrap' }}>Temperature: {providerConfigs.llm.temperature || 0.7}</Text>
																	<Slider defaultValue={[0.7]} max={1} step={0.1} onValueChange={([v]) => updateProviderConfig('llm', 'temperature', v.toString())} color="amber" radius="full" />
																</Flex>
															</Flex>

															<Flex direction="column" gap="3">
																<Text size="2" weight="bold" style={{ color: '#111827', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '11px' }}>Speech (TTS)</Text>
																<Select.Root value={selectedProviders.tts} onValueChange={(v) => setSelectedProviders(prev => ({ ...prev, tts: v }))}>
																	<Select.Trigger placeholder="Select TTS Provider" />
																	<Select.Content>
																		{providers.tts && Object.keys(providers.tts).map(id => <Select.Item key={id} value={id}>{id.toUpperCase()}</Select.Item>)}
																	</Select.Content>
																</Select.Root>
																{selectedProviders.tts && providers.tts?.[selectedProviders.tts]?.voice_options && (
																	<Popover.Root open={ttsVoiceDropdownOpen} onOpenChange={setTtsVoiceDropdownOpen}>
																		<Popover.Trigger>
																			<Button variant="surface" size="2" style={{ justifyContent: 'space-between', width: '100%', color: '#111827', backgroundColor: '#fff', fontWeight: 400 }}>
																				{(() => {
																					const selectedId = providerConfigs.tts.voice || providers.tts?.[selectedProviders.tts]?.voice_options?.[0]?.id;
																					if (!selectedId) return "Select Voice";
																					const selectedV = providers.tts?.[selectedProviders.tts]?.voice_options?.find((v: any) => v.id === selectedId);
																					const phosVoice = phosAiVoices?.find(pv => pv.id === selectedId);
																					return (selectedProviders.tts?.toLowerCase().includes('phos') && phosVoice?.name) ? phosVoice.name : (selectedV?.name || selectedId);
																				})()}
																				<ChevronRight size={14} style={{ transform: ttsVoiceDropdownOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', opacity: 0.5 }} />
																			</Button>
																		</Popover.Trigger>
																		<Popover.Content width="300px" style={{ padding: '0', borderRadius: '8px', overflow: 'hidden' }}>
																			<Box p="2" style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
																				<TextField.Root placeholder="Search voices..." value={ttsVoiceSearch} onChange={e => setTtsVoiceSearch(e.target.value)}>
																					<TextField.Slot><Search size={14} /></TextField.Slot>
																				</TextField.Root>
																			</Box>
																			<ScrollArea type="auto" scrollbars="vertical" style={{ maxHeight: '300px' }}>
																				<Flex direction="column" p="1">
																					{providers.tts?.[selectedProviders.tts]?.voice_options?.filter((v: any) => {
																						const phosVoice = phosAiVoices?.find(pv => pv.id === v.id);
																						const displayName = (selectedProviders.tts?.toLowerCase().includes('phos') && phosVoice?.name) ? phosVoice.name : (v.name || v.id);
																						return displayName.toLowerCase().includes(ttsVoiceSearch.toLowerCase());
																					}).map((v: any) => {
																						const phosVoice = phosAiVoices?.find(pv => pv.id === v.id);
																						const displayName = (selectedProviders.tts?.toLowerCase().includes('phos') && phosVoice?.name) ? phosVoice.name : (v.name || v.id);
																						const isSelected = (providerConfigs.tts.voice || providers.tts?.[selectedProviders.tts]?.voice_options?.[0]?.id) === v.id;
																						return (
																							<Button
																								key={v.id}
																								variant="ghost"
																								style={{ justifyContent: 'flex-start', color: isSelected ? '#d97706' : '#111827', backgroundColor: isSelected ? '#fef3c7' : 'transparent', fontWeight: isSelected ? 600 : 400, borderRadius: '4px', margin: '2px 0' }}
																								onClick={() => {
																									updateProviderConfig('tts', 'voice', v.id);
																									setTtsVoiceDropdownOpen(false);
																									setTtsVoiceSearch('');
																								}}
																							>
																								{displayName}
																							</Button>
																						);
																					})}
																					{providers.tts?.[selectedProviders.tts]?.voice_options?.filter((v: any) => {
																						const phosVoice = phosAiVoices?.find(pv => pv.id === v.id);
																						const displayName = (selectedProviders.tts?.toLowerCase().includes('phos') && phosVoice?.name) ? phosVoice.name : (v.name || v.id);
																						return displayName.toLowerCase().includes(ttsVoiceSearch.toLowerCase());
																					}).length === 0 && (
																						<Text size="2" style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>No voices found</Text>
																					)}
																				</Flex>
																			</ScrollArea>
																		</Popover.Content>
																	</Popover.Root>
																)}
															</Flex>
														</Grid>
													</Tabs.Content>

													<Tabs.Content value="logic">
														<Flex direction="column" gap="5" p="2">
															<Box>
																<Text as="label" size="2" weight="bold" mb="3" style={{ display: 'block', color: '#111827' }}>
																	Agent Execution Mode
																</Text>
																<SegmentedControl.Root value={agentType} onValueChange={v => setAgentType(v as any)} size="2">
																	<SegmentedControl.Item value="general">Instructions Only</SegmentedControl.Item>
																	<SegmentedControl.Item value="workflow">Workflow Logic</SegmentedControl.Item>
																</SegmentedControl.Root>
																<Text size="1" mt="2" style={{ display: 'block', color: '#111827' }}>
																	{agentType === 'general'
																		? 'Agent follows system prompt instructions for conversational reasoning.'
																		: 'Agent follows a structured state machine with defined nodes and transitions.'}
																</Text>
															</Box>

															{agentType === 'workflow' ? (
																<Card size="1" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
																	<Flex direction="column" gap="3" p="3">
																		<Box>
																			<Text size="2" weight="bold" mb="2" style={{ display: 'block', color: '#111827' }}>Attach Saved Workflow</Text>
																			<Select.Root value={selectedWorkflowId} onValueChange={setSelectedWorkflowId}>
																				<Select.Trigger placeholder="Choose a workflow..." style={{ width: '100%' }} />
																				<Select.Content>
																					<Select.Item value="none">No workflow attached (uses instructions)</Select.Item>
																					{workflowsList.map(wf => (
																						<Select.Item key={wf.id} value={wf.id}>{wf.name}</Select.Item>
																					))}
																				</Select.Content>
																			</Select.Root>
																		</Box>
																		<Text size="1" style={{ color: '#111827' }}>
																			Selecting a workflow will override general system instructions and use the node-based logic defined in your workflows section.
																		</Text>
																	</Flex>
																</Card>
															) : (
																<Box style={{ padding: '24px', border: '2px dashed #f1f5f9', borderRadius: '12px', textAlign: 'center' }}>
																	<Text size="2" style={{ color: '#111827' }}>In <b>General Mode</b>, logic is driven by the prompt in the <b>Core Behavior</b> tab.</Text>
																</Box>
															)}
														</Flex>
													</Tabs.Content>

													<Tabs.Content value="tools">
														<Flex direction="column" gap="5" p="2">
															<Box style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
																<Flex align="center" gap="3">
																	<Switch checked={toolsEnabled} onCheckedChange={setToolsEnabled} radius="full" />
																	<Box>
																		<Text size="2" weight="bold" style={{ color: '#111827' }}>Enable Google Workspace Tools</Text>
																		<Text size="1" ml="2" style={{ color: '#111827' }}>Allow this agent to use Google Sheets, Gmail, and Calendar tools</Text>
																	</Box>
																</Flex>
															</Box>

															{toolsEnabled && (
																<Flex direction="column" gap="4">
																	{/* Google OAuth Section */}
																	<Box style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
																		<Flex align="center" justify="between" gap="3">
																			<Box>
																				<Text size="2" weight="bold" style={{ color: '#111827' }}>Google Account Connection</Text>
																				<Text size="1" ml="2" style={{ color: '#111827' }}>
																					{googleConnected ? 'Connected with Google account' : 'Connect your Google account to enable tools'}
																				</Text>
																			</Box>
																			{googleConnected ? (
																				<Button
																					variant="solid"
																					size="1"
																					onClick={disconnectGoogle}
																					style={{ fontSize: '12px', backgroundColor: '#ef4444', color: 'white' }}
																				>
																					<CheckCircle size={12} /> Disconnect
																				</Button>
																			) : (
																				<Button
																					variant="outline"
																					size="1"
																					onClick={initiateGoogleOAuth}
																					style={{ fontSize: '12px', borderColor: '#f0ad44', color: '#92400e' }}
																				>
																					<ExternalLink size={12} /> Connect Google Account
																				</Button>
																			)}
																		</Flex>
																	</Box>

																	{/* Tool Selection */}
																	<Text size="2" weight="bold" style={{ color: '#111827' }}>Select Tools</Text>
																	<Text size="1" style={{ color: '#111827' }}>Choose which tool categories to enable for this agent.</Text>

																	<Flex direction="column" gap="3">
																		<Box style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
																			<Flex align="center" gap="3">
																				<input
																					type="checkbox"
																					id="google-calendar"
																					checked={selectedToolCategories.includes('google_calendar')}
																					onChange={(e) => {
																						if (e.target.checked) {
																							setSelectedToolCategories([...selectedToolCategories, 'google_calendar']);
																						} else {
																							setSelectedToolCategories(selectedToolCategories.filter(c => c !== 'google_calendar'));
																						}
																					}}
																					style={{ width: '18px', height: '18px', cursor: 'pointer' }}
																				/>
																				<img src={GoogleCalendarIcon} alt="Google Calendar" style={{ width: '24px', height: '24px', flexShrink: 0 }} />
																				<Box>
																					<Text size="2" weight="bold" style={{ color: '#111827' }}>Google Calendar</Text>
																					<Text size="1" ml="2" style={{ color: '#111827' }}>Create, find, update, and delete calendar events</Text>
																				</Box>
																			</Flex>
																		</Box>

																		<Box style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
																			<Flex align="center" gap="3">
																				<input
																					type="checkbox"
																					id="gmail"
																					checked={selectedToolCategories.includes('gmail')}
																					onChange={(e) => {
																						if (e.target.checked) {
																							setSelectedToolCategories([...selectedToolCategories, 'gmail']);
																						} else {
																							setSelectedToolCategories(selectedToolCategories.filter(c => c !== 'gmail'));
																						}
																					}}
																					style={{ width: '18px', height: '18px', cursor: 'pointer' }}
																				/>
																				<img src={GmailIcon} alt="Gmail" style={{ width: '24px', height: '24px', flexShrink: 0 }} />
																				<Box>
																					<Text size="2" weight="bold" style={{ color: '#111827' }}>Gmail</Text>
																					<Text size="1" ml="2" style={{ color: '#111827' }}>Send emails, fetch emails, and list threads</Text>
																				</Box>
																			</Flex>
																		</Box>

																		<Box style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
																			<Flex align="center" gap="3">
																				<input
																					type="checkbox"
																					id="google-sheets"
																					checked={selectedToolCategories.includes('google_sheets')}
																					onChange={(e) => {
																						if (e.target.checked) {
																							setSelectedToolCategories([...selectedToolCategories, 'google_sheets']);
																						} else {
																							setSelectedToolCategories(selectedToolCategories.filter(c => c !== 'google_sheets'));
																						}
																					}}
																					style={{ width: '18px', height: '18px', cursor: 'pointer' }}
																				/>
																				<img src={GoogleSheetsIcon} alt="Google Sheets" style={{ width: '24px', height: '24px', flexShrink: 0 }} />
																				<Box>
																					<Text size="2" weight="bold" style={{ color: '#111827' }}>Google Sheets</Text>
																					<Text size="1" ml="2" style={{ color: '#111827' }}>Append, update, create, and get spreadsheet values</Text>
																				</Box>
																			</Flex>
																		</Box>
																	</Flex>

																	{selectedToolCategories.length > 0 && (
																		<Box style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
																			<Text size="1" style={{ color: '#0369a1' }}>
																				{selectedToolCategories.length} tool{selectedToolCategories.length > 1 ? 's' : ''} selected: {selectedToolCategories.map(c => c.replace('_', ' ')).join(', ')}
																			</Text>
																		</Box>
																	)}
																</Flex>
															)}

															{!toolsEnabled && (
																<Box style={{ padding: '24px', border: '2px dashed #f1f5f9', borderRadius: '12px', textAlign: 'center' }}>
																	<Text size="2" style={{ color: '#111827' }}>Enable Google Workspace Tools to give your agent access to Google Calendar, Gmail, and Google Sheets.</Text>
																</Box>
															)}

															{/* Web Search Section - Always Available */}
															<Separator size="4" />
															<Box style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
																<Flex direction="column" gap="3">
																	<Flex align="center" gap="3">
																		<Switch checked={webSearchEnabled} onCheckedChange={setWebSearchEnabled} radius="full" />
																		<Box>
																			<Text size="2" weight="bold" style={{ color: '#111827' }}>Web Search</Text>
																			<Text size="1" ml="2" style={{ color: '#111827' }}>Enable your agent to search the web for real-time information and current events</Text>
																		</Box>
																	</Flex>

																	{webSearchEnabled && (
																		<Box>
																			<Text size="1" weight="bold" style={{ color: '#334155' }}>Tavily API Key</Text>
																			<Text size="1" as="p" style={{ color: '#111827' }}>Enter your Tavily API key to enable web search functionality. Get your free API key at <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>tavily.com</a></Text>
																			<TextField.Root
																				type={showApiKey ? "text" : "password"}
																				value={tavilyApiKey}
																				onChange={(e) => setTavilyApiKey(e.target.value)}
																				style={{ marginTop: '8px', width: '100%' }}
																			>
																				<TextField.Slot side="left">
																					<Key size={16} style={{ color: '#111827' }} />
																				</TextField.Slot>
																				<TextField.Slot side="right">
																					<Box
																						onClick={() => setShowApiKey(!showApiKey)}
																						style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
																					>
																						{showApiKey ? <EyeOff size={16} style={{ color: '#111827' }} /> : <Eye size={16} style={{ color: '#111827' }} />}
																					</Box>
																				</TextField.Slot>
																			</TextField.Root>
																		</Box>
																	)}
																</Flex>
															</Box>
														</Flex>
													</Tabs.Content>

													<Tabs.Content value="branding">
														<Flex direction="column" gap="5" p="2">
															<Box>
																<Text as="label" size="2" weight="bold" mb="3" style={{ display: 'block', color: '#111827' }}>
																	Visualizer Type
																</Text>
																<SegmentedControl.Root value={visualizerType} onValueChange={v => setVisualizerType(v as any)} size="2">
																	<SegmentedControl.Item value="bar">Bar</SegmentedControl.Item>
																	<SegmentedControl.Item value="grid">Grid</SegmentedControl.Item>
																	<SegmentedControl.Item value="radial">Radial</SegmentedControl.Item>
																	<SegmentedControl.Item value="wave">Wave</SegmentedControl.Item>
																	<SegmentedControl.Item value="aura">Aura</SegmentedControl.Item>
																</SegmentedControl.Root>
																<Text size="1" mt="2" style={{ display: 'block', color: '#111827' }}>
																	Choose the audio visualizer style from official LiveKit components.
																</Text>
															</Box>

															<Box>
																<Text as="label" size="2" weight="bold" mb="3" style={{ display: 'block', color: '#111827' }}>
																	Brand Color
																</Text>
																<Flex align="center" gap="3">
																	<input
																		type="color"
																		value={brandColor}
																		onChange={(e) => setBrandColor(e.target.value)}
																		style={{ width: '40px', height: '40px', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0 }}
																	/>
																	<TextField.Root
																		value={brandColor}
																		onChange={(e) => setBrandColor(e.target.value)}
																		placeholder="#f0ad44"
																		size="2"
																		style={{ flex: 1 }}
																	/>
																</Flex>
																<Text size="1" mt="2" style={{ display: 'block', color: '#111827' }}>
																	The primary color used for the voice visualizer and branding elements.
																</Text>
															</Box>

															<Box mt="4" style={{ backgroundColor: '#fffbeb', padding: '24px', borderRadius: '16px', border: '1px solid #fcd34d', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3' }}>
																<Text size="1" weight="bold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: '#92400e' }}>Preview</Text>
																<Box style={{ width: '150px', height: '150px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
																	<div style={{ position: 'relative', zIndex: 1 }}>
																		{renderVisualizer(null, 'speaking', 'md', brandColor)}
																	</div>
																</Box>
															</Box>
														</Flex>
													</Tabs.Content>

													{currentAgent && (
														<Tabs.Content value="widget">
															<Flex direction="column" gap="5" p="2">
																<Box>
																	<Flex align="center" gap="2" mb="2">
																		<Box style={{ backgroundColor: '#fffbeb', padding: '6px', borderRadius: '6px', color: '#92400e' }}>
																			<Globe size={18} />
																		</Box>
																		<Heading size="3" style={{ color: '#b45309', fontWeight: 800 }}>Embed on Your Website</Heading>
																	</Flex>
																	<Text size="2" style={{ color: '#111827' }}>Copy the snippet below and paste it into any HTML page. A floating voice button will appear for your visitors to start real-time conversations with this agent.</Text>
																</Box>

																<Box style={{ backgroundColor: '#111827', borderRadius: '12px', padding: '20px', position: 'relative', border: '1px solid #111827' }}>
																	<Box style={{ position: 'absolute', top: '12px', right: '12px' }}>
																		<Button
																			variant="soft"
																			size="1"
																			style={{ backgroundColor: 'rgba(240, 173, 68, 0.22)', color: '#fbbf24' }}
																			onClick={() => {
																				const vizType = currentAgent?.config?.visualizer_type === 'bars' ? 'bars' : 'orb';
																				const color = currentAgent?.config?.brand_color || brandColor;
																				const isChat = currentAgent?.config?.chat_only;
																				const snippet = isChat
																					? `<!-- phosai Chat Agent Widget -->\n<script src="https://cdn.phosai.ai/chat-embed.js"><\/script>\n<phosai-chat-agent\n    agent-id="${currentAgent?.id || ''}"\n    accent-color="${color}"\n    api-url="${API_BASE}"\n    position="bottom-right"\n><\/phosai-chat-agent>`
																					: `<!-- phosai Voice Agent Widget -->\n<script src="https://cdn.phosai.ai/voice-embed.js"><\/script>\n<phosai-voice-agent\n    agent-id="${currentAgent?.id || ''}"\n    accent-color="${color}"\n    visualizer="${vizType}"\n    api-url="${API_BASE}"\n    position="bottom-right"\n><\/phosai-voice-agent>`;
																				navigator.clipboard.writeText(snippet);
																				showToast('Copied!', 'Embed code copied to clipboard.');
																			}}
																		>
																			<Copy size={12} /> Copy Code
																		</Button>
																	</Box>
																	<pre style={{ margin: 0, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: '13px', lineHeight: '1.7', color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-all', paddingRight: '80px' }}>
																		{currentAgent?.config?.chat_only ? `<!-- phosai Chat Agent Widget -->
<script src="https://cdn.phosai.ai/chat-embed.js"></script>
<phosai-chat-agent
    agent-id="${currentAgent?.id || ''}"
    accent-color="${currentAgent?.config?.brand_color || brandColor}"
    api-url="${API_BASE}"
    position="bottom-right"
></phosai-chat-agent>` : `<!-- phosai Voice Agent Widget -->
<script src="https://cdn.phosai.ai/voice-embed.js"></script>
<phosai-voice-agent
    agent-id="${currentAgent?.id || ''}"
    accent-color="${currentAgent?.config?.brand_color || brandColor}"
    visualizer="${currentAgent?.config?.visualizer_type === 'bars' ? 'bars' : 'orb'}"
    api-url="${API_BASE}"
    position="bottom-right"
></phosai-voice-agent>`}
																	</pre>
																</Box>

																<Grid columns="2" gap="4">
																	<Card size="2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
																		<Flex direction="column" gap="2">
																			<Text size="1" weight="bold" style={{ color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Agent Name</Text>
																			<Text size="3" weight="bold" style={{ color: '#111827' }}>{currentAgent?.name || agentName}</Text>
																		</Flex>
																	</Card>
																	<Card size="2" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
																		<Flex direction="column" gap="2">
																			<Text size="1" weight="bold" style={{ color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visualizer</Text>
																			<Flex align="center" gap="2">
																				<Box style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: currentAgent?.config?.brand_color || brandColor }} />
																				<Text size="3" weight="bold" style={{ color: '#111827' }}>{currentAgent?.config?.visualizer_type === 'bars' ? 'Bars' : 'Orb'}</Text>
																			</Flex>
																		</Flex>
																	</Card>
																</Grid>

																<Box style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
																	<Flex gap="3" align="start">
																		<Box style={{ color: '#2563eb', marginTop: '2px' }}><Bot size={18} /></Box>
																		<Box>
																			<Text size="2" weight="bold" style={{ color: '#1d4ed8', display: 'block' }}>How it works</Text>
																			<Text size="1" style={{ color: '#3b82f6', display: 'block', marginTop: '4px', lineHeight: '1.6' }}>
																				Paste the embed code into any HTML page. A floating microphone button will appear, and visitors can start a real-time voice conversation with your AI agent. The widget loads your agent's personality, voice, and workflow configuration automatically.
																			</Text>
																		</Box>
																	</Flex>
																</Box>
															</Flex>
														</Tabs.Content>
													)}
												</Box>
											</Tabs.Root>
										)}
									</Box>
								</Box>
							</Flex>
						</Box>
					)}

					<Toast.Root className="ToastRoot" open={toastOpen} onOpenChange={setToastOpen} duration={3000}>
						<Toast.Title className="ToastTitle">{toastContent.title}</Toast.Title>
						<Toast.Description className="ToastDescription">
							{toastContent.description}
						</Toast.Description>
						<Toast.Action asChild altText="Close">
							<button className="ToastClose" onClick={() => setToastOpen(false)}>
								<X size={14} />
							</button>
						</Toast.Action>
					</Toast.Root>
					<Toast.Viewport className="ToastViewport" />

					{/* Transcript Detail Side Panel */}
					<>
						<div
							onClick={() => setIsTranscriptModalOpen(false)}
							style={{
								position: 'fixed',
								inset: 0,
								backgroundColor: 'rgba(0, 0, 0, 0.4)',
								zIndex: 60,
								opacity: isTranscriptModalOpen ? 1 : 0,
								pointerEvents: isTranscriptModalOpen ? 'auto' : 'none',
								transition: 'opacity 0.3s ease-out'
							}}
						/>
						<div
							style={{
								position: 'fixed',
								right: 0,
								top: 0,
								bottom: 0,
								width: '600px',
								maxWidth: '95vw',
								backgroundColor: '#ffffff',
								zIndex: 61,
								display: 'flex',
								flexDirection: 'column',
								boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
								transform: isTranscriptModalOpen ? 'translateX(0)' : 'translateX(100%)',
								transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0, backgroundColor: '#ffffff' }}>
								<div style={{ flex: 1 }}>
									<Text size="3" weight="bold" style={{ color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
										{selectedLogForTranscript?.summary ? 'Conversation Detail' : 'Session Transcript'}
										<ExternalLink size={14} style={{ color: '#94a3b8' }} />
									</Text>
									<Text size="1" style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>
										{selectedLogForTranscript?.agent_name} • {selectedLogForTranscript?.created_at ? new Date(selectedLogForTranscript.created_at).toLocaleString() : ''}
									</Text>
								</div>
								<IconButton variant="ghost" style={{ color: '#111827' }} onClick={() => setIsTranscriptModalOpen(false)}><X size={18} /></IconButton>
							</div>

							<Tabs.Root defaultValue="transcription" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', minHeight: 0, overflow: 'hidden' }}>
								<Box px="4" pt="3" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
									<Tabs.List size="2" color="amber">
<Tabs.Trigger value="transcription" style={{ paddingBottom: '10px' }}>Transcription</Tabs.Trigger>
										<Tabs.Trigger value="details" style={{ paddingBottom: '10px' }}>Details</Tabs.Trigger>
										<Tabs.Trigger value="recording" style={{ paddingBottom: '10px' }}>Recording</Tabs.Trigger>
									</Tabs.List>
								</Box>

								<Tabs.Content value="transcription" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
									{selectedLogForTranscript?.summary && (
										<Box p="4" m="4" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
											<Flex direction="column" gap="2">
												<Flex justify="between" align="center" style={{ cursor: 'pointer' }} onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}>
													<Flex align="center" gap="2">
														<div style={{ color: '#f0ad44', display: 'flex', alignItems: 'center' }}><Brain size={16} /></div>
														<Text size="1" weight="bold" style={{ color: '#211d1e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Summary</Text>
													</Flex>
													<div style={{ color: '#94a3b8', transform: isSummaryExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease-in-out' }}>
														<svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
													</div>
												</Flex>
												{isSummaryExpanded && (
													<Text size="2" style={{ color: '#334155', display: 'block', marginTop: '4px', lineHeight: '1.5' }}>
														{selectedLogForTranscript.summary}
													</Text>
												)}
											</Flex>
										</Box>
									)}

									<div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', padding: '0 16px 16px' }}>
										{selectedLogForTranscript?.transcripts && selectedLogForTranscript.transcripts.length > 0 ? (
											<AgentChatTranscript messages={transformTranscripts(selectedLogForTranscript.transcripts)} agentState="idle" />
										) : (
											<Flex direction="column" align="center" justify="center" style={{ height: '100%', opacity: 0.5 }}>
												<MessageSquareOff size={48} color="#111827" style={{ marginBottom: '16px' }} />
												<Text size="2" weight="bold" style={{ color: '#111827' }}>No Transcripts Available</Text>
												<Text size="1" style={{ color: '#111827' }}>This session data is missing conversation detail.</Text>
											</Flex>
										)}
									</div>
								</Tabs.Content>

<Tabs.Content value="details" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
									<Text size="2" style={{ color: '#64748b' }}>Technical details and performance metrics will appear here.</Text>
								</Tabs.Content>

								<Tabs.Content value="recording" style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
									{selectedLogForTranscript && recordings.filter((r: any) => r.agent_id === selectedLogForTranscript.agent_id && (r.created_at && selectedLogForTranscript.created_at && new Date(r.created_at).getTime() <= new Date(selectedLogForTranscript.created_at).getTime() + 120_000 && new Date(r.created_at).getTime() >= new Date(selectedLogForTranscript.created_at).getTime() - 300_000)).length > 0 ? (
										<Flex direction="column" gap="4">
											{recordings
												.filter((r: any) => r.agent_id === selectedLogForTranscript.agent_id && (r.created_at && selectedLogForTranscript.created_at && new Date(r.created_at).getTime() <= new Date(selectedLogForTranscript.created_at).getTime() + 120_000 && new Date(r.created_at).getTime() >= new Date(selectedLogForTranscript.created_at).getTime() - 300_000))
												.map((rec: any) => (
													<Flex key={rec.id || rec.recording_id} direction="column" gap="3" style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
														<Flex align="center" justify="between">
															<Flex align="center" gap="2">
																<Headphones size={16} style={{ color: '#f0ad44' }} />
																<Text size="2" weight="bold" style={{ color: '#111827' }}>
																	Call Recording
																</Text>
																{rec.duration_seconds ? (
																	<Badge color="amber" variant="soft" size="1">
																		{Math.floor(rec.duration_seconds / 60)}:{String(Math.round(rec.duration_seconds % 60)).padStart(2, '0')}
																	</Badge>
																) : null}
																{rec.status === 'completed' ? (
																	<Badge color="green" variant="soft" size="1">Ready</Badge>
																) : rec.status === 'failed' ? (
																	<Badge color="red" variant="soft" size="1">Failed</Badge>
																) : (
																	<Badge color="yellow" variant="soft" size="1">{rec.status || 'pending'}</Badge>
																)}
															</Flex>
														</Flex>
														{(rec.status === 'completed' || rec.status === 'processed') ? (
															<Box>
																<audio
																	src={rec.download_url || ''}
																	controls
																	style={{ width: '100%', height: '40px', borderRadius: '8px' }}
																	preload="metadata"
																/>
																{!rec.download_url && (
																	<Button
																		size="1"
																		variant="outline"
																		onClick={async () => {
																			try {
																				const res = await axios.get(`${API_BASE}/agents/${selectedLogForTranscript.agent_id}/recordings/${rec.id || rec.recording_id}/download-url`);
																				rec.download_url = res.data.download_url;
																				const audioEl = document.querySelector(`audio[src="${rec.download_url}"]`) as HTMLAudioElement;
																				if (audioEl) audioEl.src = res.data.download_url;
																			} catch (err) { console.error('Failed to get download url', err); }
																		}}
																		style={{ marginTop: '6px' }}
																	>
																		<RefreshCw size={12} /> Load Audio
																	</Button>
																)}
															</Box>
														) : rec.status === 'failed' ? (
															<Text size="1" style={{ color: '#dc2626' }}>Recording failed — file may not have uploaded to storage.</Text>
														) : (
															<Flex align="center" gap="2">
																<RefreshCw size={14} className="animate-spin" style={{ color: '#94a3b8' }} />
																<Text size="1" style={{ color: '#64748b' }}>Recording is processing...</Text>
															</Flex>
														)}
													</Flex>
												))
											}
										</Flex>
									) : (
										<Flex direction="column" align="center" justify="center" style={{ height: '200px', opacity: 0.5 }}>
											<Headphones size={40} color="#111827" style={{ marginBottom: '12px' }} />
											<Text size="2" weight="bold" style={{ color: '#111827' }}>No Recording Available</Text>
											<Text size="1" style={{ color: '#64748b', marginTop: '4px' }}>This session did not have a voice recording attached.</Text>
										</Flex>
									)}
								</Tabs.Content>
							</Tabs.Root>
						</div>
					</>
				</Box>
			</Box>
		</Toast.Provider>
	);
}
