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
    textSearchQuery: {
      '@graph': [
        {
          '@id': '?id',
          '@type': '?rdfType',
          label: '?label',
        },
      ],
      $where: [
        '?id a ?rdfType',
        '?id ?labelType ?label',
      ],
      $values: {
        '?rdfType': [
          'ebucore:PublicationChannel',
          'ebucore:Collection',
          'ebucore:TVProgramme',
          'ebucore:RadioProgramme'
        ],
        '?labelType': [
          'ebucore:title',
          'ebucore:publicationChannelName'
        ]
      },
      $langTag: 'hide',
    },
    allowImageSearch: false,
    placeholderImage: '/images/placeholder.jpg',
    languages: {
      en: 'English',
      fr: 'Français',
    },
    defaultLanguage: 'en',
  },
  api: {
    endpoint: 'http://data.odeuropa.eu/repositories/odeuropa',
    prefixes: {
      'crm': 'http://erlangen-crm.org/current/',
      'crmsci': 'http://www.ics.forth.gr/isl/CRMsci/',
      'dc': 'http://purl.org/dc/elements/1.1/',
      'gn': 'http://www.geonames.org/ontology#',
      'od': 'http://data.odeuropa.eu/ontology/',
      'reo': 'https://read-it.acc.hum.uu.nl/ontology#',
      'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
      'reo': 'https://read-it.acc.hum.uu.nl/ontology#',
      'schema': 'http://schema.org/',
      'skos': 'http://www.w3.org/2004/02/skos/core#',
      'time': 'http://www.w3.org/2006/time#',
      'xsd': 'http://www.w3.org/2001/XMLSchema#',
    }
  },
  routes: {
    'smells': smells,
    'smell-sources': smellSources,
    'odour-carriers': odourCarriers,
    'fragrant-spaces': fragrantSpaces,
  },
  graphs: {},
  vocabularies: {},
  plugins: {}
};
