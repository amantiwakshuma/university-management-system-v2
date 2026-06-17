import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

function AdminDashboard() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSectionName, setSelectedSectionName] = useState(null);
  const [students, setStudents] = useState([]);
  const [sectionCourses, setSectionCourses] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [showCreateInstructor, setShowCreateInstructor] = useState(false);
  const [showAssignInstructor, setShowAssignInstructor] = useState(false);
  const [activeTab, setActiveTab] = useState("sections");
  const [unassignedSections, setUnassignedSections] = useState([]);
  const [allInstructors, setAllInstructors] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [allInstructorsList, setAllInstructorsList] = useState([]);

  const [newStudent, setNewStudent] = useState({
    student_id: "",
    first_name: "",
    last_name: "",
    email: "",
    department_id: "",
    section_name: "",
    username: "",
    password: "",
  });

  const [newInstructor, setNewInstructor] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department_id: "",
    username: "",
    password: "",
  });

  const [instructorAssignment, setInstructorAssignment] = useState({
    section_id: "",
    instructor_id: "",
  });

  const [newCourse, setNewCourse] = useState({
    course_code: "",
    course_name: "",
    credit_hours: "",
    department_id: "",
  });

  const [newSection, setNewSection] = useState({
    course_id: "",
    instructor_id: "",
    room_id: "",
    section_name: "",
    schedule: "",
  });

  const token = localStorage.getItem("token");
  const api = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Load functions
  const loadDepartments = async () => {
    const res = await api.get("/admin/departments");
    setDepartments(res.data);
  };

  const loadSectionsByDepartment = async (deptId) => {
    const res = await api.get(`/admin/department/${deptId}/sections`);
    setSections(res.data);
  };

  const loadStudentsBySection = async (sectionName) => {
    const res = await api.get(`/admin/section/${sectionName}/students`);
    setStudents(res.data);
  };

  const loadSectionCourses = async (sectionName) => {
    const res = await api.get(`/admin/section/${sectionName}/courses`);
    setSectionCourses(res.data);
  };

  const loadAvailableStudents = async () => {
    const res = await api.get("/admin/students/available");
    setAvailableStudents(res.data);
  };

  const loadAllCourses = async () => {
    const res = await api.get("/admin/courses/all");
    setAllCourses(res.data);
  };

  const loadInstructors = async () => {
    const res = await api.get("/admin/instructors");
    setInstructors(res.data);
  };

  const loadAllInstructors = async () => {
    const res = await api.get("/admin/instructors/all");
    setAllInstructors(res.data);
  };

  const loadClassrooms = async () => {
    const res = await api.get("/admin/classrooms");
    setClassrooms(res.data);
  };

  // const loadUnassignedSections = async () => {
  //   const res = await api.get("/admin/sections/unassigned");
  //   setUnassignedSections(res.data);
  // };

  const loadAvailableSections = async () => {
    try {
      const res = await api.get("/admin/sections/for-assignment");
      setAvailableSections(res.data);
    } catch (error) {
      console.error("Error loading sections:", error);
    }
  };

  const loadInstructorsList = async () => {
    try {
      const res = await api.get("/admin/instructors/list");
      setAllInstructorsList(res.data);
    } catch (error) {
      console.error("Error loading instructors:", error);
    }
  };

  // Handlers
  const handleDepartmentClick = async (dept) => {
    setSelectedDept(dept);
    setSelectedSectionName(null);
    setStudents([]);
    setSectionCourses([]);
    await loadSectionsByDepartment(dept.department_id);
    await loadAvailableStudents();
  };

  const handleSectionClick = async (sectionName) => {
    console.log("Clicked section:", sectionName); // Debug log
    setSelectedSectionName(sectionName);
    setShowCreateStudent(false); // Hide create student form when clicking new section
    setShowAddStudent(false); // Hide add existing student form
    await Promise.all([
      loadStudentsBySection(sectionName),
      loadSectionCourses(sectionName),
    ]);
  };

  // Student Management
  const handleAddNewStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/student", {
        first_name: newStudent.first_name,
        last_name: newStudent.last_name,
        email: newStudent.email,
        department_id: selectedDept.department_id,
        section_name: selectedSectionName,
        username: newStudent.username,
        password: newStudent.password,
      });
      toast.success(`Student added to section ${selectedSectionName}`);
      setShowCreateStudent(false);
      setNewStudent({
        first_name: "",
        last_name: "",
        email: "",
        department_id: "",
        section_name: "",
        username: "",
        password: "",
        student_id: "",
      });
      await loadStudentsBySection(selectedSectionName);
      await loadAvailableStudents();
      await loadSectionsByDepartment(selectedDept.department_id);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add student");
    }
  };

  const handleAddExistingStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/admin/section/${selectedSectionName}/add-student`, {
        student_id: newStudent.student_id,
      });
      toast.success(`Student added to section ${selectedSectionName}`);
      setShowAddStudent(false);
      setNewStudent({ ...newStudent, student_id: "" });
      await loadStudentsBySection(selectedSectionName);
      await loadAvailableStudents();
      await loadSectionsByDepartment(selectedDept.department_id);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add student");
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (confirm("Remove this student from section?")) {
      try {
        await api.delete(
          `/admin/section/${selectedSectionName}/remove-student/${studentId}`,
        );
        toast.success("Student removed");
        await loadStudentsBySection(selectedSectionName);
        await loadAvailableStudents();
        await loadSectionsByDepartment(selectedDept.department_id);
      } catch (error) {
        toast.error("Failed to remove student");
      }
    }
  };

  // Instructor Management
  const handleAddInstructor = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/instructor", newInstructor);
      toast.success("Instructor created successfully");
      setShowCreateInstructor(false);
      setNewInstructor({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        department_id: "",
        username: "",
        password: "",
      });
      await loadAllInstructors();
      await loadInstructors();
      await loadInstructorsList();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add instructor");
    }
  };

  const handleDeleteInstructor = async (instructorId) => {
    if (
      confirm(
        "Delete this instructor? This will remove them from all sections.",
      )
    ) {
      try {
        await api.delete(`/admin/instructor/${instructorId}`);
        toast.success("Instructor deleted");
        await loadAllInstructors();
        await loadInstructors();
        await loadInstructorsList();
        await loadSectionsByDepartment(selectedDept?.department_id);
        await loadAvailableSections();
      } catch (error) {
        toast.error("Failed to delete instructor");
      }
    }
  };

  const handleAssignInstructor = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(
        `/admin/section/${instructorAssignment.section_id}/assign-instructor`,
        {
          instructor_id: instructorAssignment.instructor_id,
        },
      );
      toast.success(`Instructor assigned successfully`);
      setShowAssignInstructor(false);
      setInstructorAssignment({ section_id: "", instructor_id: "" });

      await Promise.all([
        loadAvailableSections(),
        loadSectionsByDepartment(selectedDept?.department_id),
        // loadUnassignedSections()
      ]);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to assign instructor");
    }
  };

  // Section Management
  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/section/create", newSection);
      toast.success("Section created successfully");
      setShowCreateSection(false);
      setNewSection({
        course_id: "",
        instructor_id: "",
        room_id: "",
        section_name: "",
        schedule: "",
      });
      if (selectedDept) {
        await loadSectionsByDepartment(selectedDept.department_id);
      }
      await loadAllCourses();
      // await loadUnassignedSections();
      await loadAvailableSections();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create section");
    }
  };

  // Course Management
  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/course", newCourse);
      toast.success("Course added successfully");
      setShowAddCourse(false);
      setNewCourse({
        course_code: "",
        course_name: "",
        credit_hours: "",
        department_id: "",
      });
      await loadAllCourses();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add course");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (
      confirm(
        "Delete this course? This will also delete all sections using this course.",
      )
    ) {
      try {
        await api.delete(`/admin/course/${courseId}`);
        toast.success("Course deleted successfully");
        await loadAllCourses();
        if (selectedDept) {
          await loadSectionsByDepartment(selectedDept.department_id);
        }
        await loadAvailableSections();
      } catch (error) {
        toast.error(error.response?.data?.error || "Failed to delete course");
      }
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await Promise.all([
        loadDepartments(),
        loadAllCourses(),
        loadInstructors(),
        loadClassrooms(),
        loadAllInstructors(),
        // loadUnassignedSections(),
        loadAvailableSections(),
        loadInstructorsList(),
      ]);
      setLoading(false);
    };
    loadAllData();
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>
    );

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
      <h1>👑 Admin Dashboard</h1>
      <p>Manage Students, Instructors, Sections, and Courses by Department</p>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          borderBottom: "1px solid #ddd",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setActiveTab("sections")}
          style={tabStyle(activeTab === "sections")}
        >
          📚 Sections & Students
        </button>
        <button
          onClick={() => setActiveTab("instructors")}
          style={tabStyle(activeTab === "instructors")}
        >
          👨‍🏫 Manage Instructors
        </button>
        <button
          onClick={() => setActiveTab("courses")}
          style={tabStyle(activeTab === "courses")}
        >
          📖 Manage Courses
        </button>
      </div>

      {/* ============================================= */}
      {/* INSTRUCTORS MANAGEMENT TAB */}
      {/* ============================================= */}
      {activeTab === "instructors" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h2>👨‍🏫 Instructor Management</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowCreateInstructor(!showCreateInstructor)}
                style={{ ...actionBtnStyle, backgroundColor: "#2563eb" }}
              >
                {showCreateInstructor ? "❌ Cancel" : "+ Add New Instructor"}
              </button>
              <button
                onClick={() => {
                  setShowAssignInstructor(!showAssignInstructor);
                  loadAvailableSections();
                }}
                style={{ ...actionBtnStyle, backgroundColor: "#8b5cf6" }}
              >
                {showAssignInstructor ? "❌ Cancel" : "📌 Assign to Section"}
              </button>
            </div>
          </div>

          {showCreateInstructor && (
            <form onSubmit={handleAddInstructor} style={formStyle}>
              <h3>Add New Instructor</h3>
              <div style={gridStyle}>
                <input
                  type="text"
                  placeholder="First Name"
                  value={newInstructor.first_name}
                  onChange={(e) =>
                    setNewInstructor({
                      ...newInstructor,
                      first_name: e.target.value,
                    })
                  }
                  required
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={newInstructor.last_name}
                  onChange={(e) =>
                    setNewInstructor({
                      ...newInstructor,
                      last_name: e.target.value,
                    })
                  }
                  required
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newInstructor.email}
                  onChange={(e) =>
                    setNewInstructor({
                      ...newInstructor,
                      email: e.target.value,
                    })
                  }
                  required
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={newInstructor.phone}
                  onChange={(e) =>
                    setNewInstructor({
                      ...newInstructor,
                      phone: e.target.value,
                    })
                  }
                  style={inputStyle}
                />
                <select
                  value={newInstructor.department_id}
                  onChange={(e) =>
                    setNewInstructor({
                      ...newInstructor,
                      department_id: e.target.value,
                    })
                  }
                  required
                  style={inputStyle}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.department_id} value={d.department_id}>
                      {d.department_name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Username"
                  value={newInstructor.username}
                  onChange={(e) =>
                    setNewInstructor({
                      ...newInstructor,
                      username: e.target.value,
                    })
                  }
                  required
                  style={inputStyle}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newInstructor.password}
                  onChange={(e) =>
                    setNewInstructor({
                      ...newInstructor,
                      password: e.target.value,
                    })
                  }
                  required
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                style={{ ...actionBtnStyle, marginTop: "15px" }}
              >
                Save Instructor
              </button>
            </form>
          )}

          {showAssignInstructor && (
            <form onSubmit={handleAssignInstructor} style={formStyle}>
              <h3>Assign Instructor to Course Section</h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "#666",
                  marginBottom: "15px",
                }}
              >
                Each course in a section can have its own instructor
              </p>
              <div style={gridStyle}>
                <select
                  value={instructorAssignment.section_id}
                  onChange={(e) =>
                    setInstructorAssignment({
                      ...instructorAssignment,
                      section_id: e.target.value,
                    })
                  }
                  required
                  style={inputStyle}
                >
                  <option value="">Select Course Section</option>
                  {availableSections.map((s) => (
                    <option key={s.SECTION_ID} value={s.SECTION_ID}>
                      {s.DEPARTMENT_NAME} - {s.SECTION_NAME} : {s.COURSE_CODE} -{" "}
                      {s.COURSE_NAME}
                      {s.CURRENT_INSTRUCTOR
                        ? ` (Current: ${s.CURRENT_INSTRUCTOR})`
                        : " (Unassigned)"}
                    </option>
                  ))}
                </select>
                <select
                  value={instructorAssignment.instructor_id}
                  onChange={(e) =>
                    setInstructorAssignment({
                      ...instructorAssignment,
                      instructor_id: e.target.value,
                    })
                  }
                  required
                  style={inputStyle}
                >
                  <option value="">Select Instructor</option>
                  {allInstructorsList.map((i) => (
                    <option key={i.INSTRUCTOR_ID} value={i.INSTRUCTOR_ID}>
                      {i.FIRST_NAME} {i.LAST_NAME} - {i.DEPARTMENT_NAME}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                style={{ ...actionBtnStyle, marginTop: "15px" }}
              >
                Assign Instructor
              </button>
            </form>
          )}

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                backgroundColor: "white",
                borderRadius: "8px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#2563eb", color: "white" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>ID</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Phone</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>
                    Department
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>
                    Username
                  </th>
                  <th style={{ padding: "12px", textAlign: "center" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {allInstructors.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      style={{
                        padding: "30px",
                        textAlign: "center",
                        color: "#666",
                      }}
                    >
                      No instructors found. Click "Add New Instructor" to create
                      one.
                    </td>
                  </tr>
                ) : (
                  allInstructors.map((instructor) => (
                    <tr key={instructor.INSTRUCTOR_ID}>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {instructor.INSTRUCTOR_ID}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        <strong>
                          {instructor.FIRST_NAME} {instructor.LAST_NAME}
                        </strong>
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {instructor.EMAIL}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {instructor.PHONE || "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {instructor.DEPARTMENT_NAME}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {instructor.USERNAME}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #ddd",
                          textAlign: "center",
                        }}
                      >
                        <button
                          onClick={() =>
                            handleDeleteInstructor(instructor.INSTRUCTOR_ID)
                          }
                          style={deleteBtnStyle}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* SECTIONS & STUDENTS TAB */}
      {/* ============================================= */}
      {/* ============================================= */}
      {/* SECTIONS & STUDENTS TAB - FIXED */}
      {/* ============================================= */}
      {activeTab === "sections" && (
        <>
          <button
            onClick={() => setShowCreateSection(!showCreateSection)}
            style={{
              ...actionBtnStyle,
              marginBottom: "20px",
              backgroundColor: "#2563eb",
            }}
          >
            {showCreateSection ? "❌ Cancel" : "+ Create New Section"}
          </button>

          {showCreateSection && (
            <form onSubmit={handleCreateSection} style={formStyle}>
              <h3>Create New Section</h3>
              <div style={gridStyle}>
                <select
                  value={newSection.course_id}
                  onChange={(e) =>
                    setNewSection({ ...newSection, course_id: e.target.value })
                  }
                  required
                  style={inputStyle}
                >
                  <option value="">Select Course</option>
                  {allCourses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>
                      {c.course_code} - {c.course_name}
                    </option>
                  ))}
                </select>
                <select
                  value={newSection.instructor_id}
                  onChange={(e) =>
                    setNewSection({
                      ...newSection,
                      instructor_id: e.target.value,
                    })
                  }
                  style={inputStyle}
                >
                  <option value="">Select Instructor (Optional)</option>
                  {instructors.map((i) => (
                    <option key={i.instructor_id} value={i.instructor_id}>
                      {i.first_name} {i.last_name}
                    </option>
                  ))}
                </select>
                <select
                  value={newSection.room_id}
                  onChange={(e) =>
                    setNewSection({ ...newSection, room_id: e.target.value })
                  }
                  required
                  style={inputStyle}
                >
                  <option value="">Select Classroom</option>
                  {classrooms.map((r) => (
                    <option key={r.room_id} value={r.room_id}>
                      {r.building} - Room {r.room_number}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Section Name (e.g., 4A, 4B)"
                  value={newSection.section_name}
                  onChange={(e) =>
                    setNewSection({
                      ...newSection,
                      section_name: e.target.value,
                    })
                  }
                  required
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Schedule (e.g., Mon/Wed 10:00-11:30)"
                  value={newSection.schedule}
                  onChange={(e) =>
                    setNewSection({ ...newSection, schedule: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <button
                type="submit"
                style={{ ...actionBtnStyle, marginTop: "15px" }}
              >
                Create Section
              </button>
            </form>
          )}

          <div
            style={{
              display: "flex",
              gap: "20px",
              marginTop: "20px",
              flexWrap: "wrap",
            }}
          >
            {/* LEFT PANEL: Departments */}
            <div
              style={{
                width: "250px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                padding: "15px",
              }}
            >
              <h3>📚 Departments</h3>
              {departments.map((dept) => (
                <div
                  key={dept.department_id}
                  onClick={() => handleDepartmentClick(dept)}
                  style={{
                    padding: "10px",
                    marginBottom: "5px",
                    backgroundColor:
                      selectedDept?.department_id === dept.department_id
                        ? "#2563eb"
                        : "white",
                    color:
                      selectedDept?.department_id === dept.department_id
                        ? "white"
                        : "#333",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight:
                      selectedDept?.department_id === dept.department_id
                        ? "bold"
                        : "normal",
                  }}
                >
                  {dept.department_name}
                </div>
              ))}
            </div>

            {/* MIDDLE PANEL: Sections */}
            {selectedDept && (
              <div
                style={{
                  width: "280px",
                  backgroundColor: "#f5f5f5",
                  borderRadius: "8px",
                  padding: "15px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <h3>📖 Sections in {selectedDept.department_name}</h3>
                  <button
                    onClick={() => setShowCreateStudent(!showCreateStudent)}
                    style={{
                      ...actionBtnStyle,
                      padding: "5px 10px",
                      fontSize: "12px",
                    }}
                  >
                    {showCreateStudent ? "❌" : "+ Student"}
                  </button>
                </div>

                {sections.length === 0 ? (
                  <p style={{ color: "#666" }}>
                    No sections found. Create one above.
                  </p>
                ) : (
                  sections.map((section) => (
                    <div
                      key={section.section_name}
                      onClick={() => handleSectionClick(section.section_name)}
                      style={{
                        padding: "12px",
                        marginBottom: "8px",
                        backgroundColor:
                          selectedSectionName === section.section_name
                            ? "#10b981"
                            : "white",
                        color:
                          selectedSectionName === section.section_name
                            ? "white"
                            : "#333",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: "1px solid #ddd",
                      }}
                    >
                      <strong style={{ fontSize: "16px" }}>
                        Section {section.section_name}
                      </strong>
                      <div style={{ fontSize: "12px", marginTop: "5px" }}>
                        📚 {section.course_count} courses | 👨‍🎓{" "}
                        {section.student_count} students
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          marginTop: "3px",
                          color:
                            selectedSectionName === section.section_name
                              ? "#ddd"
                              : "#666",
                        }}
                      >
                        Courses: {section.courses}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* RIGHT PANEL: Students & Courses in Selected Section */}
            {selectedSectionName && (
              <div
                style={{
                  flex: 1,
                  backgroundColor: "#f5f5f5",
                  borderRadius: "8px",
                  padding: "15px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  <h2>Section {selectedSectionName}</h2>
                  <button
                    onClick={() => setShowAddStudent(!showAddStudent)}
                    style={actionBtnStyle}
                  >
                    {showAddStudent ? "❌ Cancel" : "➕ Add Existing Student"}
                  </button>
                </div>

                {/* Add Student Form */}
                {showAddStudent && (
                  <form onSubmit={handleAddExistingStudent} style={formStyle}>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <select
                        value={newStudent.student_id}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            student_id: e.target.value,
                          })
                        }
                        required
                        style={{ ...inputStyle, flex: 1 }}
                      >
                        <option value="">Select Student</option>
                        {availableStudents.map((s) => (
                          <option key={s.student_id} value={s.student_id}>
                            {s.roll_number} - {s.first_name} {s.last_name}
                          </option>
                        ))}
                      </select>
                      <button type="submit" style={actionBtnStyle}>
                        Add
                      </button>
                    </div>
                  </form>
                )}

                {/* Create New Student Form */}
                {showCreateStudent && (
                  <form
                    onSubmit={handleAddNewStudent}
                    style={{ ...formStyle, marginBottom: "15px" }}
                  >
                    <h4>Add New Student to Section {selectedSectionName}</h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="First Name"
                        value={newStudent.first_name}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            first_name: e.target.value,
                          })
                        }
                        required
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={newStudent.last_name}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            last_name: e.target.value,
                          })
                        }
                        required
                        style={inputStyle}
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={newStudent.email}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            email: e.target.value,
                          })
                        }
                        required
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        placeholder="Roll Number"
                        value={newStudent.roll_number}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            roll_number: e.target.value,
                          })
                        }
                        required
                        style={inputStyle}
                      />
                      <input
                        type="text"
                        placeholder="Username"
                        value={newStudent.username}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            username: e.target.value,
                          })
                        }
                        required
                        style={inputStyle}
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={newStudent.password}
                        onChange={(e) =>
                          setNewStudent({
                            ...newStudent,
                            password: e.target.value,
                          })
                        }
                        required
                        style={inputStyle}
                      />
                    </div>
                    <button
                      type="submit"
                      style={{ ...actionBtnStyle, marginTop: "10px" }}
                    >
                      Save Student
                    </button>
                  </form>
                )}

                {/* Students Table */}
                <div style={{ marginBottom: "30px" }}>
                  <h3>👨‍🎓 Students ({students.length})</h3>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        backgroundColor: "white",
                        borderRadius: "8px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{ backgroundColor: "#2563eb", color: "white" }}
                        >
                          <th style={{ padding: "10px", textAlign: "left" }}>
                            Roll No
                          </th>
                          <th style={{ padding: "10px", textAlign: "left" }}>
                            Name
                          </th>
                          <th style={{ padding: "10px", textAlign: "left" }}>
                            Email
                          </th>
                          <th style={{ padding: "10px", textAlign: "center" }}>
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.length === 0 ? (
                          <tr>
                            <td
                              colSpan="4"
                              style={{
                                padding: "20px",
                                textAlign: "center",
                                color: "#666",
                              }}
                            >
                              No students in this section
                            </td>
                          </tr>
                        ) : (
                          students.map((student) => (
                            <tr key={student.student_id}>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #ddd",
                                }}
                              >
                                {student.roll_number}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #ddd",
                                }}
                              >
                                {student.first_name} {student.last_name}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #ddd",
                                }}
                              >
                                {student.email}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #ddd",
                                  textAlign: "center",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    handleRemoveStudent(student.student_id)
                                  }
                                  style={deleteBtnStyle}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Courses Table */}
                {/* Courses Table - FIXED */}
                <div>
                  <h3>
                    📚 Courses in Section {selectedSectionName} (
                    {sectionCourses.length})
                  </h3>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        backgroundColor: "white",
                        borderRadius: "8px",
                      }}
                    >
                      <thead>
                        <tr
                          style={{ backgroundColor: "#2563eb", color: "white" }}
                        >
                          <th style={{ padding: "10px", textAlign: "left" }}>
                            Course Code
                          </th>
                          <th style={{ padding: "10px", textAlign: "left" }}>
                            Course Name
                          </th>
                          <th style={{ padding: "10px", textAlign: "center" }}>
                            Credits
                          </th>
                          <th style={{ padding: "10px", textAlign: "left" }}>
                            Instructor
                          </th>
                          <th style={{ padding: "10px", textAlign: "left" }}>
                            Schedule
                          </th>
                          <th style={{ padding: "10px", textAlign: "left" }}>
                            Room
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectionCourses.length === 0 ? (
                          <tr>
                            <td
                              colSpan="6"
                              style={{
                                padding: "20px",
                                textAlign: "center",
                                color: "#666",
                              }}
                            >
                              No courses assigned to this section. Create a
                              section with a course first.
                            </td>
                          </tr>
                        ) : (
                          sectionCourses.map((course) => (
                            <tr key={course.section_id}>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #ddd",
                                }}
                              >
                                <strong>
                                  {course.course_code !== "N/A"
                                    ? course.course_code
                                    : "Not Assigned"}
                                </strong>
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #ddd",
                                }}
                              >
                                {course.course_name !== "Unknown Course"
                                  ? course.course_name
                                  : "Not Assigned"}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #ddd",
                                  textAlign: "center",
                                }}
                              >
                                {course.credit_hours || "-"}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #ddd",
                                }}
                              >
                                {course.instructor_name !== "Not Assigned"
                                  ? course.instructor_name
                                  : "Not Assigned"}
                                {course.instructor_id === null && (
                                  <button
                                    onClick={() => {
                                      setInstructorAssignment({
                                        ...instructorAssignment,
                                        section_id: course.section_id,
                                      });
                                      setShowAssignInstructor(true);
                                      setActiveTab("instructors");
                                    }}
                                    style={{
                                      ...smallBtnStyle,
                                      marginLeft: "8px",
                                      backgroundColor: "#8b5cf6",
                                    }}
                                  >
                                    Assign
                                  </button>
                                )}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #ddd",
                                }}
                              >
                                {course.schedule !== "TBD"
                                  ? course.schedule
                                  : "TBD"}
                              </td>
                              <td
                                style={{
                                  padding: "10px",
                                  borderBottom: "1px solid #ddd",
                                }}
                              >
                                {course.room_number !== "N/A"
                                  ? `${course.building} - ${course.room_number}`
                                  : "Not Assigned"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      {/* ============================================= */}
      {/* COURSES MANAGEMENT TAB */}
      {/* ============================================= */}
      {activeTab === "courses" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <h2>📖 Course Catalog</h2>
            <button
              onClick={() => setShowAddCourse(!showAddCourse)}
              style={{ ...actionBtnStyle, backgroundColor: "#2563eb" }}
            >
              {showAddCourse ? "❌ Cancel" : "+ Add New Course"}
            </button>
          </div>

          {showAddCourse && (
            <form onSubmit={handleAddCourse} style={formStyle}>
              <h3>Add New Course</h3>
              <div style={gridStyle}>
                <input
                  type="text"
                  placeholder="Course Code (e.g., CS101)"
                  value={newCourse.course_code}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      course_code: e.target.value.toUpperCase(),
                    })
                  }
                  required
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Course Name"
                  value={newCourse.course_name}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, course_name: e.target.value })
                  }
                  required
                  style={inputStyle}
                />
                <input
                  type="number"
                  placeholder="Credit Hours"
                  value={newCourse.credit_hours}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, credit_hours: e.target.value })
                  }
                  required
                  style={inputStyle}
                />
                <select
                  value={newCourse.department_id}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      department_id: e.target.value,
                    })
                  }
                  required
                  style={inputStyle}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.department_id} value={d.department_id}>
                      {d.department_name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                style={{ ...actionBtnStyle, marginTop: "15px" }}
              >
                Save Course
              </button>
            </form>
          )}

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                backgroundColor: "white",
                borderRadius: "8px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#2563eb", color: "white" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>ID</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>
                    Course Code
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>
                    Course Name
                  </th>
                  <th style={{ padding: "12px", textAlign: "center" }}>
                    Credits
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>
                    Department
                  </th>
                  <th style={{ padding: "12px", textAlign: "center" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {allCourses.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        padding: "30px",
                        textAlign: "center",
                        color: "#666",
                      }}
                    >
                      No courses found. Click "Add New Course" to create one.
                    </td>
                  </tr>
                ) : (
                  allCourses.map((course) => (
                    <tr key={course.course_id}>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {course.course_id}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        <strong>{course.course_code}</strong>
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {course.course_name}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #ddd",
                          textAlign: "center",
                        }}
                      >
                        {course.credit_hours}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        {course.department_name}
                      </td>
                      <td
                        style={{
                          padding: "12px",
                          borderBottom: "1px solid #ddd",
                          textAlign: "center",
                        }}
                      >
                        <button
                          onClick={() => handleDeleteCourse(course.course_id)}
                          style={deleteBtnStyle}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const tabStyle = (isActive) => ({
  padding: "10px 20px",
  cursor: "pointer",
  background: isActive ? "#2563eb" : "transparent",
  color: isActive ? "white" : "#333",
  border: "none",
  borderRadius: "8px 8px 0 0",
  fontWeight: isActive ? "bold" : "normal",
});

const actionBtnStyle = {
  padding: "8px 16px",
  backgroundColor: "#10b981",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "14px",
};

const deleteBtnStyle = {
  padding: "5px 12px",
  backgroundColor: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "12px",
};

const formStyle = {
  backgroundColor: "#f9f9f9",
  padding: "15px",
  borderRadius: "8px",
  marginBottom: "20px",
};

const inputStyle = {
  padding: "8px",
  border: "1px solid #ddd",
  borderRadius: "5px",
  fontSize: "14px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "10px",
};

const smallBtnStyle = {
  padding: "3px 8px",
  backgroundColor: "#8b5cf6",
  color: "white",
  border: "none",
  borderRadius: "3px",
  cursor: "pointer",
  fontSize: "11px",
};

export default AdminDashboard;
