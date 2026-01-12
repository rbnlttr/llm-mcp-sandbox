import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../constants';

export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = async (method, endpoint, data = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios({
        method,
        url: `${API_BASE_URL}${endpoint}`,
        data
      });
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { apiCall, isLoading, error };
}

export function useHealthCheck() {
  const [status, setStatus] = useState(null);
  const { apiCall } = useApi();

  const checkHealth = async () => {
    try {
      const data = await apiCall('GET', '/health');
      setStatus(data);
    } catch (err) {
      setStatus({ status: 'error', message: 'Backend nicht erreichbar' });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return { status, checkHealth };
}