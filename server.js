const express = require('express');
const path = require('path');
require('dotenv').config();

const { 
    formatDateToFrench, 
    isValidBirthDate, 
    isValidName, 
    generateStudentId,
    sanitizeName,
    getCurrentISODate,
    isValidStudentId
} = require('./utils');

const app = express();
const PORT = process.env.APP_PORT || 3000;
const HOST = process.env.APP_HOST || 'localhost';

// Configuration du moteur de template
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'view'));

// Middleware
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Middleware de sécurité
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Données des étudiants (en mémoire pour cet exemple)
let students = [
    { id: '1', name: "Sonia", birth: "2019-05-14" },
    { id: '2', name: "Antoine", birth: "2000-12-05" },
    { id: '3', name: "Alice", birth: "1990-09-14" },
    { id: '4', name: "Sophie", birth: "2001-10-02" },
    { id: '5', name: "Bernard", birth: "1980-08-21" }
];

// Fonction pour formater les étudiants avec les dates en français
function formatStudents(studentsList) {
    return studentsList.map(student => ({
        ...student,
        formattedBirth: formatDateToFrench(student.birth)
    }));
}

// Fonction pour rediriger avec un message
function redirectWithMessage(res, url, message, type = 'success') {
    const encodedMessage = encodeURIComponent(message);
    res.redirect(`${url}?message=${encodedMessage}&type=${type}`);
}

// Middleware de validation des données
function validateStudentData(req, res, next) {
    const { name, birth } = req.body;
    const errors = [];

    if (!name || !name.trim()) {
        errors.push('Le nom est requis');
    } else if (!isValidName(name)) {
        errors.push('Le nom doit contenir entre 2 et 50 caractères');
    }

    if (!birth) {
        errors.push('La date de naissance est requise');
    } else if (!isValidBirthDate(birth)) {
        errors.push('Veuillez entrer une date de naissance valide');
    }

    if (errors.length > 0) {
        return res.status(400).json({ 
            success: false, 
            errors: errors 
        });
    }

    // Nettoyer les données
    req.body.name = sanitizeName(name);
    req.body.birth = birth;
    
    next();
}

// Middleware de gestion des erreurs async
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// Routes

// Page d'accueil - Formulaire d'ajout
app.get('/', (req, res) => {
    res.render('home', { 
        title: 'Gestion des Étudiants - Accueil',
        message: req.query.message,
        type: req.query.type
    });
});

// Ajouter un nouvel étudiant
app.post('/add-student', validateStudentData, asyncHandler(async (req, res) => {
    const { name, birth } = req.body;
    
    // Vérifier si l'étudiant existe déjà
    const existingStudent = students.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existingStudent) {
        return redirectWithMessage(res, '/', 'Un étudiant avec ce nom existe déjà.', 'error');
    }
    
    // Créer le nouvel étudiant
    const newStudent = {
        id: generateStudentId(),
        name: name,
        birth: birth,
        createdAt: getCurrentISODate()
    };
    
    students.push(newStudent);
    
    console.log(`Nouvel étudiant ajouté: ${name} (${birth})`);
    redirectWithMessage(res, '/users', `L'étudiant ${name} a été ajouté avec succès !`);
}));

// Page des utilisateurs
app.get('/users', (req, res) => {
    const formattedStudents = formatStudents(students);
    res.render('users', { 
        title: 'Gestion des Étudiants - Liste',
        students: formattedStudents,
        message: req.query.message,
        type: req.query.type
    });
});

// Page de modification d'un étudiant
app.get('/edit/:id', (req, res) => {
    const studentId = req.params.id;
    
    if (!isValidStudentId(studentId)) {
        return redirectWithMessage(res, '/users', 'ID d\'étudiant invalide.', 'error');
    }
    
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
        return redirectWithMessage(res, '/users', 'Étudiant non trouvé.', 'error');
    }
    
    res.render('edit', { 
        title: 'Gestion des Étudiants - Modification',
        student: student,
        message: req.query.message,
        type: req.query.type
    });
});

// Mettre à jour un étudiant
app.post('/update/:id', validateStudentData, asyncHandler(async (req, res) => {
    const studentId = req.params.id;
    const { name, birth } = req.body;
    
    if (!isValidStudentId(studentId)) {
        return redirectWithMessage(res, '/users', 'ID d\'étudiant invalide.', 'error');
    }
    
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
        return redirectWithMessage(res, '/users', 'Étudiant non trouvé.', 'error');
    }
    
    // Vérifier si un autre étudiant a déjà ce nom
    const existingStudent = students.find(s => s.name.toLowerCase() === name.toLowerCase() && s.id !== studentId);
    if (existingStudent) {
        return redirectWithMessage(res, `/edit/${studentId}`, 'Un autre étudiant avec ce nom existe déjà.', 'error');
    }
    
    // Mettre à jour l'étudiant
    const oldName = students[studentIndex].name;
    students[studentIndex] = {
        ...students[studentIndex],
        name: name,
        birth: birth,
        updatedAt: getCurrentISODate()
    };
    
    console.log(`Étudiant modifié: ${oldName} -> ${name} (${birth})`);
    redirectWithMessage(res, '/users', `L'étudiant ${name} a été modifié avec succès !`);
}));

// Supprimer un étudiant
app.post('/delete/:id', asyncHandler(async (req, res) => {
    const studentId = req.params.id;
    
    if (!isValidStudentId(studentId)) {
        return redirectWithMessage(res, '/users', 'ID d\'étudiant invalide.', 'error');
    }
    
    const studentIndex = students.findIndex(s => s.id === studentId);
    
    if (studentIndex === -1) {
        return redirectWithMessage(res, '/users', 'Étudiant non trouvé.', 'error');
    }
    
    const studentName = students[studentIndex].name;
    students.splice(studentIndex, 1);
    
    console.log(`Étudiant supprimé: ${studentName}`);
    redirectWithMessage(res, '/users', `L'étudiant ${studentName} a été supprimé avec succès !`);
}));

// Route 404
app.use((req, res) => {
    res.status(404).render('home', { 
        title: 'Page non trouvée',
        message: 'Page non trouvée. Redirection vers l\'accueil.',
        type: 'warning'
    });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(`Erreur ${err.status || 500}:`, err.message);
    console.error(err.stack);
    
    const status = err.status || 500;
    const message = status === 500 ? 'Une erreur interne est survenue. Veuillez réessayer.' : err.message;
    
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        res.status(status).json({ 
            success: false, 
            error: message 
        });
    } else {
        res.status(status).render('home', { 
            title: 'Erreur',
            message: message,
            type: 'error'
        });
    }
});

// Démarrage du serveur
app.listen(PORT, HOST, () => {
    console.log(`🚀 Serveur démarré sur http://${HOST}:${PORT}`);
    console.log(`📁 Environnement: ${process.env.APP_ENV}`);
    console.log(`👥 ${students.length} étudiants chargés`);
});
