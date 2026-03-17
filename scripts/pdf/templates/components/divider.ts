export type DividerStyle = 'classic' | 'elegant' | 'minimal' | 'ornate' | 'gradient';

export function renderDivider(style: DividerStyle = 'classic'): string {
  const dividers = {
    classic: `
      <div style="
        margin: 32px 0;
        border-top: 1px solid #e8dfcf;
        width: 100%;
      "></div>
    `,

    elegant: `
      <div style="
        margin: 36px 0;
        display: flex;
        align-items: center;
        gap: 16px;
      ">
        <div style="
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #b8923f 50%, transparent 100%);
        "></div>
        <span style="
          font-family: 'Arial', sans-serif;
          font-size: 10px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #b8923f;
          opacity: 0.7;
        ">✦</span>
        <div style="
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, #b8923f 50%, transparent 100%);
        "></div>
      </div>
    `,

    minimal: `
      <div style="
        margin: 28px 0;
        display: flex;
        justify-content: center;
      ">
        <div style="
          width: 60px;
          height: 2px;
          background: #b8923f;
          opacity: 0.3;
          border-radius: 2px;
        "></div>
      </div>
    `,

    ornate: `
      <div style="
        margin: 40px 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
      ">
        <div style="
          width: 30px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #b8923f);
        "></div>
        <span style="
          font-family: 'Times New Roman', serif;
          font-size: 16px;
          color: #b8923f;
          opacity: 0.5;
        ">❦</span>
        <div style="
          width: 30px;
          height: 1px;
          background: linear-gradient(90deg, #b8923f, transparent);
        "></div>
      </div>
    `,

    gradient: `
      <div style="
        margin: 34px 0;
        height: 2px;
        background: linear-gradient(90deg, 
          transparent 0%, 
          #e8dfcf 20%, 
          #b8923f 50%, 
          #e8dfcf 80%, 
          transparent 100%
        );
        width: 100%;
      "></div>
    `,
  };

  return dividers[style] || dividers.classic;
}

// For backward compatibility, export a default divider
export const renderClassicDivider = () => renderDivider('classic');
export const renderElegantDivider = () => renderDivider('elegant');
export const renderMinimalDivider = () => renderDivider('minimal');
export const renderOrnateDivider = () => renderDivider('ornate');
export const renderGradientDivider = () => renderDivider('gradient');