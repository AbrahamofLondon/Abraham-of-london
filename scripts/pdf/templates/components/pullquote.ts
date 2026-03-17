export function renderPullQuote(text: string): string {
  return `
    <section style="
      margin: 30px 0 32px;
      padding: 20px 28px 18px;
      border-top: 1px solid #e8dfcf;
      border-bottom: 1px solid #e8dfcf;
      text-align: center;
      background: linear-gradient(180deg, rgba(17,19,24,0.015), rgba(17,19,24,0));
    ">
      <div style="
        font-family: Georgia, 'Times New Roman', serif;
        font-style: italic;
        font-size: 20px;
        line-height: 1.58;
        color: #1b2130;
        max-width: 88%;
        margin: 0 auto;
      ">
        ${text}
      </div>
    </section>
  `;
}