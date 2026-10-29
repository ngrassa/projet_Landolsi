// Tests de validation de la configuration (sans base de données).
const { test } = require("node:test");
const assert = require("node:assert");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const BASE_ENV = {
    PATH: process.env.PATH,
    ENV_FILE: "/nonexistent", // ne jamais charger le .env local
    DB_NAME: "db",
    DB_USER: "user",
    DB_PASSWORD: "pw"
};

function validate(extraEnv) {
    const script = `
        const config = require(${JSON.stringify(path.join(__dirname, "..", "config"))});
        try { config.validate(); console.log(JSON.stringify({ ok: true, config })); }
        catch (e) { console.log(JSON.stringify({ ok: false, message: e.message })); }
    `;
    const res = spawnSync(process.execPath, ["-e", script], {
        env: { ...BASE_ENV, ...extraEnv },
        encoding: "utf8"
    });
    const line = res.stdout.trim().split("\n").pop();
    return JSON.parse(line);
}

const STRONG_SECRET = "x".repeat(48);

test("développement : valeurs par défaut historiques conservées", () => {
    const r = validate({});
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.config.port, 5001);
    assert.strictEqual(r.config.db.sync, "alter");
    assert.strictEqual(r.config.cookieSecure, false);
    assert.deepStrictEqual(r.config.corsOrigins, ["http://localhost:5173", "http://127.0.0.1:5173"]);
});

test("production : JWT_SECRET obligatoire", () => {
    const r = validate({ NODE_ENV: "production" });
    assert.strictEqual(r.ok, false);
    assert.match(r.message, /JWT_SECRET est obligatoire/);
});

test("production : secret faible ou historique refusé", () => {
    assert.strictEqual(validate({ NODE_ENV: "production", JWT_SECRET: "court" }).ok, false);
    assert.strictEqual(validate({ NODE_ENV: "production", JWT_SECRET: "net pneus secret" }).ok, false);
});

test("production : DB_SYNC=alter interdit, défaut none", () => {
    const r1 = validate({ NODE_ENV: "production", JWT_SECRET: STRONG_SECRET, DB_SYNC: "alter" });
    assert.strictEqual(r1.ok, false);
    assert.match(r1.message, /DB_SYNC=alter/);

    const r2 = validate({ NODE_ENV: "production", JWT_SECRET: STRONG_SECRET });
    assert.strictEqual(r2.ok, true);
    assert.strictEqual(r2.config.db.sync, "none");
    assert.strictEqual(r2.config.cookieSecure, true);
    assert.strictEqual(r2.config.trustProxy, true);
});

test("identifiants de base obligatoires", () => {
    const r = validate({ DB_PASSWORD: "" });
    assert.strictEqual(r.ok, false);
    assert.match(r.message, /DB_PASSWORD/);
});

test("CORS_ORIGINS accepte une liste séparée par des virgules", () => {
    const r = validate({ CORS_ORIGINS: "https://a.example, https://b.example" });
    assert.deepStrictEqual(r.config.corsOrigins, ["https://a.example", "https://b.example"]);
});
