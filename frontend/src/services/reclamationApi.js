
import axios from "axios";
import { API_URL as API_BASE_URL } from "../config";

const API_URL = `${API_BASE_URL}/reclamations`;

// Ajouter une réclamation
export const createReclamation = (data) => {
    return axios.post(API_URL, data, {
        withCredentials: true
    });
};

// Récupérer les réclamations du client connecté
export const getMesReclamations = () => {
    return axios.get(`${API_URL}/mes-reclamations`, {
        withCredentials: true
    });
};

// Récupérer toutes les réclamations (admin)
export const getAllReclamations = () => {
    return axios.get(API_URL, {
        withCredentials: true
    });
};

// Modifier le statut et la réponse de l'administrateur
export const updateReclamation = (id, data) => {
    return axios.put(`${API_URL}/${id}`, data, {
        withCredentials: true
    });
};

// Supprimer une réclamation (admin)
export const deleteReclamation = (id) => {
    return axios.delete(`${API_URL}/${id}`, {
        withCredentials: true
    });
};