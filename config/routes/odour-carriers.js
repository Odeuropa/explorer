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
  query: ({ language }) => ({
    $from: 'http://www.ontotext.com/disable-sameAs', // Prevent returning Wikidata entities
    '@graph': [
      {
        '@id': '?id',
        label: '?sourceLabel',
      },
    ],
    $where: [
      `
      {
        SELECT DISTINCT ?id WHERE {
          olfactory-objects:carrier skos:member ?id .
          ?source crm:P2_has_type ?id .
        }
      }
      {
        ?id skos:prefLabel ?sourceLabel .
        FILTER(LANG(?sourceLabel) = "${language}" || LANG(?sourceLabel) = "")
      }
      `,
    ],
    $orderby: 'ASC(?sourceLabel)',
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
            ?emission od:F3_had_source/crm:P137_exemplifies ?id .

            ?emission od:F1_generated ?smell .
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
