import React, { useState, useEffect, useRef, useContext } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageCircleQuestion, MapPin, Calendar, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const AnimalHealthChatbot = () => {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showInitialPopup, setShowInitialPopup] = useState(true);
  const [showDoctorRecommendations, setShowDoctorRecommendations] = useState(false);
  const [recommendedDoctors, setRecommendedDoctors] = useState([]);
  const [nearbyDoctors, setNearbyDoctors] = useState([]);
  const [showAllNearbyDoctors, setShowAllNearbyDoctors] = useState(false);
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const { doctors, userdata } = useContext(AppContext);

  // Initialize Gemini
  const apikey2 = import.meta.env.VITE_API_KEY_GEMINI_2 || "AIzaSyC5pBG2gyh7jHTgL42EYSGTcPhwS_9NkV4";
  const genAI = new GoogleGenerativeAI(apikey2);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, showDoctorRecommendations, showAllNearbyDoctors]);

  // Initial welcome message and nearby doctors fetch
  useEffect(() => {
    setChatMessages([
      { 
        role: 'assistant', 
        text: `Hi! ${userdata?.name} Ask about your pet's health concerns, and I'll help you find the right care.` 
      }
    ] , [userdata]);

    // Auto-hide initial popup after 5 seconds
    const popupTimer = setTimeout(() => {
      setShowInitialPopup(false);
    }, 5000);

    // Load nearby doctors based on user location when chatbot opens
    if (userdata?.address?.Location && doctors?.length > 0) {
      const doctorsInUserLocation = doctors.filter(doc => 
        doc.address?.Location?.toLowerCase() === userdata.address.Location.toLowerCase()
      );
      setNearbyDoctors(doctorsInUserLocation);
    }

    return () => clearTimeout(popupTimer);
  }, [doctors, userdata]);

  // Function to check if response indicates poor health
  const indicatesPoorHealth = (response) => {
    const poorHealthKeywords = [
      'emergency', 'urgent', 'immediate', 'vet', 'veterinarian', 'doctor', 
      'consult', 'serious', 'critical', 'treatment', 'medical attention',
      'concerning', 'worrying', 'dangerous', 'severe', 'professional help',
      'specialist', 'consultation', 'care', 'professional', 'clinic', 'hospital'
    ];
    
    return poorHealthKeywords.some(keyword => 
      response.toLowerCase().includes(keyword)
    );
  };

  // Get user's current location
  const getUserLocation = () => {
    return userdata?.address?.LOCATION || userdata?.address?.LINE;
  };

  // Determine pet type from query
  const determinePetType = (query) => {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('dog') || queryLower.includes('puppy')) {
      return 'Small animal vet';
    } else if (queryLower.includes('cat') || queryLower.includes('kitten')) {
      return 'Small animal vet';
    } else if (queryLower.includes('fish') || queryLower.includes('aquarium')) {
      return 'Marine vet';
    } else if (queryLower.includes('bird') || queryLower.includes('parrot') || queryLower.includes('avian')) {
      return 'Avian vet';
    } else if (queryLower.includes('reptile') || queryLower.includes('snake') || queryLower.includes('lizard')) {
      return 'Exotic vet';
    } else if (queryLower.includes('horse') || queryLower.includes('cow') || 
              queryLower.includes('livestock')) {
      return 'Large animal vet';
    } else if (queryLower.includes('military') || queryLower.includes('service animal')) {
      return 'Military vet';
    } else {
      return 'Small animal vet'; // Default to small animal vet
    }
  };

  // Function to get relevant doctors based on user location and pet issue
  const getRelevantDoctors = (query) => {
    if (!doctors || doctors.length === 0) return [];

    // Get user location
    const userLocation = getUserLocation();
    
    // Determine pet type from query
    const petType = determinePetType(query);
    
    // First filter by location if available
    let filteredDoctors = [...doctors];
    
    if (userLocation) {
      const locationFiltered = filteredDoctors.filter(doc => 
        doc.address?.Location?.toLowerCase() === userLocation.toLowerCase()
      );
      
      // If we have doctors in user's location, use those; otherwise keep the broader list
      if (locationFiltered.length > 0) {
        filteredDoctors = locationFiltered;
      }
    }
    
    // Then filter by speciality if determined
    if (petType) {
      const specialityFiltered = filteredDoctors.filter(doc => 
        doc.speciality?.toLowerCase() === petType.toLowerCase()
      );
      
      // If we have doctors matching the speciality, prioritize them
      if (specialityFiltered.length > 0) {
        filteredDoctors = specialityFiltered;
      }
    }
    
    // Sort by availability first
    filteredDoctors.sort((a, b) => {
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      return 0;
    });
    
    return filteredDoctors.slice(0, 3);
  };

  // Function to get all doctors in user's location with optional speciality filter
  const getAllDoctorsInLocation = (speciality = '') => {
    if (!doctors || doctors.length === 0) return [];
    
    const userLocation = getUserLocation();
    if (!userLocation) return [];
    
    let locationDoctors = doctors.filter(doc => 
      doc.address?.Location?.toLowerCase() === userLocation.toLowerCase()
    );
    
    // Apply speciality filter if provided
    if (speciality) {
      locationDoctors = locationDoctors.filter(doc => 
        doc.speciality?.toLowerCase() === speciality.toLowerCase()
      );
    }
    
    // Sort by availability
    locationDoctors.sort((a, b) => {
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      return 0;
    });
    
    return locationDoctors;
  };

  // Get all unique specialities from doctors in user's location
  const getUniqueSpecialities = () => {
    const userLocation = getUserLocation();
    if (!userLocation || !doctors || doctors.length === 0) return [];
    
    const locationDoctors = doctors.filter(doc => 
      doc.address?.Location?.toLowerCase() === userLocation.toLowerCase()
    );
    
    const specialities = locationDoctors.map(doc => doc.speciality).filter(Boolean);
    return [...new Set(specialities)];
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    const newMessages = [...chatMessages, { role: 'user', text: userInput }];
    setChatMessages(newMessages);
    setUserInput('');
    setIsLoading(true);
    setError(null);
    setShowDoctorRecommendations(false);
    setShowAllNearbyDoctors(false);

    try {
      const result = await model.generateContent(
        `Provide a very concise (max 3 lines) professional veterinary response to: ${userInput}`
      );
      const response = await result.response.text();
      
      setChatMessages(prev => [
        ...prev, 
        { role: 'assistant', text: response }
      ]);

      // Check if response indicates a health concern
      if (indicatesPoorHealth(response) || indicatesPoorHealth(userInput)) {
        const relevantDocs = getRelevantDoctors(userInput);
        if (relevantDocs.length > 0) {
          setRecommendedDoctors(relevantDocs);
          setShowDoctorRecommendations(true);
        }
      }
    } catch (error) {
      console.error("Chatbot error:", error);
      setError("Sorry, I'm having trouble connecting right now. Please try again.");
      
      setChatMessages(prev => [
        ...prev, 
        { role: 'assistant', text: "Sorry, I'm having trouble connecting right now. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle viewing all nearby doctors
  const handleViewAllNearbyDoctors = () => {
    const allDocs = getAllDoctorsInLocation(selectedSpeciality);
    setNearbyDoctors(allDocs);
    setShowAllNearbyDoctors(true);
    setShowDoctorRecommendations(false);
  };

  // Filter nearby doctors by speciality
  const filterBySpeciality = (speciality) => {
    setSelectedSpeciality(speciality);
    const filteredDocs = getAllDoctorsInLocation(speciality);
    setNearbyDoctors(filteredDocs);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle doctor appointment booking
  const handleBookAppointment = (doctorId) => {
    navigate(`/appointment/${doctorId}`);
    setIsChatbotOpen(false);
  };

  // Get user location display name
  const getUserLocationDisplay = () => {
    const userLocation = getUserLocation();
    return userLocation || 'Unknown Location';
  };

  const uniqueSpecialities = getUniqueSpecialities();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Initial Popup */}
      <AnimatePresence>
        {showInitialPopup && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-24 right-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4"
          >
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-3xl">🩺</span>
              <h3 className="text-lg font-semibold text-[#5A4035]">Welcome to PawVaidya!</h3>
            </div>
            <p className="text-zinc-600 mb-2">
              Hii {userdata?.name} I can help you with quick animal health queries and provide professional advice.
            </p>
            {getUserLocation() && (
              <div className="bg-[#f8f4e9] p-2 rounded-lg mb-3 flex items-center text-sm">
                <MapPin className="w-4 h-4 text-[#5A4035] mr-1" />
                <span>Your location: <span className="font-medium">{getUserLocationDisplay()}</span></span>
              </div>
            )}
            <div className="flex justify-end">
              <button 
                onClick={() => setShowInitialPopup(false)}
                className="bg-[#5A4035] text-white px-4 py-2 rounded-full"
              >
                Got it!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chatbot Launcher */}
      <motion.div 
        className="w-14 h-14 border-2 border-[#5A4032] text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer"
        onClick={() => setIsChatbotOpen(!isChatbotOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <img src="https://i.ibb.co/0jC6VMm0/PV-removebg-preview.png" alt="" />
        <div className="w-8 h-8" />
      </motion.div>

      <AnimatePresence>
        {isChatbotOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col"
          >
            {/* Chat Header */}
            <div className="bg-[#5A4035] text-white p-4 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Animal Health Assistant</h2>
                {getUserLocation() && (
                  <div className="flex items-center text-xs mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    <span>{getUserLocationDisplay()}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {nearbyDoctors.length > 0 && (
                  <motion.button
                    onClick={handleViewAllNearbyDoctors}
                    whileHover={{ scale: 1.1 }}
                    className="bg-[#F2E4C6] text-[#5A4035] p-1 rounded-full focus:outline-none"
                    title="View all nearby vets"
                  >
                    <MapPin className="w-5 h-5" />
                  </motion.button>
                )}
                <motion.button 
                  onClick={() => setIsChatbotOpen(false)}
                  whileHover={{ rotate: 90 }}
                  className="focus:outline-none"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 max-h-[400px]">
              <AnimatePresence>
                {chatMessages.map((msg, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-center ${
                      msg.role === 'user' 
                        ? 'justify-end' 
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`p-3 rounded-2xl max-w-[80%] flex items-center space-x-2 ${
                        msg.role === 'user' 
                          ? 'bg-[#F2E4C6] text-[#5A4035] ml-auto' 
                          : 'bg-[#F2E4C6] text-zinc-600'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <span className="text-xl mr-2">🩺</span>
                      )}
                      <span>{msg.text}</span>
                      {msg.role === 'user' && (
                        <span className="text-xl ml-2">👤</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Doctor Recommendations based on query */}
              {showDoctorRecommendations && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-[#fff8ee] border border-[#e9dac0] rounded-lg"
                >
                  <h3 className="font-medium text-[#5A4035] mb-2 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" /> Recommended Doctors
                  </h3>
                  <div className="space-y-3">
                    {recommendedDoctors.map(doctor => (
                      <div key={doctor._id} className="p-2 bg-white rounded-md border border-[#e9dac0] hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-[#5A4035]">{doctor.name}</h4>
                            <p className="text-xs text-gray-600">{doctor.speciality}</p>
                            <div className="flex items-center text-xs mt-1">
                              <MapPin className="w-3 h-3 mr-1 text-[#8b6a5e]" />
                              <span>{doctor.address?.Location || 'Location unavailable'}</span>
                            </div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${doctor.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {doctor.available ? 'Available' : 'Busy'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleBookAppointment(doctor._id)}
                          className="mt-2 w-full bg-[#5A4035] text-white text-xs py-1.5 rounded-md flex items-center justify-center"
                        >
                          <Calendar className="w-3 h-3 mr-1" /> Book Appointment
                        </button>
                      </div>
                    ))}
                    {recommendedDoctors.length > 0 && (
                      <button
                        onClick={handleViewAllNearbyDoctors}
                        className="w-full text-[#5A4035] text-sm py-1 underline flex items-center justify-center"
                      >
                        View all doctors in {getUserLocationDisplay()}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
              
              {/* All Nearby Doctors View */}
              {showAllNearbyDoctors && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-[#fff8ee] border border-[#e9dac0] rounded-lg"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-[#5A4035] flex items-center">
                      <MapPin className="w-4 h-4 mr-1" /> Vets in {getUserLocationDisplay()}
                    </h3>
                    <button 
                      onClick={() => setShowAllNearbyDoctors(false)}
                      className="text-[#5A4035] text-xs p-1 rounded-full hover:bg-[#e9dac0]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Speciality filter */}
                  {uniqueSpecialities.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button
                        onClick={() => filterBySpeciality('')}
                        className={`text-xs px-2 py-1 rounded-full ${
                          selectedSpeciality === '' 
                            ? 'bg-[#5A4035] text-white' 
                            : 'bg-[#e9dac0] text-[#5A4035]'
                        }`}
                      >
                        All
                      </button>
                      {uniqueSpecialities.map(spec => (
                        <button
                          key={spec}
                          onClick={() => filterBySpeciality(spec)}
                          className={`text-xs px-2 py-1 rounded-full ${
                            selectedSpeciality === spec 
                              ? 'bg-[#5A4035] text-white' 
                              : 'bg-[#e9dac0] text-[#5A4035]'
                          }`}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {nearbyDoctors.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {nearbyDoctors.map(doctor => (
                        <div key={doctor._id} className="p-2 bg-white rounded-md border border-[#e9dac0] hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-[#5A4035]">{doctor.name}</h4>
                              <p className="text-xs text-gray-600">{doctor.speciality}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${doctor.available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {doctor.available ? 'Available' : 'Busy'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleBookAppointment(doctor._id)}
                            className="mt-2 w-full bg-[#5A4035] text-white text-xs py-1.5 rounded-md flex items-center justify-center"
                          >
                            <Calendar className="w-3 h-3 mr-1" /> Book Appointment
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded-md text-center text-sm text-gray-600">
                      No doctors found in your location{selectedSpeciality ? ` with speciality "${selectedSpeciality}"` : ''}.
                    </div>
                  )}
                </motion.div>
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 p-3 rounded-2xl flex items-center">
                    <span className="text-xl mr-2">🩺</span>
                    Typing...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Areas */}
            <div className="p-4 border-t border-gray-200 flex items-center space-x-2">
              <input 
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about animal health..."
                className="flex-grow p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-[#5A4035]"
              />
              <motion.button 
                onClick={handleSendMessage}
                disabled={!userInput.trim()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="bg-[#5A4035] text-white p-2 rounded-full disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimalHealthChatbot;