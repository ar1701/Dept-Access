if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();
const DB_URL = process.env.DB_URL;
const ce = require("./model/CE");
const cse = require("./model/CSE");
const it = require("./model/IT");
const sfe = require("./model/SFE");
const me = require("./model/ME");
const eee = require("./model/EEE");
const ec = require("./model/EC");
const facultyInfo = require("./model/facultySchema");
const bodyParser = require("body-parser");
const DeptAccess = require("./model/deptAccess");
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');

// MongoDB Atlas connection
async function connectDB() {
  try {
    await mongoose.connect(DB_URL);
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
}

connectDB();

// Configure middleware
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add session and passport configuration before your routes
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 1 week
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

// Initialize Passport and Session
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport
passport.use(new LocalStrategy(DeptAccess.authenticate()));
passport.serializeUser(DeptAccess.serializeUser());
passport.deserializeUser(DeptAccess.deserializeUser());

// Middleware to make current user available in templates
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

// Authentication middleware
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }
    next();
};

app.get("/home", isLoggedIn, async (req, res) => {
  try {
    const branchModels = {
        CE: ce,
        CSE: cse,
        IT: it,
        SFE: sfe,
        ME: me,
        EEE: eee,
        EC: ec,
    };
    const branch = branchModels[req.user.department];
    const allInfo = await branch.find();
  res.render("home", { allInfo });
  } catch (error) {
    console.error("Error in home route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
);

// Routes
app.get("/main", (req, res) => {
  res.render("main");
});

app.get("/login", (req, res) => {
  res.render("login");
} );

app.post("/main", async (req, res) => {
  try {
    const { name, department, designation, phone, accessCode, username, password } = req.body;
    
    // Check if user already exists with exact same details
    const existingUser = await DeptAccess.findOne({
      $and: [
        { name: name },
        { department: department },
        { designation: designation },
        { phone: phone },
        { accessCode: accessCode }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with these exact details already exists"
      });
    }

    // Check for any conflicts in unique fields
    const uniqueFieldConflicts = await DeptAccess.findOne({
      $or: [
        { username: username },
        { phone: phone },
        { accessCode: accessCode }
      ]
    });

    if (uniqueFieldConflicts) {
      const conflicts = [];
      if (uniqueFieldConflicts.username === username) conflicts.push("username");
      if (uniqueFieldConflicts.phone === phone) conflicts.push("phone");
      if (uniqueFieldConflicts.accessCode === accessCode) conflicts.push("access code");
      
      return res.status(409).json({
        success: false,
        message: `Another user exists with the same ${conflicts.join(", ")}`
      });
    }

    // If no conflicts, create new department access user
    const deptUser = new DeptAccess({
      name,
      department,
      designation,
      phone,
      accessCode,
      username
    });

    // Register with passport-local-mongoose
    await DeptAccess.register(deptUser, password);

    // Update last login time
    deptUser.lastLogin = new Date();
    await deptUser.save();

    // After successful registration, log the user in
    req.login(deptUser, (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Error logging in after registration" 
        });
      }
      res.redirect("/info");
    });

  } catch (error) {
    console.error("Error in registration:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error", 
      error: error.message 
    });
  }
});

// Backend Routes
// Get single student
app.get('/students/:branch/:id', async (req, res) => {
  try {
      const branchModel = {
          CE: ce, CSE: cse, IT: it, SFE: sfe, 
          ME: me, EEE: eee, EC: ec
      }[req.params.branch];
      
      const student = await branchModel.findById(req.params.id);
      res.json(student);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Update student
app.put('/students/:branch/:id', async (req, res) => {
  try {
      const branchModel = {
          CE: ce, CSE: cse, IT: it, SFE: sfe, 
          ME: me, EEE: eee, EC: ec
      }[req.params.branch];
      
      // If registration number is being updated, update username too
      if (req.body.registrationNumber) {
          req.body.username = req.body.registrationNumber;
      }

      const student = await branchModel.findByIdAndUpdate(
          req.params.id, 
          req.body, 
          { new: true }
      );
      res.json(student);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Delete student
app.delete('/students/:branch/:id', async (req, res) => {
  try {
      const branchModel = {
          CE: ce, CSE: cse, IT: it, SFE: sfe, 
          ME: me, EEE: eee, EC: ec
      }[req.params.branch];
      
      await branchModel.findByIdAndDelete(req.params.id);
      res.json({ success: true });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

app.get('/students/:branch', async (req, res) => {
  try {
      const { filter, value } = req.query;
      const branchModel = {
          CE: ce, CSE: cse, IT: it, SFE: sfe, 
          ME: me, EEE: eee, EC: ec
      }[req.params.branch];

      let query = {};
      if (filter && value) {
          switch(filter) {
              case 'year':
                  query.yearOfAdmission = value;
                  break;
              case 'fee':
                  query.feeDue = value;
                  break;
              case 'verified':
                  query.verified = value;
                  break;
          }
      }

      const students = await branchModel.find(query);
      res.json(students);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});
// Create student
app.post('/students/:branch', async (req, res) => {
  try {
      const branchModel = {
          CE: ce, CSE: cse, IT: it, SFE: sfe, 
          ME: me, EEE: eee, EC: ec
      }[req.params.branch];
      
      const student = new branchModel(req.body);
      await student.save();
      res.json(student);
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


app.get("/new", isLoggedIn, (req, res) => {
  res.render("new");
});

app.post("/new", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      registrationNumber,
      branch,
      semester,
      yearOfAdmission,
      lastSemGPA,
      cgpa,
      feeDue,
      fatherName
    } = req.body;

    // Validate required fields
    if (!registrationNumber || !branch) {
      return res.status(400).json({
        success: false,
        message: "Registration number and branch are required"
      });
    }

    const branchModels = {
      CSE: cse,
      CE: ce,
      IT: it,
      SFE: sfe,
      ME: me,
      EEE: eee,
      EC: ec
    };

    const StudentModel = branchModels[branch.toUpperCase()];

    if (!StudentModel) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch specified",
        validBranches: Object.keys(branchModels)
      });
    }

    // Check for existing student
    const existingStudent = await StudentModel.findOne({
      $or: [
        { registrationNumber },
        { email },
        { phone }
      ]
    });

    if (existingStudent) {
      const conflicts = [];
      if (existingStudent.registrationNumber === registrationNumber) conflicts.push("registration number");
      if (existingStudent.email === email) conflicts.push("email");
      if (existingStudent.phone === phone) conflicts.push("phone");
      
      return res.status(409).json({
        success: false,
        message: `Student with same ${conflicts.join(", ")} already exists`
      });
    }

    // Create new student document
    const newStudent = new StudentModel({
      name,
      email,
      phone,
      registrationNumber,
      branch: branch.toUpperCase(),
      semester,
      yearOfAdmission,
      lastSemGPA,
      cgpa,
      feeDue,
      fatherName,
      username: registrationNumber,
      verified: "No"
    });

    // Register with passport-local-mongoose
    await StudentModel.register(newStudent, registrationNumber, (err, student) => {
      if (err) {
        console.error("Registration error:", err);
        return res.status(500).json({
          success: false,
          message: "Error during registration",
          error: err.message
        });
      }

     res.redirect("/info");
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});



// Modify the login route
app.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // First, find user in DeptAccess by username
    const deptUser = await DeptAccess.findOne({ username });
    if (!deptUser) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Then, find matching faculty in FacultyAccess using accessCode
    const faculty = await facultyInfo.findOne({ 
      accessCode: deptUser.accessCode,
      name: deptUser.name,
      department: deptUser.department,
      designation: deptUser.designation,
      phone: deptUser.phone
    });

    if (!faculty) {
      return res.status(401).json({ 
        success: false, 
        message: "Faculty verification failed" 
      });
    }

    // If both checks pass, proceed with passport authentication
    passport.authenticate('local', async (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid username or password" 
        });
      }

      req.logIn(user, async (err) => {
        if (err) {
          return next(err);
        }

        // Update last login time
        user.lastLogin = new Date();
        await user.save();

        // Store user details in session
        req.session.user = {
          id: user._id,
          username: user.username,
          department: user.department,
          name: user.name,
          designation: user.designation
        };

        // Get department data and render info page
        const branchModels = {
          CE: ce,
          CSE: cse,
          IT: it,
          SFE: sfe,
          ME: me,
          EEE: eee,
          EC: ec,
        };
        const branch = branchModels[user.department];
        const allInfo = await branch.find();

        res.redirect("/home");
      });
    })(req, res, next);

  } catch (error) {
    console.error("Error in login route:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error", 
      error: error.message 
    });
  }
});

// Add logout route
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      res.redirect("/login");
    });
  });
});
// Protect routes that require authentication
app.get("/info", isLoggedIn, async (req, res) => {
    try {
        const branchModels = {
            CE: ce,
            CSE: cse,
            IT: it,
            SFE: sfe,
            ME: me,
            EEE: eee,
            EC: ec,
        };
        const branch = branchModels[req.user.department];
        const allInfo = await branch.find();

        res.render("info", { allInfo });
    } catch (error) {
        console.error("Error in info route:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("*", (req, res) => {
  res.redirect("/login");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
