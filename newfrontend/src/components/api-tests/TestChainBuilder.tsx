'use client';

import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiArrowDown, FiPlay, FiEdit, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { TestChain, TestChainStep, Collection, APIRequest, KeyValuePair } from './types';

interface TestChainBuilderProps {
  collections: Collection[];
  testChains: TestChain[];
  setTestChains: (testChains: TestChain[]) => void;
  onRunChain: (chainId: string) => Promise<void>;
}

export default function TestChainBuilder({ 
  collections, 
  testChains, 
  setTestChains, 
  onRunChain 
}: TestChainBuilderProps) {
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [isAddingChain, setIsAddingChain] = useState(false);
  const [newChainName, setNewChainName] = useState('');
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [newStepName, setNewStepName] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  
  const selectedChain = selectedChainId ? testChains.find(chain => chain.id === selectedChainId) : null;
  
  // Flatten all requests from all collections for easier selection
  const allRequests = collections.flatMap(collection => {
    return collection.requests.map(request => ({
      ...request,
      collectionName: collection.name
    }));
  });

  const handleAddChain = () => {
    if (!newChainName.trim()) {
      alert('Please enter a name for the test chain');
      return;
    }
    
    const newChain: TestChain = {
      id: `chain_${Date.now()}`,
      name: newChainName.trim(),
      steps: [],
      variables: []
    };
    
    setTestChains([...testChains, newChain]);
    setSelectedChainId(newChain.id);
    setIsAddingChain(false);
    setNewChainName('');
  };
  
  const handleAddStep = () => {
    if (!selectedChainId) return;
    if (!newStepName.trim()) {
      alert('Please enter a name for the step');
      return;
    }
    if (!selectedRequestId) {
      alert('Please select a request for the step');
      return;
    }
    
    const newStep: TestChainStep = {
      id: `step_${Date.now()}`,
      name: newStepName.trim(),
      requestId: selectedRequestId,
      extractions: [],
      assertions: [],
      condition: { type: 'always' }
    };
    
    // Create a properly typed updated chain array
    const updatedChains: TestChain[] = testChains.map(chain => {
      if (chain.id === selectedChainId) {
        // Create a properly typed steps array
        const updatedSteps: TestChainStep[] = [...chain.steps, newStep];
        
        return {
          ...chain,
          steps: updatedSteps
        };
      }
      return chain;
    });
    
    setTestChains(updatedChains);
    
    setIsAddingStep(false);
    setNewStepName('');
    setSelectedRequestId(null);
    
    // Auto-expand the new step
    setExpandedSteps(prev => ({ ...prev, [newStep.id]: true }));
  };
  
  const handleRemoveChain = (chainId: string) => {
    // Create a properly typed filtered array
    const filteredChains: TestChain[] = testChains.filter(chain => chain.id !== chainId);
    setTestChains(filteredChains);
    
    if (selectedChainId === chainId) {
      setSelectedChainId(null);
    }
  };
  
  const handleRemoveStep = (chainId: string, stepId: string) => {
    // Create a properly typed updated chain array
    const updatedChains: TestChain[] = testChains.map(chain => {
      if (chain.id === chainId) {
        // Create a properly typed steps array
        const filteredSteps: TestChainStep[] = chain.steps.filter(step => step.id !== stepId);
        
        return {
          ...chain,
          steps: filteredSteps
        };
      }
      return chain;
    });
    
    setTestChains(updatedChains);
  };
  
  const handleAddExtraction = (chainId: string, stepId: string) => {
    // Create a properly typed updated chain array
    const updatedChains: TestChain[] = testChains.map(chain => {
      if (chain.id === chainId) {
        // Create a properly typed steps array
        const updatedSteps: TestChainStep[] = chain.steps.map(step => {
          if (step.id === stepId) {
            return {
              ...step,
              extractions: [
                ...step.extractions,
                { source: 'response' as const, path: '', variable: '' }
              ]
            } as TestChainStep;
          }
          return step;
        });
        
        return {
          ...chain,
          steps: updatedSteps
        };
      }
      return chain;
    });
    
    setTestChains(updatedChains);
  };
  
  const handleUpdateExtraction = (
    chainId: string, 
    stepId: string, 
    index: number, 
    field: keyof TestChainStep['extractions'][0], 
    value: string
  ) => {
    // Create a properly typed updated chain array
    const updatedChains: TestChain[] = testChains.map(chain => {
      if (chain.id === chainId) {
        // Create a properly typed steps array
        const updatedSteps: TestChainStep[] = chain.steps.map(step => {
          if (step.id === stepId) {
            // Create a properly typed extractions array
            const updatedExtractions = step.extractions.map((extraction, i) => {
              if (i === index) {
                // Need to handle the source field specially since it's a union type
                if (field === 'source') {
                  return { 
                    ...extraction, 
                    source: value as 'response' | 'headers' | 'status' 
                  };
                }
                return { ...extraction, [field]: value };
              }
              return extraction;
            });
            
            return {
              ...step,
              extractions: updatedExtractions
            } as TestChainStep;
          }
          return step;
        });
        
        return {
          ...chain,
          steps: updatedSteps
        };
      }
      return chain;
    });
    
    setTestChains(updatedChains);
  };
  
  const handleRemoveExtraction = (chainId: string, stepId: string, index: number) => {
    // Create a properly typed updated chain array
    const updatedChains: TestChain[] = testChains.map(chain => {
      if (chain.id === chainId) {
        // Create a properly typed steps array
        const updatedSteps: TestChainStep[] = chain.steps.map(step => {
          if (step.id === stepId) {
            return {
              ...step,
              extractions: step.extractions.filter((_, i) => i !== index)
            } as TestChainStep;
          }
          return step;
        });
        
        return {
          ...chain,
          steps: updatedSteps
        };
      }
      return chain;
    });
    
    setTestChains(updatedChains);
  };
  
  const handleAddVariable = (chainId: string) => {
    // Create a properly typed updated chain array
    const updatedChains: TestChain[] = testChains.map(chain => {
      if (chain.id === chainId) {
        // Create a properly typed variables array
        const updatedVariables: KeyValuePair[] = [
          ...chain.variables,
          { key: '', value: '', enabled: true, isSecret: false }
        ];
        
        return {
          ...chain,
          variables: updatedVariables
        };
      }
      return chain;
    });
    
    setTestChains(updatedChains);
  };
  
  const handleUpdateVariable = (
    chainId: string, 
    index: number, 
    field: keyof KeyValuePair, 
    value: string | boolean
  ) => {
    // Create a properly typed updated chain array
    const updatedChains: TestChain[] = testChains.map(chain => {
      if (chain.id === chainId) {
        // Create a properly typed variables array
        const updatedVariables: KeyValuePair[] = chain.variables.map((variable, i) => {
          if (i === index) {
            return { ...variable, [field]: value };
          }
          return variable;
        });
        
        return {
          ...chain,
          variables: updatedVariables
        };
      }
      return chain;
    });
    
    setTestChains(updatedChains);
  };
  
  const handleRemoveVariable = (chainId: string, index: number) => {
    // Create a properly typed updated chain array
    const updatedChains: TestChain[] = testChains.map(chain => {
      if (chain.id === chainId) {
        // Create a properly typed variables array
        const filteredVariables: KeyValuePair[] = chain.variables.filter((_, i) => i !== index);
        
        return {
          ...chain,
          variables: filteredVariables
        };
      }
      return chain;
    });
    
    setTestChains(updatedChains);
  };
  
  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };
  
  const getRequestById = (requestId: string): APIRequest | undefined => {
    return allRequests.find(request => request.id === requestId);
  };
  
  const getRequestNameById = (requestId: string): string => {
    const request = getRequestById(requestId);
    return request ? `${request.method} ${request.name}` : 'Unknown Request';
  };
  
  const getRequestCollectionById = (requestId: string): string => {
    const request = allRequests.find(request => request.id === requestId);
    return request ? (request as any).collectionName || 'Unknown Collection' : 'Unknown Collection';
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Chain List */}
      <div className="w-1/3 pr-4 border-r border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Test Chains</h3>
          <button
            onClick={() => setIsAddingChain(true)}
            className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors"
          >
            <FiPlus className="mr-1" />
            New Chain
          </button>
        </div>
        
        {testChains.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            No test chains created yet
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {testChains.map(chain => (
              <div 
                key={chain.id}
                className={`p-3 rounded-md cursor-pointer ${
                  selectedChainId === chain.id ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex-grow"
                    onClick={() => setSelectedChainId(chain.id)}
                  >
                    <div className="text-white font-medium">{chain.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {chain.steps.length} {chain.steps.length === 1 ? 'step' : 'steps'}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      onClick={() => onRunChain(chain.id)}
                      className="mr-2 text-green-400 hover:text-green-300"
                      title="Run Chain"
                    >
                      <FiPlay />
                    </button>
                    <button
                      onClick={() => handleRemoveChain(chain.id)}
                      className="text-red-400 hover:text-red-300"
                      title="Delete Chain"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Chain Form */}
        {isAddingChain && (
          <div className="mt-4 p-3 bg-gray-700 rounded-md">
            <h4 className="text-sm font-medium text-white mb-2">New Test Chain</h4>
            <input
              type="text"
              value={newChainName}
              onChange={(e) => setNewChainName(e.target.value)}
              placeholder="Chain Name"
              className="w-full bg-gray-600 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAddingChain(false)}
                className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleAddChain}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Right Panel - Chain Details */}
      <div className="w-2/3 pl-4">
        {selectedChain ? (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">{selectedChain.name}</h3>
              <button
                onClick={() => setIsAddingStep(true)}
                className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors"
              >
                <FiPlus className="mr-1" />
                Add Step
              </button>
            </div>
            
            {/* Steps */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Steps</h4>
              {selectedChain.steps.length === 0 ? (
                <div className="text-gray-400 text-center py-4 bg-gray-800 rounded-md">
                  No steps added yet
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedChain.steps.map((step, index) => (
                    <div key={step.id} className="bg-gray-800 rounded-md overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-3 cursor-pointer"
                        onClick={() => toggleStepExpansion(step.id)}
                      >
                        <div className="flex items-center">
                          <div className="bg-gray-700 text-gray-300 w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-white font-medium">{step.name}</div>
                            <div className="text-xs text-gray-400">
                              {getRequestNameById(step.requestId)} • {getRequestCollectionById(step.requestId)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {expandedSteps[step.id] ? <FiChevronUp /> : <FiChevronDown />}
                        </div>
                      </div>
                      
                      {expandedSteps[step.id] && (
                        <div className="p-3 border-t border-gray-700">
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="text-sm font-medium text-white">Variable Extractions</h5>
                              <button
                                onClick={() => handleAddExtraction(selectedChain.id, step.id)}
                                className="text-xs px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600"
                              >
                                <FiPlus className="inline mr-1" />
                                Add
                              </button>
                            </div>
                            
                            {step.extractions.length === 0 ? (
                              <div className="text-gray-400 text-xs py-2">
                                No extractions configured
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {step.extractions.map((extraction, extractionIndex) => (
                                  <div key={extractionIndex} className="flex items-center space-x-2 bg-gray-700 p-2 rounded-md">
                                    <select
                                      value={extraction.source}
                                      onChange={(e) => handleUpdateExtraction(
                                        selectedChain.id, 
                                        step.id, 
                                        extractionIndex, 
                                        'source', 
                                        e.target.value as any
                                      )}
                                      className="bg-gray-600 text-white text-xs px-2 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                      <option value="response">Response Body</option>
                                      <option value="headers">Headers</option>
                                      <option value="status">Status</option>
                                    </select>
                                    
                                    <input
                                      type="text"
                                      value={extraction.path}
                                      onChange={(e) => handleUpdateExtraction(
                                        selectedChain.id, 
                                        step.id, 
                                        extractionIndex, 
                                        'path', 
                                        e.target.value
                                      )}
                                      placeholder={extraction.source === 'response' ? '$.data.id' : extraction.source === 'headers' ? 'Content-Type' : ''}
                                      className="flex-grow bg-gray-600 text-white text-xs px-2 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    
                                    <span className="text-gray-400 text-xs">as</span>
                                    
                                    <input
                                      type="text"
                                      value={extraction.variable}
                                      onChange={(e) => handleUpdateExtraction(
                                        selectedChain.id, 
                                        step.id, 
                                        extractionIndex, 
                                        'variable', 
                                        e.target.value
                                      )}
                                      placeholder="variableName"
                                      className="w-32 bg-gray-600 text-white text-xs px-2 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    
                                    <button
                                      onClick={() => handleRemoveExtraction(selectedChain.id, step.id, extractionIndex)}
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      <FiTrash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-between mt-3">
                            <select
                              value={step.condition?.type || 'always'}
                              onChange={(e) => {
                                const value = e.target.value as 'always' | 'onSuccess' | 'onFailure' | 'expression';
                                
                                // Create a properly typed updated chain
                                const updatedChains: TestChain[] = testChains.map(chain => {
                                  if (chain.id === selectedChain.id) {
                                    // Create a properly typed steps array
                                    const updatedSteps: TestChainStep[] = chain.steps.map(s => {
                                      if (s.id === step.id) {
                                        return { 
                                          ...s, 
                                          condition: { 
                                            type: value,
                                            expression: (s.condition?.expression || '')
                                          } 
                                        } as TestChainStep;
                                      }
                                      return s;
                                    });
                                    
                                    return {
                                      ...chain,
                                      steps: updatedSteps
                                    };
                                  }
                                  return chain;
                                });
                                
                                setTestChains(updatedChains);
                              }}
                              className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="always">Always Run Next</option>
                              <option value="onSuccess">Run Next Only On Success</option>
                              <option value="onFailure">Run Next Only On Failure</option>
                              <option value="expression">Custom Condition</option>
                            </select>
                            
                            <button
                              onClick={() => handleRemoveStep(selectedChain.id, step.id)}
                              className="text-xs px-2 py-1 bg-red-900 text-red-300 rounded hover:bg-red-800"
                            >
                              <FiTrash2 className="inline mr-1" />
                              Remove Step
                            </button>
                          </div>
                          
                          {step.condition?.type === 'expression' && (
                            <div className="mt-2">
                              <input
                                type="text"
                                value={step.condition.expression || ''}
                                onChange={(e) => {
                                  // Create a properly typed updated chain
                                  const updatedChains: TestChain[] = testChains.map(chain => {
                                    if (chain.id === selectedChain.id) {
                                      // Create a properly typed steps array
                                      const updatedSteps: TestChainStep[] = chain.steps.map(s => {
                                        if (s.id === step.id) {
                                          return { 
                                            ...s, 
                                            condition: { 
                                              type: s.condition?.type || 'always',
                                              expression: e.target.value 
                                            } 
                                          } as TestChainStep;
                                        }
                                        return s;
                                      });
                                      
                                      return {
                                        ...chain,
                                        steps: updatedSteps
                                      };
                                    }
                                    return chain;
                                  });
                                  
                                  setTestChains(updatedChains);
                                }}
                                placeholder="response.status === 200 && variables.userId"
                                className="w-full bg-gray-600 text-white text-xs px-2 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Chain Variables */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-white">Chain Variables</h4>
                <button
                  onClick={() => handleAddVariable(selectedChain.id)}
                  className="text-xs px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600"
                >
                  <FiPlus className="inline mr-1" />
                  Add
                </button>
              </div>
              
              {selectedChain.variables.length === 0 ? (
                <div className="text-gray-400 text-center py-4 bg-gray-800 rounded-md">
                  No variables added yet
                </div>
              ) : (
                <div className="bg-gray-800 rounded-md p-3">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 mb-2">
                    <div className="col-span-1">Enabled</div>
                    <div className="col-span-4">Key</div>
                    <div className="col-span-6">Value</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {selectedChain.variables.map((variable, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center mb-2">
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={variable.enabled}
                          onChange={(e) => handleUpdateVariable(
                            selectedChain.id,
                            index,
                            'enabled',
                            e.target.checked
                          )}
                          className="h-4 w-4"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={variable.key}
                          onChange={(e) => handleUpdateVariable(
                            selectedChain.id,
                            index,
                            'key',
                            e.target.value
                          )}
                          placeholder="Variable Name"
                          className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={variable.value}
                          onChange={(e) => handleUpdateVariable(
                            selectedChain.id,
                            index,
                            'value',
                            e.target.value
                          )}
                          placeholder="Initial Value"
                          className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => handleRemoveVariable(selectedChain.id, index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-lg mb-2">No test chain selected</p>
            <p className="text-sm">Select a test chain from the list or create a new one</p>
          </div>
        )}
      </div>
      
      {/* Add Step Modal */}
      {isAddingStep && selectedChain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add Step to {selectedChain.name}</h2>
              <button
                onClick={() => {
                  setIsAddingStep(false);
                  setNewStepName('');
                  setSelectedRequestId(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Step Name</label>
                <input
                  type="text"
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                  placeholder="Step Name"
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">Request</label>
                <select
                  value={selectedRequestId || ''}
                  onChange={(e) => setSelectedRequestId(e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a request</option>
                  {collections.map(collection => (
                    <optgroup key={collection.id} label={collection.name}>
                      {collection.requests.map(request => (
                        <option key={request.id} value={request.id}>
                          {request.method} {request.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsAddingStep(false);
                  setNewStepName('');
                  setSelectedRequestId(null);
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStep}
                disabled={!newStepName.trim() || !selectedRequestId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
