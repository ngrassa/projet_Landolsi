import axios from "axios";
import { API_URL } from "../config";

const apiURL = `${API_URL}/commandes`;

// ==============================
// CRÉER UNE COMMANDE
// ==============================

export const createCommande = (items) => {

    return axios.post(
        apiURL,
        {
            items
        },
        {
            withCredentials: true
        }
    );

};
export const getMesCommandes = () => {

    return axios.get(
        `${apiURL}/mes-commandes`,
        {
            withCredentials: true
        }
    );

};

export const getCommandeById = (id) => {

    return axios.get(
        `${apiURL}/${id}`,
        {
            withCredentials: true
        }
    );

};



export const getAllCommandesAdmin = () => {

    return axios.get(
        `${apiURL}/admin`,
        {
            withCredentials: true
        }
    );

};

export const updateStatutCommande = (id, statut) => {

    return axios.put(
        `${apiURL}/${id}/statut`,
        {
            statut
        },
        {
            withCredentials: true
        }
    );

};


export const deleteCommande = (id) => {

    return axios.delete(
        `${apiURL}/${id}`,
        {
            withCredentials: true
        }
    );

};





// ==============================
// TÉLÉCHARGER LA FACTURE PDF
// ==============================

export const downloadFacturePDF = async (commandeId) => {

    const response = await axios.get(
        `${API_URL}/factures/commande/${commandeId}/pdf`,
        {
            withCredentials: true,
            responseType: "blob"
        }
    );

    const blob = new Blob(
        [response.data],
        {
            type: "application/pdf"
        }
    );

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `facture-commande-${commandeId}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
};