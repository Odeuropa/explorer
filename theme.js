const theme = {
  globalStyle: `
    @font-face {
      font-family: 'Futura Std Book';
      font-style: normal;
      font-weight: normal;
      src: local('Futura Std Book'), url('/fonts/FuturaStdBook.woff') format('woff');
    }

    @font-face {
      font-family: 'Garamond';
      font-style: normal;
      font-weight: normal;
      src: local('Garamond'), url('/fonts/Garamond.woff') format('woff');
    }
  `,
  fontFamily: {
    sansSerif:
      '"Futura Std Book", Lato, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
    mono: 'Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace',
  },
  colors: {
    text: '#333',
    background: '#fff',
    primary: '#464C5A',
    secondary: '#144168',
    linkHover: '#0d3e50',
    light: '#87ceeb',
  },
  home: {
    textSearchButton: {
      background: '#B9D59B',
      text: '#fff',
    },
  },
  header: {
    height: '120px',
    borderBottomWidth: '0px',
  },
  footer: {
    minHeight: '150px',
    backgroundColor: '#464C5A',
  },
  select: {
    borderRadius: '16px',
  },
  components: {
    Header: {
      Container: {
        height: 120,
        borderBottomWidth: 2,
        borderBottomColor: '#B9D59B',
      },
      Logo: {
        maxHeight: 90,
      },
      NavItem: {
        fontSize: '1rem',
      },
    },
    Footer: {
      Container: {
        minHeight: 150,
        backgroundColor: '#464C5A',
      },
      Credits: {
        flex: 1,
        '& a': {
          textDecoration: 'underline',
          ':hover': {
            color: '#d7d7d7',
          },
        },
      },
    },
    Media: {
      GraphIconContainer: {
        backgroundColor: 'transparent',
        padding: 0,
      },
    },
    GraphIcon: {
      StyledImage: {
        height: 36,
      },
    },
    Sidebar: {
      Container: {
        width: 350,
        backgroundColor: '#D6CFE1',
      },
    },
  },
};

export default theme;
