/**
 * Eligibility Engine — Core matching algorithm.
 *
 * Each scheme has an eligibility_json field with this structure:
 * {
 *   states: ["ALL"] | ["UP", "MP", ...],
 *   categories: ["OBC", "SC", "ST"] | ["ALL"],
 *   minAge: 18,
 *   maxAge: 40,
 *   genders: ["FEMALE"] | ["ALL"],
 *   occupations: ["FARMER", "LABOURER"] | ["ALL"],
 *   maxIncome: 200000,
 *   minIncome: 0,
 *   minEducation: "TENTH",      // minimum education level
 *   requiresDisability: false,
 *   requiresBPL: false,
 *   requiresBankAccount: true,
 *   requiresLand: false,
 *   maxLandAcres: null,
 *   customCriteria: "Applicant must be a widow"  // free text — shown as-is
 * }
 *
 * Confidence tiers:
 *   DEFINITELY_ELIGIBLE   — all hard criteria met
 *   LIKELY_ELIGIBLE       — most criteria met, 1 ambiguous/unknown field
 *   CHECK_MANUALLY        — offline verification required or too many unknowns
 *   NOT_ELIGIBLE          — at least one hard criterion fails
 */

const EDUCATION_ORDER = ['BELOW_10', 'TENTH', 'TWELFTH', 'GRADUATE', 'POSTGRADUATE', 'DOCTORATE'];

/**
 * Compare education levels.
 * Returns true if userEdu >= requiredEdu.
 */
const meetsEducationRequirement = (userEdu, requiredEdu) => {
  if (!requiredEdu) return true;
  if (!userEdu) return null; // unknown
  return EDUCATION_ORDER.indexOf(userEdu) >= EDUCATION_ORDER.indexOf(requiredEdu);
};

/**
 * Match a single scheme against a user profile.
 *
 * @param {object} scheme   - Scheme record with eligibility_json
 * @param {object} profile  - UserProfile record (or raw quiz answers)
 * @returns {object} Match result with confidence and per-criterion breakdown
 */
export const matchScheme = (scheme, profile) => {
  const criteria = scheme.eligibilityJson || {};
  const breakdown = [];
  let unknownCount = 0;
  let failCount = 0;

  // Helper to add a criterion result
  const addCriterion = (label, result, detail = '') => {
    breakdown.push({ label, result, detail }); // 'PASS' | 'FAIL' | 'UNKNOWN' | 'N/A'
    if (result === 'FAIL') failCount++;
    if (result === 'UNKNOWN') unknownCount++;
  };

  // 1. State check
  if (criteria.states && !criteria.states.includes('ALL')) {
    if (!profile.state) {
      addCriterion('State', 'UNKNOWN', 'State not provided in profile');
    } else if (criteria.states.includes(profile.state)) {
      addCriterion('State', 'PASS', `Available in ${profile.state}`);
    } else {
      addCriterion('State', 'FAIL', `Only available in: ${criteria.states.join(', ')}`);
    }
  } else {
    addCriterion('State', 'N/A', 'Available in all states');
  }

  // 2. Category check
  if (criteria.categories && !criteria.categories.includes('ALL')) {
    if (!profile.category) {
      addCriterion('Category', 'UNKNOWN', 'Category not provided');
    } else if (criteria.categories.includes(profile.category)) {
      addCriterion('Category', 'PASS', `You qualify as ${profile.category}`);
    } else {
      addCriterion('Category', 'FAIL', `Required: ${criteria.categories.join(' / ')}`);
    }
  } else {
    addCriterion('Category', 'N/A', 'Open to all categories');
  }

  // 3. Age check
  if (criteria.minAge || criteria.maxAge) {
    if (profile.age == null) {
      addCriterion('Age', 'UNKNOWN', 'Age not provided');
    } else {
      const minOk = criteria.minAge ? profile.age >= criteria.minAge : true;
      const maxOk = criteria.maxAge ? profile.age <= criteria.maxAge : true;
      const rangeText = [
        criteria.minAge ? `min ${criteria.minAge}` : null,
        criteria.maxAge ? `max ${criteria.maxAge}` : null,
      ].filter(Boolean).join(', ');

      if (minOk && maxOk) {
        addCriterion('Age', 'PASS', `Your age (${profile.age}) meets requirement (${rangeText})`);
      } else {
        addCriterion('Age', 'FAIL', `Age requirement: ${rangeText}; Your age: ${profile.age}`);
      }
    }
  }

  // 4. Gender check
  if (criteria.genders && !criteria.genders.includes('ALL')) {
    if (!profile.gender) {
      addCriterion('Gender', 'UNKNOWN', 'Gender not provided');
    } else if (criteria.genders.includes(profile.gender)) {
      addCriterion('Gender', 'PASS', `Open to ${criteria.genders.join(' / ')}`);
    } else {
      addCriterion('Gender', 'FAIL', `Only for: ${criteria.genders.join(' / ')}`);
    }
  }

  // 5. Occupation check
  if (criteria.occupations && !criteria.occupations.includes('ALL')) {
    if (!profile.occupation) {
      addCriterion('Occupation', 'UNKNOWN', 'Occupation not provided');
    } else if (criteria.occupations.includes(profile.occupation)) {
      addCriterion('Occupation', 'PASS', `Your occupation (${profile.occupation}) qualifies`);
    } else {
      addCriterion('Occupation', 'FAIL', `Required: ${criteria.occupations.join(' / ')}`);
    }
  }

  // 6. Income check
  if (criteria.maxIncome) {
    if (profile.annualIncome == null) {
      addCriterion('Annual Income', 'UNKNOWN', 'Income not provided');
    } else if (profile.annualIncome <= criteria.maxIncome) {
      addCriterion('Annual Income', 'PASS', `Your income ₹${profile.annualIncome.toLocaleString('en-IN')} is within limit`);
    } else {
      addCriterion('Annual Income', 'FAIL', `Max income: ₹${criteria.maxIncome.toLocaleString('en-IN')}; Yours: ₹${profile.annualIncome.toLocaleString('en-IN')}`);
    }
  }

  // 7. Education check
  if (criteria.minEducation) {
    const educationMet = meetsEducationRequirement(profile.education, criteria.minEducation);
    if (educationMet === null) {
      addCriterion('Education', 'UNKNOWN', 'Education level not provided');
    } else if (educationMet) {
      addCriterion('Education', 'PASS', `Minimum education: ${criteria.minEducation}`);
    } else {
      addCriterion('Education', 'FAIL', `Minimum education required: ${criteria.minEducation}`);
    }
  }

  // 8. Disability requirement
  if (criteria.requiresDisability === true) {
    if (profile.isDisabled === true) {
      addCriterion('Disability Status', 'PASS', 'Disability certificate required and you qualify');
    } else if (profile.isDisabled === false) {
      addCriterion('Disability Status', 'FAIL', 'This scheme is only for persons with disabilities');
    } else {
      addCriterion('Disability Status', 'UNKNOWN', 'Disability status not provided');
    }
  }

  // 9. BPL requirement
  if (criteria.requiresBPL === true) {
    if (profile.isBpl === true) {
      addCriterion('BPL Status', 'PASS', 'BPL card required — you qualify');
    } else if (profile.isBpl === false) {
      addCriterion('BPL Status', 'FAIL', 'This scheme is only for BPL families');
    } else {
      addCriterion('BPL Status', 'UNKNOWN', 'BPL status not provided');
    }
  }

  // 10. Bank account requirement
  if (criteria.requiresBankAccount === true) {
    if (profile.hasBankAcct === false) {
      addCriterion('Bank Account', 'FAIL', 'A bank account is required to receive benefits');
    } else {
      addCriterion('Bank Account', 'PASS', 'Bank account required — you qualify');
    }
  }

  // 11. Land requirement
  if (criteria.requiresLand === true) {
    if (!profile.ownsLand) {
      addCriterion('Land Ownership', 'FAIL', 'Land ownership is required for this scheme');
    } else {
      addCriterion('Land Ownership', 'PASS', 'Land ownership required — you qualify');
    }
  }

  // 12. Max land acres (e.g., some schemes exclude large landholders)
  if (criteria.maxLandAcres != null && profile.ownsLand && profile.landAcres != null) {
    if (parseFloat(profile.landAcres) <= criteria.maxLandAcres) {
      addCriterion('Land Holding', 'PASS', `Your land (${profile.landAcres} acres) is within limit`);
    } else {
      addCriterion('Land Holding', 'FAIL', `Max land holding: ${criteria.maxLandAcres} acres`);
    }
  }

  // 13. Custom criteria (always flag as CHECK_MANUALLY)
  if (criteria.customCriteria) {
    addCriterion('Additional Criteria', 'UNKNOWN', criteria.customCriteria);
    unknownCount++;
  }

  // ── Determine overall confidence ─────────────────────────
  let confidence;
  if (failCount > 0) {
    confidence = 'NOT_ELIGIBLE';
  } else if (unknownCount === 0) {
    confidence = 'DEFINITELY_ELIGIBLE';
  } else if (unknownCount === 1) {
    confidence = 'LIKELY_ELIGIBLE';
  } else {
    confidence = 'CHECK_MANUALLY';
  }

  return {
    schemeId: scheme.id,
    confidence,
    breakdown,
    failCount,
    unknownCount,
    passCount: breakdown.filter((c) => c.result === 'PASS').length,
  };
};

/**
 * Match a user profile against a list of schemes.
 * Returns filtered and sorted results.
 *
 * @param {object[]} schemes   - Array of scheme records
 * @param {object}   profile   - User profile
 * @param {object}   options   - { includeNotEligible: false }
 * @returns {object[]} Sorted match results with scheme data
 */
export const matchSchemes = (schemes, profile, options = {}) => {
  const { includeNotEligible = false } = options;

  const CONFIDENCE_ORDER = ['DEFINITELY_ELIGIBLE', 'LIKELY_ELIGIBLE', 'CHECK_MANUALLY', 'NOT_ELIGIBLE'];

  const results = schemes
    .map((scheme) => ({
      scheme,
      ...matchScheme(scheme, profile),
    }))
    .filter((r) => includeNotEligible || r.confidence !== 'NOT_ELIGIBLE')
    .sort((a, b) => {
      const aIdx = CONFIDENCE_ORDER.indexOf(a.confidence);
      const bIdx = CONFIDENCE_ORDER.indexOf(b.confidence);
      if (aIdx !== bIdx) return aIdx - bIdx;
      return b.passCount - a.passCount; // secondary: more passes first
    });

  return results;
};
