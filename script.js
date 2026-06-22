// ১. Firebase কনফিগারেশন (আপনার Firebase কনসোল থেকে এগুলো পরিবর্তন করুন)
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_FIREBASE_AUTH_DOMAIN",
    projectId: "YOUR_FIREBASE_PROJECT_ID",
    storageBucket: "YOUR_FIREBASE_STORAGE_BUCKET",
    messagingSenderId: "YOUR_FIREBASE_MESSAGING_SENDER_ID",
    appId: "YOUR_FIREBASE_APP_ID"
};
// --- CONFIGURATION ---
const IMGBB_API_KEY = "6872e0a43175b6750389b34f632f4d99"; // আপনার আসল ImgBB API Key বসানো হলো
// Firebase ইনিশিয়ালাইজেশন
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM এলিমেন্টস
const loginContainer = document.getElementById('login-container');
const chatContainer = document.getElementById('chat-container');
const usernameInput = document.getElementById('username');
const roomIdInput = document.getElementById('room-id');
const joinBtn = document.getElementById('join-btn');
const leaveBtn = document.getElementById('leave-btn');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-input');
const currentRoomTitle = document.getElementById('current-room-title');
const currentUserTitle = document.getElementById('current-user-title');

let currentUser = "";
let currentRoom = "";
let unsubscribeChat = null;

// রুমে জয়েন করার লজিক
joinBtn.addEventListener('click', () => {
    currentUser = usernameInput.value.trim();
    currentRoom = roomIdInput.value.trim().toLowerCase();

    if (!currentUser || !currentRoom) {
        alert("দয়া করে নাম এবং রুম আইডি দুটোই দিন!");
        return;
    }

    currentRoomTitle.innerText = `Room: ${currentRoom.toUpperCase()}`;
    currentUserTitle.innerText = currentUser;

    loginContainer.classList.add('chat-hidden');
    chatContainer.classList.remove('chat-hidden');

    listenForMessages();
});

// চ্যাট লিসেনার (নির্দিষ্ট রুম আইডি অনুযায়ী মেসেজ লোড হবে)
function listenForMessages() {
    unsubscribeChat = db.collection('rooms')
        .doc(currentRoom)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            chatMessages.innerHTML = "";
            snapshot.forEach((doc) => {
                const data = doc.data();
                displayMessage(data);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight; // স্ক্রল নিচে নামানোর জন্য
        });
}

// মেসেজ স্ক্রিনে দেখানোর ফাংশন
function displayMessage(data) {
    const messageDiv = document.createElement('div');
    const isMe = data.sender === currentUser;
    
    messageDiv.classList.add('message');
    messageDiv.classList.add(isMe ? 'sent' : 'received');

    let content = `<div class="meta">${data.sender}</div>`;
    
    if (data.message) {
        content += `<p>${data.message}</p>`;
    }
    if (data.imageUrl) {
        content += `<img src="${data.imageUrl}" alt="Shared Image" target="_blank">`;
    }

    messageDiv.innerHTML = content;
    chatMessages.appendChild(messageDiv);
}

// মেসেজ পাঠানোর ফাংশন
async function sendMessage(text = "", imgUrl = "") {
    if (!text && !imgUrl) return;

    await db.collection('rooms').doc(currentRoom).collection('messages').add({
        sender: currentUser,
        message: text,
        imageUrl: imgUrl,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    messageInput.value = "";
}

// বাটনে ক্লিক করে টেক্সট মেসেজ পাঠানো
sendBtn.addEventListener('click', () => {
    sendMessage(messageInput.value.trim(), "");
});

// এন্টার প্রেস করে মেসেজ পাঠানো
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage(messageInput.value.trim(), "");
    }
});

// ImgBB-তে ইমেজ আপলোড এবং চ্যাটে শেয়ার করার লজict
imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // টেম্পোরারি ভিজ্যুয়াল ফিডব্যাক (বিকল্প)
    messageInput.placeholder = "ছবি আপলোড হচ্ছে, অপেক্ষা করুন...";
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
            const uploadedImageUrl = result.data.url;
            // ইমেজ চ্যাটে পাঠিয়ে দেওয়া হলো
            sendMessage("", uploadedImageUrl);
        } else {
            alert("ইমেজ আপলোড ব্যর্থ হয়েছে!");
        }
    } catch (error) {
        console.error("Error uploading image:", error);
        alert("নেটওয়ার্ক সমস্যা! আবার চেষ্টা করুন।");
    } finally {
        messageInput.placeholder = "মেসেজ লিখুন...";
        messageInput.disabled = false;
        imageInput.value = ""; // রিসেট ইনপুট
    }
});

// রুম থেকে বের হয়ে যাওয়ার লজিক
leaveBtn.addEventListener('click', () => {
    if (unsubscribeChat) unsubscribeChat();
    loginContainer.classList.remove('chat-hidden');
    chatContainer.classList.add('chat-hidden');
    chatMessages.innerHTML = "";
});
