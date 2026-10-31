import axios from "axios";
import { API_URL } from "../config";

const apiURL = `${API_URL}/users`;

export const register = (user) => {
  return axios.post(`${apiURL}/register`, user, {
    withCredentials: true,
  });
};

export const login = (user) => {
  return axios.post(`${apiURL}/login`, user, {
    withCredentials: true,
  });
};

// 2e étape de connexion : code de l'application Authenticator
// (ou { recoveryCode } pour un code de secours)
export const loginMfa = (payload) => {
  return axios.post(`${apiURL}/login/mfa`, payload, {
    withCredentials: true,
  });
};

export const logout = () => {
  return axios.post(
    `${apiURL}/logout`,
    {},
    {
      withCredentials: true,
    }
  );
};

export const getProfile = () => {
  return axios.get(`${apiURL}/getprofile`, {
    withCredentials: true,
  });
};

// ==============================
// Modifier le profil
// ==============================

export const updateProfile = (user) => {

    return axios.put(
        `${apiURL}/updateprofile`,
        user,
        {
            withCredentials: true
        }
    );

};

export const forgotPassword = (email) => {

  return axios.post(
    `${apiURL}/forgot-password`,
    {
      email
    }
  );

};


// ==============================
// Vérifier le code de récupération
// ==============================

export const verifyResetCode = (email, code) => {

  return axios.post(
    `${apiURL}/verify-reset-code`,
    {
      email,
      code
    }
  );

};




export const resetPassword = (
  email,
  code,
  newPassword
) => {

  return axios.post(
    `${apiURL}/reset-password`,
    {
      email,
      code,
      newPassword
    }
  );

};




// ==============================
// Double authentification (MFA)
// ==============================

export const getMfaStatus = () => {
  return axios.get(`${apiURL}/mfa/status`, { withCredentials: true });
};

export const setupMfa = () => {
  return axios.post(`${apiURL}/mfa/setup`, {}, { withCredentials: true });
};

export const enableMfa = (code) => {
  return axios.post(`${apiURL}/mfa/enable`, { code }, { withCredentials: true });
};

export const disableMfa = (payload) => {
  return axios.post(`${apiURL}/mfa/disable`, payload, { withCredentials: true });
};

export const regenerateRecoveryCodes = (code) => {
  return axios.post(`${apiURL}/mfa/recovery-codes`, { code }, { withCredentials: true });
};


// ==============================
// ADMIN — Gestion des utilisateurs
// ==============================

// Afficher tous les utilisateurs
export const getAllUsers = () => {
  return axios.get(`${apiURL}/admin`, {
    withCredentials: true,
  });
};


// Activer / désactiver un utilisateur
export const toggleUserStatus = (id) => {
  return axios.put(
    `${apiURL}/admin/${id}/status`,
    {},
    {
      withCredentials: true,
    }
  );
};


// Supprimer un utilisateur
export const deleteUser = (id) => {
  return axios.delete(`${apiURL}/admin/${id}`, {
    withCredentials: true,
  });
};


// Réinitialiser la double authentification d'un utilisateur
export const resetUserMfa = (id) => {
  return axios.put(
    `${apiURL}/admin/${id}/mfa/reset`,
    {},
    {
      withCredentials: true,
    }
  );
};
