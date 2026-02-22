import { useState, useRef, useEffect, useMemo, type RefObject } from 'react'

/** Shared state & behaviour for dropdown components (outside-click, search, open/close). */
export function useDropdown<T extends HTMLElement = HTMLDivElement>(options?: {
  /** If true the hook manages a search string and filtered list. */
  searchable?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<T>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchable = options?.searchable ?? false

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        if (searchable) setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [searchable])

  /** Open the dropdown (and reset search + auto-focus the input if searchable). */
  const handleOpen = () => {
    setOpen(true)
    if (searchable) {
      setSearch('')
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  /** Close the dropdown and clear search. */
  const handleClose = () => {
    setOpen(false)
    if (searchable) setSearch('')
  }

  return {
    open,
    setOpen,
    search,
    setSearch,
    containerRef: containerRef as RefObject<T>,
    inputRef,
    handleOpen,
    handleClose,
  }
}

export interface DropdownOption {
  value: string
  label: string
}

/**
 * Filter a list of options by a search string (case-insensitive label match).
 * Memoised for performance.
 */
export function useFilteredOptions(options: DropdownOption[], search: string) {
  return useMemo(
    () =>
      options.filter(o =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      ),
    [options, search],
  )
}
