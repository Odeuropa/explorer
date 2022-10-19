module.exports = {
  view: 'odeuropa-vocabulary',
  showInNavbar: true,
  showInHome: true,
  details: {
    view: 'odeuropa-vocabulary-details',
    showPermalink: false,
    excludedMetadata: [],
    route: 'texts',
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
        {
          SELECT DISTINCT ?emission ?id WHERE {
            ?emission od:F3_had_source / crm:P137_exemplifies ?id .

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
          }
        }
        {
          OPTIONAL {
            SELECT DISTINCT ?id (COUNT(?object) AS ?count) WHERE {
              ?object crm:P137_exemplifies ?id .
            }
            GROUP BY ?id
          }
        }
        UNION
        {
          OPTIONAL { ?id skos:prefLabel ?label_fr . FILTER(LANGMATCHES(LANG(?label_fr), "${language}")) }
          OPTIONAL { ?id skos:prefLabel ?label_unk . FILTER(LANGMATCHES(LANG(?label_unk), "")) }
          OPTIONAL { ?id skos:prefLabel ?label_en . FILTER(LANGMATCHES(LANG(?label_en), "en")) }
          BIND(COALESCE(?label_fr, ?label_unk, ?label_en) AS ?bestKnownLabel)
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
        SELECT DISTINCT ?emission ?date WHERE {
          ?emission od:F3_had_source / crm:P137_exemplifies ?id .
          ?source crm:P67_refers_to ?emission .
          ?source schema:dateCreated/time:hasBeginning ?date .
        }
      }
      `,
    ],
    $orderby: params.order === 'count' ? 'DESC(?count)' : 'ASC(?bestLabel)',
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
              label: '?label',
              smellSource: {
                '@id': '?smellSource',
                label: '?smellSourceLabel',
              },
              carrier: {
                '@id': '?carrier',
                label: '?carrierLabel',
                exemplifies: '?carrierExemplifies',
              },
              time: {
                '@id': '?time',
                label: '?timeLabel',
              },
              place: {
                '@id': '?place',
                label: '?placeLabel',
              },
              adjective: '?adjective',
              emotion: {
                '@id': '?emotion',
                label: '?emotionLabel',
                type: '?emotionType',
              },
            },
          ],
          $where: [
            `
            ?emission od:F3_had_source/crm:P137_exemplifies ?id .
            ?emission od:F1_generated ?smell .
            ?smell crm:P67i_is_referred_to_by/a crm:E33_Linguistic_Object .
            {
              ?smell rdfs:label ?label .
            }
            UNION
            {
              OPTIONAL {
                ?emission od:F4_had_carrier ?carrier .
                ?carrier rdfs:label ?carrierLabel .
                OPTIONAL {
                  ?carrier crm:P137_exemplifies ?carrierExemplifies .
                }
              }
            }
            UNION
            {
              OPTIONAL {
                ?emission od:F3_had_source / crm:P137_exemplifies ?smellSource .
                ?smellSource skos:prefLabel ?smellSourceLabel .
                FILTER(LANG(?smellSourceLabel) = "${language}" || LANG(?smellSourceLabel) = "")
              }
            }
            UNION
            {
              OPTIONAL {
                ?emission time:hasTime ?time .
                ?time rdfs:label ?timeLabel .
              }
            }
            UNION
            {
              OPTIONAL {
                ?experience od:F2_perceived ?smell .
                {
                  OPTIONAL {
                    ?experience od:F5_involved_gesture ?gesture .
                    ?gesture rdfs:label ?gestureLabel .
                    FILTER(LANG(?gestureLabel) = "${language}" || LANG(?gestureLabel) = "")
                  }
                }
                UNION
                {
                  OPTIONAL {
                    ?experience crm:P7_took_place_at ?place .
                    ?place rdfs:label ?placeLabel .
                  }
                }
                UNION
                {
                  OPTIONAL {
                    ?emotion reo:readP27 ?experience .
                    OPTIONAL {
                      ?emotion rdfs:label ?emotionLabel .
                      ?emotion crm:P137_exemplifies / skos:prefLabel ?emotionType .
                    }
                  }
                }
              }
            }
            UNION
            {
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
    },
  },
};
