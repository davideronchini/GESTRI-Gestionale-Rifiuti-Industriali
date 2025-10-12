import { DJANGO_API_ENDPOINT } from '@/config/config';
import ApiProxy from '@/app/api/proxy';
import { NextResponse } from 'next/server';

/**
 * POST handler per associare un mezzo-rimorchio a un'attività
 * 
 * @param {NextRequest} request - La richiesta Next.js
 * @param {Object} params - I parametri della route
 * @param {string} params.id - L'ID dell'attività
 * @returns {NextResponse} Risultato dell'associazione
 */
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Verifica che il parametro mezzo_rimorchio_id sia presente
    if (!body.mezzo_rimorchio_id) {
      return NextResponse.json(
        { error: 'Il parametro mezzo_rimorchio_id è richiesto' },
        { status: 400 }
      );
    }

    // Chiamata all'API Django per associare il mezzo
    const {data, status} = await ApiProxy.post(
      `${DJANGO_API_ENDPOINT}/attivita/${id}/associa-mezzo`,
      body,
      true
    );
    
    if (status >= 400) {
      console.error('Associa mezzo error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status});
    }

    return NextResponse.json(data, {status: status});
    
  } catch (error) {
    console.error('Errore nell\'associazione mezzo:', error);
    return NextResponse.json(
      { 
        error: 'Errore interno del server',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler per dissociare un mezzo-rimorchio da un'attività
 * 
 * @param {NextRequest} request - La richiesta Next.js
 * @param {Object} params - I parametri della route
 * @param {string} params.id - L'ID dell'attività
 * @returns {NextResponse} Risultato della dissociazione
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Chiamata all'API Django per dissociare il mezzo
    const {data, status} = await ApiProxy.delete(
      `${DJANGO_API_ENDPOINT}/attivita/${id}/dissocia-mezzo`,
      true
    );
    
    if (status >= 400) {
      console.error('Dissocia mezzo error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status});
    }

    return NextResponse.json(data, {status: status});
    
  } catch (error) {
    console.error('Errore nella dissociazione mezzo:', error);
    return NextResponse.json(
      { 
        error: 'Errore interno del server',
        details: error.message 
      },
      { status: 500 }
    );
  }
}