// Tests unitaires de la double authentification (sans base de données)
const { test } = require("node:test");
const assert = require("node:assert");
const { authenticator } = require("otplib");

const mfa = require("../services/mfaService");

test("QR code et URI otpauth compatibles Authenticator", async () => {
    const setup = await mfa.generateSetup("client@example.com");
    assert.match(setup.secret, /^[A-Z2-7]+$/);
    assert.match(setup.otpauthUrl, /^otpauth:\/\/totp\/.+secret=/);
    assert.match(setup.otpauthUrl, /issuer=LANDOLSI/);
    assert.match(setup.qrCode, /^data:image\/png;base64,/);
});

test("code TOTP valide accepté, code faux ou réutilisé refusé", async () => {
    const { secret } = await mfa.generateSetup("client@example.com");
    const encrypted = mfa.encryptSecret(secret);

    assert.ok(!encrypted.includes(secret), "secret chiffré en base");

    const code = authenticator.generate(secret);
    const step = mfa.verifyTotp(code, encrypted, null);
    assert.strictEqual(typeof step, "number");

    assert.strictEqual(mfa.verifyTotp(code, encrypted, step), null, "rejeu refusé");
    assert.strictEqual(mfa.verifyTotp("000000x", encrypted, null), null);
    assert.strictEqual(mfa.verifyTotp("", encrypted, null), null);
});

test("codes de secours à usage unique", () => {
    const { codes, hashes } = mfa.generateRecoveryCodes();
    assert.strictEqual(codes.length, 8);
    assert.ok(hashes.every((h) => !codes.includes(h)));

    const remaining = mfa.consumeRecoveryCode(codes[0].toLowerCase(), hashes);
    assert.strictEqual(remaining.length, 7);
    assert.strictEqual(mfa.consumeRecoveryCode(codes[0], remaining), null);
    assert.strictEqual(mfa.consumeRecoveryCode("FAUX-CODE", hashes), null);
});
