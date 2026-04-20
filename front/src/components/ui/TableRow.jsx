const TableRow = ({ columns, isHeader = false }) => {
  const CellTag = isHeader ? 'th' : 'td';
  return (
    <tr className={isHeader ? "border-b border-gray-300 bg-gray-50" : "hover:bg-gray-50 transition-colors"}>
      {columns.map((col, index) => (
        <CellTag 
            key={index} 
            className={col.className}
        >
          {col.label || col.content} 
        </CellTag>
      ))}
    </tr>
  );
};

export default TableRow;
