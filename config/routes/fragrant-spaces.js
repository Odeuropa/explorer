module.exports = {
  view: 'odeuropa-vocabulary',
  showInNavbar: true,
  showInHome: true,
  details: {
    view: 'odeuropa-vocabulary-details',
    showPermalink: false,
    excludedMetadata: [],
    route: 'smells',
    query: ({ language }) => ({
      $from: 'http://www.ontotext.com/disable-sameAs', // Prevent returning Wikidata entities
      '@graph': [
        {
          '@id': '?id',
          label: '?label',
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
          ?id skos:prefLabel ?label .
          FILTER(LANG(?label) = "${language}" || LANG(?label) = "")
        }
        UNION
        {
          OPTIONAL {
            ?id schema:image ?image .
          }
        }
        UNION
        {
          OPTIONAL {
            ?id skos:related ?related .
            ?related skos:inScheme <http://data.odeuropa.eu/vocabulary/olfactory-objects> .
            ?related skos:prefLabel ?relatedLabel .
            FILTER(LANG(?relatedLabel) = "${language}" || LANG(?relatedLabel) = "")
          }
        }
        UNION
        {
          ?place crm:P2_has_type ?id .
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
  query: ({ language, params }) => ({
    $from: 'http://www.ontotext.com/disable-sameAs', // Prevent returning Wikidata entities
    '@graph': [
      {
        items: {
          '@id': '?id',
          label: '?bestLabel',
          image: '?image',
          count: '?count',
        },
        dates: '?date',
      },
    ],
    $where: [
      `
      {
        ?id <http://www.w3.org/2004/02/skos/core#inScheme> <http://data.odeuropa.eu/vocabulary/fragrant-spaces> .
        ?place crm:P2_has_type ?id .
        ?emission crm:P7_took_place_at ?place .

        ${
          params.date
            ? `
          ?emission_source crm:P67_refers_to ?emission .
          ?emission_source schema:dateCreated/time:hasBeginning ${JSON.stringify(
            params.date
          )}^^xsd:gYear .
          `
            : ''
        }

        {
          OPTIONAL {
            SELECT DISTINCT ?id (COUNT(DISTINCT ?item) AS ?count) WHERE {
              ?place crm:P137_exemplifies ?id .
              {
                  # Visual items use schema:about
                  ?item crm:P138_represents|schema:about ?place .
              }
              UNION
              {
                  # Textual items use emissions
                  ?emission crm:P7_took_place_at ?place .
                  ?emission od:F1_generated ?item .
              }
            }
            GROUP BY ?id
          }
        }
        UNION
        {
          OPTIONAL { ?id skos:prefLabel ?label_hl . FILTER(LANGMATCHES(LANG(?label_hl), "${language}")) }
          OPTIONAL { ?id skos:prefLabel ?label_unk . FILTER(LANGMATCHES(LANG(?label_unk), "")) }
          OPTIONAL { ?id skos:prefLabel ?label_en . FILTER(LANGMATCHES(LANG(?label_en), "en")) }
          BIND(COALESCE(?label_hl, ?label_unk, ?label_en) AS ?bestKnownLabel)
          OPTIONAL {
              SELECT ?label_default WHERE {
                  ?id skos:prefLabel ?label_default
              }
              ORDER BY ASC(?label_default)
              LIMIT 1
          }
          BIND(COALESCE(?bestKnownLabel, ?label_default) AS ?bestLabel)
        }
        UNION
        {
          OPTIONAL {
            ?id schema:image ?image .
          }
        }
      }
      UNION
      {
        SELECT DISTINCT ?date WHERE {
          ?place crm:P2_has_type ?id .
          { # Nested select because of an issue with GraphDB optimization engine
            SELECT DISTINCT ?emission WHERE {
              ?emission crm:P7_took_place_at ?place .
            }
          }
          ?emission crm:P7_took_place_at ?place .
          ?source crm:P67_refers_to ?emission .
          ?source schema:dateCreated/time:hasBeginning ?date .
        }
      }
      `,
    ],
    $langTag: 'hide',
  }),
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
            ?place crm:P2_has_type ?id .
            ?emission crm:P7_took_place_at ?place .

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
