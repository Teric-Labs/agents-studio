import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';


export type ActiveView = 'dashboard' | 'builder' | 'voices' | 'knowledge' | 'workflows' | 'logs' | 'agent-detail' | 'integrations';
export type CreationStep = 'CATEGORY' | 'PERSONAL_USE_CASE' | 'BUSINESS_INDUSTRY' | 'BUSINESS_USE_CASE' | 'CONFIG';
export type AgentCategory = 'blank' | 'personal' | 'business';
export type AgentType = 'general' | 'workflow';
export type VisualizerType = 'bar' | 'grid' | 'radial' | 'wave' | 'aura';

export interface BuilderState {
  // Navigation — the most critical: survives OAuth redirect
  activeView: ActiveView;
  creationStep: CreationStep;

  // Agent form fields
  agentName: string;
  instructions: string;
  welcomeMessage: boolean;
  allowInterruption: boolean;
  agentType: AgentType;
  selectedWorkflowId: string;

  // Creation wizard
  agentCategory: AgentCategory;
  agentIndustry: string;
  agentUseCase: string;

  // Appearance
  chatOnly: boolean;
  visualizerType: VisualizerType;
  brandColor: string;

  // Provider configs (serialisable plain objects)
  selectedProviders: { stt: string; tts: string; llm: string };
  providerConfigs: Record<string, Record<string, any>>;

  // Integrations / Tools
  toolsEnabled: boolean;
  selectedToolCategories: string[];
  webSearchEnabled: boolean;
  tavilyApiKey: string;

  // Tracks which existing agent is being edited (null = new agent)
  currentAgentId: string | null;
}

const initialState: BuilderState = {
  activeView: 'dashboard',
  creationStep: 'CATEGORY',

  agentName: '',
  instructions: '',
  welcomeMessage: true,
  allowInterruption: true,
  agentType: 'general',
  selectedWorkflowId: '',

  agentCategory: 'blank',
  agentIndustry: '',
  agentUseCase: '',

  chatOnly: false,
  visualizerType: 'bar',
  brandColor: '#f0ad44',

  selectedProviders: { stt: '', tts: '', llm: '' },
  providerConfigs: { stt: {}, tts: {}, llm: {} },

  toolsEnabled: false,
  selectedToolCategories: [],
  webSearchEnabled: false,
  tavilyApiKey: '',

  currentAgentId: null,
};

const builderSlice = createSlice({
  name: 'builder',
  initialState,
  reducers: {
    setActiveView(state, action: PayloadAction<ActiveView>) {
      state.activeView = action.payload;
    },
    setCreationStep(state, action: PayloadAction<CreationStep>) {
      state.creationStep = action.payload;
    },
    setAgentName(state, action: PayloadAction<string>) {
      state.agentName = action.payload;
    },
    setInstructions(state, action: PayloadAction<string>) {
      state.instructions = action.payload;
    },
    setWelcomeMessage(state, action: PayloadAction<boolean>) {
      state.welcomeMessage = action.payload;
    },
    setAllowInterruption(state, action: PayloadAction<boolean>) {
      state.allowInterruption = action.payload;
    },
    setAgentType(state, action: PayloadAction<AgentType>) {
      state.agentType = action.payload;
    },
    setSelectedWorkflowId(state, action: PayloadAction<string>) {
      state.selectedWorkflowId = action.payload;
    },
    setAgentCategory(state, action: PayloadAction<AgentCategory>) {
      state.agentCategory = action.payload;
    },
    setAgentIndustry(state, action: PayloadAction<string>) {
      state.agentIndustry = action.payload;
    },
    setAgentUseCase(state, action: PayloadAction<string>) {
      state.agentUseCase = action.payload;
    },
    setChatOnly(state, action: PayloadAction<boolean>) {
      state.chatOnly = action.payload;
    },
    setVisualizerType(state, action: PayloadAction<VisualizerType>) {
      state.visualizerType = action.payload;
    },
    setBrandColor(state, action: PayloadAction<string>) {
      state.brandColor = action.payload;
    },
    setSelectedProviders(state, action: PayloadAction<{ stt: string; tts: string; llm: string }>) {
      state.selectedProviders = action.payload;
    },
    setProviderConfigs(state, action: PayloadAction<Record<string, Record<string, any>>>) {
      state.providerConfigs = action.payload;
    },
    setToolsEnabled(state, action: PayloadAction<boolean>) {
      state.toolsEnabled = action.payload;
    },
    setSelectedToolCategories(state, action: PayloadAction<string[]>) {
      state.selectedToolCategories = action.payload;
    },
    setWebSearchEnabled(state, action: PayloadAction<boolean>) {
      state.webSearchEnabled = action.payload;
    },
    setTavilyApiKey(state, action: PayloadAction<string>) {
      state.tavilyApiKey = action.payload;
    },
    setCurrentAgentId(state, action: PayloadAction<string | null>) {
      state.currentAgentId = action.payload;
    },
    /** Reset all form fields but keep navigation intact */
    resetForm(state) {
      state.agentName = '';
      state.instructions = '';
      state.welcomeMessage = true;
      state.allowInterruption = true;
      state.agentType = 'general';
      state.selectedWorkflowId = '';
      state.agentCategory = 'blank';
      state.agentIndustry = '';
      state.agentUseCase = '';
      state.chatOnly = false;
      state.visualizerType = 'bar';
      state.brandColor = '#f0ad44';
      state.selectedProviders = { stt: '', tts: '', llm: '' };
      state.providerConfigs = { stt: {}, tts: {}, llm: {} };
      state.toolsEnabled = false;
      state.selectedToolCategories = [];
      state.webSearchEnabled = false;
      state.tavilyApiKey = '';
      state.currentAgentId = null;
    },
  },
});

export const {
  setActiveView,
  setCreationStep,
  setAgentName,
  setInstructions,
  setWelcomeMessage,
  setAllowInterruption,
  setAgentType,
  setSelectedWorkflowId,
  setAgentCategory,
  setAgentIndustry,
  setAgentUseCase,
  setChatOnly,
  setVisualizerType,
  setBrandColor,
  setSelectedProviders,
  setProviderConfigs,
  setToolsEnabled,
  setSelectedToolCategories,
  setWebSearchEnabled,
  setTavilyApiKey,
  setCurrentAgentId,
  resetForm,
} = builderSlice.actions;

export default builderSlice.reducer;
