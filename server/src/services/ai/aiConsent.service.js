import User from "../../models/User.js";
import AIUserMemory from "../../models/AIUserMemory.js";

/**
 * aiConsent.service.js
 *
 * Single gate for whether MONE AI is allowed to build a personalization
 * profile for a user — covers both facts the user explicitly asks to be
 * remembered (remember_preference) and facts inferred from behavior
 * (aiInference.service.js). Every writer to AIUserMemory must check
 * hasPersonalizationConsent() before writing; nothing bypasses this.
 *
 * Consent is captured at signup (registerUser, opt-in, default false)
 * and changeable anytime via PATCH /api/v1/ai/personalization/consent.
 * Bump CONSENT_VERSION if what gets inferred changes materially enough
 * that existing consent shouldn't be assumed to cover it — callers can
 * then compare a user's stored consentVersion against this constant to
 * decide whether to re-prompt.
 */
export const CONSENT_VERSION = "1.0";

/**
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
export async function hasPersonalizationConsent(userId) {
  const user = await User.findById(userId).select("aiPersonalization").lean();
  const p = user?.aiPersonalization;
  if (!p?.consent) return false;
  // BUGFIX: consentVersion was stored at grant time but never compared
  // against CONSENT_VERSION anywhere — bumping the constant (the doc
  // comment's stated purpose: "what gets inferred changes materially")
  // silently did nothing. A user who consented under an older version
  // must re-consent before new-version behavior (e.g. a new inference
  // signal) applies to them.
  return p.consentVersion === CONSENT_VERSION;
}

/**
 * @param {string} userId
 * @returns {Promise<{consent: boolean, consentedAt: Date|null, consentVersion: string|null}>}
 */
export async function getPersonalizationConsent(userId) {
  const user = await User.findById(userId).select("aiPersonalization").lean();
  const p = user?.aiPersonalization || { consent: false, consentedAt: null, consentVersion: null };
  // needsReconsent lets the Settings screen show "please re-confirm"
  // instead of the user just silently losing personalization with no
  // explanation the next time hasPersonalizationConsent() starts
  // returning false for them post-bump.
  return { ...p, needsReconsent: Boolean(p.consent) && p.consentVersion !== CONSENT_VERSION };
}

/**
 * @param {string} userId
 * @param {boolean} granted
 * @returns {Promise<{consent: boolean, consentedAt: Date|null, consentVersion: string|null}>}
 */
export async function setPersonalizationConsent(userId, granted) {
  const update = granted
    ? {
        "aiPersonalization.consent": true,
        "aiPersonalization.consentedAt": new Date(),
        "aiPersonalization.consentVersion": CONSENT_VERSION,
      }
    : {
        "aiPersonalization.consent": false,
        // consentedAt/consentVersion left as-is on revoke — that's the
        // record of when they last opted in, useful for an audit trail.
      };

  const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true })
    .select("aiPersonalization")
    .lean();

  if (!granted) {
    // Revoking consent stops future inference immediately (the gate
    // above) and also removes the profile already built without the
    // user having stated it themselves — inferred facts only exist
    // because of this consent, so they shouldn't outlive it. Facts the
    // user explicitly asked to be remembered (source: "user_stated")
    // are left in place; those are the user's own statements, and they
    // can delete individual ones from Settings regardless of consent.
    await AIUserMemory.deleteMany({ user: userId, source: "inferred" });
  }

  return user.aiPersonalization;
}

export default { hasPersonalizationConsent, getPersonalizationConsent, setPersonalizationConsent, CONSENT_VERSION };
