import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  safeString, 
  safeFirstChar, 
  safeUrl,
  safeImageSrc,
  safeArray,
  classNames 
} from '@/lib/utils/safe';
import { ArrowRight, Twitter, Linkedin, Github, Globe } from 'lucide-react';

interface SocialLinks {
  twitter?: string | null;
  linkedin?: string | null;
  github?: string | null;
}

interface AuthorBioProps {
  author?: string | null;
  bio?: string | null;
  website?: string | null;
  avatar?: string | null;
  social?: SocialLinks;
  works?: string[];
}

const AuthorBio: React.FC<AuthorBioProps> = (props) => {
  // Extract and sanitize
  const author = safeString(props.author, 'Anonymous');
  const bio = safeString(props.bio, 'Content creator and thought leader sharing insights on business, technology, and innovation.');
  const website = safeUrl(props.website, 'https://abrahamoflondon.org');
  const avatar = safeImageSrc(props.avatar);
  const social = props.social || {};
  const works = safeArray<string>(props.works, [
    'Latest Articles',
    'Free Resources', 
    'Recommended Reading'
  ]);
  
  const authorInitial = safeFirstChar(author, 'A');

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200">
      {/* Animated background effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 via-transparent to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative flex flex-col md:flex-row items-start md:items-center gap-8">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="relative h-24 w-24">
            {avatar ? (
              <div className="relative h-full w-full overflow-hidden rounded-full border-4 border-white shadow-xl">
                <Image
                  src={avatar}
                  alt={author}
                  fill
                  className="object-cover"
                  sizes="96px"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="h-full w-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                <span className="text-2xl font-bold text-white">
                  {authorInitial}
                </span>
              </div>
            )}
            
            {/* Online indicator */}
            <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-2 border-white bg-green-500" />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-2xl font-bold text-gray-900">
                About {author}
              </h3>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                Author
              </span>
            </div>
            
            <p className="text-gray-700 leading-relaxed">
              {bio}
            </p>
          </div>
          
          {/* Links */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={website}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-blue-600 font-medium hover:bg-blue-100 transition-colors group/link"
            >
              <Globe className="h-4 w-4" />
              <span>Visit Website</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-1" />
            </Link>
            
            {(social.twitter || social.linkedin || social.github) && (
              <div className="flex items-center gap-3">
                {social.twitter && (
                  <a
                    href={safeUrl(social.twitter)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-400 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                    aria-label={`Follow ${author} on Twitter`}
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {social.linkedin && (
                  <a
                    href={safeUrl(social.linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-700 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                    aria-label={`Follow ${author} on LinkedIn`}
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                )}
                {social.github && (
                  <a
                    href={safeUrl(social.github)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                    aria-label={`Follow ${author} on GitHub`}
                  >
                    <Github className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Works Section */}
      <div className="relative mt-12 pt-8 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <div className="h-1.5 w-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
          More from {author}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {works.map((work, index) => (
            <div
              key={index}
              className="group/work relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-white p-4 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover/work:opacity-100 transition-opacity duration-300" />
              
              <div className="relative">
                <div className="font-medium text-gray-900 group-hover/work:text-blue-600 transition-colors">
                  {work}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-600 group-hover/work:text-blue-500 transition-colors">
                    Explore →
                  </span>
                  <span className="text-xs text-gray-400">
                    {index + 1}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Decorative element */}
      <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-blue-500/5 to-purple-500/5 rounded-full -translate-y-16 translate-x-16" />
    </div>
  );
};

export default AuthorBio;