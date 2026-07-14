const express = require('express');
const initSqlJs = require('sql.js');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('css'));
app.use(express.static('js'));
app.use(express.static('img'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session setup
app.use(session({
    secret: 'ritco-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Database setup with sql.js
let db;

async function initDatabase() {
    const SQL = await initSqlJs();
    
    // Check if database file exists
    let dbData = null;
    if (fs.existsSync('./ritco.db')) {
        dbData = fs.readFileSync('./ritco.db');
    }
    
    db = new SQL.Database(dbData);
    
    // Create tables
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT UNIQUE,
            phone TEXT,
            password TEXT,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            from_city TEXT,
            to_city TEXT,
            date TEXT,
            seats INTEGER,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Insert default users
    const adminCheck = db.exec('SELECT * FROM users WHERE email = "admin@ritco.rw"');
    if (adminCheck.length === 0 || adminCheck[0].values.length === 0) {
        const hashedAdmin = bcrypt.hashSync('admin123', 10);
        db.run('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            ['Admin RITCO', 'admin@ritco.rw', '+250 788 000 001', hashedAdmin, 'admin']);
        console.log('✅ Admin user created: admin@ritco.rw / admin123');
    }
    
    const userCheck = db.exec('SELECT * FROM users WHERE email = "user@ritco.rw"');
    if (userCheck.length === 0 || userCheck[0].values.length === 0) {
        const hashedUser = bcrypt.hashSync('user123', 10);
        db.run('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            ['John Doe', 'user@ritco.rw', '+250 788 000 002', hashedUser, 'user']);
        console.log('✅ Regular user created: user@ritco.rw / user123');
    }
    
    // Save database to file
    fs.writeFileSync('./ritco.db', Buffer.from(db.export()));
    console.log('✅ Database initialized');
}

// Initialize database
initDatabase().catch(console.error);

// Helper function to get user by email
function getUserByEmail(email) {
    const result = db.exec('SELECT * FROM users WHERE email = ?', [email]);
    if (result.length > 0 && result[0].values.length > 0) {
        const row = result[0].values[0];
        return {
            id: row[0],
            name: row[1],
            email: row[2],
            phone: row[3],
            password: row[4],
            role: row[5]
        };
    }
    return null;
}

// Helper function to execute queries and get results
function getRows(sql, params = []) {
    const result = db.exec(sql, params);
    if (result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map(row => {
        const obj = {};
        columns.forEach((col, i) => {
            obj[col] = row[i];
        });
        return obj;
    });
}

// Routes
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'RITCO - Official Bus Transport',
        user: req.session.user || null
    });
});

app.get('/login', (req, res) => {
    res.render('login', { title: 'RITCO - Login' });
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'RITCO - Register' });
});

app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    if (req.session.user.role === 'admin') {
        return res.redirect('/admin');
    }
    res.render('dashboard', { 
        title: 'RITCO - Dashboard',
        user: req.session.user
    });
});

app.get('/search', (req, res) => {
    res.render('search', { 
        title: 'RITCO - Search Results',
        user: req.session.user || null
    });
});

app.get('/admin', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    if (req.session.user.role !== 'admin') {
        return res.redirect('/dashboard');
    }
    res.render('admin', { 
        title: 'RITCO - Admin Panel',
        user: req.session.user
    });
});

// Admin Management Routes
app.get('/admin-bookings', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-bookings', { 
        title: 'RITCO - Manage Bookings',
        user: req.session.user
    });
});

app.get('/admin-passengers', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-passengers', { 
        title: 'RITCO - Manage Passengers',
        user: req.session.user
    });
});

app.get('/admin-routes', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-routes', { 
        title: 'RITCO - Manage Routes',
        user: req.session.user
    });
});

app.get('/admin-schedules', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-schedules', { 
        title: 'RITCO - Manage Schedules',
        user: req.session.user
    });
});

app.get('/admin-buses', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-buses', { 
        title: 'RITCO - Manage Buses',
        user: req.session.user
    });
});

app.get('/admin-drivers', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-drivers', { 
        title: 'RITCO - Manage Drivers',
        user: req.session.user
    });
});

app.get('/admin-employees', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-employees', { 
        title: 'RITCO - Manage Employees',
        user: req.session.user
    });
});

app.get('/admin-payments', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-payments', { 
        title: 'RITCO - Manage Payments',
        user: req.session.user
    });
});

app.get('/admin-reports', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-reports', { 
        title: 'RITCO - Reports',
        user: req.session.user
    });
});

app.get('/admin-announcements', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-announcements', { 
        title: 'RITCO - Announcements',
        user: req.session.user
    });
});

app.get('/admin-support', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-support', { 
        title: 'RITCO - Support Tickets',
        user: req.session.user
    });
});

app.get('/admin-settings', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login');
    }
    res.render('admin-settings', { 
        title: 'RITCO - Settings',
        user: req.session.user
    });
});

// User Pages
app.get('/my-bookings', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('my-bookings', { 
        title: 'RITCO - My Bookings',
        user: req.session.user || null
    });
});

app.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('profile', { 
        title: 'RITCO - Profile',
        user: req.session.user || null
    });
});

app.get('/seat-selection', (req, res) => {
    res.render('seat-selection', { 
        title: 'RITCO - Seat Selection',
        user: req.session.user || null
    });
});

app.get('/passenger-details', (req, res) => {
    res.render('passenger-details', { 
        title: 'RITCO - Passenger Details',
        user: req.session.user || null
    });
});

app.get('/payment', (req, res) => {
    res.render('payment', { 
        title: 'RITCO - Payment',
        user: req.session.user || null
    });
});

app.get('/booking-confirmation', (req, res) => {
    res.render('booking-confirmation', { 
        title: 'RITCO - Booking Confirmed',
        user: req.session.user || null
    });
});

app.get('/routes', (req, res) => {
    res.render('routes', { 
        title: 'RITCO - Routes',
        user: req.session.user || null
    });
});

app.get('/schedule', (req, res) => {
    res.render('schedule', { 
        title: 'RITCO - Bus Schedule',
        user: req.session.user || null
    });
});

app.get('/track', (req, res) => {
    res.render('track', { 
        title: 'RITCO - Track Bus',
        user: req.session.user || null
    });
});

app.get('/support', (req, res) => {
    res.render('support', { 
        title: 'RITCO - Support',
        user: req.session.user || null
    });
});

app.get('/about', (req, res) => {
    res.render('about', { 
        title: 'RITCO - About Us',
        user: req.session.user || null
    });
});

app.get('/contact', (req, res) => {
    res.render('contact', { 
        title: 'RITCO - Contact',
        user: req.session.user || null
    });
});

app.get('/booking', (req, res) => {
    res.redirect('/search');
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// API Routes
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    try {
        const user = getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        req.session.user = user;
        res.json({ 
            success: true, 
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            },
            redirect: user.role === 'admin' ? '/admin' : '/dashboard'
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/register', async (req, res) => {
    const { name, email, phone, password } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.run('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone, hashedPassword, 'user']);
        fs.writeFileSync('./ritco.db', Buffer.from(db.export()));
        res.json({ success: true, message: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Save database periodically
setInterval(() => {
    if (db) {
        fs.writeFileSync('./ritco.db', Buffer.from(db.export()));
    }
}, 30000);

app.listen(PORT, () => {
    console.log(`✅ RITCO Server running on http://localhost:${PORT}`);
    console.log('🚌 RITCO Bus Transport System Ready!');
});
