/**
 * Utilitaires pour la gestion des étudiants et des dates
 */

/**
 * Formate une date au format français (DD/MM/YYYY)
 * @param {string} dateString - Date au format YYYY-MM-DD
 * @returns {string} Date formatée en français
 */
function formatDateToFrench(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

/**
 * Calcule l'âge d'une personne à partir de sa date de naissance
 * @param {string} birthDate - Date de naissance au format YYYY-MM-DD
 * @returns {number} Âge en années
 */
function calculateAge(birthDate) {
    if (!birthDate) return 0;
    
    const birth = new Date(birthDate);
    const today = new Date();
    
    if (isNaN(birth.getTime())) return 0;
    
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

/**
 * Valide une date de naissance
 * @param {string} dateString - Date à valider
 * @returns {boolean} True si la date est valide
 */
function isValidBirthDate(dateString) {
    if (!dateString) return false;
    
    // Vérifier le format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const date = new Date(dateString);
    const today = new Date();
    
    // Vérifier que la date est valide et pas dans le futur
    if (isNaN(date.getTime())) return false;
    if (date > today) return false;
    
    // Vérifier que la date n'est pas trop ancienne (plus de 150 ans)
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 150);
    if (date < minDate) return false;
    
    return true;
}

/**
 * Valide un nom d'étudiant
 * @param {string} name - Nom à valider
 * @returns {boolean} True si le nom est valide
 */
function isValidName(name) {
    if (!name || typeof name !== 'string') return false;
    
    const trimmedName = name.trim();
    
    // Vérifier la longueur
    if (trimmedName.length < 2 || trimmedName.length > 50) return false;
    
    // Vérifier qu'il n'y a pas que des espaces
    if (trimmedName.length === 0) return false;
    
    // Vérifier qu'il n'y a pas de caractères spéciaux dangereux
    const dangerousChars = /[<>\"'&]/;
    if (dangerousChars.test(trimmedName)) return false;
    
    return true;
}

/**
 * Génère un ID unique pour un étudiant
 * @returns {string} ID unique
 */
function generateStudentId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Nettoie et normalise un nom d'étudiant
 * @param {string} name - Nom à nettoyer
 * @returns {string} Nom nettoyé
 */
function sanitizeName(name) {
    if (!name || typeof name !== 'string') return '';
    
    return name.trim()
        .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
        .replace(/[<>\"'&]/g, '') // Supprimer les caractères dangereux
        .substring(0, 50); // Limiter à 50 caractères
}

/**
 * Vérifie si deux dates sont identiques
 * @param {string} date1 - Première date
 * @param {string} date2 - Deuxième date
 * @returns {boolean} True si les dates sont identiques
 */
function areDatesEqual(date1, date2) {
    if (!date1 || !date2) return false;
    return new Date(date1).getTime() === new Date(date2).getTime();
}

/**
 * Obtient la date actuelle au format ISO
 * @returns {string} Date actuelle au format ISO
 */
function getCurrentISODate() {
    return new Date().toISOString();
}

/**
 * Valide un ID d'étudiant
 * @param {string} id - ID à valider
 * @returns {boolean} True si l'ID est valide
 */
function isValidStudentId(id) {
    return id && typeof id === 'string' && id.length > 0;
}

module.exports = {
    formatDateToFrench,
    calculateAge,
    isValidBirthDate,
    isValidName,
    generateStudentId,
    sanitizeName,
    areDatesEqual,
    getCurrentISODate,
    isValidStudentId
};
