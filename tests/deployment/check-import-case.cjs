#!/usr/bin/env node
// Detects relative imports whose letter case does not match the file system.
// Windows/macOS tolerate such mismatches; Linux (EC2 Ubuntu) builds fail.
// Usage: node tests/deployment/check-import-case.cjs frontend/src backend
const fs = require("fs");
const path = require("path");

const SKIP = new Set(["node_modules", "dist", ".git", "public"]);
const EXTS = ["", ".jsx", ".js", ".css", "/index.jsx", "/index.js"];

function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        if (SKIP.has(e.name)) return [];
        const p = path.join(dir, e.name);
        return e.isDirectory() ? walk(p) : [p];
    });
}

function existsExactCase(absPath) {
    let cur = path.parse(absPath).root;
    for (const part of absPath.slice(cur.length).split(path.sep)) {
        if (!fs.readdirSync(cur).includes(part)) return false;
        cur = path.join(cur, part);
    }
    return true;
}

let problems = 0;
for (const root of process.argv.slice(2)) {
    for (const file of walk(path.resolve(root)).filter((f) => /\.(jsx?|cjs|css)$/.test(f))) {
        // Strip block and line comments so commented-out imports are ignored.
        const src = fs.readFileSync(file, "utf8")
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/^\s*\/\/.*$/gm, "");
        const re = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*|url\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g;
        for (const m of src.matchAll(re)) {
            const spec = m[1];
            const candidates = EXTS.map((e) => path.resolve(path.dirname(file), spec + e))
                .filter((p) => fs.existsSync(p) && fs.statSync(p).isFile());
            if (candidates.some(existsExactCase)) continue;
            problems++;
            const kind = candidates.length ? "case mismatch" : "missing";
            console.log(`${path.relative(process.cwd(), file)}: '${spec}' (${kind})`);
        }
    }
}

if (problems) {
    console.error(`\n${problems} import(s) would fail on a case-sensitive file system.`);
    process.exit(1);
}
console.log("OK: all relative imports match file-system case.");
