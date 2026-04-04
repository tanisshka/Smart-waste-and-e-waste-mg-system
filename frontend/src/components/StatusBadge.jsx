export const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-400' },
  assigned:    { label: 'Assigned',    color: 'bg-blue-100 text-blue-800',    dot: 'bg-blue-400'   },
  'in-progress': { label: 'In Progress', color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-400' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-800',  dot: 'bg-green-500'  },
}

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <span className={`status-badge ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

export function WasteTypeBadge({ type }) {
  return type === 'e-waste'
    ? <span className="status-badge bg-purple-100 text-purple-800">⚡ E-Waste</span>
    : <span className="status-badge bg-gray-100 text-gray-700">🗑 Normal</span>
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
