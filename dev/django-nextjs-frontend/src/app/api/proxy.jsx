import { getToken } from "@/utils/auth"

export default class ApiProxy {

  static async getHeaders(requireAuth, includeContentType = true){
    let headers = {
      'Accept': 'application/json',
    }

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
  
    const authToken = getToken()
    if (authToken && requireAuth){
      headers['Authorization'] = `Bearer ${authToken}`
    }

    return headers
  }

  static async handleFetch(endpoint, requestOption){
    let data = {}
    let status = 500
    try{
      // Aggiungi credentials: 'include' per inviare i cookies di sessione
      const response = await fetch(endpoint, {
        ...requestOption,
        credentials: 'include'
      });

      status = response.status

      // Proviamo a leggere il body come testo e provare a parsarlo in JSON.
      // Alcuni endpoint possono rispondere con body vuoto o con HTML (405/500)
      const text = await response.text();
      try {
        data = text && text.length > 0 ? JSON.parse(text) : {};
      } catch (parseErr) {
        // Non JSON: restituiamo un oggetto JSON con 'detail' per essere più
        // consistente con gli error payload tipici e facilitare la UI.
        data = text && text.length > 0 ? { detail: text } : {};
      }
    }catch(error){
      console.error('ApiProxy fetch error:', error);
      data = {message: "Cannot reach API server", error: error.message || String(error)}
      status = 500
    }

    return {data, status}
  }

  static async post(endpoint, data, requireAuth){
      let requestOption;
      
      if (data instanceof FormData) {
        // For FormData, don't set Content-Type (browser will set it with boundary)
        const headers = await ApiProxy.getHeaders(requireAuth, false)
        requestOption = {
          method: 'POST',
          headers: headers,
          body: data,
        }
      } else {
        // For JSON data
        const jsonData = JSON.stringify(data);
        const headers = await ApiProxy.getHeaders(requireAuth, true)
        requestOption = {
          method: 'POST',
          headers: headers,
          body: jsonData,
        }
      }
      
      return await ApiProxy.handleFetch(endpoint, requestOption);
  }

  static async get(endpoint, requireAuth){
      const headers = await ApiProxy.getHeaders(requireAuth)
      const requestOption = {
        method: 'GET',
        headers: headers,
      }
      return await ApiProxy.handleFetch(endpoint, requestOption);
  }

  static async delete(endpoint, requireAuth){
      const headers = await ApiProxy.getHeaders(requireAuth)
      const requestOption = {
        method: 'DELETE',
        headers: headers,
      }
      return await ApiProxy.handleFetch(endpoint, requestOption);
  }

  static async put(endpoint, data, requireAuth){
      let requestOption;
      
      if (data instanceof FormData) {
        // For FormData, don't set Content-Type (browser will set it with boundary)
        const headers = await ApiProxy.getHeaders(requireAuth, false)
        requestOption = {
          method: 'PUT',
          headers: headers,
          body: data,
        }
      } else {
        // For JSON data
        const jsonData = JSON.stringify(data);
        const headers = await ApiProxy.getHeaders(requireAuth, true)
        requestOption = {
          method: 'PUT',
          headers: headers,
          body: jsonData,
        }
      }
      
      return await ApiProxy.handleFetch(endpoint, requestOption);
  }

  static async patch(endpoint, data, requireAuth){
      let requestOption;
      
      if (data instanceof FormData) {
        // For FormData, don't set Content-Type (browser will set it with boundary)
        const headers = await ApiProxy.getHeaders(requireAuth, false)
        requestOption = {
          method: 'PATCH',
          headers: headers,
          body: data,
        }
      } else {
        // For JSON data
        const jsonData = JSON.stringify(data);
        const headers = await ApiProxy.getHeaders(requireAuth, true)
        requestOption = {
          method: 'PATCH',
          headers: headers,
          body: jsonData,
        }
      }
      
      return await ApiProxy.handleFetch(endpoint, requestOption);
  }
}