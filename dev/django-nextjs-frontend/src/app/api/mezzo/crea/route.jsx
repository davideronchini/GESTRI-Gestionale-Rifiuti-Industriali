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
    console.log('[Proxy /api/mezzo/crea] received body:', JSON.stringify(body));

    // Support both shapes: { mezzo: {...}, rimorchio: {...} } or flat fields
    const mezzoPayload = body?.mezzo
      ? {
          ...body.mezzo,
          targa: (body.mezzo.targa || '').toString().trim().toUpperCase(),
          statoMezzo: (body.mezzo.statoMezzo || 'DISPONIBILE').toString().toUpperCase(),
        }
      : {
          targa: (body?.targa || '').toString().trim().toUpperCase(),
          chilometraggio: Number.isFinite(Number(body?.chilometraggio)) ? parseInt(body.chilometraggio, 10) : 0,
          consumoCarburante: Number.isFinite(Number(body?.consumoCarburante)) ? parseFloat(body.consumoCarburante) : 0.0,
          scadenzaRevisione: body?.scadenzaRevisione || null,
          scadenzaAssicurazione: body?.scadenzaAssicurazione || null,
          statoMezzo: (body?.statoMezzo || 'DISPONIBILE').toString().toUpperCase(),
        };

    const rimPayload = body?.rimorchio || body?.rimorchioPayload
      ? {
          ...body.rimorchio,
          nome: (body.rimorchio?.nome || body.rimorchio?.nome || '').toString().trim(),
          tipoRimorchio: (body.rimorchio?.tipoRimorchio || body.rimorchio?.tipo || 'ALTRO').toString().toUpperCase(),
        }
      : {
          nome: (body?.rimorchioNome || body?.rimorchio_nome || '').toString().trim(),
          capacitaDiCarico: Number.isFinite(Number(body?.rimorchioCapacita)) ? parseFloat(body.rimorchioCapacita) : 0.0,
          tipoRimorchio: (body?.rimorchioTipo || 'ALTRO').toString().toUpperCase(),
        };

  const hasMezzo = mezzoPayload && mezzoPayload.targa && mezzoPayload.targa !== '';
  // Consider rimorchio present if it has a nome OR an id (client may pass only { id })
  const hasRimorchio = Boolean(rimPayload && ((rimPayload.id !== undefined && rimPayload.id !== null && rimPayload.id !== '') || (rimPayload.nome && rimPayload.nome !== '')));
  console.log('[Proxy /api/mezzo/crea] hasMezzo:', hasMezzo, 'hasRimorchio:', hasRimorchio, 'mezzoPayload:', mezzoPayload, 'rimPayload:', rimPayload);

    if (!hasMezzo && !hasRimorchio) {
      return NextResponse.json({ error: 'Né mezzo né rimorchio forniti' }, { status: 400 });
    }

    let mezzoData = null;
    let rimData = null;
    let assocData = null;
    let createdMezzo = false;
    let createdRim = false;

    // If mezzo provided, try to find by targa first and reuse if exists
    if (hasMezzo) {
      try {
        const getUrl = `${DJANGO_API_MEZZO_URL}by-targa/${encodeURIComponent(mezzoPayload.targa)}`;
        console.log('[Proxy /api/mezzo/crea] looking up mezzo by targa at', getUrl);
        const { data: existingMezzo, status: getStatus } = await ApiProxy.get(getUrl, true);
        console.log('[Proxy /api/mezzo/crea] lookup status', getStatus, 'body', existingMezzo);
        // Consider existing only if the backend returned a proper object with an id
        if (getStatus >= 200 && getStatus < 300 && existingMezzo && (existingMezzo.id || existingMezzo.id === 0)) {
          console.log('[Proxy /api/mezzo/crea] using existing mezzo', existingMezzo.id);
          mezzoData = existingMezzo;
        } else {
          // Not found: create
          console.log('[Proxy /api/mezzo/crea] mezzo not found, creating with payload', mezzoPayload);
          const { data: created, status: createStatus } = await ApiProxy.post(DJANGO_API_MEZZO_URL, mezzoPayload, true);
          console.log('[Proxy /api/mezzo/crea] create mezzo status', createStatus, 'body', created);
          if (createStatus < 200 || createStatus >= 300) {
            console.error('[Mezzo Creazione API] error creating mezzo', createStatus, created);
            return NextResponse.json(created || { error: 'Errore creazione mezzo' }, { status: createStatus });
          }
          mezzoData = created;
          createdMezzo = true;
        }
      } catch (e) {
        console.error('[Mezzo Creazione API] mezzo lookup/create failed', e);
        return NextResponse.json({ error: 'Errore lookup/creazione mezzo' }, { status: 500 });
      }
    }

    // If rimorchio provided, either reuse by id or create rimorchio
    if (hasRimorchio) {
      try {
        // If client provided an id, try to GET and reuse
        if (rimPayload && rimPayload.id) {
          const rimId = Number(rimPayload.id);
          console.log('[Proxy /api/mezzo/crea] rimorchio id provided, looking up', rimId);
          // Use consistent URL without adding an extra slash; backend routes expect /rimorchi/{id}
          const rimLookupUrl = `${DJANGO_API_RIMORCHIO_URL}${rimId}`;
          console.log('[Proxy /api/mezzo/crea] rimorchio lookup url', rimLookupUrl);
          const { data: existingRim, status: getRimStatus } = await ApiProxy.get(rimLookupUrl, true);
          console.log('[Proxy /api/mezzo/crea] rimorchio lookup status', getRimStatus, 'body', existingRim);
          if (getRimStatus >= 200 && getRimStatus < 300 && existingRim && (existingRim.id || existingRim.id === 0)) {
            rimData = existingRim;
            createdRim = false; // reuse
          } else {
            // Not found
            console.error('[Mezzo Creazione API] rimorchio id provided but not found', rimId);
            // Rollback mezzo if created here
            if (createdMezzo && mezzoData && mezzoData.id) {
              try { await ApiProxy.delete(`${DJANGO_API_MEZZO_URL}${mezzoData.id}`, true); } catch (e) { console.warn('Rollback delete mezzo failed', e); }
            }
            return NextResponse.json({ error: 'Rimorchio non trovato per id fornito' }, { status: 404 });
          }
        } else {
          // No id -> create new rimorchio
          const { data: createdRimData, status: rimStatus } = await ApiProxy.post(DJANGO_API_RIMORCHIO_URL, rimPayload, true);
          if (rimStatus < 200 || rimStatus >= 300) {
            console.error('[Mezzo Creazione API] error creating rimorchio', rimStatus, createdRimData);
            // rollback mezzo if we created it in this request
            if (createdMezzo && mezzoData && mezzoData.id) {
              try { await ApiProxy.delete(`${DJANGO_API_MEZZO_URL}${mezzoData.id}`, true); } catch (e) { console.warn('Rollback delete mezzo failed', e); }
            }
            return NextResponse.json(createdRimData || { error: 'Errore creazione rimorchio' }, { status: rimStatus });
          }
          rimData = createdRimData;
          createdRim = true;
        }
      } catch (e) {
        console.error('[Mezzo Creazione API] rimorchio create/lookup failed', e);
        if (createdMezzo && mezzoData && mezzoData.id) {
          try { await ApiProxy.delete(`${DJANGO_API_MEZZO_URL}${mezzoData.id}`, true); } catch (err) { console.warn('Rollback delete mezzo failed', err); }
        }
        return NextResponse.json({ error: 'Errore creazione o lookup rimorchio' }, { status: 500 });
      }
    }

    // If both present, create association
    if (mezzoData && rimData) {
      try {
        const associazionePayload = { mezzo_id: mezzoData.id, rimorchio_id: rimData.id, attivo: true };
        const { data: createdAssoc, status: assocStatus } = await ApiProxy.post(DJANGO_API_MEZZI_RIMORCHI_URL, associazionePayload, true);
        if (assocStatus < 200 || assocStatus >= 300) {
          console.error('[Mezzo Creazione API] error creating associazione', assocStatus, createdAssoc);
          // rollback created entities (only those created during this call)
          if (createdRim && rimData && rimData.id) {
            try { await ApiProxy.delete(`${DJANGO_API_RIMORCHIO_URL}${rimData.id}`, true); } catch (e) { console.warn('Rollback delete rimorchio failed', e); }
          }
          if (createdMezzo && mezzoData && mezzoData.id) {
            try { await ApiProxy.delete(`${DJANGO_API_MEZZO_URL}${mezzoData.id}`, true); } catch (e) { console.warn('Rollback delete mezzo failed', e); }
          }
          return NextResponse.json(createdAssoc || { error: 'Errore creazione associazione' }, { status: assocStatus });
        }
        assocData = createdAssoc;
      } catch (e) {
        console.error('[Mezzo Creazione API] associazione create failed', e);
        if (createdRim && rimData && rimData.id) {
          try { await ApiProxy.delete(`${DJANGO_API_RIMORCHIO_URL}${rimData.id}`, true); } catch (err) { console.warn('Rollback delete rimorchio failed', err); }
        }
        if (createdMezzo && mezzoData && mezzoData.id) {
          try { await ApiProxy.delete(`${DJANGO_API_MEZZO_URL}${mezzoData.id}`, true); } catch (err) { console.warn('Rollback delete mezzo failed', err); }
        }
        return NextResponse.json({ error: 'Errore creazione associazione' }, { status: 500 });
      }
    }

    // Build response: include only created/used entities
    const response = { mezzo: mezzoData || null, rimorchio: rimData || null, associazione: assocData || null };

    // Status: 201 if any entity was created during this call, otherwise 200
    const anyCreated = createdMezzo || createdRim || false;
    return NextResponse.json(response, { status: anyCreated ? 201 : 200 });
  } catch (error) {
    console.error('[Mezzo Creazione API] Unexpected error:', error);
    return NextResponse.json({ error: 'Failed to create mezzo-rimorchio' }, { status: 500 });
  }
}
