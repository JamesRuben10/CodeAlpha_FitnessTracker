const configuredApiUrl = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
const API_URL = configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`;

export default API_URL;