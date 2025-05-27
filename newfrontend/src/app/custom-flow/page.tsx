"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Node,
  Edge,
  Connection,
  NodeMouseHandler,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NewNavbar } from "@/components/layout/NewNavbar";
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/ToastContext';
import { testRunnerApi, Flow } from '@/utils/api';

interface CustomFlow extends Flow {
  nodes: Node[];
  edges: Edge[];
  lastModified: string;
}

// Define node types
const NODE_TYPES = [
  { type: 'auth', label: 'Auth', color: '#4f46e5', icon: '🔒' },
  { type: 'navigation', label: 'Navigation', color: '#0ea5e9', icon: '🧭' },
  { type: 'click', label: 'Click', color: '#10b981', icon: '👆' },
  { type: 'input', label: 'Input', color: '#f59e0b', icon: '⌨️' },
  { type: 'assertion', label: 'Assertion', color: '#ef4444', icon: '✅' },
  { type: 'screenshot', label: 'Screenshot', color: '#8b5cf6', icon: '📷' },
  { type: 'wait', label: 'Wait', color: '#6b7280', icon: '⏱️' },
];

// Initial empty flow
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

interface SaveFlowButtonProps {
  onClick: () => void;
  loading: boolean;
}

const SaveFlowButton = ({ onClick, loading }: SaveFlowButtonProps) => (
  <Button
    onClick={onClick}
    className="flex items-center space-x-2"
    disabled={loading}
  >
    {loading ? <LoadingSpinner /> : '💾'}
    <span>Save Flow</span>
  </Button>
);

interface LoadFlowButtonProps {
  onClick: () => void;
  loading: boolean;
}

const LoadFlowButton = ({ onClick, loading }: LoadFlowButtonProps) => (
  <Button
    onClick={onClick}
    className="flex items-center space-x-2 ml-2"
    disabled={loading}
  >
    {loading ? <LoadingSpinner /> : '📂'}
    <span>Load Flow</span>
  </Button>
);

export default function CustomFlowPage() {
  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  
  // State for flow management
  const [flowName, setFlowName] = useState<string>('');
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [flows, setFlows] = useState<CustomFlow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showLoadModal, setShowLoadModal] = useState<boolean>(false);
  const [showAddNodeModal, setShowAddNodeModal] = useState<boolean>(false);
  const [customNodeTypes, setCustomNodeTypes] = useState<any[]>([]);
  const [newNodeType, setNewNodeType] = useState({ type: '', label: '', color: '#38bdf8', icon: '' });
  
  // State for node editing
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeEditor, setShowNodeEditor] = useState<boolean>(false);
  const [nodeParams, setNodeParams] = useState<Record<string, string>>({});

  // State for test execution
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState<string | null>(null);
  const [showLogPanel, setShowLogPanel] = useState<boolean>(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);
  
  // Refs
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Toast notifications
  const { showToast } = useToast();
  
  // All node types (built-in + custom)
  const allNodeTypes = [...NODE_TYPES, ...customNodeTypes];
  
  // Fetch flows on component mount
  useEffect(() => {
    fetchFlows();
  }, []);
  
  // Fetch all flows
  const fetchFlows = async () => {
    try {
      setLoading(true);
      const flowsData = await testRunnerApi.getFlows();
      setFlows(flowsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching flows:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch flows',
      });
      setLoading(false);
    }
  };
  
  // Handle connection between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
    },
    [setEdges]
  );
  
  // Save current flow
  const saveFlow = async () => {
    if (!flowName.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Please enter a flow name',
      });
      return;
    }

    try {
      setLoading(true);
      const flowData = {
        id: currentFlowId || undefined,
        name: flowName,
        nodes,
        edges,
        lastModified: new Date().toISOString(),
      };

      if (currentFlowId) {
        await testRunnerApi.updateFlow(currentFlowId, flowData);
      } else {
        const newFlow = await testRunnerApi.createFlow(flowData);
        setCurrentFlowId(newFlow.id);
      }

      showToast({
        type: 'success',
        title: 'Success',
        message: 'Flow saved successfully',
      });
      await fetchFlows();
    } catch (error) {
      console.error('Error saving flow:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save flow',
      });
    } finally {
      setLoading(false);
    }
  };

  // Load flow
  const loadFlow = async (flowId: string) => {
    try {
      setLoading(true);
      const flow = await testRunnerApi.getFlow(flowId);
      if (flow) {
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        setFlowName(flow.name);
        setCurrentFlowId(flow.id);
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Flow loaded successfully',
        });
      }
    } catch (error) {
      console.error('Error loading flow:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to load flow',
      });
    } finally {
      setLoading(false);
      setShowLoadModal(false);
    }
  };

  // Generate Playwright test code from flow
  const generateTestCode = useCallback(() => {
    const testCode = [
      `import { test, expect } from '@playwright/test';

test('${flowName}', async ({ page }) => {`,
    ];

    // Sort nodes by their position (top to bottom)
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);

    for (const node of sortedNodes) {
      const { type, params = {} } = node.data;

      switch (type) {
        case 'auth':
          testCode.push(`  // Login
  await page.fill('input[name="username"]', '${params.username || ''}');
  await page.fill('input[name="password"]', '${params.password || ''}');
  await page.click('button[type="submit"]');`);
          break;

        case 'navigation':
          testCode.push(`  // Navigate
  await page.goto('${params.url || ''}');`);
          break;

        case 'click':
          testCode.push(`  // Click element
  await page.click('${params.selector || ''}');`);
          break;

        case 'input':
          testCode.push(`  // Fill input
  await page.fill('${params.selector || ''}', '${params.text || ''}');`);
          break;

        case 'assertion':
          testCode.push(`  // Assert content
  await expect(page.locator('${params.selector || ''}')).toHaveText('${params.expectedText || ''}');`);
          break;

        case 'screenshot':
          testCode.push(`  // Take screenshot
  await page.screenshot({ path: '${params.name || 'screenshot.png'}' });`);
          break;

        case 'wait':
          testCode.push(`  // Wait
  await page.waitForTimeout(${params.time || 1000});`);
          break;
      }
    }

    testCode.push('});');
    return testCode.join('\n');
  }, [nodes, flowName]);

  // Run the test
  const runTest = async () => {
    if (!flowName) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Please enter a flow name',
      });
      return;
    }

    try {
      setTestStatus('running');
      setShowLogPanel(true);
      setTestLogs([]);

      const testCode = generateTestCode();
      
      const cleanup = testRunnerApi.socket.runTestCodeRealtime(
        testCode,
        undefined,
        {
          onLog: (log: string) => {
            setTestLogs((logs) => [...logs, log]);
          },
          onStatus: (data: { status: string; error?: string }) => {
            setTestStatus(data.status as 'running' | 'success' | 'error');
            if (data.status === 'error') {
              setTestError(data.error || 'Test failed');
            }
          },
        }
      );

      // Clean up socket listeners when component unmounts
      return () => cleanup();
    } catch (error) {
      console.error('Error running test:', error);
      setTestStatus('error');
      setTestError(error instanceof Error ? error.message : String(error));
    }
  };

  // Handle element selection
  const handleNodeLabelChange = (newLabel: string) => {
    if (selectedNode) {
      const updatedNode = {
        ...selectedNode,
        data: { ...selectedNode.data, label: newLabel }
      };
      setNodes((nds) =>
        nds.map((node) => (node.id === selectedNode.id ? updatedNode : node))
      );
      setSelectedNode(updatedNode);
    }
  };

  const onElementClick = useCallback(
    (event: React.MouseEvent, element: Node | Edge) => {
      if ('source' in element) {
        // It's an edge
        setSelectedNode(null);
        setNodeParams({});
      } else {
        // It's a node
        const node = element as Node;
        setSelectedNode(node);
        setNodeParams(node.data?.params || {});
        
        // Update node style to show selection
        setNodes(nodes => 
          nodes.map(n => ({
            ...n,
            style: {
              ...n.style,
              border: n.id === node.id ? '2px solid #3b82f6' : '2px solid transparent',
              boxShadow: n.id === node.id ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : '0 0 10px rgba(0,0,0,0.1)'
            }
          }))
        );
      }
    },
    [setNodes]
  );

  // Handle node double click for editing
  const onNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setNodeParams(node.data?.params || {});
      setShowNodeEditor(true);
    },
    []
  );

  // Update node parameters
  const updateNodeParams = () => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              params: nodeParams,
            },
          };
        }
        return node;
      })
    );

    setShowNodeEditor(false);
    setSelectedNode(null);
    showToast({
      type: 'success',
      title: 'Success',
      message: 'Node parameters updated',
    });
  };
  
  // Handle drag over for new nodes
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);
  
  // Handle drop for new nodes
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;
      
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;
      
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      
      const nodeType = allNodeTypes.find(nt => nt.type === type);
      if (!nodeType) return;
      
      const newNode = {
        id: `${type}-${Date.now()}`,
        type: 'default',
        position,
        data: { 
          label: nodeType.label,
          type: nodeType.type,
          params: {},
        },
        style: {
          background: nodeType.color || '#38bdf8',
          color: 'white',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          borderRadius: '8px',
          padding: '10px',
          border: '2px solid transparent',
          transition: 'all 0.2s ease',
        },
      };
      
      setNodes((nds) => nds.concat(newNode));
    },
    [allNodeTypes, setNodes]
  );

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <NewNavbar />
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-gray-800 bg-gray-900 p-4">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Node Types</h2>
            <div className="space-y-2">
              {NODE_TYPES.map((type) => (
                <div
                  key={type.type}
                  className="p-3 bg-gray-800 rounded-lg cursor-move hover:bg-gray-700 transition-colors border-l-4"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', type.type);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  style={{ borderLeftColor: type.color }}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <span className="text-sm text-white">{type.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Flow controls */}
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Flow name"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="w-full bg-gray-800 border-gray-700 text-white"
            />
            <div className="space-y-2">
              <SaveFlowButton onClick={saveFlow} loading={loading} />
              <LoadFlowButton onClick={() => setShowLoadModal(true)} loading={loading} />
              <Button
                onClick={runTest}
                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700"
                disabled={loading || testStatus === 'running'}
              >
                {testStatus === 'running' ? <LoadingSpinner /> : '▶️'}
                <span>Run Flow</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Flow Area */}
        <div className="flex-1 bg-gray-800">
          <div ref={reactFlowWrapper} className="h-full">
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={(_, node) => onElementClick(_, node)}
                onEdgeClick={(_, edge) => onElementClick(_, edge)}
                onNodeDoubleClick={onNodeDoubleClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                deleteKeyCode="Delete"
                selectionKeyCode="Shift"
                multiSelectionKeyCode="Control"
                snapToGrid
                snapGrid={[15, 15]}
                fitView
                className="bg-gray-800"
                defaultEdgeOptions={{
                  style: { stroke: '#6366F1' },
                  animated: true
                }}
              >
                <Controls className="bg-gray-700 border-gray-600 fill-white" />
                <MiniMap style={{ background: '#1F2937' }} className="bg-gray-700 border-gray-600" />
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={12}
                  size={1}
                  color="#4B5563"
                />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        </div>
      </div>

      {/* Load Flow Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Load Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flows.map((flow) => (
                  <div
                    key={flow.id}
                    className="flex items-center justify-between p-4 bg-gray-700 border-gray-600 rounded-lg hover:bg-gray-600 cursor-pointer"
                    onClick={() => loadFlow(flow.id)}
                  >
                    <div>
                      <h3 className="font-medium text-white">{flow.name}</h3>
                      <p className="text-sm text-gray-300">
                        Last modified: {new Date(flow.lastModified).toLocaleString()}
                      </p>
                    </div>
                    <Badge className="bg-indigo-600">
                      {flow.nodes?.length || 0} nodes
                    </Badge>
                  </div>
                ))}
                {flows.length === 0 && (
                  <p className="text-center text-gray-300">No flows found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Node Editor Modal */}
      {showNodeEditor && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Edit Node: {selectedNode?.data?.type || 'Unknown'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-white">
                <Input
                  type="text"
                  placeholder="Node label"
                  value={selectedNode?.data?.label || ''}
                  onChange={(e) => handleNodeLabelChange(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                {selectedNode?.data?.type === 'auth' && (
                  <>
                    <Input
                      type="text"
                      placeholder="Username"
                      value={nodeParams.username || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNodeParams({ ...nodeParams, username: e.target.value })
                      }
                      className="w-full bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={nodeParams.password || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNodeParams({ ...nodeParams, password: e.target.value })
                      }
                      className="w-full bg-gray-700 border-gray-600 text-white"
                    />
                  </>
                )}
                {selectedNode?.data?.type === 'navigation' && (
                  <Input
                    type="text"
                    placeholder="URL"
                    value={nodeParams.url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNodeParams({ ...nodeParams, url: e.target.value })
                    }
                    className="w-full bg-gray-700 border-gray-600 text-white"
                  />
                )}
                {selectedNode?.data?.type === 'click' && (
                  <Input
                    type="text"
                    placeholder="Selector"
                    value={nodeParams.selector || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNodeParams({ ...nodeParams, selector: e.target.value })
                    }
                    className="w-full bg-gray-700 border-gray-600 text-white"
                  />
                )}
                {selectedNode?.data?.type === 'input' && (
                  <>
                    <Input
                      type="text"
                      placeholder="Selector"
                      value={nodeParams.selector || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNodeParams({ ...nodeParams, selector: e.target.value })
                      }
                      className="w-full bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      type="text"
                      placeholder="Text to type"
                      value={nodeParams.text || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNodeParams({ ...nodeParams, text: e.target.value })
                      }
                      className="w-full bg-gray-700 border-gray-600 text-white"
                    />
                  </>
                )}
                {selectedNode?.data?.type === 'assertion' && (
                  <>
                    <Input
                      type="text"
                      placeholder="Selector"
                      value={nodeParams.selector || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNodeParams({ ...nodeParams, selector: e.target.value })
                      }
                      className="w-full bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      type="text"
                      placeholder="Expected text"
                      value={nodeParams.expectedText || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNodeParams({ ...nodeParams, expectedText: e.target.value })
                      }
                      className="w-full bg-gray-700 border-gray-600 text-white"
                    />
                  </>
                )}
                {selectedNode?.data?.type === 'screenshot' && (
                  <Input
                    type="text"
                    placeholder="Screenshot name"
                    value={nodeParams.name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNodeParams({ ...nodeParams, name: e.target.value })
                    }
                    className="w-full bg-gray-700 border-gray-600 text-white"
                  />
                )}
                {selectedNode?.data?.type === 'wait' && (
                  <Input
                    type="number"
                    placeholder="Wait time (ms)"
                    value={nodeParams.time || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNodeParams({ ...nodeParams, time: e.target.value })
                    }
                    className="w-full bg-gray-700 border-gray-600 text-white"
                  />
                )}
                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => {
                      setShowNodeEditor(false);
                      setSelectedNode(null);
                    }}
                    variant="outline"
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateNodeParams}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Save
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    {/* Node Editor Modal */}
    {showNodeEditor && selectedNode && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-lg bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Edit Node: {selectedNode?.data?.type || 'Unknown'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-white">
              <Input
                type="text"
                placeholder="Node label"
                value={selectedNode?.data?.label || ''}
                onChange={(e) => handleNodeLabelChange(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
              {selectedNode?.data?.type === 'auth' && (
                <>
                  <Input
                    type="text"
                    placeholder="Username"
                    value={nodeParams.username || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNodeParams({ ...nodeParams, username: e.target.value })
                    }
                    className="w-full bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={nodeParams.password || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNodeParams({ ...nodeParams, password: e.target.value })
                    }
                    className="w-full bg-gray-700 border-gray-600 text-white"
                  />
                </>
              )}
              {selectedNode?.data?.type === 'navigation' && (
                <Input
                  type="text"
                  placeholder="URL"
                  value={nodeParams.url || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNodeParams({ ...nodeParams, url: e.target.value })
                  }
                  className="w-full bg-gray-700 border-gray-600 text-white"
                />
              )}
              {selectedNode?.data?.type === 'click' && (
                <Input
                  type="text"
                  placeholder="Selector"
                  value={nodeParams.selector || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNodeParams({ ...nodeParams, selector: e.target.value })
                  }
                  className="w-full bg-gray-700 border-gray-600 text-white"
                />
              )}
              {selectedNode?.data?.type === 'input' && (
                <>
                  <Input
                    type="text"
                    placeholder="Selector"
                    value={nodeParams.selector || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNodeParams({ ...nodeParams, selector: e.target.value })
                    }
                    className="w-full bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    type="text"
                    placeholder="Text to type"
                    value={nodeParams.text || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNodeParams({ ...nodeParams, text: e.target.value })
                    }
                    className="w-full bg-gray-700 border-gray-600 text-white"
                  />
                </>
              )}
              {selectedNode?.data?.type === 'assertion' && (
                <>
                  <Input
                    type="text"
                    placeholder="Selector"
                    value={nodeParams.selector || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNodeParams({ ...nodeParams, selector: e.target.value })
                    }
                    className="w-full bg-gray-700 border-gray-600 text-white"
                  />
                  <Input
                    type="text"
                    placeholder="Expected text"
                    value={nodeParams.expectedText || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNodeParams({ ...nodeParams, expectedText: e.target.value })
                    }
                    className="w-full bg-gray-700 border-gray-600 text-white"
                  />
                </>
              )}
              {selectedNode?.data?.type === 'screenshot' && (
                <Input
                  type="text"
                  placeholder="Screenshot name"
                  value={nodeParams.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNodeParams({ ...nodeParams, name: e.target.value })
                  }
                  className="w-full bg-gray-700 border-gray-600 text-white"
                />
              )}
              {selectedNode?.data?.type === 'wait' && (
                <Input
                  type="number"
                  placeholder="Wait time (ms)"
                  value={nodeParams.time || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNodeParams({ ...nodeParams, time: e.target.value })
                  }
                  className="w-full bg-gray-700 border-gray-600 text-white"
                />
              )}
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => {
                    setShowNodeEditor(false);
                    setSelectedNode(null);
                  }}
                  variant="outline"
                  className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateNodeParams}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Save
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

    {/* Test Log Panel */}
    {showLogPanel && (
      <div className="fixed bottom-0 left-0 right-0 h-1/3 bg-gray-800 border-t border-gray-700 shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-white">Test Logs</h3>
            {testStatus === 'running' && (
              <span className="text-yellow-400">(Running...)</span>
            )}
            {testStatus === 'success' && (
              <span className="text-green-400">(Passed)</span>
            )}
            {testStatus === 'error' && (
              <span className="text-red-400">(Failed)</span>
            )}
          </div>
          <Button
            onClick={() => {
              setShowLogPanel(false);
              setTestStatus('idle');
              setTestError(null);
              setTestLogs([]);
            }}
            variant="outline"
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            size="sm"
          >
            Close
          </Button>
          </div>
          <div className="p-4 h-[calc(100%-4rem)] overflow-auto">
            <pre className="whitespace-pre-wrap text-white font-mono text-sm">{testLogs}</pre>
            {testError && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded text-red-200">
                {testError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
