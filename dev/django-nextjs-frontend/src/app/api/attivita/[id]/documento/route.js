import { DJANGO_API_ENDPOINT } from '@/config/config';
import ApiProxy from '@/app/api/proxy.jsx';
import { NextResponse } from 'next/server';

/**
 * GET handler per ottenere il documento associato a un'attività
 * 
 * @param {NextRequest} request - La richiesta Next.js
 * @param {Object} params - I parametri della route
 * @param {string} params.id - L'ID dell'attività
 * @returns {NextResponse} Documento associato all'attività
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID attività richiesto' },
        { status: 400 }
      );
    }

    // Chiamata all'API Django per ottenere il documento dell'attività
    const {data, status} = await ApiProxy.get(`${DJANGO_API_ENDPOINT}/attivita/${id}/documento`, true);
    
    if (status >= 400) {
      console.error('Get documento by attivita error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status});
    }

    return NextResponse.json(data, {status: status});
    
  } catch (error) {
    console.error('Errore nel recupero documento per attività:', error);
    return NextResponse.json(
      { 
        error: 'Errore interno del server',
        details: error.message 
      },
      { status: 500 }
    );
  }
}