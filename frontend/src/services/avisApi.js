import axios from "axios";
import { API_URL } from "../config";

const apiURL = `${API_URL}/avis`;

// ========================================
// Ajouter un avis
// ========================================

export const createAvis = async (avisData) => {
    const response = await axios.post(
        apiURL,
        avisData,
        {
            withCredentials: true
        }
    );

    return response.data;
};


// ========================================
// Récupérer tous les avis
// ========================================

export const getAllAvis = async () => {
    const response = await axios.get(
        apiURL
    );

    return response.data;
};


// ========================================
// Récupérer l'avis d'une commande
// ========================================

export const getAvisByCommande = async (commandeId) => {
    const response = await axios.get(
        `${apiURL}/commande/${commandeId}`,
        {
            withCredentials: true
        }
    );

    return response.data;
};

 // ========================================
// Récupérer les avis d'un pneu
// ========================================

export const getAvisByPneu = async (pneuId) => {
    const response = await axios.get(
        `${apiURL}/pneu/${pneuId}`
    );

    return response.data;
};

// ========================================
// Supprimer un avis (admin)
// ========================================

export const deleteAvis = async (id) => {
    const response = await axios.delete(
        `${apiURL}/${id}`,
        {
            withCredentials: true
        }
    );

    return response.data;
};