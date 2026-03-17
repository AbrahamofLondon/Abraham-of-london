function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderFigureBlock(args: {
  title: string;
  body: string;
  caption?: string;
  source?: string;
  number?: string;
  size?: 'small' | 'medium' | 'large';
  borderStyle?: 'solid' | 'subtle' | 'none';
  backgroundColor?: string;
}): string {
  const title = escapeHtml(args.title);
  const body = args.body; // Don't escape - may contain HTML
  const caption = args.caption ? escapeHtml(args.caption) : '';
  const source = args.source ? escapeHtml(args.source) : '';
  const number = args.number ? escapeHtml(args.number) : '';
  const size = args.size || 'medium';
  const borderStyle = args.borderStyle || 'solid';
  const backgroundColor = args.backgroundColor || '#fcfbf8';

  // Size mappings
  const titleSize = {
    small: '14px',
    medium: '16px',
    large: '18px'
  }[size];

  const bodySize = {
    small: '9.5px',
    medium: '10.25px',
    large: '11px'
  }[size];

  const spacing = {
    small: '20px',
    medium: '26px',
    large: '32px'
  }[size];

  // Border style
  const borderStyles = {
    solid: `1px solid #e8dfcf`,
    subtle: `1px solid rgba(232, 223, 207, 0.5)`,
    none: 'none'
  }[borderStyle];

  return `
    <section style="
      margin: ${spacing} 0;
      padding: 0;
      position: relative;
      font-family: Georgia, 'Times New Roman', serif;
      break-inside: avoid;
    ">
      <!-- Decorative top rule if numbered -->
      ${number ? `
        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        ">
          <div style="
            width: 40px;
            height: 2px;
            background: linear-gradient(90deg, #b8923f 0%, #e8dfcf 100%);
            border-radius: 0 2px 2px 0;
          "></div>
          <div style="
            font: 600 9px 'Arial', sans-serif;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #b8923f;
          ">
            Figure ${number}
          </div>
        </div>
      ` : ''}

      <!-- Main figure container -->
      <div style="
        border: ${borderStyles};
        background: ${backgroundColor};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        overflow: hidden;
      ">
        <!-- Figure header (if title provided) -->
        ${title ? `
          <div style="
            padding: 16px 20px 8px 20px;
            border-bottom: 1px solid rgba(232, 223, 207, 0.4);
          ">
            <div style="
              font-family: Georgia, 'Times New Roman', serif;
              font-size: ${titleSize};
              font-weight: 600;
              line-height: 1.4;
              color: #0c1730;
              letter-spacing: -0.01em;
            ">
              ${title}
            </div>
          </div>
        ` : ''}

        <!-- Figure body (ASCII/Unicode diagram) -->
        <div style="
          padding: ${title ? '8px 20px 16px 20px' : '20px'};
        ">
          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: ${bodySize};
            line-height: 1.6;
            color: #1e2a3a;
            white-space: pre-wrap;
            word-break: break-word;
            background: linear-gradient(180deg, #f8f6f1 0%, #fefdfa 100%);
            border: 1px solid #e8dfcf;
            border-radius: 6px;
            padding: 16px 16px 14px;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);
          ">
            ${body}
          </div>

          <!-- Caption (if provided) -->
          ${caption ? `
            <div style="
              margin-top: 12px;
              font-size: 11px;
              line-height: 1.6;
              color: #5f6470;
              font-style: italic;
              border-left: 2px solid #b8923f;
              padding-left: 14px;
            ">
              ${caption}
            </div>
          ` : ''}

          <!-- Source attribution (if provided) -->
          ${source ? `
            <div style="
              margin-top: 10px;
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 9px;
              color: #8a8f99;
            ">
              <span style="
                display: inline-block;
                width: 20px;
                height: 1px;
                background: #d8cfc0;
              "></span>
              <span style="
                font-family: 'Arial', sans-serif;
                letter-spacing: 0.02em;
              ">
                Source: ${source}
              </span>
            </div>
          ` : ''}
        </div>

        <!-- Subtle corner accent for numbered figures -->
        ${number ? `
          <div style="
            position: relative;
            height: 4px;
            background: linear-gradient(90deg, #b8923f 0%, #e8dfcf 50%, transparent 100%);
            margin-top: -1px;
          "></div>
        ` : ''}
      </div>
    </section>
  `;
}