import axios from 'axios';

const API = axios.create({
  baseURL: 'https://fastlogix-backend.onrender.com/api', // Your backend URL
});

export default API;
