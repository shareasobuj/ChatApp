// আপনার Firebase Config ডাটা এখানে বসান (অবশ্যই databaseURL থাকতে হবে)
const firebaseConfig = {
    apiKey: "AIzaSyCEdRuYGcek5H0i9esjRF6SUzfbRAF_6IY",
  authDomain: "privateapp-84e1f.firebaseapp.com",
  projectId: "privateapp-84e1f",
  storageBucket: "privateapp-84e1f.firebasestorage.app",
  messagingSenderId: "328201856784",
  appId: "1:328201856784:web:bdfeb67631acb323b52795",
  measurementId: "G-B0MYHMC944"
};

// --- CONFIGURATION ---
const IMGBB_API_KEY = "6872e0a43175b6750389b34f632f4d99"; // আপনার আসল ImgBB API Key বসানো হলো
// Firebase ইনিশিয়ালাইজেশন
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// DOM এলিমেন্টস
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const authSection = document.getElementById('auth-section');
const roomSection = document.getElementById('room-section');

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const usernameInput = document.getElementById('username');
const roomIdInput = document.getElementById('room-id');

const authMainBtn = document.getElementById('auth-main-btn');
const toggleAuth = document.getElementById('toggle-auth');
const joinBtn = document.getElementById('join-btn');
const logoutBtn = document.getElementById('logout-btn');
const leaveBtn = document.getElementById('leave-btn');
const userDisplayName = document.getElementById('user-display-name');

const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-input');
const currentRoomTitle = document.getElementById('current-room-title');
const currentUserTitle = document.getElementById('current-user-title');

let isSignUpMode = false; 
let currentUser = null;
let currentRoom = "";
let chatRef = null;

// লগইন এবং সাইন-আপ ফর্ম প্রোপার টগল লজিক
toggleAuth.addEventListener('click', () => {
    isSignUpMode = !isSignUpMode;
    if (isSignUpMode) {
        usernameInput.classList.remove('hidden');
        authMainBtn.innerText = "অ্যাকাউন্ট তৈরি করুন";
        toggleAuth.innerText = "আগের অ্যাকাউন্ট আছে? লগইন করুন";
    } else {
        usernameInput.classList.add('hidden');
        authMainBtn.innerText = "লগইন করুন";
        toggleAuth.innerText = "নতুন অ্যাকাউন্ট তৈরি করতে এখানে ক্লিক করুন";
    }
});

// Authentication সাবমিট হ্যান্ডলার
authMainBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const name = usernameInput.value.trim();

    if (!email || !password) {
        alert("দয়া করে ইমেইল এবং পাসওয়ার্ড সঠিকভাবে দিন!");
        return;
    }

    try {
        if (isSignUpMode) {
            if (!name) {
                alert("দয়া করে আপনার নাম দিন!");
                return;
            }
            authMainBtn.innerText = "অপেক্ষা করুন...";
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: name });
            alert("অ্যাকাউন্ট তৈরি সফল হয়েছে!");
            location.reload(); // প্রোফাইল নেম আপডেট নিশ্চিত করতে রিলোড
        } else {
            authMainBtn.innerText = "লগইন হচ্ছে...";
            await auth.signInWithEmailAndPassword(email, password);
        }
    } catch (error) {
        alert("ত্রুটি: " + error.message);
        authMainBtn.innerText = isSignUpMode ? "অ্যাকাউন্ট তৈরি করুন" : "লগইন করুন";
    }
});

// ইউজারের লগইন স্টেট মনিটর
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        userDisplayName.innerText = user.displayName || "User";
        authSection.classList.add('hidden');
        roomSection.classList.remove('hidden');
    } else {
        currentUser = null;
        authSection.classList.remove('hidden');
        roomSection.classList.add('hidden');
        chatContainer.classList.add('chat-hidden');
        loginContainer.classList.remove('chat-hidden');
    }
});

// রুমে জয়েন করা
joinBtn.addEventListener('click', () => {
    currentRoom = roomIdInput.value.trim().toLowerCase().replace(/[^a-z0-9]/g, ""); // ভ্যালিড পাথ ফিল্টার

    if (!currentRoom) {
        alert("দয়া করে একটি সঠিক রুম আইডি দিন!");
        return;
    }

    currentRoomTitle.innerText = `Room: ${currentRoom.toUpperCase()}`;
    currentUserTitle.innerText = currentUser.displayName;

    loginContainer.classList.add('chat-hidden');
    chatContainer.classList.remove('chat-hidden');

    listenForMessages();
});

// Realtime Database লিসেনার
function listenForMessages() {
    chatRef = database.ref('rooms/' + currentRoom + '/messages');
    chatRef.on('value', (snapshot) => {
        chatMessages.innerHTML = "";
        snapshot.forEach((childSnapshot) => {
            displayMessage(childSnapshot.val());
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

// স্ক্রিনে মেসেজ দেখানো
function displayMessage(data) {
    const messageDiv = document.createElement('div');
    const isMe = data.senderEmail === currentUser.email;
    
    messageDiv.classList.add('message');
    messageDiv.classList.add(isMe ? 'sent' : 'received');

    let content = `<div class="meta">${data.senderName}</div>`;
    if (data.message) content += `<p>${data.message}</p>`;
    if (data.imageUrl) content += `<img src="${data.imageUrl}" alt="Shared Image">`;

    messageDiv.innerHTML = content;
    chatMessages.appendChild(messageDiv);
}

// মেসেজ ডাটাবেজে পাঠানো
async function sendMessage(text = "", imgUrl = "") {
    if (!text && !imgUrl) return;

    if (chatRef) {
        await chatRef.push({
            senderName: currentUser.displayName,
            senderEmail: currentUser.email,
            message: text,
            imageUrl: imgUrl,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }
    messageInput.value = "";
}

// বার্তা পাঠানোর ইভেন্ট
sendBtn.addEventListener('click', () => sendMessage(messageInput.value.trim(), ""));
messageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(messageInput.value.trim(), ""); });

// ImgBB দিয়ে ইমেজ আপলোড
imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    messageInput.placeholder = "ছবি আপলোড হচ্ছে...";
    messageInput.disabled = true;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            sendMessage("", result.data.url);
        } else {
            alert("ছবি আপলোড ব্যর্থ হয়েছে!");
        }
    } catch (error) {
        alert("নেটওয়ার্ক সমস্যা!");
    } finally {
        messageInput.placeholder = "মেসেজ লিখুন...";
        messageInput.disabled = false;
        imageInput.value = "";
    }
});

// রুম লিভ এবং লগআউট লজিক
leaveBtn.addEventListener('click', () => {
    if (chatRef) chatRef.off();
    loginContainer.classList.remove('chat-hidden');
    chatContainer.classList.add('chat-hidden');
    chatMessages.innerHTML = "";
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});
