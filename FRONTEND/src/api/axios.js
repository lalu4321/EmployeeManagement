
import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7089/api",
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
});

export default api;
