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
          label: '?sourceLabel',
          related: {
            '@id': '?related',
            label: '?relatedLabel',
          },
          adjective: '?adjective',
          items: {
            '@id': '?smell',
            label: '?itemLabel',
            carrier: '?item_carrierLabel',
            gesture: '?item_gestureLabel',
            source: '?item_sourceLabel',
            adjective: '?item_adjective',
            time: '?item_timeLabel',
            place: '?item_placeLabel',
          }
        },
      ],
      $where: [
        `
        {
          SELECT DISTINCT ?id ?smell WHERE {
            ?emission od:F1_generated ?smell .
            ?place crm:P2_has_type ?id .
            ?emission crm:P7_took_place_at ?place .
          }
        }

        # Properties
        {
          ?id skos:prefLabel ?sourceLabel .
          FILTER(LANG(?sourceLabel) = "${language}" || LANG(?sourceLabel) = "")
        }
        UNION
        {
          OPTIONAL {
            ?id skos:related ?related .
            ?related skos:prefLabel ?relatedLabel .
            FILTER(LANG(?relatedLabel) = "${language}" || LANG(?relatedLabel) = "")
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
        UNION
        {
          # Items
          OPTIONAL {
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
          }
        }
        `
      ],
      $orderby: 'ASC(?sourceLabel)',
      $langTag: 'hide',
    })
  },
  query: ({ language }) => ({
    '@graph': [
      {
        '@id': '?space',
        label: '?spaceLabel',
      },
    ],
    $where: [
      `
      {
        SELECT DISTINCT ?space WHERE {
          ?space skos:topConceptOf voc:fragrant-spaces .
          ?place crm:P2_has_type ?space .
          ?emission crm:P7_took_place_at ?place .
          ?emission od:F1_generated ?smell .
          ?emission od:F3_had_source / crm:P137_exemplifies ?id .
        }
      }
      {
        ?space skos:prefLabel ?spaceLabel .
        FILTER(LANG(?spaceLabel) = "${language}" || LANG(?spaceLabel) = "")
      }
      `
    ],
    $orderby: 'ASC(?spaceLabel)',
    $langTag: 'hide',
  }),
};
