document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // helper to build initials from email (for avatar)
      const getInitials = (email) => {
        const name = String(email || "").split("@")[0] || "";
        const parts = name.split(/[\.\-_]/).filter(Boolean);
        if (parts.length === 0) return (name[0] || "").toUpperCase();
        if (parts.length === 1) return (parts[0][0] || "").toUpperCase();
        return ((parts[0][0] || "") + (parts[1][0] || "")).toUpperCase();
      };

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Title and basic info
        const title = document.createElement("h4");
        title.textContent = name;

        const desc = document.createElement("p");
        desc.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

        const availability = document.createElement("p");
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);

        // Participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const label = document.createElement("span");
        label.className = "participants-label";
        label.textContent = "Participants";
        participantsDiv.appendChild(label);

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const ul = document.createElement("ul");
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const avatar = document.createElement("span");
            avatar.className = "avatar";
            avatar.textContent = getInitials(email);

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = email;

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-participant-btn";
            deleteBtn.innerHTML = "&times;";
            deleteBtn.title = `Remove ${email}`;
            deleteBtn.addEventListener("click", async (e) => {
              e.preventDefault();
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(email)}`,
                  { method: "POST" }
                );
                if (response.ok) {
                  fetchActivities();
                } else {
                  const result = await response.json();
                  alert(result.detail || "Failed to unregister participant");
                }
              } catch (error) {
                alert("Error unregistering participant");
                console.error("Error:", error);
              }
            });

            li.appendChild(avatar);
            li.appendChild(emailSpan);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });
          participantsDiv.appendChild(ul);
        } else {
          const none = document.createElement("div");
          none.className = "no-participants";
          none.textContent = "No participants yet — be the first to sign up!";
          participantsDiv.appendChild(none);
        }

        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
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
        fetchActivities();
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
