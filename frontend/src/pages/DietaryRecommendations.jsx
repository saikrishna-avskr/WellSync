import { useState, useEffect, useCallback } from "react";
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
  MdHistory,
} from "react-icons/md";
import Dictaphone from "../Dictaphone";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Diet Types Data
const dietTypes = [
  { id: "balanced", name: "Balanced", icon: GiMeal, color: "bg-teal-700", description: "Well-rounded nutrition" },
  { id: "keto", name: "Keto", icon: GiMeat, color: "bg-teal-700", description: "Low-carb, high-fat" },
  { id: "vegan", name: "Vegan", icon: GiFruitBowl, color: "bg-teal-700", description: "Plant-based only" },
  { id: "paleo", name: "Paleo", icon: GiMuscleUp, color: "bg-teal-700", description: "Whole foods diet" },
  { id: "mediterranean", name: "Mediterranean", icon: MdOutlineLocalDining, color: "bg-teal-700", description: "Heart-healthy eating" },
  { id: "lowcarb", name: "Low Carb", icon: FiTrendingUp, color: "bg-teal-700", description: "Reduced carbohydrates" },
];

// Health Conditions
const healthConditions = [
  { id: "diabetes", name: "Diabetes", icon: GiHeartBeats },
  { id: "hypertension", name: "Hypertension", icon: FiHeart },
  { id: "cholesterol", name: "High Cholesterol", icon: FiActivity },
  { id: "weightloss", name: "Weight Loss", icon: GiWeightScale },
  { id: "musclegain", name: "Muscle Gain", icon: GiMuscleUp },
  { id: "digestive", name: "Digestive Issues", icon: GiStomach },
  { id: "kidney", name: "Kidney Health", icon: GiKidneys },
  { id: "mental", name: "Mental Wellness", icon: GiBrain },
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
    whileHover={{ scale: 1.01 }}
    onClick={onClick}
    className={`relative overflow-hidden rounded-2xl 
      ${isSelected ? 'bg-[#1e2a30] border-2 border-teal-600' : 'bg-[#1a1f2e] border border-[#2a3040]'} 
      transition-all duration-300 cursor-pointer ${className}`}
  >
    {children}
  </motion.div>
);



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
      { emoji: '🌅', name: 'Breakfast', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
      { emoji: '🍳', name: 'Breakfast', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
      { emoji: '🥣', name: 'Breakfast', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
      { emoji: '🍎', name: 'Mid-Morning Snack', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
      { emoji: '🥗', name: 'Lunch', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
      { emoji: '🍽️', name: 'Lunch', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
      { emoji: '🥜', name: 'Afternoon Snack', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
      { emoji: '🍽️', name: 'Dinner', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
      { emoji: '🐟', name: 'Dinner', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
      { emoji: '🥩', name: 'Dinner', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
      { emoji: '🫖', name: 'Evening', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
      { emoji: '🌙', name: 'Evening', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
      { emoji: '📊', name: 'Summary', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
      { emoji: '✅', name: 'Summary', color: 'bg-teal-700', bg: 'bg-[#1a2520]' },
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
        let style = { color: 'bg-teal-700', bg: 'bg-[#1a2520]' };
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
          sections.unshift({ header: 'intro', style: { bg: 'bg-[#1a1f2e]' }, items: [] });
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
          className={`rounded-xl border border-[#2a3040] overflow-hidden ${section.style.bg}`}
        >
          {section.header !== 'intro' && (
            <div className={`px-5 py-3 ${section.style.color}`}>
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
                <div key={i} className={`py-1.5 ${i > 0 ? 'border-t border-[#2a3040]' : ''}`}>
                  {hasCalories || hasNutrition ? (
                    <p className="text-teal-400 text-sm font-medium">{item}</p>
                  ) : item.startsWith('•') || item.startsWith('-') ? (
                    <p className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-teal-400 mt-0.5">•</span>
                      <span>{item.replace(/^[•-]\s*/, '')}</span>
                    </p>
                  ) : (
                    <p className="text-slate-300 text-sm leading-relaxed">{item}</p>
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

  
  // Calorie Goal State
  const [calorieGoal, setCalorieGoal] = useState(2000);
  
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
  
  // Recipe Finder State
  const [recipeResults, setRecipeResults] = useState([]);
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState(null);
  const [recipeIngredientTags, setRecipeIngredientTags] = useState([]);
  const [recipeIngredientInput, setRecipeIngredientInput] = useState("");
  const [recipeFilters, setRecipeFilters] = useState({
    mealType: "any",
    cookingTime: "any",
    difficulty: "any",
  });
  const [recipeError, setRecipeError] = useState(null);
  

  
  // History State  
  const [savedPlans, setSavedPlans] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedHistoryPlan, setSelectedHistoryPlan] = useState(null);
  
  // Export State
  const [isExporting, setIsExporting] = useState(false);
  
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
  
  // Generate Recipe Suggestions (using AI via backend)
  const generateRecipes = async (categoryOverride = null) => {
    const ingredientText = recipeIngredientTags.length > 0 
      ? recipeIngredientTags.join(", ") 
      : ingredients.trim();
    
    if (!ingredientText && !categoryOverride) {
      setRecipeError("Please add at least one ingredient or select a category.");
      return;
    }
    
    setIsLoadingRecipes(true);
    setRecipeError(null);
    setExpandedRecipe(null);
    const userEmail = getUserEmail();

    try {
      const headers = await getAuthHeaders();
      const response = await axios.post(`${BACKEND_URL}/diet/generate-recipes`, {
        user_email: userEmail,
        ingredients: ingredientText,
        diet_type: selectedDiet,
        allergies: selectedAllergies,
        cooking_time: recipeFilters.cookingTime !== "any" ? recipeFilters.cookingTime : cookingTime,
        cuisine_preference: cuisinePreference,
        meal_type: recipeFilters.mealType,
        difficulty: recipeFilters.difficulty,
        category: categoryOverride || "",
      }, { headers });
      
      if (response.data?.success && Array.isArray(response.data.recipes)) {
        setRecipeResults(response.data.recipes);
        if (response.data.plan_id) {
          setCurrentPlanId(response.data.plan_id);
        }
        if (response.data.raw_content) {
          setMealPlan(response.data.raw_content);
        }
        if (isSignedIn) {
          loadSavedPlans();
        }
      } else {
        throw new Error(response.data?.error || "Failed to generate recipes");
      }
    } catch (error) {
      console.error("Error generating recipes:", error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to generate recipes";
      setRecipeError(errorMessage);
      setRecipeResults([]);
    } finally {
      setIsLoadingRecipes(false);
    }
  };

  // Add ingredient tag
  const addIngredientTag = (value) => {
    const trimmed = (value || recipeIngredientInput).trim().toLowerCase();
    if (trimmed && !recipeIngredientTags.includes(trimmed)) {
      setRecipeIngredientTags(prev => [...prev, trimmed]);
    }
    setRecipeIngredientInput("");
  };

  // Remove ingredient tag
  const removeIngredientTag = (tag) => {
    setRecipeIngredientTags(prev => prev.filter(t => t !== tag));
  };

  // Handle ingredient input keydown
  const handleIngredientKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addIngredientTag();
    } else if (e.key === "Backspace" && !recipeIngredientInput && recipeIngredientTags.length > 0) {
      setRecipeIngredientTags(prev => prev.slice(0, -1));
    }
  };

  // Filter recipe results client-side
  const filteredRecipes = recipeResults.filter(recipe => {
    if (recipeFilters.mealType !== "any" && recipe.mealType?.toLowerCase() !== recipeFilters.mealType.toLowerCase()) {
      return false;
    }
    if (recipeFilters.difficulty !== "any" && recipe.difficulty?.toLowerCase() !== recipeFilters.difficulty.toLowerCase()) {
      return false;
    }
    if (recipeFilters.cookingTime !== "any") {
      const maxTime = parseInt(recipeFilters.cookingTime);
      if (recipe.cookingTime > maxTime) return false;
    }
    return true;
  });
  
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
    <div className="min-h-screen bg-[#0f1219] text-white overflow-x-hidden">
      {/* Subtle Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-teal-900/20 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-slate-800/30 rounded-full blur-[200px]" />
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
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Personalized nutrition recommendations powered by AI to help you achieve your health goals
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8 overflow-x-auto">
          <div className="inline-flex bg-[#1a1f2e] rounded-2xl p-1 border border-[#2a3040]">
            {[
              { id: "planner", label: "Meal Planner", icon: GiMeal },
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
                    ? "bg-teal-600 text-white shadow-lg shadow-teal-900/30"
                    : "text-slate-400 hover:text-white hover:bg-[#232830]"
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
                  <MdOutlineFoodBank className="text-teal-400" />
                  Choose Your Diet Type
                </h2>
                <p className="text-slate-400 text-sm mb-6">Select a diet plan that matches your lifestyle</p>
                
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
                            ? `${diet.color} shadow-lg shadow-teal-900/20` 
                            : 'bg-[#1a1f2e] hover:bg-[#232830] border border-[#2a3040]'}`}
                      >
                        <Icon className={`text-3xl mx-auto mb-2 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>{diet.name}</h3>
                        <p className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>{diet.description}</p>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                          >
                            <FiCheck className="text-teal-600 text-sm" />
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
                  <FiHeart className="text-teal-400" />
                  Health Conditions
                </h2>
                <p className="text-slate-400 text-sm mb-6">Select any conditions we should consider (optional)</p>
                
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
                            ? 'bg-teal-900/40 border-teal-600 border-2' 
                            : 'bg-[#1a1f2e] border-[#2a3040] hover:border-[#3a4050]'}`}
                      >
                        <Icon className={`text-xl ${isSelected ? 'text-teal-400' : 'text-slate-400'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {condition.name}
                        </span>
                        {isSelected && <FiCheck className="ml-auto text-teal-400" />}
                      </motion.div>
                    );
                  })}
                </div>
              </GlassCard>

              {/* Allergies & Restrictions */}
              <GlassCard className="p-6">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <FiActivity className="text-teal-400" />
                  Allergies & Restrictions
                </h2>
                <p className="text-slate-400 text-sm mb-6">Select any foods you need to avoid</p>
                
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
                            ? 'bg-red-900/30 border-2 border-red-500/50 text-red-300' 
                            : 'bg-[#1a1f2e] border border-[#2a3040] text-slate-400 hover:bg-[#232830]'}`}
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
                    <FiTarget className="text-teal-400" />
                    Daily Calorie Goal
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Target</span>
                      <span className="text-2xl font-bold text-teal-400">{calorieGoal} kcal</span>
                    </div>
                    <input
                      type="range"
                      min="1200"
                      max="4000"
                      step="50"
                      value={calorieGoal}
                      onChange={(e) => setCalorieGoal(Number(e.target.value))}
                      className="w-full h-2 bg-[#2a3040] rounded-full appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 
                        [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>1200</span>
                      <span>2500</span>
                      <span>4000</span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FiClock className="text-teal-400" />
                    Preferences
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-slate-400 text-sm mb-2 block">Cuisine Preference</label>
                      <select
                        value={cuisinePreference}
                        onChange={(e) => setCuisinePreference(e.target.value)}
                        className="w-full p-3 bg-[#161a22] border border-[#2a3040] rounded-xl text-white focus:border-teal-500 focus:outline-none transition-colors"
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
                      <label className="text-slate-400 text-sm mb-2 block">Max Cooking Time</label>
                      <select
                        value={cookingTime}
                        onChange={(e) => setCookingTime(e.target.value)}
                        className="w-full p-3 bg-[#161a22] border border-[#2a3040] rounded-xl text-white focus:border-teal-500 focus:outline-none transition-colors"
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
                className="w-full py-4 px-8 rounded-2xl bg-teal-600 hover:bg-teal-700
                  text-white font-bold text-lg shadow-lg shadow-teal-900/30 
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
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                      <GiCookingPot className="text-teal-400" />
                      Find Recipes by Ingredients
                    </h2>
                    <p className="text-slate-400 text-sm mb-4">
                      Add the ingredients you have and we&apos;ll suggest delicious recipes
                    </p>
                    
                    {/* Ingredient Tags */}
                    <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                      {recipeIngredientTags.map((tag) => (
                        <motion.span
                          key={tag}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-900/30 border border-teal-600/40 text-teal-300 text-sm"
                        >
                          {tag}
                          <button onClick={() => removeIngredientTag(tag)} className="hover:text-white transition-colors">
                            <FiMinus className="text-xs" />
                          </button>
                        </motion.span>
                      ))}
                    </div>

                    {/* Input */}
                    <div className="relative">
                      <input
                        type="text"
                        value={recipeIngredientInput}
                        onChange={(e) => setRecipeIngredientInput(e.target.value)}
                        onKeyDown={handleIngredientKeyDown}
                        placeholder={recipeIngredientTags.length > 0 ? "Add more ingredients..." : "e.g., chicken, tomatoes, garlic, olive oil..."}
                        className="w-full p-4 pr-24 bg-[#161a22] border border-[#2a3040] rounded-xl text-white 
                          placeholder-slate-500 focus:border-teal-500 focus:outline-none transition-colors"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        {recipeIngredientInput.trim() && (
                          <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => addIngredientTag()}
                            className="p-2 rounded-lg bg-teal-600/30 hover:bg-teal-600/50 transition-colors"
                          >
                            <FiPlus className="text-teal-300" />
                          </motion.button>
                        )}
                        <MdOutlineFoodBank className="text-2xl text-slate-500 p-1" />
                      </div>
                    </div>

                    <p className="text-slate-500 text-xs mt-2">Press Enter or comma to add each ingredient</p>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => generateRecipes()}
                      disabled={isLoadingRecipes}
                      className="mt-4 w-full py-3.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700
                        text-white font-bold shadow-lg shadow-teal-900/25 
                        transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoadingRecipes ? (
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

                  {/* Error */}
                  {recipeError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm flex items-start gap-3"
                    >
                      <FiActivity className="text-red-400 text-lg flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">Could not fetch recipes</p>
                        <p className="text-red-400/80">{recipeError}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Loading Skeleton */}
                  {isLoadingRecipes && (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-[#1a1f2e] rounded-xl p-5 border border-[#2a3040] animate-pulse">
                          <div className="flex gap-4">
                            <div className="w-20 h-20 rounded-xl bg-[#2a3040]" />
                            <div className="flex-1 space-y-2">
                              <div className="h-5 bg-[#2a3040] rounded w-2/3" />
                              <div className="h-4 bg-[#2a3040] rounded w-1/3" />
                              <div className="flex gap-2">
                                <div className="h-6 bg-[#2a3040] rounded-full w-20" />
                                <div className="h-6 bg-[#2a3040] rounded-full w-16" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recipe Results */}
                  {!isLoadingRecipes && filteredRecipes.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-300 flex items-center gap-2">
                          <MdOutlineRestaurant className="text-teal-400" />
                          {filteredRecipes.length} Recipe{filteredRecipes.length !== 1 ? "s" : ""} Found
                        </h3>
                        {recipeResults.length !== filteredRecipes.length && (
                          <span className="text-slate-500 text-sm">
                            {recipeResults.length - filteredRecipes.length} filtered out
                          </span>
                        )}
                      </div>

                      {filteredRecipes.map((recipe, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className="bg-[#1a1f2e] rounded-xl border border-[#2a3040] 
                            overflow-hidden hover:border-teal-600/40 transition-all group"
                        >
                          {/* Card Header */}
                          <div
                            className="p-5 cursor-pointer"
                            onClick={() => setExpandedRecipe(expandedRecipe === index ? null : index)}
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-16 h-16 rounded-xl bg-teal-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-900/20">
                                <GiCookingPot className="text-2xl text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-semibold text-lg group-hover:text-teal-400 transition-colors truncate">
                                  {recipe.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-slate-400 text-sm">
                                  <span className="flex items-center gap-1">
                                    <FiZap className="text-teal-400" /> {recipe.calories} kcal
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <FiClock className="text-teal-400" /> {recipe.cookingTime} min
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <GiMuscleUp className="text-teal-400" /> {recipe.servings} servings
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    recipe.difficulty === "Easy" ? "bg-green-500/20 text-green-400" :
                                    recipe.difficulty === "Hard" ? "bg-red-500/20 text-red-400" :
                                    "bg-yellow-500/20 text-yellow-400"
                                  }`}>
                                    {recipe.difficulty}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {(recipe.tags || []).map((tag, i) => (
                                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#232830] text-slate-300 border border-[#2a3040]">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <motion.div
                                animate={{ rotate: expandedRecipe === index ? 90 : 0 }}
                                className="text-slate-500 group-hover:text-white transition-colors flex-shrink-0 mt-2"
                              >
                                <FiChevronRight className="text-xl" />
                              </motion.div>
                            </div>

                            {/* Compact Macros Bar */}
                            <div className="flex gap-4 mt-3 pt-3 border-t border-[#2a3040]">
                              {[
                                { label: "Protein", val: recipe.protein, color: "text-teal-400", bg: "bg-teal-600" },
                                { label: "Carbs", val: recipe.carbs, color: "text-teal-400", bg: "bg-teal-600" },
                                { label: "Fats", val: recipe.fats, color: "text-teal-400", bg: "bg-teal-600" },
                                { label: "Fiber", val: recipe.fiber, color: "text-teal-400", bg: "bg-teal-600" },
                              ].map((m) => (
                                <div key={m.label} className="flex-1">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-500">{m.label}</span>
                                    <span className={m.color}>{m.val}g</span>
                                  </div>
                                  <div className="h-1 bg-[#2a3040] rounded-full overflow-hidden">
                                    <div className={`h-full ${m.bg} rounded-full`} style={{ width: `${Math.min((m.val / 60) * 100, 100)}%` }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Expanded Detail */}
                          <AnimatePresence>
                            {expandedRecipe === index && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-5 space-y-5 border-t border-[#2a3040]">
                                  {/* Ingredients */}
                                  <div className="pt-4">
                                    <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                                      <FiList className="text-teal-400" />
                                      Ingredients
                                    </h5>
                                    <div className="grid sm:grid-cols-2 gap-2">
                                      {(recipe.ingredients || []).map((ing, i) => (
                                        <div key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                                          <span className="text-teal-400 mt-0.5">•</span>
                                          <span>{ing}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Instructions */}
                                  <div>
                                    <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                                      <FiBookOpen className="text-teal-400" />
                                      Instructions
                                    </h5>
                                    <ol className="space-y-2">
                                      {(recipe.instructions || []).map((step, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm">
                                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-700
                                            flex items-center justify-center text-white text-xs font-bold">
                                            {i + 1}
                                          </span>
                                          <span className="text-slate-300 leading-relaxed pt-0.5">{step}</span>
                                        </li>
                                      ))}
                                    </ol>
                                  </div>

                                  {/* Nutrition Benefits */}
                                  {recipe.nutritionBenefits && (
                                    <div className="bg-teal-900/20 rounded-lg p-3 border border-teal-700/30">
                                      <h5 className="text-teal-400 font-semibold text-sm mb-1 flex items-center gap-2">
                                        <FiHeart /> Nutrition Benefits
                                      </h5>
                                      <p className="text-slate-300 text-sm leading-relaxed">{recipe.nutritionBenefits}</p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {!isLoadingRecipes && recipeResults.length === 0 && !recipeError && (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#1a2520]
                        flex items-center justify-center border border-[#2a3040]">
                        <GiCookingPot className="text-4xl text-teal-400/60" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Ready to Cook?</h3>
                      <p className="text-slate-400 max-w-md mx-auto">
                        Add your available ingredients above and click Find Recipes to get AI-powered recipe suggestions tailored to your diet.
                      </p>
                    </div>
                  )}

                  {/* No filtered results */}
                  {!isLoadingRecipes && recipeResults.length > 0 && filteredRecipes.length === 0 && (
                    <div className="text-center py-10">
                      <FiActivity className="text-3xl text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400">No recipes match your current filters. Try adjusting them.</p>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRecipeFilters({ mealType: "any", cookingTime: "any", difficulty: "any" })}
                        className="mt-3 px-4 py-2 text-sm rounded-lg bg-[#1a1f2e] text-slate-300 hover:bg-[#232830]"
                      >
                        Clear Filters
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Sidebar — Filters & Categories */}
                <div className="space-y-6">
                  {/* Active Filters Summary */}
                  {(recipeFilters.mealType !== "any" || recipeFilters.cookingTime !== "any" || recipeFilters.difficulty !== "any") && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between bg-[#1a1f2e] rounded-xl p-3 border border-[#2a3040]"
                    >
                      <span className="text-slate-400 text-sm">
                        Filters active
                      </span>
                      <button
                        onClick={() => setRecipeFilters({ mealType: "any", cookingTime: "any", difficulty: "any" })}
                        className="text-teal-400 text-sm font-medium hover:text-teal-300 transition-colors"
                      >
                        Clear all
                      </button>
                    </motion.div>
                  )}

                  <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <FiActivity className="text-teal-400" />
                      Recipe Filters
                    </h3>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="text-slate-400 text-sm mb-2 block">Meal Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "All", value: "any" },
                            { label: "Breakfast", value: "Breakfast" },
                            { label: "Lunch", value: "Lunch" },
                            { label: "Dinner", value: "Dinner" },
                            { label: "Snack", value: "Snack" },
                          ].map((type) => (
                            <button
                              key={type.value}
                              onClick={() => setRecipeFilters(f => ({ ...f, mealType: type.value }))}
                              className={`p-2 rounded-lg border text-sm transition-all ${
                                recipeFilters.mealType === type.value
                                  ? "bg-teal-900/40 border-teal-600 text-teal-300"
                                  : "bg-[#161a22] hover:bg-[#232830] border-[#2a3040] text-slate-400 hover:text-white"
                              }`}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-slate-400 text-sm mb-2 block">Max Cooking Time</label>
                        <div className="flex gap-2">
                          {[
                            { label: "Any", value: "any" },
                            { label: "≤ 15m", value: "15" },
                            { label: "≤ 30m", value: "30" },
                            { label: "≤ 60m", value: "60" },
                          ].map((time) => (
                            <button
                              key={time.value}
                              onClick={() => setRecipeFilters(f => ({ ...f, cookingTime: time.value }))}
                              className={`flex-1 p-2 rounded-lg border text-sm transition-all ${
                                recipeFilters.cookingTime === time.value
                                  ? "bg-teal-900/40 border-teal-600 text-teal-300"
                                  : "bg-[#161a22] hover:bg-[#232830] border-[#2a3040] text-slate-400 hover:text-white"
                              }`}
                            >
                              {time.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-slate-400 text-sm mb-2 block">Difficulty</label>
                        <div className="flex gap-2">
                          {[
                            { label: "Any", value: "any" },
                            { label: "Easy", value: "Easy" },
                            { label: "Medium", value: "Medium" },
                            { label: "Hard", value: "Hard" },
                          ].map((diff) => (
                            <button
                              key={diff.value}
                              onClick={() => setRecipeFilters(f => ({ ...f, difficulty: diff.value }))}
                              className={`flex-1 p-2 rounded-lg border text-sm transition-all ${
                                recipeFilters.difficulty === diff.value
                                  ? "bg-teal-900/40 border-teal-600 text-teal-300"
                                  : "bg-[#161a22] hover:bg-[#232830] border-[#2a3040] text-slate-400 hover:text-white"
                              }`}
                            >
                              {diff.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Quick Categories */}
                  <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <FiAward className="text-teal-400" />
                      Quick Categories
                    </h3>
                    <p className="text-slate-500 text-xs mb-3">Click a category to generate recipes</p>
                    
                    <div className="space-y-2">
                      {[
                        { name: "High Protein", icon: GiMuscleUp, color: "text-teal-400" },
                        { name: "Low Carb", icon: FiTrendingUp, color: "text-teal-400" },
                        { name: "Quick & Easy", icon: FiClock, color: "text-teal-400" },
                        { name: "Vegetarian", icon: GiFruitBowl, color: "text-teal-400" },
                        { name: "Heart Healthy", icon: FiHeart, color: "text-teal-400" },
                        { name: "Meal Prep", icon: GiMeal, color: "text-teal-400" },
                      ].map((cat) => {
                        const CatIcon = cat.icon;
                        return (
                          <motion.button
                            key={cat.name}
                            whileHover={{ x: 5, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => generateRecipes(cat.name)}
                            disabled={isLoadingRecipes}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl bg-[#161a22]
                              border border-[#2a3040] hover:border-teal-600/40 transition-all disabled:opacity-50`}
                          >
                            <CatIcon className={`text-lg ${cat.color}`} />
                            <span className={`font-medium text-sm ${cat.color}`}>{cat.name}</span>
                            <FiChevronRight className="ml-auto text-slate-600 text-sm" />
                          </motion.button>
                        );
                      })}
                    </div>
                  </GlassCard>

                  {/* Diet Badge */}
                  <div className="bg-[#1a2520] rounded-xl p-4 border border-teal-800/40">
                    <p className="text-teal-400 text-sm font-semibold mb-1">Active Diet</p>
                    <p className="text-white font-bold text-lg capitalize">{selectedDiet}</p>
                    <p className="text-slate-400 text-xs mt-1">Recipes follow your {selectedDiet} diet preferences</p>
                  </div>
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
                    <MdHistory className="text-teal-400" />
                    Saved Meal Plans
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={loadSavedPlans}
                    disabled={isLoadingHistory}
                    className="px-4 py-2 rounded-xl bg-[#232830] hover:bg-[#2a3040] transition-colors flex items-center gap-2"
                  >
                    <FiRefreshCw className={isLoadingHistory ? 'animate-spin' : ''} />
                    Refresh
                  </motion.button>
                </div>
                
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <FiRefreshCw className="animate-spin text-3xl text-teal-400" />
                  </div>
                ) : savedPlans.length > 0 ? (
                  <div className="space-y-4">
                    {savedPlans.map((plan, index) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-[#1a1f2e] rounded-xl p-5 border border-[#2a3040] hover:border-[#3a4050] transition-all"
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
                                <span className="text-xs px-2 py-1 rounded-full bg-teal-900/30 text-teal-400">
                                  {plan.diet_type}
                                </span>
                              )}
                              {plan.calorie_goal && (
                                <span className="text-xs px-2 py-1 rounded-full bg-teal-900/30 text-teal-400">
                                  {plan.calorie_goal} kcal
                                </span>
                              )}
                              <span className="text-xs px-2 py-1 rounded-full bg-teal-900/30 text-teal-400">
                                {plan.plan_type === 'recipe' ? 'Recipe' : 'Meal Plan'}
                              </span>
                            </div>
                            <p className="text-slate-500 text-sm flex items-center gap-2">
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
                              className="p-2 rounded-lg bg-[#161a22] hover:bg-[#232830] transition-colors"
                              title="Toggle Favorite"
                            >
                              <FiStar className={plan.is_favorite ? 'text-yellow-400' : 'text-slate-400'} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => loadPlan(plan)}
                              className="p-2 rounded-lg bg-teal-900/30 hover:bg-teal-900/50 transition-colors"
                              title="View Plan"
                            >
                              <FiChevronRight className="text-teal-400" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => deletePlan(plan.id)}
                              className="p-2 rounded-lg bg-red-900/20 hover:bg-red-900/30 transition-colors"
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
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1a1f2e] flex items-center justify-center">
                      <FiList className="text-3xl text-slate-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Saved Plans Yet</h3>
                    <p className="text-slate-400 mb-6">
                      Generate your first meal plan and it will appear here.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab("planner")}
                      className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
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
                      <div className="p-3 rounded-xl bg-teal-700">
                        <GiMeal className="text-2xl text-white" />
                      </div>
                      Your Personalized Plan
                    </h2>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab("planner")}
                        className="px-4 py-2 rounded-xl bg-[#232830] hover:bg-[#2a3040] transition-colors flex items-center gap-2"
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
                      className="flex-1 min-w-[150px] py-3 px-6 rounded-xl bg-teal-600 hover:bg-teal-700
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
                      className="flex-1 min-w-[150px] py-3 px-6 rounded-xl bg-slate-700 hover:bg-slate-600
                        text-white font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isExporting ? <FiRefreshCw className="animate-spin" /> : <FiDownload />}
                      Export as PDF
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab("history")}
                      className="flex-1 min-w-[150px] py-3 px-6 rounded-xl bg-[#232830] hover:bg-[#2a3040]
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
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#1a2520]
                      flex items-center justify-center">
                      <GiMeal className="text-4xl text-teal-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">No Plan Generated Yet</h3>
                    <p className="text-slate-400 mb-6">
                      Head over to the Meal Planner tab to create your personalized nutrition plan based on your preferences and health goals.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveTab("planner")}
                        className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700
                          text-white font-bold shadow-lg shadow-teal-900/25 flex items-center gap-2"
                      >
                        <FiTarget />
                        Create My Plan
                      </motion.button>
                      {savedPlans.length > 0 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveTab("history")}
                          className="px-8 py-3 rounded-xl bg-[#232830] hover:bg-[#2a3040]
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
                  { label: "Daily Calories", value: `${calorieGoal}`, unit: "kcal", icon: FiZap },
                  { label: "Water Goal", value: "8", unit: "glasses", icon: FiDroplet },
                  { label: "Saved Plans", value: `${savedPlans.length}`, unit: "plans", icon: FiList },
                  { label: "Diet Type", value: dietTypes.find(d => d.id === selectedDiet)?.name || "Balanced", unit: "", icon: FiHeart },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative overflow-hidden rounded-xl bg-[#1a1f2e] border border-[#2a3040] p-5"
                  >
                    <div className="relative">
                      <stat.icon className="text-2xl mb-3 text-teal-400" />
                      <p className="text-slate-400 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {stat.value} <span className="text-sm text-slate-400 font-normal">{stat.unit}</span>
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