const smells = require('./config/routes/smells');
const smellSources = require('./config/routes/smell-sources');
const odourCarriers = require('./config/routes/odour-carriers');
const fragrantSpaces = require('./config/routes/fragrant-spaces');

module.exports = {
  debug: typeof process !== 'undefined' && process.env.NODE_ENV === 'development',
  metadata: {
    title: 'Odeuropa Explorer',
    logo: '/images/logo.png',
  },
  head: {
    styles: ['https://fonts.googleapis.com/css?family=Libre+Caslon+Text'],
  },
  home: {
    hero: {
      showHeadline: true,
      showLogo: false,
    },
  },
  footer: {
    logo: ['/images/eu-logo.png', '/images/footer.png'],
  },
  search: {
    route: 'smells',
    allowTextSearch: true,
    allowImageSearch: false,
    placeholderImage: '/images/placeholder.jpg',
    languages: {
      de: 'Deutsch',
      en: 'English',
      fr: 'Français',
      it: 'Italiano',
      si: 'Slovenski',
    },
    defaultLanguage: 'en',
  },
  api: {
    endpoint: 'https://data.odeuropa.eu/repositories/odeuropa',
    params: {
      sameAs: false,
      infer: false,
    },
    queryLink: (query) => `https://data.odeuropa.eu/sparql?query=${encodeURIComponent(query)}`,
    prefixes: {
      'luc-index': 'http://www.ontotext.com/connectors/lucene/instance#',
      'olfactory-objects': 'http://data.odeuropa.eu/vocabulary/olfactory-objects/',
      crm: 'http://erlangen-crm.org/current/',
      crmsci: 'http://www.ics.forth.gr/isl/CRMsci/',
      dc: 'http://purl.org/dc/elements/1.1/',
      gn: 'http://www.geonames.org/ontology#',
      luc: 'http://www.ontotext.com/connectors/lucene#',
      ma: 'http://www.w3.org/ns/ma-ont#',
      nsa: 'http://organon.elis.ugent.be/ontologies/ninsuna#',
      oa: 'http://www.w3.org/ns/oa#',
      od: 'http://data.odeuropa.eu/ontology/',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      reo: 'https://read-it.acc.hum.uu.nl/ontology#',
      schema: 'https://schema.org/',
      skos: 'http://www.w3.org/2004/02/skos/core#',
      time: 'http://www.w3.org/2006/time#',
      voc: 'http://data.odeuropa.eu/vocabulary/',
      wgs: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    },
    permalinkUrl: (uri) => `https://data.odeuropa.eu/resource?uri=${uri}`,
  },
  routes: {
    smells,
    'smell-sources': smellSources,
    'odour-carriers': odourCarriers,
    'fragrant-spaces': fragrantSpaces,
  },
  imagesDomains: ['data.odeuropa.eu'],
  graphs: () => ({
    '@context': 'http://schema.org/',
    '@graph': [
      {
        '@id': '?g',
        label: '?label',
      },
    ],
    $where: ['GRAPH ?g { ?id a od:L11_Smell }', '?g rdfs:label ?label'],
    $orderby: 'ASC(?label)',
  }),
  vocabularies: {},
  analytics: {
    id: 'G-KLL4E6TZWE',
  },
};
