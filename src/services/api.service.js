import axios from 'axios';
import API_CONFIG from '../config/api.config';
import api from './api'; // Use our centralized secure instance

// Note: We are now primarily using 'api.js' for authenticated requests.
// This 'apiClient' is kept for legacy compatibility but redirected to use the same logic.

const apiClient = api; // Alias to our secure instance

export default apiClient;
