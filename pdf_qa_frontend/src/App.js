import React, { useState, useRef, useEffect } from "react";
import "./App.css";

/**
 * COLORS:
 * --primary: #1976D2
 * --secondary: #424242
 * --accent: #FFB300
 */

// PUBLIC_INTERFACE
function App() {
  // UI State & Inputs
  const [theme] = useState("light");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [conversation, setConversation] = useState([]); // [{query,answer}]
  const [notification, setNotification] = useState({ show: false, msg: "", type: "info" });

  const fileInputRef = useRef();

  // API base (will be proxied in development, else adjust as needed)
  const API_BASE = "";

  // Fetch conversation history on first load
  useEffect(() => {
    fetchHistory();
  }, []);

  // Fetch conversation history from backend
  // PUBLIC_INTERFACE
  async function fetchHistory() {
    try {
      const response = await fetch(`${API_BASE}/history`);
      if (!response.ok) throw new Error("Failed to load history.");
      const data = await response.json();
      setConversation(data.history || []);
    } catch (err) {
      showNotification("Could not fetch history.", "error");
    }
  }

  // PUBLIC_INTERFACE
  function handleFileChange(e) {
    const file = e.target.files[0];
    setSelectedFile(file || null);
    setFileName(file ? file.name : "");
  }

  // PUBLIC_INTERFACE
  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile) {
      showNotification("Please select a PDF to upload.", "warning");
      return;
    }
    setUploading(true);
    setNotification({ show: false });

    const formData = new FormData();
    formData.append("pdf", selectedFile);

    try {
      const response = await fetch(`${API_BASE}/upload_pdf`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Upload failed.");
      showNotification("PDF uploaded successfully!", "success");
      // Optionally refresh history after new upload
      fetchHistory();
      setSelectedFile(null);
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      showNotification("Upload failed: " + err.message, "error");
    }
    setUploading(false);
  }

  // PUBLIC_INTERFACE
  async function handleQuestionSubmit(e) {
    e.preventDefault();
    if (!question.trim()) {
      showNotification("Please enter a question.", "warning");
      return;
    }
    setSubmitting(true);
    setNotification({ show: false });

    try {
      const response = await fetch(`${API_BASE}/ask_question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to get answer.");

      const newEntry = { query: question.trim(), answer: data.answer };
      setConversation((prev) => [newEntry, ...prev]);
      setQuestion("");
      showNotification("Answer received!", "success");
    } catch (err) {
      showNotification("Failed to get answer: " + err.message, "error");
    }
    setSubmitting(false);
  }

  // PUBLIC_INTERFACE
  function showNotification(msg, type = "info") {
    setNotification({ show: true, msg, type });
    setTimeout(() => setNotification({ show: false }), 4000);
  }

  // Styling helpers for theme/colors
  const colors = {
    primary: "#1976D2",
    accent: "#FFB300",
    secondary: "#424242"
  };

  // Notification styling
  const notifStyles = {
    base: {
      position: "fixed",
      top: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      minWidth: "220px",
      padding: "13px 36px",
      borderRadius: "8px",
      fontSize: "1rem",
      fontWeight: "500",
      color: "#fff",
      zIndex: 9999,
      opacity: notification.show ? 1 : 0,
      pointerEvents: notification.show ? "all" : "none",
      boxShadow: "0 4px 20px rgba(40,40,40,0.09)",
      transition: "opacity 0.4s cubic-bezier(0.65,0.05,0.36,1)"
    },
    info:   { background: colors.primary },
    success:{ background: colors.accent, color: "#111" },
    error:  { background: "#e53935" },
    warning:{ background: "#ffa726", color: "#222" }
  };

  // PUBLIC_INTERFACE
  function Notification() {
    if (!notification.show) return null;
    const st = Object.assign(
      {},
      notifStyles.base,
      notifStyles[notification.type] || notifStyles.info
    );
    return <div style={st} aria-live="polite">{notification.msg}</div>;
  }

  // PUBLIC_INTERFACE
  function ConversationList() {
    if (!conversation.length)
      return (
        <div className="qa-list-empty">
          <div role="status" style={{ color: colors.secondary }}>No Q&A yet. Start by uploading a PDF and asking a question!</div>
        </div>
      );
    return (
      <ul className="qa-list">
        {conversation.map((entry, i) => (
          <li key={i} className="qa-item">
            <div className="qa-q">
              <span className="qa-label">Q:</span> {entry.query}
            </div>
            <div className="qa-a">
              <span className="qa-label">A:</span> {entry.answer}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="App" data-theme={theme}>
      <Notification />
      <header className="qa-header" style={{ background: colors.primary }}>
        <span className="qa-title">📖 PDF Question Answerer</span>
      </header>

      <main className="qa-main">
        {/* PDF Upload Form */}
        <form className="qa-upload-form" onSubmit={handleUpload}>
          <label className="qa-upload-label" htmlFor="pdf-upload">
            <span
              style={{
                color: colors.primary,
                fontWeight: 600,
                marginRight: 8
              }}
            >
              Upload PDF
            </span>
          </label>
          <input
            id="pdf-upload"
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={uploading}
            className="qa-upload-input"
            aria-label="Choose PDF to upload"
          />
          <span className="qa-upload-filename" title={fileName}>{fileName}</span>
          <button
            type="submit"
            className="qa-btn qa-btn-accent"
            style={{ marginLeft: 16 }}
            disabled={uploading || !selectedFile}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>

        {/* Ask Question Form */}
        <form className="qa-question-form" onSubmit={handleQuestionSubmit}>
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            className="qa-input"
            placeholder="Ask a question about the uploaded PDF…"
            disabled={submitting}
            aria-label="Type your question"
            autoFocus
            maxLength={512}
          />
          <button
            type="submit"
            className="qa-btn qa-btn-primary"
            disabled={submitting || !question.trim()}
          >
            {submitting ? "Asking…" : "Ask"}
          </button>
        </form>

        {/* Conversation/Q&A History */}
        <section className="qa-history-section" aria-label="Previous questions and answers">
          <span className="qa-history-title" style={{ color: colors.secondary }}>History</span>
          <ConversationList />
        </section>
      </main>

      {/* Minimal footer */}
      <footer className="qa-footer">
        <span>
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="qa-footer-link">
            View on GitHub
          </a>
        </span>
      </footer>
    </div>
  );
}

export default App;
