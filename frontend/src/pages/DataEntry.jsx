import { useState } from 'react';
import toast from 'react-hot-toast';
import { createFarmer } from '../services/api';

// The initial empty shape of our form — matches the Farmer schema
const emptyForm = {
  fullName: '', fatherHusbandName: '', cnic: '', dateOfBirth: '',
  contactNo1: '', contactNo2: '',
  educationLevel: '', gender: '', experience: '',
  district: '', tehsil: '', unionCouncil: '', farmAddress: '', gpsLocation: '',
  livestock: {
    cows:      { milking: 0, dailyMilk: 0, dry: 0, youngOnes: 0 },
    buffaloes: { milking: 0, dailyMilk: 0, dry: 0, youngOnes: 0 },
  },
  farm: {
    area: 0, areaUnit: 'Acres', ownership: '', housingType: '',
    shadeLength: 0, shadeWidth: 0, waterSource: '', electricity: '',
  },
  machinery: { solar: false, chopper: false, milkChiller: false, milkingMachine: false },
  applicationType: 'Land Leveller',
  notes: '',
};

const DataEntry = () => {
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  // Generic handler for top-level text/select fields
  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // Handler for nested fields like livestock.cows.milking
  const setNested = (section, sub, field, value) => {
    setForm((f) => ({
      ...f,
      [section]: {
        ...f[section],
        [sub]: { ...f[section][sub], [field]: Number(value) || 0 },
      },
    }));
  };

  // Handler for farm.* fields (one level deep)
  const setFarmField = (field, value) =>
    setForm((f) => ({ ...f, farm: { ...f.farm, [field]: value } }));

  // Toggle machinery checkbox
  const toggleMachinery = (key) =>
    setForm((f) => ({
      ...f,
      machinery: { ...f.machinery, [key]: !f.machinery[key] },
    }));

  // ── Calculate totals for live preview ─────────────────────
  const cowTotal = form.livestock.cows.milking + form.livestock.cows.dry + form.livestock.cows.youngOnes;
  const bufTotal = form.livestock.buffaloes.milking + form.livestock.buffaloes.dry + form.livestock.buffaloes.youngOnes;
  const milkTotal = Number(form.livestock.cows.dailyMilk) + Number(form.livestock.buffaloes.dailyMilk);

  // ── Submit handler ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createFarmer(form);
      toast.success('✅ Farmer registered successfully!');
      setForm(emptyForm); // reset form after success
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page active">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="breadcrumb">Home <span>›</span> Data Entry</div>
          <h1>Farmer Registration Form</h1>
          <p>L&amp;DD KPK — Sub-National Area Development Programme</p>
        </div>
      </div>

      <form className="container" onSubmit={handleSubmit}>

        <div className="info-banner section-gap">
          ℹ️ &nbsp; All fields marked with <strong>*</strong> are required. Serial number is auto-generated.
        </div>

        {/* SECTION 1: Personal Info */}
        <div className="card section-gap">
          <div className="card-header">
            <div className="card-header-icon green">👤</div>
            <div><h2>Personal Information</h2><p>Applicant's basic identification details</p></div>
          </div>
          <div className="card-body">
            <div className="form-section-label">Identification</div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label>Full Name <span className="req">*</span></label>
                <input type="text" required value={form.fullName}
                  onChange={(e) => setField('fullName', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Father's / Husband's Name <span className="req">*</span></label>
                <input type="text" required value={form.fatherHusbandName}
                  onChange={(e) => setField('fatherHusbandName', e.target.value)} />
              </div>
              <div className="form-group">
                <label>CNIC Number <span className="req">*</span></label>
                <input type="text" required placeholder="00000-0000000-0" value={form.cnic}
                  onChange={(e) => setField('cnic', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="text" placeholder="DD/MM/YYYY" value={form.dateOfBirth}
                  onChange={(e) => setField('dateOfBirth', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Contact No. 1 <span className="req">*</span></label>
                <input type="tel" required value={form.contactNo1}
                  onChange={(e) => setField('contactNo1', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Contact No. 2</label>
                <input type="tel" value={form.contactNo2}
                  onChange={(e) => setField('contactNo2', e.target.value)} />
              </div>
            </div>

            <div className="form-section-label">Background</div>
            <div className="form-grid cols-3" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label>Education Level <span className="req">*</span></label>
                <select required value={form.educationLevel}
                  onChange={(e) => setField('educationLevel', e.target.value)}>
                  <option value="">Select level</option>
                  <option>Illiterate</option>
                  <option>Primary (Class 1–5)</option>
                  <option>Middle (Class 6–8)</option>
                  <option>Matric (Class 9–10)</option>
                  <option>Intermediate (FA/FSc)</option>
                  <option>Bachelor's</option>
                  <option>Master's or above</option>
                </select>
              </div>
              <div className="form-group">
                <label>Gender <span className="req">*</span></label>
                <select required value={form.gender}
                  onChange={(e) => setField('gender', e.target.value)}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <div className="form-group">
                <label>Dairy Farming Experience</label>
                <select value={form.experience}
                  onChange={(e) => setField('experience', e.target.value)}>
                  <option value="">Select years</option>
                  <option>Less than 1 year</option>
                  <option>1–3 years</option>
                  <option>3–5 years</option>
                  <option>5–10 years</option>
                  <option>More than 10 years</option>
                </select>
              </div>
            </div>

            <div className="form-section-label">Location</div>
            <div className="form-grid cols-3">
              <div className="form-group">
                <label>District <span className="req">*</span></label>
                <select required value={form.district}
                  onChange={(e) => setField('district', e.target.value)}>
                  <option value="">Select district</option>
                  <option>Peshawar</option>
                  <option>Mardan</option>
                  <option>Swat</option>
                  <option>Abbottabad</option>
                  <option>Mansehra</option>
                  <option>Charsadda</option>
                  <option>Nowshera</option>
                  <option>Kohat</option>
                  <option>Bannu</option>
                  <option>Dera Ismail Khan</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tehsil</label>
                <input type="text" value={form.tehsil}
                  onChange={(e) => setField('tehsil', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Union Council / Village</label>
                <input type="text" value={form.unionCouncil}
                  onChange={(e) => setField('unionCouncil', e.target.value)} />
              </div>
              <div className="form-group span-2">
                <label>Farm Address <span className="req">*</span></label>
                <input type="text" required value={form.farmAddress}
                  onChange={(e) => setField('farmAddress', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Farm GPS Location</label>
                <input type="text" placeholder="Lat, Long" value={form.gpsLocation}
                  onChange={(e) => setField('gpsLocation', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Livestock */}
        <div className="card section-gap">
          <div className="card-header">
            <div className="card-header-icon green">🐄</div>
            <div><h2>Livestock Details</h2><p>Number and production status of animals</p></div>
          </div>
          <div className="card-body">
            <table className="animal-table">
              <thead>
                <tr>
                  <th>Type</th><th>Milking Animals</th><th>Daily Milk (L)</th>
                  <th>Dry Animals</th><th>Young Ones</th><th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Cows</strong></td>
                  <td><input type="number" min="0" value={form.livestock.cows.milking}
                    onChange={(e) => setNested('livestock', 'cows', 'milking', e.target.value)} /></td>
                  <td><input type="number" min="0" value={form.livestock.cows.dailyMilk}
                    onChange={(e) => setNested('livestock', 'cows', 'dailyMilk', e.target.value)} /></td>
                  <td><input type="number" min="0" value={form.livestock.cows.dry}
                    onChange={(e) => setNested('livestock', 'cows', 'dry', e.target.value)} /></td>
                  <td><input type="number" min="0" value={form.livestock.cows.youngOnes}
                    onChange={(e) => setNested('livestock', 'cows', 'youngOnes', e.target.value)} /></td>
                  <td style={{ color: 'var(--green-700)', fontWeight: 600 }}>{cowTotal}</td>
                </tr>
                <tr>
                  <td><strong>Buffaloes</strong></td>
                  <td><input type="number" min="0" value={form.livestock.buffaloes.milking}
                    onChange={(e) => setNested('livestock', 'buffaloes', 'milking', e.target.value)} /></td>
                  <td><input type="number" min="0" value={form.livestock.buffaloes.dailyMilk}
                    onChange={(e) => setNested('livestock', 'buffaloes', 'dailyMilk', e.target.value)} /></td>
                  <td><input type="number" min="0" value={form.livestock.buffaloes.dry}
                    onChange={(e) => setNested('livestock', 'buffaloes', 'dry', e.target.value)} /></td>
                  <td><input type="number" min="0" value={form.livestock.buffaloes.youngOnes}
                    onChange={(e) => setNested('livestock', 'buffaloes', 'youngOnes', e.target.value)} /></td>
                  <td style={{ color: 'var(--green-700)', fontWeight: 600 }}>{bufTotal}</td>
                </tr>
                <tr>
                  <td><strong>Total</strong></td>
                  <td colSpan={1}>{form.livestock.cows.milking + form.livestock.buffaloes.milking}</td>
                  <td>{milkTotal} L/day</td>
                  <td>{form.livestock.cows.dry + form.livestock.buffaloes.dry}</td>
                  <td>{form.livestock.cows.youngOnes + form.livestock.buffaloes.youngOnes}</td>
                  <td style={{ color: 'var(--green-700)' }}>{cowTotal + bufTotal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 3: Farm Details */}
        <div className="card section-gap">
          <div className="card-header">
            <div className="card-header-icon gold">🏡</div>
            <div><h2>Farm Details</h2><p>Land, infrastructure, and resource availability</p></div>
          </div>
          <div className="card-body">
            <div className="form-section-label">Land</div>
            <div className="form-grid cols-3" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label>Total Farm Area <span className="req">*</span></label>
                <input type="number" required min="0" step="0.1" value={form.farm.area}
                  onChange={(e) => setFarmField('area', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <select value={form.farm.areaUnit}
                  onChange={(e) => setFarmField('areaUnit', e.target.value)}>
                  <option>Acres</option><option>Kanal</option><option>Sq. ft</option><option>Marla</option>
                </select>
              </div>
              <div className="form-group">
                <label>Land Ownership <span className="req">*</span></label>
                <select required value={form.farm.ownership}
                  onChange={(e) => setFarmField('ownership', e.target.value)}>
                  <option value="">Select</option>
                  <option>Owned</option><option>Leased / Rented</option><option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Animal Housing Type</label>
                <select value={form.farm.housingType}
                  onChange={(e) => setFarmField('housingType', e.target.value)}>
                  <option value="">Select</option>
                  <option>Pacca (Brick/Concrete)</option>
                  <option>Semi-Pacca</option>
                  <option>Katcha</option>
                </select>
              </div>
              <div className="form-group">
                <label>Shade Length (ft)</label>
                <input type="number" min="0" value={form.farm.shadeLength}
                  onChange={(e) => setFarmField('shadeLength', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Shade Width (ft)</label>
                <input type="number" min="0" value={form.farm.shadeWidth}
                  onChange={(e) => setFarmField('shadeWidth', Number(e.target.value))} />
              </div>
            </div>

            <div className="form-section-label">Utilities</div>
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label>Water Source</label>
                <select value={form.farm.waterSource}
                  onChange={(e) => setFarmField('waterSource', e.target.value)}>
                  <option value="">Select source</option>
                  <option>Canal</option><option>Tube Well</option><option>Government Supply</option>
                  <option>Bore / Pump</option><option>Natural Spring</option><option>Pond</option><option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Electricity</label>
                <select value={form.farm.electricity}
                  onChange={(e) => setFarmField('electricity', e.target.value)}>
                  <option value="">Select</option>
                  <option>Single Phase</option><option>Three Phase</option><option>No Electricity</option>
                </select>
              </div>
            </div>

            <div className="form-section-label">Farm Machinery Available</div>
            <div className="checkbox-grid">
              {[
                { key: 'solar', icon: '☀️', label: 'Solar System', sub: 'Off-grid power' },
                { key: 'chopper', icon: '⚙️', label: 'Chopper Machine', sub: 'Feed chopper' },
                { key: 'milkChiller', icon: '❄️', label: 'Milk Chiller', sub: 'Cold storage unit' },
                { key: 'milkingMachine', icon: '🥛', label: 'Milking Machine', sub: 'Automated milking' },
              ].map((m) => (
                <div key={m.key}
                  className={`checkbox-card ${form.machinery[m.key] ? 'checked' : ''}`}
                  onClick={() => toggleMachinery(m.key)}>
                  <div className="cb-box">
                    <svg className="cb-check" viewBox="0 0 10 8"><polyline points="1 4 3.5 6.5 9 1" /></svg>
                  </div>
                  <span className="cb-icon">{m.icon}</span>
                  <div><div className="cb-label">{m.label}</div><div className="cb-sub">{m.sub}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: Application Type */}
        <div className="card section-gap">
          <div className="card-header">
            <div className="card-header-icon blue">📋</div>
            <div><h2>Application Type</h2><p>Select what the farmer is applying for</p></div>
          </div>
          <div className="card-body">
            <div className="radio-group">
              {['Land Leveller', 'Seed Sowing Machine', 'Milking Machine', 'Milking Book System'].map((opt) => (
                <div key={opt}
                  className={`radio-pill ${form.applicationType === opt ? 'selected' : ''}`}
                  onClick={() => setField('applicationType', opt)}>
                  {opt}
                </div>
              ))}
            </div>
            <div className="form-group" style={{ marginTop: 14 }}>
              <label>Additional Notes</label>
              <textarea placeholder="Any additional remarks..." value={form.notes}
                onChange={(e) => setField('notes', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setForm(emptyForm)}>
            Clear Form
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Submitting...' : '✅ Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DataEntry;
