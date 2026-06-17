import axios from 'axios';

const BASE_URL = 'https://strewn-dander-fidgeting.ngrok-free.dev';

const apiClient = axios.create({
    baseURL: BASE_URL,
});

export default apiClient;
