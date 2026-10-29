import axios from "./axiosInstance";


// ========================================
// CLIENT : récupérer les promotions
// ========================================

export const getAllPromotions = () => {
    return axios.get("/promotions");
};


// ========================================
// ADMIN : récupérer toutes les promotions
// ========================================

export const getAllPromotionsAdmin = () => {
    return axios.get("/promotions/admin");
};


// ========================================
// Récupérer une promotion par ID
// ========================================

export const getPromotionById = (id) => {
    return axios.get(`/promotions/${id}`);
};


// ========================================
// ADMIN : ajouter une promotion
// ========================================

export const addPromotion = (promotionData) => {
    return axios.post("/promotions", promotionData);
};


// ========================================
// ADMIN : modifier une promotion
// ========================================

export const updatePromotion = (id, promotionData) => {
    return axios.put(
        `/promotions/${id}`,
        promotionData
    );
};


// ========================================
// ADMIN : supprimer une promotion
// ========================================

export const deletePromotion = (id) => {
    return axios.delete(`/promotions/${id}`);
};