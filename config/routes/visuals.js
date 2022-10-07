module.exports = {
  view: 'browse',
  showInNavbar: false,
  showInHome: false,
  uriBase: 'http://data.odeuropa.eu/source',
  rdfType: ['http://data.odeuropa.eu/ontology/E36_Visual_Item'],
  filterByGraph: false,
  details: {
    view: 'odeuropa-visuals',
    showPermalink: true,
    route: 'visuals',
    excludedMetadata: ['image', 'fragment'],
    query: ({ language }) => ({
      '@graph': [
        {
          '@id': '?id',
          label: '?label',
          image: '?imageUrl',
          genre: '?genre',
          location: '?location',
          date: {
            '@id': '?date',
            label: '?dateLabel',
          },
          author: {
            '@id': '?author',
            label: '?authorLabel',
            sameAs: '?authorSameAs',
          },
          consistsOf: {
            '@id': '?consistsOf',
            label: '?consitsOfLabel',
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
        {
          ?id rdfs:label ?label .
        }
        UNION
        {
          ?id schema:image ?imageUrl .
          FILTER(STRSTARTS(STR(?imageUrl), "https://data.odeuropa.eu"))
        }
        UNION
        {
          ?id schema:genre ?genre .
        }
        UNION
        {
          ?id crm:P53_has_former_or_current_location ?location .
        }
        UNION
        {
          ?id schema:dateCreated ?date .
          ?date rdfs:label ?dateLabel .
        }
        UNION
        {
          OPTIONAL {
            ?id schema:author ?author .
            {
              OPTIONAL {
                ?author rdfs:label ?authorLabel .
                FILTER(LANG(?authorLabel) = "en" || LANG(?authorLabel) = "")
              }
            }
            UNION
            {
              OPTIONAL {
                ?author owl:sameAs ?authorSameAs .
              }
            }
          }
        }
        UNION
        {
          ?id ma:hasFragment ?fragment .
          ?fragment nsa:spatialX ?fragmentX .
          ?fragment nsa:spatialY ?fragmentY .
          ?fragment nsa:spatialW ?fragmentW .
          ?fragment nsa:spatialH ?fragmentH .
          ?fragment rdf:value ?fragmentScore .
          ?fragment oa:hasBody/rdfs:label ?fragmentLabel .
        }
        UNION
        {
          ?id schema:about/rdfs:label ?about .
        }
        UNION
        {
          ?id schema:license ?license .
        }
        `,
      ],
      $langTag: 'hide',
    }),
  },
};
