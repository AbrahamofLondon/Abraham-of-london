// pages/diagnostic.tsx
export default function Diagnostic() {
  return (
    <html>
      <head>
        <title>CSS Diagnostic</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: system-ui, -apple-system, sans-serif;
            padding: 2rem;
            background: #050608;
            color: #f4f1ea;
          }
          .test-box { 
            background: #d6b26a; 
            color: #15171c; 
            padding: 1rem; 
            margin: 1rem 0;
            border-radius: 8px;
          }
        `}</style>
      </head>
      <body>
        <h1>🎨 CSS Diagnostic Tool</h1>
        
        <div class="test-box">
          <h2>Test 1: Inline Styles</h2>
          <p>This box uses inline CSS. If it's gold, inline CSS works.</p>
        </div>
        
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-2">Test 2: Tailwind Classes</h2>
          <p className="text-slate-300">
            This uses Tailwind classes. If styled, Tailwind is working.
          </p>
          <button className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded hover:bg-amber-400">
            Tailwind Button
          </button>
        </div>
        
        <div style={{marginTop: '2rem', padding: '1rem', background: '#1a1b1e', borderRadius: '8px'}}>
          <h3 style={{color: '#d6b26a', marginBottom: '0.5rem'}}>CSS Variables Check:</h3>
          <div id="css-vars" style={{fontFamily: 'monospace', fontSize: '0.9rem'}}>
            {/* This will be populated by JavaScript */}
          </div>
        </div>
        
        <script dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              const rootStyles = getComputedStyle(document.documentElement);
              const vars = [
                '--color-background',
                '--color-primary',
                '--font-family-sans'
              ];
              
              const output = vars.map(v => {
                const value = rootStyles.getPropertyValue(v).trim();
                return \`<div><strong>\${v}:</strong> <span style="color: #d6b26a">\${value || 'NOT FOUND'}</span></div>\`;
              }).join('');
              
              document.getElementById('css-vars').innerHTML = output;
              
              // Log to console
              console.log('CSS Variables:', {
                background: rootStyles.getPropertyValue('--color-background').trim(),
                primary: rootStyles.getPropertyValue('--color-primary').trim(),
                font: rootStyles.getPropertyValue('--font-family-sans').trim()
              });
            });
          `
        }} />
      </body>
    </html>
  );
}
