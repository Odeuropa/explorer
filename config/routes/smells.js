const escapeAll = /['\\\t\n\r\b\f\u0000-\u0019]|[\ud800-\udbff][\udc00-\udfff]/g;
const escapedCharacters = {
  '\\': '\\\\',
  "'": "\\'",
  '"': '"',
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
  view: 'odeuropa-browse',
  showInNavbar: true,
  showInHome: false,
  uriBase: 'http://data.odeuropa.eu/smell',
  rdfType: ['http://data.odeuropa.eu/ontology/L11_Smell'],
  filterByGraph: false,
  hideFilterButton: true,
  orderByVariable: null,
  countResults: true,
  details: {
    view: 'odeuropa-texts',
    showPermalink: true,
    excludedMetadata: ['image', 'fragment'],
    route: 'smells',
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
              words: '?excerptWord',
            },
            author: {
              '@id': '?sourceAuthor',
              label: '?sourceAuthorLabel',
              sameAs: '?sourceAuthorSameAs',
            },
            artist: {
              '@id': '?sourceArtist',
              label: '?sourceArtistLabel',
              sameAs: '?sourceArtistSameAs',
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
            begin: '?timeBegin',
            end: '?timeEnd',
          },
          place: {
            '@id': '?place',
            label: '?placeLabel',
          },
          adjective: '?adjective',
          emotion: {
            '@id': '?emotion',
            label: '?emotionLabel',
            type: {
              '@id': '?emotionType',
              label: '?emotionTypeLabel',
            },
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
            OPTIONAL {
              ?excerpt crm:P106_is_composed_of ?excerptWord .
            }
            OPTIONAL {
              ?excerpt rdf:value ?excerptValue .
            }
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
          ?fragment oa:hasBody/skos:prefLabel ?fragmentLabel .
          FILTER(LANG(?fragmentLabel) = "${language}" || LANG(?sourceLabel) = "")
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
            ?source schema:artist ?sourceArtist .
            {
              OPTIONAL {
                ?sourceArtist rdfs:label ?sourceArtistLabel .
              }
            }
            UNION
            {
              OPTIONAL {
                GRAPH <http://www.ontotext.com/explicit> {
                  ?sourceArtist owl:sameAs ?sourceArtistSameAs .
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
                ?emission od:F3_had_source ?smellSource .
                ?smellSource skos:prefLabel ?smellSourceLabel .
                FILTER(LANG(?smellSourceLabel) = "${language}" || LANG(?smellSourceLabel) = "")
              }
            }
            UNION
            {
              OPTIONAL {
                ?emission od:F4_had_carrier ?carrier .
                OPTIONAL { ?carrier skos:prefLabel ?carrierLabel_hl . FILTER(LANGMATCHES(LANG(?carrierLabel_hl), "${language}")) }
                OPTIONAL { ?carrier skos:prefLabel ?carrierLabel_en . FILTER(LANGMATCHES(LANG(?carrierLabel_en), "en")) }
                OPTIONAL { ?carrier rdfs:label ?carrierLabel_original . }
                OPTIONAL { BIND(COALESCE(?carrierLabel_hl, ?carrierLabel_en, ?carrierLabel_original) AS ?carrierLabel) }
                OPTIONAL {
                  BIND(?carrier as ?carrierExemplifies)
                  FILTER EXISTS { ?carrier skos:inScheme [] }
                }
              }
            }
            UNION
            {
              OPTIONAL {
                ?emission time:hasTime ?time .
                ?time rdfs:label ?timeLabel .
                ?time time:hasBeginning ?timeBegin .
                ?time time:hasEnd ?timeEnd .
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
                ?place gn:name|rdfs:label ?placeLabel .
              }
            }
            UNION
            {
              OPTIONAL {
                ?emotion reo:readP27 ?experience .
                OPTIONAL {
                  OPTIONAL { ?emotion skos:prefLabel ?emotionLabel . FILTER(LANGMATCHES(LANG(?emotionLabel), "${language}")) }
                  OPTIONAL { ?emotion skos:prefLabel ?emotionLabel . FILTER(LANG(?emotionLabel) = "en") }
                  OPTIONAL { ?emotion rdfs:label ?emotionLabel . }
                }
                OPTIONAL {
                  ?emotion crm:P2_has_type ?emotionType .
                  ?emotionType skos:prefLabel ?emotionTypeLabel .
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
  textSearchOptions: ['title', 'content', 'all'],
  textSearchDefaultOption: 'all',
  textSearchFunc: (q, option) => {
    const escapedValue = q.replace(escapeAll, characterReplacer);
    const lucQuery = [];
    if (!option || option === 'title' || option === 'all') {
      lucQuery.push(`source_label:(${escapedValue})`);
    }
    if (!option || option === 'content' || option === 'all') {
      lucQuery.push(`source_value:(${escapedValue})`);
    }
    return [
      `
      {
        ?search a luc-index:search ;
        luc:query '${lucQuery.join(' || ')}' ;
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
          artist: {
            '@id': '?sourceArtist',
            label: '?sourceArtistLabel',
            sameAs: '?sourceArtistSameAs',
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
            lat: '?sourceLocationLat',
            long: '?sourceLocationLong',
          },
          createdLocation: {
            '@id': '?sourceCreatedLocation',
            label: '?sourceCreatedLocationName',
            lat: '?sourceCreatedLocationLat',
            long: '?sourceCreatedLocationLong',
          },
        },
        smellSource: {
          '@id': '?smellSource',
          label: '?smellSourceLabel',
        },
        carrier: {
          '@id': '?carrier',
          label: '?carrierLabel',
        },
        time: {
          '@id': '?time',
          label: '?timeLabel',
          begin: '?timeBegin',
          end: '?timeEnd',
        },
        place: {
          '@id': '?place',
          label: '?placeLabel',
        },
        adjective: '?adjective',
        emotion: {
          '@id': '?emotion',
          label: '?emotionLabel',
          type: {
            '@id': '?emotionType',
            label: '?emotionTypeLabel',
          },
        },
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
          ?source schema:artist ?sourceArtist .
          {
            OPTIONAL {
              ?sourceArtist rdfs:label ?sourceArtistLabel .
            }
          }
          UNION
          {
            OPTIONAL {
              GRAPH <http://www.ontotext.com/explicit> {
                ?sourceArtist owl:sameAs ?sourceArtistSameAs .
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
          OPTIONAL {
            ?sourceLocation wgs:lat ?sourceLocationLat .
            ?sourceLocation wgs:long ?sourceLocationLong .
          }
        }
      }
      UNION
      {
        OPTIONAL {
          ?source schema:locationCreated ?sourceCreatedLocation .
          ?sourceCreatedLocation gn:name ?sourceCreatedLocationName .
          OPTIONAL {
            ?sourceCreatedLocation wgs:lat ?sourceCreatedLocationLat .
            ?sourceCreatedLocation wgs:long ?sourceCreatedLocationLong .
          }
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
              ?emission od:F3_had_source ?smellSource .
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
              ?time time:hasBeginning ?timeBegin .
              ?time time:hasEnd ?timeEnd .
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
              ?place gn:name|rdfs:label ?placeLabel .
            }
          }
          UNION
          {
            OPTIONAL {
              ?emotion reo:readP27 ?experience .
              OPTIONAL {
                OPTIONAL { ?emotion skos:prefLabel ?emotionLabel . FILTER(LANGMATCHES(LANG(?emotionLabel), "${language}")) }
                OPTIONAL { ?emotion skos:prefLabel ?emotionLabel . FILTER(LANG(?emotionLabel) = "en") }
                OPTIONAL { ?emotion rdfs:label ?emotionLabel . }
              }
              OPTIONAL {
                ?emotion crm:P2_has_type ?emotionType .
                ?emotionType skos:prefLabel ?emotionTypeLabel .
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
      id: 'type',
      isBeforeTextSearch: true,
      isToggle: true,
      style: {
        paddingBottom: 24,
        borderBottom: '1px solid #b5afbe',
      },
      values: [
        { label: 'In text', value: 'text' },
        { label: 'In images', value: 'image' },
        { label: 'Both', value: '' },
      ],
      defaultOption: 2,
      whereFunc: (val) => {
        if (val === 'text') {
          return ['?source crm:P67_refers_to ?id', '?source a crm:E33_Linguistic_Object'];
        } else if (val === 'image') {
          return ['?source crm:P67_refers_to ?id', '?source a crm:E36_Visual_Item'];
        }
        return [];
      },
    },
    {
      id: 'search-by-concept',
      style: {
        fontWeight: 'bold',
        marginTop: 24,
        borderTop: '1px solid #b5afbe',
      },
    },
    {
      id: 'source',
      isMulti: true,
      isSortable: false,
      condition: 'user-defined',
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?source',
            label: '?sourceLabel',
            altLabel: '?sourceAltLabel',
          },
        ],
        $where: [
          `
          FILTER EXISTS {
            ?emission od:F1_generated [] .
            ?emission od:F3_had_source ?source .
            ?source skos:inScheme [] .
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
      whereFunc: (val, index) => [
        `
        ?emission od:F1_generated ?id .
        ?emission od:F3_had_source / skos:broader* ?source_${index} .
        VALUES ?source_${index} { <${val}> }
        `,
      ],
    },
    {
      id: 'carrier',
      isMulti: true,
      isSortable: false,
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?carrier',
            label: '?carrierLabel',
          },
        ],
        $where: [
          `
          [] od:F4_had_carrier ?carrier .
          FILTER EXISTS { olfactory-objects:carrier skos:member ?carrier }
          ?carrier skos:prefLabel ?carrierLabel .
          FILTER(LANG(?carrierLabel) = "${language}" || LANG(?carrierLabel) = "")
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: (val, index) => [
        `
        ?emission od:F1_generated ?id .
        ?emission od:F4_had_carrier ?carrier_${index} .
        VALUES ?carrier_${index} { <${val}> }
        `,
      ],
    },
    {
      id: 'quality',
      isMulti: true,
      isSortable: false,
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?quality',
            label: '?qualityLabel',
          },
        ],
        $where: [
          `
          FILTER EXISTS {
            ?quality ^crm:P141_assigned / crm:P140_assigned_attribute_to ?id .
            ?quality skos:inScheme [] .
          }
          OPTIONAL { ?quality skos:prefLabel ?qualityLabel FILTER(LANGMATCHES(LANG(?qualityLabel), "${language}")) }
          OPTIONAL { ?quality skos:prefLabel ?qualityLabel FILTER(LANGMATCHES(LANG(?qualityLabel), "en")) }
          OPTIONAL { ?quality skos:prefLabel ?qualityLabel }
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: (val, index) => [
        `
        ?id ^crm:P140_assigned_attribute_to / crm:P141_assigned ?quality_${index} .
        VALUES ?quality_${index} { <${val}> }
        `,
      ],
    },
    {
      id: 'emotion',
      isMulti: true,
      isSortable: false,
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?emotion',
            label: '?emotionLabel',
          },
        ],
        $where: [
          `
          FILTER EXISTS { ?emotion reo:readP27 [] }
          OPTIONAL { ?emotion skos:prefLabel ?emotionLabel FILTER(LANGMATCHES(LANG(?emotionLabel), "${language}")) }
          OPTIONAL { ?emotion skos:prefLabel ?emotionLabel FILTER(LANGMATCHES(LANG(?emotionLabel), "en")) }
          OPTIONAL { ?emotion skos:prefLabel ?emotionLabel }
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: (val, index) => [
        `
        ?emotion_${index} reo:readP27 / od:F2_perceived ?id .
        VALUES ?emotion_${index} { <${val}> }
        `,
      ],
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
          [] schema:inLanguage ?language .
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: (val) => [
        `
        ?id ^crm:P67_refers_to / schema:inLanguage ?language .
        VALUES ?language { ${JSON.stringify(val)} }
        `,
      ],
    },
    {
      id: 'time',
      placeholder: 'time-start',
      isAutocomplete: false,
      isMulti: false,
      isSortable: {
        reverse: true,
        variable: 'timeBegin',
      },
      inputProps: {
        type: 'number',
      },
      query: () => ({
        '@graph': [
          {
            '@id': '?timeBegin',
            label: '?timeBegin',
          },
        ],
        $where: [
          `
          ?emission time:hasTime ?time .
          ?time time:hasBeginning ?timeBegin .
          FILTER EXISTS {
            ?id a od:L11_Smell .
            ?emission od:F1_generated ?id .
            ?emission od:F3_had_source ?source .
          }
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?emission od:F1_generated ?id',
        '?emission time:hasTime ?time',
        '?time time:hasBeginning ?timeBegin',
      ],
      filterFunc: (val) => `?timeBegin >= ${JSON.stringify(val)}^^xsd:gYear`,
    },
    {
      id: 'time-end',
      placeholder: 'time-end',
      hideLabel: true,
      isAutocomplete: false,
      inputProps: {
        type: 'number',
      },
      query: () => ({
        '@graph': [
          {
            '@id': '?timeEnd',
            label: '?timeEnd',
          },
        ],
        $where: [
          `
          ?emission time:hasTime ?time .
          ?time time:hasEnd ?timeEnd .
          FILTER EXISTS {
            ?id a od:L11_Smell .
            ?emission od:F1_generated ?id .
            ?emission od:F3_had_source ?source .
          }
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?emission od:F1_generated ?id',
        '?emission time:hasTime ?time',
        '?time time:hasEnd ?timeEnd',
      ],
      filterFunc: (val) => `?timeEnd <= ${JSON.stringify(val)}^^xsd:gYear`,
    },
    {
      id: 'time-period',
      isMulti: true,
      placeholder: 'time-period',
      hideLabel: true,
      values: [
        { label: '15th century', value: 1400, key: 'fifteenth-century' },
        { label: '16th century', value: 1500, key: 'sixteenth-century' },
        { label: '17th century', value: 1600, key: 'seventeenth-century' },
        { label: '18th century', value: 1700, key: 'eighteenth-century' },
        { label: '19th century', value: 1800, key: 'nineteenth-century' },
        { label: '20th century', value: 1900, key: 'twentieth-century' },
      ],
      whereFunc: () => [
        `
        ?emission time:hasTime ?time .
        ?time time:hasBeginning ?timeBegin .
        ?time time:hasEnd ?timeEnd .
        FILTER EXISTS {
            ?id a od:L11_Smell .
            ?emission od:F1_generated ?id .
            ?emission od:F3_had_source ?source .
        }
        `,
      ],
      filterFunc: (val) =>
        `?timeBegin >= ${JSON.stringify(
          parseInt(val, 10).toString()
        )}^^xsd:gYear && ?timeEnd <= ${JSON.stringify(
          (parseInt(val, 10) + 99).toString()
        )}^^xsd:gYear`,
    },
    {
      id: 'time-season',
      isMulti: true,
      placeholder: 'time-season',
      hideLabel: true,
      values: [
        { label: 'Winter', value: 'winter' },
        { label: 'Spring', value: 'spring' },
        { label: 'Summer', value: 'summer' },
        { label: 'Autumn', value: 'autumn' },
      ],
      whereFunc: () => [
        `
        ?time time:hasBeginning ?timeBegin .
        FILTER EXISTS {
            ?id a od:L11_Smell .
            ?emission od:F1_generated ?id .
            ?emission od:F3_had_source ?source .
            ?emission time:hasTime ?time .
        }
        `,
      ],
      filterFunc: (val) => {
        if (val === 'winter') return `MONTH(?timeBegin) IN (12, 1, 2)`; // December, January, February
        if (val === 'spring') return `MONTH(?timeBegin) IN (3, 4, 5)`; // March, April, May
        if (val === 'summer') return `MONTH(?timeBegin) IN (6, 7, 8)`; // June, July, August
        if (val === 'autumn') return `MONTH(?timeBegin) IN (9, 10, 11)`; // September, October, November
        return '';
      },
    },
    {
      id: 'place',
      isMulti: true,
      isSortable: false,
      query: () => ({
        '@graph': [
          {
            '@id': '?country',
            label: '?countryName',
          },
        ],
        $where: [
          `
          FILTER EXISTS {
            ?id a od:L11_Smell .
            ?experience od:F2_perceived ?id .
          }
          ?experience crm:P7_took_place_at / gn:parentCountry ?country .
          ?country gn:name ?countryName .
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: (val, index) => [
        `
        ?placeCountry_${index} ^gn:parentCountry / ^ crm:P7_took_place_at / od:F2_perceived ?id .
        VALUES ?placeCountry_${index} { <${val}> }
        `,
      ],
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
          `
          FILTER EXISTS {
            ?id crm:P53_has_former_or_current_location ?location .
            ?location a gn:Feature
          }
          ?location gn:name ?locationName .
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: (val, index) => [
        `
        ?location_${index} ^crm:P53_has_former_or_current_location / crm:P67_refers_to ?id .
        VALUES ?location_${index} { <${val}> }
        `,
      ],
    },
    {
      id: 'graphs',
      isMulti: true,
      isSortable: false,
      query: () => ({
        '@graph': [
          {
            '@id': '?g',
            label: '?label',
          },
        ],
        $where: ['?g a dcmi:Dataset', '?g rdfs:label ?label'],
        $orderby: 'ASC(?label)',
        $langTag: 'hide',
      }),
      whereFunc: (val) => [
        `
        VALUES ?g { <${val}> }
        `,
      ],
    },
    {
      id: 'space',
      isHidden: true,
      isMulti: true,
      isSortable: false,
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?space',
            label: '?spaceLabel',
          },
        ],
        $where: [
          `
          ?space skos:inScheme <http://data.odeuropa.eu/vocabulary/fragrant-spaces> .
          OPTIONAL { ?space skos:prefLabel ?spaceLabel FILTER(LANGMATCHES(LANG(?spaceLabel), "${language}")) }
          OPTIONAL { ?space skos:prefLabel ?spaceLabel FILTER(LANGMATCHES(LANG(?spaceLabel), "en")) }
          OPTIONAL { ?space skos:prefLabel ?spaceLabel }
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?experience od:F2_perceived ?id',
        '?experience crm:P7_took_place_at / crm:P137_exemplifies ?space',
      ],
      filterFunc: (val) => `?space = <${val}>`,
    },
    {
      id: 'gesture',
      isHidden: true,
      isMulti: true,
      isSortable: false,
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?gesture',
            label: '?gestureLabel',
          },
        ],
        $where: [
          `
          ?gesture skos:inScheme <http://data.odeuropa.eu/vocabulary/olfactory-gestures> .
          OPTIONAL { ?gesture skos:prefLabel ?gestureLabel FILTER(LANGMATCHES(LANG(?gestureLabel), "${language}")) }
          OPTIONAL { ?gesture skos:prefLabel ?gestureLabel FILTER(LANGMATCHES(LANG(?gestureLabel), "en")) }
          OPTIONAL { ?gesture skos:prefLabel ?gestureLabel }
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: (val, index) => [
        `
        ?experience od:F2_perceived ?id .
        ?experience od:F5_involved_gesture ?gesture_${index} .
        VALUES ?gesture_${index} { <${val}> }
        `,
      ],
    },
  ],
};
