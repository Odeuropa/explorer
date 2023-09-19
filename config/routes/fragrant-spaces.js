module.exports = {
  view: 'odeuropa-vocabulary',
  uriBase: 'http://data.odeuropa.eu/vocabulary/fragrant-spaces',
  showInNavbar: true,
  showInHome: true,
  details: {
    view: 'odeuropa-vocabulary-details',
    showPermalink: false,
    excludedMetadata: [],
    route: 'smells',
    query: ({ language }) => ({
      '@graph': [
        {
          '@id': '?id',
          label: '?bestLabel',
          image: '?image',
          related: {
            '@id': '?related',
            label: '?relatedLabel',
          },
        },
      ],
      $where: [
        `
        {
          OPTIONAL { ?id skos:prefLabel ?label_hl . FILTER(LANGMATCHES(LANG(?label_hl), "${language}")) }
          OPTIONAL { ?id skos:prefLabel ?label_en . FILTER(LANGMATCHES(LANG(?label_en), "en")) }
          OPTIONAL {
            SELECT ?id ?label_default WHERE {
              ?id skos:prefLabel ?label_default
            }
            ORDER BY ASC(?label_default)
            LIMIT 1
          }
          BIND(COALESCE(?label_hl, ?label_en, ?label_default) AS ?bestLabel)
        }
        {
          OPTIONAL {
            ?id schema:image ?image .
          }
        }
        {
          OPTIONAL {
            ?id skos:related ?related .
            ?related skos:inScheme <http://data.odeuropa.eu/vocabulary/olfactory-objects> .
            ?related skos:prefLabel ?relatedLabel .
            FILTER(LANG(?relatedLabel) = "${language}" || LANG(?relatedLabel) = "")
          }
        }
        {
          ?place crm:P137_exemplifies ?id .
          ?emission crm:P7_took_place_at ?place .
          ?emission od:F1_generated ?smell .
          OPTIONAL {
            ?assignment a crm:E13_Attribute_Assignment .
            ?assignment crm:P141_assigned/rdfs:label ?adjective .
            ?assignment crm:P140_assigned_attribute_to ?smell .
          }
        }
        `,
      ],
      $langTag: 'hide',
    }),
  },
  query: ({ language }) => ({
    '@graph': [
      {
        '@id': '?id',
        label: '?bestLabel',
        image: '?image',
        count: '?count',
      },
    ],
    $where: [
      `
      ?id skos:inScheme <http://data.odeuropa.eu/vocabulary/fragrant-spaces> .
      FILTER EXISTS { [] crm:P137_exemplifies ?id . }
      {
        SELECT DISTINCT ?id (COUNT(DISTINCT ?place) AS ?count) WHERE {
          ?place crm:P137_exemplifies ?id .
        }
        GROUP BY ?id
      }
      UNION
      {
        OPTIONAL { ?id skos:prefLabel ?label_hl . FILTER(LANGMATCHES(LANG(?label_hl), "${language}")) }
        OPTIONAL { ?id skos:prefLabel ?label_en . FILTER(LANGMATCHES(LANG(?label_en), "en")) }
        OPTIONAL {
          SELECT ?id ?label_default WHERE {
            ?id skos:prefLabel ?label_default
          }
          ORDER BY ASC(?label_default)
          LIMIT 1
        }
        BIND(COALESCE(?label_hl, ?label_en, ?label_default) AS ?bestLabel)
      }
      UNION
      {
        OPTIONAL {
          ?id schema:image ?image .
        }
      }
      `,
    ],
    $langTag: 'hide',
  }),
  plugins: {
    'odeuropa-vocabulary': {
      wordCloud: {
        query: () => {
          const $where = [
            `
            ?place crm:P137_exemplifies ?id .
            ?emission crm:P7_took_place_at ?place .
            ?emission od:F1_generated ?smell .
            ?assignment a crm:E13_Attribute_Assignment .
            ?assignment crm:P141_assigned/rdfs:label ?adjective .
            ?assignment crm:P140_assigned_attribute_to ?smell .
            `,
          ];
          return {
            '@graph': [
              {
                word: '?adjective',
              },
            ],
            $where,
            $langTag: 'hide',
            $limit: 15,
          };
        },
      },
      visuals: {
        route: 'smells',
        baseWhere: [
          '?emission od:F1_generated ?id',
          '?source crm:P67_refers_to ?emission',
          '?source schema:about ?place',
          '?place crm:P137_exemplifies ?_vocab',
        ],
      },
      texts: {
        route: 'smells',
        baseWhere: [
          '?place crm:P137_exemplifies ?_vocab',
          '?emission crm:P7_took_place_at ?place',
          '?emission od:F1_generated ?id',
          '?source crm:P67_refers_to ?id',
          '?source a crm:E33_Linguistic_Object',
        ],
      },
    },
  },
};
