import { DJANGO_API_ENDPOINT } from '@/config/config';
import ApiProxy from '@/app/api/proxy.jsx';
import { NextResponse } from 'next/server';

/**
 * POST handler per caricare un nuovo documento
 * 
 * @param {NextRequest} request - La richiesta Next.js
 * @returns {NextResponse} Risultato dell'upload
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    
    // Diagnostic logs: list received formData keys and file info
    try {
      const keys = [];
      for (const key of formData.keys()) {
        keys.push(key);
      }
      console.log('Upload proxy: received formData keys ->', keys);
      const maybeFile = formData.get('file');
      if (maybeFile) {
        // File is a Blob/File-like object
        console.log('Upload proxy: received file ->', {
          name: maybeFile.name || '<no-name>',
          size: maybeFile.size || null,
          type: maybeFile.type || null,
        });
      }
    } catch (logErr) {
      console.warn('Upload proxy: could not list formData keys', logErr);
    }

    // Extract fields - file is optional now
    const file = formData.get('file');
    const tipoDocumento = formData.get('tipoDocumento');
    const dataScadenza = formData.get('dataScadenza');
    const operatoreEmail = formData.get('operatore_email');
    const attivitaId = formData.get('attivita_id');

    if (!tipoDocumento) {
      return NextResponse.json(
        { error: 'Il tipo documento è richiesto' },
        { status: 400 }
      );
    }

    // Prepara FormData per Django
    const djangoFormData = new FormData();
    if (file) djangoFormData.append('file', file);
    djangoFormData.append('tipoDocumento', tipoDocumento);
    if (dataScadenza) djangoFormData.append('dataScadenza', dataScadenza);
    if (operatoreEmail) djangoFormData.append('operatore_email', operatoreEmail);
    if (attivitaId) djangoFormData.append('attivita_id', attivitaId);

    // Diagnostic: log what we will forward to Django
    try {
      const fwdKeys = [];
      for (const key of djangoFormData.keys()) {
        fwdKeys.push(key);
      }
      console.log('Upload proxy: forwarding FormData keys to Django ->', fwdKeys);
    } catch (logErr) {
      console.warn('Upload proxy: could not list djangoFormData keys', logErr);
    }

    // Chiamata all'API Django tramite ApiProxy
    const {data, status} = await ApiProxy.post(`${DJANGO_API_ENDPOINT}/documenti/`, djangoFormData, true);
    console.log('Upload proxy: Django response status, data ->', status, data);
    
    if (status >= 400) {
      console.error('Upload documento error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status});
    }

    return NextResponse.json(data, {status: status});
    
  } catch (error) {
    console.error('Errore nell\'upload documento:', error);
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
 * PUT handler per aggiornare un documento esistente
 * 
 * @param {NextRequest} request - La richiesta Next.js
 * @returns {NextResponse} Risultato dell'aggiornamento
 */
export async function PUT(request) {
  try {
    const formData = await request.formData();
    
    // Verifica che i parametri richiesti siano presenti
    const file = formData.get('file');
    const tipoDocumento = formData.get('tipoDocumento');
    const documentoId = formData.get('documento_id');
    
    if (!documentoId) {
      return NextResponse.json(
        { error: 'ID documento è richiesto' },
        { status: 400 }
      );
    }

    // Prepara FormData per Django
    const djangoFormData = new FormData();
    
    if (file) {
      djangoFormData.append('file', file);
    }
    
    if (tipoDocumento) {
      djangoFormData.append('tipoDocumento', tipoDocumento);
    }

    // Chiamata all'API Django tramite ApiProxy per l'aggiornamento
    const {data, status} = await ApiProxy.put(`${DJANGO_API_ENDPOINT}/documenti/${documentoId}`, djangoFormData, true);
    
    if (status >= 400) {
      console.error('Update documento error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status});
    }

    return NextResponse.json(data, {status: status});
    
  } catch (error) {
    console.error('Errore nell\'aggiornamento documento:', error);
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
 * PATCH handler per aggiornare un documento esistente (alternativo più compatibile)
 * 
 * @param {NextRequest} request - La richiesta Next.js
 * @returns {NextResponse} Risultato dell'aggiornamento
 */
export async function PATCH(request) {
  try {
    const formData = await request.formData();
    
    // Verifica che i parametri richiesti siano presenti
    const file = formData.get('file');
    const tipoDocumento = formData.get('tipoDocumento');
    const documentoId = formData.get('documento_id');
    
    if (!documentoId) {
      return NextResponse.json(
        { error: 'ID documento è richiesto' },
        { status: 400 }
      );
    }

    // Prepara FormData per Django
    const djangoFormData = new FormData();
    
    if (file) {
      djangoFormData.append('file', file);
    }
    
    if (tipoDocumento) {
      djangoFormData.append('tipoDocumento', tipoDocumento);
    }

    // Chiamata all'API Django tramite ApiProxy per l'aggiornamento usando PATCH
    const {data, status} = await ApiProxy.patch(`${DJANGO_API_ENDPOINT}/documenti/${documentoId}`, djangoFormData, true);
    
    if (status >= 400) {
      console.error('Patch documento error response:', {status, data});
      return NextResponse.json(data || {error: 'Server error'}, {status: status});
    }

    return NextResponse.json(data, {status: status});
    
  } catch (error) {
    console.error('Errore nel PATCH documento:', error);
    return NextResponse.json(
      { 
        error: 'Errore interno del server',
        details: error.message 
      },
      { status: 500 }
    );
  }
}