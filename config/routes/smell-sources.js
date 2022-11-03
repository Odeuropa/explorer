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
          ?emission od:F1_generated ?smell .
          ?emission od:F3_had_source / crm:P137_exemplifies ?id .
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
        ?id skos:inScheme <http://data.odeuropa.eu/vocabulary/olfactory-objects> .
        ?emission od:F3_had_source / crm:P137_exemplifies ?id .

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
          OPTIONAL {
            SELECT DISTINCT ?id (COUNT(DISTINCT ?item) AS ?count) WHERE {
              ?object crm:P137_exemplifies ?id .
              {
                # Textual items
                ?emission od:F3_had_source ?object .
                ?emission od:F1_generated ?item .
                ?source crm:P67_refers_to ?emission .
                ?source a crm:E33_Linguistic_Object .

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
              }
              UNION
              {
                # Visual items
                ?item crm:P138_represents|schema:about ?object .

                ${
                  params.from || params.to
                    ? `
                  ?item schema:dateCreated/time:hasBeginning ?begin .
                  ?item schema:dateCreated/time:hasEnd ?end .
                `
                    : ''
                }
                ${params.from ? `FILTER(?begin >= ${JSON.stringify(params.from)}^^xsd:gYear)` : ''}
                ${params.to ? `FILTER(?end <= ${JSON.stringify(params.to)}^^xsd:gYear)` : ''}
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
          { # Nested select because of an issue with GraphDB optimization engine
            SELECT DISTINCT ?emission WHERE {
                ?emission od:F3_had_source / crm:P137_exemplifies ?id .
            }
          }
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
          '?object crm:P137_exemplifies ?_vocab',
          '?source crm:P138_represents|schema:about ?object',
          '?source crm:P67_refers_to ?emission',
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
