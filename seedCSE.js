const mongoose = require('mongoose');
const CSE = require('./model/CSE');
require('dotenv').config();

const DB_URL = process.env.DB_URL;

const dummyData = [
    {
        name: "Arun Kumar",
        email: "arun.k@example.com",
        phone: "9876543210",
        registrationNumber: "CSE22001",
        branch: "CSE",
        semester: 4,
        yearOfAdmission: 2022,
        lastSemGPA: 8.5,
        cgpa: 8.7,
        feeDue: "No",
        fatherName: "Rajesh Kumar",
        verified: "Yes",
        username: "CSE22001"
    },
    {
        name: "Priya Singh",
        email: "priya.s@example.com",
        phone: "9876543211",
        registrationNumber: "CSE22002",
        branch: "CSE",
        semester: 4,
        yearOfAdmission: 2022,
        lastSemGPA: 9.1,
        cgpa: 9.0,
        feeDue: "No",
        fatherName: "Amit Singh",
        verified: "Yes",
        username: "CSE22002"
    },
    {
        name: "Mohammed Ali",
        email: "mohammed.a@example.com",
        phone: "9876543212",
        registrationNumber: "CSE21001",
        branch: "CSE",
        semester: 6,
        yearOfAdmission: 2021,
        lastSemGPA: 7.8,
        cgpa: 8.0,
        feeDue: "Yes",
        fatherName: "Ahmed Ali",
        verified: "No",
        username: "CSE21001"
    },
    // ... Add more entries following the same pattern
    {
        name: "Sneha Patel",
        email: "sneha.p@example.com",
        phone: "9876543213",
        registrationNumber: "CSE21002",
        branch: "CSE",
        semester: 6,
        yearOfAdmission: 2021,
        lastSemGPA: 8.9,
        cgpa: 8.8,
        feeDue: "No",
        fatherName: "Rakesh Patel",
        verified: "Yes",
        username: "CSE21002"
    },
    {
        name: "Rahul Sharma",
        email: "rahul.s@example.com",
        phone: "9876543214",
        registrationNumber: "CSE20001",
        branch: "CSE",
        semester: 8,
        yearOfAdmission: 2020,
        lastSemGPA: 7.5,
        cgpa: 7.8,
        feeDue: "Yes",
        fatherName: "Suresh Sharma",
        verified: "Yes",
        username: "CSE20001"
    },
    // ... Continue with more entries
];

// Generate more dummy data programmatically
for (let i = 6; i <= 40; i++) {
    const year = 2020 + Math.floor(Math.random() * 4); // Random year between 2020-2023
    const semester = Math.ceil((2024 - year) * 2); // Calculate semester based on year
    const regNo = `CSE${year.toString().slice(-2)}${i.toString().padStart(3, '0')}`;
    
    dummyData.push({
        name: `Student ${i}`,
        email: `student${i}@example.com`,
        phone: `98765432${i.toString().padStart(2, '0')}`,
        registrationNumber: regNo,
        branch: "CSE",
        semester: semester,
        yearOfAdmission: year,
        lastSemGPA: (6 + Math.random() * 4).toFixed(1), // Random GPA between 6-10
        cgpa: (6 + Math.random() * 4).toFixed(1), // Random CGPA between 6-10
        feeDue: Math.random() > 0.7 ? "Yes" : "No", // 30% chance of fee due
        fatherName: `Father ${i}`,
        verified: Math.random() > 0.2 ? "Yes" : "No", // 80% chance of being verified
        username: regNo  // Using registration number as username
    });
}

async function seedDB() {
    try {
        await mongoose.connect(DB_URL);
        console.log("Connected to MongoDB");

        // Clear existing data
        await CSE.deleteMany({});
        console.log("Cleared existing CSE records");

        // Register each student with a password
        for (const student of dummyData) {
            try {
                const newStudent = new CSE(student);
                // Set password same as username for testing
                await CSE.register(newStudent, student.username);
                console.log(`Added student: ${student.name}`);
            } catch (err) {
                console.error(`Error adding student ${student.name}:`, err.message);
            }
        }

        console.log("Added all dummy CSE records");
        mongoose.connection.close();
        console.log("Database connection closed");
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
}

seedDB(); 