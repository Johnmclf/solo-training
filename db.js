// ===== SOLO LEVELING SPORT SYSTEM - DATABASE =====

const DB_KEY = 'solo_sport_db';

function getDB() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) {
    const init = { users: {} };
    localStorage.setItem(DB_KEY, JSON.stringify(init));
    return init;
  }
  return JSON.parse(raw);
}

function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getCurrentUser() {
  const username = localStorage.getItem('current_user');
  if (!username) return null;
  const db = getDB();
  return db.users[username] || null;
}

function getCurrentUsername() {
  return localStorage.getItem('current_user');
}

function saveCurrentUser(userData) {
  const username = getCurrentUsername();
  if (!username) return;
  const db = getDB();
  db.users[username] = userData;
  saveDB(db);
}

// ===== AUTH =====

function register(username, password, displayName) {
  const db = getDB();
  if (db.users[username]) return { success: false, error: 'Ce nom de chasseur existe déjà.' };
  const today = getTodayStr();
  db.users[username] = {
    password: btoa(password),
    displayName: displayName || username,
    points: 0,
    combo: 1.0,
    lastLogin: today,
    rank: 'E',
    // Today's session
    todayPushups: 0,
    todayAbs: 0,
    todayPullups: 0,
    todayWeightKg: 0,
    todayObjPushups: false,
    todayObjAbs: false,
    todayDate: today,
    // History
    history: [],
    totalPushups: 0,
    totalAbs: 0,
    totalPullups: 0,
    totalWeightKg: 0,
    totalDaysCompleted: 0,
    totalDaysMissed: 0,
  };
  saveDB(db);
  return { success: true };
}

function login(username, password) {
  const db = getDB();
  const user = db.users[username];
  if (!user) return { success: false, error: 'Chasseur introuvable.' };
  if (user.password !== btoa(password)) return { success: false, error: 'Mot de passe incorrect.' };

  // Check missed days
  const today = getTodayStr();
  const lastLogin = user.lastLogin || today;
  const daysMissed = daysBetween(lastLogin, today);

  let penaltyLog = [];

  if (daysMissed > 0) {
    // For each missed day, apply penalty
    for (let i = 0; i < daysMissed; i++) {
      const missedDate = addDays(lastLogin, i);
      let dayPoints = 0;
      let dayLabel = '';

      // If it's the day of last login, check if objectives were completed
      if (i === 0) {
        // Last login day - check what was done
        if (!user.todayObjPushups) {
          user.points -= 50;
          dayPoints -= 50;
        }
        if (!user.todayObjAbs) {
          user.points -= 50;
          dayPoints -= 50;
        }
        if (!user.todayObjPushups && !user.todayObjAbs) {
          user.combo = 1.0;
          dayLabel = 'Aucun objectif — combo reset';
        } else {
          dayLabel = 'Objectifs partiels';
        }
      } else {
        // Days completely missed
        user.points -= 100;
        dayPoints -= 100;
        user.combo = 1.0;
        dayLabel = 'Jour manqué — combo reset';
      }

      penaltyLog.push({ date: missedDate, points: dayPoints, label: dayLabel });

      // Archive history entry for missed day
      user.history.push({
        date: missedDate,
        pushups: i === 0 ? user.todayPushups : 0,
        abs: i === 0 ? user.todayAbs : 0,
        pullups: i === 0 ? user.todayPullups : 0,
        weightKg: i === 0 ? user.todayWeightKg : 0,
        objPushups: i === 0 ? user.todayObjPushups : false,
        objAbs: i === 0 ? user.todayObjAbs : false,
        pointsDelta: dayPoints,
        type: 'missed'
      });
      user.totalDaysMissed++;
    }

    // Reset today's data
    user.todayPushups = 0;
    user.todayAbs = 0;
    user.todayPullups = 0;
    user.todayWeightKg = 0;
    user.todayObjPushups = false;
    user.todayObjAbs = false;
    user.todayDate = today;
    user.lastLogin = today;
  } else {
    // Same day login, just update
    user.todayDate = today;
    user.lastLogin = today;
  }

  // Clamp points
  if (user.points < 0) user.points = 0;
  user.combo = Math.max(1.0, user.combo);
  user.combo = parseFloat(user.combo.toFixed(2));

  // Update rank
  user.rank = calcRank(user.points);

  db.users[username] = user;
  saveDB(db);
  localStorage.setItem('current_user', username);

  return { success: true, penaltyLog, daysMissed };
}

function logout() {
  localStorage.removeItem('current_user');
  window.location.href = 'index.html';
}

// ===== OBJECTIVES =====

function addPushups(count) {
  const user = getCurrentUser();
  if (!user) return;
  const prev = user.todayPushups;
  user.todayPushups += count;
  user.totalPushups += count;
  user.points += count; // 1 point per pushup

  // Check objective
  if (!user.todayObjPushups && user.todayPushups >= 100) {
    user.todayObjPushups = true;
    user.points += 50;
    user.combo = parseFloat((user.combo + 0.05).toFixed(2));
    // Check if both done
    if (user.todayObjAbs) {
      user.totalDaysCompleted++;
    }
    user.rank = calcRank(user.points);
  saveCurrentUser(user);
    return { objCompleted: true, msg: 'Objectif Pompes complété ! +50 pts, combo +0.05' };
  }
  user.rank = calcRank(user.points);
  saveCurrentUser(user);
  return { objCompleted: false };
}

function resetPushups() {
  const user = getCurrentUser();
  if (!user) return;
  const pts = user.todayPushups;
  user.points = Math.max(0, user.points - pts);
  user.totalPushups = Math.max(0, user.totalPushups - pts);
  // If objective was completed, remove bonus
  if (user.todayObjPushups) {
    user.points = Math.max(0, user.points - 50);
    user.combo = Math.max(1.0, parseFloat((user.combo - 0.05).toFixed(2)));
    user.todayObjPushups = false;
  }
  user.todayPushups = 0;
  user.rank = calcRank(user.points);
  user.rank = calcRank(user.points);
  saveCurrentUser(user);
}

function addAbs(count) {
  const user = getCurrentUser();
  if (!user) return;
  user.todayAbs += count;
  user.totalAbs += count;
  user.points += count;

  if (!user.todayObjAbs && user.todayAbs >= 100) {
    user.todayObjAbs = true;
    user.points += 50;
    user.combo = parseFloat((user.combo + 0.05).toFixed(2));
    if (user.todayObjPushups) {
      user.totalDaysCompleted++;
    }
    user.rank = calcRank(user.points);
  saveCurrentUser(user);
    return { objCompleted: true, msg: 'Objectif Abdos complété ! +50 pts, combo +0.05' };
  }
  user.rank = calcRank(user.points);
  saveCurrentUser(user);
  return { objCompleted: false };
}

function resetAbs() {
  const user = getCurrentUser();
  if (!user) return;
  const pts = user.todayAbs;
  user.points = Math.max(0, user.points - pts);
  user.totalAbs = Math.max(0, user.totalAbs - pts);
  if (user.todayObjAbs) {
    user.points = Math.max(0, user.points - 50);
    user.combo = Math.max(1.0, parseFloat((user.combo - 0.05).toFixed(2)));
    user.todayObjAbs = false;
  }
  user.todayAbs = 0;
  user.rank = calcRank(user.points);
  user.rank = calcRank(user.points);
  saveCurrentUser(user);
}

function addPullups(count) {
  const user = getCurrentUser();
  if (!user) return;
  user.todayPullups += count;
  user.totalPullups += count;
  user.points += count;
  user.rank = calcRank(user.points);
  saveCurrentUser(user);
}

function addWeight(kg) {
  const user = getCurrentUser();
  if (!user) return;
  user.todayWeightKg += kg;
  user.totalWeightKg += kg;
  user.points += Math.floor(kg / 10);
  user.rank = calcRank(user.points);
  saveCurrentUser(user);
}

function resetPullups() {
  const user = getCurrentUser();
  if (!user) return;
  const pts = user.todayPullups;
  user.points = Math.max(0, user.points - pts);
  user.totalPullups = Math.max(0, user.totalPullups - pts);
  user.todayPullups = 0;
  user.rank = calcRank(user.points);
  user.rank = calcRank(user.points);
  saveCurrentUser(user);
}

function resetWeight() {
  const user = getCurrentUser();
  if (!user) return;
  const pts = Math.floor(user.todayWeightKg / 10);
  user.points = Math.max(0, user.points - pts);
  user.totalWeightKg = Math.max(0, user.totalWeightKg - user.todayWeightKg);
  user.todayWeightKg = 0;
  user.rank = calcRank(user.points);
  user.rank = calcRank(user.points);
  saveCurrentUser(user);
}

// ===== HELPERS =====

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(d1, d2) {
  const a = new Date(d1);
  const b = new Date(d2);
  const diff = Math.floor((b - a) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function calcRank(points) {
  if (points >= 10000000) return 'S';
  if (points >= 1000000)  return 'A';
  if (points >= 100000)   return 'B';
  if (points >= 10000)    return 'C';
  if (points >= 1000)     return 'D';
  return 'E';
}

function rankColor(rank) {
  const colors = { S: '#ff0000', A: '#ff6b00', B: '#a855f7', C: '#3b82f6', D: '#22c55e', E: '#94a3b8' };
  return colors[rank] || '#94a3b8';
}

function requireAuth() {
  if (!localStorage.getItem('current_user')) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}
