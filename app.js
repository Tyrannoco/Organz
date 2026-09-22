/* ============================================================
   ORGANZ — app.js
   ------------------------------------------------------------
   Ce fichier fait 3 choses, dans l'ordre :
   1. UTILITAIRES DE DATES  → manipuler des dates facilement
   2. DONNÉES               → les matières / dossiers / cours (fictifs)
   3. LOGIQUE MÉTIER        → répétition espacée + calcul des statuts
   4. RENDU (UI)            → construit le HTML de chaque page
   5. ÉVÉNEMENTS            → réagit aux clics de l'utilisateur

   Astuce pour débutant : cherche les commentaires "ÉTAPE" pour
   suivre le fil, et n'hésite pas à modifier des valeurs (les
   intervalles de révision par exemple) pour voir l'effet.
   ============================================================ */

/* ---------- 1. UTILITAIRES DE DATES ---------- */

const MOIS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];
const JOURS_FR = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

// "Aujourd'hui" figé à minuit, calculé une seule fois au chargement de la page.
// Comme il est recalculé à chaque ouverture du site, la démo reste toujours
// cohérente, quel que soit le jour où tu l'ouvres.
const AUJOURDHUI = new Date();
AUJOURDHUI.setHours(0, 0, 0, 0);

// Ajoute (ou retire, si n est négatif) n jours à une date, sans la modifier.
function ajouterJours(date, n) {
  const copie = new Date(date);
  copie.setDate(copie.getDate() + n);
  return copie;
}

// Nombre de jours entre deux dates (b - a), arrondi.
function joursEntre(a, b) {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// "22 août" en français, "Aug 22" en anglais (mois abrégé, plus idiomatique
// et plus compact pour les colonnes étroites de la grille).
function formaterDateCourte(date) {
  if (state.langue === "en")
    return `${MOIS_COURT_EN[date.getMonth()]} ${date.getDate()}`;
  return `${date.getDate()} ${MOIS_FR[date.getMonth()]}`;
}

// Version ENCORE plus compacte ("16 sept" / "Sep 16"), mois abrégé dans les
// deux langues cette fois. Utilisée uniquement sous les petites cases de la
// grille : contrairement à formaterDateCourte() (qui garde le mois complet
// en français ailleurs dans l'appli), un nom de mois complet comme
// "septembre" y ferait varier la largeur des cases d'une révision à l'autre,
// et désalignerait les carrés entre les lignes du tableau.
const MOIS_COURT_FR = [
  "jan",
  "fév",
  "mar",
  "avr",
  "mai",
  "jui",
  "jul",
  "aoû",
  "sep",
  "oct",
  "nov",
  "déc",
];
function formaterDateTresCourte(date) {
  if (state.langue === "en")
    return `${MOIS_COURT_EN[date.getMonth()]} ${date.getDate()}`;
  return `${date.getDate()} ${MOIS_COURT_FR[date.getMonth()]}`;
}

// "SAMEDI 29 AOÛT 2026" / "SATURDAY AUGUST 29 2026"
function formaterEnTete(date) {
  const jour = JOURS[state.langue][date.getDay()];
  if (state.langue === "en") {
    return `${jour} ${MOIS.en[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`.toUpperCase();
  }
  return `${jour} ${date.getDate()} ${MOIS_FR[date.getMonth()]} ${date.getFullYear()}`.toUpperCase();
}

// Renvoie { texte, classe } selon que la date de révision est dans le
// passé (en retard), aujourd'hui, ou dans le futur.
function formaterStatutRevision(dateRevision) {
  const diff = joursEntre(AUJOURDHUI, dateRevision);
  if (diff < 0) return { texte: t("statut_retard", -diff), classe: "retard" };
  if (diff === 0)
    return { texte: t("statut_aujourdhui"), classe: "aujourdhui" };
  if (diff <= 6) return { texte: t("statut_a_venir", diff), classe: "a-venir" };
  return { texte: t("statut_a_venir", diff), classe: "lointain" };
}

// Convertit une date en identifiant texte "AAAA-MM-JJ", stable et facile à
// mettre dans un attribut HTML (contrairement à un objet Date). C'est ce qui
// nous permet de savoir, au clic sur une case de la grille, à QUEL jour
// exact elle correspond.
function isoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const j = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${j}`;
}

// Opération inverse : "2026-08-27" → objet Date (à minuit).
function dateDepuisIso(iso) {
  const [y, m, j] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, j);
  date.setHours(0, 0, 0, 0);
  return date;
}

/* ---------- ICÔNES ---------- */
// Petites icônes SVG "trait fin" (au lieu d'emojis) : elles héritent la
// couleur du texte via currentColor, donc elles s'adaptent automatiquement
// au survol, à l'état actif et au mode sombre.
const ICONES = {
  accueil: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8.3 9 3l6.5 5.3"/><path d="M4 7.3V15h10V7.3"/><path d="M7.2 15v-4.2h3.6V15"/></svg>`,
  today: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="3.4" width="13" height="12.1" rx="2"/><path d="M2.5 7.1h13"/><path d="M6 2v2.8M12 2v2.8"/><path d="M6.3 10.6l1.6 1.6 3.3-3.4"/></svg>`,
  grille: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="2.4" y="2.4" width="5.3" height="5.3" rx="1"/><rect x="10.3" y="2.4" width="5.3" height="5.3" rx="1"/><rect x="2.4" y="10.3" width="5.3" height="5.3" rx="1"/><rect x="10.3" y="10.3" width="5.3" height="5.3" rx="1"/></svg>`,
  progression: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 15.2V9.4M9 15.2V2.8M15 15.2V8.6"/></svg>`,
  globe: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><circle cx="9" cy="9" r="6.3"/><path d="M2.7 9h12.6"/><path d="M9 2.7c2.1 1.9 2.1 10.7 0 12.6 M9 2.7c-2.1 1.9-2.1 10.7 0 12.6"/></svg>`,
  soleil: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="9" cy="9" r="3.2"/><path d="M9 1.8v2.1M9 14.1v2.1M2.8 9h2.1M13.1 9h2.1M4.6 4.6l1.5 1.5M11.9 11.9l1.5 1.5M4.6 13.4l1.5-1.5M11.9 6.1l1.5-1.5"/></svg>`,
  lune: `<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.6 10.6A6 6 0 0 1 7.4 3.4a6 6 0 1 0 7.2 7.2Z"/></svg>`,
  options: `<svg viewBox="0 0 18 18" fill="currentColor"><circle cx="4.2" cy="9" r="1.4"/><circle cx="9" cy="9" r="1.4"/><circle cx="13.8" cy="9" r="1.4"/></svg>`,
};

function iconeMatiere(matiere) {
  // Un seul de nos symboles de matière était un emoji coloré (le globe) :
  // on le remplace par sa version trait fin. Les autres (∫, A, φ) sont déjà
  // de simples glyphes typographiques, cohérents avec le reste du design.
  return matiere.icone === "🌍" ? ICONES.globe : matiere.icone;
}

/* ---------- TRADUCTIONS (français / anglais) ---------- */
// Important : on ne traduit QUE les éléments de l'interface (menus, boutons,
// messages...). Les noms de matières, dossiers et cours restent tels que
// l'étudiant les a écrits, dans n'importe quelle langue — ce sont SES
// données, pas du texte de l'application.

const TRADUCTIONS = {
  fr: {
    // Sidebar / navigation
    nav_accueil: "Accueil",
    nav_today: "À réviser aujourd'hui",
    nav_all: "Tous les cours",
    nav_progress: "Progression",
    mes_matieres: "Mes matières",
    nouveau_dossier: "+ Nouveau dossier",
    nouvelle_matiere: "+ Nouvelle matière",
    options_matiere: "Options de la matière",
    options_matiere_titre: "Renommer ou supprimer la matière",
    options_dossier: "Options du dossier",
    options_dossier_titre: "Renommer ou supprimer le dossier",
    deplier_replier: "Déplier / replier",
    changer_theme: "Changer de thème",
    mode_clair: "clair",
    mode_sombre: "sombre",
    changer_langue: "Changer la langue",
    fermer_menu: "Fermer le menu",
    ouvrir_menu: "Ouvrir le menu",
    sauvegarde_ok: "Sauvegardé sur cet appareil",
    sauvegarde_off: "Sauvegarde indisponible ici",
    revenir_demo: "Revenir aux données de démo",
    tout_effacer: "Tout effacer",

    // Accueil / À réviser aujourd'hui
    bonjour: "Bonjour",
    a_jour: "Tu es à jour sur toutes tes révisions. Bravo !",
    intro_a_reviser: (n) =>
      `Tu as <strong>${n}</strong> cours à réviser aujourd'hui.`,
    cours_a_revoir_titre: (n) => `${n} cours à revoir`,
    voir_tout: "Voir tout →",
    grille_de_cours: "Ta grille de cours",
    termines: "terminés",
    rien_a_reviser: "Rien à réviser pour le moment.",
    rien_a_reviser_sub:
      'Reviens plus tard, ou explore "Tous les cours" pour réviser en avance.',
    renommer_ou_supprimer: "Renommer ou supprimer",
    niveau_mal_maitrise: "Mal maîtrisé",
    niveau_fragile: "Fragile",
    niveau_maitrise: "Maîtrisé",
    priorite: "Priorité",
    priorite_faible: "Faible",
    priorite_moyenne: "Moyenne",
    priorite_elevee: "Élevée",
    derniere_revision: "Dernière révision",
    prochaine_revision: "Prochaine",
    intervalle: "Intervalle",
    historique_revisions: "Révisions",
    legende_historique:
      "Les dernières révisions de ce cours — la date de chacune est affichée sous la case",
    aujourdhui_court: "Auj.",
    retard: "Retard",
    pas_de_retard: "À l'heure",
    jours: (n) => `${n} j`,
    objectif_du_jour: (fait, objectif) =>
      `Révisions du jour : ${fait} / ${objectif}`,
    revisions_prioritaires: (n) =>
      `${n} révision${n > 1 ? "s" : ""} prioritaire${n > 1 ? "s" : ""} aujourd'hui`,
    autres_reportees: (n) =>
      `${n} autre${n > 1 ? "s" : ""} sera${n > 1 ? "ont" : ""} progressivement redistribuée${n > 1 ? "s" : ""}.`,
    essentiel_uniquement: "Essentiel uniquement",
    quota_journalier: "Quota quotidien",
    plafond_intervalle: "Plafond des intervalles",

    // Tous les cours
    titre_tous_les_cours: "Tous les cours",
    cours_dans_ce_chapitre: (n) => `${n} cours dans ce chapitre`,
    cours_dans_cette_matiere: (n) => `${n} cours dans cette matière`,
    cours_au_total: (n) => `${n} cours au total`,
    recherche_partout: (n) =>
      `${n} résultat${n > 1 ? "s" : ""} dans tous tes cours`,
    recherche_ici_seulement: "Seulement ici",
    onglet_tous: "Tous",
    onglet_a_revoir: "À revoir",
    onglet_fragiles: "Fragiles",
    onglet_maitrises: "Maîtrisés",
    rechercher_placeholder: "Rechercher un cours…",
    trier_par: "Trier par",
    tri_next: "Prochaine révision",
    tri_priority: "Priorité",
    tri_name: "Nom",
    dossier_vide: "Ce dossier est vide pour l'instant.",
    dossier_vide_sub: "Ajoute ton premier cours pour commencer à réviser.",
    nouveau_cours: "+ Nouveau cours",
    aucun_resultat_recherche: "Aucun cours ne correspond à ta recherche.",
    aucun_cours: "Aucun cours pour le moment.",
    colonne_cours: "COURS",
    colonne_aujourdhui: "Aujourd'hui",
    colonne_prochaine_revision: "Prochaine révision",

    // Popovers
    retirer_case: "Retirer la case",
    renommer_cours: "Renommer le cours",
    supprimer_cours: "Supprimer le cours",
    renommer_matiere: "Renommer la matière",
    supprimer_matiere: "Supprimer la matière",
    renommer_dossier: "Renommer le dossier",
    supprimer_dossier: "Supprimer le dossier",

    // Progression
    titre_progression: "Progression",
    sous_titre_progression: "Vue globale de tes connaissances",
    maitrise_globale: "Maîtrise globale",
    a_reviser: "À réviser",
    cours_maitrises: "Cours maîtrisés",
    total_cours: "Total cours",
    repartition_globale: "Répartition globale",
    legende_a_revoir: (n) => `${n} à revoir`,
    legende_fragiles: (n) => `${n} fragiles`,
    legende_maitrises: (n) => `${n} maîtrisés`,
    par_matiere: "Par matière",
    n_cours: (n) => `${n} cours`,
    pourcent_maitrise: (p) => `${p}% maîtrisé`,
    activite_recente: "Activité récente",
    aujourdhui: "Aujourd'hui",
    hier: "Hier",

    // Boîtes de dialogue (prompt / confirm)
    prompt_nouveau_dossier: "Nom du nouveau dossier :",
    prompt_nouveau_cours: "Nom du nouveau cours :",
    prompt_nouvelle_matiere: "Nom de la nouvelle matière :",
    prompt_renommer_cours: "Nouveau nom du cours :",
    prompt_renommer_matiere: "Nouveau nom de la matière :",
    prompt_renommer_dossier: "Nouveau nom du dossier :",
    confirm_supprimer_cours: (nom) => `Supprimer définitivement "${nom}" ?`,
    confirm_supprimer_matiere: (nom, n) =>
      n > 0
        ? `Supprimer définitivement "${nom}" et ses ${n} cours ?`
        : `Supprimer définitivement "${nom}" ?`,
    confirm_supprimer_dossier: (nom, n) =>
      n > 0
        ? `Supprimer définitivement "${nom}" et ses ${n} cours ?`
        : `Supprimer définitivement "${nom}" ?`,
    confirm_reinitialiser:
      "Réinitialiser Organz et revenir aux données de démonstration ?\nCette action efface définitivement tes cours actuels.",
    confirm_vider_donnees:
      'Tout effacer et repartir d\'une page blanche ?\nToutes tes matières, tous tes dossiers et tous tes cours seront définitivement supprimés — contrairement à "Revenir aux données de démo", rien ne sera remis à la place. Cette action est irréversible.',

    // Statuts de révision (utilisés dans toute l'appli)
    statut_retard: (n) => `${n}j de retard`,
    statut_aujourdhui: "Aujourd'hui",
    statut_a_venir: (n) => `dans ${n}j`,
  },

  en: {
    nav_accueil: "Home",
    nav_today: "Review Today",
    nav_all: "All Courses",
    nav_progress: "Progress",
    mes_matieres: "My Subjects",
    nouveau_dossier: "+ New folder",
    nouvelle_matiere: "+ New subject",
    options_matiere: "Subject options",
    options_matiere_titre: "Rename or delete this subject",
    options_dossier: "Folder options",
    options_dossier_titre: "Rename or delete this folder",
    deplier_replier: "Expand / collapse",
    changer_theme: "Switch theme",
    mode_clair: "light",
    mode_sombre: "dark",
    changer_langue: "Switch language",
    fermer_menu: "Close menu",
    ouvrir_menu: "Open menu",
    sauvegarde_ok: "Saved on this device",
    sauvegarde_off: "Saving unavailable here",
    revenir_demo: "Reset to demo data",
    tout_effacer: "Erase everything",

    bonjour: "Hello",
    a_jour: "You're all caught up on your reviews. Nice work!",
    intro_a_reviser: (n) =>
      `You have <strong>${n}</strong> course${n === 1 ? "" : "s"} to review today.`,
    cours_a_revoir_titre: (n) => `${n} course${n === 1 ? "" : "s"} to review`,
    voir_tout: "See all →",
    grille_de_cours: "Your course grid",
    termines: "done",
    rien_a_reviser: "Nothing to review right now.",
    rien_a_reviser_sub:
      'Check back later, or browse "All Courses" to review ahead of time.',
    renommer_ou_supprimer: "Rename or delete",
    niveau_mal_maitrise: "Not mastered",
    niveau_fragile: "Shaky",
    niveau_maitrise: "Mastered",
    priorite: "Priority",
    priorite_faible: "Low",
    priorite_moyenne: "Medium",
    priorite_elevee: "High",
    derniere_revision: "Last review",
    prochaine_revision: "Next",
    intervalle: "Interval",
    historique_revisions: "Reviews",
    legende_historique:
      "This course's most recent reviews — each square shows its own date underneath",
    aujourdhui_court: "Today",
    retard: "Overdue",
    pas_de_retard: "On time",
    jours: (n) => `${n}d`,
    objectif_du_jour: (fait, objectif) =>
      `Today's reviews: ${fait} / ${objectif}`,
    revisions_prioritaires: (n) =>
      `${n} priority review${n > 1 ? "s" : ""} today`,
    autres_reportees: (n) =>
      `${n} other${n > 1 ? "s" : ""} will be gradually rescheduled.`,
    essentiel_uniquement: "Essentials only",
    quota_journalier: "Daily limit",
    plafond_intervalle: "Interval cap",

    titre_tous_les_cours: "All Courses",
    cours_dans_ce_chapitre: (n) =>
      `${n} course${n === 1 ? "" : "s"} in this folder`,
    cours_dans_cette_matiere: (n) =>
      `${n} course${n === 1 ? "" : "s"} in this subject`,
    cours_au_total: (n) => `${n} course${n === 1 ? "" : "s"} in total`,
    recherche_partout: (n) =>
      `${n} result${n > 1 ? "s" : ""} across all your courses`,
    recherche_ici_seulement: "Only here",
    onglet_tous: "All",
    onglet_a_revoir: "To review",
    onglet_fragiles: "Shaky",
    onglet_maitrises: "Mastered",
    rechercher_placeholder: "Search a course…",
    trier_par: "Sort by",
    tri_next: "Next review",
    tri_priority: "Priority",
    tri_name: "Name",
    dossier_vide: "This folder is empty for now.",
    dossier_vide_sub: "Add your first course to start reviewing.",
    nouveau_cours: "+ New course",
    aucun_resultat_recherche: "No course matches your search.",
    aucun_cours: "No courses yet.",
    colonne_cours: "COURSE",
    colonne_aujourdhui: "Today",
    colonne_prochaine_revision: "Next review",

    retirer_case: "Remove this entry",
    renommer_cours: "Rename course",
    supprimer_cours: "Delete course",
    renommer_matiere: "Rename subject",
    supprimer_matiere: "Delete subject",
    renommer_dossier: "Rename folder",
    supprimer_dossier: "Delete folder",

    titre_progression: "Progress",
    sous_titre_progression: "An overview of your knowledge",
    maitrise_globale: "Overall mastery",
    a_reviser: "To review",
    cours_maitrises: "Mastered courses",
    total_cours: "Total courses",
    repartition_globale: "Overall breakdown",
    legende_a_revoir: (n) => `${n} to review`,
    legende_fragiles: (n) => `${n} shaky`,
    legende_maitrises: (n) => `${n} mastered`,
    par_matiere: "By subject",
    n_cours: (n) => `${n} course${n === 1 ? "" : "s"}`,
    pourcent_maitrise: (p) => `${p}% mastered`,
    activite_recente: "Recent activity",
    aujourdhui: "Today",
    hier: "Yesterday",

    prompt_nouveau_dossier: "New folder name:",
    prompt_nouveau_cours: "New course name:",
    prompt_nouvelle_matiere: "New subject name:",
    prompt_renommer_cours: "New course name:",
    prompt_renommer_matiere: "New subject name:",
    prompt_renommer_dossier: "New folder name:",
    confirm_supprimer_cours: (nom) => `Permanently delete "${nom}"?`,
    confirm_supprimer_matiere: (nom, n) =>
      n > 0
        ? `Permanently delete "${nom}" and its ${n} course${n === 1 ? "" : "s"}?`
        : `Permanently delete "${nom}"?`,
    confirm_supprimer_dossier: (nom, n) =>
      n > 0
        ? `Permanently delete "${nom}" and its ${n} course${n === 1 ? "" : "s"}?`
        : `Permanently delete "${nom}"?`,
    confirm_reinitialiser:
      "Reset Organz and go back to the demo data?\nThis will permanently erase your current courses.",
    confirm_vider_donnees:
      'Erase everything and start from a blank slate?\nAll your subjects, folders and courses will be permanently deleted — unlike "Reset to demo data", nothing will be put back in their place. This cannot be undone.',

    statut_retard: (n) => `${n}d overdue`,
    statut_aujourdhui: "Today",
    statut_a_venir: (n) => `in ${n}d`,
  },
};

// Renvoie le texte traduit pour une clé donnée, dans la langue actuelle
// (state.langue). Si la valeur est une fonction (texte avec un nombre ou un
// nom à l'intérieur), on l'appelle avec les arguments fournis.
function t(cle, ...args) {
  const dico = TRADUCTIONS[state.langue] || TRADUCTIONS.fr;
  const valeur = dico[cle] !== undefined ? dico[cle] : TRADUCTIONS.fr[cle];
  return typeof valeur === "function" ? valeur(...args) : valeur;
}

// Noms de mois / jours de la semaine, dans les deux langues, pour le
// formatage des dates (voir formaterDateCourte / formaterEnTete plus haut).
const MOIS = {
  fr: [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
};
const MOIS_COURT_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const JOURS = {
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  en: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ],
};

/* ---------- 2. DONNÉES ---------- */

let idCounter = 1;
const prochainId = () => String(idCounter++);

// Petite fabrique pour créer un cours facilement.
// - niveau : 'red' | 'orange' | 'green' (niveau de maîtrise ACTUEL)
// - prochainOffset : dans combien de jours (nombre négatif = en retard)
// - historiqueOffsets : liste d'anciennes révisions [ [offsetEnJours, niveau], ... ]
function creerCours(
  nom,
  niveau,
  prochainOffset,
  historiqueOffsets = [],
  streak = 1,
  priority = 2,
) {
  const historique = historiqueOffsets.map(([offset, niv]) => ({
    date: ajouterJours(AUJOURDHUI, offset),
    niveau: niv,
  }));
  // On ajoute toujours la dernière révision connue (celle qui a donné le niveau actuel)
  historique.push({
    date: ajouterJours(AUJOURDHUI, Math.min(prochainOffset - 2, -1)),
    niveau,
  });
  historique.sort((a, b) => a.date - b.date);
  const lastReviewDate = historique[historique.length - 1].date;
  const prochaineRevision = ajouterJours(AUJOURDHUI, prochainOffset);

  return {
    id: prochainId(),
    nom,
    niveau,
    streak,
    priority,
    lastReviewDate,
    currentInterval: Math.max(1, joursEntre(lastReviewDate, prochaineRevision)),
    lastResult: niveau,
    prochaineRevision,
    historique,
    revisionLog: [],
  };
}

// Structure : matières > dossiers > cours
const DATA = {
  matieres: [
    {
      id: "maths",
      nom: "Mathématiques",
      icone: "∫",
      dossiers: [
        {
          id: "maths-algebre",
          nom: "Algèbre",
          cours: [
            creerCours("Matrices", "green", 10, [[-2, "green"]], 2),
            creerCours("Déterminants", "green", -1, [[-7, "green"]], 2),
            creerCours("Polynômes", "green", 5, [], 1),
            creerCours(
              "Réduction des endomorphismes",
              "orange",
              -4,
              [[-6, "orange"]],
              1,
            ),
            creerCours(
              "Diagonalisation",
              "orange",
              -2,
              [
                [-6, "red"],
                [-4, "orange"],
              ],
              1,
            ),
          ],
        },
        {
          id: "maths-analyse",
          nom: "Analyse",
          cours: [
            creerCours("Suites numériques", "green", 10, [[-3, "green"]], 1),
            creerCours("Séries numériques", "orange", -2, [[-4, "orange"]], 1),
            creerCours(
              "Intégrales",
              "orange",
              0,
              [
                [-6, "orange"],
                [-2, "orange"],
              ],
              2,
            ),
            creerCours(
              "Équations différentielles",
              "red",
              0,
              [
                [-4, "red"],
                [-2, "red"],
              ],
              1,
            ),
            creerCours("Fonctions de deux variables", "orange", -6, [], 1),
          ],
        },
        {
          id: "maths-probas",
          nom: "Probabilités",
          cours: [
            creerCours("Probabilités conditionnelles", "orange", 0, [], 1),
            creerCours(
              "Variables aléatoires",
              "green",
              20,
              [[-10, "green"]],
              3,
            ),
            creerCours("Loi normale", "green", 12, [[-2, "green"]], 2),
          ],
        },
      ],
    },
    {
      id: "geo",
      nom: "Géopolitique",
      icone: "🌍",
      dossiers: [
        {
          id: "geo-europe",
          nom: "Europe",
          cours: [
            creerCours(
              "Allemagne et Europe",
              "green",
              14,
              [
                [-2, "red"],
                [0, "green"],
              ],
              1,
            ),
            creerCours("Royaume-Uni post-Brexit", "orange", 2, [], 1),
            creerCours(
              "Union européenne : forces et limites",
              "green",
              20,
              [[-9, "green"]],
              2,
            ),
          ],
        },
        {
          id: "geo-asie",
          nom: "Asie",
          cours: [
            creerCours(
              "Chine et puissance mondiale",
              "green",
              12,
              [[-2, "green"]],
              2,
            ),
            creerCours("Japon et Corée du Sud", "orange", 0, [], 1),
            creerCours("Inde : puissance émergente", "orange", -3, [], 1),
          ],
        },
        {
          id: "geo-ameriques",
          nom: "Amériques",
          cours: [
            creerCours(
              "Amérique latine",
              "orange",
              -1,
              [
                [-13, "red"],
                [-6, "orange"],
              ],
              1,
            ),
            creerCours(
              "États-Unis : puissance globale",
              "green",
              6,
              [
                [-29, "green"],
                [-15, "green"],
              ],
              3,
            ),
          ],
        },
      ],
    },
    {
      id: "anglais",
      nom: "Anglais",
      icone: "A",
      dossiers: [
        {
          id: "anglais-grammaire",
          nom: "Grammaire",
          cours: [
            creerCours(
              "Temps et aspects verbaux",
              "green",
              18,
              [[-2, "green"]],
              2,
            ),
            creerCours("Conditionnels et hypothèses", "orange", 2, [], 1),
          ],
        },
        {
          id: "anglais-civilisation",
          nom: "Civilisation",
          cours: [
            creerCours(
              "Civilisation britannique",
              "green",
              25,
              [[-11, "green"]],
              2,
            ),
            creerCours("Civilisation américaine", "orange", 0, [], 1),
          ],
        },
        {
          id: "anglais-vocabulaire",
          nom: "Vocabulaire",
          cours: [
            creerCours(
              "Vocabulaire thématique",
              "green",
              8,
              [[-6, "green"]],
              1,
            ),
          ],
        },
      ],
    },
    {
      id: "philo",
      nom: "Philosophie",
      icone: "φ",
      dossiers: [
        {
          id: "philo-notions",
          nom: "Notions",
          cours: [
            creerCours("L'État", "red", -4, [[-8, "red"]], 1),
            creerCours("La conscience", "red", -2, [], 1),
            creerCours("Le désir", "orange", 0, [], 1),
          ],
        },
        {
          id: "philo-methodo",
          nom: "Méthodologie",
          cours: [
            creerCours("La dissertation", "orange", -5, [[-9, "orange"]], 1),
            creerCours(
              "Le commentaire de texte",
              "green",
              7,
              [[-3, "green"]],
              1,
            ),
            creerCours("Citations clés", "green", 30, [[-12, "green"]], 2),
          ],
        },
      ],
    },
  ],
};

/* ---------- 3. LOGIQUE MÉTIER : planification soutenable ---------- */

// Tous les réglages de l'algorithme sont réunis ici. Les deux préférences
// choisies dans l'interface remplacent leurs valeurs par défaut sans
// disperser de constantes dans le reste de l'application.
const REVISION_CONFIG = {
  MIN_INTERVAL: 1,
  MAX_INTERVAL: 180,
  DAILY_LIMIT: 20,
  GREEN_MULTIPLIER: 2,
  ORANGE_MULTIPLIER: 0.5,
  RED_INTERVAL: 1,
  RANDOMIZATION_PERCENTAGE: 0.1,
  RANDOMIZATION_MIN_INTERVAL: 7,
  PRIORITY_WEIGHT_LOW: 1,
  PRIORITY_WEIGHT_MEDIUM: 2,
  PRIORITY_WEIGHT_HIGH: 3,
  RED_BONUS: 10,
  ORANGE_BONUS: 2,
};

let revisionPreferences = {
  dailyLimit: REVISION_CONFIG.DAILY_LIMIT,
  maxInterval: REVISION_CONFIG.MAX_INTERVAL,
};

const RANG = { red: 0, orange: 1, green: 2 };

function poidsPriorite(priority) {
  return [
    REVISION_CONFIG.PRIORITY_WEIGHT_LOW,
    REVISION_CONFIG.PRIORITY_WEIGHT_MEDIUM,
    REVISION_CONFIG.PRIORITY_WEIGHT_HIGH,
  ][Math.max(1, Math.min(3, Number(priority) || 2)) - 1];
}

function joursEcoules(cours) {
  const derniere =
    cours.lastReviewDate || cours.historique.at(-1)?.date || AUJOURDHUI;
  return Math.max(
    REVISION_CONFIG.MIN_INTERVAL,
    joursEntre(derniere, AUJOURDHUI),
  );
}

function joursDeRetard(cours) {
  return Math.max(0, joursEntre(cours.prochaineRevision, AUJOURDHUI));
}

function aleatoriserIntervalle(intervalle) {
  if (intervalle < REVISION_CONFIG.RANDOMIZATION_MIN_INTERVAL)
    return intervalle;
  const variation =
    (Math.random() * 2 - 1) * REVISION_CONFIG.RANDOMIZATION_PERCENTAGE;
  return Math.round(intervalle * (1 + variation));
}

// Le calcul part du temps réellement écoulé : un retard suivi d'une réussite
// est donc récompensé au lieu d'être pénalisé.
function calculerNouvelIntervalle(cours, resultat) {
  const effectif = joursEcoules(cours);
  let intervalle =
    resultat === "green"
      ? effectif * REVISION_CONFIG.GREEN_MULTIPLIER
      : resultat === "orange"
        ? effectif * REVISION_CONFIG.ORANGE_MULTIPLIER
        : REVISION_CONFIG.RED_INTERVAL;

  intervalle = Math.max(REVISION_CONFIG.MIN_INTERVAL, Math.round(intervalle));
  intervalle = Math.min(revisionPreferences.maxInterval, intervalle);
  intervalle = aleatoriserIntervalle(intervalle);
  return Math.max(
    REVISION_CONFIG.MIN_INTERVAL,
    Math.min(revisionPreferences.maxInterval, intervalle),
  );
}

function scoreUrgence(cours) {
  const intervalle = Math.max(
    REVISION_CONFIG.MIN_INTERVAL,
    cours.currentInterval || 1,
  );
  let score =
    (joursEcoules(cours) / intervalle) * poidsPriorite(cours.priority);
  if (cours.lastResult === "red") score += REVISION_CONFIG.RED_BONUS;
  if (cours.lastResult === "orange") score += REVISION_CONFIG.ORANGE_BONUS;
  return score;
}

// Combien de révisions "réussies" ont été enregistrées depuis le début (pour la barre de progression du jour)
let revisionsFaitesAujourdhui = 0;

// ⭐ Fonction centrale : pose (ou remplace) une case colorée à une date
// précise pour un cours donné.
//
// - Si la date est AUJOURD'HUI : c'est une vraie révision → on met à jour
//   le niveau de maîtrise du cours ET on recalcule sa prochaine échéance,
//   même si le cours n'était pas "dû" (l'étudiant a le droit de réviser
//   un cours en avance, quand il le souhaite).
// - Si la date est dans le PASSÉ : on corrige simplement l'historique
//   (utile pour rattraper un oubli de saisie), sans toucher au niveau
//   actuel ni à la prochaine révision programmée.
function definirCaseHistorique(coursId, iso, niveau) {
  const cours = trouverCoursParId(coursId);
  if (!cours) return;

  const existante = cours.historique.find((h) => isoDate(h.date) === iso);
  if (existante) existante.niveau = niveau;
  else cours.historique.push({ date: dateDepuisIso(iso), niveau });
  cours.historique.sort((a, b) => a.date - b.date);

  if (iso === isoDate(AUJOURDHUI)) {
    const etaitEnRetard =
      cours.prochaineRevision.getTime() <= AUJOURDHUI.getTime();
    const intervalleAvant = cours.currentInterval || 1;
    const retard = joursDeRetard(cours);
    const nouvelIntervalle = calculerNouvelIntervalle(cours, niveau);
    cours.revisionLog = cours.revisionLog || [];
    cours.revisionLog.push({
      dateRevision: iso,
      dateTheorique: isoDate(cours.prochaineRevision),
      dateReelle: iso,
      retard,
      resultat: niveau,
      intervalleAvant,
      nouvelIntervalle,
      priority: cours.priority || 2,
    });
    cours.lastReviewDate = AUJOURDHUI;
    cours.currentInterval = nouvelIntervalle;
    cours.prochaineRevision = ajouterJours(AUJOURDHUI, nouvelIntervalle);
    cours.niveau = niveau;
    cours.lastResult = niveau;
    cours.streak = niveau === "green" ? (cours.streak || 0) + 1 : 1;
    if (etaitEnRetard) revisionsFaitesAujourdhui++;
  }
}

// Retire la case colorée d'une date précise.
// Remarque : si on retire la case du jour, on ne "rembobine" pas le niveau
// ni la prochaine révision (on ne garde pas les états précédents en mémoire) :
// seule la case visuelle disparaît de la grille.
function retirerCaseHistorique(coursId, iso) {
  const cours = trouverCoursParId(coursId);
  if (!cours) return;
  cours.historique = cours.historique.filter((h) => isoDate(h.date) !== iso);
}

// Raccourci utilisé par les 3 pastilles rapides (Accueil / À réviser
// aujourd'hui) : elles marquent toujours la révision du jour même.
function reviserCours(coursId, nouveauNiveau) {
  definirCaseHistorique(coursId, isoDate(AUJOURDHUI), nouveauNiveau);
  fermerPopover();
  render();
}

function modifierPriorite(coursId, priority) {
  const cours = trouverCoursParId(coursId);
  if (cours) cours.priority = Math.max(1, Math.min(3, Number(priority)));
}

function renommerCours(coursId) {
  const cours = trouverCoursParId(coursId);
  if (!cours) return;
  const nouveauNom = prompt(t("prompt_renommer_cours"), cours.nom);
  if (nouveauNom && nouveauNom.trim()) cours.nom = nouveauNom.trim();
}

function supprimerCours(coursId) {
  for (const matiere of DATA.matieres) {
    for (const dossier of matiere.dossiers) {
      const index = dossier.cours.findIndex((c) => c.id === coursId);
      if (index !== -1) {
        dossier.cours.splice(index, 1);
        return;
      }
    }
  }
}

function renommerMatiere(matiereId) {
  const matiere = DATA.matieres.find((m) => m.id === matiereId);
  if (!matiere) return;
  const nouveauNom = prompt(t("prompt_renommer_matiere"), matiere.nom);
  if (nouveauNom && nouveauNom.trim()) matiere.nom = nouveauNom.trim();
}

// Supprimer une matière supprime aussi tous ses dossiers et cours : on
// prévient clairement l'utilisateur avant de confirmer, pour éviter les
// suppressions accidentelles.
function supprimerMatiere(matiereId) {
  const matiere = DATA.matieres.find((m) => m.id === matiereId);
  if (!matiere) return;
  const nbCours = matiere.dossiers.reduce((n, d) => n + d.cours.length, 0);
  if (!confirm(t("confirm_supprimer_matiere", matiere.nom, nbCours))) return;
  DATA.matieres = DATA.matieres.filter((m) => m.id !== matiereId);
  // Si on était en train de consulter cette matière, on revient à la vue générale.
  if (state.matiereId === matiereId) {
    state.matiereId = null;
    state.dossierId = null;
  }
}

function renommerDossier(matiereId, dossierId) {
  const matiere = DATA.matieres.find((m) => m.id === matiereId);
  const dossier = matiere && matiere.dossiers.find((d) => d.id === dossierId);
  if (!dossier) return;
  const nouveauNom = prompt(t("prompt_renommer_dossier"), dossier.nom);
  if (nouveauNom && nouveauNom.trim()) dossier.nom = nouveauNom.trim();
}

function supprimerDossier(matiereId, dossierId) {
  const matiere = DATA.matieres.find((m) => m.id === matiereId);
  if (!matiere) return;
  const dossier = matiere.dossiers.find((d) => d.id === dossierId);
  if (!dossier) return;
  const nbCours = dossier.cours.length;
  if (!confirm(t("confirm_supprimer_dossier", dossier.nom, nbCours))) return;
  matiere.dossiers = matiere.dossiers.filter((d) => d.id !== dossierId);
  if (state.dossierId === dossierId) state.dossierId = null;
}

/* ---------- Fonctions d'accès aux données ---------- */

function trouverCoursParId(id) {
  for (const matiere of DATA.matieres) {
    for (const dossier of matiere.dossiers) {
      const trouve = dossier.cours.find((c) => c.id === id);
      if (trouve) return trouve;
    }
  }
  return null;
}

// Retrouve une matière + un dossier directement dans DATA, à partir de leurs
// identifiants. Contrairement à une recherche via tousLesCours(), ça
// fonctionne même si le dossier est vide (0 cours) : c'était justement le
// bug qui empêchait d'ouvrir un dossier fraîchement créé, puisque
// tousLesCours() ne renvoie rien pour un dossier sans aucun cours dedans.
function trouverDossier(dossierId) {
  for (const matiere of DATA.matieres) {
    const dossier = matiere.dossiers.find((d) => d.id === dossierId);
    if (dossier) return { matiere, dossier };
  }
  return null;
}

// Renvoie une liste plate de tous les cours, chacun enrichi avec le nom
// de sa matière et de son dossier (pratique pour l'affichage).
function tousLesCours() {
  const liste = [];
  for (const matiere of DATA.matieres) {
    for (const dossier of matiere.dossiers) {
      for (const cours of dossier.cours) {
        liste.push({ cours, matiere, dossier });
      }
    }
  }
  return liste;
}

function coursEnRetardOuAujourdhui() {
  return tousLesCours().filter(
    ({ cours }) => cours.prochaineRevision.getTime() <= AUJOURDHUI.getTime(),
  );
}

// File intelligente : la proportion de temps écoulé, la priorité choisie et
// la fragilité récente déterminent l'ordre. Les rouges passent devant grâce
// au bonus, même avec une faible priorité manuelle.
function trierParPriorite(liste) {
  return [...liste].sort(
    (a, b) => scoreUrgence(b.cours) - scoreUrgence(a.cours),
  );
}

function estEssentiel(cours) {
  return (
    cours.lastResult === "red" ||
    cours.niveau === "red" ||
    cours.priority === 3 ||
    joursDeRetard(cours) >=
      Math.max(2, Math.ceil((cours.currentInterval || 1) * 0.5)) ||
    scoreUrgence(cours) >= 3
  );
}

function fileDuJour() {
  const candidats = trierParPriorite(coursEnRetardOuAujourdhui());
  // La capacité restante, pas seulement le quota brut, évite de faire
  // apparaître une nouvelle vague de cours après avoir atteint l'objectif.
  const capaciteRestante = Math.max(
    0,
    revisionPreferences.dailyLimit - revisionsFaitesAujourdhui,
  );
  const selection = candidats.slice(0, capaciteRestante);
  return {
    candidats,
    selection: state.essentielUniquement
      ? selection.filter(({ cours }) => estEssentiel(cours))
      : selection,
  };
}

/* ---------- SAUVEGARDE (localStorage) ---------- */
// L'appli sauvegarde automatiquement dans le navigateur à chaque action.
// Comme localStorage n'existe pas partout (aperçu dans un cadre restreint,
// navigation privée très stricte…), on vérifie d'abord qu'il fonctionne
// vraiment, et on continue de fonctionner normalement (juste sans
// sauvegarde) si ce n'est pas le cas — l'appli ne doit jamais planter
// à cause de ça.

const CLE_STOCKAGE = "organz-donnees-v1";

function stockageDisponible() {
  try {
    const cleTest = "__organz_test__";
    localStorage.setItem(cleTest, "1");
    localStorage.removeItem(cleTest);
    return true;
  } catch (e) {
    return false;
  }
}

const SAUVEGARDE_ACTIVE = stockageDisponible();

// Transforme DATA (avec ses vrais objets Date) en un objet 100% textuel,
// prêt pour JSON.stringify.
function serialiserDonnees() {
  return {
    version: 2,
    idCounter,
    sombre: state.sombre,
    langue: state.langue,
    revisionPreferences,
    revisionsFaitesAujourdhui,
    dateDeSauvegarde: isoDate(AUJOURDHUI),
    matieres: DATA.matieres.map((m) => ({
      id: m.id,
      nom: m.nom,
      icone: m.icone,
      dossiers: m.dossiers.map((d) => ({
        id: d.id,
        nom: d.nom,
        cours: d.cours.map((c) => ({
          id: c.id,
          nom: c.nom,
          niveau: c.niveau,
          streak: c.streak,
          priority: c.priority,
          lastReviewDate: isoDate(
            c.lastReviewDate || c.historique.at(-1)?.date || AUJOURDHUI,
          ),
          currentInterval: c.currentInterval,
          lastResult: c.lastResult,
          prochaineRevision: isoDate(c.prochaineRevision),
          historique: c.historique.map((h) => ({
            date: isoDate(h.date),
            niveau: h.niveau,
          })),
          revisionLog: c.revisionLog || [],
        })),
      })),
    })),
  };
}

// Opération inverse : reconstruit DATA (avec de vrais objets Date) à partir
// de l'objet textuel chargé depuis localStorage.
function restaurerDonnees(obj) {
  DATA.matieres = obj.matieres.map((m) => ({
    id: m.id,
    nom: m.nom,
    icone: m.icone,
    dossiers: m.dossiers.map((d) => ({
      id: d.id,
      nom: d.nom,
      cours: d.cours.map((c) => ({
        id: c.id,
        nom: c.nom,
        niveau: c.niveau,
        streak: c.streak,
        priority: Math.max(1, Math.min(3, Number(c.priority) || 2)),
        lastReviewDate: dateDepuisIso(
          c.lastReviewDate || c.historique.at(-1)?.date || c.prochaineRevision,
        ),
        currentInterval: Math.max(
          1,
          Number(c.currentInterval) ||
            joursEntre(
              dateDepuisIso(
                c.lastReviewDate ||
                  c.historique.at(-1)?.date ||
                  c.prochaineRevision,
              ),
              dateDepuisIso(c.prochaineRevision),
            ),
        ),
        lastResult: c.lastResult || c.niveau,
        prochaineRevision: dateDepuisIso(c.prochaineRevision),
        historique: c.historique.map((h) => ({
          date: dateDepuisIso(h.date),
          niveau: h.niveau,
        })),
        revisionLog: Array.isArray(c.revisionLog) ? c.revisionLog : [],
      })),
    })),
  }));

  idCounter = obj.idCounter || idCounter;
  state.sombre = !!obj.sombre;
  state.langue = obj.langue === "en" ? "en" : "fr";
  revisionPreferences = {
    dailyLimit:
      Number.isFinite(Number(obj.revisionPreferences?.dailyLimit)) &&
      Number(obj.revisionPreferences.dailyLimit) >= 1 &&
      Number(obj.revisionPreferences.dailyLimit) <= 100
        ? Math.round(Number(obj.revisionPreferences.dailyLimit))
        : REVISION_CONFIG.DAILY_LIMIT,
    maxInterval: [90, 180, 365].includes(
      Number(obj.revisionPreferences?.maxInterval),
    )
      ? Number(obj.revisionPreferences.maxInterval)
      : REVISION_CONFIG.MAX_INTERVAL,
  };

  // Le compteur "revisions faites aujourd'hui" n'a de sens que si on est
  // toujours le même jour que lors de la dernière sauvegarde. Un nouveau
  // jour → on repart de 0, comme le reste de l'appli qui se recalcule
  // toujours par rapport à "aujourd'hui".
  revisionsFaitesAujourdhui =
    obj.dateDeSauvegarde === isoDate(AUJOURDHUI)
      ? obj.revisionsFaitesAujourdhui || 0
      : 0;
}

function sauvegarderDonnees() {
  if (!SAUVEGARDE_ACTIVE) return;
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(serialiserDonnees()));
  } catch (e) {
    console.warn("Organz : impossible de sauvegarder les données.", e);
  }
}

// Appelée une seule fois, tout au début : si des données existent déjà dans
// ce navigateur, elles remplacent les données de démonstration.
function chargerDonneesSauvegardees() {
  if (!SAUVEGARDE_ACTIVE) return;
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return; // première visite : on garde les données de démo
    restaurerDonnees(JSON.parse(brut));
  } catch (e) {
    console.warn(
      "Organz : impossible de charger les données sauvegardées, on repart des données de démo.",
      e,
    );
  }
}

// Efface la sauvegarde et revient aux données de démonstration.
function reinitialiserDonnees() {
  const confirmation = confirm(t("confirm_reinitialiser"));
  if (!confirmation) return;
  try {
    localStorage.removeItem(CLE_STOCKAGE);
  } catch (e) {
    /* rien à faire si indisponible */
  }
  location.reload();
}

// Contrairement à reinitialiserDonnees() (qui RECHARGE la page et donc
// re-génère les ~30 cours de démonstration), celle-ci vide vraiment tout,
// sans rien remettre à la place : une vraie page blanche pour l'étudiant
// qui veut commencer à saisir ses propres cours, sans avoir à supprimer
// les cours de démo un par un.
function viderDonnees() {
  const confirmation = confirm(t("confirm_vider_donnees"));
  if (!confirmation) return;
  DATA.matieres = [];
  state.vue = "accueil";
  state.matiereId = null;
  state.dossierId = null;
  state.recherche = "";
  state.rechercheDansDossier = false;
  render(); // render() sauvegarde automatiquement : la page blanche persiste
}

/* ---------- 4. ÉTAT DE L'APPLICATION ---------- */
// (ce que l'utilisateur est en train de regarder : quelle page, quel filtre…)

const state = {
  vue: "accueil", // 'accueil' | 'today' | 'all' | 'progress'
  matiereId: null, // filtre matière actif (page "Tous les cours")
  dossierId: null, // filtre dossier actif
  filtreNiveau: "all", // 'all' | 'red' | 'orange' | 'green'
  tri: "next", // 'next' | 'priority' | 'name'
  recherche: "",
  rechercheDansDossier: false, // false = la recherche cherche partout par défaut
  dossiersReplies: new Set(),
  sidebarOuverte: false, // pour le mode mobile
  essentielUniquement: false,
  sombre: !!(
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ),
  langue: "fr", // 'fr' | 'en' — seule l'interface est traduite, pas les données
};

// Le petit menu flottant (popover) actuellement affiché, s'il y en a un.
// Il est géré à part car il vit en dehors de #main / #sidebar (voir plus bas).
let popoverActuel = null;

function fermerPopover() {
  if (popoverActuel) {
    popoverActuel.remove();
    popoverActuel = null;
  }
}

// Ouvre un popover juste sous l'élément cliqué, avec le contenu HTML donné.
function ouvrirPopover(ancrageEl, contenuHtml) {
  fermerPopover();
  const pop = document.createElement("div");
  pop.className = "popover";
  pop.innerHTML = contenuHtml;
  document.body.appendChild(pop);

  const rect = ancrageEl.getBoundingClientRect();
  const popRect = pop.getBoundingClientRect();
  let top = rect.bottom + 6;
  let left = rect.left;
  const maxLeft = document.documentElement.clientWidth - popRect.width - 10;
  const maxTop = document.documentElement.clientHeight - popRect.height - 10;
  if (left > maxLeft) left = Math.max(10, maxLeft);
  if (top > maxTop) top = Math.max(10, rect.top - popRect.height - 6); // au-dessus si pas de place en dessous
  pop.style.left = `${left}px`;
  pop.style.top = `${top}px`;

  popoverActuel = pop;
  pop.querySelector("button")?.focus();
}

function allerA(vue, matiereId = null, dossierId = null) {
  state.vue = vue;
  state.matiereId = matiereId;
  state.dossierId = dossierId;
  if (vue !== "all") {
    state.filtreNiveau = "all";
    state.recherche = "";
    state.rechercheDansDossier = false;
  }
  state.sidebarOuverte = false;
  render();
}

/* ---------- 5. RENDU (construction du HTML) ---------- */

const $main = document.getElementById("main");
const $sidebar = document.getElementById("sidebar");

function render() {
  fermerPopover(); // le DOM va être reconstruit : un popover ouvert n'aurait plus de sens
  document.body.classList.toggle("sidebar-ouverte", state.sidebarOuverte);
  document.body.classList.toggle("dark", state.sombre);

  renderSidebar();
  if (state.vue === "accueil") $main.innerHTML = renderAccueil();
  else if (state.vue === "today") $main.innerHTML = renderToday();
  else if (state.vue === "all") $main.innerHTML = renderTousLesCours();
  else if (state.vue === "progress") $main.innerHTML = renderProgression();

  // À chaque fois que l'écran se met à jour, l'état a pu changer (nouvelle
  // révision, cours ajouté/renommé/supprimé, thème...) : on sauvegarde donc
  // systématiquement. Les données sont petites, c'est instantané.
  sauvegarderDonnees();
}

/* ----- Sidebar ----- */

function renderSidebar() {
  const nbDues = fileDuJour().selection.length;

  const navItems = [
    { vue: "accueil", icone: ICONES.accueil, label: t("nav_accueil") },
    { vue: "today", icone: ICONES.today, label: t("nav_today"), badge: nbDues },
    { vue: "all", icone: ICONES.grille, label: t("nav_all") },
    { vue: "progress", icone: ICONES.progression, label: t("nav_progress") },
  ];

  const navHtml = navItems
    .map(
      (item) => `
    <button class="nav-item ${state.vue === item.vue ? "active" : ""}" data-nav="${item.vue}">
      <span class="nav-icon">${item.icone}</span>
      <span class="nav-label">${item.label}</span>
      ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ""}
    </button>
  `,
    )
    .join("");

  const matieresHtml = DATA.matieres
    .map((matiere) => {
      const nbCours = matiere.dossiers.reduce((n, d) => n + d.cours.length, 0);
      const replie = state.dossiersReplies.has(matiere.id);
      const actif =
        state.vue === "all" &&
        state.matiereId === matiere.id &&
        !state.dossierId;

      const dossiersHtml = matiere.dossiers
        .map((dossier) => {
          const actifDossier =
            state.vue === "all" && state.dossierId === dossier.id;
          return `
        <div class="folder-row">
          <button class="folder-item ${actifDossier ? "active" : ""}" data-matiere="${matiere.id}" data-dossier="${dossier.id}">
            ${dossier.nom}
          </button>
          <button class="row-menu-btn" data-dossier-menu="${matiere.id}|${dossier.id}" aria-label="${t("options_dossier")}" title="${t("options_dossier_titre")}">${ICONES.options}</button>
        </div>`;
        })
        .join("");

      return `
      <div class="subject-block">
        <div class="subject-header">
          <button class="subject-toggle" data-toggle="${matiere.id}" aria-label="${t("deplier_replier")}">
            <span class="chevron ${replie ? "replie" : ""}">▾</span>
          </button>
          <button class="subject-name ${actif ? "active" : ""}" data-matiere="${matiere.id}">
            ${matiere.nom}
          </button>
          <span class="subject-count">${nbCours}</span>
          <button class="row-menu-btn" data-matiere-menu="${matiere.id}" aria-label="${t("options_matiere")}" title="${t("options_matiere_titre")}">${ICONES.options}</button>
        </div>
        ${
          !replie
            ? `
          <div class="folder-list">
            ${dossiersHtml}
            <button class="add-link" data-add-dossier="${matiere.id}">${t("nouveau_dossier")}</button>
          </div>`
            : ""
        }
      </div>`;
    })
    .join("");

  $sidebar.innerHTML = `
    <div class="sidebar-top">
      <span class="sidebar-logo">Organz</span>
      <div class="sidebar-top-actions">
        <div class="lang-toggle" role="group" aria-label="${t("changer_langue")}">
          <button class="lang-option ${state.langue === "fr" ? "active" : ""}" data-lang="fr">FR</button>
          <button class="lang-option ${state.langue === "en" ? "active" : ""}" data-lang="en">EN</button>
        </div>
        <button class="theme-toggle" id="theme-toggle" aria-label="${t("changer_theme")}" title="${state.sombre ? t("mode_clair") : t("mode_sombre")}">
          ${state.sombre ? ICONES.soleil : ICONES.lune}
        </button>
        <button class="sidebar-close" id="sidebar-close" aria-label="${t("fermer_menu")}">✕</button>
      </div>
    </div>
    <nav class="nav-main">${navHtml}</nav>
    <div class="sidebar-section">
      <div class="sidebar-label">${t("mes_matieres")}</div>
      ${matieresHtml}
      <button class="add-link add-matiere" id="add-matiere">${t("nouvelle_matiere")}</button>
    </div>
    <div class="sidebar-footer">
      <div class="sidebar-save-status ${SAUVEGARDE_ACTIVE ? "" : "sidebar-save-status-off"}">
        <span class="save-dot"></span>
        ${SAUVEGARDE_ACTIVE ? t("sauvegarde_ok") : t("sauvegarde_off")}
      </div>
      <button class="reset-link" id="reset-donnees">${t("revenir_demo")}</button>
      <button class="reset-link reset-link-danger" id="vider-donnees">${t("tout_effacer")}</button>
    </div>
  `;
}

/* ----- Petits composants réutilisables ----- */

function pastille(niveau) {
  return `<span class="dot dot-${niveau}"></span>`;
}

function libellePriorite(priority) {
  return t(
    ["priorite_faible", "priorite_moyenne", "priorite_elevee"][
      Math.max(1, Math.min(3, Number(priority) || 2)) - 1
    ],
  );
}

// Un seul bouton sobre affiche la priorité actuelle. Le détail des trois
// niveaux est proposé dans un menu, plus lisible que neuf petites étoiles.
function selecteurPriorite(cours) {
  const priority = Math.max(1, Math.min(3, Number(cours.priority) || 2));
  return `<button class="priority-control priority-${priority}" data-priority-menu="${cours.id}" title="${t("priorite")} : ${libellePriorite(priority)}" aria-label="${t("priorite")} : ${libellePriorite(priority)}">
    <span class="priority-stars" aria-hidden="true">${"★".repeat(priority)}</span><span class="priority-chevron" aria-hidden="true">⌄</span>
  </button>`;
}

// La ligne "carte" utilisée sur Accueil et sur "À réviser aujourd'hui"
function ligneCours({ cours, matiere, dossier }) {
  const statut = formaterStatutRevision(cours.prochaineRevision);
  const retard = joursDeRetard(cours);
  const derniere = cours.lastReviewDate || cours.historique.at(-1)?.date;
  return `
    <div class="course-card">
      ${pastille(cours.niveau)}
      <div class="course-info" data-course-menu="${cours.id}" title="${t("renommer_ou_supprimer")}">
        <div class="course-title-row">
          <div class="course-name">${cours.nom}</div>
          <div class="priority-picker">${selecteurPriorite(cours)}</div>
        </div>
        <div class="course-meta">${matiere.nom} · ${dossier.nom}</div>
        <div class="course-details">
          <span>${t("derniere_revision")} : ${derniere ? formaterDateCourte(derniere) : "—"}</span>
          <span>${t("prochaine_revision")} : ${formaterDateCourte(cours.prochaineRevision)}</span>
          <span>${t("intervalle")} : ${t("jours", cours.currentInterval || 1)}</span>
          <span class="${retard ? "detail-late" : ""}">${retard ? `${t("retard")} : ${t("jours", retard)}` : t("pas_de_retard")}</span>
        </div>
      </div>
      <span class="course-status status-${statut.classe}">${statut.texte}</span>
      <div class="course-actions">
        <button class="action-dot action-red" data-review="${cours.id}" data-level="red" title="🔴 ${t("niveau_mal_maitrise")}" aria-label="🔴 ${t("niveau_mal_maitrise")}"></button>
        <button class="action-dot action-orange" data-review="${cours.id}" data-level="orange" title="🟠 ${t("niveau_fragile")}" aria-label="🟠 ${t("niveau_fragile")}"></button>
        <button class="action-dot action-green" data-review="${cours.id}" data-level="green" title="🟢 ${t("niveau_maitrise")}" aria-label="🟢 ${t("niveau_maitrise")}"></button>
      </div>
    </div>`;
}

/* ----- Page : Accueil ----- */

function renderAccueil() {
  const { candidats: dus, selection } = fileDuJour();
  const apercu = selection.slice(0, 7);

  return `
    <header class="view-header">
      <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="${t("ouvrir_menu")}">☰</button>
      <div class="view-eyebrow">${formaterEnTete(AUJOURDHUI)}</div>
      <h1 class="view-title">${t("bonjour")}</h1>
      <p class="view-subtitle">
        ${dus.length > 0 ? t("revisions_prioritaires", selection.length) : t("a_jour")}
      </p>
    </header>

    ${
      selection.length > 0
        ? `
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">${t("cours_a_revoir_titre", selection.length)}</h2>
          <button class="link-voir-tout" data-nav="today">${t("voir_tout")}</button>
        </div>
        <div class="course-list">
          ${apercu.map(ligneCours).join("")}
        </div>
      </section>
    `
        : ""
    }

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">${t("grille_de_cours")}</h2>
        <button class="link-voir-tout" data-nav="all">${t("voir_tout")}</button>
      </div>
      ${renderGrille(tousLesCours().slice(0, 10))}
    </section>
  `;
}

/* ----- Page : À réviser aujourd'hui ----- */

function renderToday() {
  const { candidats, selection } = fileDuJour();
  const dus = selection;
  const total = Math.min(
    revisionPreferences.dailyLimit,
    candidats.length + revisionsFaitesAujourdhui,
  );
  const pourcentage =
    total === 0 ? 100 : Math.round((revisionsFaitesAujourdhui / total) * 100);

  return `
    <header class="view-header today-header">
      <div class="today-header-copy">
        <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="${t("ouvrir_menu")}">☰</button>
        <div class="view-eyebrow">${formaterEnTete(AUJOURDHUI)}</div>
        <h1 class="view-title">${t("bonjour")}</h1>
        <p class="view-subtitle">${t("revisions_prioritaires", dus.length)}</p>
        <div class="planning-controls">
          <label><input type="checkbox" data-essential ${state.essentielUniquement ? "checked" : ""}> ${t("essentiel_uniquement")}</label>
          <label>${t("quota_journalier")} <input type="number" data-daily-limit min="1" max="100" value="${revisionPreferences.dailyLimit}" list="daily-limit-suggestions"></label>
          <datalist id="daily-limit-suggestions"><option value="10"><option value="15"><option value="20"><option value="30"></datalist>
          <label>${t("plafond_intervalle")} <select data-max-interval>${[90, 180, 365].map((n) => `<option value="${n}" ${revisionPreferences.maxInterval === n ? "selected" : ""}>${n} j</option>`).join("")}</select></label>
        </div>
        ${candidats.length > revisionPreferences.dailyLimit ? `<p class="planning-backlog">${t("autres_reportees", candidats.length - revisionPreferences.dailyLimit)}</p>` : ""}
      </div>
      <div class="today-progress-panel">
        <div class="daily-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${revisionsFaitesAujourdhui}" aria-label="${t("objectif_du_jour", revisionsFaitesAujourdhui, total)}">
          <svg class="daily-progress-ring" viewBox="0 0 120 120" aria-hidden="true">
            <circle class="daily-progress-track" cx="60" cy="60" r="50" pathLength="100"></circle>
            <circle class="daily-progress-value" cx="60" cy="60" r="50" pathLength="100" style="stroke-dashoffset:${100 - pourcentage}"></circle>
          </svg>
          <div class="daily-progress-value-text"><strong>${revisionsFaitesAujourdhui}</strong><span>/ ${total}</span></div>
        </div>
        <div class="progress-label">${t("objectif_du_jour", revisionsFaitesAujourdhui, total)}</div>
      </div>
    </header>

    ${
      dus.length > 0
        ? `
      <div class="course-list">
        ${dus.map(ligneCours).join("")}
      </div>
    `
        : `
      <div class="empty-state">
        <p>${t("rien_a_reviser")}</p>
        <p class="empty-sub">${t("rien_a_reviser_sub")}</p>
      </div>
    `
    }
  `;
}

/* ----- Page : Tous les cours (la grille façon tableur) ----- */

function renderTousLesCours() {
  const rechercheActive = state.recherche.trim().length > 0;
  // Par défaut, une recherche cherche PARTOUT, même si on est en train de
  // regarder un dossier précis — sinon, taper le nom d'un cours d'une autre
  // matière donnait silencieusement "aucun résultat", ce qui est trompeur
  // (le cours existe, il est juste ailleurs). L'utilisateur peut cocher
  // "Seulement ici" pour revenir à une recherche limitée au dossier/matière
  // affiché.
  const limiterAuxScope = !rechercheActive || state.rechercheDansDossier;

  let liste = tousLesCours();
  let titre = t("titre_tous_les_cours");
  let sousTitre = null;
  let dansUnDossierPrecis = false;
  let dansUneMatierePrecise = false;

  if (state.dossierId) {
    const trouve = trouverDossier(state.dossierId);
    if (trouve) {
      dansUnDossierPrecis = true;
      titre = `${trouve.matiere.nom} · ${trouve.dossier.nom}`;
      if (limiterAuxScope) {
        liste = liste.filter((l) => l.dossier.id === state.dossierId);
        sousTitre = t("cours_dans_ce_chapitre", liste.length);
      }
    } else {
      // Le dossier n'existe plus (supprimé entre-temps, par ex.) : on revient à la vue générale.
      state.dossierId = null;
      state.matiereId = null;
    }
  } else if (state.matiereId) {
    const matiere = DATA.matieres.find((m) => m.id === state.matiereId);
    dansUneMatierePrecise = true;
    titre = matiere.nom;
    if (limiterAuxScope) {
      liste = liste.filter((l) => l.matiere.id === state.matiereId);
      sousTitre = t("cours_dans_cette_matiere", liste.length);
    }
  }

  // Filtre par niveau (onglets)
  if (state.filtreNiveau !== "all") {
    liste = liste.filter((l) => l.cours.niveau === state.filtreNiveau);
  }
  // Recherche par nom (voir plus haut : s'applique à liste entière ou
  // limitée, selon limiterAuxScope)
  if (rechercheActive) {
    const q = state.recherche.trim().toLowerCase();
    liste = liste.filter((l) => l.cours.nom.toLowerCase().includes(q));
    if (!limiterAuxScope) {
      sousTitre = t("recherche_partout", liste.length);
    }
  }
  if (sousTitre === null) sousTitre = t("cours_au_total", liste.length);

  // Tri
  if (state.tri === "next") {
    liste = [...liste].sort(
      (a, b) => a.cours.prochaineRevision - b.cours.prochaineRevision,
    );
  } else if (state.tri === "priority") {
    liste = trierParPriorite(liste);
  } else if (state.tri === "name") {
    liste = [...liste].sort((a, b) =>
      a.cours.nom.localeCompare(b.cours.nom, state.langue),
    );
  }

  const onglets = [
    { id: "all", label: t("onglet_tous") },
    { id: "red", label: t("onglet_a_revoir") },
    { id: "orange", label: t("onglet_fragiles") },
    { id: "green", label: t("onglet_maitrises") },
  ];

  // On regroupe par matière · dossier dès que les résultats peuvent couvrir
  // plusieurs dossiers (vue générale, vue matière, ou recherche non limitée).
  const grouper = !dansUnDossierPrecis || (rechercheActive && !limiterAuxScope);
  // On ne propose "+ Nouveau cours" que si on est sans ambiguïté DANS un
  // dossier précis (pas au milieu de résultats de recherche mélangés).
  const permettreAjout = dansUnDossierPrecis && limiterAuxScope;
  const dossierVraimentVide =
    dansUnDossierPrecis &&
    limiterAuxScope &&
    !rechercheActive &&
    state.filtreNiveau === "all";

  return `
    <header class="view-header">
      <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="${t("ouvrir_menu")}">☰</button>
      <h1 class="view-title view-title-sm">${titre}</h1>
      ${sousTitre ? `<p class="view-subtitle">${sousTitre}</p>` : ""}
    </header>

    <div class="toolbar">
      <div class="tabs">
        ${onglets
          .map(
            (o) => `
          <button class="tab ${state.filtreNiveau === o.id ? "active" : ""}" data-tab="${o.id}">
            ${o.id !== "all" ? pastille(o.id) : ""} ${o.label}
          </button>`,
          )
          .join("")}
      </div>
      <div class="toolbar-right">
        <input type="search" class="search-input" placeholder="${t("rechercher_placeholder")}" value="${state.recherche}" id="search-input" />
        ${
          (dansUnDossierPrecis || dansUneMatierePrecise) && rechercheActive
            ? `<label class="search-scope-toggle">
                 <input type="checkbox" data-recherche-scope ${state.rechercheDansDossier ? "checked" : ""}>
                 ${t("recherche_ici_seulement")}
               </label>`
            : ""
        }
        <div class="sort-group">
          <span class="sort-label">${t("trier_par")}</span>
          ${[
            ["next", t("tri_next")],
            ["priority", t("tri_priority")],
            ["name", t("tri_name")],
          ]
            .map(
              ([id, label]) => `
            <button class="sort-btn ${state.tri === id ? "active" : ""}" data-sort="${id}">${label}</button>
          `,
            )
            .join("")}
        </div>
      </div>
    </div>

    ${
      liste.length > 0
        ? renderGrille(liste, { grouper, permettreAjout })
        : dossierVraimentVide
          ? `<div class="empty-state">
             <p>${t("dossier_vide")}</p>
             <p class="empty-sub">${t("dossier_vide_sub")}</p>
             <button class="btn-primary" data-add-cours="${state.dossierId}">${t("nouveau_cours")}</button>
           </div>`
          : `<div class="empty-state">
             <p>${t("aucun_resultat_recherche")}</p>
           </div>`
    }
  `;
}

// Construit la grille façon tableur : colonnes = dernières dates de révision
// communes + "Aujourd'hui" + "Prochaine révision".
// Nombre de cases d'historique affichées sur ordinateur, avant "Aujourd'hui".
// Elles ne représentent plus des dates communes à tous les cours (voir
// commentaire de ligneGrille), donc ce nombre reste valable indéfiniment,
// même quand les intervalles de révision deviennent très espacés.
const NB_COLONNES_HISTORIQUE = 5;

function renderGrille(liste, options = {}) {
  if (liste.length === 0)
    return `<div class="empty-state"><p>${t("aucun_cours")}</p></div>`;

  // La colonne "Aujourd'hui" a besoin de plus de place que les autres (le mot
  // est plus long) : on lui donne une largeur dédiée, plus large, pour que
  // le texte ne déborde plus sur la colonne voisine.
  const styleGrille = `style="grid-template-columns: minmax(200px,2.2fr) 260px 84px 112px 138px;"`;

  const enTete = `
    <div class="grid-cell grid-head">${t("colonne_cours")}</div>
    <div class="grid-cell grid-head grid-head-date" title="${t("legende_historique")}">${t("historique_revisions")}</div>
    <div class="grid-cell grid-head grid-head-date grid-head-today">
      <span>${t("colonne_aujourdhui")}</span>
      <span class="grid-head-sub">${formaterDateCourte(AUJOURDHUI)}</span>
    </div>
    <div class="grid-cell grid-head grid-head-priority">${t("priorite")}</div>
    <div class="grid-cell grid-head grid-head-next">${t("colonne_prochaine_revision")}</div>
  `;

  // Regroupement par matière · dossier (uniquement en vue globale/matière)
  let corps = "";
  if (options.grouper) {
    const groupes = new Map();
    liste.forEach((item) => {
      const cle = `${item.matiere.nom} · ${item.dossier.nom}`;
      if (!groupes.has(cle)) groupes.set(cle, []);
      groupes.get(cle).push(item);
    });
    for (const [cle, items] of groupes) {
      corps += `<div class="grid-group-title">${cle.toUpperCase()}</div>`;
      corps += items.map((item) => ligneGrille(item)).join("");
    }
  } else {
    corps = liste.map((item) => ligneGrille(item)).join("");
    if (options.permettreAjout) {
      corps += `<button class="add-course-row" data-add-cours="${state.dossierId}">${t("nouveau_cours")}</button>`;
    }
  }

  return `<div class="grid-table" ${styleGrille}>${enTete}${corps}</div>`;
}

// Renvoie les n dernières révisions RÉELLES d'un cours (hors aujourd'hui),
// triées de la plus ancienne à la plus récente. Utilisé à la fois pour les
// colonnes desktop et pour la timeline mobile : chaque case correspond
// toujours à un évènement propre à CE cours, jamais à une date arbitraire
// partagée avec d'autres cours.
function revisionsPasseesRecentes(cours, n) {
  const isoAujourdhui = isoDate(AUJOURDHUI);
  return [...cours.historique]
    .filter((h) => isoDate(h.date) !== isoAujourdhui)
    .sort((a, b) => a.date - b.date)
    .slice(-n);
}

function ligneGrille({ cours }) {
  const statut = formaterStatutRevision(cours.prochaineRevision);
  const isoAujourdhui = isoDate(AUJOURDHUI);
  const historiqueParDate = new Map(
    cours.historique.map((h) => [isoDate(h.date), h.niveau]),
  );
  const niveauAujourdhui = historiqueParDate.get(isoAujourdhui);

  // --- Version DESKTOP : les 5 dernières révisions RÉELLES de ce cours,
  // pas des dates communes à tous les cours du dossier. C'est important :
  // avec la répétition espacée, les intervalles grandissent avec le temps
  // (2j, puis 4j, puis 2 semaines, puis 2 mois...). Des colonnes à dates
  // fixes finiraient soit par être presque toutes vides pour la plupart des
  // cours, soit par représenter des écarts de temps très inégaux d'une
  // colonne à l'autre. Plutôt que d'étiqueter les colonnes par un rang
  // abstrait (essayé, mais peu clair : "-5" ne se comprend pas d'un coup
  // d'œil), chaque case affiche directement SA propre date en dessous —
  // aucune légende à interpréter, l'information est juste là.
  const revisionsRecentes = revisionsPasseesRecentes(
    cours,
    NB_COLONNES_HISTORIQUE,
  );
  const casesVides = NB_COLONNES_HISTORIQUE - revisionsRecentes.length;
  const cellules = [...Array(casesVides).fill(null), ...revisionsRecentes]
    .map((h) => {
      if (!h) {
        // Ce cours n'a pas encore autant de révisions passées : case
        // neutre, non cliquable (il n'y a pas de date précise à éditer ici).
        return `<div class="grid-cell-history grid-cell-history-vide"></div>`;
      }
      const iso = isoDate(h.date);
      return `<div class="grid-cell-history filled cell-${h.niveau}" data-cell-cours="${cours.id}" data-cell-date="${iso}"><span class="grid-cell-history-date">${formaterDateTresCourte(h.date)}</span></div>`;
    })
    .join("");

  const celluleAujourdhui = `<div class="grid-cell grid-cell-history grid-cell-today-cell ${niveauAujourdhui ? "filled cell-" + niveauAujourdhui : ""}" data-cell-cours="${cours.id}" data-cell-date="${isoAujourdhui}" title="${formaterDateCourte(AUJOURDHUI)}"><span class="grid-cell-history-date">${t("aujourdhui_court")}</span></div>`;
  const historiqueCellules = `<div class="history-cells">${cellules}</div>`;

  // --- Version MOBILE : les 3 dernières révisions réelles de ce cours, avec
  // leur propre date affichée sous chaque puce (même logique que ci-dessus,
  // adaptée à l'espace plus restreint d'une carte mobile).
  const dernieresRevisions = revisionsPasseesRecentes(cours, 3);

  const pucesPassees = dernieresRevisions
    .map(
      (h) => `
      <div class="mobile-review-chip cell-${h.niveau}" data-cell-cours="${cours.id}" data-cell-date="${isoDate(h.date)}">
        <span class="mobile-review-dot"></span>
        <span class="mobile-review-date">${formaterDateCourte(h.date)}</span>
      </div>`,
    )
    .join("");

  // La puce "Aujourd'hui" est toujours affichée en dernier : pleine si déjà
  // révisé aujourd'hui, en pointillés sinon (et cliquable dans les deux cas,
  // exactement comme sur desktop, pour ajouter/modifier la révision du jour).
  const puceAujourdhui = `
    <div class="mobile-review-chip is-today ${niveauAujourdhui ? "cell-" + niveauAujourdhui : ""}" data-cell-cours="${cours.id}" data-cell-date="${isoAujourdhui}">
      <span class="mobile-review-dot"></span>
      <span class="mobile-review-date">${t("aujourdhui_court")}</span>
    </div>`;

  const timelineMobile = `
    <div class="mobile-review-track">
      ${pucesPassees}${puceAujourdhui}
    </div>`;

  return `
    <div class="grid-row">
      <div class="grid-cell grid-cell-name" data-course-menu="${cours.id}" title="${t("renommer_ou_supprimer")}">${pastille(cours.niveau)}${cours.nom}</div>
      ${historiqueCellules}
      ${celluleAujourdhui}
      ${timelineMobile}
      <div class="grid-cell grid-cell-priority">${selecteurPriorite(cours)}</div>
      <div class="grid-cell grid-cell-next status-${statut.classe}">${statut.texte}</div>
    </div>
  `;
}

// Construit le petit menu qui s'affiche au clic sur une case de la grille :
// choisir une couleur, ou retirer la case si elle existe déjà.
function popoverContenuCellule(coursId, iso) {
  const cours = trouverCoursParId(coursId);
  const existante = cours.historique.find((h) => isoDate(h.date) === iso);
  const estAujourdhui = iso === isoDate(AUJOURDHUI);
  const titre = estAujourdhui
    ? t("colonne_aujourdhui")
    : formaterDateCourte(dateDepuisIso(iso));

  return `
    <div class="popover-title">${titre}</div>
    <button class="popover-color" data-cell-set="${coursId}|${iso}|red">${pastille("red")}<span>${t("onglet_a_revoir")}</span></button>
    <button class="popover-color" data-cell-set="${coursId}|${iso}|orange">${pastille("orange")}<span>${t("onglet_fragiles")}</span></button>
    <button class="popover-color" data-cell-set="${coursId}|${iso}|green">${pastille("green")}<span>${t("niveau_maitrise")}</span></button>
    ${
      existante
        ? `
      <div class="popover-divider"></div>
      <button class="popover-item popover-item-danger" data-cell-clear="${coursId}|${iso}">${t("retirer_case")}</button>
    `
        : ""
    }
  `;
}

// Menu qui s'affiche au clic sur le nom d'un cours.
function popoverContenuCours(coursId) {
  return `
    <button class="popover-item" data-course-rename="${coursId}">${t("renommer_cours")}</button>
    <button class="popover-item popover-item-danger" data-course-delete="${coursId}">${t("supprimer_cours")}</button>
  `;
}

function popoverContenuPriorite(coursId) {
  const cours = trouverCoursParId(coursId);
  if (!cours) return "";
  return `
    <div class="popover-title">${t("priorite")}</div>
    ${[1, 2, 3]
      .map(
        (priority) => `
      <button class="priority-option ${cours.priority === priority ? "active" : ""}" data-priority-set="${coursId}|${priority}">
        <span class="priority-option-stars">${"★".repeat(priority)}</span>
        <span>${libellePriorite(priority)}</span>
      </button>`,
      )
      .join("")}
  `;
}

// Menu qui s'affiche au clic sur le bouton "⋯" d'une matière.
function popoverContenuMatiere(matiereId) {
  return `
    <button class="popover-item" data-matiere-rename="${matiereId}">${t("renommer_matiere")}</button>
    <button class="popover-item popover-item-danger" data-matiere-delete="${matiereId}">${t("supprimer_matiere")}</button>
  `;
}

// Menu qui s'affiche au clic sur le bouton "⋯" d'un dossier.
function popoverContenuDossier(matiereId, dossierId) {
  return `
    <button class="popover-item" data-dossier-rename="${matiereId}|${dossierId}">${t("renommer_dossier")}</button>
    <button class="popover-item popover-item-danger" data-dossier-delete="${matiereId}|${dossierId}">${t("supprimer_dossier")}</button>
  `;
}

/* ----- Page : Progression ----- */

function scoreMaitrise(liste) {
  if (liste.length === 0) return 0;
  const total = liste.reduce((s, { cours }) => {
    if (cours.niveau === "green") return s + 1;
    if (cours.niveau === "orange") return s + 0.5;
    return s;
  }, 0);
  return Math.round((total / liste.length) * 100);
}

function renderProgression() {
  const liste = tousLesCours();
  const nbRed = liste.filter((l) => l.cours.niveau === "red").length;
  const nbOrange = liste.filter((l) => l.cours.niveau === "orange").length;
  const nbGreen = liste.filter((l) => l.cours.niveau === "green").length;
  const total = liste.length;
  const maitriseGlobale = scoreMaitrise(liste);

  const parMatiere = DATA.matieres.map((matiere) => {
    const items = liste.filter((l) => l.matiere.id === matiere.id);
    const r = items.filter((l) => l.cours.niveau === "red").length;
    const o = items.filter((l) => l.cours.niveau === "orange").length;
    const g = items.filter((l) => l.cours.niveau === "green").length;
    const pct = scoreMaitrise(items);
    return { matiere, r, o, g, total: items.length, pct };
  });

  // Activité récente : toutes les entrées d'historique, triées de la plus récente à la plus ancienne
  const activite = [];
  liste.forEach(({ cours, matiere, dossier }) => {
    cours.historique.forEach((h) =>
      activite.push({ ...h, cours, matiere, dossier }),
    );
  });
  activite.sort((a, b) => b.date - a.date);
  const activiteRecente = activite.slice(0, 8);

  return `
    <header class="view-header">
      <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="${t("ouvrir_menu")}">☰</button>
      <h1 class="view-title view-title-sm">${t("titre_progression")}</h1>
      <p class="view-subtitle">${t("sous_titre_progression")}</p>
    </header>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">${t("maitrise_globale")}</div>
        <div class="stat-value">${maitriseGlobale}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${t("a_reviser")}</div>
        <div class="stat-value stat-red">${coursEnRetardOuAujourdhui().length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${t("cours_maitrises")}</div>
        <div class="stat-value stat-green">${nbGreen}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">${t("total_cours")}</div>
        <div class="stat-value">${total}</div>
      </div>
    </div>

    <div class="panel">
      <h2 class="panel-title">${t("repartition_globale")}</h2>
      <div class="repartition-bar">
        ${nbRed ? `<div class="repartition-segment seg-red" style="flex:${nbRed}"></div>` : ""}
        ${nbOrange ? `<div class="repartition-segment seg-orange" style="flex:${nbOrange}"></div>` : ""}
        ${nbGreen ? `<div class="repartition-segment seg-green" style="flex:${nbGreen}"></div>` : ""}
      </div>
      <div class="repartition-legend">
        <span>${pastille("red")} ${t("legende_a_revoir", nbRed)}</span>
        <span>${pastille("orange")} ${t("legende_fragiles", nbOrange)}</span>
        <span>${pastille("green")} ${t("legende_maitrises", nbGreen)}</span>
      </div>
    </div>

    <div class="panel-label">${t("par_matiere")}</div>
    <div class="subject-cards">
      ${parMatiere
        .map(
          (m) => `
        <div class="subject-card" data-matiere-link="${m.matiere.id}">
          <div class="subject-card-head">
            <div>
              <div class="subject-card-name">${m.matiere.nom}</div>
              <div class="subject-card-count">${t("n_cours", m.total)}</div>
            </div>
            <div class="subject-card-icon">${iconeMatiere(m.matiere)}</div>
          </div>
          <div class="repartition-bar small">
            ${m.r ? `<div class="repartition-segment seg-red" style="flex:${m.r}"></div>` : ""}
            ${m.o ? `<div class="repartition-segment seg-orange" style="flex:${m.o}"></div>` : ""}
            ${m.g ? `<div class="repartition-segment seg-green" style="flex:${m.g}"></div>` : ""}
          </div>
          <div class="subject-card-foot">
            <span>${m.r ? `${pastille("red")} ${m.r}` : ""} ${m.o ? `${pastille("orange")} ${m.o}` : ""} ${m.g ? `${pastille("green")} ${m.g}` : ""}</span>
            <span class="subject-card-pct">${t("pourcent_maitrise", m.pct)}</span>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>

    <div class="panel-label">${t("activite_recente")}</div>
    <div class="activity-list">
      ${activiteRecente
        .map((a) => {
          const diff = joursEntre(a.date, AUJOURDHUI);
          const quand =
            diff === 0
              ? t("aujourdhui")
              : diff === 1
                ? t("hier")
                : formaterDateCourte(a.date);
          return `
          <div class="activity-item">
            ${pastille(a.niveau)}
            <span class="activity-name">${a.cours.nom}</span>
            <span class="activity-date">${quand}</span>
          </div>`;
        })
        .join("")}
    </div>
  `;
}

/* ---------- 6. ÉVÉNEMENTS ---------- */

document.body.addEventListener("click", (e) => {
  // Si un popover est ouvert et qu'on clique en dehors de lui (et en dehors
  // d'un bouton qui ouvre un popover), on le referme d'abord.
  const clicDansPopover = e.target.closest(".popover");
  const clicSurDeclencheur = e.target.closest(
    "[data-cell-cours], [data-course-menu], [data-matiere-menu], [data-dossier-menu], [data-priority-menu]",
  );
  if (popoverActuel && !clicDansPopover && !clicSurDeclencheur) fermerPopover();

  const themeBtn = e.target.closest("#theme-toggle");
  if (themeBtn) {
    state.sombre = !state.sombre;
    return render();
  }

  const langBtn = e.target.closest("[data-lang]");
  if (langBtn) {
    if (state.langue !== langBtn.dataset.lang) {
      state.langue = langBtn.dataset.lang;
      render();
    }
    return;
  }

  // --- Case de la grille : ouvrir le sélecteur de couleur ---
  const cellule = e.target.closest("[data-cell-cours]");
  if (cellule) {
    return ouvrirPopover(
      cellule,
      popoverContenuCellule(
        cellule.dataset.cellCours,
        cellule.dataset.cellDate,
      ),
    );
  }
  const choixCouleur = e.target.closest("[data-cell-set]");
  if (choixCouleur) {
    const [coursId, iso, niveau] = choixCouleur.dataset.cellSet.split("|");
    definirCaseHistorique(coursId, iso, niveau);
    return render();
  }
  const retirerCase = e.target.closest("[data-cell-clear]");
  if (retirerCase) {
    const [coursId, iso] = retirerCase.dataset.cellClear.split("|");
    retirerCaseHistorique(coursId, iso);
    return render();
  }

  const menuPriorite = e.target.closest("[data-priority-menu]");
  if (menuPriorite) {
    return ouvrirPopover(
      menuPriorite,
      popoverContenuPriorite(menuPriorite.dataset.priorityMenu),
    );
  }
  const prioriteChoisie = e.target.closest("[data-priority-set]");
  if (prioriteChoisie) {
    const [coursId, poids] = prioriteChoisie.dataset.prioritySet.split("|");
    modifierPriorite(coursId, poids);
    return render();
  }

  // --- Nom d'un cours : ouvrir le menu renommer / supprimer ---
  const menuCours = e.target.closest("[data-course-menu]");
  if (menuCours) {
    return ouvrirPopover(
      menuCours,
      popoverContenuCours(menuCours.dataset.courseMenu),
    );
  }
  const renommer = e.target.closest("[data-course-rename]");
  if (renommer) {
    renommerCours(renommer.dataset.courseRename);
    return render();
  }
  const supprimer = e.target.closest("[data-course-delete]");
  if (supprimer) {
    const cours = trouverCoursParId(supprimer.dataset.courseDelete);
    if (cours && confirm(t("confirm_supprimer_cours", cours.nom))) {
      supprimerCours(supprimer.dataset.courseDelete);
    }
    return render();
  }

  // --- Bouton "⋯" d'une matière : ouvrir le menu renommer / supprimer ---
  const menuMatiere = e.target.closest("[data-matiere-menu]");
  if (menuMatiere) {
    return ouvrirPopover(
      menuMatiere,
      popoverContenuMatiere(menuMatiere.dataset.matiereMenu),
    );
  }
  const renommerMatiereBtn = e.target.closest("[data-matiere-rename]");
  if (renommerMatiereBtn) {
    renommerMatiere(renommerMatiereBtn.dataset.matiereRename);
    return render();
  }
  const supprimerMatiereBtn = e.target.closest("[data-matiere-delete]");
  if (supprimerMatiereBtn) {
    supprimerMatiere(supprimerMatiereBtn.dataset.matiereDelete);
    return render();
  }

  // --- Bouton "⋯" d'un dossier : ouvrir le menu renommer / supprimer ---
  const menuDossier = e.target.closest("[data-dossier-menu]");
  if (menuDossier) {
    const [matiereId, dossierId] = menuDossier.dataset.dossierMenu.split("|");
    return ouvrirPopover(
      menuDossier,
      popoverContenuDossier(matiereId, dossierId),
    );
  }
  const renommerDossierBtn = e.target.closest("[data-dossier-rename]");
  if (renommerDossierBtn) {
    const [matiereId, dossierId] =
      renommerDossierBtn.dataset.dossierRename.split("|");
    renommerDossier(matiereId, dossierId);
    return render();
  }
  const supprimerDossierBtn = e.target.closest("[data-dossier-delete]");
  if (supprimerDossierBtn) {
    const [matiereId, dossierId] =
      supprimerDossierBtn.dataset.dossierDelete.split("|");
    supprimerDossier(matiereId, dossierId);
    return render();
  }

  const nav = e.target.closest("[data-nav]");
  if (nav) return allerA(nav.dataset.nav, null, null);

  const matiereBtn = e.target.closest("[data-matiere]:not([data-dossier])");
  if (matiereBtn) return allerA("all", matiereBtn.dataset.matiere, null);

  const dossierBtn = e.target.closest("[data-dossier]");
  if (dossierBtn)
    return allerA(
      "all",
      dossierBtn.dataset.matiere,
      dossierBtn.dataset.dossier,
    );

  const matiereLink = e.target.closest("[data-matiere-link]");
  if (matiereLink) return allerA("all", matiereLink.dataset.matiereLink, null);

  const toggle = e.target.closest("[data-toggle]");
  if (toggle) {
    const id = toggle.dataset.toggle;
    state.dossiersReplies.has(id)
      ? state.dossiersReplies.delete(id)
      : state.dossiersReplies.add(id);
    return render();
  }

  const review = e.target.closest("[data-review]");
  if (review) return reviserCours(review.dataset.review, review.dataset.level);

  const tab = e.target.closest("[data-tab]");
  if (tab) {
    state.filtreNiveau = tab.dataset.tab;
    return render();
  }

  const sort = e.target.closest("[data-sort]");
  if (sort) {
    state.tri = sort.dataset.sort;
    return render();
  }

  const addDossier = e.target.closest("[data-add-dossier]");
  if (addDossier) {
    const nom = prompt(t("prompt_nouveau_dossier"));
    if (nom && nom.trim()) {
      const matiere = DATA.matieres.find(
        (m) => m.id === addDossier.dataset.addDossier,
      );
      matiere.dossiers.push({ id: prochainId(), nom: nom.trim(), cours: [] });
      render();
    }
    return;
  }

  const addCours = e.target.closest("[data-add-cours]");
  if (addCours) {
    const nom = prompt(t("prompt_nouveau_cours"));
    if (nom && nom.trim()) {
      for (const matiere of DATA.matieres) {
        const dossier = matiere.dossiers.find(
          (d) => d.id === addCours.dataset.addCours,
        );
        if (dossier) {
          dossier.cours.push(creerCours(nom.trim(), "red", 0, []));
          break;
        }
      }
      render();
    }
    return;
  }

  const addMatiere = e.target.closest("#add-matiere");
  if (addMatiere) {
    const nom = prompt(t("prompt_nouvelle_matiere"));
    if (nom && nom.trim()) {
      DATA.matieres.push({
        id: prochainId(),
        nom: nom.trim(),
        icone: nom.trim()[0].toUpperCase(),
        dossiers: [],
      });
      render();
    }
    return;
  }

  if (e.target.closest("#mobile-menu-btn")) {
    state.sidebarOuverte = true;
    document.body.classList.add("sidebar-ouverte");
    return;
  }
  if (e.target.closest("#sidebar-close") || e.target.id === "sidebar-overlay") {
    // Fermeture de la sidebar mobile (bouton ✕ ou clic sur le fond assombri)
    state.sidebarOuverte = false;
    document.body.classList.remove("sidebar-ouverte");
    return;
  }

  if (e.target.closest("#reset-donnees")) return reinitialiserDonnees();
  if (e.target.closest("#vider-donnees")) return viderDonnees();
});

document.body.addEventListener("input", (e) => {
  if (e.target.id === "search-input") {
    state.recherche = e.target.value;
    // On ne relance pas tout le rendu pour ne pas perdre le focus du champ :
    // on met juste à jour la partie grille.
    const scrollY = window.scrollY;
    render();
    window.scrollTo(0, scrollY);
    document.getElementById("search-input").focus();
    const val = document.getElementById("search-input").value;
    document
      .getElementById("search-input")
      .setSelectionRange(val.length, val.length);
  }
});

// Les réglages sont validés au changement (et non à chaque frappe dans le
// quota personnalisé) pour ne jamais interrompre la saisie de l'étudiant.
document.body.addEventListener("change", (e) => {
  if (e.target.matches("[data-recherche-scope]")) {
    state.rechercheDansDossier = e.target.checked;
    return render();
  }
  if (e.target.matches("[data-essential]")) {
    state.essentielUniquement = e.target.checked;
    return render();
  }
  if (e.target.matches("[data-daily-limit]")) {
    revisionPreferences.dailyLimit = Math.max(
      1,
      Math.min(
        100,
        Math.round(Number(e.target.value) || REVISION_CONFIG.DAILY_LIMIT),
      ),
    );
    return render();
  }
  if (e.target.matches("[data-max-interval]")) {
    revisionPreferences.maxInterval = Number(e.target.value);
    return render();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && popoverActuel) fermerPopover();
});
window.addEventListener(
  "scroll",
  () => {
    if (popoverActuel) fermerPopover();
  },
  true,
);
window.addEventListener("resize", () => {
  if (popoverActuel) fermerPopover();
});

/* ---------- 7. LANCEMENT ---------- */
chargerDonneesSauvegardees();
render();
