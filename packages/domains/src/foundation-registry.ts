export type FoundationStep = 13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46|47|48|49|50|51|52|53|54|55|56|57|58|59|60|61|62|63|64|65;

export interface FoundationRegistration {
  step: FoundationStep;
  owner: 'core'|'shared'|'domains'|'application'|'delivery'|'gateway'|'security'|'runtime'|'infrastructure'|'integrations'|'quality';
  canonical: boolean;
  dependsOn: FoundationStep[];
}

export const FOUNDATION_REGISTRY: FoundationRegistration[] = [
  { step: 13, owner: 'domains', canonical: true, dependsOn: [] },
  { step: 14, owner: 'infrastructure', canonical: true, dependsOn: [13] },
  { step: 15, owner: 'domains', canonical: true, dependsOn: [13,14] },
  { step: 16, owner: 'domains', canonical: true, dependsOn: [15] },
  { step: 17, owner: 'domains', canonical: true, dependsOn: [16] },
  { step: 18, owner: 'domains', canonical: true, dependsOn: [17] },
  { step: 19, owner: 'domains', canonical: true, dependsOn: [18] },
  { step: 20, owner: 'domains', canonical: true, dependsOn: [19] },
  { step: 21, owner: 'domains', canonical: true, dependsOn: [20] },
  { step: 22, owner: 'domains', canonical: true, dependsOn: [21] },
  { step: 23, owner: 'domains', canonical: true, dependsOn: [22] },
  { step: 24, owner: 'domains', canonical: true, dependsOn: [23] },
  { step: 25, owner: 'domains', canonical: true, dependsOn: [24] },
  { step: 26, owner: 'domains', canonical: true, dependsOn: [25] },
  { step: 27, owner: 'security', canonical: true, dependsOn: [26] },
  { step: 28, owner: 'runtime', canonical: true, dependsOn: [27] },
  { step: 29, owner: 'security', canonical: true, dependsOn: [27] },
  { step: 30, owner: 'integrations', canonical: true, dependsOn: [29] },
  { step: 31, owner: 'infrastructure', canonical: true, dependsOn: [30] },
  { step: 32, owner: 'domains', canonical: true, dependsOn: [31] },
  { step: 33, owner: 'domains', canonical: true, dependsOn: [32] },
  { step: 34, owner: 'domains', canonical: false, dependsOn: [33] },
  { step: 35, owner: 'domains', canonical: true, dependsOn: [33,34] },
  { step: 36, owner: 'domains', canonical: true, dependsOn: [35] },
  { step: 37, owner: 'domains', canonical: true, dependsOn: [36] },
  { step: 38, owner: 'domains', canonical: true, dependsOn: [37] },
  { step: 39, owner: 'domains', canonical: true, dependsOn: [38] },
  { step: 40, owner: 'security', canonical: true, dependsOn: [39] },
  { step: 41, owner: 'domains', canonical: true, dependsOn: [40] },
  { step: 42, owner: 'domains', canonical: true, dependsOn: [41] },
  { step: 43, owner: 'domains', canonical: true, dependsOn: [42] },
  { step: 44, owner: 'domains', canonical: true, dependsOn: [43] },
  { step: 45, owner: 'domains', canonical: true, dependsOn: [44] },
  { step: 46, owner: 'domains', canonical: true, dependsOn: [45] },
  { step: 47, owner: 'domains', canonical: true, dependsOn: [46] },
  { step: 48, owner: 'domains', canonical: true, dependsOn: [47] },
  { step: 49, owner: 'domains', canonical: true, dependsOn: [48] },
  { step: 50, owner: 'domains', canonical: true, dependsOn: [49] },
  { step: 51, owner: 'domains', canonical: true, dependsOn: [50] },
  { step: 52, owner: 'domains', canonical: true, dependsOn: [51] },
  { step: 53, owner: 'domains', canonical: true, dependsOn: [52] },
  { step: 54, owner: 'domains', canonical: true, dependsOn: [53] },
  { step: 55, owner: 'domains', canonical: true, dependsOn: [54] },
  { step: 56, owner: 'domains', canonical: true, dependsOn: [55] },
  { step: 57, owner: 'domains', canonical: true, dependsOn: [56] },
  { step: 58, owner: 'domains', canonical: true, dependsOn: [57] },
  { step: 59, owner: 'domains', canonical: true, dependsOn: [58] },
  { step: 60, owner: 'domains', canonical: true, dependsOn: [59] },
  { step: 61, owner: 'domains', canonical: true, dependsOn: [60] },
  { step: 62, owner: 'domains', canonical: true, dependsOn: [61] },
  { step: 63, owner: 'application', canonical: true, dependsOn: [62] },
  { step: 64, owner: 'application', canonical: true, dependsOn: [63] },
  { step: 65, owner: 'application', canonical: true, dependsOn: [64] }
];

export function validateFoundationRegistry(): true {
  const steps = FOUNDATION_REGISTRY.map(x => x.step);
  if (new Set(steps).size !== steps.length || steps.length !== 53) throw new Error('Invalid foundation registry');
  const step34 = FOUNDATION_REGISTRY.find(x => x.step === 34);
  if (!step34 || step34.canonical || !step34.dependsOn.includes(33)) throw new Error('F-001 regression');
  return true;
}
