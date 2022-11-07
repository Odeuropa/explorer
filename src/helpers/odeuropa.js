export const getHighlightedText = (text, highlight) => {
  if (typeof text === 'undefined' || text === null) {
    return;
  }
  if (typeof highlight === 'undefined' || highlight === null) {
    return <span>{text}</span>;
  }
  // Split on highlight term and include term into parts, ignore case
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <span
          key={i}
          style={
            part.toLowerCase() === highlight.toLowerCase()
              ? { fontWeight: 'bold', backgroundColor: '#F2BB05', padding: '0.1em' }
              : {}
          }
        >
          {part}
        </span>
      ))}
    </span>
  );
};
