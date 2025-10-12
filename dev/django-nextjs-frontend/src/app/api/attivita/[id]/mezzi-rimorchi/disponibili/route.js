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
    const {data, status} = await ApiProxy.get(`${DJANGO_API_ENDPOINT}/mezzi-rimorchi/disponibili`, true);
    
    if (status >= 400) {
      console.error('Mezzi disponibili GET error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status})
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