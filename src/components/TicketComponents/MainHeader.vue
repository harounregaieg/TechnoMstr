<template>
  <header class="main-header">
    <div class="header-content">
      <h1 class="page-title">All Tickets</h1>
    </div>
  </header>
</template>

<style scoped>
.main-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  padding: 36px 32px 20px 32px;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  background: transparent;
  animation: fadeIn 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.page-title {
  font-family: "Poppins", sans-serif;
  font-size: 2.5rem;
  color: #357abd;
  font-weight: 700;
  margin: 0;
  padding: 0;
  letter-spacing: 0.5px;
}

.subtitle {
  font-family: "Inter", sans-serif;
  font-size: 1.1rem;
  color: #6c757d;
  font-weight: 400;
  margin: 0;
  padding: 0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: none; }
}
</style>
  