import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, useUser } from "@clerk/clerk-react";
import {
  FiTarget,
  FiDroplet,
  FiActivity,
  FiHeart,
  FiClock,
  FiStar,
  FiChevronRight,
  FiCheck,
  FiPlus,
  FiMinus,
  FiRefreshCw,
  FiBookOpen,
  FiTrendingUp,
  FiAward,
  FiCoffee,
  FiSun,
  FiMoon,
  FiZap,
  FiDownload,
  FiTrash2,
  FiFileText,
  FiCalendar,
  FiList,
} from "react-icons/fi";
import {
  GiMeal,
  GiFruitBowl,
  GiMeat,
  GiCookingPot,
  GiWeightScale,
  GiMuscleUp,
  GiHeartBeats,
  GiBrain,
  GiStomach,
  GiKidneys,
} from "react-icons/gi";
import {
  MdOutlineLocalDining,
  MdOutlineFoodBank,
  MdOutlineRestaurant,
  MdFreeBreakfast,
  MdLunchDining,
  MdDinnerDining,
  MdNightlife,
  MdHistory,
} from "react-icons/md";
import Dictaphone from "../Dictaphone";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Diet Types Data
const dietTypes = [
  { id: "balanced", name: "Balanced", icon: GiMeal, color: "from-emerald-500 to-teal-500", description: "Well-rounded nutrition" },
  { id: "keto", name: "Keto", icon: GiMeat, color: "from-orange-500 to-red-500", description: "Low-carb, high-fat" },
  { id: "vegan", name: "Vegan", icon: GiFruitBowl, color: "from-green-500 to-lime-500", description: "Plant-based only" },
  { id: "paleo", name: "Paleo", icon: GiMuscleUp, color: "from-amber-500 to-yellow-500", description: "Whole foods diet" },
  { id: "mediterranean", name: "Mediterranean", icon: MdOutlineLocalDining, color: "from-blue-500 to-cyan-500", description: "Heart-healthy eating" },
  { id: "lowcarb", name: "Low Carb", icon: FiTrendingUp, color: "from-purple-500 to-pink-500", description: "Reduced carbohydrates" },
];

// Health Conditions
const healthConditions = [
  { id: "diabetes", name: "Diabetes", icon: GiHeartBeats, color: "bg-red-500/20 border-red-500/50" },
  { id: "hypertension", name: "Hypertension", icon: FiHeart, color: "bg-pink-500/20 border-pink-500/50" },
  { id: "cholesterol", name: "High Cholesterol", icon: FiActivity, color: "bg-orange-500/20 border-orange-500/50" },
  { id: "weightloss", name: "Weight Loss", icon: GiWeightScale, color: "bg-emerald-500/20 border-emerald-500/50" },
  { id: "musclegain", name: "Muscle Gain", icon: GiMuscleUp, color: "bg-blue-500/20 border-blue-500/50" },
  { id: "digestive", name: "Digestive Issues", icon: GiStomach, color: "bg-yellow-500/20 border-yellow-500/50" },
  { id: "kidney", name: "Kidney Health", icon: GiKidneys, color: "bg-purple-500/20 border-purple-500/50" },
  { id: "mental", name: "Mental Wellness", icon: GiBrain, color: "bg-indigo-500/20 border-indigo-500/50" },
];

// Meal Times
const mealTimes = [
  { id: "breakfast", name: "Breakfast", icon: MdFreeBreakfast, time: "7:00 - 9:00 AM", color: "from-yellow-400 to-orange-400" },
  { id: "lunch", name: "Lunch", icon: MdLunchDining, time: "12:00 - 2:00 PM", color: "from-green-400 to-emerald-400" },
  { id: "snack", name: "Snacks", icon: FiCoffee, time: "4:00 - 5:00 PM", color: "from-pink-400 to-rose-400" },
  { id: "dinner", name: "Dinner", icon: MdDinnerDining, time: "7:00 - 9:00 PM", color: "from-blue-400 to-indigo-400" },
];

// Allergies/Restrictions
const allergiesOptions = [
  "Gluten", "Dairy", "Nuts", "Eggs", "Soy", "Shellfish", "Fish", "Sesame"
];

// Animated Card Component
const GlassCard = ({ children, className = "", delay = 0, onClick, isSelected = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ scale: 1.02, y: -5 }}
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl backdrop-blur-xl 
      ${isSelected ? 'bg-white/20 border-2 border-white/40 shadow-lg shadow-white/10' : 'bg-white/5 border border-white/10'} 
      transition-all duration-300 cursor-pointer ${className}`}
  >
    {children}
  </motion.div>
);

// Progress Ring Component
const ProgressRing = ({ percent, size = 120, strokeWidth = 8, color = "#10b981" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
      />
    </svg>
  );
};

// Water Tracker Component
const WaterTracker = ({ glasses, setGlasses, goal = 8 }) => {
  const percent = Math.min((glasses / goal) * 100, 100);
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <ProgressRing percent={percent} color="#3b82f6" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <FiDroplet className="text-3xl text-blue-400 mb-1" />
          <span className="text-2xl font-bold text-white">{glasses}</span>
          <span className="text-xs text-gray-400">/ {goal} glasses</span>
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setGlasses(Math.max(0, glasses - 1))}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <FiMinus className="text-white" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setGlasses(Math.min(goal + 4, glasses + 1))}
          className="p-3 rounded-full bg-blue-500/30 hover:bg-blue-500/50 transition-colors"
        >
          <FiPlus className="text-white" />
        </motion.button>
      </div>
    </div>
  );
};

// Calorie Ring Component
const CalorieTracker = ({ consumed, goal }) => {
  const percent = Math.min((consumed / goal) * 100, 100);
  const remaining = Math.max(goal - consumed, 0);
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <ProgressRing percent={percent} size={140} color="#10b981" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{consumed}</span>
          <span className="text-sm text-gray-400">kcal</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <p className="text-emerald-400 font-semibold">{remaining} kcal remaining</p>
        <p className="text-gray-500 text-sm">Daily goal: {goal} kcal</p>
      </div>
    </div>
  );
};

// Macro Card Component
const MacroCard = ({ name, value, goal, unit, color, icon: Icon }) => {
  const percent = Math.min((value / goal) * 100, 100);
  
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${color}`}>
            <Icon className="text-white text-lg" />
          </div>
          <span className="text-gray-300 font-medium">{name}</span>
        </div>
        <span className="text-white font-bold">{value}{unit}</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full bg-gradient-to-r ${color} rounded-full`}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">Goal: {goal}{unit}</p>
    </motion.div>
  );
};

// Recipe Card Component
const RecipeCard = ({ recipe, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    whileHover={{ scale: 1.02, x: 10 }}
    className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/10 cursor-pointer group"
  >
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
        <GiCookingPot className="text-2xl text-white" />
      </div>
      <div className="flex-1">
        <h4 className="text-white font-semibold group-hover:text-emerald-400 transition-colors">{recipe.name}</h4>
        <p className="text-gray-400 text-sm mt-1">{recipe.calories} kcal • {recipe.time}</p>
        <div className="flex gap-2 mt-2">
          {recipe.tags.map((tag, i) => (
            <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">{tag}</span>
          ))}
        </div>
      </div>
      <FiChevronRight className="text-gray-500 group-hover:text-white transition-colors text-xl" />
    </div>
  </motion.div>
);

// Meal Plan Card
const MealPlanCard = ({ meal, isActive, onClick }) => {
  const Icon = meal.icon;
  
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all duration-300
        ${isActive ? 'bg-gradient-to-br ' + meal.color + ' shadow-lg' : 'bg-white/5 hover:bg-white/10'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${isActive ? 'bg-white/20' : 'bg-white/10'}`}>
          <Icon className={`text-2xl ${isActive ? 'text-white' : 'text-gray-400'}`} />
        </div>
        <div>
          <h3 className={`font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>{meal.name}</h3>
          <p className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-500'}`}>{meal.time}</p>
        </div>
      </div>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-white/20"
        >
          <p className="text-white/90 text-sm">Click to view meal suggestions</p>
        </motion.div>
      )}
    </motion.div>
  );
};

// Meal Plan Display Component - Formats AI-generated content beautifully
const MealPlanDisplay = ({ content }) => {
  if (!content) return null;

  // Parse and format the meal plan content
  const formatContent = (text) => {
    // Remove markdown asterisks for bold/italic
    let formatted = text
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1') // Remove *** ***
      .replace(/\*\*(.+?)\*\*/g, '$1')     // Remove ** **
      .replace(/\*(.+?)\*/g, '$1')         // Remove * *
      .replace(/__(.+?)__/g, '$1')         // Remove __ __
      .replace(/_(.+?)_/g, '$1');          // Remove _ _
    
    return formatted;
  };

  // Split content into sections based on meal emojis
  const parseSections = (text) => {
    const cleanText = formatContent(text);
    const lines = cleanText.split('\n');
    const sections = [];
    let currentSection = null;

    // Emoji patterns for meal sections
    const mealPatterns = [
      { emoji: '🌅', name: 'Breakfast', color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-500/10' },
      { emoji: '🍳', name: 'Breakfast', color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-500/10' },
      { emoji: '🥣', name: 'Breakfast', color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-500/10' },
      { emoji: '🍎', name: 'Mid-Morning Snack', color: 'from-red-500 to-pink-500', bg: 'bg-red-500/10' },
      { emoji: '🥗', name: 'Lunch', color: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10' },
      { emoji: '🍽️', name: 'Lunch', color: 'from-green-500 to-emerald-500', bg: 'bg-green-500/10' },
      { emoji: '🥜', name: 'Afternoon Snack', color: 'from-amber-500 to-yellow-500', bg: 'bg-amber-500/10' },
      { emoji: '🍽️', name: 'Dinner', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500/10' },
      { emoji: '🐟', name: 'Dinner', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500/10' },
      { emoji: '🥩', name: 'Dinner', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-500/10' },
      { emoji: '🫖', name: 'Evening', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10' },
      { emoji: '🌙', name: 'Evening', color: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10' },
      { emoji: '📊', name: 'Summary', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10' },
      { emoji: '✅', name: 'Summary', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10' },
    ];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Check if this is a section header
      const isSectionHeader = mealPatterns.some(p => trimmedLine.includes(p.emoji)) ||
        /^(breakfast|lunch|dinner|snack|morning|afternoon|evening|summary|total)/i.test(trimmedLine) ||
        trimmedLine.startsWith('###') || trimmedLine.startsWith('##');

      if (isSectionHeader) {
        // Find matching pattern for styling
        let style = { color: 'from-gray-500 to-gray-600', bg: 'bg-gray-500/10' };
        for (const p of mealPatterns) {
          if (trimmedLine.includes(p.emoji) || trimmedLine.toLowerCase().includes(p.name.toLowerCase())) {
            style = p;
            break;
          }
        }

        // Clean up the header text
        const headerText = trimmedLine
          .replace(/^#+\s*/, '')
          .replace(/^[-•]\s*/, '');

        currentSection = {
          header: headerText,
          style,
          items: []
        };
        sections.push(currentSection);
      } else if (currentSection) {
        // Add to current section
        const cleanLine = trimmedLine
          .replace(/^[-•]\s*/, '')
          .replace(/^[0-9]+\.\s*/, '');
        if (cleanLine) {
          currentSection.items.push(cleanLine);
        }
      } else {
        // Create intro section for content before first meal
        if (!sections.find(s => s.header === 'intro')) {
          sections.unshift({ header: 'intro', style: { bg: 'bg-white/5' }, items: [] });
        }
        const introSection = sections.find(s => s.header === 'intro');
        if (introSection && trimmedLine) {
          introSection.items.push(trimmedLine);
        }
      }
    });

    return sections;
  };

  const sections = parseSections(content);

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`rounded-xl border border-white/10 overflow-hidden ${section.style.bg}`}
        >
          {section.header !== 'intro' && (
            <div className={`px-5 py-3 bg-gradient-to-r ${section.style.color} bg-opacity-20`}>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {section.header}
              </h3>
            </div>
          )}
          <div className="px-5 py-4">
            {section.items.map((item, i) => {
              // Check if item contains calorie info
              const hasCalories = /\d+\s*kcal/i.test(item) || /calories?:/i.test(item);
              const hasNutrition = /protein|carbs?|fats?|fiber/i.test(item);
              
              return (
                <div key={i} className={`py-1.5 ${i > 0 ? 'border-t border-white/5' : ''}`}>
                  {hasCalories || hasNutrition ? (
                    <p className="text-emerald-400 text-sm font-medium">{item}</p>
                  ) : item.startsWith('•') || item.startsWith('-') ? (
                    <p className="text-gray-300 text-sm flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{item.replace(/^[•-]\s*/, '')}</span>
                    </p>
                  ) : (
                    <p className="text-gray-300 text-sm leading-relaxed">{item}</p>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Main Component
export default function DietaryRecommendations() {
  // Auth
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  
  // User Profile State
  const [selectedDiet, setSelectedDiet] = useState("balanced");
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [activeMeal, setActiveMeal] = useState("breakfast");
  
  // Trackers State
  const [waterGlasses, setWaterGlasses] = useState(4);
  const [caloriesConsumed, setCaloriesConsumed] = useState(1450);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  
  // Macro Goals
  const [macros, setMacros] = useState({
    protein: { value: 85, goal: 120 },
    carbs: { value: 180, goal: 250 },
    fats: { value: 55, goal: 65 },
    fiber: { value: 18, goal: 30 },
  });
  
  // Form State
  const [ingredients, setIngredients] = useState("");
  const [cuisinePreference, setCuisinePreference] = useState("any");
  const [cookingTime, setCookingTime] = useState("30");
  
  // Results State
  const [isLoading, setIsLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [activeTab, setActiveTab] = useState("planner");
  
  // History State  
  const [savedPlans, setSavedPlans] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedHistoryPlan, setSelectedHistoryPlan] = useState(null);
  
  // Export State
  const [isExporting, setIsExporting] = useState(false);
  
  // Sample Recipes (would come from API)
  const sampleRecipes = [
    { name: "Grilled Salmon Bowl", calories: 450, time: "25 min", tags: ["High Protein", "Omega-3"] },
    { name: "Quinoa Veggie Stir-fry", calories: 380, time: "20 min", tags: ["Vegan", "Fiber-rich"] },
    { name: "Greek Yogurt Parfait", calories: 280, time: "5 min", tags: ["Quick", "Probiotic"] },
    { name: "Chicken Caesar Salad", calories: 420, time: "15 min", tags: ["Low Carb", "Classic"] },
  ];
  
  // Get user email from Clerk
  const getUserEmail = useCallback(() => {
    if (user?.primaryEmailAddress?.emailAddress) {
      return user.primaryEmailAddress.emailAddress;
    }
    if (user?.emailAddresses?.[0]?.emailAddress) {
      return user.emailAddresses[0].emailAddress;
    }
    return null;
  }, [user]);
  
  // Get auth headers (simplified - always include user_email in body)
  const getAuthHeaders = useCallback(async () => {
    const headers = { "Content-Type": "application/json" };
    if (isSignedIn) {
      try {
        // Try to get token (may fail if template doesn't exist)
        const token = await getToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to get auth token:", error);
      }
    }
    return headers;
  }, [isSignedIn, getToken]);
  
  // Load user preferences on mount
  useEffect(() => {
    if (isSignedIn) {
      loadUserPreferences();
      loadSavedPlans();
      loadTodayTracking();
    }
  }, [isSignedIn]);
  
  // Load user preferences from backend
  const loadUserPreferences = async () => {
    const userEmail = getUserEmail();
    if (!userEmail) return;
    
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${BACKEND_URL}/diet/preferences?user_email=${encodeURIComponent(userEmail)}`, 
        { headers }
      );
      const prefs = response.data?.preferences;
      if (prefs) {
        setSelectedDiet(prefs.diet_type || "balanced");
        setSelectedConditions(prefs.health_conditions || []);
        setSelectedAllergies(prefs.allergies || []);
        setCalorieGoal(prefs.calorie_goal || 2000);
        setCuisinePreference(prefs.cuisine_preference || "any");
        setCookingTime(prefs.cooking_time || "30");
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };
  
  // Save user preferences
  const saveUserPreferences = async () => {
    const userEmail = getUserEmail();
    if (!userEmail) return;
    
    try {
      const headers = await getAuthHeaders();
      await axios.post(`${BACKEND_URL}/diet/preferences`, {
        user_email: userEmail,
        diet_type: selectedDiet,
        health_conditions: selectedConditions,
        allergies: selectedAllergies,
        calorie_goal: calorieGoal,
        cuisine_preference: cuisinePreference,
        cooking_time: cookingTime
      }, { headers });
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };
  
  // Load saved meal plans
  const loadSavedPlans = async () => {
    const userEmail = getUserEmail();
    if (!userEmail) {
      console.log("No user email, skipping load saved plans");
      return;
    }
    
    setIsLoadingHistory(true);
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${BACKEND_URL}/diet/plans?limit=20&user_email=${encodeURIComponent(userEmail)}`, 
        { headers }
      );
      setSavedPlans(response.data?.plans || []);
    } catch (error) {
      console.error("Error loading saved plans:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Load today's tracking data
  const loadTodayTracking = async () => {
    const userEmail = getUserEmail();
    if (!userEmail) return;
    
    try {
      const headers = await getAuthHeaders();
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(
        `${BACKEND_URL}/diet/tracking?date=${today}&user_email=${encodeURIComponent(userEmail)}`, 
        { headers }
      );
      const tracking = response.data?.tracking;
      if (tracking) {
        setWaterGlasses(tracking.water_glasses || 0);
        setCaloriesConsumed(tracking.calories_consumed || 0);
        setMacros({
          protein: { value: tracking.protein_g || 0, goal: 120 },
          carbs: { value: tracking.carbs_g || 0, goal: 250 },
          fats: { value: tracking.fats_g || 0, goal: 65 },
          fiber: { value: tracking.fiber_g || 0, goal: 30 },
        });
      }
    } catch (error) {
      console.error("Error loading tracking:", error);
    }
  };
  
  // Save tracking data
  const saveTracking = async (updates = {}) => {
    const userEmail = getUserEmail();
    if (!userEmail) return;
    
    try {
      const headers = await getAuthHeaders();
      const today = new Date().toISOString().split('T')[0];
      await axios.post(`${BACKEND_URL}/diet/tracking`, {
        user_email: userEmail,
        date: today,
        water_glasses: updates.water_glasses ?? waterGlasses,
        calories_consumed: updates.calories_consumed ?? caloriesConsumed,
        protein_g: updates.protein_g ?? macros.protein.value,
        carbs_g: updates.carbs_g ?? macros.carbs.value,
        fats_g: updates.fats_g ?? macros.fats.value,
        fiber_g: updates.fiber_g ?? macros.fiber.value,
      }, { headers });
    } catch (error) {
      console.error("Error saving tracking:", error);
    }
  };
  
  // Update water and save
  const updateWater = (newValue) => {
    setWaterGlasses(newValue);
    if (isSignedIn) {
      saveTracking({ water_glasses: newValue });
    }
  };
  
  // Update calories and save
  const updateCalories = (newValue) => {
    setCaloriesConsumed(newValue);
    if (isSignedIn) {
      saveTracking({ calories_consumed: newValue });
    }
  };
  
  // Toggle Health Condition
  const toggleCondition = (conditionId) => {
    setSelectedConditions(prev => 
      prev.includes(conditionId) 
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]
    );
  };
  
  // Toggle Allergy
  const toggleAllergy = (allergy) => {
    setSelectedAllergies(prev => 
      prev.includes(allergy) 
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };
  
  // Generate Meal Plan with AI (using Gemini via backend)
  const generateMealPlan = async () => {
    setIsLoading(true);
    
    // Save preferences before generating
    if (isSignedIn) {
      await saveUserPreferences();
    }
    
    const selectedConditionNames = selectedConditions.map(id => 
      healthConditions.find(c => c.id === id)?.name
    ).filter(Boolean);
    
    const userEmail = getUserEmail();

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(`${BACKEND_URL}/diet/generate-plan`, {
        user_email: userEmail,
        diet_type: selectedDiet,
        health_conditions: selectedConditionNames,
        allergies: selectedAllergies,
        calorie_goal: calorieGoal,
        cuisine_preference: cuisinePreference,
        cooking_time: cookingTime
      }, { headers });
      
      if (response.data?.success) {
        setMealPlan(response.data.plan);
        setCurrentPlanId(response.data.plan_id);
        // Refresh saved plans if user is signed in
        if (isSignedIn) {
          loadSavedPlans();
        }
      } else {
        throw new Error(response.data?.error || "Failed to generate plan");
      }
      setActiveTab("results");
    } catch (error) {
      console.error("Error generating meal plan:", error);
      // Show error message instead of hardcoded fallback
      const errorMessage = error.response?.data?.error || error.message || "Failed to generate meal plan";
      alert(`Error: ${errorMessage}. Please check your internet connection and try again.`);
      setMealPlan(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate Recipe Suggestions (using Gemini via backend)
  const generateRecipes = async () => {
    if (!ingredients.trim()) {
      setRecipes(sampleRecipes);
      return;
    }
    
    setIsLoading(true);
    const userEmail = getUserEmail();

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(`${BACKEND_URL}/diet/generate-recipes`, {
        user_email: userEmail,
        ingredients: ingredients,
        diet_type: selectedDiet,
        allergies: selectedAllergies,
        cooking_time: cookingTime,
        cuisine_preference: cuisinePreference
      }, { headers });
      
      if (response.data?.success) {
        setMealPlan(response.data.recipes);
        setCurrentPlanId(response.data.plan_id);
        if (isSignedIn) {
          loadSavedPlans();
        }
      } else {
        throw new Error(response.data?.error || "Failed to generate recipes");
      }
      setActiveTab("results");
    } catch (error) {
      console.error("Error generating recipes:", error);
      setRecipes(sampleRecipes);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to download blob
  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  // Check if response is an error (JSON)
  const checkBlobForError = async (blob) => {
    // If it's application/json, it's likely an error
    if (blob.type === 'application/json') {
      const text = await blob.text();
      try {
        const json = JSON.parse(text);
        if (json.error) {
          throw new Error(json.error);
        }
      } catch (e) {
        if (e.message) throw e;
      }
    }
    return blob;
  };

  // Export meal plan
  const exportPlan = async (format = 'txt') => {
    if (!mealPlan && !currentPlanId) {
      alert("No meal plan to export. Please generate a plan first.");
      return;
    }
    
    setIsExporting(true);
    try {
      let response;
      const mimeType = format === 'pdf' ? 'application/pdf' : 'text/plain';
      const filename = `meal_plan_${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (currentPlanId) {
        // Export saved plan
        response = await axios.get(
          `${BACKEND_URL}/diet/export/${currentPlanId}?format=${format}`,
          { 
            responseType: 'blob',
            validateStatus: (status) => status < 500 // Don't throw for 4xx errors
          }
        );
      } else if (mealPlan) {
        // Export current content directly
        response = await axios.post(
          `${BACKEND_URL}/diet/export-content`,
          {
            content: mealPlan,
            format: format,
            plan_name: `${dietTypes.find(d => d.id === selectedDiet)?.name || 'Custom'} Meal Plan`,
            diet_type: selectedDiet,
            calorie_goal: calorieGoal
          },
          { 
            responseType: 'blob',
            validateStatus: (status) => status < 500
          }
        );
      }
      
      if (response) {
        // Check for error response
        await checkBlobForError(response.data);
        
        const blob = new Blob([response.data], { type: mimeType });
        downloadBlob(blob, filename);
      }
    } catch (error) {
      console.error("Error exporting plan:", error);
      const errorMsg = error.message || "Failed to export";
      alert(`Export failed: ${errorMsg}. Please try again.`);
    } finally {
      setIsExporting(false);
    }
  };
  
  // Delete saved plan
  const deletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${BACKEND_URL}/diet/plans/${planId}`, { headers });
      loadSavedPlans();
      if (currentPlanId === planId) {
        setMealPlan(null);
        setCurrentPlanId(null);
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };
  
  // Load a saved plan
  const loadPlan = async (plan) => {
    setMealPlan(plan.plan_content);
    setCurrentPlanId(plan.id);
    setSelectedHistoryPlan(plan);
    setActiveTab("results");
  };
  
  // Toggle favorite
  const toggleFavorite = async (planId) => {
    try {
      const headers = await getAuthHeaders();
      await axios.post(`${BACKEND_URL}/diet/plans/${planId}/favorite`, {}, { headers });
      loadSavedPlans();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-[128px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            <span className="text-white">
              Smart Diet Planner
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Personalized nutrition recommendations powered by AI to help you achieve your health goals
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8 overflow-x-auto">
          <div className="inline-flex bg-white/5 rounded-2xl p-1 backdrop-blur-lg border border-white/10">
            {[
              { id: "planner", label: "Meal Planner", icon: GiMeal },
              { id: "tracker", label: "Daily Tracker", icon: FiTarget },
              { id: "recipes", label: "Recipe Finder", icon: FiBookOpen },
              { id: "history", label: "History", icon: MdHistory },
              { id: "results", label: "Current Plan", icon: FiStar },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <tab.icon />
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* Meal Planner Tab */}
          {activeTab === "planner" && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Diet Type Selection */}
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <MdOutlineFoodBank className="text-emerald-400" />
                  Choose Your Diet Type
                </h2>
                <p className="text-gray-400 text-sm mb-6">Select a diet plan that matches your lifestyle</p>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {dietTypes.map((diet, index) => {
                    const Icon = diet.icon;
                    const isSelected = selectedDiet === diet.id;
                    
                    return (
                      <motion.div
                        key={diet.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDiet(diet.id)}
                        className={`relative p-4 rounded-xl cursor-pointer transition-all text-center
                          ${isSelected 
                            ? `bg-gradient-to-br ${diet.color} shadow-lg` 
                            : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}
                      >
                        <Icon className={`text-3xl mx-auto mb-2 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                        <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{diet.name}</h3>
                        <p className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>{diet.description}</p>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                          >
                            <FiCheck className="text-emerald-500 text-sm" />
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Health Conditions */}
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <FiHeart className="text-pink-400" />
                  Health Conditions
                </h2>
                <p className="text-gray-400 text-sm mb-6">Select any conditions we should consider (optional)</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {healthConditions.map((condition, index) => {
                    const Icon = condition.icon;
                    const isSelected = selectedConditions.includes(condition.id);
                    
                    return (
                      <motion.div
                        key={condition.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleCondition(condition.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border
                          ${isSelected 
                            ? `${condition.color} border-2` 
                            : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                      >
                        <Icon className={`text-xl ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {condition.name}
                        </span>
                        {isSelected && <FiCheck className="ml-auto text-emerald-400" />}
                      </motion.div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Allergies & Restrictions */}
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <FiActivity className="text-orange-400" />
                  Allergies & Restrictions
                </h2>
                <p className="text-gray-400 text-sm mb-6">Select any foods you need to avoid</p>
                
                <div className="flex flex-wrap gap-3">
                  {allergiesOptions.map((allergy, index) => {
                    const isSelected = selectedAllergies.includes(allergy);
                    
                    return (
                      <motion.button
                        key={allergy}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleAllergy(allergy)}
                        className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2
                          ${isSelected 
                            ? 'bg-red-500/20 border-2 border-red-500/50 text-red-300' 
                            : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'}`}
                      >
                        {isSelected && <FiCheck className="text-sm" />}
                        {allergy}
                      </motion.button>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Calorie Goal & Preferences */}
              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FiTarget className="text-emerald-400" />
                    Daily Calorie Goal
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Target</span>
                      <span className="text-2xl font-bold text-emerald-400">{calorieGoal} kcal</span>
                    </div>
                    <input
                      type="range"
                      min="1200"
                      max="4000"
                      step="50"
                      value={calorieGoal}
                      onChange={(e) => setCalorieGoal(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 
                        [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1200</span>
                      <span>2500</span>
                      <span>4000</span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FiClock className="text-blue-400" />
                    Preferences
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Cuisine Preference</label>
                      <select
                        value={cuisinePreference}
                        onChange={(e) => setCuisinePreference(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none transition-colors"
                      >
                        <option value="any">Any Cuisine</option>
                        <option value="indian">Indian</option>
                        <option value="mediterranean">Mediterranean</option>
                        <option value="asian">Asian</option>
                        <option value="mexican">Mexican</option>
                        <option value="american">American</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-2 block">Max Cooking Time</label>
                      <select
                        value={cookingTime}
                        onChange={(e) => setCookingTime(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 focus:outline-none transition-colors"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">No limit</option>
                      </select>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateMealPlan}
                disabled={isLoading}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 
                  text-white font-bold text-lg shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 
                  transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <FiRefreshCw className="animate-spin text-xl" />
                    Generating Your Plan...
                  </>
                ) : (
                  <>
                    <GiMeal className="text-xl" />
                    Generate My Personalized Meal Plan
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Daily Tracker Tab */}
          {activeTab === "tracker" && (
            <motion.div
              key="tracker"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Calorie & Water Tracking */}
              <div className="grid md:grid-cols-2 gap-6">
                <GlassCard className="p-8">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FiZap className="text-emerald-400" />
                    Calorie Intake
                  </h2>
                  <CalorieTracker consumed={caloriesConsumed} goal={calorieGoal} />
                  
                  <div className="mt-6 flex gap-3 justify-center">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => updateCalories(Math.max(0, caloriesConsumed - 100))}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
                    >
                      -100 kcal
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => updateCalories(caloriesConsumed + 100)}
                      className="px-4 py-2 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/50 transition-colors text-sm"
                    >
                      +100 kcal
                    </motion.button>
                  </div>
                </GlassCard>

                <GlassCard className="p-8">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <FiDroplet className="text-blue-400" />
                    Water Intake
                  </h2>
                  <WaterTracker glasses={waterGlasses} setGlasses={updateWater} />
                </GlassCard>
              </div>

              {/* Macro Tracking */}
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <FiTrendingUp className="text-purple-400" />
                  Macronutrients
                </h2>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MacroCard 
                    name="Protein" 
                    value={macros.protein.value} 
                    goal={macros.protein.goal} 
                    unit="g" 
                    color="from-blue-500 to-cyan-500"
                    icon={GiMuscleUp}
                  />
                  <MacroCard 
                    name="Carbs" 
                    value={macros.carbs.value} 
                    goal={macros.carbs.goal} 
                    unit="g" 
                    color="from-orange-500 to-yellow-500"
                    icon={FiZap}
                  />
                  <MacroCard 
                    name="Fats" 
                    value={macros.fats.value} 
                    goal={macros.fats.goal} 
                    unit="g" 
                    color="from-pink-500 to-rose-500"
                    icon={FiHeart}
                  />
                  <MacroCard 
                    name="Fiber" 
                    value={macros.fiber.value} 
                    goal={macros.fiber.goal} 
                    unit="g" 
                    color="from-green-500 to-emerald-500"
                    icon={GiFruitBowl}
                  />
                </div>
              </GlassCard>

              {/* Meal Times */}
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <FiClock className="text-yellow-400" />
                  Today's Meals
                </h2>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {mealTimes.map((meal) => (
                    <MealPlanCard
                      key={meal.id}
                      meal={meal}
                      isActive={activeMeal === meal.id}
                      onClick={() => setActiveMeal(meal.id)}
                    />
                  ))}
                </div>
              </GlassCard>

              {/* Quick Add Meal */}
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FiPlus className="text-emerald-400" />
                  Quick Add Meal
                </h2>
                
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { name: "Salad", cal: 150, icon: GiFruitBowl },
                    { name: "Sandwich", cal: 350, icon: MdOutlineRestaurant },
                    { name: "Smoothie", cal: 200, icon: FiCoffee },
                    { name: "Snack Bar", cal: 180, icon: GiMeal },
                  ].map((item, index) => (
                    <motion.button
                      key={item.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateCalories(caloriesConsumed + item.cal)}
                      className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-center"
                    >
                      <item.icon className="text-2xl mx-auto mb-2 text-gray-400" />
                      <p className="text-white font-medium">{item.name}</p>
                      <p className="text-gray-500 text-sm">+{item.cal} kcal</p>
                    </motion.button>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Recipe Finder Tab */}
          {activeTab === "recipes" && (
            <motion.div
              key="recipes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recipe Search */}
                <div className="lg:col-span-2 space-y-6">
                  <GlassCard className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <GiCookingPot className="text-orange-400" />
                      Find Recipes by Ingredients
                    </h2>
                    <p className="text-gray-400 text-sm mb-4">
                      Enter the ingredients you have, and we'll suggest delicious recipes
                    </p>
                    
                    <div className="relative">
                      <input
                        type="text"
                        value={ingredients}
                        onChange={(e) => setIngredients(e.target.value)}
                        placeholder="e.g., chicken, tomatoes, garlic, olive oil..."
                        className="w-full p-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-white 
                          placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                      />
                      <MdOutlineFoodBank className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-gray-500" />
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={generateRecipes}
                      disabled={isLoading}
                      className="mt-4 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 
                        text-white font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 
                        transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <FiRefreshCw className="animate-spin" />
                          Finding Recipes...
                        </>
                      ) : (
                        <>
                          <FiBookOpen />
                          Find Recipes
                        </>
                      )}
                    </motion.button>
                  </GlassCard>

                  {/* Recipe Results */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-300">Suggested Recipes</h3>
                    {sampleRecipes.map((recipe, index) => (
                      <RecipeCard key={index} recipe={recipe} index={index} />
                    ))}
                  </div>
                </div>

                {/* Recipe Filters */}
                <div className="space-y-6">
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <FiActivity className="text-purple-400" />
                      Recipe Filters
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-gray-400 text-sm mb-2 block">Meal Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {["Breakfast", "Lunch", "Dinner", "Snack"].map((type) => (
                            <button
                              key={type}
                              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 
                                text-gray-400 hover:text-white text-sm transition-all"
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-gray-400 text-sm mb-2 block">Cooking Time</label>
                        <div className="flex gap-2">
                          {["< 15m", "< 30m", "< 1h"].map((time) => (
                            <button
                              key={time}
                              className="flex-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 
                                text-gray-400 hover:text-white text-sm transition-all"
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-gray-400 text-sm mb-2 block">Difficulty</label>
                        <div className="flex gap-2">
                          {["Easy", "Medium", "Hard"].map((diff) => (
                            <button
                              key={diff}
                              className="flex-1 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 
                                text-gray-400 hover:text-white text-sm transition-all"
                            >
                              {diff}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <FiAward className="text-yellow-400" />
                      Popular Categories
                    </h3>
                    
                    <div className="space-y-2">
                      {[
                        { name: "High Protein", count: 245, color: "text-blue-400" },
                        { name: "Low Carb", count: 189, color: "text-green-400" },
                        { name: "Quick & Easy", count: 312, color: "text-orange-400" },
                        { name: "Vegetarian", count: 156, color: "text-emerald-400" },
                        { name: "Heart Healthy", count: 98, color: "text-pink-400" },
                      ].map((cat) => (
                        <motion.button
                          key={cat.name}
                          whileHover={{ x: 5 }}
                          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
                        >
                          <span className={`font-medium ${cat.color}`}>{cat.name}</span>
                          <span className="text-gray-500 text-sm">{cat.count} recipes</span>
                        </motion.button>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              </div>
            </motion.div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <MdHistory className="text-purple-400" />
                    Saved Meal Plans
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadSavedPlans}
                    disabled={isLoadingHistory}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
                  >
                    <FiRefreshCw className={isLoadingHistory ? 'animate-spin' : ''} />
                    Refresh
                  </motion.button>
                </div>
                
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <FiRefreshCw className="animate-spin text-3xl text-emerald-400" />
                  </div>
                ) : savedPlans.length > 0 ? (
                  <div className="space-y-4">
                    {savedPlans.map((plan, index) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white truncate">{plan.plan_name}</h3>
                              {plan.is_favorite ? (
                                <FiStar className="text-yellow-400 fill-yellow-400 flex-shrink-0" />
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {plan.diet_type && (
                                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                                  {plan.diet_type}
                                </span>
                              )}
                              {plan.calorie_goal && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                                  {plan.calorie_goal} kcal
                                </span>
                              )}
                              <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                                {plan.plan_type === 'recipe' ? 'Recipe' : 'Meal Plan'}
                              </span>
                            </div>
                            <p className="text-gray-500 text-sm flex items-center gap-2">
                              <FiCalendar className="flex-shrink-0" />
                              {new Date(plan.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleFavorite(plan.id)}
                              className="p-2 rounded-lg bg-white/5 hover:bg-yellow-500/20 transition-colors"
                              title="Toggle Favorite"
                            >
                              <FiStar className={plan.is_favorite ? 'text-yellow-400' : 'text-gray-400'} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => loadPlan(plan)}
                              className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 transition-colors"
                              title="View Plan"
                            >
                              <FiChevronRight className="text-emerald-400" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deletePlan(plan.id)}
                              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                              title="Delete Plan"
                            >
                              <FiTrash2 className="text-red-400" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <FiList className="text-3xl text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Saved Plans Yet</h3>
                    <p className="text-gray-400 mb-6">
                      Generate your first meal plan and it will appear here.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab("planner")}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold"
                    >
                      Create Meal Plan
                    </motion.button>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {/* Results Tab */}
          {activeTab === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {mealPlan ? (
                <GlassCard className="p-8">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500">
                        <GiMeal className="text-2xl text-white" />
                      </div>
                      Your Personalized Plan
                    </h2>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab("planner")}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
                      >
                        <FiRefreshCw />
                        New Plan
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="max-h-[60vh] overflow-y-auto">
                    <MealPlanDisplay content={mealPlan} />
                  </div>
                  
                  <div className="mt-8 flex flex-wrap gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => exportPlan('txt')}
                      disabled={isExporting}
                      className="flex-1 min-w-[150px] py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 
                        text-white font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isExporting ? <FiRefreshCw className="animate-spin" /> : <FiFileText />}
                      Export as Text
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => exportPlan('pdf')}
                      disabled={isExporting}
                      className="flex-1 min-w-[150px] py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 
                        text-white font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isExporting ? <FiRefreshCw className="animate-spin" /> : <FiDownload />}
                      Export as PDF
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab("history")}
                      className="flex-1 min-w-[150px] py-3 px-6 rounded-xl bg-white/10 hover:bg-white/20 
                        text-white font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <MdHistory />
                      View History
                    </motion.button>
                  </div>
                </GlassCard>
              ) : (
                <GlassCard className="p-12 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 
                      flex items-center justify-center">
                      <GiMeal className="text-4xl text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No Plan Generated Yet</h3>
                    <p className="text-gray-400 mb-6">
                      Head over to the Meal Planner tab to create your personalized nutrition plan based on your preferences and health goals.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab("planner")}
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 
                          text-white font-bold shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                      >
                        <FiTarget />
                        Create My Plan
                      </motion.button>
                      {savedPlans.length > 0 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab("history")}
                          className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 
                            text-white font-bold flex items-center gap-2"
                        >
                          <MdHistory />
                          View Saved Plans
                        </motion.button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              )}

              {/* Quick Stats */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Daily Calories", value: `${calorieGoal}`, unit: "kcal", color: "from-emerald-500 to-teal-500", icon: FiZap },
                  { label: "Water Goal", value: "8", unit: "glasses", color: "from-blue-500 to-cyan-500", icon: FiDroplet },
                  { label: "Saved Plans", value: `${savedPlans.length}`, unit: "plans", color: "from-purple-500 to-pink-500", icon: FiList },
                  { label: "Diet Type", value: dietTypes.find(d => d.id === selectedDiet)?.name || "Balanced", unit: "", color: "from-orange-500 to-red-500", icon: FiHeart },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative overflow-hidden rounded-xl bg-white/5 backdrop-blur-lg border border-white/10 p-5"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`} />
                    <div className="relative">
                      <stat.icon className={`text-2xl mb-3 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {stat.value} <span className="text-sm text-gray-400 font-normal">{stat.unit}</span>
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <Dictaphone />
    </div>
  );
}