'use client';

import React, { useState } from 'react';
import { FiFolder, FiFolderPlus, FiPlus, FiTrash2, FiEdit2, FiChevronRight, FiChevronDown, FiSend } from 'react-icons/fi';

interface KeyValuePair {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

interface APIRequest {
  id: string;
  name: string;
  method: string;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body: {
    contentType: string;
    content: string;
  };
  auth: {
    type: string;
    credentials: any;
  };
}

interface APICollection {
  id: string;
  name: string;
  description?: string;
  requests: APIRequest[];
}

interface CollectionPanelProps {
  collections: APICollection[];
  setCurrentRequest: (request: APIRequest) => void;
}

export default function CollectionPanel({ collections, setCurrentRequest }: CollectionPanelProps) {
  const [expandedCollections, setExpandedCollections] = useState<Record<string, boolean>>({});
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  
  const toggleCollectionExpanded = (collectionId: string) => {
    setExpandedCollections(prev => ({
      ...prev,
      [collectionId]: !prev[collectionId]
    }));
  };
  
  const handleAddCollection = () => {
    // This would typically interact with a parent component to add a new collection
    console.log('Add new collection:', newCollectionName);
    setIsAddingCollection(false);
    setNewCollectionName('');
  };
  
  const handleSelectRequest = (request: APIRequest) => {
    setCurrentRequest(request);
  };
  
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'text-green-500';
      case 'POST':
        return 'text-blue-500';
      case 'PUT':
        return 'text-yellow-500';
      case 'DELETE':
        return 'text-red-500';
      case 'PATCH':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Collections</h3>
        <button
          onClick={() => setIsAddingCollection(true)}
          className="flex items-center text-sm px-2 py-1 bg-gray-700 text-blue-400 rounded hover:bg-gray-600 transition-colors"
        >
          <FiFolderPlus className="mr-1" />
          New
        </button>
      </div>
      
      {isAddingCollection && (
        <div className="mb-4 p-3 bg-gray-700 rounded-md">
          <input
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="Collection Name"
            className="w-full bg-gray-600 text-white px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsAddingCollection(false)}
              className="px-3 py-1 bg-gray-600 text-gray-300 rounded-md hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCollection}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-500"
              disabled={!newCollectionName.trim()}
            >
              Create
            </button>
          </div>
        </div>
      )}
      
      {collections.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-4">
          <FiFolder size={48} className="mb-2" />
          <p className="text-center mb-2">No collections yet</p>
          <p className="text-center text-sm mb-4">Collections help you organize your API requests</p>
          <button
            onClick={() => setIsAddingCollection(true)}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="mr-2" />
            Create Collection
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {collections.map(collection => (
            <div key={collection.id} className="mb-2">
              <div 
                className="flex items-center justify-between p-2 bg-gray-700 rounded-md cursor-pointer hover:bg-gray-600"
                onClick={() => toggleCollectionExpanded(collection.id)}
              >
                <div className="flex items-center">
                  {expandedCollections[collection.id] ? (
                    <FiChevronDown className="mr-2 text-gray-400" />
                  ) : (
                    <FiChevronRight className="mr-2 text-gray-400" />
                  )}
                  <span className="text-white">{collection.name}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    ({collection.requests.length})
                  </span>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add request to this collection
                      console.log('Add request to collection:', collection.id);
                    }}
                    className="text-blue-400 hover:text-blue-300 mr-2"
                  >
                    <FiPlus size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Edit collection
                      console.log('Edit collection:', collection.id);
                    }}
                    className="text-gray-400 hover:text-white mr-2"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Delete collection
                      console.log('Delete collection:', collection.id);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
              
              {expandedCollections[collection.id] && (
                <div className="ml-4 mt-1 space-y-1">
                  {collection.requests.length === 0 ? (
                    <div className="text-gray-400 text-sm p-2">
                      No requests in this collection
                    </div>
                  ) : (
                    collection.requests.map(request => (
                      <div 
                        key={request.id}
                        className="flex items-center justify-between p-2 bg-gray-800 rounded-md cursor-pointer hover:bg-gray-700"
                        onClick={() => handleSelectRequest(request)}
                      >
                        <div className="flex items-center">
                          <span className={`font-mono font-bold mr-2 ${getMethodColor(request.method)}`}>
                            {request.method}
                          </span>
                          <span className="text-white truncate max-w-[150px]">{request.name}</span>
                        </div>
                        <div className="flex items-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRequest(request);
                              // This would typically trigger sending the request
                              console.log('Send request:', request.id);
                            }}
                            className="text-blue-400 hover:text-blue-300 mr-2"
                          >
                            <FiSend size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Delete request
                              console.log('Delete request:', request.id);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-gray-700 rounded-md">
        <h4 className="text-sm font-medium text-white mb-2">Import Options</h4>
        <p className="text-xs text-gray-300">
          You can import collections from Swagger/OpenAPI specifications or Postman collections using the Import button at the top.
        </p>
      </div>
    </div>
  );
}
