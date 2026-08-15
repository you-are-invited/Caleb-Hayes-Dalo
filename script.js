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

document.body.classList.add(
    "invitation-loading"
);


if (bgVideo) {

    bgVideo.pause();

    try {
        bgVideo.currentTime = 0;
    } catch (error) {
        console.warn(
            "Could not reset video:",
            error
        );
    }

    bgVideo.style.opacity = "0";

}


/* =========================================================
   VIDEO LOADING STATE
========================================================= */

let videoMetadataReady = false;

let videoCanPlay = false;

let videoLoadingFinished = false;

let videoLoadFailed = false;

let videoFallbackTimer = null;


const VIDEO_FALLBACK_TIME = 12000;


/* =========================================================
   UPDATE LOADING MESSAGE
========================================================= */

function setLoadingStatus(message) {

    if (!loadingStatus) {
        return;
    }


    loadingStatus.style.opacity = "0";


    setTimeout(() => {

        loadingStatus.textContent =
            message;

        loadingStatus.style.opacity =
            "1";

    }, 180);

}


/* =========================================================
   UPDATE LOADING PROGRESS
========================================================= */

function setLoadingProgress(value) {

    if (!loadingProgress) {
        return;
    }


    const safeValue =
        Math.min(
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


    viewInvitationWrapper.classList.add(
        "ready"
    );

}


/* =========================================================
   VIDEO IS READY
========================================================= */

function markVideoReady() {

    if (videoLoadingFinished) {
        return;
    }


    videoLoadingFinished = true;


    if (videoFallbackTimer) {

        clearTimeout(
            videoFallbackTimer
        );

        videoFallbackTimer = null;

    }


    setLoadingProgress(100);


    setLoadingStatus(
        "Your invitation is ready."
    );


    showViewInvitation();

}


/* =========================================================
   VIDEO PRELOAD
========================================================= */

function prepareVideo() {

    if (!bgVideo) {

        videoMetadataReady = true;

        videoCanPlay = true;

        markVideoReady();

        return;

    }


    setLoadingStatus(
        "Preparing the invitation..."
    );

    setLoadingProgress(5);


    try {

        bgVideo.preload = "auto";

        bgVideo.load();

    } catch (error) {

        console.warn(
            "Could not start video preload:",
            error
        );

    }


    /* =====================================================
       METADATA READY
    ===================================================== */

    bgVideo.addEventListener(
        "loadedmetadata",
        () => {

            videoMetadataReady = true;

            setLoadingProgress(25);

            setLoadingStatus(
                "Preparing the video..."
            );


            try {

                bgVideo.pause();

                bgVideo.currentTime = 0;

            } catch (error) {

                console.warn(
                    "Could not reset video:",
                    error
                );

            }

        },
        {
            once: true
        }
    );


    /* =====================================================
       CAN PLAY
    ===================================================== */

    bgVideo.addEventListener(
        "canplay",
        () => {

            videoCanPlay = true;

            setLoadingProgress(70);

            setLoadingStatus(
                "Almost ready..."
            );

            markVideoReady();

        },
        {
            once: true
        }
    );


    /* =====================================================
       CAN PLAY THROUGH
    ===================================================== */

    bgVideo.addEventListener(
        "canplaythrough",
        () => {

            setLoadingProgress(100);


            if (!videoLoadingFinished) {

                setLoadingStatus(
                    "Your invitation is ready."
                );

                markVideoReady();

            }

        },
        {
            once: true
        }
    );


    /* =====================================================
       PROGRESS
    ===================================================== */

    bgVideo.addEventListener(
        "progress",
        updateVideoProgress
    );


    /* =====================================================
       WAITING
    ===================================================== */

    bgVideo.addEventListener(
        "waiting",
        () => {

            if (!invitationStarted) {

                setLoadingStatus(
                    "Loading the invitation..."
                );

            }

        }
    );


    /* =====================================================
       STALLED
    ===================================================== */

    bgVideo.addEventListener(
        "stalled",
        () => {

            if (!invitationStarted) {

                setLoadingStatus(
                    "Your connection is a little slow..."
                );

            }

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


            if (
                videoCanPlay ||
                bgVideo.readyState >= 3
            ) {

                markVideoReady();

                return;

            }


            setLoadingProgress(100);


            setLoadingStatus(
                "Your invitation is ready."
            );


            showViewInvitation();

        },
        {
            once: true
        }
    );


    /* =====================================================
       SLOW INTERNET FALLBACK
    ===================================================== */

    videoFallbackTimer =
        setTimeout(() => {

            if (videoLoadingFinished) {
                return;
            }


            if (
                bgVideo.readyState >= 3
            ) {

                videoCanPlay = true;

                markVideoReady();

                return;

            }


            console.warn(
                "Video is taking too long to load. Using fallback."
            );


            setLoadingProgress(100);


            setLoadingStatus(
                "Your invitation is ready."
            );


            showViewInvitation();

        }, VIDEO_FALLBACK_TIME);

}


/* =========================================================
   UPDATE VIDEO PROGRESS
========================================================= */

function updateVideoProgress() {

    if (!bgVideo) {
        return;
    }


    if (
        bgVideo.buffered &&
        bgVideo.buffered.length
    ) {

        try {

            const bufferedEnd =
                bgVideo.buffered.end(
                    bgVideo.buffered.length - 1
                );


            const duration =
                bgVideo.duration;


            if (
                Number.isFinite(duration) &&
                duration > 0
            ) {

                const percentage =
                    Math.min(
                        95,
                        35 +
                        (
                            bufferedEnd /
                            duration
                        ) * 60
                    );


                if (
                    !videoLoadingFinished
                ) {

                    setLoadingProgress(
                        percentage
                    );

                }

            }

        } catch (error) {

            console.warn(
                "Could not read video buffer.",
                error
            );

        }

    }

}


/* =========================================================
   START INVITATION
========================================================= */

async function startInvitation() {

    if (invitationStarted) {
        return;
    }


    if (
        !videoLoadingFinished &&
        !videoCanPlay &&
        !videoLoadFailed
    ) {

        return;

    }


    invitationStarted = true;


    if (viewInvitationBtn) {

        viewInvitationBtn.disabled = true;

    }


    if (loadingScreen) {

        loadingScreen.classList.add(
            "hidden"
        );

    }


    document.body.classList.remove(
        "invitation-loading"
    );


    /* =====================================================
       RESET VIDEO
    ===================================================== */

    if (bgVideo) {

        try {

            bgVideo.pause();

            bgVideo.currentTime = 0;

        } catch (error) {

            console.warn(
                "Could not reset video:",
                error
            );

        }

    }


    /* =====================================================
       SHOW VIDEO
    ===================================================== */

    if (bgVideo) {

        bgVideo.style.opacity = "1";

    }


    /* =====================================================
       START CINEMATIC HERO
    ===================================================== */

    startCinematicHero();


    /* =====================================================
       START VIDEO
    ===================================================== */

    if (bgVideo) {

        try {

            await bgVideo.play();

        } catch (error) {

            console.warn(
                "Video playback could not start:",
                error
            );

        }

    }


    /* =====================================================
       START MUSIC
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
       REMOVE LOADING SCREEN
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
   BACKGROUND MUSIC
========================================================= */

let isPlaying = false;


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


        return possibleNames.some(
            name => {

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


                return firstName ===
                    search;

            }
        );

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


    /*
     * SAVE CURRENT SCROLL POSITION
     */

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


            <!-- =================================================
                 RSVP
            ================================================== -->

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

                    <!-- SHEAN -->

                    <a
                        href="https://m.me/XDaegusvenus"
                        target="_blank"
                        class="rsvp-button">

                        <span>
                            Confirm to Shean
                        </span>

                    </a>


                    <!-- LYNE -->

                    <a
                        href="https://m.me/laydslyne"
                        target="_blank"
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


    /*
     * RESTORE EXACT SCROLL POSITION
     */

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
   ENTER KEY
========================================================= */

if (guestName) {

    guestName.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

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

let currentScroll = 0;

let targetScroll = 0;


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

}


function animateBackground() {

    currentScroll +=
        (
            targetScroll -
            currentScroll
        ) * .055;


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

    if (invitationStarted && bgVideo) {

        const fadeStart =
            .015;

        const fadeEnd =
            .24;


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
            1 -
            smoothFade;

    }


    /* =====================================================
       BACKGROUND MOVEMENT
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
                .95
            ) * 3;


        colorBackground.style.transform =
            `translate3d(
                ${moveX}px,
                ${moveY}px,
                0
            ) scale(1.08)`;


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
                .95
            ) * 9;


        colorBackground.style.backgroundPosition =
            `${positionX}% ${positionY}%`;

    }


    requestAnimationFrame(
        animateBackground
    );

}


window.addEventListener(
    "scroll",
    updateBackgroundScroll,
    {
        passive: true
    }
);


updateBackgroundScroll();

animateBackground();


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


    function reveal(element) {

        if (element) {

            element.classList.add(
                "show"
            );

        }

    }


    setTimeout(() => {

        reveal(eyebrow);
        reveal(line);

    }, 500);


    setTimeout(() => {

        reveal(intro);

    }, 600);


    setTimeout(() => {

        reveal(name);
        reveal(underline);

    }, 1500);


    setTimeout(() => {

        reveal(label);

    }, 3000);


    setTimeout(() => {

        reveal(title);

    }, 4800);


    setTimeout(() => {

        reveal(hosted);

    }, 7000);


    setTimeout(() => {

        reveal(scrollIndicator);


        if (scrollIndicator) {

            scrollIndicator.classList.add(
                "scroll-ready"
            );

        }

    }, 7000);


    /* =====================================================
       AUTOMATIC SMOOTH SCROLL
    ===================================================== */

    setTimeout(() => {

        if (window.scrollY <= 10) {

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
                    .52
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

        }

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

        return t < .5

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
   START
========================================================= */

loadGuests();

prepareVideo();