import fs from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.cwd()
const inputPath = path.join(rootDir, 'NEXZEN_USER_MANUAL.md')
const outputHtmlPath = path.join(rootDir, 'NEXZEN_USER_MANUAL.html')

function escapeHtml(value) {
  return `${value || ''}`
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function inlineMarkdown(text) {
  let html = escapeHtml(text)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  return html
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let listItems = []
  let listType = null
  let paragraph = []

  function flushParagraph() {
    if (!paragraph.length) {
      return
    }

    blocks.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`)
    paragraph = []
  }

  function flushList() {
    if (!listItems.length) {
      return
    }

    const tag = listType === 'ol' ? 'ol' : 'ul'
    blocks.push(`<${tag}>${listItems.map((item) => `<li>${inlineMarkdown(item)}</li>`).join('')}</${tag}>`)
    listItems = []
    listType = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      flushList()
      continue
    }

    if (trimmed === '---') {
      flushParagraph()
      flushList()
      blocks.push('<hr />')
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      const level = headingMatch[1].length
      blocks.push(`<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`)
      continue
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/)
    if (orderedMatch) {
      flushParagraph()
      if (listType && listType !== 'ol') {
        flushList()
      }
      listType = 'ol'
      listItems.push(orderedMatch[1])
      continue
    }

    const unorderedMatch = trimmed.match(/^-\s+(.*)$/)
    if (unorderedMatch) {
      flushParagraph()
      if (listType && listType !== 'ul') {
        flushList()
      }
      listType = 'ul'
      listItems.push(unorderedMatch[1])
      continue
    }

    flushList()
    paragraph.push(trimmed)
  }

  flushParagraph()
  flushList()

  return blocks.join('\n')
}

function buildDocument(bodyHtml) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nexzen User Manual</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #0f172a;
      --muted: #475569;
      --line: #cbd5e1;
      --accent: #1d4ed8;
      --paper: #ffffff;
      --panel: #f8fafc;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: var(--paper); color: var(--ink); }
    body {
      font-family: "Segoe UI", Inter, Arial, sans-serif;
      line-height: 1.6;
      font-size: 12px;
    }
    .page {
      max-width: 920px;
      margin: 0 auto;
      padding: 40px 44px 56px;
    }
    .hero {
      border: 1px solid var(--line);
      border-radius: 20px;
      background: linear-gradient(135deg, #eff6ff, #ffffff 55%);
      padding: 28px 30px;
      margin-bottom: 28px;
    }
    .eyebrow {
      margin: 0 0 8px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.22em;
      font-size: 10px;
      font-weight: 700;
    }
    .hero h1 {
      margin: 0;
      font-size: 32px;
      line-height: 1.15;
    }
    .hero p {
      margin: 10px 0 0;
      color: var(--muted);
      font-size: 13px;
    }
    h1, h2, h3, h4, h5, h6 {
      color: var(--ink);
      line-height: 1.2;
      margin: 0;
      page-break-after: avoid;
    }
    h1 { font-size: 30px; margin: 0 0 12px; }
    h2 {
      font-size: 22px;
      margin: 32px 0 12px;
      padding-top: 4px;
      border-top: 1px solid transparent;
    }
    h3 { font-size: 16px; margin: 22px 0 10px; color: #0b3aa4; }
    h4, h5, h6 { font-size: 13px; margin: 18px 0 8px; }
    p {
      margin: 0 0 12px;
      color: var(--muted);
      page-break-inside: avoid;
    }
    ul, ol {
      margin: 0 0 14px 20px;
      padding: 0;
      color: var(--muted);
    }
    li {
      margin: 0 0 5px;
      page-break-inside: avoid;
    }
    hr {
      border: 0;
      border-top: 1px solid var(--line);
      margin: 22px 0;
    }
    code {
      font-family: Consolas, "Courier New", monospace;
      font-size: 0.95em;
      background: #eff6ff;
      color: #1e3a8a;
      padding: 1px 6px;
      border-radius: 999px;
      border: 1px solid #dbeafe;
      word-break: break-word;
    }
    strong { color: var(--ink); }
    @page {
      size: A4;
      margin: 16mm 12mm 18mm;
    }
    @media print {
      .page {
        max-width: none;
        padding: 0;
      }
      a { color: inherit; text-decoration: none; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <p class="eyebrow">Nexzen Documentation</p>
      <h1>Nexzen User Manual</h1>
      <p>Customer usage, admin controls, hidden paths, storefront features, and a detailed Active Orders Pipeline guide.</p>
    </section>
    ${bodyHtml}
  </main>
</body>
</html>`
}

const markdown = await fs.readFile(inputPath, 'utf8')
const html = buildDocument(renderMarkdown(markdown))
await fs.writeFile(outputHtmlPath, html, 'utf8')

console.log(outputHtmlPath)
