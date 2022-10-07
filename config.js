const texts = require('./config/routes/texts');
const smellSources = require('./config/routes/smell-sources');
const odourCarriers = require('./config/routes/odour-carriers');
const fragrantSpaces = require('./config/routes/fragrant-spaces');
const visuals = require('./config/routes/visuals');

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
    route: 'texts',
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
      crm: 'http://erlangen-crm.org/current/',
      crmsci: 'http://www.ics.forth.gr/isl/CRMsci/',
      dc: 'http://purl.org/dc/elements/1.1/',
      gn: 'http://www.geonames.org/ontology#',
      'luc-index': 'http://www.ontotext.com/connectors/lucene/instance#',
      luc: 'http://www.ontotext.com/connectors/lucene#',
      od: 'http://data.odeuropa.eu/ontology/',
      'olfactory-objects': 'http://data.odeuropa.eu/vocabulary/olfactory-objects/',
      rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
      reo: 'https://read-it.acc.hum.uu.nl/ontology#',
      schema: 'https://schema.org/',
      skos: 'http://www.w3.org/2004/02/skos/core#',
      time: 'http://www.w3.org/2006/time#',
      voc: 'http://data.odeuropa.eu/vocabulary/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    },
    permalinkUrl: (uri) => `https://data.odeuropa.eu/resource?uri=${uri}`,
  },
  routes: {
    texts: texts,
    visuals: visuals,
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
  plugins: {
    'odeuropa-vocabulary': {
      wordCloud: {
        query: () => ({
          '@graph': [
            {
              word: '?adjective',
            },
          ],
          $where: [
            `
            ?emission od:F3_had_source / crm:P137_exemplifies ?id .
            ?emission od:F1_generated ?smell .
            ?assignment a crm:E13_Attribute_Assignment .
            ?assignment crm:P141_assigned/rdfs:label ?adjective .
            ?assignment crm:P140_assigned_attribute_to ?smell .
            `,
          ],
          $langTag: 'hide',
          $limit: 15,
        }),
      },
      visuals: {
        query: () => ({
          '@graph': [
            {
              '@id': '?image',
              label: '?imageLabel',
              image: '?imageUrl',
            },
          ],
          $where: [
            `
            # Visual Items
            ?object crm:P137_exemplifies ?id .
            ?image crm:P138_represents ?object .
            ?image schema:image ?imageUrl .
            FILTER(STRSTARTS(STR(?imageUrl), "https://data.odeuropa.eu"))
            ?image rdfs:label ?imageLabel .
            `,
          ],
          $langTag: 'hide',
        }),
      },
      texts: {
        query: ({ language }) => ({
          '@graph': [
            {
              '@id': '?smell',
              label: '?itemLabel',
              carrier: '?item_carrierLabel',
              gesture: '?item_gestureLabel',
              source: '?item_sourceLabel',
              adjective: '?item_adjective',
              time: '?item_timeLabel',
              place: '?item_placeLabel',
            },
          ],
          $where: [
            `
            ?emission od:F3_had_source / crm:P137_exemplifies ?id .
            ?emission od:F1_generated ?smell .

            # Textual Items
            ?item a crm:E33_Linguistic_Object .
            ?item crm:P67_refers_to ?smell .
            ?item rdfs:label ?itemLabel .

            ?item_emission od:F1_generated ?smell .
            ?item_emission od:F3_had_source / crm:P137_exemplifies ?item_source .
            {
              OPTIONAL {
                ?item_source skos:prefLabel ?item_sourceLabel .
                FILTER(LANG(?item_sourceLabel) = "${language}" || LANG(?item_sourceLabel) = "")
              }
            }
            UNION
            {
              OPTIONAL {
                ?item_emission od:F4_had_carrier ?item_carrier .
                ?item_carrier rdfs:label ?item_carrierLabel .
              }
            }
            UNION
            {
              OPTIONAL {
                ?item_emission time:hasTime ?item_time .
                ?item_time rdfs:label ?item_timeLabel .
              }
            }
            UNION
            {
              OPTIONAL {
                ?item_experience od:F2_perceived ?smell .
                {
                  OPTIONAL {
                    ?item_experience od:F5_involved_gesture ?item_gesture .
                    ?item_gesture rdfs:label ?item_gestureLabel .
                    FILTER(LANG(?item_gestureLabel) = "${language}" || LANG(?item_gestureLabel) = "")
                  }
                }
                UNION
                {
                  OPTIONAL {
                    ?item_experience crm:P7_took_place_at ?item_place .
                    ?item_place rdfs:label ?item_placeLabel .
                  }
                }
              }
            }
            UNION
            {
              OPTIONAL {
                ?item_assignment a crm:E13_Attribute_Assignment .
                ?item_assignment crm:P141_assigned/rdfs:label ?item_adjective .
                ?item_assignment crm:P140_assigned_attribute_to ?smell .
              }
            }
            `,
          ],
          $langTag: 'hide',
        }),
      },
    },
  },
};
