module.exports = {
  view: 'browse',
  showInNavbar: true,
  showInHome: false,
  uriBase: 'http://data.odeuropa.eu/Smell',
  rdfType: ['http://data.odeuropa.eu/ontology/L11_Smell'],
  filterByGraph: false,
  details: {
    view: 'odeuropa-details',
    showPermalink: false,
    excludedMetadata: [],
    route: 'smells',
  },
  textSearchFunc: (q) => {
    const quotedValue = JSON.stringify(q);
    return [
      `
      {
        # TODO: search query (using lucene?)
      }
      `
    ]
  },
  baseWhere: [
    'GRAPH ?g { ?id a od:L11_Smell }',
    '?emission od:F1_generated ?id',
    '?emission od:F3_had_source / crm:P137_exemplifies ?source'
  ],
  // metadata: {
  //   publicationStartDateTime: (value) => {
  //     return new Date(value).toLocaleDateString();
  //   },
  // },
  query: ({ language }) => ({
    '@context': 'http://schema.org/',
      '@graph': [
        {
          '@type': 'http://data.odeuropa.eu/ontology/L11_Smell',
          '@id': '?id',
          '@graph': '?g',
          label: '?sourceLabel',
          carrier: '?carrierLabel',
          gesture: '?gestureLabel',
          source: '?sourceLabel',
          adjective: '?adjective',
          time: '?timeLabel',
          place: '?placeLabel',
        }
      ],
      $where: [
        `
        GRAPH ?g { ?id a od:L11_Smell . }
        ?emission od:F1_generated ?id .
        ?emission od:F3_had_source / crm:P137_exemplifies ?source .

        {
          OPTIONAL {
            ?source skos:prefLabel ?sourceLabel .
            FILTER(LANG(?sourceLabel) = "${language}" || LANG(?sourceLabel) = "")
          }
        }
        UNION
        {
          OPTIONAL {
            ?emission od:F4_had_carrier ?carrier .
            ?carrier rdfs:label ?carrierLabel .
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
            ?experience od:F2_perceived ?id .
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
          }
        }
        UNION
        {
          OPTIONAL {
            ?assignment a crm:E13_Attribute_Assignment .
            ?assignment crm:P141_assigned ?adjective .
            ?assignment crm:P140_assigned_attribute_to ?id .
          }
        }
        `
      ],
      $langTag: 'hide',
  }),
  filters: [
    {
      id: 'source',
      isMulti: true,
      isSortable: true,
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?sourceLabel',
            label: '?sourceLabel',
          },
        ],
        $where: [
          `
          {
            SELECT DISTINCT ?source WHERE {
              ?emission od:F1_generated ?smell .
              ?emission od:F3_had_source / crm:P137_exemplifies ?source .
            }
          }
          ?source skos:prefLabel ?sourceLabel .
          FILTER(LANG(?sourceLabel) = "${language}" || LANG(?sourceLabel) = "")
          `
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?emission od:F1_generated ?id',
        '?emission od:F3_had_source / crm:P137_exemplifies ?source',
        '?source skos:prefLabel ?sourceLabel'
      ],
      filterFunc: (values) => {
        return [values.map((val) => `STR(?sourceLabel) = ${JSON.stringify(val)}`).join(' || ')];
      },
    },
    {
      id: 'carrier',
      isMulti: true,
      isSortable: true,
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?carrierLabel',
            label: '?carrierLabel',
          },
        ],
        $where: [
          `
          {
            SELECT DISTINCT ?carrier WHERE {
              ?emission od:F1_generated ?smell .
              ?emission od:F3_had_source / crm:P137_exemplifies ?source .

              ?emission od:F4_had_carrier ?carrier .
            }
          }
          ?carrier rdfs:label ?carrierLabel .
          FILTER(LANG(?carrierLabel) = "${language}" || LANG(?carrierLabel) = "")
          `
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?emission od:F1_generated ?id',
        '?emission od:F4_had_carrier ?carrier',
        '?carrier rdfs:label ?carrierLabel',
      ],
      filterFunc: (values) => {
        return [values.map((val) => `STR(?carrierLabel) = ${JSON.stringify(val)}`).join(' || ')];
      },
    },
    {
      id: 'gesture',
      isMulti: true,
      isSortable: true,
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?gestureLabel',
            label: '?gestureLabel',
          },
        ],
        $where: [
          `
          {
            SELECT DISTINCT ?gesture WHERE {
              ?experience od:F2_perceived ?smell .
              ?emission od:F1_generated ?smell .
              ?emission od:F3_had_source / crm:P137_exemplifies ?source .

              ?experience od:F5_involved_gesture ?gesture .
            }
          }
          ?gesture rdfs:label ?gestureLabel .
          FILTER(LANG(?gestureLabel) = "${language}" || LANG(?gestureLabel) = "")
          `
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?experience od:F2_perceived ?id',
        '?experience od:F5_involved_gesture ?gesture',
        '?gesture rdfs:label ?gestureLabel',
      ],
      filterFunc: (values) => {
        return [values.map((val) => `STR(?gestureLabel) = ${JSON.stringify(val)}`).join(' || ')];
      },
    },
  ],
};
