'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function KnowledgePage() {
  const [sources, setSources] = useState<any[]>([]);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSource, setNewSource] = useState({ type: 'website', url: '' });

  const addSource = async () => {
    try {
      await axios.post(
        `${API_URL}/api/v1/orgs/demo/sources`,
        newSource,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('apiKey')}`,
          },
        }
      );
      setShowAddSource(false);
      setNewSource({ type: 'website', url: '' });
      // Refresh sources list
    } catch (error) {
      console.error('Failed to add source:', error);
    }
  };

  const triggerCrawl = async (sourceId: string) => {
    try {
      await axios.post(
        `${API_URL}/api/v1/orgs/demo/sources/${sourceId}/crawl`,
        { mode: 'full' },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('apiKey')}`,
          },
        }
      );
      alert('Crawl started!');
    } catch (error) {
      console.error('Failed to start crawl:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">📚 Knowledge Base</h1>
            <p className="text-gray-600 mt-2">Manage your data sources and documents</p>
          </div>
          <button
            onClick={() => setShowAddSource(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Add Source
          </button>
        </div>

        {showAddSource && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Data Source</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={newSource.type}
                    onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="website">Website</option>
                    <option value="pdf">PDF</option>
                    <option value="api">API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">URL</label>
                  <input
                    type="url"
                    value={newSource.url}
                    onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={addSource}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Source
                  </button>
                  <button
                    onClick={() => setShowAddSource(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {sources.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">No data sources yet</h3>
              <p className="text-gray-600 mb-4">Add your first data source to get started</p>
              <button
                onClick={() => setShowAddSource(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Data Source
              </button>
            </div>
          ) : (
            sources.map((source) => (
              <div key={source.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{source.url}</h3>
                    <p className="text-sm text-gray-600 mt-1">Type: {source.type}</p>
                    <p className="text-sm text-gray-600">Status: {source.status}</p>
                  </div>
                  <button
                    onClick={() => triggerCrawl(source.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Run Crawl
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}