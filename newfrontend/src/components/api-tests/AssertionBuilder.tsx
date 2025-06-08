'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiCheck, FiX, FiCode, FiFileText } from 'react-icons/fi';
import { validateSchema, createSchemaFromExample } from './utils/validation';

interface KeyValuePair {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

interface APIResponse {
  status: number;
  statusText: string;
  headers: KeyValuePair[];
  body: any;
  time: number;
  size: number;
}

interface Assertion {
  id: string;
  type: 'status' | 'jsonPath' | 'schema' | 'dataType' | 'responseTime' | 'header' | 'custom';
  enabled: boolean;
  name: string;
  condition: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'exists' | 'notExists' | 'matches' | 'in';
  expected?: any;
  path?: string;
  actual?: any;
  passed?: boolean;
  error?: string;
  headerName?: string;
  value?: string;
}

interface AssertionBuilderProps {
  response: APIResponse | null;
  assertions: Assertion[];
  setAssertions: (assertions: Assertion[]) => void;
  onRunAssertions: () => void;
}

export default function AssertionBuilder({ response, assertions, setAssertions, onRunAssertions }: AssertionBuilderProps) {
  const [selectedAssertion, setSelectedAssertion] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssertionType, setNewAssertionType] = useState<Assertion['type']>('status');
  const [newAssertionName, setNewAssertionName] = useState('');
  const [newAssertionCondition, setNewAssertionCondition] = useState<Assertion['condition']>('equals');
  const [newAssertionExpected, setNewAssertionExpected] = useState('');
  const [newAssertionPath, setNewAssertionPath] = useState('');
  
  // Reset selected assertion if it's removed
  useEffect(() => {
    if (selectedAssertion && !assertions.find(a => a.id === selectedAssertion)) {
      setSelectedAssertion(assertions.length > 0 ? assertions[0].id : null);
    }
  }, [assertions, selectedAssertion]);
  
  const handleAddAssertion = () => {
    if (!newAssertionName.trim()) {
      alert('Please enter a name for the assertion');
      return;
    }
    
    if (newAssertionType === 'jsonPath' && !newAssertionPath.trim()) {
      alert('Please enter a JSON path');
      return;
    }
    
    if (['equals', 'notEquals', 'contains', 'notContains', 'greaterThan', 'lessThan', 'matches'].includes(newAssertionCondition) && !newAssertionExpected.trim()) {
      alert('Please enter an expected value');
      return;
    }
    
    const newAssertion: Assertion = {
      id: `assertion_${Date.now()}`,
      type: newAssertionType,
      enabled: true,
      name: newAssertionName.trim(),
      condition: newAssertionCondition,
      expected: newAssertionExpected.trim(),
      path: newAssertionPath.trim()
    };
    
    setAssertions([...assertions, newAssertion]);
    setSelectedAssertion(newAssertion.id);
    setShowAddModal(false);
    resetNewAssertionForm();
  };
  
  const resetNewAssertionForm = () => {
    setNewAssertionType('status');
    setNewAssertionName('');
    setNewAssertionCondition('equals');
    setNewAssertionExpected('');
    setNewAssertionPath('');
  };
  
  const handleRemoveAssertion = (id: string) => {
    setAssertions(assertions.filter(assertion => assertion.id !== id));
    if (selectedAssertion === id) {
      setSelectedAssertion(assertions.length > 1 ? assertions[0].id : null);
    }
  };
  
  const handleAssertionToggle = (id: string) => {
    setAssertions(assertions.map(assertion => 
      assertion.id === id ? { ...assertion, enabled: !assertion.enabled } : assertion
    ));
  };
  
  const handleAssertionChange = (id: string, field: keyof Assertion, value: any) => {
    setAssertions(assertions.map(assertion => 
      assertion.id === id ? { ...assertion, [field]: value } : assertion
    ));
  };
  
  const handleGenerateSchemaFromResponse = () => {
    if (!response || !response.body) {
      alert('No response body to generate schema from');
      return;
    }
    
    try {
      const responseBody = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      const schema = createSchemaFromExample(responseBody);
      
      // Find the selected assertion and update its expected value with the schema
      if (selectedAssertion) {
        setAssertions(assertions.map(assertion => 
          assertion.id === selectedAssertion 
            ? { ...assertion, expected: JSON.stringify(schema, null, 2) } 
            : assertion
        ));
      }
    } catch (error) {
      alert('Error generating schema: ' + (error instanceof Error ? error.message : String(error)));
    }
  };
  
  const getAssertionTypeLabel = (type: Assertion['type']) => {
    switch (type) {
      case 'status': return 'Status Code';
      case 'jsonPath': return 'JSON Path';
      case 'schema': return 'Schema Validation';
      case 'dataType': return 'Data Type';
      case 'responseTime': return 'Response Time';
      case 'header': return 'Header';
      case 'custom': return 'Custom';
      default: return type;
    }
  };
  
  const getConditionOptions = (type: Assertion['type']) => {
    switch (type) {
      case 'status':
      case 'responseTime':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'notEquals', label: 'Not Equals' },
          { value: 'greaterThan', label: 'Greater Than' },
          { value: 'lessThan', label: 'Less Than' }
        ];
      case 'jsonPath':
      case 'header':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'notEquals', label: 'Not Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'notContains', label: 'Not Contains' },
          { value: 'exists', label: 'Exists' },
          { value: 'notExists', label: 'Not Exists' },
          { value: 'matches', label: 'Matches Regex' }
        ];
      case 'schema':
        return [
          { value: 'equals', label: 'Validates Against Schema' }
        ];
      case 'dataType':
        return [
          { value: 'equals', label: 'Is Type' }
        ];
      case 'custom':
        return [
          { value: 'equals', label: 'Custom Evaluation' }
        ];
      default:
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'notEquals', label: 'Not Equals' }
        ];
    }
  };
  
  const getAssertionStatusColor = (assertion: Assertion) => {
    if (assertion.passed === undefined) return 'bg-gray-700';
    return assertion.passed ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300';
  };
  
  const getAssertionStatusText = (assertion: Assertion) => {
    if (assertion.passed === undefined) return 'Not Run';
    return assertion.passed ? 'PASSED' : 'FAILED';
  };

  return (
    <div className="flex h-full">
      {/* Assertions List */}
      <div className="w-1/3 pr-4 border-r border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Assertions</h3>
          <div className="flex">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors mr-2"
            >
              <FiPlus className="mr-1" />
              Add
            </button>
            <button
              onClick={onRunAssertions}
              disabled={!response || assertions.length === 0}
              className="flex items-center text-sm px-2 py-1 bg-green-700 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiCheck className="mr-1" />
              Run All
            </button>
          </div>
        </div>
        
        {assertions.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            No assertions added yet
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {assertions.map(assertion => (
              <div 
                key={assertion.id}
                onClick={() => setSelectedAssertion(assertion.id)}
                className={`p-3 rounded-md cursor-pointer ${
                  selectedAssertion === assertion.id ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={assertion.enabled}
                      onChange={() => handleAssertionToggle(assertion.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mr-2"
                    />
                    <div>
                      <div className="text-white font-medium">{assertion.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {getAssertionTypeLabel(assertion.type)}
                        {assertion.type === 'jsonPath' && assertion.path && (
                          <span className="ml-1">({assertion.path})</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getAssertionStatusColor(assertion)}`}>
                      {getAssertionStatusText(assertion)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAssertion(assertion.id);
                      }}
                      className="ml-2 text-red-400 hover:text-red-300"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Assertion Editor */}
      <div className="w-2/3 pl-4">
        {selectedAssertion ? (
          <>
            {assertions.filter(assertion => assertion.id === selectedAssertion).map(assertion => (
              <div key={assertion.id} className="h-full flex flex-col">
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={assertion.name}
                    onChange={(e) => handleAssertionChange(assertion.id, 'name', e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">Type</label>
                  <select
                    value={assertion.type}
                    onChange={(e) => handleAssertionChange(assertion.id, 'type', e.target.value as Assertion['type'])}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="status">Status Code</option>
                    <option value="jsonPath">JSON Path</option>
                    <option value="schema">Schema Validation</option>
                    <option value="dataType">Data Type</option>
                    <option value="responseTime">Response Time</option>
                    <option value="header">Header</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                {assertion.type === 'jsonPath' && (
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-1">JSON Path</label>
                    <input
                      type="text"
                      value={assertion.path || ''}
                      onChange={(e) => handleAssertionChange(assertion.id, 'path', e.target.value)}
                      placeholder="$.data.items[0].id"
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Use JSONPath syntax to extract values from the response body
                    </p>
                  </div>
                )}
                
                {assertion.type === 'header' && (
                  <div className="mb-4">
                    <label className="block text-gray-300 mb-1">Header Name</label>
                    <input
                      type="text"
                      value={assertion.path || ''}
                      onChange={(e) => handleAssertionChange(assertion.id, 'path', e.target.value)}
                      placeholder="Content-Type"
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <label className="block text-gray-300 mb-1">Condition</label>
                  <select
                    value={assertion.condition}
                    onChange={(e) => handleAssertionChange(assertion.id, 'condition', e.target.value as Assertion['condition'])}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getConditionOptions(assertion.type).map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                {!['exists', 'notExists'].includes(assertion.condition) && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <label className="block text-gray-300 mb-1">Expected Value</label>
                      {assertion.type === 'schema' && (
                        <button
                          onClick={handleGenerateSchemaFromResponse}
                          disabled={!response}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Generate from Response
                        </button>
                      )}
                    </div>
                    {assertion.type === 'schema' ? (
                      <textarea
                        value={assertion.expected || ''}
                        onChange={(e) => handleAssertionChange(assertion.id, 'expected', e.target.value)}
                        placeholder="Paste JSON Schema here"
                        className="w-full h-40 bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                    ) : assertion.type === 'dataType' ? (
                      <select
                        value={assertion.expected || ''}
                        onChange={(e) => handleAssertionChange(assertion.id, 'expected', e.target.value)}
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a type</option>
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="integer">Integer</option>
                        <option value="boolean">Boolean</option>
                        <option value="array">Array</option>
                        <option value="object">Object</option>
                        <option value="null">Null</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={assertion.expected || ''}
                        onChange={(e) => handleAssertionChange(assertion.id, 'expected', e.target.value)}
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                )}
                
                {assertion.passed !== undefined && (
                  <div className={`mt-4 p-3 rounded-md ${assertion.passed ? 'bg-green-900 bg-opacity-50' : 'bg-red-900 bg-opacity-50'}`}>
                    <div className="font-bold mb-1 text-white">
                      {assertion.passed ? 'Assertion Passed' : 'Assertion Failed'}
                    </div>
                    {!assertion.passed && assertion.error && (
                      <div className="text-red-200 text-sm">
                        {assertion.error}
                      </div>
                    )}
                    {assertion.actual !== undefined && (
                      <div className="mt-2">
                        <div className="text-sm text-gray-300">Actual Value:</div>
                        <pre className="mt-1 p-2 bg-gray-800 rounded text-xs overflow-auto max-h-32">
                          {typeof assertion.actual === 'object' 
                            ? JSON.stringify(assertion.actual, null, 2) 
                            : String(assertion.actual)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mt-auto pt-4">
                  <div className="bg-gray-700 p-3 rounded-md">
                    <h4 className="text-sm font-medium text-white mb-2">Tips</h4>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• For JSON Path, use <code className="bg-gray-800 px-1 py-0.5 rounded">$</code> to refer to the root of the response body</li>
                      <li>• For Schema Validation, paste a valid JSON Schema or generate one from the response</li>
                      <li>• Response Time assertions are in milliseconds</li>
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-lg mb-2">No assertion selected</p>
            <p className="text-sm">Select an assertion from the list or create a new one</p>
          </div>
        )}
      </div>
      
      {/* Add Assertion Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add Assertion</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetNewAssertionForm();
                }}
                className="text-gray-400 hover:text-white"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={newAssertionName}
                  onChange={(e) => setNewAssertionName(e.target.value)}
                  placeholder="Assertion Name"
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-300 mb-1">Type</label>
                <select
                  value={newAssertionType}
                  onChange={(e) => setNewAssertionType(e.target.value as Assertion['type'])}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="status">Status Code</option>
                  <option value="jsonPath">JSON Path</option>
                  <option value="schema">Schema Validation</option>
                  <option value="dataType">Data Type</option>
                  <option value="responseTime">Response Time</option>
                  <option value="header">Header</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              {newAssertionType === 'jsonPath' && (
                <div>
                  <label className="block text-gray-300 mb-1">JSON Path</label>
                  <input
                    type="text"
                    value={newAssertionPath}
                    onChange={(e) => setNewAssertionPath(e.target.value)}
                    placeholder="$.data.items[0].id"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {newAssertionType === 'header' && (
                <div>
                  <label className="block text-gray-300 mb-1">Header Name</label>
                  <input
                    type="text"
                    value={newAssertionPath}
                    onChange={(e) => setNewAssertionPath(e.target.value)}
                    placeholder="Content-Type"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-gray-300 mb-1">Condition</label>
                <select
                  value={newAssertionCondition}
                  onChange={(e) => setNewAssertionCondition(e.target.value as Assertion['condition'])}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getConditionOptions(newAssertionType).map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              {!['exists', 'notExists'].includes(newAssertionCondition) && (
                <div>
                  <label className="block text-gray-300 mb-1">Expected Value</label>
                  {newAssertionType === 'schema' ? (
                    <textarea
                      value={newAssertionExpected}
                      onChange={(e) => setNewAssertionExpected(e.target.value)}
                      placeholder="Paste JSON Schema here"
                      className="w-full h-32 bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  ) : newAssertionType === 'dataType' ? (
                    <select
                      value={newAssertionExpected}
                      onChange={(e) => setNewAssertionExpected(e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a type</option>
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="integer">Integer</option>
                      <option value="boolean">Boolean</option>
                      <option value="array">Array</option>
                      <option value="object">Object</option>
                      <option value="null">Null</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newAssertionExpected}
                      onChange={(e) => setNewAssertionExpected(e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetNewAssertionForm();
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAssertion}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Assertion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
