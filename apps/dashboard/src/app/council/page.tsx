'use client';

import { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function CouncilPage() {
  const [query, setQuery] = useState('');
  const [strategy, setStrategy] = useState('consensus');
  const [roles, setRoles] = useState(['researcher', 'analyst', 'editor']);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runCouncil = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/v1/orgs/demo/council`,
        { query, strategy, roles },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('apiKey')}`,
          },
        }
      );
      setResult(response.data);
    } catch (error) {
      console.error('Council error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">🤝 Council Analysis</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Strategy</label>
                  <select
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="deliberate">Deliberate</option>
                    <option value="consensus">Consensus</option>
                    <option value="critic">Critic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Roles</label>
                  <div className="space-y-2">
                    {['researcher', 'analyst', 'editor', 'critic'].map((role) => (
                      <label key={role} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={roles.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRoles([...roles, role]);
                            } else {
                              setRoles(roles.filter((r) => r !== role));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Query</h2>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your analysis query..."
                className="w-full h-32 px-3 py-2 border rounded-lg resize-none"
              />
              <button
                onClick={runCouncil}
                disabled={loading || !query.trim()}
                className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Running Council...' : 'Run Council Analysis'}
              </button>
            </div>

            {result && (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Final Conclusion</h2>
                  <p className="text-gray-800 whitespace-pre-wrap">{result.final}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold mb-4">Panel Deliberation</h2>
                  <div className="space-y-4">
                    {result.panel?.map((member: any, idx: number) => (
                      <div key={idx} className="border-l-4 border-purple-500 pl-4">
                        <h3 className="font-semibold text-purple-700">{member.role}</h3>
                        <p className="text-sm text-gray-700 mt-2">{member.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {result.citations && result.citations.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold mb-4">Citations</h2>
                    <div className="space-y-2">
                      {result.citations.map((cit: any, idx: number) => (
                        <div key={idx} className="text-sm text-gray-600">
                          📄 [{cit.docId}:{cit.chunkIx}]
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}