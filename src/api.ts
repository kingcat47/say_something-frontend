import axios from 'axios';

const BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : 'https://strewn-dander-fidgeting.ngrok-free.dev';

const apiClient = axios.create({
    baseURL: BASE_URL,
});

export default apiClient;
