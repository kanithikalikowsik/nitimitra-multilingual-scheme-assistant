import type { SchemeRecord } from '../types'

/**
 * Demonstration content for UI review only. No government scheme facts,
 * eligibility rules, application steps, or official sources are asserted.
 */
export const schemes: SchemeRecord[] = [
  {
    id: 'demo-community-learning-support',
    name: { en: 'Community Learning Support', te: 'సమాజ అభ్యాస సహాయం' },
    categoryId: 'education-scholarships',
    shortDescription: {
      en: 'Illustrative sample record for previewing scheme browsing and details. This is not a government scheme.',
      te: 'పథకాల జాబితా, వివరాల రూపాన్ని చూపే నమూనా మాత్రమే. ఇది ప్రభుత్వ పథకం కాదు.',
    },
    overview: {
      en: 'This record demonstrates how NitiMitra can organize public information. It contains no verified scheme information.',
      te: 'ప్రజా సమాచారాన్ని నీతిమిత్ర ఎలా క్రమబద్ధీకరిస్తుందో చూపే నమూనా ఇది. ఇందులో ధృవీకరించిన పథక సమాచారం లేదు.',
    },
    benefitsSummary: {
      en: 'No benefits have been verified. The sample text below is for interface demonstration only.',
      te: 'ప్రయోజనాలు ఏవీ ధృవీకరించబడలేదు. కింది నమూనా వాక్యం రూపకల్పన కోసం మాత్రమే.',
    },
    benefits: [{
      en: 'Illustrative placeholder only. No government benefit is claimed.',
      te: 'నమూనా వాక్యం మాత్రమే. ప్రభుత్వ ప్రయోజనం ఏదీ పేర్కొనడం లేదు.',
    }],
    eligibilityConditions: [{ id: 0, ruleType: 'unverified', criteria: null,
      en: 'Not available. No official eligibility conditions have been verified.',
      te: 'అందుబాటులో లేదు. అధికారిక అర్హత నిబంధనలు ధృవీకరించబడలేదు.',
    }],
    requiredDocuments: [{
      en: 'Not available. No official document list has been verified.',
      te: 'అందుబాటులో లేదు. అధికారిక పత్రాల జాబితా ధృవీకరించబడలేదు.',
    }],
    applicationSteps: [{
      en: 'Not available. No official application instructions have been verified.',
      te: 'అందుబాటులో లేదు. అధికారిక దరఖాస్తు సూచనలు ధృవీకరించబడలేదు.',
    }],
    keywords: [{ en: 'demo sample education learning', te: 'నమూనా విద్య అభ్యాసం' }],
    source: { authority: null, url: null, verificationStatus: 'pending', lastVerified: null },
    isDemo: true,
  },
]
