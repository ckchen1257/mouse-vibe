import { useDropdown, useFilteredOptions, type DropdownOption } from '../hooks/useDropdown'

interface SearchableMultiSelectProps {
  label: string
  options: DropdownOption[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

export default function SearchableMultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Search...',
}: SearchableMultiSelectProps) {
  const { open, search, setSearch, containerRef, inputRef, handleOpen } =
    useDropdown<HTMLDivElement>({ searchable: true })

  const filtered = useFilteredOptions(options, search)

  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value],
    )
  }

  const selectedLabels = options
    .filter(o => selected.includes(o.value))
    .map(o => o.label)

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
        {label}
      </label>

      {open ? (
        <input
          ref={inputRef}
          type="text"
          className="mt-1 block w-full rounded-md border border-blue-400 bg-white px-3 py-1.5 text-sm ring-1 ring-blue-400 dark:border-blue-500 dark:bg-slate-800 dark:ring-blue-500"
          placeholder={placeholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="mt-1 flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-1.5 text-left text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          <span className={selectedLabels.length ? '' : 'text-slate-400'}>
            {selectedLabels.length ? selectedLabels.join(', ') : placeholder}
          </span>
          <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {open && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800">
          {filtered.map(o => (
            <li key={o.value}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                <input
                  type="checkbox"
                  checked={selected.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {o.label}
              </label>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">No matches</li>
          )}
        </ul>
      )}
    </div>
  )
}
