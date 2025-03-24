import express from 'express';
import { addDoctor, allDoctors, loginAdmin , appointmenetsAdmin, Appointmentcancel, admindashboard, allUsers, deleteUser, editUser, deleteDoctor } from '../controllers/adminController.js';
import upload from '../middleware/multer.js';
import authAdmin from '../middleware/authAdmin.js';
import changeavailablity  from '../controllers/doctorContorller.js';

const adminRouter = express.Router();

adminRouter.post('/add-doctor',authAdmin ,upload.single('image'), addDoctor);
adminRouter.post('/login' ,loginAdmin);
adminRouter.post('/all-doctors' ,authAdmin, allDoctors)
adminRouter.post('/change-availablity' ,authAdmin, changeavailablity)
adminRouter.get('/appointments' ,authAdmin, appointmenetsAdmin)
adminRouter.post('/cancel-appointment' ,authAdmin, Appointmentcancel)
adminRouter.get('/dashboard' ,authAdmin, admindashboard)
adminRouter.get('/all-users' ,authAdmin, allUsers)
adminRouter.delete('/users/:userId', authAdmin, deleteUser);
adminRouter.put('/users/:userId', authAdmin, upload.single('image'), editUser);
adminRouter.delete('/doctors/:doctorId', authAdmin, deleteDoctor);
export default adminRouter
