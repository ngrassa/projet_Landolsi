import "./MfaSettings.css";

import { useEffect, useState } from "react";

import {
    FaShieldAlt,
    FaCheckCircle,
    FaKey,
    FaCopy
} from "react-icons/fa";

import {
    getMfaStatus,
    setupMfa,
    enableMfa,
    disableMfa,
    regenerateRecoveryCodes
} from "../../services/apiuser";


// ========================================
// DOUBLE AUTHENTIFICATION (MFA)
// Application Authenticator : Google Authenticator,
// Microsoft Authenticator, FreeOTP, Authy...
// ========================================

function MfaSettings() {

    const [loading, setLoading] = useState(true);

    const [enabled, setEnabled] = useState(false);

    const [recoveryCodesLeft, setRecoveryCodesLeft] = useState(0);

    // Enrôlement en cours : { qrCode, secret }
    const [setup, setSetup] = useState(null);

    const [code, setCode] = useState("");

    const [password, setPassword] = useState("");

    // Mode affiché : null | "disable" | "regenerate"
    const [mode, setMode] = useState(null);

    // Codes de secours affichés une seule fois
    const [recoveryCodes, setRecoveryCodes] = useState(null);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");

    const [busy, setBusy] = useState(false);


    // ==============================
    // CHARGER L'ÉTAT
    // ==============================

    useEffect(() => {

        getMfaStatus()
            .then((response) => {
                setEnabled(response.data.mfaEnabled);
                setRecoveryCodesLeft(response.data.recoveryCodesLeft);
            })
            .catch(() => setError("Impossible de charger l'état de la double authentification."))
            .finally(() => setLoading(false));

    }, []);


    const resetForm = () => {
        setCode("");
        setPassword("");
        setError("");
    };


    const run = async (action) => {
        setBusy(true);
        setError("");
        setSuccess("");
        try {
            await action();
        } catch (err) {
            setCode("");
            setError(err.response?.data?.message || "Une erreur est survenue.");
        } finally {
            setBusy(false);
        }
    };


    // ==============================
    // ÉTAPE 1 : GÉNÉRER LE QR CODE
    // ==============================

    const handleStartSetup = () => run(async () => {
        const response = await setupMfa();
        setSetup({
            qrCode: response.data.qrCode,
            secret: response.data.secret
        });
        resetForm();
    });


    // ==============================
    // ÉTAPE 2 : CONFIRMER LE PREMIER CODE
    // ==============================

    const handleEnable = (e) => {
        e.preventDefault();
        run(async () => {
            const response = await enableMfa(code);
            setEnabled(true);
            setSetup(null);
            setRecoveryCodes(response.data.recoveryCodes);
            setRecoveryCodesLeft(response.data.recoveryCodes.length);
            setSuccess("Double authentification activée.");
            resetForm();
        });
    };


    // ==============================
    // DÉSACTIVER
    // ==============================

    const handleDisable = (e) => {
        e.preventDefault();
        run(async () => {
            await disableMfa({ password, code });
            setEnabled(false);
            setMode(null);
            setRecoveryCodes(null);
            setSuccess("Double authentification désactivée.");
            resetForm();
        });
    };


    // ==============================
    // NOUVEAUX CODES DE SECOURS
    // ==============================

    const handleRegenerate = (e) => {
        e.preventDefault();
        run(async () => {
            const response = await regenerateRecoveryCodes(code);
            setRecoveryCodes(response.data.recoveryCodes);
            setRecoveryCodesLeft(response.data.recoveryCodes.length);
            setMode(null);
            setSuccess("Nouveaux codes de secours générés : les anciens ne sont plus valables.");
            resetForm();
        });
    };


    const copyRecoveryCodes = () => {
        navigator.clipboard?.writeText(recoveryCodes.join("\n"));
    };


    const codeInput = (
        <input
            type="text"
            className="mfa-input mfa-input-code"
            placeholder="Code à 6 chiffres"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
        />
    );


    // ==============================
    // AFFICHAGE
    // ==============================

    if (loading) {
        return null;
    }

    return (

        <div className="profile-section mfa-section">

            <div className="profile-section-title">

                <FaShieldAlt />

                <h2>
                    Double authentification (MFA)
                </h2>

            </div>


            {success && <div className="mfa-success">{success}</div>}

            {error && <div className="mfa-error">{error}</div>}


            {/* ========================================
                CODES DE SECOURS (affichés une seule fois)
            ======================================== */}

            {recoveryCodes && (

                <div className="mfa-recovery">

                    <p>
                        <FaKey /> <strong>Conservez ces codes de secours en lieu sûr.</strong>{" "}
                        Chacun permet de vous connecter une seule fois si vous perdez votre
                        téléphone. Ils ne seront plus affichés.
                    </p>

                    <ul className="mfa-recovery-list">
                        {recoveryCodes.map((c) => <li key={c}>{c}</li>)}
                    </ul>

                    <div className="mfa-actions">
                        <button type="button" className="mfa-btn-secondary" onClick={copyRecoveryCodes}>
                            <FaCopy /> Copier
                        </button>
                        <button type="button" className="mfa-btn-primary" onClick={() => setRecoveryCodes(null)}>
                            J'ai enregistré mes codes
                        </button>
                    </div>

                </div>

            )}


            {/* ========================================
                MFA ACTIVÉE
            ======================================== */}

            {enabled && !recoveryCodes && (

                <>

                    <p className="mfa-status mfa-status-on">
                        <FaCheckCircle /> Activée : un code de votre application
                        d'authentification est demandé à chaque connexion.
                        Codes de secours restants : <strong>{recoveryCodesLeft}</strong>.
                    </p>


                    {mode === null && (

                        <div className="mfa-actions">
                            <button type="button" className="mfa-btn-secondary" onClick={() => { resetForm(); setMode("regenerate"); }}>
                                Nouveaux codes de secours
                            </button>
                            <button type="button" className="mfa-btn-danger" onClick={() => { resetForm(); setMode("disable"); }}>
                                Désactiver
                            </button>
                        </div>

                    )}


                    {mode === "disable" && (

                        <form className="mfa-form" onSubmit={handleDisable}>
                            <p>Confirmez avec votre mot de passe et un code de l'application :</p>
                            <input
                                type="password"
                                className="mfa-input"
                                placeholder="Mot de passe"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {codeInput}
                            <div className="mfa-actions">
                                <button type="button" className="mfa-btn-secondary" onClick={() => setMode(null)}>
                                    Annuler
                                </button>
                                <button type="submit" className="mfa-btn-danger" disabled={busy}>
                                    Désactiver la MFA
                                </button>
                            </div>
                        </form>

                    )}


                    {mode === "regenerate" && (

                        <form className="mfa-form" onSubmit={handleRegenerate}>
                            <p>Saisissez un code de l'application pour générer de nouveaux codes de secours :</p>
                            {codeInput}
                            <div className="mfa-actions">
                                <button type="button" className="mfa-btn-secondary" onClick={() => setMode(null)}>
                                    Annuler
                                </button>
                                <button type="submit" className="mfa-btn-primary" disabled={busy}>
                                    Générer
                                </button>
                            </div>
                        </form>

                    )}

                </>

            )}


            {/* ========================================
                MFA DÉSACTIVÉE
            ======================================== */}

            {!enabled && !setup && (

                <>

                    <p className="mfa-status">
                        Protégez votre compte : en plus du mot de passe, un code temporaire
                        généré par une application d'authentification (Google Authenticator,
                        Microsoft Authenticator...) sera demandé à la connexion.
                    </p>

                    <div className="mfa-actions">
                        <button type="button" className="mfa-btn-primary" onClick={handleStartSetup} disabled={busy}>
                            Activer la double authentification
                        </button>
                    </div>

                </>

            )}


            {/* ========================================
                ENRÔLEMENT : SCANNER LE QR CODE
            ======================================== */}

            {!enabled && setup && (

                <form className="mfa-form" onSubmit={handleEnable}>

                    <ol className="mfa-steps">
                        <li>Installez une application d'authentification sur votre téléphone.</li>
                        <li>Dans l'application, ajoutez un compte et scannez ce QR code.</li>
                        <li>Saisissez le code à 6 chiffres affiché pour confirmer.</li>
                    </ol>

                    <img className="mfa-qr" src={setup.qrCode} alt="QR code à scanner avec l'application d'authentification" />

                    <p className="mfa-secret">
                        Impossible de scanner ? Clé à saisir manuellement :<br />
                        <code>{setup.secret.match(/.{1,4}/g).join(" ")}</code>
                    </p>

                    {codeInput}

                    <div className="mfa-actions">
                        <button type="button" className="mfa-btn-secondary" onClick={() => { setSetup(null); resetForm(); }}>
                            Annuler
                        </button>
                        <button type="submit" className="mfa-btn-primary" disabled={busy}>
                            Confirmer et activer
                        </button>
                    </div>

                </form>

            )}

        </div>

    );

}


export default MfaSettings;
