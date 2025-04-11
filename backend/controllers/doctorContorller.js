import doctorModel from "../models/doctorModel.js"
import userModel from '../models/userModel.js';
import { transporter } from '../config/nodemailer.js';
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"
export const changeavailablity = async (req , res) => {
    try {
        const { docId } = req.body
        const docdata = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId , {available: !docdata.available})
        res.json({success: true , 
            message:'Availablity changed'
        })
    } catch (error) {
        console.log(error)
        res.json({success:false,
            message: error.message
        })
    } 
}
export const doctorslist = async (req , res) => {
    try{
        const doctors = await doctorModel.find({}).select(['-password' , '-email'])
        res.json({
            success: true,
            doctors
        })
    }catch(error){
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const logindoctor = async (req , res) => {
    try {
        const { email , password } = req.body
        const doctor = await doctorModel.findOne({email})
        if(!doctor){
            res.json({
                success: false,
                message: "Invalid Credentials"
            })
        }
        const isMatch = await argon2.verify(doctor.password , password)

        if(isMatch){
            const token = jwt.sign({id: doctor._id} , process.env.JWT_SECRET)
            res.json({
                success: true,
                token
            })
        }
        else{
            res.json({
                success: false,
                message: "Invalid Credentials"
            })
        }
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const appointmentsDoctor = async (req , res) => {
    try {

        const { docId } = req.body
        const appointments = await appointmentModel.find({ docId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export const appointmentComplete = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);
        const meetLink = appointmentData.meetLink || "https://meet.google.com/qfv-rcwa-sec";
        
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        if (appointmentData.docId !== docId) {
            return res.json({ success: false, message: 'Unauthorized action' });
        }

        // Get user and doctor data for the email
        const userData = await userModel.findById(appointmentData.userId);
        const doctorData = await doctorModel.findById(docId);

        // Update appointment status
        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });

        // Send completion confirmation email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: userData.email,
            subject: 'Appointment Completion Confirmation',
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #f9fff9;
            border-radius: 10px;
            position: relative;
        }

        .header {
            background-color: #28a745;
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
            margin: -20px -20px 20px -20px;
        }

        .content {
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        ul {
            list-style: none;
            padding-left: 0;
        }

        li {
            margin: 10px 0;
            padding: 10px;
            background-color: #f0f8f0;
            border-radius: 5px;
        }

        .meet-link {
            background-color: #e8f5e9;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #43a047;
            text-align: center;
            text-decoration: line-through;
        }

        .signature {
            margin-top: 20px;
            text-align: center;
            color: #28a745;
        }

        .thank-you-note {
            margin-top: 15px;
            padding: 10px;
            background-color: #f0f8f0;
            border-left: 4px solid #28a745;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Appointment Completed</h2>
    </div>

    <div class="content">
        <p>Dear ${userData.name},</p>

        <p>Your appointment with <strong>Dr. ${doctorData.name}</strong> has been successfully completed.</p>

        <p><strong>Appointment Details:</strong></p>
        <ul>
            <li><strong>Doctor:</strong> Dr. ${doctorData.name}</li>
            <li><strong>Date:</strong> ${appointmentData.slotDate}</li>
            <li><strong>Time:</strong> ${appointmentData.slotTime}</li>
            <li><strong>Fee:</strong> ₹${appointmentData.amount}</li>
        </ul>

        <div class="meet-link">
            <p><strong>Virtual Consultation Link (Session Ended):</strong></p>
            <p>${meetLink}</p>
            <p>This virtual meeting has now ended.</p>
        </div>

        <div class="thank-you-note">
            <p>Thank you for choosing PawVaidya for your pet's healthcare needs. We hope you and your pet had a great experience.</p>
            <p>If you have any feedback or concerns about your visit, please don't hesitate to reach out to us.</p>
        </div>

        <p>We look forward to serving you and your pet again!</p>

        <div class="signature">
            <p>Best regards,<br/>
            <strong>PawVaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: 'Appointment Completed' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export const appointmentCancel = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' });
        }

        if (appointmentData.docId !== docId) {
            return res.json({ success: false, message: 'Unauthorized action' });
        }

        // Get user and doctor data for the email
        const userData = await userModel.findById(appointmentData.userId);
        const doctorData = await doctorModel.findById(docId);

        // Update doctor's slots_booked to remove the cancelled slot
        const slots_booked = doctorData.slots_booked;
        slots_booked[appointmentData.slotDate] = slots_booked[appointmentData.slotDate]
            .filter(time => time !== appointmentData.slotTime);
        
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        // Send cancellation email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: userData.email,
            subject: 'Appointment Cancellation Notice',
            html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #fff9f9;
            border-radius: 10px;
            position: relative;
        }

        .header {
            background-color: #dc3545;
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            text-align: center;
            margin: -20px -20px 20px -20px;
        }

        .content {
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        ul {
            list-style: none;
            padding-left: 0;
        }

        li {
            margin: 10px 0;
            padding: 10px;
            background-color: #f8f0f0;
            border-radius: 5px;
        }

        .signature {
            margin-top: 20px;
            text-align: center;
            color: #dc3545;
        }

        .apology-note {
            margin-top: 15px;
            padding: 10px;
            background-color: #fff3f3;
            border-left: 4px solid #dc3545;
            border-radius: 4px;
        }

        .rebook-info {
            margin-top: 15px;
            padding: 10px;
            background-color: #f0f8f0;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Important: Appointment Cancellation Notice</h2>
    </div>

    <div class="content">
        <p>Dear ${userData.name},</p>

        <p>We regret to inform you that your appointment with <strong>Dr. ${doctorData.name}</strong> has been cancelled due to an unexpectedly high patient load.</p>

        <p><strong>Cancelled Appointment Details:</strong></p>
        <ul>
            <li><strong>Doctor:</strong> Dr. ${doctorData.name}</li>
            <li><strong>Date:</strong> ${appointmentData.slotDate}</li>
            <li><strong>Time:</strong> ${appointmentData.slotTime}</li>
            <li><strong>Fee:</strong> ₹${appointmentData.amount}</li>
        </ul>

        <div class="apology-note">
            <p>We sincerely apologize for any inconvenience this may cause. Dr. ${doctorData.name} had to make this difficult decision to ensure the quality of care for all patients.</p>
        </div>

        <div class="rebook-info">
            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>You can rebook your appointment for a different time slot through our website</li>
                <li>Consider booking with another available veterinarian if your need is urgent</li>
                <li>Contact our support team if you need any assistance</li>
            </ul>
        </div>

        <p>We value your trust in PawVaidya and are committed to providing the best care for your pet.</p>

        <div class="signature">
            <p>Best regards,<br/>
            <strong>PawVaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>
            `
        };

        await transporter.sendMail(mailOptions);

        return res.json({ success: true, message: 'Appointment Cancelled' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export const doctorDashboard = async (req, res) => {
    try {
        const { docId } = req.body;

        if (!docId) {
            return res.json({ success: false, message: "Doctor ID is required." });
        }

        // Fetch all appointments for the given doctor ID
        const appointments = await appointmentModel.find({ docId });

        // Initialize counters and arrays for tracking appointments
        let earnings = 0;
        const cancelledAppointments = [];
        const completedAppointments = [];
        const latestAppointments = [];

        // Iterate through the appointments to calculate earnings and segregate data
        appointments.forEach((item) => {
            // Calculate earnings for completed appointments
            if (item.isCompleted) {
                earnings += item.amount || 0; // Default to 0 if `amount` is undefined
                completedAppointments.push(item);
            }

            // Track canceled appointments
            if (item.cancelled) {
                cancelledAppointments.push(item);
            }

            // Add all appointments to the latest list
            latestAppointments.push(item);
        });

        // Collect unique patient IDs
        const patients = new Set();
        appointments.forEach((item) => {
            patients.add(item.userId.toString()); // Ensure `userId` is handled as a string
        });

        // Prepare dashboard data
        const dashData = {
            appointments: appointments.length, // Total number of appointments
            patients: patients.size, // Unique patient count
            latestAppointments: latestAppointments.reverse(), // Reverse for latest first
            latestCancelled: cancelledAppointments.reverse(), // Latest canceled appointments
            earnings, // Total earnings from completed appointments
            canceledAppointmentCount: cancelledAppointments.length, // Total canceled appointments count
            completedAppointmentCount: completedAppointments.length, // Total completed appointments count
        };

        // Send the response with dashboard data
        res.json({ success: true, dashData });
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(500).json({ success: false, message: error.message });
    }
};



export const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export const updateDoctorProfile = async (req, res) => {
    try {
        const { docId, fees, address, available, about, full_address, experience, docphone } = req.body;
        const imagefile = req.file; // Handled by multer middleware

        // Parse address if it's a string
        let parsedAddress = address;
        if (typeof address === 'string') {
            try {
                parsedAddress = JSON.parse(address);
            } catch (parseError) {
                console.error('Failed to parse address:', parseError.message);
                return res.status(400).json({ success: false, message: 'Invalid address format' });
            }
        }

        // Update doctor profile details
        await doctorModel.findByIdAndUpdate(docId, {
            fees,
            address: parsedAddress,
            available,
            about,
            full_address,
            experience,
            docphone,
        });

        // Handle image upload if imagefile exists
        if (imagefile) {
            const imageupload = await coludinary.uploader.upload(imagefile.path, {
                resource_type: 'image',
            });
            const imageurl = imageupload.secure_url;

            await doctorModel.findByIdAndUpdate(docId, { image: imageurl });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
        });

    } catch (error) {
        console.error('Error updating profile:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
        });
    }
};
export default changeavailablity