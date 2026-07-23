// Coloration syntaxique Python légère → HTML (spans avec classes tok-*)

const KEYWORDS = new Set([
  'def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or',
  'import', 'from', 'as', 'class', 'try', 'except', 'finally', 'raise', 'with',
  'lambda', 'pass', 'break', 'continue', 'yield', 'assert', 'global', 'nonlocal',
  'is', 'del', 'async', 'await',
])
const CONSTANTS = new Set(['True', 'False', 'None', 'self'])
const BUILTINS = new Set([
  'print', 'len', 'range', 'enumerate', 'zip', 'sorted', 'sum', 'min', 'max',
  'abs', 'int', 'float', 'str', 'list', 'dict', 'set', 'tuple', 'bool', 'type',
  'isinstance', 'repr', 'round', 'exec', 'compile', 'map', 'filter', 'any', 'all',
])

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const TOKEN_RE = /("""[\s\S]*?"""|'''[\s\S]*?'''|f?"(?:[^"\\\n]|\\.)*"|f?'(?:[^'\\\n]|\\.)*'|#[^\n]*|\b\d+\.?\d*(?:e[+-]?\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|@[A-Za-z_][A-Za-z0-9_.]*)/g

export function highlightPython(code: string): string {
  let out = ''
  let last = 0
  let m: RegExpExecArray | null
  TOKEN_RE.lastIndex = 0
  while ((m = TOKEN_RE.exec(code)) !== null) {
    out += esc(code.slice(last, m.index))
    const tok = m[0]
    let cls: string | null = null
    if (tok.startsWith('#')) cls = 'tok-comment'
    else if (/^(f?["']|"""|''')/.test(tok)) cls = 'tok-string'
    else if (/^\d/.test(tok)) cls = 'tok-number'
    else if (tok.startsWith('@')) cls = 'tok-decorator'
    else if (KEYWORDS.has(tok)) cls = 'tok-keyword'
    else if (CONSTANTS.has(tok)) cls = 'tok-const'
    else if (BUILTINS.has(tok)) cls = 'tok-builtin'
    // Nom suivi d'une parenthèse ouvrante → appel de fonction
    else if (code[m.index + tok.length] === '(') cls = 'tok-func'
    out += cls ? `<span class="${cls}">${esc(tok)}</span>` : esc(tok)
    last = m.index + tok.length
  }
  out += esc(code.slice(last))
  return out
}
