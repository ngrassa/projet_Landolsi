
import { useEffect, useState } from "react";
import { getAvisByPneu } from "../../services/avisApi";
import "./AvisPneu.css";

function AvisPneu({ pneuId }) {
    const [avis, setAvis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [erreur, setErreur] = useState("");

    useEffect(() => {
        const chargerAvis = async () => {
            try {
                setLoading(true);
                setErreur("");

                const resultat = await getAvisByPneu(pneuId);
                setAvis(resultat.avis || []);
            } catch (error) {
                console.error("Erreur chargement des avis :", error);
                setErreur("Impossible de charger les avis.");
            } finally {
                setLoading(false);
            }
        };

        if (pneuId) {
            chargerAvis();
        }
    }, [pneuId]);

    const moyenne = avis.length
        ? avis.reduce((total, item) => total + Number(item.note), 0)
            / avis.length
        : 0;

    const formaterDate = (date) => {
        if (!date) return "Date inconnue";

        return new Date(date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    return (
        <section className="avis-pneu-section">
            <h2>Avis des clients</h2>

            {loading ? (
                <p>Chargement des avis...</p>
            ) : erreur ? (
                <p>{erreur}</p>
            ) : avis.length === 0 ? (
                <p>Aucun avis pour ce pneu pour le moment.</p>
            ) : (
                <>
                    <div className="avis-resume">
                        <strong>{moyenne.toFixed(1)} / 5</strong>

                        <span className="avis-etoiles">
                            {"★".repeat(Math.round(moyenne))}
                            {"☆".repeat(5 - Math.round(moyenne))}
                        </span>

                        <span>
                            {avis.length} avis
                        </span>
                    </div>

                    <div className="avis-liste">
                        {avis.map((item) => (
                            <article
                                className="avis-carte"
                                key={item.id}
                            >
                                <div className="achat-verifie">
                                    <span className="verification-icon">
                                        ✓
                                    </span>
                                    Achat vérifié
                                </div>

                                <div className="avis-note">
                                    {"★".repeat(Number(item.note))}
                                    {"☆".repeat(5 - Number(item.note))}
                                </div>

                                <div className="avis-date">
                                    Date du commentaire :{" "}
                                    <strong>
                                        {formaterDate(item.createdAt)}
                                    </strong>
                                </div>

                                {item.commentaire && (
                                    <p className="avis-commentaire">
                                        {item.commentaire}
                                    </p>
                                )}

                                <div className="avis-auteur">
                                    {item.user?.prenom || ""}{" "}
                                    {item.user?.nom || "Client"}
                                </div>
                            </article>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

export default AvisPneu;