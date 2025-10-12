import { NextResponse } from "next/server";
import { DJANGO_API_ENDPOINT } from "@/config/config";
import ApiProxy from "../../proxy";

const DJANGO_API_MEZZO_URL = `${DJANGO_API_ENDPOINT}/mezzi/`;
const DJANGO_API_RIMORCHIO_URL = `${DJANGO_API_ENDPOINT}/rimorchi/`;
const DJANGO_API_MEZZI_RIMORCHI_URL = `${DJANGO_API_ENDPOINT}/mezzi-rimorchi/`;

// POST: accepts combined payload to create mezzo + rimorchio + associazione
export async function POST(request) {
  try {
    const body = await request.json();

    // Support both shapes: { mezzo: {...}, rimorchio: {...} } or flat fields
    const mezzoPayload = body?.mezzo || {
      targa: (body?.targa || '').toString().trim().toUpperCase(),
      chilometraggio: Number.isFinite(Number(body?.chilometraggio)) ? parseInt(body.chilometraggio, 10) : 0,
      consumoCarburante: Number.isFinite(Number(body?.consumoCarburante)) ? parseFloat(body.consumoCarburante) : 0.0,
      scadenzaRevisione: body?.scadenzaRevisione || null,
      scadenzaAssicurazione: body?.scadenzaAssicurazione || null,
      statoMezzo: (body?.statoMezzo || 'DISPONIBILE').toString().toUpperCase(),
    };

    const rimPayload = body?.rimorchio || body?.rimorchioPayload || {
      nome: body?.rimorchioNome || body?.rimorchio_nome || '',
      capacitaDiCarico: Number.isFinite(Number(body?.rimorchioCapacita)) ? parseFloat(body.rimorchioCapacita) : 0.0,
      tipoRimorchio: (body?.rimorchioTipo || 'ALTRO').toString().toUpperCase(),
    };

    // Basic validation
    if (!mezzoPayload.targa) {
      return NextResponse.json({ error: 'Targa mancante' }, { status: 400 });
    }
    if (!rimPayload.nome) {
      return NextResponse.json({ error: 'Nome rimorchio mancante' }, { status: 400 });
    }

    // 1) Create mezzo
    const { data: mezzoData, status: mezzoStatus } = await ApiProxy.post(DJANGO_API_MEZZO_URL, mezzoPayload, true);
    if (mezzoStatus < 200 || mezzoStatus >= 300) {
      console.error('[Mezzo Creazione API] error creating mezzo', mezzoStatus, mezzoData);
      return NextResponse.json(mezzoData || { error: 'Errore creazione mezzo' }, { status: mezzoStatus });
    }

    // 2) Create rimorchio
    const { data: rimData, status: rimStatus } = await ApiProxy.post(DJANGO_API_RIMORCHIO_URL, rimPayload, true);
    if (rimStatus < 200 || rimStatus >= 300) {
      console.error('[Mezzo Creazione API] error creating rimorchio', rimStatus, rimData);
      // try rollback: delete mezzo
      try { await ApiProxy.delete(`${DJANGO_API_MEZZO_URL}${mezzoData.id}`, true); } catch (e) { console.warn('Rollback delete mezzo failed', e); }
      return NextResponse.json(rimData || { error: 'Errore creazione rimorchio' }, { status: rimStatus });
    }

    // 3) Create association mezzo-rimorchio
    const associazionePayload = { mezzo_id: mezzoData.id, rimorchio_id: rimData.id, attivo: true };
    const { data: assocData, status: assocStatus } = await ApiProxy.post(DJANGO_API_MEZZI_RIMORCHI_URL, associazionePayload, true);
    if (assocStatus < 200 || assocStatus >= 300) {
      console.error('[Mezzo Creazione API] error creating associazione', assocStatus, assocData);
      // try rollback: delete rimorchio and mezzo
      try { await ApiProxy.delete(`${DJANGO_API_RIMORCHIO_URL}${rimData.id}`, true); } catch (e) { console.warn('Rollback delete rimorchio failed', e); }
      try { await ApiProxy.delete(`${DJANGO_API_MEZZO_URL}${mezzoData.id}`, true); } catch (e) { console.warn('Rollback delete mezzo failed', e); }
      return NextResponse.json(assocData || { error: 'Errore creazione associazione' }, { status: assocStatus });
    }

    // Success: return combined result
    return NextResponse.json({ mezzo: mezzoData, rimorchio: rimData, associazione: assocData }, { status: 201 });
  } catch (error) {
    console.error('[Mezzo Creazione API] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to create mezzo-rimorchio' }, { status: 500 });
  }
}
