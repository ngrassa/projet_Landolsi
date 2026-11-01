// Limitation de débit (anti force brute sur la connexion, la MFA et la
// réinitialisation du mot de passe). Sans base de données.
const { test } = require("node:test");
const assert = require("node:assert");

const rateLimit = require("../middleware/rateLimit");

function call(mw, ip = "203.0.113.7") {
    const res = {
        statusCode: 200, headers: {}, body: null,
        set(k, v) { this.headers[k] = v; return this; },
        status(c) { this.statusCode = c; return this; },
        json(b) { this.body = b; return this; }
    };
    let passed = false;
    mw({ ip }, res, () => { passed = true; });
    return { passed, res };
}

test("au-delà de max requêtes par fenêtre : 429 + Retry-After + message", () => {
    const mw = rateLimit({ key: "t1", max: 3, windowMs: 60000, message: "Trop de tentatives." });
    for (let i = 0; i < 3; i++) assert.ok(call(mw).passed);
    const { passed, res } = call(mw);
    assert.strictEqual(passed, false);
    assert.strictEqual(res.statusCode, 429);
    assert.ok(Number(res.headers["Retry-After"]) > 0);
    assert.strictEqual(res.body.message, "Trop de tentatives.");
});

test("compteurs séparés par adresse IP", () => {
    const mw = rateLimit({ key: "t2", max: 1 });
    assert.ok(call(mw, "198.51.100.1").passed);
    assert.strictEqual(call(mw, "198.51.100.1").passed, false);
    assert.ok(call(mw, "198.51.100.2").passed);
});

test("message par défaut conservé pour l'assistant IA", () => {
    const mw = rateLimit({ key: "t3", max: 0 });
    assert.match(call(mw).res.body.message, /assistant/);
});
