import { DJANGO_API_ENDPOINT } from '@/config/config';
import ApiProxy from '@/app/api/proxy';
import { NextResponse } from 'next/server';

/**
 * GET handler per ottenere i mezzi-rimorchio disponibili per un'attività specifica
 * 
 * @param {NextRequest} request - La richiesta Next.js
 * @param {Object} params - I parametri della route
 * @param {string} params.id - L'ID dell'attività
 * @returns {NextResponse} Lista dei mezzi-rimorchio disponibili
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Chiamata all'API Django per ottenere i mezzi-rimorchio disponibili
    // Nota: aggiungiamo il trailing slash e passiamo l'id dell'attività come query param
    // perché alcune configurazioni Django possono aspettarsi lo slash e/o filtri.
    const djangoUrl = `${DJANGO_API_ENDPOINT}/mezzi-rimorchi/disponibili/?attivita_id=${encodeURIComponent(id)}`;
    const {data, status} = await ApiProxy.get(djangoUrl, true);
    
    if (status >= 400) {
      console.error('Mezzi disponibili GET error response:', {status, data, djangoUrl});
      // restituiamo il payload così com'è per facilitare il debug client-side
      return NextResponse.json(data || {error: 'Server error', djangoUrl}, {status: status})
    }

    return NextResponse.json({data}, {status: status});
    
  } catch (error) {
    console.error('Errore nella route API Next.js:', error);
    return NextResponse.json(
      { 
        error: 'Errore interno del server Next.js',
        details: error.message 
      },
      { status: error.status || 500 }
    );
  }
}