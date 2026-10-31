// Tests d'intégration HTTP : nécessitent une base PostgreSQL de TEST
// déjà migrée (npm run db:migrate). Ne jamais pointer vers la production :
// ces tests créent un compte client.
//
//   ENV_FILE=/chemin/test.env npm test
//
// Sans DB_NAME dans l'environnement, les tests sont ignorés.
const { test, before, after } = require("node:test");
const assert = require("node:assert");

const config = require("../config");

const enabled = Boolean(process.env.DB_NAME) && process.env.RUN_API_TESTS !== "0";

let server;
let baseUrl;

before(async () => {
    if (!enabled) return;
    const app = require("../app");
    require("../models/associations");
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (!enabled) return;
    await new Promise((resolve) => server.close(resolve));
    await require("../db/db").close();
});

const opts = { skip: !enabled && "DB_NAME absent : tests d'intégration ignorés" };

test("GET /health répond 200 avec la base disponible", opts, async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.status, "ok");
    assert.strictEqual(body.database, "up");
});

test("catalogue public accessible", opts, async () => {
    const res = await fetch(`${baseUrl}/pneus/getallpneus`);
    assert.strictEqual(res.status, 200);
});

test("route inconnue : 404 sans détails internes en production", opts, async () => {
    const res = await fetch(`${baseUrl}/route-inexistante`);
    assert.strictEqual(res.status, 404);
    const body = await res.json();
    if (config.isProduction) assert.strictEqual(body.error, undefined);
});

test("écritures admin refusées sans session (401)", opts, async () => {
    for (const [method, path] of [
        ["POST", "/pneus"], ["PUT", "/pneus/1"], ["DELETE", "/pneus/1"],
        ["POST", "/marques"], ["PUT", "/marques/1"], ["DELETE", "/marques/1"],
        ["POST", "/compatibilites"], ["DELETE", "/compatibilites/1/1"],
        ["GET", "/users/admin"], ["GET", "/commandes/admin"]
    ]) {
        const res = await fetch(`${baseUrl}${path}`, { method });
        assert.strictEqual(res.status, 401, `${method} ${path}`);
    }
});

test("webhook Telegram désactivé sans secret", opts, async () => {
    const res = await fetch(`${baseUrl}/telegram/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: { chat: { id: 1 }, text: "x" } })
    });
    assert.strictEqual(res.status, 404);
});

test("inscription, connexion par cookie et refus des droits admin (403)", opts, async () => {
    const email = `test-${Date.now()}@example.com`;
    const password = "Motdepasse123";

    const reg = await fetch(`${baseUrl}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            nom: "Test", prenom: "Client", email, password,
            telephone: "12345678", adresse: "1 rue Test", ville: "Sousse",
            codePostal: "4000", pays: "Tunisie", typeClient: "particulier"
        })
    });
    assert.strictEqual(reg.status, 201, await reg.clone().text());

    const login = await fetch(`${baseUrl}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    assert.strictEqual(login.status, 200);

    const setCookie = login.headers.get("set-cookie") || "";
    assert.match(setCookie, /jwt_token=/);
    assert.match(setCookie, /HttpOnly/i);
    if (config.cookieSecure) assert.match(setCookie, /Secure/i);

    const cookie = setCookie.split(";")[0];

    const profile = await fetch(`${baseUrl}/users/getprofile`, { headers: { cookie } });
    assert.strictEqual(profile.status, 200);

    const forbidden = await fetch(`${baseUrl}/pneus/1`, { method: "DELETE", headers: { cookie } });
    assert.strictEqual(forbidden.status, 403);
});

test("double authentification : enrôlement puis connexion en deux étapes", opts, async () => {
    const { authenticator } = require("otplib");
    const email = `mfa-${Date.now()}@example.com`;
    const password = "Motdepasse123";
    const json = { "Content-Type": "application/json" };

    await fetch(`${baseUrl}/users/register`, {
        method: "POST", headers: json,
        body: JSON.stringify({
            nom: "Test", prenom: "MFA", email, password,
            telephone: "12345678", adresse: "1 rue Test", ville: "Sousse",
            codePostal: "4000", pays: "Tunisie", typeClient: "particulier"
        })
    });

    const login1 = await fetch(`${baseUrl}/users/login`, {
        method: "POST", headers: json, body: JSON.stringify({ email, password })
    });
    const cookie = (login1.headers.get("set-cookie") || "").split(";")[0];
    const auth = { ...json, cookie };

    const setup = await (await fetch(`${baseUrl}/users/mfa/setup`, { method: "POST", headers: auth })).json();
    assert.ok(setup.qrCode && setup.secret);

    const bad = await fetch(`${baseUrl}/users/mfa/enable`, {
        method: "POST", headers: auth, body: JSON.stringify({ code: "000000" })
    });
    assert.strictEqual(bad.status, 400);

    const enable = await fetch(`${baseUrl}/users/mfa/enable`, {
        method: "POST", headers: auth,
        body: JSON.stringify({ code: authenticator.generate(setup.secret) })
    });
    assert.strictEqual(enable.status, 200);
    const { recoveryCodes } = await enable.json();
    assert.strictEqual(recoveryCodes.length, 8);

    // 1re étape : pas de session, seulement le jeton intermédiaire
    const login2 = await fetch(`${baseUrl}/users/login`, {
        method: "POST", headers: json, body: JSON.stringify({ email, password })
    });
    assert.strictEqual((await login2.json()).mfaRequired, true);
    const pendingCookie = login2.headers.get("set-cookie") || "";
    assert.doesNotMatch(pendingCookie, /jwt_token=/);
    const pending = pendingCookie.split(";")[0];

    // Le jeton intermédiaire placé dans jwt_token ne donne pas accès au profil
    const forged = `jwt_token=${pending.split("=")[1]}`;
    const profile = await fetch(`${baseUrl}/users/getprofile`, { headers: { cookie: forged } });
    assert.strictEqual(profile.status, 401);

    const wrong = await fetch(`${baseUrl}/users/login/mfa`, {
        method: "POST", headers: { ...json, cookie: pending }, body: JSON.stringify({ code: "000000" })
    });
    assert.strictEqual(wrong.status, 400);

    // 2e étape avec un code de secours (le code TOTP courant vient d'être utilisé)
    const ok = await fetch(`${baseUrl}/users/login/mfa`, {
        method: "POST", headers: { ...json, cookie: pending },
        body: JSON.stringify({ recoveryCode: recoveryCodes[0] })
    });
    assert.strictEqual(ok.status, 200);
    assert.match(ok.headers.get("set-cookie") || "", /jwt_token=/);
});
