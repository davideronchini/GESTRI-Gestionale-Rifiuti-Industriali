/**
 * Fetcher centralizzato per SWR con gestione migliorata degli errori 401
 * 
 * Questo fetcher:
 * - Gestisce correttamente gli errori HTTP
 * - Marca gli errori 401 in modo che possano essere rilevati da useAuthGuard
 * - Normalizza le risposte dal backend (gestisce sia { data: ... } che risposte dirette)
 * - Include logging per debug
 * - Include credentials per gestire l'autenticazione basata su cookie
 */
const fetcher = async (url) => {
  console.log('🌐 Fetcher: Making request to:', url);
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include', // Include cookies for authentication
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('🌐 Fetcher: Response status:', res.status, 'ok:', res.ok);

    // Se la risposta non è ok, crea un errore con tutti i dettagli necessari
    if (!res.ok) {
      const error = new Error(`HTTP ${res.status}: An error occurred while fetching the data.`);
      error.status = res.status;
      
      // Prova a parsare il corpo della risposta come JSON
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          error.info = await res.json();
        } else {
          // Se non è JSON, salva il testo (potrebbe essere una risposta HTML)
          const textResponse = await res.text();
          // We use 'detail' to be consistent with ApiProxy's non-JSON wrapper
          error.info = { detail: textResponse.substring(0, 200), body: textResponse.substring(0, 200) };
        }
      } catch (e) {
        console.error('🌐 Fetcher: Error parsing error response:', e);
        error.info = { message: 'Failed to parse error response' };
      }
      
      console.error('🌐 Fetcher: Request failed:', error.status, error.info);
      
      // Per errori 401, aggiungi un flag speciale che useAuthGuard può rilevare
      if (error.status === 401) {
        console.warn('🚨 Fetcher: 401 Unauthorized detected - session may have expired');
        error.isAuthError = true;
      }
      
      throw error;
    }

    // Prova a parsare la risposta come JSON
    try {
      const responseData = await res.json();
      console.log('🌐 Fetcher: Success, data received');
      
      // Normalizza la risposta: alcuni endpoint restituiscono { data: ... }, altri direttamente i dati
      return responseData.data || responseData;
    } catch (e) {
      console.error('🌐 Fetcher: Error parsing successful response:', e);
      throw new Error('Invalid JSON response from server');
    }
  } catch (error) {
    // Se è un errore che abbiamo già creato sopra, rilancialo
    if (error.status) {
      throw error;
    }
    
    // Altrimenti è un errore di rete
    console.error('🌐 Fetcher: Network error:', error);
    const networkError = new Error('Network error occurred');
    networkError.status = 0;
    networkError.info = { message: error.message };
    networkError.originalError = error;
    throw networkError;
  }
};

/**
 * Variante del fetcher per richieste POST/PUT/DELETE
 */
export const fetcherWithMethod = async (url, options = {}) => {
  console.log('🌐 FetcherWithMethod: Making', options.method || 'POST', 'request to:', url);
  
  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log('🌐 FetcherWithMethod: Response status:', res.status, 'ok:', res.ok);

    if (!res.ok) {
      const error = new Error(`HTTP ${res.status}: An error occurred`);
      error.status = res.status;
      
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          error.info = await res.json();
        } else {
          const textResponse = await res.text();
          error.info = { detail: textResponse.substring(0, 200), body: textResponse.substring(0, 200) };
        }
      } catch (e) {
        error.info = { message: 'Failed to parse error response' };
      }
      
      if (error.status === 401) {
        console.warn('🚨 FetcherWithMethod: 401 Unauthorized detected');
        error.isAuthError = true;
      }
      
      throw error;
    }

    try {
      const responseData = await res.json();
      return responseData.data || responseData;
    } catch (e) {
      // Alcune risposte potrebbero essere vuote (es. 204 No Content)
      if (res.status === 204) {
        return null;
      }
      throw new Error('Invalid JSON response from server');
    }
  } catch (error) {
    if (error.status) {
      throw error;
    }
    
    const networkError = new Error('Network error occurred');
    networkError.status = 0;
    networkError.info = { message: error.message };
    networkError.originalError = error;
    throw networkError;
  }
};

export default fetcher;