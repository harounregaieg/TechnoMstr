<template>
    <article class="ticket">
      <div class="ticket-container">
        <section class="main-content">
          <div class="content-wrapper">
            <header class="ticket-header">
              <div class="back-button" @click="goBack">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/TEMP/b7f01b9f523ea430a34a4937e93bb535a72ef0b8590f9d285cb781b097ca0e1a?placeholderIfAbsent=true&apiKey=11ca9f5aa3e84ca99e47336ecb81adba"
                  class="back-icon"
                  alt="Return"
                />
                <span class="back-text">Retour</span>
              </div>
              <h1 class="ticket-title">Sujet du Ticket</h1>
            </header>
  
            <div class="ticket-info-list">
              <h2 class="info-item">Equipement ID :</h2>
              <h2 class="info-item">Location :</h2>
              <h2 class="info-item">Etat :</h2>
              <h2 class="info-item">Piece(s) a Remplacer :</h2>
            </div>
  
            <section class="description-section">
              <header class="section-header">Description</header>
            </section>
  
            <section class="notes-section">
              <header class="section-header">Notes</header>
              <textarea
                class="notes-input"
                placeholder="Ajouter Notes"
              ></textarea>
            </section>
          </div>
        </section>
  
        <aside class="sidebar">
          <div class="sidebar-content">
            <h2 class="sidebar-title">Details</h2>
  
            <section class="info-box ticket-details">
              <h3 class="box-title">Ticket Info</h3>
              <div class="info-list">
                <p class="info-item">Ticket ID:</p>
                <p class="info-item">Date de Creation:</p>
                <p class="info-item">Statut:</p>
                <p class="info-item">Priority:</p>
              </div>
            </section>
  
            <section class="info-box responsible-section">
              <h3 class="box-title">Responsable</h3>
              <div class="agent-info">
                <h4 class="agent-label">Agent</h4>
                <p class="agent-name">Agent Name</p>
                <p class="agent-email">AgentName@mail.ex</p>
              </div>
            </section>
  
            <section class="info-box requester-section">
              <h3 class="box-title">Requester</h3>
              <p class="requester-name">Requester Name</p>
              <p class="requester-email">Requester@mail.ex</p>
            </section>
          </div>
        </aside>
      </div>
    </article>
  </template>
  
  <script>
  import { ref, onMounted } from "vue";
  import { useRoute, useRouter } from "vue-router";

  const route = useRoute();
  const router = useRouter();

  const ticket = ref(null);

  const goBack = () => {
    router.back();
  };

  onMounted(async () => {
    const ticketId = parseInt(route.params.id);
    // Fetch ticket data from the API
    // Replace this with your actual API call
    // For now, we'll just simulate fetching the ticket

    ticket.value = {
        id: ticketId,
        subject: "Sujet du Ticket",
        equipmentId: "123456",
        location: "Location",
        status: "Ouvert",
        partsToReplace: "Part 1, Part 2",
        description: "Description du Ticket",
        notes: "Notes du Ticket",
        createdDate: "2021-09-01",
        priority: "Haute",
        agent: {
          name: "Agent Name",
          email: "agent1@gmail.com",
        },
    };
  })
  export default {
    name: "Ticket",
    data() {
      return {
        // Add reactive data here if needed
      };
    },
  };
  </script>
  
  <style lang="scss" scoped>
  
  .ticket {
    background-color: rgba(255, 255, 255, 0.6);
    padding: 2rem;
    overflow: hidden;
  }
  
  .ticket-container {
    gap: 2rem;
    display: flex;
    flex-wrap: wrap;
  }
  
  .main-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 300px;
  }
  
  .content-wrapper {
    background-color: rgba(255, 255, 255, 0.5);
    padding: 1.5rem;
    width: 100%;
  }
  
  .ticket-header {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 1.5rem;
    font-family: Poppins, -apple-system, Roboto, Helvetica, sans-serif;
    color: #000000;
    margin-bottom: 2rem;
  }
  
  .back-button {
    display: flex;
    margin-top: 9px;
    align-items: stretch;
    gap: 6px;
    font-size: 24px;
  }
  
  .back-icon {
    aspect-ratio: 1.17;
    object-fit: contain;
    object-position: center;
    width: 14px;
    align-self: start;
    margin-top: 13px;
  }
  
  .ticket-title {
    font-size: 32px;
    font-weight: 400;
  }
  
  .ticket-info-list {
    margin: 2rem 0;
  }
  
  .info-item {
    color: rgba(69, 69, 69, 1);
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    font-family:
      Poppins,
      -apple-system,
      Roboto,
      Helvetica,
      sans-serif;
    font-weight: 400;
  }
  
  .description-section {
    border-radius: 10px;
    background-color: #fff;
    margin: 2rem 0;
    min-height: 200px;
  }
  
  .section-header {
    border-radius: 9px 10px 0px 0px;
    background-color: rgba(128, 120, 120, 0.35);
    padding: 20px 26px;
    font-family:
      Poppins,
      -apple-system,
      Roboto,
      Helvetica,
      sans-serif;
    font-size: 24px;
  }
  
  .notes-section {
    border-radius: 10px;
    background-color: #fff;
    margin: 2rem 0;
  }
  
  .notes-input {
    width: 100%;
    min-height: 150px;
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 5px;
    background-color: rgba(255, 255, 255, 1);
    border: 1px solid rgba(3, 17, 27, 0.7);
    font-family:
      Inter,
      -apple-system,
      Roboto,
      Helvetica,
      sans-serif;
    font-size: 16px;
    color: #1e1e1e;
  }
  
  .sidebar {
    width: 300px;
    min-width: 300px;
    margin-left: 20px;
  }
  
  .sidebar-content {
    margin-top: 16px;
    font-family:
      Poppins,
      -apple-system,
      Roboto,
      Helvetica,
      sans-serif;
    color: #000000;
  }
  
  .sidebar-title {
    font-size: 32px;
    font-weight: 400;
  }
  
  .info-box {
    border-radius: 10px;
    background-color: #fff;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .ticket-details {
    margin-top: 2rem;
  }
  
  .box-title {
    font-size: 32px;
    font-weight: 400;
  }
  
  .info-list {
    font-size: 16px;
    margin-top: 55px;
  }
  
  .info-list p {
    margin-bottom: 1rem;
  }
  
  .agent-info {
    text-align: center;
  }
  
  .agent-label {
    font-size: 24px;
    margin-top: 28px;
    margin-left: 10px;
    font-weight: 400;
  }
  
  .agent-name {
    font-size: 24px;
    margin-top: 30px;
  }
  
  .agent-email {
    font-size: 16px;
    margin-top: 11px;
  }
  
  .requester-section {
    text-align: center;
    padding-bottom: 141px;
  }
  
  .requester-name {
    font-size: 14px;
    margin-top: 44px;
  }
  
  .requester-email {
    font-size: 10px;
    margin-top: 2px;
  }
  </style>
  
  
  