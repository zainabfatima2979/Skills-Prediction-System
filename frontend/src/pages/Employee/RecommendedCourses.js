import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import EmployeeSidebar from "./EmployeeSidebar";
import "./EmployeeLayout.css";

function RecommendedCourses() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/employee/recommendations")
      .then((res) => setRecommendations(res.data))
      .catch(() => setRecommendations([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="emp-layout">
      <EmployeeSidebar active="courses" />

      <main className="emp-main">
        <h1 className="emp-title">Recommended Courses</h1>
        <p className="emp-subtitle">
          For {user?.name} &middot; {user?.designation}
        </p>

        <div className="emp-panel">
          <div className="emp-panel-accent" />
          <h3 className="emp-panel-title">
            Courses to Close Your Skill Gaps ({recommendations.length})
          </h3>

          {loading ? (
            <p className="emp-empty">Loading...</p>
          ) : recommendations.length === 0 ? (
            <p className="emp-empty">
              No course recommendations right now. They appear here once HR has run your skill
              prediction and a skill gap is found.
            </p>
          ) : (
            recommendations.map((r) => (
              <div key={r.skillGap} className="emp-course-card">
                <span className="emp-course-skill-tag">Gap: {r.skillGap}</span>
                <div className="emp-course-name">{r.recommendedCourse}</div>
                <div className="emp-course-confidence">{r.confidence}% confidence this will help</div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default RecommendedCourses;