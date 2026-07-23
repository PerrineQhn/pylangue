import React from 'react'
import { highlightPython } from './highlight'

// Mini-renderer markdown : titres, gras, italique, code inline, blocs de code, listes, paragraphes.
function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = []
  // split on `code`, **bold**, *italic*
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('`')) {
      out.push(<code key={`${keyBase}-${i++}`} className="md-inline-code">{tok.slice(1, -1)}</code>)
    } else if (tok.startsWith('**')) {
      out.push(<strong key={`${keyBase}-${i++}`}>{tok.slice(2, -2)}</strong>)
    } else {
      out.push(<em key={`${keyBase}-${i++}`}>{tok.slice(1, -1)}</em>)
    }
    last = m.index + tok.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function Markdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const buf: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { buf.push(lines[i]); i++ }
      i++
      blocks.push(<pre key={key++} className="md-codeblock"><code dangerouslySetInnerHTML={{ __html: highlightPython(buf.join('\n')) }} /></pre>)
      continue
    }
    if (line.startsWith('### ')) { blocks.push(<h4 key={key++}>{inline(line.slice(4), `h${key}`)}</h4>); i++; continue }
    if (line.startsWith('## ')) { blocks.push(<h3 key={key++}>{inline(line.slice(3), `h${key}`)}</h3>); i++; continue }
    if (line.startsWith('# ')) { blocks.push(<h2 key={key++}>{inline(line.slice(2), `h${key}`)}</h2>); i++; continue }
    if (line.startsWith('> ')) {
      const buf: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) { buf.push(lines[i].slice(2)); i++ }
      blocks.push(<blockquote key={key++}>{inline(buf.join(' '), `q${key}`)}</blockquote>)
      continue
    }
    if (/^[-*] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(lines[i].slice(2)); i++ }
      blocks.push(<ul key={key++}>{items.map((it, j) => <li key={j}>{inline(it, `li${key}-${j}`)}</li>)}</ul>)
      continue
    }
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, '')); i++ }
      blocks.push(<ol key={key++}>{items.map((it, j) => <li key={j}>{inline(it, `ol${key}-${j}`)}</li>)}</ol>)
      continue
    }
    if (line.trim() === '') { i++; continue }
    const buf: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !/^(#|```|[-*] |\d+\. |> )/.test(lines[i])) {
      buf.push(lines[i]); i++
    }
    blocks.push(<p key={key++}>{inline(buf.join(' '), `p${key}`)}</p>)
  }
  return <div className="md">{blocks}</div>
}
