import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

function ManageAcademic() {
  const [session, setSession] = useState(null);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    semester: "Fall",
    year: new Date().getFullYear(),
    registration_start_date: "",
    registration_end_date: "",
    classes_start_date: "",
    classes_end_date: "",
  });

  const token = localStorage.getItem("token");
  const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  const loadCurrentSession = async () => {
    try {
      const res = await api.get("/academic/current-session");
      setSession(res.data.session);
      setRegistrationOpen(res.data.registration_open);
    } catch (error) {
      console.error("Error loading session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await api.post("/academic/admin/session", formData);
      toast.success("Academic session created successfully");
      loadCurrentSession();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create session");
    }
  };

  const handleToggleRegistration = async () => {
    if (!session) return;
    
    try {
        await api.put('/academic/admin/registration-status', {
            session_id: session.session_id,
            is_open: !registrationOpen,
            start_date: formData.registration_start_date || new Date().toISOString().split('T')[0],
            end_date: formData.registration_end_date || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
        });
        setRegistrationOpen(!registrationOpen);
        toast.success(registrationOpen ? 'Registration closed' : 'Registration opened');
        loadCurrentSession();
    } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to update registration status');
    }
};


  const handleEndSemester = async () => {
    if (confirm('This will end the current semester, calculate all student GPAs, and determine promotions. This action cannot be undone. Continue?')) {
        try {
            const res = await api.post('/academic/admin/end-semester');
            toast.success(res.data.message);
            loadCurrentSession();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to end semester');
        }
    }
};

  useEffect(() => {
    loadCurrentSession();
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>
    );

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
      <h1>📅 Academic Management</h1>
      <p>Manage semesters, registration periods, and student promotions</p>

      {/* Current Session Info */}
      {session && (
        <div
          style={{
            backgroundColor: "#e0e7ff",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "30px",
          }}
        >
          <h3>Current Active Session</h3>
          <p>
            <strong>
              {session.semester} {session.year}
            </strong>
          </p>
          <p>Registration: {registrationOpen ? "🟢 OPEN" : "🔴 CLOSED"}</p>
          <button onClick={handleToggleRegistration} style={actionBtnStyle}>
            {registrationOpen ? "Close Registration" : "Open Registration"}
          </button>

          <button
            onClick={handleEndSemester}
            style={{ ...actionBtnStyle, backgroundColor: "#ef4444" }}
          >
            🏁 End Current Semester & Calculate Results
          </button>
        </div>
      )}

      {/* Create/Edit Session */}
      <div
        style={{
          backgroundColor: "#f5f5f5",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        <h3>Create/Edit Academic Session</h3>
        <form onSubmit={handleCreateSession}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "15px",
            }}
          >
            <div>
              <label style={labelStyle}>Semester</label>
              <select
                value={formData.semester}
                onChange={(e) =>
                  setFormData({ ...formData, semester: e.target.value })
                }
                style={inputStyle}
              >
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Year</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Registration Start Date</label>
              <input
                type="date"
                value={formData.registration_start_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registration_start_date: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Registration End Date</label>
              <input
                type="date"
                value={formData.registration_end_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registration_end_date: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Classes Start Date</label>
              <input
                type="date"
                value={formData.classes_start_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    classes_start_date: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Classes End Date</label>
              <input
                type="date"
                value={formData.classes_end_date}
                onChange={(e) =>
                  setFormData({ ...formData, classes_end_date: e.target.value })
                }
                style={inputStyle}
              />
            </div>
          </div>
          <button
            type="submit"
            style={{ ...actionBtnStyle, marginTop: "20px" }}
          >
            Save Session
          </button>
        </form>
      </div>
    </div>
  );
}

const actionBtnStyle = {
  padding: "8px 16px",
  backgroundColor: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const labelStyle = {
  display: "block",
  marginBottom: "5px",
  fontWeight: "bold",
  fontSize: "14px",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  border: "1px solid #ddd",
  borderRadius: "5px",
  fontSize: "14px",
};

export default ManageAcademic;
