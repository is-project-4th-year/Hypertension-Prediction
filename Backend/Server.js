import express from "express";
import mysql from "mysql2";
import cors from "cors";
import axios from "axios";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import session from "express-session";
import nodemailer from "nodemailer";
import crypto from "crypto";
// import multer from "multer";
// import path from 'path';
import bodyParser from 'body-parser'
import dotenv from 'dotenv';


dotenv.config();

const app = express();

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});


db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected');
  }
});

// Use the cors middleware
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["POST", "GET", "PUT", "DELETE"],
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json())
app.use(session({
secret: 'secret',
resave: false,
saveUninitialized: false,
cookie:{
  secure: false,
  maxAge: 1000 * 60 * 60 *24
}
}))

// JWT secret key
const secretKey = "jwt-secret-key";

// Start the server
const myPort = 8081;
app.listen(myPort, () => {
  console.log(`Listening on port ${myPort}`);
});


app.post('/check-email', (req, res) => {
    console.log('Check email body:', req.body);
    const { EmailAddress } = req.body;
    const sql = 'SELECT * FROM users WHERE EmailAddress = ?';
    
    db.query(sql, [EmailAddress], (err, result) => {
        if (err) {
            console.error('Error querying the database:', err);
            return res.status(500).json({ exists: false, Message: 'Internal Server Error' });
        }

        if (result.length > 0) {
            console.log('Email already exists:', EmailAddress);
            return res.status(200).json({ exists: true, Message: 'Email address already exists' });
            
        } else {
            return res.status(200).json({ exists: false, Message: 'Email address is available' });
        }
    });
});

// Registration endpoint
app.post('/register', (req, res) => {
    const { EmailAddress, Password } = req.body;

    console.log('Received registration request:', req.body);

    // Basic validation
    if (!EmailAddress || !Password) {
        console.log('Missing email or password');
        return res.status(400).json({ Status: 'Fail', Message: 'Email and Password are required' });
    }

    // Generate activation hash
    const randomString = crypto.randomBytes(16).toString('hex');
    const activationHash = crypto.createHash('sha256').update(randomString).digest('hex').substring(0, 10);

    const isActive = 0; // 0 = inactive
    const userType = 'patient';
    const saltRounds = 10;

    bcrypt.hash(Password, saltRounds, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).json({ Status: 'Fail', Message: 'Error processing password', Error: err.message });
        }

        const sql = 'INSERT INTO users (EmailAddress, userType, Password, Activation_Hash, isActive) VALUES (?, ?, ?, ?, ?)';
        const values = [EmailAddress, userType, hash, activationHash, isActive];

        console.log('Inserting user with values:', values);

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Database insertion error:', err);

                // Handle duplicate email gracefully
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ Status: 'Fail', Message: 'Email already exists', Error: err.message });
                }

                return res.status(500).json({ Status: 'Fail', Message: 'Database error during registration', Error: err.message });
            }

            console.log('User inserted successfully:', result);

            // Send activation email (non-blocking)
            sendActivationEmail(EmailAddress, activationHash);

            return res.status(200).json({ Status: 'Success', Message: 'Registration successful! Please check your email to activate your account.' });
        });
    });
});

// ✅ Send Activation Email Function
async function sendActivationEmail(email, activationHash) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Account Activation',
    html: `
      <h1>Account Activation</h1>
      <p>Please activate your account by clicking the link below:</p>
      <a href="${process.env.BASE_URL}/activate/${activationHash}"
         style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">
         Activate
      </a>
    `
  };

  return transporter.sendMail(mailOptions);
}


app.get("/activate/:activationHash", (req, res) => {
    const activationHash = req.params.activationHash;
    const sql = "UPDATE users SET `isActive` = ?, `Activation_Hash` = ? WHERE `Activation_Hash` = ?";
  const isActive='1';
  const activationShouldbe= null;
    db.query(sql, [isActive, activationShouldbe, activationHash], (err, result) => {
      if (err) {
        console.error("Error updating the database:", err);
        res.status(500).send("Server error");
        return;
      }
  
      if (result.affectedRows === 0) {
        res.status(404).send("Activation hash not found");
      } else {
        console.log("Account activated successfully");
        res.status(200).send("Account activated successfully");
      }
    });
  });

// Login API
app.post('/login', (req, res) => {
    const { EmailAddress, Password } = req.body;

    if (!EmailAddress || !Password) {
        return res.json({ Status: 'Error', Message: 'Email and Password are required' });
    }

    const sql = 'SELECT * FROM users WHERE EmailAddress = ?';
    db.query(sql, [EmailAddress], async (err, results) => {
        if (err) {
            console.error('Query error:', err);
            return res.json({ Status: 'Error', Message: 'Database error' });
        }

        if (results.length === 0) {
            return res.json({ Status: 'Error', Message: 'User not found' });
        }

        const user = results[0];

        // Compare password
        const match = await bcrypt.compare(Password, user.Password);
        if (!match) {
            return res.json({ Status: 'Error', Message: 'Invalid password' });
        }

        res.json({ Status: 'Success', Message: 'Login successful', User: user });
    });
});

// Start server
app.listen(8081, () => {
    console.log('Server running on http://localhost:8081');
});

  



