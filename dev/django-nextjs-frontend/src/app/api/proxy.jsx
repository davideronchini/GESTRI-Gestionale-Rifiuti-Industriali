import { getToken } from "@/utils/auth"

export default class ApiProxy {

  static async getHeaders(requireAuth){
    let headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
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
      const response = await fetch(endpoint, requestOption);
      data = await response.json();
      status = response.status
    }catch(error){
      data = {message: "Cannot reach API server", error: error}
      status = 500
    }

    return {data, status}
  }

  static async post(endpoint, object, requireAuth){
      const jsonData = JSON.stringify(object);
      const headers = await ApiProxy.getHeaders(requireAuth)
      const requestOption = {
        method: 'POST',
        headers: headers,
        body: jsonData,
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
}