// ONLY NOTIFICATION - 28 POINTS - ₹100 - FINAL LOCK
// Share 5 = Status (1) + Groups (4) = FREE

// 1. CONFIG
const CONFIG = {
  subscriberPrice: 100,
  bellTimeStart: 9, // 9AM
  bellTimeEnd: 20.5, // 8:30PM
  dailyLimit: 5,
  radiusPercent: 0.20, // 20%
  freeShareTarget: 5, // 1 Status + 4 Groups
  referralPoints: 20,
  primePoints: 500,
  jobFreeTill: "2026-12-31",
  bellSound: "swiggy-bell.mp3"
};

// 2. ADMIN BLOCK - Only Your Email
const ADMIN_EMAIL = "YOUR_EMAIL@gmail.com";
function checkAdmin(user) {
  if (window.location.pathname === "/admin" && user.email !== ADMIN_EMAIL) {
    window.location.href = "/";
    return false;
  }
  return true;
}

// 3. 20% RADIUS - 100KM=20KM, 250KM=50KM, 1400KM=280KM
function getRadius(totalKm) {
  return totalKm * CONFIG.radiusPercent;
}
function isInRadius(userKm, totalKm) {
  return userKm <= getRadius(totalKm);
}

// 4. BELL TIME LOCK - 9AM to 8:30PM Only Sound
function canPlayBellSound() {
  const h = new Date().getHours() + new Date().getMinutes()/60;
  return h >= CONFIG.bellTimeStart && h <= CONFIG.bellTimeEnd;
}

// 5. SWIGGY BELL - Default ON, ON/OFF Only
let bellSetting = localStorage.getItem("bellSetting") || "ON"; // Default ON
function playBell() {
  // Permanent Save - 3 Places
  savePermanent("lastBell", new Date().toISOString());

  // Shake 2 Sec Animation
  const bellEl = document.getElementById("bellIcon");
  if (bellEl) {
    bellEl.classList.add("bell-shake");
    setTimeout(() => bellEl.classList.remove("bell-shake"), 2000);
  }

  if (bellSetting === "ON" && canPlayBellSound()) {
    const audio = new Audio(CONFIG.bellSound);
    audio.play();
  }
  // OFF ayithe - Sound OFF, Screen Notification Only
  showScreenNotification("New Load Available!");
}

// 6. DAILY LIMIT - 5 Times Only
function checkDailyLimit(type) {
  const today = new Date().toDateString();
  const key = `limit_${type}_${today}`;
  let count = parseInt(localStorage.getItem(key) || "0");
  if (count >= CONFIG.dailyLimit) return false;
  localStorage.setItem(key, count + 1);
  return true;
}

// 7. PERMANENT SAVE - History Clear ayina povu
function savePermanent(key, value) {
  localStorage.setItem(key, value);
  sessionStorage.setItem(key, value);
  document.cookie = `${key}=${value}; max-age=31536000; path=/`;
}

// 8. SHARE 5 = FREE - 1 Status + 4 Groups
let shareCount = parseInt(localStorage.getItem("shareCount") || "0");
let statusShared = localStorage.getItem("statusShared") === "true";
function shareToStatus() {
  if (!statusShared) {
    statusShared = true;
    shareCount++;
    localStorage.setItem("statusShared", "true");
    localStorage.setItem("shareCount", shareCount);
    updateShareUI();
  }
}
function shareToGroup() {
  shareCount++;
  localStorage.setItem("shareCount", shareCount);
  updateShareUI();
}
function updateShareUI() {
  const el = document.getElementById("shareProgress");
  if (el) el.innerText = `${shareCount}/5 - ${shareCount >= 5 ? "FREE UNLOCKED!" : "Status(1) + Groups(4)"}`;
}
function isFreeUnlocked() {
  return shareCount >= 5;
}

// 9. SUBSCRIBER ₹100 CHECK
function canSeeFullDetails(user) {
  return user.isPaid100 === true || isFreeUnlocked();
}
function getVisibleDetails(load, user) {
  if (canSeeFullDetails(user)) return load; // Full
  return { route: load.route, ton: load.ton, vehicle: load.vehicle }; // Only 3
}

// 10. PROFILE PHOTO REMINDER - 3 Days - Telugu + Marathi
function profilePhotoReminder(user) {
  if (user.photo) return;
  const day = parseInt(localStorage.getItem("photoRemindDay") || "0");
  if (day >= 3) return;
  const msgs = [
    "Day1: Anna, photo pettandi, load lu fast ga vastayi!",
    "Day2: Anna, photo lekapothe trust raadu, please photo pettandi!",
    "Day3: Anna, last roju, photo pettandi, meeku manchi loads istham!"
  ];
  showScreenNotification(msgs[day]);
  localStorage.setItem("photoRemindDay", day + 1);
}

// 11. LIVE BADGE
function updateLiveBadge(isLive) {
  const el = document.getElementById("liveBadge");
  if (el) el.innerHTML = isLive ? "🔴 LIVE ON <span class='dot-green-blink'></span>" : "⚫ OFF";
}
