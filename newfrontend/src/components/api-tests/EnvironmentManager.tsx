'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';
import { Environment, KeyValuePair } from './types';

interface EnvironmentManagerProps {
  environments: Environment[];
  activeEnvironmentId: string | null;
  onEnvironmentChange: (environmentId: string | null) => void;
  onEnvironmentsUpdate: (environments: Environment[]) => void;
}

export default function EnvironmentManager({
  environments,
  activeEnvironmentId,
  onEnvironmentChange,
  onEnvironmentsUpdate,
}: EnvironmentManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeySecret, setNewKeySecret] = useState(false);
  const [hiddenValues, setHiddenValues] = useState<Record<string, boolean>>({});
  
  // Get active environment
  const activeEnvironment = environments.find(env => env.id === activeEnvironmentId) || null;

  // Create a new environment
  const handleCreateEnvironment = () => {
    if (!newEnvironmentName.trim()) return;
    
    const newEnvironment: Environment = {
      id: `env_${Date.now()}`,
      name: newEnvironmentName,
      variables: [],
    };
    
    onEnvironmentsUpdate([...environments, newEnvironment]);
    setNewEnvironmentName('');
    setEditingEnvironment(newEnvironment);
    
    // Set as active if it's the first environment
    if (environments.length === 0) {
      onEnvironmentChange(newEnvironment.id);
    }
  };
  
  // Delete an environment
  const handleDeleteEnvironment = (id: string) => {
    const updatedEnvironments = environments.filter(env => env.id !== id);
    onEnvironmentsUpdate(updatedEnvironments);
    
    // If the active environment was deleted, set active to null or the first available
    if (activeEnvironmentId === id) {
      onEnvironmentChange(updatedEnvironments.length > 0 ? updatedEnvironments[0].id : null);
    }
  };
  
  // Start editing an environment
  const handleEditEnvironment = (environment: Environment) => {
    setEditingEnvironment({...environment});
  };
  
  // Save the edited environment
  const handleSaveEnvironment = () => {
    if (!editingEnvironment) return;
    
    const updatedEnvironments = environments.map(env => 
      env.id === editingEnvironment.id ? editingEnvironment : env
    );
    
    onEnvironmentsUpdate(updatedEnvironments);
    setEditingEnvironment(null);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingEnvironment(null);
  };
  
  // Add a new variable to the editing environment
  const handleAddVariable = () => {
    if (!editingEnvironment || !newKeyName.trim()) return;
    
    const newVariable: KeyValuePair = {
      key: newKeyName,
      value: newKeyValue,
      isSecret: newKeySecret
    };
    
    setEditingEnvironment({
      ...editingEnvironment,
      variables: [...editingEnvironment.variables, newVariable]
    });
    
    setNewKeyName('');
    setNewKeyValue('');
    setNewKeySecret(false);
  };
  
  // Delete a variable from the editing environment
  const handleDeleteVariable = (index: number) => {
    if (!editingEnvironment) return;
    
    const updatedVariables = [...editingEnvironment.variables];
    updatedVariables.splice(index, 1);
    
    setEditingEnvironment({
      ...editingEnvironment,
      variables: updatedVariables
    });
  };
  
  // Update a variable in the editing environment
  const handleUpdateVariable = (index: number, key: string, value: string, isSecret: boolean) => {
    if (!editingEnvironment) return;
    
    const updatedVariables = [...editingEnvironment.variables];
    updatedVariables[index] = { key, value, isSecret };
    
    setEditingEnvironment({
      ...editingEnvironment,
      variables: updatedVariables
    });
  };
  
  // Toggle visibility of a secret value
  const toggleValueVisibility = (id: string) => {
    setHiddenValues(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Duplicate an environment
  const handleDuplicateEnvironment = (environment: Environment) => {
    const newEnv: Environment = {
      ...environment,
      id: `env_${Date.now()}`,
      name: `${environment.name} (Copy)`,
    };
    
    onEnvironmentsUpdate([...environments, newEnv]);
  };

  // Process environment variables in a string
  const processEnvironmentVariables = (text: string): string => {
    if (!activeEnvironment) return text;
    
    let processedText = text;
    const variableRegex = /{{([^{}]+)}}/g;
    
    let match;
    while ((match = variableRegex.exec(text)) !== null) {
      const variableName = match[1].trim();
      const variable = activeEnvironment.variables.find(v => v.key === variableName);
      
      if (variable) {
        processedText = processedText.replace(match[0], variable.value);
      }
    }
    
    return processedText;
  };

  return (
    <div className="bg-gray-800 rounded-md">
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h3 className="text-white font-medium">Environments</h3>
            <div className="ml-4">
              <select
                className="bg-gray-700 text-white text-sm rounded-md border border-gray-600 px-2 py-1"
                value={activeEnvironmentId || ''}
                onChange={(e) => onEnvironmentChange(e.target.value || null)}
              >
                <option value="">No Environment</option>
                {environments.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            className="text-gray-400 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? 'Hide' : 'Manage Environments'}
          </button>
        </div>
      </div>
      
      {isOpen && (
        <div className="p-4">
          {/* Environment List */}
          {!editingEnvironment && (
            <>
              <div className="mb-4 flex">
                <input
                  type="text"
                  className="flex-grow bg-gray-700 text-white rounded-l-md border border-gray-600 px-3 py-2 text-sm"
                  placeholder="New Environment Name"
                  value={newEnvironmentName}
                  onChange={(e) => setNewEnvironmentName(e.target.value)}
                />
                <button
                  className="bg-blue-600 text-white px-3 py-2 rounded-r-md text-sm flex items-center"
                  onClick={handleCreateEnvironment}
                >
                  <FiPlus className="mr-1" /> Add
                </button>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {environments.map((env) => (
                  <div
                    key={env.id}
                    className={`p-3 rounded-md flex justify-between items-center ${
                      env.id === activeEnvironmentId ? 'bg-blue-900/30 border border-blue-500/50' : 'bg-gray-700'
                    }`}
                  >
                    <div>
                      <div className="text-white font-medium">{env.name}</div>
                      <div className="text-gray-400 text-xs">{env.variables.length} variables</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="text-gray-400 hover:text-white p-1"
                        onClick={() => handleEditEnvironment(env)}
                        title="Edit"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        className="text-gray-400 hover:text-white p-1"
                        onClick={() => handleDuplicateEnvironment(env)}
                        title="Duplicate"
                      >
                        <FiCopy size={16} />
                      </button>
                      <button
                        className="text-gray-400 hover:text-red-400 p-1"
                        onClick={() => handleDeleteEnvironment(env.id)}
                        title="Delete"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {environments.length === 0 && (
                  <div className="text-gray-400 text-center py-4">
                    No environments created yet
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* Environment Editor */}
          {editingEnvironment && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <input
                    type="text"
                    className="bg-gray-700 text-white rounded-md border border-gray-600 px-3 py-2 text-sm"
                    value={editingEnvironment.name}
                    onChange={(e) => setEditingEnvironment({...editingEnvironment, name: e.target.value})}
                    placeholder="Environment Name"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    className="bg-green-600 text-white px-3 py-2 rounded-md text-sm flex items-center"
                    onClick={handleSaveEnvironment}
                  >
                    <FiSave className="mr-1" /> Save
                  </button>
                  <button
                    className="bg-gray-600 text-white px-3 py-2 rounded-md text-sm flex items-center"
                    onClick={handleCancelEdit}
                  >
                    <FiX className="mr-1" /> Cancel
                  </button>
                </div>
              </div>
              
              {/* Add Variable Form */}
              <div className="mb-4 bg-gray-700 p-3 rounded-md">
                <h4 className="text-white text-sm font-medium mb-2">Add Variable</h4>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <input
                      type="text"
                      className="w-full bg-gray-600 text-white rounded-md border border-gray-500 px-3 py-2 text-sm"
                      placeholder="Variable Name"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      className="w-full bg-gray-600 text-white rounded-md border border-gray-500 px-3 py-2 text-sm"
                      placeholder="Value"
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                    />
                  </div>
                  <div className="col-span-1 flex items-center">
                    <label className="flex items-center text-gray-300 text-sm">
                      <input
                        type="checkbox"
                        className="mr-1"
                        checked={newKeySecret}
                        onChange={(e) => setNewKeySecret(e.target.checked)}
                      />
                      Secret
                    </label>
                  </div>
                  <div className="col-span-1">
                    <button
                      className="w-full bg-blue-600 text-white px-3 py-2 rounded-md text-sm flex items-center justify-center"
                      onClick={handleAddVariable}
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Variables List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {editingEnvironment.variables.map((variable, index) => {
                  const valueId = `${variable.key}_${index}`;
                  const isHidden = variable.isSecret && !hiddenValues[valueId];
                  
                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 bg-gray-700 p-3 rounded-md">
                      <div className="col-span-5">
                        <input
                          type="text"
                          className="w-full bg-gray-600 text-white rounded-md border border-gray-500 px-3 py-2 text-sm"
                          value={variable.key}
                          onChange={(e) => handleUpdateVariable(index, e.target.value, variable.value, variable.isSecret)}
                          placeholder="Variable Name"
                        />
                      </div>
                      <div className="col-span-5 relative">
                        <input
                          type={isHidden ? 'password' : 'text'}
                          className="w-full bg-gray-600 text-white rounded-md border border-gray-500 px-3 py-2 text-sm pr-8"
                          value={variable.value}
                          onChange={(e) => handleUpdateVariable(index, variable.key, e.target.value, variable.isSecret)}
                          placeholder="Value"
                        />
                        {variable.isSecret && (
                          <button
                            className="absolute right-2 top-2 text-gray-400 hover:text-white"
                            onClick={() => toggleValueVisibility(valueId)}
                          >
                            {isHidden ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                          </button>
                        )}
                      </div>
                      <div className="col-span-1 flex items-center">
                        <label className="flex items-center text-gray-300 text-sm">
                          <input
                            type="checkbox"
                            className="mr-1"
                            checked={variable.isSecret}
                            onChange={(e) => handleUpdateVariable(index, variable.key, variable.value, e.target.checked)}
                          />
                          Secret
                        </label>
                      </div>
                      <div className="col-span-1">
                        <button
                          className="w-full bg-red-600 text-white px-3 py-2 rounded-md text-sm flex items-center justify-center"
                          onClick={() => handleDeleteVariable(index)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {editingEnvironment.variables.length === 0 && (
                  <div className="text-gray-400 text-center py-4 bg-gray-700 rounded-md">
                    No variables added yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Active Environment Variables Quick View */}
      {activeEnvironment && activeEnvironment.variables.length > 0 && (
        <div className="p-4 border-t border-gray-700">
          <h4 className="text-white text-sm font-medium mb-2">Active Variables</h4>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {activeEnvironment.variables.map((variable, index) => {
              const valueId = `active_${variable.key}_${index}`;
              const isHidden = variable.isSecret && !hiddenValues[valueId];
              
              return (
                <div key={index} className="bg-gray-700 p-2 rounded-md flex justify-between">
                  <div className="text-blue-300 text-sm font-medium">{variable.key}</div>
                  <div className="flex items-center">
                    <span className="text-gray-300 text-sm mr-2">
                      {isHidden ? '••••••••' : variable.value}
                    </span>
                    {variable.isSecret && (
                      <button
                        className="text-gray-400 hover:text-white"
                        onClick={() => toggleValueVisibility(valueId)}
                      >
                        {isHidden ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Export the utility function for use in other components
export { processEnvironmentVariables };

function processEnvironmentVariables(text: string, environment: Environment | null): string {
  if (!environment) return text;
  
  let processedText = text;
  const variableRegex = /{{([^{}]+)}}/g;
  
  let match;
  while ((match = variableRegex.exec(text)) !== null) {
    const variableName = match[1].trim();
    const variable = environment.variables.find(v => v.key === variableName);
    
    if (variable) {
      processedText = processedText.replace(match[0], variable.value);
    }
  }
  
  return processedText;
}
