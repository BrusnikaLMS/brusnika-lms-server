/**
 * LMS bridge — forwards AI spend events from the embedded studio
 * to the parent LMS (Brusnika and others) via postMessage.
 *
 * cforj-embed does NOT deduct tokens, does NOT show plans/upsell,
 * does NOT gate the user. It only reports how many tokens each AI
 * operation consumed so the LMS can bill its own users.
 *
 * Protocol is documented in TOKEN_TRACKING.txt at repo root.
 *
 * Message shape (iframe → parent):
 *   {
 *     type: "cforj:tokenSpent",
 *     externalId: string | null,   // LMS user id, passed via ?ext_uid=...
 *     amount:     number,          // tokens charged for this operation
 *     operation:  string,          // "generate-course" | "generate-quiz" | ...
 *     at:         string,          // ISO-8601 timestamp
 *   }
 */

const EXT_UID_KEY = 'cforj_ext_uid'
const PARENT_ORIGIN_KEY = 'cforj_parent_origin'

function captureFromUrl(): void {
  if (typeof window === 'undefined') return
  try {
    const params = new URLSearchParams(window.location.search)
    const extUid = params.get('ext_uid')
    if (extUid) sessionStorage.setItem(EXT_UID_KEY, extUid)
    const parentOrigin = params.get('parent_origin')
    if (parentOrigin) sessionStorage.setItem(PARENT_ORIGIN_KEY, parentOrigin)
  } catch {
    /* ignore — SSR / privacy mode */
  }
}
captureFromUrl()

function isEmbedded(): boolean {
  if (typeof window === 'undefined') return false
  return window.parent !== window
}

function getParentOrigin(): string {
  try {
    const stored = sessionStorage.getItem(PARENT_ORIGIN_KEY)
    if (stored) return stored
    if (document.referrer) return new URL(document.referrer).origin
  } catch {
    /* ignore */
  }
  return '*'
}

function getExternalId(): string | null {
  try {
    return sessionStorage.getItem(EXT_UID_KEY)
  } catch {
    return null
  }
}

/** Fire a single cforj:tokenSpent event to the parent window. */
export function postTokenSpent(amount: number, operation: string): void {
  if (!isEmbedded()) return
  if (!Number.isFinite(amount) || amount <= 0) return
  window.parent.postMessage(
    {
      type: 'cforj:tokenSpent',
      externalId: getExternalId(),
      amount,
      operation,
      at: new Date().toISOString(),
    },
    getParentOrigin(),
  )
}

/** Read tokens_spent / operation from a streaming fetch response headers. */
export function readSpentFromHeaders(headers: Headers): { amount: number; operation: string } | null {
  const raw = headers.get('x-tokens-spent')
  if (!raw) return null
  const amount = parseInt(raw, 10)
  if (!Number.isFinite(amount) || amount <= 0) return null
  const operation = headers.get('x-ai-operation') ?? 'unknown'
  return { amount, operation }
}
