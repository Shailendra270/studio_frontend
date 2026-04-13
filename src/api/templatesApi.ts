import { apiUrl, apiGet, apiPost, apiPut, apiDelete } from '@/utils/apiClient.js'

const BASE = `${apiUrl}/templates`

export const createTemplate = async (payload: any) => {
  const res = await apiPost(BASE, payload)
  return await res.json()
}

export const updateTemplate = async (id: string, payload: any) => {
  const res = await apiPut(`${BASE}/${id}`, payload)
  return await res.json()
}

export const deleteTemplate = async (id: string) => {
  const res = await apiDelete(`${BASE}/${id}`)
  return await res.json()
}

export const getTemplateById = async (id: string) => {
  const res = await apiGet(`${BASE}/${id}`)
  return await res.json()
}

export const getTemplatesByUser = async (userId: string, opts?: { search?: string; page_no?: number; limit?: number }) => {
  const params = new URLSearchParams()
  params.set('userId', userId)
  if (opts?.search) params.set('search', opts.search)
  if (opts?.page_no) params.set('page_no', String(opts.page_no))
  if (opts?.limit) params.set('limit', String(opts.limit))
  const res = await apiGet(`${BASE}?${params.toString()}`)
  return await res.json()
}
