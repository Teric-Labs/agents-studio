import React, { useCallback, useState } from 'react';
import {
    ReactFlow,
    MiniMap,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    BackgroundVariant,
    Panel,
    ReactFlowProvider,
    useReactFlow,
    SelectionMode
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, Flex, Text, Button, Box, Heading, TextField, TextArea, DropdownMenu, Tooltip, AlertDialog } from '@radix-ui/themes';
import { Handle, Position } from '@xyflow/react';
import { 
    Plus, Route, Activity, HandMetal, Settings2, PhoneOff, User,
    Lock, Unlock, ZoomIn, ZoomOut, MousePointer2, Hand, Crosshair 
} from 'lucide-react';

const initialNodes: Node[] = [
    {
        id: 'start',
        type: 'customTask',
        data: { label: 'Start Session' },
        position: { x: 250, y: 50 },
    }
];

const initialEdges: Edge[] = [];

const TaskNode = ({ id, data, selected }: any) => {
    const isEnd = data.type === 'end' || data.type === 'output' || id === 'end';
    const isStart = data.id === 'start' || id === 'start';

    // Icon mapping
    let Icon = Activity;
    if (isEnd) Icon = PhoneOff;
    else if (data.type === 'handoff') Icon = HandMetal;
    else if (data.type === 'question') Icon = User;

    const borderColor = selected ? 'var(--accent-8)' : 'var(--gray-5)';

    // Icon color handling
    const iconBgColor = isStart ? 'var(--green-3)' : isEnd ? 'var(--red-3)' : 'var(--accent-3)';
    const iconColor = isStart ? 'var(--green-11)' : isEnd ? 'var(--red-11)' : 'var(--accent-11)';

    return (
        <div style={{
            position: 'relative',
            padding: 0,
            borderRadius: '12px',
            border: `2px solid ${borderColor}`,
            width: '380px',
            backgroundColor: 'var(--color-surface)',
            boxShadow: selected ? '0 0 0 1px var(--accent-8), 0 4px 12px var(--black-a2)' : 'var(--shadow-2)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Connection Handles */}
            {!isStart && <Handle type="target" position={Position.Top} style={{ background: 'var(--accent-9)', border: 'none', width: '10px', height: '10px', top: '-6px' }} />}
            {!isEnd && <Handle type="source" position={Position.Bottom} style={{ background: 'var(--accent-9)', border: 'none', width: '10px', height: '10px', bottom: '-6px' }} />}

            <div style={{ borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                {/* Header */}
                <Flex justify="between" align="center" style={{ padding: '12px 16px', backgroundColor: 'var(--gray-2)', borderBottom: '1px solid var(--gray-5)' }}>
                    <Flex align="center" gap="3">
                        <Box style={{ backgroundColor: iconBgColor, padding: '6px', borderRadius: '6px' }}>
                            <Icon size={16} color={iconColor} />
                        </Box>
                        <Text size="3" weight="bold" style={{ color: 'var(--gray-12)' }}>
                            {data.label || 'Task Node'}
                        </Text>
                    </Flex>
                    <Settings2 size={16} color="var(--gray-8)" style={{ cursor: 'pointer' }} />
                </Flex>

                {/* Body */}
                <Flex direction="column" gap="2" style={{ padding: '16px', flexGrow: 1 }}>
                    <Text size="1" weight="bold" color="gray" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Prompt
                    </Text>
                    <Text size="2" style={{ lineHeight: '1.6', color: 'var(--gray-11)', whiteSpace: 'pre-wrap' }}>
                        {data.description || 'No prompt defined. Open settings to configure instructions for the AI.'}
                    </Text>
                </Flex>
            </div>
        </div>
    );
};

const nodeTypes = {
    customTask: TaskNode,
};

interface AgentWorkflowBuilderProps {
    initialNodesData?: any;
    onSaveData?: (data: any) => void;
    activeNodeId?: string | null;
    agentId?: string | null;
}

export function AgentWorkflowBuilder(props: AgentWorkflowBuilderProps) {
    return (
        <ReactFlowProvider>
            <AgentWorkflowBuilderInternal {...props} />
        </ReactFlowProvider>
    );
}

const getEdgePillStyle = (): Partial<Edge> => ({
    type: 'smoothstep',
    style: { stroke: 'var(--accent-9)', strokeWidth: 2 },
    animated: false,
    labelStyle: { fill: '#ffffff', fontSize: 15, fontWeight: 800, fontFamily: 'system-ui, -apple-system, sans-serif' },
    labelBgStyle: { fill: 'var(--accent-9)', stroke: 'var(--accent-11)', strokeWidth: 2, rx: 24, ry: 24 },
    labelBgPadding: [20, 10] as [number, number]
});

function AgentWorkflowBuilderInternal({ initialNodesData, onSaveData, activeNodeId, agentId }: AgentWorkflowBuilderProps) {
    const loadNodes = (nds: Node[]) => nds.map(n => ({ ...n, type: 'customTask' }));
    const loadEdges = (eds: Edge[]) => eds.map(e => ({
        ...e,
        ...(e.label ? getEdgePillStyle() : { type: 'smoothstep', style: { stroke: 'var(--accent-9)', strokeWidth: 2 } })
    }));

    const [nodes, setNodes, onNodesChange] = useNodesState(loadNodes(initialNodesData?.nodes || initialNodes));
    const [edges, setEdges, onEdgesChange] = useEdgesState(loadEdges(initialNodesData?.edges || initialEdges));
    const { fitView, zoomIn, zoomOut } = useReactFlow();
    
    const [isLocked, setIsLocked] = useState(false);
    const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('pan');

    // Support persistence during tab switches: Only reset if the agent identity actually changed
    const lastAgentIdRef = React.useRef<string | null>(null);
    React.useEffect(() => {
        const currentId = agentId || 'new';
        if (currentId !== lastAgentIdRef.current) {
            setNodes(loadNodes(initialNodesData?.nodes || initialNodes));
            setEdges(loadEdges(initialNodesData?.edges || initialEdges));
            lastAgentIdRef.current = currentId;
            // Force the viewport to a tighter 'working zoom' level (maxZoom: 1.2)
            setTimeout(() => fitView({ padding: 0.08, duration: 400, maxZoom: 1.2 }), 100);
        }
    }, [agentId, initialNodesData, setNodes, setEdges, fitView]);

    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

    // Highlight the active node visually and pan to it
    React.useEffect(() => {
        if (!activeNodeId) {
            setNodes((nds) => nds.map((node) => ({ ...node, selected: false })));
            return;
        }

        // Pan to node
        fitView({ nodes: [{ id: activeNodeId }], duration: 1000, padding: 0.5 });

        setNodes((nds) => nds.map((node) => {
            if (node.id === activeNodeId) {
                return { ...node, selected: true };
            }
            return { ...node, selected: false };
        }));
    }, [activeNodeId, setNodes, fitView]);

    // Vapi-style Auto-Save Pipeline: Funnel live changes to parent form state
    React.useEffect(() => {
        if (onSaveData) {
            onSaveData({ nodes, edges });
        }
    }, [nodes, edges, onSaveData]);

    // Sync React Flow internal elements cleanly into React States for our custom Property Sidebar
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
        setSelectedEdge(null);
    }, []);

    const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
        setSelectedEdge(edge);
        setSelectedNode(null);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
        setSelectedEdge(null);
    }, []);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({
            ...params,
            animated: false,
            type: 'smoothstep',
            style: { stroke: '#4b5563', strokeWidth: 2 }
        }, eds)),
        [setEdges]
    );

    const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
        event.preventDefault();
        const newLabel = window.prompt("Edit task instructions/conditions:", node.data.label as string);
        if (newLabel !== null && newLabel.trim() !== "") {
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id === node.id) {
                        return { ...n, data: { ...n.data, label: newLabel } };
                    }
                    return n;
                })
            );
        }
    }, [setNodes]);

    const onEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
        event.preventDefault();
        const newLabel = window.prompt("Enter Logical Outcome Branch for LLM Routing (e.g. 'Yes', 'No', 'Refusal'):", edge.label as string || "");
        if (newLabel !== null) {
            setEdges((eds) =>
                eds.map((e) => {
                    if (e.id === edge.id) {
                        return {
                            ...e,
                            label: newLabel,
                            ...getEdgePillStyle()
                        };
                    }
                    return e;
                })
            );
        }
    }, [setEdges]);

    const addNewTask = (type: 'collect' | 'question' | 'handoff' | 'end') => {
        const defaultLabel = type === 'end' ? 'End Session' : type === 'handoff' ? 'Human Handoff' : type === 'question' ? 'Logical Evaluation Step' : 'Collect Information';

        const newNode: Node = {
            id: type === 'end' ? `end_${Date.now()}` : `task_${Date.now()}`,
            type: 'customTask',
            position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
            data: { label: defaultLabel, type: type },
        };
        setNodes((nds) => nds.concat(newNode as any));
    };

    return (
        <Flex gap="0" style={{ width: '100%', height: '100%', minHeight: '600px' }}>
            <style>
                {`
                @keyframes pulse-glow {
                    0% { box-shadow: 0 0 10px var(--accent-9); }
                    50% { box-shadow: 0 0 30px var(--accent-9), 0 0 15px var(--accent-9); }
                    100% { box-shadow: 0 0 10px var(--accent-9); }
                }
                `}
            </style>
            {/* Main Interactive Map */}
            <Box style={{ flexGrow: 1, overflow: 'hidden', position: 'relative', backgroundColor: 'var(--color-surface)' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    onPaneClick={onPaneClick}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onEdgeDoubleClick={onEdgeDoubleClick}
                    defaultEdgeOptions={{ type: 'smoothstep', style: { stroke: 'var(--accent-9)', strokeWidth: 2 } }}
                    minZoom={0.5}
                    maxZoom={1.8}
                    fitView
                    fitViewOptions={{ padding: 0.08, maxZoom: 1.2 }}
                    onInit={(instance) => setTimeout(() => instance.fitView({ padding: 0.08, maxZoom: 1.2 }), 50)}
                    proOptions={{ hideAttribution: true }}
                    nodesDraggable={!isLocked}
                    nodesConnectable={!isLocked}
                    panOnDrag={interactionMode === 'pan'}
                    selectionOnDrag={interactionMode === 'select'}
                    selectionMode={SelectionMode.Partial}
                >
                    <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="var(--gray-a6)" />
                    <MiniMap nodeColor={(n) => {
                        if (n.type === 'input') return 'var(--green-9)';
                        if (n.type === 'output') return 'var(--red-9)';
                        return 'var(--blue-9)';
                    }} />

                    {/* Universal Custom Tool Panel */}
                    <Panel position="bottom-center" style={{ marginBottom: '24px' }}>
                        <Flex gap="0" align="center" style={{ 
                            backgroundColor: 'white', 
                            padding: '8px 12px', 
                            borderRadius: '10px', 
                            border: '1px solid var(--gray-5)',
                            boxShadow: 'var(--shadow-4)',
                            color: 'var(--gray-11)'
                        }}>
                            {/* Group 1: Navigation */}
                            <Flex gap="4" px="3" style={{ borderRight: '1px solid var(--gray-5)' }}>
                                <Tooltip content="Fit View to Screen">
                                    <Button variant="ghost" size="1" onClick={() => fitView({ padding: 0.1, duration: 400 })} style={{ color: 'inherit', cursor: 'pointer', borderRadius: '10px' }}>
                                        <Crosshair size={22} />
                                    </Button>
                                </Tooltip>
                                <Tooltip content={isLocked ? "Unlock Layout" : "Lock Layout"}>
                                    <Button variant="ghost" size="1" onClick={() => setIsLocked(!isLocked)} style={{ color: isLocked ? 'var(--accent-9)' : 'inherit', cursor: 'pointer', borderRadius: '10px' }}>
                                        {isLocked ? <Lock size={22} /> : <Unlock size={22} />}
                                    </Button>
                                </Tooltip>
                            </Flex>

                            {/* Group 2: Zoom */}
                            <Flex gap="4" px="3" style={{ borderRight: '1px solid var(--gray-5)' }}>
                                <Tooltip content="Zoom Out">
                                    <Button variant="ghost" size="1" onClick={() => zoomOut()} style={{ color: 'inherit', cursor: 'pointer', borderRadius: '10px' }}><ZoomOut size={22} /></Button>
                                </Tooltip>
                                <Tooltip content="Zoom In">
                                    <Button variant="ghost" size="1" onClick={() => zoomIn()} style={{ color: 'inherit', cursor: 'pointer', borderRadius: '10px' }}><ZoomIn size={22} /></Button>
                                </Tooltip>
                            </Flex>

                            {/* Group 3: Interaction Modes */}
                            <Flex gap="1" align="center" ml="2" style={{ backgroundColor: 'var(--gray-3)', borderRadius: '10px', padding: '3px' }}>
                                <Tooltip content="Selection Mode (Select Multiple)">
                                    <Button 
                                        variant="ghost" 
                                        size="1" 
                                        onClick={() => setInteractionMode('select')}
                                        style={{ 
                                            borderRadius: '8px', 
                                            backgroundColor: interactionMode === 'select' ? 'var(--accent-3)' : 'transparent',
                                            color: interactionMode === 'select' ? 'var(--accent-11)' : 'inherit',
                                            cursor: 'pointer',
                                            width: '38px',
                                            height: '28px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            '--button-ghost-hover-background': 'transparent'
                                        } as any}
                                    >
                                        <MousePointer2 size={18} />
                                    </Button>
                                </Tooltip>
                                <Tooltip content="Panning Mode (Drag Map)">
                                    <Button 
                                        variant="ghost" 
                                        size="1" 
                                        onClick={() => setInteractionMode('pan')}
                                        style={{ 
                                            borderRadius: '8px', 
                                            backgroundColor: interactionMode === 'pan' ? 'var(--accent-3)' : 'transparent',
                                            color: interactionMode === 'pan' ? 'var(--accent-11)' : 'inherit',
                                            cursor: 'pointer',
                                            width: '38px',
                                            height: '28px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            '--button-ghost-hover-background': 'transparent'
                                        } as any}
                                    >
                                        <Hand size={18} />
                                    </Button>
                                </Tooltip>
                            </Flex>
                        </Flex>
                    </Panel>

                    <Panel position="top-right">
                        <Flex gap="3" p="3" style={{ backgroundColor: 'var(--gray-2)', borderRadius: 'var(--radius-3)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger>
                                    <Button variant="soft"><Plus size={16} /> Add Task Node</Button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content>
                                    <DropdownMenu.Item onClick={() => addNewTask('collect')}><Activity size={14} style={{ marginRight: 8 }} /> Collect Target Data</DropdownMenu.Item>
                                    <DropdownMenu.Item onClick={() => addNewTask('question')}><Route size={14} style={{ marginRight: 8 }} /> Logic Path / Question</DropdownMenu.Item>
                                    <DropdownMenu.Item onClick={() => addNewTask('handoff')}><HandMetal size={14} style={{ marginRight: 8 }} /> Agent/Human Handoff</DropdownMenu.Item>
                                    <DropdownMenu.Separator />
                                    <DropdownMenu.Item color="red" onClick={() => addNewTask('end')}><PhoneOff size={14} style={{ marginRight: 8 }} /> Finish / End Case</DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </Flex>
                    </Panel>
                </ReactFlow>
            </Box>

            {/* Properties Editor Sidebar (Vapi-style) */}
            {(selectedNode || selectedEdge) && (
                <Card style={{ width: '320px', height: '100%', overflowY: 'auto' }}>
                    <Flex direction="column" gap="4" p="2">
                        <Flex align="center" gap="2">
                            <Settings2 size={18} />
                            <Heading size="4">{selectedNode ? 'Node Settings' : 'Condition Logic'}</Heading>
                        </Flex>

                        {selectedNode && (
                            <Flex direction="column" gap="3">
                                <Flex direction="column" gap="1">
                                    <Text size="2" weight="bold">Node Label</Text>
                                    <Text size="1" color="gray">Display name on the graph</Text>
                                    <TextField.Root
                                        size="2"
                                        placeholder="e.g. Collect Name"
                                        value={selectedNode.data?.label as string || ''}
                                        onChange={(e) => {
                                            const newLabel = e.target.value;
                                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: newLabel } } : n));
                                            setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, label: newLabel } } : null);
                                        }}
                                    />
                                </Flex>

                                <Flex direction="column" gap="1">
                                    <Text size="2" weight="bold">Step Objective (Prompt)</Text>
                                    <Text size="1" color="gray">Detailed instructions for the AI for this specific step.</Text>
                                    <TextArea
                                        size="2"
                                        placeholder="e.g. Politely ask the user for their full name and wait for their response."
                                        value={selectedNode.data?.description as string || ''}
                                        style={{ height: '120px' }}
                                        onChange={(e) => {
                                            const newDesc = e.target.value;
                                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, description: newDesc } } : n));
                                            setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, description: newDesc } } : null);
                                        }}
                                    />
                                </Flex>

                                <Box p="3" style={{ backgroundColor: 'var(--accent-2)', borderRadius: 'var(--radius-2)', border: '1px dashed var(--accent-7)' }}>
                                    <Text size="1" weight="bold" color="indigo" mb="1" as="div">AI Behavior Sample:</Text>
                                    <Text size="1" color="indigo" style={{ fontStyle: 'italic' }}>
                                        "Stage: {String(selectedNode.data?.label || 'Untitled')}. Goal: {String(selectedNode.data?.description || '(No goal set)')}"
                                    </Text>
                                </Box>
                            </Flex>
                        )}

                        {selectedEdge && (
                            <Flex direction="column" gap="3">
                                <Text size="2" color="gray">Define the explicit Logic Condition Outcome String the LLM uses to branch here.</Text>
                                <TextField.Root
                                    size="2"
                                    placeholder="e.g. Yes"
                                    value={selectedEdge.label as string || ''}
                                    onChange={(e) => {
                                        const newLabel = e.target.value;
                                        setEdges(eds => eds.map(edge => edge.id === selectedEdge.id ? {
                                            ...edge,
                                            label: newLabel,
                                            ...getEdgePillStyle()
                                        } : edge));
                                        setSelectedEdge(prev => prev ? { ...prev, label: newLabel } : null);
                                    }}
                                />
                            </Flex>
                        )}

						<AlertDialog.Root>
							<AlertDialog.Trigger>
								<Button color="red" variant="soft" mt="4">
									Delete Element
								</Button>
							</AlertDialog.Trigger>
							<AlertDialog.Content maxWidth="450px">
								<AlertDialog.Title style={{ color: '#1e293b', fontWeight: 800 }}>Delete Graph Element</AlertDialog.Title>
								<AlertDialog.Description size="2">
									Are you sure you want to remove this {selectedNode ? 'Task Node' : 'Logical Edge'}? Any connected logic paths will be severed.
								</AlertDialog.Description>
								<Flex gap="3" mt="4" justify="end">
									<AlertDialog.Cancel>
										<Button variant="soft" color="gray">Cancel</Button>
									</AlertDialog.Cancel>
									<AlertDialog.Action>
										<Button variant="solid" color="red" onClick={() => {
											if (selectedNode) setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
											if (selectedEdge) setEdges(eds => eds.filter(e => e.id !== selectedEdge.id));
											setSelectedNode(null);
											setSelectedEdge(null);
										}}>Delete Element</Button>
									</AlertDialog.Action>
								</Flex>
							</AlertDialog.Content>
						</AlertDialog.Root>
                    </Flex>
                </Card>
            )}
        </Flex>
    );
}
