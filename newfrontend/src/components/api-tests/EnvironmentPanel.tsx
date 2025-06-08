'use client';

import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiEye, FiEyeOff } from 'react-icons/fi';

interface KeyValuePair {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

interface APIEnvironment {
  id: string;
  name: string;
  variables: KeyValuePair[];
  isActive: boolean;
}

interface EnvironmentPanelProps {
  environments: APIEnvironment[];
  setEnvironments: (environments: APIEnvironment[]) => void;
}

export default function EnvironmentPanel({ environments, setEnvironments }: EnvironmentPanelProps) {
  const [selectedEnv, setSelectedEnv] = useState<string | null>(
    environments.find(env => env.isActive)?.id || (environments.length > 0 ? environments[0].id : null)
  );
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isAddingEnv, setIsAddingEnv] = useState(false);
  const [newEnvName, setNewEnvName] = useState('');
  
  const handleAddEnvironment = () => {
    if (isAddingEnv) {
      if (!newEnvName.trim()) {
        alert('Please enter a name for the environment');
        return;
      }
      
      const newEnv: APIEnvironment = {
        id: 'env_' + Date.now(),
        name: newEnvName.trim(),
        variables: [],
        isActive: false
      };
      
      setEnvironments([...environments, newEnv]);
      setSelectedEnv(newEnv.id);
      setIsAddingEnv(false);
      setNewEnvName('');
    } else {
      setIsAddingEnv(true);
    }
  };
  
  const handleCancelAddEnv = () => {
    setIsAddingEnv(false);
    setNewEnvName('');
  };
  
  const handleRemoveEnvironment = (id: string) => {
    // Don't allow removing the last environment
    if (environments.length <= 1) {
      alert('You must have at least one environment');
      return;
    }
    
    const envToRemove = environments.find(env => env.id === id);
    
    // If removing the active environment, activate another one
    if (envToRemove?.isActive) {
      const otherEnvs = environments.filter(env => env.id !== id);
      otherEnvs[0].isActive = true;
    }
    
    setEnvironments(environments.filter(env => env.id !== id));
    
    // If the selected environment is removed, select another one
    if (selectedEnv === id) {
      const remainingEnvs = environments.filter(env => env.id !== id);
      setSelectedEnv(remainingEnvs.length > 0 ? remainingEnvs[0].id : null);
    }
  };
  
  const handleActivateEnvironment = (id: string) => {
    setEnvironments(environments.map(env => ({
      ...env,
      isActive: env.id === id
    })));
  };
  
  const handleRenameEnvironment = (id: string, name: string) => {
    setEnvironments(environments.map(env => 
      env.id === id ? { ...env, name } : env
    ));
  };
  
  const handleAddVariable = (envId: string) => {
    setEnvironments(environments.map(env => {
      if (env.id === envId) {
        return {
          ...env,
          variables: [
            ...env.variables,
            { key: '', value: '', enabled: true }
          ]
        };
      }
      return env;
    }));
  };
  
  const handleVariableChange = (envId: string, index: number, field: 'key' | 'value' | 'description', value: string) => {
    setEnvironments(environments.map(env => {
      if (env.id === envId) {
        const newVariables = [...env.variables];
        newVariables[index] = { ...newVariables[index], [field]: value };
        return { ...env, variables: newVariables };
      }
      return env;
    }));
  };
  
  const handleVariableToggle = (envId: string, index: number) => {
    setEnvironments(environments.map(env => {
      if (env.id === envId) {
        const newVariables = [...env.variables];
        newVariables[index] = { ...newVariables[index], enabled: !newVariables[index].enabled };
        return { ...env, variables: newVariables };
      }
      return env;
    }));
  };
  
  const handleRemoveVariable = (envId: string, index: number) => {
    setEnvironments(environments.map(env => {
      if (env.id === envId) {
        const newVariables = [...env.variables];
        newVariables.splice(index, 1);
        return { ...env, variables: newVariables };
      }
      return env;
    }));
  };
  
  const toggleShowSecret = (varKey: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [varKey]: !prev[varKey]
    }));
  };

  return (
    <div className="flex h-full">
      {/* Environment List */}
      <div className="w-1/3 pr-4 border-r border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Environments</h3>
          <button
            onClick={handleAddEnvironment}
            className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors"
          >
            <FiPlus className="mr-1" />
            Add Environment
          </button>
        </div>
        
        {isAddingEnv && (
          <div className="mb-4 flex items-center space-x-2">
            <input
              type="text"
              value={newEnvName}
              onChange={(e) => setNewEnvName(e.target.value)}
              placeholder="Environment Name"
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleAddEnvironment}
              className="text-green-400 hover:text-green-300"
            >
              <FiCheck />
            </button>
            <button
              onClick={handleCancelAddEnv}
              className="text-red-400 hover:text-red-300"
            >
              <FiX />
            </button>
          </div>
        )}
        
        <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {environments.map(env => (
            <div 
              key={env.id}
              onClick={() => setSelectedEnv(env.id)}
              className={`p-3 rounded-md cursor-pointer ${
                selectedEnv === env.id ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={env.isActive}
                    onChange={() => handleActivateEnvironment(env.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mr-2"
                  />
                  <span className={`${env.isActive ? 'text-blue-400 font-medium' : 'text-white'}`}>
                    {env.name}
                  </span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newName = prompt('Enter new name for environment', env.name);
                      if (newName) {
                        handleRenameEnvironment(env.id, newName);
                      }
                    }}
                    className="text-gray-400 hover:text-white mr-2"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this environment?')) {
                        handleRemoveEnvironment(env.id);
                      }
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {env.variables.length} variable{env.variables.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Environment Variables */}
      <div className="w-2/3 pl-4">
        {selectedEnv ? (
          <>
            {environments.filter(env => env.id === selectedEnv).map(env => (
              <div key={env.id} className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">
                    {env.name} Variables
                    {env.isActive && <span className="ml-2 text-sm text-blue-400">(Active)</span>}
                  </h3>
                  <button
                    onClick={() => handleAddVariable(env.id)}
                    className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors"
                  >
                    <FiPlus className="mr-1" />
                    Add Variable
                  </button>
                </div>
                
                {env.variables.length === 0 ? (
                  <div className="text-gray-400 text-center py-4">
                    No variables added yet
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                    <div className="grid grid-cols-12 gap-2 px-2 py-1 border-b border-gray-700 text-sm text-gray-400">
                      <div className="col-span-1">Enabled</div>
                      <div className="col-span-3">Key</div>
                      <div className="col-span-4">Value</div>
                      <div className="col-span-3">Description</div>
                      <div className="col-span-1">Actions</div>
                    </div>
                    {env.variables.map((variable, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-1">
                          <input
                            type="checkbox"
                            checked={variable.enabled}
                            onChange={() => handleVariableToggle(env.id, index)}
                            className="bg-gray-700 rounded"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={variable.key}
                            onChange={(e) => handleVariableChange(env.id, index, 'key', e.target.value)}
                            placeholder="Key"
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-4 relative">
                          <input
                            type={showSecrets[variable.key] ? 'text' : 'password'}
                            value={variable.value}
                            onChange={(e) => handleVariableChange(env.id, index, 'value', e.target.value)}
                            placeholder="Value"
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowSecret(variable.key)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showSecrets[variable.key] ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                          </button>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            value={variable.description || ''}
                            onChange={(e) => handleVariableChange(env.id, index, 'description', e.target.value)}
                            placeholder="Description"
                            className="w-full bg-gray-700 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            onClick={() => handleRemoveVariable(env.id, index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 bg-gray-700 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-white mb-2">How to Use Variables</h4>
                  <p className="text-sm text-gray-300">
                    Use variables in your requests by enclosing them in double curly braces:
                  </p>
                  <code className="block bg-gray-800 p-2 rounded-md mt-2 text-sm text-green-400">
                    https://&#123;&#123;baseUrl&#125;&#125;/api/users?apiKey=&#123;&#123;apiKey&#125;&#125;
                  </code>
                  <p className="text-sm text-gray-300 mt-2">
                    Variables will be automatically replaced with their values when sending requests.
                  </p>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-lg mb-2">No environment selected</p>
            <p className="text-sm">Select an environment from the list or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
