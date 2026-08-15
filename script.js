/* =========================================================
   GLOBAL INVITATION STATE
========================================================= */

let invitationStarted = false;
let cinematicStarted = false;
let isPlaying = false;


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

    bgVideo.style.opacity = "0";

    /*
     * IMPORTANT:
     * Do NOT force currentTime = 0 here.
     * If the browser has already buffered the video,
     * resetting it repeatedly can cause unnecessary
     * seeking and playback delay.
     */

    bgVideo.muted = true;

    bgVideo.playsInline = true;

    bgVideo.preload = "auto";

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

        if (!loadingStatus) {
            return;
        }

        loadingStatus.textContent =
            message;

        loadingStatus.style.opacity =
            "1";

    }, 150);

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
   VIDEO READY
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
   UPDATE VIDEO BUFFER PROGRESS
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

                if (!videoLoadingFinished) {

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
   VIDEO PRELOAD
========================================================= */

function prepareVideo() {

    if (!bgVideo) {

        markVideoReady();

        return;

    }

    setLoadingStatus(
        "Preparing the invitation..."
    );

    setLoadingProgress(5);


    /* =====================================================
       METADATA
    ===================================================== */

    bgVideo.addEventListener(
        "loadedmetadata",
        () => {

            videoMetadataReady = true;

            setLoadingProgress(25);

            setLoadingStatus(
                "Preparing the video..."
            );

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

            videoCanPlay = true;

            setLoadingProgress(100);

            markVideoReady();

        },
        {
            once: true
        }
    );


    /* =====================================================
       BUFFER PROGRESS
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

            /*
             * Video failure must NEVER prevent
             * the invitation from opening.
             */

            markVideoReady();

        },
        {
            once: true
        }
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

        markVideoReady();

        return;

    }


    /* =====================================================
       ALREADY BUFFERED
    ===================================================== */

    setTimeout(() => {

        if (videoLoadingFinished) {
            return;
        }

        if (
            bgVideo.readyState >=
            HTMLMediaElement.HAVE_FUTURE_DATA
        ) {

            videoCanPlay = true;

            markVideoReady();

        }

    }, 250);


    /* =====================================================
       FALLBACK
    ===================================================== */

    videoFallbackTimer =
        setTimeout(() => {

            if (videoLoadingFinished) {
                return;
            }

            if (
                bgVideo.readyState >=
                HTMLMediaElement.HAVE_FUTURE_DATA
            ) {

                videoCanPlay = true;

                markVideoReady();

                return;

            }

            console.warn(
                "Video is taking too long to load."
            );

            videoLoadFailed = true;

            setLoadingProgress(100);

            setLoadingStatus(
                "Your invitation is ready."
            );

            showViewInvitation();

        }, VIDEO_FALLBACK_TIME);

}


/* =========================================================
   VIDEO PLAYBACK
========================================================= */

function playBackgroundVideo() {

    if (!bgVideo) {
        return Promise.resolve(false);
    }

    try {

        /*
         * Only reset if the video has not started yet.
         * This avoids unnecessary seeking.
         */

        if (
            bgVideo.ended ||
            !Number.isFinite(bgVideo.currentTime)
        ) {

            bgVideo.currentTime = 0;

        }

    } catch (error) {

        console.warn(
            "Could not reset video:",
            error
        );

    }


    bgVideo.style.opacity = "1";


    try {

        const playPromise =
            bgVideo.play();

        if (
            playPromise &&
            typeof playPromise.then === "function"
        ) {

            return playPromise
                .then(() => true)
                .catch(error => {

                    console.warn(
                        "Video playback could not start:",
                        error
                    );

                    return false;

                });

        }

    } catch (error) {

        console.warn(
            "Video playback error:",
            error
        );

    }

    return Promise.resolve(false);

}


/* =========================================================
   MUSIC PLAYBACK
========================================================= */

function playBackgroundMusic() {

    if (!music) {
        return Promise.resolve(false);
    }

    try {

        const playPromise =
            music.play();

        if (
            playPromise &&
            typeof playPromise.then === "function"
        ) {

            return playPromise
                .then(() => {

                    isPlaying = true;

                    updateMusicButton();

                    return true;

                })
                .catch(error => {

                    console.warn(
                        "Music could not start:",
                        error
                    );

                    isPlaying = false;

                    updateMusicButton();

                    return false;

                });

        }

    } catch (error) {

        console.warn(
            "Music playback error:",
            error
        );

    }

    return Promise.resolve(false);

}


/* =========================================================
   MUSIC BUTTON UI
========================================================= */

function updateMusicButton() {

    if (musicText) {

        musicText.textContent =
            isPlaying
                ? "Pause"
                : "Tap for music";

    }

    if (musicBtn) {

        musicBtn.classList.toggle(
            "playing",
            isPlaying
        );

    }

}


/* =========================================================
   START INVITATION
========================================================= */

function startInvitation() {

    if (invitationStarted) {
        return;
    }

    invitationStarted = true;


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


    /*
     * IMPORTANT:
     *
     * Start VIDEO and MUSIC from the SAME user click.
     * Do NOT await one before starting the other.
     */

    const videoPromise =
        playBackgroundVideo();

    const musicPromise =
        playBackgroundMusic();


    /* =====================================================
       START CINEMATIC HERO
    ===================================================== */

    /*
     * Start the hero almost immediately after media
     * playback has been requested.
     *
     * This prevents the text from waiting several seconds
     * while video/music are already playing.
     */

    setTimeout(() => {

        startCinematicHero();

    }, 120);


    /*
     * Catch promises so one media failure does not
     * stop the invitation.
     */

    Promise.allSettled([
        videoPromise,
        musicPromise
    ]);


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

    }, 1000);

}


/* =========================================================
   VIEW INVITATION CLICK
========================================================= */

if (viewInvitationBtn) {

    viewInvitationBtn.addEventListener(
        "click",
        startInvitation,
        {
            once: true
        }
    );

}


/* =========================================================
   BACKGROUND MUSIC CONTROL
========================================================= */

if (musicBtn) {

    musicBtn.addEventListener(
        "click",
        async event => {

            /*
             * Prevent this click from accidentally
             * triggering other controls.
             */

            event.stopPropagation();


            if (!music) {
                return;
            }


            try {

                if (!isPlaying) {

                    await music.play();

                    isPlaying = true;

                } else {

                    music.pause();

                    isPlaying = false;

                }

                updateMusicButton();

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
     * Save current scroll position.
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

            <div class="guest-rsvp">

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

                <p class="rsvp-note">
                    We would be grateful if you could
                    confirm your attendance with:
                </p>

                <div class="rsvp-confirm">

                    <p class="rsvp-confirm-label">
                        Kindly confirm with
                    </p>

                    <div class="rsvp-buttons">

                        <!-- SHEAN -->

                        <a
                            href="https://m.me/shean.dalo.2025"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="rsvp-button">

                            <span class="rsvp-button-label">
                                Confirm to
                            </span>

                            <strong>
                                Shean
                            </strong>

                        </a>


                        <!-- LYNE -->

                        <a
                            href="https://m.me/laydslyne"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="rsvp-button">

                            <span class="rsvp-button-label">
                                Confirm to
                            </span>

                            <strong>
                                Lyne
                            </strong>

                        </a>

                    </div>

                </div>

            </div>

        </div>

    `;


    guestMessage.classList.add(
        "show"
    );


    /*
     * Prevent browser from jumping when the
     * message expands.
     */

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            window.scrollTo(
                0,
                currentScrollPosition
            );

        });

    });


    /*
     * Reveal RSVP after message is visible.
     */

    requestAnimationFrame(() => {

        setTimeout(() => {

            const rsvp =
                guestMessage.querySelector(
                    ".guest-rsvp"
                );

            if (rsvp) {

                rsvp.classList.add(
                    "show"
                );

            }

        }, 250);

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
   GUEST INPUT
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

                if (guestMessage) {

                    guestMessage.classList.remove(
                        "show"
                    );

                }

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
   OPTIMIZED BACKGROUND SCROLL EFFECT
========================================================= */

/*
 * OLD VERSION:
 *
 * animateBackground()
 *
 * was running requestAnimationFrame()
 * FOREVER, even when the user was not scrolling.
 *
 * This can waste CPU/GPU resources and contribute
 * to video stuttering.
 *
 * NEW VERSION:
 *
 * Only animate while scrolling or while a transition
 * is still settling.
 */

let currentScroll = 0;
let targetScroll = 0;

let scrollAnimationFrame = null;
let scrollStopTimer = null;


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


    startBackgroundAnimation();


    /*
     * Detect when user stops scrolling.
     */

    clearTimeout(
        scrollStopTimer
    );


    scrollStopTimer =
        setTimeout(() => {

            startBackgroundAnimation();

        }, 120);

}


function startBackgroundAnimation() {

    if (scrollAnimationFrame !== null) {
        return;
    }


    scrollAnimationFrame =
        requestAnimationFrame(
            animateBackground
        );

}


function animateBackground() {

    scrollAnimationFrame = null;


    const difference =
        targetScroll -
        currentScroll;


    /*
     * Smooth interpolation.
     */

    currentScroll +=
        difference *
        0.12;


    if (
        Math.abs(difference) <
        0.5
    ) {

        currentScroll =
            targetScroll;

    }


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


        /*
         * Smoothstep.
         */

        const smoothFade =
            videoProgress *
            videoProgress *
            (
                3 -
                2 *
                videoProgress
            );


        const opacity =
            1 -
            smoothFade;


        /*
         * Only update if the value actually changed.
         */

        const roundedOpacity =
            Math.round(
                opacity *
                1000
            ) / 1000;


        if (
            bgVideo.dataset.opacity !==
            String(roundedOpacity)
        ) {

            bgVideo.style.opacity =
                roundedOpacity;

            bgVideo.dataset.opacity =
                String(roundedOpacity);

        }

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
            ) *
            4;


        const moveY =
            Math.cos(
                scrollProgress *
                Math.PI *
                .95
            ) *
            3;


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
            ) *
            13;


        const positionY =
            45 +
            Math.cos(
                scrollProgress *
                Math.PI *
                .95
            ) *
            9;


        colorBackground.style.backgroundPosition =
            `${positionX}% ${positionY}%`;

    }


    /*
     * Continue only while there is meaningful movement.
     */

    if (
        Math.abs(
            targetScroll -
            currentScroll
        ) >
        0.5
    ) {

        startBackgroundAnimation();

    }

}


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


    /*
     * Much tighter cinematic timing.
     *
     * The old version waited 7 seconds before
     * starting automatic scroll.
     *
     * This keeps the animation but avoids making
     * the page feel frozen.
     */

    setTimeout(() => {

        reveal(eyebrow);
        reveal(line);

    }, 350);


    setTimeout(() => {

        reveal(intro);

    }, 500);


    setTimeout(() => {

        reveal(name);
        reveal(underline);

    }, 1200);


    setTimeout(() => {

        reveal(label);

    }, 2200);


    setTimeout(() => {

        reveal(title);

    }, 3400);


    setTimeout(() => {

        reveal(hosted);

    }, 4700);


    setTimeout(() => {

        reveal(scrollIndicator);


        if (scrollIndicator) {

            scrollIndicator.classList.add(
                "scroll-ready"
            );

        }

    }, 4700);


    /* =====================================================
       AUTOMATIC SMOOTH SCROLL
    ===================================================== */

    setTimeout(() => {

        /*
         * IMPORTANT:
         *
         * Only auto-scroll if the user has NOT touched
         * the page yet.
         */

        if (
            window.scrollY > 10 ||
            userHasInteractedWithScroll
        ) {

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
            1800
        );


        /* =================================================
           INPUT PULSE
        ================================================= */

        setTimeout(() => {

            if (
                userHasInteractedWithScroll
            ) {

                return;

            }


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

        }, 1900);

    }, 4800);

}


/* =========================================================
   USER SCROLL INTERACTION
========================================================= */

let userHasInteractedWithScroll = false;


function markUserScrollInteraction() {

    userHasInteractedWithScroll = true;

}


window.addEventListener(
    "wheel",
    markUserScrollInteraction,
    {
        passive: true,
        once: true
    }
);


window.addEventListener(
    "touchstart",
    markUserScrollInteraction,
    {
        passive: true,
        once: true
    }
);


window.addEventListener(
    "touchmove",
    markUserScrollInteraction,
    {
        passive: true,
        once: true
    }
);


window.addEventListener(
    "keydown",
    event => {

        const scrollingKeys = [
            "ArrowUp",
            "ArrowDown",
            "PageUp",
            "PageDown",
            "Home",
            "End",
            " "
        ];


        if (
            scrollingKeys.includes(
                event.key
            )
        ) {

            markUserScrollInteraction();

        }

    },
    {
        passive: true,
        once: true
    }
);


/* =========================================================
   ULTRA-SMOOTH SCROLL
========================================================= */

let smoothScrollFrame = null;


function smoothScrollTo(
    target,
    duration
) {

    /*
     * Cancel any previous automatic scroll.
     */

    if (
        smoothScrollFrame !== null
    ) {

        cancelAnimationFrame(
            smoothScrollFrame
        );

        smoothScrollFrame = null;

    }


    const start =
        window.scrollY;


    const distance =
        target -
        start;


    if (
        Math.abs(distance) <
        2
    ) {

        return;

    }


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

        /*
         * If user starts interacting,
         * immediately surrender control.
         */

        if (
            userHasInteractedWithScroll
        ) {

            smoothScrollFrame = null;

            return;

        }


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

            smoothScrollFrame =
                requestAnimationFrame(
                    animateScroll
                );

        } else {

            smoothScrollFrame =
                null;

        }

    }


    smoothScrollFrame =
        requestAnimationFrame(
            animateScroll
        );

}


/* =========================================================
   START
========================================================= */

loadGuests();

prepareVideo();