/* .pnpmfile.cjs */
function readPackage(pkg, context) {
  // Force remark-gfm to 3.0.1 everywhere it appears
  if (pkg.dependencies && pkg.dependencies['remark-gfm']) {
    pkg.dependencies['remark-gfm'] = '3.0.1';
  }
  if (pkg.devDependencies && pkg.devDependencies['remark-gfm']) {
    pkg.devDependencies['remark-gfm'] = '3.0.1';
  }
  
  // Force rehype-slug to 5.1.0 everywhere it appears
  if (pkg.dependencies && pkg.dependencies['rehype-slug']) {
    pkg.dependencies['rehype-slug'] = '5.1.0';
  }
  if (pkg.devDependencies && pkg.devDependencies['rehype-slug']) {
    pkg.devDependencies['rehype-slug'] = '5.1.0';
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
}