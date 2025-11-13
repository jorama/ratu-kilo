'use client';

import { useEffect, useState } from 'react';

export default function ConsolePage() {
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    // Mock data for demo
    setTenants([
      {
        id: '1',
        name: 'Demo Organization',
        slug: 'demo',
        status: 'active',
        queries: 1250,
        cost: 45.30,
      },
      {
        id: '2',
        name: 'Ministry of Health',
        slug: 'moh-fiji',
        status: 'active',
        queries: 3420,
        cost: 128.50,
      },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-900">⚙️ Ratu Console</h1>
            <div className="flex space-x-4">
              <a href="/alerts" className="text-gray-600 hover:text-gray-900">Alerts</a>
              <a href="/billing" className="text-gray-600 hover:text-gray-900">Billing</a>
              <a href="/settings" className="text-gray-600 hover:text-gray-900">Settings</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Tenant Organizations</h2>
          <p className="mt-2 text-gray-600">Manage all sovereign AI nodes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Tenants</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{tenants.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Queries (30d)</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {tenants.reduce((sum, t) => sum + t.queries, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Revenue (30d)</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              ${tenants.reduce((sum, t) => sum + t.cost, 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Organizations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queries</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{tenant.slug}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tenant.queries.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${tenant.cost.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a href={`/tenant/${tenant.id}`} className="text-blue-600 hover:text-blue-900">
                        View Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}