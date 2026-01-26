module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow unsafe string methods",
      category: "Best Practices",
      recommended: true,
    },
    fixable: "code",
    schema: [],
  },
  create(context) {
    return {
      MemberExpression(node) {
        const unsafeMethods = ['charAt', 'substring', 'slice', 'toUpperCase', 'toLowerCase'];
        
        if (
          node.object.type === 'Identifier' && 
          node.property.type === 'Identifier' &&
          unsafeMethods.includes(node.property.name)
        ) {
          // Check if it's a string property access
          const objectName = node.object.name;
          
          // You could check types here, but for simplicity we'll flag all
          context.report({
            node,
            message: `Avoid using ${node.property.name}() directly on strings. Use safe utilities from '@/lib/utils/safe' instead.`,
            fix(fixer) {
              // Provide a basic fix suggestion
              const sourceCode = context.getSourceCode();
              const text = sourceCode.getText(node);
              
              if (node.property.name === 'charAt' && node.arguments?.length === 1) {
                const argText = sourceCode.getText(node.arguments[0]);
                return fixer.replaceText(node, `safeCharAt(${objectName}, ${argText})`);
              }
              
              return null;
            }
          });
        }
      }
    };
  }
};