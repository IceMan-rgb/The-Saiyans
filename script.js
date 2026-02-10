// Welcome Notification
document.addEventListener("DOMContentLoaded", function () {
  showNotification();

  // Initialize fade-out effect after a brief delay to allow DOM to fully settle
  setTimeout(() => {
    initFadeOutOnScroll();
  }, 100);
});

// Fade Out Effect for Elements Leaving Top of Viewport
function initFadeOutOnScroll() {
  const options = {
    root: null,
    rootMargin: "0px 0px 0px 0px",
    threshold: [0, 0.1, 0.5],
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      // Skip notification elements to avoid circular issues
      if (
        entry.target.classList.contains("notification") ||
        entry.target.classList.contains("notification-backdrop")
      ) {
        return;
      }

      // Get the element's position relative to viewport
      const rect = entry.boundingClientRect;
      const isAboveViewport = rect.bottom < 0;

      if (isAboveViewport) {
        // Element is above viewport - apply fade out
        if (!entry.target.classList.contains("fade-out-top")) {
          entry.target.classList.add("fade-out-top");
        }
      } else {
        // Element is visible or below viewport - remove fade out
        if (entry.target.classList.contains("fade-out-top")) {
          entry.target.classList.remove("fade-out-top");
        }
      }
    });
  }, options);

  // Observe all main content elements (sections, divs, etc.) - excluding notification elements
  const elementsToObserve = document.querySelectorAll(
    "section:not(.notification), article, .container, h1, h2, h3, p, ul, li, #BOD > div",
  );

  elementsToObserve.forEach((element) => {
    observer.observe(element);
  });
}

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
