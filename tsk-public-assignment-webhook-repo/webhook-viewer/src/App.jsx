import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [webhooks, setWebhooks] = useState([]);
  const [stats, setstats] = useState([]);

  const fetchWebhooks = async () => {
    try {
      const response = await axios.get("http://localhost:5000/webhook/data");
      const { webhooks, stats } = response.data;
      const sorted = [...webhooks].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      setWebhooks(sorted);
      setstats(stats);
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
    }
  };

  useEffect(() => {
    fetchWebhooks();
    const interval = setInterval(fetchWebhooks, 15000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = (time) => {
    if (!time) return "";

    const now = new Date();
    const nowTotalMins =
      now.getHours() * 60 + now.getMinutes() + now.getDate() * 1440;

    const createdTotalMins =
      (parseInt(time.days) || 0) * 1440 +
      (parseInt(time.hours) || 0) * 60 +
      (parseInt(time.minutes) || 0);

    const diffMins = nowTotalMins - createdTotalMins;
    const days = Math.floor(diffMins / 1440);
    const hours = Math.floor((diffMins % 1440) / 60);
    const minutes = diffMins % 60;

    if (diffMins <= 0) return "just now";
    if (days > 0) return `${days}d ${hours}h ago`;
    if (hours > 0) return `${hours}h ${minutes}m ago`;
    return `${minutes}m ago`;
  };

  const formatTime = (timestamp) => {
    var date = new Date(timestamp);
    var months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    var year = date.getFullYear();
    var month = months[date.getMonth()];
    var dateVal = date.getDate();
    var displayTime = date.toLocaleTimeString();

    var formattedDate =
      " on " + dateVal + " " + month + " " + year + " - " + displayTime;

    return formattedDate;
  };

  const renderMessage = (hook) => {
    const { action, author, to_branch, from_branch, timestamp, time } = hook;
    const timeDisplay = timeAgo(time);

    const format = (content) => (
      <div style={styles.message}>
        <div style={styles.content}>{content}</div>
        <div style={styles.timestamp}>{timeDisplay}</div>
      </div>
    );

    if (action === "push") {
      return format(
        <>
          <strong>{author || "N/A"}</strong> pushed to{" "}
          <strong>{to_branch || "N/A"}</strong>
          <i>{formatTime(timestamp)}</i>
        </>
      );
    }

    if (action === "pull_request") {
      return format(
        <>
          <strong>{author || "N/A"}</strong> submitted a pull request from{" "}
          <strong>{from_branch || "N/A"}</strong> to{" "}
          <strong>{to_branch || "N/A"}</strong>
          <i>{formatTime(timestamp)}</i>
        </>
      );
    }

    if (action === "pull_request_merged") {
      return format(
        <>
          <strong>{author || "N/A"}</strong> merged branch{" "}
          <strong>{from_branch || "N/A"}</strong> to{" "}
          <strong>{to_branch || "N/A"}</strong>
          <i>{formatTime(timestamp)}</i>
        </>
      );
    }

    return <p>Unknown webhook action</p>;
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>📡 Webhook History</h2>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          marginBottom: "2rem",
          padding: "1rem",
          borderRadius: "10px",
          backgroundColor: "#f9f9f9",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
          textAlign: "center",
        }}
      >
        {[
          { label: "Total", value: stats.total },
          { label: "Pushes", value: stats.pushes },
          { label: "Pull Requests", value: stats.pull_requests },
          { label: "Merges", value: stats.pull_request_merged },
        ].map((item, idx) => (
          <div key={idx} style={{ flex: 1 }}>
            <h3 style={{ margin: "0", fontSize: "1.5rem" }}>
              {item.value || 0}
            </h3>
            <p style={{ margin: "0", color: "#555" }}>{item.label}</p>
          </div>
        ))}
      </div>

      {webhooks.length === 0 ? (
        <p style={{ color: "#999" }}>No webhook data available.</p>
      ) : (
        webhooks.map((hook, idx) => (
          <div key={idx} style={styles.card}>
            {renderMessage(hook)}
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "2rem auto",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: "1rem",
  },
  header: {
    fontSize: "2rem",
    marginBottom: "1.5rem",
    textAlign: "center",
    background: "linear-gradient(to right, #4b6cb7, #182848)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "1.25rem 1.5rem",
    marginBottom: "1.25rem",
    boxShadow: "0 4px 8px rgba(0,0,0,0.08)",
    transition: "transform 0.2s ease",
    borderLeft: "5px solid #4b6cb7",
  },
  message: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
  },
  content: {
    fontSize: "1.1rem",
  },
  timestamp: {
    fontSize: "0.9rem",
    color: "#666",
    marginLeft: "1rem",
  },
  rawTime: {
    fontSize: "0.75rem",
    color: "#aaa",
    textAlign: "right",
    marginTop: "0.5rem",
  },
};

export default App;
