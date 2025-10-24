import { useState } from 'react';
import './TeamRegistration.css';
import { registerTeam } from '../lib/api';

export default function TeamRegistration({ onTeamRegistered }) {
  const [members, setMembers] = useState([{ name: '', rollNo: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addMember = () => {
    if (members.length < 3) {
      setMembers([...members, { name: '', rollNo: '' }]);
    }
  };

  const removeMember = (index) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate all members have both fields filled
    for (const member of members) {
      if (!member.name.trim() || !member.rollNo.trim()) {
        setError('Please fill in all fields for all team members');
        return;
      }
    }

    setLoading(true);
    
    try {
      const data = await registerTeam(members);
      
      // Store teamId in localStorage
      localStorage.setItem('teamId', data.teamId);
      localStorage.setItem('teamMembers', JSON.stringify(data.members));
      
      // Notify parent component
      onTeamRegistered(data.teamId, data.members);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        <h1 className="registration-title">🕵️ Detective Team Registration</h1>
        <p className="registration-subtitle">
          Form your investigative team (1-3 members) to solve the mystery
        </p>

        <form onSubmit={handleSubmit} className="registration-form">
          {members.map((member, index) => (
            <div key={index} className="member-row">
              <div className="member-number">Member {index + 1}</div>
              <div className="member-inputs">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={member.name}
                  onChange={(e) => updateMember(index, 'name', e.target.value)}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Roll Number"
                  value={member.rollNo}
                  onChange={(e) => updateMember(index, 'rollNo', e.target.value)}
                  className="input-field"
                  required
                />
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="remove-btn"
                    title="Remove member"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}

          {members.length < 3 && (
            <button
              type="button"
              onClick={addMember}
              className="add-member-btn"
            >
              + Add Team Member
            </button>
          )}

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Registering...' : 'Start Investigation →'}
          </button>
        </form>

        <div className="info-box">
          <strong>Note:</strong> After registration, you'll receive a unique Team ID. 
          All team members will share the same investigation progress.
        </div>
      </div>
    </div>
  );
}
