import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Download, BookOpen, Clock, User, Lock, Unlock } from 'lucide-react'

interface BookHeroProps {
  title: string
  subtitle?: string
  author?: string
  coverImage?: string
  description?: string
  readTime?: string
  publishedDate?: string
  isbn?: string
  accessLevel?: 'public' | 'inner-circle' | 'patron'
  downloadUrl?: string
  lockMessage?: string
  className?: string
}

const BookHero: React.FC<BookHeroProps> = ({
  title,
  subtitle,
  author = 'Abraham of London',
  coverImage,
  description,
  readTime,
  publishedDate,
  isbn,
  accessLevel = 'public',
  downloadUrl,
  lockMessage = 'Available to Inner Circle members',
  className = ''
}) => {
  const isLocked = accessLevel !== 'public'
  
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${className}`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
          {/* Book Cover Column */}
          <div className="lg:col-span-4 xl:col-span-3 mb-8 lg:mb-0">
            <div className="relative aspect-[3/4] max-w-xs mx-auto lg:mx-0">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={title}
                  fill
                  className="object-cover rounded-lg shadow-2xl"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg shadow-2xl flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-slate-400" />
                </div>
              )}
              
              {/* Access Badge */}
              <div className={`absolute -top-3 -right-3 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg ${
                isLocked 
                  ? 'bg-amber-900/90 text-amber-100 border border-amber-700' 
                  : 'bg-emerald-900/90 text-emerald-100 border border-emerald-700'
              }`}>
                {isLocked ? (
                  <>
                    <Lock className="w-4 h-4" />
                    {accessLevel}
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    Public Access
                  </>
                )}
              </div>
            </div>
            
            {/* Book Details */}
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              {isbn && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-400">ISBN:</span>
                  <span className="font-mono">{isbn}</span>
                </div>
              )}
              
              {publishedDate && (
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-400">Published:</span>
                  <span>{new Date(publishedDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Content Column */}
          <div className="lg:col-span-8 xl:col-span-9 lg:pl-8">
            {/* Category/Series Badge */}
            {subtitle && (
              <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-slate-700/50 text-slate-300 text-sm font-medium border border-slate-600">
                {subtitle}
              </div>
            )}
            
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              {title}
            </h1>
            
            {/* Author */}
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-slate-400" />
              <span className="text-lg text-slate-300">{author}</span>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-8">
              {readTime && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span>{readTime} read</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-slate-300">
                <BookOpen className="w-5 h-5 text-slate-400" />
                <span>Book</span>
              </div>
            </div>
            
            {/* Description */}
            {description && (
              <div className="prose prose-lg prose-invert max-w-none mb-8">
                <p className="text-lg text-slate-300 leading-relaxed">
                  {description}
                </p>
              </div>
            )}
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mt-8">
              {isLocked ? (
                <div className="flex-1 min-w-[200px]">
                  <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className="w-5 h-5 text-amber-400" />
                      <span className="font-semibold text-amber-100">Members Only</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-4">
                      {lockMessage}
                    </p>
                    <Link
                      href="/membership"
                      className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 text-white font-semibold hover:from-amber-700 hover:to-amber-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Join Inner Circle
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {downloadUrl && (
                    <Link
                      href={downloadUrl}
                      className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-xl group"
                    >
                      <Download className="w-5 h-5 mr-3 group-hover:translate-y-1 transition-transform" />
                      Download PDF
                    </Link>
                  )}
                  
                  <Link
                    href="#read-online"
                    className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-slate-700/50 text-white font-semibold hover:bg-slate-700 transition-all duration-200 border border-slate-600 hover:border-slate-500"
                  >
                    <BookOpen className="w-5 h-5 mr-3" />
                    Read Online
                  </Link>
                </>
              )}
              
              <Link
                href="/books"
                className="inline-flex items-center justify-center px-6 py-4 rounded-lg text-slate-300 font-medium hover:text-white hover:bg-slate-800/50 transition-all duration-200"
              >
                ← Back to Books
              </Link>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-8 pt-8 border-t border-slate-700/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">300+</div>
                  <div className="text-sm text-slate-400">Pages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">7</div>
                  <div className="text-sm text-slate-400">Chapters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">50+</div>
                  <div className="text-sm text-slate-400">Exercises</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">4.9</div>
                  <div className="text-sm text-slate-400">Rating</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-slate-700/10 to-transparent rounded-full blur-3xl" />
    </div>
  )
}

// Variants for different book types
export const BookHeroWithSeries = (props: BookHeroProps & { seriesName: string; bookNumber: number }) => (
  <BookHero
    {...props}
    subtitle={`${props.seriesName} • Book ${props.bookNumber}`}
  />
)

export const BookHeroWithPreview = (props: BookHeroProps & { previewUrl: string }) => (
  <div className="space-y-8">
    <BookHero {...props} />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Preview Chapter</h3>
        <div className="prose prose-invert max-w-none">
          <p className="text-slate-300">
            Read the first chapter to get a taste of the content...
          </p>
        </div>
        <Link
          href={props.previewUrl}
          className="inline-flex items-center mt-4 px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
        >
          Read Preview →
        </Link>
      </div>
    </div>
  </div>
)

export default BookHero