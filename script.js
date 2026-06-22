// --- CONFIGURATION ---
const IMGBB_API_KEY = "YOUR_IMGBB_API_KEY_HERE"; // আপনার ImgBB API Key এখানে দিন

// PieSocket Free Demo Cluster (এটি অনেকগুলো মোবাইলকে একসাথে কানেক্ট করবে)
const PIESOCKET_API_KEY = "VC1vyS7Ee06FBm9U76szwFl80P14wE369OoK6mOI"; 
const PIESOCKET_ROOM_ID = "whatsapp_global_room_2026";

let myName = "";
let selectedFile = null;
let pieSocketRef = null;

// Join Chat Room from Mobile
function joinChat() {
    const nameInput = document.getElementById('username-input').value.trim();
    if (nameInput === "") {
        alert("Please enter your name!");
        return;
    }
    myName = nameInput;
    document.getElementById('login-overlay').style.display = 'none';
    
    // Initialize Multi-Device Connection
    initMultiDeviceSync();
}

// Connect all devices via PieSocket
function initMultiDeviceSync() {
    pieSocketRef = new PieSocket({
        clusterId: "demo",
        apiKey: PIESOCKET_API_KEY
    });

    const channel = pieSocketRef.subscribe(PIESOCKET_ROOM_ID);

    document.getElementById('online-status').innerText = "Connected globally 🟢";

    // ইন্টারনেটের মাধ্যমে অন্য মোবাইল থেকে মেসেজ আসলে এই ফাংশনটি ট্রিগার হবে
    channel.on("message", (msgEvent) => {
        const receivedData = JSON.parse(msgEvent.data);
        displayIncomingMessage(receivedData);
    });
}

// Display Messages on screen based on Sender
function displayIncomingMessage(msg) {
    const container = document.getElementById('chat-messages-container');
    const msgBubble = document.createElement('div');
    
    // নিজের পাঠানো নাকি অন্য মোবাইল থেকে আসা মেসেজ তা চেক করা হচ্ছে
    const isMe = msg.senderName === myName;
    msgBubble.className = `message ${isMe ? 'sent' : 'received'}`;

    // অন্য মোবাইল থেকে আসলে ইউজারের নাম উপরে দেখাবে
    const nameTag = isMe ? "" : `<b style="color:#00a884; font-size:12px; display:block; margin-bottom:3px;">${msg.senderName}</b>`;

    if (msg.type === 'text') {
        msgBubble.innerHTML = `
            ${nameTag}
            <span>${msg.content}</span>
            <span class="msg-time">${msg.time} ${isMe ? '<i class="fa-solid fa-check-double"></i>' : ''}</span>
        `;
    } else if (msg.type === 'image') {
        msgBubble.innerHTML = `
            ${nameTag}
            <img src="${msg.content}" class="msg-img" alt="Image" onclick="window.open('${msg.content}', '_blank')">
            <span class="msg-time">${msg.time} ${isMe ? '<i class="fa-solid fa-check-double"></i>' : ''}</span>
        `;
    }

    container.appendChild(msgBubble);
    container.scrollTop = container.scrollHeight;
}

// Send Message Handler
function sendMessage() {
    const inputField = document.getElementById('message-input');
    const textContent = inputField.value.trim();
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (selectedFile) {
        uploadAndBroadcastImage(selectedFile, currentTime);
        return;
    }

    if (textContent === "") return;

    const payload = {
        senderName: myName,
        type: 'text',
        content: textContent,
        time: currentTime
    };

    // সব মোবাইলে মেসেজটি ব্রডকাস্ট (পাঠিয়ে) করে দেওয়া হচ্ছে
    pieSocketRef.publish(PIESOCKET_ROOM_ID, JSON.stringify(payload));
    inputField.value = '';
}

// Upload Image to ImgBB and Broadcast to everyone
function uploadAndBroadcastImage(file, timeStr) {
    if (IMGBB_API_KEY === "YOUR_IMGBB_API_KEY_HERE" || IMGBB_API_KEY === "") {
        alert("Please set your real ImgBB API Key in script.js!");
        cancelImageSelection();
        return;
    }

    const loader = document.getElementById('upload-loader');
    loader.style.display = 'block';

    const formData = new FormData();
    formData.append("image", file);

    fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            const payload = {
                senderName: myName,
                type: 'image',
                content: result.data.url, // ImgBB Live Link
                time: timeStr
            };
            // ছবির লিংক সব মোবাইলে একসাথে সিঙ্ক হবে
            pieSocketRef.publish(PIESOCKET_ROOM_ID, JSON.stringify(payload));
            cancelImageSelection();
        } else {
            alert("ImgBB Upload Failed!");
            cancelImageSelection();
        }
    })
    .catch(error => {
        console.error("Error:", error);
        cancelImageSelection();
    });
}

// Image Selection Helpers
function previewSelectedImage(input) {
    if (input.files && input.files[0]) {
        selectedFile = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('image-to-upload').src = e.target.result;
            document.getElementById('upload-preview-box').style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function cancelImageSelection() {
    selectedFile = null;
    document.getElementById('image-input').value = '';
    document.getElementById('upload-preview-box').style.display = 'none';
    document.getElementById('upload-loader').style.display = 'none';
}

function handleKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
}
