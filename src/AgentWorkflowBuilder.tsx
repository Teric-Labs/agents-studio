import React, { useCallback, useState } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    BackgroundVariant,
    Panel
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, Flex, Text, Button, Box, Heading, TextField, TextArea, DropdownMenu } from '@radix-ui/themes';
import { Plus, Route, Activity, HandMetal, Settings2 } from 'lucide-react';

const initialNodes: Node[] = [
    {
        id: 'start',
        type: 'input',
        data: { label: 'Start Session' },
        position: { x: 250, y: 50 },
        style: { backgroundColor: 'var(--green-3)', borderColor: 'var(--green-8)', color: 'var(--green-11)', fontWeight: 'bold', padding: '10px 20px', borderRadius: '8px' },
    }
];

const initialEdges: Edge[] = [];

// We removed abstract Condition shapes since routing is handled via Edge Labels between regular generic Task blocks.
const nodeTypes = {};

interface AgentWorkflowBuilderProps {
    initialNodesData?: any;
    onSaveData?: (data: any) => void;
}

export function AgentWorkflowBuilder({ initialNodesData, onSaveData }: AgentWorkflowBuilderProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesData?.nodes || initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialNodesData?.edges || initialEdges);

    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

    // Support Live Reloads when the user clicks / refreshes an existing Agent model!
    React.useEffect(() => {
        if (initialNodesData?.nodes && nodes.length === 1 && nodes[0].id === 'start') {
            setNodes(initialNodesData.nodes);
        }
        if (initialNodesData?.edges && edges.length === 0) {
            setEdges(initialNodesData.edges);
        }
    }, [initialNodesData, setNodes, setEdges, nodes.length, edges.length]);

    // Vapi-style Auto-Save Pipeline: Funnel live Map changes instantly to main Agent Form Payload
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
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'var(--accent-9)', strokeWidth: 2 } }, eds)),
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
                        return { ...e, label: newLabel, style: { stroke: 'var(--accent-9)', strokeWidth: 2 }, animated: true };
                    }
                    return e;
                })
            );
        }
    }, [setEdges]);

    const addNewTask = (type: 'collect' | 'question' | 'handoff') => {
        const defaultLabel = type === 'collect' ? 'Collect Information' : type === 'handoff' ? 'Human Handoff' : 'Logical Evaluation Step';

        const newNode: Node = {
            id: `task_${Date.now()}`,
            type: 'default',
            position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
            data: { label: defaultLabel },
            style: {
                backgroundColor: type === 'handoff' ? 'var(--orange-3)' : type === 'question' ? 'var(--purple-3)' : 'var(--blue-3)',
                borderColor: type === 'handoff' ? 'var(--orange-8)' : type === 'question' ? 'var(--purple-8)' : 'var(--blue-8)',
                padding: '10px 20px',
                borderRadius: '8px',
                minWidth: '150px',
                textAlign: 'center'
            }
        };
        setNodes((nds) => nds.concat(newNode));
    };

    return (
        <Flex gap="4" style={{ width: '100%', height: '600px' }}>
            {/* Main Interactive Map */}
            <Box style={{ flexGrow: 1, border: '1px solid var(--gray-5)', borderRadius: 'var(--radius-4)', overflow: 'hidden', position: 'relative' }}>
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
                    fitView
                >
                    <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="var(--gray-a6)" />
                    <Controls />
                    <MiniMap nodeColor={(n) => {
                        if (n.type === 'input') return 'var(--green-9)';
                        if (n.type === 'output') return 'var(--red-9)';
                        return 'var(--blue-9)';
                    }} />

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
                                <Text size="2" color="gray">Modify the exact step-instructions the Agent will obey when hitting this element.</Text>
                                <TextArea
                                    size="2"
                                    placeholder="e.g. Ask user for email"
                                    value={selectedNode.data?.label as string || ''}
                                    style={{ height: '150px' }}
                                    onChange={(e) => {
                                        const newLabel = e.target.value;
                                        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: newLabel } } : n));
                                        setSelectedNode(prev => prev ? { ...prev, data: { ...prev.data, label: newLabel } } : null);
                                    }}
                                />
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
                                        setEdges(eds => eds.map(edge => edge.id === selectedEdge.id ? { ...edge, label: newLabel, style: { stroke: 'var(--accent-9)', strokeWidth: 2 }, animated: true } : edge));
                                        setSelectedEdge(prev => prev ? { ...prev, label: newLabel } : null);
                                    }}
                                />
                            </Flex>
                        )}

                        <Button color="red" variant="soft" mt="4" onClick={() => {
                            if (selectedNode) setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
                            if (selectedEdge) setEdges(eds => eds.filter(e => e.id !== selectedEdge.id));
                            setSelectedNode(null);
                            setSelectedEdge(null);
                        }}>
                            Delete Element
                        </Button>
                    </Flex>
                </Card>
            )}
        </Flex>
    );
}
