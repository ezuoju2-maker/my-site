import type { APIRoute } from "astro";
import { requireAuth } from "../../../lib/permissions";
import { env } from "cloudflare:workers";
import {
  corsHeaders,
  getAllowedOrigin,
  rejectCrossSiteRequest,
} from "../../../lib/cors";

export const prerender = import.meta.env.GITHUB_PAGES === "true";

function json(data: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  if (!origin) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
};

export const GET: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const db = env.DB;
    if (!db) return json({ ok: false, error: "DB_NOT_CONFIGURED" }, 500, origin);

    const result = await db
      .prepare(
        `SELECT device_id, device_type, device_model, device_family,
                model_confidence, model_identifiability, model_source,
                detector_version, model_candidates, detection_evidence,
                top_candidate, second_candidate,
                os_name, os_version, browser_name, browser_version,
                ground_truth_model, corrected_at,
                first_login_at, last_login_at, ip_address, location
         FROM user_login_devices
         WHERE user_id = ?1
         ORDER BY last_login_at DESC
         LIMIT 50`,
      )
      .bind(auth.session.userId)
      .all<{
        device_id: string;
        device_type: string | null;
        device_model: string | null;
        device_family: string | null;
        model_confidence: string | null;
        model_identifiability: string | null;
        model_source: string | null;
        detector_version: string | null;
        model_candidates: string | null;
        detection_evidence: string | null;
        top_candidate: string | null;
        second_candidate: string | null;
        os_name: string | null;
        os_version: string | null;
        browser_name: string | null;
        browser_version: string | null;
        ground_truth_model: string | null;
        corrected_at: string | null;
        first_login_at: string | null;
        last_login_at: string | null;
        ip_address: string | null;
        location: string | null;
      }>();

    const devices = (result.results ?? []).map((r) => {
      let candidates: { model: string; score: number }[] = [];
      try { candidates = r.model_candidates ? JSON.parse(r.model_candidates) : []; } catch {}
      let evidence: unknown = null;
      try { evidence = r.detection_evidence ? JSON.parse(r.detection_evidence) : null; } catch {}
      return {
        deviceId: r.device_id,
        deviceType: r.device_type,
        deviceModel: r.device_model,
        deviceFamily: r.device_family,
        modelConfidence: r.model_confidence,
        modelIdentifiability: r.model_identifiability,
        modelSource: r.model_source,
        detectorVersion: r.detector_version,
        modelCandidates: candidates,
        detectionEvidence: evidence,
        topCandidate: r.top_candidate,
        secondCandidate: r.second_candidate,
        osName: r.os_name,
        osVersion: r.os_version,
        browserName: r.browser_name,
        browserVersion: r.browser_version,
        groundTruthModel: r.ground_truth_model,
        correctedAt: r.corrected_at,
        firstLoginAt: r.first_login_at,
        lastLoginAt: r.last_login_at,
        ipAddress: r.ip_address,
        location: r.location,
      };
    });

    return json({ ok: true, devices }, 200, origin);
  } catch (error) {
    console.error("list devices error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const deviceId = url.searchParams.get("device_id");

  if (!deviceId || deviceId.length > 128) {
    return json({ ok: false, error: "INVALID_DEVICE_ID" }, 400, origin);
  }

  try {
    const db = env.DB;
    if (!db) return json({ ok: false, error: "DB_NOT_CONFIGURED" }, 500, origin);

    const result = await db
      .prepare(
        "DELETE FROM user_login_devices WHERE user_id = ?1 AND device_id = ?2",
      )
      .bind(auth.session.userId, deviceId)
      .run();

    if (!result.success || (result.meta?.changes ?? 0) === 0) {
      return json({ ok: false, error: "DEVICE_NOT_FOUND" }, 404, origin);
    }

    return json({ ok: true }, 200, origin);
  } catch (error) {
    console.error("revoke device error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};


export const PATCH: APIRoute = async ({ request }) => {
  const origin = getAllowedOrigin(request);
  const rejected = rejectCrossSiteRequest(request);
  if (rejected) return rejected;

  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: { device_id?: string; model?: string; source?: string };
  try { body = await request.json(); } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400, origin);
  }

  const deviceId = typeof body.device_id === "string" ? body.device_id : "";
  const model = typeof body.model === "string" ? body.model.trim().slice(0, 100) : "";
  const source = body.source === "verified" ? "verified" : "user";

  if (!deviceId || !model) {
    return json({ ok: false, error: "MISSING_FIELDS" }, 400, origin);
  }

  try {
    const db = env.DB;
    if (!db) return json({ ok: false, error: "DB_NOT_CONFIGURED" }, 500, origin);

    const result = await db.prepare(
      `UPDATE user_login_devices
       SET ground_truth_model = ?1,
           ground_truth_source = ?2,
           corrected_at = CURRENT_TIMESTAMP
       WHERE user_id = ?3 AND device_id = ?4`
    ).bind(model, source, auth.session.userId, deviceId).run();

    if (!result.success || (result.meta?.changes ?? 0) === 0) {
      return json({ ok: false, error: "DEVICE_NOT_FOUND" }, 404, origin);
    }
    return json({ ok: true, ground_truth_model: model }, 200, origin);
  } catch (error) {
    console.error("correct device error", error);
    return json({ ok: false, error: "INTERNAL_ERROR" }, 500, origin);
  }
};
