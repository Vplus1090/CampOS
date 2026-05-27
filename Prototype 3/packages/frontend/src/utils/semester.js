const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/** Map JIIT stynumber (1–10) to Roman numeral label. */
export function formatStyNumber(sty) {
  const n = Number(sty);
  if (!Number.isFinite(n) || n < 1) return null;
  return ROMAN[n] || `Sem ${n}`;
}

/**
 * Build a human-readable semester label from portal fields.
 */
export function formatSemesterDisplay({ currentSemester, stynumber, label, registrationcode } = {}) {
  const raw = currentSemester != null && currentSemester !== ''
    ? String(currentSemester).trim()
    : '';

  if (raw) {
    if (/^\d+$/.test(raw)) {
      return formatStyNumber(raw) || raw;
    }
    return raw;
  }

  if (label && String(label).trim()) return String(label).trim();

  if (registrationcode && String(registrationcode).trim()) {
    return String(registrationcode).trim();
  }

  if (stynumber != null && stynumber !== '') {
    const roman = formatStyNumber(stynumber);
    return roman || `Semester ${stynumber}`;
  }

  return null;
}

/**
 * Resolve the student's current semester from portal responses (in priority order).
 */
export function resolveCurrentSemesterLabel({ profile, sgpaStynumber, attHeader, activeSem, semlist } = {}) {
  const gi = profile?.generalinformation || profile;

  const fromProfile = formatSemesterDisplay({
    currentSemester:
      gi?.currentsemester ??
      gi?.currentSemester ??
      gi?.semester ??
      gi?.semestername,
  });
  if (fromProfile) return fromProfile;

  const fromSgpa = formatSemesterDisplay({ currentSemester: sgpaStynumber, stynumber: sgpaStynumber });
  if (fromSgpa) return fromSgpa;

  if (attHeader) {
    const fromHeader = formatSemesterDisplay({
      stynumber: attHeader.stynumber,
      label: attHeader.label,
      registrationcode: attHeader.registrationcode,
    });
    if (fromHeader) return fromHeader;
  }

  if (activeSem) {
    const fromActive = formatSemesterDisplay({
      stynumber: activeSem.stynumber,
      label: activeSem.label,
      registrationcode: activeSem.registrationcode,
    });
    if (fromActive) return fromActive;
  }

  if (Array.isArray(semlist) && semlist.length > 0) {
    const latest = [...semlist].sort(
      (a, b) => Number(b.stynumber || 0) - Number(a.stynumber || 0)
    )[0];
    const fromLatest = formatSemesterDisplay({
      stynumber: latest.stynumber,
      label: latest.label,
      registrationcode: latest.registrationcode,
    });
    if (fromLatest) return fromLatest;
  }

  return '—';
}
