import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import * as LiveKitSDK from 'livekit-client';
import { Activity, BarChart, Bell, Book, Bot, Brain, Briefcase, Building2, Calendar, Car, Check, CheckCircle, CheckSquare, ChevronLeft, ChevronRight, Code, Copy, Eye, EyeOff, ExternalLink, Globe, GraduationCap, Hammer, Headphones, HeartHandshake, History, Key, LogOut, Menu, MessageSquare, MessageSquareOff, Mic, Music, Palette, Phone, PhoneOff, Plane, Plus, RefreshCw, Save, Scale, Search, Settings, ShoppingCart, SlidersHorizontal, Stethoscope, Trash2, Truck, Undo, User, UserCheck, UtensilsCrossed, Volume2, Workflow, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GmailIcon from '../assets/gmail.svg';
import GoogleCalendarIcon from '../assets/googlecalendar.svg';
import GoogleSheetsIcon from '../assets/googlesheets.svg';
import phosaiLogo from '../assets/phosai_logo.png';

import { Flex, Text, Button, Box, Grid, Card, Badge, Tabs, TextField, TextArea, Switch, Select, Slider, Heading, Separator, Tooltip, Table, Dialog, IconButton, SegmentedControl, AlertDialog, VisuallyHidden } from '@radix-ui/themes';
import { AgentAudioVisualizerBar } from '../components/agents-ui/agent-audio-visualizer-bar';
import { AgentAudioVisualizerGrid } from '../components/agents-ui/agent-audio-visualizer-grid';
import { AgentAudioVisualizerRadial } from '../components/agents-ui/agent-audio-visualizer-radial';
import { AgentAudioVisualizerWave } from '../components/agents-ui/agent-audio-visualizer-wave';
import { AgentAudioVisualizerAura } from '../components/agents-ui/agent-audio-visualizer-aura';
import { AgentWorkflowBuilder } from '../AgentWorkflowBuilder';
import { KnowledgeBaseManager } from '../components/KnowledgeBaseManager';
import { AgentChatTranscript } from '../components/agents-ui/agent-chat-transcript';
import { AgentChatIndicator } from '../components/agents-ui/agent-chat-indicator';
import * as Toast from '@radix-ui/react-toast';

const API_BASE = 'http://localhost:8000';

// Add axios interceptor to include Firebase token
axios.interceptors.request.use(async (config) => {
	const token = await localStorage.getItem('firebase_token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

type ProviderConfig = {
	features: string[];
	models?: any[];
	voice_options?: any[];
	config_fields?: any[];
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
	const [activeView, setActiveView] = useState<'dashboard' | 'builder' | 'knowledge' | 'workflows' | 'logs'>('dashboard');
	const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
	const [isBuilderOpen, setIsBuilderOpen] = useState(false);
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

	// Logs state
	const [logs, setLogs] = useState<any[]>([]);
	const [isLoadingLogs, setIsLoadingLogs] = useState(false);
	const [logSearch, setLogSearch] = useState('');
	const [logAgentFilter, setLogAgentFilter] = useState('all');
	const [logStatusFilter, setLogStatusFilter] = useState('all');
	const [logTypeFilter, setLogTypeFilter] = useState('all');
	const [logPage, setLogPage] = useState(1);
	const [selectedLogForTranscript, setSelectedLogForTranscript] = useState<any>(null);
	const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
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
	const transformTranscripts = (transcripts: any[]) => {
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
						audioTrack={audioTrack}
						state={visualizerState}
						size={size}
						color={color}
						rowCount={15}
						columnCount={15}
						interval={100}
						radius={3}
					/>
				);
			case 'radial':
				return (
					<AgentAudioVisualizerRadial
						audioTrack={audioTrack}
						state={visualizerState}
						size={size}
						color={color}
						barCount={12}
					/>
				);
			case 'wave':
				return (
					<AgentAudioVisualizerWave
						audioTrack={audioTrack}
						state={visualizerState}
						size={size}
						color={color}
						lineWidth={2}
						blur={0.1}
						colorShift={0.3}
					/>
				);
			case 'aura':
				return (
					<AgentAudioVisualizerAura
						audioTrack={audioTrack}
						state={visualizerState}
						size={size}
						color={color}
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
						size={size}
						color={color}
						barCount={5}
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
	const [googleScopes, setGoogleScopes] = useState<string[]>([]);
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
			if (canOpenModal) setIsBuilderOpen(true);
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
				setIsBuilderOpen(true);
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
			setIsBuilderOpen(false);
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
				setIsBuilderOpen(false);
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
				if (currentAgent?.name) {
					await axios.post(`${API_BASE}/agents/${currentAgent.name}/stop`);
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

			const tokenResponse = await axios.get(`${API_BASE}/livekit/token?agent_name=${targetAgent.name}`);
			const { token, url } = tokenResponse.data;

			try {
				await axios.post(`${API_BASE}/agents/${targetAgent.name}/start`);
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

			room.on(LiveKitSDK.RoomEvent.Connected, () => {
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
						await axios.post(`${API_BASE}/agents/${targetAgent.name}/transcripts`, {
							session_id: `voice-session-${Date.now()}`,
							conversation_type: 'voice',
							transcripts: transcriptsRef.current,
							summary: summaryRes.data.summary
						});

						// 3. Refresh logs
						loadLogs();
					} catch (err) {
						console.error('Failed to summarize or save session', err);
						// Fallback save without summary
						axios.post(`${API_BASE}/agents/${targetAgent.name}/transcripts`, {
							session_id: `voice-session-${Date.now()}`,
							conversation_type: 'voice',
							transcripts: transcriptsRef.current
						}).catch(console.error);
					}
				}
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

		if (isChatActive) {
			chatRoomRef.current?.disconnect();
			try {
				await axios.post(`${API_BASE}/agents/${targetAgent.name}/stop`);
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
			const tokenResponse = await axios.get(`${API_BASE}/livekit/token?agent_name=${targetAgent.name}`);
			const { token, url } = tokenResponse.data;

			try {
				await axios.post(`${API_BASE}/agents/${targetAgent.name}/start`);
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
					axios.post(`${API_BASE}/agents/${targetAgent.name}/transcripts`, {
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
			`}</style>
				{/* Sidebar - Desktop */}
				<Box display={{ initial: 'none', lg: 'block' }} style={{ flexShrink: 0 }}>
					<Flex direction="column" style={{
						width: '240px',
						backgroundColor: '#ffffff',
						borderRight: '1px solid #e5e7eb',
						padding: '24px 0',
						height: '100vh'
					}}>
						<Box style={{ padding: '0 20px 24px', borderBottom: '1px solid #e5e7eb' }}>
							<Flex align="center" gap="3">
								<img src={phosaiLogo} alt="" width={40} height={40} style={{ objectFit: 'contain', flexShrink: 0 }} />
								<Text style={{ fontWeight: 800, fontSize: 13, letterSpacing: '0.08em', color: '#111827' }}>PHOSAI STUDIO</Text>
							</Flex>
						</Box>

						<Box style={{ flexGrow: 1, padding: '16px 12px', overflowY: 'auto' }}>
							{[
								{ id: 'dashboard', label: 'Dashboard', icon: <SlidersHorizontal size={18} /> },
								{ id: 'builder', label: 'Agents', icon: <Bot size={18} /> },
								{ id: 'workflows', label: 'Workflows', icon: <Workflow size={18} /> },
								{ id: 'knowledge', label: 'Knowledge Base', icon: <Book size={18} /> },
								{ id: 'logs', label: 'Conversation History', icon: <History size={18} /> }
							].map(item => (
								<Box
									key={item.id}
									onClick={() => setActiveView(item.id as any)}
									style={{
										display: 'flex', alignItems: 'center', gap: '12px',
										padding: '10px 12px', borderRadius: 'var(--radius-1)', marginBottom: '4px',
										backgroundColor: activeView === item.id ? '#fffbeb' : 'transparent',
										color: activeView === item.id ? '#92400e' : '#111827',
										fontWeight: activeView === item.id ? 600 : 400,
										fontSize: '14px', cursor: 'pointer',
										transition: 'all 0.2s'
									}}
								>
									{item.icon}
									{item.label}
								</Box>
							))}

						</Box>

						<Box style={{ padding: '12px 16px 20px', borderTop: '1px solid #e5e7eb', marginTop: 'auto', backgroundColor: '#fafafa' }}>
							{user ? (
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
											<Text size="2" weight="bold" as="div" style={{ lineHeight: 1.25, color: '#111827' }}>{profileDisplayName}</Text>
											{profileEmail ? (
												<Text size="1" style={{ color: '#111827', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px', fontWeight: 500 }} title={profileEmail}>{profileEmail}</Text>
											) : null}
										</Box>
									</Flex>
										<Button variant="soft" color="amber" size="2" style={{ width: '100%', justifyContent: 'center', fontWeight: 600 }} onClick={() => { void signOut(); }}>
										<LogOut size={16} style={{ marginRight: '6px' }} /> Sign out
									</Button>
								</Flex>
							) : (
								<Flex direction="column" gap="2">
									<Text size="1" weight="medium" style={{ color: '#111827' }}>Sign in to sync your workspace.</Text>
									<Flex gap="2">
										<Button variant="ghost" size="2" style={{ flex: 1 }} onClick={() => window.location.href = '/'}>Sign in</Button>
										<Button size="2" style={{ flex: 1, backgroundColor: '#f0ad44', color: '#211d1e' }} onClick={() => window.location.href = '/'}>Sign up</Button>
									</Flex>
								</Flex>
							)}
						</Box>
					</Flex>
				</Box>

				{/* Sidebar - Mobile Overlay */}
				{showMobileMenu && (
					<Box style={{
						position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)',
						display: 'flex'
					}} onClick={() => setShowMobileMenu(false)}>
						<Box style={{
							width: '280px', height: '100%', backgroundColor: '#ffffff',
							display: 'flex', flexDirection: 'column'
						}} onClick={e => e.stopPropagation()}>
							<Box style={{ padding: '24px 20px 24px', borderBottom: '1px solid #e5e7eb' }}>
								<Flex align="center" justify="between">
									<Flex align="center" gap="3">
										<img src={phosaiLogo} alt="" width={36} height={36} style={{ objectFit: 'contain', flexShrink: 0 }} />
										<Text style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.08em', color: '#111827' }}>PHOSAI STUDIO</Text>
									</Flex>
									<Button variant="ghost" onClick={() => setShowMobileMenu(false)}><X size={20} /></Button>
								</Flex>
							</Box>

							<Box style={{ flexGrow: 1, padding: '16px 12px', overflowY: 'auto' }}>
								{[
									{ id: 'dashboard', label: 'Dashboard', icon: <SlidersHorizontal size={18} /> },
									{ id: 'builder', label: 'Agents', icon: <Bot size={18} /> },
									{ id: 'workflows', label: 'Workflows', icon: <Workflow size={18} /> },
									{ id: 'knowledge', label: 'Knowledge Base', icon: <Book size={18} /> },
									{ id: 'logs', label: 'Conversation History', icon: <History size={18} /> }
								].map(item => (
									<Box
										key={item.id}
										onClick={() => { setActiveView(item.id as any); setShowMobileMenu(false); }}
										style={{
											display: 'flex', alignItems: 'center', gap: '12px',
											padding: '12px', borderRadius: 'var(--radius-1)', marginBottom: '4px',
											backgroundColor: activeView === item.id ? '#fffbeb' : 'transparent',
											color: activeView === item.id ? '#92400e' : '#111827',
											fontWeight: activeView === item.id ? 600 : 400,
											fontSize: '14px', cursor: 'pointer'
										}}
									>
										{item.icon}
										{item.label}
									</Box>
								))}
							</Box>
							<Box style={{ padding: '12px 16px 20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
								{user ? (
									<Flex direction="column" gap="3">
										<Flex align="center" gap="3">
											{profilePhotoUrl ? (
												<img src={profilePhotoUrl} alt="" width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #fcd34d' }} />
											) : (
												<Box style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0ad44', color: '#211d1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
													{profileInitials}
												</Box>
											)}
											<Box style={{ minWidth: 0, flex: 1 }}>
												<Text size="2" weight="bold" as="div" style={{ lineHeight: 1.25, color: '#111827' }}>{profileDisplayName}</Text>
												{profileEmail ? (
													<Text size="1" style={{ color: '#111827', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px', fontWeight: 500 }} title={profileEmail}>{profileEmail}</Text>
												) : null}
											</Box>
										</Flex>
										<Button variant="soft" color="amber" size="2" style={{ width: '100%', justifyContent: 'center', fontWeight: 600 }} onClick={() => { void signOut(); setShowMobileMenu(false); }}>
											<LogOut size={16} style={{ marginRight: '6px' }} /> Sign out
										</Button>
									</Flex>
								) : (
									<Flex direction="column" gap="2">
										<Text size="1" weight="medium" style={{ color: '#111827' }}>Sign in to sync your workspace.</Text>
										<Flex gap="2">
											<Button variant="ghost" size="2" style={{ flex: 1 }} onClick={() => window.location.href = '/'}>Sign in</Button>
											<Button size="2" style={{ flex: 1, backgroundColor: '#f0ad44', color: '#211d1e' }} onClick={() => window.location.href = '/'}>Sign up</Button>
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
						padding: '18px 24px',
						backgroundColor: '#ffffff',
						borderBottom: '1px solid #e5e7eb',
						display: 'flex', alignItems: 'center', justifyContent: 'space-between',
						position: 'sticky', top: 0, zIndex: 10
					}}>
						<Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
							<Box display={{ initial: 'block', lg: 'none' }}>
								<Button variant="ghost" onClick={() => setShowMobileMenu(true)}><Menu size={20} /></Button>
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
										<Heading size="5" style={{ margin: 0, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
											{activeView === 'dashboard' ? 'Overview' : activeView === 'knowledge' ? 'Knowledge Management' : activeView === 'workflows' ? 'Workflow Designer' : activeView === 'logs' ? 'Conversation History' : 'Agent Builder'}
										</Heading>
										<Box display={{ initial: 'none', sm: 'block' }}>
											<Text size="1" style={{ color: '#111827', marginTop: '2px', fontWeight: 500 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} — {user ? `Welcome back, ${profileDisplayName}.` : 'Welcome back.'}</Text>
										</Box>
									</>
								)}
							</Box>
						</Box>
						<Flex align="center" gap="4">
							<Box display={{ initial: 'none', md: 'block' }}>
								<Flex align="center" gap="2">
									<Text size="1" style={{ color: '#111827' }}>Status</Text>
									<Badge color={connectionStatus === 'connected' ? 'amber' : 'gray'} variant="soft">
										{connectionStatus === 'connected' ? 'Online' : 'Offline'}
									</Badge>
								</Flex>
							</Box>
							<Box display={{ initial: 'none', md: 'block' }}>
								<Separator orientation="vertical" style={{ height: '24px', backgroundColor: '#e5e7eb' }} />
							</Box>
							{!user ? (
								<Flex gap="2">
									<Button variant="ghost" size="2" onClick={() => window.location.href = '/'}>Sign In</Button>
									<Button size="2" style={{ backgroundColor: '#f0ad44', color: '#211d1e' }} onClick={() => window.location.href = '/'}>Sign Up</Button>
								</Flex>
							) : null}

							{activeView === 'workflows' ? (
								<Flex gap="3" align="center" wrap="wrap" justify={{ initial: 'start', sm: 'end' }}>
									{editingWorkflowId && <Button variant="ghost" style={{ color: '#111827' }} onClick={() => setEditingWorkflowId(null)} size="2"><LogOut size={16} /> Exit Designer</Button>}
									<Button variant="soft" color="amber" onClick={() => loadWorkflowsList()} size="2"><RefreshCw size={16} /> Reload</Button>
									{editingWorkflowId && (
										<Button variant="solid" style={{ backgroundColor: '#f0ad44', color: '#211d1e' }} onClick={async () => {
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
										}} size="2" style={{ paddingLeft: '16px', paddingRight: '16px' }}><Save size={16} /> Save Workflow</Button>
									)}
								</Flex>
							) : (
								<Flex align="center" gap="4">
									<Search size={18} color="#111827" style={{ cursor: 'pointer' }} />
									<Bell size={18} color="#111827" style={{ cursor: 'pointer' }} />
								</Flex>
							)}
						</Flex>
					</header>

					<Box p={{ initial: "4", md: "6", lg: "8" }}>
						{activeView === 'dashboard' ? (
							<Flex direction="column" gap="6">
								{/* Metrics */}
								<Grid columns={{ initial: '1', sm: '2', lg: '4' }} gap="4">
									{[
										{ label: 'Total Agents', value: agentsList.length, change: '+0 this week', up: true },
										{ label: 'Active Sessions', value: '0', change: 'Live', up: true },
										{ label: 'Latency (Avg)', value: '1.2s', change: '-10%', up: false },
										{ label: 'Success Rate', value: '100%', change: 'Steady', up: true }
									].map((metric, i) => (
										<Card key={i} size="2" style={{ borderRadius: 'var(--radius-2)', border: '1px solid #e5e7eb', padding: '16px', backgroundColor: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
											<Flex direction="column" gap="1">
												<Text size="2" style={{ color: '#111827', fontWeight: 600 }}>{metric.label}</Text>
												<Heading size="6" weight="bold" style={{ color: '#111827' }}>{metric.value}</Heading>
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
								<Grid columns={{ initial: '1', lg: '1fr 340px' }} gap="4">
									<Box style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
										<Heading size="4" mb="1" style={{ color: '#111827', fontWeight: 800 }}>Performance Overview</Heading>
										<Text size="1" style={{ color: '#111827', marginBottom: '20px', display: 'block', fontWeight: 500 }}>Last 7 days success metrics</Text>
										<Flex align="end" gap="2" style={{ height: '120px' }}>
											{[55, 72, 61, 88, 76, 95, 82].map((h, index) => (
												<Box key={index} style={{ flexGrow: 1, backgroundColor: index === 5 ? '#f0ad44' : '#f3f4f6', height: `${h}%`, borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
											))}
										</Flex>
									</Box>

									<Box style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
										<Heading size="4" mb="4" style={{ color: '#111827', fontWeight: 700 }}>System Usage</Heading>
										<Flex direction="column" gap="4">
											{[
												{ label: 'API Bandwidth', value: 62, color: '#f0ad44' },
												{ label: 'Token Utilization', value: 48, color: '#d97706' },
												{ label: 'Concurrency', value: 35, color: '#fcd34d' }
											].map(item => (
												<Box key={item.label}>
													<Flex justify="between" mb="1" style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
														<Text style={{ color: '#111827' }}>{item.label}</Text>
														<Text style={{ color: '#111827' }}>{item.value}%</Text>
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
												<Button variant="solid" size="2" style={{ backgroundColor: '#f0ad44', color: '#211d1e' }} onClick={() => {
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
														<Table.ColumnHeaderCell>WORKFLOW NAME</Table.ColumnHeaderCell>
														<Table.ColumnHeaderCell>WORKFLOW ID</Table.ColumnHeaderCell>
														<Table.ColumnHeaderCell>NODES</Table.ColumnHeaderCell>
														<Table.ColumnHeaderCell>CREATED</Table.ColumnHeaderCell>
														<Table.ColumnHeaderCell justify="center">ACTIONS</Table.ColumnHeaderCell>
													</Table.Row>
												</Table.Header>
												<Table.Body>
													{paginatedWorkflows.map((wf) => (
														<Table.Row key={wf.id} align="center">
															<Table.Cell>
																<Flex align="center" gap="3">
																	<Box style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-1)', backgroundColor: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
																		<Workflow size={18} color="#a21caf" />
																	</Box>
																	<Box>
																		<Text size="2" weight="bold" style={{ display: 'block', color: '#111827' }}>{wf.name}</Text>
																		<Text size="1" weight="medium" style={{ color: '#111827', display: 'block', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wf.description || 'No description'}</Text>
																	</Box>
																</Flex>
															</Table.Cell>
															<Table.Cell>
																<Tooltip content={wf.id}>
																	<Text size="1" style={{ color: '#111827', fontFamily: 'monospace', fontWeight: 500, backgroundColor: '#f8fafc', padding: '2px 6px', borderRadius: '4px', cursor: 'help' }}>
																		{wf.id.substring(0, 8)}...
																	</Text>
																</Tooltip>
															</Table.Cell>
															<Table.Cell>
																<Badge color="purple" variant="soft" radius="full">
																	{(wf.nodes as any)?.length || 0} States
																</Badge>
															</Table.Cell>
															<Table.Cell><Text size="2" style={{ color: '#111827' }}>{new Date(wf.created_at).toLocaleDateString()}</Text></Table.Cell>
															<Table.Cell>
																<Flex gap="2" justify="center" align="center">
																	<Button variant="soft" color="amber" size="1" onClick={() => {
																		setWorkflowsPayload({ nodes: wf.nodes, edges: wf.edges });
																		setWorkflowName(wf.name);
																		setEditingWorkflowId(wf.id);
																	}}><ExternalLink size={14} /> Open Designer</Button>

																	<AlertDialog.Root>
																		<AlertDialog.Trigger>
																			<Button variant="ghost" color="red" size="1"><Trash2 size={14} /></Button>
																		</AlertDialog.Trigger>
																		<AlertDialog.Content maxWidth="450px" style={{ border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)' }}>
																			<AlertDialog.Title style={{ color: '#111827', fontWeight: 800 }}>Delete Workflow</AlertDialog.Title>
																			<AlertDialog.Description size="2" style={{ color: '#111827' }}>
																				Are you sure you want to delete the workflow <b>{wf.name}</b>? This action cannot be undone and any agents using this workflow will lose their logic.
																			</AlertDialog.Description>
																			<Flex gap="3" mt="4" justify="end" align="center">
																				<AlertDialog.Cancel>
																					<Button variant="soft" color="amber"><X size={16} /> Cancel</Button>
																				</AlertDialog.Cancel>
																				<AlertDialog.Action>
																					<Button variant="solid" color="red" onClick={async () => {
																						await axios.delete(`${API_BASE}/workflows/${wf.id}`);
																						loadWorkflowsList();
																						showToast("Workflow Deleted", "The workflow has been removed.");
																					}}><Trash2 size={16} /> Delete Workflow</Button>
																				</AlertDialog.Action>
																			</Flex>
																		</AlertDialog.Content>
																	</AlertDialog.Root>
																</Flex>
															</Table.Cell>
														</Table.Row>
													))}
													{workflowsList.length === 0 && (
														<Table.Row><Table.Cell colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#111827' }}>No workflows found. Design your first logic graph.</Table.Cell></Table.Row>
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
							<Card size="2" style={{ borderRadius: 'var(--radius-2)', backgroundColor: 'white', border: '1px solid #e8e5e0', padding: '24px' }}>
								{/* Header */}
								<Flex direction={{ initial: 'column', md: 'row' }} justify="between" align={{ initial: 'stretch', md: 'center' }} gap="4" mb="5">
									<Box>
										<Heading size={{ initial: '3', md: '4' }} mb="1" style={{ color: '#111827', fontWeight: 800 }}>Conversation History</Heading>
										<Text size="2" style={{ color: '#111827', fontWeight: 500 }}>{filteredLogs.length} session{filteredLogs.length !== 1 ? 's' : ''} recorded</Text>
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
										<Button variant="soft" color="amber" size="2" onClick={loadLogs} loading={isLoadingLogs}>
											<RefreshCw size={14} /> Refresh
										</Button>
									</Flex>
								</Flex>

								{/* Table */}
								<Box style={{ overflowX: 'auto' }}>
									<Table.Root variant="ghost" size="1">
										<Table.Header>
											<Table.Row>
												<Table.ColumnHeaderCell>SESSION</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell>AGENT</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell>TYPE</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell>MESSAGES</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell>TIME</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell>SUMMARY</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell>STATUS</Table.ColumnHeaderCell>
												<Table.ColumnHeaderCell justify="center">ACTIONS</Table.ColumnHeaderCell>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{isLoadingLogs ? (
												<Table.Row>
													<Table.Cell colSpan={6} style={{ textAlign: 'center', padding: '48px' }}>
														<Flex justify="center" align="center" gap="2"><RefreshCw size={18} className="animate-spin" color="#111827" /><Text size="2" style={{ color: '#111827' }}>Loading history...</Text></Flex>
													</Table.Cell>
												</Table.Row>
											) : paginatedLogs.length === 0 ? (
												<Table.Row>
													<Table.Cell colSpan={6} style={{ textAlign: 'center', padding: '64px' }}>
														<Flex direction="column" align="center" gap="2">
															<History size={32} color="#111827" />
															<Text size="2" weight="bold" style={{ color: '#111827' }}>No history found</Text>
															<Text size="1" style={{ color: '#111827' }}>Sessions will appear here after interactions complete.</Text>
														</Flex>
													</Table.Cell>
												</Table.Row>
											) : paginatedLogs.map(log => (
												<Table.Row key={log.id} align="center">
													{/* Session ID */}
													<Table.Cell>
														<Tooltip content={log.session_id}>
															<Text size="1" style={{ color: '#111827', fontFamily: 'monospace', backgroundColor: '#f8fafc', padding: '2px 6px', borderRadius: '4px', cursor: 'help' }}>
																{log.session_id?.substring(0, 12)}...
															</Text>
														</Tooltip>
													</Table.Cell>
													{/* Agent */}
													<Table.Cell>
														<Flex align="center" gap="2">
															<Box style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
																<Bot size={14} color="#111827" />
															</Box>
															<Text size="2" weight="medium" style={{ color: '#111827' }}>{log.agent_name}</Text>
														</Flex>
													</Table.Cell>
													{/* Type */}
													<Table.Cell>
														<Flex align="center" gap="2">
															<Badge color={log.agent_type === 'workflow' ? 'purple' : 'blue'} variant="soft" radius="full">
																{log.agent_type === 'workflow' ? 'WORKFLOW' : 'GENERAL'}
															</Badge>
															<Badge color={log.conversation_type === 'chat' ? 'blue' : 'amber'} variant="soft" radius="full">
																{log.conversation_type === 'chat' ? <MessageSquare size={10} style={{ marginRight: '3px' }} /> : <Mic size={10} style={{ marginRight: '3px' }} />}
																{log.conversation_type === 'chat' ? 'CHAT' : 'VOICE'}
															</Badge>
														</Flex>
													</Table.Cell>
													{/* Messages */}
													<Table.Cell>
														<Flex direction="column" gap="1">
															<Text size="2" style={{ color: '#111827', fontWeight: 600 }}>{log.message_count} turns</Text>
															<Text size="1" style={{ color: '#111827' }}>{log.user_turn_count}u / {log.agent_turn_count}a</Text>
														</Flex>
													</Table.Cell>
													{/* Time */}
													<Table.Cell>
														<Flex direction="column" gap="1">
															<Text size="2" style={{ color: '#111827' }}>{log.created_at ? new Date(log.created_at).toLocaleDateString() : '—'}</Text>
															<Text size="1" style={{ color: '#111827' }}>{log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
														</Flex>
													</Table.Cell>
													{/* Summary */}
													<Table.Cell style={{ maxWidth: '200px' }}>
														{log.summary ? (
															<Tooltip content={log.summary}>
																<Text size="1" style={{ color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
																	{log.summary}
																</Text>
															</Tooltip>
														) : (
															<Text size="1" italic style={{ color: '#111827' }}>Pending...</Text>
														)}
													</Table.Cell>
													{/* Status */}
													<Table.Cell>
														<Badge color="amber" variant="soft" radius="full" style={{ fontWeight: 700 }}>
															● COMPLETED
														</Badge>
													</Table.Cell>
													<Table.Cell>
														<Flex justify="center">
															<Button
																size="1"
																variant="soft"
																color="amber"
																onClick={() => {
																	setSelectedLogForTranscript(log);
																	setIsTranscriptModalOpen(true);
																}}
															>
																<ExternalLink size={12} /> View Chat
															</Button>
														</Flex>
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
								<Card size="2" style={{ borderRadius: 'var(--radius-2)', backgroundColor: 'white', border: '1px solid #e8e5e0', padding: '24px' }}>
									<Flex direction={{ initial: 'column', md: 'row' }} justify="between" align={{ initial: 'stretch', md: 'center' }} gap="4" mb="5">
										<Box>
											<Heading size={{ initial: '3', md: '4' }} mb="1" style={{ color: '#111827', fontWeight: 800 }}>AI Agents</Heading>
											<Text size={{ initial: '1', md: '2' }} style={{ color: '#111827', fontWeight: 500 }}>Manage your fleet of deployed voice assistants</Text>
										</Box>
										<Flex gap="3" direction={{ initial: 'column', md: 'row' }} align={{ initial: 'stretch', md: 'center' }}>
											<TextField.Root placeholder="Search agents..." value={agentSearchQuery} onChange={e => setAgentSearchQuery(e.target.value)} size="2">
												<TextField.Slot>
													<Search size={14} />
												</TextField.Slot>
											</TextField.Root>
											<Button variant="solid" size="2" onClick={openNewAgentBuilder} style={{ borderRadius: 'var(--radius-1)', fontWeight: 600, backgroundColor: '#f0ad44', color: '#211d1e' }}>
												<Plus size={14} /> Create New Agent
											</Button>
										</Flex>
									</Flex>

									<Box style={{ overflowX: 'auto' }}>
										<Table.Root variant="ghost" size="1">
											<Table.Header>
												<Table.Row>
													<Table.ColumnHeaderCell>AGENT NAME</Table.ColumnHeaderCell>
													<Table.ColumnHeaderCell>AGENT ID</Table.ColumnHeaderCell>
													<Table.ColumnHeaderCell>CATEGORY</Table.ColumnHeaderCell>
													<Table.ColumnHeaderCell>INDUSTRY</Table.ColumnHeaderCell>
													<Table.ColumnHeaderCell>USE CASE</Table.ColumnHeaderCell>
													<Table.ColumnHeaderCell>MODE</Table.ColumnHeaderCell>
													<Table.ColumnHeaderCell justify="center">ACTIONS</Table.ColumnHeaderCell>
												</Table.Row>
											</Table.Header>

											<Table.Body>
												{paginatedAgents.map((agent) => (
													<Table.Row key={agent.id} align="center" style={{ cursor: 'pointer', backgroundColor: currentAgent?.id === agent.id ? '#fffbeb' : 'transparent', borderLeft: currentAgent?.id === agent.id ? '4px solid #f0ad44' : 'none' }} onClick={() => loadAgent(agent.id, false)}>
														<Table.Cell>
															<Flex align="center" gap="3">
																<Box style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-1)', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
																	<Bot size={20} style={{ color: '#111827' }} />
																</Box>
																<Box>
																	<Text size="2" weight="bold" as="div">{agent.name || agent.config?.name}</Text>
																</Box>
															</Flex>
														</Table.Cell>
														<Table.Cell>
															<Flex align="center" gap="2">
																<Tooltip content={agent.id}>
																	<Text size="1" style={{ color: '#111827', fontFamily: 'monospace', fontWeight: 500, backgroundColor: '#f8fafc', padding: '2px 6px', borderRadius: '4px' }}>
																		{agent.id.substring(0, 8)}...
																	</Text>
																</Tooltip>
																<IconButton
																	size="1"
																	variant="ghost"
																	style={{ color: '#111827' }}
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
															<Badge color={agent.config?.category === 'business' ? 'orange' : agent.config?.category === 'personal' ? 'amber' : 'gray'} variant="soft">
																{(agent.config?.category || 'blank').toUpperCase()}
															</Badge>
														</Table.Cell>
														<Table.Cell>
															<Text size="1" style={{ color: '#111827', fontWeight: 500 }}>
																{agent.config?.industry || '-'}
															</Text>
														</Table.Cell>
														<Table.Cell>
															<Text size="1" style={{ color: '#111827', fontWeight: 500 }}>
																{agent.config?.use_case || (agent.config?.category === 'blank' ? '-' : 'General')}
															</Text>
														</Table.Cell>
														<Table.Cell>
															<Badge color={agent.config?.agent_type === 'workflow' ? 'purple' : 'blue'} variant="soft">
																{agent.config?.agent_type === 'workflow' ? 'WORKFLOW' : 'GENERAL'}
															</Badge>
														</Table.Cell>
														<Table.Cell>
															<Flex gap="2" justify="center" align="center">
																<Button
																	variant={isCallActive && currentAgent?.id === agent.id ? "solid" : "soft"}
																	color={isCallActive && currentAgent?.id === agent.id ? "red" : "amber"}
																	size="1"
																	loading={isConnecting && currentAgent?.id === agent.id}
																	disabled={isConnecting || isChatConnecting || agent.config?.chat_only}
																	onClick={(e) => {
																		e.stopPropagation();
																		if (currentAgent?.id !== agent.id) {
																			loadAgent(agent.id, false);
																		}
																		// Ensure branding is passed to the bar indirectly via currentAgent or by passing props
																		toggleCall(agent);
																	}}
																>
																	{isCallActive && currentAgent?.id === agent.id ? <PhoneOff size={14} /> : <Phone size={14} />}
																	{agent.config?.chat_only ? "Chat Only" : (isCallActive && currentAgent?.id === agent.id ? "Stop" : "Voice")}
																</Button>
																<Button
																	variant={isChatActive && currentAgent?.id === agent.id ? "solid" : "soft"}
																	color={isChatActive && currentAgent?.id === agent.id ? "red" : "blue"}
																	size="1"
																	loading={isChatConnecting && currentAgent?.id === agent.id}
																	disabled={isChatConnecting || isConnecting}
																	onClick={(e) => {
																		e.stopPropagation();
																		if (currentAgent?.id !== agent.id) {
																			loadAgent(agent.id, false);
																		}
																		toggleChatSession(agent);
																	}}
																>
																	{isChatActive && currentAgent?.id === agent.id ? <X size={14} /> : <MessageSquare size={14} />}
																	{isChatActive && currentAgent?.id === agent.id ? "End" : "Chat"}
																</Button>
																<Button variant="ghost" size="1" style={{ color: '#111827' }} onClick={(e) => { e.stopPropagation(); loadAgent(agent.id, true); }}><SlidersHorizontal size={14} /> Config</Button>

																<AlertDialog.Root>
																	<AlertDialog.Trigger>
																		<Button variant="ghost" color="red" size="1" onClick={(e) => e.stopPropagation()}><Trash2 size={14} /> Remove</Button>
																	</AlertDialog.Trigger>
																	<AlertDialog.Content maxWidth="450px" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)' }}>
																		<AlertDialog.Title style={{ color: '#111827', fontWeight: 800 }}>Delete Agent</AlertDialog.Title>
																		<AlertDialog.Description size="2" style={{ color: '#111827' }}>
																			Permanent deletion of agent <b>{agent.name || "this agent"}</b>. This session will be disconnected and all session history will be archived.
																		</AlertDialog.Description>
																		<Flex gap="3" mt="4" justify="end" align="center">
																			<AlertDialog.Cancel>
																				<Button variant="soft" color="amber"><X size={16} /> Cancel</Button>
																			</AlertDialog.Cancel>
																			<AlertDialog.Action>
																				<Button variant="solid" color="red" onClick={() => deleteAgent(agent.id, true)}><Trash2 size={16} /> Delete Agent</Button>
																			</AlertDialog.Action>
																		</Flex>
																	</AlertDialog.Content>
																</AlertDialog.Root>
															</Flex>
														</Table.Cell>
													</Table.Row>
												))}
												{agentsList.length === 0 && (
													<Table.Row>
														<Table.Cell colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
															<Text size="2" style={{ color: '#111827' }}>No agents found. Create one to start testing.</Text>
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
						) : null}
					</Box>

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

									<Tabs.Root defaultValue="voice" style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
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
														<div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '4px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', gap: '12px' }}>
															<Phone size={32} color="#111827" />
															<Text size="1" weight="bold" style={{ color: '#111827' }}>Ready</Text>
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

										<Tabs.Content value="chat" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
											<div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
												{transcripts.length > 0 ? (
													<AgentChatTranscript messages={transformTranscripts(transcripts)} agentState={agentState === 'thinking' ? 'thinking' : agentState === 'speaking' ? 'speaking' : 'idle'} />
												) : (
													<div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.55 }}>
														<Bot size={48} color="#111827" style={{ marginBottom: '16px' }} />
														<Text size="3" weight="bold" style={{ color: '#111827' }}>No Messages Yet</Text>
													</div>
												)}
											</div>

											{/* In-tab chat input */}
											{(isCallActive || isChatActive) && (
												<form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} style={{ display: 'flex', gap: '12px', padding: '16px 20px', alignItems: 'flex-end', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
													<input
														type="text"
														value={chatInput}
														onChange={e => setChatInput(e.target.value)}
														placeholder="Type a message to the agent..."
														style={{ flex: 1, padding: '14px 20px', borderRadius: '14px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '15px', backgroundColor: '#f8fafc', transition: 'all 0.2s', fontFamily: 'inherit', minHeight: '48px' }}
														onFocus={(e) => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(240, 173, 68, 0.35)'; }}
														onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
													/>
													<button
														type="submit"
														disabled={!chatInput.trim()}
														style={{ width: '52px', height: '52px', borderRadius: '14px', border: 'none', backgroundColor: chatInput.trim() ? (currentAgent?.config?.brand_color || brandColor) : '#e2e8f0', color: 'white', cursor: chatInput.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
													>
														<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
													</button>
												</form>
											)}
										</Tabs.Content>
									</Tabs.Root>

									{/* Persistent Bottom Controls */}
									<div style={{ borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', flexShrink: 0, padding: '14px 20px', gap: '12px', display: 'flex' }}>
										<button
											onClick={() => toggleCall()}
											disabled={isConnecting || isChatConnecting || isChatActive || currentAgent?.config?.chat_only}
											style={{
												flex: 1,
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												gap: '8px',
												padding: '12px',
												borderRadius: '12px',
												border: 'none',
												cursor: (isConnecting || isChatActive || currentAgent?.config?.chat_only) ? 'not-allowed' : 'pointer',
												backgroundColor: isCallActive ? '#fee2e2' : '#fffbeb',
												color: isCallActive ? '#dc2626' : '#92400e',
												fontWeight: 700,
												fontSize: '14px',
												transition: 'all 0.2s',
												opacity: (isChatActive || currentAgent?.config?.chat_only) ? 0.3 : 1,
												fontFamily: 'inherit'
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
												padding: '12px',
												borderRadius: '12px',
												border: 'none',
												cursor: (isChatConnecting || isCallActive) ? 'not-allowed' : 'pointer',
												backgroundColor: isChatActive ? '#fee2e2' : '#eff6ff',
												color: isChatActive ? '#dc2626' : '#2563eb',
												fontWeight: 700,
												fontSize: '14px',
												transition: 'all 0.2s',
												opacity: (isCallActive) ? 0.3 : 1,
												fontFamily: 'inherit'
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

					{/* Agent Builder Modal */}
					<Dialog.Root open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
						<Dialog.Content size="4" style={{ maxWidth: '1200px', padding: 0, border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)' }}>
							<Flex direction="column" style={{ height: '85vh', overflow: 'hidden' }}>
								<Box p="4" style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
									<Flex justify="between" align="center">
										<Box>
											<Flex align="center" gap="3" mb="1">
												<Box style={{ backgroundColor: '#fffbeb', color: '#92400e', padding: '6px', borderRadius: '8px' }}>
													<Bot size={24} />
												</Box>
												<Dialog.Title style={{ margin: 0, fontWeight: 800, fontSize: '24px', letterSpacing: '-0.02em', color: '#111827' }}>
													{currentAgent ? 'Edit Agent' : creationStep === 'CATEGORY' ? 'Select Agent Type' : creationStep === 'BUSINESS_INDUSTRY' ? 'Select Industry' : creationStep === 'BUSINESS_USE_CASE' || creationStep === 'PERSONAL_USE_CASE' ? 'Select Use Case' : 'Configure Agent'}
												</Dialog.Title>
											</Flex>
											<Dialog.Description size="2" style={{ color: '#111827', marginLeft: '45px' }}>
												{creationStep === 'CATEGORY' ? 'Choose the starting point for your new AI agent.' : creationStep === 'CONFIG' ? 'Fine-tune your agent behavior and technical settings.' : 'Tell us a bit more about what this agent will do.'}
											</Dialog.Description>
										</Box>
										<Flex gap="3" align="center">
											<Dialog.Close>
												<Button variant="ghost" size="2" style={{ color: '#111827' }}><X size={16} /> Cancel</Button>
											</Dialog.Close>
											{creationStep === 'CONFIG' && (
												<Button variant="solid" size="2" style={{ backgroundColor: '#f0ad44', color: '#211d1e' }} onClick={() => createAgent()} loading={isLoading}>
													{currentAgent ? <Save size={16} /> : <Check size={16} />}
													{currentAgent ? 'Save Changes' : 'Create Agent'}
												</Button>
											)}
										</Flex>
									</Flex>
								</Box>

								<Box style={{ flexGrow: 1, overflowY: 'auto', backgroundColor: '#fafafa' }}>
									<Box p="6">
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
																	<Switch checked={chatOnly} onCheckedChange={setChatOnly} />
																	<Box>
																		<Text size="2" weight="bold" style={{ color: '#111827' }}>Chat only</Text>
																		<Text size="1" ml="2" style={{ color: '#111827' }}>Audio will not be processed and only text will be used</Text>
																	</Box>
																</Flex>
															</Box>

															<Flex align="center" gap="4">
																<Flex align="center" gap="2">
																	<Text size="2">Send Welcome Message</Text>
																	<Switch checked={welcomeMessage} onCheckedChange={setWelcomeMessage} />
																</Flex>
																<Flex align="center" gap="2">
																	<Text size="2">Allow Interruption</Text>
																	<Switch checked={allowInterruption} onCheckedChange={setAllowInterruption} />
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
														<Grid columns="3" gap="5">
															<Flex direction="column" gap="4">
																<Flex align="center" gap="2" mb="1">
																	<Box style={{ backgroundColor: '#fffbeb', padding: '6px', borderRadius: '6px', color: '#92400e' }}>
																		<Mic size={18} />
																	</Box>
																	<Heading size="3" style={{ color: '#92400e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Transcription (STT)</Heading>
																</Flex>
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

															<Flex direction="column" gap="4" style={{ padding: '0 10px', borderLeft: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>
																<Flex align="center" gap="2" mb="1">
																	<Box style={{ backgroundColor: '#fffbeb', padding: '6px', borderRadius: '6px', color: '#92400e' }}>
																		<Brain size={18} />
																	</Box>
																	<Heading size="3" style={{ color: '#92400e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Reasoning (LLM)</Heading>
																</Flex>
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
																	<Text size="2" weight="bold" style={{ color: '#92400e' }}>Temperature: {providerConfigs.llm.temperature || 0.7}</Text>
																	<Slider defaultValue={[0.7]} max={1} step={0.1} onValueChange={([v]) => updateProviderConfig('llm', 'temperature', v.toString())} color="amber" />
																</Flex>
															</Flex>

															<Flex direction="column" gap="4">
																<Flex align="center" gap="2" mb="1">
																	<Box style={{ backgroundColor: '#fffbeb', padding: '6px', borderRadius: '6px', color: '#92400e' }}>
																		<Volume2 size={18} />
																	</Box>
																	<Heading size="3" style={{ color: '#92400e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Speech (TTS)</Heading>
																</Flex>
																<Select.Root value={selectedProviders.tts} onValueChange={(v) => setSelectedProviders(prev => ({ ...prev, tts: v }))}>
																	<Select.Trigger placeholder="Select TTS Provider" />
																	<Select.Content>
																		{providers.tts && Object.keys(providers.tts).map(id => <Select.Item key={id} value={id}>{id.toUpperCase()}</Select.Item>)}
																	</Select.Content>
																</Select.Root>
																{selectedProviders.tts && providers.tts?.[selectedProviders.tts]?.voice_options && (
																	<Select.Root value={providerConfigs.tts.voice || providers.tts?.[selectedProviders.tts]?.voice_options?.[0]?.id || ''} onValueChange={v => updateProviderConfig('tts', 'voice', v)}>
																		<Select.Trigger />
																		<Select.Content>
																			{providers.tts?.[selectedProviders.tts]?.voice_options?.map(v => <Select.Item key={v.id} value={v.id}>{v.name}</Select.Item>)}
																		</Select.Content>
																	</Select.Root>
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
																	<Switch checked={toolsEnabled} onCheckedChange={setToolsEnabled} />
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
																		<Switch checked={webSearchEnabled} onCheckedChange={setWebSearchEnabled} />
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
																<SegmentedControl.Root value={visualizerType} onValueChange={v => setVisualizerType(v as any)} size="2" color="amber">
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
						</Dialog.Content>
					</Dialog.Root>

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

					{/* Transcript Detail Modal */}
					<Dialog.Root open={isTranscriptModalOpen} onOpenChange={setIsTranscriptModalOpen}>
						<Dialog.Content size="3" style={{ maxWidth: '90vw', width: '650px', padding: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)' }}>
							<Box p="4" style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
								<Flex justify="between" align="center">
									<Box>
										<Flex align="center" gap="2" mb="1">
											<div style={{ backgroundColor: '#fffbeb', color: '#92400e', padding: '6px', borderRadius: '8px' }}>
												<MessageSquare size={18} />
											</div>
											<Dialog.Title style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>Conversation Detail</Dialog.Title>
										</Flex>
										<Dialog.Description size="1" style={{ color: '#111827' }}>
											Session {selectedLogForTranscript?.session_id?.substring(0, 12)}... • {selectedLogForTranscript?.created_at ? new Date(selectedLogForTranscript.created_at).toLocaleString() : ''}
										</Dialog.Description>
									</Box>
									<Dialog.Close>
										<IconButton variant="ghost" style={{ color: '#111827' }}><X size={18} /></IconButton>
									</Dialog.Close>
								</Flex>
							</Box>

							<Box style={{ backgroundColor: '#ffffff' }}>
								{selectedLogForTranscript?.summary && (
									<Box p="4" m="3" style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px' }}>
										<Flex gap="2" align="start">
											<div style={{ color: '#b45309', marginTop: '2px' }}><Brain size={16} /></div>
											<Box>
												<Text size="1" weight="bold" style={{ color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Session Summary</Text>
												<Text size="2" style={{ color: '#78350f', display: 'block', marginTop: '4px', lineHeight: '1.5' }}>
													{selectedLogForTranscript.summary}
												</Text>
											</Box>
										</Flex>
									</Box>
								)}

								<Box style={{ height: selectedLogForTranscript?.summary ? '400px' : '520px', overflowY: 'auto', padding: '0 20px 20px' }}>
									{selectedLogForTranscript?.transcripts && selectedLogForTranscript.transcripts.length > 0 ? (
										<AgentChatTranscript messages={transformTranscripts(selectedLogForTranscript.transcripts)} agentState="idle" />
									) : (
										<Flex direction="column" align="center" justify="center" style={{ height: '100%', opacity: 0.5, padding: '40px 0' }}>
											<MessageSquareOff size={48} color="#111827" style={{ marginBottom: '16px' }} />
											<Text size="2" weight="bold" style={{ color: '#111827' }}>No Transcripts Available</Text>
											<Text size="1" style={{ color: '#111827' }}>This session data is missing conversation detail.</Text>
										</Flex>
									)}
								</Box>
							</Box>

							<Box p="3" style={{ borderTop: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
								<Flex justify="end">
									<Dialog.Close>
										<Button variant="solid" size="2" style={{ backgroundColor: '#f0ad44', color: '#211d1e' }}>Close Overview</Button>
									</Dialog.Close>
								</Flex>
							</Box>
						</Dialog.Content>
					</Dialog.Root>
				</Box>
			</Box>
		</Toast.Provider>
	);
}
