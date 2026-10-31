import { Link } from "react-router-dom";

// Rendu Markdown minimal et SÛR (aucun innerHTML) : titres, listes,
// gras, italique, liens internes (/...) et https, tableaux simples.
// Les marqueurs produits [#ID] sont masqués (les fiches sont affichées à part).

function renderInline(text, keyPrefix) {
    const parts = [];
    const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\([^)\s]+\))/g;
    let last = 0;
    let m;
    let i = 0;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        const tok = m[0];
        const k = `${keyPrefix}-${i++}`;
        if (tok.startsWith("**")) {
            parts.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
        } else if (tok.startsWith("[")) {
            const [, label, href] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
            if (href.startsWith("/") && !href.startsWith("//")) {
                parts.push(<Link key={k} to={href}>{label}</Link>);
            } else if (/^https:\/\//.test(href)) {
                parts.push(<a key={k} href={href} target="_blank" rel="noopener noreferrer">{label}</a>);
            } else {
                parts.push(label);
            }
        } else {
            parts.push(<em key={k}>{tok.slice(1, -1)}</em>);
        }
        last = m.index + tok.length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
}

function MarkdownLite({ text }) {
    const clean = String(text || "").replace(/\s?\[#\d+\]/g, "");
    const lines = clean.split("\n");
    const blocks = [];
    let list = null;
    let table = null;

    const flush = () => {
        if (list) {
            const Tag = list.ordered ? "ol" : "ul";
            blocks.push(<Tag key={`l${blocks.length}`}>{list.items.map((it, j) => <li key={j}>{renderInline(it, `li${blocks.length}-${j}`)}</li>)}</Tag>);
            list = null;
        }
        if (table) {
            const [head, ...rows] = table.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c)));
            blocks.push(
                <div className="md-table-wrap" key={`t${blocks.length}`}>
                    <table>
                        <thead><tr>{head.map((c, j) => <th key={j}>{renderInline(c, `th${j}`)}</th>)}</tr></thead>
                        <tbody>{rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{renderInline(c, `td${j}-${k}`)}</td>)}</tr>)}</tbody>
                    </table>
                </div>
            );
            table = null;
        }
    };

    lines.forEach((raw, idx) => {
        const line = raw.trimEnd();
        const ul = /^\s*[-*•]\s+(.*)$/.exec(line);
        const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
        const tr = /^\s*\|(.+)\|\s*$/.exec(line);
        if (tr) {
            if (list) flush();
            table = table || [];
            table.push(tr[1].split("|").map((c) => c.trim()));
            return;
        }
        if (ul || ol) {
            if (table) flush();
            const ordered = Boolean(ol);
            if (list && list.ordered !== ordered) flush();
            list = list || { ordered, items: [] };
            list.items.push((ul || ol)[1]);
            return;
        }
        flush();
        if (!line.trim() || /^-{3,}$/.test(line.trim())) return;
        const h = /^(#{1,4})\s+(.*)$/.exec(line);
        if (h) {
            blocks.push(<p className="md-heading" key={`h${idx}`}><strong>{renderInline(h[2], `h${idx}`)}</strong></p>);
        } else {
            blocks.push(<p key={`p${idx}`}>{renderInline(line, `p${idx}`)}</p>);
        }
    });
    flush();
    return <div className="md-lite">{blocks}</div>;
}

export default MarkdownLite;
