// Welcome Notification
document.addEventListener("DOMContentLoaded", function () {
  showNotification();
});

function showNotification() {
  // Disable scrolling
  document.body.style.overflow = "hidden";

  // Create backdrop overlay
  const backdrop = document.createElement("div");
  backdrop.className = "notification-backdrop";
  document.body.appendChild(backdrop);

  // Create notification container
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.innerHTML = `
    <div class="notification-content">
      <h3>Welcome, Anime Enthusiast!</h3>
      <p>You have finally made your way to the greatest anime association you will ever know! 🎌</p>
      <div class="notification-buttons">
        <button class="close-notification">×</button>
        <button class="bankai-btn">Bankai...</button>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Close button functionality
  const closeBtn = notification.querySelector(".close-notification");
  closeBtn.addEventListener("click", function () {
    notification.classList.add("fade-out");
    backdrop.classList.add("fade-out");
    setTimeout(() => {
      notification.remove();
      backdrop.remove();
      // Re-enable scrolling
      document.body.style.overflow = "auto";
    }, 500);
  });

  // Bankai button functionality
  const bankaiBtn = notification.querySelector(".bankai-btn");
  bankaiBtn.addEventListener("click", function () {
    notification.classList.add("bankai-mode");
    backdrop.classList.add("bankai-mode");
    setTimeout(() => {
      notification.remove();
      backdrop.remove();
      // Re-enable scrolling
      document.body.style.overflow = "auto";
    }, 800);
  });
}
