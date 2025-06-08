'use client';

import React, { useState } from 'react';
import { FiPlay, FiStop, FiPlus, FiTrash2, FiEdit, FiSave } from 'react-icons/fi';

export interface MockRoute {
  id: string;
  path: string;
  method: string;
  statusCode: number;
  responseBody: string;
  responseHeaders: { key: string; value: string }[];
  delay: number;
}

export interface MockServer {
  id: string;
  name: string;
  port: number;
  baseUrl: string;
  routes: MockRoute[];
  isRunning: boolean;
}

interface MockServerPanelProps {
  mockServers: MockServer[];
  setMockServers: (servers: MockServer[]) => void;
}

export default function MockServerPanel({ mockServers, setMockServers }: MockServerPanelProps) {
  const [selectedServerId, setSelectedServerId] = useState<string | null>(
    mockServers.length > 0 ? mockServers[0].id : null
  );
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [isAddingRoute, setIsAddingRoute] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerPort, setNewServerPort] = useState(3001);
  const [editingRoute, setEditingRoute] = useState<MockRoute | null>(null);
  
  const selectedServer = mockServers.find(server => server.id === selectedServerId);
  
  // Add a new mock server
  const handleAddServer = () => {
    if (!newServerName.trim()) return;
    
    const newServer: MockServer = {
      id: `mock_${Date.now()}`,
      name: newServerName.trim(),
      port: newServerPort,
      baseUrl: `http://localhost:${newServerPort}`,
      routes: [],
      isRunning: false
    };
    
    setMockServers([...mockServers, newServer]);
    setSelectedServerId(newServer.id);
    setIsAddingServer(false);
    setNewServerName('');
    setNewServerPort(3001);
  };
  
  // Delete a mock server
  const handleDeleteServer = (serverId: string) => {
    const updatedServers = mockServers.filter(server => server.id !== serverId);
    setMockServers(updatedServers);
    
    if (selectedServerId === serverId) {
      setSelectedServerId(updatedServers.length > 0 ? updatedServers[0].id : null);
    }
  };
  
  // Toggle server running state
  const handleToggleServer = (serverId: string) => {
    const updatedServers = mockServers.map(server => {
      if (server.id === serverId) {
        return { ...server, isRunning: !server.isRunning };
      }
      return server;
    });
    
    setMockServers(updatedServers);
  };
  
  // Add a new route to the selected server
  const handleAddRoute = () => {
    if (!selectedServerId) return;
    
    const newRoute: MockRoute = {
      id: `route_${Date.now()}`,
      path: '/api/example',
      method: 'GET',
      statusCode: 200,
      responseBody: JSON.stringify({ message: 'Success' }, null, 2),
      responseHeaders: [{ key: 'Content-Type', value: 'application/json' }],
      delay: 0
    };
    
    const updatedServers = mockServers.map(server => {
      if (server.id === selectedServerId) {
        return {
          ...server,
          routes: [...server.routes, newRoute]
        };
      }
      return server;
    });
    
    setMockServers(updatedServers);
    setEditingRoute(newRoute);
    setIsAddingRoute(false);
  };
  
  // Delete a route
  const handleDeleteRoute = (routeId: string) => {
    if (!selectedServerId) return;
    
    const updatedServers = mockServers.map(server => {
      if (server.id === selectedServerId) {
        return {
          ...server,
          routes: server.routes.filter(route => route.id !== routeId)
        };
      }
      return server;
    });
    
    setMockServers(updatedServers);
    
    if (editingRoute?.id === routeId) {
      setEditingRoute(null);
    }
  };
  
  // Update a route
  const handleUpdateRoute = (updatedRoute: MockRoute) => {
    if (!selectedServerId) return;
    
    const updatedServers = mockServers.map(server => {
      if (server.id === selectedServerId) {
        return {
          ...server,
          routes: server.routes.map(route => 
            route.id === updatedRoute.id ? updatedRoute : route
          )
        };
      }
      return server;
    });
    
    setMockServers(updatedServers);
  };
  
  return (
    <div className="flex h-full">
      {/* Left Panel - Server List */}
      <div className="w-1/3 pr-4 border-r border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Mock Servers</h3>
          <button
            onClick={() => setIsAddingServer(true)}
            className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors"
          >
            <FiPlus className="mr-1" />
            Add Server
          </button>
        </div>
        
        {isAddingServer ? (
          <div className="bg-gray-800 p-3 rounded-md mb-4">
            <input
              type="text"
              placeholder="Server Name"
              value={newServerName}
              onChange={(e) => setNewServerName(e.target.value)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-md mb-2"
            />
            <input
              type="number"
              placeholder="Port"
              value={newServerPort}
              onChange={(e) => setNewServerPort(parseInt(e.target.value) || 3001)}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-md mb-2"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAddingServer(false)}
                className="px-3 py-1 text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddServer}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
              >
                Add
              </button>
            </div>
          </div>
        ) : null}
        
        {mockServers.length === 0 ? (
          <div className="text-gray-400 text-center py-4 bg-gray-800 rounded-md">
            No mock servers yet
          </div>
        ) : (
          <div className="space-y-2">
            {mockServers.map(server => (
              <div
                key={server.id}
                className={`flex justify-between items-center p-3 rounded-md cursor-pointer ${
                  selectedServerId === server.id ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-750'
                }`}
                onClick={() => setSelectedServerId(server.id)}
              >
                <div>
                  <div className="font-medium text-white">{server.name}</div>
                  <div className="text-sm text-gray-400">{server.baseUrl}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleServer(server.id);
                    }}
                    className={`p-1 rounded-md ${
                      server.isRunning ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'
                    }`}
                  >
                    {server.isRunning ? <FiStop /> : <FiPlay />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteServer(server.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-400 rounded-md"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Right Panel - Server Details */}
      <div className="w-2/3 pl-4">
        {selectedServer ? (
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">
                {selectedServer.name}
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  selectedServer.isRunning ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'
                }`}>
                  {selectedServer.isRunning ? 'Running' : 'Stopped'}
                </span>
              </h3>
              <button
                onClick={() => setIsAddingRoute(true)}
                className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors"
              >
                <FiPlus className="mr-1" />
                Add Route
              </button>
            </div>
            
            {/* Routes */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Routes</h4>
              {selectedServer.routes.length === 0 ? (
                <div className="text-gray-400 text-center py-4 bg-gray-800 rounded-md">
                  No routes added yet
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedServer.routes.map(route => (
                    <div
                      key={route.id}
                      className={`p-3 rounded-md bg-gray-800 hover:bg-gray-750 cursor-pointer ${
                        editingRoute?.id === route.id ? 'border border-blue-500' : ''
                      }`}
                      onClick={() => setEditingRoute(route)}
                    >
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            route.method === 'GET' ? 'bg-green-900 text-green-300' :
                            route.method === 'POST' ? 'bg-blue-900 text-blue-300' :
                            route.method === 'PUT' ? 'bg-yellow-900 text-yellow-300' :
                            route.method === 'DELETE' ? 'bg-red-900 text-red-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {route.method}
                          </span>
                          <span className="ml-2 text-white">{route.path}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRoute(route);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-400 rounded-md"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRoute(route.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-400 rounded-md"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-gray-400">
                        Status: {route.statusCode}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Route Editor */}
            {editingRoute && (
              <div className="bg-gray-800 p-4 rounded-md">
                <h4 className="text-sm font-medium text-white mb-3">Edit Route</h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Method</label>
                    <select
                      value={editingRoute.method}
                      onChange={(e) => setEditingRoute({
                        ...editingRoute,
                        method: e.target.value
                      })}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                      <option value="OPTIONS">OPTIONS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Path</label>
                    <input
                      type="text"
                      value={editingRoute.path}
                      onChange={(e) => setEditingRoute({
                        ...editingRoute,
                        path: e.target.value
                      })}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Status Code</label>
                    <input
                      type="number"
                      value={editingRoute.statusCode}
                      onChange={(e) => setEditingRoute({
                        ...editingRoute,
                        statusCode: parseInt(e.target.value) || 200
                      })}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Delay (ms)</label>
                    <input
                      type="number"
                      value={editingRoute.delay}
                      onChange={(e) => setEditingRoute({
                        ...editingRoute,
                        delay: parseInt(e.target.value) || 0
                      })}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-md"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block text-sm text-gray-400 mb-1">Response Headers</label>
                  {editingRoute.responseHeaders.map((header, index) => (
                    <div key={index} className="flex mb-2">
                      <input
                        type="text"
                        placeholder="Key"
                        value={header.key}
                        onChange={(e) => {
                          const updatedHeaders = [...editingRoute.responseHeaders];
                          updatedHeaders[index] = { ...header, key: e.target.value };
                          setEditingRoute({
                            ...editingRoute,
                            responseHeaders: updatedHeaders
                          });
                        }}
                        className="w-1/2 bg-gray-700 text-white px-3 py-2 rounded-l-md"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={header.value}
                        onChange={(e) => {
                          const updatedHeaders = [...editingRoute.responseHeaders];
                          updatedHeaders[index] = { ...header, value: e.target.value };
                          setEditingRoute({
                            ...editingRoute,
                            responseHeaders: updatedHeaders
                          });
                        }}
                        className="w-1/2 bg-gray-700 text-white px-3 py-2 rounded-r-md"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setEditingRoute({
                      ...editingRoute,
                      responseHeaders: [...editingRoute.responseHeaders, { key: '', value: '' }]
                    })}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    + Add Header
                  </button>
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Response Body</label>
                  <textarea
                    value={editingRoute.responseBody}
                    onChange={(e) => setEditingRoute({
                      ...editingRoute,
                      responseBody: e.target.value
                    })}
                    rows={6}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-md font-mono text-sm"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      handleUpdateRoute(editingRoute);
                    }}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                  >
                    <FiSave className="mr-1" />
                    Save Route
                  </button>
                </div>
              </div>
            )}
            
            {isAddingRoute && (
              <div className="mt-auto p-3 bg-gray-800 rounded-md">
                <h4 className="text-sm font-medium text-white mb-2">Add New Route</h4>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsAddingRoute(false)}
                    className="px-3 py-1 text-sm text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddRoute}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-500"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center">
            <p className="text-gray-400 mb-2">No mock server selected</p>
            <p className="text-gray-500">Create a mock server to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
