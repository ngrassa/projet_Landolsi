
import { useState } from "react";

import {
    FaComments,
    FaTimes,
    FaPaperPlane,
    FaRobot
} from "react-icons/fa";

import "./Chatbot.css";
import { API_URL } from "../../config";


function Chatbot() {

    const [ouvert, setOuvert] = useState(false);

    const [message, setMessage] = useState("");

    const [messages, setMessages] = useState([
        {
            type: "bot",
            text: "Bonjour 👋\nJe suis l'assistant Landolsi Motors.\nComment puis-je vous aider ?"
        }
    ]);

    const [chargement, setChargement] = useState(false);


    // ========================================
    // ENVOYER UN MESSAGE
    // ========================================

    const handleSendMessage = async () => {

        if (!message.trim() || chargement) {
            return;
        }


        const messageClient = message.trim();


        // Ajouter le message du client
        setMessages((anciensMessages) => [
            ...anciensMessages,
            {
                type: "user",
                text: messageClient
            }
        ]);


        // Vider l'input
        setMessage("");

        // Afficher le chargement
        setChargement(true);


        try {

            const response = await fetch(
                `${API_URL}/chatbot`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        message: messageClient
                    })
                }
            );


            const data = await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Erreur lors de la communication avec l'assistant."
                );

            }


            // Ajouter la réponse du chatbot
            setMessages((anciensMessages) => [
                ...anciensMessages,
                {
                    type: "bot",
                    text: data.reply
                }
            ]);


        } catch (error) {

            console.error(
                "❌ Erreur chatbot :",
                error
            );


            setMessages((anciensMessages) => [
                ...anciensMessages,
                {
                    type: "bot",
                    text: "Désolé, une erreur est survenue. Veuillez réessayer."
                }
            ]);

        } finally {

            setChargement(false);

        }

    };


    return (

        <>

            {/* ========================================
                BOUTON CHATBOT
            ======================================== */}

            {!ouvert && (

                <button
                    className="chatbot-button"
                    onClick={() => setOuvert(true)}
                    title="Assistant Landolsi"
                >

                    <FaComments />

                </button>

            )}


            {/* ========================================
                FENÊTRE CHATBOT
            ======================================== */}

            {ouvert && (

                <div className="chatbot-window">


                    {/* ========================================
                        HEADER
                    ======================================== */}

                    <div className="chatbot-header">

                        <div className="chatbot-header-info">

                            <div className="chatbot-icon">

                                <FaRobot />

                            </div>

                            <div>

                                <h3>
                                    Assistant Landolsi
                                </h3>

                                <span>
                                    En ligne
                                </span>

                            </div>

                        </div>


                        <button
                            className="chatbot-close"
                            onClick={() => setOuvert(false)}
                            title="Fermer"
                        >

                            <FaTimes />

                        </button>

                    </div>


                    {/* ========================================
                        MESSAGES
                    ======================================== */}

                    <div className="chatbot-messages">

                        {messages.map((msg, index) => (

                            <div
                                key={index}
                                className={`chatbot-message ${msg.type}`}
                            >

                                {msg.type === "bot" && (

                                    <div className="message-avatar">

                                        <FaRobot />

                                    </div>

                                )}


                                <div className="message-content">

                                    {msg.text
                                        .split("\n")
                                        .map((ligne, indexLigne) => (
                                            <span key={indexLigne}>
                                                {ligne}

                                                <br />
                                            </span>
                                        ))
                                    }

                                </div>

                            </div>

                        ))}


                        {/* ========================================
                            CHARGEMENT
                        ======================================== */}

                        {chargement && (

                            <div className="chatbot-message bot">

                                <div className="message-avatar">

                                    <FaRobot />

                                </div>

                                <div className="message-content">

                                    ...

                                </div>

                            </div>

                        )}

                    </div>


                    {/* ========================================
                        INPUT
                    ======================================== */}

                    <div className="chatbot-input-area">

                        <input
                            type="text"
                            placeholder="Écrire un message..."
                            value={message}
                            disabled={chargement}
                            onChange={(e) =>
                                setMessage(e.target.value)
                            }
                            onKeyDown={(e) => {

                                if (e.key === "Enter") {

                                    handleSendMessage();

                                }

                            }}
                        />


                        <button
                            onClick={handleSendMessage}
                            disabled={chargement}
                            title="Envoyer"
                        >

                            <FaPaperPlane />

                        </button>

                    </div>


                </div>

            )}

        </>

    );

}


export default Chatbot;

