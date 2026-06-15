/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Brand, SensoryEvaluation, Batch, UserProfile, OffFlavorItem } from '../types';

export const INITIAL_BRANDS: Brand[] = [
  {
    id: '787e6bc1-d980-43b4-b6fc-9c62a654f5db',
    name: 'Psychopathy',
    type: 'beer',
    created: '2022-12-05',
    brandCode: 'PSYCH',
    hasBaseline: true,
    visual: 'SRM 5.4, Gold in color, clear with no haze',
    aroma: 'Pine, Candied Orange (Limonene), Fruity - Citrus, Floral',
    taste: 'IPA, Bright citrus flavors followed by a smooth finish',
    mouthfeel: 'Resinous, Smooth finish with some lingering bitterness',
    overallDescription: 'Pinene, citrus, floral, classic West Coast IPA at 6.9% ABV.'
  },
  {
    id: '1a275bab-bf2c-4d06-a0af-9628be19b88b',
    name: 'PsycHOPathy *New Recipe*',
    type: 'beer',
    created: '2024-06-03',
    brandCode: 'PSYCH-NEW',
    hasBaseline: true,
    visual: 'SRM 5.4, Gold in color, clear with no haze',
    aroma: 'Candied Orange (Limonene), Fruity - Citrus, Floral, Pine',
    taste: 'IPA, Bright citrus flavors followed by a smooth finish',
    mouthfeel: 'Smooth finish with some lingering bitterness, resinous',
    overallDescription: 'Updated recipe prioritizing bright citrus, soft bitterness, and incredible drinkability.'
  },
  {
    id: '0bb80b85-9ff9-4726-94b2-6202f6e53bca',
    name: 'Boat Show (Yellow Springs)',
    type: 'beer',
    created: '2023-08-17',
    brandCode: 'BOATSHOW',
    hasBaseline: true,
    visual: 'Gold, clear',
    aroma: 'Juicy tropical fruit and citrus hop notes',
    taste: 'Tropical fruit and citrus hop notes shine when paired with the sweetness of the Crystal malts',
    mouthfeel: 'Moderate body IPA, 7% ABV, Moderate IBU',
    overallDescription: 'Juicy tropical fruit and citrus notes blaze through this fresh and hoppy American IPA.'
  },
  {
    id: '6e172c27-cb9c-4c01-8013-ee9832e82dfd',
    name: 'Ziegler',
    type: 'beer',
    created: '2023-07-13',
    brandCode: 'ZIEGLER',
    hasBaseline: true,
    visual: 'Dark amber brown',
    aroma: 'Toasty, Smooth, Rich Malt',
    taste: 'Toasty, Smooth, Rich Malt, Oktoberfest Märzen qualities',
    mouthfeel: 'Smooth, Medium body',
    overallDescription: 'Traditional Märzen style lager featuring a heritage Weyermann malt basis.'
  },
  {
    id: 'ce2b8354-65dc-4dd4-a70e-90955329b96a',
    name: 'Shade',
    type: 'beer',
    created: '2023-02-03',
    brandCode: 'SHADE',
    hasBaseline: true,
    visual: 'Light pink or purple',
    aroma: 'Blackberry fruit nose',
    taste: 'Blackberry and a little salty and tart',
    mouthfeel: 'Tart with a slight dry mouthfeel',
    overallDescription: 'Fruity, refreshing, slightly tart blackberry gose.'
  },
  {
    id: '7e5a46b4-f65a-43b5-8010-a08a8970ae88',
    name: 'Skygazer (Firefly)',
    type: 'beer',
    created: '2022-12-12',
    brandCode: 'SKYGAZER',
    hasBaseline: true,
    visual: 'A little stable haze',
    aroma: 'Wheaty, a little sweet, crisp, citrusy',
    taste: 'Wheaty, citrusy, orange peel and a touch of coriander',
    mouthfeel: 'Light but decent body',
    overallDescription: 'Wheaty witbier, best served unfiltered, with a pleasant citrusy backdrop.'
  },
  {
    id: '5a57bda6-37a4-4f83-ba1a-d8a52cb251ab',
    name: 'Porter There Pal',
    type: 'beer',
    created: '2025-04-14',
    brandCode: 'PORTER-PAL',
    hasBaseline: true,
    visual: 'Very dark black / opaque',
    aroma: 'Sweet vanilla, rich milk chocolate, molasses, toasty coffee',
    taste: 'Roasted chocolate and vanilla with a smooth sweetness',
    mouthfeel: 'Medium full body, low alcohol warmth, medium carbonation',
    overallDescription: 'Brewed to celebrate Jason Drennan\'s promotion. Accessible coffee and vanilla porter.'
  },
  {
    id: '6cb3028c-abd5-4e63-a10a-f971ad97cc95',
    name: 'Entropic Theory',
    type: 'beer',
    created: '2025-07-09',
    brandCode: 'ENTROPIC',
    hasBaseline: true,
    overallDescription: 'A big, hoppy, multi-dimensional West Coast Double IPA.'
  },
  {
    id: '77dd35ce-88aa-4c2f-a30a-d382950a6e7b',
    name: '42 Mile Cider',
    type: 'cider',
    created: '2023-01-17',
    brandCode: '42MILE',
    hasBaseline: true,
    visual: 'Light yellow gold, clear to very slightly hazy',
    aroma: 'Apples, fresh orchard fruit',
    taste: 'Apples, moderate sweetness and acidity',
    mouthfeel: 'Light with good carbonation level',
    overallDescription: 'MadTree\'s signature easy-drinking hard apple cider.'
  },
  {
    id: 'a03e6da0-a661-4acc-b64f-62ab85493e74',
    name: 'Scratch Mule',
    type: 'pro_seltzer',
    created: '2023-01-16',
    brandCode: 'SCRATCHMULE',
    hasBaseline: true,
    visual: 'A pink hue, slightly hazy',
    aroma: 'Lime, honey, cranberry, and ginger',
    taste: 'Lime, honey, cranberry, and building ginger fire',
    mouthfeel: 'Light with good carbonation',
    overallDescription: 'A Moscow Mule seltzer twist featuring spicy ginger, lime, and local honey.'
  },
  {
    id: '6e6386bc-3934-4de2-b67a-e91412c2540b',
    name: 'Cincitucky',
    type: 'beer',
    created: '2025-02-28',
    brandCode: 'CINCITUCKY',
    hasBaseline: false,
    overallDescription: 'American Lager with toasty corn grits and clean lager yeasts.'
  },
  {
    id: '865fc717-2e79-400f-a10e-5ddb2e9c2da7',
    name: 'Raspberry Lemon Sway',
    type: 'pro_seltzer',
    created: '2022-12-05',
    brandCode: 'RL-SWAY',
    hasBaseline: true,
    overallDescription: 'Fruity pro seltzer with fresh raspberry juice extract and Meyer lemon.'
  },
  {
    id: '08c2dce7-01cf-46cb-bde4-1e816b67a785',
    name: 'Orange & Blue FCC Sway',
    type: 'pro_seltzer',
    created: '2025-01-30',
    brandCode: 'FCC-SWAY',
    hasBaseline: true,
    overallDescription: 'Specialty seltzer payload honoring FC Cincinnati, with orange and blueberry blends.'
  },
  {
    id: 'happy-amber',
    name: 'Happy Amber',
    type: 'beer',
    created: '2013-03-12',
    brandCode: 'AMBER',
    hasBaseline: true,
    visual: 'SRM 13.5, Deep amber-bronze copper-red hue, clean clarity with a thick creamy off-white head and high lacing',
    aroma: 'Biscuit, toasted bready malts, rich caramel and toffee, with light herbal and floral earthy hops',
    taste: 'Balanced rich caramel sweetness, nutty malt backbone, followed by a soft toasted finish with mild hop bitterness',
    mouthfeel: 'Medium-full body, creamy velvety body, soft carbonation, ending in a clean semi-dry finish',
    overallDescription: 'MadTree\'s award-winning flagship American Amber Ale. Features a perfect balance of toasted caramel sweetness and clean, pleasant hops.'
  }
];

export const INITIAL_USERS: UserProfile[] = [
  {
    email: 'chandler.cottrell@madtree.com',
    name: 'Chandler Cottrell',
    avatarInitials: 'CC',
    role: 'admin',
    panelistScorecard: { panelsCount: 145, testsCompletedCount: 540, attendanceRate: 0.85 }
  },
  {
    email: 'daniel.rebbe@madtreebrewing.com',
    name: 'Dan Rebbe',
    avatarInitials: 'DR',
    role: 'panelist',
    panelistScorecard: { panelsCount: 98, testsCompletedCount: 380, attendanceRate: 0.56 }
  },
  {
    email: 'ryan.blevins@madtreebrewing.com',
    name: 'Ryan Blevins',
    avatarInitials: 'RB',
    role: 'admin',
    panelistScorecard: { panelsCount: 90, testsCompletedCount: 342, attendanceRate: 0.51 }
  },
  {
    email: 'joel.davidson@madtreebrewing.com',
    name: 'Joel Davidson',
    avatarInitials: 'JD',
    role: 'panelist',
    panelistScorecard: { panelsCount: 82, testsCompletedCount: 310, attendanceRate: 0.48 }
  },
  {
    email: 'ryan.fardo@madtreebrewing.com',
    name: 'Ryan Fardo',
    avatarInitials: 'RF',
    role: 'panelist',
    panelistScorecard: { panelsCount: 151, testsCompletedCount: 560, attendanceRate: 0.86 }
  },
  {
    email: 'brittany.frey@madtreebrewing.com',
    name: 'Brittany Frey',
    avatarInitials: 'BF',
    role: 'panelist',
    panelistScorecard: { panelsCount: 96, testsCompletedCount: 410, attendanceRate: 0.55 }
  },
  {
    email: 'taylor.dreves@madtreebrewing.com',
    name: 'Taylor Dreves',
    avatarInitials: 'TD',
    role: 'panelist',
    panelistScorecard: { panelsCount: 115, testsCompletedCount: 450, attendanceRate: 0.66 }
  },
  {
    email: 'connor.wanamaker@madtree.com',
    name: 'Connor Wanamaker',
    avatarInitials: 'CW',
    role: 'panelist',
    panelistScorecard: { panelsCount: 52, testsCompletedCount: 180, attendanceRate: 0.30 }
  },
  {
    email: 'Mike.Bacon@madtree.com',
    name: 'Mike Bacon',
    avatarInitials: 'MB',
    role: 'panelist',
    panelistScorecard: { panelsCount: 21, testsCompletedCount: 95, attendanceRate: 0.12 }
  },
  {
    email: 'brendan.reilly@madtree.com',
    name: 'Brendan Reilly',
    avatarInitials: 'BR',
    role: 'panelist',
    panelistScorecard: { panelsCount: 60, testsCompletedCount: 190, attendanceRate: 0.34 }
  }
];

export const INITIAL_OFF_FLAVORS: OffFlavorItem[] = [
  {
    id: 'off-diacetyl',
    name: 'Diacetyl (Buttery)',
    sensoryDescription: 'Butter, movie theater popcorn, slick mouthfeel on the tongue.',
    commonCauses: 'Premature yeast separation (early crash), oxygen ingress during dry hopping, or bacterial contamination (Pediococcus).',
    prevention: 'Ensure complete VDK (Diacetyl) rest at slightly higher temperatures before cooling, and respect strict sanitary rules.'
  },
  {
    id: 'off-dms',
    name: 'DMS (Dimethyl Sulfide)',
    sensoryDescription: 'Cooked corn, yellow corn-on-the-cob, canned vegetables, cabbage.',
    commonCauses: 'Weak or short boil (DMS precursor SMM is not evaporated), slow cooling of the hot wort (allowing SMM to reform into DMS).',
    prevention: 'Active, robust rolling boil for at least 60-90 minutes and immediate wort cooling.'
  },
  {
    id: 'off-acetaldehyde',
    name: 'Acetaldehyde (Green Apple)',
    sensoryDescription: 'Green cut apple, latex paint, fresh cut grass, bready but raw.',
    commonCauses: 'Young "green" beer; yeast didn\'t finish taking back intermediate compounds. Can also represent oxidation of finished ethanol.',
    prevention: 'Provide adequate yeast conditioning time; avoid premature package packaging and oxygen infiltration.'
  },
  {
    id: 'off-oxidation',
    name: 'Oxidation (Cardboard / Papery)',
    sensoryDescription: 'Wet cardboard, stale paper, dull sweet sherry, leathery notes. Muted hop expression.',
    commonCauses: 'Excessive oxygen pickup during cellar transfers, centrifugation, or hot-side aeration. High storage temperatures hasten effect.',
    prevention: 'Purge all transfer paths with CO2, maintain total packaged oxygen (TPO) limits below 50 ppb, and store cans cold.'
  },
  {
    id: 'off-isovaleric',
    name: 'Isovaleric Acid (Cheesy)',
    sensoryDescription: 'Sweaty gym socks, old cheese, rank body odor, stale hops.',
    commonCauses: 'Usage of degraded or improperly stored hops; moldy hops or bacterial contamination in dry-hopping.',
    prevention: 'Verify hop box seals and strict cold storage of all hop packets.'
  },
  {
    id: 'off-h2s',
    name: 'H2S (Hydrogen Sulfide)',
    sensoryDescription: 'Rotten eggs, struck match, sulfur spring.',
    commonCauses: 'Yeast stress (nitrogen deficiency/lack of nutrients) or premature separation from active yeast cake.',
    prevention: 'Add yeast nutrients (e.g. Servomyces) to wort boil, choose healthy pitch rates, and allow gases to strip during fermentation.'
  }
];

export const INITIAL_EVALUATIONS: SensoryEvaluation[] = [
  // Porter There Pal - Batch 20250415
  {
    id: 'eval-ptp-1',
    testId: 'test-ptp-0415',
    panelName: '4/15 Daily Sensory Release',
    brandId: '5a57bda6-37a4-4f83-ba1a-d8a52cb251ab',
    brandName: 'Porter There Pal',
    batchCode: '20250415',
    flavorMap: 'beer',
    userEmail: 'chandler.cottrell@madtree.com',
    userName: 'Chandler Cottrell',
    date: '2025-04-15',
    tttRating: 'yes',
    hedonicValue: 8,
    hedonicComments: 'Clean aroma with subtle vanilla. More vanilla in the taste and bigger than expected mouthfeel. Drinks balanced and approachable.',
    visualScores: { foamQuantity: 3, color: 'Black', foamColor: 'Brown', particulateSize: 'None', haze: 'Low', lacing: 3 },
    aromaScores: { sweetAromatic: ['Vanilla', 'Chocolate'], burnt: ['Coffee'] },
    tasteScores: { sweet: 3, salty: 0, bitter: 2, sour: 0, sweetLinger: 2, bitterLinger: 1 },
    mouthfeelScores: { carbonation: 3, body: 3, mouthwatering: 1, alcohol: 1, spicy: 0, astringency: 0 },
    offFlavors: [
      { name: 'Diacetyl (Buttery)', detected: false, severity: 0 },
      { name: 'DMS (Dimethyl Sulfide)', detected: false, severity: 0 },
      { name: 'Oxidation (Papery)', detected: false, severity: 0 }
    ]
  },
  {
    id: 'eval-ptp-2',
    testId: 'test-ptp-0415',
    panelName: '4/15 Daily Sensory Release',
    brandId: '5a57bda6-37a4-4f83-ba1a-d8a52cb251ab',
    brandName: 'Porter There Pal',
    batchCode: '20250415',
    flavorMap: 'beer',
    userEmail: 'daniel.rebbe@madtreebrewing.com',
    userName: 'Dan Rebbe',
    date: '2025-04-15',
    tttRating: 'yes',
    hedonicValue: 8,
    hedonicComments: 'Subtle vanilla flavor leads to a soft finish that ends with some roast/bitterness. Notes of chocolate covered nuts. Not too heavy bodied. Pretty drinkable.',
    visualScores: { foamQuantity: 3, color: 'Black', foamColor: 'Brown', particulateSize: 'None', haze: 'Low', lacing: 3 },
    aromaScores: { sweetAromatic: ['Vanilla', 'Chocolate', 'Caramel'], burnt: ['Coffee'], nutty: ['Hazelnut'] },
    offFlavors: []
  },
  {
    id: 'eval-ptp-3',
    testId: 'test-ptp-0415',
    panelName: '4/15 Daily Sensory Release',
    brandId: '5a57bda6-37a4-4f83-ba1a-d8a52cb251ab',
    brandName: 'Porter There Pal',
    batchCode: '20250415',
    flavorMap: 'beer',
    userEmail: 'ryan.fardo@madtreebrewing.com',
    userName: 'RYAN FARDO',
    date: '2025-04-15',
    tttRating: 'yes',
    hedonicValue: 7,
    hedonicComments: 'Mouthfeel is slightly lighter than expected and malt bitterness is up there - like a marshmallow that is a little too roasted.',
    aromaScores: { sweetAromatic: ['Vanilla', 'Molasses'], burnt: ['Coffee'] },
    offFlavors: []
  },
  {
    id: 'eval-ptp-4',
    testId: 'test-ptp-0415',
    panelName: '4/15 Daily Sensory Release',
    brandId: '5a57bda6-37a4-4f83-ba1a-d8a52cb251ab',
    brandName: 'Porter There Pal',
    batchCode: '20250415',
    flavorMap: 'beer',
    userEmail: 'ryan.blevins@madtreebrewing.com',
    userName: 'Ryan Blevins',
    date: '2025-04-15',
    tttRating: 'yes',
    hedonicValue: 7,
    hedonicComments: 'Growler seemed low on carbonation which was messing with the mouthfeel for me. Tons of chocolate, vanilla, and light coffee roast.',
    offFlavors: []
  },

  // Boat Show - Batch 20250711
  {
    id: 'eval-bs-1',
    testId: 'test-bs-0711',
    panelName: '7/11 Daily Sensory Release',
    brandId: '0bb80b85-9ff9-4726-94b2-6202f6e53bca',
    brandName: 'Boat Show (Yellow Springs)',
    batchCode: '20250711',
    flavorMap: 'beer',
    userEmail: 'daniel.rebbe@madtreebrewing.com',
    userName: 'Dan Rebbe',
    date: '2025-07-11',
    tttRating: 'yes',
    hedonicValue: 7,
    hedonicComments: 'Nice juicy tropical notes. On scale for true to target.',
    offFlavors: []
  },
  {
    id: 'eval-bs-2',
    testId: 'test-bs-0711',
    panelName: '7/11 Daily Sensory Release',
    brandId: '0bb80b85-9ff9-4726-94b2-6202f6e53bca',
    brandName: 'Boat Show (Yellow Springs)',
    batchCode: '20250711',
    flavorMap: 'beer',
    userEmail: 'chandler.cottrell@madtree.com',
    userName: 'Chandler Cottrell',
    date: '2025-07-11',
    tttRating: 'yes',
    hedonicValue: 8,
    hedonicComments: 'Really excellent batch. Highly juicy, clean pine and mango back-notes.',
    offFlavors: []
  },

  // Boat Show - Batch 20240724 (Historical Defect Demo)
  {
    id: 'eval-bs-defect-1',
    testId: 'test-bs-0904',
    panelName: '9/4 Daily Sensory Release',
    brandId: '0bb80b85-9ff9-4726-94b2-6202f6e53bca',
    brandName: 'Boat Show (Yellow Springs)',
    batchCode: '20240904',
    flavorMap: 'beer',
    userEmail: 'daniel.rebbe@madtreebrewing.com',
    userName: 'Dan Rebbe',
    date: '2024-09-04',
    tttRating: 'no',
    hedonicValue: 5,
    hedonicComments: 'Still relatively true to brand, but finishes sweeter and not as crisp. Hops seem a bit subdued into buttery sweet popcorn notes.',
    offFlavors: [
      { name: 'Diacetyl (Buttery)', detected: true, severity: 2, notes: 'popcorn-slick mouthfeel' }
    ]
  },
  {
    id: 'eval-bs-defect-2',
    testId: 'test-bs-0904',
    panelName: '9/4 Daily Sensory Release',
    brandId: '0bb80b85-9ff9-4726-94b2-6202f6e53bca',
    brandName: 'Boat Show (Yellow Springs)',
    batchCode: '20240904',
    flavorMap: 'beer',
    userEmail: 'ryan.blevins@madtreebrewing.com',
    userName: 'Ryan Blevins',
    date: '2024-09-04',
    tttRating: 'yes',
    hedonicValue: 7,
    hedonicComments: 'Overall pretty good. Sweetness is throwing off the balance that I like so much in this beer.',
    offFlavors: [
      { name: 'Diacetyl (Buttery)', detected: true, severity: 1 }
    ]
  },

  // Skygazer (Firefly) - 10/18 Daily Sensory Release (Defect out of control limits!)
  {
    id: 'eval-sg-defect-3',
    testId: 'test-sg-1018',
    panelName: '10/18 Daily Sensory Release',
    brandId: '7e5a46b4-f65a-43b5-8010-a08a8970ae88',
    brandName: 'Skygazer (Firefly)',
    batchCode: '20240816',
    flavorMap: 'beer',
    userEmail: 'daniel.deitsch@madtree.com',
    userName: 'Daniel Deitsch',
    date: '2024-10-18',
    tttRating: 'no',
    hedonicValue: 4,
    hedonicComments: 'I don\'t think this one is on point. Missing high citrus notes, heavy bread.',
    offFlavors: [
      { name: 'Acetaldehyde (Green Apple)', detected: true, severity: 2 }
    ]
  },
  {
    id: 'eval-sg-defect-4',
    testId: 'test-sg-1018',
    panelName: '10/18 Daily Sensory Release',
    brandId: '7e5a46b4-f65a-43b5-8010-a08a8970ae88',
    brandName: 'Skygazer (Firefly)',
    batchCode: '20240816',
    flavorMap: 'beer',
    userEmail: 'brittany.frey@madtreebrewing.com',
    userName: 'Brittany Frey',
    date: '2024-10-18',
    tttRating: 'no',
    hedonicValue: 3,
    hedonicComments: 'Sweet, astringent, cleaning pine sol character.',
    offFlavors: [
      { name: 'Acetaldehyde (Green Apple)', detected: true, severity: 3, notes: 'Intense chemical paint thinner aroma' }
    ]
  },

  // Psychopathy *New Recipe* Batch 20250109
  {
    id: 'eval-pyn-1',
    testId: 'test-pyn-0109',
    panelName: '1/15 Daily Sensory Release',
    brandId: '1a275bab-bf2c-4d06-a0af-9628be19b88b',
    brandName: 'PsycHOPathy *New Recipe*',
    batchCode: '20250109',
    flavorMap: 'beer',
    userEmail: 'ryan.blevins@madtreebrewing.com',
    userName: 'Ryan Blevins',
    date: '2025-01-15',
    tttRating: 'yes',
    hedonicValue: 7,
    hedonicComments: 'Bitterness is elevated but not outside of brand standards for me.',
    offFlavors: []
  },
  {
    id: 'eval-pyn-2',
    testId: 'test-pyn-0109',
    panelName: '1/15 Daily Sensory Release',
    brandId: '1a275bab-bf2c-4d06-a0af-9628be19b88b',
    brandName: 'PsycHOPathy *New Recipe*',
    batchCode: '20250109',
    flavorMap: 'beer',
    userEmail: 'chandler.cottrell@madtree.com',
    userName: 'Chandler Cottrell',
    date: '2025-01-15',
    tttRating: 'yes',
    hedonicValue: 7,
    hedonicComments: 'Mild orange peel aroma. Clean, crispy finish.',
    offFlavors: []
  },
  {
    id: 'eval-pyn-3',
    testId: 'test-pyn-0109',
    panelName: '1/15 Daily Sensory Release',
    brandId: '1a275bab-bf2c-4d06-a0af-9628be19b88b',
    brandName: 'PsycHOPathy *New Recipe*',
    batchCode: '20250109',
    flavorMap: 'beer',
    userEmail: 'taylor.dreves@madtreebrewing.com',
    userName: 'Taylor Dreves',
    date: '2025-01-15',
    tttRating: 'yes',
    hedonicValue: 7,
    hedonicComments: 'Citrusy but more pine and bitterness than I prefer but still good and on brand.',
    offFlavors: []
  },
  // Happy Amber - Batch AM-250811
  {
    id: 'eval-ha-1a',
    testId: 'test-ha-0811',
    panelName: '8/11 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-250811',
    flavorMap: 'beer',
    userEmail: 'chandler.cottrell@madtree.com',
    userName: 'Chandler Cottrell',
    date: '2025-08-11',
    tttRating: 'yes',
    hedonicValue: 8,
    hedonicComments: 'Classic Happy Amber. High toasted caramel and bread malt sweetness. Beautiful Off-white foam lacing.',
    offFlavors: []
  },
  {
    id: 'eval-ha-1b',
    testId: 'test-ha-0811',
    panelName: '8/11 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-250811',
    flavorMap: 'beer',
    userEmail: 'daniel.rebbe@madtreebrewing.com',
    userName: 'Dan Rebbe',
    date: '2025-08-11',
    tttRating: 'yes',
    hedonicValue: 8,
    hedonicComments: 'On-spec. Beautiful caramel and biscuit malts, mild floral aroma. Mouthfeel is velvety.',
    offFlavors: []
  },
  {
    id: 'eval-ha-1c',
    testId: 'test-ha-0811',
    panelName: '8/11 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-250811',
    flavorMap: 'beer',
    userEmail: 'ryan.fardo@madtreebrewing.com',
    userName: 'Ryan Fardo',
    date: '2025-08-11',
    tttRating: 'yes',
    hedonicValue: 7,
    hedonicComments: 'Clean toasted malt presence, nice dry finish. No faults detected.',
    offFlavors: []
  },
  {
    id: 'eval-ha-1d',
    testId: 'test-ha-0811',
    panelName: '8/11 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-250811',
    flavorMap: 'beer',
    userEmail: 'brittany.frey@madtreebrewing.com',
    userName: 'Brittany Frey',
    date: '2025-08-11',
    tttRating: 'yes',
    hedonicValue: 8,
    hedonicComments: 'Toasty, sweet caramelly notes are perfectly in line. Delicious.',
    offFlavors: []
  },
  // Happy Amber - Batch AM-251105 (Butter/Diacetyl Incident)
  {
    id: 'eval-ha-2a',
    testId: 'test-ha-1105',
    panelName: '11/5 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-251105',
    flavorMap: 'beer',
    userEmail: 'daniel.rebbe@madtreebrewing.com',
    userName: 'Dan Rebbe',
    date: '2025-11-05',
    tttRating: 'no',
    hedonicValue: 5,
    hedonicComments: 'Buttery. Strong butterscotch note dominates and masks the delicate biscuit malt notes. Slick mouthfeel.',
    offFlavors: [{ name: 'Diacetyl (Buttery)', detected: true, severity: 2 }]
  },
  {
    id: 'eval-ha-2b',
    testId: 'test-ha-1105',
    panelName: '11/5 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-251105',
    flavorMap: 'beer',
    userEmail: 'chandler.cottrell@madtree.com',
    userName: 'Chandler Cottrell',
    date: '2025-11-05',
    tttRating: 'no',
    hedonicValue: 6,
    hedonicComments: 'Sweet caramel is masking it slightly, but definitely picking up movie theater popcorn slickness on back of palate. Under-conditioned rest?',
    offFlavors: [{ name: 'Diacetyl (Buttery)', detected: true, severity: 2 }]
  },
  {
    id: 'eval-ha-2c',
    testId: 'test-ha-1105',
    panelName: '11/5 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-251105',
    flavorMap: 'beer',
    userEmail: 'ryan.blevins@madtreebrewing.com',
    userName: 'Ryan Blevins',
    date: '2025-11-05',
    tttRating: 'no',
    hedonicValue: 5,
    hedonicComments: 'Too buttery. Mouthfeel slickness is definitely out of spec.',
    offFlavors: [{ name: 'Diacetyl (Buttery)', detected: true, severity: 2 }]
  },
  {
    id: 'eval-ha-2d',
    testId: 'test-ha-1105',
    panelName: '11/5 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-251105',
    flavorMap: 'beer',
    userEmail: 'joel.davidson@madtreebrewing.com',
    userName: 'Joel Davidson',
    date: '2025-11-05',
    tttRating: 'yes',
    hedonicValue: 7,
    hedonicComments: 'Caramel malts are quite heavy, sweet finish. I find it robust and acceptable.',
    offFlavors: []
  },
  // Happy Amber - Batch AM-260212 (Excellent Winter Batch)
  {
    id: 'eval-ha-3a',
    testId: 'test-ha-0212',
    panelName: '2/12 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-260212',
    flavorMap: 'beer',
    userEmail: 'ryan.fardo@madtreebrewing.com',
    userName: 'Ryan Fardo',
    date: '2026-02-12',
    tttRating: 'yes',
    hedonicValue: 8,
    hedonicComments: 'Outstanding balance. Really clean biscuit/nutty malt complexity. Nice earthy hop aroma.',
    offFlavors: []
  },
  {
    id: 'eval-ha-3b',
    testId: 'test-ha-0212',
    panelName: '2/12 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-260212',
    flavorMap: 'beer',
    userEmail: 'chandler.cottrell@madtree.com',
    userName: 'Chandler Cottrell',
    date: '2026-02-12',
    tttRating: 'yes',
    hedonicValue: 8,
    hedonicComments: 'Bright, crisp, and beautifully malty. Perfect carbonation level.',
    offFlavors: []
  },
  {
    id: 'eval-ha-3c',
    testId: 'test-ha-0212',
    panelName: '2/12 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-260212',
    flavorMap: 'beer',
    userEmail: 'brittany.frey@madtreebrewing.com',
    userName: 'Brittany Frey',
    date: '2026-02-12',
    tttRating: 'yes',
    hedonicValue: 8,
    hedonicComments: 'On target. Deep bronze clarity, off-white lacing. Tastes very bready and balanced.',
    offFlavors: []
  },
  {
    id: 'eval-ha-3d',
    testId: 'test-ha-0212',
    panelName: '2/12 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-260212',
    flavorMap: 'beer',
    userEmail: 'daniel.rebbe@madtreebrewing.com',
    userName: 'Dan Rebbe',
    date: '2026-02-12',
    tttRating: 'yes',
    hedonicValue: 8,
    hedonicComments: 'Excellent winter run. Very clean, solid malt structure.',
    offFlavors: []
  },
  // Happy Amber - Batch AM-260520 (Recent Prime Run)
  {
    id: 'eval-ha-4a',
    testId: 'test-ha-0520',
    panelName: '5/20 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-260520',
    flavorMap: 'beer',
    userEmail: 'chandler.cottrell@madtree.com',
    userName: 'Chandler Cottrell',
    date: '2026-05-20',
    tttRating: 'yes',
    hedonicValue: 9,
    hedonicComments: 'An absolute benchmark run. Incredible honey/caramel toasted malt profile. Extremely clean.',
    offFlavors: []
  },
  {
    id: 'eval-ha-4b',
    testId: 'test-ha-0520',
    panelName: '5/20 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-260520',
    flavorMap: 'beer',
    userEmail: 'daniel.rebbe@madtreebrewing.com',
    userName: 'Dan Rebbe',
    date: '2026-05-20',
    tttRating: 'yes',
    hedonicValue: 8,
    hedonicComments: 'Very high drinkability. Rich toast, light dark fruit and nutty malt skin.',
    offFlavors: []
  },
  {
    id: 'eval-ha-4c',
    testId: 'test-ha-0520',
    panelName: '5/20 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-260520',
    flavorMap: 'beer',
    userEmail: 'ryan.fardo@madtreebrewing.com',
    userName: 'Ryan Fardo',
    date: '2026-05-20',
    tttRating: 'yes',
    hedonicValue: 8,
    hedonicComments: 'Perfect lacing. Sweet toffee notes are nicely balanced by earthy hop bitterness.',
    offFlavors: []
  },
  {
    id: 'eval-ha-4d',
    testId: 'test-ha-0520',
    panelName: '5/20 Daily Sensory Release',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-260520',
    flavorMap: 'beer',
    userEmail: 'taylor.dreves@madtreebrewing.com',
    userName: 'Taylor Dreves',
    date: '2026-05-20',
    tttRating: 'yes',
    hedonicValue: 8,
    hedonicComments: 'Highly satisfying and clean amber clone. Benchmark.',
    offFlavors: []
  }
];

export const INITIAL_BATCHES: Batch[] = [
  {
    id: 'batch-ptp-1',
    brandId: '5a57bda6-37a4-4f83-ba1a-d8a52cb251ab',
    brandName: 'Porter There Pal',
    batchCode: '20250415',
    date: '2025-04-15',
    tastersCount: 9,
    percentDefect: 0,
    tags: []
  },
  {
    id: 'batch-bs-1',
    brandId: '0bb80b85-9ff9-4726-94b2-6202f6e53bca',
    brandName: 'Boat Show (Yellow Springs)',
    batchCode: '20250711',
    date: '2025-07-11',
    tastersCount: 4,
    percentDefect: 0,
    tags: ['can']
  },
  {
    id: 'batch-bs-2',
    brandId: '0bb80b85-9ff9-4726-94b2-6202f6e53bca',
    brandName: 'Boat Show (Yellow Springs)',
    batchCode: '20240904',
    date: '2024-09-04',
    tastersCount: 6,
    percentDefect: 17,
    tags: []
  },
  {
    id: 'batch-sg-1',
    brandId: '7e5a46b4-f65a-43b5-8010-a08a8970ae88',
    brandName: 'Skygazer (Firefly)',
    batchCode: '20240816',
    date: '2024-10-18',
    tastersCount: 8,
    percentDefect: 38,
    tags: []
  },
  {
    id: 'batch-pyn-1',
    brandId: '1a275bab-bf2c-4d06-a0af-9628be19b88b',
    brandName: 'PsycHOPathy *New Recipe*',
    batchCode: '20250109',
    date: '2025-01-15',
    tastersCount: 11,
    percentDefect: 9,
    tags: ['19.2']
  },
  {
    id: 'batch-amber-1',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-250811',
    date: '2025-08-11',
    tastersCount: 4,
    percentDefect: 0,
    tags: ['pak']
  },
  {
    id: 'batch-amber-2',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-251105',
    date: '2025-11-05',
    tastersCount: 4,
    percentDefect: 75,
    tags: ['warning']
  },
  {
    id: 'batch-amber-3',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-260212',
    date: '2026-02-12',
    tastersCount: 4,
    percentDefect: 0,
    tags: []
  },
  {
    id: 'batch-amber-4',
    brandId: 'happy-amber',
    brandName: 'Happy Amber',
    batchCode: 'AM-260520',
    date: '2026-05-20',
    tastersCount: 4,
    percentDefect: 0,
    tags: ['fresh']
  }
];
