// patches/windows-fix.mjs
import Module from 'module';

const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  // Fix for mdast-util-to-markdown Windows issue
  if (request && request.includes('mdast-util-to-markdown/lib/util/container-phrasing.js')) {
    try {
      // Try to find the actual file path
      const fixedRequest = request.replace(
        /mdast-util-to-markdown(\\|\/)lib(\\|\/)util(\\|\/)container-phrasing\.js$/,
        'mdast-util-to-markdown/lib/util/container-phrasing.js'
      );
      return originalResolveFilename.call(this, fixedRequest, parent, isMain, options);
    } catch (e) {
      // Fall through to original
    }
  }
  
  // Fix for Contentlayer Windows path issues
  if (request && request.includes('.contentlayer')) {
    const normalizedRequest = request.replace(/\\/g, '/');
    return originalResolveFilename.call(this, normalizedRequest, parent, isMain, options);
  }
  
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

console.log('✅ Applied Windows path fixes for Contentlayer');
