function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderFigureCaption(args: {
  number: string;
  title: string;
  subtitle?: string;
  note?: string;
  credit?: string;
  source?: string;
  size?: 'small' | 'medium' | 'large';
  alignment?: 'left' | 'center' | 'right';
}): string {
  const size = args.size || 'medium';
  const alignment = args.alignment || 'left';
  
  // Size mappings
  const titleSize = {
    small: '11px',
    medium: '13px',
    large: '16px'
  }[size];
  
  const spacing = {
    small: '8px',
    medium: '12px',
    large: '16px'
  }[size];
  
  // Alignment mappings
  const textAlign = alignment;
  const captionAlign = alignment === 'center' ? 'center' : 'left';
  const marginAlign = alignment === 'right' ? '0 0 0 auto' : '0';
  
  return `
    <div style="
      margin-top: ${spacing};
      margin-bottom: ${spacing};
      max-width: ${alignment === 'center' ? '80%' : '100%'};
      margin-${alignment === 'center' ? 'left' : 'right'}: auto;
      ${alignment === 'right' ? 'margin-left: auto;' : ''}
      font-family: 'Arial', 'Helvetica', sans-serif;
      border-top: 1px solid #e8dfcf;
      padding-top: ${spacing};
    ">
      <!-- Figure number with decorative rule -->
      <div style="
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;
        justify-content: ${alignment === 'center' ? 'center' : 'flex-start'};
      ">
        <div style="
          width: 24px;
          height: 1px;
          background: linear-gradient(90deg, #b8923f 0%, ${alignment === 'center' ? '#e8dfcf' : 'transparent'} 100%);
        "></div>
        <div style="
          font: 600 8px 'Arial', sans-serif;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #b8923f;
        ">
          FIGURE ${escapeHtml(args.number)}
        </div>
        <div style="
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, ${alignment === 'center' ? '#e8dfcf' : 'transparent'} 0%, #e8dfcf 100%);
        "></div>
      </div>

      <!-- Main title with elegant typography -->
      <div style="
        font-family: Georgia, 'Times New Roman', serif;
        font-size: ${titleSize};
        font-weight: 600;
        line-height: 1.4;
        color: #0c1730;
        text-align: ${captionAlign};
        margin: 6px 0 4px 0;
        letter-spacing: -0.01em;
      ">
        ${escapeHtml(args.title)}
      </div>

      <!-- Optional subtitle (smaller, italic) -->
      ${
        args.subtitle
          ? `<div style="
              font-family: Georgia, 'Times New Roman', serif;
              font-size: 11px;
              font-style: italic;
              line-height: 1.5;
              color: #5f6470;
              text-align: ${captionAlign};
              margin-bottom: 6px;
            ">
              ${escapeHtml(args.subtitle)}
            </div>`
          : ""
      }

      <!-- Note section with subtle styling -->
      ${
        args.note
          ? `<div style="
              margin-top: 6px;
              padding: 8px 12px;
              background: #f9f7f2;
              border-left: 2px solid #b8923f;
              font-size: 10px;
              line-height: 1.6;
              color: #4a4f5c;
              text-align: ${captionAlign};
              border-radius: 0 4px 4px 0;
            ">
              ${escapeHtml(args.note)}
            </div>`
          : ""
      }

      <!-- Source/credit line with subtle divider -->
      ${
        args.credit || args.source
          ? `<div style="
              margin-top: 8px;
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 8px;
              color: #8a8f99;
              justify-content: ${alignment === 'center' ? 'center' : 'flex-start'};
            ">
              <span style="
                display: inline-block;
                width: 16px;
                height: 1px;
                background: #d8cfc0;
              "></span>
              <span style="
                font-family: 'Courier New', monospace;
                letter-spacing: 0.02em;
              ">
                ${args.credit ? `📷 ${escapeHtml(args.credit)}` : ''}
                ${args.credit && args.source ? ' · ' : ''}
                ${args.source ? `📚 ${escapeHtml(args.source)}` : ''}
              </span>
            </div>`
          : ""
      }
    </div>
  `;
}