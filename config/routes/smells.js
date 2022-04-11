const escapeAll = /["\\\t\n\r\b\f\u0000-\u0019]|[\ud800-\udbff][\udc00-\udfff]/g;
const escapedCharacters = {
  '\\': '\\\\', '"': '\\"', '\t': '\\t',
  '\n': '\\n', '\r': '\\r', '\b': '\\b', '\f': '\\f',
};

// Replaces a character by its escaped version
function characterReplacer(character) {
  // Replace a single character by its escaped version
  let result = escapedCharacters[character];
  if (result === undefined) {
    // Replace a single character with its 4-bit unicode escape sequence
    if (character.length === 1) {
      result = character.charCodeAt(0).toString(16);
      result = '\\u0000'.substr(0, 6 - result.length) + result;
    }
    // Replace a surrogate pair with its 8-bit unicode escape sequence
    else {
      result = ((character.charCodeAt(0) - 0xD800) * 0x400 + character.charCodeAt(1) + 0x2400).toString(16);
      result = '\\U00000000'.substr(0, 10 - result.length) + result;
    }
  }
  return result;
}

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
    const escapedValue = q.replace(escapeAll, characterReplacer);
    return [
      `
      {
        ?search a luc-index:search ;
        luc:query "source_label:${escapedValue}" ;
        luc:entities ?id .
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
      id: 'time',
      isMulti: true,
      isSortable: true,
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?timeLabel',
            label: '?timeLabel',
          },
        ],
        $where: [
          `
          {
            SELECT DISTINCT ?time WHERE {
              ?id a od:L11_Smell .
              ?emission od:F1_generated ?id .
              ?emission od:F3_had_source / crm:P137_exemplifies ?source .
              ?emission time:hasTime ?time .
            }
          }
          ?time rdfs:label ?timeLabel .
          FILTER(LANG(?timeLabel) = "${language}" || LANG(?timeLabel) = "")
          `
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?emission time:hasTime ?time',
        '?time rdfs:label ?timeLabel',
      ],
      filterFunc: (values) => {
        return [values.map((val) => `STR(?timeLabel) = ${JSON.stringify(val)}`).join(' || ')];
      },
    },
    {
      id: 'place',
      isMulti: true,
      isSortable: true,
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?placeLabel',
            label: '?placeLabel',
          },
        ],
        $where: [
          `
          {
            SELECT DISTINCT ?place WHERE {
              ?id a od:L11_Smell .
              ?emission od:F1_generated ?id .
              ?emission od:F3_had_source / crm:P137_exemplifies ?source .

              ?experience od:F2_perceived ?id .
              ?experience crm:P7_took_place_at ?place .
            }
          }
          ?place rdfs:label ?placeLabel .
          FILTER(LANG(?placeLabel) = "${language}" || LANG(?placeLabel) = "")
          `
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?experience od:F2_perceived ?id',
        '?experience crm:P7_took_place_at ?place',
        '?place rdfs:label ?placeLabel',
      ],
      filterFunc: (values) => {
        return [values.map((val) => `STR(?placeLabel) = ${JSON.stringify(val)}`).join(' || ')];
      },
    },
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
        '?experience od:F5_involved_gesture ?gesture',
        '?gesture rdfs:label ?gestureLabel',
      ],
      filterFunc: (values) => {
        return [values.map((val) => `STR(?gestureLabel) = ${JSON.stringify(val)}`).join(' || ')];
      },
    },
  ],
};
