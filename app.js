// Firebase SDK মডিউলসমূহ ইমপোর্ট
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ========================================================
// ⚠️ এখানে আপনার নিজের Firebase Config এবং ImgBB API Key বসাবেন
// ========================================================
const firebaseConfig = {
  apiKey: "AIzaSyCEdRuYGcek5H0i9esjRF6SUzfbRAF_6IY",
  authDomain: "privateapp-84e1f.firebaseapp.com",
  projectId: "privateapp-84e1f",
  storageBucket: "privateapp-84e1f.firebasestorage.app",
  messagingSenderId: "328201856784",
  appId: "1:328201856784:web:bdfeb67631acb323b52795",
  measurementId: "G-B0MYHMC944"
};

const IMGBB_API_KEY = "6872e0a43175b6750389b34f632f4d99";
// ========================================================

// Firebase ইনিশিয়ালাইজেশন
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// HTML এলিমেন্টস সিলেকশন
const formTitle = document.getElementById("formTitle");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const imageInputGroup = document.getElementById("imageInputGroup");
const imageFileInput = document.getElementById("imageFileInput");
const mainBtn = document.getElementById("mainBtn");
const toggleLink = document.getElementById("toggleLink");

let isLoginView = true; // ডিফল্টভাবে লগইন স্ক্রিন থাকবে

// ইন্টারফেস টগল (লগইন <-> সাইন-আপ) করার ফাংশন
toggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  isLoginView = !isLoginView;

  if (!isLoginView) {
    formTitle.innerText = "Private Chat (Sign Up)";
    mainBtn.innerText = "সাইন-আপ করুন";
    toggleLink.innerText = "আগের অ্যাকাউন্ট থাকলে লগইন করুন";
    imageInputGroup.style.display = "block"; // ছবি আপলোডের অপশন দেখাবে
  } else {
    formTitle.innerText = "Private Chat";
    mainBtn.innerText = "লগইন করুন";
    toggleLink.innerText = "নতুন অ্যাকাউন্ট তৈরি করতে এখানে ক্লিক করুন";
    imageInputGroup.style.display = "none"; // ছবি আপলোডের অপশন লুকিয়ে ফেলবে
  }
});

// ImgBB-তে ছবি আপলোড করার অ্যাসিনক্রোনাস ফাংশন
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
      return data.data.url; // আপলোড করা ছবির ডিরেক্ট লিঙ্ক
    } else {
      throw new Error(data.error.message);
    }
  } catch (error) {
    console.error("ImgBB Error:", error);
    alert("ছবি আপলোড ব্যর্থ: " + error.message);
    return null;
  }
}

// সাবমিট বাটন ক্লিক ইভেন্ট হ্যান্ডলার
mainBtn.addEventListener("click", async (e) => {
  e.preventDefault(); // পেজ রিফ্রেশ হওয়া বন্ধ করবে

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    alert("দয়া করে ইমেইল এবং পাসওয়ার্ড ফিল্ড পূরণ করুন।");
    return;
  }

  if (!isLoginView) {
    // ------------------ সাইন-আপ প্রসেস ------------------
    let profileImageUrl = "https://placeholder.co/150"; // ডিফল্ট ছবি

    // যদি ব্যবহারকারী ছবি সিলেক্ট করে থাকে
    if (imageFileInput.files.length > 0) {
      mainBtn.innerText = "ছবি আপলোড হচ্ছে...";
      mainBtn.disabled = true;
      
      const uploadedUrl = await uploadImageToImgBB(imageFileInput.files[0]);
      if (uploadedUrl) {
        profileImageUrl = uploadedUrl;
      } else {
        mainBtn.innerText = "সাইন-আপ করুন";
        mainBtn.disabled = false;
        return;
      }
    }

    mainBtn.innerText = "অ্যাকাউন্ট তৈরি হচ্ছে...";

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // Firebase Realtime Database-এ ইউজারের ডেটা ও ছবির লিঙ্ক সেভ
        set(ref(database, "users/" + user.uid), {
          uid: user.uid,
          email: email,
          profilePic: profileImageUrl,
          createdAt: new Date().toISOString()
        })
        .then(() => {
          alert("অ্যাকাউন্ট এবং ডাটাবেজ প্রোফাইল সফলভাবে তৈরি হয়েছে!");
          window.location.href = "chat.html"; // সফল হলে চ্যাট পেজে নিয়ে যাবে
        })
        .catch((dbError) => {
          alert("ডাটাবেজে তথ্য সেভ করা যায়নি: " + dbError.message);
        });
      })
      .catch((authError) => {
        alert("সাইন-আপ ব্যর্থ: " + authError.message);
      })
      .finally(() => {
        mainBtn.innerText = "সাইন-আপ করুন";
        mainBtn.disabled = false;
      });

  } else {
    // ------------------ লগইন প্রসেস ------------------
    mainBtn.innerText = "লগইন হচ্ছে...";
    mainBtn.disabled = true;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        alert("লগইন সফল হয়েছে!");
        window.location.href = "chat.html"; // সফল লগইনে আপনার চ্যাট পেজে নিয়ে যাবে
      })
      .catch((loginError) => {
        alert("লগইন ব্যর্থ: " + loginError.message);
      })
      .finally(() => {
        mainBtn.innerText = "লগইন করুন";
        mainBtn.disabled = false;
      });
  }
});
