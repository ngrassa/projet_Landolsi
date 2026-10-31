import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaPaperPlane, FaRedo, FaRobot } from "react-icons/fa";

import "./AdminUtilisateurs.css";
import "./AdminAssistantIA.css";
import MarkdownLite from "../ai/MarkdownLite";
import { chatAnalytics, getAnalyticsKpis, toHistory } from "../../services/aiApi";


// ========================================
// ADMIN — Assistant IA d'analyse commerciale
// Droits vérifiés côté serveur (requireAdmin) ; chiffres
// calculés par le backend, commentés par Mistral.
// ========================================

const SUGGESTIONS = [
    "Quels sont les pneus les plus vendus ce mois-ci ?",
    "Compare le chiffre d'affaires de ce mois avec le mois dernier",
    "Quelles marques génèrent le plus de chiffre d'affaires sur 90 jours ?",
    "Quels produits sont proches de la rupture de stock ?",
    "Que faut-il réapprovisionner pour les 30 prochains jours ?",
    "Quels pneus ont une marge faible ?"
];

const fmtDT = (n) => (n === null || n === undefined ? "—" : `${Number(n).toLocaleString("fr-FR")} DT`);

function Kpi({ label, value, hint }) {
    return (
        <div className="ia-kpi">
            <span>{label}</span>
            <strong>{value}</strong>
            {hint && <small>{hint}</small>}
        </div>
    );
}

// Histogramme CSS (aucune bibliothèque de graphiques dans le projet)
function CaChart({ serie }) {
    const max = Math.max(...serie.map((p) => p.ca), 0);
    return (
        <div className="ia-chart" role="img" aria-label="Chiffre d'affaires validé par jour sur 30 jours">
            {serie.map((p) => (
                <div key={p.date} className="ia-bar-wrap" title={`${p.date} : ${fmtDT(p.ca)}`}>
                    <div className="ia-bar" style={{ height: max ? `${Math.max(2, (p.ca / max) * 100)}%` : "2px" }} />
                </div>
            ))}
        </div>
    );
}

function AdminAssistantIA() {
    const navigate = useNavigate();
    const [kpis, setKpis] = useState(null);
    const [iaDisponible, setIaDisponible] = useState(true);
    const [erreurKpi, setErreurKpi] = useState("");
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [chargement, setChargement] = useState(false);
    const finRef = useRef(null);

    useEffect(() => {
        getAnalyticsKpis()
            .then((d) => { setKpis(d.kpis); setIaDisponible(d.iaDisponible); })
            .catch((e) => {
                if (e.status === 401) navigate("/login");
                else setErreurKpi(e.status === 403 ? "Accès réservé aux administrateurs." : e.message);
            });
    }, [navigate]);

    useEffect(() => {
        finRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, chargement]);

    const envoyer = async (texte) => {
        const contenu = (texte ?? message).trim();
        if (!contenu || chargement) return;
        const historique = toHistory(messages);
        setMessages((m) => [...m, { type: "user", text: contenu }]);
        setMessage("");
        setChargement(true);
        try {
            const data = await chatAnalytics(contenu, historique);
            setMessages((m) => [...m, { type: "bot", text: data.reply, analyses: data.analyses }]);
        } catch (e) {
            setMessages((m) => [...m, { type: "bot", error: true, text: e.message }]);
        } finally {
            setChargement(false);
        }
    };

    const ind = kpis?.indicateurs;

    return (
        <div className="admin-utilisateurs-page">
            <div className="admin-utilisateurs-header">
                <div>
                    <h1>Assistant IA commercial</h1>
                    <p>Indicateurs calculés sur les commandes réelles ; analyses commentées par Mistral AI.</p>
                </div>
                <div className="admin-utilisateurs-header-actions">
                    <button className="btn-retour-dashboard" onClick={() => navigate("/admin")}>
                        <FaHome /> <span>Dashboard</span>
                    </button>
                </div>
            </div>

            {erreurKpi && <div className="ia-alert">{erreurKpi}</div>}

            {kpis && (
                <section className="ia-section">
                    <h2>Indicateurs — {kpis.periode}</h2>
                    <div className="ia-kpis">
                        <Kpi label="Chiffre d'affaires validé" value={fmtDT(ind.chiffre_affaires_dt)}
                            hint={kpis.evolution_ca_pourcent === null ? "pas de base de comparaison" : `${kpis.evolution_ca_pourcent > 0 ? "+" : ""}${kpis.evolution_ca_pourcent} % vs 30 j précédents`} />
                        <Kpi label="Commandes validées" value={ind.commandes_validees} />
                        <Kpi label="Panier moyen" value={fmtDT(ind.panier_moyen_dt)} />
                        <Kpi label="Pneus vendus" value={ind.pneus_vendus} />
                        <Kpi label="En attente" value={ind.commandes_en_attente} hint={`${fmtDT(ind.ca_potentiel_en_attente_dt)} potentiels`} />
                        <Kpi label="Ruptures de stock" value={kpis.ruptures} hint={`${kpis.stock_bas.length} réf. à stock bas (≤ 4)`} />
                    </div>

                    <CaChart serie={kpis.serie_ca} />

                    <div className="ia-tables">
                        <div>
                            <h3>Top 5 (quantités)</h3>
                            {kpis.top_produits.length ? (
                                <ol>{kpis.top_produits.map((p) => (
                                    <li key={p.pneu_id}>{p.marque} {p.modele} {p.dimension} — <b>{p.quantite}</b> ({fmtDT(p.chiffre_affaires_dt)})</li>
                                ))}</ol>
                            ) : <p className="ia-muted">Aucune vente validée sur la période.</p>}
                        </div>
                        <div>
                            <h3>Stock bas</h3>
                            {kpis.stock_bas.length ? (
                                <ul>{kpis.stock_bas.map((s) => (
                                    <li key={s.pneuId}>{s.marque} {s.modele} {s.dimension} — <b>{s.stock}</b></li>
                                ))}</ul>
                            ) : <p className="ia-muted">Aucun produit à stock bas.</p>}
                        </div>
                    </div>
                    <p className="ia-muted ia-def">CA : {kpis.definitions.chiffre_affaires} Marges et conversions indisponibles (coûts d'achat et consultations non enregistrés).</p>
                </section>
            )}

            <section className="ia-section ia-chat">
                <div className="ia-chat-head">
                    <h2><FaRobot /> Poser une question</h2>
                    {messages.length > 0 && (
                        <button className="ia-reset" onClick={() => setMessages([])} title="Nouvelle analyse"><FaRedo /> Nouvelle analyse</button>
                    )}
                </div>

                {!iaDisponible && <div className="ia-alert">MISTRAL_API_KEY n'est pas configurée sur le serveur : seuls les indicateurs sont disponibles.</div>}

                <div className="ia-messages" aria-live="polite">
                    {messages.length === 0 && (
                        <div className="ia-suggestions">
                            {SUGGESTIONS.map((s) => <button key={s} onClick={() => envoyer(s)} disabled={!iaDisponible}>{s}</button>)}
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`ia-msg ${m.type} ${m.error ? "error" : ""}`}>
                            {m.type === "bot" ? <MarkdownLite text={m.text} /> : m.text}
                            {m.analyses?.length > 0 && (
                                <div className="ia-analyses">
                                    Données utilisées : {m.analyses.map((a, j) => (
                                        <span key={j}>{j > 0 && " · "}{a.outil}{a.periode ? ` (${a.periode})` : ""}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {chargement && <div className="ia-msg bot ia-muted">Analyse en cours…</div>}
                    <div ref={finRef} />
                </div>

                <div className="ia-input">
                    <input
                        value={message}
                        maxLength={1000}
                        placeholder="Ex. : Quelles marques ont le plus progressé ce mois-ci ?"
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") envoyer(); }}
                        disabled={!iaDisponible}
                    />
                    <button onClick={() => envoyer()} disabled={chargement || !message.trim() || !iaDisponible} title="Envoyer">
                        <FaPaperPlane />
                    </button>
                </div>
            </section>
        </div>
    );
}

export default AdminAssistantIA;
