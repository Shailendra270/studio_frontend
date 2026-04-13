import { apiUrl, apiGet, apiPost, apiPut, apiDelete } from '@/utils/apiClient.js'

const BASE = `${apiUrl}/prestream-templates`

export const createPreStreamTemplate = async (payload: any) => {
  const res = await apiPost(BASE, payload)
  return await res.json()
}

export const updatePreStreamTemplate = async (id: string, payload: any) => {
  const res = await apiPut(`${BASE}/${id}`, payload)
  return await res.json()
}

export const deletePreStreamTemplate = async (id: string) => {
  const res = await apiDelete(`${BASE}/${id}`)
  return await res.json()
}

export const getPreStreamTemplateById = async (id: string) => {
  const res = await apiGet(`${BASE}/${id}`)
  return await res.json()
}

export const getPreStreamTemplatesByUser = async (userId: string, opts?: { search?: string; page_no?: number; limit?: number }) => {
  const params = new URLSearchParams()
  params.set('userId', userId)
  if (opts?.search) params.set('search', opts.search)
  params.set('page_no', String(opts?.page_no || 1))
  params.set('limit', String(opts?.limit || 10))
  const res = await apiGet(`${BASE}?${params.toString()}`)
  return await res.json()
}

