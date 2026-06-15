/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FlavorWheelNode {
  name: string;
  terms?: string;
  chem?: string;
  sources?: string;
  children?: FlavorWheelNode[];
}

export const FLAVOR_WHEEL_DATA: FlavorWheelNode = {
  name: "Beer",
  children: [
    {
      name: "Basic Taste",
      children: [
        {
          name: "Sour",
          children: [
            { name: "Acetic", terms: "Vinegar, sharp, solvent-like", chem: "Acetic acid", sources: "Produced by yeast or acetic acid bacteria" },
            { name: "Acidic", terms: "Sharp, tangy, mouthwatering", chem: "Organic acids", sources: "Inherent to styles or bacterial infection" },
            { name: "Citric", terms: "Lemon juice-like, citric tartness", chem: "Citric acid", sources: "Yeast fermentation or brewhouse acid additions" },
            { name: "Lactic", terms: "Yogurt, sour milk, clean tartness", chem: "Lactic acid", sources: "Lactobacillus in mashing or bacterial souring" }
          ]
        },
        { name: "Sweet", children: [{ name: "Sweet", terms: "Sugary sensation, wort-like", chem: "Sucrose / Maltose", sources: "Residual unfermented sugars, malts, adjuncts" }] },
        { name: "Salty", children: [{ name: "Salty", terms: "Briny, mineral-like, sodium", chem: "Sodium chloride", sources: "Brewing water salts or specific specialty malts" }] },
        { name: "Bitter", children: [{ name: "Bitter", terms: "Linger, sharp, back-of-throat scrape", chem: "Iso-alpha-acids", sources: "Hop additions during kettle boil or dry hopping" }] },
        { name: "Umami", children: [{ name: "Umami", terms: "Soy sauce, meaty, autolyzed yeast, savory", chem: "Glutamic acid / Glutamates", sources: "Yeast autolysis, prolonged age, dark toasted malts" }] }
      ]
    },
    {
      name: "Mouthfeel",
      children: [
        {
          name: "Body & Texture",
          children: [
            { name: "Astringent", terms: "Dry, puckering, tea-like, grape-skin", chem: "Polyphenols / Tannins", sources: "Husky grain extraction, elevated mash pH, massive hop loads" },
            { name: "Chalky", terms: "Powdery, dusty, plaster of paris", chem: "Calcium carbonate", sources: "Very hard brewing water, excessive mineral salts" },
            { name: "Mouthcoating", terms: "Slick, lingering oiliness, coating, film", chem: "Lipids / Glycoproteins", sources: "Beta-glucans, adjunct grains like oats or unmalted wheat" },
            { name: "Full Body", terms: "Thick, heavy, viscous, robust weight", chem: "Dextrins / Proteins", sources: "High terminal gravity, high mashing temp, dextrinous malts" },
            { name: "Thin Body", terms: "Watery, light, refreshing, low body", chem: "Simple sugars", sources: "Highly fermentable wort, sugar adjuncts, low mash temp" }
          ]
        },
        {
          name: "Carbonation",
          children: [
            { name: "Effervescent", terms: "Lively, prickly, fizzy on palate", chem: "Carbon dioxide (CO2)", sources: "Normal yeast carbonation, high package volumes" },
            { name: "Flat", terms: "Low carbonation, heavy, lifeless", chem: "Lacking CO2", sources: "Lost head, loose crown caps, poor can seams" }
          ]
        },
        {
          name: "Warming & Irritation",
          children: [
            { name: "Hop Burn / Scratchy", terms: "Abrasive, lingering burn in throat", chem: "Proline-binding polyphenols", sources: "Heavy dry-hop residue, green hop particles in suspensions" },
            { name: "Warming", terms: "Ethanol warmth, chest-warming", chem: "Ethanol / Fusel alcohols", sources: "Abundant high-gravity fermentation, high ABV beers" }
          ]
        }
      ]
    },
    {
      name: "Aroma",
      children: [
        {
          name: "Fruity",
          children: [
            {
              name: "Citrus",
              children: [
                { name: "Blood Orange", terms: "Sweet, tangy orange", chem: "Limonene / Linalool", sources: "Citrusy hop varieties (Citra, Amarillo, Mandarina, Cascade)" },
                { name: "Grapefruit", terms: "Bright, bitter, generic citrus", chem: "Thiols (4MMP) / Limonene", sources: "Late kettle hop additions or dry hops" },
                { name: "Lemon", terms: "Lemon zest, citrus peel", chem: "Linalool / Geraniol", sources: "Hops or lemon peel additions" },
                { name: "Lime", terms: "Key lime, zesty lime juice", chem: "Citronellol / Geraniol", sources: "Motueka hops, lime leaf infusion" },
                { name: "Orange", terms: "Fresh sweet orange pulp", chem: "Limonene", sources: "Classic hop compounds" },
                { name: "Tangerine", terms: "Slightly sweet, soft orange", chem: "E-4-decenal", sources: "Citrusy American hops" }
              ]
            },
            {
              name: "Tropical",
              children: [
                { name: "Banana", terms: "Solvent, ripe banana, runts candy", chem: "Isoamyl acetate", sources: "Yeast-derived ester (famous in German Hefeweizens)" },
                { name: "Coconut", terms: "Suntan oil, woody coconut, pina colada", chem: "Gamma-decalactone", sources: "Toasted oak barrels, Sabro hops" },
                { name: "Guava", terms: "Pungent overripe tropical sweet musk", chem: "3-mercaptohexyl acetate", sources: "Thiols derived from hops or specific wild yeasts" },
                { name: "Lychee", terms: "Sweet rose-like fruit, grapey hibiscus", chem: "L-rose oxide", sources: "Modern Southern Hemisphere hops (Nelson Sauvin)" },
                { name: "Mango", terms: "Rind, green mango flesh, sweet piney", chem: "3-mercapto-1-hexanol", sources: "Thiol-forward dry hops (Mosaic, Citra)" },
                { name: "Passion Fruit", terms: "Pungent, highly expressive tropical acid", chem: "3-mercaptohexyl acetate", sources: "Thiol biotransformation" },
                { name: "Pineapple", terms: "Candied pineapple, sweet ester juice", chem: "Ethyl butyrate", sources: "Sultana, El Dorado dry hopping or yeast esters" }
              ]
            },
            {
              name: "Stone Fruit",
              children: [
                { name: "Apricot / Peach", terms: "Fuzzy peach, stone pit fruit", chem: "C8-C12 Lactones", sources: "Caramel malts, generic ester profile" },
                { name: "Cherry", terms: "Marzipan, almond cherry pit, sweet cordials", chem: "Benzaldehyde", sources: "Lush cherry fruit additions or wild Brettanomyces" },
                { name: "Nectarine", terms: "Slick peach with sharp acid backing", chem: "Lactones", sources: "Ester blends" },
                { name: "Plum", terms: "Rich dark prune, plum jam notes", chem: "Esters", sources: "Oxidation in aged dark beers" }
              ]
            },
            {
              name: "Pome",
              children: [
                { name: "Cider", terms: "Apple juice, oxidized apple, dry cider", chem: "Acetaldehyde", sources: "Oxidative beer storage or early rack off yeast" },
                { name: "Green Apple", terms: "Sour green apple (Jolly Rancher), paint", chem: "Acetaldehyde", sources: "Yeast strain under-conditioning / green beer" },
                { name: "Red Apple", terms: "Sweet skin, anise, licorice backing", chem: "Ethyl hexanoate", sources: "Clean yeast esters" }
              ]
            },
            {
              name: "Melon",
              children: [
                { name: "Cucumber", terms: "Green, cucumber peel, vegetal cool", chem: "Trans-2-nonenal", sources: "Staling / oxidation or Huell Melon dry hops" },
                { name: "Honeydew / Cantaloupe", terms: "Pale sweet musk melon", chem: "Melon esters", sources: "Huell Melon hops" },
                { name: "Watermelon", terms: "Red candy, fresh cut grass rind", chem: "Cis-3-hexanal", sources: "Dry hopping or oxidation" }
              ]
            },
            {
              name: "Berry",
              children: [
                { name: "Blackberry / Raspberry", terms: "Jammy berry notes, tart candy seeds", chem: "Damascenone", sources: "Fruit additions or yeast esters" },
                { name: "Blueberry", terms: "Mild sweet blue fruit, grapey backing", chem: "Berry esters", sources: "Mosaic, Callista hopping" },
                { name: "Black Currant (Catty)", terms: "Ribes, cat urine, damp black tea", chem: "P-menthane-8-thiol", sources: "Simcoe, Citra, Nelson Sauvin hops; classic IPA trait" }
              ]
            },
            {
              name: "Dried Fruit",
              children: [
                { name: "Raisin / Date / Fig", terms: "Rich sweet pruney raisins, dark stew", chem: "Isoamyl phenyl acetate", sources: "Maillard reactions in dark malts, aged warm beers" }
              ]
            }
          ]
        },
        {
          name: "Floral",
          children: [
            { name: "Geranium / Rose", terms: "Rose petals, perfume, lavender, oily soap", chem: "Geraniol / Citronellol", sources: "Late hop additions or dry hops" },
            { name: "Jasmine / Honeysuckle", terms: "Sweet delicate white floral aroma", chem: "Terpenes", sources: "Noble hop oils" },
            { name: "Soapy", terms: "Oily, detergent, laundry sheets, dish soap", chem: "Caprylic acid / Fats", sources: "Yeast breakdown / autolysis, prolonged tank lag" }
          ]
        },
        {
          name: "Herbaceous",
          children: [
            {
              name: "Grassy",
              children: [
                { name: "Fresh Grass", terms: "Mowed lawn, raw green stems", chem: "Cis-3-hexenol", sources: "Abundant green hop vegetative residue left in contact" },
                { name: "Hay / Straw", terms: "Dry farm hay, barn feed, sweet grain hulls", chem: "Malt-derived", sources: "Malt specifications" }
              ]
            },
            {
              name: "Herbal",
              children: [
                { name: "Cannabis / Resinous", terms: "Heady, skunky weed, green pine sap", chem: "Myrcene", sources: "Dank hops (Columbus, Simcoe, Summit)" },
                { name: "Mint", terms: "Cooling menthol, fresh tea leaf", chem: "Hop oxygenates", sources: "Northern Brewer, Polaris hops" },
                { name: "Tea Leaves", terms: "Tannic black tea, herbal infusion", chem: "Polyphenols", sources: "Excessive hop steep or prolonged wood contact" }
              ]
            }
          ]
        },
        {
          name: "Spicy",
          children: [
            { name: "Clove", terms: "Spiced ham, holiday bake, smoky medicinal", chem: "4-Vinyl Guaiacol (4VG)", sources: "POF+ yeast strains (Belgian ales, German weissbiers)" },
            { name: "Cinnamon / Black Pepper", terms: "Baking cinnamon, black peppercorns", chem: "Ethyl cinnamate / Piperine", sources: "Aged dark barleywines or specific hop oils (Saaz)" }
          ]
        },
        {
          name: "Woody",
          children: [
            { name: "Oak / Vanilla", terms: "Woody barrel staves, coconut, buttery vanilla", chem: "Lactones / Vanillin", sources: "Barrel aging, oak spiral insertions" },
            { name: "Pine", terms: "Resinous pine needles, christmas tree spruce", chem: "Pinene / Myrcene", sources: "Chinook, Simcoe, Centennial classic hops" }
          ]
        },
        {
          name: "Earthy",
          children: [
            { name: "Soil / Geosmin", terms: "Damp cellar dirt, fresh soil, beets", chem: "Geosmin", sources: "Water filtration faults, moldy cellar environment" },
            { name: "Leather / Musty", terms: "Sweaty leather saddle, old cardboard cellar", chem: "6-isobutylquinoline", sources: "Aged/oxidized beers, wild Brett yeast background" }
          ]
        },
        {
          name: "Grain & Cereal",
          children: [
            { name: "Bready / Biscuit", terms: "Toasted cracker, biscuit, bread crumbs, dough", chem: "Acetylpyridine", sources: "Melanoidin malts (Victory, Biscuit, Munich)" },
            { name: "Grainy / Husky", terms: "Raw wet grain hulls, harsh mash water", chem: "Husk polyphenols", sources: "Mashing too thin or boiling husks directly" },
            { name: "Yeasty", terms: "Doughy, autolyzed broth, vitamins", chem: "Yeast paste", sources: "Incomplete settling, green beer, slurry carried over" }
          ]
        },
        {
          name: "Roasted",
          children: [
            { name: "Chocolate", terms: "Dark baker's cacao, sweet milk chocolate", chem: "Pyrazines", sources: "Chocolate malt, roasted wheat" },
            { name: "Coffee / Burnt Toast", terms: "Espresso grounds, cold brew, black charcoal", chem: "Maillard compounds", sources: "Roasted barley, Black patent malt" },
            { name: "Nutty", terms: "Peanut skin, almond paste, toasted hazelnut", chem: "Benzaldehyde", sources: "Slight oxidation of premium amber/brown malts" }
          ]
        },
        {
          name: "Caramel & Sweet Aromatics",
          children: [
            { name: "Caramel / Toffee", terms: "Werther's original, butterscotch caramel", chem: "Furaneol / Maltol", sources: "Crystal/Caramel malts, boiling extensions" },
            { name: "Vanilla / Honey", terms: "Sweet vanilla bean, wildflower nectar", chem: "Vanillin", sources: "Aged oak, specific yeast traits" }
          ]
        },
        {
          name: "Dairy & Diacetyl",
          children: [
            { name: "Diacetyl (Buttery)", terms: "Movie theater popcorn, butterscotch, slickness", chem: "Diacetyl / 2,3-butanedione", sources: "Yeast separation, poor VDK rest, Pediococcus infection" },
            { name: "Buttermilk / Yogurt", terms: "Slightly sour buttermilk, milk solids", chem: "Ethyl lactate", sources: "Lactic bacteria contamination" }
          ]
        },
        {
          name: "Phenolics & Fermented Faults",
          children: [
            { name: "Medicinal / Adhesive Bandage", terms: "Band-aid, TCP, antiseptic, plastic cups", chem: "4-Ethyl phenol (4EP)", sources: "Chlorine rinse residue, wild Brettanomyces contamination" },
            { name: "Smoky / Phenolic", terms: "Smoked bacon, wood ash, campfire, bandage", chem: "Guaiacol", sources: "Smoked peated malts, wild yeast" }
          ]
        },
        {
          name: "Sulfur Compounds",
          children: [
            { name: "DMS / Canned Corn", terms: "Canned sweet cream corn, cooked cabbage", chem: "Dimethyl sulfide", sources: "Weak boil, sluggish hot-wort cooling (SMM conversion)" },
            { name: "H2S / Rotten Egg", terms: "Struck match, sulfur spring, sewer gas", chem: "Hydrogen sulfide", sources: "Yeast nutrient starvation, premature crash" },
            { name: "Lightstruck / Skunky", terms: "Skunky, corona-green bottle, weed", chem: "3-methyl-2-butene-1-thiol (MBT)", sources: "Isomerized alpha-acids exposed to fluorescent/UV light" }
          ]
        }
      ]
    }
  ]
};

// Colors associated with general sectors (for UI representation)
export const SECTOR_COLORS: Record<string, string> = {
  // Ring 1
  "Basic Taste": "#8B2E2E",
  "Mouthfeel": "#3E5F7A",
  "Aroma": "#A8651C",

  // Aroma/Mouthfeel/Taste branches (Ring2)
  "Sour": "#C9DC2C",
  "Sweet": "#F4A6B8",
  "Salty": "#A8C5D6",
  "Bitter": "#5A7A3A",
  "Umami": "#8B4A3C",
  
  "Body & Texture": "#A89074",
  "Carbonation": "#7DBFC9",
  "Warming & Irritation": "#D69E3C",

  "Fruity": "#E07B3C",
  "Floral": "#E388B0",
  "Herbaceous": "#6FA042",
  "Spicy": "#C95A2E",
  "Woody": "#7A5230",
  "Earthy": "#5A3F2A",
  "Grain & Cereal": "#C49058",
  "Roasted": "#5A2E1C",
  "Caramel & Sweet Aromatics": "#C97A2E",
  "Dairy & Diacetyl": "#E8D078",
  "Phenolics & Fermented Faults": "#6B5A3A",
  "Sulfur Compounds": "#C2B23A"
};
