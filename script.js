/* =====================================================
   BACKGROUND MUSIC
===================================================== */

const music =
    document.getElementById("bgMusic");

const musicBtn =
    document.getElementById("musicBtn");

const musicText =
    document.getElementById("musicText");

let isPlaying = false;


musicBtn.addEventListener(
    "click",
    async () => {

        try {

            if (!isPlaying) {

                await music.play();

                isPlaying = true;

                musicText.textContent =
                    "Pause";

                musicBtn.classList.add(
                    "playing"
                );

            } else {

                music.pause();

                isPlaying = false;

                musicText.textContent =
                    "Music";

                musicBtn.classList.remove(
                    "playing"
                );

            }

        } catch (error) {

            console.error(
                "Music could not be played:",
                error
            );

        }

    }
);


/* =====================================================
   GUEST DATA
===================================================== */

const guestName =
    document.getElementById("guestName");

const revealBtn =
    document.getElementById("revealBtn");

const guestMessage =
    document.getElementById("guestMessage");

let guests = [];


/* =====================================================
   LOAD GUESTS.JSON
===================================================== */

async function loadGuests() {

    try {

        const response =
            await fetch("./guests.json");

        if (!response.ok) {

            throw new Error(
                "Could not load guests.json"
            );

        }

        guests =
            await response.json();

        console.log(
            "Guest list loaded:",
            guests
        );

    } catch (error) {

        console.error(
            "Error loading guests.json:",
            error
        );

    }

}


/* =====================================================
   NORMALIZE NAME
===================================================== */

function normalizeName(name) {

    return name
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

}


/* =====================================================
   FIND MATCHING GUESTS
===================================================== */

function findGuests(searchName) {

    const search =
        normalizeName(searchName);

    return guests.filter(
        guest => {

            const fullName =
                normalizeName(
                    guest.name
                );

            if (fullName === search) {

                return true;

            }

            const firstName =
                fullName.split(" ")[0];

            return firstName === search;

        }
    );

}


/* =====================================================
   SHOW MESSAGE
===================================================== */

function showGuestMessage(guest) {

    guestMessage.innerHTML = `

        <div class="message-divider"></div>

        <p class="message-text">

            Dear
            <strong>
                ${escapeHTML(guest.name)}
            </strong>,

            <br><br>

            ${escapeHTML(guest.message)}

        </p>

    `;

    guestMessage.classList.add(
        "show"
    );

}


/* =====================================================
   SHOW NAME CHOICES
===================================================== */

function showGuestChoices(matches) {

    let buttons = "";


    matches.forEach(
        (guest, index) => {

            buttons += `

                <button
                    class="guest-choice"
                    data-index="${index}"
                    type="button"
                >
                    ${escapeHTML(guest.name)}
                </button>

            `;

        }
    );


    guestMessage.innerHTML = `

        <div class="message-divider"></div>

        <p class="message-text choice-title">

            We found a few guests with that name.

            <br>

            Please select your name.

        </p>

        <div class="guest-choices">

            ${buttons}

        </div>

    `;


    guestMessage.classList.add(
        "show"
    );


    const choiceButtons =
        guestMessage.querySelectorAll(
            ".guest-choice"
        );


    choiceButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        button.dataset.index;

                    const selectedGuest =
                        matches[index];

                    showGuestMessage(
                        selectedGuest
                    );

                }
            );

        }
    );

}


/* =====================================================
   REVEAL GUEST MESSAGE
===================================================== */

function revealGuestMessage() {

    const input =
        guestName.value.trim();


    if (!input) {

        guestName.focus();

        guestMessage.innerHTML = `

            <div class="message-divider"></div>

            <p class="message-text">

                Please enter your name first.

            </p>

        `;

        guestMessage.classList.add(
            "show"
        );

        return;

    }


    const matches =
        findGuests(input);


    if (matches.length === 0) {

        guestMessage.innerHTML = `

            <div class="message-divider"></div>

            <p class="message-text">

                We couldn't find your name
                on our guest list.

                <br><br>

                Please try typing your first name
                or full name.

            </p>

        `;

        guestMessage.classList.add(
            "show"
        );

        return;

    }


    if (matches.length === 1) {

        showGuestMessage(
            matches[0]
        );

        return;

    }


    showGuestChoices(
        matches
    );

}


/* =====================================================
   ENTER KEY
===================================================== */

guestName.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            revealGuestMessage();

        }

    }
);


/* =====================================================
   REVEAL BUTTON
===================================================== */

revealBtn.addEventListener(
    "click",
    revealGuestMessage
);


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}


/* =====================================================
   LOAD GUESTS
===================================================== */

loadGuests();


/* =====================================================
   BACKGROUND SCROLL SYSTEM
===================================================== */

const bgVideo =
    document.querySelector(".bg-video");

const colorBackground =
    document.querySelector(
        ".color-background"
    );


let currentScroll = 0;

let targetScroll = 0;


/* =====================================================
   SCROLL STATE
===================================================== */

function updateBackgroundScroll() {

    targetScroll =
        window.scrollY;

    /*
        After even a small scroll,
        reveal the hidden hero text.
    */

    if (window.scrollY > 35) {

        document.body.classList.add(
            "has-scrolled"
        );

    } else {

        document.body.classList.remove(
            "has-scrolled"
        );

    }

}


/* =====================================================
   LIQUID BACKGROUND ANIMATION
===================================================== */

function animateBackground() {

    /*
        Smooth scrolling movement.
    */

    currentScroll +=
        (
            targetScroll -
            currentScroll
        ) * 0.055;


    const maxScroll =
        Math.max(
            document.documentElement.scrollHeight -
            window.innerHeight,
            1
        );


    const scrollProgress =
        Math.min(
            Math.max(
                currentScroll /
                maxScroll,
                0
            ),
            1
        );


    /* =================================================
       VIDEO FADE
    ================================================= */

    const fadeStart =
        0.015;

    const fadeEnd =
        0.24;


    let videoProgress =
        (
            scrollProgress -
            fadeStart
        ) /
        (
            fadeEnd -
            fadeStart
        );


    videoProgress =
        Math.min(
            Math.max(
                videoProgress,
                0
            ),
            1
        );


    /*
        Smooth fade.
    */

    const smoothFade =
        videoProgress *
        videoProgress *
        (
            3 -
            2 * videoProgress
        );


    bgVideo.style.opacity =
        1 - smoothFade;


    /* =================================================
       WHOLE BACKGROUND MOVEMENT
    ================================================= */

    /*
        The complete color field moves together.
        No individual color panels.
    */

    const moveX =
        Math.sin(
            scrollProgress *
            Math.PI *
            1.15
        ) * 4;

    const moveY =
        Math.cos(
            scrollProgress *
            Math.PI *
            0.95
        ) * 3;


    colorBackground.style.transform =
        `
        translate3d(
            ${moveX}px,
            ${moveY}px,
            0
        )
        scale(1.08)
        `;


    /* =================================================
       BACKGROUND POSITION
    ================================================= */

    const positionX =
        42 +
        Math.sin(
            scrollProgress *
            Math.PI *
            1.15
        ) * 13;


    const positionY =
        45 +
        Math.cos(
            scrollProgress *
            Math.PI *
            0.95
        ) * 9;


    colorBackground.style.backgroundPosition =
        `${positionX}% ${positionY}%`;


    /* =================================================
       SUBTLE LIQUID EFFECT
    ================================================= */

    const liquidWave =
        Math.sin(
            scrollProgress *
            Math.PI *
            2
        ) * 0.8;


    colorBackground.style.filter =
        `
        blur(${28 + liquidWave}px)
        saturate(1.06)
        `;


    requestAnimationFrame(
        animateBackground
    );

}


/* =====================================================
   SCROLL LISTENER
===================================================== */

window.addEventListener(
    "scroll",
    updateBackgroundScroll,
    {
        passive: true
    }
);


/* =====================================================
   INITIALIZE
===================================================== */

updateBackgroundScroll();

animateBackground();