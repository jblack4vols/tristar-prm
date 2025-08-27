'use client';

import { useState, useEffect } from 'react';
import { Row } from '@/lib/normalize';

interface DataResponse {
  metadata: {
    uploadDate: string;
    filename: string;
    rowCount: number;
    version: string;
  };
  data: Row[];
  totalRows: number;
}

export default function DataViewer() {
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    facility: '',
    discipline: '',
    status: '',
    limit: '100'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.facility) params.set('facility', filters.facility);
      if (filters.discipline) params.set('discipline', filters.discipline);
      if (filters.status) params.set('status', filters.status);
      if (filters.limit) params.set('limit', filters.limit);

      const response = await fetch(`/api/data/latest?${params}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('No data available. Please upload an Excel file first.');
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
        return;
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchData();
  };

  const clearData = async () => {
    if (!confirm('Are you sure you want to clear all data?')) return;
    
    try {
      const headers: any = {};
      
      // Add authentication header if secret is available
      const ingestSecret = process.env.NEXT_PUBLIC_INGEST_SECRET || 'supersecretstring';
      if (ingestSecret) {
        headers['Authorization'] = `Bearer ${ingestSecret}`;
      }

      const response = await fetch('/api/data/latest', { 
        method: 'DELETE',
        headers 
      });
      if (response.ok) {
        setData(null);
        setError('Data cleared successfully');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Tristar PRM Data Viewer</h1>
            {data?.metadata && (
              <p className="mt-2 text-sm text-gray-600">
                {data.metadata.filename} • {data.metadata.rowCount.toLocaleString()} total records • 
                Uploaded {new Date(data.metadata.uploadDate).toLocaleDateString()}
              </p>
            )}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>

          {data && (
            <>
              {/* Filters */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Facility</label>
                    <input
                      type="text"
                      value={filters.facility}
                      onChange={(e) => handleFilterChange('facility', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Filter by facility..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Discipline</label>
                    <select
                      value={filters.discipline}
                      onChange={(e) => handleFilterChange('discipline', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">All</option>
                      <option value="PT">PT</option>
                      <option value="OT">OT</option>
                      <option value="ST">ST</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">All</option>
                      <option value="Active">Active</option>
                      <option value="Discharged">Discharged</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Limit</label>
                    <select
                      value={filters.limit}
                      onChange={(e) => handleFilterChange('limit', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="500">500</option>
                      <option value="1000">1000</option>
                      <option value="">All</option>
                    </select>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={applyFilters}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Apply
                    </button>
                    <button
                      onClick={clearData}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Facility</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Therapist</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discipline</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visits</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.data.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.created_date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.referring_doctor}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.facility}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.therapist}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            row.discipline === 'PT' ? 'bg-blue-100 text-blue-800' :
                            row.discipline === 'OT' ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {row.discipline}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.primary_insurance}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.arrived_visits}/{row.scheduled_visits}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            row.case_status === 'Discharged' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {row.case_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-sm text-gray-600">
                  Showing {data.data.length} of {data.totalRows} records
                </p>
              </div>
            </>
          )}

          {!data && !error && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No data available. Upload an Excel file to get started.</p>
              <a href="/upload" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
                Upload File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
