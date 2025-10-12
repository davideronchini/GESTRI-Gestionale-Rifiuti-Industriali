import { DJANGO_API_ENDPOINT } from '@/config/config';
import ApiProxy from '@/app/api/proxy.jsx';
import { NextResponse } from 'next/server';

/**
 * DELETE handler per dissociare un operatore da un'attività
 * (operatore_id passato nel body, come la rotta associa-operatore DELETE)
 * 
 * @param {NextRequest} request - La richiesta Next.js
 * @param {Object} params - I parametri della route
 * @param {string} params.id - L'ID dell'attività
 * @returns {NextResponse} Risultato della dissociazione
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    // Verifica che il parametro operatore_id sia presente
    if (!body || !body.operatore_id) {
      return NextResponse.json(
        { error: 'Il parametro operatore_id è richiesto' },
        { status: 400 }
      );
    }

    // Chiamata all'API Django per dissociare l'operatore (operatore_id nel body)
    const {data, status} = await ApiProxy.delete(
      `${DJANGO_API_ENDPOINT}/attivita/${id}/dissocia-operatore/${body.operatore_id}`,
      true
    );
    
    if (status >= 400) {
      console.error('Dissocia operatore error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status});
    }

    return NextResponse.json(data, {status: status});
    
  } catch (error) {
    console.error('Errore nella dissociazione operatore (proxy):', error);
    return NextResponse.json(
      { 
        error: 'Errore interno del server',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
