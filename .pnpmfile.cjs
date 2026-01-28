module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.name === 'sst') {
        pkg.dependencies = pkg.dependencies || {};
        pkg.dependencies.hono = '^4.11.4';
        pkg.dependencies['@modelcontextprotocol/sdk'] = '^1.25.2';
      }
      return pkg;
    }
  }
};