import axios from 'axios';

const BASE_URL = import.meta.env.DEV ? 'http://localhost:3000' : 'https://say.hana.edu.pl/';

const apiClient = axios.create({
    baseURL: BASE_URL,
});

export default apiClient;
