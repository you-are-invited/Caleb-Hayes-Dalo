/* =========================================================
   GLOBAL INVITATION STATE
========================================================= */

let invitationStarted = false;


/* =========================================================
   ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const loadingStatus =
    document.getElementById("loadingStatus");

const loadingProgress =
    document.getElementById("loadingProgress");

const viewInvitationWrapper =
    document.getElementById("viewInvitationWrapper");

const viewInvitationBtn =
    document.getElementById("viewInvitationBtn");

const bgVideo =
    document.getElementById("bgVideo");

const music =
    document.getElementById("bgMusic");

const musicBtn =
    document.getElementById("musicBtn");

const musicText =
    document.getElementById("musicText");

const colorBackground =
    document.querySelector(".color-background");


/* =========================================================
   INITIAL STATE
========================================================= */

document.body.classList.add("invitation-loading");


/* =========================================================
   VIDEO INITIAL STATE
========================================================= */

if (bgVideo) {

    bgVideo.pause();

    bgVideo.preload = "auto";

    bgVideo.muted = true;

    bgVideo.playsInline = true;

    bgVideo.style.opacity = "0";

}


/* =========================================================
   VIDEO LOADING STATE
========================================================= */

let videoMetadataReady = false;

let videoLoadingFinished = false;

let videoLoadFailed = false;


/*
 * We don't need to calculate the buffer every 250ms.
 * canplay + progress events are enough for this invitation.
 */

const REQUIRED_BUFFER_SECONDS = 4;


/* =========================================================
   LOADING STATUS
========================================================= */

function setLoadingStatus(message) {

    if (!loadingStatus) {
        return;
    }

    loadingStatus.style.opacity = "0";

    setTimeout(() => {

        loadingStatus.textContent = message;

        loadingStatus.style.opacity = "1";

    }, 120);

}


/* =========================================================
   ROTATING LOADING MESSAGES
========================================================= */

const LOADING_MESSAGES = [
    "Preparing your invitation...",
    "Gathering pearls and starlight...",
    "Smoothing the waves for you...",
    "Setting the underwater scene...",
    "Almost time to dive in...",
    "Just a few more ripples..."
];

let loadingMessageIndex = 0;

let loadingMessageTimer = null;


function startLoadingMessageRotation() {

    if (loadingMessageTimer) {
        return;
    }

    loadingMessageIndex = 0;

    setLoadingStatus(
        LOADING_MESSAGES[loadingMessageIndex]
    );

    loadingMessageTimer = setInterval(() => {

        loadingMessageIndex =
            (loadingMessageIndex + 1) %
            LOADING_MESSAGES.length;

        setLoadingStatus(
            LOADING_MESSAGES[loadingMessageIndex]
        );

    }, 1800);

}


function stopLoadingMessageRotation() {

    if (loadingMessageTimer) {

        clearInterval(
            loadingMessageTimer
        );

        loadingMessageTimer = null;

    }

}


/* =========================================================
   LOADING PROGRESS
========================================================= */

function setLoadingProgress(value) {

    if (!loadingProgress) {
        return;
    }

    const safeValue = Math.min(
        Math.max(value, 0),
        100
    );

    loadingProgress.style.width =
        `${safeValue}%`;

}


/* =========================================================
   SHOW VIEW INVITATION
========================================================= */

function showViewInvitation() {

    if (!viewInvitationWrapper) {
        return;
    }

    viewInvitationWrapper.classList.add("ready");

}


/* =========================================================
   GET BUFFERED SECONDS
========================================================= */

function getBufferedSeconds() {

    if (!bgVideo) {
        return 0;
    }

    if (
        !bgVideo.buffered ||
        bgVideo.buffered.length === 0
    ) {
        return 0;
    }

    try {

        const currentTime =
            bgVideo.currentTime || 0;

        for (
            let i = 0;
            i < bgVideo.buffered.length;
            i++
        ) {

            const start =
                bgVideo.buffered.start(i);

            const end =
                bgVideo.buffered.end(i);

            if (
                currentTime >= start &&
                currentTime <= end
            ) {

                return Math.max(
                    0,
                    end - currentTime
                );

            }

        }

    } catch (error) {

        return 0;

    }

    return 0;

}


/* =========================================================
   GET BUFFERED PERCENTAGE
========================================================= */

function getBufferedPercentage() {

    if (!bgVideo) {
        return 0;
    }

    const duration =
        bgVideo.duration;

    if (
        !Number.isFinite(duration) ||
        duration <= 0
    ) {
        return 0;
    }

    if (
        !bgVideo.buffered ||
        bgVideo.buffered.length === 0
    ) {
        return 0;
    }

    try {

        const currentTime =
            bgVideo.currentTime || 0;

        for (
            let i = 0;
            i < bgVideo.buffered.length;
            i++
        ) {

            const start =
                bgVideo.buffered.start(i);

            const end =
                bgVideo.buffered.end(i);

            if (
                currentTime >= start &&
                currentTime <= end
            ) {

                return Math.min(
                    100,
                    Math.max(
                        0,
                        (end / duration) * 100
                    )
                );

            }

        }

    } catch (error) {

        return 0;

    }

    return 0;

}


/* =========================================================
   CHECK VIDEO BUFFER
========================================================= */

function checkVideoBuffer() {

    if (
        !bgVideo ||
        videoLoadingFinished ||
        videoLoadFailed ||
        !videoMetadataReady
    ) {
        return;
    }

    const duration =
        bgVideo.duration;

    const bufferedSeconds =
        getBufferedSeconds();

    const bufferedPercentage =
        getBufferedPercentage();


    /* -----------------------------------------
       UPDATE VISUAL PROGRESS
    ----------------------------------------- */

    if (bufferedPercentage > 0) {

        const progress =
            Math.min(
                95,
                20 +
                bufferedPercentage * 0.75
            );

        setLoadingProgress(progress);

    }


    /* -----------------------------------------
       VIDEO IS READY
    ----------------------------------------- */

    const enoughBuffer =
        duration > 0 &&
        bufferedSeconds >=
        Math.min(
            REQUIRED_BUFFER_SECONDS,
            duration * 0.6
        );


    const canPlay =
        bgVideo.readyState >= 3;


    if (
        enoughBuffer ||
        bufferedPercentage >= 85 ||
        canPlay
    ) {

        markVideoReady();

    }

}


/* =========================================================
   MARK VIDEO READY
========================================================= */

function markVideoReady() {

    if (videoLoadingFinished) {
        return;
    }

    videoLoadingFinished = true;

    stopLoadingMessageRotation();

    setLoadingProgress(100);

    setLoadingStatus(
        "Your invitation is ready."
    );

    showViewInvitation();

}


/* =========================================================
   PREPARE VIDEO
========================================================= */

function prepareVideo() {

    if (!bgVideo) {

        markVideoReady();

        return;

    }


    startLoadingMessageRotation();

    setLoadingProgress(5);


    /* =====================================================
       LOADED METADATA
    ===================================================== */

    bgVideo.addEventListener(
        "loadedmetadata",
        () => {

            videoMetadataReady = true;

            setLoadingProgress(15);

            try {

                bgVideo.pause();

                bgVideo.currentTime = 0;

            } catch (error) {

                console.warn(
                    "Could not reset video:",
                    error
                );

            }

            checkVideoBuffer();

        },
        { once: true }
    );


    /* =====================================================
       LOADED DATA
    ===================================================== */

    bgVideo.addEventListener(
        "loadeddata",
        () => {

            videoMetadataReady = true;

            setLoadingProgress(30);

            checkVideoBuffer();

        },
        { once: true }
    );


    /* =====================================================
       CAN PLAY
    ===================================================== */

    bgVideo.addEventListener(
        "canplay",
        () => {

            videoMetadataReady = true;

            setLoadingProgress(85);

            checkVideoBuffer();

        },
        { once: true }
    );


    /* =====================================================
       CAN PLAY THROUGH
    ===================================================== */

    bgVideo.addEventListener(
        "canplaythrough",
        () => {

            videoMetadataReady = true;

            setLoadingProgress(96);

            markVideoReady();

        },
        { once: true }
    );


    /* =====================================================
       PROGRESS
    ===================================================== */

    bgVideo.addEventListener(
        "progress",
        () => {

            checkVideoBuffer();

        }
    );


    /* =====================================================
       ERROR
    ===================================================== */

    bgVideo.addEventListener(
        "error",
        () => {

            videoLoadFailed = true;

            console.warn(
                "Background video could not be loaded."
            );

            stopLoadingMessageRotation();

            setLoadingProgress(100);

            setLoadingStatus(
                "Your invitation is ready."
            );

            showViewInvitation();

        },
        { once: true }
    );


    /* =====================================================
       START PRELOAD
    ===================================================== */

    try {

        bgVideo.preload = "auto";

        bgVideo.load();

    } catch (error) {

        console.warn(
            "Could not start video preload:",
            error
        );

        videoLoadFailed = true;

        stopLoadingMessageRotation();

        setLoadingProgress(100);

        setLoadingStatus(
            "Your invitation is ready."
        );

        showViewInvitation();

    }

}


/* =========================================================
   MUSIC STATE
========================================================= */

let isPlaying = false;


/* =========================================================
   START INVITATION
========================================================= */

async function startInvitation() {

    if (invitationStarted) {
        return;
    }

    invitationStarted = true;


    /* =====================================================
       FIX: STAGGER-ANIMATION TRIGGER

       Idinadagdag ang class na ito sa <body> sa mismong
       sandali ng pag-click sa "View Invitation" — hindi
       pagka-load ng page. Ang CSS stagger animation
       (fadeInUp na may animation-delay) sa style.css ay
       naka-scope na sa "body.invitation-active", kaya ang
       delay timers (0.8s, 4.1s, 7.1s, atbp.) ay magsisimula
       mag-bilang lang mula rito — kahit gaano katagal
       naghintay ang guest sa loading screen bago mag-click,
       hindi na sila magiging out-of-sync.
    ===================================================== */

    document.body.classList.add(
        "invitation-active"
    );


    if (viewInvitationBtn) {

        viewInvitationBtn.disabled = true;

    }


    /* =====================================================
       HIDE LOADING SCREEN
    ===================================================== */

    if (loadingScreen) {

        loadingScreen.classList.add(
            "hidden"
        );

    }

    document.body.classList.remove(
        "invitation-loading"
    );


    /* =====================================================
       VIDEO
    ===================================================== */

    if (bgVideo) {

        bgVideo.style.opacity = "1";

        try {

            if (
                bgVideo.currentTime > 0.05
            ) {

                bgVideo.currentTime = 0;

            }

            await bgVideo.play();

        } catch (error) {

            console.warn(
                "Video playback could not start:",
                error
            );

        }

    }


    /* =====================================================
       MUSIC
    ===================================================== */

    if (music) {

        try {

            await music.play();

            isPlaying = true;

            if (musicText) {

                musicText.textContent =
                    "Pause";

            }

            if (musicBtn) {

                musicBtn.classList.add(
                    "playing"
                );

            }

        } catch (error) {

            console.log(
                "Music requires another tap:",
                error
            );

            isPlaying = false;

            if (musicText) {

                musicText.textContent =
                    "Tap for music";

            }

            if (musicBtn) {

                musicBtn.classList.remove(
                    "playing"
                );

            }

        }

    }


    /* =====================================================
       START HERO
    ===================================================== */

    startCinematicHero();


    /* =====================================================
       HIDE VIEW INVITATION BUTTON
    ===================================================== */

    if (viewInvitationWrapper) {

        viewInvitationWrapper.classList.remove(
            "ready"
        );

    }


    /* =====================================================
       SHOW MUSIC BUTTON
    ===================================================== */

    if (musicBtn) {

        musicBtn.classList.remove(
            "hidden"
        );

    }


    /* =====================================================
       REMOVE LOADING SCREEN COMPLETELY
    ===================================================== */

    setTimeout(() => {

        if (loadingScreen) {

            loadingScreen.style.display =
                "none";

        }

    }, 1100);

}


/* =========================================================
   VIEW INVITATION CLICK
========================================================= */

if (viewInvitationBtn) {

    viewInvitationBtn.addEventListener(
        "click",
        startInvitation
    );

}


/* =========================================================
   BACKGROUND MUSIC CONTROL
========================================================= */

if (musicBtn) {

    musicBtn.addEventListener(
        "click",
        async () => {

            if (!music) {
                return;
            }

            try {

                if (!isPlaying) {

                    await music.play();

                    isPlaying = true;

                    if (musicText) {

                        musicText.textContent =
                            "Pause";

                    }

                    musicBtn.classList.add(
                        "playing"
                    );

                } else {

                    music.pause();

                    isPlaying = false;

                    if (musicText) {

                        musicText.textContent =
                            "Tap for music";

                    }

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

}


/* =========================================================
   GUEST MESSAGE
========================================================= */

const guestName =
    document.getElementById("guestName");

const revealBtn =
    document.getElementById("revealBtn");

const guestMessage =
    document.getElementById("guestMessage");

let guests = [];


/* =========================================================
   LOAD GUESTS
========================================================= */

async function loadGuests() {

    try {

        const response =
            await fetch(
                "./guests.json",
                {
                    cache: "no-cache"
                }
            );

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


/* =========================================================
   NORMALIZE NAME
========================================================= */

function normalizeName(name) {

    return String(name || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();

}


/* =========================================================
   GET GUEST NAMES
========================================================= */

function getGuestNames(guest) {

    if (Array.isArray(guest.name)) {

        return guest.name;

    }

    return [guest.name];

}


/* =========================================================
   FIND GUESTS
========================================================= */

function findGuests(searchName) {

    const search =
        normalizeName(searchName);

    return guests.filter(guest => {

        const possibleNames =
            getGuestNames(guest);

        return possibleNames.some(name => {

            const normalizedName =
                normalizeName(name);

            if (
                normalizedName ===
                search
            ) {

                return true;

            }

            const firstName =
                normalizedName
                    .split(" ")[0];

            return firstName === search;

        });

    });

}


/* =========================================================
   GET DISPLAY NAME
========================================================= */

function getDisplayName(guest) {

    const names =
        getGuestNames(guest);

    return names[0] || "";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        String(text || "");

    return div.innerHTML;

}


/* =========================================================
   FORMAT MESSAGE
========================================================= */

function formatGuestMessage(message) {

    return String(message || "")
        .trim()
        .split(/\n\s*\n/)
        .map(paragraph => {

            return `
                <p class="message-paragraph">
                    ${escapeHTML(paragraph).replace(/\n/g, "<br>")}
                </p>
            `;

        })
        .join("");

}


/* =========================================================
   SHOW GUEST MESSAGE
========================================================= */

function showGuestMessage(guest) {

    const displayName =
        getDisplayName(guest);

    const formattedMessage =
        formatGuestMessage(
            guest.message
        );

    const currentScrollPosition =
        window.scrollY;


    guestMessage.innerHTML = `

        <div class="message-divider"></div>

        <div class="message-text">

            <p class="message-greeting">

                Dear
                <strong>
                    ${escapeHTML(displayName)}
                </strong>,

            </p>

            <div class="message-body">

                ${formattedMessage}

            </div>


            <div class="rsvp-section">

                <div class="rsvp-divider"></div>

                <p class="rsvp-label">
                    RSVP
                </p>

                <h4 class="rsvp-title">
                    We hope you can join us.
                </h4>

                <p class="rsvp-text">
                    Please let us know if you’ll be able to
                    celebrate with us and if you’ll be bringing
                    a guest. Seating is limited, so this will
                    help us prepare a place for everyone.
                </p>

                <p class="rsvp-confirm">
                    Kindly confirm with:
                </p>

                <div class="rsvp-buttons">

                    <a
                        href="https://m.me/shean.dalo.2025"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rsvp-button">

                        <span>
                            Confirm to Shean
                        </span>

                    </a>


                    <a
                        href="https://m.me/laydslyne"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="rsvp-button">

                        <span>
                            Confirm to Lyne
                        </span>

                    </a>

                </div>

            </div>

        </div>

    `;


    guestMessage.classList.add(
        "show"
    );


    requestAnimationFrame(() => {

        window.scrollTo(
            0,
            currentScrollPosition
        );

    });

}


/* =========================================================
   SHOW GUEST CHOICES
========================================================= */

function showGuestChoices(matches) {

    let buttons = "";

    matches.forEach(
        (guest, index) => {

            buttons += `

                <button
                    class="guest-choice"
                    data-index="${index}"
                    type="button">

                    ${escapeHTML(
                        getDisplayName(guest)
                    )}

                </button>

            `;

        }
    );


    guestMessage.innerHTML = `

        <div class="message-divider"></div>

        <div class="message-text">

            <p class="message-paragraph">

                We found a few guests with that name.

                <br><br>

                Please select your name.

            </p>

            <div class="guest-choices">

                ${buttons}

            </div>

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
                        Number(
                            button.dataset.index
                        );

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


/* =========================================================
   REVEAL GUEST MESSAGE
========================================================= */

function revealGuestMessage() {

    if (!guestName || !guestMessage) {
        return;
    }


    const input =
        guestName.value.trim();


    if (!input) {

        guestName.focus();

        guestMessage.innerHTML = `

            <div class="message-divider"></div>

            <div class="message-text validation-message">

                Please enter your name first.

            </div>

        `;


        guestMessage.classList.add(
            "show"
        );


        guestName.classList.remove(
            "name-required"
        );

        void guestName.offsetWidth;

        guestName.classList.add(
            "name-required"
        );

        return;

    }


    guestName.classList.remove(
        "name-required"
    );


    const matches =
        findGuests(input);


    if (matches.length === 0) {

        guestMessage.innerHTML = `

            <div class="message-divider"></div>

            <div class="message-text">

                <p class="message-paragraph">

                    We couldn't find your name
                    on our guest list.

                </p>

                <p class="message-paragraph">

                    Please try typing your first
                    name or full name.

                </p>

            </div>

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


/* =========================================================
   ENTER KEY / INPUT
========================================================= */

if (guestName) {

    guestName.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                revealGuestMessage();

            }

        }
    );


    guestName.addEventListener(
        "input",
        () => {

            const hasName =
                guestName.value.trim().length > 0;


            if (hasName) {

                guestName.classList.remove(
                    "name-required"
                );

                guestMessage.classList.remove(
                    "show"
                );


                if (revealBtn) {

                    revealBtn.classList.add(
                        "ready"
                    );

                }

            } else {

                if (revealBtn) {

                    revealBtn.classList.remove(
                        "ready"
                    );

                }

            }

        }
    );

}


if (revealBtn) {

    revealBtn.addEventListener(
        "click",
        revealGuestMessage
    );

}


/* =========================================================
   BACKGROUND SCROLL EFFECT
========================================================= */

/*
 * SIMPLIFIED VERSION
 *
 * Only one animation loop.
 * No continuous background-position animation.
 * No unnecessary calculations.
 */

let currentScroll = 0;

let targetScroll = 0;

let bgAnimationFrameId = null;


function updateBackgroundScroll() {

    targetScroll =
        window.scrollY;


    if (window.scrollY > 35) {

        document.body.classList.add(
            "has-scrolled"
        );

    } else {

        document.body.classList.remove(
            "has-scrolled"
        );

    }


    if (bgAnimationFrameId === null) {

        bgAnimationFrameId =
            requestAnimationFrame(
                animateBackground
            );

    }

}


function animateBackground() {

    const difference =
        targetScroll -
        currentScroll;


    if (Math.abs(difference) < 0.5) {

        currentScroll =
            targetScroll;

        bgAnimationFrameId = null;

        updateBackgroundVisuals();

        return;

    }


    currentScroll +=
        difference * 0.08;


    updateBackgroundVisuals();


    bgAnimationFrameId =
        requestAnimationFrame(
            animateBackground
        );

}


/* =========================================================
   UPDATE BACKGROUND VISUALS
========================================================= */

function updateBackgroundVisuals() {

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


    /* =====================================================
       VIDEO FADE
    ===================================================== */

    if (
        invitationStarted &&
        bgVideo
    ) {

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


        const smoothFade =
            videoProgress *
            videoProgress *
            (
                3 -
                2 * videoProgress
            );


        bgVideo.style.opacity =
            1 - smoothFade;

    }


    /* =====================================================
       LIGHTWEIGHT BACKGROUND MOVEMENT
    ===================================================== */

    if (colorBackground) {

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
            `translate3d(
                ${moveX}px,
                ${moveY}px,
                0
            ) scale(1.08)`;

    }

}


/* =========================================================
   SCROLL EVENT
========================================================= */

window.addEventListener(
    "scroll",
    updateBackgroundScroll,
    {
        passive: true
    }
);


updateBackgroundScroll();


/* =========================================================
   CINEMATIC HERO
========================================================= */

let cinematicStarted = false;


function startCinematicHero() {

    if (cinematicStarted) {
        return;
    }


    cinematicStarted = true;


    const eyebrow =
        document.querySelector(
            ".eyebrow-reveal"
        );

    const line =
        document.querySelector(
            ".line-reveal"
        );

    const intro =
        document.querySelector(
            ".intro-reveal"
        );

    const name =
        document.querySelector(
            ".cinematic-name"
        );

    const underline =
        document.querySelector(
            ".underline-reveal"
        );

    const label =
        document.querySelector(
            ".label-reveal"
        );

    const title =
        document.querySelector(
            ".cinematic-title"
        );

    const hosted =
        document.querySelector(
            ".hosted-reveal"
        );

    const scrollIndicator =
        document.querySelector(
            ".scroll-reveal"
        );


    /* =====================================================
       REVEAL ALL HERO TEXT
    ===================================================== */

    function reveal(element) {

        if (element) {

            element.classList.add(
                "show"
            );

        }

    }


    reveal(eyebrow);

    reveal(line);

    reveal(intro);

    reveal(name);

    reveal(underline);

    reveal(label);

    reveal(title);

    reveal(hosted);

    reveal(scrollIndicator);


    if (scrollIndicator) {

        scrollIndicator.classList.add(
            "scroll-ready"
        );

    }


    /* =====================================================
       AUTOMATIC SMOOTH SCROLL
       
       ONLY THIS PART IS TIMED.
       
       After 7 seconds, the page automatically
       scrolls down to the event details.
    ===================================================== */

    setTimeout(() => {

        if (window.scrollY > 10) {
            return;
        }


        const eventDetails =
            document.querySelector(
                ".event-details"
            );


        if (!eventDetails) {
            return;
        }


        const sectionTop =
            eventDetails.getBoundingClientRect().top +
            window.scrollY;


        const viewportHeight =
            window.innerHeight;


        let targetPosition =
            sectionTop -
            (
                viewportHeight *
                0.52
            );


        const maxScroll =
            document.documentElement.scrollHeight -
            window.innerHeight;


        targetPosition =
            Math.max(
                0,
                Math.min(
                    targetPosition,
                    maxScroll
                )
            );


        smoothScrollTo(
            targetPosition,
            2400
        );


        /* =================================================
           INPUT PULSE
        ================================================= */

        setTimeout(() => {

            const nameInput =
                document.getElementById(
                    "guestName"
                );


            if (!nameInput) {
                return;
            }


            nameInput.classList.remove(
                "input-pulse"
            );


            void nameInput.offsetWidth;


            nameInput.classList.add(
                "input-pulse"
            );

        }, 2600);

    }, 7000);

}


/* =========================================================
   ULTRA-SMOOTH SCROLL
========================================================= */

function smoothScrollTo(
    target,
    duration
) {

    const start =
        window.scrollY;


    const distance =
        target -
        start;


    const startTime =
        performance.now();


    function easeInOutCubic(t) {

        return t < 0.5

            ? 4 *
                t *
                t *
                t

            : 1 -
                Math.pow(
                    -2 * t + 2,
                    3
                ) / 2;

    }


    function animateScroll(
        currentTime
    ) {

        const elapsed =
            currentTime -
            startTime;


        const progress =
            Math.min(
                elapsed /
                duration,
                1
            );


        const eased =
            easeInOutCubic(
                progress
            );


        window.scrollTo(
            0,
            start +
            distance *
            eased
        );


        if (progress < 1) {

            requestAnimationFrame(
                animateScroll
            );

        }

    }


    requestAnimationFrame(
        animateScroll
    );

}


/* =========================================================
   COUNTDOWN TIMER
========================================================= */

function initCountdownTimer() {

    const countdownEl =
        document.getElementById(
            "countdownTimer"
        );


    if (!countdownEl) {
        return;
    }


    const targetDateString =
        countdownEl.dataset.eventDatetime;


    const targetDate =
        new Date(
            targetDateString
        );


    if (
        !targetDateString ||
        Number.isNaN(
            targetDate.getTime()
        )
    ) {

        console.warn(
            "Countdown: invalid event date/time."
        );

        return;

    }


    const daysEl =
        document.getElementById(
            "cdDays"
        );

    const hoursEl =
        document.getElementById(
            "cdHours"
        );

    const minutesEl =
        document.getElementById(
            "cdMinutes"
        );

    const secondsEl =
        document.getElementById(
            "cdSeconds"
        );


    function pad(number) {

        return String(number)
            .padStart(2, "0");

    }


    let countdownInterval = null;


    function updateCountdown() {

        const now =
            new Date();


        const diff =
            targetDate.getTime() -
            now.getTime();


        if (diff <= 0) {

            if (daysEl)
                daysEl.textContent = "00";

            if (hoursEl)
                hoursEl.textContent = "00";

            if (minutesEl)
                minutesEl.textContent = "00";

            if (secondsEl)
                secondsEl.textContent = "00";


            if (countdownInterval) {

                clearInterval(
                    countdownInterval
                );

            }

            return;

        }


        const totalSeconds =
            Math.floor(
                diff / 1000
            );


        const days =
            Math.floor(
                totalSeconds / 86400
            );


        const hours =
            Math.floor(
                (
                    totalSeconds %
                    86400
                ) / 3600
            );


        const minutes =
            Math.floor(
                (
                    totalSeconds %
                    3600
                ) / 60
            );


        const seconds =
            totalSeconds %
            60;


        if (daysEl)
            daysEl.textContent =
                pad(days);


        if (hoursEl)
            hoursEl.textContent =
                pad(hours);


        if (minutesEl)
            minutesEl.textContent =
                pad(minutes);


        if (secondsEl)
            secondsEl.textContent =
                pad(seconds);

    }


    updateCountdown();


    countdownInterval =
        setInterval(
            updateCountdown,
            1000
        );

}


/* =========================================================
   START
========================================================= */

loadGuests();

prepareVideo();

initCountdownTimer();