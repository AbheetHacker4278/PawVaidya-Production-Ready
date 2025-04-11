import validator from 'validator';
import argon2 from 'argon2';
import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';
import jwt from 'jsonwebtoken';
import { v2 as coludinary } from 'cloudinary';
import appointmentModel from '../models/appointmentModel.js';
import { transporter } from '../config/nodemailer.js';
import WELCOME_EMAIL from '../mailservice/emailstemplate.js'
import VERIFICATION_EMAIL_TEMPLATE from '../mailservice/emailtemplate2.js'
import { PASSWORD_RESET_REQUEST_TEMPLATE } from '../mailservice/emailtemplate3.js';
import { PASSWORD_RESET_SUCCESS_TEMPLATE } from '../mailservice/emailtemplate4.js';
import moment from 'moment';

export const registeruser = async (req, res) => {
    try {
        const { name, email, password, state, district } = req.body

        if (!name || !email || !password || !state || !district) {
            return res.json({
                success: false,
                message: 'Missing Details'
            })
        }
        if (!state.toUpperCase() || !district.toUpperCase()) {
            return res.json({
                success: false,
                message: 'Write State and District in Capital Letter'
            })
        }
        if (!validator.isEmail(email)) {
            return res.json({
                success: false,
                message: 'Email Format is not valid'
            })
        }
        if (password.length < 8) {
            return res.json({
                success: false,
                message: 'Enter Strong Password'
            })
        }
        const hashedpass = await argon2.hash(password)

        const existinguser = await userModel.findOne({ email })

        if (existinguser) {
            return res.json({
                success: false,
                message: "User Already Exist"
            })
        }

        const userdata = {
            name,
            email,
            password: hashedpass,
            state: state.toUpperCase(),
            district: district.toUpperCase()
        }

        const newuser = new userModel(userdata)
        const user = await newuser.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET,
            { expiresIn: '7d' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7 * 24 * 60 * 1000
        })

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to PawVaidya',
            html: WELCOME_EMAIL
        }
        await transporter.sendMail(mailOptions);

        // Store user data in localStorage for fast retrieval
        const userResponseData = {
            id: user._id,
            name: user.name,
            email: user.email,
            state: user.state,
            district: user.district,
            isAccountverified: user.isAccountverified || false
        }

        res.json({
            success: true,
            token,
            userdata: userResponseData
        })

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({
                success: false,
                message: "User Does Not Exist"
            })
        }
        const isMatch = await argon2.verify(user.password, password)
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET,
                { expiresIn: '7d' }
            )
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 1000
            })

            // Store user data in localStorage for fast retrieval
            const userResponseData = {
                id: user._id,
                name: user.name,
                email: user.email,
                state: user.state,
                district: user.district,
                isAccountverified: user.isAccountverified || false
            }

            res.json({
                success: true,
                token,
                userdata: userResponseData
            })
        }
        else {
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

export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        return res.json({
            success: true,
            message: "Logged Out Successfully"
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const sendVerifyOtp = async (req, res) => {
    try {
        const { userId } = req.body

        const user = await userModel.findById(userId)
        if (user.isAccountverified) {
            return res.json({ success: false, message: "Account Already verified" })
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000))
        user.verifyOtp = otp;
        user.verifyOtpExpiredAt = Date.now() + 24 * 60 * 60 * 1000

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            html: VERIFICATION_EMAIL_TEMPLATE.replace('{otp}', otp)
        };
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Verification OTP sent on Email Successfully" })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body
    if (!userId || !otp) {
        return res.json({
            success: false,
            message: "Missing Details"
        })
    }
    try {
        const user = await userModel.findById(userId)
        if (!user) {
            return res.json({
                success: false,
                message: "user Not Found"
            })
        }
        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({
                success: false,
                message: "Invalid OTP"
            })
        }
        if (user.verifyOtpExpiredAt < Date.now()) {
            return res.json({
                success: false,
                message: "OTP Expired"
            })
        }
        user.isAccountverified = true;
        user.verifyOtp = '';
        user.verifyOtpExpiredAt = 0;

        await user.save()
        
        // Update localStorage with verified status
        const userResponseData = {
            id: user._id,
            name: user.name,
            email: user.email,
            state: user.state,
            district: user.district,
            isAccountverified: true
        }

        res.json({
            success: true,
            message: "Email Verified Successfully",
            userdata: userResponseData
        })
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

export const isAuthenticated = (req, res) => {
    try {
        return res.json({ success: true })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const sendResetOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.json({
            success: false,
            message: "Email is required"
        });
    }
    try {
        const user = await userModel.findOne({
            email
        })
        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            })
        }
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        console.log(`Generated OTP for ${email}: ${otp}`); // Only for debugging in dev mode

        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            html: PASSWORD_RESET_REQUEST_TEMPLATE
                .replace('{otp}', otp)
                .replace('{name}', user.name || 'User')
        };
        await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
            message: "OTP sent to Your Email address successfully"
        })
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

export const resetpassword = async (req, res) => {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
        return res.json({
            success: false,
            message: "Email , OTP , newpassword are required"
        })
    }
    try {
        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({
                success: false,
                message: "User Not Found"
            })
        }
        if (!user.resetOtp || `${user.resetOtp}` !== `${otp}`) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }
        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({
                success: false,
                message: "OTP Expired"
            })
        }
        const hashedpassword = await argon2.hash(password);
        user.password = hashedpassword;
        user.resetOtp = "";
        user.resetOtpExpireAt = 0;

        await user.save()

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            html: PASSWORD_RESET_SUCCESS_TEMPLATE
                .replace('{otp}', otp)
                .replace('{name}', user.name)
        };
        await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
            message: "Password reset Successfully"
        })
    } catch (error) {
        return res.json({
            success: false,
            message: error.message
        })
    }
}

export const getprofile = async (req, res) => {
    try {
        const { userId } = req.body
        const userdata = await userModel.findById(userId).select('-password')

        // Prepare user data for localStorage
        const userResponseData = {
            id: userdata._id,
            name: userdata.name,
            email: userdata.email,
            gender: userdata.gender,
            dob: userdata.dob,
            address: userdata.address,
            phone: userdata.phone,
            full_address: userdata.full_address,
            pet_type: userdata.pet_type,
            pet_age: userdata.pet_age,
            pet_gender: userdata.pet_gender,
            breed: userdata.breed,
            category: userdata.category,
            image: userdata.image,
            isAccountverified: userdata.isAccountverified
        }

        res.json({
            success: true,
            userdata: userResponseData
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const updateprofile = async (req, res) => {
    try {
        const { userId, name, email, gender, dob, address, phone, full_address, pet_type, pet_age, pet_gender, breed, category } = req.body
        const imagefile = req.file

        if (!name || !email || !gender || !dob || !address || !phone || !full_address || !pet_type || !pet_age || !pet_gender || !breed || !category) {
            return res.json({
                success: false,
                message: "Data Missing"
            })
        }
        
        let imageurl;
        if (imagefile) {
            const imageupload = await coludinary.uploader.upload(imagefile.path, { resource_type: 'image' })
            imageurl = imageupload.secure_url
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId, 
            { 
                name, 
                email, 
                gender, 
                dob, 
                address: JSON.parse(address.toUpperCase()), 
                phone, 
                full_address, 
                pet_type, 
                pet_age, 
                pet_gender, 
                breed, 
                category,
                ...(imageurl && { image: imageurl })
            },
            { new: true }
        ).select('-password');

        // Prepare updated user data for localStorage
        const userResponseData = {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            gender: updatedUser.gender,
            dob: updatedUser.dob,
            address: updatedUser.address,
            phone: updatedUser.phone,
            full_address: updatedUser.full_address,
            pet_type: updatedUser.pet_type,
            pet_age: updatedUser.pet_age,
            pet_gender: updatedUser.pet_gender,
            breed: updatedUser.breed,
            category: updatedUser.category,
            image: updatedUser.image,
            isAccountverified: updatedUser.isAccountverified
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            userdata: userResponseData
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export const bookappointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body;
        const meetLink = "https://meet.google.com/qfv-rcwa-sec";

        // Fetch doctor details
        const docData = await doctorModel.findById(docId).select("-password");
        if (!docData) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        if (!docData.available) {
            return res.status(400).json({ success: false, message: 'Doctor is not available' });
        }

        let slots_booked = docData.slots_booked || {};

        // Checking for slot availability
        if (slots_booked[slotDate]?.includes(slotTime)) {
            return res.status(400).json({ success: false, message: 'Slot is already booked' });
        }

        // Add slot booking
        slots_booked[slotDate] = slots_booked[slotDate] || [];
        slots_booked[slotDate].push(slotTime);

        // Fetch user details
        const userData = await userModel.findById(userId).select("-password");
        if (!userData) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prepare appointment data
        const appointmentData = {
            userId,
            docId,
            userData,
            docData: { ...docData.toObject(), slots_booked: undefined }, // Excluding slots_booked
            amount: docData.fees,
            slotTime,
            slotDate,
            meetLink, // Add the meet link to the appointment data
            date: new Date()
        };

        // Save appointment
        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();

        // HTML template for appointment confirmation email
        const appointmentConfirmationHTML = `
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
            background-color: #4CAF50;
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
            background-color: #e1f5fe;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #039be5;
            text-align: center;
        }

        .meet-link a {
            color: #0277bd;
            font-weight: bold;
            text-decoration: none;
        }

        .meet-link a:hover {
            text-decoration: underline;
        }

        .patient-info {
            margin-top: 15px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 5px;
        }

        .signature {
            margin-top: 20px;
            text-align: center;
            color: #4CAF50;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Appointment Confirmation</h2>
    </div>

    <div class="content">
        <p>Dear ${userData.name},</p>

        <p>Your appointment with <strong>Dr. ${docData.name}</strong> has been successfully booked.</p>

        <p><strong>Appointment Details:</strong></p>
        <ul>
            <li><strong>Doctor:</strong> Dr. ${docData.name}</li>
            <li><strong>Date:</strong> ${slotDate}</li>
            <li><strong>Time:</strong> ${slotTime}</li>
            <li><strong>Fee:</strong> ₹${docData.fees}</li>
            <li><strong>Full Address:</strong> ${docData.full_address}</li>
        </ul>

        <div class="meet-link">
            <p><strong>Virtual Consultation:</strong></p>
            <p>Join your appointment through this Google Meet link:</p>
            <p><a href="${meetLink}" target="_blank">${meetLink}</a></p>
            <p>Please click the link at your scheduled time.</p>
        </div>

        <p>Thank you for choosing our service. Please arrive on time for in-person visits or join the virtual meeting link at the scheduled time.</p>

        <div class="signature">
            <p>Best regards,<br/>
            <strong>Pawvaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>`;

        // HTML template for doctor notification email
        const doctorNotificationHTML = `
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
            background-color: #4CAF50;
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
            background-color: #e1f5fe;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid #039be5;
            text-align: center;
        }

        .meet-link a {
            color: #0277bd;
            font-weight: bold;
            text-decoration: none;
        }

        .meet-link a:hover {
            text-decoration: underline;
        }

        .patient-info {
            margin-top: 15px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 5px;
            border-left: 4px solid #9e9e9e;
        }

        .signature {
            margin-top: 20px;
            text-align: center;
            color: #4CAF50;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>New Appointment Booked</h2>
    </div>

    <div class="content">
        <p>Dear Dr. ${docData.name},</p>

        <p>A new appointment has been booked for your services.</p>

        <p><strong>Appointment Details:</strong></p>
        <ul>
            <li><strong>Date:</strong> ${slotDate}</li>
            <li><strong>Time:</strong> ${slotTime}</li>
            <li><strong>Fee:</strong> ₹${docData.fees}</li>
        </ul>

        <div class="patient-info">
            <p><strong>Patient Information:</strong></p>
            <ul>
                <li><strong>Name:</strong> ${userData.name}</li>
                <li><strong>Contact:</strong> ${userData.phone || 'Not provided'}</li>
                <li><strong>Pet Type:</strong> ${userData.pet_type || 'Not provided'}</li>
                <li><strong>Pet Breed:</strong> ${userData.breed || 'Not provided'}</li>
                <li><strong>Pet Age:</strong> ${userData.pet_age || 'Not provided'}</li>
                <li><strong>Pet Gender:</strong> ${userData.pet_gender || 'Not provided'}</li>
            </ul>
        </div>

        <div class="meet-link">
            <p><strong>Virtual Consultation:</strong></p>
            <p>Join this appointment through this Google Meet link:</p>
            <p><a href="${meetLink}" target="_blank">${meetLink}</a></p>
            <p>Please click the link at the scheduled time.</p>
        </div>

        <p>Please ensure you're available for this appointment. If you need to cancel or reschedule, please do so through the doctor portal as soon as possible.</p>

        <div class="signature">
            <p>Best regards,<br/>
            <strong>Pawvaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>`;

        // Send confirmation email to the user
        const userMailOptions = {
            from: process.env.SENDER_EMAIL,
            to: userData.email,
            subject: 'Appointment Confirmation',
            html: appointmentConfirmationHTML
        };
        await transporter.sendMail(userMailOptions);

        // Send notification email to the doctor
        const doctorMailOptions = {
            from: process.env.SENDER_EMAIL,
            to: docData.email, // Send to doctor's email
            subject: 'New Appointment Booked',
            html: doctorNotificationHTML
        };
        await transporter.sendMail(doctorMailOptions);

        // Update doctor's booked slots
        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        res.status(200).json({ 
            success: true, 
            message: 'Appointment booked successfully',
            appointmentData: newAppointment 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        // Verify appointment user 
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        // Releasing doctor slot 
        const { docId, slotDate, slotTime } = appointmentData;

        const doctorData = await doctorModel.findById(docId);
        const userData = await userModel.findById(userId);

        let slots_booked = doctorData.slots_booked;

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);

        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        // Send cancellation email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: userData.email,
            subject: 'Appointment Cancellation Confirmation',
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

        .leaf {
            position: absolute;
            width: 30px;
            height: 30px;
            color: #dc3545;
        }

        .butterfly {
            position: absolute;
            width: 20px;
            height: 20px;
            color: #c34a4a;
        }

        .paw {
            position: absolute;
            width: 25px;
            height: 25px;
            color: #bb6a6a;
        }

        .signature {
            margin-top: 20px;
            text-align: center;
            color: #dc3545;
        }

        .note {
            margin-top: 15px;
            padding: 10px;
            background-color: #fff3f3;
            border-left: 4px solid #dc3545;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Appointment Cancellation Confirmation</h2>
    </div>

    <div class="content">
        <p>Dear ${userData.name},</p>

        <p>Your appointment with <strong>Dr. ${appointmentData.docData.name}</strong> has been successfully cancelled.</p>

        <p><strong>Cancelled Appointment Details:</strong></p>
        <ul>
            <li><strong>Doctor:</strong> Dr. ${appointmentData.docData.name}</li>
            <li><strong>Date:</strong> ${slotDate}</li>
            <li><strong>Time:</strong> ${slotTime}</li>
            <li><strong>Fee:</strong> ₹${appointmentData.amount}</li>
            <li><strong>Full Address:</strong> ${appointmentData.docData.full_address}</li>
        </ul>

        <div class="note">
            <p>If you wish to book another appointment, please visit our website and schedule at your convenience.</p>
        </div>

        <p>If you have any questions or need further assistance, please don't hesitate to contact us.</p>

        <div class="signature">
            <p>Best regards,<br/>
            <strong>Pawvaidya Team</strong> 🐾</p>
        </div>
    </div>
</body>
</html>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: 'Appointment Cancelled' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export const getuserdata = async (req, res) => {
    try {
        const { userId } = req.body

        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            })
        }
        res.json({
            success: true,
            userData: {
                name: user.name,
                isAccountverified: user.isAccountverified
            }
        })
    } catch (error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}

export default registeruser