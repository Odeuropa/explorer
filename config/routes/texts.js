const escapeAll = /["\\\t\n\r\b\f\u0000-\u0019]|[\ud800-\udbff][\udc00-\udfff]/g;
const escapedCharacters = {
  '\\': '\\\\',
  '"': '\\"',
  '\t': '\\t',
  '\n': '\\n',
  '\r': '\\r',
  '\b': '\\b',
  '\f': '\\f',
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
      result = (
        (character.charCodeAt(0) - 0xd800) * 0x400 +
        character.charCodeAt(1) +
        0x2400
      ).toString(16);
      result = '\\U00000000'.substr(0, 10 - result.length) + result;
    }
  }
  return result;
}

module.exports = {
  view: 'browse',
  showInNavbar: true,
  showInHome: false,
  uriBase: 'http://data.odeuropa.eu/smell',
  rdfType: ['http://data.odeuropa.eu/ontology/L11_Smell'],
  filterByGraph: true,
  details: {
    view: 'odeuropa-texts',
    showPermalink: true,
    excludedMetadata: ['textualObject', 'image', 'fragment'],
    route: 'texts',
    query: ({ language }) => ({
      '@context': 'http://schema.org/',
      '@graph': [
        {
          '@type': 'http://data.odeuropa.eu/ontology/L11_Smell',
          '@id': '?id',
          '@graph': '?g',
          label: '?label',
          image: '?imageUrl',
          relevantExcerpt: '?relevantExcerpt',
          source: {
            '@id': '?source',
            label: '?sourceLabel',
            url: '?sourceUrl',
            excerpts: {
              '@id': '?excerpt',
              value: '?excerptValue',
            },
            author: {
              '@id': '?sourceAuthor',
              label: '?sourceAuthorLabel',
              sameAs: '?sourceAuthorSameAs',
            },
            date: '?sourceDate',
            genre: {
              '@id': '?sourceGenre',
              label: '?sourceGenreLabel',
            },
            language: '?sourceLanguage',
          },
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
          fragment: {
            '@id': '?fragment',
            x: '?fragmentX',
            y: '?fragmentY',
            width: '?fragmentW',
            height: '?fragmentH',
            label: '?fragmentLabel',
            score: '?fragmentScore',
          },
          about: '?about',
          license: '?license',
        },
      ],
      $where: [
        `
        GRAPH ?g { ?id a od:L11_Smell . }
        ?source crm:P67_refers_to ?id .
        FILTER (NOT EXISTS { ?source rdf:value []})
        {
          OPTIONAL {
            ?id rdfs:label ?label .
          }
        }
        UNION
        {
          OPTIONAL {
            ?source crm:P165_incorporates ?excerpt .
            ?excerpt rdf:value ?excerptValue .
          }
        }
        UNION
        {
          OPTIONAL {
            ?relevantExcerpt crm:P67_refers_to ?id .
            FILTER(?relevantExcerpt != ?source)
          }
        }
        UNION
        {
          OPTIONAL {
            ?source schema:image ?imageUrl .
            FILTER(STRSTARTS(STR(?imageUrl), "https://data.odeuropa.eu"))
          }
        }
        UNION
        {
          ?source ma:hasFragment ?fragment .
          ?fragment nsa:spatialX ?fragmentX .
          ?fragment nsa:spatialY ?fragmentY .
          ?fragment nsa:spatialW ?fragmentW .
          ?fragment nsa:spatialH ?fragmentH .
          ?fragment rdf:value ?fragmentScore .
          ?fragment oa:hasBody/rdfs:label ?fragmentLabel .
        }
        UNION
        {
          ?source schema:about/rdfs:label ?about .
        }
        UNION
        {
          ?source schema:license ?license .
        }
        UNION
        {
          OPTIONAL {
            ?source rdfs:label ?sourceLabel .
          }
        }
        UNION
        {
          OPTIONAL {
            ?source schema:url ?sourceUrl .
          }
        }
        UNION
        {
          OPTIONAL {
            ?source schema:author ?sourceAuthor .
            {
              OPTIONAL {
                ?sourceAuthor rdfs:label ?sourceAuthorLabel .
              }
            }
            UNION
            {
              OPTIONAL {
                GRAPH <http://www.ontotext.com/explicit> {
                  ?sourceAuthor owl:sameAs ?sourceAuthorSameAs .
                }
              }
            }
          }
        }
        UNION
        {
          OPTIONAL {
            ?source schema:dateCreated / rdfs:label ?sourceDate .
          }
        }
        UNION
        {
          OPTIONAL {
            ?source schema:genre ?sourceGenre .
            ?sourceGenre rdfs:label ?sourceGenreLabel .
          }
        }
        UNION
        {
          OPTIONAL {
            ?source schema:inLanguage ?sourceLanguage .
          }
        }
        UNION
        {
          OPTIONAL {
            ?emission od:F1_generated ?id .
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
                ?emission time:hasTime ?time .
                ?time rdfs:label ?timeLabel .
              }
            }
          }
        }
        UNION
        {
          OPTIONAL {
            ?experience od:F2_perceived ?id .
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
            ?assignment crm:P140_assigned_attribute_to ?id .
          }
        }
        `,
      ],
      $langTag: 'hide',
    }),
  },
  textSearchFunc: (q) => {
    const escapedValue = q.replace(escapeAll, characterReplacer);
    return [
      `
      {
        ?search a luc-index:search ;
        luc:query "source_label:${escapedValue} || source_value:${escapedValue}" ;
        luc:entities ?id .
      }
      `,
    ];
  },
  baseWhere: ['GRAPH ?g { ?id a od:L11_Smell }'],
  query: ({ language }) => ({
    '@context': 'http://schema.org/',
    '@graph': [
      {
        '@type': 'http://data.odeuropa.eu/ontology/L11_Smell',
        '@id': '?id',
        '@graph': '?g',
        label: '?label',
        image: '?imageUrl',
        text: '?relevantExcerptValue',
        source: {
          '@id': '?source',
          label: '?sourceLabel',
          url: '?sourceUrl',
          author: {
            '@id': '?sourceAuthor',
            label: '?sourceAuthorLabel',
            sameAs: '?sourceAuthorSameAs',
          },
          date: '?sourceDate',
          genre: {
            '@id': '?sourceGenre',
            label: '?sourceGenreLabel',
          },
          language: '?sourceLanguage',
          location: {
            '@id': '?sourceLocation',
            label: '?sourceLocationName',
          },
        },
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
      GRAPH ?g { ?id a od:L11_Smell . }
      ?source crm:P67_refers_to ?id .

      {
        OPTIONAL {
          ?id rdfs:label ?label .
        }
      }
      UNION
      {
        OPTIONAL {
          ?source rdfs:label ?sourceLabel .
        }
      }
      UNION
      {
        ?source schema:image ?imageUrl .
        FILTER(STRSTARTS(STR(?imageUrl), "https://data.odeuropa.eu"))
      }
      UNION
      {
        OPTIONAL {
          ?source schema:url ?sourceUrl .
        }
      }
      UNION
      {
        OPTIONAL {
          ?source schema:author ?sourceAuthor .
          {
            OPTIONAL {
              ?sourceAuthor rdfs:label ?sourceAuthorLabel .
            }
          }
          UNION
          {
            OPTIONAL {
              GRAPH <http://www.ontotext.com/explicit> {
                ?sourceAuthor owl:sameAs ?sourceAuthorSameAs .
              }
            }
          }
        }
      }
      UNION
      {
        OPTIONAL {
          ?source schema:dateCreated / rdfs:label ?sourceDate .
        }
      }
      UNION
      {
        OPTIONAL {
          ?source schema:genre ?sourceGenre .
          ?sourceGenre rdfs:label ?sourceGenreLabel .
        }
      }
      UNION
      {
        OPTIONAL {
          ?source schema:inLanguage ?sourceLanguage .
        }
      }
      UNION
      {
        OPTIONAL {
          ?source crm:P53_has_former_or_current_location ?sourceLocation .
          ?sourceLocation gn:name ?sourceLocationName .
        }
      }
      UNION
      {
        OPTIONAL {
          ?relevantExcerpt crm:P67_refers_to ?id .
          FILTER(?relevantExcerpt != ?source)
          ?relevantExcerpt rdf:value ?relevantExcerptValue .
        }
      }
      UNION
      {
        OPTIONAL {
          ?emission od:F1_generated ?id .
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
              ?emission time:hasTime ?time .
              ?time rdfs:label ?timeLabel .
            }
          }
        }
      }
      UNION
      {
        OPTIONAL {
          ?experience od:F2_perceived ?id .
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
          ?assignment crm:P140_assigned_attribute_to ?id .
        }
      }
      `,
    ],
    $langTag: 'hide',
  }),
  filters: [
    {
      id: 'time',
      isMulti: true,
      isSortable: {
        reverse: true,
      },
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
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?emission od:F1_generated ?id',
        '?emission time:hasTime ?time',
        '?time rdfs:label ?timeLabel',
      ],
      filterFunc: (val) => `STR(?timeLabel) = ${JSON.stringify(val)}`,
    },
    {
      id: 'place',
      isMulti: true,
      isSortable: false,
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?place',
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
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?experience od:F2_perceived ?id',
        '?experience crm:P7_took_place_at ?place',
      ],
      filterFunc: (val) => `?place = <${val}>`,
    },
    {
      id: 'source',
      isMulti: true,
      isSortable: false,
      condition: 'user-defined',
      query: ({ language }) => ({
        $from: 'http://www.ontotext.com/disable-sameAs', // Prevent returning implicit values
        '@graph': [
          {
            '@id': '?source',
            label: '?sourceLabel',
            altLabel: '?sourceAltLabel',
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
          {
            ?source skos:prefLabel ?sourceLabel .
            FILTER(LANG(?sourceLabel) = "${language}" || LANG(?sourceLabel) = "")
          }
          UNION
          {
            OPTIONAL {
              ?source skos:altLabel ?sourceAltLabel .
              FILTER(LANG(?sourceAltLabel) = "${language}" || LANG(?sourceAltLabel) = "")
            }
          }
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: (index) => [
        '?emission od:F1_generated ?id',
        `?emission od:F3_had_source / crm:P137_exemplifies ?source_${index}`,
      ],
      filterFunc: (val, index) => `?source_${index} = <${val}>`,
    },
    {
      id: 'emotion',
      isMulti: true,
      isSortable: false,
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?emotionType',
            label: '?emotionTypeLabel',
          },
        ],
        $where: [
          `
          ?emotion reo:readP27 ?experience .
          ?emotion crm:P137_exemplifies ?emotionType .
          ?emotionType rdfs:label ?emotionTypeLabel .
          FILTER(LANG(?emotionTypeLabel) = "${language}" || LANG(?emotionTypeLabel) = "")
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?experience od:F2_perceived ?id',
        '?emotion reo:readP27 ?experience',
        '?emotion crm:P137_exemplifies ?emotionType',
      ],
      filterFunc: (val) => `?emotionType = <${val}>`,
    },
    {
      id: 'language',
      isMulti: true,
      isSortable: false,
      query: () => ({
        '@graph': [
          {
            '@id': '?language',
            label: '?language',
          },
        ],
        $where: [
          `
          ?source schema:inLanguage ?language .
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?textualObject crm:P67_refers_to ?id .',
        '?textualObject schema:inLanguage ?language',
      ],
      filterFunc: (val) => `STR(?language) = ${JSON.stringify(val)}`,
    },
    {
      id: 'museum',
      isMulti: true,
      isSortable: false,
      query: () => ({
        '@graph': [
          {
            '@id': '?location',
            label: '?locationName',
          },
        ],
        $where: [
          '?id crm:P53_has_former_or_current_location ?location',
          '?location a gn:Feature',
          '?location gn:name ?locationName',
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?source crm:P67_refers_to ?id',
        '?source crm:P53_has_former_or_current_location ?location',
      ],
      filterFunc: (val) => `?location = <${val}>`,
    },
  ],
};
