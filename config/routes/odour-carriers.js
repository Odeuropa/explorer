module.exports = {
  view: 'odeuropa-vocabulary',
  uriBase: 'http://data.odeuropa.eu/vocabulary/olfactory-objects',
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
          OPTIONAL { ?id skos:prefLabel ?label_hl . FILTER(LANGMATCHES(LANG(?label_hl), "${language}")) }
          OPTIONAL { ?id skos:prefLabel ?label_en . FILTER(LANGMATCHES(LANG(?label_en), "en")) }
          OPTIONAL {
            SELECT ?label_default WHERE {
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
          ?object crm:P137_exemplifies ?id .
          OPTIONAL {
            ?emission od:F3_had_source ?object .
            ?emission od:F1_generated ?smell .
            OPTIONAL {
              ?assignment a crm:E13_Attribute_Assignment .
              ?assignment crm:P141_assigned/rdfs:label ?adjective .
              ?assignment crm:P140_assigned_attribute_to ?smell .
            }
          }
        }
        `,
      ],
      $langTag: 'hide',
    }),
  },
  query: ({ language, params }) => ({
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
      {
        olfactory-objects:carrier skos:member ?id .
        ?emission od:F4_had_carrier / crm:P137_exemplifies ?id .

        {
          OPTIONAL {
            SELECT DISTINCT ?id (COUNT(DISTINCT ?smell) AS ?count) WHERE {
              ?emission od:F1_generated ?smell .

              ${
                params.from || params.to
                  ? `
                ?emission_source crm:P67_refers_to ?emission .
                ?emission_source schema:dateCreated/time:hasBeginning ?begin .
                ?emission_source schema:dateCreated/time:hasEnd ?end .
              `
                  : ''
              }
              ${params.from ? `FILTER(?begin >= ${JSON.stringify(params.from)}^^xsd:gYear)` : ''}
              ${params.to ? `FILTER(?end <= ${JSON.stringify(params.to)}^^xsd:gYear)` : ''}

              {
                # Textual items
                ?emission od:F3_had_source ?object .
                ?object crm:P137_exemplifies ?id .
              }
              UNION
              {
                # Visual items
                ?source crm:P67_refers_to ?emission .
                ?source crm:P138_represents|schema:about ?object .
                ?object crm:P137_exemplifies ?id .
              }
            }
            GROUP BY ?id
          }
        }
        UNION
        {
          OPTIONAL { ?id skos:prefLabel ?label_hl . FILTER(LANGMATCHES(LANG(?label_hl), "${language}")) }
          OPTIONAL { ?id skos:prefLabel ?label_en . FILTER(LANGMATCHES(LANG(?label_en), "en")) }
          OPTIONAL {
            SELECT ?label_default WHERE {
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
      }
      `,
    ],
    $langTag: 'hide',
  }),
  plugins: {
    'odeuropa-vocabulary': {
      dates: {
        query: () => ({
          '@graph': [
            {
              date: '?date',
            },
          ],
          $where: [
            `
            olfactory-objects:carrier skos:member ?id .
            { # Nested select because of an issue with GraphDB optimization engine
              SELECT DISTINCT ?emission WHERE {
                  ?emission od:F4_had_carrier / crm:P137_exemplifies ?id .
              }
            }
            ?source crm:P67_refers_to ?emission .
            ?source schema:dateCreated/time:hasBeginning ?date .
            `,
          ],
        }),
      },
      wordCloud: {
        query: () => ({
          '@graph': [
            {
              word: '?adjective',
            },
          ],
          $where: [
            `
            ?emission od:F3_had_source/crm:P137_exemplifies ?id .

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
          '?source crm:P138_represents|schema:about ?object',
          '?object crm:P137_exemplifies ?_vocab',
        ],
      },
      texts: {
        route: 'smells',
        baseWhere: [
          '?emission od:F3_had_source/crm:P137_exemplifies ?_vocab',
          '?emission od:F1_generated ?id',
          '?source crm:P67_refers_to ?id',
          '?source a crm:E33_Linguistic_Object',
        ],
      },
    },
  },
};
