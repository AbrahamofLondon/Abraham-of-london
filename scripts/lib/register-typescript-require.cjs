const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

let registeredRoot = null;
let originalResolveFilename = null;

function createTypeScriptRequire(repoRoot) {
  if (!registeredRoot) {
    registerTypeScriptExtensions(repoRoot);
    registeredRoot = repoRoot;
  }

  return Module.createRequire(path.join(repoRoot, "package.json"));
}

function registerTypeScriptExtensions(repoRoot) {
  originalResolveFilename = Module._resolveFilename;

  Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
    if (typeof request === "string" && request.startsWith("@/")) {
      request = path.join(repoRoot, request.slice(2));
    }
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };

  Module._extensions[".ts"] = (module, filename) => {
    compileTypeScriptModule(module, filename, repoRoot);
  };

  Module._extensions[".tsx"] = (module, filename) => {
    compileTypeScriptModule(module, filename, repoRoot);
  };
}

function compileTypeScriptModule(module, filename, repoRoot) {
  const source = fs.readFileSync(filename, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      jsxImportSource: "react",
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      resolveJsonModule: true,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      baseUrl: repoRoot,
      paths: {
        "@/*": ["./*"],
      },
    },
    fileName: filename,
    reportDiagnostics: false,
  });

  module._compile(transpiled.outputText, filename);
}

module.exports = {
  createTypeScriptRequire,
};
