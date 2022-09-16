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
  home: {
    hero: {
      showHeadline: true,
      showLogo: false,
    },
  },
  footer: {
    logo: '/images/footer.png',
  },
  search: {
    route: 'smells',
    allowTextSearch: true,
    allowImageSearch: false,
    placeholderImage: '/images/placeholder.jpg',
    languages: {
      en: 'English',
      fr: 'Français',
    },
    defaultLanguage: 'en',
  },
  api: {
    endpoint: 'https://data.odeuropa.eu/repositories/odeuropa',
    params: {
      sameAs: false,
    },
    prefixes: {
      'crm': 'http://erlangen-crm.org/current/',
      'crmsci': 'http://www.ics.forth.gr/isl/CRMsci/',
      'dc': 'http://purl.org/dc/elements/1.1/',
      'gn': 'http://www.geonames.org/ontology#',
      'luc-index': 'http://www.ontotext.com/connectors/lucene/instance#',
      'luc': 'http://www.ontotext.com/connectors/lucene#',
      'od': 'http://data.odeuropa.eu/ontology/',
      'olfactory-objects': 'http://data.odeuropa.eu/vocabulary/olfactory-objects/',
      'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
      'reo': 'https://read-it.acc.hum.uu.nl/ontology#',
      'reo': 'https://read-it.acc.hum.uu.nl/ontology#',
      'schema': 'https://schema.org/',
      'skos': 'http://www.w3.org/2004/02/skos/core#',
      'time': 'http://www.w3.org/2006/time#',
      'voc': 'http://data.odeuropa.eu/vocabulary/',
      'xsd': 'http://www.w3.org/2001/XMLSchema#',
    },
    permalinkUrl: (uri) => `https://data.odeuropa.eu/resource?uri=${uri}`,
  },
  routes: {
    'smells': smells,
    'smell-sources': smellSources,
    'odour-carriers': odourCarriers,
    'fragrant-spaces': fragrantSpaces,
  },
  graphs: {
    'http://data.odeuropa.eu/eebo': {
      label: 'EEBO',
    },
    'http://data.odeuropa.eu/gutenberg': {
      label: 'Gutenberg',
    },
    'http://data.odeuropa.eu/text-annotation': {
      label: 'Odeuropa Benchmark',
    },
    'http://data.odeuropa.eu/old-bailey-corpus': {
      label: 'Old Bailey Corpus',
    },
    'http://data.odeuropa.eu/royal-society-corpus': {
      label: 'Royal Society Corpus',
    },
  },
  vocabularies: {},
  plugins: {}
};
