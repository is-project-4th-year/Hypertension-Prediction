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

// Login API with OTP
app.post("/login", (req, res) => {
  const { EmailAddress, Password } = req.body;
  if (!EmailAddress || !Password) {
    return res.status(400).json({ Status: "Error", Message: "Email and password are required" });
  }

  const findSql = "SELECT * FROM users WHERE EmailAddress = ?";
  db.query(findSql, [EmailAddress], (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ Status: "Error", Message: "Database error" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ Status: "Error", Message: "User not found" });
    }

    const user = rows[0];
    bcrypt.compare(Password, user.Password, async (err, match) => {
      if (err) {
        console.error("bcrypt error:", err);
        return res.status(500).json({ Status: "Error", Message: "Internal error" });
      }
      if (!match) {
        return res.status(401).json({ Status: "Error", Message: "Invalid password" });
      }

      // Generate & save OTP
      const otp = generateOtp();
      const expiry = nowMs() + FIVE_MIN;

      const updateSql = "UPDATE users SET otp = ?, otp_expiry = ? WHERE userId = ?";
      db.query(updateSql, [otp, expiry, user.userId], async (err2) => {
        if (err2) {
          console.error("DB update error:", err2);
          return res.status(500).json({ Status: "Error", Message: "Could not create OTP" });
        }

        // Send OTP email
        try {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: EmailAddress,
            subject: "Your Login OTP",
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h2>Your OTP Code</h2>
                <p>Use the code below to complete your login:</p>
                <div style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</div>
                <p>This code expires in 5 minutes.</p>
              </div>
            `,
          });
        } catch (mailErr) {
          console.error("Email send error:", mailErr);
          return res.status(500).json({ Status: "Error", Message: "Failed to send OTP email" });
        }

        return res.json({
          Status: "OTP_REQUIRED",
          Message: "OTP sent to your email",
        });
      });
    });
  });
});

// STEP 2: verify OTP
app.post("/verify-otp", (req, res) => {
  const { EmailAddress, otp } = req.body;
  if (!EmailAddress || !otp) {
    return res.status(400).json({ Status: "Error", Message: "Email and OTP are required" });
    }

  const sql = "SELECT userId, userType, otp, otp_expiry FROM users WHERE EmailAddress = ?";
  db.query(sql, [EmailAddress], (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ Status: "Error", Message: "Database error" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ Status: "Error", Message: "User not found" });
    }

    const user = rows[0];
    if (!user.otp || !user.otp_expiry) {
      return res.status(400).json({ Status: "Error", Message: "No OTP pending for this user" });
    }
    if (nowMs() > Number(user.otp_expiry)) {
      return res.status(400).json({ Status: "Error", Message: "OTP expired" });
    }
    if (String(user.otp) !== String(otp)) {
      return res.status(400).json({ Status: "Error", Message: "Invalid OTP" });
    }

    // Clear OTP after success
    const clearSql = "UPDATE users SET otp = NULL, otp_expiry = NULL WHERE userId = ?";
    db.query(clearSql, [user.userId], (err2) => {
      if (err2) {
        console.error("DB clear OTP error:", err2);
        return res.status(500).json({ Status: "Error", Message: "Could not finalize login" });
      }
      // You can also set a session/JWT here if needed.
      return res.json({
        Status: "Success",
        Message: "Login successful",
        userId: user.userId,
        userType: user.userType || "patient",
      });
    });
  });
});


// --- Nodemailer transporter (use Gmail App Password) ---
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER, // e.g. your@gmail.com
    pass: process.env.EMAIL_PASS, // e.g. abcd efgh ijkl mnop (App Password)
  },
});

// --- Helpers ---
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
const nowMs = () => Date.now();
const FIVE_MIN = 5 * 60 * 1000;

// resend OTP
app.post("/resend-otp", (req, res) => {
  const { EmailAddress } = req.body;
  if (!EmailAddress) {
    return res.status(400).json({ Status: "Error", Message: "Email required" });
  }

  const sql = "SELECT userId FROM users WHERE EmailAddress = ?";
  db.query(sql, [EmailAddress], async (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ Status: "Error", Message: "Database error" });
    }
    if (rows.length === 0) {
      return res.status(404).json({ Status: "Error", Message: "User not found" });
    }
    const user = rows[0];

    const otp = generateOtp();
    const expiry = nowMs() + FIVE_MIN;

    const updateSql = "UPDATE users SET otp = ?, otp_expiry = ? WHERE userId = ?";
    db.query(updateSql, [otp, expiry, user.userId], async (err2) => {
      if (err2) {
        console.error("DB update error:", err2);
        return res.status(500).json({ Status: "Error", Message: "Could not create OTP" });
      }

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: EmailAddress,
          subject: "Your Login OTP (Resent)",
          html: `<p>Your new OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`,
        });
      } catch (mailErr) {
        console.error("Email send error:", mailErr);
        return res.status(500).json({ Status: "Error", Message: "Failed to send OTP email" });
      }

      return res.json({ Status: "OTP_REQUIRED", Message: "OTP resent" });
    });
  });
});

