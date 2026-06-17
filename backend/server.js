const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();
const verifyToken = require('./middlewares/AuthMiddleware')

const app = express();
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());

// Database connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'loveyouharmeekoo',
    database: 'university_db'
}).promise();


// LOGIN endpoint
const usersRouter = require('./routes/Users')
app.use('/api/auth', usersRouter)



// Add to server.js after login
const studentRouter = require('./routes/Student')
app.use('/api/student', studentRouter)


const adminRouter = require('./routes/Admin')
app.use('/api/admin', adminRouter)


const instructorRouter = require('./routes/Instructor')
app.use('/api/instructor', instructorRouter)


const feeRouter = require('./routes/Fee');
app.use('/api/fees', feeRouter);

const academicRoutes = require('./routes/academicRoutes');
app.use('/api/academic', academicRoutes);

const publicRoutes = require('./routes/publicRoutes');
app.use('/api/public', publicRoutes);

const libraryRoutes = require('./routes/libraryRoutes');
app.use('/api/library', libraryRoutes);

app.listen(5000, () => {
    console.log('Server running on port 5000');
});