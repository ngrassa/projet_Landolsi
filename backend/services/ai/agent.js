// =====================================================
// Orchestrateur : boucle LLM <-> outils métier
// =====================================================
// Le LLM ne fait que CHOISIR un outil et ses arguments.
// Les arguments sont validés ici avant toute exécution ;
// les outils lisent les vraies données via le dépôt.
// Aucun SQL ni code arbitraire n'est jamais exécuté.

const { AiServiceError } = require("./mistralClient");

class ToolArgumentError extends Error {}

// Validation d'un sous-ensemble de JSON Schema (suffisant pour nos outils)
function validateArgs(schema, raw) {
    const args = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const out = {};
    const props = schema.properties || {};

    for (const key of schema.required || []) {
        if (args[key] === undefined || args[key] === null || args[key] === "") {
            throw new ToolArgumentError(`Paramètre obligatoire manquant : ${key}`);
        }
    }

    // Les propriétés inconnues sont ignorées (additionalProperties: false)
    for (const [key, def] of Object.entries(props)) {
        let value = args[key];
        if (value === undefined || value === null || value === "") continue;

        switch (def.type) {
        case "string":
            if (typeof value === "number") value = String(value);
            if (typeof value !== "string") throw new ToolArgumentError(`${key} doit être un texte`);
            value = value.trim().slice(0, def.maxLength || 200);
            if (def.enum && !def.enum.includes(value)) {
                throw new ToolArgumentError(`${key} doit valoir : ${def.enum.join(", ")}`);
            }
            if (def.pattern && !new RegExp(def.pattern).test(value)) {
                throw new ToolArgumentError(`${key} a un format invalide`);
            }
            break;
        case "integer":
        case "number": {
            const n = Number(value);
            if (!Number.isFinite(n) || (def.type === "integer" && !Number.isInteger(n))) {
                throw new ToolArgumentError(`${key} doit être un nombre`);
            }
            if (def.minimum !== undefined && n < def.minimum) throw new ToolArgumentError(`${key} trop petit`);
            if (def.maximum !== undefined && n > def.maximum) throw new ToolArgumentError(`${key} trop grand`);
            value = n;
            break;
        }
        case "boolean":
            value = value === true || value === "true";
            break;
        case "array": {
            if (!Array.isArray(value)) throw new ToolArgumentError(`${key} doit être une liste`);
            const max = def.maxItems || 10;
            value = value.slice(0, max).map((v) => {
                const n = Number(v);
                if (def.items && def.items.type === "integer") {
                    if (!Number.isInteger(n) || n < 1) throw new ToolArgumentError(`${key} contient un identifiant invalide`);
                    return n;
                }
                return String(v).slice(0, 100);
            });
            break;
        }
        default:
            throw new ToolArgumentError(`Type non pris en charge pour ${key}`);
        }
        out[key] = value;
    }
    return out;
}

// Le contenu peut être une chaîne ou une liste de fragments [{type:"text", text}]
function textOf(content) {
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content)) {
        return content.map((c) => (typeof c === "string" ? c : (c && c.type === "text" && c.text) || "")).join("").trim();
    }
    return "";
}

function toMistralTools(tools) {
    return tools.map((t) => ({
        type: "function",
        function: { name: t.name, description: t.description, parameters: t.parameters }
    }));
}

/**
 * Exécute une conversation avec appels d'outils.
 * @returns {Promise<{reply: string, toolCalls: {name: string, args: object, result: any}[]}>}
 */
async function runAgent({ client, systemPrompt, history = [], userMessage, tools = [], ctx = {}, maxRounds = 5 }) {
    const messages = [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: userMessage }
    ];

    const byName = new Map(tools.map((t) => [t.name, t]));
    const mistralTools = toMistralTools(tools);
    const toolCalls = [];

    for (let round = 0; round <= maxRounds; round++) {
        // Au dernier tour, plus d'outils : le modèle doit conclure
        const allowTools = round < maxRounds;
        const msg = await client.chat({ messages, tools: allowTools ? mistralTools : undefined });

        const calls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
        if (!calls.length || !allowTools) {
            let reply = textOf(msg.content);
            if (!reply) {
                // Réponse vide : une seule relance, sans outils
                const retry = await client.chat({
                    messages: [...messages, { role: "user", content: "Rédige maintenant ta réponse finale au client à partir des informations obtenues." }]
                });
                reply = textOf(retry.content);
            }
            if (!reply) throw new AiServiceError("Réponse vide de l'assistant", { code: "AI_BAD_RESPONSE" });
            return { reply, toolCalls };
        }

        messages.push({ role: "assistant", content: textOf(msg.content), tool_calls: calls });

        for (const call of calls.slice(0, 6)) {
            const name = call.function && call.function.name;
            const tool = byName.get(name);
            let result;

            if (!tool) {
                result = { error: `Outil inconnu : ${name}` };
            } else {
                try {
                    let parsed = {};
                    const rawArgs = call.function.arguments;
                    if (typeof rawArgs === "string" && rawArgs.trim()) parsed = JSON.parse(rawArgs);
                    else if (rawArgs && typeof rawArgs === "object") parsed = rawArgs;
                    const args = validateArgs(tool.parameters, parsed);
                    result = await tool.handler(args, ctx);
                    toolCalls.push({ name, args, result });
                } catch (error) {
                    if (error instanceof ToolArgumentError || error instanceof SyntaxError) {
                        result = { error: `Arguments invalides : ${error.message}` };
                    } else {
                        console.error(`❌ Outil IA ${name} :`, error.message);
                        result = { error: "Erreur interne lors de la consultation des données." };
                    }
                }
            }

            messages.push({
                role: "tool",
                name: name || "inconnu",
                tool_call_id: call.id,
                content: JSON.stringify(result).slice(0, 12000)
            });
        }
    }

    throw new AiServiceError("Trop d'appels d'outils", { code: "AI_TOO_MANY_STEPS" });
}

module.exports = { runAgent, validateArgs, ToolArgumentError };
