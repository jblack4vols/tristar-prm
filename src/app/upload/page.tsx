'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ingest/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setTimeout(() => router.push('/data'), 2000);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Upload Excel File</h1>
            <p className="mt-2 text-sm text-gray-600">
              Upload your Tristar PRM Excel report to process and normalize the data.
            </p>
          </div>

          <div className="p-6">
            {!result && (
              <>
                {/* File Upload Area */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-blue-600 hover:text-blue-500 font-medium">
                          Choose a file
                        </span>
                        <span className="text-gray-500"> or drag and drop</span>
                        <input
                          id="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Excel (.xlsx, .xls) or CSV files up to 10MB
                      </p>
                    </div>
                  </div>
                </div>

                {file && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-900">{file.name}</p>
                        <p className="text-sm text-blue-700">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => setFile(null)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-600">{error}</p>
                  </div>
                )}

                {/* Upload Button */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => router.push('/data')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    View Existing Data
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {uploading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    )}
                    {uploading ? 'Processing...' : 'Upload & Process'}
                  </button>
                </div>
              </>
            )}

            {/* Success Result */}
            {result && (
              <div className="text-center space-y-4">
                <div className="mx-auto h-16 w-16 text-green-500">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 48 48">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Upload Successful!</h3>
                  <p className="text-gray-600 mt-2">{result.message}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-md p-4 text-left">
                  <h4 className="font-medium text-green-900 mb-2">Processing Summary:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• <strong>File:</strong> {result.summary.filename}</li>
                    <li>• <strong>Total Records:</strong> {result.summary.totalRows.toLocaleString()}</li>
                    <li>• <strong>Processed:</strong> {new Date(result.summary.processedAt).toLocaleString()}</li>
                  </ul>
                </div>

                {result.summary.sampleData && result.summary.sampleData.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-left">
                    <h4 className="font-medium text-gray-900 mb-2">Sample Data Preview:</h4>
                    <div className="text-xs font-mono text-gray-700 overflow-x-auto">
                      <div className="grid grid-cols-1 gap-2">
                        {result.summary.sampleData.slice(0, 2).map((row: any, index: number) => (
                          <div key={index} className="border border-gray-300 rounded p-2">
                            <div><strong>Doctor:</strong> {row.referring_doctor}</div>
                            <div><strong>Facility:</strong> {row.facility}</div>
                            <div><strong>Therapist:</strong> {row.therapist}</div>
                            <div><strong>Created:</strong> {row.created_date}</div>
                            <div><strong>Status:</strong> {row.case_status}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  Redirecting to data viewer in 2 seconds...
                </p>

                <button
                  onClick={() => router.push('/data')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  View Data Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Requirements */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">File Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Supported Formats</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Excel files (.xlsx, .xls)</li>
                <li>• CSV files (.csv)</li>
                <li>• Maximum file size: 10MB</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Required Columns</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Created Date</strong> (or similar)</li>
                <li>• <strong>Referring Doctor</strong> (or similar)</li>
                <li>• Optional: Facility, Therapist, Insurance, etc.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
