document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      console.log("Fetching activities...");
      const response = await fetch("/activities");
      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response text:", responseText);
      
      // Tenta converter o texto em JSON
      let activitiesData;
      try {
        activitiesData = JSON.parse(responseText);
        console.log("Parsed JSON data:", activitiesData);
        // Assegurar que activitiesData é um array
        if (!Array.isArray(activitiesData)) {
          console.log("activitiesData não é um array, é um:", typeof activitiesData);
          throw new Error("Response is not an array");
        }
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError);
        throw new Error("Invalid JSON response");
      }

      // Limpa mensagens e listas
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Popula lista de atividades
      activitiesData.forEach((activity) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = activity.max_participants - activity.participants.length;

        // Cria a lista de participantes (se houver)
        let participantsHTML = "";
        if (activity.participants && activity.participants.length > 0) {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <ul class="participants-list">
                ${activity.participants.map(email => `
                  <li class="participant-item">
                    <span class="participant-email">${email}</span>
                    <span class="delete-participant" title="Unregister" data-activity="${activity.name}" data-email="${email}">
                      🗑️
                    </span>
                  </li>
                `).join("")}
              </ul>
            </div>
          `;
        } else {
          participantsHTML = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <span class="no-participants">No participants yet</span>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${activity.name}</h4>
          <p>${activity.description}</p>
          <p><strong>Schedule:</strong> ${activity.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Adiciona opção ao select
        const option = document.createElement("option");
        option.value = activity.name;
        option.textContent = activity.name;
        activitySelect.appendChild(option);
      });

      // Adiciona listeners para os ícones de exclusão
      document.querySelectorAll('.delete-participant').forEach(icon => {
        icon.addEventListener('click', async (e) => {
          const activity = icon.getAttribute('data-activity');
          const email = icon.getAttribute('data-email');
          if (!activity || !email) return;
          // Modal de confirmação nativo
          if (!confirm(`Remove ${email} from ${activity}?`)) return;
          try {
            const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
              method: 'DELETE',
            });
            const result = await response.json();
            if (response.ok) {
              messageDiv.textContent = result.message;
              messageDiv.className = "success";
              // Atualiza lista imediatamente
              await fetchActivities();
            } else {
              messageDiv.textContent = result.detail || "Failed to unregister participant.";
              messageDiv.className = "error";
            }
            messageDiv.classList.remove("hidden");
            setTimeout(() => messageDiv.classList.add("hidden"), 5000);
          } catch (error) {
            messageDiv.textContent = "Failed to unregister. Please try again.";
            messageDiv.className = "error";
            messageDiv.classList.remove("hidden");
          }
        });
      });
    } catch (error) {
      console.error("Error fetching activities:", error);
      activitiesList.innerHTML = `<p>Failed to load activities. Please try again later.</p>`;
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Atualiza lista imediatamente após cadastro
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
