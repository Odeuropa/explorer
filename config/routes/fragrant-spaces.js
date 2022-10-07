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
          SELECT DISTINCT ?id ?place ?emission ?smell WHERE {
            ?place crm:P2_has_type ?id .
            ?emission crm:P7_took_place_at ?place .
            ?emission od:F1_generated ?smell .
          }
        }

        # Properties
        {
          ?id skos:prefLabel ?label .
          FILTER(LANG(?label) = "${language}" || LANG(?label) = "")
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
          ?place crm:P2_has_type ?id .
          ?emission crm:P7_took_place_at ?place .
          ?emission od:F1_generated ?smell .
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
};
