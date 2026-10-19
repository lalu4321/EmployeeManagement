import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7089/api",
  headers: {
    Accept: "application/json",
  },
});

// Attach the session token to every API request.
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
