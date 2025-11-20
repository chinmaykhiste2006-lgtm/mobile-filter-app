import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:3001/api/mobile";
const USER_API_URL = "http://localhost:3001/api/user";

const initialFilters = {
  Brand: "",
  RAM: "",
  Front_Camera: "",
  Back_Camera: "",
  Processor: "",
  Launched_Year: "",
  min_Price: "",
  max_Price: "",
  min_Battery_Capacity: "",
  max_Battery_Capacity: "",
  min_Mobile_Weight: "",
  max_Mobile_Weight: "",
  min_Screen_Size: "",
  max_Screen_Size: "",
  Model: "",
  view: "all",
};

const MobileFilter = ({ userID, onLogout }) => {
  const [filters, setFilters] = useState(initialFilters);
  const [mobiles, setMobiles] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());
  const [userName, setUserName] = useState("");

  // NEW STATE FOR AI LOADING + MODAL
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchUserName = async () => {
      if (!userID) {
        setUserName("Guest");
        return;
      }
      try {
        const res = await axios.get(`${USER_API_URL}`, { params: { userID } });
        setUserName(res.data?.name || "User");
      } catch {
        setUserName("User");
      }
    };
    fetchUserName();
  }, [userID]);

  const fetchLikedIds = async () => {
    if (!userID) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/favorites`, {
        params: { userID },
      });
      setLikedIds(new Set(response.data.map((m) => m.id)));
    } catch (error) {
      console.error("Failed to fetch liked IDs:", error);
    }
  };

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/options`);
        setFilterOptions(response.data);
      } catch (error) {
        console.error("Error fetching filter options:", error);
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchOptions();
    fetchLikedIds();
  }, [userID]);

  useEffect(() => {
    if (optionsLoading) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        let response;
        if (filters.view === "favorites") {
          response = await axios.get(`${API_BASE_URL}/favorites`, {
            params: { userID },
          });
        } else {
          const { view, ...restFilters } = filters;
          const activeFilters = Object.fromEntries(
            Object.entries(restFilters).filter(([_, v]) => v !== "")
          );
          const queryParams = new URLSearchParams(activeFilters).toString();
          response = await axios.get(`${API_BASE_URL}/filter?${queryParams}`);
        }
        setMobiles(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    const handler = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(handler);
  }, [filters, optionsLoading, userID]);

  const handleLikeToggle = async (mobileId) => {
    const isLiked = likedIds.has(mobileId);
    try {
      const response = await axios.post(`${API_BASE_URL}/like`, {
        mobileId,
        userID,
        isLiked: !isLiked,
      });
      if (response.data.success) {
        setLikedIds((prev) => {
          const newIds = new Set(prev);
          isLiked ? newIds.delete(mobileId) : newIds.add(mobileId);
          return newIds;
        });
        if (filters.view === "favorites") setFilters((prev) => ({ ...prev }));
      }
    } catch (error) {
      alert("Failed to update like status.");
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    else {
      localStorage.clear();
      window.location.reload();
    }
  };

  /*  
  ✨✨✨ AI SUMMARY FUNCTION WITH LOADER + MODAL ✨✨✨
  */
  const handleAISummary = async () => {
    const { view, ...restFilters } = filters;
    const activeFilters = Object.fromEntries(
      Object.entries(restFilters).filter(([_, v]) => v !== "")
    );

    const prompt = `
      Generate a mobile recommendation report based on these filters: 
      ${JSON.stringify(activeFilters)}.

      Requirements:
      - Use actual values (like price, RAM, battery) instead of vague words.
      - Produce 3–5 clear sentences.
      - Suggest exactly 2 real smartphone models.
    `;

    try {
      setAiLoading(true);
      setShowModal(true);

      const response = await axios.post(
        "http://127.0.0.1:5000/generate_summary",
        { prompt }
      );

      setAiSummary(response.data.summary || "No summary returned.");
    } catch (error) {
      setAiSummary("Failed to generate AI summary.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClearFilters = () => {
    setFilters({ ...initialFilters, view: filters.view });
  };

  const handleViewToggle = (view) => {
    setFilters({ ...initialFilters, view });
  };

  const renderFilterInput = (key, options) => {
    const label = key.replace(/_/g, " ");
    if (Array.isArray(options)) {
      return (
        <div style={styles.filterGroup} key={key}>
          <label style={styles.label}>{label}</label>
          <select
            name={key}
            value={filters[key]}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="">All {label}</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {key === "RAM" ? `${option} GB` : option}
              </option>
            ))}
          </select>
        </div>
      );
    } else if (options && typeof options === "object" && "min" in options) {
      const minKey = `min_${key}`;
      const maxKey = `max_${key}`;
      return (
        <div style={styles.filterGroup} key={key}>
          <label style={styles.label}>{label}</label>
          <div style={styles.rangeContainer}>
            <input
              type="number"
              name={minKey}
              value={filters[minKey]}
              onChange={handleChange}
              placeholder={`Min ${options.min}`}
              style={styles.input}
            />
            <input
              type="number"
              name={maxKey}
              value={filters[maxKey]}
              onChange={handleChange}
              placeholder={`Max ${options.max}`}
              style={styles.input}
            />
          </div>
        </div>
      );
    }
    return null;
  };

  if (optionsLoading)
    return <div style={styles.loading}>Loading Filter Options...</div>;

  return (
    <div style={styles.wrapper}>

      {/* AI SUMMARY MODAL */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h2 style={styles.modalTitle}>📱 AI Recommendation</h2>

            {/* LOADING ANIMATION */}
            {aiLoading ? (
              <div style={styles.loaderContainer}>
                <div style={styles.loader}></div>
                <p style={styles.loaderText}>
                  Analyzing your filters… Generating summary…
                </p>
              </div>
            ) : (
              <p style={styles.modalText}>{aiSummary}</p>
            )}

            <button
              style={styles.closeButton}
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div style={styles.topBar}>
        <p style={styles.userGreeting}>Welcome, {userName} 👋</p>
        <div>
          <button style={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
          <button
            style={{
              ...styles.aiSummaryButton,
              opacity: aiLoading ? 0.6 : 1,
              cursor: aiLoading ? "not-allowed" : "pointer",
            }}
            disabled={aiLoading}
            onClick={handleAISummary}
          >
            {aiLoading ? "Generating..." : "AI Summary"}
          </button>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.sidebar}>
          <h2 style={styles.title}>Mobile Filters</h2>

          <div style={styles.toggleContainer}>
            <button
              style={{
                ...styles.toggleButton,
                background:
                  filters.view === "all" ? styles.activeGradient : "#aaa",
              }}
              onClick={() => handleViewToggle("all")}
            >
              View All
            </button>

            <button
              style={{
                ...styles.toggleButton,
                background:
                  filters.view === "favorites"
                    ? styles.activeGradient
                    : "#aaa",
              }}
              onClick={() => handleViewToggle("favorites")}
            >
              Favorites ({likedIds.size})
            </button>
          </div>

          {filters.view === "all" && (
            <>
              <div style={styles.filterGroup}>
                <label style={styles.label}>Search Model Name</label>
                <input
                  type="text"
                  name="Model"
                  value={filters.Model}
                  onChange={handleChange}
                  placeholder="e.g., iPhone 16 or Galaxy"
                  style={styles.input}
                />
              </div>

              {Object.entries(filterOptions).map(([key, options]) =>
                renderFilterInput(key, options)
              )}

              <button
                onClick={handleClearFilters}
                style={styles.clearButton}
              >
                Clear All Filters
              </button>
            </>
          )}
        </div>

        <div style={styles.main}>
          <h1 style={styles.header}>
            {filters.view === "favorites"
              ? "Your Favorite Mobiles"
              : "Mobile Catalog"}
          </h1>

          <p style={styles.resultCount}>
            Showing {loading ? "..." : mobiles.length} results
          </p>

          {loading ? (
            <div style={styles.loading}>Loading Data...</div>
          ) : (
            <div style={styles.cardGrid}>
              {mobiles.map((mobile) => {
                const isLiked = likedIds.has(mobile.id);
                return (
                  <div key={mobile.id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <div>
                        <h3 style={styles.model}>{mobile.Model}</h3>
                        <p style={styles.brand}>{mobile.Brand}</p>
                      </div>
                      <div style={styles.priceTag}>
                        ₹{mobile.Price.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div style={styles.cardBody}>
                      <p><b>Processor:</b> {mobile.Processor}</p>
                      <p><b>RAM:</b> {mobile.RAM} GB</p>
                      <p><b>Battery:</b> {mobile.Battery_Capacity} mAh</p>
                      <p><b>Screen:</b> {mobile.Screen_Size} in</p>
                      <p><b>Front Cam:</b> {mobile.Front_Camera}</p>
                      <p><b>Back Cam:</b> {mobile.Back_Camera}</p>
                      <p><b>Weight:</b> {mobile.Mobile_Weight} g</p>
                      <p><b>Year:</b> {mobile.Launched_Year}</p>
                    </div>

                    <button
                      style={styles.likeButton(isLiked)}
                      onClick={() => handleLikeToggle(mobile.id)}
                    >
                      {isLiked ? "💖 Liked" : "♡ Like"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------
   BEAUTIFUL STYLES + MODAL + LOADER STYLES
--------------------------------------------------- */

const styles = {
  activeGradient:
    "linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4)",

  wrapper: {
    background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
    fontFamily: "'Inter', sans-serif",
    minHeight: "100vh",
  },

  /* ------------------ MODAL ------------------ */

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },

  modalBox: {
    background: "rgba(255,255,255,0.95)",
    width: "500px",
    padding: "25px",
    borderRadius: "20px",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
    animation: "fadeIn 0.3s",
  },

  modalTitle: {
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "15px",
    textAlign: "center",
  },

  modalText: {
    fontSize: "16px",
    lineHeight: "1.6",
    whiteSpace: "pre-line",
    marginBottom: "20px",
  },

  closeButton: {
    background: "#8134af",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    width: "100%",
    fontWeight: "600",
  },

  /* ------------------ AI LOADING ------------------ */

  loaderContainer: {
    textAlign: "center",
    marginBottom: "20px",
  },

  loader: {
    border: "5px solid #eee",
    borderTop: "5px solid #8134af",
    borderRadius: "50%",
    width: "45px",
    height: "45px",
    margin: "auto",
    animation: "spin 1s linear infinite",
  },

  loaderText: {
    marginTop: "15px",
    fontSize: "15px",
    color: "#444",
  },

  /* ------------------ MAIN UI ------------------ */

  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 40px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    borderBottom: "1px solid #eee",
  },

  userGreeting: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#333",
  },

  logoutButton: {
    marginRight: "10px",
    backgroundColor: "#e1306c",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },

  aiSummaryButton: {
    backgroundColor: "#8134af",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },

  content: {
    display: "flex",
    gap: "20px",
    padding: "0 20px 40px 20px",
  },

  sidebar: {
    width: "300px",
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "25px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },

  main: {
    flexGrow: 1,
    backgroundColor: "white",
    borderRadius: "20px",
    padding: "30px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },

  title: { fontSize: "22px", fontWeight: "700", marginBottom: "20px" },

  toggleContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "25px",
  },

  toggleButton: {
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "30px",
    cursor: "pointer",
    fontWeight: "600",
  },

  filterGroup: { marginBottom: "18px" },

  label: {
    fontWeight: "600",
    fontSize: "13px",
    marginBottom: "5px",
    display: "block",
  },

  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid #ddd",
  },

  select: {
    width: "100%",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid #ddd",
  },

  rangeContainer: { display: "flex", gap: "10px" },

  clearButton: {
    marginTop: "15px",
    background: "linear-gradient(135deg, #ff5f6d, #ffc371)",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "30px",
    fontWeight: "600",
    cursor: "pointer",
  },

  header: { fontSize: "26px", fontWeight: "700", marginBottom: "10px" },

  resultCount: { color: "#888", marginBottom: "25px" },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "25px",
  },

  card: {
    backgroundColor: "white",
    borderRadius: "20px",
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
    padding: "20px",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
  },

  model: { fontSize: "18px", margin: 0 },

  brand: { color: "#999", marginTop: "4px" },

  priceTag: {
    background: "linear-gradient(135deg, #f58529, #dd2a7b)",
    color: "white",
    padding: "6px 10px",
    borderRadius: "12px",
    fontWeight: "600",
  },

  cardBody: { fontSize: "14px", color: "#333", lineHeight: "1.6" },

  likeButton: (isLiked) => ({
    marginTop: "10px",
    border: "none",
    borderRadius: "30px",
    padding: "8px 16px",
    cursor: "pointer",
    color: isLiked ? "#fff" : "#e1306c",
    background: isLiked
      ? "linear-gradient(135deg, #f58529, #dd2a7b, #8134af)"
      : "#f8f9fa",
    fontWeight: "bold",
  }),
};

export default MobileFilter;
