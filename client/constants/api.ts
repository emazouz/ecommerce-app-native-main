import axios from "axios";
const api = axios.create({
  baseURL: "https://ecom-app-native-server-three.vercel.app/api",
});

export default api;
