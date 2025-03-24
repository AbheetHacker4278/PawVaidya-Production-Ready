import validator from 'validator';
import bcryptjs from 'bcryptjs';
import argon2 from "argon2";
import { v2 as cloudinary } from 'cloudinary';
import doctorModel from '../models/doctorModel.js';
import jwt from 'jsonwebtoken';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';

// API for adding a doctor
export const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, docphone , address, full_address } = req.body;
        const imageFile = req.file;

        // Validate required fields
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !docphone || !address || !full_address) {
            return res.json({
                success: false,
                message: "Missing required Fields",
            });
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({
                success: false,
                message: "Invalid email format",
            });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.json({
                success: false,
                message: "Use a strong password",
            });
        }

        // Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await argon2.hash(password, salt);

        // Upload image to Cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
        const imageUrl = imageUpload.secure_url;

        // Create doctor data
        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            docphone,
            address: JSON.parse(address),
            full_address,
            date: Date.now(),
        };

        // Save doctor to the database
        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();

        // Send a success response
        res.status(200).json({
            success: true,
            message: "Doctor added successfully",
            data: {
                name,
                email,
                hashedPassword,
                speciality,
                degree,
                experience,
                about,
                fees,
                docphone,
                address,
                full_address,
            },
        });
    } catch (error) {
        console.error("Error adding doctor:", error.message);

        // Send an error response
        res.status(500).json({
            success: false,
            message: "Failed to add doctor",
            error: error.message,
        });
    }
};


// API to delete a doctor
export const deleteDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        
        // Check if doctor exists
        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        // Check for associated appointments
        const doctorAppointments = await appointmentModel.find({ docId: doctorId });
        
        // Delete associated appointments
        if (doctorAppointments.length > 0) {
            await appointmentModel.deleteMany({ docId: doctorId });
        }

        // Delete the doctor's image from Cloudinary if exists
        if (doctor.image && doctor.image.includes('cloudinary')) {
            const publicId = doctor.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        // Delete the doctor
        await doctorModel.findByIdAndDelete(doctorId);
        
        res.json({
            success: true,
            message: "Doctor deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting doctor:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete doctor",
            error: error.message
        });
    }
};




// API for admin login
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate admin credentials
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

            res.json({
                success: true,
                token,
            });
        } else {
            res.json({
                success: false,
                message: "Invalid email or password",
            });
        }
    } catch (error) {
        console.error("Error logging in admin:", error.message);

        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

export const allDoctors = async (req , res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password')
        res.json({success: true , doctors})
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}  
export const allUsers = async (req , res) => {
    try {
        const users = await userModel.find({}).select('-password -resetOtpExpireAt -verifyOtpExpiredAt -verifyOtpVerified -verifyOtp -resetOtp');
        res.json({success: true , users})
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
}  

// API to delete a user
export const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check for associated appointments
        const userAppointments = await appointmentModel.find({ userId });
        
        // Delete associated appointments
        if (userAppointments.length > 0) {
            await appointmentModel.deleteMany({ userId });
        }

        // Delete the user
        await userModel.findByIdAndDelete(userId);
        
        res.json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting user:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: error.message
        });
    }
};

// API to edit a user
export const editUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;
        
        // Check if user exists
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Validate email if it's being updated
        if (updateData.email && !validator.isEmail(updateData.email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Handle password update if provided
        if (updateData.password) {
            // Validate password strength
            if (updateData.password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 8 characters long"
                });
            }

            // Hash the new password
            const salt = await bcryptjs.genSalt(10);
            updateData.password = await argon2.hash(updateData.password, salt);
        }

        // Handle image upload if provide
        if (req.file) {
            const imageUpload = await cloudinary.uploader.upload(req.file.path, { resource_type: 'image' });
            updateData.image = imageUpload.secure_url;
        }

        // Update user in database
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true }
        ).select('-password -resetOtpExpireAt -verifyOtpExpiredAt -verifyOtpVerified -verifyOtp -resetOtp');
        
        res.json({
            success: true,
            message: "User updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error updating user:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to update user",
            error: error.message
        });
    }
};


// API to get dashboard data for admin panel
export const appointmenetsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({})
        res.json({
            success: true,
            appointments
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//APi for cancle appointment
export const Appointmentcancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctor slot 
        const { docId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export const admindashboard = async (req, res) => {
    try {
        // Fetch counts directly
        const doctorsCount = await doctorModel.countDocuments({});
        const usersCount = await userModel.countDocuments({});
        const appointmentsCount = await appointmentModel.countDocuments({});
        const canceledAppointmentCount = await appointmentModel.countDocuments({ cancelled: true });
        const completedAppointmentCount = await appointmentModel.countDocuments({ isCompleted: true });

        // Fetch latest 5 appointments
        const latestAppointments = await appointmentModel
            .find({})
            .sort({ createdAt: -1 })
            .limit(5);

        // Fetch latest 5 cancelled appointments
        const cancelledAppointments = await appointmentModel
            .find({ cancelled: true })
            .sort({ createdAt: -1 })
            .limit(5);

        // Fetch latest 5 completed appointments
        const completedAppointments = await appointmentModel
            .find({ isCompleted: true })
            .sort({ createdAt: -1 })
            .limit(5);

        // Aggregate appointments per user
        const userAppointments = await appointmentModel.aggregate([
            {
                $group: {
                    _id: "$userId", // Group by user ID
                    totalAppointments: { $sum: 1 }, // Count appointments
                },
            },
            {
                $addFields: {
                    userObjectId: { $toObjectId: "$_id" }, // Convert userId to ObjectId
                },
            },
            {
                $lookup: {
                    from: "users", // Name of the users collection
                    localField: "userObjectId", // Match converted ObjectId to `_id` in users
                    foreignField: "_id",
                    as: "userInfo",
                },
            },
            {
                $unwind: "$userInfo", // Flatten the userInfo array
            },
            {
                $project: {
                    userId: "$userInfo._id",
                    name: "$userInfo.name",
                    email: "$userInfo.email",
                    totalAppointments: 1,
                },
            },
        ]);

        // Prepare dashboard data
        const dashdata = {
            doctors: doctorsCount,
            appointments: appointmentsCount,
            patients: usersCount,
            canceledAppointmentCount,
            completedAppointmentCount,
            latestAppointments,
            cancelledAppointments,
            completedAppointments,
            userAppointments, // Include the user appointment stats
        };

        res.json({ success: true, dashdata });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ success: false, message: "Server Error. Please try again later." });
    }
};


