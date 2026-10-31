// Limitation de débit en mémoire (fenêtre fixe, par IP et par clé).
// Suffisant pour une instance unique ; avec plusieurs instances,
// utiliser un stockage partagé ou la limitation Nginx (limit_req).

function rateLimit({ windowMs = 60000, max = 15, key = "default" } = {}) {
    const hits = new Map();

    const sweeper = setInterval(() => {
        const now = Date.now();
        for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    }, windowMs);
    sweeper.unref();

    return (req, res, next) => {
        const now = Date.now();
        const id = `${key}:${req.ip}`;
        let entry = hits.get(id);
        if (!entry || entry.reset <= now) {
            entry = { count: 0, reset: now + windowMs };
            hits.set(id, entry);
        }
        entry.count += 1;
        if (entry.count > max) {
            res.set("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
            return res.status(429).json({
                success: false,
                message: "Trop de requêtes vers l'assistant. Réessayez dans une minute."
            });
        }
        next();
    };
}

module.exports = rateLimit;
