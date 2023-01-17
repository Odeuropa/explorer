const theme = {
  globalStyle: `
    @font-face {
      font-family: 'Futura Std Book';
      font-style: normal;
      font-weight: normal;
      src: local('Futura Std Book'), url('/fonts/FuturaStdBook.woff2') format('woff2');
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
    primary: '#B9D59B',
    secondary: '#333',
    danger: '#dc3545',
    link: '#464C5A',
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
        backgroundColor: '#D6CFE1',
      },
      ClearButton: {
        backgroundColor: '#E3E3E3',
        color: '#333',
        fontSize: '1.2em',
        borderRadius: 16,
        '&:hover': {
          color: 'inherit',
        },
      },
      FilterButton: {
        backgroundColor: '#b9d59b',
        color: '#333',
        fontSize: '1.2em',
        borderRadius: 16,
        '&:hover': {
          color: 'inherit',
        },
      },
      Field: {
        label: {
          color: '#333',
          fontSize: '1.1em',
        },
      },
      StyledInput: {
        border: '1px solid #333',
        borderRadius: 16,
        backgroundColor: '#fff',
      },
    },
  },
};

export const selectTheme = (base) => ({
  ...base,
  ...theme.select,
  colors: {
    ...base.colors,
    primary: '#000',
    neutral0: '#eee',
    primary25: '#ddd',
    ...theme.select?.colors,
  },
});

export const selectStyles = {
  control: (provided) => ({
    ...provided,
    border: '1px solid #b9d59b',
    borderRadius: 16,
    backgroundColor: '#fff',
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: 'hsl(0,0%,20%)',
    '&:hover': {
      color: 'hsl(0,0%,20%)',
    },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: 16,
  }),
  menuList: (base) => ({
    ...base,
    paddingTop: 0,
    paddingBottom: 0,
    borderRadius: 16,
  }),
  option: (base) => ({
    ...base,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#b9d59b',
  }),
};

theme.sidebar = {
  selectTheme,
  selectStyles: {
    control: (provided) => ({
      ...provided,
      borderRadius: 16,
      backgroundColor: '#fff',
      fontSize: '0.9em',
      border: '1px solid #333',
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: 'hsl(0,0%,20%)',
      '&:hover': {
        color: 'hsl(0,0%,20%)',
      },
    }),
    menu: (base) => ({
      ...base,
      borderRadius: 16,
    }),
    menuList: (base) => ({
      ...base,
      paddingTop: 0,
      paddingBottom: 0,
      borderRadius: 16,
    }),
    option: (base) => ({
      ...base,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),
    placeholder: (base) => ({
      ...base,
    }),
  },
};

export default theme;
