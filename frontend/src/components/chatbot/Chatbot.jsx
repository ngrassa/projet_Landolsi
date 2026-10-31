import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaComments,
    FaTimes,
    FaPaperPlane,
    FaRobot,
    FaRedo,
    FaCartPlus,
    FaEye,
    FaHeadset,
    FaCarSide
} from "react-icons/fa";

import "./Chatbot.css";
import { API_URL } from "../../config";
import { useCart } from "../../context/CartContext";
import MarkdownLite from "../ai/MarkdownLite";
import {
    chatTireAdvisor,
    chatSupport,
    sendReclamation,
    toHistory
} from "../../services/aiApi";


// ========================================
// MODES DE L'ASSISTANT (API Mistral côté serveur)
// ========================================

const MODES = {
    conseil: {
        label: "Conseiller pneus",
        icon: <FaCarSide />,
        call: chatTireAdvisor,
        welcome: "Bonjour 👋 Je vous aide à choisir vos pneus.\nIndiquez la dimension inscrite sur le flanc de votre pneu (ex. 205/55 R16) ou votre immatriculation, votre budget et votre usage.",
        suggestions: ["205/55 R16, budget 250 DT par pneu", "Quelles marques avez-vous ?", "Je roule surtout sur autoroute"]
    },
    sav: {
        label: "Service après-vente",
        icon: <FaHeadset />,
        call: chatSupport,
        welcome: "Bonjour 👋 Je réponds à vos questions après achat : suivi de commande, retours, garantie, réclamations.",
        suggestions: ["Où en est ma dernière commande ?", "Comment faire un retour ?", "Je veux parler à un conseiller"]
    }
};

const COMPAT_LABELS = {
    verifiee: { text: "Compatible (véhicule enregistré)", cls: "ok" },
    dimension_identique: { text: "Même dimension — à vérifier (charge/vitesse)", cls: "warn" },
    non_verifiee: { text: "Compatibilité non vérifiée", cls: "unknown" }
};

const initialMessages = (mode) => [{ type: "bot", text: MODES[mode].welcome, local: true }];


// ========================================
// CARTE PRODUIT (données réelles renvoyées par le serveur)
// ========================================

function ProductCard({ product, selected, onToggleCompare }) {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const compat = COMPAT_LABELS[product.compatibilite] || COMPAT_LABELS.non_verifiee;
    const disponible = product.stock > 0;

    const handleAdd = () => {
        addToCart({
            id: product.id,
            modele: product.modele,
            dimension: product.dimension,
            saison: product.saison,
            prix: product.prix,
            stock: product.stock,
            image: product.image,
            marque: { nom: product.marque }
        });
    };

    return (
        <div className="ai-product-card">
            {product.image && (
                <img src={`${API_URL}/uploadPneu/${product.image}`} alt={product.modele} loading="lazy" />
            )}
            <div className="ai-product-body">
                <strong>{product.marque} {product.modele}</strong>
                <span className="ai-product-dim">{product.dimension} · {product.saison || "saison non renseignée"}</span>
                <span className="ai-product-price">
                    {product.prixPromo ? (
                        <>
                            <s>{product.prix} DT</s> <b>{product.prixPromo} DT</b> <em>-{product.pourcentagePromotion}%</em>
                        </>
                    ) : (
                        <b>{product.prix} DT</b>
                    )}
                </span>
                <span className={disponible ? "ai-stock ok" : "ai-stock out"}>
                    {disponible ? `En stock (${product.stock})` : "Rupture de stock"}
                </span>
                <span className={`ai-compat ${compat.cls}`}>{compat.text}</span>
                <div className="ai-product-actions">
                    <button type="button" onClick={() => navigate(product.url)} title="Voir la fiche">
                        <FaEye /> Fiche
                    </button>
                    <button type="button" onClick={handleAdd} disabled={!disponible} title="Ajouter au panier">
                        <FaCartPlus /> Panier
                    </button>
                    <label className="ai-compare-toggle" title="Sélectionner pour comparer">
                        <input type="checkbox" checked={selected} onChange={() => onToggleCompare(product.id)} />
                        Comparer
                    </label>
                </div>
            </div>
        </div>
    );
}


// ========================================
// BROUILLON DE RÉCLAMATION (envoi confirmé par le client)
// ========================================

function TicketDraft({ draft, authenticated, onSent }) {
    const navigate = useNavigate();
    const [sujet, setSujet] = useState(draft.sujet);
    const [description, setDescription] = useState(draft.description);
    const [etat, setEtat] = useState("brouillon");
    const [erreur, setErreur] = useState("");

    const envoyer = async () => {
        setEtat("envoi");
        setErreur("");
        try {
            await sendReclamation({ sujet: sujet.trim(), description: description.trim() });
            setEtat("envoye");
            onSent();
        } catch (e) {
            setEtat("brouillon");
            setErreur(e.status === 401 ? "Votre session a expiré : reconnectez-vous." : e.message);
        }
    };

    if (etat === "envoye") {
        return (
            <div className="ai-ticket sent">
                ✅ Réclamation enregistrée. Suivez sa réponse dans <button type="button" className="link" onClick={() => navigate("/mes-reclamations")}>Mes réclamations</button>.
            </div>
        );
    }

    return (
        <div className="ai-ticket">
            <strong>Brouillon de réclamation (non envoyé)</strong>
            {authenticated ? (
                <>
                    <input value={sujet} maxLength={160} onChange={(e) => setSujet(e.target.value)} aria-label="Sujet" />
                    <textarea value={description} rows={4} maxLength={1500} onChange={(e) => setDescription(e.target.value)} aria-label="Description" />
                    {erreur && <span className="ai-error">{erreur}</span>}
                    <button type="button" disabled={etat === "envoi" || !sujet.trim() || !description.trim()} onClick={envoyer}>
                        {etat === "envoi" ? "Envoi…" : "Envoyer au service client"}
                    </button>
                </>
            ) : (
                <span>
                    Pour l'envoyer, <button type="button" className="link" onClick={() => navigate("/login")}>connectez-vous</button>, ou écrivez à <a href="mailto:contact@landolsi.com">contact@landolsi.com</a>.
                </span>
            )}
        </div>
    );
}


// ========================================
// WIDGET
// ========================================

function Chatbot() {

    const [ouvert, setOuvert] = useState(false);
    const [mode, setMode] = useState("conseil");
    const [message, setMessage] = useState("");
    const [conversations, setConversations] = useState({
        conseil: initialMessages("conseil"),
        sav: initialMessages("sav")
    });
    const [chargement, setChargement] = useState(false);
    const [comparaison, setComparaison] = useState([]);
    const finRef = useRef(null);

    const messages = conversations[mode];

    useEffect(() => {
        finRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, chargement]);

    const ajouter = (m, msg) =>
        setConversations((c) => ({ ...c, [m]: [...c[m], msg] }));

    const envoyer = async (texte) => {
        const contenu = (texte ?? message).trim();
        if (!contenu || chargement) return;

        const modeCourant = mode;
        const historique = toHistory(conversations[modeCourant]);

        ajouter(modeCourant, { type: "user", text: contenu });
        setMessage("");
        setChargement(true);

        try {
            const data = await MODES[modeCourant].call(contenu, historique);
            ajouter(modeCourant, {
                type: "bot",
                text: data.reply,
                products: data.products || [],
                warnings: data.warnings || [],
                sources: data.sources || [],
                ticketDraft: data.ticketDraft || null,
                authenticated: data.authenticated
            });
        } catch (error) {
            ajouter(modeCourant, {
                type: "bot",
                error: true,
                text: error.message || "Désolé, une erreur est survenue. Veuillez réessayer."
            });
        } finally {
            setChargement(false);
        }
    };

    const recommencer = () => {
        setConversations((c) => ({ ...c, [mode]: initialMessages(mode) }));
        setComparaison([]);
    };

    const toggleCompare = (id) =>
        setComparaison((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(-4));

    const lancerComparaison = () => {
        envoyer(`Compare les pneus ${comparaison.map((id) => `[#${id}]`).join(", ")} (identifiants ${comparaison.join(", ")}).`);
        setComparaison([]);
    };

    return (
        <>
            {!ouvert && (
                <button className="chatbot-button" onClick={() => setOuvert(true)} title="Assistant Landolsi">
                    <FaComments />
                </button>
            )}

            {ouvert && (
                <div className="chatbot-window" role="dialog" aria-label="Assistant Landolsi">

                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-icon"><FaRobot /></div>
                            <div>
                                <h3>Assistant Landolsi</h3>
                                <span>IA — vérifiez toujours les fiches produits</span>
                            </div>
                        </div>
                        <div className="chatbot-header-actions">
                            <button className="chatbot-close" onClick={recommencer} title="Nouvelle conversation">
                                <FaRedo />
                            </button>
                            <button className="chatbot-close" onClick={() => setOuvert(false)} title="Fermer">
                                <FaTimes />
                            </button>
                        </div>
                    </div>

                    <div className="chatbot-tabs" role="tablist">
                        {Object.entries(MODES).map(([key, m]) => (
                            <button
                                key={key}
                                role="tab"
                                aria-selected={mode === key}
                                className={mode === key ? "active" : ""}
                                onClick={() => setMode(key)}
                            >
                                {m.icon} {m.label}
                            </button>
                        ))}
                    </div>

                    <div className="chatbot-messages" aria-live="polite">
                        {messages.map((msg, index) => (
                            <div key={index} className={`chatbot-message ${msg.type}`}>
                                {msg.type === "bot" && <div className="message-avatar"><FaRobot /></div>}

                                <div className={`message-content ${msg.error ? "error" : ""}`}>
                                    {msg.type === "bot" ? <MarkdownLite text={msg.text} /> : msg.text}

                                    {msg.warnings?.map((w, i) => <div key={i} className="ai-warning">⚠️ {w}</div>)}

                                    {msg.products?.length > 0 && (
                                        <div className="ai-products">
                                            {msg.products.map((p) => (
                                                <ProductCard
                                                    key={p.id}
                                                    product={p}
                                                    selected={comparaison.includes(p.id)}
                                                    onToggleCompare={toggleCompare}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {msg.sources?.length > 0 && (
                                        <div className="ai-sources">
                                            Sources : {msg.sources.map((s, i) => (
                                                <span key={i}>{i > 0 && " · "}{s.lien ? <a href={s.lien}>{s.titre}</a> : s.titre}</span>
                                            ))}
                                        </div>
                                    )}

                                    {msg.ticketDraft && (
                                        <TicketDraft
                                            draft={msg.ticketDraft}
                                            authenticated={msg.authenticated}
                                            onSent={() => {}}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}

                        {messages.length === 1 && !chargement && (
                            <div className="chatbot-suggestions">
                                {MODES[mode].suggestions.map((s) => (
                                    <button key={s} type="button" onClick={() => envoyer(s)}>{s}</button>
                                ))}
                            </div>
                        )}

                        {chargement && (
                            <div className="chatbot-message bot">
                                <div className="message-avatar"><FaRobot /></div>
                                <div className="message-content typing"><span></span><span></span><span></span></div>
                            </div>
                        )}
                        <div ref={finRef} />
                    </div>

                    {mode === "conseil" && comparaison.length >= 2 && (
                        <button className="chatbot-compare-bar" onClick={lancerComparaison} disabled={chargement}>
                            Comparer {comparaison.length} pneus
                        </button>
                    )}

                    <div className="chatbot-input-area">
                        <input
                            type="text"
                            placeholder="Écrire un message..."
                            value={message}
                            maxLength={1000}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") envoyer(); }}
                        />
                        <button onClick={() => envoyer()} disabled={chargement || !message.trim()} title="Envoyer">
                            <FaPaperPlane />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default Chatbot;
