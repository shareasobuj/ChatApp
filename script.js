// ১. প্রয়োজনীয় Firebase মডিউলগুলো ইমপোর্ট করুন
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ২. আপনার Firebase কনফিগারেশন
const firebaseConfig = {
  apiKey: "AIzaSyCEdRuYGcek5H0i9esjRF6SUzfbRAF_6IY",
  authDomain: "privateapp-84e1f.firebaseapp.com",
  projectId: "privateapp-84e1f",
  storageBucket: "privateapp-84e1f.firebasestorage.app",
  messagingSenderId: "328201856784",
  appId: "1:328201856784:web:bdfeb67631acb323b52795",
  measurementId: "G-B0MYHMC944"
};

// Firebase ইনিশিয়ালাইজ করুন
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- CONFIGURATION ---
const IMGBB_API_KEY = "6872e0a43175b6750389b34f632f4d99"; // আপনার আসল ImgBB API Key বসানো হলো

// ৪. HTML এলিমেন্টগুলো সিলেক্ট করুন
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const imageInput = document.getElementById("imageFileInput"); // HTML-এ এই ইনপুটটি থাকতে হবে (type="file")
const mainBtn = document.getElementById("mainBtn");

// --- ImgBB-তে ছবি আপলোড করার হেল্পার ফাংশন ---
async function uploadImageToImgBB(file) {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData
    });
    
    const data = await response.json();
    if (data.success) {
      console.log("ImgBB Upload Successful:", data.data.url);
      return data.data.url; // আপলোড হওয়া ছবির ডিরেক্ট ইউআরএল (URL) রিটার্ন করবে
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error("ImgBB Upload Failed:", error);
    alert("ছবি আপলোড ব্যর্থ হয়েছে: " + error.message);
    return null;
  }
}

// --- মেইন বাটন ক্লিক ইভেন্ট (লগইন অথবা সাইন-আপ) ---
if (mainBtn) {
  mainBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
      alert("অনুগ্রহ করে ইমেইল এবং পাসওয়ার্ড দিন।");
      return;
    }

    // বর্তমান বাটনটি সাইন-আপ নাকি লগইন মোডে আছে তা চেক করা হচ্ছে ID দিয়ে
    if (mainBtn.id === "signupBtn") {
      // --- সাইন-আপ প্রসেস ---
      let imageUrl = "";
      
      // ইউজার যদি কোনো ছবি সিলেক্ট করে থাকে
      if (imageInput && imageInput.files.length > 0) {
        alert("প্রথমে আপনার ছবিটি আপলোড হচ্ছে, দয়া করে অপেক্ষা করুন...");
        imageUrl = await uploadImageToImgBB(imageInput.files[0]);
        if (!imageUrl) return; // ছবি আপলোড না হলে সাইন-আপ থামিয়ে দেবে
      }

      createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          alert("অ্যাকাউন্ট তৈরি সফল হয়েছে!");
          
          // এখানে আপনি imageUrl টি Firebase Realtime Database বা Firestore-এ ইউজারের প্রোফাইলে সেভ করতে পারেন
          console.log("Registered User:", user);
          console.log("User Profile Image Link:", imageUrl);
        })
        .catch((error) => {
          alert("অ্যাকাউন্ট তৈরি করা যায়নি: " + error.message);
        });

    } else {
      // --- লগইন প্রসেস ---
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          alert("লগইন সফল হয়েছে!");
          // window.location.href = "dashboard.html";
        })
        .catch((error) => {
          alert("লগইন ব্যর্থ হয়েছে: " + error.message);
        });
    }
  });
                }
