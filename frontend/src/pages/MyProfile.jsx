import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import assets from '../assets/assets_frontend/assets';
import axios from "axios";
import { toast } from "react-toastify";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PawPrint, User, MapPin, Phone, Mail, Calendar, Edit, Save, Upload, Clipboard, Heart, AlertCircle, Loader2 } from "lucide-react";
import AnimalHealthChatbot from "../components/AnimalHealthChatbot";

const MyProfile = () => {
  const apiKey = import.meta.env.VITE_API_KEY || "AIzaSyCQuejQ2bIvTYqtNXsXpMjzWAw9zfYpeKo";
  const modelName = import.meta.env.VITE_MODEL_NAME || "gemini-1.5-flash";
  const prompt = import.meta.env.VITE_PROMPT || "Daily Tips for Pets and Pet Owners in a helpful and positive way. Provide one line of advice.";

  const { userdata, setuserdata, token, backendurl, loaduserprofiledata } = useContext(AppContext);

  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState(false);
  const [dailyQuote, setDailyQuote] = useState("Loading...");
  const [isSaving, setIsSaving] = useState(false);

  const updateUserProfileData = async () => {
    try {
      setIsSaving(true);

      const formdata = new FormData();
      formdata.append('name', userdata.name);
      formdata.append('phone', userdata.phone);
      formdata.append('address', JSON.stringify(userdata.address));
      formdata.append('full_address', userdata.full_address);
      formdata.append('gender', userdata.gender);
      formdata.append('dob', userdata.dob);
      formdata.append('pet_type', userdata.pet_type);
      formdata.append('pet_gender', userdata.pet_gender);
      formdata.append('breed', userdata.breed);
      formdata.append('category', userdata.category);
      formdata.append('pet_age', userdata.pet_age);

      image && formdata.append('image', image);

      const { data } = await axios.post(
        `${backendurl}/api/user/update-profile`,
        formdata,
        { headers: { token } }
      );

      if (data.success) {
        await loaduserprofiledata();
        toast.success(data.message);
        setIsEdit(false);
        setImage(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const setupDailyContentGeneration = async () => {
    try {
      if (!apiKey || !modelName) {
        console.error("API key or model name is missing");
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);

      const generateContent = async () => {
        try {
          const model = await genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          setDailyQuote(result.response.text || "No content available.");
        } catch (error) {
          console.error("Error generating content:", error);
          setDailyQuote("Failed to load daily content.");
        }
      };

      await generateContent();
    } catch (error) {
      console.error("Error setting up daily content generation:", error);
    }
  };

  useEffect(() => {
    setupDailyContentGeneration();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const InfoItem = ({ icon, label, value, editComponent }) => {
    const Icon = icon;
    return (
      <div className="flex items-start p-3 border-b border-gray-100 hover:bg-gray-50 rounded transition-colors">
        <div className="p-2 rounded-full bg-[#f8f3f1] mr-3">
          <Icon size={18} className="text-[#9a6458]" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500">{label}</p>
          <div className="mt-1">
            {isEdit ? editComponent : <p className="font-medium">{value}</p>}
          </div>
        </div>
      </div>
    );
  };

  // Save button with loading state
  const SaveButton = () => {
    return (
      <button
        className={`bg-[#9a6458] text-white px-4 py-2 rounded-lg hover:bg-[#7b483d] transition-colors duration-300 flex items-center ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
        onClick={() => {
          if (isEdit && !isSaving) {
            updateUserProfileData();
          } else if (!isEdit) {
            setIsEdit(true);
          }
        }}
        disabled={isSaving}
      >
        {isEdit ? (
          isSaving ? (
            <>
              <Loader2 className="mr-2 animate-spin" size={18} />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2" size={18} />
              Save Changes
            </>
          )
        ) : (
          <>
            <Edit className="mr-2" size={18} />
            Edit Profile
          </>
        )}
      </button>
    );
  };

  // Loading overlay that appears when saving
  const LoadingOverlay = () => {
    if (!isSaving) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <Loader2 size={40} className="text-[#9a6458] animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-[#9a6458]">Updating Profile...</h3>
          <p className="text-gray-600 mt-2">Please wait while we save your changes</p>
        </div>
      </div>
    );
  };

  return (
    userdata && (
      <div className="max-w-6xl mx-auto p-4 min-h-screen bg-[#F2E4C6]">
        {/* Loading Overlay */}
        <LoadingOverlay />

        {/* Header Section */}
        <div className="bg-white shadow-md rounded-lg mb-6 overflow-hidden">
          <div className="p-6 flex flex-col md:flex-row items-center md:items-start">
            {/* Profile Image */}
            <div className="mb-6 md:mb-0 md:mr-8">
              {isEdit ? (
                <label htmlFor="image" className="cursor-pointer">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#9a6458]">
                    <img
                      className="w-full h-full object-cover"
                      src={image ? URL.createObjectURL(image) : userdata.image}
                      alt="Profile"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <input
                    onChange={(e) => setImage(e.target.files[0])}
                    type="file"
                    id="image"
                    hidden
                  />
                </label>
              ) : (
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#9a6458]">
                  <img
                    src={userdata.image}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="text-center md:text-left flex-1">
              {isEdit ? (
                <input
                  type="text"
                  className="text-2xl font-bold border border-gray-300 rounded-lg p-2 mb-2 w-full md:w-64"
                  value={userdata.name}
                  onChange={(e) =>
                    setuserdata((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              ) : (
                <h1 className="text-2xl font-bold mb-2">{userdata.name}</h1>
              )}

              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-4">
                <span className="bg-[#f8f3f1] text-[#9a6458] px-3 py-1 rounded-full flex items-center text-sm">
                  <Mail className="w-4 h-4 mr-1" /> {userdata.email}
                </span>
                <span className="bg-[#f8f3f1] text-[#9a6458] px-3 py-1 rounded-full flex items-center text-sm">
                  <PawPrint className="w-4 h-4 mr-1" /> {userdata.address?.LINE}
                </span>
                <span className="bg-[#f8f3f1] text-[#9a6458] px-3 py-1 rounded-full flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-1" /> {userdata.address?.LOCATION}
                </span>
              </div>

              <SaveButton />
            </div>

            {/* Daily Tip */}
            <div className="w-full md:w-1/3 mt-6 md:mt-0 md:ml-6 bg-[#f8f3f1] p-4 rounded-lg border-l-4 border-[#9a6458]">
              <div className="flex items-center mb-2">
                <Heart className="text-[#9a6458] mr-2" size={18} />
                <h3 className="font-semibold text-[#9a6458]">Daily Pet Health Tip</h3>
              </div>
              <p className="text-gray-800 italic">{dailyQuote}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Owner Information Card */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 bg-[#9a6458] text-white flex items-center">
              <User className="mr-2" size={20} />
              <h2 className="text-lg font-semibold">Owner Information</h2>
            </div>
            <div className="p-4">
              <InfoItem
                icon={Phone}
                label="Phone Number"
                value={userdata.phone}
                editComponent={
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg p-2 w-full"
                    value={userdata.phone}
                    onChange={(e) => setuserdata((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                }
              />

              <InfoItem
                icon={Mail}
                label="Email Address"
                value={userdata.email}
                editComponent={<p className="font-medium">{userdata.email}</p>}
              />

              <InfoItem
                icon={User}
                label="Gender"
                value={userdata.gender}
                editComponent={
                  <select
                    className="border border-gray-300 rounded-lg p-2 w-full"
                    value={userdata.gender}
                    onChange={(e) => setuserdata((prev) => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                }
              />

              <InfoItem
                icon={Calendar}
                label="Date of Birth"
                value={formatDate(userdata.dob)}
                editComponent={
                  <input
                    type="date"
                    className="border border-gray-300 rounded-lg p-2 w-full"
                    value={userdata.dob}
                    onChange={(e) => setuserdata((prev) => ({ ...prev, dob: e.target.value }))}
                  />
                }
              />

              <InfoItem
                icon={MapPin}
                label="Address"
                value={`${userdata.address?.LOCATION}, ${userdata.address?.LINE}`}
                editComponent={
                  <div className="space-y-2">
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg p-2 w-full"
                      value={userdata.address?.Location?.toUpperCase()}
                      placeholder="State"
                      onChange={(e) =>
                        setuserdata((prev) => ({
                          ...prev,
                          address: { ...prev.address, Location: e.target.value },
                        }))
                      }
                    />
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg p-2 w-full"
                      value={userdata.address?.Line?.toUpperCase()}
                      placeholder="District"
                      onChange={(e) =>
                        setuserdata((prev) => ({
                          ...prev,
                          address: { ...prev.address, Line: e.target.value },
                        }))
                      }
                    />
                  </div>
                }
              />

              <InfoItem
                icon={MapPin}
                label="Full Address"
                value={userdata.full_address}
                editComponent={
                  <textarea
                    className="border border-gray-300 rounded-lg p-2 w-full"
                    value={userdata.full_address}
                    rows="2"
                    onChange={(e) =>
                      setuserdata((prev) => ({
                        ...prev,
                        full_address: e.target.value,
                      }))
                    }
                  />
                }
              />
            </div>
          </div>

          {/* Pet Information Card */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 bg-[#9a6458] text-white flex items-center">
              <PawPrint className="mr-2" size={20} />
              <h2 className="text-lg font-semibold">Pet Information</h2>
            </div>
            <div className="p-4">
              <InfoItem
                icon={PawPrint}
                label="Pet Type"
                value={userdata.pet_type}
                editComponent={
                  <select
                    className="border border-gray-300 rounded-lg p-2 w-full"
                    value={userdata.pet_type}
                    onChange={(e) => setuserdata((prev) => ({ ...prev, pet_type: e.target.value }))}
                  >
                    <option value="Small Animal">Small Animal</option>
                    <option value="Marine Animal">Marine Animal</option>
                    <option value="Large Animal">Large Animal</option>
                    <option value="Military Animal">Military Animal</option>
                    <option value="Bird">Bird</option>
                    <option value="Reptile">Reptile</option>
                    <option value="Exotic">Exotic</option>
                  </select>
                }
              />

              <InfoItem
                icon={PawPrint}
                label="Pet Gender"
                value={userdata.pet_gender}
                editComponent={
                  <select
                    className="border border-gray-300 rounded-lg p-2 w-full"
                    value={userdata.pet_gender}
                    onChange={(e) => setuserdata((prev) => ({ ...prev, pet_gender: e.target.value }))}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                }
              />

              <InfoItem
                icon={PawPrint}
                label="Breed"
                value={userdata.breed}
                editComponent={
                  <input
                    placeholder="Breed Name"
                    type="text"
                    className="border border-gray-300 rounded-lg p-2 w-full"
                    value={userdata.breed}
                    onChange={(e) => setuserdata((prev) => ({ ...prev, breed: e.target.value }))}
                  />
                }
              />

              <InfoItem
                icon={PawPrint}
                label="Pet Category"
                value={userdata.category}
                editComponent={
                  <input
                    placeholder="Pet Category"
                    type="text"
                    className="border border-gray-300 rounded-lg p-2 w-full"
                    value={userdata.category}
                    onChange={(e) => setuserdata((prev) => ({ ...prev, category: e.target.value }))}
                  />
                }
              />

              <InfoItem
                icon={PawPrint}
                label="Pet Age"
                value={userdata.pet_age}
                editComponent={
                  <input
                    type="text"
                    placeholder="Pet Age"
                    className="border border-gray-300 rounded-lg p-2 w-full"
                    value={userdata.pet_age}
                    onChange={(e) => setuserdata((prev) => ({ ...prev, pet_age: e.target.value }))}
                  />
                }
              />

              {/* Health Alert Card */}
              <div className="mt-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex items-start">
                  <AlertCircle size={20} className="text-red-500 mr-2 mt-1" />
                  <div>
                    <h4 className="font-medium text-red-700">Health Reminder</h4>
                    <p className="text-sm text-red-600">
                      {userdata.pet_type === "Small Animal"
                        ? "Next vaccination due in 30 days"
                        : "Schedule a checkup for your pet"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative">
          <AnimalHealthChatbot />
        </div>
      </div>
    )
  );
};

export default MyProfile;