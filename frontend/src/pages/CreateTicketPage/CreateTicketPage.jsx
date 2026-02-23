// src/pages/CreateTicketPage/CreateTicketPage.jsx

import React, { useState } from "react";


export default function CreateTicketPage() {
  const role = localStorage.getItem("role");

  return (
    <div style={styles.container}>
      <h1>Hello User 👋</h1>
      <p>Your role: {role}</p>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
};