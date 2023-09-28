const generateDateFilter = (date) => {
  if (!date) return '';
  return `
  ?source schema:dateCreated/time:hasBeginning ?begin .
  FILTER(
    ${date
      .split(',')
      .map((d) => `(?begin >= "${d}"^^xsd:gYear && ?begin <= "${parseInt(d, 10) + 20}"^^xsd:gYear)`)
      .join(' || ')}
  )`;
};

module.exports = {
  view: 'odeuropa-vocabulary',
  showInNavbar: true,
  showInHome: true,
  uriBase: 'http://data.odeuropa.eu/vocabulary/olfactory-objects',
  details: {
    view: 'odeuropa-vocabulary-details',
    showPermalink: false,
    excludedMetadata: [],
    route: 'smells',
    query: ({ language }) => ({
      '@graph': [
        {
          '@id': '?id',
          label: '?bestLabel',
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
          BIND(COALESCE(?label_hl, ?label_en) AS ?bestLabel)
        }
        {
          OPTIONAL {
            ?id schema:image ?image .
          }
        }
        {
          OPTIONAL {
            ?id skos:related ?related .
            ?related skos:inScheme <http://data.odeuropa.eu/vocabulary/olfactory-objects> .
            ?related skos:prefLabel ?relatedLabel .
            FILTER(LANG(?relatedLabel) = "${language}" || LANG(?relatedLabel) = "")
          }
        }
        `,
      ],
      $langTag: 'hide',
    }),
  },
  query: ({ language }) => ({
    '@graph': [
      {
        '@id': '?id',
        label: '?bestLabel',
        image: '?image',
        count: '?count',
        topCategory: '?topCategory',
      },
    ],
    $where: [
      `
      ?id skos:inScheme <http://data.odeuropa.eu/vocabulary/olfactory-objects> .
      FILTER EXISTS { [] crm:P137_exemplifies ?id . }
      {
        SELECT DISTINCT ?id (COUNT(DISTINCT ?emission) AS ?count) WHERE {
          ?id skos:inScheme <http://data.odeuropa.eu/vocabulary/olfactory-objects> .
          ?item crm:P137_exemplifies ?id .
          ?emission od:F3_had_source ?item .
        }
        GROUP BY ?id
      }
      UNION
      {
        OPTIONAL { ?id skos:prefLabel ?label_hl . FILTER(LANGMATCHES(LANG(?label_hl), "${language}")) }
        OPTIONAL { ?id skos:prefLabel ?label_en . FILTER(LANGMATCHES(LANG(?label_en), "en")) }
        OPTIONAL { SELECT ?id ?label_default WHERE { ?id skos:prefLabel ?label_default } LIMIT 1 }
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
          ?id skos:broader* ?topCategory .
          ?topCategory skos:topConceptOf <http://data.odeuropa.eu/vocabulary/olfactory-objects>
        }
      }
      `,
    ],
    $langTag: 'hide',
  }),
  plugins: {
    'odeuropa-vocabulary': {
      categories: {
        query: ({ language }) => ({
          '@graph': [
            {
              '@id': '?category',
              label: '?bestLabel',
            },
          ],
          $where: [
            `
            GRAPH <http://data.odeuropa.eu/vocabulary/olfactory-objects> {
              <http://data.odeuropa.eu/vocabulary/olfactory-objects> skos:hasTopConcept ?category .
              OPTIONAL { ?category skos:prefLabel ?label_hl . FILTER(LANGMATCHES(LANG(?label_hl), "${language}")) }
              OPTIONAL { ?category skos:prefLabel ?label_en . FILTER(LANGMATCHES(LANG(?label_en), "en")) }
              BIND(COALESCE(?label_hl, ?label_en) AS ?bestLabel)
            }
            `,
          ],
        }),
      },
      wordCloud: {
        quality: {
          query: ({ id, category, date }) => {
            const $where = [
              `
              {
                SELECT ?word (COUNT(?smell) AS ?count) WHERE {
                  VALUES ?id { <${id}> }
                  ?emission od:F3_had_source/crm:P137_exemplifies ?id .
                  ?emission od:F1_generated ?smell .
                  ?assignment a crm:E13_Attribute_Assignment .
                  ?assignment crm:P141_assigned/rdfs:label ?word .
                  ?assignment crm:P140_assigned_attribute_to ?smell .
                  ${category ? `?id skos:broader* <${category}> .` : ''}

                  ?source crm:P67_refers_to ?emission .
                  ${generateDateFilter(date)}
                }
                GROUP BY ?word
                ORDER BY DESC(?count)
                LIMIT 20
              }
              `,
            ];
            return {
              '@graph': [
                {
                  '@id': '?word',
                  count: '?count',
                },
              ],
              $where,
              $distinct: false,
              $langTag: 'hide',
            };
          },
        },
        emotion: {
          query: ({ id, category, date }) => {
            const $where = [
              `
              {
                SELECT ?word (COUNT(?smell) AS ?count) WHERE {
                  VALUES ?id { <${id}> }
                  ?emission od:F3_had_source/crm:P137_exemplifies ?id .
                  ?emission od:F1_generated ?smell .
                  ?experience od:F2_perceived ?smell .
                  ?emotion reo:readP27 ?experience .
                  ?emotion rdfs:label ?word .
                  ${category ? `?id skos:broader* <${category}> .` : ''}

                  ?source crm:P67_refers_to ?emission .
                  ${generateDateFilter(date)}
                }
                GROUP BY ?word
                ORDER BY DESC(?count)
                LIMIT 20
              }
              `,
            ];
            return {
              '@graph': [
                {
                  '@id': '?word',
                  count: '?count',
                },
              ],
              $where,
              $distinct: false,
              $langTag: 'hide',
            };
          },
        },
        smellscape: {
          query: ({ id, category, date }) => {
            const $where = [
              `
              {
                SELECT ?word (COUNT(?smell) AS ?count) WHERE {
                  VALUES ?id { <${id}> }
                  ?emission od:F3_had_source/crm:P137_exemplifies ?id .
                  ?emission od:F1_generated ?smell .
                  ?emission crm:P7_took_place_at ?place .
                  ?place rdfs:label ?word .
                  ${category ? `?id skos:broader* <${category}> .` : ''}

                  ?source crm:P67_refers_to ?emission .
                  ${generateDateFilter(date)}
                }
                GROUP BY ?word
                ORDER BY DESC(?count)
                LIMIT 20
              }
              `,
            ];
            return {
              '@graph': [
                {
                  '@id': '?word',
                  count: '?count',
                },
              ],
              $where,
              $distinct: false,
              $langTag: 'hide',
            };
          },
        },
      },
      visuals: {
        route: 'smells',
        showAllFilter: 'source',
        baseWhere: ({ date }) =>
          `
          ?emission od:F1_generated ?id .
          ?object crm:P137_exemplifies ?_vocab .
          ?source crm:P138_represents ?object .
          ?source crm:P67_refers_to ?emission .
          ${generateDateFilter(date)}
          `,
      },
      texts: {
        route: 'smells',
        showAllFilter: 'source',
        baseWhere: ({ date }) =>
          `
          ?emission od:F3_had_source/crm:P137_exemplifies ?_vocab .
          ?emission od:F1_generated ?id .
          ?source crm:P67_refers_to ?id .
          ?source a crm:E33_Linguistic_Object .
          ${generateDateFilter(date)}
          `,
      },
      timeline: {
        query: ({ id, interval }) => ({
          '@graph': [
            {
              '@id': '?interval_start',
              count: '?count',
            },
          ],
          $where: [
            `
            {
              SELECT (COUNT(DISTINCT ?smell) AS ?count) ?interval_start
              WHERE {
                VALUES ?id { <${id}> }
                {
                    ?emission od:F1_generated ?smell .
                    ?emission od:F3_had_source / crm:P137_exemplifies ?id .
                    ?emission_source crm:P67_refers_to ?emission .
                    ?emission_source schema:dateCreated/time:hasBeginning ?begin .
                    BIND(FLOOR(YEAR(?begin) / ${interval}) * ${interval} AS ?interval_start)
                }
              }
              GROUP BY ?interval_start
              ORDER BY ?interval_start
            }
            `,
          ],
          $distinct: false,
          $langTag: 'hide',
        }),
      },
    },
  },
};
