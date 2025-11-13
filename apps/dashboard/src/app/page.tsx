'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/orgs/demo/analytics/summary`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('apiKey')}`,
        },
      });
      setMetrics(response.data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">🧠 Ratu Dashboard</h1>
            </div>
            <div className="flex space-x-4">
              <a href="/knowledge" className="text-gray-600 hover:text-gray-900">Knowledge</a>
              <a href="/chat" className="text-gray-600 hover:text-gray-900">Chat</a>
              <a href="/council" className="text-gray-600 hover:text-gray-900">Council</a>
              <a href="/analytics" className="text-gray-600 hover:text-gray-900">Analytics</a>
              <a href="/settings" className="text-gray-600 hover:text-gray-900">Settings</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Overview</h2>
          <p className="mt-2 text-gray-600">Monitor your sovereign AI node performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Queries"
            value={metrics?.queries || 0}
            icon="💬"
          />
          <MetricCard
            title="Avg Latency"
            value={`${Math.round(metrics?.avgLatency || 0)}ms`}
            icon="⚡"
          />
          <MetricCard
            title="Documents"
            value={metrics?.crawledPages || 0}
            icon="📄"
          />
          <MetricCard
            title="Cost (USD)"
            value={`$${(metrics?.costUsd || 0).toFixed(2)}`}
            icon="💰"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <ActivityItem
                action="Document ingested"
                time="2 minutes ago"
                status="success"
              />
              <ActivityItem
                action="Crawl completed"
                time="15 minutes ago"
                status="success"
              />
              <ActivityItem
                action="Chat query processed"
                time="1 hour ago"
                status="success"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Add Data Source
              </button>
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Test Chat
              </button>
              <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                Run Council
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function ActivityItem({ action, time, status }: { action: string; time: string; status: string }) {
  const statusColors = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{action}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[status as keyof typeof statusColors]}`}>
        {status}
      </span>
    </div>
  );
}