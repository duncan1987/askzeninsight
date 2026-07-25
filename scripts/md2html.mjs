import { readFileSync, writeFileSync } from 'fs';
import { marked } from 'marked';

const md = readFileSync('docs/business-plan-zh.md', 'utf-8');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ask Zen Insight（问禅）商业计划书</title>
<style>
@page {
    size: A4;
    margin: 2cm 2.5cm;
}
* { box-sizing: border-box; }
body {
    font-family: "Microsoft YaHei", "微软雅黑", "PingFang SC", "Noto Sans CJK SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 11pt;
    line-height: 1.9;
    color: #1a1a1a;
    max-width: 210mm;
    margin: 0 auto;
    padding: 40px 60px;
    background: #fff;
}
h1 {
    font-size: 22pt;
    color: #1a365d;
    margin-top: 24pt;
    margin-bottom: 12pt;
    border-bottom: 3px solid #2b6cb0;
    padding-bottom: 10pt;
    letter-spacing: 1pt;
}
h2 {
    font-size: 16pt;
    color: #2b6cb0;
    margin-top: 28pt;
    margin-bottom: 12pt;
    border-bottom: 1px solid #bee3f8;
    padding-bottom: 6pt;
}
h3 {
    font-size: 13pt;
    color: #2c5282;
    margin-top: 18pt;
    margin-bottom: 8pt;
}
h4 {
    font-size: 11.5pt;
    color: #2d3748;
    margin-top: 14pt;
    margin-bottom: 6pt;
}
p { margin: 6pt 0; text-align: justify; }
table {
    border-collapse: collapse;
    width: 100%;
    margin: 12pt 0;
    font-size: 10pt;
    page-break-inside: avoid;
}
th {
    background-color: #ebf4ff;
    color: #1a365d;
    border: 1px solid #a0c4e8;
    padding: 7pt 10pt;
    text-align: left;
    font-weight: bold;
    white-space: nowrap;
}
td {
    border: 1px solid #d0dce8;
    padding: 6pt 10pt;
    vertical-align: top;
}
tr:nth-child(even) { background-color: #f7fafc; }
tr:hover { background-color: #edf2f7; }
blockquote {
    border-left: 4px solid #4299e1;
    padding: 10pt 18pt;
    margin: 12pt 0;
    background: linear-gradient(135deg, #ebf8ff 0%, #f0f7ff 100%);
    color: #2d3748;
    border-radius: 0 6pt 6pt 0;
}
blockquote p { margin: 4pt 0; }
code {
    background-color: #edf2f7;
    padding: 1pt 5pt;
    border-radius: 3pt;
    font-size: 10pt;
    font-family: "Consolas", "Source Code Pro", monospace;
}
pre {
    background-color: #1e293b;
    color: #e2e8f0;
    padding: 14pt 18pt;
    border-radius: 8pt;
    overflow-x: auto;
    font-size: 9pt;
    line-height: 1.7;
    margin: 12pt 0;
    border: 1px solid #334155;
}
pre code {
    background: none;
    padding: 0;
    color: inherit;
    font-size: inherit;
}
strong { color: #1a365d; }
a { color: #2b6cb0; text-decoration: none; border-bottom: 1px solid #bee3f8; }
a:hover { color: #2c5282; border-bottom-color: #2b6cb0; }
hr { border: none; border-top: 2px solid #e2e8f0; margin: 24pt 0; }
ul, ol { padding-left: 22pt; }
li { margin-bottom: 4pt; }
img { max-width: 100%; }

/* Title page styles */
h1:first-of-type {
    text-align: center;
    font-size: 26pt;
    border-bottom: none;
    margin-top: 60pt;
    margin-bottom: 20pt;
}
h1:first-of-type + p {
    text-align: center;
    font-size: 12pt;
    color: #4a5568;
    line-height: 2.2;
}

/* Print optimization */
@media print {
    body { padding: 0; }
    h2 { page-break-after: avoid; }
    table { page-break-inside: avoid; }
    blockquote { page-break-inside: avoid; }
    pre { page-break-inside: avoid; }
}

/* Reference list */
h2:last-of-type + ol,
h2:last-of-type + p + ol {
    font-size: 9pt;
    line-height: 1.6;
}
</style>
</head>
<body>
${marked.parse(md)}
</body>
</html>`;

writeFileSync('docs/business-plan-zh.html', html, 'utf-8');
console.log('HTML generated: docs/business-plan-zh.html');
