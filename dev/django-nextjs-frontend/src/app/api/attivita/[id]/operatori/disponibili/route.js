import { DJANGO_API_ENDPOINT } from '@/config/config';
import ApiProxy from '@/app/api/proxy';
import { NextResponse } from 'next/server';

/**
 * GET handler per ottenere gli operatori disponibili per un'attività specifica
 * 
 * @param {NextRequest} request - La richiesta Next.js
 * @param {Object} params - I parametri della route
 * @param {string} params.id - L'ID dell'attività
 * @returns {NextResponse} Lista degli operatori disponibili
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Chiamata all'API Django per ottenere gli operatori disponibili
    const {data, status} = await ApiProxy.get(
      `${DJANGO_API_ENDPOINT}/attivita/${id}/operatori/disponibili`,
      true
    );
    
    if (status >= 400) {
      console.error('Get operatori disponibili error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status});
    }

    return NextResponse.json({data}, {status: status});
    
  } catch (error) {
    console.error('Errore nel caricamento operatori disponibili:', error);
    return NextResponse.json(
      { 
        error: 'Errore interno del server',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
