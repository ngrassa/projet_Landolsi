import axios from "axios";
import { API_URL } from "../config";

const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true
});


// ========================================
// Intercepteur des réponses
// ========================================

axiosInstance.interceptors.response.use(

    // Si la requête réussit
    (response) => {
        return response;
    },

    // Si la requête retourne une erreur
    (error) => {

        if (error.response?.status === 401) {

            alert(
                "Votre session a expiré. Veuillez vous connecter."
            );

            // Éviter de rediriger plusieurs fois
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }

);

export default axiosInstance;