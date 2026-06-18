import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

import {
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Plus,
  X,
  Trash2,
  UserPlus,
  ChevronRight,
  School,
  LayoutDashboard,
  LogOut,
  Calendar,
  MapPin,
  Clock,
  DollarSign
} from "lucide-react";
import "./AdminDashboard.css";
import ManageAcademic from "./ManageAcademic";
import ManageSessionCourses from "./ManageSessionCourses";
import LibraryManagement from "./LibraryManagement";
import ManageFees from "./ManageFees/ManageFees";

function AdminDashboard() {
  const navigate = useNavigate();

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

  // UI States
  const [activeTab, setActiveTab] = useState("sections");
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [selectedSections, setSelectedSections] = useState({});
  const [sectionsList, setSectionsList] = useState([]);
  const [showCreateSection, setShowCreateSection] = useState(false);
  const [showCreateInstructor, setShowCreateInstructor] = useState(false);
  const [showAssignInstructor, setShowAssignInstructor] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showCreateStudent, setShowCreateStudent] = useState(false);
  const [showAddExistingStudent, setShowAddExistingStudent] = useState(false);

  // Lists for dropdowns
  const [allInstructors, setAllInstructors] = useState([]);
  const [availableSections, setAvailableSections] = useState([]);
  const [allInstructorsList, setAllInstructorsList] = useState([]);

  // Form States
  const [newStudent, setNewStudent] = useState({
    student_id: "",
    first_name: "",
    last_name: "",
    email: "",
    department_id: "",
    section_name: "",
    username: "",
    password: "",
    roll_number: "",
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

  const backendApi = axios.create({
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  // Load functions
  const loadDepartments = async () => {
    const res = await backendApi.get("/admin/departments");
    setDepartments(res.data);
  };

  const loadSectionsByDepartment = async (deptId) => {
    const res = await backendApi.get(`/admin/department/${deptId}/sections`);
    setSections(res.data);
  };

  const loadStudentsBySection = async (sectionName) => {
    const res = await backendApi.get(`/admin/section/${sectionName}/students`);
    setStudents(res.data);
  };

  const loadSectionCourses = async (sectionName) => {
    const res = await backendApi.get(`/admin/section/${sectionName}/courses`);
    setSectionCourses(res.data);
  };

  const loadAvailableStudents = async () => {
    const res = await backendApi.get("/admin/students/available");
    setAvailableStudents(res.data);
  };

  const loadAllCourses = async () => {
    const res = await backendApi.get("/admin/courses/all");
    setAllCourses(res.data);
  };

  const loadInstructors = async () => {
    const res = await backendApi.get("/admin/instructors");
    setInstructors(res.data);
  };

  const loadAllInstructors = async () => {
    const res = await backendApi.get("/admin/instructors/all");
    setAllInstructors(res.data);
  };

  const loadClassrooms = async () => {
    const res = await backendApi.get("/admin/classrooms");
    setClassrooms(res.data);
  };

  const loadAvailableSections = async () => {
    try {
      const res = await backendApi.get("/admin/sections/for-assignment");
      setAvailableSections(res.data);
    } catch (error) {
      console.error("Error loading sections:", error);
    }
  };

  const loadInstructorsList = async () => {
    try {
      const res = await backendApi.get("/admin/instructors/list");
      setAllInstructorsList(res.data);
    } catch (error) {
      console.error("Error loading instructors:", error);
    }
  };

  const loadUnassignedStudents = async () => {
    try {
      const res = await backendApi.get("/admin/students/unassigned");
      setUnassignedStudents(res.data);
    } catch (error) {
      console.error("Error loading unassigned students:", error);
      toast.error("Failed to load unassigned students");
    }
  };

  const loadSectionsList = async () => {
    try {
      const res = await backendApi.get("/admin/sections/list");
      setSectionsList(res.data.commonSections || []);
    } catch (error) {
      console.error("Error loading sections:", error);
    }
  };

  // Navigation handlers
  const handleLogout = async () => {
    try {
      await backendApi.post("/auth/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      toast.success("Logged out successfully");
      navigate("/login");
    }
  };

  const goToHomeDashboard = () => {
    navigate("/dashboard");
  };

  const assignStudentToSection = async (studentId) => {
    const sectionName = selectedSections[studentId];
    if (!sectionName) {
      toast.error("Please select a section");
      return;
    }

    try {
      await backendApi.put("/admin/students/assign-section", {
        student_id: studentId,
        section_name: sectionName,
      });
      toast.success(`Student assigned to section ${sectionName}`);
      loadUnassignedStudents();
      setSelectedSections((prev) => {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to assign student");
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
    setSelectedSectionName(sectionName);
    setShowCreateStudent(false);
    setShowAddExistingStudent(false);
    await Promise.all([
      loadStudentsBySection(sectionName),
      loadSectionCourses(sectionName),
    ]);
  };

  const handleAddNewStudent = async (e) => {
    e.preventDefault();
    try {
      await backendApi.post("/admin/student", {
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
        roll_number: "",
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
      await backendApi.post(
        `/admin/section/${selectedSectionName}/add-student`,
        {
          student_id: newStudent.student_id,
        },
      );
      toast.success(`Student added to section ${selectedSectionName}`);
      setShowAddExistingStudent(false);
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
        await backendApi.delete(
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

  const handleAddInstructor = async (e) => {
    e.preventDefault();
    try {
      await backendApi.post("/admin/instructor", newInstructor);
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
        await backendApi.delete(`/admin/instructor/${instructorId}`);
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
      await backendApi.post(
        `/admin/section/${instructorAssignment.section_id}/assign-instructor`,
        { instructor_id: instructorAssignment.instructor_id },
      );
      toast.success(`Instructor assigned successfully`);
      setShowAssignInstructor(false);
      setInstructorAssignment({ section_id: "", instructor_id: "" });
      await Promise.all([
        loadAvailableSections(),
        loadSectionsByDepartment(selectedDept?.department_id),
      ]);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to assign instructor");
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      await backendApi.post("/admin/section/create", newSection);
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
      await loadAvailableSections();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create section");
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    try {
      await backendApi.post("/admin/course", newCourse);
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
        await backendApi.delete(`/admin/course/${courseId}`);
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
      try {
        await Promise.all([
          loadDepartments(),
          loadAllCourses(),
          loadInstructors(),
          loadClassrooms(),
          loadAllInstructors(),
          loadAvailableSections(),
          loadInstructorsList(),
          loadUnassignedStudents(),
          loadSectionsList(),
        ]);
      } catch (err) {
        toast.error("Failed to connect to backend server");
      }
      setLoading(false);
    };
    loadAllData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <div className="loading-spinner"></div>
          <p className="loading-text">Initializing UniAdmin Pro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-logo">
          <School style={{ color: "var(--admin-accent)" }} size={32} />
          <span>UniAdmin Pro</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "sections" ? "active" : ""}`}
            onClick={() => setActiveTab("sections")}
          >
            <Layers size={20} />
            <span>Sections & Students</span>
          </button>
          <button
            className={`nav-item ${activeTab === "instructors" ? "active" : ""}`}
            onClick={() => setActiveTab("instructors")}
          >
            <GraduationCap size={20} />
            <span>Instructors</span>
          </button>
          <button
            className={`nav-item ${activeTab === "courses" ? "active" : ""}`}
            onClick={() => setActiveTab("courses")}
          >
            <BookOpen size={20} />
            <span>Course Catalog</span>
          </button>

          <button
            className={`nav-item ${activeTab === "fees" ? "active" : ""}`}
            onClick={() => setActiveTab("fees")}
          >
            <DollarSign size={20} />
            <span>Fee Management</span>
          </button>

          <button
            className={`nav-item ${activeTab === "unassigned" ? "active" : ""}`}
            onClick={() => setActiveTab("unassigned")}
          >
            <Users size={20} />
            <span>Unassigned Students ({unassignedStudents.length})</span>
          </button>

          <button
            className={`nav-item ${activeTab === "academic" ? "active" : ""}`}
            onClick={() => setActiveTab("academic")}
          >
            <Calendar size={20} />
            <span>Academic Mgmt</span>
          </button>

          <button
            className={`nav-item ${activeTab === "session-courses" ? "active" : ""}`}
            onClick={() => setActiveTab("session-courses")}
          >
            <BookOpen size={20} />
            <span>Session Courses</span>
          </button>

          <button
            className={`nav-item ${activeTab === "library" ? "active" : ""}`}
            onClick={() => setActiveTab("library")}
          >
            <BookOpen size={20} />
            <span>Library</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={goToHomeDashboard}>
            <LayoutDashboard size={20} />
            <span>Dashboard Home</span>
          </button>

          <button className="nav-item nav-logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-header">
          <h1 className="header-title">
            {activeTab.replace("-", " ")} Management
          </h1>
          <div className="header-profile">
            <div className="profile-info">
              <p className="profile-name">Admin User</p>
              <p className="profile-role">Super Administrator</p>
            </div>
            <div className="profile-avatar">AD</div>
          </div>
        </header>

        <div className="content-area">
          <AnimatePresence mode="wait">
            {/* Sections Tab */}
            {activeTab === "sections" && (
              <motion.div
                key="sections"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="tab-header">
                  <div className="tab-header-titles">
                    <h2 className="tab-header-title">Program Structure</h2>
                    <p className="tab-header-subtitle">
                      Manage departments, sections, and student enrollment
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateSection(!showCreateSection)}
                  >
                    {showCreateSection ? <X size={18} /> : <Plus size={18} />}
                    {showCreateSection ? "Cancel" : "Create New Section"}
                  </button>
                </div>

                {/* Create Section Form */}
                <AnimatePresence>
                  {showCreateSection && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="admin-card card-form-container"
                    >
                      <form
                        onSubmit={handleCreateSection}
                        className="card-form"
                      >
                        <h3 className="form-legend-title">
                          New Course Section
                        </h3>
                        <div className="admin-form-grid">
                          <div className="form-field">
                            <label className="form-label">Course</label>
                            <select
                              className="admin-input"
                              value={newSection.course_id}
                              onChange={(e) =>
                                setNewSection({
                                  ...newSection,
                                  course_id: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="">Select Course</option>
                              {allCourses.map((c) => (
                                <option key={c.course_id} value={c.course_id}>
                                  {c.course_code} - {c.course_name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-field">
                            <label className="form-label">
                              Instructor (Optional)
                            </label>
                            <select
                              className="admin-input"
                              value={newSection.instructor_id}
                              onChange={(e) =>
                                setNewSection({
                                  ...newSection,
                                  instructor_id: e.target.value,
                                })
                              }
                            >
                              <option value="">Select Instructor</option>
                              {instructors.map((i) => (
                                <option
                                  key={i.instructor_id}
                                  value={i.instructor_id}
                                >
                                  {i.first_name} {i.last_name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-field">
                            <label className="form-label">Classroom</label>
                            <select
                              className="admin-input"
                              value={newSection.room_id}
                              onChange={(e) =>
                                setNewSection({
                                  ...newSection,
                                  room_id: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="">Select Classroom</option>
                              {classrooms.map((r) => (
                                <option key={r.room_id} value={r.room_id}>
                                  {r.building} - Room {r.room_number}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-field">
                            <label className="form-label">Section Name</label>
                            <input
                              type="text"
                              placeholder="e.g. 4A"
                              className="admin-input uppercase-input"
                              value={newSection.section_name}
                              onChange={(e) =>
                                setNewSection({
                                  ...newSection,
                                  section_name: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Schedule</label>
                            <input
                              type="text"
                              placeholder="Mon/Wed 10:00-11:30"
                              className="admin-input"
                              value={newSection.schedule}
                              onChange={(e) =>
                                setNewSection({
                                  ...newSection,
                                  schedule: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowCreateSection(false)}
                          >
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-primary">
                            Create Section
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="sections-layout">
                  {/* Left Sidebar: Departments */}
                  <div className="dept-sidebar">
                    <h3 className="dept-sidebar-heading">Departments</h3>
                    {departments.map((dept) => (
                      <div
                        key={dept.department_id}
                        className={`dept-item ${selectedDept?.department_id === dept.department_id ? "active" : ""}`}
                        onClick={() => handleDepartmentClick(dept)}
                      >
                        {dept.department_name}
                      </div>
                    ))}
                  </div>

                  {/* Middle Content: Sections in Dept */}
                  <div className="sections-center-pane">
                    {selectedDept ? (
                      <div>
                        <div className="pane-header">
                          <h3 className="pane-title">
                            Sections in {selectedDept.department_name}
                          </h3>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              setShowCreateStudent(!showCreateStudent);
                            }}
                          >
                            <UserPlus size={14} /> New Student
                          </button>
                        </div>

                        {sections.length === 0 ? (
                          <div className="admin-card info-empty-block">
                            No sections created for this department.
                          </div>
                        ) : (
                          <div className="section-grid">
                            {sections.map((section) => (
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                key={section.section_name}
                                className={`section-card ${selectedSectionName === section.section_name ? "active" : ""}`}
                                onClick={() =>
                                  handleSectionClick(section.section_name)
                                }
                              >
                                <div className="section-card-main-row">
                                  <span className="section-card-title">
                                    Section {section.section_name}
                                  </span>
                                  <ChevronRight
                                    size={20}
                                    className={`section-card-icon-chevron ${selectedSectionName === section.section_name ? "chevron-active" : "chevron-inactive"}`}
                                  />
                                </div>
                                <div className="badges">
                                  <span className="badge badge-blue">
                                    {section.course_count} Courses
                                  </span>
                                  <span className="badge badge-green">
                                    {section.student_count} Students
                                  </span>
                                </div>
                                <p className="section-card-courses-desc">
                                  {section.courses || "No courses linked"}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="admin-card large-empty-pane">
                        <School size={48} className="empty-pane-icon" />
                        <p className="empty-pane-text">
                          Select a department to view available sections
                        </p>
                      </div>
                    )}

                    {/* Section Details */}
                    <AnimatePresence>
                      {selectedSectionName && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="section-details-container"
                        >
                          <div className="admin-card">
                            <div className="card-header colored-header">
                              <h2 className="card-title">
                                Enrollment: Section {selectedSectionName}
                              </h2>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() =>
                                  setShowAddExistingStudent(
                                    !showAddExistingStudent,
                                  )
                                }
                              >
                                Enrollment Action
                              </button>
                            </div>

                            {/* Enrollment Forms */}
                            {showAddExistingStudent && (
                              <div className="enroll-bar-pane">
                                <form
                                  onSubmit={handleAddExistingStudent}
                                  className="enroll-bar-form"
                                >
                                  <select
                                    className="admin-input flex-growth-input"
                                    value={newStudent.student_id}
                                    onChange={(e) =>
                                      setNewStudent({
                                        ...newStudent,
                                        student_id: e.target.value,
                                      })
                                    }
                                    required
                                  >
                                    <option value="">
                                      Select Available Student
                                    </option>
                                    {availableStudents.map((s) => (
                                      <option
                                        key={s.student_id}
                                        value={s.student_id}
                                      >
                                        {s.roll_number} - {s.first_name}{" "}
                                        {s.last_name}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="submit"
                                    className="btn btn-primary"
                                  >
                                    Enroll
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowAddExistingStudent(false)
                                    }
                                    className="close-pane-btn"
                                  >
                                    <X size={20} />
                                  </button>
                                </form>
                              </div>
                            )}

                            {showCreateStudent && (
                              <div className="enroll-new-pane">
                                <h4 className="form-sub-legend-title">
                                  Register New Student
                                </h4>
                                <form
                                  onSubmit={handleAddNewStudent}
                                  className="enroll-new-form-grid"
                                >
                                  <input
                                    placeholder="First Name"
                                    className="admin-input"
                                    value={newStudent.first_name}
                                    onChange={(e) =>
                                      setNewStudent({
                                        ...newStudent,
                                        first_name: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                  <input
                                    placeholder="Last Name"
                                    className="admin-input"
                                    value={newStudent.last_name}
                                    onChange={(e) =>
                                      setNewStudent({
                                        ...newStudent,
                                        last_name: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                  <input
                                    type="email"
                                    placeholder="Email"
                                    className="admin-input"
                                    value={newStudent.email}
                                    onChange={(e) =>
                                      setNewStudent({
                                        ...newStudent,
                                        email: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                  <input
                                    placeholder="Roll Number"
                                    className="admin-input"
                                    value={newStudent.roll_number}
                                    onChange={(e) =>
                                      setNewStudent({
                                        ...newStudent,
                                        roll_number: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                  <input
                                    placeholder="Username"
                                    className="admin-input"
                                    value={newStudent.username}
                                    onChange={(e) =>
                                      setNewStudent({
                                        ...newStudent,
                                        username: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                  <input
                                    type="password"
                                    placeholder="Password"
                                    className="admin-input"
                                    value={newStudent.password}
                                    onChange={(e) =>
                                      setNewStudent({
                                        ...newStudent,
                                        password: e.target.value,
                                      })
                                    }
                                    required
                                  />
                                  <div className="full-span-button-actions">
                                    <button
                                      type="submit"
                                      className="btn btn-primary"
                                    >
                                      Save & Enroll
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      onClick={() =>
                                        setShowCreateStudent(false)
                                      }
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              </div>
                            )}

                            <div className="admin-table-container">
                              <table className="admin-table">
                                <thead>
                                  <tr>
                                    <th>Roll No</th>
                                    <th>Student Name</th>
                                    <th>Email Address</th>
                                    <th className="align-center-header">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {students.length === 0 ? (
                                    <tr>
                                      <td
                                        colSpan={4}
                                        className="no-records-row"
                                      >
                                        No students enrolled in this section
                                      </td>
                                    </tr>
                                  ) : (
                                    students.map((student) => (
                                      <tr key={student.student_id}>
                                        <td className="mono font-bold-blue">
                                          {student.roll_number}
                                        </td>
                                        <td className="semibold-name">
                                          {student.first_name}{" "}
                                          {student.last_name}
                                        </td>
                                        <td>{student.email}</td>
                                        <td className="align-center-cell">
                                          <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() =>
                                              handleRemoveStudent(
                                                student.student_id,
                                              )
                                            }
                                          >
                                            <Trash2 size={14} /> Remove
                                          </button>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          <div className="admin-card">
                            <div className="card-header colored-header">
                              <h2 className="card-title">
                                Curriculum: Section {selectedSectionName}
                              </h2>
                              <BookOpen
                                size={20}
                                style={{ color: "var(--admin-text-muted)" }}
                              />
                            </div>
                            <div className="admin-table-container">
                              <table className="admin-table">
                                <thead>
                                  <tr>
                                    <th>Code</th>
                                    <th>Course Name</th>
                                    <th>Credits</th>
                                    <th>Instructor</th>
                                    <th>Schedule</th>
                                    <th>Room</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sectionCourses.length === 0 ? (
                                    <tr>
                                      <td
                                        colSpan={6}
                                        className="no-records-row"
                                      >
                                        No courses assigned to this section
                                      </td>
                                    </tr>
                                  ) : (
                                    sectionCourses.map((course) => (
                                      <tr key={course.section_id}>
                                        <td className="mono font-bold-blue">
                                          {course.course_code}
                                        </td>
                                        <td className="semibold-name text-slate-color">
                                          {course.course_name}
                                        </td>
                                        <td className="center-bold-text">
                                          {course.credit_hours}
                                        </td>
                                        <td>
                                          <div className="instructor-cell-wrapper">
                                            {course.instructor_name !==
                                            "Not Assigned" ? (
                                              <span className="instructor-assigned-name">
                                                {course.instructor_name}
                                              </span>
                                            ) : (
                                              <span className="unassigned-text">
                                                Unassigned
                                              </span>
                                            )}
                                            {course.instructor_id === null && (
                                              <button
                                                className="btn btn-sm btn-secondary compact-btn"
                                                onClick={() => {
                                                  setInstructorAssignment({
                                                    ...instructorAssignment,
                                                    section_id:
                                                      course.section_id,
                                                  });
                                                  setShowAssignInstructor(true);
                                                  setActiveTab("instructors");
                                                }}
                                              >
                                                Assign
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                        <td>
                                          <div className="meta-info-cell">
                                            <Clock size={12} />{" "}
                                            {course.schedule}
                                          </div>
                                        </td>
                                        <td>
                                          <div className="meta-info-cell">
                                            <MapPin size={12} />{" "}
                                            {course.building} -{" "}
                                            {course.room_number}
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Instructors Tab */}
            {activeTab === "instructors" && (
              <motion.div
                key="instructors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="tab-header">
                  <div className="tab-header-titles">
                    <h2 className="tab-header-title">Faculty Management</h2>
                    <p className="tab-header-subtitle">
                      Manage instructors and their course assignments
                    </p>
                  </div>
                  <div className="tab-header-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAssignInstructor(!showAssignInstructor);
                        loadAvailableSections();
                      }}
                    >
                      <Calendar size={18} />
                      Assign Instructor
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        setShowCreateInstructor(!showCreateInstructor)
                      }
                    >
                      <UserPlus size={18} />
                      Add Instructor
                    </button>
                  </div>
                </div>

                {/* Create/Assign Forms */}
                <AnimatePresence>
                  {showCreateInstructor && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="admin-card card-form-container form-bg-slate"
                    >
                      <form
                        onSubmit={handleAddInstructor}
                        className="card-form"
                      >
                        <h3 className="form-legend-title">
                          Register Faculty Member
                        </h3>
                        <div className="form-multiple-columns-grid">
                          <div className="form-field">
                            <label className="form-label">First Name</label>
                            <input
                              className="admin-input"
                              value={newInstructor.first_name}
                              onChange={(e) =>
                                setNewInstructor({
                                  ...newInstructor,
                                  first_name: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Last Name</label>
                            <input
                              className="admin-input"
                              value={newInstructor.last_name}
                              onChange={(e) =>
                                setNewInstructor({
                                  ...newInstructor,
                                  last_name: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Email</label>
                            <input
                              type="email"
                              className="admin-input"
                              value={newInstructor.email}
                              onChange={(e) =>
                                setNewInstructor({
                                  ...newInstructor,
                                  email: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Phone</label>
                            <input
                              className="admin-input"
                              value={newInstructor.phone}
                              onChange={(e) =>
                                setNewInstructor({
                                  ...newInstructor,
                                  phone: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Department</label>
                            <select
                              className="admin-input"
                              value={newInstructor.department_id}
                              onChange={(e) =>
                                setNewInstructor({
                                  ...newInstructor,
                                  department_id: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="">Select Department</option>
                              {departments.map((d) => (
                                <option
                                  key={d.department_id}
                                  value={d.department_id}
                                >
                                  {d.department_name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-field">
                            <label className="form-label">Username</label>
                            <input
                              className="admin-input"
                              value={newInstructor.username}
                              onChange={(e) =>
                                setNewInstructor({
                                  ...newInstructor,
                                  username: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Password</label>
                            <input
                              type="password"
                              placeholder="••••••••"
                              className="admin-input"
                              value={newInstructor.password}
                              onChange={(e) =>
                                setNewInstructor({
                                  ...newInstructor,
                                  password: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                        </div>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowCreateInstructor(false)}
                          >
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-primary">
                            Save Instructor
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {showAssignInstructor && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="admin-card card-form-container form-bg-purple"
                    >
                      <form
                        onSubmit={handleAssignInstructor}
                        className="card-form"
                      >
                        <h3 className="form-legend-title">
                          Assign Instructor to Section
                        </h3>
                        <div className="form-double-column-grid">
                          <div className="form-field">
                            <label className="form-label">
                              Target Course Section
                            </label>
                            <select
                              className="admin-input"
                              value={instructorAssignment.section_id}
                              onChange={(e) =>
                                setInstructorAssignment({
                                  ...instructorAssignment,
                                  section_id: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="">Select a Section Course</option>
                              {availableSections.map((s) => (
                                <option key={s.SECTION_ID} value={s.SECTION_ID}>
                                  {s.DEPARTMENT_NAME} | {s.SECTION_NAME} -{" "}
                                  {s.COURSE_NAME}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="form-field">
                            <label className="form-label">Instructor</label>
                            <select
                              className="admin-input"
                              value={instructorAssignment.instructor_id}
                              onChange={(e) =>
                                setInstructorAssignment({
                                  ...instructorAssignment,
                                  instructor_id: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="">Select Instructor</option>
                              {allInstructorsList.map((i) => (
                                <option
                                  key={i.INSTRUCTOR_ID}
                                  value={i.INSTRUCTOR_ID}
                                >
                                  {i.FIRST_NAME} {i.LAST_NAME} (
                                  {i.DEPARTMENT_NAME})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowAssignInstructor(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="btn btn-assign-confirm"
                          >
                            Confirm Assignment
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="admin-card">
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Instructor Name</th>
                          <th>Contact Details</th>
                          <th>Department</th>
                          <th>Account</th>
                          <th className="align-center-header">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allInstructors.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="no-records-row">
                              No faculty members registered.
                            </td>
                          </tr>
                        ) : (
                          allInstructors.map((instructor) => (
                            <tr key={instructor.INSTRUCTOR_ID}>
                              <td className="mono text-muted-id">
                                {instructor.INSTRUCTOR_ID}
                              </td>
                              <td className="bold-name-slate">
                                {instructor.FIRST_NAME} {instructor.LAST_NAME}
                              </td>
                              <td>
                                <div className="contact-email">
                                  {instructor.EMAIL}
                                </div>
                                <div className="contact-phone">
                                  {instructor.PHONE || "No phone listed"}
                                </div>
                              </td>
                              <td>
                                <span className="department-badge">
                                  {instructor.DEPARTMENT_NAME}
                                </span>
                              </td>
                              <td className="mono mono-username">
                                {instructor.USERNAME}
                              </td>
                              <td className="align-center-cell">
                                <button
                                  className="action-delete-icon-btn"
                                  onClick={() =>
                                    handleDeleteInstructor(
                                      instructor.INSTRUCTOR_ID,
                                    )
                                  }
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Courses Tab */}
            {activeTab === "courses" && (
              <motion.div
                key="courses"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="tab-header">
                  <div className="tab-header-titles">
                    <h2 className="tab-header-title">Curriculum Repository</h2>
                    <p className="tab-header-subtitle">
                      Manage the master catalog of university courses
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAddCourse(!showAddCourse)}
                  >
                    {showAddCourse ? <X size={18} /> : <Plus size={18} />}
                    {showAddCourse ? "Cancel" : "Add Course"}
                  </button>
                </div>

                <AnimatePresence>
                  {showAddCourse && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="admin-card card-form-container"
                    >
                      <form onSubmit={handleAddCourse} className="card-form">
                        <h3 className="form-legend-title">
                          New Course Catalog Entry
                        </h3>
                        <div className="form-multiple-columns-grid">
                          <div className="form-field">
                            <label className="form-label">Course Code</label>
                            <input
                              placeholder="e.g. CS101"
                              className="admin-input uppercase-input"
                              value={newCourse.course_code}
                              onChange={(e) =>
                                setNewCourse({
                                  ...newCourse,
                                  course_code: e.target.value.toUpperCase(),
                                })
                              }
                              required
                            />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Course Name</label>
                            <input
                              placeholder="e.g. Web Development"
                              className="admin-input"
                              value={newCourse.course_name}
                              onChange={(e) =>
                                setNewCourse({
                                  ...newCourse,
                                  course_name: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Credits</label>
                            <input
                              type="number"
                              className="admin-input"
                              value={newCourse.credit_hours}
                              onChange={(e) =>
                                setNewCourse({
                                  ...newCourse,
                                  credit_hours: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Department</label>
                            <select
                              className="admin-input"
                              value={newCourse.department_id}
                              onChange={(e) =>
                                setNewCourse({
                                  ...newCourse,
                                  department_id: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="">Select Department</option>
                              {departments.map((d) => (
                                <option
                                  key={d.department_id}
                                  value={d.department_id}
                                >
                                  {d.department_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="form-actions">
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowAddCourse(false)}
                          >
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-primary">
                            Save Course
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="admin-card">
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Course Description</th>
                          <th className="align-center-header">CH</th>
                          <th>Providing Department</th>
                          <th className="align-center-header">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCourses.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="no-records-row">
                              No courses in catalog.
                            </td>
                          </tr>
                        ) : (
                          allCourses.map((course) => (
                            <tr key={course.course_id}>
                              <td className="mono bold-name-blue">
                                {course.course_code}
                              </td>
                              <td className="bold-name-slate">
                                {course.course_name}
                              </td>
                              <td className="center-bold-text font-mono-only">
                                {course.credit_hours}
                              </td>
                              <td>{course.department_name}</td>
                              <td className="align-center-cell">
                                <button
                                  className="action-delete-icon-btn text-grey-delete"
                                  onClick={() =>
                                    handleDeleteCourse(course.course_id)
                                  }
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Unassigned Students Tab */}
            {activeTab === "unassigned" && (
              <motion.div
                key="unassigned"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="tab-header">
                  <div className="tab-header-titles">
                    <h2 className="tab-header-title">Unassigned Students</h2>
                    <p className="tab-header-subtitle">
                      Manage registered students who have not yet been assigned
                      to an academic section
                    </p>
                  </div>
                </div>

                <div className="admin-card">
                  {unassignedStudents.length === 0 ? (
                    <div className="large-empty-pane">
                      <Users size={48} className="empty-pane-icon" />
                      <p className="empty-pane-text">
                        All registered students have been successfully assigned
                        to sections.
                      </p>
                    </div>
                  ) : (
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Student ID</th>
                            <th>Student Name</th>
                            <th>Email Address</th>
                            <th>Department</th>
                            <th className="align-center-header">
                              Assign to Section
                            </th>
                            <th className="align-center-header">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unassignedStudents.map((student) => (
                            <tr key={student.student_id}>
                              <td className="mono text-muted-id">
                                {student.student_id}
                              </td>
                              <td>
                                <div className="semibold-name bold-name-slate">
                                  {student.first_name} {student.last_name}
                                </div>
                                {student.roll_number && (
                                  <div
                                    className="mono text-muted-id"
                                    style={{
                                      fontSize: "0.75rem",
                                      marginTop: "0.15rem",
                                    }}
                                  >
                                    Roll No: {student.roll_number}
                                  </div>
                                )}
                              </td>
                              <td
                                className="mono"
                                style={{ fontSize: "0.85rem" }}
                              >
                                {student.email}
                              </td>
                              <td>
                                <span className="department-badge">
                                  {student.department_name}
                                </span>
                              </td>
                              <td className="align-center-cell">
                                <select
                                  value={
                                    selectedSections[student.student_id] || ""
                                  }
                                  onChange={(e) =>
                                    setSelectedSections((prev) => ({
                                      ...prev,
                                      [student.student_id]: e.target.value,
                                    }))
                                  }
                                  className="admin-input"
                                  style={{
                                    width: "160px",
                                    padding: "0.4rem 0.6rem",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  <option value="">Select Section</option>
                                  {sectionsList.map((section) => (
                                    <option key={section} value={section}>
                                      {section}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="align-center-cell">
                                <button
                                  onClick={() =>
                                    assignStudentToSection(student.student_id)
                                  }
                                  className="btn btn-sm btn-primary"
                                  style={{
                                    padding: "0.4rem 1rem",
                                    fontSize: "0.8rem",
                                    width: "90px",
                                  }}
                                >
                                  Assign
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Academic Management Tab */}
            {activeTab === "academic" && (
              <motion.div
                key="academic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ManageAcademic />
              </motion.div>
            )}

            {/* Session Courses Management Tab */}
            {activeTab === "session-courses" && (
              <motion.div
                key="academic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ManageSessionCourses />
              </motion.div>
            )}

            {activeTab === "library" && (
              <motion.div
                key="academic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <LibraryManagement />
              </motion.div>
            )}

            {activeTab === "fees" && (
              <motion.div
                key="fees"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ManageFees />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
