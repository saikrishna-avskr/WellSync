import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Dictaphone from "../Dictaphone";

// Articles data with real examples based on your description
const articles = {
  women: {
    "pregnancy-and-maternal-health": [
      { id: 1, title: "Pregnancy Tips", content: "Detailed content about pregnancy.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 2, title: "Healthy Eating During Pregnancy", content: "Nutritional advice for mothers-to-be.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 3, title: "Common Pregnancy Myths Debunked", content: "Separating fact from fiction about pregnancy.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 4, title: "Exercise During Pregnancy", content: "Safe workouts for expecting mothers.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 5, title: "Signs of Healthy Pregnancy", content: "Indicators of good maternal health.",url:"https://www.who.int/health-topics/maternal-health"},
    ],
    "menstrual-health-and-periods": [
      { id: 1, title: "Managing Period Pain", content: "Details on menstrual health.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 2, title: "Best Practices for Menstrual Hygiene", content: "Hygiene tips for a healthy period.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 3, title: "Understanding the Menstrual Cycle", content: "A guide to menstrual phases and health.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 4, title: "Foods That Help During Periods", content: "Nutrition tips for period discomfort.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 5, title: "Breaking the Stigma Around Periods", content: "Promoting open discussions about periods.",url:"https://www.who.int/health-topics/maternal-health"},
    ],
    "marriage-and-relationship-issues": [
      { id: 1, title: "Effective Communication in Relationships", content: "Building better understanding with your partner.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 2, title: "Dealing with Conflict in Marriage", content: "Tips to handle disagreements healthily.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 3, title: "The Importance of Trust in Relationships", content: "How to build and maintain trust.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 4, title: "Balancing Career and Marriage", content: "Finding harmony in your personal life.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 5, title: "Overcoming Jealousy in Relationships", content: "Strategies for a healthier connection.",url:"https://www.who.int/health-topics/maternal-health"},
    ],
    "career-and-workplace-challenges": [
      { id: 1, title: "Overcoming Gender Bias at Work", content: "Strategies to tackle workplace inequality.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 2, title: "Balancing Work and Personal Life", content: "Time management tips for women.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 3, title: "Climbing the Corporate Ladder", content: "How to advance your career.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 4, title: "Handling Workplace Harassment", content: "Steps to address and prevent harassment.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 5, title: "Building Confidence at Work", content: "Empowering women for professional success.",url:"https://www.who.int/health-topics/maternal-health"},
    ],
    "postpartum-depression-and-parenting": [
      { id: 1, title: "Understanding Postpartum Depression", content: "Symptoms and treatment options.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 2, title: "Tips for New Mothers", content: "Navigating early motherhood challenges.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 3, title: "Building a Support System", content: "The importance of family and friends post-birth.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 4, title: "Caring for Your Newborn", content: "Practical advice for first-time parents.",url:"https://www.who.int/health-topics/maternal-health"},
      { id: 5, title: "Self-Care for New Moms", content: "Maintaining your health while parenting.",url:"https://www.who.int/health-topics/maternal-health"},
    ],
  },  
  men: {
    "mental-health-and-emotional-well-being": [
      { id: 1, title: "Overcoming Stress at Work", content: "Managing professional and personal stress.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 2, title: "Meditation for Mental Clarity", content: "Steps to improve focus and reduce anxiety.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 3, title: "How to Recognize Burnout", content: "Signs and remedies for mental exhaustion.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 4, title: "The Role of Friends in Emotional Support", content: "Building a strong support system.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 5, title: "Benefits of Therapy for Men", content: "Exploring therapy as a mental health tool.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
    ],
    "career-stress-and-financial-pressure": [
      { id: 1, title: "Handling Career Setbacks", content: "Bouncing back stronger from professional challenges.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 2, title: "Budgeting Tips for Young Professionals", content: "Financial advice for a secure future.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 3, title: "Maintaining Work-Life Balance", content: "Tips for balancing career and personal life.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 4, title: "How to Set Financial Goals", content: "Practical steps to achieve financial stability.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 5, title: "Investing Basics for Beginners", content: "An introduction to building wealth.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
    ],
    "relationship-and-marital-issues": [
      { id: 1, title: "Improving Communication with Your Partner", content: "Tips for meaningful and open dialogue.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 2, title: "Managing Conflict in Relationships", content: "Healthy ways to resolve disagreements.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 3, title: "Balancing Relationships and Personal Goals", content: "How to align personal and relational priorities.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 4, title: "Rebuilding Trust After a Conflict", content: "Steps to restore trust in relationships.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 5, title: "Dealing with Loneliness in Relationships", content: "Addressing emotional disconnect with your partner.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
    ],
    "coping-with-societal-expectations": [
      { id: 1, title: "Breaking Free from Gender Stereotypes", content: "Challenging traditional societal norms.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 2, title: "The Pressure to Succeed", content: "How to manage societal expectations of success.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 3, title: "Being Vulnerable in a Judging Society", content: "Learning to embrace emotional openness.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 4, title: "Building Resilience to Societal Criticism", content: "How to maintain self-esteem and confidence.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 5, title: "The Importance of Self-Acceptance", content: "Understanding and embracing your authentic self.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
    ],
    "health-and-fitness": [
      { id: 1, title: "Beginner's Guide to Strength Training", content: "How to get started with weightlifting and fitness.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 2, title: "The Importance of Cardiovascular Health", content: "Tips for maintaining a healthy heart.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 3, title: "Eating Healthy on a Budget", content: "Affordable nutrition for a fit lifestyle.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 4, title: "Staying Fit with a Busy Schedule", content: "Quick and effective workout tips for busy men.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
      { id: 5, title: "The Role of Sleep in Fitness", content: "How quality sleep impacts your physical health.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC1114432/"},
    ],
  },  
  senior: {
  "coping-with-loneliness-and-isolation": [
    { id: 1, title: "Joining Community Groups", content: "Connecting with others for companionship.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 2, title: "Benefits of Volunteering", content: "Finding purpose in helping others.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 3, title: "Staying Connected with Technology", content: "Using devices to stay in touch with family.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 4, title: "The Importance of Hobbies", content: "Engaging in activities to combat loneliness.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 5, title: "Tips for Socializing Safely", content: "Staying active while maintaining safety.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
  ],
  "health-and-chronic-illness-management": [
    { id: 1, title: "Managing Diabetes Effectively", content: "Practical tips for controlling blood sugar levels.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 2, title: "Exercises for Joint Health", content: "Safe and effective workouts for joint pain.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 3, title: "Healthy Eating for Seniors", content: "Nutrition tips tailored for senior citizens.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 4, title: "Understanding and Managing Hypertension", content: "Ways to control high blood pressure.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 5, title: "The Role of Regular Checkups", content: "Staying on top of your health through regular screenings.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
  ],
  "financial-and-retirement-planning": [
    { id: 1, title: "Creating a Budget for Retirement", content: "Managing expenses and savings post-retirement.",url:"https://www.investopedia.com/terms/r/retirement-planning.asp"},
    { id: 2, title: "Investment Options for Seniors", content: "Safe and reliable investments for older adults.",url:"https://www.investopedia.com/terms/r/retirement-planning.asp"},
    { id: 3, title: "How to Avoid Financial Scams", content: "Tips to protect yourself from fraud.",url:"https://www.investopedia.com/terms/r/retirement-planning.asp"},
    { id: 4, title: "Understanding Social Security Benefits", content: "Maximizing your benefits effectively.",url:"https://www.investopedia.com/terms/r/retirement-planning.asp"},
    { id: 5, title: "Managing Medical Expenses", content: "Strategies for handling healthcare costs.",url:"https://www.investopedia.com/terms/r/retirement-planning.asp"},
  ],
  "grief-counseling": [
    { id: 1, title: "Dealing with the Loss of a Spouse", content: "Support and coping mechanisms for widows and widowers.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 2, title: "The Importance of Support Groups", content: "Finding solace in shared experiences.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 3, title: "Therapeutic Activities for Grief", content: "Healing through art, music, and other hobbies.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 4, title: "How to Talk About Grief", content: "Communicating feelings to family and friends.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 5, title: "The Role of Professional Counseling", content: "When and how to seek help from a therapist.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
  ],
  "staying-connected-with-family": [
    { id: 1, title: "Using Video Calling Apps", content: "Simple guides for apps like Zoom and FaceTime.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 2, title: "Planning Family Visits", content: "Tips for arranging meaningful family time.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 3, title: "Sending Letters and Cards", content: "Reviving traditional methods of staying in touch.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 4, title: "Sharing Memories with Younger Generations", content: "Passing down stories and experiences.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
    { id: 5, title: "Celebrating Special Occasions Virtually", content: "Making birthdays and anniversaries special online.",url:"https://www.nia.nih.gov/health/loneliness-and-social-isolation/loneliness-and-social-isolation-tips-staying-connected"},
  ],
},
girls: {
  "body-image-and-self-esteem": [
    { id: 1, title: "Understanding Body Positivity", content: "Embracing self-love and acceptance.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 2, title: "Combating Unrealistic Beauty Standards", content: "Dealing with societal pressures.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 3, title: "Social Media and Self-Perception", content: "Navigating the impact of online content.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 4, title: "Building Confidence as a Teen", content: "Practical tips for boosting self-esteem.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 5, title: "Celebrating Your Unique Qualities", content: "Appreciating individuality and self-worth.",url:"https://kidshealth.org/en/teens/body-image.html"},
  ],
  "period-health-and-hygiene": [
    { id: 1, title: "Understanding Menstrual Cycles", content: "Basics of periods and how they work.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 2, title: "Best Practices for Menstrual Hygiene", content: "Tips for staying clean and healthy.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 3, title: "Dealing with Period Pain", content: "Remedies and techniques to ease discomfort.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 4, title: "Choosing the Right Products", content: "Pads, tampons, and menstrual cups explained.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 5, title: "Breaking Period Taboos", content: "Encouraging open conversations about menstruation.",url:"https://kidshealth.org/en/teens/body-image.html"},
  ],
  "peer-pressure-and-bullying": [
    { id: 1, title: "Recognizing Signs of Peer Pressure", content: "How to spot and address unhealthy influences.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 2, title: "Standing Up to Bullies", content: "Effective ways to deal with bullying behavior.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 3, title: "Finding Support in Tough Times", content: "Reaching out to friends, family, or counselors.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 4, title: "Building a Positive Friend Circle", content: "Surrounding yourself with uplifting peers.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 5, title: "Dealing with Cyberbullying", content: "Staying safe and confident online.",url:"https://kidshealth.org/en/teens/body-image.html"},
  ],
  "academic-stress-and-career-choices": [
    { id: 1, title: "Time Management for Students", content: "Balancing academics and personal life effectively.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 2, title: "Handling Exam Anxiety", content: "Tips to stay calm and focused during exams.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 3, title: "Exploring Career Options", content: "Discovering what suits your interests and skills.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 4, title: "Setting Realistic Goals", content: "Achieving success without overwhelming yourself.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 5, title: "Finding Inspiration in Role Models", content: "Learning from successful women in various fields.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
  ],
  "safe-social-media-practices": [
    { id: 1, title: "Protecting Your Privacy Online", content: "Tips to safeguard your personal information.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 2, title: "Recognizing Fake Profiles and Scams", content: "Staying vigilant against online threats.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 3, title: "Creating a Positive Online Presence", content: "Using social media to build your brand.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 4, title: "Balancing Screen Time", content: "Maintaining a healthy relationship with technology.",url:"https://kidshealth.org/en/teens/body-image.html"},
    { id: 5, title: "Reporting and Blocking Harmful Content", content: "Steps to ensure a safer digital environment.",url:"https://kidshealth.org/en/teens/body-image.html"},
  ],
},
students: {
  "academic-anxiety-and-exam-stress": [
    { id: 1, title: "How to Prepare Effectively for Exams", content: "Strategies to enhance study sessions.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 2, title: "Overcoming Test Anxiety", content: "Tips to stay calm and confident during exams.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 3, title: "The Role of Sleep in Academic Success", content: "Why rest is vital for better performance.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 4, title: "Managing Time During Exams", content: "Techniques to handle time pressure effectively.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 5, title: "The Importance of Breaks While Studying", content: "Balancing work and relaxation for better focus.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
  ],
  "time-management-and-productivity": [
    { id: 1, title: "Creating an Effective Study Schedule", content: "Planning your day for maximum productivity.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 2, title: "The Pomodoro Technique for Students", content: "Using focused intervals to boost efficiency.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 3, title: "Eliminating Distractions While Studying", content: "Tips for maintaining focus in a digital world.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 4, title: "Setting Priorities for Academic Success", content: "Learning to focus on what matters most.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 5, title: "Using Apps and Tools to Stay Organized", content: "Leveraging technology for better time management.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
  ],
  "peer-relationships-and-bullying": [
    { id: 1, title: "Building Healthy Friendships", content: "Tips for fostering meaningful connections.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 2, title: "Dealing with Peer Pressure", content: "How to stay true to yourself in challenging situations.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 3, title: "Recognizing and Addressing Bullying", content: "Steps to handle bullying effectively.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 4, title: "Creating a Positive Social Circle", content: "Surrounding yourself with supportive peers.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 5, title: "Seeking Help for Social Challenges", content: "When and how to reach out for support.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
  ],
  "balancing-studies-with-extracurriculars": [
    { id: 1, title: "Finding Time for Hobbies and Interests", content: "Balancing academics and personal passions.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 2, title: "The Benefits of Extracurricular Activities", content: "Why participating in activities is essential.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 3, title: "How to Avoid Overcommitting", content: "Managing a healthy balance between studies and activities.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 4, title: "Time Management for Busy Students", content: "Effective strategies for juggling responsibilities.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 5, title: "Using Extracurriculars to Build Skills", content: "Enhancing personal growth through activities.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
  ],
  "mental-health-resources-for-students": [
    { id: 1, title: "Recognizing Signs of Stress", content: "Understanding when to seek help.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 2, title: "Campus Mental Health Services", content: "Utilizing resources available in schools or colleges.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 3, title: "Practicing Mindfulness and Meditation", content: "Techniques to improve mental well-being.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 4, title: "Talking to Trusted Adults About Issues", content: "Seeking guidance from mentors or parents.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
    { id: 5, title: "Apps and Online Resources for Mental Health", content: "Tools to support emotional and mental wellness.",url:"https://pmc.ncbi.nlm.nih.gov/articles/PMC6524999/"},
  ],
},
};

const ArticleListPage = () => {
  const { category, subcategory } = useParams();

  const subcategoryArticles = articles[category]?.[subcategory];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-8">
      <h1 className="text-4xl font-extrabold mb-6 capitalize text-center text-gray-800">
        {subcategory?.replace(/-/g, " ")} Articles
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {subcategoryArticles?.map((article) => (
          <div
            key={article.id}
            className="bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg"
          >
            <div className="p-6">
              <h2 className="text-3xl font-semibold text-gray-800 mb-2">
                {article.title}
              </h2>
              <p className="text-lg text-gray-600 mb-4">{article.content}</p>
              <Link
                to={
                  article.url ||
                  `/articles/${category}/${subcategory}/${article.id}`
                }
                className="inline-block bg-black font-semibold text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                Read Full Article
              </Link>
            </div>
            <Dictaphone/>
          </div>
        )) || (
          <div className="col-span-full text-center text-gray-600">
            No articles available for this subcategory.
          </div>
        )}
        <Dictaphone/>
      </div>
    </div>
  );
};

export default ArticleListPage;

