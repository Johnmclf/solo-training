// ===== SOLO SPORT SYSTEM — UI / NOTIFICATIONS =====

/**
 * Show a Solo Leveling "System" toast notification.
 * @param {string} type   'success' | 'error' | 'warning' | 'info' | 'reward'
 * @param {string} title  Short bold title (displayed in Orbitron)
 * @param {string} desc   Subtitle / detail (monospace, smaller)
 * @param {string} pts    Optional points string e.g. "+50 PTS"
 * @param {number} dur    Duration in ms (default 3500)
 */
function showToast(type = 'info', title = '', desc = '', pts = '', dur = 3500) {
  const container = document.getElementById('toasts');
  if (!container) return;

  const labels = {
    success : '[ SYSTÈME — SUCCÈS ]',
    error   : '[ SYSTÈME — ERREUR ]',
    warning : '[ SYSTÈME — ALERTE ]',
    info    : '[ SYSTÈME — INFO ]',
    reward  : '[ SYSTÈME — RÉCOMPENSE ]',
  };

  const icons = {
    success : '✦',
    error   : '✖',
    warning : '⚠',
    info    : '◈',
    reward  : '⚜',
  };

  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `
    <div class="toast-inner">
      <div class="toast-icon">${icons[type] || '◈'}</div>
      <div class="toast-body">
        <div class="toast-label">${labels[type] || labels.info}</div>
        <div class="toast-title">${title}</div>
        ${desc ? `<div class="toast-desc">${desc}</div>` : ''}
        ${pts  ? `<div class="toast-pts">${pts}</div>` : ''}
      </div>
    </div>
    <div class="toast-timer"></div>
  `;
  container.appendChild(t);

  // Auto remove after dur + 300ms (out animation)
  setTimeout(() => t.remove(), dur + 300);
}


// ===== MESSAGES THÉMATIQUES =====

function toastPushups(n) {
  showToast('info',
    'Entraînement enregistré',
    `${n} pompe${n > 1 ? 's' : ''} exécutée${n > 1 ? 's' : ''}`,
    `+${n} PTS`
  );
}

function toastAbs(n) {
  showToast('info',
    'Entraînement enregistré',
    `${n} abdo${n > 1 ? 's' : ''} exécuté${n > 1 ? 's' : ''}`,
    `+${n} PTS`
  );
}

function toastPullups(n) {
  showToast('info',
    'Entraînement enregistré',
    `${n} traction${n > 1 ? 's' : ''} enregistrée${n > 1 ? 's' : ''}`,
    `+${n} PTS`
  );
}

function toastWeight(kg) {
  const pts = Math.floor(kg / 10);
  showToast('info',
    'Force enregistrée',
    `${kg} kg soulevés — ratio 1 pt / 10 kg`,
    pts > 0 ? `+${pts} PTS` : 'Aucun point (< 10 kg)'
  );
}

function toastObjComplete(type) {
  const labels = { pushups: 'Pompes', abs: 'Abdominaux' };
  showToast('reward',
    `Objectif ${labels[type]} accompli`,
    'Combo augmenté — continuez votre ascension',
    '+50 PTS · COMBO +0.05',
    4000
  );
}

function toastBothObjComplete() {
  showToast('reward',
    'Journée parfaite',
    'Les deux objectifs accomplis — le Système vous récompense',
    '+100 PTS · COMBO RENFORCÉ',
    4500
  );
}

function toastReset(type, ptsLost) {
  const labels = { pushups: 'pompes', abs: 'abdos' };
  showToast('warning',
    'Données réinitialisées',
    `Compteur ${labels[type]} remis à zéro`,
    `-${ptsLost} PTS DÉDUITS`
  );
}

function toastRankUp(newRank) {
  const rankNames = { D: 'D — Chasseur Confirmé', C: 'C — Chasseur Élite', B: 'B — Chasseur Avancé', A: 'A — Chasseur de Haut Rang', S: 'S — RANG LÉGENDAIRE' };
  showToast('reward',
    'Promotion de Rang',
    rankNames[newRank] || `Rang ${newRank} atteint`,
    'NOUVEAU RANG DÉBLOQUÉ',
    5000
  );
}

function toastLoginOk(displayName) {
  showToast('success',
    `Bienvenue, ${displayName}`,
    'Connexion établie — le Système vous reconnaît',
    '',
    3000
  );
}

function toastError(msg) {
  showToast('error', 'Opération impossible', msg);
}

function toastPenalty(days, ptsLost) {
  showToast('error',
    `${days} jour${days > 1 ? 's' : ''} d'absence détecté${days > 1 ? 's' : ''}`,
    'Pénalités appliquées — le Système est implacable',
    `-${ptsLost} PTS · COMBO RESET`,
    5000
  );
}


// ===== MODAL DE CONFIRMATION STYLISÉ =====
/**
 * Remplace window.confirm() avec le style Solo Leveling.
 * @param {string} title   Titre principal
 * @param {string} desc    Description / détail
 * @param {string} pts     Ligne points (ex: "-150 PTS DÉDUITS")
 * @returns {Promise<boolean>}
 */
function showConfirm(title, desc, pts = '') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px;">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--red),transparent);"></div>
        <div style="text-align:center;margin-bottom:1.5rem;">
          <div style="font-family:var(--font-mono);font-size:0.6rem;letter-spacing:3px;color:rgba(239,68,68,0.5);margin-bottom:0.8rem;">[ SYSTÈME — CONFIRMATION ]</div>
          <div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--text-primary);letter-spacing:2px;">${title}</div>
          ${desc ? `<div style="font-family:var(--font-mono);font-size:0.8rem;color:var(--text-muted);margin-top:6px;">${desc}</div>` : ''}
          ${pts ? `<div style="font-family:var(--font-display);font-size:1.1rem;font-weight:700;color:var(--red);margin-top:10px;text-shadow:0 0 15px rgba(239,68,68,0.4);">${pts}</div>` : ''}
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-ghost" style="flex:1;" id="confirm-cancel">Annuler</button>
          <button class="btn btn-danger" style="flex:1;background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.6);" id="confirm-ok">Confirmer</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#confirm-ok').onclick = () => { overlay.remove(); resolve(true); };
    overlay.querySelector('#confirm-cancel').onclick = () => { overlay.remove(); resolve(false); };
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
  });
}
