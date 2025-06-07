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
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
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

export interface Deployment {
  id: number
  name: string
  description?: string
  model_id: number
  model_version_id?: number
  owner_id: number
  deployment_type: string
  status: string
  endpoint_url?: string
  error_message?: string
  
  // Resource configuration
  cpu_limit: number
  memory_limit: number
  max_replicas: number
  min_replicas: number
  
  // Configuration
  environment_vars: Record<string, string>
  health_check_path: string
  
  // Auto-scaling
  auto_scale_enabled: boolean
  scale_up_threshold: number
  scale_down_threshold: number
  
  // Timestamps
  created_at: string
  updated_at?: string
  deployed_at?: string
  
  // Metrics
  request_count: number
  last_request_at?: string
  avg_response_time?: number
}

export interface DeploymentWithModel extends Deployment {
  model_name: string
  model_framework: string
  model_version?: string
}

export interface DeploymentMetrics {
  request_count: number
  avg_response_time?: number
  last_request_at?: string
  last_health_check?: string
  current_replicas: number
  cpu_usage?: number
  memory_usage?: number
}

export interface DeploymentLog {
  id: number
  deployment_id: number
  log_level: string
  message: string
  component?: string
  log_metadata: Record<string, any>
  created_at: string
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

  register: async (userData: {
    username: string
    email: string
    password: string
  }) => {
    try {
      // Generate a username from the email (before the @) if not provided
      const username = userData.username || userData.email.split('@')[0];
      
      const response = await api.post('/auth/register', { 
        email: userData.email,
        username, 
        password: userData.password,
        full_name: userData.username // Use username as full_name for now
      })
      
      // If registration is successful, automatically log in
      const loginResponse = await api.post('/auth/token', 
        new URLSearchParams({
          username: username, // Use the actual username, not email
          password: userData.password
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

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
    }
  },

  // Deployment endpoints
  getDeployments: async (filters?: { 
    status?: string 
    skip?: number
    limit?: number
  }) => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.skip) params.append('skip', filters.skip.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    
    const response = await api.get('/deployments', { params })
    return response.data
  },

  createDeployment: async (deploymentData: {
    name: string
    description?: string
    model_id: number
    model_version_id?: number
    deployment_type?: string
    cpu_limit?: number
    memory_limit?: number
    max_replicas?: number
    min_replicas?: number
    environment_vars?: Record<string, string>
    auto_scale_enabled?: boolean
    scale_up_threshold?: number
    scale_down_threshold?: number
  }) => {
    const response = await api.post('/deployments', deploymentData)
    return response.data
  },

  getDeployment: async (deploymentId: number) => {
    const response = await api.get(`/deployments/${deploymentId}`)
    return response.data
  },

  updateDeployment: async (deploymentId: number, updates: {
    name?: string
    description?: string
    cpu_limit?: number
    memory_limit?: number
    max_replicas?: number
    min_replicas?: number
    environment_vars?: Record<string, string>
    auto_scale_enabled?: boolean
    scale_up_threshold?: number
    scale_down_threshold?: number
  }) => {
    const response = await api.put(`/deployments/${deploymentId}`, updates)
    return response.data
  },

  deleteDeployment: async (deploymentId: number) => {
    const response = await api.delete(`/deployments/${deploymentId}`)
    return response.data
  },

  deploymentAction: async (deploymentId: number, action: string, parameters?: Record<string, any>) => {
    const response = await api.post(`/deployments/${deploymentId}/actions`, {
      action,
      parameters: parameters || {}
    })
    return response.data
  },

  getDeploymentMetrics: async (deploymentId: number) => {
    const response = await api.get(`/deployments/${deploymentId}/metrics`)
    return response.data
  },

  getDeploymentLogs: async (deploymentId: number, limit: number = 100) => {
    const params = new URLSearchParams()
    params.append('limit', limit.toString())
    
    const response = await api.get(`/deployments/${deploymentId}/logs`, { params })
    return response.data
  },

  predict: async (deploymentId: number, payload: Record<string, any>) => {
    const response = await api.post(`/deployments/${deploymentId}/predict`, payload)
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/users/me')
    return response.data
  },

  // Admin endpoints
  admin: {
    getUsers: async (params?: { role_filter?: string; active_only?: boolean }) => {
      const response = await api.get('/admin/users', { params })
      return response.data
    },

    updateUserRole: async (userId: number, role: string) => {
      const response = await api.put(`/admin/users/${userId}/role`, { role })
      return response.data
    },

    updateUserStatus: async (userId: number, is_active: boolean, reason?: string) => {
      const response = await api.put(`/admin/users/${userId}/status`, { is_active, reason })
      return response.data
    },

    getPendingModels: async () => {
      const response = await api.get('/admin/models/pending')
      return response.data
    },

    approveModel: async (model_id: number, action: string, notes?: string) => {
      const response = await api.post('/admin/models/approve', { model_id, action, notes })
      return response.data
    },

    getDashboard: async () => {
      const response = await api.get('/admin/analytics/dashboard')
      return response.data
    },

    emergencyAction: async (action: string, target_id: number, reason: string, duration_hours?: number) => {
      const response = await api.post('/admin/emergency', { action, target_id, reason, duration_hours })
      return response.data
    },
  },

  // Generic HTTP methods for admin components compatibility
  get: async (url: string, config?: any) => {
    const response = await api.get(url, config)
    return response
  },

  post: async (url: string, data?: any, config?: any) => {
    const response = await api.post(url, data, config)
    return response
  },

  put: async (url: string, data?: any, config?: any) => {
    const response = await api.put(url, data, config)
    return response
  },

  delete: async (url: string, config?: any) => {
    const response = await api.delete(url, config)
    return response
  },
}

export default apiClient 