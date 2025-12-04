import axios from "axios";

const API_URL = "http://localhost:3001"; // URL do backend

const client = axios.create({
  baseURL: API_URL,
});

export default client;