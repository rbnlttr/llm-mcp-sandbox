export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  HEALTH: '/health',
  MODELS: '/models',
  CHAT: '/chat',
  UPLOAD: '/upload',
  DIRECTORIES_PROJECT: '/directories/project',
  DIRECTORIES_REFERENCE: '/directories/reference',
  DIRECTORIES_REFRESH: '/directories/refresh'
};

export const SUPPORTED_FILE_TYPES = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.pptx', '.txt', '.md'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const LLM_TYPES = {
  LOCAL: 'local',
  CLOUD: 'cloud'
};