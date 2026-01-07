import { GetServerSideProps } from 'next';
import { useState } from 'react';
import Head from 'next/head';

interface PDFStatus {
  name: string;
  exists: boolean;
  size?: number;
  lastModified?: string;
}

interface Props {
  pdfs: PDFStatus[];
  stats: {
    total: number;
    existing: number;
    missing: number;
  };
}

export default function PDFDashboard({ pdfs, stats }: Props) {
  const [filter, setFilter] = useState<'all' | 'existing' | 'missing'>('all');

  const filteredPDFs = pdfs.filter(pdf => {
    if (filter === 'all') return true;
    if (filter === 'existing') return pdf.exists;
    if (filter === 'missing') return !pdf.exists;
    return true;
  });

  return (
    <>
      <Head>
        <title>PDF Dashboard - Abraham of London</title>
      </Head>

      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">PDF Asset Dashboard</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Total PDFs</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Existing</div>
              <div className="text-3xl font-bold text-green-600">{stats.existing}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500">Missing</div>
              <div className="text-3xl font-bold text-red-600">{stats.missing}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All PDFs
              </button>
              <button
                onClick={() => setFilter('existing')}
                className={`px-4 py-2 rounded ${
                  filter === 'existing'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Existing
              </button>
              <button
                onClick={() => setFilter('missing')}
                className={`px-4 py-2 rounded ${
                  filter === 'missing'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Missing
              </button>
            </div>
          </div>

          {/* PDF List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PDF Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Modified
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPDFs.map((pdf, index) => (
                  <tr key={index} className={pdf.exists ? '' : 'bg-red-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {pdf.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          pdf.exists
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {pdf.exists ? 'Exists' : 'Missing'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pdf.size ? `${(pdf.size / 1024).toFixed(2)} KB` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {pdf.lastModified || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

// Server-side data fetching - this is where we can use Node.js modules safely
export const getServerSideProps: GetServerSideProps = async () => {
  const fs = require('fs').promises;
  const path = require('path');

  try {
    const publicDir = path.join(process.cwd(), 'public');
    const pdfDir = path.join(publicDir, 'pdfs');

    // Check if PDF directory exists
    let pdfs: PDFStatus[] = [];
    let stats = { total: 0, existing: 0, missing: 0 };

    try {
      const files = await fs.readdir(pdfDir);
      
      pdfs = await Promise.all(
        files
          .filter((file: string) => file.endsWith('.pdf'))
          .map(async (file: string) => {
            const filePath = path.join(pdfDir, file);
            try {
              const stat = await fs.stat(filePath);
              return {
                name: file,
                exists: true,
                size: stat.size,
                lastModified: stat.mtime.toISOString(),
              };
            } catch {
              return {
                name: file,
                exists: false,
              };
            }
          })
      );

      stats = {
        total: pdfs.length,
        existing: pdfs.filter(p => p.exists).length,
        missing: pdfs.filter(p => !p.exists).length,
      };
    } catch (error) {
      console.error('Error reading PDF directory:', error);
      // Return empty data if directory doesn't exist
    }

    return {
      props: {
        pdfs,
        stats,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        pdfs: [],
        stats: { total: 0, existing: 0, missing: 0 },
      },
    };
  }
};
