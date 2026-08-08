export default function Table({ columns, rows, keyField = '_id', onRowClick }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-steel-200">
      <table className="min-w-full divide-y divide-steel-200 text-left text-sm">
        <thead className="bg-steel-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-semibold text-ink-800">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-steel-100 bg-white">
          {rows.map((row) => (
            <tr
              key={row[keyField]}
              className={onRowClick ? 'cursor-pointer hover:bg-steel-50' : ''}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-ink-800">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
