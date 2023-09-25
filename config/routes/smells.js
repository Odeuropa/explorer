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
  view: 'odeuropa-browse',
  showInNavbar: true,
  showInHome: false,
  uriBase: 'http://data.odeuropa.eu/smell',
  rdfType: ['http://data.odeuropa.eu/ontology/L11_Smell'],
  filterByGraph: false,
  hideFilterButton: true,
  orderByVariable: null,
  countResults: false,
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
                  ?emotion rdfs:label ?emotionLabel .
                }
                OPTIONAL {
                  ?emotion crm:P137_exemplifies ?emotionType .
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
        luc:query ${JSON.stringify(lucQuery.join(' || '))} ;
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
                ?emotion rdfs:label ?emotionLabel .
              }
              OPTIONAL {
                ?emotion crm:P137_exemplifies ?emotionType .
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
          ?emission od:F1_generated ?id .
          ?emission od:F3_had_source / crm:P137_exemplifies ?source .
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
      whereFunc: (_val, index) => [
        `
        ?emission od:F1_generated ?id .
        {
          ?emission od:F3_had_source / crm:P137_exemplifies ?source_${index} .
        }
        UNION
        {
          ?emission od:F3_had_source / crm:P137_exemplifies / skos:broader* ?source_${index}_narrower
        }
        `,
      ],
      filterFunc: (val, index) =>
        `?source_${index} = <${val}> || ?source_${index}_narrower = <${val}>`,
    },
    {
      id: 'carrier',
      isMulti: true,
      isSortable: false,
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?carrierExemplifies',
            label: '?carrierExemplifiesLabel',
          },
        ],
        $where: [
          `
          ?emission od:F4_had_carrier ?carrier .
          ?carrier crm:P137_exemplifies ?carrierExemplifies .
          olfactory-objects:carrier skos:member ?carrierExemplifies .
          ?carrierExemplifies skos:prefLabel ?carrierExemplifiesLabel .
          FILTER(LANG(?carrierExemplifiesLabel) = "${language}" || LANG(?carrierExemplifiesLabel) = "")
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?emission od:F1_generated ?id',
        '?emission od:F4_had_carrier ?carrier',
        '?carrier crm:P137_exemplifies ?carrierExemplifies',
      ],
      filterFunc: (val) => `?carrierExemplifies = <${val}>`,
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
          ?assignment crm:P140_assigned_attribute_to ?id .
          ?assignment crm:P141_assigned ?quality .
          ?quality skos:inScheme [] .
          OPTIONAL { ?quality skos:prefLabel ?label_hl . FILTER(LANGMATCHES(LANG(?label_hl), "${language}")) }
          OPTIONAL { ?quality skos:prefLabel ?label_en . FILTER(LANGMATCHES(LANG(?label_en), "en")) }
          OPTIONAL { ?quality rdfs:label ?original_label . }
          BIND(COALESCE(?label_hl, ?label_en, ?original_label) AS ?qualityLabel)
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?assignment crm:P140_assigned_attribute_to ?id',
        '?assignment crm:P141_assigned ?quality',
        '?quality skos:inScheme []',
      ],
      filterFunc: (val) => `?quality = <${val}>`,
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
          OPTIONAL { ?emotionType skos:prefLabel ?label_hl . FILTER(LANGMATCHES(LANG(?label_hl), "${language}")) }
          OPTIONAL { ?emotionType skos:prefLabel ?label_en . FILTER(LANGMATCHES(LANG(?label_en), "en")) }
          OPTIONAL { ?emotionType rdfs:label ?original_label . }
          BIND(COALESCE(?label_hl, ?label_en, ?original_label) AS ?emotionTypeLabel)
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
        '?textualObject crm:P67_refers_to ?id',
        '?textualObject schema:inLanguage ?language',
      ],
      filterFunc: (val) => `STR(?language) = ${JSON.stringify(val)}`,
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
          ?id a od:L11_Smell .
          ?emission od:F1_generated ?id .
          ?emission od:F3_had_source / crm:P137_exemplifies ?source .
          ?emission time:hasTime ?time .
          ?time time:hasBeginning ?timeBegin .
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
          ?id a od:L11_Smell .
          ?emission od:F1_generated ?id .
          ?emission od:F3_had_source / crm:P137_exemplifies ?source .
          ?emission time:hasTime ?time .
          ?time time:hasEnd ?timeEnd .
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
        '?emission od:F1_generated ?id',
        '?emission time:hasTime ?time',
        '?time time:hasBeginning ?timeBegin',
        '?time time:hasEnd ?timeEnd',
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
        '?emission od:F1_generated ?id',
        '?emission time:hasTime ?time',
        '?time time:hasBeginning ?timeBegin',
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
      query: ({ language }) => ({
        '@graph': [
          {
            '@id': '?country',
            label: '?countryName',
          },
        ],
        $where: [
          `
          ?id a od:L11_Smell .
          ?experience od:F2_perceived ?id .
          ?experience crm:P7_took_place_at / gn:parentCountry ?country .
          ?country gn:name ?countryName .
          `,
        ],
        $langTag: 'hide',
      }),
      whereFunc: () => [
        '?experience od:F2_perceived ?id',
        '?experience crm:P7_took_place_at / gn:parentCountry ?placeCountry',
      ],
      filterFunc: (val) => `?placeCountry = <${val}>`,
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
      filterFunc: (val) => `?g = <${val}>`,
    },
  ],
};
