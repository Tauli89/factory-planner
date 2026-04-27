/**
 * Factorio Technologie-Datenbank – Vanilla 2.0 + Space Age DLC
 *
 * cost: Wissenschaftspakete pro Forschungseinheit
 *   red=Automatisierung, green=Logistik, blue=Chemisch, black=Produktion,
 *   purple=Militär, yellow=Utility, white=Space, aqua=Fisch (Nauvis)
 *   SA-Packs: se=Metallurgy(Vulcanus), biologisch=Biological(Gleba),
 *             cryogenic=Cryogenic(Fulgora-äquiv.), promethium=Promethium(Aquilo)
 *
 * effects:
 *   unlock_recipe   – id des Rezepts (REZEPTE-ID aus recipes.js)
 *   mining_productivity – Bonus-Multiplikator
 *   assembler_speed     – Bonus-Multiplikator
 *   module_slots        – Anzahl zusätzlicher Modul-Slots
 */

export const TECH = [

  // =========================================================================
  // AUTOMATISIERUNG (Tier 1 – Rotes Pack)
  // =========================================================================
  {
    id: 'automation',
    name: { de: 'Automatisierung', en: 'Automation' },
    prerequisites: [],
    cost: { red: 10 },
    effects: [
      { type: 'unlock_recipe', id: 'assembler-1' },
    ],
  },
  {
    id: 'automation-2',
    name: { de: 'Automatisierung 2', en: 'Automation 2' },
    prerequisites: ['automation', 'electronics'],
    cost: { red: 40, green: 40 },
    effects: [
      { type: 'unlock_recipe', id: 'assembler-2' },
    ],
  },
  {
    id: 'automation-3',
    name: { de: 'Automatisierung 3', en: 'Automation 3' },
    prerequisites: ['automation-2'],
    cost: { red: 150, green: 150, blue: 150 },
    effects: [
      { type: 'unlock_recipe', id: 'assembler-3' },
    ],
  },

  // =========================================================================
  // LOGISTIK
  // =========================================================================
  {
    id: 'logistics',
    name: { de: 'Logistik', en: 'Logistics' },
    prerequisites: [],
    cost: { red: 10 },
    effects: [
      { type: 'unlock_recipe', id: 'transportband' },
      { type: 'unlock_recipe', id: 'unterirdisches-band' },
      { type: 'unlock_recipe', id: 'bandweiche' },
    ],
  },
  {
    id: 'logistics-2',
    name: { de: 'Logistik 2', en: 'Logistics 2' },
    prerequisites: ['logistics', 'steel-processing'],
    cost: { red: 40, green: 40 },
    effects: [
      { type: 'unlock_recipe', id: 'schnelles-band' },
      { type: 'unlock_recipe', id: 'schnelles-unterirdisches-band' },
      { type: 'unlock_recipe', id: 'schnelle-weiche' },
    ],
  },
  {
    id: 'logistics-3',
    name: { de: 'Logistik 3', en: 'Logistics 3' },
    prerequisites: ['logistics-2'],
    cost: { red: 250, green: 250, blue: 250 },
    effects: [
      { type: 'unlock_recipe', id: 'expressband' },
      { type: 'unlock_recipe', id: 'expressbandunterirdisch' },
      { type: 'unlock_recipe', id: 'expressweiche' },
    ],
  },

  // =========================================================================
  // GREIFER / INSERTER
  // =========================================================================
  {
    id: 'inserters',
    name: { de: 'Greifer', en: 'Inserters' },
    prerequisites: ['automation'],
    cost: { red: 10 },
    effects: [
      { type: 'unlock_recipe', id: 'greifer' },
    ],
  },
  {
    id: 'fast-inserter',
    name: { de: 'Schneller Greifer', en: 'Fast Inserter' },
    prerequisites: ['inserters', 'electronics'],
    cost: { red: 40, green: 40 },
    effects: [
      { type: 'unlock_recipe', id: 'schneller-greifer' },
      { type: 'unlock_recipe', id: 'filter-greifer' },
    ],
  },
  {
    id: 'bulk-inserter',
    name: { de: 'Massengreifer', en: 'Bulk Inserter' },
    prerequisites: ['fast-inserter'],
    cost: { red: 100, green: 100, blue: 100 },
    effects: [
      { type: 'unlock_recipe', id: 'massengreifer' },
    ],
  },

  // =========================================================================
  // ELEKTRONIK
  // =========================================================================
  {
    id: 'electronics',
    name: { de: 'Elektronik', en: 'Electronics' },
    prerequisites: [],
    cost: { red: 10 },
    effects: [
      { type: 'unlock_recipe', id: 'gruener-schaltkreis' },
    ],
  },
  {
    id: 'advanced-electronics',
    name: { de: 'Fortgeschrittene Elektronik', en: 'Advanced Electronics' },
    prerequisites: ['electronics', 'steel-processing'],
    cost: { red: 200, green: 200 },
    effects: [
      { type: 'unlock_recipe', id: 'roter-schaltkreis' },
    ],
  },
  {
    id: 'advanced-electronics-2',
    name: { de: 'Fortgeschrittene Elektronik 2', en: 'Advanced Electronics 2' },
    prerequisites: ['advanced-electronics', 'sulfuric-acid'],
    cost: { red: 500, green: 500, blue: 500 },
    effects: [
      { type: 'unlock_recipe', id: 'blauer-schaltkreis' },
    ],
  },

  // =========================================================================
  // STAHLVERARBEITUNG
  // =========================================================================
  {
    id: 'steel-processing',
    name: { de: 'Stahlverarbeitung', en: 'Steel Processing' },
    prerequisites: [],
    cost: { red: 40 },
    effects: [
      { type: 'unlock_recipe', id: 'stahl' },
      { type: 'unlock_recipe', id: 'stahlofen' },
    ],
  },

  // =========================================================================
  // ÖLTECHNIK
  // =========================================================================
  {
    id: 'oil-processing',
    name: { de: 'Ölverarbeitung', en: 'Oil Processing' },
    prerequisites: ['steel-processing', 'fluid-handling'],
    cost: { red: 100, green: 100 },
    effects: [
      { type: 'unlock_recipe', id: 'raffinerie' },
      { type: 'unlock_recipe', id: 'rohoelverarbeitung' },
    ],
  },
  {
    id: 'advanced-oil-processing',
    name: { de: 'Fortgeschrittene Ölverarbeitung', en: 'Advanced Oil Processing' },
    prerequisites: ['oil-processing'],
    cost: { red: 300, green: 300, blue: 300 },
    effects: [
      { type: 'unlock_recipe', id: 'fortgeschrittene-oelverarbeitung' },
      { type: 'unlock_recipe', id: 'leichtoel-cracking' },
      { type: 'unlock_recipe', id: 'schwerol-cracking' },
    ],
  },
  {
    id: 'coal-liquefaction',
    name: { de: 'Kohle-Verflüssigung', en: 'Coal Liquefaction' },
    prerequisites: ['advanced-oil-processing', 'heavy-armor'],
    cost: { red: 300, green: 300, blue: 300 },
    effects: [
      { type: 'unlock_recipe', id: 'kohleverflüssigung' },
    ],
  },

  // =========================================================================
  // FLÜSSIGKEITEN
  // =========================================================================
  {
    id: 'fluid-handling',
    name: { de: 'Flüssigkeitstechnik', en: 'Fluid Handling' },
    prerequisites: ['steel-processing'],
    cost: { red: 50, green: 50 },
    effects: [
      { type: 'unlock_recipe', id: 'rohr' },
      { type: 'unlock_recipe', id: 'rohr-unterirdisch' },
      { type: 'unlock_recipe', id: 'pumpe' },
      { type: 'unlock_recipe', id: 'chemieanlage' },
    ],
  },

  // =========================================================================
  // KUNSTSTOFFE / CHEMIE
  // =========================================================================
  {
    id: 'plastics',
    name: { de: 'Kunststoffe', en: 'Plastics' },
    prerequisites: ['oil-processing'],
    cost: { red: 100, green: 100, blue: 100 },
    effects: [
      { type: 'unlock_recipe', id: 'kunststoffstange' },
    ],
  },
  {
    id: 'sulfuric-acid',
    name: { de: 'Schwefelsäure', en: 'Sulfuric Acid' },
    prerequisites: ['oil-processing'],
    cost: { red: 100, green: 100, blue: 100 },
    effects: [
      { type: 'unlock_recipe', id: 'schwefelsaeure' },
      { type: 'unlock_recipe', id: 'schwefel' },
    ],
  },
  {
    id: 'explosives',
    name: { de: 'Explosivstoffe', en: 'Explosives' },
    prerequisites: ['sulfuric-acid'],
    cost: { red: 100, green: 100, blue: 100 },
    effects: [
      { type: 'unlock_recipe', id: 'explosivstoffe' },
    ],
  },
  {
    id: 'lubricant',
    name: { de: 'Schmiermittel', en: 'Lubricant' },
    prerequisites: ['advanced-oil-processing'],
    cost: { red: 100, green: 100, blue: 100 },
    effects: [
      { type: 'unlock_recipe', id: 'schmiermittel' },
    ],
  },

  // =========================================================================
  // STROMERZEUGUNG / ENERGIE
  // =========================================================================
  {
    id: 'electric-energy-distribution-1',
    name: { de: 'Elektrische Energieverteilung 1', en: 'Electric Energy Distribution 1' },
    prerequisites: [],
    cost: { red: 40 },
    effects: [
      { type: 'unlock_recipe', id: 'kleiner-strommast' },
    ],
  },
  {
    id: 'electric-energy-distribution-2',
    name: { de: 'Elektrische Energieverteilung 2', en: 'Electric Energy Distribution 2' },
    prerequisites: ['electric-energy-distribution-1', 'advanced-electronics'],
    cost: { red: 200, green: 200 },
    effects: [
      { type: 'unlock_recipe', id: 'grosser-strommast' },
    ],
  },
  {
    id: 'solar-energy',
    name: { de: 'Solarenergie', en: 'Solar Energy' },
    prerequisites: ['advanced-electronics'],
    cost: { red: 500, green: 500 },
    effects: [
      { type: 'unlock_recipe', id: 'solarpanel' },
      { type: 'unlock_recipe', id: 'akku' },
    ],
  },
  {
    id: 'steam-power',
    name: { de: 'Dampfkraft', en: 'Steam Power' },
    prerequisites: [],
    cost: { red: 10 },
    effects: [
      { type: 'unlock_recipe', id: 'dampfkessel' },
      { type: 'unlock_recipe', id: 'dampfturbine' },
    ],
  },

  // =========================================================================
  // BERGBAU-PRODUKTIVITÄT
  // =========================================================================
  {
    id: 'mining-productivity-1',
    name: { de: 'Bergbau-Produktivität 1', en: 'Mining Productivity 1' },
    prerequisites: ['steel-processing'],
    cost: { red: 100, green: 100 },
    effects: [{ type: 'mining_productivity', value: 0.1 }],
  },
  {
    id: 'mining-productivity-2',
    name: { de: 'Bergbau-Produktivität 2', en: 'Mining Productivity 2' },
    prerequisites: ['mining-productivity-1'],
    cost: { red: 250, green: 250, blue: 250 },
    effects: [{ type: 'mining_productivity', value: 0.1 }],
  },
  {
    id: 'mining-productivity-3',
    name: { de: 'Bergbau-Produktivität 3', en: 'Mining Productivity 3' },
    prerequisites: ['mining-productivity-2'],
    cost: { red: 500, green: 500, blue: 500, black: 50 },
    effects: [{ type: 'mining_productivity', value: 0.1 }],
  },
  {
    id: 'mining-productivity-4',
    name: { de: 'Bergbau-Produktivität 4', en: 'Mining Productivity 4' },
    prerequisites: ['mining-productivity-3'],
    cost: { red: 1000, green: 1000, blue: 1000, black: 100 },
    effects: [{ type: 'mining_productivity', value: 0.1 }],
  },

  // =========================================================================
  // ROBOTER & DROHNEN
  // =========================================================================
  {
    id: 'robotics',
    name: { de: 'Robotik', en: 'Robotics' },
    prerequisites: ['advanced-electronics', 'lubricant'],
    cost: { red: 200, green: 200, blue: 200 },
    effects: [
      { type: 'unlock_recipe', id: 'fliegender-roboter-rahmen' },
    ],
  },
  {
    id: 'construction-robotics',
    name: { de: 'Baurobotik', en: 'Construction Robotics' },
    prerequisites: ['robotics'],
    cost: { red: 200, green: 200, blue: 200 },
    effects: [
      { type: 'unlock_recipe', id: 'bauroboter' },
      { type: 'unlock_recipe', id: 'roboport' },
    ],
  },
  {
    id: 'logistic-robotics',
    name: { de: 'Logistikrobotik', en: 'Logistic Robotics' },
    prerequisites: ['construction-robotics'],
    cost: { red: 200, green: 200, blue: 200 },
    effects: [
      { type: 'unlock_recipe', id: 'logistikroboter' },
    ],
  },

  // =========================================================================
  // MODULE
  // =========================================================================
  {
    id: 'speed-module',
    name: { de: 'Geschwindigkeitsmodul', en: 'Speed Module' },
    prerequisites: ['advanced-electronics-2'],
    cost: { red: 300, green: 300, blue: 300 },
    effects: [
      { type: 'unlock_recipe', id: 'geschwindigkeitsmodul-1' },
    ],
  },
  {
    id: 'speed-module-2',
    name: { de: 'Geschwindigkeitsmodul 2', en: 'Speed Module 2' },
    prerequisites: ['speed-module'],
    cost: { red: 500, green: 500, blue: 500, black: 100 },
    effects: [
      { type: 'unlock_recipe', id: 'geschwindigkeitsmodul-2' },
    ],
  },
  {
    id: 'speed-module-3',
    name: { de: 'Geschwindigkeitsmodul 3', en: 'Speed Module 3' },
    prerequisites: ['speed-module-2'],
    cost: { red: 1000, green: 1000, blue: 1000, black: 300, yellow: 300 },
    effects: [
      { type: 'unlock_recipe', id: 'geschwindigkeitsmodul-3' },
    ],
  },
  {
    id: 'efficiency-module',
    name: { de: 'Effizienzmodul', en: 'Efficiency Module' },
    prerequisites: ['advanced-electronics-2'],
    cost: { red: 300, green: 300, blue: 300 },
    effects: [
      { type: 'unlock_recipe', id: 'effizienzmodul-1' },
    ],
  },
  {
    id: 'efficiency-module-2',
    name: { de: 'Effizienzmodul 2', en: 'Efficiency Module 2' },
    prerequisites: ['efficiency-module'],
    cost: { red: 500, green: 500, blue: 500, black: 100 },
    effects: [
      { type: 'unlock_recipe', id: 'effizienzmodul-2' },
    ],
  },
  {
    id: 'efficiency-module-3',
    name: { de: 'Effizienzmodul 3', en: 'Efficiency Module 3' },
    prerequisites: ['efficiency-module-2'],
    cost: { red: 1000, green: 1000, blue: 1000, black: 300, yellow: 300 },
    effects: [
      { type: 'unlock_recipe', id: 'effizienzmodul-3' },
    ],
  },
  {
    id: 'productivity-module',
    name: { de: 'Produktivitätsmodul', en: 'Productivity Module' },
    prerequisites: ['advanced-electronics-2'],
    cost: { red: 300, green: 300, blue: 300 },
    effects: [
      { type: 'unlock_recipe', id: 'produktivitaetsmodul-1' },
    ],
  },
  {
    id: 'productivity-module-2',
    name: { de: 'Produktivitätsmodul 2', en: 'Productivity Module 2' },
    prerequisites: ['productivity-module'],
    cost: { red: 500, green: 500, blue: 500, black: 100 },
    effects: [
      { type: 'unlock_recipe', id: 'produktivitaetsmodul-2' },
    ],
  },
  {
    id: 'productivity-module-3',
    name: { de: 'Produktivitätsmodul 3', en: 'Productivity Module 3' },
    prerequisites: ['productivity-module-2'],
    cost: { red: 1000, green: 1000, blue: 1000, black: 300, yellow: 300 },
    effects: [
      { type: 'unlock_recipe', id: 'produktivitaetsmodul-3' },
    ],
  },

  // =========================================================================
  // WISSENSCHAFTSPAKETE
  // =========================================================================
  {
    id: 'automation-science-pack',
    name: { de: 'Automatisierungspaket', en: 'Automation Science Pack' },
    prerequisites: [],
    cost: {},
    effects: [
      { type: 'unlock_recipe', id: 'science-rot' },
    ],
  },
  {
    id: 'logistic-science-pack',
    name: { de: 'Logistikpaket', en: 'Logistic Science Pack' },
    prerequisites: ['logistics', 'inserters'],
    cost: { red: 50 },
    effects: [
      { type: 'unlock_recipe', id: 'science-gruen' },
    ],
  },
  {
    id: 'military-science-pack',
    name: { de: 'Militärpaket', en: 'Military Science Pack' },
    prerequisites: ['steel-processing', 'explosives'],
    cost: { red: 75, green: 75 },
    effects: [
      { type: 'unlock_recipe', id: 'science-schwarz' },
    ],
  },
  {
    id: 'chemical-science-pack',
    name: { de: 'Chemisches Paket', en: 'Chemical Science Pack' },
    prerequisites: ['advanced-electronics', 'sulfuric-acid', 'plastics'],
    cost: { red: 200, green: 200 },
    effects: [
      { type: 'unlock_recipe', id: 'science-blau' },
    ],
  },
  {
    id: 'production-science-pack',
    name: { de: 'Produktionspaket', en: 'Production Science Pack' },
    prerequisites: ['automation-3', 'chemical-science-pack', 'electric-energy-distribution-2'],
    cost: { red: 600, green: 600, blue: 600 },
    effects: [
      { type: 'unlock_recipe', id: 'science-lila' },
    ],
  },
  {
    id: 'utility-science-pack',
    name: { de: 'Hilfspaket', en: 'Utility Science Pack' },
    prerequisites: ['advanced-electronics-2', 'logistic-robotics', 'solar-energy'],
    cost: { red: 600, green: 600, blue: 600 },
    effects: [
      { type: 'unlock_recipe', id: 'science-gelb' },
    ],
  },
  {
    id: 'space-science-pack',
    name: { de: 'Raumfahrtpaket', en: 'Space Science Pack' },
    prerequisites: ['rocket-silo'],
    cost: { red: 1000, green: 1000, blue: 1000, black: 1000, yellow: 1000 },
    effects: [
      { type: 'unlock_recipe', id: 'science-weiss' },
    ],
  },

  // =========================================================================
  // MILITARY
  // =========================================================================
  {
    id: 'military',
    name: { de: 'Militär', en: 'Military' },
    prerequisites: [],
    cost: { red: 10 },
    effects: [
      { type: 'unlock_recipe', id: 'magazin' },
    ],
  },
  {
    id: 'heavy-armor',
    name: { de: 'Schwere Rüstung', en: 'Heavy Armor' },
    prerequisites: ['steel-processing'],
    cost: { red: 100, green: 100 },
    effects: [
      { type: 'unlock_recipe', id: 'sprengstoff-granate' },
    ],
  },

  // =========================================================================
  // NUKLEAR
  // =========================================================================
  {
    id: 'nuclear-power',
    name: { de: 'Kernkraft', en: 'Nuclear Power' },
    prerequisites: ['advanced-electronics-2', 'sulfuric-acid', 'uranium-processing'],
    cost: { red: 500, green: 500, blue: 500, yellow: 500 },
    effects: [
      { type: 'unlock_recipe', id: 'kernreaktor' },
      { type: 'unlock_recipe', id: 'waermetauscher' },
      { type: 'unlock_recipe', id: 'kernturbine' },
    ],
  },
  {
    id: 'uranium-processing',
    name: { de: 'Uranverarbeitung', en: 'Uranium Processing' },
    prerequisites: ['sulfuric-acid'],
    cost: { red: 200, green: 200, blue: 200 },
    effects: [
      { type: 'unlock_recipe', id: 'zentrifuge' },
      { type: 'unlock_recipe', id: 'uranverarbeitung' },
      { type: 'unlock_recipe', id: 'urankraftstoffzelle' },
    ],
  },
  {
    id: 'kovarex-enrichment',
    name: { de: 'Kovarex-Anreicherung', en: 'Kovarex Enrichment Process' },
    prerequisites: ['uranium-processing'],
    cost: { red: 2000, green: 2000, blue: 2000, yellow: 2000 },
    effects: [
      { type: 'unlock_recipe', id: 'kovarex-anreicherung' },
    ],
  },

  // =========================================================================
  // RAKETE & ORBIT
  // =========================================================================
  {
    id: 'rocket-silo',
    name: { de: 'Raketensilo', en: 'Rocket Silo' },
    prerequisites: ['production-science-pack', 'utility-science-pack', 'advanced-electronics-2'],
    cost: { red: 1000, green: 1000, blue: 1000, black: 1000, yellow: 1000 },
    effects: [
      { type: 'unlock_recipe', id: 'raketensilo' },
      { type: 'unlock_recipe', id: 'raketentreibstoff' },
      { type: 'unlock_recipe', id: 'raketensteuergeraet' },
    ],
  },
  {
    id: 'space-platform',
    name: { de: 'Raumplattform', en: 'Space Platform' },
    prerequisites: ['rocket-silo'],
    cost: { red: 500, green: 500, blue: 500, yellow: 500, white: 500 },
    effects: [
      { type: 'unlock_recipe', id: 'raumplattform-starter-paket' },
    ],
  },

  // =========================================================================
  // SPACE AGE – VULCANUS (Hochofen / Foundry)
  // =========================================================================
  {
    id: 'metallurgic-science-pack',
    name: { de: 'Metallurgisches Paket', en: 'Metallurgic Science Pack' },
    prerequisites: ['space-platform'],
    cost: { red: 100, green: 100, blue: 100, white: 100 },
    effects: [
      { type: 'unlock_recipe', id: 'science-metallurgie' },
    ],
  },
  {
    id: 'foundry',
    name: { de: 'Hochofen', en: 'Foundry' },
    prerequisites: ['metallurgic-science-pack'],
    cost: { red: 200, green: 200, blue: 200, se: 200 },
    effects: [
      { type: 'unlock_recipe', id: 'hochofen' },
    ],
  },
  {
    id: 'tungsten-processing',
    name: { de: 'Wolframverarbeitung', en: 'Tungsten Processing' },
    prerequisites: ['foundry'],
    cost: { red: 200, green: 200, blue: 200, se: 200 },
    effects: [
      { type: 'unlock_recipe', id: 'wolframplatte' },
      { type: 'unlock_recipe', id: 'wolframkarbid' },
    ],
  },
  {
    id: 'electromagnetic-plant',
    name: { de: 'Elektromagnetische Anlage', en: 'Electromagnetic Plant' },
    prerequisites: ['tungsten-processing'],
    cost: { red: 500, green: 500, blue: 500, se: 500 },
    effects: [
      { type: 'unlock_recipe', id: 'em-anlage' },
      { type: 'unlock_recipe', id: 'superkondensator' },
    ],
  },
  {
    id: 'superconductor',
    name: { de: 'Supraleiter', en: 'Superconductor' },
    prerequisites: ['electromagnetic-plant'],
    cost: { red: 500, green: 500, blue: 500, se: 500 },
    effects: [
      { type: 'unlock_recipe', id: 'supraleiter' },
    ],
  },

  // =========================================================================
  // SPACE AGE – GLEBA (Biokammer)
  // =========================================================================
  {
    id: 'agricultural-science-pack',
    name: { de: 'Landwirtschaftliches Paket', en: 'Agricultural Science Pack' },
    prerequisites: ['space-platform'],
    cost: { red: 100, green: 100, blue: 100, white: 100 },
    effects: [
      { type: 'unlock_recipe', id: 'science-biologisch' },
    ],
  },
  {
    id: 'biochamber',
    name: { de: 'Biokammer', en: 'Biochamber' },
    prerequisites: ['agricultural-science-pack'],
    cost: { red: 200, green: 200, blue: 200, biologisch: 200 },
    effects: [
      { type: 'unlock_recipe', id: 'biokammer' },
    ],
  },
  {
    id: 'bioflux',
    name: { de: 'Biofluss', en: 'Bioflux' },
    prerequisites: ['biochamber'],
    cost: { red: 200, green: 200, biologisch: 200 },
    effects: [
      { type: 'unlock_recipe', id: 'biofluss' },
      { type: 'unlock_recipe', id: 'naehrstoffe-aus-biofluss' },
    ],
  },
  {
    id: 'carbon-fiber',
    name: { de: 'Carbonfaser', en: 'Carbon Fiber' },
    prerequisites: ['bioflux', 'tungsten-processing'],
    cost: { red: 500, green: 500, blue: 500, se: 300, biologisch: 300 },
    effects: [
      { type: 'unlock_recipe', id: 'carbonfaser' },
    ],
  },

  // =========================================================================
  // SPACE AGE – FULGORA (Kryogenanlage)
  // =========================================================================
  {
    id: 'cryogenic-science-pack',
    name: { de: 'Kryogenes Paket', en: 'Cryogenic Science Pack' },
    prerequisites: ['space-platform'],
    cost: { red: 100, green: 100, blue: 100, white: 100 },
    effects: [
      { type: 'unlock_recipe', id: 'science-kryogen' },
    ],
  },
  {
    id: 'cryogenic-plant',
    name: { de: 'Kryogenanlage', en: 'Cryogenic Plant' },
    prerequisites: ['cryogenic-science-pack'],
    cost: { red: 300, green: 300, blue: 300, kryogen: 300 },
    effects: [
      { type: 'unlock_recipe', id: 'kryogenanlage' },
      { type: 'unlock_recipe', id: 'fluoroketon-kalt' },
    ],
  },
  {
    id: 'holmium-processing',
    name: { de: 'Holmiumverarbeitung', en: 'Holmium Processing' },
    prerequisites: ['cryogenic-plant'],
    cost: { red: 300, green: 300, blue: 300, kryogen: 300 },
    effects: [
      { type: 'unlock_recipe', id: 'holmiumloesung' },
      { type: 'unlock_recipe', id: 'holmiumplatte' },
    ],
  },
  {
    id: 'quantum-processor',
    name: { de: 'Quantenprozessor', en: 'Quantum Processor' },
    prerequisites: ['holmium-processing', 'superconductor', 'carbon-fiber'],
    cost: { red: 1000, green: 1000, blue: 1000, se: 500, biologisch: 500, kryogen: 500 },
    effects: [
      { type: 'unlock_recipe', id: 'quantenprozessor' },
    ],
  },

  // =========================================================================
  // SPACE AGE – AQUILO (Promethium)
  // =========================================================================
  {
    id: 'promethium-science-pack',
    name: { de: 'Promethium-Paket', en: 'Promethium Science Pack' },
    prerequisites: ['quantum-processor'],
    cost: { red: 500, green: 500, blue: 500, se: 500, biologisch: 500, kryogen: 500 },
    effects: [
      { type: 'unlock_recipe', id: 'science-promethium' },
    ],
  },
];

// Lookup-Map
export const TECH_MAP = Object.fromEntries(TECH.map(t => [t.id, t]));

// Alle Rezept-IDs die durch irgendeine Technologie freigeschaltet werden
// (d.h. ohne Forschung gesperrt sind)
export const DURCH_TECH_GESPERRTE_REZEPTE = new Set(
  TECH.flatMap(t => t.effects.filter(e => e.type === 'unlock_recipe').map(e => e.id))
);

// Alle Wissenschaftspaket-Typen mit Farbe & Label
export const PACK_META = {
  red:        { label: 'Rot',          color: '#e53935' },
  green:      { label: 'Grün',         color: '#43a047' },
  blue:       { label: 'Blau',         color: '#1e88e5' },
  black:      { label: 'Produktion',   color: '#7b1fa2' },
  purple:     { label: 'Militär',      color: '#6d4c41' },
  yellow:     { label: 'Utility',      color: '#fdd835' },
  white:      { label: 'Raumfahrt',    color: '#e0e0e0' },
  se:         { label: 'Metallurgie',  color: '#ff7043' },
  biologisch: { label: 'Biologisch',   color: '#66bb6a' },
  kryogen:    { label: 'Kryogen',      color: '#4dd0e1' },
  promethium: { label: 'Promethium',   color: '#ce93d8' },
};

// Presets: Menge an Tech-IDs die als erforscht vorausgesetzt werden
export const PRESETS = {
  fruehspiel: {
    label: 'Frühspiel',
    ids: [
      'automation','logistics','inserters','electronics','steel-processing',
      'fluid-handling','oil-processing','electric-energy-distribution-1',
      'steam-power','military','automation-science-pack','logistic-science-pack',
    ],
  },
  midgame: {
    label: 'Midgame',
    ids: [
      'automation','logistics','logistics-2','inserters','fast-inserter',
      'electronics','advanced-electronics','steel-processing','fluid-handling',
      'oil-processing','advanced-oil-processing','plastics','sulfuric-acid',
      'lubricant','electric-energy-distribution-1','electric-energy-distribution-2',
      'steam-power','solar-energy','military','heavy-armor',
      'automation-science-pack','logistic-science-pack',
      'military-science-pack','chemical-science-pack',
      'automation-2','advanced-electronics-2','robotics',
      'construction-robotics','logistic-robotics',
      'uranium-processing','mining-productivity-1','mining-productivity-2',
    ],
  },
  endgame: {
    label: 'Endgame',
    ids: [
      'automation','logistics','logistics-2','logistics-3','inserters','fast-inserter','bulk-inserter',
      'electronics','advanced-electronics','advanced-electronics-2',
      'steel-processing','fluid-handling','oil-processing','advanced-oil-processing',
      'coal-liquefaction','plastics','sulfuric-acid','explosives','lubricant',
      'electric-energy-distribution-1','electric-energy-distribution-2',
      'steam-power','solar-energy','military','heavy-armor',
      'automation-science-pack','logistic-science-pack','military-science-pack',
      'chemical-science-pack','production-science-pack','utility-science-pack','space-science-pack',
      'automation-2','automation-3','advanced-electronics-2','robotics',
      'construction-robotics','logistic-robotics',
      'speed-module','speed-module-2','speed-module-3',
      'efficiency-module','efficiency-module-2','efficiency-module-3',
      'productivity-module','productivity-module-2','productivity-module-3',
      'uranium-processing','kovarex-enrichment','nuclear-power',
      'mining-productivity-1','mining-productivity-2','mining-productivity-3','mining-productivity-4',
      'rocket-silo','space-platform',
    ],
  },
  spaceAge: {
    label: 'Space Age komplett',
    ids: [
      'automation','logistics','logistics-2','logistics-3','inserters','fast-inserter','bulk-inserter',
      'electronics','advanced-electronics','advanced-electronics-2',
      'steel-processing','fluid-handling','oil-processing','advanced-oil-processing',
      'coal-liquefaction','plastics','sulfuric-acid','explosives','lubricant',
      'electric-energy-distribution-1','electric-energy-distribution-2',
      'steam-power','solar-energy','military','heavy-armor',
      'automation-science-pack','logistic-science-pack','military-science-pack',
      'chemical-science-pack','production-science-pack','utility-science-pack','space-science-pack',
      'automation-2','automation-3','robotics','construction-robotics','logistic-robotics',
      'speed-module','speed-module-2','speed-module-3',
      'efficiency-module','efficiency-module-2','efficiency-module-3',
      'productivity-module','productivity-module-2','productivity-module-3',
      'uranium-processing','kovarex-enrichment','nuclear-power',
      'mining-productivity-1','mining-productivity-2','mining-productivity-3','mining-productivity-4',
      'rocket-silo','space-platform',
      'metallurgic-science-pack','foundry','tungsten-processing','electromagnetic-plant','superconductor',
      'agricultural-science-pack','biochamber','bioflux','carbon-fiber',
      'cryogenic-science-pack','cryogenic-plant','holmium-processing','quantum-processor',
      'promethium-science-pack',
    ],
  },
};
