import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import * as LiveKitSDK from 'livekit-client';
import { Bot, Plug, FileText, Mic, Settings, SlidersHorizontal, Plus, Phone, Trash, PhoneOff, CheckCircle, XCircle, Book } from 'lucide-react';
import { Flex, Text, Button, Box, Grid, Card, Badge, Tabs, TextField, TextArea, Switch, RadioGroup, Select, Slider, Heading, Container, Separator, Spinner } from '@radix-ui/themes';
import { AgentAudioVisualizerBar, type VisualizerState } from '../AgentAudioVisualizerBar';
import { AgentWorkflowBuilder } from '../AgentWorkflowBuilder';
import { KnowledgeBaseManager } from '../components/KnowledgeBaseManager';

const API_BASE = 'http://localhost:8000';

type ProviderConfig = {
	features: string[];
	models?: any[];
	voice_options?: any[];
	config_fields?: any[];
};

export default function App() {
	const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'unknown'>('unknown');
	const [providers, setProviders] = useState<{ stt: Record<string, ProviderConfig>, tts: Record<string, ProviderConfig>, llm: Record<string, ProviderConfig> }>({
		stt: {}, tts: {}, llm: {}
	});

	const [selectedProviders, setSelectedProviders] = useState({ stt: '', tts: '', llm: '' });

	// List of all agents from the API
	const [agentsList, setAgentsList] = useState<any[]>([]);

	// Workflows payload state from ReactFlow
	const [workflowsPayload, setWorkflowsPayload] = useState<any>(null);

	// Agent form state
	const [agentName, setAgentName] = useState('');
	const [instructions, setInstructions] = useState('');
	const [welcomeMessage, setWelcomeMessage] = useState(true);
	const [allowInterruption, setAllowInterruption] = useState(true);
	const [providerConfigs, setProviderConfigs] = useState<Record<string, Record<string, any>>>({ stt: {}, tts: {}, llm: {} });

	const [currentAgent, setCurrentAgent] = useState<any>(null);

	// LiveKit State
	const [activeTab, setActiveTab] = useState('instructions');
	const [isCallActive, setIsCallActive] = useState(false);
	const [isConnecting, setIsConnecting] = useState(false);
	const [agentAudioTrack, setAgentAudioTrack] = useState<LiveKitSDK.RemoteAudioTrack | null>(null);
	const [agentState, setAgentState] = useState<VisualizerState>('disconnected');
	const [isLoading, setIsLoading] = useState(false);
	const roomRef = useRef<LiveKitSDK.Room | null>(null);

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
	}, []);

	const loadAgent = (id: string) => {
		if (id === 'new') {
			setCurrentAgent(null);
			setAgentName('');
			setInstructions('');
			setWelcomeMessage(true);
			setAllowInterruption(true);
			setWorkflowsPayload(null);
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
			setWorkflowsPayload(agent.config.workflows || null);
		}
	};

	const updateProviderConfig = (type: string, field: string, value: any) => {
		setProviderConfigs(prev => ({
			...prev,
			[type]: { ...prev[type], [field]: value }
		}));
	};

	const createAgent = async (silent: boolean = false) => {
		if (!agentName.trim() || !instructions.trim()) {
			if (!silent) alert('Name and instructions are required.');
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
			welcome_message: welcomeMessage ? "Hello! I'm here to help you." : null,
			allow_interruption: allowInterruption,
			stt_config: buildProvConfig('stt'),
			tts_config: buildProvConfig('tts'),
			llm_config: buildProvConfig('llm'),
			workflows: workflowsPayload || undefined
		};

		try {
			if (currentAgent) {
				const response = await axios.put(`${API_BASE}/agents/${currentAgent.id}`, agentConfig);
				setCurrentAgent(response.data);
				if (!silent) alert('Agent updated successfully!');
			} else {
				const response = await axios.post(`${API_BASE}/agents`, agentConfig);
				setCurrentAgent(response.data);
				if (!silent) alert('Agent created successfully!');
			}
			loadAgentsList();
		} catch (error: any) {
			console.error('Failed to save agent', error);
			if (!silent) alert('Failed to save agent: ' + (error.response?.data?.detail || error.message));
		} finally {
			setIsLoading(false);
		}
	};

	const deleteAgent = async () => {
		if (!currentAgent) return;
		if (!confirm(`Are you sure you want to delete agent "${currentAgent.name}"?`)) return;

		setIsLoading(true);
		try {
			await axios.delete(`${API_BASE}/agents/${currentAgent.id}`);
			setCurrentAgent(null);
			loadAgentsList();
			alert('Agent deleted successfully');
		} catch (error: any) {
			alert('Failed to delete agent: ' + (error.response?.data?.detail || error.message));
		} finally {
			setIsLoading(false);
		}
	};

	const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

	const toggleCall = async () => {
		if (!currentAgent) return;

		if (isCallActive) {
			if (roomRef.current) {
				roomRef.current.disconnect();
			}
			try {
				await axios.post(`${API_BASE}/agents/${currentAgent.name}/stop`);
			} catch (e) {
				console.warn('Failed to stop agent', e);
			}
			setIsCallActive(false);
			setAgentAudioTrack(null);
			setAgentState('disconnected');
			setActiveNodeId(null);
			roomRef.current = null;
			return;
		}

		setIsConnecting(true);
		setAgentState('connecting');

		try {
			// Auto-save the current configuration (Workflow, Instructions, etc.) to the database
			// before starting the agent to ensure context is updated.
			await createAgent(true);

			const tokenResponse = await axios.get(`${API_BASE}/livekit/token?agent_name=${currentAgent.name}`);
			const { token, url } = tokenResponse.data;

			try {
				await axios.post(`${API_BASE}/agents/${currentAgent.name}/start`);
				await new Promise(r => setTimeout(r, 2000));
			} catch (e) {
				console.warn('Agent start warning', e);
			}

			const room = new LiveKitSDK.Room({
				adaptiveStream: true,
				dynacast: true,
				audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
			});

			room.on(LiveKitSDK.RoomEvent.Connected, () => {
				setIsCallActive(true);
				setIsConnecting(false);
				setAgentState('listening');
			});
			room.on(LiveKitSDK.RoomEvent.Disconnected, () => {
				setIsCallActive(false);
				setAgentAudioTrack(null);
				setAgentState('disconnected');
				setActiveNodeId(null);
				roomRef.current = null;
			});
			room.on(LiveKitSDK.RoomEvent.DataReceived, (payload, _participant) => {
				const decoder = new TextDecoder();
				const str = decoder.decode(payload);
				try {
					const data = JSON.parse(str);
					if (data.type === 'node_highlight') {
						console.log("Setting active node:", data.node_id);
						setActiveNodeId(data.node_id);
					} else if (data.type === 'end_call') {
						console.log("Remote start: Processing end_call command from agent");
						if (roomRef.current) {
							roomRef.current.disconnect();
						}
						setIsCallActive(false);
						setAgentAudioTrack(null);
						setAgentState('disconnected');
						setActiveNodeId(null);
						roomRef.current = null;
					}
				} catch (e) {
					// ignore non-json messages
				}
			});
			room.on(LiveKitSDK.RoomEvent.ActiveSpeakersChanged, (speakers) => {
				const isAgentSpeaking = speakers.some(s => !s.isLocal);
				setAgentState(isAgentSpeaking ? 'speaking' : 'listening');
			});
			room.on(LiveKitSDK.RoomEvent.TrackSubscribed, (track) => {
				if (track.kind === 'audio') {
					const audioElement = track.attach();
					document.body.appendChild(audioElement);
					audioElement.play();
					setAgentAudioTrack(track as LiveKitSDK.RemoteAudioTrack);
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
			setIsConnecting(false);
			setAgentState('disconnected');
			if (error.response?.status === 404) {
				alert('LiveKit token endpoint not implemented. Demo mode activated.');
				setIsCallActive(true);
			} else {
				alert('Failed to connect: ' + (error.response?.data?.detail || error.message));
			}
		}
	};

	const renderProviderConfigFields = (type: 'stt' | 'tts' | 'llm', pKey: string) => {
		const config = providers[type][pKey];
		if (!config?.config_fields?.length) return null;

		const hiddenFields = ['url', 'model', 'api_key', 'api key', 'base_url', 'base url'];
		const visibleFields = config.config_fields.filter((f: any) => !hiddenFields.includes(f.name.toLowerCase()));
		if (visibleFields.length === 0) return null;

		return (
			<Grid columns="2" gap="4" mt="3">
				{visibleFields.map((f: any) => {
					let optionsList: any[] = [];
					if (f.options === 'models') optionsList = config.models || [];
					else if (f.options === 'voice_options') optionsList = config.voice_options || [];
					else if (Array.isArray(f.options)) optionsList = f.options.map((o: any) => ({ id: o, name: o }));

					// Guarantee a robust initial selection value to prevent uncontrolled React DOM loops
					const fallbackFirstItem = optionsList.length > 0 ? (optionsList[0].id || optionsList[0].value || optionsList[0]) : 'none';
					const currentValue = providerConfigs[type]?.[f.name] || f.default || fallbackFirstItem;

					return (
					<Flex direction="column" gap="1" key={f.name}>
						<Text size="2" weight="bold">{f.name.replace(/_/g, ' ')}</Text>
						{f.type === 'select' && (
							<Select.Root
								value={currentValue}
								onValueChange={(val) => updateProviderConfig(type, f.name, val)}
							>
								<Select.Trigger placeholder={`Select ${f.name.replace('_', ' ')}...`} />
								<Select.Content>
									{optionsList.length > 0 ? optionsList.map((opt: any) => (
										<Select.Item key={opt.id || opt.value || opt} value={opt.id || opt.value || opt}>
											{opt.name || opt} {opt.language ? `(${opt.language})` : ''}
										</Select.Item>
									)) : (
										<Select.Item value="none" disabled>No options available (Backend down)</Select.Item>
									)}
								</Select.Content>
							</Select.Root>
						)}
						{f.type === 'range' && (
							<Flex align="center" gap="3" width="100%">
								<Box width="100%" flexGrow="1">
									<Slider
										defaultValue={[Number(f.default || 0)]}
										min={Number(f.min || 0)} max={Number(f.max || 100)} step={f.step ? Number(f.step) : 0.1}
										value={[providerConfigs[type]?.[f.name] !== undefined ? Number(providerConfigs[type]?.[f.name]) : Number(f.default || 0)]}
										onValueChange={([val]) => updateProviderConfig(type, f.name, val)}
									/>
								</Box>
								<Text size="2">{providerConfigs[type]?.[f.name] !== undefined ? providerConfigs[type]?.[f.name] : f.default}</Text>
							</Flex>
						)}
						{(f.type === 'text' || f.type === 'number' || f.type === 'password') && (
							<TextField.Root
								placeholder={f.default || `Enter ${f.name}`}
								type={f.type === 'password' ? 'password' : f.type === 'number' ? 'number' : 'text'}
								value={providerConfigs[type]?.[f.name] !== undefined ? providerConfigs[type]?.[f.name] : (f.default || '')}
								onChange={(e) => updateProviderConfig(type, f.name, e.target.value)}
							/>
						)}
					</Flex>
					);
				})}
			</Grid>
		);
	};

	return (
		<Container size="4" p="4">
			<Flex direction="column" gap="6">

				{/* Header */}
				<Flex justify="between" align="center">
					<Flex align="center" gap="4">
						<Flex align="center" gap="3">
							<Bot size={28} />
							<Heading size="6">Agent Builder</Heading>
						</Flex>
						<Select.Root value={currentAgent?.id || 'new'} onValueChange={(val) => setTimeout(() => loadAgent(val), 0)}>
							<Select.Trigger style={{ width: '250px' }} placeholder="Select an Agent to edit..." />
							<Select.Content>
								<Select.Item value="new"><Flex align="center" gap="2"><Plus size={14} /> Create New Agent...</Flex></Select.Item>
								{agentsList.length > 0 && <Select.Separator />}
								{agentsList.map(a => <Select.Item key={a.id} value={a.id}>{a.name} ({a.status})</Select.Item>)}
							</Select.Content>
						</Select.Root>
					</Flex>

					<Flex align="center" gap="4">
						<Button onClick={testConnection}>
							<Plug size={16} /> Test Connection
						</Button>
						<Badge color={connectionStatus === 'connected' ? 'green' : connectionStatus === 'disconnected' ? 'red' : 'gray'}>
							{connectionStatus === 'connected' && <CheckCircle size={12} />}
							{connectionStatus === 'disconnected' && <XCircle size={12} />}
							{connectionStatus.toUpperCase()}
						</Badge>
					</Flex>
				</Flex>

				<Separator size="4" />

				{/* Main Content */}
				<Grid columns={{ initial: '1', lg: activeTab === 'workflows' ? '1fr' : '1fr 350px' }} gap="6">

					{/* Configuration Panel */}
					<Box>
						<Card size="3">
							<Tabs.Root value={activeTab} onValueChange={setActiveTab}>
								<Tabs.List>
									<Tabs.Trigger value="instructions"><Flex align="center" gap="2"><FileText size={16} /> Instructions</Flex></Tabs.Trigger>
									<Tabs.Trigger value="models"><Flex align="center" gap="2"><Mic size={16} /> Models & Voice</Flex></Tabs.Trigger>
									<Tabs.Trigger value="workflows"><Flex align="center" gap="2"><SlidersHorizontal size={16} /> Workflows</Flex></Tabs.Trigger>
									<Tabs.Trigger value="knowledge"><Flex align="center" gap="2"><Book size={16} /> Knowledge Base</Flex></Tabs.Trigger>
									<Tabs.Trigger value="actions"><Flex align="center" gap="2"><Settings size={16} /> Actions</Flex></Tabs.Trigger>
								</Tabs.List>

								<Box pt="6">
									<Tabs.Content value="instructions">
										<Flex direction="column" gap="5">
											<Flex direction="column" gap="1">
												<Text size="3" weight="bold">Agent Name</Text>
												<TextField.Root
													placeholder="e.g., Customer Support Agent"
													value={agentName}
													onChange={(e) => setAgentName(e.target.value)}
												/>
											</Flex>

											<Flex direction="column" gap="1">
												<Text size="3" weight="bold">Instructions</Text>
												<TextArea
													placeholder="Define your agent's personality, tone, and behavior guidelines..."
													rows={8}
													value={instructions}
													onChange={(e) => setInstructions(e.target.value)}
												/>
											</Flex>

											<Flex direction="column" gap="3">
												<Text as="label" size="2">
													<Flex gap="2">
														<Switch checked={welcomeMessage} onCheckedChange={(v) => setWelcomeMessage(v as boolean)} />
														Enable welcome message
													</Flex>
												</Text>
												<Text as="label" size="2">
													<Flex gap="2">
														<Switch checked={allowInterruption} onCheckedChange={(v) => setAllowInterruption(v as boolean)} />
														Allow users to interrupt
													</Flex>
												</Text>
											</Flex>
										</Flex>
									</Tabs.Content>

									<Tabs.Content value="models">
										<Grid columns={{ initial: '1', lg: '3' }} gap="6" pt="3">
											{/* STT */}
											<Flex direction="column" gap="4">
												<Box>
													<Text size="3" weight="bold">Speech-to-Text (STT)</Text>
													<Text size="2" color="gray" as="div">Transcribes the user's speech into text.</Text>
												</Box>
												<RadioGroup.Root value={selectedProviders.stt} onValueChange={(v) => setSelectedProviders(p => ({ ...p, stt: v }))}>
													<Grid columns="2" gap="3">
														{Object.entries(providers.stt).map(([key]) => (
															<Card key={key} asChild variant={selectedProviders.stt === key ? 'classic' : 'surface'} size="1">
																<label style={{ cursor: 'pointer' }}>
																	<Flex align="center" justify="between" p="1">
																		<Text weight="bold" size="2">{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
																		<RadioGroup.Item value={key} />
																	</Flex>
																</label>
															</Card>
														))}
													</Grid>
												</RadioGroup.Root>
												{selectedProviders.stt && renderProviderConfigFields('stt', selectedProviders.stt)}
											</Flex>

											{/* TTS */}
											<Flex direction="column" gap="4">
												<Box>
													<Text size="3" weight="bold">Text-to-Speech (TTS)</Text>
													<Text size="2" color="gray" as="div">Converts your agent's text response into speech.</Text>
												</Box>
												<RadioGroup.Root value={selectedProviders.tts} onValueChange={(v) => setSelectedProviders(p => ({ ...p, tts: v }))}>
													<Grid columns="2" gap="3">
														{Object.entries(providers.tts).map(([key]) => (
															<Card key={key} asChild variant={selectedProviders.tts === key ? 'classic' : 'surface'} size="1">
																<label style={{ cursor: 'pointer' }}>
																	<Flex align="center" justify="between" p="1">
																		<Text weight="bold" size="2">{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
																		<RadioGroup.Item value={key} />
																	</Flex>
																</label>
															</Card>
														))}
													</Grid>
												</RadioGroup.Root>
												{selectedProviders.tts && renderProviderConfigFields('tts', selectedProviders.tts)}
											</Flex>

											{/* LLM */}
											<Flex direction="column" gap="4">
												<Box>
													<Text size="3" weight="bold">Large Language Model (LLM)</Text>
													<Text size="2" color="gray" as="div">Your agent's brain, responsible for generating responses.</Text>
												</Box>
												<RadioGroup.Root value={selectedProviders.llm} onValueChange={(v) => setSelectedProviders(p => ({ ...p, llm: v }))}>
													<Grid columns="2" gap="3">
														{Object.entries(providers.llm).map(([key]) => (
															<Card key={key} asChild variant={selectedProviders.llm === key ? 'classic' : 'surface'} size="1">
																<label style={{ cursor: 'pointer' }}>
																	<Flex align="center" justify="between" p="1">
																		<Text weight="bold" size="2">{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
																		<RadioGroup.Item value={key} />
																	</Flex>
																</label>
															</Card>
														))}
													</Grid>
												</RadioGroup.Root>
												{selectedProviders.llm && renderProviderConfigFields('llm', selectedProviders.llm)}
											</Flex>
										</Grid>
									</Tabs.Content>

									<Tabs.Content value="actions">
										<Flex direction="column" align="center" justify="center" p="9">
											<Settings size={48} />
											<Text mt="4">Actions and tools configuration coming soon...</Text>
										</Flex>
									</Tabs.Content>

									<Tabs.Content value="knowledge">
										<Box pt="4">
											<KnowledgeBaseManager />
										</Box>
									</Tabs.Content>

									<Tabs.Content value="workflows">
										<Flex direction="column" gap="4">
											<Text size="3" color="gray">Visually blueprint custom step-by-step logic workflows. Design explicit sequence funnels, dynamic queries, and fallbacks.</Text>
											<AgentWorkflowBuilder
												initialNodesData={workflowsPayload || currentAgent?.config?.workflows}
												onSaveData={setWorkflowsPayload}
												activeNodeId={activeNodeId}
												agentId={currentAgent?.id}
											/>
										</Flex>
									</Tabs.Content>
								</Box>
							</Tabs.Root>
						</Card>
					</Box>

					{/* Live Preview Panel */}
					{activeTab !== 'workflows' && (
						<Box>
							<Card size="3">
								<Heading size="4" mb="4">Live Preview</Heading>

							<Flex direction="column" gap="4">
								<Box>
									<Flex justify="between" align="center" mb="1">
										<Text size="2" weight="bold">Agent Status</Text>
										<Badge color={currentAgent ? 'green' : 'gray'}>{currentAgent ? 'Created' : 'Not Created'}</Badge>
									</Flex>
									<Text size="2" color="gray">{currentAgent ? currentAgent.name : 'No agent configured'}</Text>
								</Box>

								<Card variant="surface">
									<Flex direction="column" align="center" justify="center" p="6" gap="2" style={{ backgroundColor: 'var(--gray-2)' }}>
										<AgentAudioVisualizerBar audioTrack={agentAudioTrack} state={agentState} />
									</Flex>
								</Card>

								<Flex direction="column" gap="2">
									<Button onClick={() => createAgent()} loading={isLoading}>
										<Plus size={16} /> {currentAgent ? 'Update Agent' : 'Create Agent'}
									</Button>
									<Button color={isCallActive ? 'red' : 'green'} disabled={!currentAgent || isConnecting || isLoading} onClick={toggleCall} variant={isCallActive ? "soft" : "solid"}>
										<Spinner loading={isConnecting}>
											{isCallActive ? <PhoneOff size={16} /> : <Phone size={16} />}
										</Spinner>
										{isCallActive ? 'End Call' : 'Start Call'}
									</Button>
									<Button color="red" variant="soft" disabled={!currentAgent || isLoading} onClick={deleteAgent} loading={isLoading}>
										<Trash size={16} /> Delete Agent
									</Button>
								</Flex>

								{currentAgent && (
									<Card variant="surface" mt="3">
										<Box p="3">
											<Text size="2" weight="bold" mb="2" as="div">Agent Information</Text>
											<Flex direction="column" gap="1">
												<Text size="1"><strong>ID:</strong> {currentAgent.id}</Text>
												<Text size="1"><strong>Name:</strong> {currentAgent.name}</Text>
												<Text size="1"><strong>Status:</strong> {currentAgent.status}</Text>
												<Text size="1"><strong>STT:</strong> {currentAgent.config?.stt_config?.provider || 'default'}</Text>
												<Text size="1"><strong>TTS:</strong> {currentAgent.config?.tts_config?.provider || 'default'}</Text>
												<Text size="1"><strong>LLM:</strong> {currentAgent.config?.llm_config?.provider || 'default'}</Text>
											</Flex>
										</Box>
									</Card>
								)}
							</Flex>
						</Card>
						</Box>
					)}

				</Grid>
			</Flex>
		</Container>
	);
}
