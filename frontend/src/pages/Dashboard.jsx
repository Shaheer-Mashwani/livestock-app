import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import { getFarmers, getDashboardStats, deleteFarmer } from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#2e8b57', '#6dbf8a', '#c8922a', '#b0b8cc', '#2563eb', '#8b5cf6'];

const Dashboard = () => {
  const { canEdit } = useAuth(); // true for operator/manager, false for viewer
  const [stats, setStats]     = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // ── Filter state — one object holds every active filter ─────
  const [filters, setFilters] = useState({
    district: '', educationLevel: '',
    minAnimals: '', maxAnimals: '',
    minFarmArea: '', maxFarmArea: '',
    solar: false, chopper: false, milkChiller: false, milkingMachine: false,
    page: 1,
  });

  // ── Fetch dashboard stats once on load ───────────────────────
  useEffect(() => {
    getDashboardStats().then(({ data }) => setStats(data)).catch(console.error);
  }, []);

  // ── Build query params from current filters ──────────────────
  const buildParams = () => {
    const params = { page: filters.page, limit: 8 };
    if (filters.district)       params.district = filters.district;
    if (filters.educationLevel) params.educationLevel = filters.educationLevel;
    if (filters.minAnimals)     params.minAnimals = filters.minAnimals;
    if (filters.maxAnimals)     params.maxAnimals = filters.maxAnimals;
    if (filters.minFarmArea)    params.minFarmArea = filters.minFarmArea;
    if (filters.maxFarmArea)    params.maxFarmArea = filters.maxFarmArea;
    if (filters.solar)          params.solar = true;
    if (filters.chopper)        params.chopper = true;
    if (filters.milkChiller)    params.milkChiller = true;
    if (filters.milkingMachine) params.milkingMachine = true;
    return params;
  };

  // ── Fetch farmer list whenever filters change ────────────────
  useEffect(() => {
    setLoading(true);
    getFarmers(buildParams())
      .then(({ data }) => {
        setFarmers(data.farmers);
        setPagination(data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  // ── Refresh stats + table together (used after delete) ───────
  const refreshAll = () => {
    getDashboardStats().then(({ data }) => setStats(data)).catch(console.error);
    getFarmers(buildParams())
      .then(({ data }) => {
        setFarmers(data.farmers);
        setPagination(data.pagination);
      })
      .catch(console.error);
  };

  // ── Delete a farmer record ────────────────────────────────────
  const handleDelete = async (id, name) => {
    // Confirm before deleting — irreversible action
    const sure = window.confirm(`Delete record for "${name}"? This cannot be undone.`);
    if (!sure) return;

    try {
      await deleteFarmer(id);
      toast.success('✅ Record deleted');
      refreshAll(); // reload table + stats so numbers stay accurate
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  // ── Export ALL matching records (not just current page) to CSV ─
  const handleExportClick = async () => {
    try {
      toast.loading('Preparing export...', { id: 'export' });
      // Re-fetch with a high limit so we get every matching record, not just this page
      const params = { ...buildParams(), page: 1, limit: 10000 };
      const { data } = await getFarmers(params);
      exportToCSV(data.farmers);
      toast.dismiss('export');
    } catch (err) {
      toast.dismiss('export');
      toast.error('Export failed');
    }
  };

  // ── Convert farmer records into a downloadable CSV file ────────
  const exportToCSV = (data) => {
    if (!data || data.length === 0) {
      toast.error('No records to export');
      return;
    }

    // Define column headers — order matters, matches the row mapping below
    const headers = [
      'Serial Number', 'Full Name', 'Father/Husband Name', 'CNIC', 'Contact No.',
      'District', 'Education Level', 'Gender', 'Total Animals', 'Daily Milk (L)',
      'Farm Area', 'Farm Area Unit', 'Solar', 'Chopper', 'Milk Chiller', 'Milking Machine',
    ];

    // Helper: wrap a value in quotes and escape internal quotes (CSV safety)
    const escapeCSV = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    // Build one row of CSV text per farmer
    const rows = data.map((f) => [
      f.serialNumber,
      f.fullName,
      f.fatherHusbandName,
      f.cnic,
      f.contactNo1,
      f.district,
      f.educationLevel,
      f.gender,
      f.livestock?.totalAnimals,
      f.livestock?.totalDailyMilk,
      f.farm?.area,
      f.farm?.areaUnit,
      f.machinery?.solar ? 'Yes' : 'No',
      f.machinery?.chopper ? 'Yes' : 'No',
      f.machinery?.milkChiller ? 'Yes' : 'No',
      f.machinery?.milkingMachine ? 'Yes' : 'No',
    ].map(escapeCSV).join(','));

    // Combine headers + rows into final CSV text
    const csvContent = [headers.map(escapeCSV).join(','), ...rows].join('\n');

    // Create a downloadable file using a Blob (in-memory file)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);

    // Create a temporary link element and click it to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `farmer-records-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`✅ Exported ${data.length} records`);
  };

  // Helper to update one filter field and reset to page 1
  const updateFilter = (key, value) =>
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  const toggleMachineryFilter = (key) =>
    setFilters((f) => ({ ...f, [key]: !f[key], page: 1 }));

  const resetFilters = () => setFilters({
    district: '', educationLevel: '', minAnimals: '', maxAnimals: '',
    minFarmArea: '', maxFarmArea: '', solar: false, chopper: false,
    milkChiller: false, milkingMachine: false, page: 1,
  });

  // Animal range bucket labels (matches backend $bucket boundaries)
  const animalRangeLabel = (id) => {
    if (id === 0) return '1–5';
    if (id === 6) return '6–10';
    if (id === 11) return '11–20';
    if (id === 21) return '20+';
    return id;
  };

  const summary = stats?.summary || {};

  return (
    <div className="page active">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="breadcrumb">Home <span>›</span> Dashboard</div>
          <h1>Analytics Dashboard</h1>
          <p>Livestock data overview — KPK Sub-National Area Development Programme</p>
        </div>
      </div>

      <div className="container">

        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card green">
            <div className="stat-label">Total Farmers</div>
            <div className="stat-value">{summary.totalFarmers || 0}</div>
            <div className="stat-sub">Registered records</div>
          </div>
          <div className="stat-card gold">
            <div className="stat-label">Total Animals</div>
            <div className="stat-value">{summary.totalAnimals || 0}</div>
            <div className="stat-sub">Cows + Buffaloes</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-label">Daily Milk (L)</div>
            <div className="stat-value">{summary.totalDailyMilk || 0}</div>
            <div className="stat-sub">Avg {Math.round(summary.avgMilk || 0)}L / farmer</div>
          </div>
          <div className="stat-card red">
            <div className="stat-label">Districts Covered</div>
            <div className="stat-value">{stats?.totalDistricts || 0}</div>
            <div className="stat-sub">KPK districts</div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="filter-bar">
          <span className="filter-label">Filters:</span>

          <select className="filter-select" value={filters.district}
            onChange={(e) => updateFilter('district', e.target.value)}>
            <option value="">All Districts</option>
            <option>Peshawar</option><option>Mardan</option><option>Swat</option>
            <option>Abbottabad</option><option>Mansehra</option>
          </select>

          <select className="filter-select" value={filters.educationLevel}
            onChange={(e) => updateFilter('educationLevel', e.target.value)}>
            <option value="">All Education Levels</option>
            <option>Illiterate</option><option>Primary (Class 1–5)</option>
            <option>Middle (Class 6–8)</option><option>Matric (Class 9–10)</option>
            <option>Intermediate (FA/FSc)</option><option>Bachelor's</option>
          </select>

          <select className="filter-select"
            onChange={(e) => {
              const [min, max] = e.target.value.split('-');
              setFilters((f) => ({ ...f, minAnimals: min || '', maxAnimals: max || '', page: 1 }));
            }}>
            <option value="">All Animal Counts</option>
            <option value="1-5">1–5 animals</option>
            <option value="6-10">6–10 animals</option>
            <option value="11-20">11–20 animals</option>
            <option value="21-9999">20+ animals</option>
          </select>

          <select className="filter-select"
            onChange={(e) => {
              const [min, max] = e.target.value.split('-');
              setFilters((f) => ({ ...f, minFarmArea: min || '', maxFarmArea: max || '', page: 1 }));
            }}>
            <option value="">All Farm Sizes</option>
            <option value="0-1">Under 1 Acre</option>
            <option value="1-5">1–5 Acres</option>
            <option value="5-10">5–10 Acres</option>
            <option value="10-9999">10+ Acres</option>
          </select>

          <div className="filter-divider"></div>

          {[
            { key: 'solar', label: 'Solar' },
            { key: 'chopper', label: 'Chopper' },
            { key: 'milkChiller', label: 'Chiller' },
            { key: 'milkingMachine', label: 'Milking Machine' },
          ].map((m) => (
            <button key={m.key}
              className={`filter-toggle ${filters[m.key] ? 'on' : ''}`}
              onClick={() => toggleMachineryFilter(m.key)}>
              <div className="filter-dot"></div>{m.label}
            </button>
          ))}

          <span className="filter-reset" onClick={resetFilters}>Reset all</span>
        </div>

        {/* CHARTS ROW 1 */}
        <div className="dash-grid section-gap">
          <div className="card">
            <div className="card-header">
              <div className="card-header-icon green">📊</div>
              <div><h2>Farmers by District</h2><p>Registration count per district</p></div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats?.byDistrict?.map(d => ({ name: d._id, count: d.count })) || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2e8b57" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-header-icon gold">🎓</div>
              <div><h2>Education Level Breakdown</h2><p>Farmers grouped by education</p></div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats?.byEducation?.map(e => ({ name: e._id, value: e.count })) || []}
                    dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={80} label={({ name }) => name}
                  >
                    {(stats?.byEducation || []).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CHARTS ROW 2 — Animal Range + Machinery */}
        <div className="dash-grid section-gap">
          <div className="card">
            <div className="card-header">
              <div className="card-header-icon green">🐄</div>
              <div><h2>Animal Count Distribution</h2><p>Herd size buckets</p></div>
            </div>
            <div className="card-body">
              <div className="prog-list">
                {(stats?.byAnimalRange || []).map((b, i) => {
                  const max = Math.max(...(stats?.byAnimalRange || []).map(x => x.count), 1);
                  return (
                    <div className="prog-item" key={i}>
                      <div className="prog-row">
                        <span className="prog-name">{animalRangeLabel(b._id)} animals</span>
                        <span className="prog-val">{b.count}</span>
                      </div>
                      <div className="prog-bar">
                        <div className="prog-fill" style={{
                          width: `${(b.count / max) * 100}%`,
                          background: COLORS[i % COLORS.length],
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-header-icon blue">⚙️</div>
              <div><h2>Machinery Adoption</h2><p>Availability across farms</p></div>
            </div>
            <div className="card-body">
              <div className="prog-list">
                {[
                  { label: '☀️ Solar System', val: summary.solarCount, color: '#f59e0b' },
                  { label: '⚙️ Chopper', val: summary.chopperCount, color: '#2e8b57' },
                  { label: '❄️ Milk Chiller', val: summary.milkChillerCount, color: '#2563eb' },
                  { label: '🥛 Milking Machine', val: summary.milkingMachineCount, color: '#8b5cf6' },
                ].map((m, i) => {
                  const pct = summary.totalFarmers ? Math.round((m.val / summary.totalFarmers) * 100) : 0;
                  return (
                    <div className="prog-item" key={i}>
                      <div className="prog-row">
                        <span className="prog-name">{m.label}</span>
                        <span className="prog-val">{pct}%</span>
                      </div>
                      <div className="prog-bar">
                        <div className="prog-fill" style={{ width: `${pct}%`, background: m.color }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="card">
          <div className="card-header">
            <div className="card-header-icon green">📋</div>
            <div><h2>Farmer Records</h2><p>Filtered list of registered farmers</p></div>
            <div className="ml-auto">
              <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 12 }}
                onClick={handleExportClick}>
                ⬇️ Export CSV
              </button>
            </div>
          </div>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Serial</th><th>Name</th><th>District</th><th>Education</th>
                  <th>Animals</th><th>Milk/Day (L)</th><th>Farm Area</th><th>Machinery</th>
                  {canEdit && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={canEdit ? 9 : 8} style={{ textAlign: 'center', padding: 24 }}>Loading...</td></tr>
                ) : farmers.length === 0 ? (
                  <tr><td colSpan={canEdit ? 9 : 8} style={{ textAlign: 'center', padding: 24 }}>No records found</td></tr>
                ) : farmers.map((f) => (
                  <tr key={f._id}>
                    <td style={{ color: 'var(--slate-400)', fontSize: 12 }}>{f.serialNumber}</td>
                    <td>
                      <strong>{f.fullName}</strong><br />
                      <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>{f.contactNo1}</span>
                    </td>
                    <td>{f.district}</td>
                    <td><span className="badge badge-green">{f.educationLevel}</span></td>
                    <td>{f.livestock?.totalAnimals}</td>
                    <td>{f.livestock?.totalDailyMilk}</td>
                    <td>{f.farm?.area} {f.farm?.areaUnit}</td>
                    <td>
                      <div className="machinery-icons">
                        <div className={`mach-dot ${f.machinery?.solar ? 'mach-on' : 'mach-off'}`}>☀️</div>
                        <div className={`mach-dot ${f.machinery?.chopper ? 'mach-on' : 'mach-off'}`}>⚙️</div>
                        <div className={`mach-dot ${f.machinery?.milkChiller ? 'mach-on' : 'mach-off'}`}>❄️</div>
                        <div className={`mach-dot ${f.machinery?.milkingMachine ? 'mach-on' : 'mach-off'}`}>🥛</div>
                      </div>
                    </td>
                    {canEdit && (
                      <td>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: 11, color: '#dc3545' }}
                          onClick={() => handleDelete(f._id, f.fullName)}
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--slate-100)' }}>
            <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>
              Showing {farmers.length} of {pagination.total} records — Page {pagination.page} of {pagination.pages || 1}
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>
                ← Prev
              </button>
              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}
                disabled={filters.page >= pagination.pages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
                Next →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
