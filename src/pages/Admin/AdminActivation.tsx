import React, { useState, useEffect, useCallback } from 'react'
import { Activity, Users, Flag, AlertTriangle, RefreshCw } from 'lucide-react'
import { DatabaseService } from '../../services/databaseService.ts'
import { supabase } from '../../lib/supabase.ts'

// Activation funnel + retention cohorts + feature flags + client error feed.
// Backed by supabase/migrations/20260711_admin_funnel_analytics.sql — until
// that migration is applied, the funnel/cohort/error sections show a labeled
// "not wired yet" state instead of numbers (ADMIN_CONSOLE_PRD.md §4).

interface FunnelData {
  signed_up: number
  email_verified: number
  created_conversation: number
  sent_message: number
  created_branch: number
  performed_merge: number
}

interface CohortRow {
  cohort_week: string
  cohort_size: number
  retained_d1: number
  retained_d7: number
  retained_d30: number
}

interface ClientError {
  id: string
  user_email: string | null
  error_type: string
  message: string
  context: Record<string, unknown>
  created_at: string
}

interface ConfigRow {
  key: string
  value: any
  updated_at: string | null
}

const FUNNEL_STAGES: Array<{ key: keyof FunnelData; label: string }> = [
  { key: 'signed_up', label: 'Signed up' },
  { key: 'email_verified', label: 'Email verified' },
  { key: 'created_conversation', label: 'Created a conversation' },
  { key: 'sent_message', label: 'Sent a message' },
  { key: 'created_branch', label: 'Created a branch' },
  { key: 'performed_merge', label: 'Performed a merge' },
]

const NotWired: React.FC<{ what: string }> = ({ what }) => (
  <div className="border border-hairline rounded-node p-5 text-center">
    <p className="text-[13px] text-ash mb-1">{what} isn't wired yet.</p>
    <p className="text-[12px] text-smoke">
      Apply <span className="font-mono">supabase/migrations/20260711_admin_funnel_analytics.sql</span>{' '}
      and reload — the UI is already built against it.
    </p>
  </div>
)

const AdminActivation: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [funnel, setFunnel] = useState<FunnelData | null>(null)
  const [cohorts, setCohorts] = useState<CohortRow[] | null>(null)
  const [errors, setErrors] = useState<ClientError[] | null>(null)
  const [configs, setConfigs] = useState<ConfigRow[]>([])
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [funnelData, cohortData, errorData, configData] = await Promise.all([
      DatabaseService.getActivationFunnel(),
      DatabaseService.getRetentionCohorts(8),
      DatabaseService.getRecentClientErrors(50),
      DatabaseService.getAllAppConfig()
    ])
    setFunnel(funnelData)
    setCohorts(cohortData)
    setErrors(errorData)
    setConfigs(configData)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const toggleFlag = async (config: ConfigRow) => {
    // Only boolean-shaped { enabled } values get a toggle
    if (typeof config.value?.enabled !== 'boolean') return
    setTogglingKey(config.key)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const success = await DatabaseService.updateAppConfig(
        config.key,
        { ...config.value, enabled: !config.value.enabled },
        user?.id
      )
      if (success) {
        setConfigs(prev =>
          prev.map(c =>
            c.key === config.key ? { ...c, value: { ...c.value, enabled: !c.value.enabled } } : c
          )
        )
      }
    } finally {
      setTogglingKey(null)
    }
  }

  const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 100) : 0)
  const formatWeek = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-[28px] font-extralight text-bone tracking-display">Activation</h1>
        <p className="text-smoke text-[14px] mt-1">Loading…</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-[1200px]">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-extralight text-bone tracking-display">Activation</h1>
          <p className="text-smoke text-[14px] mt-1">
            Where people fall out of the funnel, and whether they come back
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 rounded-pill border border-hairline hover:border-hairline-strong text-ash hover:text-bone text-[12px] font-semibold uppercase tracking-kicker transition-colors duration-fast"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Activation funnel */}
      <section className="bg-panel border border-hairline rounded-node p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity size={15} className="text-plum" />
          <h2 className="text-[13px] font-semibold uppercase tracking-kicker text-smoke">
            Activation funnel
          </h2>
        </div>

        {funnel ? (
          <div className="space-y-3">
            {FUNNEL_STAGES.map((stage, i) => {
              const value = funnel[stage.key] || 0
              const top = funnel.signed_up || 0
              const prev = i === 0 ? top : funnel[FUNNEL_STAGES[i - 1].key] || 0
              const ofTop = pct(value, top)
              const ofPrev = i === 0 ? 100 : pct(value, prev)
              return (
                <div key={stage.key} className="flex items-center gap-4">
                  <div className="w-44 text-[13px] text-ash shrink-0">{stage.label}</div>
                  <div className="flex-1 h-6 rounded-pill overflow-hidden" style={{ background: 'var(--color-hairline)' }}>
                    <div
                      className="h-full bg-plum flex items-center justify-end px-2.5 transition-all duration-med"
                      style={{ width: `${Math.max(ofTop, 3)}%`, opacity: 0.45 + ofTop / 200 }}
                    >
                      <span className="text-[11px] font-semibold text-bone">{value}</span>
                    </div>
                  </div>
                  <div className="w-24 text-right shrink-0">
                    <span className="text-[13px] text-bone">{ofTop}%</span>
                    {i > 0 && (
                      <span className="text-[11px] text-smoke ml-2">({ofPrev}% of prev)</span>
                    )}
                  </div>
                </div>
              )
            })}
            <p className="text-[12px] text-smoke pt-2">
              Percentages are of all signups. The biggest step-to-step drop is where to focus next.
            </p>
          </div>
        ) : (
          <NotWired what="The funnel query" />
        )}
      </section>

      {/* Retention cohorts */}
      <section className="bg-panel border border-hairline rounded-node p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users size={15} className="text-plum" />
          <h2 className="text-[13px] font-semibold uppercase tracking-kicker text-smoke">
            Retention cohorts
          </h2>
        </div>

        {cohorts && cohorts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[12px] text-smoke border-b border-hairline">
                  <th className="pb-3 font-medium">Signup week</th>
                  <th className="pb-3 font-medium text-right">Users</th>
                  <th className="pb-3 font-medium text-right">D1</th>
                  <th className="pb-3 font-medium text-right">D7</th>
                  <th className="pb-3 font-medium text-right">D30</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((row) => {
                  const cell = (retained: number) => {
                    const p = pct(retained, row.cohort_size)
                    return (
                      <td className="py-2.5 text-right">
                        <span
                          className="inline-block min-w-[52px] text-[12px] px-2 py-1 rounded-[8px] text-bone"
                          style={{ background: `rgba(128, 82, 255, ${Math.min(0.05 + (p / 100) * 0.5, 0.55)})` }}
                        >
                          {p}%
                        </span>
                      </td>
                    )
                  }
                  return (
                    <tr key={row.cohort_week} className="border-b border-hairline">
                      <td className="py-2.5 text-[13px] text-ash">{formatWeek(row.cohort_week)}</td>
                      <td className="py-2.5 text-right text-[13px] text-bone">{row.cohort_size}</td>
                      {cell(row.retained_d1)}
                      {cell(row.retained_d7)}
                      {cell(row.retained_d30)}
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="text-[12px] text-smoke pt-3">
              "Retained at D-N" = any activity N or more days after signup.
            </p>
          </div>
        ) : cohorts && cohorts.length === 0 ? (
          <p className="text-[13px] text-smoke">No signups in the window yet.</p>
        ) : (
          <NotWired what="The cohort query" />
        )}
      </section>

      {/* Feature flags */}
      <section className="bg-panel border border-hairline rounded-node p-6">
        <div className="flex items-center gap-2 mb-6">
          <Flag size={15} className="text-plum" />
          <h2 className="text-[13px] font-semibold uppercase tracking-kicker text-smoke">
            Feature flags (app_config)
          </h2>
        </div>

        {configs.length > 0 ? (
          <div className="divide-y divide-hairline">
            {configs.map((config) => {
              const isBoolean = typeof config.value?.enabled === 'boolean'
              return (
                <div key={config.key} className="flex items-center justify-between py-3.5 gap-4">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-bone font-mono">{config.key}</p>
                    <p className="text-[12px] text-smoke truncate">
                      {isBoolean
                        ? config.value.enabled ? 'Enabled' : 'Disabled'
                        : JSON.stringify(config.value)}
                      {config.updated_at &&
                        ` · updated ${new Date(config.updated_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  {isBoolean && (
                    <button
                      onClick={() => toggleFlag(config)}
                      disabled={togglingKey === config.key}
                      className={`relative inline-flex h-6 w-11 items-center rounded-pill border transition-colors duration-fast shrink-0 ${
                        config.value.enabled ? 'bg-plum border-plum' : 'border-hairline-strong'
                      } ${togglingKey === config.key ? 'opacity-50' : ''}`}
                      title={`Toggle ${config.key}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-bone transition-transform duration-fast ${
                          config.value.enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-[13px] text-smoke">
            No config rows found — add rows to <span className="font-mono">app_config</span> and
            they appear here with a toggle for boolean flags.
          </p>
        )}
      </section>

      {/* Client error feed */}
      <section className="bg-panel border border-hairline rounded-node p-6">
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle size={15} className="text-plum" />
          <h2 className="text-[13px] font-semibold uppercase tracking-kicker text-smoke">
            Recent client errors
          </h2>
        </div>

        {errors && errors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[12px] text-smoke border-b border-hairline">
                  <th className="pb-3 font-medium">When</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((err) => (
                  <tr key={err.id} className="border-b border-hairline align-top">
                    <td className="py-2.5 text-[12px] text-smoke whitespace-nowrap pr-4">
                      {new Date(err.created_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 text-[12px] text-ash pr-4">{err.user_email || '—'}</td>
                    <td className="py-2.5 pr-4">
                      <span className="text-[11px] px-2 py-0.5 rounded-pill border border-hairline text-ash font-mono">
                        {err.error_type}
                      </span>
                    </td>
                    <td className="py-2.5 text-[12px] text-ash max-w-md">
                      <span className="line-clamp-2">{err.message}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : errors && errors.length === 0 ? (
          <p className="text-[13px] text-smoke">No client errors reported — good sign.</p>
        ) : (
          <NotWired what="The error feed" />
        )}
      </section>
    </div>
  )
}

export default AdminActivation
