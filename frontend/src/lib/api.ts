import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface Model {
  id: number
  name: string
  description: string
  framework: string
  version: string
  format: string
  task_type: string
  tags: string[]
  license: string
  paper_url?: string
  github_url?: string
  model_metadata?: Record<string, any>
  size_mb: number
  downloads: number
  likes: number
  average_rating: number
  created_at: string
  updated_at?: string
  owner_id: number
  performance_metrics?: Record<string, any>
}

export interface ModelCreate {
  name: string
  description: string
  framework: string
  version: string
  format: string
  task_type: string
  tags: string[]
  license: string
  paper_url?: string
  github_url?: string
  model_metadata?: Record<string, any>
}

export const apiClient = {
  // Model endpoints
  getModels: async (filters?: { task_type?: string; framework?: string }) => {
    const params = new URLSearchParams()
    if (filters?.task_type) params.append('task_type', filters.task_type)
    if (filters?.framework) params.append('framework', filters.framework)
    
    const response = await api.get<Model[]>('/models', { params })
    return response.data
  },

  getModel: async (id: number) => {
    const response = await api.get<Model>(`/models/${id}`)
    return response.data
  },

  uploadModel: async (formData: FormData) => {
    const response = await api.post<Model>('/models', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  downloadModel: async (id: number) => {
    const response = await api.post(`/models/${id}/download`)
    return response.data
  },

  updateModelMetrics: async (id: number, metrics: Record<string, any>) => {
    const response = await api.post<Model>(`/models/${id}/metrics`, metrics)
    return response.data
  },

  getUserModels: async (userId: number) => {
    const response = await api.get<Model[]>(`/models/user/${userId}`)
    return response.data
  },

  // Authentication endpoints
  login: async (username: string, password: string) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    
    const response = await api.post('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    
    // Store token in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', response.data.access_token)
    }
    
    return response.data
  },

  register: async (full_name: string, email: string, password: string) => {
    try {
      // Generate a username from the email (before the @)
      const username = email.split('@')[0];
      
      const response = await api.post('/auth/register', { 
        email,
        username, 
        password,
        full_name
      })
      
      // If registration is successful, automatically log in
      const loginResponse = await api.post('/auth/token', 
        new URLSearchParams({
          username: email,
          password: password
        }), 
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      // Store token in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', loginResponse.data.access_token)
      }
      
      return response.data
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data.detail || 'Invalid registration data');
      } else if (error.response?.status === 409) {
        throw new Error('An account with this email already exists');
      } else if (error.response?.status === 405) {
        throw new Error('Registration is not enabled on this server');
      } else {
        console.error('Registration error:', error);
        throw new Error('Failed to create account. Please try again.');
      }
    }
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/users/me')
    return response.data
  },
}

export default apiClient 