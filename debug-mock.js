console.log("🔍 Mock Data Debug:", {
  env: import.meta.env.VITE_USE_MOCK_DATA,
  localStorage: localStorage.getItem("VITE_USE_MOCK_DATA"),
  isMockMode: "will be determined"
});
