// =====================================================
// Contrôleur des assistants IA (Mistral)
// =====================================================
//   POST /ai/tire-advisor/chat          public (visiteurs et clients)
//   POST /ai/support/chat               public, commandes si connecté
//   POST /ai/admin/analytics/chat       administrateur
//   GET  /ai/admin/analytics/kpis       administrateur (sans LLM)
//
// Les conversations ne sont pas stockées côté serveur : le navigateur
// renvoie l'historique texte (borné), jamais de résultats d'outils.

const config = require("../config");
const { defaultClient, AiServiceError } = require("../services/ai/mistralClient");
const { runAgent } = require("../services/ai/agent");
const defaultRepo = require("../services/ai/repository");
const { buildTireTools, TIRE_ADVISOR_PROMPT, productUrl } = require("../services/ai/tireTools");
const { buildAnalyticsTools, computeDashboardKpis, ANALYTICS_PROMPT } = require("../services/ai/analyticsTools");
const { buildSupportTools, SUPPORT_PROMPT } = require("../services/ai/supportTools");

const MAX_MESSAGE = 1000;
const MAX_HISTORY = 12;

class ValidationError extends Error {}

function validateChatBody(body) {
    const message = body && body.message;
    if (typeof message !== "string" || !message.trim()) {
        throw new ValidationError("Le message est obligatoire.");
    }
    if (message.length > MAX_MESSAGE) {
        throw new ValidationError(`Message trop long (${MAX_MESSAGE} caractères maximum).`);
    }
    const rawHistory = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY) : [];
    const history = rawHistory
        .filter((m) => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string" && m.content.trim())
        .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));
    return { message: message.trim(), history };
}

function sendError(res, error, label) {
    if (error instanceof ValidationError) {
        return res.status(400).json({ success: false, message: error.message });
    }
    if (error instanceof AiServiceError) {
        console.error(`❌ Assistant ${label} : ${error.code}`);
        if (error.code === "AI_NOT_CONFIGURED") {
            return res.status(503).json({ success: false, message: "L'assistant IA n'est pas encore configuré." });
        }
        if (error.code === "AI_RATE_LIMITED") {
            return res.status(429).json({ success: false, message: "L'assistant est très sollicité. Réessayez dans un instant." });
        }
        return res.status(503).json({ success: false, message: "L'assistant est momentanément indisponible. Réessayez plus tard." });
    }
    console.error(`❌ Assistant ${label} :`, error && error.message);
    return res.status(500).json({ success: false, message: "Une erreur est survenue avec l'assistant." });
}

// Ne garder que les produits cités ET vérifiés par un outil pendant cette requête
function extractProducts(reply, ctx) {
    const cited = [...new Set([...reply.matchAll(/\[#(\d+)\]/g)].map((m) => Number(m[1])))];
    const unknown = cited.filter((id) => !ctx.seen.has(id));
    let text = reply;
    for (const id of unknown) text = text.split(`[#${id}]`).join("");

    const dim = ctx.requestedDimension;
    const products = cited.filter((id) => ctx.seen.has(id)).slice(0, 6).map((id) => {
        const t = ctx.seen.get(id);
        let compatibilite = "non_verifiee";
        if (ctx.verifiedCompatible.has(id)) compatibilite = "verifiee";
        else if (dim && t.largeur === dim.largeur && t.hauteur === dim.hauteur && t.diametre === dim.diametre) {
            compatibilite = "dimension_identique";
        }
        return {
            id: t.id, marque: t.marque, modele: t.modele, dimension: t.dimension, saison: t.saison,
            prix: t.prix, prixPromo: t.prixPromo, pourcentagePromotion: t.pourcentagePromotion,
            stock: t.stock, image: t.image, url: productUrl(t.id), compatibilite
        };
    });

    const warnings = unknown.length
        ? ["Un produit mentionné par l'assistant n'a pas été trouvé dans le catalogue et a été retiré. Fiez-vous uniquement aux fiches affichées."]
        : [];
    return { text, products, warnings };
}

// Liens Markdown vers un domaine inventé pour une page interne connue :
// [x](https://autre-domaine/mes-reclamations) -> [x](/mes-reclamations)
const INTERNAL_PATHS = ["/mes-reclamations", "/mes-commandes", "/pneus", "/promotions", "/panier", "/login"];
function fixInternalLinks(text) {
    return text.replace(/\]\((https?:\/\/[^)\s/]+)(\/[^)\s]*)\)/g, (all, host, path) => {
        const base = path.split(/[?#]/)[0];
        const internal = INTERNAL_PATHS.includes(base) || /^\/(commande|pneu)\/\d+$/.test(base);
        return internal ? `](${path})` : all;
    });
}

function createAiController({ client = defaultClient, repo = defaultRepo, docs } = {}) {
    const maxRounds = config.mistral.maxToolRounds;
    const tireTools = buildTireTools(repo);
    const analyticsTools = buildAnalyticsTools(repo);
    const supportTools = buildSupportTools(repo, docs ? { docs } : undefined);

    const newCtx = (extra = {}) => {
        const ctx = { seen: new Map(), verifiedCompatible: new Set(), ...extra };
        ctx.remember = (tires) => { for (const t of tires) ctx.seen.set(t.id, t); };
        return ctx;
    };

    return {
        async tireAdvisorChat(req, res) {
            try {
                const { message, history } = validateChatBody(req.body);
                const ctx = newCtx();
                const { reply } = await runAgent({
                    client, systemPrompt: TIRE_ADVISOR_PROMPT, history, userMessage: message,
                    tools: tireTools, ctx, maxRounds
                });
                const { text, products, warnings } = extractProducts(reply, ctx);
                return res.json({ success: true, reply: text, products, warnings });
            } catch (error) {
                return sendError(res, error, "conseiller pneus");
            }
        },

        async supportChat(req, res) {
            try {
                const { message, history } = validateChatBody(req.body);
                const ctx = newCtx({ userId: req.userId || null });
                const { reply, toolCalls } = await runAgent({
                    client, systemPrompt: SUPPORT_PROMPT, history, userMessage: message,
                    tools: supportTools, ctx, maxRounds
                });
                const sources = [];
                for (const c of toolCalls.filter((t) => t.name === "search_support_docs")) {
                    for (const r of c.result.resultats || []) {
                        if (!sources.some((s) => s.titre === r.titre)) sources.push({ titre: r.titre, lien: r.lien });
                    }
                }
                return res.json({
                    success: true,
                    reply: fixInternalLinks(reply),
                    sources,
                    ticketDraft: ctx.ticketDraft || null,
                    authenticated: Boolean(ctx.userId)
                });
            } catch (error) {
                return sendError(res, error, "SAV");
            }
        },

        async analyticsChat(req, res) {
            try {
                const { message, history } = validateChatBody(req.body);
                const { reply, toolCalls } = await runAgent({
                    client, systemPrompt: ANALYTICS_PROMPT(), history, userMessage: message,
                    tools: analyticsTools, ctx: newCtx(), maxRounds
                });
                const analyses = toolCalls.map((c) => ({ outil: c.name, periode: c.result && c.result.periode || null }));
                return res.json({ success: true, reply, analyses });
            } catch (error) {
                return sendError(res, error, "analyse commerciale");
            }
        },

        async analyticsKpis(req, res) {
            try {
                const kpis = await computeDashboardKpis(repo);
                return res.json({ success: true, kpis, iaDisponible: client.isConfigured() });
            } catch (error) {
                return sendError(res, error, "KPI");
            }
        }
    };
}

module.exports = { createAiController, validateChatBody, extractProducts, fixInternalLinks, ValidationError };
