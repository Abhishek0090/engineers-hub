// Renders the small text format used in content JSON:
//   blank line = new paragraph, "- " lines = bullets, `code` and **bold** inline,
//   consecutive "| a | b |" lines = a table (first row is the header, "| --- |" rows are skipped).
import { Fragment, type ReactNode } from "react";

export function Inline({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    const tok = m[0];
    parts.push(tok.startsWith("`") ? <code key={i++}>{tok.slice(1, -1)}</code> : <strong key={i++}>{tok.slice(2, -2)}</strong>);
    last = m.index + tok.length;
  }
  if (last < text.length) parts.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}

export function RichText({ text, className = "prose" }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let para: string[] = [];
  let list: string[] = [];
  let table: string[][] = [];
  const flushPara = () => {
    if (para.length) blocks.push(<p key={blocks.length}><Inline text={para.join(" ")} /></p>);
    para = [];
  };
  const flushList = () => {
    if (list.length)
      blocks.push(
        <ul key={blocks.length}>
          {list.map((item, i) => (
            <li key={i}>
              <Inline text={item} />
            </li>
          ))}
        </ul>,
      );
    list = [];
  };
  const flushTable = () => {
    if (table.length) {
      const [head, ...body] = table;
      const numeric = (cell: string) => /^\(?-?₹?\s?[\d,.]+%?\)?$/.test(cell.replace(/\*\*/g, ""));
      blocks.push(
        <div key={blocks.length} className="table-wrap">
          <table>
            <thead>
              <tr>{head.map((c, i) => <th key={i}><Inline text={c} /></th>)}</tr>
            </thead>
            <tbody>
              {body.map((row, r) => (
                <tr key={r}>
                  {row.map((c, i) => (
                    <td key={i} className={numeric(c) ? "num" : undefined}><Inline text={c} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    }
    table = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith("|")) {
      flushPara();
      flushList();
      const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      if (!cells.every((c) => /^:?-{3,}:?$/.test(c))) table.push(cells);
      continue;
    }
    flushTable();
    if (!line) {
      flushPara();
      flushList();
    } else if (/^[-*] /.test(line)) {
      flushPara();
      list.push(line.slice(2));
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  flushTable();
  return <div className={className}>{blocks}</div>;
}
