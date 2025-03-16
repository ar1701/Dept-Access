const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const deptAccessSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    department: { 
        type: String, 
        required: true,
        enum: ['CSE', 'CE', 'IT', 'SFE', 'ME', 'EEE', 'EC']  // Only allow these departments
    },
    designation: { 
        type: String, 
        required: true,
        enum: ['Placement Officer', 'HOD', 'Department Access', 'Other']
    },
    phone: { 
        type: Number, 
        required: true,
        unique: true, // Validate phone number format
    },
    accessCode: { 
        type: String, 
        required: true, 
        unique: true 
    },
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Add passport-local-mongoose plugin for username/password handling
deptAccessSchema.plugin(passportLocalMongoose);


const DeptAccess = mongoose.model("DeptAccess", deptAccessSchema);

module.exports = DeptAccess;
