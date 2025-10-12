import { NextResponse } from "next/server";
import ApiProxy from "../proxy";

const DJANGO_API_ENDPOINT = process.env.NEXT_PUBLIC_DJANGO_API_ENDPOINT || 'http://localhost:8000/api';
const DJANGO_API_MEZZO_URL = `${DJANGO_API_ENDPOINT}/mezzi/`;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targa = searchParams.get('targa');
    
    let url;
    if (targa) {
      // Cerca per targa
      url = `${DJANGO_API_MEZZO_URL}by-targa/${encodeURIComponent(targa)}`;
    } else {
      // Lista tutti i mezzi per stato (default DISPONIBILE)
      const stato = searchParams.get('stato') || 'DISPONIBILE';
      url = `${DJANGO_API_MEZZO_URL}by-stato/${stato}`;
    }
    
    const { data, status } = await ApiProxy.get(url, true);
    
    if (status !== 200) {
      console.error('Mezzi GET error response:', { status, data });
      // Se cerchiamo per targa e non troviamo, restituiamo array vuoto invece di errore
      if (targa && status === 404) {
        return NextResponse.json([], { status: 200 });
      }
      return NextResponse.json(data || { error: 'Failed to fetch mezzi' }, { status });
    }
    
    // Se la risposta è un singolo mezzo (targa), lo mettiamo in array
    const responseData = Array.isArray(data) ? data : [data];
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error('Mezzi GET route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    // Validazioni minime lato route
    const errors = {};
    const cleaned = {};

    // targa obbligatoria e sempre maiuscola
    const rawTarga = (body?.targa || '').trim();
    if (!rawTarga) {
      errors.targa = ['La targa è obbligatoria'];
    } else {
      cleaned.targa = rawTarga.toUpperCase();
    }

    // statoMezzo opzionale ma normalizzato; default DISPONIBILE
    const validStati = ['DISPONIBILE', 'OCCUPATO', 'MANUTENZIONE'];
    const stato = (body?.statoMezzo || 'DISPONIBILE').toString().toUpperCase();
    cleaned.statoMezzo = validStati.includes(stato) ? stato : 'DISPONIBILE';

    // numerici opzionali con default
    const chil = body?.chilometraggio;
    cleaned.chilometraggio = Number.isFinite(Number(chil)) ? parseInt(chil, 10) : 0;

    const cons = body?.consumoCarburante;
    cleaned.consumoCarburante = Number.isFinite(Number(cons)) ? parseFloat(cons) : 0;

    // date opzionali in formato YYYY-MM-DD già dal client; se non valide invia null
    const isIsoDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
    cleaned.scadenzaRevisione = isIsoDate(body?.scadenzaRevisione) ? body.scadenzaRevisione : null;
    cleaned.scadenzaAssicurazione = isIsoDate(body?.scadenzaAssicurazione) ? body.scadenzaAssicurazione : null;

    // flag opzionale
    cleaned.isDanneggiato = Boolean(body?.isDanneggiato);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: 'Validazione fallita', details: errors }, { status: 400 });
    }

    const url = `${DJANGO_API_MEZZO_URL}`;
    const { data, status } = await ApiProxy.post(url, cleaned, true);
    
    if (status !== 200 && status !== 201) {
      console.error('Mezzo POST error response:', { status, data });
      return NextResponse.json(data || { error: 'Failed to create mezzo' }, { status });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Mezzo POST route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
