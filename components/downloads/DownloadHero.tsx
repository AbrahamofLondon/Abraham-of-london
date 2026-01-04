import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Download, FileText, Clock, Calendar, Lock, Unlock } from 'lucide-react'

interface DownloadHeroProps {
  title: string
  description?: string
  fileSize?: string
  fileType?: string
  format?: string
  version?: string
  updated?: string
  accessLevel?: 'public' | 'registered' | 'inner-circle'
  downloadUrl?: string
  className?: string
}

const DownloadHero: React.FC<DownloadHeroProps> = ({
  title,
  description,
  fileSize = '1.8 MB',
  fileType = 'PDF',
  format = 'Interactive PDF',
  version = '1.0',
  updated,
  accessLevel = 'public',
  downloadUrl,
  className = ''
}) => {
  const isLocked = accessLevel !== 'public'
  
  return (
    <div className={`bg-gradient-to-br from-slate-900 to-slate-800 text-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="lg:flex lg:items-start lg:justify-between">
          {/* Main Content */}
          <div className="lg:w-2/3">
            <Link
              href="/downloads"
              className="inline-flex items-center text-slate-300 hover:text-white mb-6"
            >
              ← Back to Downloads
            </Link>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{title}</h1>
            
            {description && (
              <p className="text-xl text-slate-300 mb-8 max-w-3xl">
                {description}
              </p>
            )}
            
            {/* Metadata */}
            <div className="flex flex-wrap gap-6 mb-8">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                <span>{fileType} • {format}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                <span>{fileSize}</span>
              </div>
              
              {updated && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <span>Updated {new Date(updated).toLocaleDateString('en-GB')}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isLocked
                    ? 'bg-amber-900/50 text-amber-100 border border-amber-700'
                    : 'bg-emerald-900/50 text-emerald-100 border border-emerald-700'
                }`}>
                  {isLocked ? (
                    <>
                      <Lock className="w-3 h-3 inline mr-1" />
                      {accessLevel}
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3 inline mr-1" />
                      Public Access
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              {isLocked ? (
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 max-w-md">
                  <div className="flex items-center gap-3 mb-3">
                    <Lock className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold text-amber-100">Members Only</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-4">
                    This download requires {accessLevel} access. Join our community to unlock premium resources.
                  </p>
                  <Link
                    href="/membership"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold hover:from-amber-700 hover:to-amber-800 transition-all duration-200"
                  >
                    Join Now
                  </Link>
                </div>
              ) : (
                <>
                  {downloadUrl && (
                    <Link
                      href={downloadUrl}
                      className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                      download
                    >
                      <Download className="w-5 h-5 mr-3" />
                      Download Now
                    </Link>
                  )}
                  
                  <button className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-slate-700/50 text-white font-semibold hover:bg-slate-700 transition-all duration-200 border border-slate-600 hover:border-slate-500">
                    <FileText className="w-5 h-5 mr-3" />
                    Preview
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Side Stats */}
          <div className="lg:w-1/3 lg:pl-8 mt-8 lg:mt-0">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Download Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Version</span>
                  <span className="font-medium">{version}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Format</span>
                  <span className="font-medium">{format}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">File Size</span>
                  <span className="font-medium">{fileSize}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Compatibility</span>
                  <span className="font-medium">All devices</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Last Updated</span>
                  <span className="font-medium">
                    {updated ? new Date(updated).toLocaleDateString('en-GB') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DownloadHero