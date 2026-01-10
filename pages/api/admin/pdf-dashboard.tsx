import { GetServerSideProps } from 'next';
import { useState } from 'react';
import Head from 'next/head';
import fs from 'fs/promises';
import path from 'path';

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
        <meta name="description" content="Manage and monitor PDF assets" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">PDF Asset Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor and manage your PDF resources</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">Total PDFs</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">Existing</div>
              <div className="text-3xl font-bold text-green-600">{stats.existing}</div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
              <div className="text-sm font-medium text-gray-500 mb-1">Missing</div>
              <div className="text-3xl font-bold text-red-600">{stats.missing}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="flex flex-wrap gap-2 md:gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All PDFs
              </button>
              <button
                onClick={() => setFilter('existing')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'existing'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Existing
              </button>
              <button
                onClick={() => setFilter('missing')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'missing'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Missing
              </button>
            </div>
          </div>

          {/* PDF List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
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
                  {filteredPDFs.length > 0 ? (
                    filteredPDFs.map((pdf, index) => (
                      <tr key={index} className={pdf.exists ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {pdf.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              pdf.exists
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {pdf.exists ? '✓ Available' : '✗ Missing'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {pdf.size ? `${(pdf.size / 1024).toFixed(0)} KB` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {pdf.lastModified 
                            ? new Date(pdf.lastModified).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No PDFs found matching the filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This dashboard checks for PDF files in the <code>/public/pdfs/</code> directory.
              Missing files should be uploaded to ensure all download links work properly.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Server-side data fetching
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const pdfDir = path.join(publicDir, 'pdfs');

    let pdfs: PDFStatus[] = [];
    let stats = { total: 0, existing: 0, missing: 0 };

    try {
      // Check if PDF directory exists
      await fs.access(pdfDir);
      
      // Read directory contents
      const files = await fs.readdir(pdfDir);
      
      // Process PDF files
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      
      pdfs = await Promise.all(
        pdfFiles.map(async (file) => {
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
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Directory doesn't exist
        console.warn('PDF directory not found:', pdfDir);
      } else {
        console.error('Error reading PDF directory:', error);
      }
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