const STORAGE_KEY = "skillswap_profiles_v1";
const CURRENT_USER_KEY = "skillswap_current_user_v1";

// Safely read profiles from localStorage.
function getProfiles() {
    try {
        const profiles = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(profiles) ? profiles : [];
    } catch (error) {
        return [];
    }
}

// Save profiles in this browser.
function storeProfiles(profiles) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
        return true;
    } catch (error) {
        alert("Could not save profiles. Please check browser storage.");
        return false;
    }
}

// Normalize skills for matching.
function normalizeSkill(skill) {
    return skill.trim().toLowerCase();
}

// Prevent user-entered text from becoming HTML.
function makeTextElement(tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = text;

    if (className) {
        element.className = className;
    }

    return element;
}

// 1. Search skills.
function searchSkill() {
    const input = document.getElementById("skillInput");
    const searchText = normalizeSkill(input.value);
    const cards = document.querySelectorAll("#result .card");
    const message = document.getElementById("searchMessage");

    let found = false;

    cards.forEach(function(card) {
        const matches =
            searchText === "" ||
            card.textContent.toLowerCase().includes(searchText);

        card.style.display = matches ? "" : "none";

        if (searchText !== "" && matches) {
            found = true;
        }
    });

    if (searchText === "") {
        message.textContent = "Showing all available skills.";
    } else if (found) {
        message.textContent = "Matching skills found!";
    } else {
        message.textContent = "No matching skill found. Try another search.";
    }
}

// Allow Enter to search.
document.getElementById("skillInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        searchSkill();
    }
});

// 2. Register a profile.
document.getElementById("profileForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("userName").value.trim();
    const teach = document.getElementById("teachSkill").value.trim();
    const learn = document.getElementById("learnSkill").value.trim();
    const message = document.getElementById("message");

    if (!name || !teach || !learn) {
        message.textContent = "Please fill in all fields.";
        return;
    }

    const profiles = getProfiles();

    const profile = {
        id: (window.crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : String(Date.now()) + Math.random().toString(16).slice(2),
        name: name,
        teach: teach,
        learn: learn,
        createdAt: new Date().toISOString()
    };

    profiles.push(profile);

    if (!storeProfiles(profiles)) {
        return;
    }

    try {
        localStorage.setItem(CURRENT_USER_KEY, profile.id);
    } catch (error) {
        // Profile was saved if storage succeeded above.
    }

    message.textContent =
        "Welcome, " + name + "! Your profile has been saved.";

    this.reset();

    renderProfiles();
    renderMatches();
});

// 3. Show saved profiles.
function renderProfiles() {
    const container = document.getElementById("profileList");
    container.replaceChildren();

    const profiles = getProfiles();

    if (profiles.length === 0) {
        container.appendChild(
            makeTextElement("p", "No profiles yet. Create the first one!")
        );
        return;
    }

    profiles.forEach(function(profile) {
        const card = makeTextElement("div", "", "card");

        card.appendChild(makeTextElement("h3", "👤 " + profile.name));
        card.appendChild(makeTextElement("p", "Can teach: " + profile.teach));
        card.appendChild(makeTextElement("p", "Wants to learn: " + profile.learn));

        container.appendChild(card);
    });
}

// 4. Find reciprocal skill matches.
function renderMatches() {
    const container = document.getElementById("matchResults");
    container.replaceChildren();

    const profiles = getProfiles();

    let currentId = null;

    try {
        currentId = localStorage.getItem(CURRENT_USER_KEY);
    } catch (error) {
        // Storage may be disabled.
    }

    const currentUser = profiles.find(function(profile) {
        return profile.id === currentId;
    });

    if (!currentUser) {
        container.appendChild(
            makeTextElement("p", "Create a profile to find skill matches.")
        );
        return;
    }

    const matches = profiles.filter(function(profile) {
        if (profile.id === currentUser.id) {
            return false;
        }

        const theyTeachWhatIWant =
            normalizeSkill(profile.teach) === normalizeSkill(currentUser.learn);

        const theyWantWhatITeach =
            normalizeSkill(profile.learn) === normalizeSkill(currentUser.teach);

        return theyTeachWhatIWant && theyWantWhatITeach;
    });

    if (matches.length === 0) {
        container.appendChild(
            makeTextElement(
                "p",
                "No reciprocal matches yet. Add another profile with compatible skills."
            )
        );
        return;
    }

    matches.forEach(function(profile) {
        const card = makeTextElement("div", "", "card");

        card.appendChild(makeTextElement("h3", "🤝 " + profile.name));
        card.appendChild(makeTextElement("p", "Can teach: " + profile.teach));
        card.appendChild(makeTextElement("p", "Wants to learn: " + profile.learn));
        card.appendChild(
            makeTextElement("p", "Your skills are a reciprocal match!")
        );

        const chatButton = makeTextElement("button", "Open Demo Chat");
        chatButton.type = "button";

        chatButton.addEventListener("click", function() {
            document.getElementById("chat").scrollIntoView({
                behavior: "smooth"
            });

            document.getElementById("chatInput").focus();
        });

        card.appendChild(chatButton);
        container.appendChild(card);
    });
}

// 5. Local chat demonstration.
// Messages are displayed in this browser only.
document.getElementById("chatForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const input = document.getElementById("chatInput");
    const text = input.value.trim();

    if (!text) {
        return;
    }

    const chatBox = document.getElementById("chatBox");
    const emptyMessage = chatBox.querySelector(".empty");

    if (emptyMessage) {
        emptyMessage.remove();
    }

    const message = makeTextElement(
        "p",
        "You: " + text,
        "chat-message"
    );

    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;

    input.value = "";
});

// Render saved data when the page opens.
renderProfiles();
renderMatches();